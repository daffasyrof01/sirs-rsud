import { loadEnvConfig } from "@next/env";

const globalForEnv = globalThis as typeof globalThis & {
  __sirsEnvLoaded?: boolean;
};

if (!globalForEnv.__sirsEnvLoaded) {
  loadEnvConfig(process.cwd());
  globalForEnv.__sirsEnvLoaded = true;
}
