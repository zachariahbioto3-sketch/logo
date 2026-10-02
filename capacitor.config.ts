import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nicole.app',
  appName: 'Nicole',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;

