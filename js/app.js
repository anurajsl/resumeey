/* Resumey — App Bootstrap */

import { router } from './router.js';
import { store } from './state.js';
import { events, EVENTS } from './events.js';
import { openDB } from './db/database.js';
import { SettingsRepo, ResumeRepo } from './db/repositories.js';
import { PremiumService } from './services/premium-service.js';

// Screens
import { renderWelcome } from './screens/onboarding/welcome.js';
import { renderAISetup } from './screens/onboarding/ai-setup.js';
import { renderCreateResume } from './screens/resume/create-resume.js';
import { renderMasterResume } from './screens/resume/master-resume.js';
import { renderSectionEditor } from './screens/resume/section-editor.js';
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

async function init() {
  try {
    // Initialize DB
    await openDB();

    // Load premium and preferences
    await PremiumService.load();
    const prefs = await SettingsRepo.getPreferences();
    store.set('onboardingComplete', prefs.onboardingComplete);

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

    // Handle hash === '' (initial load)
    if (!window.location.hash || window.location.hash === '#') {
      const prefs = await SettingsRepo.getPreferences();
      if (prefs.onboardingComplete) {
        router.replace('/resume');
      } else {
        router.replace('/welcome');
      }
    }

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

function setupBottomNav() {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;

  nav.addEventListener('click', (e) => {
    const item = e.target.closest('.nav-item');
    if (!item) return;
    const route = item.dataset.route;
    if (route) router.navigate(route);
  });

  // Update active state on route change
  events.on(EVENTS.ROUTE_CHANGE, (route) => {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;

    nav.querySelectorAll('.nav-item').forEach(item => {
      const itemRoute = item.dataset.route;
      const path = route.path;
      const isActive = path === itemRoute ||
        (itemRoute === '/resume' && (path === '/resume' || path.startsWith('/resume/'))) ||
        (itemRoute === '/jobs' && (path === '/jobs' || path.startsWith('/jobs/'))) ||
        (itemRoute === '/match' && (path.startsWith('/match/') || path.startsWith('/optimize/') || path.startsWith('/ats/') || path.startsWith('/cover-letter/'))) ||
        (itemRoute === '/export' && path === '/export') ||
        (itemRoute === '/settings' && (path === '/settings' || path === '/premium'));

      item.classList.toggle('active', isActive);
    });

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

// Start app when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
