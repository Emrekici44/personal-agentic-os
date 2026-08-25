# Google Tasks connector

Agentic OS implements a dedicated, bounded Google Tasks connector using the official Tasks REST API. It is separate from local Agentic OS tasks: no silent bidirectional synchronization exists.

## Capabilities

- Read: list task lists, list a bounded selection of tasks, get one task.
- Create: exact task-list, title, optional bounded notes/due/status payload.
- Update/complete/reopen: exact current ETag plus exact after-state; remote drift blocks execution.
- Delete: exactly one task, destructive action-time approval, single use, read-back absence check and no automatic retry after an unknown outcome.

The connector never accepts SQL, arbitrary URLs, list-wide mutation or bulk deletion. Private notes are excluded from Audit and receipt evidence. Automated tests use an injected fake transport and never contact Google.

## OAuth boundary

The existing Calendar authorization is not widened automatically. Real Google Tasks access requires explicit user consent for `https://www.googleapis.com/auth/tasks` (or `tasks.readonly` for a deliberately read-only setup). Until then, Integration Health reports `scope_missing`; it must not display zero tasks or a healthy write capability.

Official references verified for this implementation:

- Google Tasks REST reference: https://developers.google.com/workspace/tasks/reference/rest
- Google OAuth scope inventory: https://developers.google.com/identity/protocols/oauth2/scopes

No real task was created, changed or deleted as part of implementation verification.
