import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.54550d301cbc40c392c67c59f0b23403",
  appName: "asesortransitocomco",
  webDir: "dist",
  server: {
    // Hot-reload desde sandbox de Lovable durante desarrollo.
    // Elimina estas dos líneas antes de hacer el build de producción.
    url: "https://54550d30-1cbc-40c3-92c6-7c59f0b23403.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  plugins: {
    // Supabase usa localStorage; en Capacitor está disponible vía WebView
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
