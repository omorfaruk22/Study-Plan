# Faruk Study Manager

A Next.js + TypeScript personal study management app backed by **MongoDB Atlas**.

## Features
- Public visitor page: can view the published weekly routine and subject list only.
- Owner login: Google OAuth restricted to `omorfaruk22571@gmail.com`.
- Owner workspace: add, edit and delete routine items, subjects, daily study logs, assignments and exams.
- Private data: daily logs, personal notes and tasks are not exposed through public APIs.
- Server-side authorization: every write API checks the Auth.js session and exact owner email. The MongoDB URI and credentials stay on the server.
- Starter subjects and weekly schedule are inserted automatically the first time the owner opens the management panel.

## Technology
- Next.js App Router + TypeScript
- MongoDB Atlas + official MongoDB Node.js driver
- Auth.js / NextAuth v5 beta + Google OAuth
- Tailwind CSS v4
- Vercel deployment

## 1. Create MongoDB Atlas database
1. Create a free MongoDB Atlas cluster.
2. Create a Database User with a strong password.
3. In Network Access, allow your development IP. For Vercel production, configure Atlas network access according to your deployment needs. Do not leave the database open to the entire internet unless you understand the risk.
4. Click **Connect → Drivers → Node.js** and copy the connection string.
5. Replace the username, password and cluster placeholders. URL-encode special characters in the password (for example `@` becomes `%40`).

## 2. Configure Google OAuth
1. Open Google Cloud Console and create/select a project.
2. Configure the OAuth consent screen.
3. Create an OAuth Client ID with application type **Web application**.
4. Add this Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`.
5. After deploying, also add `https://YOUR-VERCEL-DOMAIN/api/auth/callback/google`.
6. Copy the Google Client ID and Client Secret. Auth.js uses these as `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.

Google OAuth consent/testing settings must allow the owner Google account to sign in. The app itself additionally rejects any account other than the verified owner email configured below.

## 3. Configure environment variables
Copy `.env.example` to `.env.local` and fill in:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=faruk_study_manager
AUTH_SECRET=generate-a-long-random-secret
AUTH_GOOGLE_ID=your-google-oauth-client-id
AUTH_GOOGLE_SECRET=your-google-oauth-client-secret
OWNER_EMAIL=omorfaruk22571@gmail.com
```

Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

All of these are server-side variables. Do not prefix them with `NEXT_PUBLIC_`. Never expose the MongoDB connection string or Google Client Secret in browser code, GitHub, or Vercel client bundles.

## 4. Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

- `/` is the public read-only routine page.
- `/login` starts Google Owner Login.
- `/manage` is protected and redirects non-owners to `/login`.

The first successful owner visit to `/manage` seeds the initial college subjects, DUET subjects, Web Development subjects and weekly routine if those collections are empty.

## 5. Deploy to Vercel
1. Push the project to a private GitHub repository (recommended, because project configuration and personal study app details are included).
2. Import the repository into Vercel.
3. Add all five environment variables from `.env.local` in Vercel Project Settings → Environment Variables.
4. Deploy the project.
5. Add the production OAuth callback URL `https://YOUR-VERCEL-DOMAIN/api/auth/callback/google` to your Google OAuth Client's Authorized redirect URIs.
6. Redeploy after changing environment variables.

## Access control

| Feature / data | Visitor | Owner Google account |
|---|---:|---:|
| Published weekly routine | View | View / Add / Edit / Delete |
| Public subject list | View | View / Add / Edit / Delete |
| Daily study logs and notes | No access | Full access |
| Assignments and exam tasks | No access | Full access |
| Management APIs | No access | Authorized access |

The owner email is checked in the Auth.js Google sign-in callback, in the protected `/manage` layout, and again on every owner API request. Data operations run on the server. MongoDB has no client-side connection string.

## Important notes
- This app uses MongoDB for study data. Auth.js uses a signed JWT session; Google OAuth user access is restricted to the configured owner account.
- Public visitors cannot read daily study logs, task notes or other owner-only collections through the app's public endpoints.
- The public routine API exposes only the schedule fields (day, time, title, category and subject link); internal routine notes, daily logs, task notes and other personal records are not returned to visitors.
- Back up your MongoDB database periodically.
- No database credentials or OAuth secrets are included in this ZIP. You add them in your own `.env.local` and Vercel settings.
