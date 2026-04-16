/* Export Screen */

import { router } from '../../router.js';
import { ResumeRepo } from '../../db/repositories.js';
import { exportToPDF, buildResumeHTML } from '../../services/export-service.js';
import { PremiumService } from '../../services/premium-service.js';
import { toast } from '../../components/toast.js';
import { createEmptyState } from '../../components/empty-state.js';

const TEMPLATES = [
  { id: 'classic', name: 'Classic', preview: previewClassic() },
  { id: 'modern', name: 'Modern', preview: previewModern() },
  { id: 'minimal', name: 'Minimal', preview: previewMinimal() },
];

export async function renderExportView() {
  const container = document.getElementById('screen-container');
  const nav = document.getElementById('bottom-nav'); if (nav) nav.style.display = '';

  const [resume, isPremium] = await Promise.all([
    ResumeRepo.getMaster(),
    PremiumService.isActive(),
  ]);

  if (!resume) {
    container.innerHTML = '';
    container.appendChild(createEmptyState({
      icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>`,
      title: 'No resume to export',
      description: 'Create your master resume first before exporting.',
      action: { label: 'Create Resume', onClick: () => router.navigate('/resume/create') },
    }));
    return;
  }

  let selectedTemplate = 'classic';

  container.innerHTML = `
    <div class="export-screen animate-fade-up">
      <div style="margin-bottom:20px">
        <h2 class="page-title">Export Resume</h2>
        <p class="page-subtitle">${resume.sections?.contact?.name ? `for ${resume.sections.contact.name}` : ''}</p>
      </div>

      <!-- Template gallery -->
      <div style="margin-bottom:20px">
        <h3 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-secondary);margin-bottom:12px">Choose Template</h3>
        <div class="template-gallery">
          ${TEMPLATES.map(t => `
            <div class="template-card ${t.id === selectedTemplate ? 'selected' : ''} ${!isPremium && t.id !== 'classic' ? 'premium-locked' : ''}" data-template="${t.id}">
              <div class="template-preview">
                ${t.preview}
                ${!isPremium && t.id !== 'classic' ? `
                <div style="position:absolute;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;border-radius:4px">
                  <span class="tag tag-gold" style="font-size:10px">Premium</span>
                </div>` : ''}
              </div>
              <div class="template-name">${t.name}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Premium watermark info -->
      ${!isPremium ? `
      <div style="background:var(--color-bg-secondary);border-radius:12px;padding:14px;margin-bottom:20px;display:flex;align-items:center;gap:12px">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div style="flex:1">
          <p style="font-size:13px;font-weight:600;color:var(--color-text)">Free export includes watermark</p>
          <p style="font-size:12px;color:var(--color-text-secondary)">Upgrade to Premium for clean, watermark-free exports</p>
        </div>
        <button class="btn btn-gold btn-sm" id="btn-upgrade">Upgrade</button>
      </div>` : ''}

      <!-- Preview toggle -->
      <div style="margin-bottom:16px">
        <button class="btn btn-outline btn-block" id="btn-toggle-preview">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Preview Resume
        </button>
        <div id="resume-preview-wrap" style="display:none;margin-top:12px">
          <div class="resume-preview-container">
            <iframe id="resume-preview-frame" class="resume-preview-frame" title="Resume Preview"></iframe>
          </div>
          <p style="font-size:11px;color:var(--color-text-tertiary);text-align:center;margin-top:6px">Scroll to see full resume · Actual PDF may differ slightly</p>
        </div>
      </div>

      <!-- Export button -->
      <button class="btn btn-primary btn-lg btn-block" id="btn-export-pdf">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download PDF
      </button>

      <p style="font-size:11px;color:var(--color-text-tertiary);text-align:center;margin-top:8px">
        A4 format · ATS-friendly · Optimized layout
      </p>
    </div>
  `;

  let previewOpen = false;

  const updatePreview = () => {
    const frame = document.getElementById('resume-preview-frame');
    if (!frame || !previewOpen) return;
    const html = buildResumeHTML(resume, selectedTemplate, isPremium);
    frame.srcdoc = html;
  };

  // Preview toggle
  document.getElementById('btn-toggle-preview').addEventListener('click', () => {
    previewOpen = !previewOpen;
    const wrap = document.getElementById('resume-preview-wrap');
    const btn = document.getElementById('btn-toggle-preview');
    wrap.style.display = previewOpen ? '' : 'none';
    btn.innerHTML = previewOpen
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Hide Preview`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Preview Resume`;
    if (previewOpen) updatePreview();
  });

  // Template selection
  container.addEventListener('click', (e) => {
    const card = e.target.closest('.template-card');
    if (!card) return;
    const template = card.dataset.template;

    if (!isPremium && template !== 'classic') {
      router.navigate('/premium');
      return;
    }

    selectedTemplate = template;
    document.querySelectorAll('.template-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.template === template);
    });
    updatePreview();
  });

  document.getElementById('btn-upgrade')?.addEventListener('click', () => router.navigate('/premium'));

  document.getElementById('btn-export-pdf').addEventListener('click', async () => {
    const btn = document.getElementById('btn-export-pdf');
    btn.classList.add('btn-loading');
    btn.textContent = '';

    try {
      await exportToPDF(resume, selectedTemplate, isPremium);
      toast.success('PDF downloaded!');
    } catch (err) {
      toast.error('Export failed: ' + err.message);
    } finally {
      btn.classList.remove('btn-loading');
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download PDF`;
    }
  });
}

function previewClassic() {
  return `
    <div style="padding:8px;font-size:5px;line-height:1.3">
      <div style="text-align:center;border-bottom:1.5px solid #4A7C59;padding-bottom:4px;margin-bottom:4px">
        <div style="font-weight:700;font-size:7px">FULL NAME</div>
        <div style="color:#4A7C59;font-size:5px">Job Title</div>
        <div style="color:#999;font-size:4px">email · phone · location</div>
      </div>
      <div style="color:#4A7C59;font-weight:700;font-size:4.5px;text-transform:uppercase;letter-spacing:0.04em;margin:3px 0 2px">EXPERIENCE</div>
      ${[1,2].map(() => `<div style="margin-bottom:3px"><div style="font-weight:700;font-size:5px">Role Title</div><div style="font-size:4px;color:#666">Company · 2020–2022</div><div style="background:#eee;height:2px;border-radius:1px;margin-top:2px;width:80%"></div></div>`).join('')}
    </div>`;
}

function previewModern() {
  return `
    <div style="display:flex;height:100%;font-size:5px">
      <div style="background:#4A7C59;width:40%;padding:8px;color:white">
        <div style="font-weight:700;font-size:6px;margin-bottom:4px">FULL<br>NAME</div>
        <div style="font-size:4px;opacity:0.8">Job Title</div>
        <div style="margin-top:6px;font-size:4px;opacity:0.7">email</div>
        <div style="font-size:4px;opacity:0.7">phone</div>
      </div>
      <div style="flex:1;padding:8px">
        <div style="font-weight:700;font-size:5px;color:#4A7C59;border-bottom:1px solid #eee;padding-bottom:2px;margin-bottom:4px">EXPERIENCE</div>
        ${[1,2].map(() => `<div style="margin-bottom:3px"><div style="font-weight:700;font-size:4.5px">Role</div><div style="background:#eee;height:2px;border-radius:1px;margin-top:1px;width:75%"></div></div>`).join('')}
      </div>
    </div>`;
}

function previewMinimal() {
  return `
    <div style="padding:8px;font-size:5px;line-height:1.3">
      <div style="margin-bottom:5px">
        <div style="font-weight:300;font-size:9px;letter-spacing:-0.02em">FULL NAME</div>
        <div style="color:#999;font-size:4px;margin-top:1px">email · phone</div>
      </div>
      <div style="font-size:4.5px;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin:4px 0 2px">EXPERIENCE</div>
      <div style="background:#eee;height:0.5px;margin-bottom:3px"></div>
      ${[1,2].map(() => `<div style="margin-bottom:3px"><div style="font-weight:600;font-size:4.5px">Role Title</div><div style="background:#eee;height:2px;border-radius:1px;margin-top:1px;width:70%"></div></div>`).join('')}
    </div>`;
}
