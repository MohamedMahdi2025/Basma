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

## 3. WhatsApp notifications

**Needs:** a Meta WhatsApp Business account, with a verified business, a phone number for sending and approved message
templates.

The WhatsApp Cloud API is free to start; Meta charges per conversation. When it is ready, give Claude the phone number ID.
Put the token itself in Script properties, never in chat.

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
- **Fingerprint and face devices:** choose a vendor whose devices can push punches (for example ZKTeco with a cloud API).
- **Salary benchmarking data:** a market data provider.
