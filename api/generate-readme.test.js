import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { __testing, generateReadmeHandler, jobStatusHandler } from './generate-readme.js';

const { githubFetch, createJob, jobs, fetchBlobsBatched } = __testing;

describe('generate-readme.js backend tests', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    jobs.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('githubFetch should retry on 429 and eventually succeed', async () => {
    let callCount = 0;
    vi.mocked(fetch).mockImplementation(async () => {
      callCount++;
      if (callCount < 3) {
        return {
          status: 429,
          headers: new Headers({ 'retry-after': '0' })
        };
      }
      return {
        status: 200,
        ok: true,
        json: async () => ({ success: true })
      };
    });

    const env = {};
    const res = await githubFetch('https://api.github.com/some/url', env);
    expect(res).toEqual({ success: true });
    expect(callCount).toBe(3);
  });

  it('githubFetch should fail after max retries', async () => {
    vi.mocked(fetch).mockImplementation(async () => {
      return {
        status: 429,
        headers: new Headers({ 'retry-after': '0' })
      };
    });

    const env = {};
    await expect(githubFetch('https://api.github.com/some/url', env)).rejects.toThrow('GitHub API request failed after 5 retries (HTTP 429).');
    expect(fetch).toHaveBeenCalledTimes(6); // 1 initial + 5 retries
  });

  it('fetchBlobsBatched should fetch in batches concurrently', async () => {
    vi.mocked(fetch).mockImplementation(async () => {
      return {
        status: 200,
        ok: true,
        json: async () => ({ content: Buffer.from('hello').toString('base64') })
      };
    });

    const candidates = Array(12).fill(0).map((_, i) => ({ sha: `sha${i}`, path: `file${i}.txt` }));
    let progressCalls = 0;
    const onProgress = (processed, total) => {
      progressCalls++;
    };

    const files = await fetchBlobsBatched(candidates, 'owner', 'repo', {}, 6000, 90000, onProgress);
    
    expect(files.length).toBe(12);
    expect(files[0].content).toBe('hello');
    expect(progressCalls).toBe(3); // 12 files / 5 batch size = 3 batches (5, 10, 12)
  });

  it('createJob should initialize a job correctly', () => {
    const job = createJob();
    expect(job.status).toBe('queued');
    expect(job.id).toMatch(/^job_\d+_\d+$/);
    expect(jobs.get(job.id)).toBe(job);
  });

  it('jobStatusHandler should return 404 for unknown job', () => {
    const req = { url: '/api/job-status?id=unknown', headers: { host: 'localhost' } };
    let resData = '';
    const res = {
      statusCode: 200,
      setHeader: vi.fn(),
      end: vi.fn((data) => { resData = data; })
    };
    
    jobStatusHandler(req, res);
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(resData)).toEqual({ error: 'Job not found.' });
  });

  it('generateReadmeHandler creates an async job and returns 202', async () => {
    const req = {
      method: 'POST',
      body: { repoUrl: 'https://github.com/owner/repo', async: true }
    };
    let resData = '';
    const res = {
      statusCode: 200,
      setHeader: vi.fn(),
      end: vi.fn((data) => { resData = data; })
    };

    const env = {
      LLM_PROVIDER: 'openai',
      OPENAI_API_KEY: 'test',
      OPENAI_BASE_URL: 'https://api.openai.com/v1',
      OPENAI_MODEL: 'gpt-4'
    };

    vi.mocked(fetch).mockImplementation(async (url) => {
      if (url.includes('api.github.com/repos')) {
        return { status: 200, ok: true, json: async () => ({ default_branch: 'main', tree: [] }) };
      }
      if (url.includes('api.openai.com')) {
        return { status: 200, ok: true, json: async () => ({ choices: [{ message: { content: '# readme' } }] }) };
      }
      return { status: 200, ok: true, json: async () => ({}) };
    });

    await generateReadmeHandler(req, res, env);

    expect(res.statusCode).toBe(202);
    const parsed = JSON.parse(resData);
    expect(parsed.jobId).toBeDefined();
    expect(parsed.status).toBe('queued');
  });
});