# KSA HRIS documentation study: what the Saudi leaders actually document (2026-10-08)

**Status:** IN PROGRESS (written vendor by vendor so a crash loses little).

**Question.** The owner wants the strongest HRIS in KSA. The 2026-10-04 matrix
(`2026-10-04-feature-gap-matrix.md`) compared 96 sub-features from product pages. This study goes one level deeper:
the vendors' **help centres and release notes**, and the **government platforms** an HRIS has to work with
(Mudad, Qiwa, GOSI, Muqeem, the Labour Law, PDPL).

**Rules used here.**
- Every vendor claim has a URL. "unverified" = I could not read a primary page that says it.
- Help-centre pages describe what a feature does; they do not prove how well it works.
- Not found = not found in this pass, not proof of absence.
- Jisr's Zendesk help centre (jisr.zendesk.com) returns HTTP 403 to automated reads. Jisr help-centre facts below come
  from the search engine's index of those articles (title + indexed text), marked "(help-centre index)".

---

## Vendor notes

### Jisr (jisr.net), Riyadh

Modules (features page, [jisr-f]): Core HR (multi-entity, org chart, pre-boarding, contract automation, probation
tracking), Payroll (custom payroll groups by project / pay type / nationality / entity, accounting integration, overtime,
EOS), T&A (geofence + biometric devices, shift scheduler, Ramadan/summer hours, mobile punch), Compliance (GOSI, Saned,
Muqeem, Mudad; **Qiwa still "coming soon"** on [jisr-comp]), Recruitment (AI CV parsing and ranking, career portal,
Google Meet / Outlook / Zoom), Performance (cycles; 360 "coming"), Engagement (announcements, surveys, eNPS, "Jisri" AI bot),
Learning (Arabic courses, Qiwa compliance reports, Lumofy), Spend (expenses with **OCR receipt scanning** in the app,
business travel with flight booking). Menu also lists Salary Benchmarking, Workforce planning, Journal hub, Payments.

| Area | What the documentation says | Source |
|---|---|---|
| Mudad / WPS | "Integration with Mudad to process payroll payments" (2023); "You won't need to upload the bank file"; generates Mudad WPS files | [jisr-comp], [jisr-run-payroll] |
| GOSI | Add Saudi / non-Saudi employee, update wage, edit data, terminate, from Jisr, "no additional fee" | [jisr-gosi] |
| Muqeem | Iqama renewal, passport extension/renewal, exit re-entry issue/extend/cancel/reprint, final exit issue/cancel, Muqeem reports. Only visas issued **through Jisr** can be managed in Jisr; Muqeem users need privileges on both platforms; exit/re-entry is a field of the leave request, visible only to non-Saudis (help-centre index) | [jisr-muqeem], [jisr-muqeem-kb] |
| Qiwa | "COMING SOON" on the compliance page (Oct 2026 read) | [jisr-comp] |
| Attendance | Geofence circle drawn on a map per location; ZKTeco via BioTime; Jisr clocking devices (fingerprint, PIN, card). **No face/selfie or offline punch found.** Missing punch = shift incomplete, no hours | [jisr-att], [jisr-geo-kb] |
| Leave settlement | "Vacation settlement" = prepaid leave pay chosen on the annual-leave request (days x daily wage of last salary); minimum days setting; Jisr's own FAQ says a full balance cannot be cashed out while employed (help-centre index) | [jisr-vac-kb] |
| Final settlement | Generated when HR terminates the record; unpaid salary + unused leave + EOS - advances/GOSI; paid **off-cycle** citing Art. 88; resignation ladder 0 / 1/3 / 2/3 / full; basis selectable (basic, basic + chosen allowances, full); workday balances converted x30/21 (help-centre index) | [jisr-eos-kb], [jisr-eos-set-kb] |
| Accruals | Retro journal entries for EOS and vacation accrual when salary rises; journals posted to Qoyod as drafts; ERP guide (Odoo, SAP B1, NetSuite, QuickBooks, Xero, Zoho, Dynamics, Qoyod) | [jisr-retro-kb], [jisr-erp] |
| Workflows | Custom request types with fields and **up to 6 approvers**; approval cycles by job title (direct manager, dept manager) or named person, targeted by group; admin direct-approval bypass (manager notified); **automation rule: auto-approve after N days pending and move to next step** | [jisr-custom], [jisr-cycles-kb], [jisr-auto-kb] |
| Release Nov 2025 | Bulk sick-leave approval; centralised audit log (activated by CSM); salary benchmarking with bands and out-of-band alerts; expense policies with multi-step approvals; post-paid travel billing; self-review + upward feedback | [jisr-nov25] |
| Security | "PDPL Compliant"; data on GCP Saudi Arabia or AWS Bahrain; ISO 27001; SOC 2 Type II; 2-step login; SSO SAML 2.0 / OIDC (Okta, Azure AD, Google); Excel or API export | [jisr-sec] |
| Pricing | Basic / Advanced / Enterprise, demo-only; custom requests once "Professional plan" only. Third-party 10-16 SAR per employee per month is **unverified** (Preqin profile, dated) | [jisr-plans], [preqin-jisr] |
| Letters | Letter templates exist (manager help article title); **QR verification not found** | [jisr-mgr-kb] |

### ZenHR (zenhr.com), Amman / Riyadh

| Area | What the documentation says | Source |
|---|---|---|
| Law mapping | Help article maps Labour Law articles to features: Art. 53 probation auto-converts on day 91/181 unless extended; Art. 98 Ramadan reduction driven by the Religion field; Art. 101 shift templates insert the mandatory break after 5 h; Art. 107 overtime 50% of basic (policy can use actual wage); Art. 84-86 EOS with configurable "wage"; **Art. 87 full EOS for a woman resigning within the marriage/birth window**; Nitaqat dashboard and Tawteen reports; tracks Qiwa contract ID and visa quota usage. Many articles (66-72, 109-117, 151-160) are "not mapped" in the article itself | [zen-law] |
| Mudad | "Automatically send employee payroll data to Mudad"; near real-time payment status; cancel or adjust after a batch reached Mudad | [zen-mudad] |
| GOSI | Add Saudi contributors, approve pending non-Saudi contributors, update, terminate (date + reason), import contributors, link employees; **"Salary on GOSI" vs ZenHR salary with a sync icon and bulk "Sync Salary"** | [zen-gosi-kb], [zen-gosi-mkt] |
| Muqeem | Iqama issue / renew / transfer / add existing / import; exit re-entry issue / cancel / extend / reprint; final exit issue / cancel; passport extend / renew. Superadmin activates with the company's **Muqeem username and password**; roles Muqeem Admin / Read-only | [zen-muqeem] |
| Qiwa | Marketing says "100% authenticated digital contracts" and real-time submission to Qiwa; **no help article on how** (unverified mechanism) | [zen-expat] |
| Attendance | Mobile GPS punch with optional geofence and several work sites; **dynamic rotating QR on a shared screen** with Wi-Fi/IP restriction; home-screen widget one-tap punch; ZKTeco via BioTimeCloud (fingerprint, face, iris on the device). No in-app face match, no offline punch found | [zen-att], [zen-ess25] |
| ESS app 2025 | Leave, overtime, missing-punch, loan, reimbursement, letter, custom requests; manager approvals with rejection reason and attachments; "Who's Off"; push notifications; document-expiry, birthday reminders; Altibbi telemedicine; Arabic/English | [zen-ess25] |
| July 2026 release | Employee letter requests with preview and custom fields through approval workflows; competencies linked to positions and succession; business travel with per diem; SOC 2 Type II renewed; 2FA recommended | [zen-2026] |
| Letters | Default and custom templates (Documents > HR Letters > Templates). **QR verification not found** | [zen-letters] |
| Leave encashment | In final settlement and payroll setup (marketing level) | [zen-payroll] |

