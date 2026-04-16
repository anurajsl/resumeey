/* Job Detail Screen */

import { router } from '../../router.js';
import { JobRepo, ResumeRepo } from '../../db/repositories.js';
import { confirmModal } from '../../components/modal.js';
import { toast } from '../../components/toast.js';
import { timeAgo } from '../../utils/formatters.js';
import { scoreBadge } from '../../components/score-ring.js';
import { debounce } from '../../utils/debounce.js';

export async function renderJobDetail({ id }) {
  const container = document.getElementById('screen-container');
  const nav = document.getElementById('bottom-nav'); if (nav) nav.style.display = '';

  const job = await JobRepo.get(id);
  if (!job) {
    toast.error('Job not found');
    router.navigate('/jobs');
    return;
  }

  // Header
  const headerTitle = document.getElementById('header-screen-title');
  const back = document.getElementById('header-back');
  if (headerTitle) { headerTitle.textContent = job.title; headerTitle.classList.add('visible'); }
  if (back) {
    back.style.display = 'flex';
    back.onclick = () => {
      headerTitle?.classList.remove('visible');
      back.style.display = 'none';
      router.navigate('/jobs');
    };
  }

  const score = job.matchResult?.overallScore;
  const kws = job.keywords || {};

  container.innerHTML = `
    <div class="animate-fade-up" style="padding-bottom:24px">
      <!-- Job header -->
      <div style="padding:20px 16px 16px">
        <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:16px">
          <div style="width:52px;height:52px;border-radius:12px;background:var(--color-primary-bg);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;color:var(--color-primary);flex-shrink:0">
            ${(job.company || '?').slice(0, 2).toUpperCase()}
          </div>
          <div style="flex:1">
            <h2 style="font-size:20px;font-weight:700;color:var(--color-text);line-height:1.2">${job.title}</h2>
            <p style="font-size:14px;color:var(--color-text-secondary);margin-top:2px">${job.company || ''}${job.location ? ` · ${job.location}` : ''}</p>
            <p style="font-size:11px;color:var(--color-text-tertiary);margin-top:4px">Added ${timeAgo(job.createdAt)}</p>
          </div>
          ${score != null ? scoreBadge(score).outerHTML : ''}
        </div>

        <!-- Application Status Tracker -->
        <div class="status-tracker" id="status-tracker">
          ${renderStatusSteps(job.status || 'saved')}
        </div>
      </div>

      <!-- Action buttons -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 16px 16px">
        <button class="btn btn-primary" id="btn-match">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          ${score != null ? 'View Match' : 'Run Match'}
        </button>
        <button class="btn btn-secondary" id="btn-optimize">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Optimize
        </button>
        <button class="btn btn-secondary" id="btn-ats">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          ATS Check
        </button>
        <button class="btn btn-secondary" id="btn-cover-letter">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Cover Letter
        </button>

        <!-- Tailor Resume — full-width CTA -->
        <button class="btn ${job.tailoredResumeId ? 'btn-outline' : 'btn-gold'}" id="btn-tailor" style="grid-column:1/-1">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          ${job.tailoredResumeId ? 'View Tailored Resume' : 'Create Tailored Resume'}
        </button>
      </div>

      <!-- Keywords -->
      ${renderKeywordsSection('Required Skills', kws.required || kws.skills || [], 'tag-primary')}
      ${renderKeywordsSection('Preferred Skills', kws.preferred || [], 'tag-neutral')}
      ${renderKeywordsSection('Soft Skills', kws.softSkills || [], 'tag-gold')}

      <!-- Description preview -->
      <div style="padding:0 16px 16px">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Job Description</span>
            <button class="btn-icon" id="btn-toggle-desc" aria-label="Toggle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
          <div class="card-body" id="job-description-body" style="display:none">
            <p style="font-size:13px;color:var(--color-text-secondary);line-height:1.7;white-space:pre-wrap">${job.description || 'No description provided.'}</p>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div style="padding:0 16px 16px">
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Notes
            </span>
            <span id="notes-saved-indicator" style="font-size:11px;color:var(--color-text-tertiary);opacity:0;transition:opacity 400ms"></span>
          </div>
          <div class="card-body" style="padding-top:0">
            <textarea
              id="job-notes-input"
              class="form-textarea"
              placeholder="Track interview prep notes, salary expectations, contacts, deadlines…"
              style="min-height:100px;font-size:13px;border:none;padding:0;resize:vertical;box-shadow:none"
            >${escHtml(job.notes || '')}</textarea>
          </div>
        </div>
      </div>

      <!-- Application Details -->
      <div style="padding:0 16px 16px">
        <div class="card">
          <div class="card-header" id="app-details-header" style="cursor:pointer">
            <span class="card-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Application Details
            </span>
            <svg id="app-details-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition:transform 200ms"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div id="app-details-body" class="card-body" style="display:none;padding-top:4px">
            ${job.appliedAt ? `<p style="font-size:11px;color:var(--color-text-tertiary);margin-bottom:12px">Applied ${timeAgo(job.appliedAt)}</p>` : ''}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-size:11px">Deadline</label>
                <input type="date" id="app-deadline" class="form-input" style="font-size:13px" value="${escHtml(job.deadline || '')}">
              </div>
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-size:11px">Salary (expected)</label>
                <input type="text" id="app-salary" class="form-input" style="font-size:13px" placeholder="e.g. $120k" value="${escHtml(job.salary || '')}">
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-size:11px">Recruiter name</label>
                <input type="text" id="app-recruiter-name" class="form-input" style="font-size:13px" placeholder="Jane Smith" value="${escHtml(job.recruiterName || '')}">
              </div>
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-size:11px">Recruiter email</label>
                <input type="email" id="app-recruiter-email" class="form-input" style="font-size:13px" placeholder="jane@company.com" value="${escHtml(job.recruiterEmail || '')}">
              </div>
            </div>
            <span id="app-details-saved" style="font-size:11px;color:var(--color-text-tertiary);opacity:0;transition:opacity 400ms;display:block;margin-top:8px">Saved</span>
          </div>
        </div>
      </div>

      <!-- Danger zone -->
      <div style="padding:0 16px">
        <button class="btn btn-ghost" id="btn-delete-job" style="color:var(--color-error);width:100%">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Delete Job
        </button>
      </div>
    </div>
  `;

  // Notes auto-save
  const saveNotes = debounce(async (value) => {
    await JobRepo.update(id, { notes: value });
    const indicator = document.getElementById('notes-saved-indicator');
    if (indicator) {
      indicator.textContent = 'Saved';
      indicator.style.opacity = '1';
      setTimeout(() => { indicator.style.opacity = '0'; }, 1500);
    }
  }, 600);

  document.getElementById('job-notes-input')?.addEventListener('input', (e) => {
    saveNotes(e.target.value);
  });

  // Application details toggle
  document.getElementById('app-details-header').addEventListener('click', () => {
    const body = document.getElementById('app-details-body');
    const chevron = document.getElementById('app-details-chevron');
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : '';
    chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
  });

  // Application details auto-save
  const saveAppDetails = debounce(async () => {
    await JobRepo.update(id, {
      deadline: document.getElementById('app-deadline')?.value || '',
      salary: document.getElementById('app-salary')?.value || '',
      recruiterName: document.getElementById('app-recruiter-name')?.value || '',
      recruiterEmail: document.getElementById('app-recruiter-email')?.value || '',
    });
    const ind = document.getElementById('app-details-saved');
    if (ind) { ind.style.opacity = '1'; setTimeout(() => { ind.style.opacity = '0'; }, 1500); }
  }, 600);

  ['app-deadline', 'app-salary', 'app-recruiter-name', 'app-recruiter-email'].forEach(fieldId => {
    document.getElementById(fieldId)?.addEventListener('input', saveAppDetails);
  });

  // Status tracker
  document.getElementById('status-tracker').addEventListener('click', async (e) => {
    const btn = e.target.closest('.status-step');
    if (!btn) return;
    const newStatus = btn.dataset.status;
    const updates = { status: newStatus };
    // Auto-stamp applied date on first transition to applied
    if (newStatus === 'applied' && !job.appliedAt) {
      updates.appliedAt = new Date().toISOString();
    }
    await JobRepo.update(id, updates);
    document.getElementById('status-tracker').innerHTML = renderStatusSteps(newStatus);
    toast.info(`Status: ${STATUS_LABELS[newStatus]}`);
  });

  // Button actions
  document.getElementById('btn-match').addEventListener('click', () => router.navigate(`/match/${id}`));
  document.getElementById('btn-optimize').addEventListener('click', () => router.navigate(`/optimize/${id}`));
  document.getElementById('btn-ats').addEventListener('click', () => router.navigate(`/ats/${id}`));
  document.getElementById('btn-cover-letter').addEventListener('click', () => router.navigate(`/cover-letter/${id}`));

  document.getElementById('btn-tailor').addEventListener('click', async () => {
    // If tailored resume already exists, navigate to it
    if (job.tailoredResumeId) {
      router.navigate(`/resume/tailored/${job.tailoredResumeId}`);
      return;
    }

    // Fork master resume
    const master = await ResumeRepo.getMaster();
    if (!master) { toast.error('Create a master resume first'); return; }

    const btn = document.getElementById('btn-tailor');
    btn.disabled = true;
    btn.textContent = 'Creating…';

    try {
      const tailored = await ResumeRepo.create({
        name: `${job.title}${job.company ? ' @ ' + job.company : ''} — Tailored`,
        type: 'tailored',
        parentId: master.id,
        sections: JSON.parse(JSON.stringify(master.sections)),
        metadata: {
          sourceType: 'tailored',
          jobId: id,
          jobTitle: job.title,
          jobCompany: job.company || '',
          version: 1,
          parseConfidence: 1,
        },
      });

      // Link tailored resume to job
      await JobRepo.update(id, { tailoredResumeId: tailored.id });

      toast.success('Tailored resume created!');
      router.navigate(`/resume/tailored/${tailored.id}`);
    } catch (err) {
      toast.error('Failed to create tailored resume: ' + err.message);
      btn.disabled = false;
      btn.textContent = 'Create Tailored Resume';
    }
  });

  // Toggle description
  document.getElementById('btn-toggle-desc').addEventListener('click', () => {
    const body = document.getElementById('job-description-body');
    const chevron = document.querySelector('#btn-toggle-desc svg');
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : '';
    if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
  });

  // Delete
  document.getElementById('btn-delete-job').addEventListener('click', async () => {
    const confirmed = await confirmModal({
      title: 'Delete Job',
      message: 'This will permanently delete this job target and all associated match results. Are you sure?',
      confirmText: 'Delete',
      danger: true,
    });
    if (confirmed) {
      await JobRepo.delete(id);
      toast.success('Job deleted');
      headerTitle?.classList.remove('visible');
      back.style.display = 'none';
      router.navigate('/jobs');
    }
  });
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const STATUS_LABELS = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

const STATUS_ORDER = ['saved', 'applied', 'interview', 'offer'];

function renderStatusSteps(current) {
  const isRejected = current === 'rejected';
  const steps = STATUS_ORDER.map(s => {
    const currentIdx = STATUS_ORDER.indexOf(current);
    const stepIdx = STATUS_ORDER.indexOf(s);
    const isDone = !isRejected && stepIdx <= currentIdx;
    const isActive = s === current;
    return `
      <button class="status-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}" data-status="${s}" title="Mark as ${STATUS_LABELS[s]}">
        <div class="status-step-dot"></div>
        <span class="status-step-label">${STATUS_LABELS[s]}</span>
      </button>
    `;
  }).join('<div class="status-step-line"></div>');

  const rejectBtn = `
    <button class="status-step ${isRejected ? 'rejected active' : ''}" data-status="rejected" title="Mark as Rejected" style="margin-left:auto">
      <div class="status-step-dot"></div>
      <span class="status-step-label">Rejected</span>
    </button>
  `;

  return `<div class="status-steps">${steps}</div>${rejectBtn}`;
}

function renderKeywordsSection(title, keywords, tagClass) {
  if (!keywords.length) return '';
  return `
    <div style="padding:0 16px 12px">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-secondary);margin-bottom:8px">${title}</p>
      <div class="chip-group">
        ${keywords.map(k => `<span class="tag ${tagClass}">${k}</span>`).join('')}
      </div>
    </div>
  `;
}
