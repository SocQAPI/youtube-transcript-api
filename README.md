# YouTube Transcript API examples for SocQ

[![YouTube Transcript API](https://img.shields.io/badge/API-YouTube%20Transcript-FF0000)](https://socq.ai/apis/youtube/transcripts?utm_source=github&utm_medium=repository&utm_campaign=youtube-transcript-api)
[![API documentation](https://img.shields.io/badge/Docs-docs.socq.ai-111827)](https://docs.socq.ai/api-manual/youtube/transcripts)
[![License: MIT](https://img.shields.io/badge/License-MIT-2563EB)](LICENSE)
[![Check examples](https://github.com/SocQAPI/youtube-transcript-api/actions/workflows/check.yml/badge.svg)](https://github.com/SocQAPI/youtube-transcript-api/actions/workflows/check.yml)

Backend-safe examples for retrieving available public YouTube video transcripts
with SocQ. Submit one or more public video URLs, store the returned `task_id`,
and read normalized transcript records after the asynchronous task succeeds.

[Try YouTube Transcript API](https://socq.ai/apis/youtube/transcripts?utm_source=github&utm_medium=repository&utm_campaign=youtube-transcript-api)
· [Get an API key](https://socq.ai/dashboard/api-key?utm_source=github&utm_medium=repository&utm_campaign=youtube-transcript-api)
· [Documentation](https://docs.socq.ai/api-manual/youtube/transcripts)
· [Main examples](https://github.com/SocQAPI/socq-examples)

## What this repository covers

- `POST /v1/youtube/transcripts`
- available public transcripts by YouTube video URL
- optional preferred BCP-47 language
- cURL, Node.js, and Python examples
- asynchronous task polling
- cursor-paginated result handling

## Quick start

```bash
cp .env.example .env
export SOCQ_API_KEY="your-api-key"
```

Run Node.js:

```bash
cd node
npm start -- "https://www.youtube.com/watch?v=arj7oStGLkU"
```

Run Python:

```bash
python3 -m pip install -r python/requirements.txt
python3 python/main.py "https://www.youtube.com/watch?v=arj7oStGLkU"
```

Never expose `SOCQ_API_KEY` in browser code, mobile apps, screenshots, public
repositories, or logs.

## Request

```http
POST https://api.socq.ai/v1/youtube/transcripts
Authorization: Bearer <SOCQ_API_KEY>
Content-Type: application/json
```

```json
{
  "urls": ["https://www.youtube.com/watch?v=arj7oStGLkU"],
  "language": "en"
}
```

The submit response contains `data.task_id`. Poll:

```http
GET https://api.socq.ai/v1/tasks/{task_id}?limit=50
Authorization: Bearer <SOCQ_API_KEY>
```

Continue with `data.results.next_cursor` while
`data.results.has_more` is `true`.

## Files

| Path | Purpose |
| --- | --- |
| [`curl/request.md`](curl/request.md) | Copy-paste submit and poll requests |
| [`node/index.mjs`](node/index.mjs) | Native Node.js submit and poll flow |
| [`python/main.py`](python/main.py) | Python submit and poll flow |
| [`payload.example.json`](payload.example.json) | Safe request body |
| [`fixtures/`](fixtures) | Synthetic response shapes |
| [`docs/production-notes.md`](docs/production-notes.md) | Production checklist |

## Public-data scope

SocQ is built for public data workflows. It is not an official YouTube API and
does not provide access to private videos or transcripts that are unavailable
from the public source.

The MIT license covers this example code only. It does not grant rights to the
SocQ hosted service, YouTube data or trademarks, or private SocQ source code.
