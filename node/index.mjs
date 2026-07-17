const apiKey = process.env.SOCQ_API_KEY;
const baseUrl = (process.env.SOCQ_BASE_URL || "https://api.socq.ai").replace(/\/+$/, "");
const videoUrl = process.argv[2] || "https://www.youtube.com/watch?v=arj7oStGLkU";

if (!apiKey || apiKey === "your-api-key") {
  throw new Error("Set SOCQ_API_KEY before running this example.");
}

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body?.error?.message || `SocQ request failed with HTTP ${response.status}.`);
  }
  return body;
}

const submitted = await request("/v1/youtube/transcripts", {
  method: "POST",
  body: JSON.stringify({ urls: [videoUrl], language: "en" }),
});
const taskId = submitted?.data?.task_id;
if (!taskId) throw new Error("Submit response did not include data.task_id.");

console.log(`Submitted YouTube transcript task ${taskId}.`);
const deadline = Date.now() + 120000;

while (Date.now() < deadline) {
  const response = await request(`/v1/tasks/${encodeURIComponent(taskId)}?limit=50`);
  const task = response?.data;

  if (task?.status === "succeeded") {
    console.log(JSON.stringify(task.results?.items || [], null, 2));
    process.exit(0);
  }
  if (task?.status === "failed") {
    throw new Error(task.error_message || `SocQ task ${taskId} failed.`);
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));
}

throw new Error(`Timed out waiting for SocQ task ${taskId}.`);
