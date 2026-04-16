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

  // Build HTML document
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
  const s = resumeData.sections || {};
  const contact = s.contact || {};
  const experience = s.experience || [];
  const education = s.education || [];
  const skills = s.skills || [];
  const certifications = s.certifications || [];
  const projects = s.projects || [];

  const formatDate = (d) => {
    if (!d) return '';
    const [year, month] = d.split('-');
    const months = ['', 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(month)] || ''} ${year}`;
  };

  const watermark = !isPremium ? '<div style="position:absolute;bottom:20mm;right:20mm;font-size:8pt;color:#ccc;transform:rotate(-45deg)">Created with Resumey Free</div>' : '';

  const expHTML = experience.map(exp => `
    <div class="no-break" style="margin-bottom:10pt">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <div>
          <div style="font-weight:700;font-size:10.5pt">${exp.role || ''}</div>
          <div style="color:#4A7C59;font-weight:600;font-size:10pt">${exp.company || ''}${exp.location ? ` · ${exp.location}` : ''}</div>
        </div>
        <div style="font-size:9pt;color:#6B6860;text-align:right;flex-shrink:0">
          ${formatDate(exp.startDate)} – ${exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
        </div>
      </div>
      ${(exp.bullets || []).length > 0 ? `
      <ul style="margin:4pt 0 0 14pt;padding:0">
        ${exp.bullets.map(b => `<li style="font-size:10pt;color:#3A3A3A;margin-bottom:2pt;line-height:1.5">${b}</li>`).join('')}
      </ul>` : ''}
    </div>
  `).join('');

  const eduHTML = education.map(edu => `
    <div class="no-break" style="margin-bottom:8pt">
      <div style="display:flex;justify-content:space-between">
        <div>
          <div style="font-weight:700;font-size:10.5pt">${edu.degree || ''}${edu.field ? ` in ${edu.field}` : ''}</div>
          <div style="color:#4A7C59;font-size:10pt;font-weight:600">${edu.institution || ''}</div>
        </div>
        <div style="font-size:9pt;color:#6B6860">${formatDate(edu.graduationDate)}</div>
      </div>
      ${edu.gpa ? `<div style="font-size:9pt;color:#6B6860;margin-top:2pt">GPA: ${edu.gpa}</div>` : ''}
    </div>
  `).join('');

  const skillsHTML = skills.length > 0
    ? `<div style="display:flex;flex-wrap:wrap;gap:5pt">
        ${skills.map(s => `<span style="background:#EEF5F1;color:#3A6347;border-radius:3pt;padding:2pt 7pt;font-size:9pt;font-weight:600">${typeof s === 'string' ? s : s.name || ''}</span>`).join('')}
      </div>`
    : '';

  const certHTML = certifications.length > 0
    ? `<div style="display:flex;flex-direction:column;gap:3pt">
        ${certifications.map(c => `<div style="font-size:10pt"><span style="font-weight:600">${c.name}</span>${c.issuer ? ` — ${c.issuer}` : ''}${c.date ? ` (${formatDate(c.date)})` : ''}</div>`).join('')}
      </div>` : '';

  const sectionTitle = (title) => `
    <div style="font-size:10.5pt;font-weight:700;color:#4A7C59;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1pt solid #E0DAD0;padding-bottom:3pt;margin:14pt 0 8pt">
      ${title}
    </div>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; }
  ul { list-style: disc; }
  a { color: inherit; text-decoration: none; }
  .no-break { page-break-inside: avoid; }
</style>
</head>
<body>
<div class="resume-document" style="width:210mm;min-height:297mm;padding:20mm 18mm;background:white;color:#1A1A1A;font-family:'Inter',sans-serif;font-size:10.5pt;line-height:1.5;box-sizing:border-box;position:relative">
  ${watermark}
  <!-- Header -->
  <div style="text-align:center;padding-bottom:14pt;border-bottom:2pt solid #4A7C59;margin-bottom:14pt">
    <div style="font-size:22pt;font-weight:700;color:#1A1A1A;letter-spacing:-0.02em;margin-bottom:3pt">${contact.name || ''}</div>
    ${s.summary?.slice ? `<div style="font-size:10.5pt;color:#4A7C59;font-weight:600;margin-bottom:6pt">${s.summary.slice(0, 100)}</div>` : ''}
    <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:14pt;font-size:9pt;color:#6B6860">
      ${contact.email ? `<span>${contact.email}</span>` : ''}
      ${contact.phone ? `<span>${contact.phone}</span>` : ''}
      ${contact.location ? `<span>${contact.location}</span>` : ''}
      ${contact.linkedin ? `<span>${contact.linkedin}</span>` : ''}
      ${contact.website ? `<span>${contact.website}</span>` : ''}
    </div>
  </div>

  ${s.summary ? `
  ${sectionTitle('Professional Summary')}
  <p style="font-size:10pt;color:#3A3A3A;line-height:1.6">${s.summary}</p>
  ` : ''}

  ${experience.length > 0 ? `${sectionTitle('Experience')}${expHTML}` : ''}
  ${education.length > 0 ? `${sectionTitle('Education')}${eduHTML}` : ''}
  ${skills.length > 0 ? `${sectionTitle('Skills')}${skillsHTML}` : ''}
  ${certifications.length > 0 ? `${sectionTitle('Certifications')}${certHTML}` : ''}
</div>
</body>
</html>`;
}
