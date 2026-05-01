import { writable } from 'svelte/store';

const STORAGE_KEY = 'bluest_teeth_connection_history';

// History schema: { [mac]: { name: string, lastConnected: number, autoReconnect: boolean } }
function createHistoryStore() {
  const initialData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const { subscribe, set, update } = writable(initialData);

  return {
    subscribe,
    addConnection: (mac, name) => {
      update(history => {
        const entry = history[mac] || { autoReconnect: false };
        history[mac] = {
          ...entry,
          name,
          lastConnected: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        return history;
      });
    },
    toggleAutoReconnect: (mac) => {
      update(history => {
        if (history[mac]) {
          history[mac].autoReconnect = !history[mac].autoReconnect;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        }
        return history;
      });
    },
    removeHistory: (mac) => {
      update(history => {
        delete history[mac];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        return history;
      });
    }
  };
}

export const connectionHistory = createHistoryStore();
