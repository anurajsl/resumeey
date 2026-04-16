/* Tailored Resume Screen — job-specific resume variant */

import { router } from '../../router.js';
import { ResumeRepo, JobRepo } from '../../db/repositories.js';
import { exportToPDF } from '../../services/export-service.js';
import { PremiumService } from '../../services/premium-service.js';
import { confirmModal } from '../../components/modal.js';
import { toast } from '../../components/toast.js';
import { formatDateRange, timeAgo } from '../../utils/formatters.js';

export async function renderTailoredResume({ resumeId }) {
  const container = document.getElementById('screen-container');
  const nav = document.getElementById('bottom-nav'); if (nav) nav.style.display = '';

  const [resume, isPremium] = await Promise.all([
    ResumeRepo.get(resumeId),
    PremiumService.isActive(),
  ]);

  if (!resume || resume.type !== 'tailored') {
    toast.error('Tailored resume not found');
    router.navigate('/jobs');
    return;
  }

  const master = await ResumeRepo.getMaster();
  const jobId = resume.metadata?.jobId;
  const job = jobId ? await JobRepo.get(jobId).catch(() => null) : null;

  // Header
  const headerTitle = document.getElementById('header-screen-title');
  const back = document.getElementById('header-back');
  const backRoute = jobId ? `/jobs/${jobId}` : '/jobs';

  if (headerTitle) { headerTitle.textContent = 'Tailored Resume'; headerTitle.classList.add('visible'); }
  if (back) {
    back.style.display = 'flex';
    back.onclick = () => { headerTitle?.classList.remove('visible'); back.style.display = 'none'; router.navigate(backRoute); };
  }

  // Compute diff vs master
  const diff = master ? computeDiff(resume.sections, master.sections) : {};
  const modifiedCount = Object.values(diff).filter(Boolean).length;

  const s = resume.sections || {};
  const contact = s.contact || {};

  container.innerHTML = `
    <div class="animate-fade-up" style="padding-bottom:32px">

      <!-- Tailored header banner -->
      <div class="tailored-banner">
        <div class="tailored-banner-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <div style="flex:1;min-width:0">
          <div class="tailored-banner-label">Tailored Resume</div>
          <div class="tailored-banner-job">${job ? `${job.title}${job.company ? ` @ ${job.company}` : ''}` : 'Job-specific version'}</div>
        </div>
        ${modifiedCount > 0 ? `<span class="tailored-diff-badge">${modifiedCount} modified</span>` : '<span class="tailored-diff-badge tailored-diff-badge--none">Unchanged</span>'}
      </div>

      <!-- Resume header card -->
      <div class="resume-header-card" style="margin-bottom:0">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div class="resume-name">${contact.name || 'Your Name'}</div>
            ${s.summary ? `<div class="resume-headline">${s.summary.slice(0, 120)}${s.summary.length > 120 ? '…' : ''}</div>` : ''}
          </div>
        </div>
        ${(contact.email || contact.phone || contact.location) ? `
        <div class="resume-contacts">
          ${contact.email ? `<div class="resume-contact-chip">${contact.email}</div>` : ''}
          ${contact.phone ? `<div class="resume-contact-chip">${contact.phone}</div>` : ''}
          ${contact.location ? `<div class="resume-contact-chip">${contact.location}</div>` : ''}
        </div>` : ''}
      </div>

      <!-- Actions row -->
      <div style="display:flex;gap:8px;padding:12px 16px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" id="btn-tailored-export">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export PDF
        </button>
        ${job ? `<button class="btn btn-secondary btn-sm" id="btn-back-to-job">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          Back to Job
        </button>` : ''}
        <button class="btn btn-ghost btn-sm" id="btn-reset-master" style="color:var(--color-error);margin-left:auto">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.95"/></svg>
          Reset to Master
        </button>
      </div>

      <!-- Sections -->
      ${renderSection('Summary', 'summary', diff.summary, renderSummaryContent(s.summary))}
      ${renderSection('Experience', 'experience', diff.experience, renderExperienceContent(s.experience || []))}
      ${renderSection('Education', 'education', diff.education, renderEducationContent(s.education || []))}
      ${renderSection('Skills', 'skills', diff.skills, renderSkillsContent(s.skills || []))}
      ${s.projects?.length ? renderSection('Projects', 'projects', diff.projects, renderProjectsContent(s.projects)) : ''}
      ${s.certifications?.length ? renderSection('Certifications', 'certifications', diff.certifications, renderCertsContent(s.certifications)) : ''}

      <!-- Meta -->
      <div style="padding:16px;text-align:center">
        <p style="font-size:11px;color:var(--color-text-tertiary)">Last edited ${timeAgo(resume.updatedAt)} · v${resume.metadata?.version || 1}</p>
      </div>
    </div>
  `;

  // Section expand/collapse + edit routing
  container.addEventListener('click', (e) => {
    const header = e.target.closest('.section-card-header');
    if (header) {
      const body = header.nextElementSibling;
      const chevron = header.querySelector('.section-chevron');
      if (body?.classList.contains('section-card-body')) {
        const isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : '';
        if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
      }
    }

    const editBtn = e.target.closest('.btn-edit-section');
    if (editBtn) {
      const section = editBtn.dataset.section;
      router.navigate(`/resume/${resumeId}/edit/${section}`);
    }
  });

  document.getElementById('btn-tailored-export')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-tailored-export');
    btn.classList.add('btn-loading');
    btn.textContent = '';
    try {
      await exportToPDF(resume, 'classic', isPremium);
      toast.success('PDF downloaded!');
    } catch (err) {
      toast.error('Export failed: ' + err.message);
    } finally {
      btn.classList.remove('btn-loading');
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export PDF`;
    }
  });

  document.getElementById('btn-back-to-job')?.addEventListener('click', () => router.navigate(backRoute));

  document.getElementById('btn-reset-master')?.addEventListener('click', async () => {
    const confirmed = await confirmModal({
      title: 'Reset to Master',
      message: 'This will replace all sections in this tailored resume with the current master resume content. Your customizations will be lost.',
      confirmText: 'Reset',
      danger: true,
    });
    if (!confirmed) return;
    if (!master) { toast.error('No master resume found'); return; }
    await ResumeRepo.update(resumeId, {
      sections: JSON.parse(JSON.stringify(master.sections)),
    });
    toast.success('Reset to master resume');
    renderTailoredResume({ resumeId });
  });
}

// ─── Diff computation ─────────────────────────────────────────────────────────

function computeDiff(tailoredSections, masterSections) {
  const diff = {};
  const keys = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'awards'];
  keys.forEach(key => {
    diff[key] = JSON.stringify(tailoredSections?.[key]) !== JSON.stringify(masterSections?.[key]);
  });
  return diff;
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function renderSection(title, section, isModified, content) {
  const icons = {
    summary: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    experience: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    education: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    skills: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    projects: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    certifications: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
  };

  return `
    <div class="section-card ${isModified ? 'section-card--modified' : ''}">
      <div class="section-card-header">
        <div class="section-card-title">
          <div class="section-card-icon">${icons[section] || ''}</div>
          ${title}
          ${isModified ? '<span class="section-modified-badge">Modified</span>' : ''}
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <button class="btn-icon btn-edit-section" data-section="${section}" aria-label="Edit ${title}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
          <svg class="section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition:transform 200ms;color:var(--color-text-tertiary)"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      <div class="section-card-body">${content}</div>
    </div>
  `;
}

// ─── Content renderers ────────────────────────────────────────────────────────

function renderSummaryContent(summary) {
  if (!summary) return `<p style="color:var(--color-text-tertiary);font-size:13px">No summary added</p>`;
  return `<p style="font-size:14px;color:var(--color-text-secondary);line-height:1.7;padding-top:12px">${summary}</p>`;
}

function renderExperienceContent(experience) {
  if (!experience.length) return `<p style="color:var(--color-text-tertiary);font-size:13px;padding:8px 0">No experience added</p>`;
  return experience.map(exp => `
    <div class="experience-item">
      <div class="experience-header">
        <div>
          <div class="experience-role">${exp.role || 'Unknown Role'}</div>
          <div class="experience-company">${exp.company || ''}${exp.location ? ` · ${exp.location}` : ''}</div>
        </div>
        <div class="experience-date">${exp.startDate ? formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) : ''}</div>
      </div>
      ${(exp.bullets || []).length > 0 ? `<ul class="experience-bullets">${exp.bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
    </div>
  `).join('');
}

function renderEducationContent(education) {
  if (!education.length) return `<p style="color:var(--color-text-tertiary);font-size:13px;padding:8px 0">No education added</p>`;
  return education.map(edu => `
    <div class="experience-item">
      <div class="experience-header">
        <div>
          <div class="experience-role">${edu.degree || ''}${edu.field ? ` in ${edu.field}` : ''}</div>
          <div class="experience-company">${edu.institution || ''}</div>
        </div>
        <div class="experience-date">${edu.graduationDate ? edu.graduationDate.slice(0, 4) : ''}</div>
      </div>
    </div>
  `).join('');
}

function renderSkillsContent(skills) {
  if (!skills.length) return `<p style="color:var(--color-text-tertiary);font-size:13px;padding:8px 0">No skills added</p>`;
  const names = skills.map(s => typeof s === 'string' ? s : s.name).filter(Boolean);
  return `<div class="skills-grid" style="padding-top:8px">${names.map(s => `<span class="tag tag-neutral">${s}</span>`).join('')}</div>`;
}

function renderProjectsContent(projects) {
  return projects.map(p => `
    <div class="experience-item">
      <div class="experience-role">${p.name || 'Untitled'}</div>
      ${p.description ? `<p style="font-size:13px;color:var(--color-text-secondary);margin-top:4px;line-height:1.5">${p.description}</p>` : ''}
      ${p.technologies?.length ? `<div class="skills-grid" style="margin-top:6px">${p.technologies.map(t => `<span class="tag tag-neutral">${t}</span>`).join('')}</div>` : ''}
    </div>
  `).join('');
}

function renderCertsContent(certs) {
  return certs.map(c => `
    <div class="experience-item" style="padding:6px 0">
      <div style="font-weight:600;font-size:14px">${c.name}</div>
      ${c.issuer ? `<div style="font-size:12px;color:var(--color-text-secondary)">${c.issuer}${(c.issueDate || c.date) ? ` · ${(c.issueDate || c.date).slice(0, 4)}` : ''}</div>` : ''}
    </div>
  `).join('');
}
