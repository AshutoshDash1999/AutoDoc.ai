<div align="center">
  <img src="./autodoc.png" alt="AutoDoc.ai Logo" height="400">

  ### ✨ Crafting Professional Documentation with AI Precision

  <p>An open-source developer tool that automatically generates high-quality READMEs, CONTRIBUTING guides, and API documentation.</p>

  <div align="center">
    <img src="https://img.shields.io/github/contributors/abhro05/AutoDoc.ai" alt="Contributors">
    <img src="https://img.shields.io/github/forks/abhro05/AutoDoc.ai" alt="Forks">
    <img src="https://img.shields.io/github/stars/abhro05/AutoDoc.ai?style=social" alt="GitHub Stars">
    <img src="https://img.shields.io/github/issues/abhro05/AutoDoc.ai" alt="Issues">
    <img src="https://img.shields.io/github/issues-pr/abhro05/AutoDoc.ai" alt="Pull Requests">
  </div>
</div>

---

# 📖 $\color{#0969da}{\text{About AutoDoc.ai}}$
**AutoDoc.ai** addresses the challenge of outdated documentation due to time constraints. It analyzes repository structures and source code to generate structured content while keeping humans in control via manual editing and previews.

### 🌟 $\color{#2ea44f}{\text{Key Features}}$
- **Repo Analysis**: Deep scanning of repository structure and configuration files.
- **Automatic Generation**: Instant creation of README.md and CONTRIBUTING.md files.
- **API Support**: Dedicated documentation generation for API endpoints.
- **Live Preview**: React-based markdown preview with manual editing capabilities.
- **Export Ready**: One-click export for production-ready documentation files.

---

# ⚙️ $\color{#8250df}{\text{Setup Instructions}}$

> [!IMPORTANT]
> Ensure you have your Gemini API and GitHub tokens ready before starting the services.

### 1. Installation Steps
```diff
+ git clone [https://github.com/abhro05/AutoDoc.ai.git](https://github.com/abhro05/AutoDoc.ai.git)
+ cd AutoDoc.ai

# Frontend Setup
+ cd frontend && npm install

# Backend Setup
+ cd ../backend && npm install

# AI Service Setup
+ cd ../ai_service && pip install -r requirements.txt
```
# 🔄 $\color{#0969da}{\text{System Architecture}}$
The system utilizes a modular three-layer architecture to manage the documentation workflow
- Frontend: React web interface for URL input and previews
- Backend: Node.js/Express server orchestrating GitHub API interactions
- AI Service: Python microservice integrating with Gemini API to summarize code
- Data Flow: User → React UI → Node.js Backend → Python AI Service → Node.js Backend → React UI
``` mermaid
graph LR
    A[React UI] -- Repo URL --> B[Node.js Backend]
    B -- Parse Files --> C[Python AI Service]
    C -- Summarization --> D[Gemini API]
    D -- Doc Content --> C
    C -- Markdown --> B
    B -- Preview --> A
    
    style A fill:#0A192F,stroke:#333
    style B fill:#064E3B,stroke:#333
    style C fill:#0A192F,stroke:#333
    style D fill:#064E3B,stroke:#333
```
## 🛠️ $\color{#38BDF8}{\text{Tech Stack}}$

AutoDoc.ai is built with a modular, scalable architecture across three specialized layers.

### 🌐 $\color{#34D399}{\text{Frontend Layer}}$
**React**: A React-based web interface for repository input and real-time previews.
**Languages**: Built using HTML, CSS, and JavaScript for a responsive experience.
**Markdown Preview**: Supports real-time preview and manual editing of generated content.

### ⚙️ $\color{#38BDF8}{\text{Backend Layer}}$
**Node.js & Express**: A robust server that orchestrates all GitHub API interactions.
**GitHub REST API**: Deeply integrates with GitHub to parse repository files and structures.

### 🤖 $\color{#34D399}{\text{AI Service Layer}}$
**Python Microservice**: A dedicated microservice for intent detection and code summarization.
**Gemini API**: Leverages advanced AI to generate structured, high-quality documentation text.



### 🎨 $\color{#38BDF8}{\text{Technology Badges}}$

<div align="center">

| Category | Badges |
| :--- | :--- |
| **Frontend Foundation** | ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black) |
| **Core** | ![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white) ![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white) |
| **Integrations** | ![Gemini](https://img.shields.io/badge/Gemini_API-4285F4?logo=google&logoColor=white) ![GitHub](https://img.shields.io/badge/GitHub_API-181717?logo=github&logoColor=white) |

</div>

<div align="center">
  <img height="180em" src="https://github-profile-summary-cards.vercel.app/api/cards/repos-per-language?username=abhro05&theme=transparent" alt="Language Distribution Card" />
</div>

---

#  $\color{#0969da}{\text{🗺️Roadmap}}$
```mermaid
graph TD
    Root[AutoDoc.ai Roadmap]
    
    Root --> P1[Phase 1: MVP]
    P1 --> P1_1[Core README Generator]
    P1 --> P1_2[Manual Export Functionality]
    
    Root --> P2[Phase 2: Enhancement]
    P2 --> P2_1[Documentation Quality Scoring]
    P2 --> P2_2[Code Comment Summarization]
    
    Root --> P3[Phase 3: Automation]
    P3 --> P3_1[GitHub App Integration]
    P3 --> P3_2[PR Documentation Suggestions]
    
    Root --> P4[Phase 4: Community Growth]
    P4 --> P4_1[Plugin System]
    P4 --> P4_2[Community Prompt Templates]

    style Root fill:#38BDF8,stroke:#333,color:#000
    style P1 fill:#34D399,stroke:#333
    style P2 fill:#34D399,stroke:#333
    style P3 fill:#34D399,stroke:#333
    style P4 fill:#34D399,stroke:#333
```
## 📅 $\color{#38BDF8}{\text{Implementation Milestones}}$

### 🏗️ $\color{#34D399}{\text{Milestone 1: Project Setup}}$
- [ ] Repository initialization.
- [ ] Basic React frontend setup.
- [ ] Node.js backend scaffolding.

### 🔍 $\color{#34D399}{\text{Milestone 2: Repository Analysis}}$
- [ ] GitHub API integration.
- [ ] File structure parsing.

### 🤖 $\color{#34D399}{\text{Milestone 3: AI Integration}}$
- [ ] Python microservice setup.
- [ ] Gemini API prompt design.

### ✍️ $\color{#34D399}{\text{Milestone 4: Documentation Generation}}$
- [ ] README and CONTRIBUTING generation.
- [ ] Markdown preview and editing interface.

### 🚀 $\color{#34D399}{\text{Milestone 5: Quality and Expansion}}$
- [ ] API documentation support.
- [ ] Architecture summaries.


### 🌐 $\color{#34D399}{\text{Milestone 6: Open Source Readiness}}$
- [ ] Comprehensive tests and linting.
- [ ] Project documentation and examples.

---
# 🌟 $\color{#38BDF8}{\text{Participation and Contributing}}$

AutoDoc.ai is built to promote best practices in documentation and modular system design while attracting contributors of all skill levels. The project is designed to be a high-impact, scalable tool for the open-source community.

### $\color{#34D399}{\text{Open Source Programs}}$

| Program | Name | Timeline |
| :--- | :--- | :--- |
| **Resourcio Community** | Aperture 3.0 | Jan 1 – March 1, 2026 |

### $\color{#34D399}{\text{How to Get Involved}}$

We are currently in the **Open Source Readiness** phase, focusing on comprehensive testing and clear examples. You can contribute by:

1. **Forking** the repository and creating a feature branch.
2. **Improving AI Prompts**: Help refine the Gemini API prompt designs for better documentation accuracy.
3. **Enhancing Features**: Contribute to the development of documentation quality scoring or code comment summarization.
4. **Building the Community**: Help us reach **Phase 4** by designing plugin systems or community prompt templates.

> [!TIP]
> Read our full **[CONTRIBUTING.md](./CONTRIBUTING.md)** for detailed environment setup and pull request guidelines.


---

# 📄 $\color{#38BDF8}{\text{License and Maintainer}}$

### $\color{#34D399}{\text{License}}$
This project is licensed under the **MIT License**. This ensures the tool remains open and accessible for academic projects, hackathons, and long-term community development.

### $\color{#34D399}{\text{Maintainer}}$
<div align="center">
  <p>
    <strong>❄️Abhro</strong><br>
    <em>Full-Stack Developer | Data Science Specialization</em>
  </p>
  <p>
    <a href="https://github.com/abhro05">
      <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
    </a>
    <a href="https://www.linkedin.com/in/mayurpagote">
      <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
    </a>
  </p>
  <p><sub>"Because great code deserves great documentation."</sub></p>
</div>

---
