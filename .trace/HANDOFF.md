# HANDOFF — Resumability Document
# Updated at end of every session. Read at start of every session.
# Purpose: Any contributor (human or AI) can cold-start from this.

## Current State (as of 2026-04-16)

**Last session**: 2026-04-16
**Branch**: `claude/build-resumey-pwa-Y8V1d`
**DB version**: 2 (stories store added in this session)

## What's Working

All core features are stable and committed:

- **Onboarding** — welcome screen, AI key setup (OpenAI / Anthropic / OpenRouter)
- **Master Resume** — all 8 section editors: contact, summary, experience, education, skills, projects, certifications, awards
- **Tailored Resume** — fork master per job, section diff viewer, per-section edit, export, reset to master
- **Job Tracker** — add jobs manually or via URL import; status flow draft→saved→applied→interview→offer/rejected; filter + sort on list
- **Job Detail** — status tracker, notes auto-save, application details (deadline/salary/recruiter), resume version tracking (submittedResumeId), relevant stories panel
- **Match Scoring** — rule-based keyword + skill + experience + education scoring; cached on job record
- **Resume Optimizer** — AI bullet rewrite OR rule-based fallback (weak verb replacement, passive voice, keyword injection); before/after review UI
- **ATS Analysis** — fully rule-based (no AI required); formatting, keyword, readability, completeness subscores
- **Cover Letter** — AI generation with tone selector OR template fallback; copy/save
- **PDF Export** — 3 templates (Classic, Modern, Minimal) with distinct real layouts; tailored version picker; live preview; watermark on free tier
- **Dark Mode** — CSS custom properties, [data-theme] manual override, persisted in SettingsRepo
- **PWA Install** — beforeinstallprompt banner, dismissible, localStorage
- **Story Bank** — STAR story editor (Situation/Task/Action/Result), tag-based filtering, job-detail integration with keyword overlap matching
- **Settings** — AI config, premium status, theme toggle (Auto/Light/Dark), story bank entry, data export (JSON), clear all

## What's In Progress

Nothing — all planned items complete.

## What's Blocked

Nothing.

## Critical Context

- **No bundler** — vanilla ES modules, hash-based SPA router, IndexedDB. No npm build step. Serve from root with a static file server.
- **DB schema** — IndexedDB `resumey-db` version 2. Stores: `resumes`, `jobs`, `settings`, `audit`, `stories`. Always use `if (!db.objectStoreNames.contains(...))` guard in `onupgradeneeded`. Bump `DB_VERSION` in `js/utils/constants.js` when adding stores.
- **Git push** — `origin` proxy returns 403. Always push via PAT: `git push https://anurajsl:<PAT>@github.com/anurajsl/resumeey.git <branch>`. After pushing, sync local tracking ref: `git fetch <same-url> <branch>:refs/remotes/origin/<branch>`. PAT stored in session only — do not commit.
- **AI providers** — API key stored encrypted in IndexedDB settings. `aiService.isAvailable()` → false when no key. All AI features have offline fallbacks (rule-based optimizer, template cover letter, rule-based ATS).
- **Premium gate** — `PremiumService.isActive()` checks master key `aldims119`. Free tier limits: 1 resume, 3 jobs, 3 AI optimizations, 1 cover letter. Modern/Minimal export templates are premium-locked.
- **Status normalisation** — legacy jobs may have `status: 'active'` (pre-draft era). `normaliseStatus()` in both `job-detail.js` and `job-list.js` maps `'active'` → `'saved'` transparently.
- **TRACE gate** — always run `trace-coherence gate start` before coding, `trace-coherence gate end` before committing. Current score: 98/100.

## Anchor Health

All 12 anchors healthy. One known stale consumer entry:
- `score_ring → js/screens/optimize/optimize-view.js` — scoreBadge no longer imported there; remove from trace.yaml consumers list on next housekeeping pass.

## Next Steps (Priority Order)

1. **Copilot end-to-end smoke test** — verify `applyChange()` in `js/components/copilot.js:581` writes through to IndexedDB correctly with a real AI key
2. **section-editor.js split** — 615 lines exceeds TRACE threshold (500); consider extracting `renderExperienceEditor`, `renderEducationEditor`, `renderSkillsEditor` into separate files
3. **Draft status on add-job** — confirm `add-job.js` correctly inherits `status: 'draft'` default from `JobRepo.create()`; no explicit status set in that screen
4. **Tailored resume count on master screen** — master resume screen could show "N tailored versions" badge with link to the first one

## Don't Touch

- `js/services/ai-service.js` — handles encryption/decryption of API keys and provider routing; do not refactor without testing all three providers end-to-end
- `js/db/database.js` `onupgradeneeded` — fragile; always guard with `objectStoreNames.contains()` check
- `css/variables.css` dark mode block — `@media` uses `:root:not([data-theme="light"])` so manual light override works on dark-system devices; do not simplify this
