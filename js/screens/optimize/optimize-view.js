/* Optimize View — AI optimization + ATS-aware Smart Fix */

import { router } from '../../router.js';
import { JobRepo, ResumeRepo } from '../../db/repositories.js';
import { optimizeResume, applyOptimizations } from '../../services/optimizer-service.js';
import { analyzeATS } from '../../services/ats-analyzer.js';
import { aiService } from '../../services/ai-service.js';
import { createOptimizationCard } from '../../components/diff-viewer.js';
import { createSkeleton } from '../../components/loading-skeleton.js';
import { toast } from '../../components/toast.js';
import { scoreMatch } from '../../services/match-engine.js';
import { scoreColorClass } from '../../utils/formatters.js';

export async function renderOptimizeView({ jobId }) {
  const container = document.getElementById('screen-container');
  const nav = document.getElementById('bottom-nav'); if (nav) nav.style.display = '';

  const [job, resume] = await Promise.all([JobRepo.get(jobId), ResumeRepo.getMaster()]);

  if (!job || !resume) {
    toast.error('Missing job or resume data');
    router.navigate('/jobs');
    return;
  }

  const headerTitle = document.getElementById('header-screen-title');
  const back = document.getElementById('header-back');
  if (headerTitle) { headerTitle.textContent = 'Optimize'; headerTitle.classList.add('visible'); }
  if (back) {
    back.style.display = 'flex';
    back.onclick = () => {
      headerTitle?.classList.remove('visible');
      back.style.display = 'none';
      router.navigate(`/jobs/${jobId}`);
    };
  }

  const aiAvailable = await aiService.isAvailable();

  // Get or compute current ATS + match scores
  const atsResult = job.atsResult || analyzeATS(resume, job.keywords || {});
  const matchResult = job.matchResult || scoreMatch(resume, job.keywords || {});
  const atsScore = atsResult.overallScore || 0;
  const matchScore = matchResult.overallScore || 0;

  container.innerHTML = `
    <div class="optimize-screen animate-fade-up">

      <!-- Current scores banner -->
      <div class="optimize-scores-bar">
        <div class="optimize-score-item">
          <div class="optimize-score-value ${scoreColorClass(matchScore)}">${Math.round(matchScore)}%</div>
          <div class="optimize-score-label">Match Score</div>
        </div>
        <div class="optimize-score-divider"></div>
        <div class="optimize-score-item">
          <div class="optimize-score-value ${scoreColorClass(atsScore)}">${Math.round(atsScore)}%</div>
          <div class="optimize-score-label">ATS Score</div>
        </div>
        <div class="optimize-score-divider"></div>
        <div class="optimize-score-item">
          <div class="optimize-score-value" style="color:var(--color-text-tertiary)">${(matchResult.missingKeywords || []).length}</div>
          <div class="optimize-score-label">Missing Keywords</div>
        </div>
      </div>

      <div style="margin-bottom:20px">
        <h2 class="page-title">Optimize for ${job.title}${job.company ? ` at ${job.company}` : ''}</h2>
      </div>

      ${!aiAvailable ? `
      <div class="card" style="margin-bottom:16px;border-color:var(--color-border-medium)">
        <div class="card-body" style="padding:14px 16px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style="font-size:13px;font-weight:600;color:var(--color-text)">No AI key — using rule-based suggestions</span>
            <button class="btn btn-ghost btn-sm" id="btn-setup-ai" style="margin-left:auto">Add AI Key</button>
          </div>
          <p style="font-size:12px;color:var(--color-text-secondary);line-height:1.5">Rule-based mode detects weak verbs, passive voice, and injects missing keywords. Add an AI key for much richer rewrites.</p>
        </div>
      </div>` : ''}

      <!-- Missing keywords -->
      ${(matchResult.missingKeywords || []).length > 0 ? `
      <div class="card" style="margin-bottom:16px">
        <div class="card-body" style="padding:14px 16px">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-secondary);margin-bottom:10px">Missing Keywords to Add</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${matchResult.missingKeywords.map(k => `<span class="tag tag-missing">${k}</span>`).join('')}
          </div>
        </div>
      </div>` : ''}

      <!-- ATS issues summary -->
      ${(atsResult.issues || []).length > 0 ? `
      <div class="card" style="margin-bottom:16px">
        <div class="card-body" style="padding:14px 16px">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-secondary);margin-bottom:10px">ATS Issues (${atsResult.issues.length})</div>
          ${atsResult.issues.slice(0, 4).map(issue => `
            <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px">
              <div style="width:8px;height:8px;border-radius:50%;background:${issue.severity==='high'?'var(--color-error)':issue.severity==='medium'?'var(--color-warning)':'var(--color-info)'};margin-top:4px;flex-shrink:0"></div>
              <span style="font-size:13px;color:var(--color-text-secondary)">${issue.text}</span>
            </div>
          `).join('')}
        </div>
      </div>` : ''}

      <div id="opt-start-section">
        <!-- Smart Fix (one-click) -->
        <div class="smart-fix-card">
          <div class="smart-fix-header">
            <div class="smart-fix-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div>
              <div style="font-weight:700;font-size:15px;color:var(--color-text)">${aiAvailable ? 'Smart Fix' : 'Quick Fix'}</div>
              <div style="font-size:12px;color:var(--color-text-secondary);margin-top:2px">${aiAvailable ? 'AI rewrites your bullets, adds missing keywords, and applies all improvements automatically' : 'Rule-based: fixes weak verbs, passive voice, and injects missing keywords automatically'}</div>
            </div>
          </div>
          <button class="btn btn-gold btn-block" id="btn-smart-fix" style="margin-top:12px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ${aiAvailable ? 'Auto-Fix & Boost Score' : 'Quick Fix & Apply'}
          </button>
        </div>

        <div class="form-divider"><span>or review changes manually</span></div>

        <button class="btn btn-primary btn-block" id="btn-run-optimize">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          ${aiAvailable ? 'Review AI Suggestions' : 'Review Rule-based Suggestions'}
        </button>
      </div>

      <div id="opt-results" class="hidden"></div>
    </div>
  `;

  document.getElementById('btn-setup-ai')?.addEventListener('click', () => router.navigate('/onboarding/ai'));

  // Smart Fix — auto-apply everything
  document.getElementById('btn-smart-fix')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-smart-fix');
    btn.classList.add('btn-loading');
    btn.textContent = '';

    const resultsEl = document.getElementById('opt-results');
    resultsEl.classList.remove('hidden');
    resultsEl.innerHTML = loadingHtml('Running AI analysis… rewriting bullets and adding keywords');

    try {
      const missingKeywords = matchResult.missingKeywords || [];
      const optimizations = await optimizeResume(resume, job.keywords || {}, missingKeywords, { useAI: aiAvailable });

      if (!optimizations.length) {
        resultsEl.innerHTML = `<div class="card card-body" style="text-align:center;padding:32px 16px">
          <p style="color:var(--color-text-secondary)">No experience bullets found to optimize. Add bullet points to your resume first.</p>
        </div>`;
        return;
      }

      // Collect all changes
      const allChanges = [];
      optimizations.forEach(group => {
        group.bullets.forEach(item => {
          allChanges.push({ role: group.role, company: group.company, original: item.original, optimized: item.optimized });
        });
      });

      // Apply to resume
      const currentResume = await ResumeRepo.getMaster();
      const updatedResume = applyOptimizations(currentResume, allChanges);
      await ResumeRepo.update(currentResume.id, { sections: updatedResume.sections });

      // Re-score
      const newMatch = scoreMatch(updatedResume, job.keywords || {});
      const newAts = analyzeATS(updatedResume, job.keywords || {});
      await JobRepo.update(jobId, {
        matchResult: newMatch,
        atsResult: newAts,
        optimizationResult: { appliedAt: new Date().toISOString(), changesCount: allChanges.length },
      });

      const matchDelta = Math.round(newMatch.overallScore - matchScore);
      const atsDelta = Math.round(newAts.overallScore - atsScore);

      resultsEl.innerHTML = `
        <div class="smart-fix-result">
          <div class="smart-fix-result-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="smart-fix-result-title">Resume Updated!</div>
          <div class="smart-fix-result-subtitle">${allChanges.length} improvement${allChanges.length !== 1 ? 's' : ''} applied automatically</div>
          <div class="smart-fix-deltas">
            <div class="smart-fix-delta">
              <div class="smart-fix-delta-value ${matchDelta > 0 ? 'positive' : ''}">
                ${matchDelta > 0 ? '+' : ''}${matchDelta}%
              </div>
              <div class="smart-fix-delta-label">Match Score</div>
              <div class="smart-fix-delta-scores">${Math.round(matchScore)}% → <strong>${Math.round(newMatch.overallScore)}%</strong></div>
            </div>
            <div class="smart-fix-delta">
              <div class="smart-fix-delta-value ${atsDelta > 0 ? 'positive' : ''}">
                ${atsDelta > 0 ? '+' : ''}${atsDelta}%
              </div>
              <div class="smart-fix-delta-label">ATS Score</div>
              <div class="smart-fix-delta-scores">${Math.round(atsScore)}% → <strong>${Math.round(newAts.overallScore)}%</strong></div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">
            <button class="btn btn-primary btn-block" id="btn-view-match">View Updated Score</button>
            <button class="btn btn-secondary btn-block" id="btn-view-resume">View Updated Resume</button>
          </div>
        </div>
      `;

      document.getElementById('btn-view-match').addEventListener('click', () => router.navigate(`/match/${jobId}`));
      document.getElementById('btn-view-resume').addEventListener('click', () => router.navigate('/resume'));

      toast.success(`Done! +${matchDelta}% match, +${atsDelta}% ATS`);
    } catch (err) {
      toast.error('Smart Fix failed: ' + err.message);
      resultsEl.innerHTML = '';
    } finally {
      btn.classList.remove('btn-loading');
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Auto-Fix &amp; Boost Score`;
    }
  });

  // Manual review
  document.getElementById('btn-run-optimize')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-run-optimize');
    btn.classList.add('btn-loading');
    btn.textContent = '';

    const resultsEl = document.getElementById('opt-results');
    resultsEl.classList.remove('hidden');
    resultsEl.innerHTML = loadingHtml('Analyzing your resume against the job…');

    try {
      const missingKeywords = matchResult.missingKeywords || [];
      const optimizations = await optimizeResume(resume, job.keywords || {}, missingKeywords, { useAI: aiAvailable });

      if (!optimizations.length) {
        resultsEl.innerHTML = `<div class="card card-body" style="text-align:center;padding:32px 16px">
          <p style="color:var(--color-text-secondary)">No bullet points found to optimize. Add experience bullets first.</p>
        </div>`;
        return;
      }

      renderManualReview(resultsEl, optimizations, resume, job, jobId, matchScore, atsScore);
    } catch (err) {
      toast.error('Optimization failed: ' + err.message);
      resultsEl.innerHTML = '';
    } finally {
      btn.classList.remove('btn-loading');
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Review AI Suggestions`;
    }
  });
}

function renderManualReview(container, optimizations, resume, job, jobId, matchScore, atsScore) {
  const accepted = [];

  container.innerHTML = `
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <h3 style="font-size:16px;font-weight:700">Review Changes</h3>
        <span style="font-size:12px;background:var(--color-primary-bg);color:var(--color-primary);padding:4px 10px;border-radius:99px;font-weight:600" id="accepted-count">0 accepted</span>
      </div>
      <div id="optimization-cards"></div>
      <div style="margin-top:20px;display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-gold btn-block" id="btn-accept-all">Accept All &amp; Apply</button>
        <button class="btn btn-secondary btn-block" id="btn-apply-accepted">Apply Selected Only</button>
      </div>
    </div>
  `;

  const cardsContainer = document.getElementById('optimization-cards');

  optimizations.forEach(group => {
    const groupHeader = document.createElement('div');
    groupHeader.style.cssText = 'font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-secondary);margin:16px 0 8px;padding:0 4px';
    groupHeader.textContent = `${group.role}${group.company ? ' · ' + group.company : ''}`;
    cardsContainer.appendChild(groupHeader);

    group.bullets.forEach(item => {
      const card = createOptimizationCard({
        original: item.original,
        optimized: item.optimized,
        onAccept: (optimized) => {
          item.accepted = true;
          accepted.push({ role: group.role, company: group.company, original: item.original, optimized });
          updateCount();
          card.style.opacity = '0.65';
          card.querySelector('.btn-accept').textContent = '✓ Accepted';
          card.querySelector('.btn-accept').disabled = true;
        },
        onReject: () => {
          item.accepted = false;
          const idx = accepted.findIndex(a => a.original === item.original);
          if (idx > -1) accepted.splice(idx, 1);
          updateCount();
          card.style.opacity = '0.4';
        },
      });
      cardsContainer.appendChild(card);
    });
  });

  function updateCount() {
    const el = document.getElementById('accepted-count');
    if (el) el.textContent = `${accepted.length} accepted`;
  }

  async function applyAndUpdate(changes) {
    if (!changes.length) { toast.warning('No changes to apply'); return; }

    const currentResume = await ResumeRepo.getMaster();
    const updated = applyOptimizations(currentResume, changes);
    await ResumeRepo.update(currentResume.id, { sections: updated.sections });

    const newMatch = scoreMatch(updated, job.keywords || {});
    const newAts = analyzeATS(updated, job.keywords || {});
    await JobRepo.update(jobId, {
      matchResult: newMatch,
      atsResult: newAts,
      optimizationResult: { appliedAt: new Date().toISOString(), changesCount: changes.length },
    });

    const matchDelta = Math.round(newMatch.overallScore - matchScore);
    const atsDelta = Math.round(newAts.overallScore - atsScore);
    toast.success(`Applied ${changes.length} changes! Match ${matchDelta >= 0 ? '+' : ''}${matchDelta}%, ATS ${atsDelta >= 0 ? '+' : ''}${atsDelta}%`);
    router.navigate(`/match/${jobId}`);
  }

  document.getElementById('btn-accept-all').addEventListener('click', () => {
    const all = [];
    optimizations.forEach(g => g.bullets.forEach(b => all.push({ role: g.role, company: g.company, original: b.original, optimized: b.optimized })));
    applyAndUpdate(all);
  });

  document.getElementById('btn-apply-accepted').addEventListener('click', () => applyAndUpdate(accepted));
}

function loadingHtml(msg) {
  return `
    <div style="padding:32px 16px;text-align:center">
      <div class="loading-dots" style="justify-content:center;color:var(--color-primary);margin-bottom:12px"><span></span><span></span><span></span></div>
      <p style="font-size:13px;color:var(--color-text-secondary)">${msg}</p>
      <p style="font-size:11px;color:var(--color-text-tertiary);margin-top:4px">This may take 20–40 seconds</p>
    </div>
  `;
}
