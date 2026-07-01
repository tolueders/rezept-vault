#!/usr/bin/env node
/**
 * Startet next dev mit sauberem .next-Cache.
 * Verhindert 500-Fehler durch parallele build/dev-Läufe.
 */
import { spawn, execSync } from "child_process";
import { rmSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

try {
  execSync("pkill -f 'next dev' 2>/dev/null || true", { stdio: "ignore" });
} catch {
  // ignore
}

rmSync(resolve(root, ".next"), { recursive: true, force: true });
console.log("🧹 .next Cache geleert – starte Dev-Server…\n");

const child = spawn("npx", ["next", "dev"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
