export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function debounceAsync(func, wait) {
  let timeout;
  let pendingResolve = null;
  let pendingArgs = null;

  return async function executedFunction(...args) {
    return new Promise((resolve) => {
      pendingResolve = resolve;
      pendingArgs = args;

      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        try {
          const result = await func(...pendingArgs);
          if (pendingResolve) {
            pendingResolve(result);
          }
        } catch (error) {
          if (pendingResolve) {
            pendingResolve(Promise.reject(error));
          }
        }
        pendingResolve = null;
        pendingArgs = null;
      }, wait);
    });
  };
}