/* Loading Skeleton */

export function createSkeleton(type = 'card') {
  const el = document.createElement('div');

  if (type === 'card') {
    el.innerHTML = `
      <div class="card" style="padding:20px">
        <div class="skeleton skeleton-text w-3-4" style="height:16px;margin-bottom:8px"></div>
        <div class="skeleton skeleton-text w-1-2" style="height:12px;margin-bottom:16px"></div>
        <div class="skeleton skeleton-text" style="height:10px;margin-bottom:6px"></div>
        <div class="skeleton skeleton-text" style="height:10px;margin-bottom:6px"></div>
        <div class="skeleton skeleton-text w-3-4" style="height:10px"></div>
      </div>
    `;
  } else if (type === 'list') {
    el.innerHTML = Array.from({ length: 3 }, () => `
      <div style="display:flex;align-items:center;gap:16px;padding:16px;border-bottom:1px solid var(--color-border)">
        <div class="skeleton skeleton-circle" style="width:44px;height:44px;flex-shrink:0"></div>
        <div style="flex:1">
          <div class="skeleton skeleton-text w-3-4" style="height:14px;margin-bottom:6px"></div>
          <div class="skeleton skeleton-text w-1-2" style="height:11px"></div>
        </div>
        <div class="skeleton" style="width:40px;height:40px;border-radius:50%"></div>
      </div>
    `).join('');
  } else if (type === 'header') {
    el.innerHTML = `
      <div style="padding:24px">
        <div class="skeleton skeleton-text w-1-2" style="height:28px;margin-bottom:8px"></div>
        <div class="skeleton skeleton-text w-3-4" style="height:14px"></div>
      </div>
    `;
  } else if (type === 'text') {
    el.innerHTML = `
      <div class="skeleton skeleton-text" style="height:12px;margin-bottom:6px"></div>
      <div class="skeleton skeleton-text w-3-4" style="height:12px;margin-bottom:6px"></div>
      <div class="skeleton skeleton-text w-1-2" style="height:12px"></div>
    `;
  }

  return el;
}

export function showLoadingOverlay(container, type = 'card', count = 1) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    container.appendChild(createSkeleton(type));
  }
}
