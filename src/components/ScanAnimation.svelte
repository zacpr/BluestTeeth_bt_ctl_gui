<script>
  import { devices } from '../stores/bluetooth.js';
  import { onMount, onDestroy } from 'svelte';

  export let active = false;

  let radarCenter = { x: 0, y: 0 };
  let radarRadius = 200;
  let sweepAngle = 0;
  let animationFrame;
  let deviceBlips = [];

  // Device blip management
  function updateDeviceBlips() {
    deviceBlips = $devices.map(device => ({
      id: device.mac,
      name: device.name,
      rssi: device.rssi || -80,
      connected: device.connected,
      angle: Math.random() * Math.PI * 2, // Random angle for demo
      distance: Math.max(0.1, Math.min(0.9, (device.rssi + 100) / 60)), // Distance based on RSSI
      lastUpdate: Date.now()
    }));
  }

  // Radar sweep animation
  function animateSweep() {
    sweepAngle += 0.02; // Adjust speed here
    if (sweepAngle >= Math.PI * 2) {
      sweepAngle = 0;
    }

    // Update blip intensities based on sweep
    deviceBlips.forEach(blip => {
      const angleDiff = Math.abs(sweepAngle - blip.angle);
      const normalizedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff) / Math.PI;
      blip.intensity = Math.max(0.3, 1 - normalizedDiff * 2);
    });

    animationFrame = requestAnimationFrame(animateSweep);
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      radarCenter = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      };
      radarRadius = Math.min(window.innerWidth, window.innerHeight) * 0.3;

      // Update radar position on resize
      const handleResize = () => {
        radarCenter = {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        };
        radarRadius = Math.min(window.innerWidth, window.innerHeight) * 0.3;
      };

      window.addEventListener('resize', handleResize);

      return () => window.removeEventListener('resize', handleResize);
    }
  });

  onDestroy(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });

  // Reactive to device changes
  $: if (active) {
    updateDeviceBlips();
    if (!animationFrame) {
      animateSweep();
    }
  } else {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }
</script>

{#if active}
  <div class="radar-overlay">
    <!-- Radar display -->
    <div class="radar-screen" style="transform: perspective(1000px) rotateX(10deg)">
      <!-- Radar rings -->
      <div class="radar-rings">
        {#each Array(4) as _, i}
          <div
            class="radar-ring"
            style="width: {(i + 1) * 50}px; height: {(i + 1) * 50}px;"
          ></div>
        {/each}
      </div>

      <!-- Radar sweep -->
      <div
        class="radar-sweep"
        style="transform: rotate({sweepAngle}rad)"
      ></div>

      <!-- Center dot -->
      <div class="radar-center"></div>

      <!-- Device blips -->
      <div class="device-blips">
        {#each deviceBlips as blip (blip.id)}
          <div
            class="device-blip"
            class:connected={blip.connected}
            style="
              left: {50 + blip.distance * 45 * Math.cos(blip.angle)}%;
              top: {50 + blip.distance * 45 * Math.sin(blip.angle)}%;
              --intensity: {blip.intensity};
            "
            title="{blip.name} ({blip.rssi}dBm)"
          ></div>
        {/each}
      </div>

      <!-- Radar grid lines -->
      <div class="radar-grid">
        {#each Array(12) as _, i}
          <div
            class="grid-line"
            style="transform: rotate({(i * 30)}deg)"
          ></div>
        {/each}
      </div>
    </div>

    <!-- Scan info -->
    <div class="scan-info">
      <div class="scan-status">
        <div class="scan-dot"></div>
        <span>Scanning for devices...</span>
      </div>
      <div class="device-count">
        {deviceBlips.length} device{deviceBlips.length !== 1 ? 's' : ''} found
      </div>
    </div>
  </div>
{/if}

<style>
  .radar-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .radar-screen {
    position: relative;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background:
      radial-gradient(circle at center, rgba(0, 20, 40, 0.9) 0%, rgba(0, 0, 0, 0.95) 70%),
      conic-gradient(from 0deg, transparent 0deg, rgba(0, 212, 255, 0.1) 90deg, transparent 180deg);
    border: 2px solid var(--color-accent-primary);
    box-shadow:
      0 0 20px var(--color-accent-glow),
      inset 0 0 20px rgba(0, 212, 255, 0.1);
    overflow: hidden;
  }

  .radar-rings {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .radar-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 50%;
    background: radial-gradient(circle, transparent 49%, rgba(0, 212, 255, 0.05) 50%, transparent 51%);
  }

  .radar-ring:nth-child(1) {
    animation: radar-pulse 3s ease-in-out infinite;
  }

  .radar-ring:nth-child(2) {
    animation: radar-pulse 3s ease-in-out infinite 0.5s;
  }

  .radar-ring:nth-child(3) {
    animation: radar-pulse 3s ease-in-out infinite 1s;
  }

  .radar-ring:nth-child(4) {
    animation: radar-pulse 3s ease-in-out infinite 1.5s;
  }

  @keyframes radar-pulse {
    0%, 100% {
      opacity: 0.3;
      transform: translate(-50%, -50%) scale(0.8);
    }
    50% {
      opacity: 0.8;
      transform: translate(-50%, -50%) scale(1.1);
    }
  }

  .radar-sweep {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 50%;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--color-accent-primary), transparent);
    transform-origin: left center;
    box-shadow:
      0 0 10px var(--color-accent-primary),
      0 0 20px var(--color-accent-glow);
    animation: radar-sweep-rotate 3s linear infinite;
    will-change: transform;
  }

  @keyframes radar-sweep-rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .radar-center {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 6px;
    height: 6px;
    background: var(--color-accent-primary);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 10px var(--color-accent-glow);
    z-index: 10;
  }

  .device-blips {
    position: absolute;
    inset: 0;
  }

  .device-blip {
    position: absolute;
    width: 4px;
    height: 4px;
    background: var(--color-accent-primary);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    opacity: var(--intensity);
    transition: opacity 0.3s ease;
    box-shadow: 0 0 6px var(--color-accent-glow);
    animation: blip-pulse 2s ease-in-out infinite;
    will-change: opacity;
  }

  .device-blip.connected {
    background: var(--color-success);
    box-shadow: 0 0 8px var(--color-success);
    animation: connected-blip 1.5s ease-in-out infinite;
  }

  @keyframes blip-pulse {
    0%, 100% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: var(--intensity);
    }
    50% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: calc(var(--intensity) * 1.5);
    }
  }

  @keyframes connected-blip {
    0%, 100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.9;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.4);
      opacity: 1;
    }
  }

  .radar-grid {
    position: absolute;
    inset: 0;
  }

  .grid-line {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 50%;
    height: 1px;
    background: linear-gradient(90deg, rgba(0, 212, 255, 0.2) 0%, transparent 100%);
    transform-origin: left center;
  }

  .scan-info {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    backdrop-filter: blur(10px);
  }

  .scan-status {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--color-text-primary);
    font-size: 14px;
  }

  .scan-dot {
    width: 8px;
    height: 8px;
    background: var(--color-accent-primary);
    border-radius: 50%;
    animation: scan-dot-pulse 1.5s ease-in-out infinite;
  }

  @keyframes scan-dot-pulse {
    0%, 100% {
      opacity: 0.6;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1.2);
    }
  }

  .device-count {
    color: var(--color-text-secondary);
    font-size: 12px;
    font-family: monospace;
  }
</style>
