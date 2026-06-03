## 🌟 CONTRIBUTING TO AUTODOC.AI

### 🚀 Quick Start (First-Time Contributors)

Welcome! We are thrilled to have you help us eliminate documentation debt. Follow these steps to get your local environment running:

1.  **Fork** the repository to your GitHub account.
2.  **Clone** your fork to your local machine.
3.  Open the project folder in your preferred code editor (e.g., VS Code).
4.  Open your terminal and run `npm install` to grab all dependencies for the React frontend and Node backend.
5.  _(If applicable)_ Ensure your local `.env` file is set up with your Gemini API keys and MongoDB URI.
6.  Start the development server by running `npm run dev`.
7.  Open your browser and navigate to `http://localhost:3000`.
8.  **Claim an Issue:** Find an existing issue or create a new one. Wait for a maintainer to officially assign it to you, then create a branch (e.g., `feature/generator-ui-update`), and start coding!
9.  **Push & PR:** Push your branch and open a Pull Request with screenshots.

> **Tip**
> Estimated setup time: 5-10 minutes. Grab some coffee ☕ and let's get started!

### 🧱 Project Architecture

AutoDoc.ai is a full-stack application utilizing the MERN stack alongside Python and Gemini AI.

- **Frontend (`/src`):** Built with React and Vite. Contains all user-facing components, routing via React Router, and CSS/glassmorphism styling.
- **Backend / API:** Powered by Node.js and Express. Handles API routes, communicates with MongoDB, and integrates Python scripts to communicate securely with the Gemini AI API for documentation generation.

### 🖥️ Local Development Rules

Because AutoDoc.ai relies on backend processes to analyze repositories and ping the Gemini API, **certain features require both the frontend and backend servers to be running.**

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
Make sure your commits are atomic and descriptive. We follow conventional commits to keep the project history clean.

```bash
git add .
git commit -m "feat: add real-time preview to generator"
# or
git commit -m "docs: resolve configuration port inconsistencies"
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
