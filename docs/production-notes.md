# Production notes

## Shared integration controls

- Keep `SOCQ_API_KEY` on the server and outside browser, mobile, fixture, screenshot, and log output.
- Validate and normalize every input before submit; reject empty arrays, unsupported URL shapes, and invalid enum values.
- Persist `data.task_id` before polling so interrupted workers can resume.
- Use bounded retries with backoff for `429` and transient `5xx` responses.
- Treat `succeeded` and `failed` as terminal states and enforce an application-level timeout.
- Read every result page by following `results.next_cursor` until `results.has_more` is false.
- Deduplicate stored records by stable record ID when a workflow can be retried.
- Log task IDs, status transitions, durations, and record counts; never log credentials or full sensitive payloads.
- Keep callback handling idempotent and retain polling as a fallback when callbacks are used.
- Store `collected_at` with records whose public fields or metrics can change over time.

## YouTube Transcripts API considerations

- The endpoint returns at most one plain-text transcript record per public video URL.
- `language` is a preferred BCP-47 language, not a guarantee; always use the result's `language` field as the actual language.
- Videos without an available public transcript do not produce a result, so result count can be lower than input count.
- Transcript text does not include guaranteed segment timestamps or speaker labels.

## Data handling

- Treat public records as changeable snapshots rather than permanent truth.
- Keep raw payloads and exported result files in access-controlled storage.
- Define a retention period and remove data that is no longer needed.
- Avoid using missing optional fields as evidence that a value is zero or false.
- Review platform terms, privacy requirements, and applicable law before launch.
