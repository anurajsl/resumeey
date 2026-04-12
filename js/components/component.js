/* Base Component Class */

export class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this._el = null;
    this._mounted = false;
    this._subs = [];
    this._cleanup = [];
  }

  /**
   * Override to return the root element
   */
  render() {
    throw new Error('Component.render() must be implemented');
  }

  /**
   * Called after render + mount to DOM
   */
  afterMount() {}

  /**
   * Called before unmount
   */
  beforeUnmount() {}

  /**
   * Mount component into a container
   */
  mount(container) {
    if (this._mounted) this.unmount();

    const el = this.render();
    this._el = el;

    if (typeof container === 'string') {
      container = document.querySelector(container);
    }

    if (!container) {
      console.error('Component.mount: container not found');
      return this;
    }

    container.innerHTML = '';
    container.appendChild(el);
    this._mounted = true;

    requestAnimationFrame(() => this.afterMount());
    return this;
  }

  /**
   * Append component into container (without clearing)
   */
  appendTo(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    const el = this.render();
    this._el = el;
    container.appendChild(el);
    this._mounted = true;
    requestAnimationFrame(() => this.afterMount());
    return this;
  }

  /**
   * Update state and optionally re-render
   */
  setState(newState) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.onStateChange(this.state, prevState);
  }

  /**
   * Override to react to state changes (re-render or partial update)
   */
  onStateChange(state, prevState) {}

  /**
   * Unmount and cleanup
   */
  unmount() {
    this.beforeUnmount();
    this._subs.forEach(unsub => { try { unsub(); } catch {} });
    this._cleanup.forEach(fn => { try { fn(); } catch {} });
    this._subs = [];
    this._cleanup = [];
    if (this._el?.parentNode) {
      this._el.parentNode.removeChild(this._el);
    }
    this._el = null;
    this._mounted = false;
  }

  /**
   * Register a cleanup function (called on unmount)
   */
  addCleanup(fn) {
    this._cleanup.push(fn);
  }

  /**
   * Add event listener with auto cleanup
   */
  listen(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    this.addCleanup(() => target.removeEventListener(event, handler, options));
  }

  /**
   * Subscribe to store with auto cleanup
   */
  subscribe(observable, handler) {
    const unsub = observable.subscribe(handler);
    this._subs.push(unsub);
    return unsub;
  }

  /**
   * Get root element
   */
  get el() {
    return this._el;
  }

  /**
   * Query within this component
   */
  $(selector) {
    return this._el?.querySelector(selector);
  }

  $$(selector) {
    return this._el ? [...this._el.querySelectorAll(selector)] : [];
  }
}
