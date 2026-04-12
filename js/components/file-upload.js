/* Drag-and-Drop File Upload Zone */

export function createFileUpload({ accept, onFile, label, hint } = {}) {
  const el = document.createElement('div');
  el.className = 'file-upload-zone';
  el.setAttribute('tabindex', '0');
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', label || 'Upload file');

  el.innerHTML = `
    <div class="file-upload-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    </div>
    <div class="file-upload-title">${label || 'Upload file'}</div>
    <div class="file-upload-hint">${hint || 'Drag & drop or tap to browse'}</div>
    <input type="file" accept="${accept || '*'}" style="display:none" aria-hidden="true" />
  `;

  const input = el.querySelector('input[type="file"]');

  const handleFile = (file) => {
    if (!file) return;
    onFile?.(file);
  };

  el.addEventListener('click', () => input.click());
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });

  input.addEventListener('change', () => handleFile(input.files[0]));

  el.addEventListener('dragover', (e) => {
    e.preventDefault();
    el.classList.add('dragover');
  });

  el.addEventListener('dragleave', () => el.classList.remove('dragover'));

  el.addEventListener('drop', (e) => {
    e.preventDefault();
    el.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
  });

  return el;
}
