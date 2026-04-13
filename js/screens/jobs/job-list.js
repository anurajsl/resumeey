/* Job List Screen */

import { router } from '../../router.js';
import { JobRepo } from '../../db/repositories.js';
import { createEmptyState } from '../../components/empty-state.js';
import { createSkeleton } from '../../components/loading-skeleton.js';
import { scoreColorClass, timeAgo } from '../../utils/formatters.js';
import { scoreBadge } from '../../components/score-ring.js';

export async function renderJobList() {
  const container = document.getElementById('screen-container');
  document.getElementById('bottom-nav')?.style && (document.getElementById('bottom-nav').style.display = '';

  container.innerHTML = '';
  const skeleton = createSkeleton('list');
  container.appendChild(skeleton);

  const jobs = await JobRepo.getAll();

  container.innerHTML = `
    <div class="animate-fade-up">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:24px 16px 16px">
        <div>
          <h2 class="page-title">Job Targets</h2>
          <p class="page-subtitle">${jobs.length} saved${jobs.length === 1 ? '' : ''}</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-add-job">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Job
        </button>
      </div>

      <div id="jobs-list">
        ${jobs.length === 0 ? '' : jobs.map(job => renderJobCard(job)).join('')}
      </div>
    </div>
  `;

  if (jobs.length === 0) {
    const listEl = document.getElementById('jobs-list');
    listEl.appendChild(createEmptyState({
      icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      title: 'No jobs yet',
      description: 'Add a job description to start matching your resume and getting optimization suggestions.',
      action: {
        label: '+ Add First Job',
        onClick: () => router.navigate('/jobs/add'),
      },
    }));
  }

  document.getElementById('btn-add-job').addEventListener('click', () => router.navigate('/jobs/add'));

  // Job card click
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

  const scoreHTML = score != null ? `
    <div class="job-card-score">
      ${scoreBadge(score).outerHTML}
      <span style="font-size:10px;color:var(--color-text-tertiary)">match</span>
    </div>
  ` : `
    <div class="job-card-score">
      <span style="font-size:11px;color:var(--color-text-tertiary)">Not scored</span>
    </div>
  `;

  return `
    <div class="job-card" data-job-id="${job.id}">
      <div class="job-card-logo" style="background:${color}20;color:${color};border-color:${color}40">
        ${initials}
      </div>
      <div class="job-card-info">
        <div class="job-card-title">${job.title}</div>
        <div class="job-card-company">${job.company || 'Unknown'}${job.location ? ` · ${job.location}` : ''}</div>
        <div style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap">
          ${(job.keywords?.skills || []).slice(0, 3).map(s => `<span class="tag tag-neutral" style="font-size:10px">${s}</span>`).join('')}
        </div>
        <div style="font-size:11px;color:var(--color-text-tertiary);margin-top:4px">${timeAgo(job.createdAt)}</div>
      </div>
      ${scoreHTML}
    </div>
  `;
}
