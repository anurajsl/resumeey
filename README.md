# Resumey — AI-Powered Resume Builder

A production-grade, mobile-first **Progressive Web App** for building, optimizing, and exporting resumes with AI assistance. Runs entirely in the browser — no backend, no build step.

---

## Features

### Resume Builder
- Create and edit a master resume across structured sections (contact, summary, experience, education, skills, projects, certifications, awards)
- Import from PDF, DOCX, or LinkedIn text export
- Per-section editors with live preview

### Job Tracking
- Save job postings with title, company, URL, description, and keywords
- Auto-extracts keywords from job descriptions

### Match Score Engine
- Scores your resume against a job using a weighted algorithm:
  - Skills — 35% (exact, synonym, and fuzzy matching)
  - Experience — 30% (total months vs. required years)
  - Keywords — 25% (TF-IDF style with weights)
  - Education — 10% (degree level comparison)
- Shows matched/missing keywords, strengths, and weak areas

### ATS Analysis
- Formatting score, keyword density, readability, completeness
- Issues list with severity (high / medium / low)
- Actionable improvement tips

### AI Optimization
- BYOK (Bring Your Own Key) — works with **OpenAI**, **Anthropic**, or **OpenRouter**
- Before/after diff view of suggested resume changes
- Targeted rewrites per section

### Cover Letter Generator
- AI-generated cover letters tailored to the job
- In-app editor with copy/download

### Export
- Three templates: **Classic**, **Modern**, **Minimal**
- PDF export via html2pdf.js
- Print-ready CSS

### PWA
- Installable on iOS, Android, and desktop
- Full offline support via Service Worker (3-layer cache)
- No internet required after first load (except AI calls)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Routing | Hash-based SPA router (custom, ~80 LOC) |
| Storage | IndexedDB via idb (repositories pattern) |
| AI keys | AES-GCM 256-bit encryption at rest (Web Crypto API) |
| PDF parse | PDF.js (CDN, loaded on demand) |
| DOCX parse | Mammoth.js (CDN, loaded on demand) |
| PDF export | html2pdf.js (CDN, loaded on demand) |
| Fonts | Inter via Google Fonts |
| Build | None — native ES modules, no bundler |

---

## Project Structure

```
resumeey/
├── index.html                  # App shell (SPA)
├── manifest.json               # PWA manifest
├── sw.js                       # Service Worker
├── css/
│   ├── variables.css           # Design tokens & dark mode
│   ├── reset.css
│   ├── base.css
│   ├── layout.css
│   ├── components.css          # Buttons, cards, modals, toasts...
│   ├── screens.css             # Per-screen styles
│   ├── animations.css
│   ├── responsive.css
│   └── print.css
├── js/
│   ├── app.js                  # Bootstrap, routing, nav
│   ├── router.js               # Hash router
│   ├── state.js                # App state store
│   ├── events.js               # Event bus
│   ├── db/
│   │   ├── database.js         # IndexedDB setup
│   │   └── repositories.js     # ResumeRepo, JobRepo, SettingsRepo, AuditRepo
│   ├── services/
│   │   ├── match-engine.js     # Match score algorithm
│   │   ├── ats-analyzer.js     # ATS scoring
│   │   ├── ai-service.js       # AI provider dispatcher
│   │   ├── optimizer-service.js
│   │   ├── cover-letter-service.js
│   │   ├── export-service.js
│   │   ├── keyword-extractor.js
│   │   ├── parser-service.js
│   │   ├── pdf-parser.js
│   │   ├── docx-parser.js
│   │   ├── linkedin-parser.js
│   │   ├── premium-service.js
│   │   └── ai-providers/
│   │       ├── openai.js
│   │       ├── anthropic.js
│   │       └── openrouter.js
│   ├── screens/
│   │   ├── onboarding/         # Welcome, AI setup
│   │   ├── resume/             # Create, master view, section editor
│   │   ├── jobs/               # List, add, detail
│   │   ├── match/              # Match dashboard
│   │   ├── optimize/           # AI optimization + diff
│   │   ├── ats/                # ATS analysis
│   │   ├── cover-letter/
│   │   ├── export/             # Export + 3 templates
│   │   ├── settings/
│   │   └── premium/
│   ├── components/
│   │   ├── score-ring.js       # Animated SVG score ring
│   │   ├── toast.js
│   │   ├── modal.js
│   │   ├── loading-skeleton.js
│   │   ├── diff-viewer.js
│   │   ├── file-upload.js
│   │   └── empty-state.js
│   └── utils/
│       ├── constants.js        # Match weights, skill synonyms, degree levels
│       ├── crypto.js           # AES-GCM encrypt/decrypt
│       ├── formatters.js
│       ├── validators.js
│       ├── dom.js
│       ├── debounce.js
│       └── text-analysis.js
├── templates/
│   ├── resume-classic.html
│   ├── resume-modern.html
│   ├── resume-minimal.html
│   └── cover-letter.html
└── assets/
    ├── images/logo.svg
    └── icons/                  # PWA icons: 72–512px
```

---

## Getting Started

No build step needed. Serve the root directory with any static file server:

```bash
# Python
python3 -m http.server 8080

# Node (npx)
npx serve .

# VS Code
# Install "Live Server" extension and click "Go Live"
```

Then open `http://localhost:8080`.

### First Run
1. Complete onboarding — enter your AI provider API key (optional, can skip)
2. Create your master resume
3. Add a job posting
4. Run a match score

### AI Setup (optional)
Go to **Settings → AI Provider** and enter your key for one of:
- **OpenAI** — `gpt-4o` (default)
- **Anthropic** — `claude-3-5-sonnet`
- **OpenRouter** — any supported model

Keys are encrypted with AES-GCM before being stored in `localStorage`.

---

## Premium

Premium features (AI optimization, cover letter, ATS fix) are unlocked with a license key entered in **Settings → Premium**.

---

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Requires:
- ES Modules
- IndexedDB
- Web Crypto API
- Service Worker (for PWA install / offline)
