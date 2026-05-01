import { describe, it, expect } from 'vitest';
import { fuzzyMatch } from '../src/utils/fuzzy';

describe('fuzzyMatch', () => {
  it('should return true for an empty pattern', () => {
    expect(fuzzyMatch('', 'any string').isMatch).toBe(true);
  });

  it('should match exact strings', () => {
    const result = fuzzyMatch('AirPods', 'AirPods');
    expect(result.isMatch).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it('should match case-insensitively', () => {
    const result = fuzzyMatch('airpods', 'AirPods');
    expect(result.isMatch).toBe(true);
  });

  it('should match partial strings', () => {
    const result = fuzzyMatch('pod', 'AirPods Pro');
    expect(result.isMatch).toBe(true);
  });

  it('should give higher score for word boundaries', () => {
    const result1 = fuzzyMatch('pod', 'AirPods');
    const result2 = fuzzyMatch('pod', 'Air Pods');
    expect(result2.score).toBeGreaterThan(result1.score);
  });

  it('should not match when characters are missing or out of order', () => {
    const result = fuzzyMatch('z', 'AirPods');
    expect(result.isMatch).toBe(false);
  });
});
