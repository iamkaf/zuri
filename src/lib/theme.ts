import type { ThemeId } from '../preload';

export const themeLabel: Record<ThemeId, string> = {
  'open-light': 'Open Light',
  'open-dark': 'Open Dark',
  'windows-light': 'Windows Light',
  'windows-dark': 'Windows Dark',
  'apple-light': 'Apple Light',
  'apple-dark': 'Apple Dark',
};

export const getThemeFamily = (theme: ThemeId): 'apple' | 'windows' | 'open' => {
  if (theme.startsWith('apple-')) return 'apple';
  if (theme.startsWith('windows-')) return 'windows';
  return 'open';
};

export const cycleTheme = (current: ThemeId, family: 'apple' | 'windows' | 'open'): ThemeId => {
  const themes: Record<string, ThemeId[]> = {
    apple: ['apple-light', 'apple-dark'],
    windows: ['windows-light', 'windows-dark'],
    open: ['open-light', 'open-dark'],
  };
  const list = themes[family];
  const idx = list.indexOf(current);
  return list[(idx + 1) % list.length];
};
