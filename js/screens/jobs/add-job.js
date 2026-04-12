/* Add Job Screen */

import { router } from '../../router.js';
import { JobRepo } from '../../db/repositories.js';
import { aiService } from '../../services/ai-service.js';
import { extractJobKeywords } from '../../services/keyword-extractor.js';
import { toast } from '../../components/toast.js';
import { PremiumService } from '../../services/premium-service.js';

export async function renderAddJob() {
  const container = document.getElementById('screen-container');
  document.getElementById('bottom-nav').style.display = '';

  // Check free tier
  const canAdd = await PremiumService.canAddJob();

  container.innerHTML = `
    <div class="page animate-fade-up">
      <div style="margin-bottom:20px">
        <h2 class="page-title">Add Job Target</h2>
        <p class="page-subtitle">Paste a job description to extract requirements and match your resume.</p>
      </div>

      ${!canAdd ? `
      <div class="premium-banner" style="margin-bottom:20px">
        <div class="premium-banner-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <div class="premium-banner-text">
          <div class="premium-banner-title">Free tier limit reached</div>
          <div class="premium-banner-subtitle">Upgrade for unlimited job targets</div>
        </div>
        <button class="btn btn-gold btn-sm" id="btn-upgrade">Upgrade</button>
      </div>` : ''}

      <div style="${!canAdd ? 'opacity:0.5;pointer-events:none' : ''}">
        <div class="form-group">
          <label class="form-label required">Job Title</label>
          <input type="text" id="job-title" class="form-input" placeholder="e.g. Senior Software Engineer" />
        </div>

        <div class="form-group">
          <label class="form-label">Company</label>
          <input type="text" id="job-company" class="form-input" placeholder="e.g. Acme Corp" />
        </div>

        <div class="form-group">
          <label class="form-label">Location</label>
          <input type="text" id="job-location" class="form-input" placeholder="e.g. Remote, New York" />
        </div>

        <div class="form-group">
          <label class="form-label required">Job Description</label>
          <textarea
            id="job-description"
            class="form-textarea"
            placeholder="Paste the full job description here for best results…"
            style="min-height:200px;font-size:13px"
          ></textarea>
          <p class="form-hint">More context = better keyword extraction and match scoring</p>
        </div>

        <button class="btn btn-primary btn-block" id="btn-analyze-job">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Analyze & Add Job
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-upgrade')?.addEventListener('click', () => router.navigate('/premium'));

  document.getElementById('btn-analyze-job')?.addEventListener('click', async () => {
    const title = document.getElementById('job-title').value.trim();
    const company = document.getElementById('job-company').value.trim();
    const location = document.getElementById('job-location').value.trim();
    const description = document.getElementById('job-description').value.trim();

    if (!title) { toast.warning('Please enter a job title'); return; }
    if (!description) { toast.warning('Please paste a job description'); return; }

    const btn = document.getElementById('btn-analyze-job');
    btn.classList.add('btn-loading');
    btn.textContent = '';

    try {
      // Extract keywords
      let keywords;
      const aiAvailable = await aiService.isAvailable();

      if (aiAvailable) {
        try {
          keywords = await aiService.extractJobKeywords(description);
        } catch (err) {
          console.warn('AI keyword extraction failed, using local:', err.message);
          keywords = extractJobKeywords(description);
        }
      } else {
        keywords = extractJobKeywords(description);
      }

      const job = await JobRepo.create({
        title,
        company,
        location,
        description,
        keywords: keywords || { required: [], preferred: [], skills: [], softSkills: [] },
      });

      toast.success('Job added! Running match score…');

      // Auto-navigate to match
      router.navigate(`/match/${job.id}`);
    } catch (err) {
      toast.error('Failed to add job: ' + err.message);
    } finally {
      btn.classList.remove('btn-loading');
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        Analyze & Add Job`;
    }
  });
}
