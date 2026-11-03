// After `npx cap add ios`: add the location permission texts (Arabic first) to Info.plist and the Arabic localisation.
// Run again safely: keys already present are left alone.
const fs = require('fs'), path = require('path');
const plist = path.join(__dirname, '..', 'ios', 'App', 'App', 'Info.plist');
if (!fs.existsSync(plist)) { console.error('ios/App/App/Info.plist not found: run `npx cap add ios` first'); process.exit(1); }
let s = fs.readFileSync(plist, 'utf8');
const add = {
  NSLocationWhenInUseUsageDescription: 'يستخدم التطبيق موقعك لحظة تسجيل الحضور والانصراف فقط، للتأكد من أنك داخل موقع العمل. Your location is used only when you check in or out, to confirm you are at the work site.',
  CFBundleDevelopmentRegion: 'ar'
};
for (const [k, v] of Object.entries(add)) {
  if (s.includes('<key>' + k + '</key>')) { console.log('kept', k); continue; }
  s = s.replace(/<dict>\s*/, m => m + '\t<key>' + k + '</key>\n\t<string>' + v + '</string>\n\t');
  console.log('added', k);
}
if (!s.includes('<key>CFBundleLocalizations</key>')) s = s.replace(/<dict>\s*/, m => m + '\t<key>CFBundleLocalizations</key>\n\t<array><string>ar</string><string>en</string></array>\n\t');
fs.writeFileSync(plist, s);
console.log('Info.plist ready. No background location is requested (only "While Using").');
