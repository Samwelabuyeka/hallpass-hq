import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.82577ff40bfe4ee1adf90ca79dc94181',
  appName: 'hallpass-hq',
  webDir: 'dist',
  server: {
    url: 'https://82577ff4-0bfe-4ee1-adf9-0ca79dc94181.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;