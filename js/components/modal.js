/* Modal System */

let _currentModal = null;

export function openModal({ title, body, footer, onClose, size = 'default' } = {}) {
  closeModal();

  const overlay = document.getElementById('modal-overlay');
  const container = document.getElementById('modal-container');
  if (!overlay || !container) return;

  const modal = document.createElement('div');
  modal.className = 'modal';
  if (size === 'large') modal.style.maxWidth = '600px';

  modal.innerHTML = `
    <div class="modal-handle"></div>
    <div class="modal-header">
      <h3 class="modal-title">${title || ''}</h3>
      <button class="btn-icon modal-close-btn" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body"></div>
    ${footer ? '<div class="modal-footer safe-bottom"></div>' : ''}
  `;

  // Insert body
  const bodyEl = modal.querySelector('.modal-body');
  if (typeof body === 'string') {
    bodyEl.innerHTML = body;
  } else if (body instanceof HTMLElement) {
    bodyEl.appendChild(body);
  }

  // Insert footer
  if (footer) {
    const footerEl = modal.querySelector('.modal-footer');
    if (typeof footer === 'string') {
      footerEl.innerHTML = footer;
    } else if (footer instanceof HTMLElement) {
      footerEl.appendChild(footer);
    }
  }

  container.appendChild(modal);

  // Activate
  requestAnimationFrame(() => {
    overlay.classList.add('active');
    container.classList.add('active');
    requestAnimationFrame(() => modal.classList.add('open'));
  });

  const close = () => closeModal(onClose);
  modal.querySelector('.modal-close-btn').addEventListener('click', close);
  overlay.addEventListener('click', close, { once: true });

  // Close on Escape
  const escHandler = (e) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', escHandler);

  _currentModal = { modal, escHandler, onClose };
  return { close, modal };
}

export function closeModal(callback) {
  if (!_currentModal) return;
  const { modal, escHandler, onClose } = _currentModal;
  _currentModal = null;

  document.removeEventListener('keydown', escHandler);

  const overlay = document.getElementById('modal-overlay');
  const container = document.getElementById('modal-container');

  modal.classList.remove('open');
  overlay?.classList.remove('active');
  container?.classList.remove('active');

  setTimeout(() => {
    modal.remove();
    if (callback) callback();
    else if (onClose) onClose();
  }, 280);
}

export function confirmModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex;gap:12px;width:100%';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary btn-block';
    cancelBtn.textContent = cancelText;

    const confirmBtn = document.createElement('button');
    confirmBtn.className = `btn ${danger ? 'btn-danger' : 'btn-primary'} btn-block`;
    confirmBtn.textContent = confirmText;

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    const { close } = openModal({
      title,
      body: `<p style="color:var(--color-text-secondary);font-size:var(--text-base);line-height:var(--leading-relaxed)">${message}</p>`,
      footer,
    });

    cancelBtn.addEventListener('click', () => { close(); resolve(false); });
    confirmBtn.addEventListener('click', () => { close(); resolve(true); });
  });
}

export function alertModal({ title, message }) {
  return new Promise((resolve) => {
    const footer = document.createElement('button');
    footer.className = 'btn btn-primary btn-block';
    footer.textContent = 'OK';

    const { close } = openModal({
      title,
      body: `<p style="color:var(--color-text-secondary);font-size:var(--text-base);line-height:var(--leading-relaxed)">${message}</p>`,
      footer,
      onClose: resolve,
    });

    footer.addEventListener('click', () => { close(); resolve(); });
  });
}
