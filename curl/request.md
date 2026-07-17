# YouTube Transcript API with cURL

```bash
curl -X POST "https://api.socq.ai/v1/youtube/transcripts" \
  -H "Authorization: Bearer $SOCQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://www.youtube.com/watch?v=arj7oStGLkU"],
    "language": "en"
  }'
```

Save `data.task_id`, then poll:

```bash
curl "https://api.socq.ai/v1/tasks/$TASK_ID?limit=50" \
  -H "Authorization: Bearer $SOCQ_API_KEY"
```

When `data.results.has_more` is `true`, request the next page:

```bash
curl "https://api.socq.ai/v1/tasks/$TASK_ID?limit=50&cursor=$NEXT_CURSOR" \
  -H "Authorization: Bearer $SOCQ_API_KEY"
```
