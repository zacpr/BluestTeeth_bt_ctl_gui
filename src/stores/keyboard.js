import { onMount, onDestroy } from 'svelte';

export function setupKeyboardShortcuts(handlers) {
  const handleKeydown = (event) => {
    // Ctrl/Cmd + S = Scan
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      handlers.onScan?.();
    }
    
    // Ctrl/Cmd + R = Refresh
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
      event.preventDefault();
      handlers.onRefresh?.();
    }
    
    // Escape = Close detail
    if (event.key === 'Escape') {
      handlers.onCloseDetail?.();
    }
    
    // Ctrl/Cmd + 1-9 = Select device by index
    if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '9') {
      event.preventDefault();
      const index = parseInt(event.key) - 1;
      handlers.onSelectDevice?.(index);
    }
  };

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
}
