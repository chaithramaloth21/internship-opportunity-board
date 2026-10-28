# Internship Opportunity Board

A beginner-friendly full-stack web application for students to discover internship opportunities, search and filter listings, save a shortlist, and open the employer's application link. An administrator can publish, edit, and remove opportunities.

> **Important:** The included listings are demo examples, not verified vacancies. Replace them with real opportunities before presenting the board as a live job source.

## 1. Problem statement

Students often find internship opportunities across many different websites and have difficulty keeping relevant roles organized. This application provides one searchable board with field, work-mode, and stipend filters, a personal saved list, and direct application links.

## 2. Features

- Student sign-up and sign-in.
- Password hashing with bcrypt.
- Signed eight-hour JWT sessions.
- Browse internship opportunities without an account.
- Search by title, company, description, or skill.
- Filter by field, work mode, and paid/unpaid stipend.
- Save and unsave opportunities when signed in.
- View details and open application links in a separate tab.
- Admin-only create, edit, and delete controls.
- Supabase PostgreSQL persistence.
- Responsive desktop and mobile layout.
- Backend validation, rate limiting for authentication, Helmet security headers, and role checks.

### Roles

- **Visitor:** Browse, search, filter, view details, and open application links.
- **Student:** Visitor features plus save and remove saved opportunities.
- **Admin:** Student capabilities plus manage internship listings.

## 3. Technology stack

- HTML5, CSS3, Vanilla JavaScript
- Node.js and Express.js
- Supabase PostgreSQL
- npm packages: `@supabase/supabase-js`, `bcryptjs`, `compression`, `cors`, `dotenv`, `express`, `express-rate-limit`, `helmet`, `jsonwebtoken`

No frontend framework or paid API is required.

## 4. Folder structure

```text
internship-opportunity-board/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── supabase.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── internships.js
│   │   └── saved.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── validation.js
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── .gitignore
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

## 5. Prerequisites

Install these on Windows:

1. **Visual Studio Code:** https://code.visualstudio.com/
2. **Node.js LTS (includes npm):** https://nodejs.org/
3. **Git:** https://git-scm.com/downloads
4. **Supabase account:** https://supabase.com/

Open VS Code, then select **Terminal → New Terminal**. Verify Node.js, npm, and Git:

```bash
node --version
npm --version
git --version
```

Each command should print a version. If a command is not recognized, install the relevant tool and restart VS Code.

## 6. Create the Supabase database

1. Sign in at https://supabase.com/ and create a new project.
2. Choose a project name and a strong database password. Keep that password private.
3. Wait for the database to finish provisioning.
4. In the project dashboard, open **SQL Editor → New query**.
5. Open `database/schema.sql` in VS Code, copy the full file, paste it into the SQL Editor, and click **Run**.
6. Open **Table Editor** and verify that `app_users`, `internships`, and `saved_internships` exist.
7. The SQL adds three clearly labelled demo listings. These use `example.com` application links and are not real vacancies.

### Get the server credentials

In the Supabase project dashboard, open **Project Settings → API** (the exact menu labels may change). Copy:
- Project URL
- The server-side secret/service-role key for this project

Use the server-side key only in `backend/.env`. Never place it in `frontend/app.js`, HTML, CSS, a public GitHub repository, or a screenshot. Do not use the public/anon key as the server's privileged key for this implementation.

## 7. Configure environment variables

From the root project directory, create `backend/.env` by copying `backend/.env.example`. Keep `.env` local and private.

Example local configuration:

```dotenv
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVER_SIDE_SECRET_KEY_HERE
JWT_SECRET=PASTE_A_RANDOM_SECRET_HERE
ADMIN_EMAIL=mrec@gmail.com
ADMIN_PASSWORD=REPLACE_WITH_A_PRIVATE_PASSWORD_OF_AT_LEAST_12_CHARACTERS
CORS_ORIGIN=http://localhost:3000
```

Replace the URL and key with the values from your own Supabase project. The admin password shown in your assignment prompt is not embedded in this ZIP; set the password you want to use in your private local `.env`. It must be at least 12 characters. Anyone who can read `.env` or access the administrator password may control the board.

Generate a JWT secret in a terminal:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the output into `JWT_SECRET`. Keep it private. Changing it invalidates existing login tokens.

- `.env.example` documents the required variable names and safe placeholders; commit this file.
- `.env` contains your real local settings; do **not** commit it.
- When the server starts with a configured database, it creates or synchronizes the configured administrator account. Keep the admin email/password consistent with your private `.env`.

## 8. Install dependencies and run the app

Open a terminal in VS Code and move into the backend directory:

```bash
cd internship-opportunity-board/backend
npm install
npm run check
npm run dev
```

- `npm install` downloads the packages declared in `package.json`.
- `npm run check` checks JavaScript syntax.
- `npm run dev` starts the server and restarts it when backend files change.

Expected output resembles:

```text
Administrator account is ready for mrec@gmail.com.
Internship Opportunity Board is running at http://localhost:3000
```

If Supabase is not configured, the app may still start but database-backed pages and login will not work. Fix the `.env` values and restart the server.

Open **http://localhost:3000** in your browser. Do not open `frontend/index.html` directly; the app needs the Express API.

## 9. How to use the application

### Student

1. Browse the sample opportunity cards.
2. Search by job title, company, description, or skill.
3. Use the field, work-mode, and stipend filters.
4. Click **View details** to read the listing.
5. Click **Apply** to open the employer URL in a new tab.
6. Choose **Create account**, register with your name, email, and password, and sign in.
7. Click the heart icon on a listing to save it. Use **Saved** in the navigation to show the shortlist.
8. Click the heart again to remove it from saved opportunities.
9. Use **Sign out** to end the current browser session.

### Administrator

1. Configure `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`.
2. Restart the server, then sign in with those credentials.
3. Click **Admin** to open the listing form.
4. Add a title, company, field, location, work mode, description, and valid HTTP/HTTPS application URL. Other fields are optional.
5. Publish the listing. Use **Edit listing** or **Delete** on cards to manage existing opportunities. Delete requires confirmation.

## 10. Architecture

```text
Browser (HTML/CSS/Vanilla JS)
        │ fetch() / JSON / Bearer JWT
        ▼
Node.js + Express REST API
        │ server-only Supabase client
        ▼
Supabase PostgreSQL
```

The browser never connects directly to Supabase. Express verifies JWTs, reloads the current role from `app_users`, validates request bodies, and checks admin permissions. The Supabase service-role key bypasses Row Level Security, so it must remain private and all authorization must be enforced by the backend. RLS is enabled on all application tables, with no direct client policies.

## 11. REST API reference

All successful API responses are JSON. Authenticated endpoints require `Authorization: Bearer <token>`.

| Method | Path | Purpose | Access |
|---|---|---|---|
| GET | `/api/health` | Server health check | Public |
| POST | `/api/auth/register` | Create student account | Public |
| POST | `/api/auth/login` | Sign in | Public; rate-limited |
| GET | `/api/auth/me` | Get current account | Signed in |
| GET | `/api/internships` | List all listings | Public |
| POST | `/api/internships` | Publish listing | Admin |
| PUT | `/api/internships/:id` | Update listing | Admin |
| DELETE | `/api/internships/:id` | Delete listing | Admin |
| GET | `/api/saved` | List saved internship IDs | Signed in |
| POST | `/api/saved` | Save internship (`{"internshipId":"UUID"}`) | Signed in |
| DELETE | `/api/saved/:id` | Remove saved internship | Signed in |

Create/update listing body:

```json
{
  "title": "Frontend Developer Intern",
  "company": "Example Company",
  "field": "Software Development",
  "location": "Remote",
  "workMode": "Remote",
  "stipend": "₹10000/month",
  "duration": "3 months",
  "skills": ["HTML", "CSS", "JavaScript"],
  "description": "Learn and build with a mentor.",
  "applyUrl": "https://example.com/apply",
  "deadline": "2027-01-31"
}
```

The `deadline` field may be `null` or omitted. Errors use a JSON body such as `{"error":"Please sign in to continue."}` with appropriate HTTP statuses (400 validation, 401 authentication, 403 role, 404 missing route/listing, 409 duplicate account, and 500 server/database failure).

## 12. Database design

- `app_users`: account name, unique email, bcrypt password hash, and role.
- `internships`: opportunity details, skills, application URL, deadline, timestamps, and optional creator.
- `saved_internships`: links students to saved opportunities; its composite primary key prevents duplicate saves.
- Foreign keys and `ON DELETE CASCADE` remove saved rows when an account or listing is deleted.
- Indexes support common listing order and field/work-mode filters.

Passwords are never stored in plaintext. JWTs expire after eight hours. This MVP keeps the token in page memory, not local storage; refreshing the page signs the user out. A production deployment should use a more robust session strategy, HTTPS, monitoring, and stronger operational controls.

## 13. Testing checklist

- [ ] Visit `/api/health`; expect `{"ok":true,...}`.
- [ ] Open the home page; demo cards load from Supabase.
- [ ] Search by company/title; only matching cards remain.
- [ ] Filter by field, mode, and paid/unpaid stipend; results update.
- [ ] Open a card's details; description and metadata display.
- [ ] Click Apply; a new tab opens the configured URL.
- [ ] Register with valid data; expect account creation.
- [ ] Try registering the same email twice; expect a duplicate-account error.
- [ ] Sign in with an incorrect password; expect a generic login error.
- [ ] Save an opportunity while signed in; refresh the saved list during the same session and confirm it remains in the database.
- [ ] Try saving while signed out; sign-in prompt appears.
- [ ] Sign in as a student; admin controls should not appear and admin endpoints should return 403.
- [ ] Sign in as the configured administrator; publish, edit, and delete a test listing.
- [ ] Try an invalid application URL or invalid work mode; the API should reject it.
- [ ] Try an invalid UUID; the API should reject it.
- [ ] Check the layout at desktop and mobile widths.
- [ ] Sign out; protected endpoints should return 401.

The remote Supabase connection and browser flows must be tested with your own project credentials; they have not been verified by this package generator.

## 14. Troubleshooting

**`Cannot find module`**: Run `npm install` from `backend/`.

**`SUPABASE_URL` or key error**: Verify values in `backend/.env`, remove placeholder text, then restart Node.

**Tables do not exist**: Run `database/schema.sql` in the correct Supabase project's SQL Editor.

**Login or register fails with a server error**: Check the terminal logs and Supabase table names/columns. Do not share service keys or passwords in screenshots.

**Admin sign-in fails**: Check `ADMIN_EMAIL`, `ADMIN_PASSWORD` and the minimum 12-character admin password requirement in `backend/.env`; restart the server. Confirm the SQL schema was executed.

**Port already in use**: Set `PORT=3001` in `.env`, set `CORS_ORIGIN=http://localhost:3001`, restart, and open `http://localhost:3001`.

**Blank or stale page**: Open the site through `http://localhost:3000`, refresh the page, and check browser Developer Tools → Console and Network.

**Changes not reflected**: Restart the server for backend changes and refresh the browser for frontend changes.

## 15. GitHub upload

From the root project folder (`internship-opportunity-board`):

1. Create a new repository at https://github.com/new. Do not add a README if you already have this one.
2. Confirm `backend/.env` is excluded and `node_modules/` is excluded.
3. Run:

```bash
git init
git status
git add .
git status
git commit -m "Build Internship Opportunity Board"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with the URL shown by GitHub. Before the commit, check `git status` and make sure no `.env`, passwords, service-role keys, private user data, or database exports are staged. `.env.example` should be included.

If a secret was committed or pushed, deleting the file is not enough: rotate the exposed key/password immediately and remove it from repository history as appropriate.

## 16. Limitations and future improvements

- Demo listings are placeholders and do not verify that a vacancy exists.
- The board does not automatically scrape other job websites or send applications.
- Saved opportunities are user-specific, but tokens are memory-only and a page refresh signs out.
- The MVP does not include email verification, password reset, file uploads, or automated tests.
- Future work could add pagination, employer accounts, verified listings, reporting, and a secure production session flow.
