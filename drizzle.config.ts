import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for Drizzle commands.");
}
const migrationUrl = new URL(
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
);
if (migrationUrl.hostname.endsWith(".neon.tech"))
  migrationUrl.hostname = migrationUrl.hostname.replace("-pooler.", ".");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: migrationUrl.toString() },
  strict: true,
  verbose: true,
});
