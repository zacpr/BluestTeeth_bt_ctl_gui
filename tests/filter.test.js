import { describe, it, expect, beforeEach } from 'vitest';
import { filterDevices, deviceFilter, searchQuery } from '../src/stores/filter';
import { get } from 'svelte/store';

describe('Filter Store', () => {
  const mockDevices = [
    { mac: '1', name: 'Headphones', connected: true, paired: true, trusted: true },
    { mac: '2', name: 'Mouse', connected: false, paired: true, trusted: true },
    { mac: '3', name: 'Keyboard', connected: false, paired: false, trusted: false }
  ];

  beforeEach(() => {
    deviceFilter.set('all');
    searchQuery.set('');
  });

  it('should initialize with default values', () => {
    expect(get(deviceFilter)).toBe('all');
    expect(get(searchQuery)).toBe('');
  });

  it('should filter by connected status', () => {
    const result = filterDevices(mockDevices, 'connected', '');
    expect(result).toHaveLength(1);
    expect(result[0].mac).toBe('1');
  });

  it('should filter by paired status', () => {
    const result = filterDevices(mockDevices, 'paired', '');
    expect(result).toHaveLength(2);
  });

  it('should filter using fuzzy search', () => {
    const result = filterDevices(mockDevices, 'all', 'head');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Headphones');
  });

  it('should combine state filter and fuzzy search', () => {
    const result = filterDevices(mockDevices, 'paired', 'mouse');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Mouse');
  });
});
