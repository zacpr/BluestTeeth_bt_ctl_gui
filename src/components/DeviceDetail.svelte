<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { connectDevice, disconnectDevice, connectProfile, disconnectProfile, pairDevice, removeDevice, blockDevice, unblockDevice, trustDevice, untrustDevice, setDeviceAlias, getDeviceInfo, sendFile } from '../stores/bluetooth.js';
  import { connectionHistory } from '../stores/history.js';
  import SignalWaveform from './SignalWaveform.svelte';
  
  export let device;
  
  const dispatch = createEventDispatcher();
  let loading = false;
  let error = null;
  let showConfirmRemove = false;
  let editingAlias = false;
  let newAlias = device.alias || device.name;
  let detailedInfo = null;
  let infoLoading = false;
  
  async function fetchDetailedInfo() {
    if (!device?.mac) return;

    infoLoading = true;
    try {
      detailedInfo = await getDeviceInfo(device.mac);
    } catch (err) {
      console.error('Failed to fetch device info:', err);
      detailedInfo = null;
    }
    infoLoading = false;
  }

  // Fetch detailed info when device changes
  $: if (device?.mac) {
    fetchDetailedInfo();
  }

  onMount(() => {
    if (device?.mac) {
      fetchDetailedInfo();
    }
  });

  function getUUIDDescription(uuid) {
    const uuidMap = {
      '00001101-0000-1000-8000-00805f9b34fb': 'Serial Port',
      '0000110a-0000-1000-8000-00805f9b34fb': 'Audio Source',
      '0000110b-0000-1000-8000-00805f9b34fb': 'Audio Sink',
      '0000110c-0000-1000-8000-00805f9b34fb': 'A/V Remote Control Target',
      '0000110d-0000-1000-8000-00805f9b34fb': 'Advanced Audio Distribution',
      '0000110e-0000-1000-8000-00805f9b34fb': 'A/V Remote Control',
      '00001105-0000-1000-8000-00805f9b34fb': 'OBEX Object Push',
      '00001112-0000-1000-8000-00805f9b34fb': 'Headset Audio Gateway',
      '00001115-0000-1000-8000-00805f9b34fb': 'PAN User',
      '00001116-0000-1000-8000-00805f9b34fb': 'NAP',
      '0000111e-0000-1000-8000-00805f9b34fb': 'Handsfree',
      '0000111f-0000-1000-8000-00805f9b34fb': 'Handsfree Audio Gateway',
      '0000112d-0000-1000-8000-00805f9b34fb': 'SIM Access',
      '0000112f-0000-1000-8000-00805f9b34fb': 'Phonebook Access Server',
      '00001132-0000-1000-8000-00805f9b34fb': 'Message Access Server',
      '00001200-0000-1000-8000-00805f9b34fb': 'PnP Information',
      '00001800-0000-1000-8000-00805f9b34fb': 'Generic Access Profile',
      '00001801-0000-1000-8000-00805f9b34fb': 'Generic Attribute Profile',
    };
    return uuidMap[uuid] || 'Unknown Service';
  }

  function getClassDescription(classHex) {
    if (!classHex) return 'Unknown';

    const classNum = parseInt(classHex.replace('0x', ''), 16);
    const majorClass = (classNum >> 8) & 0x1F;
    const minorClass = (classNum >> 2) & 0x3F;

    const majorClasses = {
      1: 'Computer',
      2: 'Phone',
      3: 'LAN/Network Access Point',
      4: 'Audio/Video',
      5: 'Peripheral',
      6: 'Imaging',
      7: 'Wearable',
      8: 'Toy',
      9: 'Health',
      31: 'Uncategorized'
    };

    const minorClasses = {
      // Audio/Video minor classes
      1: 'Headset',
      2: 'Hands-free',
      4: 'Microphone',
      5: 'Loudspeaker',
      6: 'Headphones',
      7: 'Portable Audio',
      8: 'Car Audio',
      9: 'Set-top Box',
      10: 'HiFi Audio',
      11: 'VCR',
      12: 'Video Camera',
      13: 'Camcorder',
      14: 'Video Monitor',
      15: 'Video Display and Loudspeaker',
      16: 'Video Conferencing',
      18: 'Gaming/Toy',
    };

    const majorDesc = majorClasses[majorClass] || 'Unknown';
    const minorDesc = minorClasses[minorClass] || '';

    return minorDesc ? `${majorDesc} (${minorDesc})` : majorDesc;
  }

  function close() {
    dispatch('close');
  }
  
  async function handleConnect() {
    loading = true;
    error = null;
    try {
      await connectDevice(device.mac);
      await loadDevices();
    } catch (e) {
      error = e.message || 'Failed to connect';
    }
    loading = false;
  }
  
  async function handleDisconnect() {
    loading = true;
    error = null;
    try {
      await disconnectDevice(device.mac);
      await loadDevices();
    } catch (e) {
      error = e.message || 'Failed to disconnect';
    }
    loading = false;
  }
  
  async function handlePair() {
    loading = true;
    error = null;
    try {
      await pairDevice(device.mac);
      await loadDevices();
    } catch (e) {
      error = e.message || 'Failed to pair';
    }
    loading = false;
  }
  
  async function handleRemove() {
    if (!showConfirmRemove) {
      showConfirmRemove = true;
      return;
    }
    loading = true;
    error = null;
    try {
      await removeDevice(device.mac);
      showConfirmRemove = false;
      dispatch('close');
      await loadDevices();
    } catch (e) {
      error = e.message || 'Failed to remove device';
    }
    loading = false;
  }
  
  async function handleTrustToggle() {
    loading = true;
    error = null;
    try {
      if (device.trusted) {
        await untrustDevice(device.mac);
      } else {
        await trustDevice(device.mac);
      }
      await loadDevices();
    } catch (e) {
      error = e.message || 'Failed to update trust';
    }
    loading = false;
  }
  
  async function handleConnectProfile(profile) {
    loading = true;
    error = null;
    try {
      await connectProfile(device.mac, profile);
      await loadDevices();
    } catch (e) {
      error = e.message || `Failed to connect ${profile} profile`;
    }
    loading = false;
  }
  
  async function handleBlockToggle() {
    loading = true;
    error = null;
    try {
      if (device.blocked) {
        await unblockDevice(device.mac);
      } else {
        await blockDevice(device.mac);
      }
      await loadDevices();
    } catch (e) {
      error = e.message || 'Failed to update block status';
    }
    loading = false;
  }
  
  async function handleSaveAlias() {
    loading = true;
    error = null;
    try {
      await setDeviceAlias(device.mac, newAlias);
      editingAlias = false;
      await loadDevices();
    } catch (e) {
      error = e.message || 'Failed to set alias';
    }
    loading = false;
  }
  
  function cancelRemove() {
    showConfirmRemove = false;
  }
  
  function startEditAlias() {
    editingAlias = true;
    newAlias = device.alias || device.name;
  }
  
  function cancelEditAlias() {
    editingAlias = false;
    newAlias = device.alias || device.name;
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
    };
    return iconMap[icon] || 'bluetooth';
  }
  
  function getIconSvg(type) {
    const icons = {
      bluetooth: `<path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11"/>`,
      headphones: `<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>`,
    };
    return icons[type] || icons.bluetooth;
  }
  
  $: connectionStatus = device.connected 
    ? { text: 'Connected', color: 'success', icon: 'check' }
    : device.paired
    ? { text: 'Paired', color: 'info', icon: 'link' }
    : { text: 'Not Connected', color: 'muted', icon: 'x' };
</script>

<div class="device-detail-panel">
  <div class="detail-header">
    <button class="btn-icon close-btn" on:click={close}>
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>
  
  <div class="device-hero">
    <div class="hero-icon" class:connected={device.connected}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        {@html getIconSvg(getDeviceIcon(device.icon))}
      </svg>
      {#if device.connected}
        <div class="connection-pulse"></div>
      {/if}
    </div>
    
    {#if editingAlias}
      <div class="alias-edit">
        <input 
          type="text" 
          bind:value={newAlias} 
          placeholder="Device alias"
          on:keydown={(e) => e.key === 'Enter' && handleSaveAlias()}
        />
        <div class="alias-actions">
          <button class="btn-icon" on:click={handleSaveAlias} disabled={loading}>
            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </button>
          <button class="btn-icon" on:click={cancelEditAlias}>
            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    {:else}
      <h2 class="device-name">{device.alias || device.name}</h2>
      <button class="rename-button" on:click={startEditAlias}>
        <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Rename Device
      </button>
    {/if}
    <p class="device-mac">{device.mac}</p>
    
    <div class="status-badge" class:connected={device.connected} class:paired={device.paired && !device.connected}>
      <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        {#if connectionStatus.icon === 'check'}
          <path d="M20 6L9 17l-5-5"/>
        {:else if connectionStatus.icon === 'link'}
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        {:else}
          <path d="M18 6L6 18M6 6l12 12"/>
        {/if}
      </svg>
      {connectionStatus.text}
    </div>
  </div>
  
  {#if error}
    <div class="error-message">
      <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4M12 16h.01"/>
      </svg>
      {error}
    </div>
  {/if}
  
  <div class="action-buttons">
    {#if device.connected}
      <button class="btn-action disconnect" on:click={handleDisconnect} disabled={loading}>
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
        <span>Disconnect</span>
      </button>
    {:else}
      <button class="btn-action connect" on:click={handleConnect} disabled={loading}>
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        <span>Connect</span>
      </button>
    {/if}
    
    {#if !device.paired}
      <button class="btn-action pair" on:click={handlePair} disabled={loading}>
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
        <span>Pair</span>
      </button>
    {/if}
    
    <button 
      class="btn-action rename" 
      on:click={startEditAlias}
      disabled={loading}
    >
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
      <span>Rename</span>
    </button>
    
    <button 
      class="btn-action trust" 
      class:active={device.trusted}
      on:click={handleTrustToggle}
      disabled={loading}
    >
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        {#if device.trusted}
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        {:else}
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        {/if}
      </svg>
      <span>{device.trusted ? 'Trusted' : 'Trust'}</span>
    </button>
  </div>
  
  {#if device.connected && (device.icon?.includes('phone') || device.icon?.includes('computer') || device.icon?.includes('network'))}
  <div class="file-transfer-section">
    <button class="btn-action file-transfer" on:click={() => sendFile(device.mac)} disabled={loading}>
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
      </svg>
      <span>Send File (OBEX)</span>
    </button>
  </div>
  {/if}

  <!-- Audio Profiles Section -->
  {#if device.icon?.includes('audio') || device.icon?.includes('headphone') || device.icon?.includes('headset') || device.icon?.includes('speaker')}
    <div class="audio-profiles">
      <h3>Audio Profiles</h3>
      <div class="profile-buttons">
        <button 
          class="btn-profile" 
          on:click={() => handleConnectProfile('a2dp')}
          disabled={loading || !device.connected}
        >
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 3v18M8 7v10M4 11v2M16 7v10M20 11v2"/>
          </svg>
          <span>A2DP<br/><small>(High Quality)</small></span>
        </button>
        
        <button 
          class="btn-profile" 
          on:click={() => handleConnectProfile('hfp')}
          disabled={loading || !device.connected}
        >
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <span>HFP<br/><small>(Calls)</small></span>
        </button>
        
        <button 
          class="btn-profile" 
          on:click={() => handleConnectProfile('hsp')}
          disabled={loading || !device.connected}
        >
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
          </svg>
          <span>HSP<br/><small>(Headset)</small></span>
        </button>
      </div>
    </div>
  {/if}
  
  <div class="device-preferences">
    <h3>Preferences</h3>
    <div class="preference-item">
      <div class="pref-info">
        <span class="pref-label">Auto-Reconnect</span>
        <span class="pref-desc">Automatically connect when device is discovered</span>
      </div>
      <label class="toggle-switch">
        <input 
          type="checkbox" 
          checked={$connectionHistory[device.mac]?.autoReconnect || false}
          on:change={() => connectionHistory.toggleAutoReconnect(device.mac)}
        >
        <span class="slider"></span>
      </label>
    </div>
  </div>

  <div class="device-info-section">
    <h3>Device Information</h3>
    
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Name</span>
        <span class="info-value">{device.name}</span>
      </div>
      
      {#if device.alias && device.alias !== device.name}
        <div class="info-item">
          <span class="info-label">Alias</span>
          <span class="info-value">{device.alias}</span>
        </div>
      {/if}
      
      <div class="info-item">
        <span class="info-label">MAC Address</span>
        <span class="info-value font-mono">{device.mac}</span>
      </div>
      
      {#if device.address_type}
        <div class="info-item">
          <span class="info-label">Address Type</span>
          <span class="info-value">{device.address_type}</span>
        </div>
      {/if}
      
      {#if device.icon}
        <div class="info-item">
          <span class="info-label">Device Type</span>
          <span class="info-value">{device.icon}</span>
        </div>
      {/if}
      
      {#if device.rssi}
        <div class="info-item signal-waveform-section">
          <span class="info-label">Signal Strength</span>
          <div class="waveform-container">
            <SignalWaveform {device} width={350} height={100} />
          </div>
        </div>
      {/if}
      
      {#if device.battery !== null}
        <div class="info-item">
          <span class="info-label">Battery</span>
          <span class="info-value battery">
            <span class="battery-bar" style="--level: {device.battery}%"></span>
            {device.battery}%
          </span>
        </div>
      {/if}
      
      <div class="info-item">
        <span class="info-label">Paired</span>
        <span class="info-value">
          <span class="status-indicator" class:active={device.paired}></span>
          {device.paired ? 'Yes' : 'No'}
        </span>
      </div>
      
      <div class="info-item">
        <span class="info-label">Trusted</span>
        <span class="info-value">
          <span class="status-indicator" class:active={device.trusted}></span>
          {device.trusted ? 'Yes' : 'No'}
        </span>
      </div>
      
      <div class="info-item">
        <span class="info-label">Connected</span>
        <span class="info-value">
          <span class="status-indicator" class:active={device.connected}></span>
          {device.connected ? 'Yes' : 'No'}
        </span>
      </div>
    </div>
  </div>

  <!-- Device Capabilities -->
  {#if detailedInfo && Object.keys(detailedInfo).some(key => key.startsWith('UUID:'))}
    <div class="device-info-section">
      <h3>Device Capabilities</h3>
      <div class="capabilities-grid">
        {#each Object.entries(detailedInfo).filter(([key]) => key.startsWith('UUID:')) as [key, value]}
          <div class="capability-item">
            <div class="capability-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div class="capability-info">
              <div class="capability-name">{getUUIDDescription(value.match(/\(([^)]+)\)/)?.[1] || '')}</div>
              <div class="capability-uuid">{value.match(/\(([^)]+)\)/)?.[1] || value}</div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Technical Details -->
  {#if detailedInfo}
    <div class="device-info-section">
      <h3>Technical Details</h3>
      <div class="info-grid">
        {#if detailedInfo.Class}
          <div class="info-item">
            <span class="info-label">Device Class</span>
            <span class="info-value">
              <span class="font-mono">{detailedInfo.Class}</span>
              <br/>
              <small>{getClassDescription(detailedInfo.Class)}</small>
            </span>
          </div>
        {/if}

        {#if detailedInfo.Modalias}
          <div class="info-item">
            <span class="info-label">Modalias</span>
            <span class="info-value font-mono">{detailedInfo.Modalias}</span>
          </div>
        {/if}

        {#if detailedInfo.LegacyPairing}
          <div class="info-item">
            <span class="info-label">Legacy Pairing</span>
            <span class="info-value">
              <span class="status-indicator" class:active={detailedInfo.LegacyPairing === 'yes'}></span>
              {detailedInfo.LegacyPairing === 'yes' ? 'Yes' : 'No'}
            </span>
          </div>
        {/if}

        {#if detailedInfo.Blocked}
          <div class="info-item">
            <span class="info-label">Blocked</span>
            <span class="info-value">
              <span class="status-indicator" class:active={detailedInfo.Blocked === 'yes'}></span>
              {detailedInfo.Blocked === 'yes' ? 'Yes' : 'No'}
            </span>
          </div>
        {/if}

        {#if detailedInfo.Bonded}
          <div class="info-item">
            <span class="info-label">Bonded</span>
            <span class="info-value">
              <span class="status-indicator" class:active={detailedInfo.Bonded === 'yes'}></span>
              {detailedInfo.Bonded === 'yes' ? 'Yes' : 'No'}
            </span>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Connection History (placeholder for future feature) -->
  <div class="device-info-section">
    <h3>Connection History</h3>
    <div class="connection-history">
      <div class="history-item">
        <div class="history-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <div class="history-info">
          <div class="history-title">Last Connected</div>
          <div class="history-detail">
            {#if device.connected}
              Currently connected
            {:else}
              Not available yet
            {/if}
          </div>
        </div>
      </div>
      <div class="history-item">
        <div class="history-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
            <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <div class="history-info">
          <div class="history-title">Total Connections</div>
          <div class="history-detail">Feature coming soon</div>
        </div>
      </div>
    </div>
  </div>

  <div class="danger-zone">
    <!-- Block/Unblock Button -->
    <button 
      class="btn-block" 
      class:blocked={device.blocked}
      on:click={handleBlockToggle}
      disabled={loading}
    >
      <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        {#if device.blocked}
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 12h8"/>
        {:else}
          <circle cx="12" cy="12" r="10"/>
          <path d="M4.93 4.93l14.14 14.14"/>
        {/if}
      </svg>
      {device.blocked ? 'Unblock Device' : 'Block Device'}
    </button>
    
    {#if showConfirmRemove}
      <div class="confirm-remove">
        <p>Are you sure? This will unpair the device.</p>
        <div class="confirm-actions">
          <button class="btn-secondary" on:click={cancelRemove}>Cancel</button>
          <button class="btn-danger" on:click={handleRemove} disabled={loading}>Remove</button>
        </div>
      </div>
    {:else}
      <button class="btn-remove" on:click={handleRemove}>
        <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        Remove Device
      </button>
    {/if}
  </div>
</div>

<style>
  .device-detail-panel {
    width: 380px;
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-left: 1px solid var(--glass-border);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    animation: slide-in 0.3s ease;
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .detail-header {
    display: flex;
    justify-content: flex-end;
    padding: var(--spacing-md);
  }

  .close-btn {
    color: var(--color-text-muted);
  }

  .close-btn:hover {
    color: var(--color-text-primary);
  }

  .device-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--spacing-lg) var(--spacing-xl);
    text-align: center;
  }

  .hero-icon {
    position: relative;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-tertiary);
    border: 2px solid var(--glass-border);
    border-radius: 50%;
    margin-bottom: var(--spacing-lg);
  }

  .hero-icon svg {
    width: 40px;
    height: 40px;
    color: var(--color-text-secondary);
  }

  .hero-icon.connected {
    border-color: var(--color-success);
    background: rgba(0, 255, 157, 0.1);
  }

  .hero-icon.connected svg {
    color: var(--color-success);
  }

  .connection-pulse {
    position: absolute;
    inset: -4px;
    border: 2px solid var(--color-success);
    border-radius: 50%;
    animation: pulse 2s ease-out infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(1.3);
      opacity: 0;
    }
  }

  .device-name {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-xs);
  }

  .rename-button {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    margin: var(--spacing-sm) 0;
    padding: var(--spacing-xs) var(--spacing-md);
    background: var(--color-accent-primary);
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-bg-primary);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .rename-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--color-accent-glow);
  }

  .device-mac {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-md);
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-md);
    background: var(--color-bg-tertiary);
    border-radius: 100px;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .status-badge.connected {
    background: rgba(0, 255, 157, 0.15);
    color: var(--color-success);
  }

  .status-badge.paired {
    background: rgba(0, 212, 255, 0.15);
    color: var(--color-accent-primary);
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin: 0 var(--spacing-xl);
    padding: var(--spacing-md);
    background: rgba(255, 71, 87, 0.1);
    border: 1px solid rgba(255, 71, 87, 0.3);
    border-radius: var(--radius-md);
    color: var(--color-error);
    font-size: 0.875rem;
  }

  .action-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-sm);
    padding: var(--spacing-lg) var(--spacing-xl);
  }

  .file-transfer-section {
    padding: 0 var(--spacing-xl) var(--spacing-lg);
    display: flex;
    justify-content: center;
  }
  
  .file-transfer-section .btn-action {
    width: 100%;
    background: rgba(0, 212, 255, 0.05);
    border-color: rgba(0, 212, 255, 0.2);
  }
  
  .file-transfer-section .btn-action:hover {
    background: rgba(0, 212, 255, 0.15);
    border-color: var(--color-accent-primary);
  }

  .btn-action {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-lg);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-action svg {
    width: 24px;
    height: 24px;
  }

  .btn-action span {
    font-size: 0.75rem;
    font-weight: 500;
  }

  .btn-action:hover:not(:disabled) {
    border-color: var(--color-accent-primary);
    background: var(--color-accent-dim);
  }

  .btn-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-action.connect:hover:not(:disabled) {
    border-color: var(--color-success);
    background: rgba(0, 255, 157, 0.1);
    color: var(--color-success);
  }

  .btn-action.disconnect:hover:not(:disabled) {
    border-color: var(--color-warning);
    background: rgba(255, 184, 0, 0.1);
    color: var(--color-warning);
  }

  .btn-action.trust.active {
    border-color: var(--color-success);
    background: rgba(0, 255, 157, 0.1);
    color: var(--color-success);
  }

  .device-preferences {
    padding: var(--spacing-lg) var(--spacing-xl);
    border-top: 1px solid var(--glass-border);
  }

  .device-preferences h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: var(--spacing-md);
  }

  .preference-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--color-bg-tertiary);
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    border: 1px solid var(--glass-border);
  }

  .pref-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .pref-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .pref-desc {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  /* Toggle Switch */
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 22px;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-switch .slider {
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: var(--color-bg-primary);
    border: 1px solid var(--glass-border);
    transition: .3s;
    border-radius: 22px;
  }

  .toggle-switch .slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: var(--color-text-secondary);
    transition: .3s;
    border-radius: 50%;
  }

  .toggle-switch input:checked + .slider {
    background-color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
  }

  .toggle-switch input:checked + .slider:before {
    transform: translateX(18px);
    background-color: var(--color-bg-primary);
  }

  .device-info-section {
    padding: var(--spacing-lg) var(--spacing-xl);
  }

  .device-info-section h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: var(--spacing-md);
  }

  .info-grid {
    display: grid;
    gap: var(--spacing-sm);
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--glass-border);
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .signal-waveform-section {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }

  .waveform-container {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .info-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .info-value {
    font-size: 0.875rem;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .info-value.font-mono {
    font-family: var(--font-mono);
  }

  .battery-bar {
    width: 24px;
    height: 8px;
    background: var(--color-bg-tertiary);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

  .battery-bar::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: var(--level);
    background: var(--color-success);
    border-radius: 4px;
  }

  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-text-muted);
  }

  .status-indicator.active {
    background: var(--color-success);
    box-shadow: 0 0 8px var(--color-success);
  }

  .danger-zone {
    margin-top: auto;
    padding: var(--spacing-lg) var(--spacing-xl);
    border-top: 1px solid var(--glass-border);
  }

  .btn-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    width: 100%;
    padding: var(--spacing-md);
    background: transparent;
    border: 1px solid var(--color-error);
    border-radius: var(--radius-md);
    color: var(--color-error);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-remove:hover {
    background: rgba(255, 71, 87, 0.1);
  }

  .confirm-remove {
    text-align: center;
  }

  .confirm-remove p {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-md);
  }

  .confirm-actions {
    display: flex;
    gap: var(--spacing-md);
  }

  .confirm-actions button {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-secondary {
    background: var(--color-bg-tertiary);
    border: 1px solid var(--glass-border);
    color: var(--color-text-primary);
  }

  .btn-secondary:hover {
    background: var(--color-bg-card);
  }

  .btn-danger {
    background: var(--color-error);
    border: none;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #ff5c6b;
  }

  .btn-danger:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Audio Profiles */
  .audio-profiles {
    padding: var(--spacing-lg) var(--spacing-xl);
    border-top: 1px solid var(--glass-border);
  }

  .audio-profiles h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: var(--spacing-md);
  }

  .profile-buttons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md);
  }

  .btn-profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-profile svg {
    width: 20px;
    height: 20px;
  }

  .btn-profile span {
    font-size: 0.7rem;
    font-weight: 500;
    text-align: center;
    line-height: 1.3;
  }

  .btn-profile span small {
    font-size: 0.6rem;
    opacity: 0.7;
  }

  .btn-profile:hover:not(:disabled) {
    border-color: var(--color-accent-primary);
    background: var(--color-accent-dim);
    color: var(--color-accent-primary);
  }

  .btn-profile:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .alias-edit {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-xs);
  }

  .alias-edit input {
    background: var(--color-bg-tertiary);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-sm) var(--spacing-md);
    color: var(--color-text-primary);
    font-size: 1.25rem;
    font-weight: 600;
    text-align: center;
    width: 100%;
    max-width: 280px;
  }

  .alias-edit input:focus {
    outline: none;
    border-color: var(--color-accent-primary);
  }

  .alias-actions {
    display: flex;
    gap: var(--spacing-sm);
  }

  /* Block Button */
  .btn-block {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    width: 100%;
    padding: var(--spacing-md);
    background: transparent;
    border: 1px solid var(--color-warning);
    border-radius: var(--radius-md);
    color: var(--color-warning);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all var(--transition-fast);
    margin-bottom: var(--spacing-md);
  }

  .btn-block:hover {
    background: rgba(255, 184, 0, 0.1);
  }

  .btn-block.blocked {
    border-color: var(--color-error);
    color: var(--color-error);
  }

  .btn-block.blocked:hover {
    background: rgba(255, 71, 87, 0.1);
  }

  /* Device Capabilities */
  .capabilities-grid {
    display: grid;
    gap: var(--spacing-sm);
  }

  .capability-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-sm);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-sm);
  }

  .capability-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-accent-primary);
    border-radius: 50%;
    color: var(--color-bg-primary);
    flex-shrink: 0;
  }

  .capability-icon svg {
    width: 16px;
    height: 16px;
  }

  .capability-info {
    flex: 1;
    min-width: 0;
  }

  .capability-name {
    font-weight: 500;
    color: var(--color-text-primary);
    margin-bottom: 2px;
  }

  .capability-uuid {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-family: monospace;
    word-break: break-all;
  }

  /* Connection History */
  .connection-history {
    display: grid;
    gap: var(--spacing-md);
  }

  .history-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
  }

  .history-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-accent-primary);
    border-radius: 50%;
    color: var(--color-bg-primary);
    flex-shrink: 0;
  }

  .history-icon svg {
    width: 20px;
    height: 20px;
  }

  .history-info {
    flex: 1;
  }

  .history-title {
    font-weight: 500;
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }

  .history-detail {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  /* Status indicators */
  .status-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-text-muted);
    margin-right: var(--spacing-xs);
    vertical-align: middle;
  }

  .status-indicator.active {
    background: var(--color-success);
    box-shadow: 0 0 8px var(--color-success);
  }

  /* Font utilities */
  .font-mono {
    font-family: monospace;
    font-size: 0.875rem;
  }
</style>
