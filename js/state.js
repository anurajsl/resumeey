/* Pub/Sub State Store */

class Store {
  constructor(initial = {}) {
    this._state = { ...initial };
    this._listeners = new Map();
  }

  get(key) {
    return key ? this._state[key] : { ...this._state };
  }

  set(key, value) {
    const prev = this._state[key];
    this._state[key] = value;
    if (prev !== value) {
      this._notify(key, value, prev);
      this._notify('*', this._state, null);
    }
  }

  update(key, updater) {
    const prev = this._state[key];
    const next = updater(prev);
    this.set(key, next);
  }

  merge(updates) {
    const changed = [];
    Object.entries(updates).forEach(([k, v]) => {
      if (this._state[k] !== v) {
        const prev = this._state[k];
        this._state[k] = v;
        changed.push({ key: k, value: v, prev });
      }
    });
    changed.forEach(({ key, value, prev }) => this._notify(key, value, prev));
    if (changed.length) this._notify('*', this._state, null);
  }

  subscribe(key, handler) {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, new Set());
    }
    this._listeners.get(key).add(handler);
    // Immediately call with current value
    handler(this._state[key], undefined);
    return () => this._listeners.get(key)?.delete(handler);
  }

  _notify(key, value, prev) {
    this._listeners.get(key)?.forEach(h => {
      try { h(value, prev); } catch (err) { console.error(`Store error on "${key}":`, err); }
    });
  }
}

export const store = new Store({
  currentResumeId: null,
  currentJobId: null,
  aiConfig: null,
  premium: { isActive: false, tier: 'free' },
  onboardingComplete: false,
  isLoading: false,
  route: null,
});
