import json
import os
import sys
import time
from urllib.parse import quote

import requests


api_key = os.environ.get("SOCQ_API_KEY")
base_url = (os.environ.get("SOCQ_BASE_URL") or "https://api.socq.ai").rstrip("/")
video_url = sys.argv[1] if len(sys.argv) > 1 else "https://www.youtube.com/watch?v=arj7oStGLkU"

if not api_key or api_key == "your-api-key":
    raise ValueError("Set SOCQ_API_KEY before running this example.")

headers = {
    "Authorization": "Bearer {}".format(api_key),
    "Content-Type": "application/json",
}


def request(method, path, **kwargs):
    response = requests.request(
        method,
        "{}{}".format(base_url, path),
        headers=headers,
        timeout=30,
        **kwargs,
    )
    body = response.json()
    if not response.ok:
        error = body.get("error") if isinstance(body, dict) else None
        message = error.get("message") if isinstance(error, dict) else None
        raise RuntimeError(message or "SocQ request failed with HTTP {}.".format(response.status_code))
    return body


submitted = request(
    "POST",
    "/v1/youtube/transcripts",
    json={"urls": [video_url], "language": "en"},
)
task_id = (submitted.get("data") or {}).get("task_id")
if not task_id:
    raise RuntimeError("Submit response did not include data.task_id.")

print("Submitted YouTube transcript task {}.".format(task_id))
deadline = time.time() + 120

while time.time() < deadline:
    response = request(
        "GET",
        "/v1/tasks/{}?limit=50".format(quote(task_id, safe="")),
    )
    task = response.get("data") or {}

    if task.get("status") == "succeeded":
        print(json.dumps((task.get("results") or {}).get("items", []), indent=2))
        break
    if task.get("status") == "failed":
        raise RuntimeError(task.get("error_message") or "SocQ task failed.")

    time.sleep(2)
else:
    raise TimeoutError("Timed out waiting for SocQ task {}.".format(task_id))
