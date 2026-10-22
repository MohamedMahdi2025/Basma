# Public API and webhooks: research and design

Date: 2026-10-22. Status: built and tested.
- Tests: tests/api.js (24 checks) and the sim50 matrix.
- Screen: Administration → Integrations.
- Verified in the preview: an Excel/Power BI link returns live CSV.

## 1. What the leading systems do (public developer documentation, ideas only)

| System | Read API | Events |
|---|---|---|
| Workday | REST/SOAP and RaaS (a custom report as a JSON/CSV URL for BI tools); integration system users with scoped security | Business-process event subscriptions |
| SAP SuccessFactors | OData v2/v4 with paging and `lastModifiedDateTime` filters; OAuth per client | Intelligent Services events to subscribers |
| BambooHR | REST with an API key per user; "changed since" endpoints | Webhooks with chosen fields; HMAC-SHA256 signature header |
| HiBob | Service users with per-scope permissions | Webhooks signed with a shared secret |
| Personio | Credentials per integration, attribute whitelist | Webhooks |
| Stripe / GitHub (reference for signing) | — | `timestamp.body` HMAC-SHA256 signatures, retries with exponential backoff, delivery logs, secret rotation |

Common lessons:

- each integration gets its own credential with the narrowest scope, revocable at once;
- reads page through results and filter by "changed since";
- BI tools need a plain GET link (Workday RaaS);
- events are signed over timestamp and body, retried with backoff and logged;
- personal data is minimised.

## 2. Design

### Keys

- Per organisation, kept in its own book, so a key of one organisation means nothing to another.
- Read-only; the administrator issues them.
- Scopes: employees (job data), org (departments and positions), attendance (daily summaries, up to 31 days), leave
  (approved), payroll (run totals and the run's journal entry for Odoo).
- **Never in any answer:** salary per person, bank account, ID number, private file or secrets. Journal lines that
  name an employee are summed per account.
- The key `hrk_<id>_<secret>` is shown once and stored as SHA-256. Each key is limited to 120 calls a minute.
- Every call is written to the audit log, and the screen shows last use and count.

### Reading

- POST `{ action: 'apiQuery', orgId, apiKey, resource, page, updatedSince, from, to, runId }`.
- Or GET `?org=&key=&resource=…&format=csv|json`, for Power BI and Excel "From Web", which cannot send headers.
  Treat that link like a password.
- Pages of 500 rows, with `total` and `hasMore` in each answer.
- CSV comes with a byte-order mark for Excel, and with a guard against spreadsheet formulas.

### Webhooks

- HTTPS only. Private and internal addresses are refused (SSRF), and redirects are not followed.
- Events:
  - `employee.created`, `employee.updated`, `employee.left`;
  - `leave.approved`;
  - `attendance.punch`;
  - `payroll.locked` (totals only; closed pay groups never send).
- Events are captured at the data layer (`append_`/`update_` → `whTap_`):
  - each is queued once per subscriber, with a de-duplication key;
  - an employee save that changes nothing visible sends nothing.
- Each delivery is signed. Headers `X-HRIS-Event`, `X-HRIS-Delivery`, `X-HRIS-Timestamp`, `X-HRIS-Org`, and
  `X-HRIS-Signature: sha256=<HMAC-SHA256(secret, timestamp + "." + body)>`.
- The secret is derived from the platform key and never stored. It is shown once and can be rotated.
- Delivery is lazy, after write requests: up to 5 at a time. Retries wait 1, 2, 4 … minutes; after 8 attempts the
  delivery is "failed for good". The delivery log and a test event are on the screen.

## 3. Limits

- Delivery depends on traffic, because there is no trigger scope. On a quiet weekend an event waits for the next
  write request.
- An employee's first save after a webhook is created may send one `employee.updated` with the current data.

## 4. Example: Power BI

Get Data → Web → paste the link from the key screen, for example
`<endpoint>?org=1001&key=hrk_…&resource=attendance&from=2026-10-01&to=2026-10-31&format=csv`.
