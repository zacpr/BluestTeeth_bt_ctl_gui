import { writable } from 'svelte/store';
import { fuzzyMatch } from '../utils/fuzzy.js';

export const deviceFilter = writable('all'); // all, connected, paired, trusted, bonded
export const searchQuery = writable('');

export function filterDevices(devices, filter, query = '') {
  let filtered = devices;
  
  if (query) {
    filtered = filtered.map(d => {
      const nameMatch = fuzzyMatch(query, d.name || '');
      const aliasMatch = fuzzyMatch(query, d.alias || '');
      const macMatch = fuzzyMatch(query, d.mac || '');
      
      const bestMatch = [nameMatch, aliasMatch, macMatch].reduce(
        (best, current) => (current.isMatch && current.score > best.score) ? current : best,
        { isMatch: false, score: -1 }
      );
      
      return { ...d, fuzzyScore: bestMatch.score, isMatch: bestMatch.isMatch };
    }).filter(d => d.isMatch);
  } else {
    // Give everyone a score of 0 if no query
    filtered = filtered.map(d => ({ ...d, fuzzyScore: 0 }));
  }

  switch (filter) {
    case 'connected':
      return filtered.filter(d => d.connected);
    case 'paired':
      return filtered.filter(d => d.paired);
    case 'trusted':
      return filtered.filter(d => d.trusted);
    case 'bonded':
      return filtered.filter(d => d.paired && d.trusted);
    case 'ready':
      return filtered.filter(d => d.paired && !d.connected);
    default:
      return filtered;
  }
}
