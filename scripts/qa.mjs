import { config } from "dotenv";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
config({ path: ".env.local", quiet: true });
const baseline = new URL(process.env.DATABASE_URL);
const host = process.env.QA_DATABASE_HOST;
if (
  !host ||
  host === baseline.hostname ||
  !/^ep-[a-z0-9-]+\.[a-z0-9-]+\.aws\.neon\.tech$/.test(host)
)
  throw new Error(
    "Set QA_DATABASE_HOST to the isolated Neon QA endpoint, never production.",
  );
baseline.hostname = host;
process.env.DATABASE_URL = baseline.toString();
process.env.AUTH_URL = "http://localhost:3100";
process.env.AUTH_TRUST_HOST = "true";
const [command, ...args] = process.argv.slice(2);
if (!command) throw new Error("Provide a QA command.");
if (!["node", "npm", "npx"].includes(command))
  throw new Error("QA runner accepts node, npm, or npx commands only.");
const nodeArgs =
  command === "node"
    ? args
    : [
        join(
          dirname(process.execPath),
          "node_modules",
          "npm",
          "bin",
          `${command}-cli.js`,
        ),
        ...args,
      ];
const child = spawn(process.execPath, nodeArgs, {
  env: process.env,
  stdio: "inherit",
});
child.on("exit", (code) => process.exit(code ?? 1));
