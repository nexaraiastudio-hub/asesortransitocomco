import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.54550d301cbc40c392c67c59f0b23403",
  appName: "Asesor Tránsito CO",
  webDir: "dist",
  server: {
    // Hot-reload desde sandbox de Lovable durante desarrollo.
    // Elimina estas dos líneas antes de hacer el build de producción.
    url: "https://54550d30-1cbc-40c3-92c6-7c59f0b23403.lovableproject.com?forceHideBadge=true",
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
  // iOS permissions are configured in Info.plist after `npx cap add ios`
  // Android permissions are configured in AndroidManifest.xml after `npx cap add android`
  // Required permissions:
  //   - NSMicrophoneUsageDescription (iOS) / RECORD_AUDIO (Android)
  //   - NSCameraUsageDescription (iOS) / CAMERA (Android)
  //   - NSPhotoLibraryUsageDescription (iOS) / READ_EXTERNAL_STORAGE (Android)
};

export default config;
