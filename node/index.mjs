import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const apiKey = process.env.SOCQ_API_KEY;
const baseUrl = (process.env.SOCQ_BASE_URL || "https://api.socq.ai").replace(/\/+$/, "");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const payloadPath = resolve(process.argv[2] || resolve(root, "payload.example.json"));
const outputPath = resolve(root, "output", "results.json");

if (!apiKey || apiKey === "your-api-key") {
  throw new Error("Set SOCQ_API_KEY before running this example.");
}

const sleep = (milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds));

async function request(path, init = {}, attempt = 0) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if ((response.status === 429 || response.status >= 500) && attempt < 3) {
    const retryAfter = Number(response.headers.get("retry-after"));
    await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : 1000 * 2 ** attempt);
    return request(path, init, attempt + 1);
  }
  if (!response.ok) {
    const message = body?.error?.message || body?.message || `HTTP ${response.status}`;
    throw new Error(`SocQ request failed: ${message}`);
  }
  return body;
}

const payload = JSON.parse(await readFile(payloadPath, "utf8"));
const submitted = await request("/v1/youtube/transcripts", {
  method: "POST",
  body: JSON.stringify(payload),
});
const taskId = submitted?.data?.task_id;
if (!taskId) throw new Error("Submit response did not include data.task_id.");

console.log(`Submitted YouTube Transcripts API task ${taskId}.`);
const deadline = Date.now() + 10 * 60 * 1000;
let task;

while (Date.now() < deadline) {
  const response = await request(`/v1/tasks/${encodeURIComponent(taskId)}?limit=100`);
  task = response?.data;
  if (task?.status === "succeeded") break;
  if (task?.status === "failed") {
    throw new Error(task.error_message || `SocQ task ${taskId} failed.`);
  }
  await sleep(2000);
}

if (task?.status !== "succeeded") {
  throw new Error(`Timed out waiting for SocQ task ${taskId}.`);
}

const items = [...(task.results?.items || [])];
let cursor = task.results?.next_cursor;
let hasMore = task.results?.has_more === true;

while (hasMore && cursor) {
  const query = new URLSearchParams({ limit: "100", cursor });
  const page = (await request(`/v1/tasks/${encodeURIComponent(taskId)}?${query}`))?.data;
  items.push(...(page?.results?.items || []));
  cursor = page?.results?.next_cursor;
  hasMore = page?.results?.has_more === true;
}

const deduplicatedItems = [];
const seenItems = new Set();
for (const item of items) {
  const key = item?.id ? String(item.id) : JSON.stringify(item);
  if (seenItems.has(key)) continue;
  seenItems.add(key);
  deduplicatedItems.push(item);
}

const output = {
  endpoint: "/v1/youtube/transcripts",
  task_id: taskId,
  status: task.status,
  result_count: deduplicatedItems.length,
  collected_at: new Date().toISOString(),
  items: deduplicatedItems,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Saved ${deduplicatedItems.length} records to ${outputPath}.`);
