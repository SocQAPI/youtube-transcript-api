# Production notes

- Keep `SOCQ_API_KEY` on the server.
- Accept only valid public YouTube video URLs.
- Validate optional languages as BCP-47 tags before submit.
- Store `data.task_id`.
- Poll with backoff and treat `succeeded` and `failed` as terminal.
- Follow `data.results.next_cursor` until `has_more` is false.
- Keep polling as a fallback when using callbacks.
- Never log credentials, private data, or full production payloads.
- Handle videos without an available transcript as a normal product state.
