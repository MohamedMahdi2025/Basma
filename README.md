# iPhone and Android app (native wrapper)

The same attendance web app, opened inside a real phone app. Screens, backend, PIN and data all stay the same: the
wrapper loads `https://besgasksa.github.io/BG-attendance/` (see `capacitor.config.json`).

## Why it exists

A website or home-screen web app on iPhone cannot open the Settings app, because Apple blocks it. A real app can.
Inside the wrapper:

- **Open Settings:** when location is blocked, the check-in screen shows an **Open Settings** button. One tap opens
  this app's own page in Settings, with the Location switch right there.
- **One location question:** the location prompt is the normal iPhone one ("Allow While Using App"). It comes from
  the native plugin, so it is asked only once, not twice (once by the web view and once by the site).
- **Wording:** the permission text is set in `scripts/patch-ios.js`, in Arabic and English.
- **Foreground only:** no background location is requested.

The web side is already live. `index.html` defines `BGNative.openSettings()` and switches `navigator.geolocation` to the
native plugin only when it runs inside the wrapper. `tests/native-bridge.js` checks that bridge on every deploy.

## Not affected

- **Sign-in:** the PIN sign-in (device key, WebCrypto) works inside the app as it does in the browser. Face ID passkeys
  inside the app would need an associated-domain file on `besgasksa.github.io`, and the PIN is the default anyway.
- **Updates:** every web deploy reaches the app at once, because it loads the live site. A new store build is only
  needed when the wrapper itself changes.

## What only the owner can do (Apple)

1. **Apple Developer Program:** enrol the company (organisation, 99 USD a year) at <https://developer.apple.com/programs/>.
   It needs the D-U-N-S number of the company.
2. **App ID:** in App Store Connect, create the app with the bundle id `sa.bestgas.attendance`.
3. **Distribution:** choose one.
   - **TestFlight:** up to 10,000 testers by e-mail link; builds expire after 90 days and are re-uploaded. Good for a
     start.
   - **App Store, unlisted:** passes App Review; only people with the link find it. Best for staff.
   - **Apple Business Manager, custom app:** private to the company's managed devices.
4. **Build from Windows:** connect the Apple account to Codemagic (App Store Connect API key) and run the
   `ios-testflight` workflow in `codemagic.yaml`. There is no need for a Mac.

## Android

1. Run `npm install`, then `npm run add:android`, then `npm run open:android` (Android Studio).
2. Build a signed APK or AAB.
3. Install it directly (side-load) or publish it through Google Play (one-time 25 USD account).

The Android path does not need Apple and can be done first.

### Release build 1.1.0 (2026-11-01)

- **File:** `dist/attendance-android-1.1.0.apk`, built with `gradlew assembleRelease`. The old debug APK was renamed to
  `dist/attendance-android-1.0-debug-old.apk.bak`.
  - versionCode 2, targetSdk 36.
  - SHA-256 9cfe41fc9f1ae49a68f1976e6058705fe740c1b64cafcc38e8e09886a6e8fa15.
- **Signing key:** `D:/Claude/bestgas-attendance/signing/` (RSA 4096, valid to 2056). It is read by `app/build.gradle`
  through `keystore.properties`.
  - Never put it in a repository.
  - Keep two offline copies: without this key, no later version can install over this one.
  - Signer certificate SHA-256 ed7cdbd0769c2cf6bbfe69cf90eb2317f483bb5472e0399d3a2a7f49e52e9935. The APK is signed with
    APK Signature Scheme v2, v3 and v4.
- **Hardening:**
  - The release build is not debuggable and R8 shrinks and obfuscates it.
  - Backups and device-to-device transfer are off (`allowBackup=false` plus `data_extraction_rules.xml`).
  - The app uses HTTPS only and trusts only the system certificate authorities (`network_security_config.xml`).
  - Web-view debugging and mixed content are off.
  - `FLAG_SECURE` blocks screenshots, screen recording and app-switcher previews.
  - Taps are ignored while another app's window covers this one (tapjacking).
- **Exported components:** only two.
  - The launcher activity.
  - androidx `ProfileInstallReceiver`, which is guarded by the system-only `DUMP` permission.
- **Permissions:**
  - internet;
  - network state;
  - foreground fine and coarse location.

  There is no background location.
- **Store and authority checks:** a side-loaded APK always asks the user to allow "install unknown apps". Play Protect may
  scan it on first install. Only Google Play (or managed Google Play for company phones) removes those prompts, and only it
  gives the review record that agencies ask for. For Play, build an AAB with `gradlew bundleRelease` and enrol the key in
  Play App Signing.

## Commands (developer machine)

```bash
npm install
npm run add:ios        # creates ios/ and writes the location texts into Info.plist
npm run add:android    # creates android/ and adds the location permissions
npm run sync
```
