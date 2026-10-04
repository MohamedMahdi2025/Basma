# Documentation benchmark: how the strongest HR systems document themselves (2026-10-03)

**Question from the owner:** find the best documentation of the strongest systems in the world, and tell us what to build.

**Scope.** I looked at the public documentation of 15 HR and payroll products: 10 global suites and 5 Gulf players. I also read
four writing frameworks and checked what a Saudi B2B SaaS has to publish before companies will buy it. Then I compared all of
it with our own docs:
- `docs/guide/bestgas-hr-system-guide.md`;
- `CLAUDE.md` and `DESIGN.md`;
- the three studies in `docs/research/`.

The plan that follows from this study is in `docs/DOCS-PLAN.md`.

**Method and limits.**
- Skills used: engineering:documentation, anthropic-skills:documentation-template, design:ux-copy and anthropic-skills:docs.
  The docs connector was not used, because the deliverables are local files.
- Every claim about another product links to its source. Text is summarised in my own words, with no long quotes.
- Several sites refused automated reading, so for them I relied on search-indexed descriptions: the Jisr and Bayzat Zendesk help
  centres, `trustcenter.jisr.net`, the Workday Canvas RTL page, the Personio support pages and the Rippling help-centre home.
- In the tables, "—" means not found in this pass. It does not prove the document is absent.
- Mozilla's Arabic localisation style guide was checked and set aside: some of its sections are written about Swahili.
- Legal points were checked against HRSD where it answered, and otherwise against law-firm summaries. They still need Saudi
  counsel before they become product rules.

---

## 1. Verdict

1. **The leaders do not ship a manual. They ship a documentation system.**
   - Oracle sorts its library by what the reader is doing: use, implement, administer, secure, integrate
     ([Oracle HCM library][ora-lib]).
   - HiBob organises its customer hub by who the reader is: a new customer, an implementer or a leader
     ([HiBob Customer Hub][hb-hub]).
   - Our docs are one 1,700-line Arabic guide that every audience shares, from a driver to the platform owner.
2. **Release notes are structured data, not prose.**
   - Workday tags each note by type and gives at least a year's notice before a feature is retired
     ([Workday Release Center][wd-rc]).
   - SAP lets customers filter changes by what applies to them ([What's New Viewer][sap-wnv]).
   - Oracle marks whether the customer must act, and whether a feature is on by default ([Oracle Readiness][ora-ready]).
   - We have no release notes at all.
3. **Trust is a published product.**
   - Jisr, our closest Saudi competitor, publishes these concretely ([Jisr security][jisr-security]):
     - ISO 27001, SOC 2 Type II and PDPL;
     - hosting in the GCC;
     - backup frequency;
     - a recovery-time target;
     - its pen-test cadence;
     - one-click export and deletion.
   - Jisr also runs a trust centre with its security and breach-notification policies ([Jisr Trust Center][jisr-trust]).
   - We have none of this.
4. **The Saudi players win on Arabic and on the law.**
   - Jisr runs an Arabic-only academy with certification ([Jisr Academy][jisr-academy]) and an Arabic help centre of 250+
     articles ([Jisr FAQ][jisr-help]).
   - ZenHR maps the Saudi Labour Law, article by article, to its features, with decree citations and a not-legal-advice
     disclaimer ([ZenHR law map][zen-law]).
   - Our guide already cites articles, which is a real head start, but it is internal and not packaged for buyers.
5. **Help lives in the product.**
   - SAP opens help in context from the page header ([SAP Companion][sap-companion]).
   - Deel pins help articles to the page they describe ([Deel][deel-pin]).
   - Oracle runs guided tours and a help panel inside the app ([Oracle Guided Learning][ora-ogl]).
   - Our app has empty states and plain-language errors, but no route from a screen to its help.

---

## 2. Comparison tables

### 2.1 Help, learning and localisation

| Product | Getting started and implementation | Admin and user help | Release notes | Training and certification | In-app help | Arabic / RTL |
|---|---|---|---|---|---|---|
| **Workday** | Plan, Architect, Configure, Test, Deploy method (partner write-up) [↗][wd-deploy]; course manuals [↗][wd-course] | Administrator Guide on doc.workday.com, now readable without sign-in [↗][wd-docs] [↗][wd-announce] | Release Center: Feature, Coming soon, Fix, Retirement; ≥ 1 year retirement notice; language field per note [↗][wd-rc] | Workday Pro certification [↗][wd-pro]; Adoption Kit of job aids, videos, facilitation guides and comms assets [↗][wd-train] | Journeys: targeted, guided employee experiences [↗][wd-journeys] | Product in 40 languages with Arabic at Level 2; levels differ by role coverage [↗][wd-lang]. Docs site in ~11 languages, no Arabic [↗][wd-docs]. RTL and bidi design rules [↗][wd-canvas-rtl] |
| **SAP SuccessFactors** | 60+ Implementation Design Principles written with partners [↗][sap-idp] | help.sap.com, by product and by release [↗][sap-platform] | What's New Viewer: per-change metadata, filters, saved filters, related links [↗][sap-wnv] [↗][sap-rel] | SAP Learning journeys and certifications [↗][sap-learn] [↗][sap-cert] | SAP Companion: context help and guided tours opened from the page header [↗][sap-companion] | `ar_SA` locale with RTL notes [↗][sap-lang] |
| **Oracle HCM** | "Implementing Global HR" guide plus Playbooks [↗][ora-impl] [↗][ora-lib] | Library by task: Use, Implement, Administer, Configure, Analyse, Secure, Integrate; videos and bite-size learning [↗][ora-lib] | Quarterly What's New with customer-action and on-by-default flags; opt-in expiry tracking [↗][ora-ready] | Bite-size learning, videos [↗][ora-lib] | Guided Learning: tours, tooltips, help panel, beacons [↗][ora-ogl]; guided journeys [↗][ora-gj] | Saudi localisation chapter; GOSI cards [↗][ora-sa] [↗][ora-gosi] |
| **ADP** | Getting-started quick reference (PDF) [↗][adp-gs] | Administrator guide (PDF) in the Support Center [↗][adp-ag] | — | Training in the Support Center [↗][adp-ag] | — | — |
| **UKG** | — | Pro Learning Center: release information, how-to, system status and training in one place [↗][ukg-plc] | In the Learning Center [↗][ukg-plc] | Course and learning-path certificates [↗][ukg-cert] | — | — |
| **Rippling** | — | Help centre, e.g. passkey troubleshooting [↗][rip-help] | — | — | — | — |
| **BambooHR** | Spreadsheet import matched to field names; test one row first (older partner guide) [↗][bhr-import] | — | Public product-update posts [↗][bhr-updates] | — | — | — |
| **HiBob** | Implementation manager runs the first import; staged data templates [↗][hb-impl] [↗][hb-migration] | Help Center inside the Customer Hub [↗][hb-hub] [↗][hb-help] | Product updates plus quarterly roadmap webinars [↗][hb-hub] [↗][hb-roadmap] | Training Village: courses, learning paths, certifications [↗][hb-hub] | — | — |
| **Personio** | 4-8 week implementation with structured templates [↗][per-impl]; payroll: pre-implementation, setup, parallel run, go-live [↗][per-payroll] | Help Center within "Voyage" [↗][per-voyage] | API changelog [↗][per-api] | Voyager Academy with badges, EN and DE [↗][per-voyage] | — | — |
| **Deel** | — | Help centre [↗][deel-pin] | — | Deel Academy: 100+ courses, 5+ certifications, free [↗][deel-academy] | Help articles pinned to in-app pages [↗][deel-pin] | — |
| **Jisr** (KSA) | Local implementation and support teams in Riyadh, Jeddah, Dammam [↗][jisr-cs] | Arabic help centre, 250+ articles [↗][jisr-help] | — | Jisr Academy: Arabic only, ordered paths, final test, certificate, open to non-customers [↗][jisr-academy] | — | Arabic first across help, academy and regulatory explainers [↗][jisr-blog] |
| **ZenHR** (Jordan/KSA) | Setup guides in the KB (biometrics, QR clocking, integrations) [↗][zen-kb] | KB by module, English and Arabic [↗][zen-kb] | Not visible in the KB [↗][zen-kb] | — | — | Arabic KB; Saudi labour law mapped to features [↗][zen-law] |
| **Bayzat** (UAE/KSA) | "Implementation and onboarding" category [↗][bay-help] | Help centre [↗][bay-help] [↗][bay-article] | — | — | — | — |
| **Menaitech** (Jordan/GCC) | — | — | — | Academy with certified MenaPAY and Curio programmes [↗][mena-train] | — | — |
| **Palm HR** (KSA) | — | Knowledge Center, Arabic and English [↗][palm-kc] | — | — | — | Arabic knowledge base [↗][palm-kc] |

### 2.2 Technical, trust and operations

| Product | API reference | Data dictionary | Security / trust centre | Status page | Public DPA, sub-processors |
|---|---|---|---|---|---|
| **Workday** | Developer resources linked from the docs [↗][wd-docs] | — | Compliance page: SOC 1, SOC 2, ISO 27001 / 27017 / 27018 / 27701 [↗][wd-trust] | — | — |
| **SAP SuccessFactors** | — | Data models documentation [↗][sap-dm] | Trust Center: certifications and compliance [↗][sap-trust] | Cloud service status in the Trust Center; 99.7% target; refreshed every ≤ 5 min [↗][sap-status] | Via the Trust Center [↗][sap-trust] |
| **Oracle HCM** | "APIs & Schema" section [↗][ora-lib] | "Tables and Views for HCM": columns, keys, views [↗][ora-tv] | — | — | — |
| **ADP** | developers.adp.com: API catalogue, sandbox, OAuth reference guides [↗][adp-dev] | — | — | — | — |
| **UKG** | Public Developer Hub: per-product API spec plus written guidance [↗][ukg-dev] [↗][ukg-api] | — | Trust Center: status, maintenance, security, privacy, compliance [↗][ukg-trust] | Inside the Trust Center [↗][ukg-trust] | — |
| **Rippling** | developer.rippling.com [↗][rip-dev] | — | Trust centre on Whistic [↗][rip-trust]; security page [↗][rip-security] | — | — |
| **BambooHR** | API docs, history of API changes, webhooks [↗][bhr-api] [↗][bhr-api-changes] [↗][bhr-webhooks] | — | Trust Center (NDA for the SOC 2 report) [↗][bhr-trust]; security page [↗][bhr-security] | — | DPA public [↗][bhr-dpa] |
| **HiBob** | apidocs.hibob.com [↗][hb-api] | — | Trust Center: security, DPA, sub-processors, AI trust [↗][hb-trust] | status.hibob.io, per module, 90-day uptime [↗][hb-status] | Yes [↗][hb-trust] |
| **Personio** | Developer Hub with changelog [↗][per-api] | — | Security page; ISO 27001 [↗][per-security] | — | — |
| **Deel** | Developer docs (search-indexed) | — | Security page and trust centre [↗][deel-security] | status.deel.com: components, 60-day uptime, incident history, subscribe [↗][deel-status] | — |
| **Jisr** | — | — | Security page: ISO 27001, SOC 2 Type II, PDPL, GCC hosting, hourly backups, RTO < 4 h, quarterly CREST pen tests, export and delete [↗][jisr-security]; trust centre with policies [↗][jisr-trust] | — | Policies via the trust centre [↗][jisr-trust] |
| **ZenHR** | developer.zenhr.com (JWT) [↗][zen-api] | — | — | — | — |
| **Bayzat, Menaitech, Palm HR** | — | — | — | — | — |

---

## 3. Frameworks and style guides

| Source | What to take | Link |
|---|---|---|
| **Diátaxis** | Four kinds of document, each serving one need: tutorials (learning by doing), how-to guides (doing a task), reference (looking something up) and explanation (understanding). Keep them apart, because mixing them weakens each one. | [↗][dia] |
| Diátaxis, in practice | Do not build empty four-part skeletons. Improve one page at a time: pick it, judge which need it serves, make one change, and move on. | [↗][dia-how] |
| Diátaxis, reference | Reference only describes: it is neutral, complete and consistent, and it mirrors the product's own structure. Link out to instructions rather than mixing them in. | [↗][dia-ref] |
| **Google developer style** | Second person; active voice; state conditions before the instruction; numbered lists for procedures; sentence-case headings; descriptive link text; write for a global audience; unambiguous dates; alt text on every image. | [↗][g-style] |
| **Microsoft Writing Style Guide** | Fewer words; write the way you speak; lead with what matters; start statements with a verb; cut "you can"; sentence case. Microsoft also publishes a downloadable Arabic localisation style guide. | [↗][ms-top10] [↗][ms-loc] [↗][ms-ar] |
| **Arabic: Baianat content guide** | Modern Standard Arabic in a conversational register; short sentences; address the reader as "you"; define a technical term the first time it appears; one term per concept throughout. | [↗][baianat] |
| **Arabic: UX Writing بالعربية** | An Arabic adaptation of a product content style guide, covering web, mobile and dashboards. | [↗][uxw-ar] |
| **Arabic: DGA** | Saudi government content guideline: Arabic as the default language, right-aligned layout, the same experience in Arabic and English, and periodic accuracy reviews. The DGA Platforms Code is the national RTL design system. | [↗][dga-content] [↗][dga-ds] |
| **NN/g: tutorials vs contextual help** | Forced tours shown at launch interrupt people and are soon forgotten. Help that the user calls up at the moment of need works better: it is easy to dismiss, easy to find again, and disclosed progressively. | [↗][nng-tut] |
| **NN/g: empty states** | An empty state should say what the system is doing, teach the feature, and offer the direct action that fills it. | [↗][nng-empty] |

---

## 4. What a B2B HR SaaS has to publish to sell in Saudi Arabia

The table walks the buyer's journey, from first look to renewal. "Evidence" is where a leader does it.

| Buyer stage | Documents | Evidence |
|---|---|---|
| Evaluate | Product overview; module matrix; Saudi compliance coverage (law to feature); security and trust page; sample reports | ZenHR law map [↗][zen-law]; Jisr security [↗][jisr-security] |
| Buy | Licence terms; DPA; SLA; sub-processor list; privacy notice | HiBob Trust Center [↗][hb-trust]; BambooHR DPA [↗][bhr-dpa]; SAP availability target [↗][sap-status] |
| Implement | Implementation playbook with phases and exit criteria; data migration templates; configuration workbook; parallel payroll run; go-live checklist | Workday phases [↗][wd-deploy]; Personio payroll phases [↗][per-payroll]; HiBob staged templates [↗][hb-migration]; SAP IDPs [↗][sap-idp] |
| Adopt | Role-based quick starts; academy and certification; in-app help; adoption kit for the customer's own rollout | Workday Adoption Kit [↗][wd-train]; Jisr Academy [↗][jisr-academy]; SAP Companion [↗][sap-companion] |
| Run and renew | Release notes; status page; support policy; roadmap | Workday Release Center [↗][wd-rc]; Deel status [↗][deel-status]; HiBob roadmap [↗][hb-roadmap] |

**PDPL points the documents must carry** (to be confirmed by Saudi counsel):
- **Privacy notice before collection.** The controller gives a privacy policy before collecting personal data. It names the
  controller, the data, the purpose, the legal basis, the retention period and the data subject's rights
  ([Art. 12 summary][pdpl-12]).
  - For an HR system, each customer company is the controller for its employees.
  - So we owe our customers an **employee privacy notice template**, not only a notice of our own.
- **Processor contracts.** The implementing regulations require written processor contracts with mandatory items. They also
  require the controller's prior acceptance of any sub-processor ([implementing regulations, secondary summary][pdpl-ir]).
  This is our DPA plus our sub-processor list.
- **Breach notice.** Notify SDAIA within 72 hours of becoming aware of a breach, and the affected people without undue delay
  ([DLA Piper][dla]).
- **Registration.** Most controllers must register on the national data governance platform ([DLA Piper][dla]).
- **Transfers abroad.** Transfers outside the Kingdom are allowed under conditions and safeguards; the law is not a blanket ban
  ([DLA Piper][dla]).
  - Secondary summaries of NCA CCC-2:2024 report that its strict localisation clause moved to NDMO
    ([summary][ccc]).
  - So **hosting in KSA is a strong selling point, and often a customer requirement**. It should not be described as something
    PDPL alone demands.

---

## 5. Fifteen practices worth copying

| # | Practice | Seen at | How it applies to us |
|---|---|---|---|
| 1 | **Split docs by user need (Diátaxis) and by task** | Diátaxis [↗][dia]; Oracle library [↗][ora-lib] | Tutorials, how-to, reference and explanation as separate pages |
| 2 | **Entry points by audience** | HiBob Customer Hub [↗][hb-hub] | Eight doors in the help centre: employee, manager, HR, payroll, admin, executive, implementer, owner (internal) |
| 3 | **Public, searchable admin docs** | Workday Administrator Guide [↗][wd-docs] | Public help centre. Access tiers keep sensitive detail (risk scores, internals) behind sign-in or internal only |
| 4 | **Structured release notes**: type, who is affected, action required, on by default, retirement notice | Workday [↗][wd-rc]; SAP [↗][sap-wnv]; Oracle [↗][ora-ready] | One Arabic note per deploy, with fields; at least 90 days' notice before removing anything |
| 5 | **Implementation design principles and playbooks** | SAP IDPs [↗][sap-idp]; Oracle Playbooks [↗][ora-lib] | An implementation playbook, plus a short "how to decide" page for each major setting (leave count mode, EOS basis, absence deduction) |
| 6 | **Phased implementation with a parallel payroll run** | Workday [↗][wd-deploy]; Personio payroll [↗][per-payroll] | Go-live checklist that requires one parallel month before the first live payroll |
| 7 | **Staged migration templates**: critical fields first, history later; test one row first | HiBob [↗][hb-migration]; BambooHR [↗][bhr-import] | Template pack: employees → opening balances → packages → documents → custody |
| 8 | **Law-to-feature reference with citations, dates and a disclaimer** | ZenHR [↗][zen-law] | Our guide already cites articles. Turn that into a verified legal-rule register, then a public coverage map |
| 9 | **Data dictionary generated from the system** | Oracle Tables and Views [↗][ora-tv]; SAP data models [↗][sap-dm] | Generated list of tabs and fields with type, PII class and retention: it feeds migration, PDPL records and support |
| 10 | **Trust page that answers concrete questions**: hosting region, backups, RTO, pen tests, export and delete | Jisr [↗][jisr-security]; HiBob [↗][hb-trust]; BambooHR (NDA for reports) [↗][bhr-trust] | An honest trust page: say what is true today, and claim no certification we do not hold |
| 11 | **Public status page** per module, with incident history and subscriptions | Deel [↗][deel-status]; HiBob [↗][hb-status]; SAP [↗][sap-status] | Components: check-in, HR, payroll, reports. Matters most at the 07:30-08:30 check-in peak |
| 12 | **Academy with paths, a final test and a certificate, in Arabic** | Jisr Academy [↗][jisr-academy]; HiBob Training Village [↗][hb-hub]; Workday Pro [↗][wd-pro] | Short Arabic paths per role; certification for HR, payroll, admin and implementer |
| 13 | **Help in context, pulled not pushed** | NN/g [↗][nng-tut]; SAP Companion [↗][sap-companion]; Deel [↗][deel-pin] | A "؟" in each area header opens that sub-page's help in a drawer; no forced tours |
| 14 | **Empty states that teach**: status, cue, action | NN/g [↗][nng-empty] | Already in DESIGN.md §4. Write the copy deck for every list |
| 15 | **Adoption kit for the customer's own rollout**: job aids, videos, facilitation guide, comms templates | Workday [↗][wd-train] | Employee one-page card with a QR code; WhatsApp/email activation message; trainer guide |

Also worth noting:
- Workday sets language coverage per audience, giving employee and manager screens wider coverage than admin
  ([Workday languages][wd-lang]). We should do the same: employee and manager content first in both languages, internal
  reference in English only.
- Jisr publishes Arabic regulatory explainers, such as a Mudad guide ([Jisr blog][jisr-blog]). That is search traffic and
  trust from a single piece of work.

---

## 6. Gap analysis: our docs against the practices

### 6.1 What we already do well (keep it)

- **Everything is checked against the server.** The guide says that what it describes is enforced by the server, and it marks
  anything unproven with **يحتاج تحقق**. Few vendors are this honest; keep both habits.
- **Error tables with a remedy.** Every chapter lists codes with their meaning and what to do. This becomes the error
  reference and the in-app copy deck.
- **Visibility matrices.** §1.3 and §5.5 say who sees what, and the server enforces it. They are a strong sales and trust asset.
- **Article citations** next to rules (Arts. 37, 53, 107, 109, 117 and others). This is ZenHR's best feature, half built.
- **A design system with content rules.** DESIGN.md §8 covers plain Arabic, `plural()`, "دوامك", verbs on buttons and
  errors that say what to do.
- **Pre-go-live list** (§25.2) and an **owner verification list** (§25.1): the seeds of the go-live checklist and the legal
  register.

### 6.2 Gaps

| # | Practice | Our state (2026-10-03) | Gap | Fix (see DOCS-PLAN) |
|---|---|---|---|---|
| G1 | Separate doc types | One file mixes tutorial steps, how-to, reference (152 actions, settings), explanation (security) and owner internals | Every reader wades through everything; nothing is findable from a screen | Split per Diátaxis and audience |
| G2 | Audience entry points | One guide for all roles; role labels appear only in headings, e.g. "(HR)" | No employee or manager guide | EMP-, MGR-, HR-, PAY-, ADM-, EXE-, IMP- sets |
| G3 | Current with the live product | Header cites 12 suites and 651 checks, and says navigation is "قيد التنفيذ"; §1.4 maps to pre-v2 places; several screens are listed as "قيد الإنشاء". The v2 seven-area shell is now live. | Users are sent to screens and names that no longer exist | Rewrite against the live `AREAS`; generate the screen map |
| G4 | One terminology | Guide terms differ from live UI labels (table 6.3); "ورديتي" appears in §1.4 against DESIGN.md §8; "التهيئة" names both system setup and new-hire onboarding | Support confusion, and translation drift later | Glossary (OWN-09) with the UI as the source |
| G5 | Release notes | None | Customers cannot see what changed or what they must do | REL-01 from the next deploy |
| G6 | White-label | Title names the company; the live URL and Best Gas examples are throughout; the white-label profile exists in code but not in docs | Docs cannot ship to a second customer | Company variables in every customer doc; screenshots from a demo company |
| G7 | Implementation playbook and migration templates | §5.7 import plus §25.2, scattered | No phases, owners, exit criteria or parallel run | IMP-01 to IMP-06 |
| G8 | Trust and legal set | None: no trust page, DPA, sub-processor list, SLA, status page, support policy or privacy notices | Enterprise buyers stop at security review | TRS-01 to TRS-10 |
| G9 | Legal register | Article citations exist, but a few are now wrong (see report: Art. 72) and many are flagged unverified, with no date or reviewer | Legal risk, and nothing safe to publish as a compliance map | OWN-12 register, then SAL-03 |
| G10 | Data dictionary | CLAUDE.md lists tab names only | Migration, PDPL records and support all lack a field list | OWN-03 generated |
| G11 | In-app help | Empty states and inline errors per DESIGN.md; 14 error codes still show "حدث خطأ" (§25.3.8) | No path from a screen to help | APP-01 to APP-05 |
| G12 | Training | None | Every customer is trained by hand by the owner | ACA-01 to ACA-04 |
| G13 | English | Guide is Arabic only; UI is bilingual | English-speaking HR and finance buyers get nothing | English after Arabic, per the tier rules |
| G14 | Internal vs public | Script properties, hashing schemes and round counts, the action index and deploy notes sit inside the user guide | Security over-disclosure if the guide is shared | Move to OWN-02 and OWN-11 (internal) |
| G15 | Versioning and freshness | One commit reference in the header; no "last verified" per section | Nobody can tell what is stale | Front matter per page; quarterly audit |

### 6.3 Terminology drift: the guide against the live UI (`index.html` labels)

| Concept | Guide says | Live UI says | Proposed single term |
|---|---|---|---|
| Time area | الحضور والورديات | الحضور والدوام | **الحضور والدوام** (keeps "الورديات" for the HR feature only) |
| Employee's own hours | ورديتي (§1.4) | دوامك (home) | **دوامك / دوامي** |
| Geofence | النطاقات | المواقع | **المواقع** (user-facing); "النطاق الجغرافي" only in admin reference |
| Live board | اللوحة المباشرة | لوحة اليوم | **لوحة اليوم** |
| Punch review | المراجعة | مراجعة البصمات | **مراجعة البصمات** |
| Approver inbox | صندوق الطلبات / بانتظاري | الموافقات | **الموافقات** |
| Audit log | السجل الأمني | سجل التدقيق | **سجل التدقيق** |
| New-hire plan | الانضمام | التهيئة | Decision needed (DOCS-PLAN §7): onboarding is **التهيئة**, and system bootstrap becomes **الإعداد الأول** |
| Pulse survey | استبيان النبض | نبض الموظفين | **نبض الموظفين** (area); "استبيان النبض" for the object |
| Expiring documents | الوثائق والانتهاء | وثائق تنتهي | **وثائق تنتهي** |
| Excel import | الاستيراد من Excel | استيراد | **استيراد** (page); "استيراد من Excel" (action) |
| Account area | حسابي | الحساب والأجهزة | **الحساب والأجهزة** |
| Discipline, injuries | المخالفات، الإصابات | علاقات العمل | **علاقات العمل** (area), with the two as sections |

---

## Sources

**Workday**
[wd-docs]: https://doc.workday.com/admin-guide/en-us/administrator-guide-release-notes/about-workday-documentation-relnotes.html
[wd-announce]: https://doc.workday.com/en-us/workday-documentation-announcements.html
[wd-rc]: https://doc.workday.com/admin-guide/en-us/about-workday-documentation/about-workday-release-notes/reference--workday-release-center.html
[wd-course]: https://doc.workday.com/workday-education/en-us/course-manuals/hcm-core-for-administrators/workday-tenants-and-tools.html
[wd-lang]: https://community-content.workday.com/en-us/public/learn/get-started/get-started-with-workday/languages.html
[wd-canvas-rtl]: https://canvas.workday.com/guidelines/globalization/rtl-and-bidi
[wd-pro]: https://community-content.workday.com/en-us/public/learn/training/workday-pro.html
[wd-train]: https://www.workday.com/en-us/services/training-certifications.html
[wd-trust]: https://www.workday.com/en-us/why-workday/trust/compliance.html
[wd-journeys]: https://www.workday.com/content/dam/web/en-us/documents/datasheets/workday-journeys-datasheet-enus.pdf
[wd-deploy]: https://get.kainos.com/rs/935-JPR-705/images/KainosWorkdayLaunchImplementationMethodologyv5.1.pdf

- Workday documentation: <https://doc.workday.com/admin-guide/en-us/administrator-guide-release-notes/about-workday-documentation-relnotes.html>
- Workday documentation announcements: <https://doc.workday.com/en-us/workday-documentation-announcements.html>
- Workday Release Center: <https://doc.workday.com/admin-guide/en-us/about-workday-documentation/about-workday-release-notes/reference--workday-release-center.html>
- Workday course manual: <https://doc.workday.com/workday-education/en-us/course-manuals/hcm-core-for-administrators/workday-tenants-and-tools.html>
- Workday languages: <https://community-content.workday.com/en-us/public/learn/get-started/get-started-with-workday/languages.html>
- Workday Canvas RTL and bidi: <https://canvas.workday.com/guidelines/globalization/rtl-and-bidi>
- Workday Pro: <https://community-content.workday.com/en-us/public/learn/training/workday-pro.html>
- Workday training and certifications: <https://www.workday.com/en-us/services/training-certifications.html>
- Workday compliance: <https://www.workday.com/en-us/why-workday/trust/compliance.html>
- Workday Journeys datasheet: <https://www.workday.com/content/dam/web/en-us/documents/datasheets/workday-journeys-datasheet-enus.pdf>
- Kainos, Workday Launch implementation method: <https://get.kainos.com/rs/935-JPR-705/images/KainosWorkdayLaunchImplementationMethodologyv5.1.pdf>

**SAP SuccessFactors**
[sap-rel]: https://help.sap.com/docs/SAP_SUCCESSFACTORS_RELEASE_INFORMATION
[sap-wnv]: https://help.sap.com/docs/successfactors-release-information/discovering-successfactors-changes-with-what-s-new-viewer-60550f77db4f4f7a877944080c45ae35/sap-successfactors-what-s-new-viewer
[sap-platform]: https://help.sap.com/docs/successfactors-platform
[sap-idp]: https://pages.community.sap.com/topics/successfactors/implementation-design-principles
[sap-lang]: https://help.sap.com/docs/successfactors-release-information/8e0d540f96474717bbf18df51e54e522/bedd8174405f4fa39e65608f55865a14.html
[sap-companion]: https://help.sap.com/docs/successfactors-platform/managing-sap-successfactors-user-experience/sap-companion-in-sap-successfactors
[sap-trust]: https://www.sap.com/about/trust-center.html
[sap-status]: https://www.sap.com/about/trust-center/cloud-service-status.html
[sap-learn]: https://learning.sap.com/courses/sap-successfactors-platform-introduction-academy/explaining-release-updates-and-the-what-s-new-viewer_b3e0901f-65ce-497d-bd55-dfde50fa4c6e
[sap-cert]: https://community.sap.com/t5/sap-learning-blog-posts/new-sap-successfactors-certifications-for-certified-individuals-in-sap-hcm/ba-p/13860451
[sap-dm]: https://help.sap.com/docs/successfactors-onboarding/implementing-onboarding/data-models-in-sap-successfactors

- Release information: <https://help.sap.com/docs/SAP_SUCCESSFACTORS_RELEASE_INFORMATION>
- What's New Viewer: <https://help.sap.com/docs/successfactors-release-information/discovering-successfactors-changes-with-what-s-new-viewer-60550f77db4f4f7a877944080c45ae35/sap-successfactors-what-s-new-viewer>
- Platform docs: <https://help.sap.com/docs/successfactors-platform>
- Implementation Design Principles: <https://pages.community.sap.com/topics/successfactors/implementation-design-principles>
- Languages and locales: <https://help.sap.com/docs/successfactors-release-information/8e0d540f96474717bbf18df51e54e522/bedd8174405f4fa39e65608f55865a14.html>
- SAP Companion: <https://help.sap.com/docs/successfactors-platform/managing-sap-successfactors-user-experience/sap-companion-in-sap-successfactors>
- Trust Center: <https://www.sap.com/about/trust-center.html>
- Cloud service status: <https://www.sap.com/about/trust-center/cloud-service-status.html>
- SAP Learning course: <https://learning.sap.com/courses/sap-successfactors-platform-introduction-academy/explaining-release-updates-and-the-what-s-new-viewer_b3e0901f-65ce-497d-bd55-dfde50fa4c6e>
- Certifications: <https://community.sap.com/t5/sap-learning-blog-posts/new-sap-successfactors-certifications-for-certified-individuals-in-sap-hcm/ba-p/13860451>
- Data models: <https://help.sap.com/docs/successfactors-onboarding/implementing-onboarding/data-models-in-sap-successfactors>

**Oracle HCM**
[ora-lib]: https://docs.oracle.com/en/cloud/saas/human-resources/index.html
[ora-impl]: https://docs.oracle.com/en/cloud/saas/human-resources/faigh/overview-of-implementing-global-human-resources.html
[ora-sa]: https://docs.oracle.com/en/cloud/saas/human-resources/20b/falzi/saudi-arabia.html
[ora-gosi]: https://docs.oracle.com/en/cloud/saas/human-resources/fahbo/overview-of-employee-gosi-details-for-saudi-arabia.html
[ora-tv]: https://docs.oracle.com/en/cloud/saas/human-resources/oedmh/hcm-tables-and-views.html
[ora-ready]: https://docs.oracle.com/en/cloud/saas/readiness/news.html
[ora-ogl]: https://www.oracle.com/education/guided-learning/
[ora-gj]: https://docs.oracle.com/en/cloud/saas/human-resources/faucf/guided-journeys-in-hcm-flows.html

- HR library: <https://docs.oracle.com/en/cloud/saas/human-resources/index.html>
- Implementing Global HR: <https://docs.oracle.com/en/cloud/saas/human-resources/faigh/overview-of-implementing-global-human-resources.html>
- Saudi Arabia chapter: <https://docs.oracle.com/en/cloud/saas/human-resources/20b/falzi/saudi-arabia.html>
- GOSI details: <https://docs.oracle.com/en/cloud/saas/human-resources/fahbo/overview-of-employee-gosi-details-for-saudi-arabia.html>
- Tables and Views for HCM: <https://docs.oracle.com/en/cloud/saas/human-resources/oedmh/hcm-tables-and-views.html>
- Cloud Readiness: <https://docs.oracle.com/en/cloud/saas/readiness/news.html>
- Guided Learning: <https://www.oracle.com/education/guided-learning/>
- Guided journeys: <https://docs.oracle.com/en/cloud/saas/human-resources/faucf/guided-journeys-in-hcm-flows.html>

**ADP, UKG, Rippling, BambooHR**
[adp-gs]: https://portal.adp.com/static/global/r8/GettingStartedOct10.pdf
[adp-ag]: https://portal.adp.com/static/global/r8/PortalAG_V2%200and2%200%201_Mar_13.pdf
[adp-dev]: https://developers.adp.com/
[ukg-plc]: https://community.ukg.com/s/pro-learning-center
[ukg-dev]: https://developer.ukg.com/general/docs/welcome-to-the-ukg-developer-hub
[ukg-api]: https://developer.ukg.com/hcm/reference/welcome-to-the-ukg-pro-api
[ukg-trust]: https://trustcenter.ukg.com/
[ukg-cert]: https://support.learning.ukg.com/hc/en-us/articles/21538081246487-My-Certificates
[rip-dev]: https://developer.rippling.com/
[rip-trust]: https://trust.rippling.com/
[rip-security]: https://www.rippling.com/trust/security
[rip-help]: https://help.rippling.com/article?articleId=11506693330
[bhr-api]: https://documentation.bamboohr.com/docs/getting-started
[bhr-api-changes]: https://documentation.bamboohr.com/docs/past-changes-to-the-api
[bhr-webhooks]: https://documentation.bamboohr.com/docs/webhooks
[bhr-trust]: https://trust.bamboohr.com/
[bhr-security]: https://www.bamboohr.com/legal/security
[bhr-dpa]: https://www.bamboohr.com/legal/data-processing-agreement
[bhr-updates]: https://www.bamboohr.com/product-updates/custom-tab-builder
[bhr-import]: https://partners.bamboohr.com/wp-content/uploads/2015/04/New-Import-Documentation.doc

- ADP getting started: <https://portal.adp.com/static/global/r8/GettingStartedOct10.pdf>
- ADP admin guide: <https://portal.adp.com/static/global/r8/PortalAG_V2%200and2%200%201_Mar_13.pdf>
- ADP developers: <https://developers.adp.com/>
- UKG Pro Learning Center: <https://community.ukg.com/s/pro-learning-center>
- UKG Developer Hub: <https://developer.ukg.com/general/docs/welcome-to-the-ukg-developer-hub>
- UKG Pro API: <https://developer.ukg.com/hcm/reference/welcome-to-the-ukg-pro-api>
- UKG Trust Center: <https://trustcenter.ukg.com/>
- UKG certificates: <https://support.learning.ukg.com/hc/en-us/articles/21538081246487-My-Certificates>
- Rippling developers: <https://developer.rippling.com/>
- Rippling trust: <https://trust.rippling.com/>
- Rippling security: <https://www.rippling.com/trust/security>
- Rippling help article: <https://help.rippling.com/article?articleId=11506693330>
- BambooHR API: <https://documentation.bamboohr.com/docs/getting-started>
- BambooHR API changes: <https://documentation.bamboohr.com/docs/past-changes-to-the-api>
- BambooHR webhooks: <https://documentation.bamboohr.com/docs/webhooks>
- BambooHR Trust Center: <https://trust.bamboohr.com/>
- BambooHR security: <https://www.bamboohr.com/legal/security>
- BambooHR DPA: <https://www.bamboohr.com/legal/data-processing-agreement>
- BambooHR product update: <https://www.bamboohr.com/product-updates/custom-tab-builder>
- BambooHR import guide (partner, older): <https://partners.bamboohr.com/wp-content/uploads/2015/04/New-Import-Documentation.doc>

**HiBob, Personio, Deel**
[hb-hub]: https://www.hibob.com/customer-hub/
[hb-api]: https://apidocs.hibob.com/
[hb-trust]: https://www.hibob.com/privacy/hibobs-trust-center-update/
[hb-status]: https://status.hibob.io/
[hb-help]: https://help.hibob.com/hc/en-us/articles/4409792452113-Update-an-employee-profile
[hb-impl]: https://www.hibob.com/blog/customized-implementation-process/
[hb-migration]: https://www.hibob.com/blog/hris-migration/
[hb-roadmap]: https://www.hibob.com/webinars/q2-26-product-roadmap-webinar/
[per-voyage]: https://community.personio.com/community-news-announcements-140/voyage-by-personio-help-center-community-and-academy-2272
[per-impl]: https://www.personio.com/implementation/
[per-payroll]: https://support.personio.de/hc/en-us/articles/13859952063261-Personio-Payroll-Implementation-Overview
[per-api]: https://support.personio.de/hc/en-us/articles/209328509-Overview-of-Personio-public-APIs
[per-security]: https://www.personio.com/security/
[deel-pin]: https://www.deel.com/blog/more-support-is-on-the-way/
[deel-status]: https://status.deel.com/
[deel-academy]: https://help.letsdeel.com/hc/en-gb/articles/36344491808145-Getting-Started-with-Deel-Academy
[deel-security]: https://www.deel.com/security/

- HiBob Customer Hub: <https://www.hibob.com/customer-hub/>
- HiBob API docs: <https://apidocs.hibob.com/>
- HiBob Trust Center: <https://www.hibob.com/privacy/hibobs-trust-center-update/>
- HiBob status: <https://status.hibob.io/>
- HiBob help article: <https://help.hibob.com/hc/en-us/articles/4409792452113-Update-an-employee-profile>
- HiBob implementation: <https://www.hibob.com/blog/customized-implementation-process/>
- HiBob migration checklist: <https://www.hibob.com/blog/hris-migration/>
- HiBob roadmap webinar: <https://www.hibob.com/webinars/q2-26-product-roadmap-webinar/>
- Personio Voyage: <https://community.personio.com/community-news-announcements-140/voyage-by-personio-help-center-community-and-academy-2272>
- Personio implementation: <https://www.personio.com/implementation/>
- Personio payroll implementation: <https://support.personio.de/hc/en-us/articles/13859952063261-Personio-Payroll-Implementation-Overview>
- Personio APIs: <https://support.personio.de/hc/en-us/articles/209328509-Overview-of-Personio-public-APIs>
- Personio security: <https://www.personio.com/security/>
- Deel in-app help: <https://www.deel.com/blog/more-support-is-on-the-way/>
- Deel status: <https://status.deel.com/>
- Deel Academy: <https://help.letsdeel.com/hc/en-gb/articles/36344491808145-Getting-Started-with-Deel-Academy>
- Deel security: <https://www.deel.com/security/>

**Gulf and Saudi players**
[jisr-help]: https://jisr.zendesk.com/hc/ar-sa/articles/13764986494737-%D8%A7%D9%84%D8%A3%D8%B3%D8%A6%D9%84%D8%A9-%D8%A7%D9%84%D8%B4%D8%A7%D8%A6%D8%B9%D8%A9-%D8%A7%D9%84%D8%B9%D8%A7%D9%85%D8%A9
[jisr-academy]: https://www.jisr.net/en/academy
[jisr-security]: https://www.jisr.net/en/security
[jisr-trust]: https://trustcenter.jisr.net/
[jisr-blog]: https://blog.jisr.net/ar/introductory-guide-mudad
[jisr-cs]: https://www.jisr.net/ar/why-jisr/customer-service-and-system-setup
[zen-kb]: https://zenhrsolutions.freshdesk.com/en/support/solutions
[zen-law]: https://zenhrsolutions.freshdesk.com/en/support/solutions/articles/43000793464-saudi-arabia-labor-law-full-reference-mapped-to-zenhr-features
[zen-api]: https://developer.zenhr.com/2019/04/29/api-documentation.html
[bay-help]: https://bayzathelp.zendesk.com/hc/en-gb
[bay-article]: https://help.bayzat.com/en/articles/4837882-ecards
[mena-train]: https://menaitech.com/en/training-programs/
[palm-kc]: https://palmhr.crisp.help/en/

- Jisr FAQ (Arabic help centre): <https://jisr.zendesk.com/hc/ar-sa/articles/13764986494737-%D8%A7%D9%84%D8%A3%D8%B3%D8%A6%D9%84%D8%A9-%D8%A7%D9%84%D8%B4%D8%A7%D8%A6%D8%B9%D8%A9-%D8%A7%D9%84%D8%B9%D8%A7%D9%85%D8%A9>
- Jisr Academy: <https://www.jisr.net/en/academy>
- Jisr security: <https://www.jisr.net/en/security>
- Jisr Trust Center: <https://trustcenter.jisr.net/>
- Jisr Mudad guide (Arabic): <https://blog.jisr.net/ar/introductory-guide-mudad>
- Jisr service and setup (Arabic): <https://www.jisr.net/ar/why-jisr/customer-service-and-system-setup>
- ZenHR knowledge base: <https://zenhrsolutions.freshdesk.com/en/support/solutions>
- ZenHR Saudi labour-law map: <https://zenhrsolutions.freshdesk.com/en/support/solutions/articles/43000793464-saudi-arabia-labor-law-full-reference-mapped-to-zenhr-features>
- ZenHR API: <https://developer.zenhr.com/2019/04/29/api-documentation.html>
- Bayzat help centre: <https://bayzathelp.zendesk.com/hc/en-gb>
- Bayzat help article: <https://help.bayzat.com/en/articles/4837882-ecards>
- Menaitech training programmes: <https://menaitech.com/en/training-programs/>
- Palm HR Knowledge Center: <https://palmhr.crisp.help/en/>

**Frameworks, writing and UX**
[dia]: https://diataxis.fr/
[dia-how]: https://diataxis.fr/how-to-use-diataxis/
[dia-ref]: https://diataxis.fr/reference/
[g-style]: https://developers.google.com/style/highlights
[ms-top10]: https://learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice
[ms-loc]: https://learn.microsoft.com/en-us/globalization/reference/microsoft-style-guides
[ms-ar]: https://aka.ms/arabic-styleguide
[baianat]: https://www.baianat.com/ar/books/arabic-content-writing-guide/writing-rules
[uxw-ar]: https://github.com/UX-Writing/Content-Style-Guide-in-Arabic
[dga-content]: https://dga.gov.sa/sites/default/files/2022-08/The%20Guideline%20of%20Digital%20Content%20of%20Government%20Website.pdf
[dga-ds]: https://oss.dga.gov.sa/en/products/dga-ac319-national-design-system
[nng-tut]: https://www.nngroup.com/articles/onboarding-tutorials/
[nng-empty]: https://www.nngroup.com/articles/empty-state-interface-design/

- Diátaxis: <https://diataxis.fr/>
- Diátaxis, how to use it: <https://diataxis.fr/how-to-use-diataxis/>
- Diátaxis, reference: <https://diataxis.fr/reference/>
- Google developer style highlights: <https://developers.google.com/style/highlights>
- Microsoft top 10 tips: <https://learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice>
- Microsoft localisation style guides: <https://learn.microsoft.com/en-us/globalization/reference/microsoft-style-guides>
- Microsoft Arabic style guide: <https://aka.ms/arabic-styleguide>
- Baianat Arabic content guide: <https://www.baianat.com/ar/books/arabic-content-writing-guide/writing-rules>
- UX Writing بالعربية style guide: <https://github.com/UX-Writing/Content-Style-Guide-in-Arabic>
- DGA digital content guideline: <https://dga.gov.sa/sites/default/files/2022-08/The%20Guideline%20of%20Digital%20Content%20of%20Government%20Website.pdf>
- DGA national design system: <https://oss.dga.gov.sa/en/products/dga-ac319-national-design-system>
- NN/g, onboarding tutorials vs contextual help: <https://www.nngroup.com/articles/onboarding-tutorials/>
- NN/g, empty states: <https://www.nngroup.com/articles/empty-state-interface-design/>
- Checked and not used: Mozilla Arabic style guide <https://mozilla-l10n.github.io/styleguides/ar/>

**Saudi law, privacy and security**
[pdpl-12]: https://saudiprivacylaw.com/saudi-pdpl-article-12-privacy-policy-obligations/
[pdpl-ir]: https://governancedocs.com/saudi-pdpl-implementing-regulations/
[dla]: https://www.dlapiperdataprotection.com/?c=SA
[ccc]: https://securitywall.co/blog/ccc-cloud-cybersecurity-controls-saudi-arabia
[hrsd-disc]: https://www.hrsd.gov.sa/en/knowledge-centre/articles/64405
[chambers]: https://chambers.com/articles/recent-amendments-to-the-kingdom-of-saudi-arabia-labour-law-a-comprehensive-overview
[saudicounsel-72]: https://saudicounsel.com/2025/12/28/%D8%A7%D9%84%D9%85%D8%A7%D8%AF%D8%A9-72-%D9%85%D9%86-%D9%86%D8%B8%D8%A7%D9%85-%D8%A7%D9%84%D8%B9%D9%85%D9%84/
[alfawaz-71]: https://alfawazco.com/Library/%D8%A7%D9%84%D9%85%D8%A7%D8%AF%D8%A9-71-%D9%85%D9%86-%D9%86%D8%B8%D8%A7%D9%85-%D8%A7%D9%84%D8%B9%D9%85%D9%84-%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A-%D8%A7%D9%84%D8%AA%D8%AD%D9%82%D9%8A%D9%82/
[owasp]: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

- PDPL Art. 12 summary: <https://saudiprivacylaw.com/saudi-pdpl-article-12-privacy-policy-obligations/>
- PDPL implementing regulations (secondary): <https://governancedocs.com/saudi-pdpl-implementing-regulations/>
- DLA Piper, Saudi Arabia: <https://www.dlapiperdataprotection.com/?c=SA>
- NCA CCC-2:2024 summary (secondary): <https://securitywall.co/blog/ccc-cloud-cybersecurity-controls-saudi-arabia>
- HRSD, disciplinary sanctions (Art. 72 grievance periods): <https://www.hrsd.gov.sa/en/knowledge-centre/articles/64405>
- Chambers, 2025 labour-law amendments: <https://chambers.com/articles/recent-amendments-to-the-kingdom-of-saudi-arabia-labour-law-a-comprehensive-overview>
- Saudi Counsel, Art. 72 (Arabic): <https://saudicounsel.com/2025/12/28/%D8%A7%D9%84%D9%85%D8%A7%D8%AF%D8%A9-72-%D9%85%D9%86-%D9%86%D8%B8%D8%A7%D9%85-%D8%A7%D9%84%D8%B9%D9%85%D9%84/>
- Al Fawaz, Art. 71 (Arabic): <https://alfawazco.com/Library/%D8%A7%D9%84%D9%85%D8%A7%D8%AF%D8%A9-71-%D9%85%D9%86-%D9%86%D8%B8%D8%A7%D9%85-%D8%A7%D9%84%D8%B9%D9%85%D9%84-%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A-%D8%A7%D9%84%D8%AA%D8%AD%D9%82%D9%8A%D9%82/>
- OWASP password storage: <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>
