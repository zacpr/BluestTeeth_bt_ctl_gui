<script>
  import { createEventDispatcher } from 'svelte';
  import ThemeSelector from './ThemeSelector.svelte';
  
  export let controller;
  export let scanning;
  
  const dispatch = createEventDispatcher();
  
  function toggleScan() {
    dispatch('toggleScan');
  }

  function openAutomation() {
    dispatch('openAutomation');
  }
  
  async function togglePower() {
    if (!controller) return;
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('set_controller_power', { powered: !controller.powered });
    } catch (e) {
      console.error('Failed to toggle power:', e);
    }
  }
</script>

<header class="header">
  <div class="header-left">
    <div class="logo">
      <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11"/>
      </svg>
      <h1 class="logo-text">Bluest<span class="text-gradient">Teeth</span></h1>
    </div>
    
    {#if controller}
      <div class="controller-info">
        <span class="controller-name">{controller.name}</span>
        <div class="status-badges">
          <span class="badge" class:active={controller.powered}>
            <span class="status-dot" class:connected={controller.powered}></span>
            {controller.powered ? 'On' : 'Off'}
          </span>
          {#if controller.discoverable}
            <span class="badge discoverable">
              <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v10m11-7h-6m-6 0H1"/>
              </svg>
              Visible
            </span>
          {/if}
        </div>
      </div>
    {/if}
  </div>
  
  <div class="header-actions">
    <button class="btn-icon automation-btn" on:click={openAutomation} title="Automation Rules">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v6"/>
        <path d="M12 16v6"/>
        <path d="M4.93 4.93l4.24 4.24"/>
        <path d="M14.83 14.83l4.24 4.24"/>
        <path d="M2 12h6"/>
        <path d="M16 12h6"/>
        <path d="M4.93 19.07l4.24-4.24"/>
        <path d="M14.83 9.17l4.24-4.24"/>
      </svg>
    </button>

    {#if controller}
      <button 
        class="btn-icon power-btn" 
        class:off={!controller.powered}
        on:click={togglePower}
        title={controller.powered ? 'Turn Bluetooth Off' : 'Turn Bluetooth On'}
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/>
        </svg>
      </button>
    {/if}
    
    <button 
      class="btn-primary scan-btn" 
      class:scanning={scanning}
      on:click={toggleScan}
      disabled={!controller || !controller.powered}
    >
      {#if scanning}
        <svg class="icon icon-sm spinning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Scanning...
      {:else}
        <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        Scan
      {/if}
    </button>
  </div>
</header>

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md) var(--spacing-xl);
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--glass-border);
    z-index: 10;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-xl);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .logo-icon {
    width: 28px;
    height: 28px;
    color: var(--color-accent-primary);
  }

  .logo-text {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .controller-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .controller-name {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-badges {
    display: flex;
    gap: var(--spacing-sm);
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: 2px 8px;
    background: var(--color-bg-tertiary);
    border-radius: 100px;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    transition: all var(--transition-fast);
  }

  .badge.active {
    background: rgba(0, 255, 157, 0.15);
    color: var(--color-success);
  }

  .badge.discoverable {
    background: rgba(0, 212, 255, 0.15);
    color: var(--color-accent-primary);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .power-btn {
    color: var(--color-success);
  }

  .power-btn.off {
    color: var(--color-text-muted);
  }

  .scan-btn {
    min-width: 120px;
  }

  .scan-btn.scanning {
    background: linear-gradient(135deg, var(--color-warning), #ff9500);
  }

  .scan-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .scan-btn:disabled:hover {
    transform: none;
    box-shadow: none;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
