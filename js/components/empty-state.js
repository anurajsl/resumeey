/* Empty State Component */

export function createEmptyState({ icon, title, description, action } = {}) {
  const el = document.createElement('div');
  el.className = 'empty-state';

  el.innerHTML = `
    <div class="empty-state-icon">
      ${icon || defaultIcon()}
    </div>
    <div>
      <div class="empty-state-title">${title || 'Nothing here yet'}</div>
      ${description ? `<div class="empty-state-description">${description}</div>` : ''}
    </div>
    ${action ? `
      <button class="btn btn-primary empty-state-action">
        ${action.label}
      </button>
    ` : ''}
  `;

  if (action?.onClick) {
    el.querySelector('.empty-state-action')?.addEventListener('click', action.onClick);
  }

  return el;
}

function defaultIcon() {
  return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
}
