// Release APK security checks (2026-11-02). node tests/apk-security.js [path.apk]
// Uses the Android SDK build tools (apksigner, aapt2) and reads the APK as a zip. Exit code 1 on any failure.
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto'), zlib = require('zlib');
const APK = process.argv[2] || path.join(__dirname, '../android/app/build/outputs/apk/release/app-release.apk');
const CERT = 'ed7cdbd0769c2cf6bbfe69cf90eb2317f483bb5472e0399d3a2a7f49e52e9935';
const SDK = process.env.ANDROID_HOME || path.join(process.env.LOCALAPPDATA || '', 'Android/Sdk');
const BT = path.join(SDK, 'build-tools', fs.readdirSync(path.join(SDK, 'build-tools')).sort().pop());
const run = (exe, args) => cp.execFileSync(path.join(BT, exe), args, { encoding: 'utf8', maxBuffer: 64 << 20, shell: exe.endsWith('.bat'), stdio: ['ignore', 'pipe', 'ignore'] });
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra ? '  -> ' + extra : '')); } }

console.log('APK ' + APK + '\nsha256 ' + crypto.createHash('sha256').update(fs.readFileSync(APK)).digest('hex'));

console.log('Signature');
const sig = run('apksigner.bat', ['verify', '--verbose', '--print-certs', APK]);
ok(/^Verifies/m.test(sig), 'apksigner verifies the APK');
ok(/v2 scheme \(APK Signature Scheme v2\): true/.test(sig) && /v3 scheme \(APK Signature Scheme v3\): true/.test(sig), 'signed with APK Signature Scheme v2 and v3');
ok(sig.includes('certificate SHA-256 digest: ' + CERT), 'signed with the company release key (the certificate the app checks at start-up)');
ok(!/CN=Android Debug/.test(sig), 'not signed with a debug key');
ok(/Number of signers: 1/.test(sig), 'exactly one signer');

console.log('Manifest');
const mf = run('aapt2.exe', ['dump', 'xmltree', '--file', 'AndroidManifest.xml', APK]);
const attr = (name, val) => new RegExp('android:' + name + '\\(0x[0-9a-f]+\\)=' + val).test(mf);
ok(!/android:debuggable\(0x[0-9a-f]+\)=true/.test(mf), 'not debuggable');
ok(attr('allowBackup', 'false'), 'no Android backup (allowBackup=false)');
ok(/dataExtractionRules/.test(mf), 'cloud backup and device transfer excluded (dataExtractionRules)');
ok(attr('usesCleartextTraffic', 'false'), 'no plain HTTP (usesCleartextTraffic=false)');
ok(/networkSecurityConfig/.test(mf), 'network security config present');
ok(!/testOnly\(0x[0-9a-f]+\)=true/.test(mf), 'not a test-only build');
ok(/WebView\.MetricsOptOut/.test(mf), 'WebView usage statistics off');
const perms = (mf.match(/uses-permission[\s\S]*?:name\(0x01010003\)="([^"]+)"/g) || []).map(s => s.match(/="([^"]+)"/)[1]);
const allowed = ['android.permission.INTERNET', 'android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_NETWORK_STATE', 'sa.bestgas.attendance.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'];
const extra = perms.filter(p => allowed.indexOf(p) < 0);
ok(!extra.length, 'only the expected permissions (internet, network state, foreground location)', extra.join(', '));
ok(perms.indexOf('android.permission.ACCESS_BACKGROUND_LOCATION') < 0, 'no background location');
// every component marked exported=true must be the launcher or be guarded by a system permission
const comps = mf.split(/\n(?=\s+E: (?:activity|receiver|service|provider) )/).slice(1);
const open = comps.filter(c => /exported\(0x01010010\)=true/.test(c))
  .filter(c => !/android\.intent\.category\.LAUNCHER/.test(c) && !/permission\(0x01010006\)="android\.permission\.(DUMP|BIND_[A-Z_]+)"/.test(c))
  .map(c => (c.match(/:name\(0x01010003\)="([^"]+)"/) || [])[1]);
ok(!open.length, 'no exported component an outside app can call (launcher and system-guarded only)', open.join(', '));

console.log('Contents');
const raw = fs.readFileSync(APK);
const entries = zipEntries(raw);
const names = entries.map(e => e.name);
ok(!names.some(n => /\.(jks|keystore|p12|pem|properties)$/i.test(n) && !/^META-INF\/.*\.version$/.test(n) && !/\.properties$/.test(n) || /keystore\.properties/i.test(n)), 'no key or keystore file inside');
ok(!names.some(n => /(^|\/)(google-services\.json|\.env|secrets?\.)/i.test(n)), 'no config or secrets file inside');
const text = entries.filter(e => /\.(dex|json|xml|js|html|txt|arsc)$/.test(e.name)).map(e => e.data.toString('latin1')).join('\n');
const leaks = [/AKIA[0-9A-Z]{16}/, /AIza[0-9A-Za-z_\-]{35}/, /sk-ant-[A-Za-z0-9_\-]{20,}/, /-----BEGIN (RSA |EC )?PRIVATE KEY-----/, /storePassword|keyPassword/, /ghp_[A-Za-z0-9]{30,}/]
  .filter(re => re.test(text)).map(String);
ok(!leaks.length, 'no API keys, private keys or signing passwords in the code', leaks.join(', '));
const pwd = readSigningPasswords();
ok(!pwd.length || !pwd.some(p => p.length >= 6 && text.indexOf(p) >= 0), 'the actual signing passwords do not appear anywhere in the APK');
ok(/https:\/\/mohamedmahdi2025\.github\.io\//.test(text), 'the app loads only the official HTTPS site');
ok(!/http:\/\/(?!schemas\.android\.com|www\.w3\.org|localhost|ns\.adobe\.com)[a-z0-9.\-]+\.[a-z]{2,}/i.test(entries.filter(e => /capacitor\.config\.json$/.test(e.name)).map(e => e.data.toString()).join('')), 'no plain-HTTP address in the app config');
const conf = entries.find(e => /capacitor\.config\.json$/.test(e.name));
const cfg = conf ? JSON.parse(conf.data.toString()) : {};
ok(cfg.android && cfg.android.webContentsDebuggingEnabled === false, 'web-view debugging off in the shipped config');
ok(cfg.android && cfg.android.allowMixedContent === false, 'mixed content off');
ok(cfg.server && cfg.server.cleartext === false, 'cleartext off for the server');
ok(names.some(n => /^classes\d*\.dex$/.test(n)) && !names.some(n => /\.kotlin_module$|\.java$/.test(n)), 'compiled and shrunk (no sources inside)');
ok(text.indexOf('test-keys') >= 0 && text.indexOf('frida') >= 0 && text.indexOf('/data/adb/magisk') >= 0, 'tamper, root and fake-location checks are compiled in');
const nsc = entries.find(e => /res\/.*network_security_config|res\/xml\/network/.test(e.name));
ok(!!nsc || /networkSecurityConfig/.test(mf), 'network security config packed');
const nscXml = run('aapt2.exe', ['dump', 'xmltree', '--file', nscName(names), APK]);
ok(/cleartextTrafficPermitted(\(0x[0-9a-f]+\))?=false/.test(nscXml) && /src(\(0x[0-9a-f]+\))?="system"/.test(nscXml) && !/="user"/.test(nscXml), 'trusts system certificate authorities only (not user-installed ones), no cleartext');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;

function nscName(names) {
  return names.filter(n => /^res\/.*\.xml$/.test(n)).find(n => { try { return run("aapt2.exe", ["dump", "xmltree", "--file", n, APK]).indexOf("network-security-config") >= 0; } catch (e) { return false; } });
}
function readSigningPasswords() {
  try {
    const p = fs.readFileSync('D:/Claude/bestgas-attendance/signing/keystore.properties', 'utf8');
    return p.split(/\r?\n/).map(l => l.match(/^(storePassword|keyPassword)\s*=\s*(.*)$/)).filter(Boolean).map(m => m[2].trim());
  } catch (e) { return []; }
}
function zipEntries(buf) {
  let eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const n = buf.readUInt16LE(eocd + 10); let off = buf.readUInt32LE(eocd + 16); const out = [];
  for (let i = 0; i < n; i++) {
    const method = buf.readUInt16LE(off + 10), csize = buf.readUInt32LE(off + 20), nl = buf.readUInt16LE(off + 28), xl = buf.readUInt16LE(off + 30), cl = buf.readUInt16LE(off + 32), lho = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nl);
    const lnl = buf.readUInt16LE(lho + 26), lxl = buf.readUInt16LE(lho + 28), start = lho + 30 + lnl + lxl;
    let data = buf.subarray(start, start + csize);
    try { if (method === 8) data = zlib.inflateRawSync(data); } catch (e) { data = Buffer.alloc(0); }
    out.push({ name, data }); off += 46 + nl + xl + cl;
  }
  return out;
}
