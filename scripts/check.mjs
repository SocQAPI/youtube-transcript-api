import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const metadata = JSON.parse(readFileSync(join(root, ".socq-example.json"), "utf8"));
const payload = JSON.parse(readFileSync(join(root, "payload.example.json"), "utf8"));

if (
  metadata.schemaVersion !== 1 ||
  metadata.templateVersion !== "2.0.0" ||
  metadata.endpointId !== "youtube-transcripts" ||
  metadata.method !== "POST" ||
  metadata.path !== "/v1/youtube/transcripts"
) {
  throw new Error("Repository metadata is invalid.");
}
if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
  throw new Error("payload.example.json must contain a JSON object.");
}

const requiredFiles = [
  "README.md",
  "docs/production-notes.md",
  "curl/request.md",
  "node/index.mjs",
  "python/main.py",
  "fixtures/submit-response.json",
  "fixtures/task-response.json",
];
for (const path of requiredFiles) statSync(join(root, path));

const nodeCheck = spawnSync(process.execPath, ["--check", join(root, "node/index.mjs")], {
  stdio: "inherit",
});
if (nodeCheck.status !== 0) throw new Error("Node syntax check failed.");

const pythonSource = readFileSync(join(root, "python/main.py"), "utf8");
const pythonCheck = spawnSync(
  "python3",
  ["-c", "import ast,sys; ast.parse(sys.stdin.read())"],
  { input: pythonSource, encoding: "utf8", stdio: ["pipe", "inherit", "inherit"] },
);
if (pythonCheck.status !== 0) throw new Error("Python syntax check failed.");

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    if (name === ".git" || name === "node_modules" || name === "output") return [];
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const checks = [
  { pattern: /-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----/, message: "private key" },
  { pattern: /\b(?:AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/, message: "credential" },
  { pattern: /Authorization:\s*Bearer\s+(?!\$SOCQ_API_KEY|<SOCQ_API_KEY>)[A-Za-z0-9._~+/-]{20,}/, message: "bearer credential" },
  { pattern: /SOCQ_API_KEY\s*=\s*(?!["']?your-api-key["']?(?:\s|$))["']?[^"'\s]+/, message: "API key assignment" },
  { pattern: /\/Users\/[A-Za-z0-9._-]+\//, message: "local user path" },
];

for (const path of walk(root)) {
  if (/\.(png|jpe?g|webp)$/i.test(path)) continue;
  const contents = readFileSync(path, "utf8");
  for (const check of checks) {
    if (check.pattern.test(contents)) {
      throw new Error(`Possible ${check.message} in ${relative(root, path)}.`);
    }
  }
}

console.log("YouTube Transcripts API repository structure, syntax, and credential checks passed.");
