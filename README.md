# Faruk Study Manager

A Next.js + TypeScript personal study management app backed by **MongoDB Atlas**.

## ✨ Feature Highlights

### Public home
- **Live digital and analog clocks** show the device's local time and timezone/location label.
- **Public weekly routine** includes Today, All days, and weekday filters, plus the current/next routine view.
- **Public study overview** shows aggregate hours for Academic, DUET Department, and DUET Non-Department.
- **Public subject list** and study-focus cards are available without owner login.
- **12-hour time display**, black-and-green visual theme, responsive mobile layout, and soft management-page transitions.

### Owner-only Study Management
- **Owner and admin login** supports verified Google sign-in and a separate email/password form, both restricted to the configured owner email. The secure session cookie is persistent for 30 days so the owner can reopen the app without signing in each time, unless the browser clears site data.
- **Weekly and class routine manager** supports adding, editing, and deleting both general schedule items and class/course sessions, with a live current-routine panel.
- **Separate Academic and DUET sections** let the owner manage subjects and study logs; DUET is split into Department and Non-Department.
- **Assignments and exam manager** tracks due dates, priorities, statuses, subjects, and notes.
- **Automatic stopwatch logging:** enter the subject/topic, start studying, then finish the timer to save elapsed minutes and date automatically. Pause and resume are supported; the session survives management-page switches in the same browser.
- **15-minute idle warning** asks whether to keep studying or pause and exclude time since the last activity.
- **Three-day review reminders:** each completed stopwatch session appears for review three days later. Marking it reviewed schedules the next reminder three days after that.
- **Daily goals** can be set separately for Academic, DUET Department, and DUET Non-Department, with today's progress shown against each goal.

### Analytics and data safety
- **Study calendar** lets the owner move between months and select a day to see its study sessions and total time.
- **Historical study graph** supports the last 7 days, 30 days, 1 year, all history, or a custom date range; it groups data by day, week, or month as appropriate.
- **Subject and category insights** compare study time, session counts, and subject totals.
- **Task status chart** summarizes assignment and exam progress.
- **JSON backup and merge restore** cover routines, subjects, study logs, tasks, and daily goals. Restore updates matching record IDs and keeps records that are not in the backup.
- **Excel-compatible CSV export** downloads study logs for spreadsheets.
- **Private study details**—individual logs, notes, tasks, and goals—are not exposed through public APIs; the public page only receives published routine/subjects and aggregate study totals.

### Management pages
| Route | What it contains |
|---|---|
| / | Public home, live clocks, study totals, routine, and subjects |
| /login | Google owner sign-in |
| /manage | Owner dashboard: today’s flow, quick actions, goals, reminders, and backup tools |
| /manage/routine | Weekly routine, class timetable, and current routine view |
| /manage/academic | Academic subjects and study logs |
| /manage/duet | DUET Department and Non-Department subjects and study logs |
| /manage/tasks | Assignments and exams |
| /manage/analytics | Study calendar, history graph, subject/category and task charts |

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
Create **.env.local** in the project root and add the following values:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=faruk_study_manager
AUTH_SECRET=generate-a-long-random-secret
AUTH_GOOGLE_ID=your-google-oauth-client-id
AUTH_GOOGLE_SECRET=your-google-oauth-client-secret
OWNER_EMAIL=omorfaruk22571@gmail.com
OWNER_PASSWORD=generate-a-long-random-admin-password
```

Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

Use a separate random value for `OWNER_PASSWORD`. Keep it only in `.env.local` and your deployment's server-side environment variables. Google sign-in remains available if `OWNER_PASSWORD` is not configured.

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

The first successful owner visit to `/manage` can seed the starter weekly routine when the routine collection is empty. This happens only once, so deleting every routine later keeps the workspace empty until you add a new one. Add your own Academic and DUET subjects from their management pages.

## 5. Deploy to Vercel
1. Push the project to a private GitHub repository (recommended, because project configuration and personal study app details are included).
2. Import the repository into Vercel.
3. Add all seven environment variables from `.env.local` in Vercel Project Settings → Environment Variables.
4. Deploy the project.
5. Add the production OAuth callback URL `https://YOUR-VERCEL-DOMAIN/api/auth/callback/google` to your Google OAuth Client's Authorized redirect URIs.
6. Redeploy after changing environment variables.

## Access control

| Feature / data | Visitor | Owner login (Google / Admin) |
|---|---:|---:|
| Published weekly routine | View | View / Add / Edit / Delete |
| Public subject list | View | View / Add / Edit / Delete |
| Aggregate study-time totals by track | View | View / Manage |
| Individual study logs, notes, and review reminders | No access | Full access |
| Daily goals | No access | View / Configure |
| Assignments and exam tasks | No access | Full access |
| Management APIs | No access | Authorized access |

The owner email is checked by both Auth.js sign-in methods, in the protected `/manage` layout, and again on every owner API request. Data operations run on the server. MongoDB has no client-side connection string.

## Important notes
- This app uses MongoDB for study data. Auth.js uses a signed JWT session; both Google OAuth and Admin Login are restricted to the configured owner account.
- Public visitors cannot read daily study logs, task notes or other owner-only collections through the app's public endpoints.
- The public routine API exposes only the schedule fields (day, time, title, category and subject link); internal routine notes, daily logs, task notes and other personal records are not returned to visitors.
- Back up your MongoDB database periodically.
- No database credentials or OAuth secrets are included in this ZIP. You add them in your own `.env.local` and Vercel settings.
