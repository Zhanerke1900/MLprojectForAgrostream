# Admin Authorization Setup

## Current Configuration

The admin system now uses a **hardcoded admin email whitelist** for robust and reliable authorization.

### Admin Email

Currently, the following email is configured as admin:
- **Email**: `zhanerke1900@gmail.com`
- **Password**: `12345678`

## How Admin Authorization Works

1. **Registration**: When a user registers with an email in the admin list, they automatically get the `admin` role.
2. **Login**: When a user logs in with an admin email, they're granted the `admin` role even if it wasn't previously set.
3. **Admin Panel Access**: The `/admin` route checks if `user.role === "admin"`.

## Adding New Admins

To add a new administrator, edit [server/_core/admin.ts](server/_core/admin.ts):

```typescript
const ADMIN_EMAILS = new Set(["zhanerke1900@gmail.com", "newemail@example.com"]);
```

Then:
1. Deploy your changes
2. The new admin can register or log in with their email
3. They'll automatically receive admin role

## Environment Variables (Legacy)

⚠️ **Note**: The old `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables are no longer required for the admin role system. The `.env` file still contains them, but they're deprecated. You can safely remove them if you migrate to environment-based admin configuration in the future.

## Testing Admin Access

1. Go to `/auth`
2. Use an admin email to log in
3. Navigate to `/admin` or click "Admin" in the navigation menu
4. The admin panel should load without "no access" errors

## Troubleshooting

### "No access" error when trying to access admin panel
- Verify your email is in the `ADMIN_EMAILS` set in `server/_core/admin.ts`
- Clear cookies and try logging in again
- Check browser console for any API errors

### Database connection errors in admin panel
- This is expected if `DATABASE_URL` is not set
- The system uses in-memory storage for local development
- To use a real database, set `DATABASE_URL` in `.env`

