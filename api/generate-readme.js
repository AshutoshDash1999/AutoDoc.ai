const parseGitHubUrl = (url) => {
  const trimmed = String(url || "").trim();
  const match = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-._]+)\/([a-zA-Z0-9-._]+)(?:\/.*)?$/);

  if (!match) {
    return null;
  }

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ""),
  };
};

const readJsonBody = async (req) => {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    return req.body ? JSON.parse(req.body) : {};
  }

  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;

    if (size > 16384) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }

    chunks.push(buffer);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
};

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
};

const readEnv = (env, key) => String(env[key] || "").trim();

const normalizeBaseUrl = (url) => url.replace(/\/+$/, "");

const formatList = (items) => {
  if (items.length <= 1) {
    return items[0] || "";
  }

  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
};

const createPublicError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.expose = true;
  return error;
};

const asNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const resolveProvider = (env) => {
  const provider = readEnv(env, "LLM_PROVIDER").toLowerCase();
  const config = {
    openai: {
      type: "openai",
      apiKey: readEnv(env, "OPENAI_API_KEY"),
      baseUrl: readEnv(env, "OPENAI_BASE_URL"),
      model: readEnv(env, "OPENAI_MODEL"),
    },
    nvidia: {
      type: "openai",
      apiKey: readEnv(env, "NVIDIA_API_KEY"),
      baseUrl: readEnv(env, "NVIDIA_BASE_URL"),
      model: readEnv(env, "NVIDIA_MODEL"),
    },
    anthropic: {
      type: "anthropic",
      apiKey: readEnv(env, "ANTHROPIC_API_KEY"),
      baseUrl: readEnv(env, "ANTHROPIC_BASE_URL"),
      model: readEnv(env, "ANTHROPIC_MODEL"),
      version: readEnv(env, "ANTHROPIC_VERSION"),
    },
    claude: {
      type: "anthropic",
      apiKey: readEnv(env, "ANTHROPIC_API_KEY"),
      baseUrl: readEnv(env, "ANTHROPIC_BASE_URL"),
      model: readEnv(env, "ANTHROPIC_MODEL"),
      version: readEnv(env, "ANTHROPIC_VERSION"),
    },
    gemini: {
      type: "gemini",
      apiKey: readEnv(env, "GEMINI_API_KEY"),
      baseUrl: readEnv(env, "GEMINI_BASE_URL"),
      model: readEnv(env, "GEMINI_MODEL"),
    },
    custom: {
      type: readEnv(env, "CUSTOM_PROVIDER_TYPE").toLowerCase() || "openai",
      apiKey: readEnv(env, "CUSTOM_API_KEY"),
      baseUrl: readEnv(env, "CUSTOM_BASE_URL"),
      model: readEnv(env, "CUSTOM_MODEL"),
      version: readEnv(env, "CUSTOM_ANTHROPIC_VERSION") || readEnv(env, "ANTHROPIC_VERSION"),
    },
  }[provider];

  if (!provider || !config) {
    throw createPublicError("Set LLM_PROVIDER to openai, nvidia, anthropic, claude, gemini, or custom.");
  }

  if (!config.apiKey || !config.baseUrl || !config.model) {
    const missing = [
      !config.apiKey ? "API key" : "",
      !config.baseUrl ? "base URL" : "",
      !config.model ? "model" : "",
    ].filter(Boolean);
    throw createPublicError(`Set the ${formatList(missing)} for the ${provider} provider.`);
  }

  if (config.type === "anthropic" && !config.version) {
    throw createPublicError("Set ANTHROPIC_VERSION or CUSTOM_ANTHROPIC_VERSION for Anthropic-compatible providers.");
  }

  if (!["openai", "anthropic", "gemini"].includes(config.type)) {
    throw createPublicError("Set CUSTOM_PROVIDER_TYPE to openai, anthropic, or gemini.");
  }

  return {
    ...config,
    baseUrl: normalizeBaseUrl(config.baseUrl),
  };
};

/* ───────────────────────────────────────────────────────────────
   Resilient GitHub Fetch with Retry & Exponential Backoff
   ─────────────────────────────────────────────────────────────── */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;
const BATCH_CONCURRENCY = 5;

const githubFetch = async (url, env, retryCount = 0) => {
  const token = readEnv(env, "GITHUB_TOKEN");
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // --- Rate limit & transient error handling ---
  if (response.status === 429 || response.status === 403 || (response.status >= 500 && response.status < 600)) {
    if (retryCount >= MAX_RETRIES) {
      const error = new Error(`GitHub API request failed after ${MAX_RETRIES} retries (HTTP ${response.status}).`);
      error.statusCode = 502;
      error.expose = true;
      throw error;
    }

    let delayMs;
    const retryAfter = response.headers.get("retry-after");
    const rateLimitReset = response.headers.get("x-ratelimit-reset");

    if (retryAfter) {
      delayMs = parseInt(retryAfter, 10) * 1000;
    } else if (rateLimitReset) {
      delayMs = Math.max(0, parseInt(rateLimitReset, 10) * 1000 - Date.now());
    } else {
      delayMs = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), MAX_DELAY_MS);
    }

    // Add jitter (±25%)
    delayMs = delayMs * (0.75 + Math.random() * 0.5);
    delayMs = Math.min(delayMs, MAX_DELAY_MS);

    console.log(`[AutoDoc] GitHub API rate limited/error (HTTP ${response.status}). Retrying in ${Math.round(delayMs)}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
    await sleep(delayMs);
    return githubFetch(url, env, retryCount + 1);
  }

  if (!response.ok) {
    const message = response.status === 404 ? "Repository not found or not accessible." : "GitHub repository inspection failed.";
    const error = new Error(message);
    error.statusCode = response.status === 404 ? 404 : 502;
    throw error;
  }

  return response.json();
};

const isTextFile = (path) => {
  const denied = /\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|tar|mp4|mov|avi|woff2?|ttf|eot|lock)$/i;
  return !denied.test(path);
};

const scorePath = (path) => {
  const lower = path.toLowerCase();
  let score = 0;

  if (lower === "readme.md") score += 100;
  if (lower === "package.json") score += 90;
  if (lower.includes("contributing")) score += 80;
  if (lower.includes("src/") || lower.includes("app/") || lower.includes("pages/")) score += 50;
  if (lower.includes("api/") || lower.includes("server/")) score += 45;
  if (lower.includes("vite") || lower.includes("next") || lower.includes("astro") || lower.includes("webpack")) score += 35;
  if (lower.endsWith(".md")) score += 30;
  if (lower.endsWith(".json")) score += 15;

  return score;
};

/* ───────────────────────────────────────────────────────────────
   Batched File Fetching with Concurrency Control
   ─────────────────────────────────────────────────────────────── */

const fetchBlobsBatched = async (candidates, owner, repo, env, maxBytesPerFile, maxContextBytes, onProgress) => {
  const files = [];
  let usedBytes = 0;
  let processed = 0;

  for (let i = 0; i < candidates.length; i += BATCH_CONCURRENCY) {
    if (usedBytes >= maxContextBytes) break;

    const batch = candidates.slice(i, i + BATCH_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((file) =>
        githubFetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${file.sha}`, env)
          .then((blob) => ({ file, blob }))
      )
    );

    for (const result of results) {
      if (usedBytes >= maxContextBytes) break;
      if (result.status !== "fulfilled") continue;

      const { file, blob } = result.value;
      const content = Buffer.from(blob.content || "", "base64").toString("utf8").slice(0, maxBytesPerFile);
      usedBytes += Buffer.byteLength(content, "utf8");

      if (content.trim()) {
        files.push({ path: file.path, content });
      }
    }

    processed += batch.length;
    if (onProgress) {
      onProgress(Math.min(processed, candidates.length), candidates.length);
    }
  }

  return files;
};

const collectRepositoryContext = async ({ owner, repo }, env, onProgress) => {
  if (onProgress) onProgress("fetching_tree", 0, 0, "Fetching repository metadata...");

  const repoInfo = await githubFetch(`https://api.github.com/repos/${owner}/${repo}`, env);
  const tree = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(repoInfo.default_branch)}?recursive=1`, env);
  const maxFiles = asNumber(env.REPO_FILE_LIMIT, 24);
  const maxBytesPerFile = asNumber(env.REPO_FILE_BYTES, 6000);
  const maxContextBytes = asNumber(env.REPO_CONTEXT_BYTES, 90000);
  const ignoredSegments = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".vite"]);
  const candidates = tree.tree
    .filter((item) => item.type === "blob" && item.path && isTextFile(item.path))
    .filter((item) => !item.path.split("/").some((segment) => ignoredSegments.has(segment)))
    .sort((a, b) => scorePath(b.path) - scorePath(a.path))
    .slice(0, maxFiles);

  if (onProgress) onProgress("fetching_files", 0, candidates.length, `Fetching ${candidates.length} files in batches...`);

  const files = await fetchBlobsBatched(
    candidates, owner, repo, env, maxBytesPerFile, maxContextBytes,
    (processed, total) => {
      if (onProgress) onProgress("fetching_files", processed, total, `Fetched ${processed}/${total} files...`);
    }
  );

  return {
    repository: {
      fullName: repoInfo.full_name,
      description: repoInfo.description,
      defaultBranch: repoInfo.default_branch,
      language: repoInfo.language,
      topics: repoInfo.topics || [],
      htmlUrl: repoInfo.html_url,
    },
    files,
  };
};

const createMessages = ({ repository, files }, customInstructions) => [
  {
    role: "system",
    content: "You are AutoDoc.ai. Generate a complete, accurate README.md for the repository context provided. Return only Markdown content for README.md. Do not wrap the answer in a code fence. Do not invent unsupported setup steps, credentials, endpoints, or features.",
  },
  {
    role: "user",
    content: JSON.stringify({
      task: "Generate README.md",
      customInstructions,
      repository,
      files,
    }),
  },
];

const callOpenAiCompatible = async (provider, messages, env, onChunk) => {
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: Number(env.LLM_TEMPERATURE || 0.2),
      max_tokens: asNumber(env.LLM_MAX_TOKENS, 4096),
      stream: !!onChunk,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || "LLM provider request failed.");
  }

  if (!onChunk) {
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (trimmed.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          const text = parsed.choices?.[0]?.delta?.content || "";
          if (text) {
            fullText += text;
            onChunk(fullText);
          }
        } catch (e) {}
      }
    }
  }
  return fullText;
};

const callAnthropic = async (provider, messages, env, onChunk) => {
  const [systemMessage, ...userMessages] = messages;
  const response = await fetch(`${provider.baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": provider.apiKey,
      "anthropic-version": provider.version,
    },
    body: JSON.stringify({
      model: provider.model,
      system: systemMessage.content,
      messages: userMessages,
      temperature: Number(env.LLM_TEMPERATURE || 0.2),
      max_tokens: asNumber(env.LLM_MAX_TOKENS, 4096),
      stream: !!onChunk,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || "LLM provider request failed.");
  }

  if (!onChunk) {
    const data = await response.json();
    return data.content?.map((part) => part.text || "").join("") || "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("event:")) continue;
      if (trimmed.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            fullText += parsed.delta.text;
            onChunk(fullText);
          }
        } catch (e) {}
      }
    }
  }
  return fullText;
};

const callGemini = async (provider, messages, env, onChunk) => {
  const endpoint = onChunk ? "streamGenerateContent?alt=sse" : "generateContent";
  const response = await fetch(`${provider.baseUrl}/models/${encodeURIComponent(provider.model)}:${endpoint}&key=${encodeURIComponent(provider.apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: messages[0].content }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: messages[1].content }],
        },
      ],
      generationConfig: {
        temperature: Number(env.LLM_TEMPERATURE || 0.2),
        maxOutputTokens: asNumber(env.LLM_MAX_TOKENS, 4096),
      },
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || "LLM provider request failed.");
  }

  if (!onChunk) {
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          const text = parsed.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
          if (text) {
            fullText += text;
            onChunk(fullText);
          }
        } catch (e) {}
      }
    }
  }
  return fullText;
};

const generateMarkdown = async (provider, messages, env, onChunk) => {
  if (provider.type === "anthropic") {
    return callAnthropic(provider, messages, env, onChunk);
  }

  if (provider.type === "gemini") {
    return callGemini(provider, messages, env, onChunk);
  }

  return callOpenAiCompatible(provider, messages, env, onChunk);
};

/* ───────────────────────────────────────────────────────────────
   In-Memory Job Queue
   ─────────────────────────────────────────────────────────────── */

const jobs = new Map();
const JOB_TTL_MS = 10 * 60 * 1000; // 10 minutes
let jobCounter = 0;

const generateJobId = () => {
  jobCounter += 1;
  return `job_${Date.now()}_${jobCounter}`;
};

const cleanupOldJobs = () => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS) {
      jobs.delete(id);
    }
  }
};

const createJob = () => {
  cleanupOldJobs();
  const id = generateJobId();
  const job = {
    id,
    status: "queued",
    phase: "queued",
    progress: { filesProcessed: 0, totalFiles: 0 },
    message: "Job queued...",
    markdown: null,
    error: null,
    createdAt: Date.now(),
    listeners: new Set(),
  };
  jobs.set(id, job);
  return job;
};

const updateJob = (job, updates) => {
  Object.assign(job, updates);
  const event = JSON.stringify({
    status: job.status,
    phase: job.phase,
    progress: job.progress,
    message: job.message,
    markdown: job.markdown,
    error: job.error,
  });
  for (const listener of job.listeners) {
    try {
      listener(event);
    } catch (_) {
      /* listener gone */
    }
  }
};

const processJob = async (job, parsedRepo, customInstructions, env) => {
  try {
    updateJob(job, { status: "processing", phase: "starting", message: "Resolving LLM provider..." });

    const provider = resolveProvider(env);

    const repositoryContext = await collectRepositoryContext(parsedRepo, env, (phase, processed, total, message) => {
      updateJob(job, {
        phase,
        progress: { filesProcessed: processed, totalFiles: total },
        message,
      });
    });

    updateJob(job, { phase: "generating", message: "Generating documentation with AI..." });

    const messages = createMessages(repositoryContext, customInstructions);
    const markdown = await generateMarkdown(provider, messages, env, (currentMarkdown) => {
      updateJob(job, { message: "Streaming content...", markdown: currentMarkdown });
    });

    if (!markdown || !markdown.trim()) {
      throw new Error("The LLM provider returned an empty README.");
    }

    updateJob(job, {
      status: "completed",
      phase: "completed",
      message: "Documentation generated successfully!",
      markdown: markdown.trim(),
    });
  } catch (error) {
    updateJob(job, {
      status: "failed",
      phase: "failed",
      message: error.expose ? error.message : "Documentation generation failed. Check server configuration and provider logs.",
      error: error.expose ? error.message : "Documentation generation failed.",
    });
  }
};

/* ───────────────────────────────────────────────────────────────
   HTTP Handlers
   ─────────────────────────────────────────────────────────────── */

export const generateReadmeHandler = async (req, res, env = process.env) => {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const body = await readJsonBody(req);
    const parsedRepo = parseGitHubUrl(body.repoUrl);

    if (!parsedRepo) {
      return sendJson(res, 400, { error: "Invalid GitHub repository URL." });
    }

    const customInstructions = String(body.customInstructions || "").slice(0, 1000);

    // If client requests async processing
    if (body.async) {
      const job = createJob();
      // Fire-and-forget processing
      processJob(job, parsedRepo, customInstructions, { ...env });
      return sendJson(res, 202, { jobId: job.id, status: "queued", message: "Job queued for processing." });
    }

    // Synchronous fallback (backward compatible)
    const provider = resolveProvider(env);
    const repositoryContext = await collectRepositoryContext(parsedRepo, env);
    const messages = createMessages(repositoryContext, customInstructions);
    const markdown = await generateMarkdown(provider, messages, env);

    if (!markdown || !markdown.trim()) {
      throw new Error("The LLM provider returned an empty README.");
    }

    return sendJson(res, 200, { markdown: markdown.trim() });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      error: error.expose ? error.message : "Documentation generation failed. Check server configuration and provider logs.",
    });
  }
};

export const jobStatusHandler = (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const jobId = url.searchParams.get("id");

  if (!jobId) {
    return sendJson(res, 400, { error: "Missing job ID." });
  }

  const job = jobs.get(jobId);
  if (!job) {
    return sendJson(res, 404, { error: "Job not found." });
  }

  // SSE stream
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Send current state immediately
  const sendEvent = (data) => {
    res.write(`data: ${data}\n\n`);
  };

  sendEvent(JSON.stringify({
    status: job.status,
    phase: job.phase,
    progress: job.progress,
    message: job.message,
    markdown: job.markdown,
    error: job.error,
  }));

  // If already done, close
  if (job.status === "completed" || job.status === "failed") {
    res.end();
    return;
  }

  // Subscribe for updates
  const listener = (eventData) => {
    sendEvent(eventData);
    const parsed = JSON.parse(eventData);
    if (parsed.status === "completed" || parsed.status === "failed") {
      job.listeners.delete(listener);
      res.end();
    }
  };

  job.listeners.add(listener);

  req.on("close", () => {
    job.listeners.delete(listener);
  });
};

export const __testing = {
  parseGitHubUrl,
  readJsonBody,
  resolveProvider,
  githubFetch,
  isTextFile,
  scorePath,
  fetchBlobsBatched,
  collectRepositoryContext,
  createMessages,
  generateMarkdown,
  createJob,
  processJob,
  jobs,
  generateJobId
};

export default generateReadmeHandler;
