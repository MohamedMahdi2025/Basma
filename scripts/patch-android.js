// After `npx cap add android`: the fine and coarse location permissions (foreground only).
const fs = require('fs'), path = require('path');
const mf = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (!fs.existsSync(mf)) { console.error('AndroidManifest.xml not found: run `npx cap add android` first'); process.exit(1); }
let s = fs.readFileSync(mf, 'utf8');
for (const p of ['android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_FINE_LOCATION']) {
  if (s.includes(p)) { console.log('kept', p); continue; }
  s = s.replace('</manifest>', '    <uses-permission android:name="' + p + '" />\n</manifest>');
  console.log('added', p);
}
fs.writeFileSync(mf, s);
