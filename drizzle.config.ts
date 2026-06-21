import "./src/lib/env";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: ["./src/db/auth-schema.ts", "./src/db/app-schema.ts"],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/sirs",
  },
  strict: true,
  verbose: true,
});
