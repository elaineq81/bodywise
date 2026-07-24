import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.elaineq.bodywise',
  appName: 'Bodywise',
  webDir: 'dist/client',
  bundledWebRuntime: false,
  server: {
    url: 'https://bodywise-calisthenics-coach.paramount-ma-0270.chatgpt.site',
    cleartext: false
  },
  ios: {
    scheme: 'Bodywise'
  }
};

export default config;
