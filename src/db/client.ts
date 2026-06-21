import "@/lib/env";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as appSchema from "@/db/app-schema";
import * as authSchema from "@/db/auth-schema";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/sirs";

export const pool = new Pool({
  connectionString: databaseUrl,
});

export const db = drizzle(pool, {
  schema: {
    ...authSchema,
    ...appSchema,
  },
});
