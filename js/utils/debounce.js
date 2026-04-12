/* Debounce & Throttle */

export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function throttle(fn, limit = 100) {
  let lastRun = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastRun >= limit) {
      lastRun = now;
      return fn.apply(this, args);
    }
  };
}

export function debouncedPromise(fn, delay = 300) {
  let timer;
  return function (...args) {
    return new Promise((resolve, reject) => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          resolve(await fn.apply(this, args));
        } catch (err) {
          reject(err);
        }
      }, delay);
    });
  };
}
