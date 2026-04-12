/* Optimize View Screen */

import { router } from '../../router.js';
import { JobRepo, ResumeRepo } from '../../db/repositories.js';
import { optimizeResume, applyOptimizations } from '../../services/optimizer-service.js';
import { aiService } from '../../services/ai-service.js';
import { createOptimizationCard } from '../../components/diff-viewer.js';
import { createSkeleton } from '../../components/loading-skeleton.js';
import { toast } from '../../components/toast.js';
import { scoreMatch } from '../../services/match-engine.js';

export async function renderOptimizeView({ jobId }) {
  const container = document.getElementById('screen-container');
  document.getElementById('bottom-nav').style.display = '';

  const [job, resume] = await Promise.all([
    JobRepo.get(jobId),
    ResumeRepo.getMaster(),
  ]);

  if (!job || !resume) {
    toast.error('Missing job or resume data');
    router.navigate('/jobs');
    return;
  }

  // Header
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

  container.innerHTML = `
    <div class="optimize-screen animate-fade-up">
      <div style="margin-bottom:20px">
        <h2 class="page-title">Optimize Resume</h2>
        <p class="page-subtitle">For ${job.title}${job.company ? ` at ${job.company}` : ''}</p>
      </div>

      ${!aiAvailable ? `
      <div class="premium-banner" style="margin-bottom:20px">
        <div class="premium-banner-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <div class="premium-banner-text">
          <div class="premium-banner-title">AI key required</div>
          <div class="premium-banner-subtitle">Add an AI key in Settings to use optimization</div>
        </div>
        <button class="btn btn-sm btn-primary" id="btn-setup-ai">Setup AI</button>
      </div>` : ''}

      <div id="opt-start-section">
        <div class="card" style="margin-bottom:16px">
          <div class="card-body">
            <p style="font-size:14px;color:var(--color-text-secondary);line-height:1.7">
              The AI will rewrite your resume bullets to better match the job requirements, incorporate missing keywords, and improve impact statements.
            </p>
            <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
              ${(job.keywords?.required || []).slice(0, 5).map(k => `<span class="tag tag-primary">${k}</span>`).join('')}
              ${(job.keywords?.skills || []).slice(0, 5).map(k => `<span class="tag tag-neutral">${k}</span>`).join('')}
            </div>
          </div>
        </div>

        <button class="btn btn-primary btn-block" id="btn-run-optimize" ${!aiAvailable ? 'disabled' : ''}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Start AI Optimization
        </button>
      </div>

      <div id="opt-results" class="hidden"></div>
    </div>
  `;

  document.getElementById('btn-setup-ai')?.addEventListener('click', () => router.navigate('/onboarding/ai'));

  document.getElementById('btn-run-optimize')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-run-optimize');
    btn.classList.add('btn-loading');
    btn.textContent = '';

    const resultsContainer = document.getElementById('opt-results');
    resultsContainer.classList.remove('hidden');
    resultsContainer.innerHTML = `
      <div style="padding:20px;text-align:center">
        <div class="loading-dots" style="justify-content:center;color:var(--color-primary);margin-bottom:12px"><span></span><span></span><span></span></div>
        <p style="font-size:13px;color:var(--color-text-secondary)">Analyzing your resume against the job description…</p>
        <p style="font-size:11px;color:var(--color-text-tertiary);margin-top:4px">This may take a moment</p>
      </div>
    `;

    try {
      const missingKeywords = job.matchResult?.missingKeywords || [];
      const optimizations = await optimizeResume(resume, job.keywords || {}, missingKeywords);

      btn.classList.remove('btn-loading');
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Start AI Optimization`;

      if (!optimizations.length) {
        resultsContainer.innerHTML = `
          <div class="card card-body" style="text-align:center;padding:32px">
            <p style="color:var(--color-text-secondary)">No bullet points found to optimize. Add experience bullets to your resume first.</p>
          </div>
        `;
        return;
      }

      renderOptimizationResults(resultsContainer, optimizations, resume, jobId);
    } catch (err) {
      toast.error('Optimization failed: ' + err.message);
      btn.classList.remove('btn-loading');
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Retry`;
      resultsContainer.innerHTML = '';
    }
  });

  function renderOptimizationResults(container, optimizations, resume, jobId) {
    const accepted = [];

    container.innerHTML = `
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <h3 style="font-size:16px;font-weight:700">Review Changes</h3>
          <span style="font-size:12px;color:var(--color-text-secondary)" id="accepted-count">0 accepted</span>
        </div>
        <div id="optimization-cards"></div>
        <div style="margin-top:20px;display:flex;flex-direction:column;gap:10px">
          <button class="btn btn-primary btn-block" id="btn-accept-all">
            Accept All Changes
          </button>
          <button class="btn btn-secondary btn-block" id="btn-apply-accepted">
            Apply Selected Changes
          </button>
        </div>
      </div>
    `;

    const cardsContainer = document.getElementById('optimization-cards');

    optimizations.forEach(group => {
      const groupHeader = document.createElement('div');
      groupHeader.style.cssText = 'font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-secondary);margin:16px 0 8px;';
      groupHeader.textContent = `${group.role} at ${group.company}`;
      cardsContainer.appendChild(groupHeader);

      group.bullets.forEach((item) => {
        const card = createOptimizationCard({
          original: item.original,
          optimized: item.optimized,
          onAccept: (optimized) => {
            item.accepted = true;
            accepted.push({ role: group.role, company: group.company, original: item.original, optimized });
            updateAcceptedCount();
            card.style.opacity = '0.6';
            card.querySelector('.btn-accept').textContent = '✓ Accepted';
            card.querySelector('.btn-accept').disabled = true;
          },
          onReject: () => {
            item.accepted = false;
            const idx = accepted.findIndex(a => a.original === item.original);
            if (idx > -1) accepted.splice(idx, 1);
            updateAcceptedCount();
            card.style.opacity = '0.4';
          },
        });
        cardsContainer.appendChild(card);
      });
    });

    function updateAcceptedCount() {
      const el = document.getElementById('accepted-count');
      if (el) el.textContent = `${accepted.length} accepted`;
    }

    document.getElementById('btn-accept-all').addEventListener('click', async () => {
      const allChanges = [];
      optimizations.forEach(group => {
        group.bullets.forEach(item => {
          allChanges.push({ role: group.role, company: group.company, original: item.original, optimized: item.optimized });
        });
      });
      await applyAndUpdate(allChanges);
    });

    document.getElementById('btn-apply-accepted').addEventListener('click', async () => {
      if (!accepted.length) { toast.warning('No changes accepted yet'); return; }
      await applyAndUpdate(accepted);
    });

    async function applyAndUpdate(changes) {
      if (!changes.length) return;
      const { ResumeRepo } = await import('../../db/repositories.js');
      const currentResume = await ResumeRepo.getMaster();
      const updated = applyOptimizations(currentResume, changes);
      await ResumeRepo.update(currentResume.id, { sections: updated.sections });

      // Re-score
      const newResult = scoreMatch(updated, job.keywords || {});
      await JobRepo.update(jobId, { matchResult: newResult, optimizationResult: { appliedAt: new Date().toISOString(), changesCount: changes.length } });

      toast.success(`Applied ${changes.length} improvements! New match: ${newResult.overallScore}%`);
      router.navigate(`/match/${jobId}`);
    }
  }
}
