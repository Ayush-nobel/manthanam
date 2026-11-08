# Conference registrations → Zoho Sheet (and Excel)

Registrations from **manthanam.in/register** are saved as rows in a private Zoho Sheet.
Download it as Excel at any time: **File → Download as → Microsoft Excel (.xlsx)**.

How it flows: the form posts to `/api/register` on our own site → the server checks every field →
it checks the email isn't already registered → it adds one row to the sheet through Zoho Sheet's
API. Visitors' browsers never talk to Zoho, and the Zoho credentials never leave the server.

The steps below assume Manthanam's Zoho account is on the **India data centre** (you sign in at
`zoho.in`). If you sign in at `zoho.com`, `zoho.eu` and so on, use that ending wherever this says `.in`
and set `ZOHO_DC` to match (`com`, `eu`…).

## One-time setup (about 15 minutes)

### 1. Create the sheet

1. In Zoho Sheet (sheet.zoho.in), create a spreadsheet called
   *BRICS India Youth Conference 2026: Registrations*. Share it only with the people who process registrations.
2. Rename the first tab (worksheet) to **Registrations**.
3. Put these column names in **row 1**, one per cell from A1 to X1, spelt exactly like this. The
   website writes into columns by these names, so a typo means that column stays empty.

   ```
   Reference	Submitted (UTC)	Full name	Email	Phone	Date of birth	Under 18	Status	Institution	City	State	Country	Why they want to attend	Heard about it from	Access needs	Guardian name	Guardian relation	Guardian email	Guardian phone	Consent given	Guardian consent	Place terms accepted	Privacy policy version	Registration status
   ```
   (Copy the line above and paste it into A1: the tabs split it into the 24 cells.)
4. Select the whole sheet and set **Format → Text** (so phone numbers keep their `+` and leading zeros).
5. Copy the spreadsheet's **resource ID** from its address bar: in
   `https://sheet.zoho.in/sheet/open/abcd1234efgh5678`, it is `abcd1234efgh5678`.

The last column, **Registration status**, starts as "New" for every row. Use it to track each
person yourselves, for example Confirmed, Paid, Guardian verified or Cancelled.

### 2. Give the website permission to write to it

1. Go to **api-console.zoho.in** → **Add client** → **Self Client** → Create.
2. Copy the **Client ID** and **Client Secret** from the Client Secret tab.
3. On the **Generate Code** tab, enter:
   - Scope: `ZohoSheet.dataAPI.UPDATE,ZohoSheet.dataAPI.READ`
   - Time duration: 10 minutes
   - Description: Manthanam website registrations

   Click **Create** and copy the code. It only works for 10 minutes, so do the next step straight away.
4. In a terminal, swap the code for a **refresh token** (put in your three values):
   ```
   curl -X POST "https://accounts.zoho.in/oauth/v2/token" \
     -d "grant_type=authorization_code" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "code=THE_CODE"
   ```
   The answer includes `"refresh_token": "1000.…"`. Copy it; it doesn't expire unless you revoke it.

The refresh token can read and change **all** of this Zoho account's spreadsheets, so treat it
like a password: it goes only into the hosting settings below, never into the code or a chat.

### 3. Connect the website

Add these environment variables, in `.env.local` for local testing and in the hosting console for the live site:

```
ZOHO_DC=in
ZOHO_CLIENT_ID=…
ZOHO_CLIENT_SECRET=…
ZOHO_REFRESH_TOKEN=…
ZOHO_SHEET_RESOURCE_ID=…
ZOHO_SHEET_WORKSHEET=Registrations
```

They are **server-only** (no `NEXT_PUBLIC_` prefix). `next.config.ts` bakes them into the server
code at build time, because AWS Amplify only gives environment variables to the build, not to the
running site. So after adding or changing any of them, **redeploy** for them to take effect. They
never appear in the JavaScript sent to visitors' browsers.

To check the settings reached the live site, open **https://www.manthanam.in/api/register**. It
shows `"connected": true` and the data centre, or lists the names (never the values) of any
setting that is missing.

### 4. Test

Submit one registration on the live site, check the row appears, then delete the test row.
Submitting again with the same email should say it's already registered.

## Good to know

- **Confirmation emails:** registrants see their reference number on screen, but Zoho Sheet
  doesn't send emails. If you want automatic confirmation emails, they can be added through Zoho
  Mail or a Zoho Flow on new rows.
- **Limits:** Zoho caps API calls per minute for each spreadsheet (exceeding it pauses the API on
  that sheet for 5 minutes). That's ample for a registration form; if it ever happens, people see
  an error and the option to email us.
- **Under-18 rows** ("Under 18: Yes - verify guardian") need a check before you confirm the place:
  contact the guardian on the email/phone given and confirm they are the parent or guardian.
- **Deleting data:** the Privacy Policy promises to delete registrations **within 12 months after
  the conference** (by 20 December 2027). Put a reminder in the calendar, and delete any downloaded
  Excel copies too.
