# YouTube Transcripts API examples for SocQ

[![YouTube Transcripts API](https://img.shields.io/badge/API-YouTube%20Transcripts%20API-F64C31)](https://socq.ai/apis/youtube/transcripts?utm_source=github&utm_medium=repository&utm_campaign=youtube-transcript-api)
[![API documentation](https://img.shields.io/badge/Docs-docs.socq.ai-111827)](https://docs.socq.ai/api-manual/youtube/transcripts)
[![License: MIT](https://img.shields.io/badge/License-MIT-2563EB)](LICENSE)
[![Check examples](https://github.com/SocQAPI/youtube-transcript-api/actions/workflows/check.yml/badge.svg)](https://github.com/SocQAPI/youtube-transcript-api/actions/workflows/check.yml)

Retrieve available plain-text transcripts for public YouTube video URLs with the actual language, available languages, caption source, channel context, and duration.

[Try YouTube Transcripts API](https://socq.ai/apis/youtube/transcripts?utm_source=github&utm_medium=repository&utm_campaign=youtube-transcript-api)
· [Get an API key](https://socq.ai/dashboard/api-key?utm_source=github&utm_medium=repository&utm_campaign=youtube-transcript-api)
· [Documentation](https://docs.socq.ai/api-manual/youtube/transcripts)
· [All SocQ examples](https://github.com/SocQAPI/socq-examples)

## Use cases

- **Video summarization:** Use available transcript text to create summaries, research notes, or content briefs for long videos.
- **Searchable video archives:** Index transcript text with video IDs, titles, channel information, and language metadata.
- **Topic and information extraction:** Identify topics, entities, claims, and keywords across a selected collection of public videos.
- **Translation and localization:** Use the selected and available language fields to route transcript text into translation workflows.

## API behavior

- The endpoint returns at most one plain-text transcript record per public video URL.
- `language` is a preferred BCP-47 language, not a guarantee; always use the result's `language` field as the actual language.
- Videos without an available public transcript do not produce a result, so result count can be lower than input count.
- Transcript text does not include guaranteed segment timestamps or speaker labels.

All requests use the shared asynchronous flow:

```text
submit -> task_id -> poll task -> read every cursor page -> save results
```

## Quick start

```bash
cp .env.example .env
export SOCQ_API_KEY="your-api-key"
```

Run the complete Node.js workflow:

```bash
cd node
npm start
```

Run the complete Python workflow:

```bash
python3 -m pip install -r python/requirements.txt
python3 python/main.py
```

Both examples load `payload.example.json`, retry transient API responses, wait
for task completion, read every cursor page, and save a searchable plain-text transcript collection with actual-language metadata to
`output/results.json`.

Never expose `SOCQ_API_KEY` in browser code, mobile apps, public repositories,
screenshots, fixtures, or logs.

## Request

```http
POST https://api.socq.ai/v1/youtube/transcripts
Authorization: Bearer <SOCQ_API_KEY>
Content-Type: application/json
```

```json
{
  "urls": [
    "https://www.youtube.com/watch?v=VIDEO_ID",
    "https://www.youtube.com/watch?v=ANOTHER_VIDEO_ID"
  ],
  "language": "en"
}
```

The submit response contains `data.task_id`. Poll the task endpoint until
`data.status` becomes `succeeded` or `failed`, then continue with
`data.results.next_cursor` while `data.results.has_more` is `true`.

## Complete workflow example

The Node.js and Python programs implement the production-shaped happy path:

1. Load and validate configuration.
2. Submit the endpoint-specific payload.
3. Retry rate-pressure and transient server responses with bounded backoff.
4. Poll the asynchronous task with a ten-minute application timeout.
5. Stop cleanly on a failed task and surface the public error message.
6. Read all cursor pages instead of silently returning only the first page.
7. Write a stable JSON artifact containing task metadata and normalized records.

Use the synthetic files in `fixtures/` for tests and documentation. They do
not contain customer, account, or production data.

## Production notes

See [`docs/production-notes.md`](docs/production-notes.md) for validation,
retry, timeout, pagination, deduplication, logging, and endpoint-specific
guidance.

## Responsible use and platform scope

- Use only publicly accessible YouTube channels, videos, Shorts, comments, transcripts, and fields supported by the selected endpoint.
- Do not use the examples to access private videos, restricted content, unavailable transcripts, or authentication controls.
- SocQ is not an official API of the represented social platform and is not affiliated with or endorsed by that platform.
- Before production use, assess the laws, platform terms, privacy obligations, and retention requirements that apply to your organization and use case.
- Collect only the fields needed for a defined purpose, restrict access, set retention periods, and support correction or deletion workflows where required.
- Platform names and trademarks belong to their respective owners.

This section describes the public-data boundary; it is not legal advice or a
guarantee that every use case is permitted in every jurisdiction.

## Repository contents

| Path | Purpose |
| --- | --- |
| [`curl/request.md`](curl/request.md) | Copy-paste submit, poll, and pagination requests |
| [`node/index.mjs`](node/index.mjs) | Complete Node.js workflow |
| [`python/main.py`](python/main.py) | Complete Python workflow |
| [`payload.example.json`](payload.example.json) | Safe endpoint-specific request body |
| [`fixtures/`](fixtures) | Synthetic submit and task response shapes |
| [`docs/production-notes.md`](docs/production-notes.md) | Production integration guidance |
