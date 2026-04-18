/* Job List Screen */

import { router } from '../../router.js';
import { JobRepo } from '../../db/repositories.js';
import { createEmptyState } from '../../components/empty-state.js';
import { createSkeleton } from '../../components/loading-skeleton.js';
import { scoreColorClass, timeAgo } from '../../utils/formatters.js';
import { scoreBadge } from '../../components/score-ring.js';

const STATUS_LABELS = { draft: 'Draft', saved: 'Saved', applied: 'Applied', interview: 'Interview', offer: 'Offer', rejected: 'Rejected' };
const STATUS_COLORS = { draft: 'var(--color-text-tertiary)', saved: '#5E9B6E', applied: '#2980B9', interview: '#8E44AD', offer: 'var(--color-primary)', rejected: 'var(--color-error)' };

// Map legacy 'active' status to 'saved'
function normaliseStatus(status) {
  return status === 'active' ? 'saved' : (status || 'draft');
}

let activeFilter = 'all';
let sortMode = 'date';

export async function renderJobList() {
  const container = document.getElementById('screen-container');
  const nav = document.getElementById('bottom-nav'); if (nav) nav.style.display = '';

  container.innerHTML = '';
  const skeleton = createSkeleton('list');
  container.appendChild(skeleton);

  const allJobs = await JobRepo.getAll();

  const renderList = () => {
    let jobs = activeFilter === 'all' ? allJobs : allJobs.filter(j => (normaliseStatus(j.status)) === activeFilter);

    if (sortMode === 'score') {
      jobs = [...jobs].sort((a, b) => (b.matchResult?.overallScore ?? -1) - (a.matchResult?.overallScore ?? -1));
    } else {
      jobs = [...jobs].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    document.getElementById('jobs-list').innerHTML = jobs.length === 0
      ? `<div style="padding:40px 16px;text-align:center;color:var(--color-text-tertiary);font-size:14px">No jobs in this category</div>`
      : jobs.map(job => renderJobCard(job)).join('');
  };

  const filterCounts = {};
  ['all', 'draft', 'saved', 'applied', 'interview', 'offer', 'rejected'].forEach(f => {
    filterCounts[f] = f === 'all' ? allJobs.length : allJobs.filter(j => (normaliseStatus(j.status)) === f).length;
  });

  container.innerHTML = `
    <div class="animate-fade-up">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:24px 16px 12px">
        <div>
          <h2 class="page-title">Job Targets</h2>
          <p class="page-subtitle">${allJobs.length} saved</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="btn btn-ghost btn-sm" id="btn-sort" title="Sort">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            ${sortMode === 'score' ? 'By Score' : 'By Date'}
          </button>
          <button class="btn btn-primary btn-sm" id="btn-add-job">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Job
          </button>
        </div>
      </div>

      <!-- Filter tabs -->
      <div class="job-filter-tabs" id="job-filter-tabs">
        ${['all', 'draft', 'saved', 'applied', 'interview', 'offer', 'rejected'].map(f => `
          <button class="job-filter-tab ${activeFilter === f ? 'active' : ''}" data-filter="${f}">
            ${f === 'all' ? 'All' : STATUS_LABELS[f]}
            ${filterCounts[f] > 0 ? `<span class="job-filter-count">${filterCounts[f]}</span>` : ''}
          </button>
        `).join('')}
      </div>

      <div id="jobs-list"></div>
    </div>
  `;

  renderList();

  if (allJobs.length === 0) {
    document.getElementById('jobs-list').appendChild(createEmptyState({
      icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      title: 'No jobs yet',
      description: 'Add a job description to start matching your resume and getting optimization suggestions.',
      action: { label: '+ Add First Job', onClick: () => router.navigate('/jobs/add') },
    }));
  }

  document.getElementById('btn-add-job').addEventListener('click', () => router.navigate('/jobs/add'));

  document.getElementById('btn-sort').addEventListener('click', (e) => {
    sortMode = sortMode === 'date' ? 'score' : 'date';
    e.currentTarget.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
      ${sortMode === 'score' ? 'By Score' : 'By Date'}
    `;
    renderList();
  });

  document.getElementById('job-filter-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.job-filter-tab');
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    document.querySelectorAll('.job-filter-tab').forEach(b => b.classList.toggle('active', b.dataset.filter === activeFilter));
    renderList();
  });

  container.addEventListener('click', (e) => {
    const card = e.target.closest('.job-card');
    if (!card) return;
    const jobId = card.dataset.jobId;
    if (jobId) router.navigate(`/jobs/${jobId}`);
  });
}

function renderJobCard(job) {
  const score = job.matchResult?.overallScore;
  const initials = (job.company || '?').slice(0, 2).toUpperCase();
  const colors = ['#4A7C59', '#2980B9', '#8E44AD', '#E67E22', '#C0392B'];
  const colorIdx = job.company?.charCodeAt(0) % colors.length || 0;
  const color = colors[colorIdx];
  const status = normaliseStatus(job.status);
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.draft;

  const scoreHTML = score != null ? `
    <div class="job-card-score">
      ${scoreBadge(score).outerHTML}
      <span style="font-size:10px;color:var(--color-text-tertiary)">match</span>
    </div>
  ` : `
    <div class="job-card-score">
      <span style="font-size:11px;color:var(--color-text-tertiary)">—</span>
    </div>
  `;

  return `
    <div class="job-card" data-job-id="${job.id}">
      <div class="job-card-logo" style="background:${color}20;color:${color};border-color:${color}40">
        ${initials}
      </div>
      <div class="job-card-info">
        <div style="display:flex;align-items:center;gap:6px">
          <div class="job-card-title">${escHtml(job.title)}</div>
          <span class="job-status-badge" style="color:${statusColor};border-color:${statusColor}20;background:${statusColor}12">${STATUS_LABELS[status] || status}</span>
        </div>
        <div class="job-card-company">${escHtml(job.company || 'Unknown')}${job.location ? ` · ${escHtml(job.location)}` : ''}</div>
        <div style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap">
          ${(job.keywords?.skills || []).slice(0, 3).map(s => `<span class="tag tag-neutral" style="font-size:10px">${escHtml(s)}</span>`).join('')}
        </div>
        <div style="font-size:11px;color:var(--color-text-tertiary);margin-top:4px">${timeAgo(job.createdAt)}</div>
      </div>
      ${scoreHTML}
    </div>
  `;
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
