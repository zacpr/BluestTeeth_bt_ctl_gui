<script>
  import { onMount, onDestroy } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import Header from './components/Header.svelte';
  import DeviceList from './components/DeviceList.svelte';
  import DeviceDetail from './components/DeviceDetail.svelte';
  import ScanAnimation from './components/ScanAnimation.svelte';
  import ParticleSystem from './components/ParticleSystem.svelte';
  import Toast from './components/Toast.svelte';
  import AutomationPanel from './components/AutomationPanel.svelte';
  import { devices, controller, isScanning, selectedDevice, initializeBluetooth, cleanupEventListeners } from './stores/bluetooth.js';

  let loading = true;
  let error = null;
  let automationOpen = false;

  // Keyboard shortcuts
  function handleKeydown(event) {
    // Ctrl/Cmd + S = Toggle Scan
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      toggleScan();
    }

    // Ctrl/Cmd + R = Refresh
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
      event.preventDefault();
      initializeBluetooth();
    }

    // Escape = Close detail
    if (event.key === 'Escape' && automationOpen) {
      event.preventDefault();
      automationOpen = false;
    } else if (event.key === 'Escape' && $selectedDevice) {
      event.preventDefault();
      closeDetail();
    }

    // Ctrl/Cmd + 1-9 = Select device by index
    if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '9') {
      event.preventDefault();
      const index = parseInt(event.key) - 1;
      const deviceList = $devices.sort((a, b) => {
        if (a.connected !== b.connected) return b.connected ? 1 : -1;
        if (a.paired !== b.paired) return b.paired ? 1 : -1;
        return a.name.localeCompare(b.name);
      });
      if (deviceList[index]) {
        selectDevice(deviceList[index]);
      }
    }
  }

  onMount(async () => {
    try {
      await initializeBluetooth();
      loading = false;

      // Add keyboard shortcuts
      window.addEventListener('keydown', handleKeydown);
    } catch (e) {
      error = e.message || 'Failed to initialize Bluetooth';
      loading = false;
    }
  });

  onDestroy(() => {
    cleanupEventListeners();
    window.removeEventListener('keydown', handleKeydown);
  });

  async function toggleScan() {
    try {
      if ($isScanning) {
        await invoke('stop_scan');
        isScanning.set(false);
      } else {
        await invoke('start_scan');
        isScanning.set(true);
      }
    } catch (e) {
      console.error('Scan toggle failed:', e);
    }
  }

  function selectDevice(device) {
    selectedDevice.set(device);
  }

  function closeDetail() {
    selectedDevice.set(null);
  }
</script>

<main class="app-container">
  {#if loading}
    <div class="loading-screen">
      <div class="logo">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11"/>
        </svg>
        <h1 class="logo-text">Bluest<span class="text-gradient">Teeth</span></h1>
      </div>
      <div class="loading-spinner"></div>
      <p class="loading-text">Initializing Bluetooth...</p>
    </div>
  {:else if error}
    <div class="error-screen">
      <div class="error-icon">⚠️</div>
      <h2>Something went wrong</h2>
      <p>{error}</p>
      <button class="btn-primary" on:click={() => window.location.reload()}>
        Try Again
      </button>
    </div>
  {:else}
    <Header 
      controller={$controller}
      scanning={$isScanning}
      on:toggleScan={toggleScan}
      on:openAutomation={() => automationOpen = true}
    />
    
    <div class="main-content">
      <ScanAnimation active={$isScanning} />
      
      <div class="content-wrapper">
        <DeviceList 
          devices={$devices}
          scanning={$isScanning}
          selectedDevice={$selectedDevice}
          on:select={e => selectDevice(e.detail)}
        />
        
        {#if $selectedDevice}
          <DeviceDetail
            device={$selectedDevice}
            on:close={closeDetail}
            on:refresh={initializeBluetooth}
          />
        {/if}
      </div>
    </div>
  {/if}

  <!-- Background particle system -->
  <ParticleSystem />
  <AutomationPanel open={automationOpen} onClose={() => automationOpen = false} />
  <Toast />
</main>

<style>
  .app-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
    position: relative;
    overflow: hidden;
    transition: background var(--theme-transition-duration, 300ms) ease;
  }

  .app-container::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 30% 20%, rgba(0, 212, 255, 0.03) 0%, transparent 50%),
                radial-gradient(circle at 70% 80%, rgba(0, 168, 204, 0.02) 0%, transparent 40%);
    pointer-events: none;
  }

  .loading-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xl);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .logo-icon {
    width: 48px;
    height: 48px;
    color: var(--color-accent-primary);
    filter: drop-shadow(0 0 20px var(--color-accent-glow));
  }

  .logo-text {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--color-bg-tertiary);
    border-top-color: var(--color-accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
  }

  .error-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-lg);
    text-align: center;
    padding: var(--spacing-xl);
  }

  .error-icon {
    font-size: 3rem;
  }

  .error-screen h2 {
    color: var(--color-text-primary);
  }

  .error-screen p {
    color: var(--color-text-secondary);
    max-width: 400px;
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  .content-wrapper {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
    z-index: 1;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
