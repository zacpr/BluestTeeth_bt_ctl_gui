<script>
  import { onMount, onDestroy } from 'svelte';

  export let device;
  export let width = 400;
  export let height = 120;

  let canvas;
  let ctx;
  let animationFrame;
  let dataPoints = [];
  let maxPoints = 60; // 60 seconds at 1Hz
  let lastRSSI = null;
  let lastUpdateTime = Date.now();

  // Color gradient based on signal quality
  const getSignalColor = (rssi) => {
    if (rssi >= -50) return '#00ff9d'; // Excellent (green)
    if (rssi >= -60) return '#00d4ff'; // Good (blue)
    if (rssi >= -70) return '#ffa500'; // Fair (orange)
    if (rssi >= -80) return '#ff6b35'; // Poor (orange-red)
    return '#ff4757'; // Very poor (red)
  };

  // Signal quality text
  const getSignalQuality = (rssi) => {
    if (rssi >= -50) return 'Excellent';
    if (rssi >= -60) return 'Good';
    if (rssi >= -70) return 'Fair';
    if (rssi >= -80) return 'Poor';
    return 'Very Poor';
  };

  // Y-axis scaling (-100 to -40 dBm)
  const minRSSI = -100;
  const maxRSSI = -40;

  const addDataPoint = (rssi) => {
    const now = Date.now();
    dataPoints.push({ rssi, time: now });

    // Keep only last maxPoints
    if (dataPoints.length > maxPoints) {
      dataPoints.shift();
    }

    lastRSSI = rssi;
    lastUpdateTime = now;
  };

  const draw = () => {
    if (!ctx || !canvas) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (dataPoints.length < 2) return;

    const timeRange = dataPoints[dataPoints.length - 1].time - dataPoints[0].time;
    const timeSpan = Math.max(timeRange, 60000); // At least 60 seconds

    // Draw background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let rssi = minRSSI; rssi <= maxRSSI; rssi += 10) {
      const y = height - ((rssi - minRSSI) / (maxRSSI - minRSSI)) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // RSSI labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px monospace';
      ctx.fillText(`${rssi}dBm`, 5, y - 3);
    }

    // Vertical time grid (every 10 seconds)
    const timeLabels = [0, 10, 20, 30, 40, 50, 60];
    timeLabels.forEach(seconds => {
      const x = (seconds / 60) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px monospace';
      ctx.fillText(`${seconds}s`, x + 3, height - 3);
    });

    // Draw the signal waveform
    ctx.strokeStyle = getSignalColor(lastRSSI);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    dataPoints.forEach((point, index) => {
      const x = ((point.time - dataPoints[0].time) / timeSpan) * width;
      const y = height - ((point.rssi - minRSSI) / (maxRSSI - minRSSI)) * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        // Smooth curve using quadratic curves
        const prevPoint = dataPoints[index - 1];
        const prevX = ((prevPoint.time - dataPoints[0].time) / timeSpan) * width;
        const prevY = height - ((prevPoint.rssi - minRSSI) / (maxRSSI - minRSSI)) * height;

        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(cpX, prevY, x, y);
      }
    });

    ctx.stroke();

    // Draw data points as small circles
    ctx.fillStyle = getSignalColor(lastRSSI);
    dataPoints.forEach(point => {
      const x = ((point.time - dataPoints[0].time) / timeSpan) * width;
      const y = height - ((point.rssi - minRSSI) / (maxRSSI - minRSSI)) * height;

      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Current RSSI indicator
    if (lastRSSI !== null) {
      const currentY = height - ((lastRSSI - minRSSI) / (maxRSSI - minRSSI)) * height;

      ctx.strokeStyle = getSignalColor(lastRSSI);
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(width, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Current value label
      ctx.fillStyle = getSignalColor(lastRSSI);
      ctx.font = '12px monospace';
      ctx.fillText(`${lastRSSI}dBm`, width - 60, currentY - 5);
    }

    animationFrame = requestAnimationFrame(draw);
  };

  onMount(() => {
    if (canvas) {
      ctx = canvas.getContext('2d');
      draw();
    }

    // Initialize with current device RSSI if available
    if (device?.rssi) {
      addDataPoint(device.rssi);
    }
  });

  onDestroy(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });

  // Reactive to device RSSI changes
  $: if (device?.rssi !== undefined && device.rssi !== lastRSSI) {
    addDataPoint(device.rssi);
  }
</script>

<canvas
  bind:this={canvas}
  width={width}
  height={height}
  class="signal-waveform"
  style="width: {width}px; height: {height}px;"
></canvas>

{#if lastRSSI !== null}
  <div class="signal-info">
    <div class="signal-value">
      <span class="rssi">{lastRSSI}dBm</span>
      <span class="quality" style="color: {getSignalColor(lastRSSI)}">
        {getSignalQuality(lastRSSI)}
      </span>
    </div>
    <div class="signal-bar">
      <div
        class="signal-fill"
        style="width: {Math.max(0, Math.min(100, ((lastRSSI + 100) / 60) * 100))}%; background: {getSignalColor(lastRSSI)}"
      ></div>
    </div>
  </div>
{/if}

<style>
  .signal-waveform {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.1));
    backdrop-filter: blur(10px);
    width: 100%;
    height: auto;
    max-width: 100%;
  }

  .signal-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .signal-value {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .rssi {
    font-family: monospace;
    font-size: 14px;
    font-weight: bold;
    color: var(--color-text-primary);
  }

  .quality {
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
  }

  .signal-bar {
    width: 80px;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }

  .signal-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease, background-color 0.3s ease;
  }
</style>