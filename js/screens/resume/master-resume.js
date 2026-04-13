/* Master Resume Screen */

import { router } from '../../router.js';
import { ResumeRepo } from '../../db/repositories.js';
import { createEmptyState } from '../../components/empty-state.js';
import { createSkeleton } from '../../components/loading-skeleton.js';
import { formatDateRange, timeAgo } from '../../utils/formatters.js';

export async function renderMasterResume() {
  const container = document.getElementById('screen-container');
  const nav = document.getElementById('bottom-nav');
  if (nav) nav.style.display = '';

  // Show skeleton
  container.innerHTML = '';
  container.appendChild(createSkeleton('header'));
  container.appendChild(createSkeleton('card'));

  const resume = await ResumeRepo.getMaster();

  if (!resume) {
    container.innerHTML = '';
    container.appendChild(createEmptyState({
      icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
      title: 'No resume yet',
      description: 'Create your master resume to get started with job matching and optimization.',
      action: {
        label: '+ Create Resume',
        onClick: () => router.navigate('/resume/create'),
      },
    }));
    return;
  }

  renderResume(container, resume);
}

function renderResume(container, resume) {
  const s = resume.sections || {};
  const contact = s.contact || {};

  container.innerHTML = `
    <div class="animate-fade-up" style="padding-bottom:24px">
      <!-- Header card -->
      <div class="resume-header-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div class="resume-name">${contact.name || 'Your Name'}</div>
            ${s.summary ? `<div class="resume-headline">${s.summary.slice(0, 120)}${s.summary.length > 120 ? '…' : ''}</div>` : ''}
          </div>
          <button class="btn-icon" style="color:rgba(255,255,255,0.8)" id="btn-edit-resume" aria-label="Edit resume">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
        </div>
        ${(contact.email || contact.phone || contact.location) ? `
        <div class="resume-contacts">
          ${contact.email ? `<div class="resume-contact-chip"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>${contact.email}</div>` : ''}
          ${contact.phone ? `<div class="resume-contact-chip"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.4 19.79 19.79 0 0 1 1.61 4.82 2 2 0 0 1 3.58 2.64h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.17a16 16 0 0 0 6.29 6.29l1.59-1.59a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/></svg>${contact.phone}</div>` : ''}
          ${contact.location ? `<div class="resume-contact-chip"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${contact.location}</div>` : ''}
        </div>` : ''}
      </div>

      <!-- Quick actions -->
      <div style="display:flex;gap:10px;padding:0 16px 16px;overflow-x:auto">
        <button class="btn btn-sm btn-secondary" id="btn-target-job">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          Target a Job
        </button>
        <button class="btn btn-sm btn-secondary" id="btn-export-resume">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export PDF
        </button>
        <button class="btn btn-sm btn-secondary" id="btn-ai-setup">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          AI Setup
        </button>
      </div>

      <!-- Sections -->
      ${renderSummarySection(s.summary)}
      ${renderExperienceSection(s.experience || [])}
      ${renderEducationSection(s.education || [])}
      ${renderSkillsSection(s.skills || [])}
      ${renderProjectsSection(s.projects || [])}
      ${renderCertsSection(s.certifications || [])}

      <!-- Meta -->
      <div style="padding:16px;text-align:center">
        <p style="font-size:11px;color:var(--color-text-tertiary)">Last updated ${timeAgo(resume.updatedAt)}</p>
      </div>
    </div>
  `;

  // Bind actions
  document.getElementById('btn-edit-resume').addEventListener('click', () =>
    router.navigate('/resume/edit/contact'));
  document.getElementById('btn-target-job').addEventListener('click', () =>
    router.navigate('/jobs/add'));
  document.getElementById('btn-export-resume').addEventListener('click', () =>
    router.navigate('/export'));
  document.getElementById('btn-ai-setup').addEventListener('click', () =>
    router.navigate('/onboarding/ai'));

  // Section expand/collapse
  container.addEventListener('click', (e) => {
    const header = e.target.closest('.section-card-header');
    if (!header) return;
    const body = header.nextElementSibling;
    const chevron = header.querySelector('.section-chevron');
    if (body && body.classList.contains('section-card-body')) {
      const isOpen = body.style.display !== 'none';
      body.style.display = isOpen ? 'none' : '';
      if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
    }
  });

  // Edit section buttons
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-edit-section');
    if (!btn) return;
    const section = btn.dataset.section;
    router.navigate(`/resume/edit/${section}`);
  });
}

function sectionCard(icon, title, section, content) {
  return `
    <div class="section-card">
      <div class="section-card-header">
        <div class="section-card-title">
          <div class="section-card-icon">${icon}</div>
          ${title}
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <button class="btn-icon btn-edit-section" data-section="${section}" aria-label="Edit ${title}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
          <svg class="section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition:transform 200ms;color:var(--color-text-tertiary)"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      <div class="section-card-body">
        ${content}
      </div>
    </div>
  `;
}

function renderSummarySection(summary) {
  if (!summary) return '';
  return sectionCard(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    'Summary', 'summary',
    `<p style="font-size:14px;color:var(--color-text-secondary);line-height:1.7;padding-top:12px">${summary}</p>`
  );
}

function renderExperienceSection(experience) {
  if (!experience.length) return sectionCard(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    'Experience', 'experience',
    `<div style="padding:16px 0;color:var(--color-text-tertiary);font-size:13px;text-align:center">No experience added yet</div>`
  );

  const items = experience.map(exp => `
    <div class="experience-item">
      <div class="experience-header">
        <div>
          <div class="experience-role">${exp.role || 'Unknown Role'}</div>
          <div class="experience-company">${exp.company || ''}${exp.location ? ` · ${exp.location}` : ''}</div>
        </div>
        <div class="experience-date">
          ${exp.startDate ? formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) : ''}
        </div>
      </div>
      ${(exp.bullets || []).length > 0 ? `
      <ul class="experience-bullets">
        ${exp.bullets.map(b => `<li>${b}</li>`).join('')}
      </ul>` : ''}
    </div>
  `).join('');

  return sectionCard(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    'Experience', 'experience', items
  );
}

function renderEducationSection(education) {
  if (!education.length) return '';
  const items = education.map(edu => `
    <div class="experience-item">
      <div class="experience-header">
        <div>
          <div class="experience-role">${edu.degree || ''}${edu.field ? ` in ${edu.field}` : ''}</div>
          <div class="experience-company">${edu.institution || ''}</div>
          ${edu.gpa ? `<div style="font-size:12px;color:var(--color-text-tertiary)">GPA: ${edu.gpa}</div>` : ''}
        </div>
        <div class="experience-date">${edu.graduationDate ? edu.graduationDate.slice(0,4) : ''}</div>
      </div>
    </div>
  `).join('');

  return sectionCard(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    'Education', 'education', items
  );
}

function renderSkillsSection(skills) {
  if (!skills.length) return '';

  // Separate into technical (contains known patterns), tools, and general
  const technical = [], tools = [], general = [];
  const toolPatterns = /\b(aws|azure|gcp|docker|kubernetes|git|jira|figma|excel|sql|linux|windows|mac|jenkins|terraform|grafana|datadog|salesforce|slack|notion|asana|trello|adobe|photoshop|illustrator|vs\s?code|xcode|android studio)\b/i;
  const techPatterns = /\b(python|javascript|typescript|java|c\+\+|c#|ruby|go|rust|swift|kotlin|react|angular|vue|node|django|flask|spring|rails|nextjs|graphql|rest|api|html|css|sql|nosql|mongodb|postgres|mysql|redis|kafka|spark|hadoop|ml|ai|nlp|deep learning|machine learning|tensorflow|pytorch|scikit)\b/i;

  skills.forEach(s => {
    const name = typeof s === 'string' ? s : s.name || '';
    if (!name) return;
    if (techPatterns.test(name)) technical.push(name);
    else if (toolPatterns.test(name)) tools.push(name);
    else general.push(name);
  });

  let html = '';
  if (technical.length) {
    html += `<div class="skills-category-label">Technical</div>
      <div class="skills-grid">${technical.map(n => `<span class="tag tag-primary">${n}</span>`).join('')}</div>`;
  }
  if (tools.length) {
    html += `<div class="skills-category-label">Tools &amp; Platforms</div>
      <div class="skills-grid">${tools.map(n => `<span class="tag tag-neutral">${n}</span>`).join('')}</div>`;
  }
  if (general.length) {
    html += `<div class="skills-category-label">Other</div>
      <div class="skills-grid">${general.map(n => `<span class="tag tag-neutral">${n}</span>`).join('')}</div>`;
  }
  if (!html) {
    // fallback flat
    html = `<div class="skills-grid">${skills.map(s => {
      const name = typeof s === 'string' ? s : s.name || '';
      return `<span class="tag tag-primary">${name}</span>`;
    }).join('')}</div>`;
  }

  return sectionCard(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    'Skills', 'skills', html
  );
}

function renderProjectsSection(projects) {
  if (!projects.length) return '';
  const items = projects.map(p => `
    <div class="experience-item">
      <div class="experience-role">${p.name}</div>
      ${p.description ? `<p style="font-size:13px;color:var(--color-text-secondary);margin-top:4px;line-height:1.5">${p.description}</p>` : ''}
      ${(p.technologies || []).length > 0 ? `
      <div class="skills-grid" style="margin-top:8px">
        ${p.technologies.map(t => `<span class="tag tag-neutral">${t}</span>`).join('')}
      </div>` : ''}
    </div>
  `).join('');

  return sectionCard(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    'Projects', 'projects', items
  );
}

function renderCertsSection(certs) {
  if (!certs.length) return '';
  const items = certs.map(c => `
    <div class="experience-item" style="padding:8px 0">
      <div style="font-weight:600;font-size:14px">${c.name}</div>
      ${c.issuer ? `<div style="font-size:12px;color:var(--color-text-secondary)">${c.issuer}${c.date ? ` · ${c.date.slice(0,4)}` : ''}</div>` : ''}
    </div>
  `).join('');

  return sectionCard(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
    'Certifications', 'certifications', items
  );
}
