import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.elaineq.bodywise',
  appName: 'Bodywise Remedy',
  webDir: 'dist/client',
  server: {
    url: 'https://bodywise-calisthenics-coach.paramount-ma-0270.chatgpt.site',
    cleartext: false
  },
  ios: {
    scheme: 'BodywiseRemedy'
  }
};

export default config;
