# Module gap re-audit against the leading HRIS (2026-10-20)

**Baseline:** the 116 rows of `2026-10-14-module-gap-audit.md`. That audit was built from public product documentation:
- the global leaders: Workday, SAP SuccessFactors, Oracle HCM, HiBob, Rippling, Personio and Deel;
- the Saudi leaders: Jisr, ZenHR, Bayzat, Menaitech and Palm HR.

Each row is re-checked against the code that is live today (@87).

## Score

| | 2026-10-14 | Today |
|---|---|---|
| Have | 45 (+19 built that day) | **97** |
| Built, waiting on one owner click | 0 | **3** (e-mail and push of payslips, document attachments, daily digest) |
| Partial | 19 | **4** |
| Missing | 52 | **12** |

## Built since the first audit (rows that moved to "have")

| Area | Rows now built |
|---|---|
| Core HR | custom fields; company data export |
| Organisation | visual org chart; headcount and workforce plan |
| Recruitment | careers page; internal job board |
| Onboarding | pre-boarding welcome |
| Offboarding | 2025 deemed resignation enforced; exit interviews |
| Time and shifts | timesheet approval; overtime requests; hourly permission; overnight shifts; open shifts and swaps |
| Leave | team overlap warning |
| Payroll and EOS | final-pay settlement (off-cycle); Art. 77 compensation |
| Spend, benefits and pay | travel and per diem; perks and wellbeing; compensation review cycle |
| Performance and talent | continuous goals and 1:1s; succession and 9-box; career paths |
| Engagement | survey builder; recognition |
| HR service | knowledge base |
| Apps | Android app (built and tested); iPhone project ready |
| Reporting | report builder; recruitment, training and insurance reports |

## Waiting only on the owner's one-time Allow (code live, switched off)

- E-mail digest and payslip e-mail. These also need the Microsoft 365 app credentials.
- Document attachments in Google Drive.

## Still partial

| Row | What is missing |
|---|---|
| WPS / Mudad | files are produced and checked; there is no direct API (that needs a partner agreement) |
| E-signature | in-app acknowledgements only; Nafath needs a government integrator |
| Visual workflow designer | **done 2026-10-23**: drag-and-drop canvas, palette, inspector and a "try it" preview on a real employee (flows.js editFlow, Flows.gs flowPreview); forms themselves are still fixed |
| History snapshots | **done 2026-10-21** (insights:history) |

## Still missing, and what each needs

| # | Row | Needs | Who |
|---|---|---|---|
| 1 | **Kiosk / office QR check-in** | code only | Claude |
| 2 | **Scheduled reports by e-mail** | code (it reuses the Microsoft 365 sender) | Claude |
| 3 | **Several pay groups or cycles** | code only | Claude |
| 4 | **Public API and webhooks** for other systems (Odoo, Power BI) | code only | Claude |
| 5 | **Multi-entity: several CRs under one group** | code (large) | Claude |
| 6 | AI assistant: HR questions, CV screening, report questions | an AI provider key (Claude API) | owner |
| 7 | SSO with Microsoft Entra ID or Google | an app registration by the IT admin | owner |
| 8 | WhatsApp notifications | a Meta WhatsApp Business account | owner |
| 9 | Mudad, GOSI, Qiwa and Muqeem APIs; Tameeni | partner agreements | owner |
| 10 | Biometric devices | choice of device vendor | owner |
| 11 | LMS content, salary benchmarking, HRDF report format | content or data providers, the official format | owner |
| 12 | Year-end leave forfeiture or encashment | **not built on purpose**: Art. 109 forbids forfeiting or cashing out leave during service | — |

**Recommended build order for the code-only rows:**

1. **Kiosk / office QR check-in.** It also solves the indoor-location problem: a tablet at the office entrance shows a QR
   that changes every 20 seconds, and scanning it with the app proves presence even when GPS is weak.
2. **Scheduled reports by e-mail.**
3. **History snapshots** (completes reporting).
4. **Several pay groups.**
5. **Public API and webhooks.**
6. **Multi-entity.**


## Status on 2026-10-23

Every code-only row is built: kiosk QR, scheduled reports, pay groups, public API and webhooks, history snapshots, multi-company (Org ID tenancy plus company groups in the platform console), the visual workflow designer, remote work, total rewards and the live office map. What remains needs the owner: rows 6-11 above and docs/OWNER-STEPS.md.
