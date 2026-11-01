import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.myogbia.app',
  appName: 'My Ogbia',
  webDir: 'www',
  plugins: {
    CapacitorUpdater: {
      autoUpdate: 'atBackground',
      updateUrl: 'https://api.parcellsend.com/api/app-updates/check',
      statsUrl: '',
      periodCheckDelay: 600,
      resetWhenUpdate: true
    }
  }
};
export default config;
