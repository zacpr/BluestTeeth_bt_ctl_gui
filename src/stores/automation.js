import { writable, get } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import { notifyError, notifyInfo, notifySuccess } from './toast.js';

const STORAGE_KEY = 'bluest_teeth_automation_rules';

export const automationTriggers = [
  { value: 'device_found', label: 'Device Found During Scan' },
  { value: 'device_connected', label: 'Device Connected' },
  { value: 'device_disconnected', label: 'Device Disconnected' },
  { value: 'device_paired', label: 'Device Paired' },
  { value: 'rssi_updated', label: 'Signal Updated' },
];

export const automationActionTypes = [
  { value: 'command', label: 'Run Command' },
  { value: 'webhook', label: 'Send Webhook' },
];

function loadRules() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRules(rules) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

function createAutomationStore() {
  const { subscribe, set, update } = writable(loadRules());

  return {
    subscribe,
    addRule: (rule) => update((rules) => {
      const next = [
        ...rules,
        {
          id: crypto.randomUUID(),
          enabled: true,
          name: rule.name?.trim() || 'Untitled Automation',
          trigger: rule.trigger || 'device_connected',
          mac: rule.mac?.trim() || '',
          actionType: rule.actionType || 'command',
          command: rule.command?.trim() || '',
          webhookUrl: rule.webhookUrl?.trim() || '',
          createdAt: Date.now(),
          lastRun: null,
        },
      ];
      saveRules(next);
      return next;
    }),
    updateRule: (id, changes) => update((rules) => {
      const next = rules.map((rule) => rule.id === id ? { ...rule, ...changes } : rule);
      saveRules(next);
      return next;
    }),
    removeRule: (id) => update((rules) => {
      const next = rules.filter((rule) => rule.id !== id);
      saveRules(next);
      return next;
    }),
    toggleRule: (id) => update((rules) => {
      const next = rules.map((rule) => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule);
      saveRules(next);
      return next;
    }),
    clear: () => {
      saveRules([]);
      set([]);
    },
  };
}

export const automationRules = createAutomationStore();

export async function runAutomationEvent(trigger, payload = {}) {
  const mac = payload.mac || payload.address || '';
  const rules = get(automationRules).filter((rule) => {
    if (!rule.enabled || rule.trigger !== trigger) return false;
    return !rule.mac || rule.mac.toLowerCase() === mac.toLowerCase();
  });

  if (rules.length === 0) return;

  for (const rule of rules) {
    try {
      if (rule.actionType === 'command') {
        if (!rule.command) continue;
        await invoke('run_automation_command', { command: rule.command, eventPayload: payload });
      } else if (rule.actionType === 'webhook') {
        if (!rule.webhookUrl) continue;
        await invoke('send_automation_webhook', {
          url: rule.webhookUrl,
          eventName: trigger,
          eventPayload: payload,
        });
      }

      automationRules.updateRule(rule.id, { lastRun: Date.now() });
      notifySuccess(`Automation ran: ${rule.name}`);
    } catch (e) {
      notifyError(`Automation failed (${rule.name}): ${e}`);
    }
  }
}

export function automationEventLabel(trigger) {
  return automationTriggers.find((item) => item.value === trigger)?.label || trigger;
}

export function actionTypeLabel(type) {
  return automationActionTypes.find((item) => item.value === type)?.label || type;
}
