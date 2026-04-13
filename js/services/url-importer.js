/* Job URL Importer — fetches job postings via CORS proxy and parses them */

const PROXIES = [
  url => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

export async function importJobFromUrl(url) {
  if (!url || !url.startsWith('http')) throw new Error('Invalid URL');

  let html = null;
  let lastError = null;

  for (const makeProxy of PROXIES) {
    try {
      const resp = await fetch(makeProxy(url), { signal: AbortSignal.timeout(12000) });
      if (!resp.ok) continue;
      const ct = resp.headers.get('content-type') || '';
      if (ct.includes('json')) {
        const json = await resp.json();
        html = json.contents || json;
      } else {
        html = await resp.text();
      }
      if (typeof html === 'string' && html.length > 200) break;
    } catch (err) {
      lastError = err;
      html = null;
    }
  }

  if (!html || typeof html !== 'string') {
    throw new Error(lastError?.message || 'Could not fetch the job page. Try pasting the description manually.');
  }

  return parseJobHtml(html, url);
}

function parseJobHtml(html, originalUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove noise
  doc.querySelectorAll('script,style,nav,footer,iframe,aside,.cookie-banner,#cookie').forEach(el => el.remove());

  const title = extractTitle(doc);
  const company = extractCompany(doc, originalUrl);
  const description = extractDescription(doc);

  return {
    title: clean(title).slice(0, 120),
    company: clean(company).slice(0, 100),
    description: cleanDesc(description).slice(0, 8000),
    sourceUrl: originalUrl,
  };
}

function extractTitle(doc) {
  // Try structured data first (most reliable)
  const ld = doc.querySelector('script[type="application/ld+json"]');
  if (ld) {
    try {
      const data = JSON.parse(ld.textContent);
      const job = Array.isArray(data) ? data.find(d => d['@type'] === 'JobPosting') : data;
      if (job?.title) return job.title;
    } catch (_) {}
  }

  // OpenGraph
  const og = doc.querySelector('meta[property="og:title"]');
  if (og?.content) {
    const t = og.content.replace(/\s*[-|].*$/, '').trim(); // strip "Company | Job" suffix
    if (t.length > 3) return t;
  }

  // Page H1
  const h1 = doc.querySelector('h1');
  if (h1?.textContent.trim()) return h1.textContent.trim();

  // Title tag
  const titleEl = doc.querySelector('title');
  if (titleEl) return titleEl.textContent.replace(/\s*[-|].*$/, '').trim();

  return '';
}

function extractCompany(doc, url) {
  // Structured data
  const ld = doc.querySelector('script[type="application/ld+json"]');
  if (ld) {
    try {
      const data = JSON.parse(ld.textContent);
      const job = Array.isArray(data) ? data.find(d => d['@type'] === 'JobPosting') : data;
      const name = job?.hiringOrganization?.name || job?.hiringOrganization;
      if (typeof name === 'string' && name) return name;
    } catch (_) {}
  }

  const selectors = [
    '[class*="company-name"]',
    '[class*="employer-name"]',
    '[class*="companyName"]',
    '[class*="hiring-company"]',
    '[data-company]',
    '[itemprop="name"]',
    '.topcard__org-name-link',     // LinkedIn
    '[class*="JobInfoItem"] a',    // Glassdoor
  ];

  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    const t = el?.textContent.trim();
    if (t && t.length > 1 && t.length < 80) return t;
  }

  // Fallback: og:site_name
  const site = doc.querySelector('meta[property="og:site_name"]');
  if (site?.content && !['LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter'].includes(site.content)) {
    return site.content;
  }

  return '';
}

function extractDescription(doc) {
  const selectors = [
    // Indeed
    '#jobDescriptionText',
    '.jobsearch-jobDescriptionText',
    // LinkedIn
    '.job-description__content',
    '.jobs-description-content__text',
    '.description__text',
    // Greenhouse
    '#content .job',
    '.job-post',
    // Lever
    '.posting-description',
    // Workday
    '[data-automation-id="jobPostingDescription"]',
    // Glassdoor
    '[class*="JobDetails"]',
    // Generic
    '[class*="job-description"]',
    '[class*="jobDescription"]',
    '[class*="job_description"]',
    '[class*="job-detail"]',
    '[class*="job-body"]',
    '[class*="jobPost"]',
    'article',
    '.description',
    '#description',
    '[class*="requirements"]',
  ];

  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    if (el) {
      const text = el.innerText || el.textContent;
      if (text.trim().length > 300) return text.trim();
    }
  }

  // Last resort: main/body
  const main = doc.querySelector('main') || doc.body;
  return (main?.innerText || main?.textContent || '').trim();
}

function clean(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function cleanDesc(s) {
  return (s || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}
