# What only the owner can do (2026-10-20)

Everything that can be built in code is built and live (@83). Each item below is waiting for an account, a permission or
a contract that only the company can provide. Each item says who does it, how long it takes and what Claude does next.

## 0. Tell every employee their Org ID (before the next sign-in)

Since 2026-10-22 every sign-in asks for the **Organisation ID (Org ID)**: one company, one number, separate books.
- **Best Gas = 1001.** Each phone asks for it once at the next unlock, then remembers it.
- The activation message HR sends (copy or WhatsApp) now starts with the Org ID.
- New companies are created in Administration → Organisations (platform) with the setup key; each gets the next
  number (1002, 1003 …) and its own spreadsheet.

## 1. E-mail: daily digest, payslips and scheduled reports (code ready, switched off)

**Who:** your Microsoft 365 administrator, then you, about 30 minutes in all.

1. **Your Microsoft 365 administrator** creates the app in Entra ID (portal.azure.com, then App registrations, then New):
   - Under API permissions, add Microsoft Graph, then Application, then **Mail.Send**, and press **Grant admin consent**.
   - Under Certificates & secrets, add a **client secret** and copy its value.
   - Pick the sending mailbox, for example `hr-noreply@bestgas.sa`.
2. **You** open the Apps Script project, then Project Settings, then Script properties, and add four properties:
   - `M365_TENANT`: the tenant ID.
   - `M365_CLIENT_ID`: the app (client) ID.
   - `M365_CLIENT_SECRET`: the secret value.
   - `M365_SENDER`: the sending mailbox.
3. **Tell Claude a time you can click.** Claude adds the permission `script.external_request` and deploys. From that moment
   **every request fails until you authorise it**, so do step 4 right away.
4. **You** open the Apps Script editor, run the function **`authorize`** once and press **Allow**. This takes about 1 minute.
5. **The administrator** opens Settings, then Pay rules, then **Daily e-mail digest**, and turns it on. They press **Send a
   test to my e-mail** to check that it works. Payslip e-mail (Pay, then Runs, then E-mail payslips) works from the same
   moment.

## 2. File attachments (code ready, switched off)

**Who:** you, at the same click as item 1.

Scans of IDs, contracts and certificates go into a Drive folder that the app creates.
- **Access:** the app gets the narrowest Google permission (`drive.file`): it can see only files it created itself.
- **Who opens them:** files are never shared by link; they open only inside the app. The employee opens their own; HR opens any. Every view is audited.
- **Switching on:** at the time you choose for step 3 of item 1, Claude also adds the `drive.file` permission, so the one Allow covers both. The administrator then turns on Settings, then **Document attachments**.

## 3. WhatsApp notifications (code ready, switched off)

**Needs:** a Meta WhatsApp Business account with a verified business, a sending phone number, and one **approved message
template** whose body has one variable, the number of items waiting. Example (Arabic):
لديك {{1}} بانتظارك في نظام الموارد البشرية.

1. In Meta Business Suite, then WhatsApp Manager, note the **phone number ID**, create a **permanent token** (system user),
   and get the template approved.
2. In the Apps Script project, then Project Settings, then Script properties, add **WA_PHONE_ID**, **WA_TOKEN** and
   **WA_TEMPLATE** (the template name). If the template language is not Arabic, also add **WA_LANG** (for example en).
   Never paste the token in chat.
3. The administrator opens Settings, then Pay rules, turns on **Daily digest by WhatsApp** and presses **Test WhatsApp
   message**. The test goes to the administrator's own mobile number in their file.

Employees get it on the Saudi mobile number in their file (05…). Only the count is sent: no names or details.

## 3a. AI HR assistant, "Ask HR" (code ready, switched off)

**Needs:** an Anthropic API key (console.anthropic.com, then API keys).

1. Add the Script property **ANTHROPIC_API_KEY**.
2. The administrator turns on **AI HR assistant** in Settings, then Pay rules. The page **Requests, then Ask HR** appears for
   everyone.
3. The assistant answers from the published policies and knowledge-base articles and from the asker's own file (job, shift,
   leave balance, open requests). It never sees anyone else, cannot take actions, and cites the policy it used.
4. Each person can ask 20 questions a day. Questions are not stored; the audit log keeps only counts and token use.
   The question and the asker's own record are sent to Anthropic to produce the answer: mention this in your privacy notice
   (PDPL).

## 3b. Sign in with Google or Microsoft (code ready, switched off)

The buttons appear on the password sign-in screen once a client ID is set. An employee is matched by the e-mail in their
file, so make sure every file has the work e-mail. Check-in still needs the phone's passkey or PIN.

- **Google (Workspace):** in Google Cloud Console, create an OAuth client of type *Web application*. Add the authorised
  redirect URI **https://besgasksa.github.io/BG-attendance/** (exactly, with the final slash). Put the client ID in the Script
  property **SSO_GOOGLE_CLIENT_ID**. Optionally add **SSO_GOOGLE_DOMAIN** (for example bestgas.sa) so only company accounts
  work.
- **Microsoft (Entra ID):** register an app (single tenant). Under Authentication, add the platform *Single-page application*
  with the redirect URI **https://besgasksa.github.io/BG-attendance/** and tick **Access tokens (implicit flow)**. The API
  permission **Microsoft Graph, User.Read** is enough. Put the Application (client) ID in **SSO_MS_CLIENT_ID** and the
  Directory (tenant) ID in **SSO_MS_TENANT**.

Each property can also be set for one organisation only by prefixing it with `o<Org ID>:` (for example
`o1002:SSO_MS_CLIENT_ID`).

## 4. Speed (the 2 to 3 second wait on every action)

**Needs:** a Google Cloud project in **me-central2 (Dammam)** with billing on.

The new server (`platform/`) answers in milliseconds and keeps the data in Saudi Arabia (PDPL). For the steps, see
`platform/docs/DEPLOYMENT-KSA.md`. Estimated cost is a small Cloud Run and Cloud SQL setup, typically tens of dollars a
month for this company size.

## 5. iPhone app (one-tap Open Settings, native location)

**Needs:**
- An **Apple Developer Program** membership for the company: 99 USD a year, and Apple asks for the **D-U-N-S number**.
- The bundle id `sa.bestgas.attendance` created in App Store Connect.

The project is ready in `native/`. To build it from Windows with no Mac, connect the Apple account to **Codemagic** and
run `ios-testflight`. See `native/README.md`.

## 6. Android app

**Two options:**
- **Install the developer tools on this PC:** Android Studio and a JDK, about 5 GB. Claude then builds an installable APK
  for staff phones.
- **Use Codemagic** (cloud, no install).

A Google Play account is a one-time 25 USD and is only needed for the Play Store. Staff can also install the APK directly.

## 7. Government and partner integrations

These are contracts, not code. Claude builds each connector once its access exists:
- **Mudad (WPS), GOSI, Qiwa, Muqeem:** apply through each platform's business or integrator programme. The WPS file is
  already produced and checked in Compliance.
- **Tameeni (medical insurance):** through your insurer or broker.
- **Fingerprint and face devices (code ready):** in Administration, then Integrations, create an API key with the scope **Fingerprint / face devices**. The device or the vendor cloud sends punches as POST JSON `{"action":"devicePunch","orgId":"1001","apiKey":"…","events":[{"empNo":"1234","ts":"2026-10-24 07:58:10","deviceId":"ZK-1"}]}` to the web app URL (Riyadh local time; in/out is worked out by order when the device does not say). Ask the vendor (for example ZKTeco BioTime or a cloud API) to forward to that URL, or give Claude the vendor API so it can pull instead.
- **Salary benchmarking data:** a market data provider.
