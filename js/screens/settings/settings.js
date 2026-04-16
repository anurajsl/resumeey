/* Settings Screen */

import { router } from '../../router.js';
import { SettingsRepo, ResumeRepo, JobRepo } from '../../db/repositories.js';
import { PremiumService } from '../../services/premium-service.js';
import { confirmModal } from '../../components/modal.js';
import { toast } from '../../components/toast.js';
import { clearEncryptionKey } from '../../utils/crypto.js';
import { aiService } from '../../services/ai-service.js';
import { AI_PROVIDER_LABELS } from '../../utils/constants.js';

export async function renderSettings() {
  const container = document.getElementById('screen-container');
  const nav = document.getElementById('bottom-nav'); if (nav) nav.style.display = '';

  const [aiConfig, premium, prefs] = await Promise.all([
    SettingsRepo.getAIConfig(),
    PremiumService.isActive(),
    SettingsRepo.getPreferences(),
  ]);

  container.innerHTML = `
    <div class="settings-screen animate-fade-up">
      <div style="padding:24px 0 16px">
        <h2 class="page-title">Settings</h2>
      </div>

      <!-- AI Configuration -->
      <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-secondary);margin-bottom:8px">AI Configuration</h3>
      <div class="settings-group" style="margin-bottom:20px">
        <div class="settings-item" id="settings-ai-provider">
          <div class="settings-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div class="settings-item-text">
            <div class="settings-item-title">AI Provider</div>
            <div class="settings-item-subtitle">${aiConfig ? `${AI_PROVIDER_LABELS[aiConfig.provider] || aiConfig.provider} · ${aiConfig.model || 'default'}` : 'Not configured'}</div>
          </div>
          <svg class="settings-item-right" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div class="settings-item" id="settings-clear-ai" style="${!aiConfig ? 'display:none' : ''}">
          <div class="settings-item-icon" style="background:var(--color-error-bg)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div class="settings-item-text">
            <div class="settings-item-title" style="color:var(--color-error)">Remove API Key</div>
            <div class="settings-item-subtitle">Clear saved AI credentials</div>
          </div>
        </div>
      </div>

      <!-- Premium -->
      <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-secondary);margin-bottom:8px">Account</h3>
      <div class="settings-group" style="margin-bottom:20px">
        <div class="settings-item" id="settings-premium">
          <div class="settings-item-icon" style="background:var(--color-gold-bg)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div class="settings-item-text">
            <div class="settings-item-title">Premium Status</div>
            <div class="settings-item-subtitle">${premium ? 'Active — All features unlocked' : 'Free tier — 1 resume, 3 jobs'}</div>
          </div>
          <span class="badge ${premium ? 'badge-gold' : 'badge-neutral'}">${premium ? 'Premium' : 'Free'}</span>
        </div>
      </div>

      <!-- Appearance -->
      <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-secondary);margin-bottom:8px">Appearance</h3>
      <div class="settings-group" style="margin-bottom:20px">
        <div class="settings-item">
          <div class="settings-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </div>
          <div class="settings-item-text">
            <div class="settings-item-title">Theme</div>
            <div class="settings-item-subtitle">Follows system preference</div>
          </div>
          <span class="badge badge-neutral">Auto</span>
        </div>
      </div>

      <!-- Data Management -->
      <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-secondary);margin-bottom:8px">Data</h3>
      <div class="settings-group" style="margin-bottom:20px">
        <div class="settings-item" id="settings-export-data">
          <div class="settings-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </div>
          <div class="settings-item-text">
            <div class="settings-item-title">Export Data</div>
            <div class="settings-item-subtitle">Download all resumes as JSON</div>
          </div>
          <svg class="settings-item-right" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div class="settings-item" id="settings-clear-data">
          <div class="settings-item-icon" style="background:var(--color-error-bg)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </div>
          <div class="settings-item-text">
            <div class="settings-item-title" style="color:var(--color-error)">Clear All Data</div>
            <div class="settings-item-subtitle">Permanently delete resumes and jobs</div>
          </div>
        </div>
      </div>

      <!-- About -->
      <div style="text-align:center;padding:20px 0;color:var(--color-text-tertiary);font-size:12px">
        <div style="margin-bottom:4px">Resumey v1.0.0</div>
        <div>Built with care · Privacy-first · Open</div>
      </div>
    </div>
  `;

  // AI settings
  document.getElementById('settings-ai-provider').addEventListener('click', () => router.navigate('/onboarding/ai'));

  document.getElementById('settings-clear-ai')?.addEventListener('click', async () => {
    const confirmed = await confirmModal({
      title: 'Remove API Key',
      message: 'This will remove your saved AI API key. AI features will be disabled until you add a new key.',
      confirmText: 'Remove Key',
      danger: true,
    });
    if (confirmed) {
      clearEncryptionKey();
      await SettingsRepo.set('ai_config', null);
      aiService.invalidateConfig();
      toast.success('API key removed');
      renderSettings();
    }
  });

  // Premium
  document.getElementById('settings-premium').addEventListener('click', () => router.navigate('/premium'));

  // Export data
  document.getElementById('settings-export-data').addEventListener('click', async () => {
    const [resumes, jobs] = await Promise.all([ResumeRepo.getAll(), JobRepo.getAll()]);
    const data = { resumes, jobs, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resumey-export.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported!');
  });

  // Clear all
  document.getElementById('settings-clear-data').addEventListener('click', async () => {
    const confirmed = await confirmModal({
      title: 'Clear All Data',
      message: 'This will permanently delete all your resumes and jobs. This cannot be undone.',
      confirmText: 'Delete Everything',
      danger: true,
    });
    if (confirmed) {
      await Promise.all([ResumeRepo.clear(), JobRepo.clear()]);
      toast.success('All data cleared');
      router.navigate('/welcome');
    }
  });
}
