# Owner setup

The only allowed Owner Google account is:

`omorfaruk22571@gmail.com`

## Values to configure

```env
MONGODB_URI=your-mongodb-atlas-connection-string
MONGODB_DB=faruk_study_manager
AUTH_SECRET=your-long-random-secret
AUTH_GOOGLE_ID=your-google-oauth-client-id
AUTH_GOOGLE_SECRET=your-google-oauth-client-secret
OWNER_EMAIL=omorfaruk22571@gmail.com
```

## Access rules
- Only the verified Google account matching `OWNER_EMAIL` can sign in.
- `/manage` checks the server session and redirects non-owners.
- All `/api/owner/*` routes check the owner session again before reading or changing data.
- Visitors can access only `/api/public`, which returns the weekly routine and subject list.
- Daily logs, personal notes and task records are never returned by the public API.

## OAuth callback URLs
Google Cloud OAuth Client → Authorized redirect URIs:
- `http://localhost:3000/api/auth/callback/google`
- `https://YOUR-VERCEL-DOMAIN/api/auth/callback/google` (after deployment)

Never share the MongoDB URI, Google OAuth Client Secret, or `AUTH_SECRET` in public chat, source control or frontend code.
