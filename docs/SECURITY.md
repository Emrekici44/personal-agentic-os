# Security notes

- Never commit `.env*`, OAuth secrets, refresh tokens, financial credentials, or health exports.
- Google starts with `calendar.readonly`; request event write scope only when the user enables it.
- Consequential writes require a visible preview, explicit approval, an expiring single-use approval token, and an audit entry.
- Obsidian integration begins with an inventory and read-only preview. Existing vault files are never modified without separate confirmation.
- Finance connectors are read-only; transactions are outside system scope.
- Health outputs are organizational and not medical advice.
- Private hosting must require authentication, HTTPS, secure cookies, CSRF protection, rate limiting, encrypted secrets, and tested account deletion/export.
- Run dependency audits before deployment; do not apply breaking automatic fixes without review.
