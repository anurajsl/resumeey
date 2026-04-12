/* Match Dashboard Screen */

import { router } from '../../router.js';
import { JobRepo, ResumeRepo } from '../../db/repositories.js';
import { scoreMatch } from '../../services/match-engine.js';
import { createScoreRing } from '../../components/score-ring.js';
import { createSkeleton } from '../../components/loading-skeleton.js';
import { toast } from '../../components/toast.js';
import { scoreColorClass, scoreLabel } from '../../utils/formatters.js';

export async function renderMatchDashboard({ jobId }) {
  const container = document.getElementById('screen-container');
  document.getElementById('bottom-nav').style.display = '';

  container.innerHTML = '';
  container.appendChild(createSkeleton('header'));
  container.appendChild(createSkeleton('card'));

  const [job, resume] = await Promise.all([
    JobRepo.get(jobId),
    ResumeRepo.getMaster(),
  ]);

  if (!job) {
    toast.error('Job not found');
    router.navigate('/jobs');
    return;
  }

  if (!resume) {
    toast.warning('Please create your resume first');
    router.navigate('/resume/create');
    return;
  }

  // Header
  const headerTitle = document.getElementById('header-screen-title');
  const back = document.getElementById('header-back');
  if (headerTitle) { headerTitle.textContent = 'Match Score'; headerTitle.classList.add('visible'); }
  if (back) {
    back.style.display = 'flex';
    back.onclick = () => {
      headerTitle?.classList.remove('visible');
      back.style.display = 'none';
      router.navigate(`/jobs/${jobId}`);
    };
  }

  // Run match (or use cached)
  let result = job.matchResult;
  if (!result) {
    try {
      result = scoreMatch(resume, job.keywords || {});
      await JobRepo.update(jobId, { matchResult: result });
    } catch (err) {
      toast.error('Match scoring failed: ' + err.message);
      result = { overallScore: 0, skillMatch: 0, experienceMatch: 0, keywordMatch: 0, educationMatch: 0, missingKeywords: [], strengths: [], weakAreas: [] };
    }
  }

  const overall = result.overallScore || 0;
  const colorClass = scoreColorClass(overall);

  container.innerHTML = `
    <div class="animate-fade-up" style="padding-bottom:24px">
      <!-- Match header -->
      <div class="match-header">
        <h3 style="font-size:14px;font-weight:600;color:var(--color-text-secondary);margin-bottom:16px">${job.title}${job.company ? ` at ${job.company}` : ''}</h3>
        <div class="match-score-ring-wrap" id="score-ring-container"></div>
        <div style="margin-top:8px">
          <span class="badge ${getBadgeClass(overall)}" style="font-size:13px;padding:4px 12px">${scoreLabel(overall)}</span>
        </div>
        <p style="font-size:13px;color:var(--color-text-secondary);margin-top:8px">
          ${getMatchMessage(overall)}
        </p>
      </div>

      <!-- Score breakdown -->
      <div class="match-stats-row">
        ${renderStatCard('Skills', result.skillMatch, '%')}
        ${renderStatCard('Experience', result.experienceMatch, '%')}
        ${renderStatCard('Keywords', result.keywordMatch, '%')}
        ${renderStatCard('Education', result.educationMatch, '%')}
      </div>

      <!-- Action buttons -->
      <div style="display:flex;gap:10px;padding:0 16px 16px">
        <button class="btn btn-primary" id="btn-optimize" style="flex:1">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Optimize Resume
        </button>
        <button class="btn btn-secondary" id="btn-ats" style="flex:1">
          ATS Check
        </button>
      </div>

      <!-- Missing keywords -->
      ${(result.missingKeywords || []).length > 0 ? `
      <div class="keyword-section">
        <div class="keyword-section-title">Missing Keywords</div>
        <div class="chip-group">
          ${result.missingKeywords.map(k => `<span class="tag tag-missing">${k}</span>`).join('')}
        </div>
        <p style="font-size:12px;color:var(--color-text-tertiary);margin-top:8px">Add these to improve your ATS score</p>
      </div>` : ''}

      <!-- Matched keywords -->
      ${(result.matchedKeywords || []).length > 0 ? `
      <div class="keyword-section">
        <div class="keyword-section-title">Matched Keywords</div>
        <div class="chip-group">
          ${result.matchedKeywords.slice(0, 15).map(k => `<span class="tag tag-success">${k}</span>`).join('')}
        </div>
      </div>` : ''}

      <!-- Strengths -->
      ${(result.strengths || []).length > 0 ? `
      <div class="keyword-section">
        <div class="keyword-section-title">Your Strengths</div>
        <div class="card">
          <div class="card-body" style="padding:12px 16px">
            ${result.strengths.map(s => `
              <div class="insight-item">
                <div class="insight-dot good"></div>
                <span class="insight-text">${s}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>` : ''}

      <!-- Weak areas -->
      ${(result.weakAreas || []).length > 0 ? `
      <div class="keyword-section">
        <div class="keyword-section-title">Areas to Improve</div>
        <div class="card">
          <div class="card-body" style="padding:12px 16px">
            ${result.weakAreas.map(w => `
              <div class="insight-item">
                <div class="insight-dot warning"></div>
                <span class="insight-text">${w}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>` : ''}

      <!-- Re-run button -->
      <div style="padding:0 16px">
        <button class="btn btn-ghost btn-block" id="btn-rerun">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Re-run Match Score
        </button>
      </div>
    </div>
  `;

  // Add score ring
  const ringContainer = document.getElementById('score-ring-container');
  if (ringContainer) {
    ringContainer.appendChild(createScoreRing(overall, { size: 140, strokeWidth: 10, animate: true }));
  }

  // Button actions
  document.getElementById('btn-optimize').addEventListener('click', () => router.navigate(`/optimize/${jobId}`));
  document.getElementById('btn-ats').addEventListener('click', () => router.navigate(`/ats/${jobId}`));
  document.getElementById('btn-rerun').addEventListener('click', async () => {
    await JobRepo.update(jobId, { matchResult: null });
    renderMatchDashboard({ jobId });
  });
}

function renderStatCard(label, score, unit = '') {
  const cls = scoreColorClass(score || 0);
  return `
    <div class="stat-card">
      <div class="stat-value ${cls}">${Math.round(score || 0)}${unit}</div>
      <div class="stat-label">${label}</div>
    </div>
  `;
}

function getBadgeClass(score) {
  if (score >= 80) return 'badge-success';
  if (score >= 60) return 'badge-primary';
  if (score >= 40) return 'badge-warning';
  return 'badge-error';
}

function getMatchMessage(score) {
  if (score >= 80) return 'Strong match! Your resume aligns well with this role.';
  if (score >= 60) return 'Good match. A few tweaks could push this higher.';
  if (score >= 40) return 'Fair match. Optimization will significantly improve your chances.';
  return 'Low match. Consider optimizing or targeting a better-fit role.';
}

/**
 * Match Home - shows all jobs with match scores
 */
export async function renderMatchHome() {
  const { renderJobList } = await import('../jobs/job-list.js');
  await renderJobList();
}
