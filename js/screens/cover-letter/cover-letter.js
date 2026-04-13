/* Cover Letter Screen */

import { router } from '../../router.js';
import { JobRepo, ResumeRepo } from '../../db/repositories.js';
import { generateCoverLetter } from '../../services/cover-letter-service.js';
import { aiService } from '../../services/ai-service.js';
import { toast } from '../../components/toast.js';
import { copyToClipboard } from '../../utils/dom.js';

const TONES = [
  { id: 'professional', label: 'Professional' },
  { id: 'formal', label: 'Formal' },
  { id: 'concise', label: 'Concise' },
  { id: 'persuasive', label: 'Persuasive' },
];

export async function renderCoverLetter({ jobId }) {
  const container = document.getElementById('screen-container');
  document.getElementById('bottom-nav')?.style && (document.getElementById('bottom-nav').style.display = '';

  const [job, resume] = await Promise.all([
    JobRepo.get(jobId),
    ResumeRepo.getMaster(),
  ]);

  if (!job || !resume) {
    toast.error('Missing data');
    router.navigate('/jobs');
    return;
  }

  const headerTitle = document.getElementById('header-screen-title');
  const back = document.getElementById('header-back');
  if (headerTitle) { headerTitle.textContent = 'Cover Letter'; headerTitle.classList.add('visible'); }
  if (back) {
    back.style.display = 'flex';
    back.onclick = () => {
      headerTitle?.classList.remove('visible');
      back.style.display = 'none';
      router.navigate(`/jobs/${jobId}`);
    };
  }

  let selectedTone = 'professional';
  let currentLetter = job.coverLetter || '';
  const aiAvailable = await aiService.isAvailable();

  container.innerHTML = `
    <div class="cover-letter-screen animate-fade-up">
      <div style="margin-bottom:16px">
        <h2 class="page-title">Cover Letter</h2>
        <p class="page-subtitle">For ${job.title}${job.company ? ` at ${job.company}` : ''}</p>
      </div>

      ${!aiAvailable ? `
      <div class="premium-banner" style="margin-bottom:16px">
        <div class="premium-banner-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <div class="premium-banner-text">
          <div class="premium-banner-title">AI key recommended</div>
          <div class="premium-banner-subtitle">Using template-based generation</div>
        </div>
        <button class="btn btn-sm btn-primary" id="btn-setup-ai">Setup AI</button>
      </div>` : ''}

      <!-- Tone selector -->
      <div style="margin-bottom:16px">
        <p style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-secondary);margin-bottom:8px">Tone</p>
        <div class="cover-letter-tone-row">
          ${TONES.map(t => `
            <button class="tone-pill ${t.id === selectedTone ? 'active' : ''}" data-tone="${t.id}">
              ${t.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Generate button -->
      <button class="btn btn-primary btn-block" id="btn-generate" style="margin-bottom:16px">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        ${currentLetter ? 'Regenerate' : 'Generate'} Cover Letter
      </button>

      <!-- Editor -->
      <div class="form-group" id="editor-section" style="${!currentLetter ? 'display:none' : ''}">
        <label class="form-label">Cover Letter</label>
        <textarea
          id="cover-letter-editor"
          class="cover-letter-editor"
          placeholder="Your cover letter will appear here…"
        >${currentLetter}</textarea>
      </div>

      <!-- Actions (when letter exists) -->
      <div id="letter-actions" style="${!currentLetter ? 'display:none' : ''}">
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
          <button class="btn btn-secondary" id="btn-copy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>
          <button class="btn btn-secondary" id="btn-save">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save
          </button>
        </div>
      </div>
    </div>
  `;

  // Tone selection
  container.addEventListener('click', (e) => {
    const pill = e.target.closest('.tone-pill');
    if (!pill) return;
    selectedTone = pill.dataset.tone;
    document.querySelectorAll('.tone-pill').forEach(p => p.classList.toggle('active', p.dataset.tone === selectedTone));
  });

  document.getElementById('btn-setup-ai')?.addEventListener('click', () => router.navigate('/onboarding/ai'));

  document.getElementById('btn-generate').addEventListener('click', async () => {
    const btn = document.getElementById('btn-generate');
    btn.classList.add('btn-loading');
    btn.textContent = '';

    try {
      const letter = await generateCoverLetter({ resume, job, tone: selectedTone });
      currentLetter = letter;

      const editor = document.getElementById('cover-letter-editor');
      const editorSection = document.getElementById('editor-section');
      const letterActions = document.getElementById('letter-actions');

      if (editor) editor.value = letter;
      editorSection.style.display = '';
      letterActions.style.display = '';

      toast.success('Cover letter generated!');
    } catch (err) {
      toast.error('Failed to generate: ' + err.message);
    } finally {
      btn.classList.remove('btn-loading');
      btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Regenerate`;
    }
  });

  document.getElementById('btn-copy')?.addEventListener('click', async () => {
    const text = document.getElementById('cover-letter-editor')?.value;
    if (text) {
      await copyToClipboard(text);
      toast.success('Copied to clipboard!');
    }
  });

  document.getElementById('btn-save')?.addEventListener('click', async () => {
    const text = document.getElementById('cover-letter-editor')?.value;
    if (text) {
      await JobRepo.update(jobId, { coverLetter: text });
      toast.success('Cover letter saved!');
    }
  });
}
