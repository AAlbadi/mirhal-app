/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const brandOrange = '#ff7119'; // Shiny Orange
const brandDark = '#1c1917'; // Dark stone for contrast
const brandLight = '#fff7ed'; // Light orange tint for backgrounds

export const Colors = {
  light: {
    text: '#1c1917',
    background: '#fff',
    tint: brandOrange,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: brandOrange,
    primary: brandOrange,
    secondary: '#fb923c', // Lighter orange
    dark: brandDark,
    light: brandLight,
    surface: '#ffffff',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: brandOrange,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: brandOrange,
    primary: brandOrange,
    secondary: '#fb923c',
    dark: '#000000',
    light: '#292524',
    surface: '#1c1917',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
