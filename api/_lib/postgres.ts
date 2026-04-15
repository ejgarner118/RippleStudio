import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing POSTGRES_URL (or DATABASE_URL) environment variable.");
}

export const dbPool = new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 5000,
});

attachDatabasePool(dbPool);
