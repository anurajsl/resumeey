/* Hash-based SPA Router */

import { events, EVENTS } from './events.js';

class Router {
  constructor() {
    this._routes = new Map();
    this._currentRoute = null;
    this._beforeEach = null;
    this._notFound = null;
    this._started = false;
  }

  /**
   * Register a route
   * @param {string} pattern - e.g. '/jobs/:id'
   * @param {Function} handler - async (params, query) => void
   */
  on(pattern, handler) {
    this._routes.set(pattern, { pattern, handler, regex: patternToRegex(pattern) });
    return this;
  }

  /**
   * Register 404 handler
   */
  notFound(handler) {
    this._notFound = handler;
    return this;
  }

  /**
   * Register navigation guard
   */
  beforeEach(fn) {
    this._beforeEach = fn;
    return this;
  }

  /**
   * Start listening to hashchange
   */
  start() {
    if (this._started) return;
    this._started = true;
    window.addEventListener('hashchange', () => this._resolve());
    this._resolve();
  }

  /**
   * Navigate to a path
   */
  navigate(path, replace = false) {
    const hash = '#' + path;
    if (replace) {
      history.replaceState(null, '', hash);
      this._resolve();
    } else {
      window.location.hash = path;
    }
  }

  /**
   * Replace current route without history entry
   */
  replace(path) {
    this.navigate(path, true);
  }

  /**
   * Get current path
   */
  get currentPath() {
    const hash = window.location.hash;
    return hash ? hash.slice(1).split('?')[0] : '/';
  }

  get currentQuery() {
    const hash = window.location.hash;
    if (!hash) return {};
    const queryStr = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
    return Object.fromEntries(new URLSearchParams(queryStr));
  }

  async _resolve() {
    const path = this.currentPath || '/';
    const query = this.currentQuery;

    // Run before guard
    if (this._beforeEach) {
      const canProceed = await this._beforeEach(path);
      if (canProceed === false) return;
    }

    // Find matching route
    for (const [, route] of this._routes) {
      const match = path.match(route.regex);
      if (match) {
        const params = extractParams(route.pattern, match);
        this._currentRoute = { pattern: route.pattern, path, params, query };
        events.emit(EVENTS.ROUTE_CHANGE, this._currentRoute);
        try {
          await route.handler(params, query);
        } catch (err) {
          console.error(`Router error on "${path}":`, err);
        }
        return;
      }
    }

    // Not found
    if (this._notFound) {
      await this._notFound(path);
    }
  }
}

function patternToRegex(pattern) {
  const escaped = pattern
    .replace(/[.+*?^${}()|[\]\\]/g, '\\$&')
    .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '([^/]+)');
  return new RegExp(`^${escaped}$`);
}

function extractParams(pattern, match) {
  const paramNames = [];
  const re = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let m;
  while ((m = re.exec(pattern)) !== null) paramNames.push(m[1]);
  const params = {};
  paramNames.forEach((name, i) => { params[name] = decodeURIComponent(match[i + 1]); });
  return params;
}

export const router = new Router();
