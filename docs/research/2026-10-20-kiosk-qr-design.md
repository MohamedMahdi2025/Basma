# Office kiosk QR check-in: research and design

Date: 2026-10-20. Status: built and tested (tests/run.js "Office kiosk QR check-in", sim50 matrix).

## 1. The problem

The phone's GPS is weak inside the head office. Indoors an iPhone often reports 65-200 m accuracy, or no fix at
all when Location Services or Safari Websites is off. The geofence then refuses a person who is standing at their
desk. Their options were to walk outside, ask HR for a manual correction, or use the native wrapper. Every one of
those costs time at 07:30, the busiest minute of the day.

The goal is a second proof of presence that works indoors, keeps every fraud guard the geofence gives, and needs
no new hardware beyond a cheap tablet.

## 2. What the leading systems do (public evidence only)

| System | How the QR works | What it proves | Weakness noted |
|---|---|---|---|
| Workday Time Clock / kiosk apps (cloudapper.ai write-up) | Shared tablet; the employee signs in on the tablet (badge, PIN or face) | Presence at the tablet | Buddy punching on a shared device; the tablet must be managed |
| ClayHR kiosk application (clayhr.com) | Tablet kiosk; the employee scans their own badge QR at the kiosk | Presence at the kiosk | A static badge QR can be photographed and used by a colleague |
| TramitApp kiosk QR (ayuda.tramitapp.com) | Kiosk shows a QR; the employee scans it with the company app | Presence near the screen | Their help pages describe a refreshing code, but not the interval or how it is bound to the device |
| WorkSmarter check-ins (worksmarter.co.uk) | Fixed QR posters at sites; scanning records the site | Visit to a site | A static poster can be photographed once and reused from home |
| BlueEyes SwipePoint manual (swipepoint.blueeyes.tw) | Dynamic QR on a terminal; the phone scans it | Presence at the terminal, time-bound | Needs the vendor's terminal |
| UEA research portal: dynamic QR fraud mitigation | Short-lived signed codes against replay and screenshot forwarding | Freshness and origin | Forwarding a live code over chat still works unless location is cross-checked |

Lessons taken (ideas only, nothing copied):

1. **The screen shows the code and the employee's own phone scans it.** A shared tablet with sign-in is the
   opposite pattern, and it would bring back buddy punching. Ours keeps biometric or PIN proof on the person's own
   enrolled phone.
2. **A static code is worthless.** A photo lasts for ever. The code must rotate and be signed.
3. **Rotation alone does not stop a live forward.** Someone at the office can send a screenshot to a colleague at
   home within seconds. The phone's own location must still be checked whenever it is usable.
4. **The kiosk must be revocable at once.** A stolen tablet or a copied setup link must stop working the moment
   the admin acts.

## 3. Design

### 3.1 Code

- When the admin creates a kiosk, each kiosk gets a secret derived on the server:
  `HMAC(serverKey, 'kiosk|' + id + '|' + version)`. Nothing is stored except the version number.
- The setup link is `#kiosk/<id>.<version>.<secret>`. It is shown once, with a copy button. Issuing a new one bumps
  the version, which invalidates the old secret at once, so a lost tablet is cut off in one tap.
- The tablet computes, for each 20-second window `w = floor(serverTime / 20000)`:
  `code = base64url(HMAC_SHA256(secret, id + '|' + w)).slice(0, 10)`. It uses WebCrypto, so the secret never leaves
  the tablet's memory and localStorage.
- The QR content is a link, `https://…/#qr/<id>.<w>.<code>`. Scanning it with the iPhone camera opens the app,
  which keeps the proof in memory (`S.qrProof`). The in-app scanner (jsQR) reads the same text.
- The server accepts window `w` or `w-1`, a grace of 20-40 s for slow scans and clock skew. The tablet corrects
  its own clock from `serverTime` on every 60-second ping.

### 3.2 Check-in with a QR

The QR replaces only the location requirement. Everything else stays mandatory:

- WebAuthn (Face ID / fingerprint) or device key + PIN, on a single-use challenge, as today.
- The kiosk must be active and its zone must be one of the employee's zones (`qr_wrong_zone`).
- **Forwarded-code guard:** a usable phone fix (accuracy ≤ 200 m) that is farther from the zone than
  `radius + max(500 m, 2 × accuracy)` is refused with `qr_far`. A weak or missing fix is allowed. That is the case
  the feature exists for, and it is flagged.
- **Flags:**
  - `qr_kiosk` (weight 0) records the method on every QR punch.
  - `qr_no_gps` (weight 25) is added when the phone gave no location. It pushes the punch towards HR review when
    combined with other signals (new device, off hours), but not on its own.
- The punch stores the kiosk's zone as its location, so reports and the live board read it like any in-zone punch.

### 3.3 Screens

- **Time → Attendance screens** (`kiosks`, HR sees the list, only the admin changes it): name, location, last
  seen, status. Actions: new screen, new setup code, stop.
- **Tablet page `#kiosk`:** no sign-in, full screen, company name, screen label, a large QR (360 px), a countdown
  bar, a clock and an offline note. It uses a wake lock so the screen stays on. If the kiosk is revoked, it returns
  to the setup screen.
- **Check-in card:** a "Scan office QR" button under the hint opens the camera scanner. Once a code is verified,
  the title reads "Office code verified, check in now" and the button is enabled even without GPS.

## 4. Threats and answers

| Threat | Answer |
|---|---|
| Photo of the QR used tomorrow | Window of 20-40 s (`qr_expired`) |
| Screenshot forwarded live to someone at home | The home phone's fix is far → `qr_far`. If home GPS is also off, the punch carries `qr_no_gps` and HR sees it. Biometric proof still binds the punch to the person |
| Made-up code | HMAC check (`qr_invalid`) |
| Tablet stolen or setup link copied | New setup code or stop → `kiosk_revoked` immediately; the old codes fail `qr_invalid` |
| Colleague punches for a friend at the tablet | Impossible: the tablet does nothing; punching needs the friend's own enrolled phone plus Face ID / PIN |
| Tablet clock wrong | Skew corrected from `serverTime` every minute |
| Network down at the tablet | Codes keep rotating offline (local HMAC); validation happens at punch time on the server |

## 5. Tests (tests/run.js)

- Only the admin creates a kiosk; the setup code works; a wrong one is refused.
- A made-up code gives `qr_invalid`; a code three windows old gives `qr_expired`.
- A fresh code with a fix 5 km away gives `qr_far`.
- A fresh code with no GPS is accepted and flagged `qr_kiosk` + `qr_no_gps`.
- A new setup code revokes the old tablet, and its codes stop counting; the new tablet works with GPS.
- A stopped kiosk is refused.
- sim50 access matrix: `kioskSave` admin only, `kioskList` HR and admin.

## 6. Owner steps

1. Buy any tablet (a cheap Android or an old iPad) and mount it at the entrance, plugged in.
2. Admin: Time → Attendance screens → New screen → open the link once on the tablet.
3. Tell staff: if location fails indoors, tap "Scan office QR".
