import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "id.rsud.sirs",
  appName: "SIPEDRAS",
  webDir: "public",
  server: {
    url: "https://sirs-rsud.vercel.app",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
