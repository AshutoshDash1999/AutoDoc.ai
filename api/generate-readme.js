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

const githubFetch = async (url, env) => {
  const token = readEnv(env, "GITHUB_TOKEN");
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

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

const collectRepositoryContext = async ({ owner, repo }, env) => {
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

  const files = [];
  let usedBytes = 0;

  for (const file of candidates) {
    if (usedBytes >= maxContextBytes) {
      break;
    }

    const blob = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${file.sha}`, env);
    const content = Buffer.from(blob.content || "", "base64").toString("utf8").slice(0, maxBytesPerFile);
    usedBytes += Buffer.byteLength(content, "utf8");

    if (content.trim()) {
      files.push({
        path: file.path,
        content,
      });
    }
  }

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

const callOpenAiCompatible = async (provider, messages, env) => {
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
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "LLM provider request failed.");
  }

  return data.choices?.[0]?.message?.content;
};

const callAnthropic = async (provider, messages, env) => {
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
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "LLM provider request failed.");
  }

  return data.content?.map((part) => part.text || "").join("");
};

const callGemini = async (provider, messages, env) => {
  const response = await fetch(`${provider.baseUrl}/models/${encodeURIComponent(provider.model)}:generateContent?key=${encodeURIComponent(provider.apiKey)}`, {
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "LLM provider request failed.");
  }

  return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
};

const generateMarkdown = async (provider, messages, env) => {
  if (provider.type === "anthropic") {
    return callAnthropic(provider, messages, env);
  }

  if (provider.type === "gemini") {
    return callGemini(provider, messages, env);
  }

  return callOpenAiCompatible(provider, messages, env);
};

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

export default generateReadmeHandler;
