import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const metadata = JSON.parse(readFileSync(resolve(root, ".socq-example.json"), "utf8"));
const payload = JSON.parse(readFileSync(resolve(root, "payload.example.json"), "utf8"));

if (metadata.schemaVersion !== 1 || metadata.templateVersion !== "1.0.0") {
  throw new Error("Unsupported .socq-example.json metadata.");
}
if (metadata.method !== "POST" || !metadata.path.startsWith("/v1/")) {
  throw new Error("Template endpoint metadata is invalid.");
}
if (metadata.endpointId !== "youtube-transcripts" || metadata.path !== "/v1/youtube/transcripts") {
  throw new Error("YouTube Transcripts endpoint metadata is invalid.");
}
if (JSON.stringify(metadata).includes("TEMPLATE_")) {
  throw new Error("Template placeholders remain in .socq-example.json.");
}
if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
  throw new Error("payload.example.json must contain a JSON object.");
}

const nodeCheck = spawnSync(process.execPath, ["--check", resolve(root, "node/index.mjs")], {
  stdio: "inherit",
});
if (nodeCheck.status !== 0) throw new Error("Node syntax check failed.");

const pythonSource = readFileSync(resolve(root, "python/main.py"), "utf8");
const pythonCheck = spawnSync(
  "python3",
  ["-c", "import ast,sys; ast.parse(sys.stdin.read())"],
  { input: pythonSource, encoding: "utf8", stdio: ["pipe", "inherit", "inherit"] },
);
if (pythonCheck.status !== 0) throw new Error("Python syntax check failed.");

console.log("YouTube Transcript example structure and syntax are valid.");
