# SaaS tenancy: one Org ID, one set of books per company

Date: 2026-10-22. Status: built and tested.
- Tests: tests/tenancy.js, 28 checks, plus every existing suite.
- Verified in the preview with two companies.

Owner's requirement:

> "every company has separated with unified ID … when the employee login for the app he must entered the Org ID number to be
> ensure that we using separated books for every entity — this is the most priority."

## 1. How the leading SaaS HR systems separate customers (public architecture)

| System | Tenant identifier at sign-in | Data separation |
|---|---|---|
| Workday | Tenant name in the URL (`wd5.myworkday.com/<tenant>`) | One multi-tenant object store; a tenant key inside every object, enforced by the platform |
| SAP SuccessFactors | **Company ID** typed on the login page | A separate database schema per customer company |
| Oracle HCM Cloud | Pod and environment URL per customer | A separate database (pluggable DB) per customer environment |
| Zoho People / Bayzat / Jisr | Organisation subdomain or workspace | A shared database with an org id on every row |

The strongest separation is a **separate store per company**, which is the SuccessFactors and Oracle model. A filter
on a shared table (the Zoho/Bayzat model) leaks the moment one query forgets the filter. The clearest sign-in for
staff is the **Company ID** typed once on the login page. That is the SuccessFactors pattern and what the owner asked
for.

## 2. What was built

### Separate books

Each organisation's data lives in **its own Google spreadsheet**. There is no shared table and no filter to forget.
- The home organisation (Org ID **1001**, Best Gas) is the spreadsheet the script is bound to. Nothing moved, and every
  key of the live system is unchanged.
- Every other organisation's spreadsheet is created by the platform. It is reached through the Google Sheets REST API
  with the script's own token (`restBook_`).
- The `drive.file` permission the owner already granted covers files the app creates. So **no new Google permission
  and no re-authorisation** were needed, and the live system never stopped.
- The REST object offers exactly the spreadsheet calls the data layer makes, so all 30+ modules work unchanged on
  either kind of book.

### Every request belongs to one organisation

`handle_` resolves the organisation before any other step: from `orgId`, or from the `o` claim inside the session
token. Then:
- `ss_()` opens only that organisation's book.
- `cache_()` prefixes every cache key, so tab copies, settings, rate limits, sweeps and challenges can never mix.
- Document numbers (`seq:*` counters) and the Drive folder for attachments are per organisation (`orgKey_`).
- Session tokens carry the Org ID. A token presented to another organisation is `session_expired`.
- Sessions from before Org IDs (no claim) are valid only in the home organisation.
- Sign-in, activation, password sign-in, recovery and first set-up **require** an Org ID (`org_required`).
- Unknown IDs are rate-limited against guessing.

### Platform

- `orgCreate` (setup key): creates the new spreadsheet with every tab and its header row in one call. It assigns the
  next Org ID (1002, 1003, …), refuses a CR that already has an organisation, stores the company profile, and returns
  a one-time activation code for its first administrator.
- `orgList` and `orgSetStatus` (suspend or re-open; a suspended organisation is refused on every request).
- Screen: Administration → Organisations (platform). The setup key is asked for each time and never stored.

### The app

- **Every sign-in screen asks for the Org ID first.** The company's name appears under the field as soon as the number
  is real (`orgCheck`). A wrong number says so.
- **Phones enrolled before today** get one question, "Organisation ID", before the PIN pad. It is then remembered. The
  lock screen names the organisation, with "Change organisation".
- Every request carries the Org ID.
- The activation message HR sends (copy or WhatsApp) now starts with the Org ID.
- Kiosk links are `#kiosk/<Org ID>/<setup>`; careers links are `#careers/<Org ID>`.

## 3. Limits, said plainly

- Hand edits in another organisation's spreadsheet do not trigger `onEdit`. Its cached copies refresh within 5 minutes
  (the cache expiry). App writes show at once, as before.
- The platform's e-mail sender (Microsoft 365) and the setup key are shared by the platform. Each organisation's own
  settings, numbers, files and data are not.
- Passkeys stay bound to the same web address for every organisation (one RP ID). Separation is by organisation and
  employee, not by passkey domain.
- New organisations' spreadsheets are owned by the platform owner's Google account, as the home one is. Moving them to
  a dedicated platform account (or to the Node/PostgreSQL platform in docs/research/2026-10-01-saas-multitenant-design.md)
  is a later step.

## 4. Owner steps

1. Tell every Best Gas employee once: **Org ID = 1001**. Each phone asks for it at the next unlock.
2. To add a company: Administration → Organisations → enter the setup key → New organisation. Send the shown message
   (Org ID, employee number, activation code) to that company's first administrator.
