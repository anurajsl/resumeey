/* Add Job Screen */

import { router } from '../../router.js';
import { JobRepo } from '../../db/repositories.js';
import { aiService } from '../../services/ai-service.js';
import { extractJobKeywords } from '../../services/keyword-extractor.js';
import { importJobFromUrl } from '../../services/url-importer.js';
import { toast } from '../../components/toast.js';
import { PremiumService } from '../../services/premium-service.js';

export async function renderAddJob() {
  const container = document.getElementById('screen-container');
  const nav = document.getElementById('bottom-nav'); if (nav) nav.style.display = '';

  const headerTitle = document.getElementById('header-screen-title');
  const back = document.getElementById('header-back');
  if (headerTitle) { headerTitle.textContent = 'Add Job'; headerTitle.classList.add('visible'); }
  if (back) {
    back.style.display = 'flex';
    back.onclick = () => {
      headerTitle?.classList.remove('visible');
      back.style.display = 'none';
      router.navigate('/jobs');
    };
  }

  const canAdd = await PremiumService.canAddJob();

  container.innerHTML = `
    <div class="page animate-fade-up">
      <div style="margin-bottom:24px">
        <h2 class="page-title">Add Job Target</h2>
        <p class="page-subtitle">Import from a URL or paste the job description manually.</p>
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

        <!-- URL Import -->
        <div class="url-import-card" id="url-import-card">
          <div class="url-import-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            Import from URL
          </div>
          <div class="url-import-row">
            <input
              type="url"
              id="job-url"
              class="form-input"
              placeholder="Paste LinkedIn, Indeed, Greenhouse, or any job URL…"
              style="flex:1;min-width:0"
            />
            <button class="btn btn-primary" id="btn-import-url" style="white-space:nowrap;flex-shrink:0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 15 21 19 3 19"/><polyline points="7 9 3 5 7 1"/><line x1="3" y1="5" x2="21" y2="5"/></svg>
              Import
            </button>
          </div>
          <p class="form-hint" style="margin-top:6px">Works with LinkedIn, Indeed, Glassdoor, Greenhouse, Lever, Workday &amp; more</p>
          <div id="url-import-status" style="display:none;margin-top:8px;font-size:12px;color:var(--color-primary);display:flex;align-items:center;gap:6px"></div>
        </div>

        <div class="form-divider">
          <span>or fill in manually</span>
        </div>

        <div class="form-group">
          <label class="form-label required">Job Title</label>
          <input type="text" id="job-title" class="form-input" placeholder="e.g. Senior Software Engineer" />
        </div>

        <div class="form-group">
          <label class="form-label">Company</label>
          <input type="text" id="job-company" class="form-input" placeholder="e.g. Acme Corp" />
        </div>

        <div class="form-group">
          <label class="form-label">Job URL</label>
          <input type="url" id="job-source-url" class="form-input" placeholder="https://…" />
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
            placeholder="Paste the full job description here…"
            style="min-height:200px;font-size:13px"
          ></textarea>
          <p class="form-hint">More context = better keyword extraction and match scoring</p>
        </div>

        <button class="btn btn-primary btn-block" id="btn-analyze-job">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Analyze &amp; Add Job
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-upgrade')?.addEventListener('click', () => router.navigate('/premium'));

  // URL import
  document.getElementById('btn-import-url').addEventListener('click', async () => {
    const url = document.getElementById('job-url').value.trim();
    if (!url) { toast.warning('Paste a job URL first'); return; }

    const btn = document.getElementById('btn-import-url');
    const status = document.getElementById('url-import-status');

    btn.classList.add('btn-loading');
    btn.textContent = '';
    status.style.display = 'flex';
    status.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Fetching job page…
    `;

    try {
      const result = await importJobFromUrl(url);

      if (result.title) document.getElementById('job-title').value = result.title;
      if (result.company) document.getElementById('job-company').value = result.company;
      if (result.description) document.getElementById('job-description').value = result.description;
      if (url) document.getElementById('job-source-url').value = url;

      status.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span style="color:var(--color-success)">Imported successfully — review and adjust below</span>
      `;
      toast.success('Job imported! Review the details below.');
    } catch (err) {
      status.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <span style="color:var(--color-error)">${err.message}</span>
      `;
    } finally {
      btn.classList.remove('btn-loading');
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 15 21 19 3 19"/><polyline points="7 9 3 5 7 1"/><line x1="3" y1="5" x2="21" y2="5"/></svg>
        Import
      `;
    }
  });

  // Analyze & save
  document.getElementById('btn-analyze-job').addEventListener('click', async () => {
    const title = document.getElementById('job-title').value.trim();
    const company = document.getElementById('job-company').value.trim();
    const location = document.getElementById('job-location').value.trim();
    const description = document.getElementById('job-description').value.trim();
    const sourceUrl = document.getElementById('job-source-url').value.trim();

    if (!title) { toast.warning('Please enter a job title'); return; }
    if (!description) { toast.warning('Please add a job description'); return; }

    const btn = document.getElementById('btn-analyze-job');
    btn.classList.add('btn-loading');
    btn.textContent = '';

    try {
      let keywords;
      const aiAvailable = await aiService.isAvailable();
      if (aiAvailable) {
        try {
          keywords = await aiService.extractJobKeywords(description);
        } catch {
          keywords = extractJobKeywords(description);
        }
      } else {
        keywords = extractJobKeywords(description);
      }

      const job = await JobRepo.create({
        title, company, location, description, sourceUrl,
        keywords: keywords || { required: [], preferred: [], skills: [], softSkills: [] },
      });

      toast.success('Job added! Running match score…');
      router.navigate(`/match/${job.id}`);
    } catch (err) {
      toast.error('Failed to add job: ' + err.message);
    } finally {
      btn.classList.remove('btn-loading');
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        Analyze &amp; Add Job`;
    }
  });
}
