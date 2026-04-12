/* Resume Creation Screen */

import { router } from '../../router.js';
import { ResumeRepo } from '../../db/repositories.js';
import { parseFile, parseLinkedInContent, parseText } from '../../services/parser-service.js';
import { createFileUpload } from '../../components/file-upload.js';
import { toast } from '../../components/toast.js';
import { PremiumService } from '../../services/premium-service.js';
import { shortId } from '../../utils/formatters.js';

export async function renderCreateResume() {
  const container = document.getElementById('screen-container');
  document.getElementById('bottom-nav').style.display = '';

  // Check free tier
  const canCreate = await PremiumService.canCreateResume();
  if (!canCreate) {
    container.innerHTML = `
      <div class="page animate-fade-up">
        <div style="margin-bottom:24px">
          <h2 class="page-title">Create Resume</h2>
        </div>
        <div class="premium-banner">
          <div class="premium-banner-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div class="premium-banner-text">
            <div class="premium-banner-title">Premium required</div>
            <div class="premium-banner-subtitle">Free tier allows 1 resume. Upgrade for unlimited.</div>
          </div>
          <button class="btn btn-gold btn-sm" onclick="router.navigate('/premium')">Upgrade</button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="page animate-fade-up">
      <div style="margin-bottom:8px">
        <h2 class="page-title">Create Resume</h2>
        <p class="page-subtitle">How would you like to start?</p>
      </div>

      <div style="display:flex;gap:12px;flex-wrap:wrap;margin:24px 0" id="create-methods">
        <div class="create-method-card" data-method="upload">
          <div class="create-method-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <div class="create-method-title">Upload Resume</div>
          <div class="create-method-desc">PDF or Word document</div>
        </div>

        <div class="create-method-card" data-method="paste">
          <div class="create-method-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
          </div>
          <div class="create-method-title">Paste Text</div>
          <div class="create-method-desc">LinkedIn profile or resume text</div>
        </div>

        <div class="create-method-card" data-method="scratch">
          <div class="create-method-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div class="create-method-title">Start Fresh</div>
          <div class="create-method-desc">Build from scratch</div>
        </div>
      </div>

      <!-- Upload panel -->
      <div id="panel-upload" class="hidden animate-scale-in">
        <div id="file-upload-container"></div>
        <div id="upload-status" style="display:none;margin-top:16px" class="animate-fade-up"></div>
      </div>

      <!-- Paste panel -->
      <div id="panel-paste" class="hidden animate-scale-in">
        <div class="form-group">
          <label class="form-label">Paste your resume or LinkedIn profile text</label>
          <textarea
            id="paste-input"
            class="form-textarea"
            placeholder="Paste your resume content here..."
            style="min-height:200px;font-size:13px"
          ></textarea>
        </div>
        <button class="btn btn-primary btn-block" id="btn-parse-paste">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Parse & Create Resume
        </button>
      </div>

      <!-- Scratch panel -->
      <div id="panel-scratch" class="hidden animate-scale-in">
        <div class="form-group">
          <label class="form-label">Resume Name</label>
          <input type="text" id="scratch-name" class="form-input" placeholder="e.g. My Software Engineer Resume" value="My Resume" />
        </div>
        <button class="btn btn-primary btn-block" id="btn-create-scratch">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Empty Resume
        </button>
      </div>
    </div>
  `;

  // Set up file upload
  const uploadContainer = document.getElementById('file-upload-container');
  const uploadZone = createFileUpload({
    accept: '.pdf,.doc,.docx,.txt',
    label: 'Upload Resume',
    hint: 'PDF or Word document (max 10MB)',
    onFile: (file) => handleFileUpload(file),
  });
  uploadContainer.appendChild(uploadZone);

  // Method card clicks
  let activePanel = null;
  document.getElementById('create-methods').addEventListener('click', (e) => {
    const card = e.target.closest('.create-method-card');
    if (!card) return;
    const method = card.dataset.method;

    // Clear active
    document.querySelectorAll('.create-method-card').forEach(c => c.style.borderColor = '');

    // Show panel
    ['upload', 'paste', 'scratch'].forEach(m => {
      const panel = document.getElementById(`panel-${m}`);
      if (m === method) {
        panel.classList.remove('hidden');
        card.style.borderColor = 'var(--color-primary)';
        activePanel = method;
      } else {
        panel.classList.add('hidden');
      }
    });
  });

  // Parse paste
  document.getElementById('btn-parse-paste').addEventListener('click', async () => {
    const text = document.getElementById('paste-input').value.trim();
    if (!text) { toast.warning('Please paste some content first'); return; }
    await handleParsedText(text, 'linkedin');
  });

  // Create from scratch
  document.getElementById('btn-create-scratch').addEventListener('click', async () => {
    const name = document.getElementById('scratch-name').value.trim() || 'My Resume';
    await createBlankResume(name);
  });

  async function handleFileUpload(file) {
    const status = document.getElementById('upload-status');
    status.style.display = 'block';
    status.innerHTML = `
      <div class="card card-body" style="text-align:center">
        <div class="loading-dots" style="justify-content:center;color:var(--color-primary)">
          <span></span><span></span><span></span>
        </div>
        <p style="margin-top:12px;font-size:13px;color:var(--color-text-secondary)">Parsing ${file.name}…</p>
      </div>
    `;

    try {
      const parsed = await parseFile(file);
      await createResume(parsed, file.name, 'file');
    } catch (err) {
      status.innerHTML = `
        <div class="card card-body" style="background:var(--color-error-bg)">
          <p style="color:var(--color-error);font-size:13px">${err.message}</p>
          <button class="btn btn-sm btn-secondary" style="margin-top:12px" onclick="this.closest('#upload-status').style.display='none'">Try again</button>
        </div>
      `;
    }
  }

  async function handleParsedText(text, sourceType) {
    const btn = document.getElementById('btn-parse-paste');
    btn.classList.add('btn-loading');
    btn.textContent = '';

    try {
      const parsed = await parseLinkedInContent(text);
      await createResume(parsed, 'Pasted Resume', sourceType);
    } catch (err) {
      toast.error(err.message);
    } finally {
      btn.classList.remove('btn-loading');
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        Parse & Create Resume`;
    }
  }

  async function createResume(parsed, fileName, sourceType) {
    const name = parsed.contact?.name || fileName || 'My Resume';
    const resume = await ResumeRepo.create({
      name,
      type: 'master',
      sections: {
        contact: parsed.contact || {},
        summary: parsed.summary || '',
        experience: parsed.experience || [],
        education: parsed.education || [],
        skills: parsed.skills || [],
        projects: parsed.projects || [],
        certifications: parsed.certifications || [],
        awards: parsed.awards || [],
      },
      metadata: { sourceType, parseConfidence: parsed.metadata?.parseConfidence || 0.7 },
    });

    toast.success('Resume created successfully!');
    router.navigate('/resume');
  }

  async function createBlankResume(name) {
    await ResumeRepo.create({ name, type: 'master', sections: {} });
    toast.success('Resume created!');
    router.navigate('/resume');
  }
}
