# Resumey — Complete User Guide & Wiki

> **Resumey** is a mobile-first, privacy-first Progressive Web App (PWA) for managing your entire job search — from building a master resume to tracking applications, tailoring resumes for specific jobs, and preparing for interviews — all without a server, login, or cloud dependency.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Master Resume](#2-master-resume)
3. [Job Tracker](#3-job-tracker)
4. [Tailored Resumes](#4-tailored-resumes)
5. [Resume Optimizer](#5-resume-optimizer)
6. [ATS Analysis](#6-ats-analysis)
7. [Cover Letter Generator](#7-cover-letter-generator)
8. [PDF Export](#8-pdf-export)
9. [Interview Story Bank](#9-interview-story-bank)
10. [Settings & Appearance](#10-settings--appearance)
11. [Offline & AI Modes](#11-offline--ai-modes)
12. [Free vs. Premium](#12-free-vs-premium)
13. [Installing as a PWA](#13-installing-as-a-pwa)
14. [Complete User Journey](#14-complete-user-journey)
15. [Data Privacy & Storage](#15-data-privacy--storage)
16. [Technical Notes](#16-technical-notes)

---

## 1. Getting Started

### First Launch — Onboarding

When you open Resumey for the first time you land on the **Welcome Screen**. From here you can:

- **Start building your resume** — goes straight to the Master Resume editor
- **Configure AI (optional)** — add an API key to unlock AI-powered features

### AI Configuration (Optional)

Resumey supports three AI providers. None is required — every feature has an offline fallback.

| Provider | Where to get a key |
|---|---|
| OpenAI | platform.openai.com |
| Anthropic | console.anthropic.com |
| OpenRouter | openrouter.ai |

On the AI setup screen, choose your provider, paste your API key, and pick a model. The key is **encrypted and stored locally** in IndexedDB — it never leaves your device in plain text.

You can skip AI setup entirely and use Resumey in fully-offline mode forever.

---

## 2. Master Resume

The **Master Resume** is your single source of truth — the complete, unabridged version of your career history. All tailored resumes are forked from it.

### Sections

| Section | What goes here |
|---|---|
| Contact | Name, email, phone, location, LinkedIn, portfolio URL |
| Summary | 2–4 sentence professional headline |
| Experience | Jobs with title, company, dates, bullet points |
| Education | Degrees with school, field, dates, GPA (optional) |
| Skills | Comma-separated skills or grouped categories |
| Projects | Personal/OSS projects with title, URL, description |
| Certifications | Cert name, issuer, date |
| Awards | Award name, issuer, year, description |

### Editing

- Tap any section card to open its inline editor
- Changes are **auto-saved** — no save button needed
- Reorder experience / education entries with the up/down arrows
- Delete individual entries with the trash icon

### Section completeness

The master resume screen shows a completeness indicator per section. Sections with no content show a "Start adding" prompt.

---

## 3. Job Tracker

Track every job opportunity from first discovery through offer.

### Adding a Job

**Manual entry** — tap the `+` button on the Jobs screen and fill in title, company, location, and the job description.

**URL import (AI)** — paste a job posting URL; if AI is configured, Resumey extracts the title, company, and full description automatically.

### Status Flow

Jobs move through a five-stage pipeline:

```
Draft → Saved → Applied → Interview → Offer
                                   ↘ Rejected
```

- **Draft** — you're still researching or haven't decided to apply
- **Saved** — bookmarked, plan to apply
- **Applied** — application submitted
- **Interview** — interview scheduled or in progress
- **Offer / Rejected** — final outcome

Tap any status bubble on the job detail screen to advance the job. The tracker auto-stamps `appliedAt` the first time you set status to **Applied**.

### Job Detail

Each job has a full detail screen with:

#### Status Tracker
Visual five-step progress bar. Tap to change status.

#### Notes
Free-form text area. Auto-saved with a 600 ms debounce. A "Saved" flash confirms persistence.

#### Application Details (collapsible card)
| Field | Purpose |
|---|---|
| Application deadline | Date reminder |
| Salary range | Track comp expectations |
| Recruiter name | Contact tracking |
| Recruiter email | One-tap mailto link |
| Version sent | Which resume revision you submitted |

All fields auto-save individually.

#### Resume Version Sent
When you mark a job as **Applied**, Resumey auto-selects the most recent tailored resume for that job (or your master resume as fallback). A **"Sent: [resume name]"** badge appears in the job header. You can change it via the "Version sent" dropdown in Application Details.

#### Relevant Stories
At the bottom of the job detail, Resumey surfaces your **Interview Story Bank** entries that are most relevant to this job based on keyword overlap. Stories with the highest match scores appear first.

### Filtering & Sorting

On the job list screen:
- **Filter tabs** — All / Draft / Saved / Applied / Interview / Offer / Rejected; counts shown on each tab
- **Sort** — by date added (newest first), company name A–Z, or status

---

## 4. Tailored Resumes

For each job, you can create a **tailored version** of your master resume — modified to match that specific job's requirements — without touching your master.

### Creating a Tailored Resume

1. Open a job's detail screen
2. Tap **"Tailor Resume"**
3. Resumey forks your current master resume into a new version linked to that job

### Editing a Tailored Resume

The tailored resume editor works identically to the master resume editor. Changes only affect the tailored copy.

### Diff Viewer

Tap **"Compare to master"** to see a section-by-section diff:
- Green highlights = additions in the tailored version
- Red highlights = removed from master
- Unchanged sections are collapsed

### Reset to Master

If your tailored version diverges too far, tap **"Reset to master"** to overwrite it with the current master content.

### Version Tracking

Every time you save a tailored resume, Resumey increments the version number. This version number is what appears in the "Version sent" dropdown on the job detail.

---

## 5. Resume Optimizer

The Optimizer rewrites individual resume bullets to be stronger, more impact-driven, and keyword-rich.

### How It Works

Open a tailored resume, go to any Experience section, and tap **"Optimize"** next to a bullet. The optimizer:

1. Sends the bullet + job description to your AI provider (if configured)
2. Returns a rewritten version with stronger action verbs, quantified impact, and relevant keywords

A **before / after** side-by-side review UI lets you accept or reject each suggestion.

### Offline / No-AI Mode (Rule-Based)

If no AI key is configured (or you're offline), the optimizer falls back to **rule-based optimization**:

- Replaces weak verbs (e.g., "helped" → "accelerated", "did" → "executed")
- Removes passive voice constructions
- Injects keywords extracted from the job description
- Trims bullets that exceed recommended length

The rule-based fallback is clearly marked with an offline banner so you know which mode is active.

---

## 6. ATS Analysis

The **ATS (Applicant Tracking System) Analysis** screen scores your tailored resume against the job description across four dimensions — **entirely offline, no AI required**.

### Score Breakdown

| Subscore | What it checks |
|---|---|
| Formatting | Standard fonts, no tables/columns that break parsers, no headers/footers |
| Keywords | % of job description keywords present in your resume |
| Readability | Sentence length, bullet clarity, section heading standardisation |
| Completeness | Presence of all expected sections (contact, summary, experience, education, skills) |

Each subscore is 0–100. The overall ATS score is a weighted average.

### Keyword Gap Analysis

Below the scores, a **keyword gap table** lists:
- Keywords present in the job description but missing from your resume (red — add these)
- Keywords present in both (green — you're covered)

---

## 7. Cover Letter Generator

Generate a tailored cover letter for any job application.

### With AI

Resumey sends the job description + your resume summary to your AI provider. You can choose a tone:

- **Professional** — formal, direct
- **Conversational** — warm, personable
- **Enthusiastic** — energetic, forward-leaning

The generated letter is editable inline. Tap **Copy** or **Save to job** to store it.

### Offline / No-AI Mode (Template)

Without an AI key, Resumey generates a structured template cover letter using your name, the job title, company name, and up to three bullet points pulled from your experience. The offline banner clarifies that template generation is active.

---

## 8. PDF Export

Export any resume (master or tailored) as a print-ready PDF via three professional templates.

### Templates

#### Classic
Single-column layout. Section headings in deep green with a full-width underline rule. Skills displayed as tinted chip badges. Clean and universally ATS-friendly.

#### Modern *(Premium)*
Two-column layout: a dark green sidebar (68mm) contains your name, contact details, skills, and certifications in white text. The main column holds summary, experience, education, and projects. Bold and visually distinctive.

#### Minimal *(Premium)*
Typographic, whitespace-forward design. Ultra-light (300 weight) 26pt name. Section labels in 8pt small-caps gray. Hairline 0.5pt rules. Skills as a dot-separated inline list. Dates in light gray. Refined and elegant.

### Exporting

1. Open any resume
2. Tap **Export**
3. Choose template (Classic is always free; Modern and Minimal require Premium)
4. Pick tailored version or master from the dropdown
5. Tap **Download PDF**

A **live preview** renders in the browser before you download. Free-tier exports include a small watermark; Premium exports are watermark-free.

---

## 9. Interview Story Bank

The Story Bank is a personal library of **STAR stories** — structured anecdotes you can draw on in behavioral interviews.

### What is a STAR Story?

| Field | Question answered |
|---|---|
| **Situation** | What was the context? |
| **Task** | What were you responsible for? |
| **Action** | What specific steps did you take? |
| **Result** | What was the measurable outcome? |

### Adding a Story

1. Go to **Settings → Story Bank** or tap `+` on the Stories screen
2. Give the story a title (e.g., "Led cross-team migration to microservices")
3. Fill in S / T / A / R fields
4. Add comma-separated tags (e.g., `leadership, technical, problem-solving`)
5. Tap **Save**

### Filtering Stories

The Stories screen shows a scrollable tag filter bar at the top. Tap any tag to filter the list to stories with that tag. Tap again to clear.

### Job-Relevant Stories (Automatic)

On any **job detail screen**, Resumey automatically surfaces your most relevant stories in a **"Stories for this role"** panel. Relevance is calculated by keyword overlap between the job description and your story content + tags.

---

## 10. Settings & Appearance

### AI Configuration
- View current provider and model
- Tap to reconfigure (navigates back to AI setup)
- **Remove API Key** — clears the encrypted key from storage; AI features revert to offline mode

### Account / Premium
- Shows current tier (Free or Premium)
- Tap to enter premium activation key

### Appearance — Theme
Three-button toggle:
- **Auto** — follows the OS dark/light preference
- **Light** — forces light mode regardless of OS
- **Dark** — forces dark mode regardless of OS

Theme preference is persisted across sessions.

### Interview Prep
- Quick link to your Story Bank with a count of saved stories

### Data Management
- **Export Data** — downloads a JSON file containing all your resumes, jobs, and stories (`resumey-export.json`)
- **Clear All Data** — permanently deletes everything from IndexedDB; requires confirmation

---

## 11. Offline & AI Modes

Resumey is designed to work fully offline. Here's what changes with and without AI:

| Feature | With AI | Without AI |
|---|---|---|
| Resume bullets optimizer | AI rewrite | Rule-based (verb swap, passive removal, keyword injection) |
| Cover letter | Personalised, tone-selectable | Structured template using your data |
| ATS Analysis | Rule-based (always) | Rule-based (always) |
| Job URL import | AI extraction | Manual entry only |
| Match scoring | Rule-based (always) | Rule-based (always) |

**All core features work offline.** AI enhances quality but is never a hard dependency.

---

## 12. Free vs. Premium

| Capability | Free | Premium |
|---|---|---|
| Master resume | 1 | Unlimited |
| Jobs tracked | 3 | Unlimited |
| AI optimizations | 3 | Unlimited |
| Cover letters | 1 | Unlimited |
| Export — Classic template | Yes | Yes |
| Export — Modern template | No | Yes |
| Export — Minimal template | No | Yes |
| PDF watermark | Yes | No |
| Story Bank | Unlimited | Unlimited |

To activate Premium, go to **Settings → Premium Status** and enter the activation key.

---

## 13. Installing as a PWA

Resumey is a Progressive Web App — you can install it to your home screen for a native-app experience with offline support.

### On Mobile (Android / iOS)

- **Android (Chrome)** — an **"Add to Home Screen"** banner automatically appears after a few seconds. Tap **Install** to add it. Tap the X to dismiss; the banner won't show again on that device.
- **iOS (Safari)** — tap the Share button → **"Add to Home Screen"**

### On Desktop (Chrome / Edge)

Click the install icon in the address bar, or look for the Resumey install banner.

### After Installing

- Opens in a standalone window (no browser chrome)
- All data persists between sessions
- Works completely offline after first load

---

## 14. Complete User Journey

Here's the full end-to-end flow for a job search from scratch:

### Step 1 — Set Up (5 minutes)
1. Open Resumey
2. Optionally add an AI key (Settings → AI Provider)
3. Build your Master Resume — fill all 8 sections

### Step 2 — Add a Job
1. Tap `+` on the Jobs screen
2. Paste job URL (AI extracts details) or enter manually
3. Job lands in **Draft** status

### Step 3 — Assess the Fit
1. Tap **"Score"** on the job to see your match score
2. Review the ATS Analysis for keyword gaps
3. Note which keywords are missing from your resume

### Step 4 — Tailor Your Resume
1. Tap **"Tailor Resume"** on the job
2. Edit experience bullets to incorporate missing keywords
3. Use the Optimizer on weak bullets
4. Check the diff viewer to confirm changes vs. master

### Step 5 — Write the Cover Letter
1. Tap **"Cover Letter"** on the job
2. Choose a tone
3. Review, edit, and save

### Step 6 — Export & Apply
1. Tap **Export** on the tailored resume
2. Choose your template (Classic, Modern, or Minimal)
3. Download PDF
4. Submit your application

### Step 7 — Track Progress
1. On the job detail, change status to **Applied**
2. Set "Version sent" to confirm which resume you submitted
3. Fill Application Details (deadline, salary, recruiter)
4. Add notes after each interaction

### Step 8 — Interview Prep
1. Go to Stories → add STAR stories from your experience
2. Tag them by skill/theme
3. On the job detail, check **Relevant Stories** for that role
4. Practice your answers

### Step 9 — Outcome
1. Update status to **Offer** or **Rejected**
2. If rejected, notes help you learn for next time
3. Repeat from Step 2 for the next opportunity

---

## 15. Data Privacy & Storage

- **All data is local** — stored in your browser's IndexedDB (`resumey-db`). Nothing is sent to any server.
- **AI keys are encrypted** — your API key is encrypted before being written to IndexedDB. It is decrypted only in memory when making API calls.
- **AI calls** — when AI features are used, your resume bullets / job description are sent to the AI provider you configured. This is the only external network call.
- **No telemetry** — Resumey has no analytics, no error reporting, no third-party SDKs.
- **Export anytime** — Settings → Export Data gives you a full JSON dump of everything, so you're never locked in.
- **Clear anytime** — Settings → Clear All Data wipes everything from your browser.

### Browser / Device Scope

IndexedDB is scoped to the origin (URL + port). Data does not sync across browsers or devices. If you need your data on another device, use Export Data and manually import the JSON (import feature coming soon).

---

## 16. Technical Notes

These are for developers or power users who want to understand the internals.

### Architecture
- Vanilla ES modules — no bundler, no npm build step
- Hash-based SPA router (`#/route`)
- IndexedDB for all persistence (version 2)
- Service Worker for offline caching (PWA)
- Zero external runtime dependencies

### Running Locally
Serve the project root with any static file server:
```bash
npx serve .
# or
python3 -m http.server 8080
```
Open `http://localhost:8080`.

### Database Schema

**Store: `resumes`** — master and tailored resume documents
**Store: `jobs`** — job applications with full metadata
**Store: `settings`** — AI config, user preferences
**Store: `stories`** — STAR interview stories
**Store: `audit`** — change log (internal)

### Keyboard / Navigation
- Bottom navigation bar: Resume / Jobs / Settings
- Back button navigates to the previous screen in the router history
- All interactive elements are tap/click targets ≥ 44px for mobile accessibility

---

*Resumey v1.0.0 — Built with care · Privacy-first · Open*
