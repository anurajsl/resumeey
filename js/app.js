/* Resumey — App Bootstrap */

import { router } from './router.js';
import { store } from './state.js';
import { events, EVENTS } from './events.js';
import { openDB } from './db/database.js';
import { SettingsRepo, ResumeRepo } from './db/repositories.js';
import { PremiumService } from './services/premium-service.js';
import { applyTheme } from './utils/theme.js';

// Screens
import { renderWelcome } from './screens/onboarding/welcome.js';
import { renderAISetup } from './screens/onboarding/ai-setup.js';
import { renderCreateResume } from './screens/resume/create-resume.js';
import { renderMasterResume } from './screens/resume/master-resume.js';
import { renderSectionEditor } from './screens/resume/section-editor.js';
import { renderTailoredResume } from './screens/resume/tailored-resume.js';
import { renderJobList } from './screens/jobs/job-list.js';
import { renderAddJob } from './screens/jobs/add-job.js';
import { renderJobDetail } from './screens/jobs/job-detail.js';
import { renderMatchDashboard, renderMatchHome } from './screens/match/match-dashboard.js';
import { renderOptimizeView } from './screens/optimize/optimize-view.js';
import { renderATSAnalysis } from './screens/ats/ats-analysis.js';
import { renderCoverLetter } from './screens/cover-letter/cover-letter.js';
import { renderExportView } from './screens/export/export-view.js';
import { renderSettings } from './screens/settings/settings.js';
import { renderPremium } from './screens/premium/premium.js';
import { initCopilot } from './components/copilot.js';

async function init() {
  try {
    // Initialize DB
    await openDB();

    // Load premium and preferences
    await PremiumService.load();
    const prefs = await SettingsRepo.getPreferences();
    store.set('onboardingComplete', prefs.onboardingComplete);

    // Apply saved theme preference immediately
    applyTheme(prefs.theme || 'auto');

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('SW registration failed:', err);
      });
    }

    // Set up bottom nav
    setupBottomNav();

    // Register routes
    registerRoutes();

    // Navigation guard
    router.beforeEach(async (path) => {
      resetHeaderState();

      // If welcome or onboarding routes, allow through
      if (path === '/welcome' || path.startsWith('/onboarding')) return true;

      // If onboarding not complete, redirect to welcome
      const prefs = await SettingsRepo.getPreferences();
      if (!prefs.onboardingComplete && path !== '/welcome') {
        router.replace('/welcome');
        return false;
      }

      return true;
    });

    // Start router
    router.start();

    // Initialize Copilot (after router — needs route-change events)
    initCopilot();

    // Hide copilot on onboarding screens
    events.on(EVENTS.ROUTE_CHANGE, (route) => {
      const fab = document.getElementById('copilot-fab');
      if (!fab) return;
      const hide = route.path === '/welcome' || route.path.startsWith('/onboarding');
      fab.style.display = hide ? 'none' : '';
    });

    // Handle hash === '' (initial load)
    if (!window.location.hash || window.location.hash === '#') {
      const prefs = await SettingsRepo.getPreferences();
      if (prefs.onboardingComplete) {
        router.replace('/resume');
      } else {
        router.replace('/welcome');
      }
    }

    // PWA install prompt
    initInstallPrompt();

  } catch (err) {
    console.error('App init failed:', err);
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:16px;padding:24px;text-align:center;font-family:sans-serif">
        <h2>Oops — something went wrong</h2>
        <p style="color:#666">${err.message}</p>
        <button onclick="location.reload()" style="padding:10px 24px;background:#4A7C59;color:white;border:none;border-radius:8px;cursor:pointer">Reload</button>
      </div>
    `;
  }
}

function registerRoutes() {
  // Onboarding
  router.on('/welcome', () => renderWelcome());
  router.on('/onboarding/ai', () => renderAISetup());

  // Resume
  router.on('/resume/create', () => renderCreateResume());
  router.on('/resume/edit/:section', (params) => renderSectionEditor(params));
  router.on('/resume/tailored/:resumeId', (params) => renderTailoredResume(params));
  router.on('/resume/:resumeId/edit/:section', (params) => renderSectionEditor(params));
  router.on('/resume', () => renderMasterResume());

  // Jobs
  router.on('/jobs/add', () => renderAddJob());
  router.on('/jobs/:id', (params) => renderJobDetail(params));
  router.on('/jobs', () => renderJobList());

  // Match / optimize / ats / cover letter
  router.on('/match/:jobId', (params) => renderMatchDashboard(params));
  router.on('/match', () => renderMatchHome()); // match home shows job list with scores
  router.on('/optimize/:jobId', (params) => renderOptimizeView(params));
  router.on('/ats/:jobId', (params) => renderATSAnalysis(params));
  router.on('/cover-letter/:jobId', (params) => renderCoverLetter(params));

  // Export
  router.on('/export/:resumeId', (params) => renderExportView(params));
  router.on('/export', () => renderExportView());

  // Settings & premium
  router.on('/settings', () => renderSettings());
  router.on('/premium', () => renderPremium());

  // 404 — redirect to resume
  router.notFound((path) => {
    console.warn('Route not found:', path);
    router.replace('/resume');
  });
}

function isRouteActive(itemRoute, path) {
  return path === itemRoute ||
    (itemRoute === '/resume' && (path === '/resume' || path.startsWith('/resume/'))) ||
    (itemRoute === '/jobs' && (path === '/jobs' || path.startsWith('/jobs/'))) ||
    (itemRoute === '/match' && (path.startsWith('/match/') || path.startsWith('/optimize/') || path.startsWith('/ats/') || path.startsWith('/cover-letter/'))) ||
    (itemRoute === '/export' && path === '/export') ||
    (itemRoute === '/settings' && (path === '/settings' || path === '/premium'));
}

function setupBottomNav() {
  const nav = document.getElementById('bottom-nav');
  if (nav) {
    nav.addEventListener('click', (e) => {
      const item = e.target.closest('.nav-item');
      if (!item) return;
      const route = item.dataset.route;
      if (route) router.navigate(route);
    });
  }

  // Sidebar nav clicks
  const sidebar = document.getElementById('sidebar-nav');
  if (sidebar) {
    sidebar.addEventListener('click', (e) => {
      const item = e.target.closest('.sidebar-nav-item');
      if (!item) return;
      const route = item.dataset.route;
      if (route) router.navigate(route);
    });
  }

  // Update active state on route change
  events.on(EVENTS.ROUTE_CHANGE, (route) => {
    const path = route.path;

    // Bottom nav
    const bottomNav = document.getElementById('bottom-nav');
    if (bottomNav) {
      bottomNav.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', isRouteActive(item.dataset.route, path));
      });
    }

    // Sidebar nav
    const sidebarNav = document.getElementById('sidebar-nav');
    if (sidebarNav) {
      sidebarNav.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.classList.toggle('active', isRouteActive(item.dataset.route, path));
      });
    }

    // Animate screen container
    const screenContainer = document.getElementById('screen-container');
    if (screenContainer) {
      screenContainer.classList.remove('screen-enter');
      void screenContainer.offsetWidth; // reflow
      screenContainer.classList.add('screen-enter');
    }

    // Scroll to top
    const appMain = document.getElementById('app-main');
    if (appMain) appMain.scrollTop = 0;
  });
}

function resetHeaderState() {
  const headerTitle = document.getElementById('header-screen-title');
  const back = document.getElementById('header-back');
  const headerLogo = document.getElementById('header-logo');

  if (headerTitle) headerTitle.classList.remove('visible');
  if (back) back.style.display = 'none';
  if (headerLogo) headerLogo.style.display = 'flex';

  document.getElementById('header-actions').innerHTML = '';
}

function initInstallPrompt() {
  const DISMISSED_KEY = 'pwa-install-dismissed';
  if (localStorage.getItem(DISMISSED_KEY)) return;

  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show banner after a short delay so it doesn't interrupt first load
    setTimeout(() => {
      if (localStorage.getItem(DISMISSED_KEY)) return;
      showInstallBanner(() => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
          deferredPrompt = null;
          removeInstallBanner();
          localStorage.setItem(DISMISSED_KEY, '1');
        });
      });
    }, 3000);
  });

  // Hide banner once installed
  window.addEventListener('appinstalled', () => {
    removeInstallBanner();
    localStorage.setItem(DISMISSED_KEY, '1');
  });
}

function showInstallBanner(onInstall) {
  if (document.getElementById('pwa-install-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <div class="pwa-install-content">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      <div class="pwa-install-text">
        <strong>Install Resumey</strong>
        <span>Add to home screen for offline access</span>
      </div>
      <button class="btn btn-primary btn-sm" id="pwa-install-btn">Install</button>
      <button class="btn-icon pwa-install-dismiss" id="pwa-install-dismiss" aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById('pwa-install-btn').addEventListener('click', onInstall);
  document.getElementById('pwa-install-dismiss').addEventListener('click', () => {
    removeInstallBanner();
    localStorage.setItem('pwa-install-dismissed', '1');
  });
}

function removeInstallBanner() {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.classList.add('pwa-install-hide');
    setTimeout(() => banner.remove(), 300);
  }
}

// Start app when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
