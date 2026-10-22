/**
 * Paleta e tokens visuais do AtmosBag.
 *
 * A identidade usa o azul-marinho da Azul (#002060) como cor de marca,
 * azul-céu para destaques e superfícies claras com cartões arredondados.
 * O tema escuro é escolhido automaticamente pela preferência do dispositivo.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#08213F',
    background: '#F2F7FC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#DCEEFF',
    textSecondary: '#587392',
    primary: '#002060',
    primarySoft: '#0B3A7A',
    accent: '#0077B6',
    accentSoft: '#E1F2FC',
    sky: '#7DD3FC',
    border: '#D7E7F5',
    danger: '#D92D20',
    success: '#12805C',
    warning: '#B45309',
    onPrimary: '#FFFFFF',
    onAccent: '#FFFFFF',
  },
  dark: {
    text: '#F2F8FF',
    background: '#061426',
    backgroundElement: '#0B2140',
    backgroundSelected: '#12345A',
    textSecondary: '#9BB7D4',
    primary: '#002060',
    primarySoft: '#0B3A7A',
    accent: '#38BDF8',
    accentSoft: '#082B47',
    sky: '#7DD3FC',
    border: '#1A3A5C',
    danger: '#F97066',
    success: '#4ADE80',
    warning: '#FBBF24',
    onPrimary: '#FFFFFF',
    onAccent: '#001A4D',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/** Fonte de display apenas no web (o nativo usa a fonte do sistema). */
export const WebFont = Platform.select({
  web: 'var(--font-display)',
  default: undefined,
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  seven: 96,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
export const MaxLandingWidth = 1120;
