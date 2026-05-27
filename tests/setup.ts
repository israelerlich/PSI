import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Load .env so DATABASE_URL_TEST is available in integration tests
try {
  // dotenv is not a direct dep; Next normally loads .env automatically but
  // Vitest doesn't. We try-require so unit-only runs still work without dotenv.
  const dotenvPath = ".env";
  const fs = require("node:fs");
  if (fs.existsSync(dotenvPath)) {
    const content = fs.readFileSync(dotenvPath, "utf-8") as string;
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      const [, key, rawValue] = m;
      if (process.env[key] !== undefined) continue;
      const value = rawValue.replace(/^"(.*)"$/, "$1");
      process.env[key] = value;
    }
  }
} catch {
  // No .env or no permission — fine for unit tests.
}

afterEach(() => {
  cleanup();
});
