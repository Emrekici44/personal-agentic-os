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
