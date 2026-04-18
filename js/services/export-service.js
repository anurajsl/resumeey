/* Export Service - html2pdf.js wrapper */

const HTML2PDF_CDN = 'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js';

let _html2pdf = null;

async function getHtml2PDF() {
  if (_html2pdf) return _html2pdf;
  if (window.html2pdf) { _html2pdf = window.html2pdf; return _html2pdf; }

  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = HTML2PDF_CDN;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load html2pdf.js'));
    document.head.appendChild(script);
  });

  _html2pdf = window.html2pdf;
  return _html2pdf;
}

export async function exportToPDF(resumeData, template = 'classic', isPremium = false) {
  const html2pdf = await getHtml2PDF();

  const htmlContent = buildResumeHTML(resumeData, template, isPremium);

  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  const filename = `${(resumeData.sections?.contact?.name || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`;

  try {
    await html2pdf()
      .from(container.querySelector('.resume-document') || container)
      .set({
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all' },
      })
      .save();
  } finally {
    document.body.removeChild(container);
  }
}

export function buildResumeHTML(resumeData, template, isPremium) {
  switch (template) {
    case 'modern':  return buildModern(resumeData, isPremium);
    case 'minimal': return buildMinimal(resumeData, isPremium);
    default:        return buildClassic(resumeData, isPremium);
  }
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function prep(resumeData) {
  const s = resumeData.sections || {};
  return {
    s,
    contact:        s.contact        || {},
    experience:     s.experience     || [],
    education:      s.education      || [],
    skills:         s.skills         || [],
    certifications: s.certifications || [],
    projects:       s.projects       || [],
    awards:         s.awards         || [],
  };
}

function fmtDate(d) {
  if (!d) return '';
  const [year, month] = d.split('-');
  const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(month)] || ''} ${year}`.trim();
}

function dateRange(exp) {
  return `${fmtDate(exp.startDate)} – ${exp.isCurrent ? 'Present' : fmtDate(exp.endDate)}`;
}

function watermarkHTML(isPremium) {
  return isPremium ? '' : '<div style="position:absolute;bottom:20mm;right:20mm;font-size:8pt;color:#ddd;transform:rotate(-45deg);white-space:nowrap;pointer-events:none">Created with Resumey Free</div>';
}

const FONT_LINK = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">';
const BASE_STYLE = `* { box-sizing: border-box; margin: 0; padding: 0; } ul { list-style: disc; } a { color: inherit; text-decoration: none; } .no-break { page-break-inside: avoid; }`;

// ─── Classic template ─────────────────────────────────────────────────────────
// Single-column, centered header, green section headings with underline rule.

function buildClassic(resumeData, isPremium) {
  const { s, contact, experience, education, skills, certifications, projects, awards } = prep(resumeData);

  const sectionTitle = (title) => `
    <div style="font-size:10pt;font-weight:700;color:#4A7C59;text-transform:uppercase;letter-spacing:0.09em;border-bottom:1.5pt solid #4A7C59;padding-bottom:3pt;margin:14pt 0 8pt">${title}</div>`;

  const expHTML = experience.map(exp => `
    <div class="no-break" style="margin-bottom:10pt">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <div>
          <span style="font-weight:700;font-size:10.5pt">${exp.role || ''}</span>
          <span style="color:#4A7C59;font-weight:600;font-size:10pt;margin-left:6pt">${exp.company || ''}${exp.location ? ` · ${exp.location}` : ''}</span>
        </div>
        <span style="font-size:9pt;color:#6B6860;flex-shrink:0">${dateRange(exp)}</span>
      </div>
      ${(exp.bullets || []).length ? `<ul style="margin:4pt 0 0 15pt;padding:0">${exp.bullets.map(b => `<li style="font-size:10pt;color:#3A3A3A;margin-bottom:2pt;line-height:1.5">${b}</li>`).join('')}</ul>` : ''}
    </div>`).join('');

  const eduHTML = education.map(edu => `
    <div class="no-break" style="margin-bottom:8pt;display:flex;justify-content:space-between">
      <div>
        <div style="font-weight:700;font-size:10.5pt">${edu.degree || ''}${edu.field ? ` in ${edu.field}` : ''}</div>
        <div style="color:#4A7C59;font-size:10pt;font-weight:600">${edu.institution || ''}</div>
        ${edu.gpa ? `<div style="font-size:9pt;color:#6B6860">GPA: ${edu.gpa}</div>` : ''}
      </div>
      <span style="font-size:9pt;color:#6B6860;flex-shrink:0">${fmtDate(edu.graduationDate)}</span>
    </div>`).join('');

  const skillsHTML = skills.length ? `<div style="display:flex;flex-wrap:wrap;gap:5pt">${skills.map(sk => `<span style="background:#EEF5F1;color:#3A6347;border-radius:3pt;padding:2pt 8pt;font-size:9pt;font-weight:600">${typeof sk === 'string' ? sk : sk.name || ''}</span>`).join('')}</div>` : '';

  const certHTML = certifications.map(c => `<div style="font-size:10pt;margin-bottom:3pt"><span style="font-weight:600">${c.name}</span>${c.issuer ? ` — ${c.issuer}` : ''}${c.date ? ` (${fmtDate(c.date)})` : ''}</div>`).join('');

  const projHTML = projects.map(p => `
    <div class="no-break" style="margin-bottom:8pt">
      <div style="font-weight:700;font-size:10.5pt">${p.name || ''}</div>
      ${p.description ? `<div style="font-size:10pt;color:#3A3A3A;margin-top:2pt;line-height:1.5">${p.description}</div>` : ''}
    </div>`).join('');

  return wrapDoc(`
    ${watermarkHTML(isPremium)}
    <div style="text-align:center;padding-bottom:14pt;border-bottom:2pt solid #4A7C59;margin-bottom:14pt">
      <div style="font-size:22pt;font-weight:700;letter-spacing:-0.02em;margin-bottom:4pt">${contact.name || ''}</div>
      ${contact.title ? `<div style="font-size:10.5pt;color:#4A7C59;font-weight:600;margin-bottom:5pt">${contact.title}</div>` : ''}
      <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:12pt;font-size:9pt;color:#6B6860">
        ${contact.email ? `<span>${contact.email}</span>` : ''}
        ${contact.phone ? `<span>${contact.phone}</span>` : ''}
        ${contact.location ? `<span>${contact.location}</span>` : ''}
        ${contact.linkedin ? `<span>${contact.linkedin}</span>` : ''}
        ${contact.website ? `<span>${contact.website}</span>` : ''}
      </div>
    </div>
    ${s.summary ? `${sectionTitle('Professional Summary')}<p style="font-size:10pt;color:#3A3A3A;line-height:1.6">${s.summary}</p>` : ''}
    ${experience.length ? `${sectionTitle('Experience')}${expHTML}` : ''}
    ${education.length ? `${sectionTitle('Education')}${eduHTML}` : ''}
    ${skills.length ? `${sectionTitle('Skills')}${skillsHTML}` : ''}
    ${projects.length ? `${sectionTitle('Projects')}${projHTML}` : ''}
    ${certifications.length ? `${sectionTitle('Certifications')}${certHTML}` : ''}
  `, 'Inter', '20mm 18mm', isPremium);
}

// ─── Modern template ──────────────────────────────────────────────────────────
// Two-column: dark green sidebar (name, contact, skills, certs) + white main (summary, experience, education).

function buildModern(resumeData, isPremium) {
  const { s, contact, experience, education, skills, certifications, projects, awards } = prep(resumeData);

  const sidebarSection = (title, content) => `
    <div style="margin-bottom:14pt">
      <div style="font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.6);border-bottom:1pt solid rgba(255,255,255,0.2);padding-bottom:4pt;margin-bottom:8pt">${title}</div>
      ${content}
    </div>`;

  const mainSection = (title, content) => `
    <div style="margin-bottom:14pt">
      <div style="font-size:9.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.09em;color:#4A7C59;border-bottom:1pt solid #E0DAD0;padding-bottom:3pt;margin-bottom:8pt">${title}</div>
      ${content}
    </div>`;

  const skillsHTML = skills.map(sk => `<div style="font-size:9.5pt;color:rgba(255,255,255,0.85);padding:2pt 0">${typeof sk === 'string' ? sk : sk.name || ''}</div>`).join('');

  const certSideHTML = certifications.map(c => `<div style="font-size:9pt;color:rgba(255,255,255,0.85);margin-bottom:4pt"><div style="font-weight:600">${c.name}</div>${c.issuer ? `<div style="opacity:0.7;font-size:8.5pt">${c.issuer}</div>` : ''}</div>`).join('');

  const expHTML = experience.map(exp => `
    <div class="no-break" style="margin-bottom:10pt">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8pt">
        <div style="font-weight:700;font-size:10.5pt">${exp.role || ''}</div>
        <span style="font-size:8.5pt;color:#8A8070;flex-shrink:0">${dateRange(exp)}</span>
      </div>
      <div style="color:#4A7C59;font-weight:600;font-size:9.5pt;margin-bottom:3pt">${exp.company || ''}${exp.location ? ` · ${exp.location}` : ''}</div>
      ${(exp.bullets || []).length ? `<ul style="margin:0 0 0 14pt;padding:0">${exp.bullets.map(b => `<li style="font-size:9.5pt;color:#3A3A3A;margin-bottom:2pt;line-height:1.5">${b}</li>`).join('')}</ul>` : ''}
    </div>`).join('');

  const eduHTML = education.map(edu => `
    <div class="no-break" style="margin-bottom:8pt">
      <div style="font-weight:700;font-size:10.5pt">${edu.degree || ''}${edu.field ? ` in ${edu.field}` : ''}</div>
      <div style="color:#4A7C59;font-size:9.5pt;font-weight:600">${edu.institution || ''}</div>
      <div style="font-size:8.5pt;color:#8A8070">${fmtDate(edu.graduationDate)}${edu.gpa ? ` · GPA ${edu.gpa}` : ''}</div>
    </div>`).join('');

  const projHTML = projects.map(p => `
    <div class="no-break" style="margin-bottom:8pt">
      <div style="font-weight:700;font-size:10.5pt">${p.name || ''}</div>
      ${p.description ? `<div style="font-size:9.5pt;color:#3A3A3A;line-height:1.5;margin-top:2pt">${p.description}</div>` : ''}
    </div>`).join('');

  const sidebar = `
    <div style="width:68mm;background:#2D4A38;color:white;padding:22mm 14mm;flex-shrink:0;min-height:297mm;box-sizing:border-box">
      <div style="font-size:17pt;font-weight:700;letter-spacing:-0.02em;line-height:1.2;margin-bottom:4pt;word-break:break-word">${contact.name || ''}</div>
      ${contact.title ? `<div style="font-size:9.5pt;color:rgba(255,255,255,0.7);font-weight:500;margin-bottom:16pt">${contact.title}</div>` : '<div style="margin-bottom:16pt"></div>'}
      ${sidebarSection('Contact', `
        ${contact.email ? `<div style="font-size:8.5pt;color:rgba(255,255,255,0.8);margin-bottom:3pt;word-break:break-all">${contact.email}</div>` : ''}
        ${contact.phone ? `<div style="font-size:8.5pt;color:rgba(255,255,255,0.8);margin-bottom:3pt">${contact.phone}</div>` : ''}
        ${contact.location ? `<div style="font-size:8.5pt;color:rgba(255,255,255,0.8);margin-bottom:3pt">${contact.location}</div>` : ''}
        ${contact.linkedin ? `<div style="font-size:8.5pt;color:rgba(255,255,255,0.8);margin-bottom:3pt;word-break:break-all">${contact.linkedin}</div>` : ''}
        ${contact.website ? `<div style="font-size:8.5pt;color:rgba(255,255,255,0.8);word-break:break-all">${contact.website}</div>` : ''}
      `)}
      ${skills.length ? sidebarSection('Skills', skillsHTML) : ''}
      ${certifications.length ? sidebarSection('Certifications', certSideHTML) : ''}
    </div>`;

  const main = `
    <div style="flex:1;padding:20mm 16mm;box-sizing:border-box;min-height:297mm;overflow:hidden">
      ${watermarkHTML(isPremium)}
      ${s.summary ? mainSection('Profile', `<p style="font-size:9.5pt;color:#3A3A3A;line-height:1.6">${s.summary}</p>`) : ''}
      ${experience.length ? mainSection('Experience', expHTML) : ''}
      ${education.length ? mainSection('Education', eduHTML) : ''}
      ${projects.length ? mainSection('Projects', projHTML) : ''}
    </div>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${FONT_LINK}
<style>
  ${BASE_STYLE}
  body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; }
</style>
</head>
<body>
<div class="resume-document" style="width:210mm;min-height:297mm;display:flex;background:white;font-family:'Inter',sans-serif;font-size:10pt;line-height:1.5;position:relative">
  ${sidebar}
  ${main}
</div>
</body>
</html>`;
}

// ─── Minimal template ─────────────────────────────────────────────────────────
// Single-column, typographic, generous whitespace, no color — name in thin large
// font, gray caps section labels with hairline rule, dates in light gray.

function buildMinimal(resumeData, isPremium) {
  const { s, contact, experience, education, skills, certifications, projects, awards } = prep(resumeData);

  const sectionTitle = (title) => `
    <div style="font-size:8pt;font-weight:600;text-transform:uppercase;letter-spacing:0.14em;color:#999;border-bottom:0.5pt solid #E0E0E0;padding-bottom:4pt;margin:16pt 0 9pt">${title}</div>`;

  const expHTML = experience.map(exp => `
    <div class="no-break" style="margin-bottom:12pt">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10pt">
        <span style="font-weight:600;font-size:10.5pt">${exp.role || ''}</span>
        <span style="font-size:8.5pt;color:#AAAAAA;flex-shrink:0;font-weight:300">${dateRange(exp)}</span>
      </div>
      <div style="font-size:9.5pt;color:#777;margin-bottom:4pt">${exp.company || ''}${exp.location ? ` · ${exp.location}` : ''}</div>
      ${(exp.bullets || []).length ? `<ul style="margin:0 0 0 14pt;padding:0">${exp.bullets.map(b => `<li style="font-size:9.5pt;color:#3A3A3A;margin-bottom:2pt;line-height:1.55">${b}</li>`).join('')}</ul>` : ''}
    </div>`).join('');

  const eduHTML = education.map(edu => `
    <div class="no-break" style="margin-bottom:8pt;display:flex;justify-content:space-between;align-items:baseline;gap:10pt">
      <div>
        <span style="font-weight:600;font-size:10.5pt">${edu.degree || ''}${edu.field ? ` in ${edu.field}` : ''}</span>
        <div style="font-size:9.5pt;color:#777">${edu.institution || ''}${edu.gpa ? ` · GPA ${edu.gpa}` : ''}</div>
      </div>
      <span style="font-size:8.5pt;color:#AAAAAA;flex-shrink:0;font-weight:300">${fmtDate(edu.graduationDate)}</span>
    </div>`).join('');

  const skillsHTML = skills.length ? `<div style="font-size:9.5pt;color:#3A3A3A;line-height:1.9">${skills.map(sk => typeof sk === 'string' ? sk : sk.name || '').join(' · ')}</div>` : '';

  const certHTML = certifications.map(c => `<div style="font-size:9.5pt;color:#3A3A3A;margin-bottom:3pt"><span style="font-weight:600">${c.name}</span>${c.issuer ? ` — ${c.issuer}` : ''}${c.date ? ` <span style="color:#AAAAAA">${fmtDate(c.date)}</span>` : ''}</div>`).join('');

  const projHTML = projects.map(p => `
    <div class="no-break" style="margin-bottom:9pt">
      <div style="font-weight:600;font-size:10.5pt">${p.name || ''}</div>
      ${p.description ? `<div style="font-size:9.5pt;color:#555;line-height:1.55;margin-top:2pt">${p.description}</div>` : ''}
    </div>`).join('');

  return wrapDoc(`
    ${watermarkHTML(isPremium)}
    <div style="margin-bottom:18pt">
      <div style="font-size:26pt;font-weight:300;letter-spacing:-0.03em;color:#1A1A1A;line-height:1">${contact.name || ''}</div>
      ${contact.title ? `<div style="font-size:11pt;font-weight:400;color:#777;margin-top:4pt">${contact.title}</div>` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:10pt;font-size:8.5pt;color:#999;margin-top:8pt;font-weight:300">
        ${contact.email ? `<span>${contact.email}</span>` : ''}
        ${contact.phone ? `<span>${contact.phone}</span>` : ''}
        ${contact.location ? `<span>${contact.location}</span>` : ''}
        ${contact.linkedin ? `<span>${contact.linkedin}</span>` : ''}
        ${contact.website ? `<span>${contact.website}</span>` : ''}
      </div>
    </div>
    ${s.summary ? `${sectionTitle('Summary')}<p style="font-size:10pt;color:#555;line-height:1.65;font-weight:300">${s.summary}</p>` : ''}
    ${experience.length ? `${sectionTitle('Experience')}${expHTML}` : ''}
    ${education.length ? `${sectionTitle('Education')}${eduHTML}` : ''}
    ${skills.length ? `${sectionTitle('Skills')}${skillsHTML}` : ''}
    ${projects.length ? `${sectionTitle('Projects')}${projHTML}` : ''}
    ${certifications.length ? `${sectionTitle('Certifications')}${certHTML}` : ''}
  `, 'Inter', '22mm 20mm', isPremium);
}

// ─── Doc wrapper ──────────────────────────────────────────────────────────────

function wrapDoc(body, font, padding, isPremium) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${FONT_LINK}
<style>
  ${BASE_STYLE}
  body { font-family: '${font}', 'Helvetica Neue', Arial, sans-serif; }
</style>
</head>
<body>
<div class="resume-document" style="width:210mm;min-height:297mm;padding:${padding};background:white;color:#1A1A1A;font-family:'${font}',sans-serif;font-size:10.5pt;line-height:1.5;box-sizing:border-box;position:relative">
  ${body}
</div>
</body>
</html>`;
}
