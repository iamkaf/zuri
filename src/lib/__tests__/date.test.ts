import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isoToday, recurStateSuffix } from '../date';

describe('isoToday', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const result = isoToday();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('reflects the mocked date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15, 12)); // local noon, month is 0-indexed
    expect(isoToday()).toBe('2025-06-15');
    vi.useRealTimers();
  });
});

describe('recurStateSuffix', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15, 12)); // local noon, month is 0-indexed
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns " · done today" when lastDone is today', () => {
    expect(recurStateSuffix('2025-06-15', '2025-06-15')).toBe(' · done today');
  });

  it('returns " · due today" when due is today and not done today', () => {
    expect(recurStateSuffix('2025-06-15', '2025-06-01')).toBe(' · due today');
  });

  it('returns " · tomorrow" when due is tomorrow', () => {
    expect(recurStateSuffix('2025-06-16', '2025-06-01')).toBe(' · tomorrow');
  });

  it('returns overdue message when due is in the past', () => {
    expect(recurStateSuffix('2025-06-10', '2025-06-01')).toBe(' · 5d overdue');
  });

  it('returns formatted date when due is further in the future', () => {
    const result = recurStateSuffix('2025-06-20', '2025-06-01');
    expect(result).toMatch(/^ · /);
  });

  it('returns done date when no due but lastDone is set', () => {
    const result = recurStateSuffix(undefined, '2025-06-01');
    expect(result).toMatch(/^ · done /);
  });

  it('returns empty string when no due or lastDone', () => {
    expect(recurStateSuffix(undefined, undefined)).toBe('');
  });
});
