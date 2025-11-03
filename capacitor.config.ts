import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'mobile-pragasCana',
  webDir: 'www',
  server: {
    url: 'http://192.168.75.1',
    cleartext: true
  }
};

export default config;
