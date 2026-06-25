import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mirhal.app',
  appName: 'Mirhal',
  webDir: 'dist',
  server: {
    url: 'https://mirhal.app',
    cleartext: false,
  },

  plugins: {
    CapacitorHttp: {
      enabled: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
