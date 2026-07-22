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
  accentReadable: string;
  danger: string;
  success: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  fontScale: number;
}

// --- WCAG contrast math (replaces the old crude "perceived brightness"
// heuristic, which was actually picking the *worse* text color for
// several accent options - verified with a real audit). ---

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Picks whichever of black/white actually has the higher real contrast ratio against the given fill. */
function contrastTextColor(hex: string): string {
  const withBlack = contrastRatio('#000000', hex);
  const withWhite = contrastRatio('#FFFFFF', hex);
  return withBlack >= withWhite ? '#000000' : '#FFFFFF';
}

function hexToHsl(hex: string): [number, number, number] {
  let [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Returns a version of `hex` guaranteed to meet WCAG AA (4.5:1) as text
 * against `backgroundHex`, adjusting lightness only - so the color still
 * reads as "that color" (Yellow stays yellow, just a deeper shade),
 * rather than swapping to a generic black/white fallback. Colors that
 * already pass are returned unchanged.
 */
function makeReadableOnBackground(hex: string, backgroundHex: string, targetRatio = 4.5): string {
  if (contrastRatio(hex, backgroundHex) >= targetRatio) return hex;

  const [h, s, l] = hexToHsl(hex);
  const backgroundIsLight = relativeLuminance(hexToRgb(backgroundHex)) > 0.5;

  // On a light background we need a darker color (walk lightness down);
  // on a dark background we need a lighter color (walk it up).
  let bestHex = hex;
  let bestRatio = contrastRatio(hex, backgroundHex);
  const step = backgroundIsLight ? -0.02 : 0.02;

  for (let newL = l; newL >= 0 && newL <= 1; newL += step) {
    const candidate = hslToHex(h, s, newL);
    const ratio = contrastRatio(candidate, backgroundHex);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestHex = candidate;
    }
    if (ratio >= targetRatio) return candidate;
  }

  return bestHex; // best effort if the target truly can't be hit (e.g. pure White/Black picked as accent)
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
  const backgroundHex = dark ? '#000000' : '#FFFFFF';
  return {
    mode: settings.themeMode,
    fontScale: fontScaleFor(settings.fontSize),
    colors: {
      background: backgroundHex,
      surface: dark ? '#1C1C1E' : '#F2F2F7',
      text: dark ? '#FFFFFF' : '#000000',
      textSecondary: dark ? '#C7C7CC' : '#666666',
      textMuted: '#8E8E93',
      border: dark ? '#3A3A3C' : '#E5E5EA',
      accent: settings.themeColor,
      accentText: contrastTextColor(settings.themeColor),
      accentReadable: makeReadableOnBackground(settings.themeColor, backgroundHex),
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
