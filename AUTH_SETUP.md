# Auth and Gmail API

Email/password auth uses the `users` table. The default admin login is:

- email/login: `zhanerke1900gmail.com` or `zhanerke1900@gmail.com`
- password: `12345678`

For password reset emails, enable Gmail API in Google Cloud and provide these env vars:

```env
ADMIN_EMAIL=zhanerke1900@gmail.com
ADMIN_PASSWORD=12345678
APP_PUBLIC_URL=https://your-domain.example
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
GMAIL_SENDER_EMAIL=your-gmail-account@gmail.com
GMAIL_SENDER_NAME=Field Review
```

The refresh token must be issued for a Google OAuth client with the
`https://www.googleapis.com/auth/gmail.send` scope.
