import { describe, it, expect } from 'vitest';
import { getThemeFamily, cycleTheme } from '../theme';
import type { ThemeId } from '../../preload';

describe('getThemeFamily', () => {
  it('returns "apple" for apple themes', () => {
    expect(getThemeFamily('apple-light')).toBe('apple');
    expect(getThemeFamily('apple-dark')).toBe('apple');
  });

  it('returns "windows" for windows themes', () => {
    expect(getThemeFamily('windows-light')).toBe('windows');
    expect(getThemeFamily('windows-dark')).toBe('windows');
  });

  it('returns "open" for open themes', () => {
    expect(getThemeFamily('open-light')).toBe('open');
    expect(getThemeFamily('open-dark')).toBe('open');
  });
});

describe('cycleTheme', () => {
  it('cycles apple-light → apple-dark', () => {
    expect(cycleTheme('apple-light', 'apple')).toBe('apple-dark');
  });

  it('cycles apple-dark → apple-light', () => {
    expect(cycleTheme('apple-dark', 'apple')).toBe('apple-light');
  });

  it('cycles windows-light → windows-dark', () => {
    expect(cycleTheme('windows-light', 'windows')).toBe('windows-dark');
  });

  it('cycles open-dark → open-light', () => {
    expect(cycleTheme('open-dark', 'open')).toBe('open-light');
  });

  it('cycles a theme not in the target family from the first entry', () => {
    // current theme is not in the family list, indexOf returns -1, so (−1+1) % 2 = 0
    expect(cycleTheme('apple-dark' as ThemeId, 'windows')).toBe('windows-light');
  });
});
