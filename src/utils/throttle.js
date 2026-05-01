export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function throttleAsync(func, limit) {
  let inThrottle;
  let lastCall = 0;

  return async function executedFunction(...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= limit) {
      lastCall = now;
      return await func(...args);
    } else {
      return new Promise((resolve) => {
        const remainingWait = limit - timeSinceLastCall;
        setTimeout(async () => {
          lastCall = Date.now();
          try {
            const result = await func(...args);
            resolve(result);
          } catch (error) {
            resolve(Promise.reject(error));
          }
        }, remainingWait);
      });
    }
  };
}