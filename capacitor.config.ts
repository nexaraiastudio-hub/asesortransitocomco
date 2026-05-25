import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.asesortransito.app",
  appName: "Asesor Tránstio CO",
  webDir: "dist",
  server: {
    // Hot-reload desactivado para producción local
    // url: "https://54550d30-1cbc-40c3-92c6-7c59f0b23403.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#002147",
      showSpinner: false,
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
