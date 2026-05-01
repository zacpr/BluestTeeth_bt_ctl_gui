<script>
  import { createEventDispatcher } from 'svelte';
  import { deviceFilter, searchQuery, filterDevices } from '../stores/filter.js';
  import { connectDevice, disconnectDevice, removeDevice, trustDevice, pairDevice } from '../stores/bluetooth.js';
  
  export let devices = [];
  export let scanning = false;
  export let selectedDevice = null;
  
  function setFilter(filter) {
    deviceFilter.set(filter);
  }
  
  const dispatch = createEventDispatcher();
  
  // Context Menu State
  let contextMenu = {
    show: false,
    x: 0,
    y: 0,
    device: null
  };

  function handleContextMenu(event, device) {
    event.preventDefault();
    contextMenu = {
      show: true,
      x: event.clientX,
      y: event.clientY,
      device
    };
  }

  function closeContextMenu() {
    contextMenu.show = false;
  }

  async function contextMenuAction(action) {
    if (!contextMenu.device) return;
    const mac = contextMenu.device.mac;
    closeContextMenu();

    switch (action) {
      case 'connect': await connectDevice(mac); break;
      case 'disconnect': await disconnectDevice(mac); break;
      case 'pair': await pairDevice(mac); break;
      case 'trust': await trustDevice(mac); break;
      case 'remove': await removeDevice(mac); break;
      case 'details': dispatch('select', contextMenu.device); break;
    }
  }
  
  // Batch Operations State
  let isBatchMode = false;
  let selectedMacs = new Set();

  function selectDevice(device) {
    if (isBatchMode) {
      toggleMac(device.mac);
    } else {
      dispatch('select', device);
    }
  }

  function toggleMac(mac) {
    if (selectedMacs.has(mac)) {
      selectedMacs.delete(mac);
    } else {
      selectedMacs.add(mac);
    }
    selectedMacs = selectedMacs; // trigger reactivity
  }

  function toggleBatchMode() {
    isBatchMode = !isBatchMode;
    if (!isBatchMode) {
      selectedMacs.clear();
      selectedMacs = selectedMacs;
    }
  }

  function selectAll() {
    if (selectedMacs.size === sortedDevices.length) {
      selectedMacs.clear();
    } else {
      sortedDevices.forEach(d => selectedMacs.add(d.mac));
    }
    selectedMacs = selectedMacs;
  }

  async function performBatchOperation(operation) {
    const macs = Array.from(selectedMacs);
    for (const mac of macs) {
      try {
        switch (operation) {
          case 'connect': await connectDevice(mac); break;
          case 'disconnect': await disconnectDevice(mac); break;
          case 'remove': await removeDevice(mac); break;
          case 'trust': await trustDevice(mac); break;
        }
      } catch (err) {
        console.error(`Failed to ${operation} ${mac}:`, err);
      }
    }
    
    // Clear selection after destructive operations
    if (operation === 'remove') {
      selectedMacs.clear();
      selectedMacs = selectedMacs;
    }
  }
  
  function getDeviceIcon(icon) {
    const iconMap = {
      'audio-card': 'audio',
      'audio-headphones': 'headphones',
      'audio-headset': 'headset',
      'audio-speakers': 'speaker',
      'input-gaming': 'gamepad',
      'input-keyboard': 'keyboard',
      'input-mouse': 'mouse',
      'input-tablet': 'tablet',
      'phone': 'phone',
      'computer': 'computer',
      'network-wireless': 'wifi',
    };
    return iconMap[icon] || 'bluetooth';
  }
  
  function getIconSvg(type) {
    const icons = {
      bluetooth: `<path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11"/>`,
      headphones: `<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>`,
      headset: `<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/><path d="M12 12v.01"/>`,
      speaker: `<rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="14" r="4"/>`,
      keyboard: `<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h2v2H6zm4 0h2v2h-2zm4 0h2v2h-2zm4 0h2v2h-2zM6 12h2v2H6zm4 0h2v2h-2zm4 0h2v2h-2zm4 0h2v2h-2zM8 16h8v2H8z"/>`,
      mouse: `<rect x="6" y="3" width="12" height="18" rx="6"/><path d="M12 7v4"/>`,
      phone: `<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>`,
      computer: `<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>`,
      gamepad: `<path d="M6 11h4M8 9v4"/><path d="M15 11h.01"/><path d="M18 11h.01"/><rect x="2" y="6" width="20" height="12" rx="2"/>`,
      wifi: `<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/>`,
    };
    return icons[type] || icons.bluetooth;
  }
  
  $: filteredDevices = filterDevices(devices, $deviceFilter, $searchQuery);
  
  $: sortedDevices = [...filteredDevices].sort((a, b) => {
    // If searching, sort primarily by fuzzy score
    if ($searchQuery && a.fuzzyScore !== b.fuzzyScore) {
      return (b.fuzzyScore || 0) - (a.fuzzyScore || 0);
    }
    // Connected first, then paired, then by name
    if (a.connected !== b.connected) return b.connected ? 1 : -1;
    if (a.paired !== b.paired) return b.paired ? 1 : -1;
    return a.name.localeCompare(b.name);
  });
  
  $: connectedCount = devices.filter(d => d.connected).length;
  $: pairedCount = devices.filter(d => d.paired).length;
  $: readyToConnect = devices.filter(d => d.paired && !d.connected).length;
</script>

<div class="device-list-container">
  <div class="list-header">
    <div class="list-title">
      <h2>Devices</h2>
      <span class="device-count">{devices.length} found</span>
    </div>
    <div class="device-stats">
      <button class="batch-toggle" class:active={isBatchMode} on:click={toggleBatchMode}>
        {isBatchMode ? 'Cancel' : 'Select'}
      </button>
      {#if connectedCount > 0}
        <span class="stat connected">
          <span class="status-dot connected"></span>
          {connectedCount} connected
        </span>
      {/if}
      {#if readyToConnect > 0}
        <span class="stat ready">
          <span class="status-dot ready"></span>
          {readyToConnect} ready to connect
        </span>
      {/if}
      {#if pairedCount > 0}
        <span class="stat paired">
          <span class="status-dot paired"></span>
          {pairedCount} paired
        </span>
      {/if}
    </div>
  </div>

  <div class="search-bar">
    <div class="search-input-wrapper">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input type="text" bind:value={$searchQuery} placeholder="Search devices..." class="search-input" />
      {#if $searchQuery}
        <button class="clear-search" on:click={() => $searchQuery = ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      {/if}
    </div>
  </div>
  
  <!-- Filter Bar -->
  <div class="filter-bar">
    <button class="filter-btn" class:active={$deviceFilter === 'all'} on:click={() => setFilter('all')}>
      All
    </button>
    <button class="filter-btn" class:active={$deviceFilter === 'connected'} on:click={() => setFilter('connected')}>
      Connected
    </button>
    <button class="filter-btn" class:active={$deviceFilter === 'paired'} on:click={() => setFilter('paired')}>
      Paired
    </button>
    <button class="filter-btn" class:active={$deviceFilter === 'trusted'} on:click={() => setFilter('trusted')}>
      Trusted
    </button>
    <button class="filter-btn" class:active={$deviceFilter === 'bonded'} on:click={() => setFilter('bonded')}>
      Bonded
    </button>
    <button class="filter-btn" class:active={$deviceFilter === 'ready'} on:click={() => setFilter('ready')}>
      Ready
    </button>
  </div>
  
  <div class="device-list">
    {#if isBatchMode}
      <div class="batch-header">
        <label class="select-all">
          <input type="checkbox" checked={selectedMacs.size === sortedDevices.length && sortedDevices.length > 0} on:change={selectAll} />
          Select All ({selectedMacs.size})
        </label>
      </div>
    {/if}

    {#if sortedDevices.length === 0 && !scanning}
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11"/>
          </svg>
        </div>
        <h3>No devices found</h3>
        <p>Click Scan to discover nearby Bluetooth devices</p>
      </div>
    {:else if sortedDevices.length === 0 && scanning}
      <div class="empty-state scanning">
        <div class="scanning-indicator">
          <div class="pulse-ring"></div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11"/>
          </svg>
        </div>
        <h3>Scanning...</h3>
        <p>Looking for nearby devices</p>
      </div>
    {:else}
      {#each sortedDevices as device (device.mac)}
        <button 
          class="device-card"
          class:selected={!isBatchMode && selectedDevice?.mac === device.mac}
          class:batch-selected={isBatchMode && selectedMacs.has(device.mac)}
          class:connected={device.connected}
          class:paired={device.paired && !device.connected}
          on:click={() => selectDevice(device)}
          on:contextmenu={(e) => handleContextMenu(e, device)}
        >
          {#if isBatchMode}
            <div class="checkbox-wrapper" class:checked={selectedMacs.has(device.mac)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          {/if}
          <div class="device-icon-wrapper">
            <svg class="device-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              {@html getIconSvg(getDeviceIcon(device.icon))}
            </svg>
            {#if device.battery !== null}
              <div class="battery-indicator" style="--level: {device.battery}%">
                <span>{device.battery}%</span>
              </div>
            {/if}
          </div>
          
          <div class="device-info">
            <div class="device-name">{device.alias || device.name}</div>
            <div class="device-meta">
              {#if device.connected}
                <span class="meta-tag connected">Connected</span>
              {:else if device.paired}
                <span class="meta-tag paired">Paired</span>
              {:else}
                <span class="meta-tag">Available</span>
              {/if}
              {#if device.trusted}
                <svg class="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" title="Trusted">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              {/if}
            </div>
            {#if device.rssi}
              <div class="signal-strength">
                <div class="signal-bars">
                  {#each Array(4) as _, i}
                    <div class="bar" class:active={device.rssi > -85 + (i * 10)}></div>
                  {/each}
                </div>
                <span class="rssi-value">{device.rssi} dBm</span>
              </div>
            {/if}
          </div>
          
          <div class="device-actions">
            {#if !isBatchMode}
              {#if device.connected}
                <span class="connection-status" title="Connected">
                  <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
              {:else if device.paired}
                <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
                <span class="quick-connect" title="Click to connect" on:click|stopPropagation={() => connectDevice(device.mac)}>
                  <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </span>
              {/if}
            {/if}
          </div>
        </button>
      {/each}
    {/if}
  </div>

  {#if isBatchMode && selectedMacs.size > 0}
    <div class="batch-action-bar">
      <span>{selectedMacs.size} selected</span>
      <div class="batch-actions">
        <button class="batch-btn primary" on:click={() => performBatchOperation('connect')}>Connect</button>
        <button class="batch-btn warning" on:click={() => performBatchOperation('disconnect')}>Disconnect</button>
        <button class="batch-btn danger" on:click={() => performBatchOperation('remove')}>Remove</button>
      </div>
    </div>
  {/if}

  {#if contextMenu.show}
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
    <div class="context-overlay" on:click={closeContextMenu}></div>
    <div class="context-menu" style="top: {contextMenu.y}px; left: {contextMenu.x}px">
      <div class="context-header">{contextMenu.device?.alias || contextMenu.device?.name}</div>
      {#if contextMenu.device?.connected}
        <button class="context-item" on:click={() => contextMenuAction('disconnect')}>Disconnect</button>
      {:else}
        <button class="context-item" on:click={() => contextMenuAction('connect')}>Connect</button>
      {/if}
      
      {#if !contextMenu.device?.paired}
        <button class="context-item" on:click={() => contextMenuAction('pair')}>Pair</button>
      {/if}
      
      {#if !contextMenu.device?.trusted}
        <button class="context-item" on:click={() => contextMenuAction('trust')}>Trust</button>
      {/if}
      
      <button class="context-item" on:click={() => contextMenuAction('details')}>View Details</button>
      <div class="context-divider"></div>
      <button class="context-item danger" on:click={() => contextMenuAction('remove')}>Remove Device</button>
    </div>
  {/if}
</div>

<style>
  .device-list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: var(--spacing-lg);
  }

  .list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-lg);
    padding: 0 var(--spacing-sm);
  }

  .list-title {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-md);
  }

  .list-title h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .device-count {
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  .device-stats {
    display: flex;
    gap: var(--spacing-md);
  }

  .stat {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }

  .device-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--spacing-xxl);
    color: var(--color-text-secondary);
  }

  .empty-icon {
    width: 64px;
    height: 64px;
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-lg);
  }

  .empty-icon svg {
    width: 100%;
    height: 100%;
  }

  .empty-state h3 {
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-sm);
  }

  .scanning-indicator {
    position: relative;
    width: 64px;
    height: 64px;
    margin-bottom: var(--spacing-lg);
  }

  .scanning-indicator svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    color: var(--color-accent-primary);
  }

  .pulse-ring {
    position: absolute;
    inset: -10px;
    border: 2px solid var(--color-accent-primary);
    border-radius: 50%;
    animation: pulse 2s ease-out infinite;
    will-change: transform, opacity;
    transform: translateZ(0);
  }

  @keyframes pulse {
    0% {
      transform: scale(0.8);
      opacity: 1;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }

  .device-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--color-bg-card);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
    width: 100%;
    animation: fade-in 0.3s ease;
    will-change: transform, background-color, border-color;
    transform: translateZ(0);
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .device-card:hover {
    background: var(--color-bg-tertiary);
    border-color: var(--color-accent-dim);
    transform: translateX(4px);
  }

  .device-card.selected {
    background: var(--color-bg-tertiary);
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 20px var(--color-accent-glow);
  }

  .device-card.connected {
    background: linear-gradient(90deg, rgba(0, 255, 157, 0.05), var(--color-bg-card));
    border-left: 3px solid var(--color-success);
  }

  .device-card.paired {
    border-left: 3px solid var(--color-info);
  }

  .device-icon-wrapper {
    position: relative;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-md);
    flex-shrink: 0;
  }

  .device-icon {
    width: 24px;
    height: 24px;
    color: var(--color-text-secondary);
  }

  .device-card.connected .device-icon {
    color: var(--color-success);
  }

  .battery-indicator {
    position: absolute;
    bottom: -4px;
    right: -4px;
    background: var(--color-bg-primary);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-sm);
    padding: 2px 6px;
    font-size: 0.625rem;
    font-weight: 600;
    color: var(--color-success);
  }

  .device-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .device-name {
    font-weight: 500;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .device-meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .meta-tag {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    padding: 2px 8px;
    background: var(--color-bg-secondary);
    border-radius: 100px;
  }

  .meta-tag.connected {
    background: rgba(0, 255, 157, 0.15);
    color: var(--color-success);
  }

  .meta-tag.paired {
    background: rgba(0, 212, 255, 0.15);
    color: var(--color-accent-primary);
  }

  .trust-icon {
    width: 14px;
    height: 14px;
    color: var(--color-success);
  }

  .signal-strength {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .signal-bars {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 12px;
  }

  .bar {
    width: 3px;
    background: var(--color-bg-tertiary);
    border-radius: 1px;
    transition: all var(--transition-fast);
    will-change: background-color;
    transform: translateZ(0);
  }

  .bar:nth-child(1) { height: 4px; }
  .bar:nth-child(2) { height: 6px; }
  .bar:nth-child(3) { height: 8px; }
  .bar:nth-child(4) { height: 12px; }

  .bar.active {
    background: var(--color-accent-primary);
  }

  .rssi-value {
    font-size: 0.625rem;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }

  .device-actions {
    display: flex;
    align-items: center;
  }

  .connection-status {
    color: var(--color-success);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat.ready {
    color: var(--color-warning);
    animation: pulse 2s infinite;
  }

  .status-dot.ready {
    background: var(--color-warning);
    box-shadow: 0 0 8px var(--color-warning);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .quick-connect {
    color: var(--color-accent-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--color-accent-dim);
    border: 1px solid var(--color-accent-primary);
    border-radius: var(--radius-md);
    animation: glow-pulse 2s infinite;
    will-change: box-shadow, background-color, color;
    transform: translateZ(0);
  }

  @keyframes glow-pulse {
    0%, 100% {
      box-shadow: 0 0 5px var(--color-accent-glow);
    }
    50% {
      box-shadow: 0 0 15px var(--color-accent-glow), 0 0 25px var(--color-accent-glow);
    }
  }

  .device-card:hover .quick-connect {
    background: var(--color-accent-primary);
    color: var(--color-bg-primary);
  }

  /* Filter Bar */
  .filter-bar {
    display: flex;
    gap: var(--spacing-xs);
    padding: 0 var(--spacing-lg) var(--spacing-md);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .filter-bar::-webkit-scrollbar {
    display: none;
  }

  .filter-btn {
    padding: var(--spacing-xs) var(--spacing-md);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--glass-border);
    border-radius: 100px;
    color: var(--color-text-secondary);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
  }

  .filter-btn:hover {
    border-color: var(--color-accent-dim);
    color: var(--color-text-primary);
  }

  .filter-btn.active {
    background: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
    color: var(--color-bg-primary);
  }

  /* Search Bar */
  .search-bar {
    padding: 0 var(--spacing-lg) var(--spacing-md);
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    padding: 0 var(--spacing-sm);
    transition: all var(--transition-fast);
  }

  .search-input-wrapper:focus-within {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.2);
  }

  .search-icon {
    width: 18px;
    height: 18px;
    color: var(--color-text-muted);
  }

  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    padding: var(--spacing-sm);
    font-size: 0.875rem;
    outline: none;
  }

  .search-input::placeholder {
    color: var(--color-text-muted);
  }

  .clear-search {
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
  
  .clear-search:hover {
    color: var(--color-text-primary);
    background: var(--color-bg-secondary);
  }
  
  .clear-search svg {
    width: 14px;
    height: 14px;
  }

  /* Batch Operations */
  .batch-toggle {
    padding: 4px 12px;
    font-size: 0.75rem;
    background: transparent;
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .batch-toggle:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .batch-toggle.active {
    background: var(--color-accent-dim);
    color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
  }

  .batch-header {
    padding: var(--spacing-sm) var(--spacing-md);
    border-bottom: 1px solid var(--glass-border);
    margin-bottom: var(--spacing-sm);
  }

  .select-all {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    cursor: pointer;
  }

  .checkbox-wrapper {
    width: 20px;
    height: 20px;
    border: 2px solid var(--color-text-muted);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .checkbox-wrapper svg {
    width: 14px;
    height: 14px;
    stroke: var(--color-bg-primary);
    opacity: 0;
    transform: scale(0.5);
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .checkbox-wrapper.checked {
    background: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
  }

  .checkbox-wrapper.checked svg {
    opacity: 1;
    transform: scale(1);
  }

  .device-card.batch-selected {
    background: var(--color-bg-tertiary);
    border-color: var(--color-accent-primary);
  }

  .batch-action-bar {
    position: sticky;
    bottom: 0;
    margin-top: auto;
    padding: var(--spacing-md);
    background: var(--color-bg-card);
    border-top: 1px solid var(--glass-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    backdrop-filter: blur(10px);
    z-index: 10;
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
    animation: slide-up 0.3s ease-out;
  }

  @keyframes slide-up {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .batch-action-bar span {
    font-size: 0.875rem;
    color: var(--color-text-primary);
    font-weight: 500;
  }

  .batch-actions {
    display: flex;
    gap: var(--spacing-sm);
  }

  .batch-btn {
    padding: 6px 12px;
    border: none;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .batch-btn.primary {
    background: var(--color-accent-primary);
    color: var(--color-bg-primary);
  }

  .batch-btn.primary:hover {
    background: var(--color-accent-glow);
  }

  .batch-btn.warning {
    background: rgba(255, 170, 0, 0.1);
    color: var(--color-warning);
  }

  .batch-btn.warning:hover {
    background: rgba(255, 170, 0, 0.2);
  }

  .batch-btn.danger {
    background: rgba(255, 51, 102, 0.1);
    color: var(--color-error);
  }

  .batch-btn.danger:hover {
    background: rgba(255, 51, 102, 0.2);
  }

  /* Context Menu */
  .context-overlay {
    position: fixed;
    inset: 0;
    z-index: 99;
  }

  .context-menu {
    position: fixed;
    background: rgba(10, 15, 30, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    min-width: 180px;
    z-index: 100;
    padding: var(--spacing-xs) 0;
    animation: scale-in 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    transform-origin: top left;
  }

  @keyframes scale-in {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .context-header {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-weight: 600;
    border-bottom: 1px solid var(--glass-border);
    margin-bottom: var(--spacing-xs);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .context-item {
    display: block;
    width: 100%;
    text-align: left;
    padding: var(--spacing-sm) var(--spacing-md);
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: background-color var(--transition-fast);
  }

  .context-item:hover {
    background: var(--color-bg-tertiary);
  }

  .context-item.danger {
    color: var(--color-error);
  }

  .context-item.danger:hover {
    background: rgba(255, 51, 102, 0.1);
  }

  .context-divider {
    height: 1px;
    background: var(--glass-border);
    margin: var(--spacing-xs) 0;
  }
</style>
