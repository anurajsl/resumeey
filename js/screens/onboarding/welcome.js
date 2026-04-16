/* Welcome Screen */

import { router } from '../../router.js';
import { SettingsRepo } from '../../db/repositories.js';

export function renderWelcome() {
  const container = document.getElementById('screen-container');

  container.innerHTML = `
    <div class="welcome-screen animate-fade-up">
      <div class="welcome-logo">
        <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
          <path d="M8 9h10M8 13h16M8 17h12M8 21h8" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="25" cy="23" r="6" fill="#C4A35A"/>
          <path d="M23 23l1.5 1.5 3-3" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <div>
        <h1 class="welcome-tagline">Your smart resume,<br>built in minutes</h1>
        <p class="welcome-description">
          AI-powered resume builder that tailors your experience to every job.
        </p>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;width:100%;max-width:320px">
        <div class="feature-row delay-1 animate-fade-up">
          <div class="feature-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div class="feature-text">
            <strong>Smart Matching</strong>
            Compare your resume to any job description
          </div>
        </div>
        <div class="feature-row delay-2 animate-fade-up">
          <div class="feature-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
          <div class="feature-text">
            <strong>Auto Optimization</strong>
            AI rewrites bullets to fit the job perfectly
          </div>
        </div>
        <div class="feature-row delay-3 animate-fade-up">
          <div class="feature-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div class="feature-text">
            <strong>Private & Local</strong>
            All data stays on your device
          </div>
        </div>
      </div>

      <div class="welcome-cta">
        <button class="btn btn-primary btn-lg btn-block" id="btn-create-resume">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Get Started
        </button>
        <button class="btn btn-outline btn-block" id="btn-unlock-premium">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Unlock Premium
        </button>
      </div>

      <p style="font-size:11px;color:var(--color-text-tertiary);margin-top:-8px">
        Free to use · Optional AI key · No account needed
      </p>
    </div>
  `;

  // Hide bottom nav on welcome
  const nav = document.getElementById('bottom-nav'); if (nav) nav.style.display = 'none';
  document.getElementById('header-logo').style.display = 'flex';

  document.getElementById('btn-create-resume').addEventListener('click', async () => {
    await SettingsRepo.setPreferences({ onboardingComplete: false });
    router.navigate('/onboarding/ai');
  });

  document.getElementById('btn-unlock-premium').addEventListener('click', () => {
    router.navigate('/premium');
  });
}
