<script>
  import { toasts, removeToast } from '../stores/toast.js';
  import { flip } from 'svelte/animate';
  import { fade, fly } from 'svelte/transition';

  function getIcon(type) {
    switch(type) {
      case 'success':
        return `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>`;
      case 'error':
        return `<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>`;
      default:
        return `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>`;
    }
  }
</script>

<div class="toast-container">
  {#each $toasts as toast (toast.id)}
    <div 
      class="toast {toast.type}" 
      animate:flip={{ duration: 300 }}
      in:fly={{ y: 20, duration: 300 }}
      out:fade={{ duration: 200 }}
    >
      <div class="toast-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          {@html getIcon(toast.type)}
        </svg>
      </div>
      <div class="toast-message">{toast.message}</div>
      <button class="toast-close" on:click={() => removeToast(toast.id)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: var(--spacing-xl);
    right: var(--spacing-xl);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    z-index: 9999;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
    background: rgba(10, 15, 30, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    min-width: 250px;
    max-width: 400px;
    pointer-events: auto;
  }

  .toast.success {
    border-left: 4px solid var(--color-success);
  }

  .toast.error {
    border-left: 4px solid var(--color-error);
  }

  .toast.info {
    border-left: 4px solid var(--color-accent-primary);
  }

  .toast-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .toast.success .toast-icon { color: var(--color-success); }
  .toast.error .toast-icon { color: var(--color-error); }
  .toast.info .toast-icon { color: var(--color-accent-primary); }

  .toast-message {
    flex: 1;
    color: var(--color-text-primary);
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.4;
  }

  .toast-close {
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all var(--transition-fast);
  }

  .toast-close:hover {
    color: var(--color-text-primary);
    background: var(--color-bg-tertiary);
  }

  .toast-close svg {
    width: 14px;
    height: 14px;
  }
</style>
