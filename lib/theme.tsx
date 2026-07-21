// lib/theme.ts

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getSettings } from './storage';
import { AppSettings, DEFAULT_SETTINGS } from '../types/models';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  accent: string;
  accentText: string;
  danger: string;
  success: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  fontScale: number;
}

function contrastTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Perceived brightness (standard luminance weighting) - light accents get dark text, dark accents get white text.
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#000000' : '#FFFFFF';
}

function fontScaleFor(size: AppSettings['fontSize']): number {
  switch (size) {
    case 'small':
      return 0.88;
    case 'large':
      return 1.25;
    default:
      return 1;
  }
}

function buildTheme(settings: AppSettings): Theme {
  const dark = settings.themeMode === 'dark';
  return {
    mode: settings.themeMode,
    fontScale: fontScaleFor(settings.fontSize),
    colors: {
      background: dark ? '#000000' : '#FFFFFF',
      surface: dark ? '#1C1C1E' : '#F2F2F7',
      text: dark ? '#FFFFFF' : '#000000',
      textSecondary: dark ? '#C7C7CC' : '#666666',
      textMuted: '#8E8E93',
      border: dark ? '#3A3A3C' : '#E5E5EA',
      accent: settings.themeColor,
      accentText: contrastTextColor(settings.themeColor),
      danger: '#FF3B30',
      success: '#34C759',
    },
  };
}

interface ThemeContextValue {
  theme: Theme;
  refresh: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: buildTheme(DEFAULT_SETTINGS),
  refresh: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const refresh = useCallback(async () => {
    setSettings(await getSettings());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const theme = useMemo(() => buildTheme(settings), [settings]);

  return <ThemeContext.Provider value={{ theme, refresh }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
