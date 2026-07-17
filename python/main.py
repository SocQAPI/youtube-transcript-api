import json
import os
import sys
import time
from pathlib import Path
from urllib.parse import quote

import requests


API_KEY = os.environ.get("SOCQ_API_KEY")
BASE_URL = (os.environ.get("SOCQ_BASE_URL") or "https://api.socq.ai").rstrip("/")
ROOT = Path(__file__).resolve().parent.parent
PAYLOAD_PATH = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / "payload.example.json"
OUTPUT_PATH = ROOT / "output" / "results.json"

if not API_KEY or API_KEY == "your-api-key":
    raise ValueError("Set SOCQ_API_KEY before running this example.")

HEADERS = {
    "Authorization": "Bearer {}".format(API_KEY),
    "Content-Type": "application/json",
}


def request(method, path, **kwargs):
    for attempt in range(4):
        response = requests.request(
            method,
            "{}{}".format(BASE_URL, path),
            headers=HEADERS,
            timeout=30,
            **kwargs,
        )
        try:
            body = response.json()
        except ValueError:
            body = None

        if response.status_code == 429 or response.status_code >= 500:
            if attempt < 3:
                retry_after = response.headers.get("Retry-After")
                try:
                    delay = float(retry_after) if retry_after else 2 ** attempt
                except ValueError:
                    delay = 2 ** attempt
                time.sleep(delay)
                continue
        if not response.ok:
            message = "HTTP {}".format(response.status_code)
            if isinstance(body, dict):
                error = body.get("error")
                if isinstance(error, dict):
                    message = error.get("message") or message
                else:
                    message = body.get("message") or message
            raise RuntimeError("SocQ request failed: {}".format(message))
        if not isinstance(body, dict):
            raise RuntimeError("SocQ returned an unexpected response.")
        return body

    raise RuntimeError("SocQ request failed after retries.")


with PAYLOAD_PATH.open("r", encoding="utf-8") as payload_file:
    payload = json.load(payload_file)

submitted = request("POST", "/v1/youtube/transcripts", json=payload)
task_id = (submitted.get("data") or {}).get("task_id")
if not task_id:
    raise RuntimeError("Submit response did not include data.task_id.")

print("Submitted YouTube Transcripts API task {}.".format(task_id))
deadline = time.time() + 10 * 60
task = None

while time.time() < deadline:
    response = request("GET", "/v1/tasks/{}?limit=100".format(quote(task_id, safe="")))
    task = response.get("data") or {}
    if task.get("status") == "succeeded":
        break
    if task.get("status") == "failed":
        raise RuntimeError(task.get("error_message") or "SocQ task failed.")
    time.sleep(2)

if not task or task.get("status") != "succeeded":
    raise TimeoutError("Timed out waiting for SocQ task {}.".format(task_id))

results = task.get("results") or {}
items = list(results.get("items") or [])
cursor = results.get("next_cursor")
has_more = results.get("has_more") is True

while has_more and cursor:
    page = request(
        "GET",
        "/v1/tasks/{}?limit=100&cursor={}".format(
            quote(task_id, safe=""),
            quote(str(cursor), safe=""),
        ),
    ).get("data") or {}
    page_results = page.get("results") or {}
    items.extend(page_results.get("items") or [])
    cursor = page_results.get("next_cursor")
    has_more = page_results.get("has_more") is True

deduplicated_items = []
seen_items = set()
for item in items:
    key = str(item.get("id")) if isinstance(item, dict) and item.get("id") else json.dumps(
        item,
        sort_keys=True,
    )
    if key in seen_items:
        continue
    seen_items.add(key)
    deduplicated_items.append(item)

output = {
    "endpoint": "/v1/youtube/transcripts",
    "task_id": task_id,
    "status": task.get("status"),
    "result_count": len(deduplicated_items),
    "collected_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "items": deduplicated_items,
}

OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
OUTPUT_PATH.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
print("Saved {} records to {}.".format(len(deduplicated_items), OUTPUT_PATH))
