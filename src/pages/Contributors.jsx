import React, { useState, useEffect } from "react";
import "../styles/Contributors.css";
import Navbar from "../components/Navbar";

const fallbackContributors = [
  {
    id: 1,
    login: "alice-wonder",
    avatar_url: "https://via.placeholder.com/150?text=Alice",
    contributions: 124,
    html_url: "https://github.com/alice-wonder",
  },
  {
    id: 2,
    login: "bob-builder",
    avatar_url: "https://via.placeholder.com/150?text=Bob",
    contributions: 98,
    html_url: "https://github.com/bob-builder",
  },
  {
    id: 3,
    login: "charlie-code",
    avatar_url: "https://via.placeholder.com/150?text=Charlie",
    contributions: 87,
    html_url: "https://github.com/charlie-code",
  },
  {
    id: 4,
    login: "diana-design",
    avatar_url: "https://via.placeholder.com/150?text=Diana",
    contributions: 65,
    html_url: "https://github.com/diana-design",
  },
  {
    id: 5,
    login: "edward-engineer",
    avatar_url: "https://via.placeholder.com/150?text=Edward",
    contributions: 42,
    html_url: "https://github.com/edward-engineer",
  },
];

const Contributors = () => {
  const [contributors, setContributors] = useState(fallbackContributors);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Contributors | AutoDoc.ai";
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchContributors = async () => {
      try {
        const cachedData = localStorage.getItem("github_contributors");
        const cachedTime = localStorage.getItem("github_contributors_time");
        const now = Date.now();

        if (
          cachedData &&
          cachedTime &&
          now - parseInt(cachedTime, 10) < 24 * 60 * 60 * 1000
        ) {
          try {
            const parsedData = JSON.parse(cachedData);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              setContributors(parsedData);
              return;
            }
          } catch (parseErr) {
            console.error(
              "Failed to parse cached contributors JSON:",
              parseErr,
            );
          }
        }

        const hasCache = !!cachedData;

        const response = await fetch(
          "https://api.github.com/repos/abhro05/AutoDoc.ai/contributors",
          { signal }
        );

        const text = await response.text();

        if (!response.ok) {
          let isRateLimit = response.status === 403;
          if (text) {
            try {
              const errData = JSON.parse(text);
              if (errData && errData.message && errData.message.toLowerCase().includes("rate limit")) {
                isRateLimit = true;
              }
            } catch (e) {
              // Ignore parse errors on error responses
            }
          }

          if (isRateLimit) {
            setError({
              type: "warning",
              message: hasCache
                ? "GitHub API rate limit exceeded. Displaying cached contributor data."
                : "GitHub API rate limit exceeded. Displaying fallback contributor data."
            });
          } else {
            setError({
              type: "error",
              message: hasCache
                ? `GitHub API request failed (Status ${response.status}). Displaying cached contributor data.`
                : `GitHub API request failed (Status ${response.status}). Displaying fallback contributor data.`
            });
          }
          throw new Error(`Request failed with status ${response.status}`);
        }

        let data = [];
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (e) {
            data = [];
          }
        }

        if (Array.isArray(data) && data.length > 0) {
          setContributors(data);
          try {
            localStorage.setItem("github_contributors", JSON.stringify(data));
            localStorage.setItem("github_contributors_time", now.toString());
          } catch (storageError) {
            console.warn(
              "Failed to save contributors to localStorage (quota exceeded or disabled):",
              storageError
            );
          }
          setError(null); // Clear errors on success
        }
      } catch (error) {
        if (error.name === "AbortError") {
          // Silent ignore for cancelled requests in StrictMode/unmounts
          return;
        }
        console.error(
          "Error fetching contributors, falling back to cache if available:",
          error,
        );
        const cachedData = localStorage.getItem("github_contributors");
        const hasCache = !!cachedData;

        setError(prevError => {
          if (prevError) return prevError;
          return {
            type: "error",
            message: hasCache
              ? "Network error: Failed to connect to GitHub API. Displaying cached contributor data."
              : "Network error: Failed to connect to GitHub API. Displaying fallback contributor data."
          };
        });

        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              setContributors(parsedData);
            }
          } catch (parseErr) {
            console.error(
              "Failed to parse cached contributors JSON in fallback:",
              parseErr,
            );
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchContributors();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className="contributors-page">
      <Navbar />

      <main>
        <header className="header">
          <h1>Meet Our Contributors</h1>
          <p className="subtitle">
            We thank the open-source community for their amazing work.
          </p>
        </header>

        {error && (
          <div className={`contributors-alert ${error.type}`} role="alert">
            <div className="contributors-alert-content">
              <span className="contributors-alert-icon">
                {error.type === "warning" ? (
                  <svg
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
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                ) : (
                  <svg
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
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                )}
              </span>
              <span>{error.message}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="contributors-alert-close"
              aria-label="Dismiss alert"
            >
              <svg
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
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}

        <section className="grid">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="card skeleton-card">
                <div className="avatar skeleton-avatar"></div>
                <div className="name skeleton-name"></div>
                <div className="github-btn skeleton-btn"></div>
              </div>
            ))
          ) : (
            contributors.map((contributor) => (
              <div key={contributor.id} className="card">
                <img
                  className="avatar"
                  src={contributor.avatar_url}
                  alt={contributor.login}
                  width="90"
                  height="90"
                  loading="lazy"
                  decoding="async"
                />
                <h2 className="name">{contributor.login}</h2>
                <a
                  href={contributor.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="github-btn"
                >
                  <svg
                    height="20"
                    width="20"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.86 2.33.66.07-.52.28-.86.51-1.06-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.13 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.03 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                    />
                  </svg>
                  View Profile
                </a>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default Contributors;
