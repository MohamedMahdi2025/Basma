# Build roadmap: becoming the strongest HRIS (from docs/research/2026-10-04-feature-gap-matrix.md)

Baseline on 2026-10-04: 96 sub-features in 17 module families, compared with Workday, SAP SuccessFactors, Oracle,
ADP, UKG, Rippling, BambooHR, HiBob, Personio, Deel, Jisr, ZenHR, Bayzat, Menaitech and Palm HR.
Result: 33 have, 20 partial, 43 missing. Each item ships with tests, a print view (js/doc.js), an Excel export
(js/xl.js), the v3 design, its bell tasks and its links to the next step of its cycle.

## Wave 1 (now)
| Item | Status |
|---|---|
| Design v3 across the shell, Home, payslip; premium A4 document kit | live @36 |
| Payslip company cost (employer GOSI, monthly end-of-service provision, total); GOSI registered wage | live @36 |
| Formatted Excel for every report and every screen; print view for every screen | live @35 |
| Admin manages pay (adminSeesPay); white-label company profile | live @35 |
| Leave cycle (pre-leave clearance, departure, return to work, late return) | built 2026-10-08, going live |
| Approvals centre (every pending decision in one place, configurable chains, SLA, escalation, bulk) | built 2026-10-08, going live |
| 30+ analytical reports (attendance, leave, payroll cost, workforce, performance, SLA, compliance) | built (64 in the catalogue), going live |
| Art. 72 fix: 30 days to object; government services (exit/re-entry, final exit, iqama, tickets, fees) | built 2026-10-08, going live |
| Expense claims; payroll journal for Odoo; bank and Mudad file formats | built 2026-10-08, going live |

## Wave 2
- Recruitment: requisition, job post, candidates, interviews, offer, hire, onboarding.
- Medical insurance (CCHI) with dependants.
- Training and certificates.
- Loans.
- Off-cycle, final-pay and retro runs.
- Hourly permission (استئذان) and leave year-end.
- Overtime requests and timesheets.
- Compensation review.
- Custom fields.
- Announcements and recognition.
- HR help desk.
- Scheduled reports.
- Travel and per diem.
- Report builder with pivot and drill-down.
- Notifications by e-mail and WhatsApp. This needs the external-request scope, so it has to be deployed when the owner can re-authorise.
- File attachments. This needs a Drive scope, deployed the same way.

## Wave 3
- Direct Mudad, GOSI, Muqeem (through Elm) and Qiwa links. Partner agreements are needed, so apply now.
- Public API and webhooks.
- SSO.
- Succession.
- OKRs.
- Nafath e-signature.
- Workforce planning.
- Native apps.
- Bank host-to-host payment.
- The SaaS platform (Phase 1 is nearly done in platform/; resume at uow.js lock-on-retry).

## Cycle links to verify at the end of each wave (tests/sim50.js)
1. Hire to onboarding, probation and the first payroll.
2. Leave request to approvals, then pre-leave clearance, departure, return, and the payroll effect.
3. Resignation to clearance, then the final settlement, end of service, the payroll journal and the service certificate.
4. Expense claim to approval, then payroll reimbursement and the journal.
5. Iqama expiry to the calendar, then the bell, the renewal and the fee ledger.
6. Disciplinary case to its decision, then the objection (30 days, Art. 72) and the payroll fine.
