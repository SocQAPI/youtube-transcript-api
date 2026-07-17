# YouTube Transcripts API with cURL

Submit the safe example payload from the repository root:

```bash
curl -X POST "https://api.socq.ai/v1/youtube/transcripts" \
  -H "Authorization: Bearer $SOCQ_API_KEY" \
  -H "Content-Type: application/json" \
  --data @payload.example.json
```

Save `data.task_id`, then poll:

```bash
curl "https://api.socq.ai/v1/tasks/$TASK_ID?limit=100" \
  -H "Authorization: Bearer $SOCQ_API_KEY"
```

When `data.results.has_more` is `true`, request the next page:

```bash
curl "https://api.socq.ai/v1/tasks/$TASK_ID?limit=100&cursor=$NEXT_CURSOR" \
  -H "Authorization: Bearer $SOCQ_API_KEY"
```

The Node.js and Python examples automate polling, retries, pagination, and
writing the final JSON artifact.
