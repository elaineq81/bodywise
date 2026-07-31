import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.elaineq.bodywise',
  appName: 'Bodywise Remedy',
  webDir: 'dist/client',
  server: {
    url: 'https://bodywise-snowy.vercel.app',
    cleartext: false
  },
  ios: {
    scheme: 'BodywiseRemedy'
  }
};

export default config;

