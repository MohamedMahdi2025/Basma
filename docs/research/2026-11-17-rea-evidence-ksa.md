# KSA/GCC HRIS benchmark for the BASMA redesign (public evidence, retrieved 2026-11-17)

**Method and limits.** Store figures come from the public Saudi App Store and Google Play listings. Review themes come from the most recent written Saudi App Store reviews, which skew far more negative than star averages. Capterra, G2, Software Advice, GetApp and Jisr's help centre returned 403, so admin-side review evidence is missing. "Not stated" means not publicly stated, not absent. "Sowlutions" could not be found as an HR vendor. No official Qiwa or Mudad employer app was verified; one App Store "Qiwa" listing is sold by an individual and was excluded [26].

## 1. Comparison table

| Product | Positioning / size | Navigation (from marketing site and store screenshots) | Attendance | Gov integrations publicly claimed | Arabic / Hijri | Public pricing | iOS SA / Play rating |
|---|---|---|---|---|---|---|---|
| **Jisr** | Saudi-first; small to enterprise; "5000+" teams [3] | Three suites: Core HR, Talent, Spend [3]. Store shots are marketing slides with a hamburger menu and check-in card; in-app nav unverified [1] | Geofence, fingerprint device, manual [1]; face/QR not stated | GOSI, Saned, Muqeem, Mudad [3][5]. Qiwa is inconsistent: "soon" on two pages [3][5], claimed on another [6]. Absher, Tameeni, Nafath not stated | Arabic listing copy, but English screenshots even in Arabic locale [1]. Hijri not stated | Quote only; Monshaat offer from SAR 3,000/yr up to 49 staff [4] | 4.61 (51,003) [1] / 4.64 (42,177; 500K+) [2] |
| **ZenHR** | Multi-country MENA (11 countries); single branch to multi-entity [7][8] | Tile dashboard, 2 tabs plus centre action button; fully mirrored in Arabic [10] | GPS, optional geofence, biometric devices (ZKTeco), web [7][9]; QR on KSA page only [7] | GOSI calc, Mudad WPS file, Muqeem [7][9]. Qiwa/Nitaqat "native" on KSA page [7], but FAQ mentions Qiwa only for checking Nitaqat [9] | AR+EN app [7]. Hijri claimed only by a third party [20]; screenshots show Gregorian only [10] | Conflict: FAQ says from $8/user/month billed annually [9]; pricing page says quote per organization [8] | 4.25 (1,101) [10] / 4.52 (6,985; 100K+) [11] |
| **Bayzat** | UAE-origin HR + payroll + insurance; 11–300+ staff [13] | Hamburger, quick-action row, social feed [14] | GPS, biometric devices, face with liveness, web, manual [12] | GOSI, WPS, MHRSD contract alignment [12]; Mudad, Nitaqat on its blog [13]; Muqeem per search results (not fetched) | AR app language, but Saudi listing copy returned in English [14]. Hijri not stated | None | 3.52 (56) [14] / 4.54 (914; 100K+) [15] |
| **PalmHR** | Saudi-founded SME tool; site now leads with UAE [16] | Modules People/Time/Pay; in-app nav unverified [16][18] | Mobile check-in; CAMS/ZKTeco add-on [17] | GOSI, Mudad, Muqeem per executives [19]; current site body does not name them [16] | AR app language; listing copy in English [18]. Hijri not stated | Only AED 1,000/yr starter (15 staff) shown; no KSA price [17] | 3.41 (131) [18] / 4.17 (244; 10K+) [18] |
| **Menaitech (MenaME-Plus)** | Jordan-based, legacy enterprise payroll; MenaSME lite [21] | Icon-wheel menus, chatbot; shots show 2021 dates and JOD data [22] | Map-based mobile punch [21] | "Compliant" with WPS, GOSI, Mudad [21]; Muqeem, Qiwa not stated. A competitor rates it partial (unverified) [13] | Arabic captions over English UI in shots [22]. Hijri not stated | None | 3.14 (973) [22] / 4.29 (6,238; 500K+) [22] |
| **KayanHR** | Cloud HR, all sizes | Unverified | Unverified | Unverified | Unverified | None | 3.15 (75) / 4.04 (658; 100K+) [23] |
| **Idaratech HR** | Attendance-led ESS | Live status widget [24] | Geofence, Wi-Fi clock-in, Face/Touch ID [24] | Not stated | Not stated | None | 4.34 (372) [24] |
| **Daftra ESS** | Add-on to accounting suite | Unverified | Unverified | Unverified | AR+EN listed | None | 4.76 (113) [25] |
| **Mudad / Qiwa** (state platforms) | WPS and payroll; contracts, permits, Nitaqat | Web portals | n/a | Mudad matches wage files to GOSI and shares with Qiwa [27]; Qiwa contract documentation is mandatory [28] | Arabic-first | Compliance file free; paid payroll tier roughly SAR 460–920/yr by headcount (consultancy-sourced; sources differ above 1,000 staff) [27][29] | No official app verified [26] |
| **SAP SuccessFactors** | Global enterprise | n/a | n/a | n/a | Dual Hijri display exists [30], with open gaps: no Hijri in document templates [31], mixed Arabic/English values reorder [32], some date fields stay Gregorian [33] | n/a | 4.73 (5,239) [34] |
| **Oracle Fusion HCM** | Global enterprise | n/a | n/a | n/a | Auto-converts date of birth to Hijri for Saudi employers [35]; users report one-day mismatches [36] | n/a | 2.78 (95) [34] |
| **Workday** | Global enterprise | n/a | n/a | n/a | Arabic/RTL and Hijri unverified | n/a | 4.80 (2,065) [34] |

Malachite appears in one Saudi listicle with local hosting and GOSI/Muqeem/Mudad claims; not independently verified [20].

## 2. What Saudi buyers value most and least

**Employees (strongest evidence).**
- **The punch must work, every time.** This is the dominant complaint in every app with enough reviews. Jisr reviewers report freezes at clock-out, punches that vanish later, and being shown out of range while on site after an update [1]. MenaME reviewers report wrong locations, reversed in/out logs and broken missing-punch requests; 41 of its 50 most recent written reviews are one star [22]. PalmHR reviewers report repeated punch failures and location-permission loops [18].
- **Getting in without friction.** Complaints cover login codes not arriving (Jisr [1]), forced re-login and password loops (MenaME [22]), and repeated Face ID prompts (ZenHR [10]).
- **Stability over novelty.** Jisr reviewers resent periodic interface overhauls and updates that regress [1]; PalmHR reviewers say frequent updates change nothing [18].
- **Correct, explainable balances and deductions.** ZenHR reviewers report leave-balance errors and requests routed to the wrong manager [10]. Jisr reviewers ask where the deduction policy is shown and for a missing emergency-leave balance [1]. Bayzat's latest release adds a view of pay additions and deductions and marks edited punches, so this is becoming table stakes [14].
- **Guarding against mistakes.** A Jisr reviewer lost annual leave twice to a one-tap cancel [1].
- **Praise** is short and consistent: smooth, easy, everything in one place (Jisr, ZenHR, PalmHR five-star reviews) [1][10][18].
- **Policy versus software.** Many one-star reviews attack the employer's rules (deductions, compulsory punching) rather than the app [1][22]. The app is the face of the policy, and it takes the blame.

**HR managers and owners (thinner evidence).**
- **Government compliance is the headline purchase driver.** Every vendor leads with GOSI, Mudad and Muqeem [3][7][12][21], and Qiwa–Mudad mismatches are a known pain [27].
- **Support responsiveness.** Reviewers on ZenHR, Bayzat and PalmHR criticise post-sale support; one PalmHR reviewer praises in-app replies within seconds [10][14][18].
- **Price is opaque.** Almost everything is quote-only [4][8][17]; Jisr's Monshaat bundle shows small firms are price-led [4].
- **Web/mobile parity.** PalmHR reviewers say they must fall back to the website [18].

**Valued least (inference, not measured).** Wellness points, social feeds, birthdays and chatbots are promoted by vendors [14][10][22] but are absent from praise. Single requests for dark mode, Siri and Apple Watch appear, but they are not themes [1][10][22].

Thin samples: Bayzat (2 written Saudi reviews) and PalmHR (19 across four years) cannot support firm conclusions [14][18].

## 3. Arabic/RTL practice: what the evidence shows

Competitor evidence is limited to store screenshots, so this section leans on standards.

- **Full mirroring is the minimum, and it is not universal.** ZenHR's Arabic screenshots mirror layout, chevrons and tab order [10]. Jisr ships English screenshots under the Arabic locale [1]; MenaME puts Arabic captions over English screens [22]; Bayzat's and PalmHR's Saudi listing copy came back in English [14][18].
- **Numerals.** ZenHR's Arabic UI uses European digits throughout [10]. W3C notes Arabic-Indic digits are the regional convention in Saudi Arabia, and the two digit families have different bidi behaviour, so mixing them changes ordering [37]. Pick one family per surface; offer a user setting.
- **Dates.** ZenHR's Arabic screens show an English "8 May, 2024" beside Arabic month names in English order, and no Hijri [10]. Enterprise suites treat dual Hijri/Gregorian display as a setting [30][38], yet SAP still lacks Hijri in generated documents [31]. Oracle users report one-day drift, which argues for the Umm al-Qura calendar plus an override [35][36].
- **Mixed-direction text.** SAP documents Arabic and English values reordering in one field [32]. W3C recommends isolating each embedded run (names, IDs, IBANs, amounts) rather than using older embedding controls [37].
- **Typography.** Arabic needs more line height than Latin, and tracking must not separate joined letters [37]. The state design system (Platforms Code) standardises government interfaces; its typeface and Hijri rules could not be retrieved [39].
- **Currency.** SAMA's rules put the riyal symbol to the left of the number with a space, in all languages [40]. Jisr's mock payslip uses "SAR" text, which is permitted [1].
- **Bilingual documents.** No competitor publicly documents bilingual payslips or letters. One MenaME reviewer reports Arabic printing as unreadable symbols [22]; a Jisr reviewer reports Arabic typing disappearing in a field [1].
- **Untranslated remnants.** ZenHR's Arabic home screen still shows an English leave-type label [10].

## 4. Opportunities for BASMA (each tied to a reviewer complaint)

1. **Punch reliability as the brand promise.** Show a live accuracy reading before the punch (ZenHR already does [10]), queue offline, and give a visible receipt with time and location. Reviewers complain of vanished punches [1][22].
2. **Explain "out of range".** Show distance to the site boundary, a retry, and a one-tap exception request with evidence. Reviewers complain of false out-of-range results [1][22].
3. **Passkey sign-in that never loops.** BASMA already has passkeys; make it the visible difference against OTP failures and re-login loops [1][22][10].
4. **Smart punch reminders** on arrival and at shift end. A recent Jisr reviewer asks for exactly this [1].
5. **Show the rule beside the deduction.** Each late or absence deduction links to the policy clause, the punch record and an appeal. Reviewers complain the policy is invisible [1]; Bayzat is moving here [14].
6. **Undo and confirm on destructive actions.** Reviewers complain of accidental leave cancellation [1].
7. **Calm release discipline.** Stable navigation, opt-in previews and readable release notes. Reviewers complain of UI churn; competitors' notes say only "fixes" [1][18].
8. **True Arabic-first surface.** Arabic store screenshots, no English remnants, one digit family, isolated mixed text. Most rivals fall short on at least one [1][10][14][18][22].
9. **Dual Hijri/Gregorian everywhere, including PDFs.** Even SAP has a gap in generated documents [31].
10. **Bilingual payslips and letters that print correctly.** Reviewers complain of garbled Arabic output [22].
11. **Published pricing and in-app support with a response clock.** Reviewers complain about support; no rival publishes a clear Saudi price [4][8][10][14][18].
12. **Qiwa-to-payroll mismatch warnings before the Mudad file.** BASMA already reconciles; surface it as a pre-payroll check, since vendor Qiwa claims are inconsistent [3][6][27].

## References

1. Jisr HR, App Store SA: https://apps.apple.com/sa/app/id1129820762
2. Jisr HR, Google Play: https://play.google.com/store/apps/details?id=ess.android&gl=SA
3. https://www.jisr.net/en/features
4. https://www.jisr.net/en/pricing
5. https://jisr.net/en/mudad-integration
6. https://www.jisr.net/en/lp-compliance
7. https://www.zenhr.com/en/hrms-saudi-arabia
8. https://www.zenhr.com/en/zenhr-pricing
9. https://www.zenhr.com/en/faqs
10. ZenHR, App Store SA: https://apps.apple.com/sa/app/id1376637090
11. ZenHR, Google Play: https://play.google.com/store/apps/details?id=com.zenhr&gl=SA
12. https://www.bayzat.com/ksa/hr-software
13. https://www.bayzat.com/blog/bayzat-vs-menaitech-which-hr-software-is-right-for-your-business-in-saudi-arabia/ (competitor claims)
14. Bayzat, App Store SA: https://apps.apple.com/sa/app/id1057593226
15. Bayzat, Google Play: https://play.google.com/store/apps/details?id=com.bayzat.benefits&gl=SA
16. https://www.palmhr.net/en
17. https://www.palmhr.net/en/pricing
18. PalmHR: https://apps.apple.com/sa/app/id1517422977 and https://play.google.com/store/apps/details?id=com.palmhr&gl=SA
19. https://cairoscene.com/Business/Saudi-HR-Tech-Company-palm-hr-Expands-Into-Egypt-UAE
20. https://www.wafeq.com/en/business-hub/for-business/best-hr-management-software-in-saudi-arabia
21. https://landing.menaitech.com/saudi-hr-system
22. MenaME Plus: https://apps.apple.com/sa/app/id1605759540 and https://play.google.com/store/apps/details?id=com.menaitech.mename&gl=SA
23. KayanHR: https://apps.apple.com/sa/app/id1539212937 and https://play.google.com/store/apps/details?id=com.uba.kayanhr&gl=SA
24. Idaratech HR: https://apps.apple.com/sa/app/id6478585872
25. Daftra ESS: https://apps.apple.com/sa/app/id1632210042
26. Excluded unofficial listing: https://apps.apple.com/sa/app/id6758589732
27. https://mercans.com/glossary/mudad-payroll-platform/ (secondary)
28. https://www.clydeco.com/en/insights/2023/05/electronic-employment-contracts-through-qiwa
29. https://noblecoreksa.com/mudad-platform-guide-saudi/ (secondary)
30. https://userapps.support.sap.com/sap/support/knowledge/en/3294062
31. https://userapps.support.sap.com/sap/support/knowledge/en/3465683
32. https://userapps.support.sap.com/sap/support/knowledge/en/3785593
33. https://userapps.support.sap.com/sap/support/knowledge/en/3297546
34. SAP, Workday, Oracle apps: https://apps.apple.com/sa/app/id426562526 , https://apps.apple.com/sa/app/id316800034 , https://apps.apple.com/sa/app/id1361813677
35. https://docs.oracle.com/en/cloud/saas/readiness/hcm/25d/payr-25d/25D-payroll-wn-f41090.htm
36. https://community.oracle.com/customerconnect/discussion/833999/how-to-resync-arabic-hijrah-calendar-in-oracle-fusion
37. W3C Arabic Layout Requirements: https://www.w3.org/TR/alreq/
38. https://docs.infor.com/ghrtm/2026.x/en-us/ghrtmolh/ghrtmghrug/nnj1539030596397.html
39. https://cairoscene.com/Buzz/Platform-Code-Launched-to-Standardise-Digital-Government-Services ; https://design.dga.gov.sa/ (content not retrievable)
40. https://www.sama.gov.sa/ar-sa/Currency/SRS/Documents/Guidelines.pdf ; https://www.arabianbusiness.com/industries/banking-finance/saudi-arabia-announces-new-rules-for-use-of-riyal-symbol

Downloaded listing screenshots (reference only, not for reuse) are in `C:\Users\User\AppData\Local\Temp\claude\df0a32c75542766c\8c562c27-9e80-4416-9566-11852d3a9e0b\scratchpad\shots` and `C:\Users\User\AppData\Local\Temp\claude\df0a32c75542766c\8c562c27-9e80-4416-9566-11852d3a9e0b\scratchpad\shots_ar`.
