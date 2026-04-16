# TRACE Session Context
_Auto-generated at 2026-04-16 04:42:33_

## Anchors (12 total)

### db_schema
- **File:** js/db/repositories.js
- **Description:** Resume and Job data models — canonical structure for all stored data
- **Consumers (12):** js/screens/resume/master-resume.js, js/screens/resume/section-editor.js, js/screens/resume/create-resume.js, js/screens/jobs/job-list.js, js/screens/jobs/job-detail.js, +7 more

### ai_service
- **File:** js/services/ai-service.js
- **Description:** Multi-provider AI abstraction — all AI calls go through this
- **Consumers (5):** js/screens/jobs/add-job.js, js/screens/optimize/optimize-view.js, js/screens/cover-letter/cover-letter.js, js/services/optimizer-service.js, js/components/copilot.js

### router
- **File:** js/router.js
- **Description:** Hash-based SPA router — all route definitions live in app.js
- **Consumers (5):** js/app.js, js/screens/resume/master-resume.js, js/screens/jobs/job-list.js, js/screens/jobs/job-detail.js, js/components/copilot.js

### events
- **File:** js/events.js
- **Description:** App-wide event bus and EVENTS constant map
- **Consumers (3):** js/app.js, js/components/copilot.js, js/screens/onboarding/ai-setup.js

### match_engine
- **File:** js/services/match-engine.js
- **Description:** 4-factor match scoring algorithm (skills/experience/keywords/education)
- **Consumers (3):** js/screens/match/match-dashboard.js, js/screens/optimize/optimize-view.js, js/components/copilot.js

### ats_analyzer
- **File:** js/services/ats-analyzer.js
- **Description:** ATS scoring and issue detection (formatting/keywords/readability/completeness)
- **Consumers (3):** js/screens/ats/ats-analysis.js, js/screens/optimize/optimize-view.js, js/components/copilot.js

### constants
- **File:** js/utils/constants.js
- **Description:** Shared application constants
- **Consumers (3):** js/db/database.js, js/screens/onboarding/ai-setup.js, js/screens/settings/settings.js

### premium_service
- **File:** js/services/premium-service.js
- **Description:** Premium tier gating — used by all screens that have paid features
- **Consumers (4):** js/screens/resume/create-resume.js, js/screens/jobs/add-job.js, js/screens/export/export-view.js, js/app.js

### toast
- **File:** js/components/toast.js
- **Description:** Toast notification component — used across all screens for feedback

### formatters
- **File:** js/utils/formatters.js
- **Description:** Shared utility formatters (timeAgo, scoreColorClass, shortId, etc.)

### score_ring
- **File:** js/components/score-ring.js
- **Description:** Score ring/badge component for match scores
- **Consumers (4):** js/screens/jobs/job-list.js, js/screens/jobs/job-detail.js, js/screens/match/match-dashboard.js, js/screens/optimize/optimize-view.js

### export_service
- **File:** js/services/export-service.js
- **Description:** PDF export service and resume HTML builder
- **Consumers (1):** js/screens/export/export-view.js

## Rules

- Run `trace impact <anchor_id>` before modifying any anchor
- Save checkpoints at meaningful milestones: `trace checkpoint`
- Update PLAN.yaml when new items are discovered
- Run `trace gate end` when session is complete

## Recent Handoff (last 3)

## Anchor Health
<!-- Which anchors are stale, which were recently updated -->

## Next Steps (Priority Order)
1. 
2. 
3.

## Don't Touch
<!-- Files or systems that should NOT be modified right now and why -->
