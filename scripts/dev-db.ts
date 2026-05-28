/**
 * Starts an embedded PostgreSQL for local development.
 * No Docker, no system install — the binary ships with the npm package.
 *
 * Data persists in .pgdata/. On every run we apply pending migrations
 * and seed the initial user if needed.
 *
 * Usage:
 *   npm run db:dev:up    # foreground (Ctrl+C to stop)
 *   npm run db:dev:stop  # explicit stop (also unlocks .pgdata)
 */
import EmbeddedPostgres from "embedded-postgres";
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

// Load .env so INITIAL_USER_* are visible to the seed step
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const [, key, rawValue] = m;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^"(.*)"$/, "$1");
  }
}

const DATA_DIR = path.resolve(process.cwd(), ".pgdata");
const PORT = 5432;
const USER = "psi";
const PASSWORD = "psi";
const DB = "clinica_ia";

async function main() {
  const fresh = !fs.existsSync(DATA_DIR);

  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
  });

  if (fresh) {
    console.log("[db] initialising fresh cluster in .pgdata/");
    await pg.initialise();
  }

  console.log(`[db] starting on :${PORT}`);
  await pg.start();

  if (fresh) {
    console.log(`[db] creating database '${DB}'`);
    await pg.createDatabase(DB);
  }

  const DATABASE_URL = `postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DB}`;

  // Resolve binary entry points to avoid Windows .cmd quoting issues
  // and stay shell-free (no injection surface).
  const prismaBin = require.resolve("prisma/build/index.js");
  // tsx doesn't expose dist/cli.mjs in its exports map; use raw path
  const tsxBin = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
  const envForDb = { ...process.env, DATABASE_URL };

  console.log("[db] applying migrations");
  execFileSync(process.execPath, [prismaBin, "migrate", "deploy"], {
    stdio: "inherit",
    env: envForDb,
  });

  // Seed initial user (idempotent)
  if (process.env.INITIAL_USER_EMAIL && process.env.INITIAL_USER_PASSWORD) {
    console.log("[db] seeding initial user (if not exists)");
    execFileSync(process.execPath, [tsxBin, "prisma/seed.ts"], {
      stdio: "inherit",
      env: envForDb,
    });
  } else {
    console.log(
      "[db] skipping seed (set INITIAL_USER_EMAIL and INITIAL_USER_PASSWORD in .env)",
    );
  }

  console.log(`\n[db] ready at ${DATABASE_URL}`);
  console.log("[db] press Ctrl+C to stop\n");

  // Keep process alive
  process.on("SIGINT", async () => {
    console.log("\n[db] stopping...");
    await pg.stop();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await pg.stop();
    process.exit(0);
  });

  // Stay alive
  await new Promise(() => {});
}

main().catch((err) => {
  console.error("[db] error:", err);
  process.exit(1);
});
