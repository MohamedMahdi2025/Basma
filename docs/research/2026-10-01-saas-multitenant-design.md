# Turning the HR system into a multi-company SaaS (design, 2026-10-01)

Question from the owner: the system serves one company (Best Gas). Can it become a licensed
product, so that any number of companies buy a licence, the owner creates their company, trains
them, and they run their HR on it?

Short answer: **yes**. The code is ready for it, and the work is mostly infrastructure, not a
rewrite. The current Google setup is the part that cannot scale to many companies.

## 1. Requirements

**Functional**
- A platform console for the owner:
  - create a company (tenant), with its name in Arabic and English, logo, colours, CR and VAT
    numbers, and the address used on letters;
  - choose a plan: seats, modules, start and end dates;
  - create the company's first admin;
  - suspend or renew a company;
  - see usage;
  - open the company with "support access" (logged, with a reason, time-limited).
- Each company gets every module that exists today: attendance, HR file, leave, payroll and
  WPS, performance, programmes, compliance, shifts, relations, custody, offboarding, reports and
  dashboard.
- Training material per company: docs/guide/bestgas-hr-system-guide.md becomes the manual.
- Export and delete a company's data at the end of a contract.

**Non-functional**
- Unlimited companies. One company can never read another's data.
- Morning check-in peak: every company punches between 07:30 and 08:30 at the same time. A
  punch must answer in under 1 s.
- KSA personal data (PDPL) covers national ID, iqama, IBAN and salaries. The system needs
  hosting in the Kingdom, a data processing agreement (DPA), and breach notice to SDAIA
  within 72 hours.
- One update reaches every company. Daily backups with point-in-time restore.

**Constraints**
- Small team: the owner plus Claude.
- 6,700 lines of server logic and 786 automated checks already exist and must keep working.
- Passkeys are tied to a web domain (today `besgasksa.github.io`).

## 2. What the code already allows (measured 2026-10-01)

- All data access goes through a few helpers in `backend/Code.gs`: `readAll_`, `append_`,
  `update_`, `appendMany_`, the cache, script properties and the lock.
  - There is exactly one `SpreadsheetApp` call in the whole backend.
  - There are about 30 Google service calls in total.
- The 15 backend modules are plain JavaScript. `tests/harness.js` already runs them unchanged in
  Node with a stand-in for Google. Replacing that stand-in with a real database is the core of
  the port.
- Company-specific text: about 27 places name Best Gas (logo, company name, letterheads,
  certificates). These move to a company profile.

## 3. Options

| | A. One Google copy per company | B. One multi-company platform (recommended) | C. A now, B in parallel |
|---|---|---|---|
| How | A new Sheet and Apps Script for each customer, same code | One Node.js service plus PostgreSQL in a KSA cloud region, every row tagged with the company | Pilot customers on A, everyone moves to B |
| Time to first customer | Days | 6 to 9 weeks | Days, then 6 to 9 weeks |
| Scale | Breaks at peak: Apps Script allows about 30 simultaneous runs per account, every Sheet read costs 250 to 900 ms, and there is a 2 s Google round trip | Add servers as needed; punch about 0.1 to 0.3 s | B |
| Isolation | Strong: a separate file per company | Database row-level security on every query | B |
| PDPL hosting in KSA | Not guaranteed for Google Sheets | Yes: choose a KSA region | B |
| Updates | Pushed to N projects (scriptable) | Once for everyone | B |
| Licences and billing | Weak (no central check without new Google scopes) | Central: seats, modules, expiry | B |
| Running cost | Near zero | A managed database plus 2 small servers: low hundreds of USD a month at the start | Both for a while |
| Ops burden | Low | You run servers: monitoring, backups, patches | Highest during overlap |

**Recommendation: B, with Best Gas as company number one.**
- A cannot meet "unlimited companies": the shared check-in peak alone stops it.
- A cannot promise KSA hosting.
- B reuses all the business logic and tests, so the risk sits in infrastructure, which is well
  understood.
- Keep today's live system running untouched until Best Gas moves.

## 4. Design for option B

```
  employees, managers, HR                 platform owner (you)
        |                                        |
  acme.<brand>.sa  bestgas.<brand>.sa       console.<brand>.sa
        \______________ | ______________________/
                        v
              one PWA build, branded per company (logo, colours, names)
                        |
                        v  HTTPS
              api.<brand>.sa : Node.js, stateless, 2+ instances behind a load balancer
              - finds the company from the subdomain and the signed token (they must match)
              - runs the SAME backend modules (Hr, Leave, Payroll, ... Custody)
                        |
        +---------------+----------------+-----------------+
        v               v                v                 v
   PostgreSQL       Redis            object storage     mail + e-invoices
   (one database,   (cache, locks,   (documents,        (Microsoft 365 or
   company_id on    rate limits)     exports, logos)    a mail service;
   every row, RLS)                                      ZATCA provider)
```

**Data model additions**
- `companies`: id, slug, name_ar, name_en, CR, VAT, logo, colours, status.
- `licences`: company, plan, seats, modules, starts, ends, status, grace days.
- `platform_users`: you and your support staff, kept separate from company users.
- `support_sessions`: who opened which company, why, and until when.
- `company_id` on every existing table (employees, punches, payslips, and the rest). Postgres
  row-level security uses `SET app.company = ...` per request, so a bug in one query cannot
  leak another company's rows.

**Licence rules**
- Seat limit is checked when a new employee is activated.
- At expiry: a grace period, then read-only. Never block a payroll month half-way.
- Modules switch screens and actions on or off, enforced on the server like every other
  permission.

**Passkeys**
- With the passkey domain set to `<brand>.sa`, one passkey setup works on every company
  subdomain.
- Moving Best Gas from `besgasksa.github.io` means each Best Gas employee activates their
  device once more (already noted in CLAUDE.md).

**Security and PDPL**
- Hosting in a KSA region.
- TLS everywhere; encryption at rest, plus column encryption for national ID, iqama and IBAN.
- Every support access is logged and shown to the company admin.
- A DPA with each customer: they are the controller, you are the processor.
- Breach notice to SDAIA within 72 hours.
- Export and deletion at the end of a contract.
- A penetration test before the first paying customer.
- NCA controls if a customer is government-linked.

## 5. Plan

| Phase | Weeks | Output |
|---|---|---|
| 0. Decisions | 1 | Product name and domain; hosting provider in KSA; confirmation that you hold the rights to license the code (see 6) |
| 1. Storage port | 2-3 | A Postgres adapter behind the existing data helpers. company_id everywhere. All 786 checks plus the 50-employee simulation passing against Postgres. Company profile replacing the Best Gas text |
| 2. Platform | 2 | Owner console (companies, licences, support access, usage), subdomains, licence enforcement, branding per company |
| 3. Production readiness | 1-2 | KSA hosting, backups and restore drill, monitoring and alerts, security review and pen test, PDPL documents (DPA, privacy notice, breach plan) |
| 4. Launch | 1 | First pilot company, then Best Gas moves (devices re-activated once) |

Total: about 6 to 9 weeks of focused work.

## 6. Points that are not technical, but critical

- **Who owns the code.** It was built for Best Gas. Before licensing it to others, confirm in
  your agreement with Best Gas that you hold the rights, or get a written agreement.
- **Brand.** The product needs its own name and domain. Best Gas logos, data and wording must
  not ship to other customers.
- **Commercial and tax.** The commercial registration needs a software or SaaS activity.
  Licence invoices must be ZATCA e-invoices. A licence agreement and an SLA are needed (the
  legal skills can draft them for a lawyer to check).

## 7. Revisit as it grows

- A separate database for very large customers.
- Single sign-on with Microsoft Entra or Google for enterprise customers.
- Native app wrappers.
- An integration API (Odoo, Mudad, Qiwa, GOSI where they allow it).
- A per-customer data residency option.
