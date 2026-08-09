import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.elaineq.bodywise',
  appName: 'Bodywise Remedy',
  webDir: 'dist/client',
  ios: {
    scheme: 'App'
  }
};

export default config;

