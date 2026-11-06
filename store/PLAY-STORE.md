# BASMA on Google Play: what is ready and what the owner does

Build: **1.4.0 (versionCode 5)**, package `sa.bestgas.attendance`, signed with the company release key.

## Technical requirements (checked 2026-11-06)

| Play requirement | Status |
|---|---|
| Android App Bundle (.aab) for new apps | `dist/basma-android-1.4.0.aab` |
| Target API level (new apps must target a recent Android) | targetSdk **36** (Android 16) |
| 16 KB memory page size (Android 15+) | passes `zipalign -c -P 16`; no native libraries |
| Signing | APK Signature Scheme v2 + v3, one signer, not a debug key |
| Permissions | internet, network state, **foreground** location only (no background location, so no location declaration video) |
| Exported components | launcher only (security test) |
| Android Lint | 0 errors, 0 security warnings (ANDROID_ID used for fraud prevention, allowed, documented in code) |
| Our APK security suite | 28/28 (`node tests/apk-security.js`) |
| Privacy policy reachable in the app and on the web | https://mohamedmahdi2025.github.io/privacy.html (link on the sign-in screen) |
| Account deletion (web link required) | https://mohamedmahdi2025.github.io/delete-account.html (link on the sign-in screen) |
| Ads | none |

## Store listing assets (this folder)

- App icon 512 x 512: `icon-512.png`
- Feature graphic 1024 x 500: `feature-1024x500.png`
- Phone screenshots 540 x 1080: `phone-signin.png`, `phone-hub.png` (add 2-6 more from a real phone after sign-in:
  home, check-in, requests, payslip; Play wants 2 to 8)

### Text

- **App name (30):** بصمة BASMA: الحضور والموارد
- **Short description (80):** تسجيل الحضور بلمسة ورمز سري، والإجازات والطلبات والرواتب في مكان واحد.
- **Full description:**
  بصمة منصة حضور وموارد بشرية للشركات في المملكة. يسجل الموظف حضوره وانصرافه من موقع العمل بلمسة واحدة محمية برمزه السري،
  ويقدم طلبات الإجازة والخطابات والسلف ويتابعها، ويرى قسيمة راتبه ورصيد إجازاته. يرى المدير فريقه ويعتمد طلباتهم، وتدير الموارد
  البشرية الموظفين والرواتب والتقارير.
  - حضور بالموقع الجغرافي عند الضغط فقط، دون تتبع في الخلفية
  - جهاز واحد لكل موظف، فلا يسجل أحد الحضور عن غيره
  - إجازات وطلبات وخطابات بأرقام مرجعية وسلسلة اعتماد
  - قسيمة الراتب ورصيد الإجازات
  - عربي وإنجليزي
  الحساب ينشئه صاحب العمل؛ اطلب رمز التفعيل من الموارد البشرية في شركتك.
- **Category:** Business. **Tags:** attendance, HR.
- **Contact e-mail:** the owner's support address (required; it is also what the privacy and deletion pages point to).

## Data safety form (answers)

- Does the app collect or share user data? **Yes, collects; does not share** with third parties.
- Is all data encrypted in transit? **Yes** (HTTPS only, cleartext off).
- Can users request deletion? **Yes** (the deletion page above).
- Data types collected (all "required", purpose "App functionality" + "Fraud prevention, security and compliance"; none for ads or analytics):
  - **Location: precise location**, collected only when the user checks in or out.
  - **Personal info: name, e-mail address, other info (employee number)**, provided by the employer.
  - **Financial info: other (salary and payslips)**, visible to the employee and authorised HR/payroll.
  - **App activity: other user-generated content (requests, leave)**.
  - **Device or other IDs**: a hashed app-scoped device ID (fraud prevention).
- Not collected: contacts, photos, camera, microphone, health, messages, browsing history, advertising ID.

## Other Play Console forms

- **Content rating:** questionnaire category "Utility, productivity, communication"; no violence, gambling, user-to-user chat
  with strangers or location sharing with other users → rated Everyone / 3+.
- **Target audience:** 18 and over (it is a work app). Not designed for children.
- **App access:** reviewers cannot sign in without an employer account. Give Play a demo organisation, employee number
  and activation code (create a demo employee in the Hub, issue a code just before submitting; it lasts 72 hours) and
  write the steps: "Choose Activate, enter Org ID, number and code, pick any 6-digit PIN".
- **Government apps / financial features:** no. **News app:** no. **Health:** no.
- **Ads declaration:** no ads.

## Steps only the owner can do

1. Create the Google Play developer account (one-time fee; an organisation account needs the company's D-U-N-S number).
   New personal accounts must run a closed test with at least 12 testers for 14 days before production.
2. Create the app, keep **Play App Signing** on, and upload `basma-android-1.4.0.aab` to a testing track.
3. Fill the listing, Data safety, content rating, target audience and app access forms with the text above.
4. Send for review. Keep the signing key (`../signing/`) backed up: it is the upload key for every future version.
