/* Section Editor Screen */

import { router } from '../../router.js';
import { ResumeRepo } from '../../db/repositories.js';
import { toast } from '../../components/toast.js';
import { debounce } from '../../utils/debounce.js';
import { shortId } from '../../utils/formatters.js';

export async function renderSectionEditor({ section }) {
  const container = document.getElementById('screen-container');
  const nav = document.getElementById('bottom-nav'); if (nav) nav.style.display = '';

  const resume = await ResumeRepo.getMaster();
  if (!resume) {
    router.navigate('/resume/create');
    return;
  }

  const sections = resume.sections || {};
  let data = sections[section];

  const saveSection = debounce(async (newData) => {
    await ResumeRepo.updateSection(resume.id, section, newData);
    toast.info('Saved', 1500);
  }, 800);

  const sectionTitles = {
    contact: 'Contact Info',
    summary: 'Professional Summary',
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    certifications: 'Certifications',
    awards: 'Awards',
  };

  // Update header
  const headerTitle = document.getElementById('header-screen-title');
  if (headerTitle) {
    headerTitle.textContent = sectionTitles[section] || 'Edit Section';
    headerTitle.classList.add('visible');
  }

  const back = document.getElementById('header-back');
  if (back) {
    back.style.display = 'flex';
    back.onclick = () => {
      headerTitle?.classList.remove('visible');
      back.style.display = 'none';
      router.navigate('/resume');
    };
  }

  container.innerHTML = `
    <div class="page animate-fade-up" id="section-editor-page">
      <div style="margin-bottom:20px">
        <h2 class="page-title">${sectionTitles[section] || 'Edit Section'}</h2>
      </div>
      <div id="editor-content"></div>
      <div style="margin-top:24px;display:flex;gap:12px">
        <button class="btn btn-primary btn-block" id="btn-save-section">Save Changes</button>
        <button class="btn btn-secondary" id="btn-cancel-section">Cancel</button>
      </div>
    </div>
  `;

  const editorContent = document.getElementById('editor-content');

  // Render editor based on section type
  if (section === 'contact') renderContactEditor(editorContent, data || {}, saveSection);
  else if (section === 'summary') renderSummaryEditor(editorContent, data || '', saveSection);
  else if (section === 'experience') renderExperienceEditor(editorContent, data || [], saveSection, resume.id, section);
  else if (section === 'education') renderEducationEditor(editorContent, data || [], saveSection, resume.id, section);
  else if (section === 'skills') renderSkillsEditor(editorContent, data || [], saveSection, resume.id, section);
  else {
    editorContent.innerHTML = `<p style="color:var(--color-text-secondary)">Section editor coming soon.</p>`;
  }

  document.getElementById('btn-save-section').addEventListener('click', async () => {
    await saveCurrentSection();
    router.navigate('/resume');
  });

  document.getElementById('btn-cancel-section').addEventListener('click', () => {
    router.navigate('/resume');
  });

  async function saveCurrentSection() {
    const newData = collectCurrentData();
    if (newData !== null) {
      await ResumeRepo.updateSection(resume.id, section, newData);
      toast.success('Changes saved!');
    }
  }

  function collectCurrentData() {
    if (section === 'contact') return collectContact();
    if (section === 'summary') return document.getElementById('summary-input')?.value?.trim() || '';
    if (section === 'skills') return collectSkills();
    return null;
  }

  function collectContact() {
    return {
      name: v('contact-name'),
      email: v('contact-email'),
      phone: v('contact-phone'),
      location: v('contact-location'),
      linkedin: v('contact-linkedin'),
      website: v('contact-website'),
    };
  }

  function collectSkills() {
    return [...document.querySelectorAll('.skill-input')]
      .map(i => i.value.trim())
      .filter(Boolean);
  }

  function v(id) { return document.getElementById(id)?.value?.trim() || ''; }
}

function renderContactEditor(container, data, onChange) {
  container.innerHTML = `
    <div class="form-group">
      <label class="form-label required">Full Name</label>
      <input type="text" id="contact-name" class="form-input" value="${data.name || ''}" placeholder="Jane Smith" />
    </div>
    <div class="form-group">
      <label class="form-label">Email</label>
      <input type="email" id="contact-email" class="form-input" value="${data.email || ''}" placeholder="jane@example.com" />
    </div>
    <div class="form-group">
      <label class="form-label">Phone</label>
      <input type="tel" id="contact-phone" class="form-input" value="${data.phone || ''}" placeholder="+1 555 000 0000" />
    </div>
    <div class="form-group">
      <label class="form-label">Location</label>
      <input type="text" id="contact-location" class="form-input" value="${data.location || ''}" placeholder="San Francisco, CA" />
    </div>
    <div class="form-group">
      <label class="form-label">LinkedIn URL</label>
      <input type="url" id="contact-linkedin" class="form-input" value="${data.linkedin || ''}" placeholder="https://linkedin.com/in/jane" />
    </div>
    <div class="form-group">
      <label class="form-label">Website / Portfolio</label>
      <input type="url" id="contact-website" class="form-input" value="${data.website || ''}" placeholder="https://jane.dev" />
    </div>
  `;
}

function renderSummaryEditor(container, data, onChange) {
  container.innerHTML = `
    <div class="form-group">
      <label class="form-label">Professional Summary</label>
      <textarea
        id="summary-input"
        class="form-textarea"
        placeholder="Write a compelling 3-4 sentence summary of your professional background and value proposition..."
        style="min-height:180px"
      >${data || ''}</textarea>
      <p class="form-hint">Aim for 3–5 sentences. Focus on your key expertise and value.</p>
    </div>
  `;

  document.getElementById('summary-input').addEventListener('input', (e) => {
    onChange(e.target.value);
  });
}

function renderExperienceEditor(container, data, onChange, resumeId, section) {
  const render = () => {
    container.innerHTML = `
      <div id="exp-list">
        ${data.map((exp, i) => renderExpItem(exp, i)).join('')}
      </div>
      <button class="btn btn-outline btn-block" id="btn-add-exp" style="margin-top:12px">
        + Add Experience
      </button>
    `;
    bindExpHandlers();
  };

  render();

  function renderExpItem(exp, i) {
    return `
      <div class="card" style="padding:16px;margin-bottom:12px" data-exp-index="${i}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <strong style="font-size:14px">${exp.role || 'New Position'}</strong>
          <button class="btn-icon btn-remove-exp" data-index="${i}" aria-label="Remove">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
        <div class="form-group" style="margin-bottom:8px">
          <input type="text" class="form-input exp-role" data-index="${i}" value="${exp.role || ''}" placeholder="Job Title" style="margin-bottom:8px" />
          <input type="text" class="form-input exp-company" data-index="${i}" value="${exp.company || ''}" placeholder="Company" style="margin-bottom:8px" />
          <div style="display:flex;gap:8px">
            <input type="month" class="form-input exp-start" data-index="${i}" value="${exp.startDate || ''}" placeholder="Start" style="flex:1" />
            <input type="month" class="form-input exp-end" data-index="${i}" value="${exp.endDate || ''}" placeholder="End" style="flex:1" ${exp.isCurrent ? 'disabled' : ''} />
          </div>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-top:8px">
            <input type="checkbox" class="exp-current" data-index="${i}" ${exp.isCurrent ? 'checked' : ''} />
            Currently working here
          </label>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:12px">Achievements / Bullets</label>
          <textarea class="form-textarea exp-bullets" data-index="${i}" style="min-height:100px;font-size:13px" placeholder="One achievement per line...">${(exp.bullets || []).join('\n')}</textarea>
        </div>
      </div>
    `;
  }

  function bindExpHandlers() {
    document.getElementById('btn-add-exp')?.addEventListener('click', () => {
      data.push({ role: '', company: '', startDate: '', endDate: null, isCurrent: false, bullets: [] });
      render();
    });

    container.querySelectorAll('.btn-remove-exp').forEach(btn => {
      btn.addEventListener('click', () => {
        data.splice(parseInt(btn.dataset.index), 1);
        render();
        onChange(data);
      });
    });

    container.querySelectorAll('.exp-role').forEach(input => {
      input.addEventListener('input', (e) => {
        data[e.target.dataset.index].role = e.target.value;
        onChange(data);
      });
    });

    container.querySelectorAll('.exp-company').forEach(input => {
      input.addEventListener('input', (e) => {
        data[e.target.dataset.index].company = e.target.value;
        onChange(data);
      });
    });

    container.querySelectorAll('.exp-start').forEach(input => {
      input.addEventListener('change', (e) => {
        data[e.target.dataset.index].startDate = e.target.value;
        onChange(data);
      });
    });

    container.querySelectorAll('.exp-end').forEach(input => {
      input.addEventListener('change', (e) => {
        data[e.target.dataset.index].endDate = e.target.value || null;
        onChange(data);
      });
    });

    container.querySelectorAll('.exp-current').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const i = parseInt(e.target.dataset.index);
        data[i].isCurrent = e.target.checked;
        const endInput = container.querySelector(`.exp-end[data-index="${i}"]`);
        if (endInput) endInput.disabled = e.target.checked;
        onChange(data);
      });
    });

    container.querySelectorAll('.exp-bullets').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        data[e.target.dataset.index].bullets = e.target.value.split('\n').filter(Boolean);
        onChange(data);
      });
    });
  }
}

function renderEducationEditor(container, data, onChange, resumeId, section) {
  const render = () => {
    container.innerHTML = `
      <div>
        ${data.map((edu, i) => `
          <div class="card" style="padding:16px;margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <strong style="font-size:14px">${edu.institution || 'New Education'}</strong>
              <button class="btn-icon btn-remove-edu" data-index="${i}" aria-label="Remove">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
            <input type="text" class="form-input edu-degree" data-index="${i}" value="${edu.degree || ''}" placeholder="Degree (e.g. Bachelor of Science)" style="margin-bottom:8px" />
            <input type="text" class="form-input edu-field" data-index="${i}" value="${edu.field || ''}" placeholder="Field of Study" style="margin-bottom:8px" />
            <input type="text" class="form-input edu-institution" data-index="${i}" value="${edu.institution || ''}" placeholder="University / College" style="margin-bottom:8px" />
            <div style="display:flex;gap:8px">
              <input type="month" class="form-input edu-grad" data-index="${i}" value="${edu.graduationDate || ''}" placeholder="Graduation" style="flex:1" />
              <input type="text" class="form-input edu-gpa" data-index="${i}" value="${edu.gpa || ''}" placeholder="GPA (optional)" style="flex:1" />
            </div>
          </div>
        `).join('')}
        <button class="btn btn-outline btn-block btn-add-edu">+ Add Education</button>
      </div>
    `;

    container.querySelector('.btn-add-edu')?.addEventListener('click', () => {
      data.push({ degree: '', field: '', institution: '', graduationDate: null, gpa: null });
      render();
    });

    container.querySelectorAll('.btn-remove-edu').forEach(btn => {
      btn.addEventListener('click', () => {
        data.splice(parseInt(btn.dataset.index), 1);
        render();
        onChange(data);
      });
    });

    ['edu-degree', 'edu-field', 'edu-institution', 'edu-gpa'].forEach(cls => {
      container.querySelectorAll(`.${cls}`).forEach(input => {
        const key = cls.replace('edu-', '');
        input.addEventListener('input', (e) => {
          data[e.target.dataset.index][key] = e.target.value;
          onChange(data);
        });
      });
    });
  };

  render();
}

function renderSkillsEditor(container, data, onChange, resumeId, section) {
  const skillsList = Array.isArray(data) ? data.map(s => typeof s === 'string' ? s : s.name || '') : [];

  container.innerHTML = `
    <div>
      <div id="skills-list" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
        ${skillsList.map((s, i) => `
          <div style="display:flex;gap:8px;align-items:center">
            <input type="text" class="form-input skill-input" value="${s}" placeholder="Skill name" style="flex:1" data-index="${i}" />
            <button class="btn-icon btn-remove-skill" data-index="${i}" aria-label="Remove">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-outline btn-block" id="btn-add-skill">+ Add Skill</button>
      <p class="form-hint" style="margin-top:8px">Add skills one per row, or paste comma-separated list below</p>
      <textarea id="skills-bulk" class="form-textarea" placeholder="React, TypeScript, Node.js, AWS..." style="margin-top:8px;min-height:80px"></textarea>
      <button class="btn btn-secondary btn-sm" id="btn-bulk-add" style="margin-top:8px">Add from list</button>
    </div>
  `;

  document.getElementById('btn-add-skill')?.addEventListener('click', () => {
    const list = document.getElementById('skills-list');
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;gap:8px;align-items:center';
    div.innerHTML = `
      <input type="text" class="form-input skill-input" placeholder="Skill name" style="flex:1" />
      <button class="btn-icon btn-remove-skill" aria-label="Remove">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;
    div.querySelector('.btn-remove-skill').addEventListener('click', () => div.remove());
    list.appendChild(div);
  });

  document.getElementById('btn-bulk-add')?.addEventListener('click', () => {
    const bulk = document.getElementById('skills-bulk').value;
    const newSkills = bulk.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
    const list = document.getElementById('skills-list');
    newSkills.forEach(skill => {
      const div = document.createElement('div');
      div.style.cssText = 'display:flex;gap:8px;align-items:center';
      div.innerHTML = `
        <input type="text" class="form-input skill-input" value="${skill}" placeholder="Skill name" style="flex:1" />
        <button class="btn-icon btn-remove-skill" aria-label="Remove">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      `;
      div.querySelector('.btn-remove-skill').addEventListener('click', () => div.remove());
      list.appendChild(div);
    });
    document.getElementById('skills-bulk').value = '';
  });

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-remove-skill');
    if (btn) btn.closest('div').remove();
  });
}
