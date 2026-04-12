/* Event Bus */

class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  once(event, handler) {
    const wrapped = (data) => {
      handler(data);
      this.off(event, wrapped);
    };
    return this.on(event, wrapped);
  }

  off(event, handler) {
    this._listeners.get(event)?.delete(handler);
  }

  emit(event, data) {
    this._listeners.get(event)?.forEach(h => {
      try { h(data); } catch (err) { console.error(`EventBus error on "${event}":`, err); }
    });
  }

  clear(event) {
    if (event) this._listeners.delete(event);
    else this._listeners.clear();
  }
}

export const events = new EventBus();

// Known app events
export const EVENTS = {
  ROUTE_CHANGE:      'route:change',
  RESUME_UPDATED:    'resume:updated',
  RESUME_CREATED:    'resume:created',
  JOB_ADDED:         'job:added',
  JOB_UPDATED:       'job:updated',
  JOB_DELETED:       'job:deleted',
  MATCH_COMPLETE:    'match:complete',
  OPTIMIZE_COMPLETE: 'optimize:complete',
  ATS_COMPLETE:      'ats:complete',
  COVER_LETTER_DONE: 'cover_letter:done',
  SETTINGS_CHANGED:  'settings:changed',
  PREMIUM_ACTIVATED: 'premium:activated',
  AI_KEY_SAVED:      'ai:key_saved',
  TOAST_SHOW:        'toast:show',
  MODAL_OPEN:        'modal:open',
  MODAL_CLOSE:       'modal:close',
};
