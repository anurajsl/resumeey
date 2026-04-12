/* Resumey Service Worker */
const CACHE_SHELL = 'resumey-shell-v1';
const CACHE_ASSETS = 'resumey-assets-v1';
const CACHE_LIBS = 'resumey-libs-v1';

const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/variables.css',
  '/css/reset.css',
  '/css/base.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/screens.css',
  '/css/animations.css',
  '/css/responsive.css',
  '/js/app.js',
  '/js/router.js',
  '/js/state.js',
  '/js/events.js',
  '/js/db/database.js',
  '/js/db/repositories.js',
  '/js/services/ai-service.js',
  '/js/services/ai-providers/openai.js',
  '/js/services/ai-providers/anthropic.js',
  '/js/services/ai-providers/openrouter.js',
  '/js/services/parser-service.js',
  '/js/services/pdf-parser.js',
  '/js/services/docx-parser.js',
  '/js/services/linkedin-parser.js',
  '/js/services/match-engine.js',
  '/js/services/keyword-extractor.js',
  '/js/services/optimizer-service.js',
  '/js/services/ats-analyzer.js',
  '/js/services/cover-letter-service.js',
  '/js/services/export-service.js',
  '/js/services/premium-service.js',
  '/js/components/component.js',
  '/js/components/card.js',
  '/js/components/modal.js',
  '/js/components/toast.js',
  '/js/components/progress-bar.js',
  '/js/components/score-ring.js',
  '/js/components/diff-viewer.js',
  '/js/components/tag.js',
  '/js/components/file-upload.js',
  '/js/components/loading-skeleton.js',
  '/js/components/empty-state.js',
  '/js/screens/onboarding/welcome.js',
  '/js/screens/onboarding/ai-setup.js',
  '/js/screens/resume/create-resume.js',
  '/js/screens/resume/master-resume.js',
  '/js/screens/resume/section-editor.js',
  '/js/screens/jobs/job-list.js',
  '/js/screens/jobs/job-detail.js',
  '/js/screens/jobs/add-job.js',
  '/js/screens/match/match-dashboard.js',
  '/js/screens/match/match-detail.js',
  '/js/screens/optimize/optimize-view.js',
  '/js/screens/optimize/before-after.js',
  '/js/screens/ats/ats-analysis.js',
  '/js/screens/cover-letter/cover-letter.js',
  '/js/screens/export/export-view.js',
  '/js/screens/settings/settings.js',
  '/js/screens/premium/premium.js',
  '/js/utils/dom.js',
  '/js/utils/constants.js',
  '/js/utils/validators.js',
  '/js/utils/formatters.js',
  '/js/utils/crypto.js',
  '/js/utils/debounce.js',
  '/js/utils/text-analysis.js',
];

const ASSET_FILES = [
  '/assets/images/logo.svg',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
];

// AI provider domains — always network-only
const AI_DOMAINS = [
  'api.openai.com',
  'api.anthropic.com',
  'openrouter.ai',
];

// CDN libraries — cache after first fetch
const CDN_PATTERNS = [
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'unpkg.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shellCache = await caches.open(CACHE_SHELL);
      // Cache shell files, ignoring failures for individual files
      await Promise.allSettled(
        SHELL_FILES.map(url => shellCache.add(url).catch(() => {}))
      );
      const assetCache = await caches.open(CACHE_ASSETS);
      await Promise.allSettled(
        ASSET_FILES.map(url => assetCache.add(url).catch(() => {}))
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(key => ![CACHE_SHELL, CACHE_ASSETS, CACHE_LIBS].includes(key))
          .map(key => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-only for AI APIs
  if (AI_DOMAINS.some(d => url.hostname.includes(d))) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for CDN resources
  if (CDN_PATTERNS.some(p => url.hostname.includes(p))) {
    event.respondWith(
      caches.open(CACHE_LIBS).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      }).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // Cache-first for app shell and assets (GET only)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;

      try {
        const response = await fetch(event.request);
        if (response.ok && url.origin === self.location.origin) {
          const cache = await caches.open(CACHE_SHELL);
          cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        // Offline fallback to index.html for navigation
        if (event.request.mode === 'navigate') {
          const cached = await caches.match('/index.html');
          return cached || new Response('Offline', { status: 503 });
        }
        return new Response('', { status: 503 });
      }
    })()
  );
});
