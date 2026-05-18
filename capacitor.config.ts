import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.metromates.app',
  appName: 'MetroMates',
  webDir: 'out',
  server: {
    url: 'https://your-app.vercel.app',
    androidScheme: 'https'
  }
};

export default config;
