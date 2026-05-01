import { writable, get } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import { debounce } from '../utils/debounce.js';
import { notifySuccess, notifyError, notifyInfo } from './toast.js';
import { connectionHistory } from './history.js';
import { runAutomationEvent } from './automation.js';

export const devices = writable([]);
export const controller = writable(null);
export const isScanning = writable(false);
export const selectedDevice = writable(null);
export const refreshInterval = writable(3000);

let eventUnlisteners = [];

export async function initializeBluetooth() {
  try {
    await loadDevices();
    setupEventListeners();
  } catch (e) {
    console.error('Failed to initialize Bluetooth:', e);
  }
}

export async function loadDevices() {
  try {
    const deviceList = await invoke('get_devices');
    devices.set(deviceList);

    const controllerList = await invoke('get_controllers');
    if (controllerList && controllerList.length > 0) {
      controller.set(controllerList[0]);
    }

    // Auto-reconnect logic
    const history = get(connectionHistory);
    for (const d of deviceList) {
      const h = history[d.mac];
      if (h && h.autoReconnect && !d.connected && d.paired) {
        console.log(`Auto-reconnecting to ${d.name} (${d.mac})`);
        // Do not await to avoid blocking initialization
        invoke('connect_device', { mac: d.mac })
          .then(() => notifySuccess(`Auto-connected to ${d.alias || d.name}`))
          .catch(() => {}); // silent fail on auto-reconnect
      }
    }
  } catch (e) {
    console.error('Failed to load devices:', e);
  }
}

function setupEventListeners() {
  const unlisten = listen('bluetooth-event', (event) => {
    const data = event.payload;

    switch (data.type) {
      case 'DeviceFound': {
        const { mac, name, rssi } = data.data;
        updateDevice(mac, { name, rssi });
        runAutomationEvent('device_found', { mac, name, rssi });
        
        // Auto-reconnect triggered when device is found during scan
        const history = get(connectionHistory);
        const h = history[mac];
        if (h && h.autoReconnect) {
          const deviceList = get(devices);
          const dev = deviceList.find(d => d.mac === mac);
          if (dev && dev.paired && !dev.connected) {
             console.log(`Auto-reconnecting to recently found device: ${name} (${mac})`);
             invoke('connect_device', { mac }).catch(() => {});
          }
        }
        break;
      }
      case 'DeviceConnected': {
        const { mac } = data.data;
        updateDevice(mac, { connected: true });
        runAutomationEvent('device_connected', { mac });
        break;
      }
      case 'DeviceDisconnected': {
        const { mac } = data.data;
        updateDevice(mac, { connected: false });
        runAutomationEvent('device_disconnected', { mac });
        break;
      }
      case 'RSSIUpdated': {
        const { mac, rssi } = data.data;
        debouncedRSSIUpdate(mac, rssi);
        runAutomationEvent('rssi_updated', { mac, rssi });
        break;
      }
      case 'BatteryUpdated': {
        const { mac, battery } = data.data;
        debouncedBatteryUpdate(mac, battery);
        break;
      }
      case 'DevicePaired': {
        const { mac } = data.data;
        updateDevice(mac, { paired: true });
        runAutomationEvent('device_paired', { mac });
        break;
      }
      case 'DeviceUnpaired': {
        const { mac } = data.data;
        updateDevice(mac, { paired: false });
        break;
      }
      case 'ControllerPoweredChanged': {
        const { powered } = data.data;
        controller.update(ctrl => ctrl ? { ...ctrl, powered } : ctrl);
        break;
      }
      case 'ControllerDiscoverableChanged': {
        const { discoverable } = data.data;
        controller.update(ctrl => ctrl ? { ...ctrl, discoverable } : ctrl);
        break;
      }
    }
  });

  eventUnlisteners.push(unlisten);
}

const debouncedRSSIUpdate = debounce((mac, rssi) => {
  devices.update(currentDevices => {
    const existingIndex = currentDevices.findIndex(d => d.mac === mac);

    if (existingIndex !== -1) {
      const updated = [...currentDevices];
      updated[existingIndex] = { ...updated[existingIndex], rssi };
      return updated;
    } else {
      return [...currentDevices];
    }
  });
}, 150);

const debouncedBatteryUpdate = debounce((mac, battery) => {
  devices.update(currentDevices => {
    const existingIndex = currentDevices.findIndex(d => d.mac === mac);

    if (existingIndex !== -1) {
      const updated = [...currentDevices];
      updated[existingIndex] = { ...updated[existingIndex], battery };
      return updated;
    } else {
      return [...currentDevices];
    }
  });
}, 500);

function updateDevice(mac, updates) {
  devices.update(currentDevices => {
    const existingIndex = currentDevices.findIndex(d => d.mac === mac);

    if (existingIndex !== -1) {
      const updated = [...currentDevices];
      updated[existingIndex] = { ...updated[existingIndex], ...updates };
      return updated;
    } else {
      return [...currentDevices];
    }
  });
}

export function cleanupEventListeners() {
  eventUnlisteners.forEach(unlisten => {
    if (typeof unlisten === 'function') {
      unlisten();
    }
  });
  eventUnlisteners = [];
}

export async function connectDevice(mac) {
  try {
    await invoke('connect_device', { mac });
    notifySuccess('Connection successful');
    const deviceList = get(devices);
    const d = deviceList.find(dev => dev.mac === mac);
    const name = d ? (d.alias || d.name) : 'Unknown Device';
    connectionHistory.addConnection(mac, name);
  } catch (e) {
    notifyError(`Connection failed: ${e}`);
    throw e;
  }
}

export async function disconnectDevice(mac) {
  try {
    await invoke('disconnect_device', { mac });
    notifyInfo('Device disconnected');
  } catch (e) {
    notifyError(`Disconnect failed: ${e}`);
    throw e;
  }
}

export async function connectProfile(mac, profile) {
  try {
    await invoke('connect_profile', { mac, profile });
    notifySuccess(`Profile ${profile} connected`);
  } catch (e) {
    notifyError(`Profile connection failed: ${e}`);
    throw e;
  }
}

export async function disconnectProfile(mac, profile) {
  try {
    await invoke('disconnect_profile', { mac, profile });
    notifyInfo(`Profile ${profile} disconnected`);
  } catch (e) {
    notifyError(`Profile disconnect failed: ${e}`);
    throw e;
  }
}

export async function pairDevice(mac) {
  try {
    notifyInfo('Pairing initiated... Check your device.');
    await invoke('pair_device', { mac });
    notifySuccess('Device paired successfully');
  } catch (e) {
    notifyError(`Pairing failed: ${e}`);
    throw e;
  }
}

export async function removeDevice(mac) {
  try {
    await invoke('remove_device', { mac });
    notifyInfo('Device removed');
    // Also remove from cache
    deviceCache.delete(mac);
    updateDevicesList();
  } catch (e) {
    notifyError(`Failed to remove device: ${e}`);
    throw e;
  }
}

export async function blockDevice(mac) {
  try {
    await invoke('block_device', { mac });
    notifyInfo('Device blocked');
  } catch (e) {
    notifyError(`Failed to block device: ${e}`);
    throw e;
  }
}

export async function unblockDevice(mac) {
  try {
    await invoke('unblock_device', { mac });
    notifyInfo('Device unblocked');
  } catch (e) {
    notifyError(`Failed to unblock device: ${e}`);
    throw e;
  }
}

export async function trustDevice(mac) {
  try {
    await invoke('trust_device', { mac });
    notifySuccess('Device trusted');
  } catch (e) {
    notifyError(`Failed to trust device: ${e}`);
    throw e;
  }
}

export async function untrustDevice(mac) {
  try {
    await invoke('untrust_device', { mac });
    notifyInfo('Device untrusted');
  } catch (e) {
    notifyError(`Failed to untrust device: ${e}`);
    throw e;
  }
}

export async function setDeviceAlias(mac, alias) {
  try {
    await invoke('set_device_alias', { mac, alias });
    notifySuccess(`Device renamed to ${alias}`);
  } catch (e) {
    notifyError(`Failed to rename device: ${e}`);
    throw e;
  }
}

export async function sendFile(mac) {
  try {
    const selected = await open({
      multiple: false,
      title: 'Select File to Send',
    });

    if (selected) {
      notifyInfo(`Initiating file transfer to ${mac}...`);
      await invoke('send_file_to_device', { mac, filePath: selected });
      notifySuccess('File transfer initiated successfully!');
    }
  } catch (e) {
    notifyError(`Failed to send file: ${e}`);
    throw e;
  }
}

export async function getDeviceInfo(mac) {
  return await invoke('get_device_info', { mac });
}
