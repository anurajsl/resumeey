/* AI Setup Screen (BYOK) */

import { router } from '../../router.js';
import { SettingsRepo } from '../../db/repositories.js';
import { aiService } from '../../services/ai-service.js';
import { toast } from '../../components/toast.js';
import { AI_PROVIDERS, AI_DEFAULT_MODELS } from '../../utils/constants.js';
import { isValidAIKey } from '../../utils/validators.js';
import { events, EVENTS } from '../../events.js';

const PROVIDERS = [
  {
    id: AI_PROVIDERS.OPENAI,
    name: 'OpenAI',
    desc: 'GPT-4o, GPT-4o-mini',
    placeholder: 'sk-...',
    logo: 'GPT',
    color: '#10a37f',
  },
  {
    id: AI_PROVIDERS.ANTHROPIC,
    name: 'Anthropic',
    desc: 'Claude 3 Haiku, Sonnet',
    placeholder: 'sk-ant-...',
    logo: 'ANT',
    color: '#d97706',
  },
  {
    id: AI_PROVIDERS.OPENROUTER,
    name: 'OpenRouter',
    desc: 'Access 100+ models',
    placeholder: 'sk-or-...',
    logo: 'OR',
    color: '#7c3aed',
  },
];

export async function renderAISetup() {
  const container = document.getElementById('screen-container');
  document.getElementById('bottom-nav')?.style && (document.getElementById('bottom-nav').style.display = 'none';

  let selectedProvider = AI_PROVIDERS.OPENAI;
  const existingConfig = await SettingsRepo.getAIConfig();
  if (existingConfig?.provider) selectedProvider = existingConfig.provider;

  container.innerHTML = `
    <div class="ai-setup-screen animate-fade-up">
      <div class="page-header" style="padding:24px 0 16px">
        <div class="ai-badge" style="margin-bottom:12px">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Optional — Skip to use basic features
        </div>
        <h2 class="page-title">AI Setup</h2>
        <p class="page-subtitle">Add your own API key to enable AI-powered resume parsing, optimization, and cover letters. Your key is stored encrypted on your device only.</p>
      </div>

      <div id="provider-list" style="margin-bottom:20px"></div>

      <div id="key-section" style="margin-bottom:24px">
        <div class="form-group">
          <label class="form-label">API Key</label>
          <div class="input-wrapper">
            <div class="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <input
              type="password"
              id="api-key-input"
              class="form-input"
              placeholder="Paste your API key"
              autocomplete="off"
              spellcheck="false"
            />
            <button class="btn-icon input-suffix" id="toggle-key-visibility" aria-label="Show key">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <p class="form-hint">Key is encrypted and never leaves your device.</p>
          <p class="form-error hidden" id="key-error"></p>
        </div>

        <div class="form-group">
          <label class="form-label">Model (optional)</label>
          <input
            type="text"
            id="model-input"
            class="form-input"
            placeholder="Leave blank for default"
          />
          <p class="form-hint" id="model-hint"></p>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px">
        <button class="btn btn-primary btn-block" id="btn-save-key">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Save & Continue
        </button>
        <button class="btn btn-ghost btn-block" id="btn-skip">
          Skip for now — use basic features
        </button>
      </div>

      <div style="margin-top:24px;padding:16px;background:var(--color-bg-secondary);border-radius:12px">
        <p style="font-size:12px;color:var(--color-text-tertiary);line-height:1.6">
          <strong style="color:var(--color-text-secondary)">Your privacy:</strong>
          API keys are encrypted using AES-256 and stored only in your browser's local database.
          All AI requests go directly from your browser to the AI provider — never through our servers.
        </p>
      </div>
    </div>
  `;

  // Render provider list
  renderProviders(selectedProvider);

  // Fill existing values
  if (existingConfig?.apiKey) {
    document.getElementById('api-key-input').value = existingConfig.apiKey;
  }
  if (existingConfig?.model) {
    document.getElementById('model-input').value = existingConfig.model;
  }
  updateModelHint(selectedProvider);

  // Provider selection
  document.getElementById('provider-list').addEventListener('click', (e) => {
    const card = e.target.closest('.provider-card');
    if (!card) return;
    selectedProvider = card.dataset.provider;
    renderProviders(selectedProvider);
    updateModelHint(selectedProvider);
    document.getElementById('api-key-input').placeholder = PROVIDERS.find(p => p.id === selectedProvider)?.placeholder || '';
  });

  // Toggle visibility
  const keyInput = document.getElementById('api-key-input');
  document.getElementById('toggle-key-visibility').addEventListener('click', () => {
    keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
  });

  // Save
  document.getElementById('btn-save-key').addEventListener('click', async () => {
    const key = keyInput.value.trim();
    const model = document.getElementById('model-input').value.trim();
    const errorEl = document.getElementById('key-error');

    if (!key) {
      errorEl.textContent = 'Please enter an API key';
      errorEl.classList.remove('hidden');
      keyInput.classList.add('error');
      return;
    }

    if (!isValidAIKey(selectedProvider, key)) {
      errorEl.textContent = 'Key format looks incorrect for this provider';
      errorEl.classList.remove('hidden');
      keyInput.classList.add('error');
    } else {
      errorEl.classList.add('hidden');
      keyInput.classList.remove('error');
    }

    const btn = document.getElementById('btn-save-key');
    btn.classList.add('btn-loading');
    btn.textContent = '';

    try {
      await SettingsRepo.saveAIConfig({
        provider: selectedProvider,
        apiKey: key,
        model: model || AI_DEFAULT_MODELS[selectedProvider],
      });

      aiService.invalidateConfig();
      events.emit(EVENTS.AI_KEY_SAVED, { provider: selectedProvider });
      toast.success('AI key saved successfully!');

      await SettingsRepo.setPreferences({ onboardingComplete: true });
      navigateAfterSetup();
    } catch (err) {
      toast.error('Failed to save key: ' + err.message);
    } finally {
      btn.classList.remove('btn-loading');
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Save & Continue`;
    }
  });

  // Skip
  document.getElementById('btn-skip').addEventListener('click', async () => {
    await SettingsRepo.setPreferences({ onboardingComplete: true });
    navigateAfterSetup();
  });

  async function navigateAfterSetup() {
    // Check if resume exists
    const { ResumeRepo } = await import('../../db/repositories.js');
    const master = await ResumeRepo.getMaster();
    if (master) {
      router.navigate('/resume');
    } else {
      router.navigate('/resume/create');
    }
  }

  function renderProviders(selected) {
    const list = document.getElementById('provider-list');
    list.innerHTML = PROVIDERS.map(p => `
      <div class="provider-card ${selected === p.id ? 'selected' : ''}" data-provider="${p.id}">
        <div class="provider-logo" style="background:${p.color}20;color:${p.color}">${p.logo}</div>
        <div class="provider-info">
          <div class="provider-name">${p.name}</div>
          <div class="provider-desc">${p.desc}</div>
        </div>
        ${selected === p.id ? `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${p.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        ` : ''}
      </div>
    `).join('');
  }

  function updateModelHint(provider) {
    document.getElementById('model-hint').textContent = `Default: ${AI_DEFAULT_MODELS[provider] || ''}`;
  }
}
