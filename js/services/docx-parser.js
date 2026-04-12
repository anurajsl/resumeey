/* Mammoth.js DOCX Parser Wrapper */

const MAMMOTH_CDN = 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js';

let _mammoth = null;

async function getMammoth() {
  if (_mammoth) return _mammoth;

  if (window.mammoth) {
    _mammoth = window.mammoth;
    return _mammoth;
  }

  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = MAMMOTH_CDN;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Mammoth.js'));
    document.head.appendChild(script);
  });

  _mammoth = window.mammoth;
  return _mammoth;
}

export async function parseDOCX(file) {
  const mammoth = await getMammoth();
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || '';
}
