import { writable } from 'svelte/store';

export const toasts = writable([]);

export function addToast(message, type = 'info', duration = 3000) {
  const id = Math.floor(Math.random() * 10000);
  
  toasts.update(all => [{ id, message, type }, ...all]);
  
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
}

export function removeToast(id) {
  toasts.update(all => all.filter(t => t.id !== id));
}

export function notifySuccess(message) {
  addToast(message, 'success');
}

export function notifyError(message) {
  addToast(message, 'error', 5000);
}

export function notifyInfo(message) {
  addToast(message, 'info');
}
