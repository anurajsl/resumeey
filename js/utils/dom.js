/* DOM Utilities */

/**
 * Query selector shorthand
 */
export const $ = (selector, context = document) => context.querySelector(selector);
export const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

/**
 * Create element with options
 */
export function el(tag, options = {}, children = []) {
  const { cls, attrs = {}, style = {}, text, html, events = {}, data = {} } = options;
  const element = document.createElement(tag);

  if (cls) {
    const classes = Array.isArray(cls) ? cls : cls.split(' ').filter(Boolean);
    element.classList.add(...classes);
  }

  Object.entries(attrs).forEach(([key, val]) => {
    if (val !== null && val !== undefined) element.setAttribute(key, val);
  });

  Object.entries(style).forEach(([key, val]) => {
    element.style[key] = val;
  });

  Object.entries(data).forEach(([key, val]) => {
    element.dataset[key] = val;
  });

  Object.entries(events).forEach(([event, handler]) => {
    element.addEventListener(event, handler);
  });

  if (text !== undefined) element.textContent = text;
  if (html !== undefined) element.innerHTML = sanitizeHTML(html);

  if (Array.isArray(children)) {
    children.filter(Boolean).forEach(child => {
      element.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
  }

  return element;
}

/**
 * Sanitize HTML to prevent XSS (basic sanitization)
 * For user-controlled content only; AI output is treated as trusted.
 */
export function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Render raw HTML safely using a template — only use for known-safe content
 */
export function rawHTML(html) {
  return html;
}

/**
 * Show/hide element
 */
export function show(el) {
  if (el) el.style.display = '';
}

export function hide(el) {
  if (el) el.style.display = 'none';
}

export function toggle(el, condition) {
  if (!el) return;
  el.style.display = condition ? '' : 'none';
}

/**
 * Add/remove classes
 */
export function addClass(el, ...classes) {
  if (el) el.classList.add(...classes);
}

export function removeClass(el, ...classes) {
  if (el) el.classList.remove(...classes);
}

export function toggleClass(el, cls, condition) {
  if (!el) return;
  el.classList.toggle(cls, condition);
}

/**
 * Scroll to element
 */
export function scrollIntoView(el, options = { behavior: 'smooth', block: 'nearest' }) {
  if (el) el.scrollIntoView(options);
}

/**
 * Empty a container
 */
export function empty(el) {
  if (el) el.innerHTML = '';
}

/**
 * Append children to element
 */
export function append(parent, ...children) {
  children.filter(Boolean).forEach(child => {
    if (typeof child === 'string') {
      parent.appendChild(document.createTextNode(child));
    } else {
      parent.appendChild(child);
    }
  });
}

/**
 * Replace element content with new children
 */
export function replaceContent(parent, ...children) {
  empty(parent);
  append(parent, ...children);
}

/**
 * Render list into container
 */
export function renderList(container, items, renderFn, emptyEl = null) {
  empty(container);
  if (!items || items.length === 0) {
    if (emptyEl) container.appendChild(emptyEl);
    return;
  }
  items.forEach((item, i) => {
    const child = renderFn(item, i);
    if (child) container.appendChild(child);
  });
}

/**
 * Set text content safely
 */
export function setText(el, text) {
  if (el) el.textContent = text ?? '';
}

/**
 * Get/set attribute
 */
export function attr(el, key, val) {
  if (!el) return;
  if (val === undefined) return el.getAttribute(key);
  if (val === null) el.removeAttribute(key);
  else el.setAttribute(key, val);
}

/**
 * Delegate event listener
 */
export function delegate(parent, selector, event, handler) {
  parent.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target && parent.contains(target)) {
      handler.call(target, e, target);
    }
  });
}

/**
 * One-time event listener
 */
export function once(el, event, handler) {
  el.addEventListener(event, handler, { once: true });
}

/**
 * Wait for next animation frame
 */
export function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

/**
 * Wait for transition to end
 */
export function waitForTransition(el) {
  return new Promise(resolve => {
    const onEnd = () => {
      el.removeEventListener('transitionend', onEnd);
      resolve();
    };
    el.addEventListener('transitionend', onEnd);
  });
}

/**
 * Create SVG icon element
 */
export function icon(paths, size = 20) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = paths;
  return svg;
}

/**
 * Format number with compact notation
 */
export function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

/**
 * Detect if running as installed PWA
 */
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  } else {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}

/**
 * Generate initials from name
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}
