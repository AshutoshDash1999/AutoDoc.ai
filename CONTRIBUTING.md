## 🌟 CONTRIBUTING TO AUTODOC.AI

### 🚀 Quick Start (First-Time Contributors)

Welcome! We are thrilled to have you help us eliminate documentation debt. Follow these steps to get your local environment running:

1.  **Fork** the repository to your GitHub account.
2.  **Clone** your fork to your local machine.
3.  Open the project folder in your preferred code editor (e.g., VS Code).
4.  Open your terminal and run `npm install` to grab all dependencies for the React frontend and Node backend. This also sets up the git hooks automatically via the `prepare` script.
5.  _(If applicable)_ Ensure your local `.env` file is configured with a supported LLM provider (OpenAI, Gemini, Anthropic, NVIDIA, or compatible providers) and the required API credentials.
6.  Start the development server by running `npm run dev`.
7.  Open your browser and navigate to `http://localhost:3000`.
8.  **Claim an Issue:** Find an existing issue or create a new one. Wait for a maintainer to officially assign it to you, then create a branch (e.g., `feature/generator-ui-update`), and start coding!
9.  **Push & PR:** Push your branch and open a Pull Request with screenshots.

> **Tip**
> Estimated setup time: 5-10 minutes. Grab some coffee ☕ and let's get started!

### 🧱 Project Architecture

AutoDoc.ai is a full-stack application built with React + Vite, Node.js + Express, Supabase authentication, and a configurable multi-provider AI integration layer.

- **Frontend (`/src`):** Built with React and Vite. Contains all user-facing components, routing via React Router, and CSS/glassmorphism styling.
- **Backend / API:** Powered by Node.js and Express. Handles API routes, authentication, repository analysis, and documentation generation through a configurable multi-provider AI system.

### 🖥️ Local Development Rules

Because AutoDoc.ai relies on backend services to analyze repositories and communicate with configured AI providers, **certain features require both the frontend and backend servers to be running.**

### 🚦 WORKFLOW

**1️⃣ Fork & Clone**

```bash
git clone [https://github.com/abhro05/AutoDoc.ai.git](https://github.com/abhro05/AutoDoc.ai.git)
cd AutoDoc.ai
```

**2️⃣ Create a Branch**
Always create a new branch for your work. Use a descriptive naming convention:

```bash
git checkout -b feature/your-feature-name
# Examples:
# bugfix/fix-header-alignment
# docs/update-readme-port
```

**3️⃣ Commit Your Changes**
Make sure your commits are atomic and descriptive. We enforce [Conventional Commits](https://www.conventionalcommits.org/) via a `commit-msg` git hook — invalid messages are rejected automatically.

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

**Allowed types:** `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `build` · `ci` · `chore` · `revert`

#### ✅ Good commits

```bash
feat: add real-time preview to generator
fix(auth): resolve session expiry race condition
docs: resolve configuration port inconsistencies
refactor(api): extract validation logic into middleware
perf(db): cache user preferences to reduce query load
test: add unit tests for document generation flow
chore: update .gitignore to exclude .env files
```

With a body and footer when needed:
```
fix(auth): prevent logout on token refresh

The session refresh was racing with the expiry check,
causing intermittent logouts for active users.

Fixes #87
```

Breaking change:
```
feat(api)!: change response format to camelCase

BREAKING CHANGE: All API responses now use camelCase keys.
Update your client-side parsers accordingly.
```

#### ❌ Bad commits

```bash
# Too vague
git commit -m "fix: fixed it"
git commit -m "update: updates"
git commit -m "misc changes"

# Wrong tense (use imperative mood — "add" not "added")
git commit -m "feat: added new feature"
git commit -m "fix: fixes the bug"

# Missing type prefix entirely
git commit -m "add login page"
git commit -m "WIP"

# Description too long (keep under 72 chars)
git commit -m "feat: add a brand new feature that lets users export their data in CSV, JSON, and XML formats with custom delimiters"

# Wrong type casing
git commit -m "Feat: add dark mode"
git commit -m "FEAT: add dark mode"
```

**4️⃣ Keep Your Fork Synced**
Before pushing, ensure your branch is up to date with the main project to avoid merge conflicts:

```bash
git remote add upstream https://github.com/abhro05/AutoDoc.ai.git
git fetch upstream
git rebase upstream/main
```

**5️⃣ Push to GitHub**
Push your newly created branch to your forked repository:

```bash
git push -u origin your-branch-name
```

**6️⃣ Open a Pull Request**
Navigate to the original AutoDoc.ai repository and click "Compare & pull request".

- Fill out the provided PR template completely.
- Link the specific issue you are solving (e.g., `Fixes #13`).
- If participating in Social Summer of Code (SSoC), ensure your PR notes this so the maintainer can properly add the `SSoC26` label!

### 💅 Coding Standards

- **Formatting:** We use Prettier and ESLint. Please ensure there are no linting errors before committing.
- **UI/UX:** Keep the interface professional, clean, and minimalist. If implementing scroll-based storytelling or adding animations (e.g., GSAP, Framer Motion, Three.js), ensure they enhance rather than distract from the core documentation experience.
- **Type Safety:** For any TypeScript implementations, ensure strict typing and avoid `any` whenever possible.
