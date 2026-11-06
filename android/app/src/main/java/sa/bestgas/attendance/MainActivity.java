package sa.bestgas.attendance;

import android.Manifest;
import android.app.AlertDialog;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Debug;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Base64;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.content.ContextCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.security.MessageDigest;
import java.util.Collections;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    /** SHA-256 of the release signing certificate (signing/attendance-release.jks). A re-signed copy of the app fails this. */
    private static final String RELEASE_CERT = "ed7cdbd0769c2cf6bbfe69cf90eb2317f483bb5472e0399d3a2a7f49e52e9935";
    private static final String ORIGIN = "https://mohamedmahdi2025.github.io";
    private static final String APP_VERSION = "1.4.0";

    private final Handler ui = new Handler(Looper.getMainLooper());
    private volatile boolean rooted, emulator, hooked, sigOk = true;
    private String devId = "";
    private volatile long mockAt = 0;       // device time of the last fake-location reading seen
    private volatile boolean checked = false;
    private LocationManager lm;
    private final LocationListener mockWatch = new LocationListener() {
        @Override public void onLocationChanged(Location l) { if (isMock(l)) { mockAt = System.currentTimeMillis(); push(); } }
        @Override public void onStatusChanged(String p, int s, Bundle b) {}
        @Override public void onProviderEnabled(String p) {}
        @Override public void onProviderDisabled(String p) {}
    };
    private final Runnable tick = new Runnable() { @Override public void run() { push(); ui.postDelayed(this, 15000); } };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Payslips, IDs and PINs: no screenshots, screen recording or previews in the app switcher.
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
        // Tapjacking: ignore touches while another app's window covers this one.
        getWindow().getDecorView().setFilterTouchesWhenObscured(true);

        boolean release = (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) == 0;
        if (release && (Debug.isDebuggerConnected() || Debug.waitingForDebugger())) { block(); return; }
        sigOk = signatureOk();
        devId = deviceId();
        if (release && !sigOk) { block(); return; }

        WebView wv = bridge != null ? bridge.getWebView() : null;
        if (wv != null) {
            WebSettings s = wv.getSettings();
            s.setAllowFileAccess(false);      // the app is the live HTTPS site; it never reads files
            s.setAllowContentAccess(false);
            if (Build.VERSION.SDK_INT >= 26) s.setSafeBrowsingEnabled(true);
            if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
                WebViewCompat.addDocumentStartJavaScript(wv, script(), Collections.singleton(ORIGIN));
            }
        }
        lm = (LocationManager) getSystemService(LOCATION_SERVICE);
        new Thread(new Runnable() { @Override public void run() {
            rooted = isRooted(); emulator = isEmulator(); hooked = isHooked(); checked = true; push();
        } }, "integrity").start();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (Debug.isDebuggerConnected() && (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) == 0) { block(); return; }
        watchMock(true);
        ui.removeCallbacks(tick); ui.post(tick);
    }

    @Override
    public void onPause() {
        watchMock(false);
        ui.removeCallbacks(tick);
        super.onPause();
    }

    /** The page reads window.BGIntegrity when it sends a punch; the server turns it into review flags. */
    private String script() {
        return "window.BGIntegrity=Object.freeze({v:1,platform:'android',app:'" + APP_VERSION + "',checked:" + checked
            + ",rooted:" + rooted + ",emulator:" + emulator + ",hooked:" + hooked + ",signature:" + sigOk
            + ",devId:'" + devId + "'" + ",mockAt:" + mockAt + ",at:" + System.currentTimeMillis() + "});";
    }

    /** One device, one employee: a stable id for this phone. ANDROID_ID is per app signing key and survives reinstalls;
     *  it is hashed with the package name, so the raw value never leaves the phone. */
    // Google allows ANDROID_ID for fraud prevention (developer.android.com/identity/user-data-ids): it is scoped to this
    // app's signing key and the user, and only its salted hash is sent, never the raw value.
    @android.annotation.SuppressLint("HardwareIds")
    private String deviceId() {
        try {
            String a = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
            if (a == null || a.isEmpty()) return "";
            byte[] d = MessageDigest.getInstance("SHA-256").digest((getPackageName() + ":" + a).getBytes("UTF-8"));
            return Base64.encodeToString(d, Base64.URL_SAFE | Base64.NO_PADDING | Base64.NO_WRAP).substring(0, 32);
        } catch (Exception e) { return ""; }
    }

    private void push() {
        ui.post(new Runnable() { @Override public void run() {
            WebView wv = bridge != null ? bridge.getWebView() : null;
            if (wv != null && wv.getUrl() != null && wv.getUrl().startsWith(ORIGIN + "/")) wv.evaluateJavascript(script(), null);
        } });
    }

    // ---------- fake location: a second, native watch that only looks at the "mock" mark Android puts on readings ----------

    private void watchMock(boolean on) {
        if (lm == null) return;
        try {
            lm.removeUpdates(mockWatch);
            if (!on || ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) return;
            for (String p : new String[] { LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER, "fused" }) {
                if (lm.getAllProviders().contains(p)) {
                    lm.requestLocationUpdates(p, 5000, 0, mockWatch, Looper.getMainLooper());
                    Location last = lm.getLastKnownLocation(p);
                    if (last != null && isMock(last) && System.currentTimeMillis() - last.getTime() < 300000) mockAt = System.currentTimeMillis();
                }
            }
        } catch (Exception ignored) { }
    }

    @SuppressWarnings("deprecation")
    private static boolean isMock(Location l) { return Build.VERSION.SDK_INT >= 31 ? l.isMock() : l.isFromMockProvider(); }

    // ---------- tamper, root, emulator, hooks ----------

    @SuppressWarnings("deprecation")
    private boolean signatureOk() {
        try {
            Signature[] sigs;
            if (Build.VERSION.SDK_INT >= 28) {
                PackageInfo pi = getPackageManager().getPackageInfo(getPackageName(), PackageManager.GET_SIGNING_CERTIFICATES);
                if (pi.signingInfo == null || pi.signingInfo.hasMultipleSigners()) return false;
                sigs = pi.signingInfo.getSigningCertificateHistory();
            } else {
                sigs = getPackageManager().getPackageInfo(getPackageName(), PackageManager.GET_SIGNATURES).signatures;
            }
            if (sigs == null || sigs.length == 0) return false;
            byte[] d = MessageDigest.getInstance("SHA-256").digest(sigs[sigs.length - 1].toByteArray());
            StringBuilder h = new StringBuilder();
            for (byte b : d) h.append(String.format(Locale.ROOT, "%02x", b));
            return RELEASE_CERT.equals(h.toString());
        } catch (Exception e) { return false; }
    }

    private static boolean isRooted() {
        String tags = Build.TAGS;
        if (tags != null && tags.contains("test-keys")) return true;
        String[] paths = { "/system/app/Superuser.apk", "/sbin/su", "/system/bin/su", "/system/xbin/su", "/data/local/xbin/su",
            "/data/local/bin/su", "/system/sd/xbin/su", "/system/bin/failsafe/su", "/data/local/su", "/su/bin/su",
            "/system/xbin/daemonsu", "/sbin/.magisk", "/data/adb/magisk", "/data/adb/ksu", "/cache/.disable_magisk" };
        for (String p : paths) if (new File(p).exists()) return true;
        String path = System.getenv("PATH");
        if (path != null) for (String dir : path.split(":")) if (new File(dir, "su").exists()) return true;
        return false;
    }

    private static boolean isEmulator() {
        String f = Build.FINGERPRINT + "|" + Build.MODEL + "|" + Build.HARDWARE + "|" + Build.PRODUCT + "|" + Build.MANUFACTURER;
        f = f.toLowerCase(Locale.ROOT);
        return f.startsWith("generic") || f.contains("emulator") || f.contains("sdk_gphone") || f.contains("android sdk built for")
            || f.contains("goldfish") || f.contains("ranchu") || f.contains("genymotion") || f.contains("vbox") || f.contains("nox")
            || f.contains("bluestacks") || f.contains("|sdk|") || f.contains("google_sdk");
    }

    private static boolean isHooked() {
        try { Class.forName("de.robv.android.xposed.XposedBridge"); return true; } catch (Throwable ignored) { }
        try (BufferedReader r = new BufferedReader(new FileReader("/proc/self/maps"))) {
            String line;
            while ((line = r.readLine()) != null) {
                String l = line.toLowerCase(Locale.ROOT);
                if (l.contains("frida") || l.contains("xposed") || l.contains("lsposed") || l.contains("substrate") || l.contains("gum-js")) return true;
            }
        } catch (Exception ignored) { }
        try (Socket s = new Socket()) { s.connect(new InetSocketAddress("127.0.0.1", 27042), 150); return true; } catch (Exception ignored) { }
        return false;
    }

    /** A modified copy of the app, or a debugger on the release build: stop here. */
    private void block() {
        boolean ar = Locale.getDefault().getLanguage().startsWith("ar");
        new AlertDialog.Builder(this)
            .setTitle(ar ? "لا يمكن فتح التطبيق" : "The app cannot open")
            .setMessage(ar ? "هذه النسخة من التطبيق معدّلة أو تعمل تحت أداة تصحيح. ثبّت النسخة الرسمية من جهة عملك."
                           : "This copy of the app was modified or is running under a debugger. Install the official app from your employer.")
            .setCancelable(false)
            .setPositiveButton(ar ? "إغلاق" : "Close", (d, w) -> finishAndRemoveTask())
            .show();
    }
}
