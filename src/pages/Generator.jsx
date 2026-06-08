import React, { useEffect, useState } from "react";
import "../styles/Generator.css";
import Navbar from "../components/Navbar";

const parseGitHubUrl = (url) => {
  const trimmed = url.trim();
  if (!trimmed) return { isValid: false, owner: '', repo: '' };

  const regex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-._]+)\/([a-zA-Z0-9-._]+)(?:\/.*)?$/;
  const match = trimmed.match(regex);

  if (match) {
    let owner = match[1];
    let repo = match[2];
    
    if (repo.endsWith('.git')) {
      repo = repo.slice(0, -4);
    }
    
    return { isValid: true, owner, repo };
  }

  return { isValid: false, owner: '', repo: '' };
};

const Generator = () => {
  useEffect(() => {
    document.title = "Workspace | AutoDoc.ai";
  }, []);

  const [repoUrl, setRepoUrl] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [markdownOutput, setMarkdownOutput] = useState('');
  const [activeTab, setActiveTab] = useState('code');
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [shouldShake, setShouldShake] = useState(false);

  const handleUrlChange = (e) => {
    setRepoUrl(e.target.value);
    if (error) {
      setError('');
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (activeTab !== 'preview') {
      return undefined;
    }

    const renderPreview = async () => {
      setIsPreviewLoading(true);
      const [{ marked }, DOMPurify] = await Promise.all([
        import("marked"),
        import("dompurify"),
        import("github-markdown-css/github-markdown-dark.css"),
      ]);

      if (!isMounted) return;

      const source = markdownOutput || '# Your documentation will appear here...';
      setPreviewHtml(DOMPurify.default.sanitize(marked.parse(source)));
      setIsPreviewLoading(false);
    };

    renderPreview();

    return () => {
      isMounted = false;
    };
  }, [activeTab, markdownOutput]);

  const handleGenerate = async () => {
    const trimmedUrl = repoUrl.trim();
    if (!trimmedUrl) {
      setError('Please enter a GitHub repository URL.');
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 400);
      return;
    }

    const parsed = parseGitHubUrl(trimmedUrl);
    if (!parsed.isValid) {
      setError('Invalid GitHub URL. Expected format: https://github.com/owner/repository');
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 400);
      return;
    }

    setError('');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-readme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoUrl: trimmedUrl,
          customInstructions,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Documentation generation failed.');
      }

      setMarkdownOutput(data.markdown);
    } catch (e) {
      setError(e.message);
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 400);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setRepoUrl("");
    setCustomInstructions("");
    setMarkdownOutput("");
  };

  const handleCopyCode = () => {
    if (!markdownOutput) return;
    navigator.clipboard.writeText(markdownOutput);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const extractRepoName = (url) => {
    if (!url) return "";
    try {
      let cleanUrl = url.trim();
      cleanUrl = cleanUrl.split("?")[0].split("#")[0];
      cleanUrl = cleanUrl.replace(/\/$/, "");

      if (cleanUrl.startsWith("git@") || cleanUrl.includes("@")) {
        const parts = cleanUrl.split(":");
        if (parts.length >= 2) {
          const path = parts[parts.length - 1];
          const pathParts = path.split("/").filter(Boolean);
          if (pathParts.length >= 2) {
            const treeIndex = pathParts.indexOf("tree");
            const blobIndex = pathParts.indexOf("blob");
            let repoIdx = pathParts.length - 1;
            if (treeIndex !== -1 && treeIndex > 0) {
              repoIdx = treeIndex - 1;
            } else if (blobIndex !== -1 && blobIndex > 0) {
              repoIdx = blobIndex - 1;
            }
            const repoName = pathParts[repoIdx];
            if (repoName) {
              return repoName.replace(/\.git$/, "");
            }
          } else if (pathParts.length === 1) {
            return pathParts[0].replace(/\.git$/, "");
          }
        }
      }

      let urlString = cleanUrl;
      if (!/^https?:\/\//i.test(cleanUrl) && !/^[a-z0-9]+:\/\//i.test(cleanUrl)) {
        urlString = `https://${cleanUrl}`;
      }
      
      const parsedUrl = new URL(urlString);
      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
      
      if (pathParts.length > 0) {
        const treeIndex = pathParts.indexOf("tree");
        const blobIndex = pathParts.indexOf("blob");
        let repoIdx = pathParts.length - 1;
        
        if (treeIndex !== -1 && treeIndex > 0) {
          repoIdx = treeIndex - 1;
        } else if (blobIndex !== -1 && blobIndex > 0) {
          repoIdx = blobIndex - 1;
        }
        
        const repoName = pathParts[repoIdx];
        if (repoName) {
          return repoName.replace(/\.git$/, "");
        }
      }
    } catch (e) {
      console.error("Error parsing repository URL name:", e);
    }
    return "";
  };

  const handleDownloadFile = () => {
    if (!markdownOutput) return;

    let fileName = 'README.md';
    if (repoUrl) {
      const repoName = extractRepoName(repoUrl);
      if (repoName) {
        fileName = `${repoName}-README.md`;
      }
    }

    const blob = new Blob([markdownOutput], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => {
      setDownloaded(false);
    }, 2000);
  };

  return (
    <div className="generator-container">
      <Navbar />

      <main className="workspace">
        <div className="control-panel">
          <h2 className="panel-title">Repository Configuration</h2>

          <div className="input-group">
            <label htmlFor="repo-url">GitHub Repository URL</label>
            <input
              id="repo-url"
              type="url"
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={handleUrlChange}
              className={`text-input ${error ? 'input-error' : ''} ${shouldShake ? 'shake' : ''}`}
            />
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠</span> {error}
              </div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="custom-instructions">
              Custom Instructions (Optional)
            </label>
            <textarea
              id="custom-instructions"
              placeholder="Add any specific requirements or focus areas for the documentation..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="text-textarea"
              rows={5}
              maxLength={500}
            />
            <div
              className={`char-counter ${
                customInstructions.length >= 450 ? "warning" : ""
              } ${customInstructions.length >= 500 ? "limit" : ""}`}
            >
              {customInstructions.length} / 500
            </div>
          </div>

          <div className="workspace-buttons">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn btn-primary generate-btn"
            >
              {isGenerating ? (
                <>
                  <span className="spinner"></span>
                  Generating...
                </>
              ) : (
                "Generate Documentation"
              )}
            </button>
            <button
              onClick={handleClear}
              disabled={isGenerating || (!repoUrl && !customInstructions && !markdownOutput)}
              className="btn btn-secondary clear-btn"
              aria-label="Clear workspace"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="output-panel">
          <div className="output-header">
            <div className="output-header-left">
              <h3>Generated Documentation</h3>
              <div className="tabs">
                <button
                  onClick={() => setActiveTab('code')}
                  className={`tab-button ${activeTab === 'code' ? 'active' : ''}`}
                >
                  Code
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
                >
                  Preview
                </button>
              </div>
            </div>
            <div className="output-header-actions">
              <div className={`tooltip-wrapper ${copied ? 'show-success' : ''}`}>
                <button
                  onClick={handleCopyCode}
                  disabled={!markdownOutput}
                  className="btn-copy-icon"
                  aria-label="Copy code"
                >
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <span className="tooltip-text">{copied ? 'Copied!' : 'Copy Code'}</span>
              </div>

              <div className={`tooltip-wrapper ${downloaded ? 'show-success' : ''}`}>
                <button
                  onClick={handleDownloadFile}
                  disabled={!markdownOutput}
                  className="btn-copy-icon"
                  aria-label="Download file"
                >
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </button>
                <span className="tooltip-text">{downloaded ? 'Downloaded!' : 'Download File'}</span>
              </div>
            </div>
          </div>
          {activeTab === 'code' ? (
            <pre className="output-content">
              <code>{markdownOutput || '# Your documentation will appear here...'}</code>
            </pre>
          ) : (
            <div
              className="output-content markdown-body"
              dangerouslySetInnerHTML={{
                __html: isPreviewLoading
                  ? '<p>Loading preview...</p>'
                  : previewHtml,
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Generator;
