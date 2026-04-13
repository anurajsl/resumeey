/* Premium Screen */

import { router } from '../../router.js';
import { PremiumService } from '../../services/premium-service.js';
import { toast } from '../../components/toast.js';
import { store } from '../../state.js';

const FEATURES = [
  'Unlimited resumes',
  'Unlimited job targets',
  'Unlimited AI optimizations',
  'Unlimited cover letter generation',
  'Advanced ATS analysis',
  'Premium templates (Modern, Minimal)',
  'Clean PDF export — no watermark',
  'Priority support',
];

export async function renderPremium() {
  const container = document.getElementById('screen-container');
  document.getElementById('bottom-nav')?.style && (document.getElementById('bottom-nav').style.display = '';

  const isPremium = await PremiumService.isActive();

  if (isPremium) {
    renderActivated(container);
    return;
  }

  container.innerHTML = `
    <div class="premium-screen animate-fade-up">
      <div class="premium-hero">
        <div class="premium-hero-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <h2 style="font-size:26px;font-weight:800;letter-spacing:-0.03em;color:var(--color-text)">Resumey Premium</h2>
        <p style="font-size:15px;color:var(--color-text-secondary);margin-top:8px;line-height:1.6">Unlock the full power of AI resume optimization with no limits.</p>
      </div>

      <!-- Feature list -->
      <div class="premium-feature-list">
        ${FEATURES.map(f => `
          <div class="premium-feature-row">
            <div class="premium-feature-check">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span class="premium-feature-text">${f}</span>
          </div>
        `).join('')}
      </div>

      <!-- License key entry -->
      <div style="background:var(--color-gold-bg);border:1px solid rgba(196,163,90,0.25);border-radius:16px;padding:20px;margin-bottom:24px">
        <h3 style="font-size:15px;font-weight:700;margin-bottom:4px">Have a license key?</h3>
        <p style="font-size:13px;color:var(--color-text-secondary);margin-bottom:16px">Enter your key to activate premium instantly.</p>
        <div class="license-input-group">
          <input
            type="text"
            id="license-key-input"
            class="form-input license-input"
            placeholder="Enter license key"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />
          <button class="btn btn-gold" id="btn-activate">
            Activate
          </button>
        </div>
        <p class="form-error hidden" id="key-error"></p>
      </div>

      <!-- Free tier comparison -->
      <div style="margin-bottom:24px">
        <h3 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-secondary);margin-bottom:12px">Free vs Premium</h3>
        <div class="card">
          <div class="card-body" style="padding:0">
            ${renderComparisonRow('Resumes', '1', 'Unlimited')}
            ${renderComparisonRow('Job targets', '3', 'Unlimited')}
            ${renderComparisonRow('AI optimizations', '3/month', 'Unlimited')}
            ${renderComparisonRow('Cover letters', '1/month', 'Unlimited')}
            ${renderComparisonRow('Templates', 'Classic only', 'All 3')}
            ${renderComparisonRow('PDF export', 'With watermark', 'Clean')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Activate
  document.getElementById('btn-activate').addEventListener('click', async () => {
    const key = document.getElementById('license-key-input').value.trim();
    const errorEl = document.getElementById('key-error');

    if (!key) {
      errorEl.textContent = 'Please enter your license key';
      errorEl.classList.remove('hidden');
      return;
    }

    const btn = document.getElementById('btn-activate');
    btn.classList.add('btn-loading');
    btn.textContent = '';

    try {
      await PremiumService.activate(key);
      toast.success('Premium activated! Welcome to Resumey Premium.');
      renderActivated(container);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    } finally {
      btn.classList.remove('btn-loading');
      btn.textContent = 'Activate';
    }
  });

  // Enter key on input
  document.getElementById('license-key-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-activate').click();
  });
}

function renderActivated(container) {
  container.innerHTML = `
    <div class="premium-screen animate-scale-in">
      <div style="text-align:center;padding:48px 24px">
        <div style="width:80px;height:80px;background:linear-gradient(135deg,var(--color-gold-bg),#FFF9EE);border:2px solid rgba(196,163,90,0.3);border-radius:24px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="var(--color-gold)" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <h2 style="font-size:24px;font-weight:800;letter-spacing:-0.02em">Premium Active</h2>
        <p style="color:var(--color-text-secondary);margin-top:8px;line-height:1.6">You have access to all premium features. Enjoy Resumey Premium!</p>
        <button class="btn btn-primary btn-lg" style="margin-top:32px" id="btn-go-resume">
          Go to My Resume
        </button>
        <button class="btn btn-ghost" style="margin-top:8px;color:var(--color-error)" id="btn-deactivate">
          Deactivate License
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-go-resume').addEventListener('click', () => router.navigate('/resume'));
  document.getElementById('btn-deactivate').addEventListener('click', async () => {
    await PremiumService.deactivate();
    toast.info('Premium deactivated');
    renderPremium();
  });
}

function renderComparisonRow(feature, free, premium) {
  return `
    <div class="info-row" style="padding:12px 16px">
      <span class="info-row-label">${feature}</span>
      <div style="display:flex;gap:16px;align-items:center">
        <span style="font-size:12px;color:var(--color-text-tertiary);min-width:64px;text-align:right">${free}</span>
        <span style="font-size:12px;font-weight:700;color:var(--color-gold);min-width:64px;text-align:right">${premium}</span>
      </div>
    </div>
  `;
}
