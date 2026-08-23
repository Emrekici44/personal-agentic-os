# Security notes

- Never commit `.env*`, OAuth secrets, refresh tokens, financial credentials, or health exports.
- Google starts with `calendar.readonly`; request event write scope only when the user enables it.
- Tokens are encrypted in HTTP-only, SameSite cookies and never returned to client code. OAuth state is random, encrypted, short-lived, and verified.
- Reads are limited to eight days, twelve selected calendars, and 100 events per calendar.
- The labeled mock adapter always reports `writesPerformed: false`, including after approval.
- Consequential writes require a visible preview, explicit approval, an expiring single-use approval token, and an audit entry.
- Obsidian integration begins with an inventory and read-only preview. Existing vault files are never modified without separate confirmation.
- Finance connectors are read-only; transactions are outside system scope.
- Health outputs are organizational and not medical advice.
- Private hosting must require authentication, HTTPS, secure cookies, CSRF protection, rate limiting, encrypted secrets, and tested account deletion/export.
- Run dependency audits before deployment; do not apply breaking automatic fixes without review.
- Local/free operation is the default. Potentially billable providers must disclose cost class and obtain explicit activation approval.
- OpenAI keys are server-only. ChatGPT Pro is never treated as API authorization. API requests are blocked locally until positive daily/monthly ceilings and kill-switch state permit them.
- `.gitignore` excludes secrets, environment files, databases, backups, caches, screenshots, and local personal state. The Emre vault lives outside the repository and must never be pushed.
- Relationship, faith, financial, and health demo data is labeled; real sensitive data requires deliberate import/connection boundaries.
