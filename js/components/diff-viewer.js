/* Before/After Diff Viewer */

export function createDiffViewer(before, after) {
  const el = document.createElement('div');
  el.className = 'diff-viewer';
  el.innerHTML = `
    <div class="diff-before">
      <div class="diff-label">Before</div>
      <div class="diff-text"></div>
    </div>
    <div class="diff-after">
      <div class="diff-label">After</div>
      <div class="diff-text"></div>
    </div>
  `;
  el.querySelector('.diff-before .diff-text').textContent = before || '';
  el.querySelector('.diff-after .diff-text').textContent = after || '';
  return el;
}

export function createOptimizationCard({ original, optimized, onAccept, onReject, onRegenerate }) {
  const el = document.createElement('div');
  el.className = 'optimize-bullet-item';

  const diff = createDiffViewer(original, optimized);

  const actions = document.createElement('div');
  actions.className = 'bullet-actions';
  actions.innerHTML = `
    <button class="btn btn-sm btn-primary btn-accept">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      Accept
    </button>
    ${onRegenerate ? `
    <button class="btn btn-sm btn-secondary btn-regen">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      Regenerate
    </button>` : ''}
    <button class="btn btn-sm btn-ghost btn-reject" style="margin-left:auto;color:var(--color-error)">
      Skip
    </button>
  `;

  el.appendChild(diff);
  el.appendChild(actions);

  actions.querySelector('.btn-accept')?.addEventListener('click', () => onAccept?.(optimized));
  actions.querySelector('.btn-regen')?.addEventListener('click', onRegenerate);
  actions.querySelector('.btn-reject')?.addEventListener('click', () => onReject?.());

  return el;
}
