# Website backend: database and admin dashboard

manthanam.in has a private admin dashboard at **https://www.manthanam.in/admin**. Signed-in team
members can:

- see, search and filter registrations, and download them for Excel;
- change a registration's status, mark a parent or guardian as verified, keep notes and resend the
  confirmation email;
- read contact-form messages, reply to them by email from the dashboard (sent from the Zoho Mail
  mailbox, with the reply kept under the message), and mark them replied, archived or spam;
- reply by email to internship applicants from their application page;
- issue internship and job offer letters (Owner only): fill in the person and the offer, and the site
  numbers the letter, builds a PDF and emails it; anyone can check a letter at manthanam.in/verify;
- add and remove admins and choose each person's role (Owner only).

Every change is recorded with who made it and when, and shows in the registration's History and
on the Overview page.

## How it fits together

- **Database:** Supabase (hosted Postgres) in the Mumbai region. Tables: `registrations`,
  `contact_messages`, `message_replies`, `applications`, `application_replies`,
  `offer_letters`, `admin_users`, `audit_log`
  (`supabase/migrations/0001_admin_backend.sql`).
- **Locked down by default:** every table has Row Level Security on and no policies, so Supabase's
  public key can't read or write anything. Only the website's server can, using the secret key, and
  only after checking the signed-in admin's role (`lib/permissions.ts`).
- **Browsers only talk to manthanam.in:**
  - Sign-in runs on our server.
  - The session is kept in httpOnly cookies, which `proxy.ts` refreshes.
- **Registrations** (`/api/register`):
  1. Saved in the database.
  2. Copied to Zoho Sheet, if that's set up.
  3. Confirmation email sent through Zoho Mail.
- **Contact messages** (`/api/contact`):
  1. Saved in the database.
  2. Emailed to the team through Zoho Mail. They go to `CONTACT_NOTIFY_TO`, by default ayush.shukla@manthanam.in.
  3. If neither is set up, the form falls back to Formspree.

### Roles

| Role | Can |
|---|---|
| Owner | Everything, including adding and removing admins |
| Registrations | See and update registrations and contact messages; download registrations |
| Content | Edit the website's content (coming in the content-editor update) |
| Viewer | See registrations and messages, but change nothing |

The last owner can't be removed. Nobody can change their own role.

## One-time setup (about 20 minutes)

### 1. Create the Supabase project

1. Go to **supabase.com** and sign up. Use an account Manthanam controls, not a personal one.
2. Choose **New project** and fill in:
   - **Name:** `manthanam`
   - **Database password:** generate a strong one and save it in a password manager. The website
     doesn't need it.
   - **Region:** **South Asia (Mumbai)**. The Privacy Policy says the data is kept in India.
   - Leave **Data API** switched on.
3. Wait about a minute for the project to start.

### 2. Create the tables

1. Open **SQL Editor** and choose **New query**.
2. Paste the whole of `supabase/migrations/0001_admin_backend.sql`.
3. Click **Run**. It should say "Success. No rows returned".

### 3. Turn off public sign-ups

Go to **Authentication → Sign In / Providers**, switch off **Allow new users to sign up**, and save.
Admins are only ever added from the dashboard's Team page.

### 4. Create the first owner

1. Go to **Authentication → Users → Add user → Create new user**.
2. Enter your email address and a strong password, and tick **Auto Confirm User**.
3. In **SQL Editor**, run this (with your email address):
   ```sql
   insert into public.admin_users (user_id, email, name, role)
   select id, email, 'Ayush Shukla', 'owner' from auth.users where email = 'ayush.shukla@manthanam.in';
   ```

Add everyone else later from the dashboard's **Team** page.

### 5. Connect the website

In Supabase, go to **Project Settings → API Keys**, and copy:

- **Project URL.** It's shown at the top of **Project Settings → Data API**, and looks like
  `https://abcdefgh.supabase.co`.
- **Publishable key:** `sb_publishable_…`
- **Secret key:** `sb_secret_…`. Choose *Create new secret key* if there isn't one.

Add them as environment variables in **AWS Amplify → manthanam → Hosting → Environment variables**:

```
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
SUPABASE_SECRET_KEY=sb_secret_…
```

Optional: `CONTACT_NOTIFY_TO`, the address or addresses (separated by commas) that contact messages
are emailed to.

Then **redeploy**. Amplify only gives these to the build, and `next.config.ts` bakes them into the
server code.

**Treat the secret key like the master key to the database.** It goes only into Amplify and your own
`.env.local`. Never put it in the code, a chat or an email. If it leaks, delete it in Supabase
(API Keys) and create a new one.

### 6. Check

- Sign in at /admin as an owner, then open **https://www.manthanam.in/api/register**. It shows `"database": "connected"`. (For anyone not signed in as an owner it answers 404, so the public can't read the setup.)
- **https://www.manthanam.in/admin** asks you to sign in, and then shows the Overview.

## Day to day

- **Forgotten password:** an owner opens **Team** and chooses **Reset password**. That gives a
  one-time password to pass on privately.
- **Downloads:** Registrations → **Download for Excel**. It downloads the rows currently shown, or all
  of them. Delete downloaded copies when you're done with them.
- **Deleting data:** the Privacy Policy promises to delete:
  - registrations within 12 months after the conference;
  - contact messages within 12 months after the last exchange.

  Do it in Supabase under **Table Editor**, or ask for a delete button in the dashboard.
- **Backups:** the free plan has no downloadable backups. Before deleting anything big, download the
  registrations first.
- **Free plan pause:** a free project that gets no traffic for a week is paused. Registrations keep
  it active, but consider the Pro plan for the weeks around the conference.

## Offer letters

**Offer letters** in the dashboard (Owners). **New offer letter** asks for the person, the position,
the department, the dates and terms, and when they must reply by. **Preview PDF** shows the letter
without sending it. **Send offer letter**:

1. numbers it (MRF/OL/2026/0001, …) and gives it a random verification code;
2. builds the PDF (`lib/letters/pdf.tsx`, fonts in `assets/fonts`, SIL Open Font License);
3. emails it as an attachment through Zoho Mail, from the same mailbox as the other emails.

The person accepts by replying to that email; record their answer on the letter's page. A letter can be
sent again, downloaded, or withdrawn (the public check then says so).

- **Who signs:** Offer letters → **Letter settings**: name, title and, optionally, a signature image.
- **Checking a letter:** the QR code on each letter opens manthanam.in/verify with its code filled in,
  and shows the name, offer, department and dates, never the email address or notes.
- **Starting from an application:** an internship application's page has **Send offer letter**, which
  fills in the form from the application.
- **Wording:** the standard terms are in `lib/letters/pdf.tsx` (`standardTerms`). Have someone qualified
  read them before relying on them; extra terms can be added per letter.
