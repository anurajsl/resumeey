/* ATS Analysis Screen */

import { router } from '../../router.js';
import { JobRepo, ResumeRepo } from '../../db/repositories.js';
import { analyzeATS } from '../../services/ats-analyzer.js';
import { createScoreRing } from '../../components/score-ring.js';
import { toast } from '../../components/toast.js';
import { scoreColorClass, scoreLabel } from '../../utils/formatters.js';

const SEVERITY_COLORS = {
  high: 'var(--color-error)',
  medium: 'var(--color-warning)',
  low: 'var(--color-info)',
};

export async function renderATSAnalysis({ jobId }) {
  const container = document.getElementById('screen-container');
  document.getElementById('bottom-nav').style.display = '';

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
  if (headerTitle) { headerTitle.textContent = 'ATS Analysis'; headerTitle.classList.add('visible'); }
  if (back) {
    back.style.display = 'flex';
    back.onclick = () => {
      headerTitle?.classList.remove('visible');
      back.style.display = 'none';
      router.navigate(`/jobs/${jobId}`);
    };
  }

  // Get cached or run fresh
  let atsResult = job.atsResult;
  if (!atsResult) {
    atsResult = analyzeATS(resume, job.keywords || {});
    await JobRepo.update(jobId, { atsResult });
  }

  const overall = atsResult.overallScore || 0;
  const colorClass = scoreColorClass(overall);

  container.innerHTML = `
    <div class="ats-screen animate-fade-up">
      <!-- Score header -->
      <div class="ats-score-header">
        <div id="ats-ring"></div>
        <div style="flex:1">
          <h2 style="font-size:20px;font-weight:700;line-height:1.2">ATS Score</h2>
          <p style="font-size:13px;color:var(--color-text-secondary);margin-top:2px">${scoreLabel(overall)} — ${getATSMessage(overall)}</p>
          <p style="font-size:11px;color:var(--color-text-tertiary);margin-top:6px">${atsResult.wordCount || 0} words</p>
        </div>
      </div>

      <!-- Breakdown -->
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px">
        ${renderSubScore('Formatting', atsResult.formattingScore)}
        ${renderSubScore('Keywords', atsResult.keywordScore)}
        ${renderSubScore('Readability', atsResult.readabilityScore)}
        ${renderSubScore('Completeness', atsResult.completenessScore)}
      </div>

      <!-- Issues -->
      ${atsResult.issues?.length > 0 ? `
      <div style="margin-bottom:20px">
        <h3 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-secondary);margin-bottom:10px">Issues Found</h3>
        <div class="ats-issues-list">
          ${atsResult.issues.map(issue => `
            <div class="ats-issue-item">
              <div class="ats-issue-severity" style="background:${SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.low}"></div>
              <div>
                <div style="font-size:13px;font-weight:500;color:var(--color-text)">${issue.text}</div>
                <div style="font-size:11px;color:var(--color-text-tertiary);margin-top:2px;text-transform:capitalize">${issue.severity} priority</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>` : `
      <div class="card card-body" style="text-align:center;margin-bottom:20px">
        <p style="color:var(--color-success);font-weight:600">No issues found!</p>
      </div>`}

      <!-- Tips -->
      ${atsResult.tips?.length > 0 ? `
      <div style="margin-bottom:20px">
        <h3 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-secondary);margin-bottom:10px">Improvement Tips</h3>
        <div class="card">
          <div class="card-body" style="padding:12px 16px">
            ${atsResult.tips.map(tip => `
              <div class="insight-item">
                <div class="insight-dot good"></div>
                <span class="insight-text">${tip}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>` : ''}

      <!-- Actions -->
      <div style="display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-primary btn-block" id="btn-optimize">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Fix with AI Optimization
        </button>
        <button class="btn btn-secondary btn-block" id="btn-rerun">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Re-analyze
        </button>
      </div>
    </div>
  `;

  // Add ring
  const ringEl = document.getElementById('ats-ring');
  if (ringEl) ringEl.appendChild(createScoreRing(overall, { size: 100, strokeWidth: 8 }));

  document.getElementById('btn-optimize').addEventListener('click', () => router.navigate(`/optimize/${jobId}`));
  document.getElementById('btn-rerun').addEventListener('click', async () => {
    await JobRepo.update(jobId, { atsResult: null });
    renderATSAnalysis({ jobId });
  });
}

function renderSubScore(label, score) {
  const cls = scoreColorClass(score || 0);
  const w = Math.min(100, Math.max(0, score || 0));
  return `
    <div class="stat-card">
      <div class="stat-value ${cls}">${Math.round(score || 0)}%</div>
      <div style="margin:6px 0">
        <div class="progress-bar-container" style="height:4px">
          <div class="progress-bar-fill ${getBarClass(score)}" style="width:${w}%"></div>
        </div>
      </div>
      <div class="stat-label">${label}</div>
    </div>
  `;
}

function getBarClass(score) {
  if (score >= 80) return 'success';
  if (score >= 60) return '';
  if (score >= 40) return 'warning';
  return 'error';
}

function getATSMessage(score) {
  if (score >= 85) return 'Excellent ATS optimization';
  if (score >= 70) return 'Good — minor improvements possible';
  if (score >= 50) return 'Fair — several issues to address';
  return 'Needs improvement';
}
