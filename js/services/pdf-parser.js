/* PDF.js Parser Wrapper */

const PDF_JS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const WORKER_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

let _pdfjsLib = null;

async function getPDFJS() {
  if (_pdfjsLib) return _pdfjsLib;

  if (window.pdfjsLib) {
    _pdfjsLib = window.pdfjsLib;
    return _pdfjsLib;
  }

  // Dynamically load PDF.js
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PDF_JS_CDN;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(script);
  });

  _pdfjsLib = window.pdfjsLib;
  _pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_CDN;
  return _pdfjsLib;
}

export async function parsePDF(file) {
  const pdfjs = await getPDFJS();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const textParts = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map(item => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    textParts.push(pageText);
  }

  return textParts.join('\n\n');
}
