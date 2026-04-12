/* SVG Circular Score Ring */

import { scoreColorClass, scoreLabel } from '../utils/formatters.js';

/**
 * Create an SVG score ring
 * @param {number} score - 0 to 100
 * @param {object} options
 * @returns {HTMLElement}
 */
export function createScoreRing(score, {
  size = 120,
  strokeWidth = 8,
  showLabel = true,
  showPercent = true,
  label = '',
  animate = true,
} = {}) {
  const radius = (size / 2) - strokeWidth - 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const colorClass = scoreColorClass(score);

  const colorMap = {
    'score-great': '#3D8B5F',
    'score-good':  '#4A7C59',
    'score-ok':    '#B8860B',
    'score-poor':  '#C0392B',
  };
  const color = colorMap[colorClass] || '#4A7C59';

  const wrapper = document.createElement('div');
  wrapper.className = 'score-ring-wrapper';
  wrapper.style.width = size + 'px';
  wrapper.style.height = size + 'px';

  const cx = size / 2;
  const cy = size / 2;

  wrapper.innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="${animate ? 'ring-animated' : ''}">
      <style>
        .ring-animated circle.ring-fill {
          --circumference: ${circumference};
          --offset: ${offset};
          stroke-dasharray: ${circumference};
          stroke-dashoffset: ${circumference};
          animation: ringDraw 1s cubic-bezier(0.16,1,0.3,1) forwards;
          animation-delay: 150ms;
        }
      </style>
      <!-- Track -->
      <circle
        cx="${cx}" cy="${cy}" r="${radius}"
        fill="none"
        stroke="var(--color-bg-secondary)"
        stroke-width="${strokeWidth}"
      />
      <!-- Fill -->
      <circle
        class="ring-fill"
        cx="${cx}" cy="${cy}" r="${radius}"
        fill="none"
        stroke="${color}"
        stroke-width="${strokeWidth}"
        stroke-linecap="round"
        transform="rotate(-90 ${cx} ${cy})"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${animate ? circumference : offset}"
      />
    </svg>
    ${showLabel ? `
    <div class="score-ring-label">
      ${showPercent ? `<div class="score-ring-value ${colorClass}">${Math.round(score)}</div>` : ''}
      ${showPercent ? '<div class="score-ring-unit">%</div>' : ''}
      ${label ? `<div style="font-size:11px;color:var(--color-text-tertiary);margin-top:2px">${label}</div>` : ''}
    </div>` : ''}
  `;

  if (animate) {
    requestAnimationFrame(() => {
      const fill = wrapper.querySelector('.ring-fill');
      if (fill) {
        fill.style.strokeDashoffset = circumference;
      }
    });
  }

  return wrapper;
}

/**
 * Mini score badge (inline)
 */
export function scoreBadge(score) {
  const cls = scoreColorClass(score);
  const el = document.createElement('span');
  el.className = `badge badge-score ${cls}`;
  el.style.cssText = `
    display:inline-flex;align-items:center;gap:3px;
    font-size:12px;font-weight:700;padding:3px 8px;
    border-radius:999px;
  `;
  const colorMap = {
    'score-great': { bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
    'score-good':  { bg: 'var(--color-primary-bg)', color: 'var(--color-primary)' },
    'score-ok':    { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
    'score-poor':  { bg: 'var(--color-error-bg)',   color: 'var(--color-error)' },
  };
  const c = colorMap[cls] || colorMap['score-poor'];
  el.style.background = c.bg;
  el.style.color = c.color;
  el.textContent = `${Math.round(score)}%`;
  return el;
}
