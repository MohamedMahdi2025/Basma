// Build the public site from the private source: node tools/build.js
//
// The readable page (src/index.html) never leaves this machine. The published
// app/index.html is a small loader holding the page XOR-encoded with a key
// made fresh on every build, in 38-character lines (GitHub secret scanning
// reads 40+ character runs as tokens). This slows copying; it is NOT the
// security boundary. Every rule and every piece of data is enforced and kept
// on the server; the page holds no data and no secrets.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

const SRC = path.join(__dirname, '..');
const OUT = path.join(SRC, '..', 'app');

// Minify before encoding (2026-11-06): comments, whitespace and local names go, so decoding the XOR layer yields compact
// code, not the readable source. Terser lives outside both repos (../buildtools); the build refuses to run without it.
// Global names stay (toplevel: false): modules call each other and index.html through them.
const TERSER = path.join(SRC, '..', 'buildtools', 'node_modules', 'terser');
let terser;
try { terser = require(TERSER); } catch (e) { console.error('refusing: Terser missing. Run: npm install terser@5.39.0 --prefix ../buildtools'); process.exit(1); }
const MIN_OPTS = { ecma: 2017, compress: { passes: 2, drop_debugger: true, keep_fargs: true }, mangle: { toplevel: false }, format: { comments: false } };
async function minify(code, name) {
  try { const r = await terser.minify(code, MIN_OPTS); if (!r.code) throw new Error('empty output'); return r.code; }
  catch (e) { console.error('refusing: could not minify ' + name + ': ' + (e.message || e) + (e.line ? ' line ' + e.line : '')); process.exit(1); }
}

(async function main() {

function stripComments(html) {
  // Remove HTML comments and whole-line // comments inside scripts. Line-start
  // only, so URLs like https:// and regexes in code are never touched.
  return html.replace(/<!--[\s\S]*?-->/g, '').split('\n').filter(l => !/^\s*\/\/(?!\/)/.test(l)).join('\n');
}

// Every build gets its own stamp: the app compares it with version.json to know a new release is out.
const STAMP = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '.');
let page = stripComments(fs.readFileSync(path.join(SRC, 'index.html'), 'utf8'))
  .replace(/var BUILD = '[^']*';/, "var BUILD = '" + STAMP + "';");
if (!page.includes("var BUILD = '" + STAMP + "';")) { console.error('refusing: BUILD line not found in index.html'); process.exit(1); }
{ // the page's own inline script(s): minified in place
  const parts = page.split(/(<script>)([\s\S]*?)(<\/script>)/);
  for (let i = 0; i < parts.length; i++) if (parts[i] === '<script>' && parts[i + 2] === '</script>') parts[i + 1] = await minify(parts[i + 1], 'index.html');
  page = parts.join('');
  if (!page.includes("BUILD=\"" + STAMP + "\"") && !page.includes("BUILD='" + STAMP + "'") && !page.includes('"' + STAMP + '"')) { console.error('refusing: BUILD stamp lost in minifying'); process.exit(1); }
}
// Compression (2026-11-09): the XOR layer makes bytes look random, so a server's gzip/Brotli cannot shrink them. The page and each module
// are deflated BEFORE they are encoded and inflated by this small synchronous decoder (tiny-inflate) inside the loader.
const TINF = require('./vendor/tiny-inflate.js');
const BGZ = await minify('window.__bgz||(window.__bgz=(function(){var module={exports:{}};' + fs.readFileSync(path.join(__dirname, 'vendor', 'tiny-inflate.js'), 'utf8') + ';var f=module.exports;return function(s,n){return f(s,new Uint8Array(n));};})());', 'inflate');
const squeeze = (buf, what) => { // deflate, and prove the browser decoder gives the original back byte for byte
  const z = zlib.deflateRawSync(buf, { level: 9 });
  if (!Buffer.from(TINF(z, new Uint8Array(buf.length))).equals(buf)) { console.error('refusing: the decoder does not reproduce ' + what); process.exit(1); }
  return z;
};
const key = crypto.randomBytes(48);
// The loader's <head> carries the CSP and it stays in force after document.write; a second copy inside the written
// page is ignored by browsers ("outside the document's head") and only logs an error, so the encoded page drops it.
const data = Buffer.from(page.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\n?/, ''), 'utf8');
const zdata = squeeze(data, 'index.html');
console.log('compression: page ' + Math.round(data.length / 1024) + ' KB -> ' + Math.round(zdata.length / 1024) + ' KB before encoding');
const enc = Buffer.alloc(zdata.length);
for (let i = 0; i < zdata.length; i++) enc[i] = zdata[i] ^ key[i % key.length];
const DEC = 'var h=new TextDecoder().decode(__bgz(o,' + data.length + '));';
const lines = s => s.match(/.{1,38}/g).map(x => '"' + x + '"').join(',\n');

const head = page.match(/<head>([\s\S]*?)<script/)[1]
  .split('\n').filter(l => /<meta|<link rel="(manifest|icon|apple-touch-icon|preload)"|<title>/.test(l)).join('\n');

const loader = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
${head}
<style>html,body{margin:0;height:100%;background:#142236}</style>
</head>
<body>
<script>
${BGZ}
(function(){
var k=[
${lines(key.toString('base64'))}
].join(""),p=[
${lines(enc.toString('base64'))}
].join("");
var kb=atob(k),pb=atob(p),o=new Uint8Array(pb.length);
for(var i=0;i<pb.length;i++)o[i]=pb.charCodeAt(i)^kb.charCodeAt(i%kb.length);
${DEC}
document.open();document.write(h);document.close();
})();
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(OUT, 'index.html'), loader);
// The platform console has its own address (2026-11-08): platform.html. Browsers keep a tab icon per URL, so #platform on the
// app's own address kept showing the app icon. This page is the same app with the platform's amber icon, manifest, colour
// and title fixed in its head, before and after the page is decoded. Opening /#platform on the app moves here.
const HUB = s => s.replace('manifest.webmanifest?v=basma2', 'hub.webmanifest?v=3').replace(/(favicon-48|icon-192)\.png\?v=basma2/g, 'hub-192.png?v=3')
  .replace('apple-touch-icon.png?v=basma2', 'hub-apple.png?v=3').replace('content="#142236"', 'content="#D9730F"').replace(/<title>[^<]*<\/title>/, '<title>مركز بصمة · BASMA Hub</title>');
const START = '(function(){\nvar k=[';
// the same head swap, run in the page after decoding (the decoded page writes its own head)
const SWAP = "h=h.replace('manifest.webmanifest?v=basma2','hub.webmanifest?v=3').replace(/(favicon-48|icon-192)\\.png\\?v=basma2/g,'hub-192.png?v=3')" +
  ".replace('apple-touch-icon.png?v=basma2','hub-apple.png?v=3').replace('content=\"#142236\"','content=\"#D9730F\"').replace(/<title>[^<]*<\\/title>/,'<title>مركز بصمة · BASMA Hub</title>');";
const platLoader = HUB(loader)
  .replace(START, "(function(){\nif(location.hash&&location.hash!=='#platform'){location.replace('./'+location.hash);return;}if(!location.hash)history.replaceState(null,'',location.pathname+location.search+'#platform');\nvar k=[")
  .replace(DEC, DEC + SWAP);
if (platLoader === loader || platLoader.indexOf("location.replace('./'+location.hash)") < 0 || platLoader.indexOf('h=h.replace(') < 0 || platLoader.indexOf('hub-192.png?v=3') < 0) { console.error('refusing: platform loader not built'); process.exit(1); }
// The platform console holds the owner's setup key in memory, so this page gets a script policy: only the loader's own script, the
// page's own inline script(s) (by SHA-256 of their exact text), this site's files and the two spreadsheet/QR libraries on cdnjs run.
// An injected <script>, an inline event handler (onerror=...) or a javascript: URL does not. 'unsafe-eval' stays because the encoded
// modules run through eval. (The company app keeps its current policy: its print windows use inline scripts and the phone wrappers
// cannot be tested from here.)
const sha256b64 = s => "'sha256-" + crypto.createHash('sha256').update(s, 'utf8').digest('base64') + "'";
const inlineScripts = html => { const out = [], re = /<script>([\s\S]*?)<\/script>/g; let m; while ((m = re.exec(html))) out.push(m[1]); return out; };
const hashes = inlineScripts(platLoader).concat(inlineScripts(page)).map(sha256b64);
if (hashes.length < 2) { console.error('refusing: no inline script hashes for the platform policy'); process.exit(1); }
const PLAT_CSP = "script-src 'self' 'unsafe-eval' " + hashes.join(' ') + " https://cdnjs.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests";
const platCsp = platLoader.replace(/<meta http-equiv="Content-Security-Policy" content="[^"]*">/, '<meta http-equiv="Content-Security-Policy" content="' + PLAT_CSP + '">');
if (platCsp === platLoader || platCsp.indexOf("script-src 'self'") < 0) { console.error('refusing: platform CSP not applied'); process.exit(1); }
fs.writeFileSync(path.join(OUT, 'platform.html'), platCsp);
// and the app's own address sends #platform to it, before decoding anything
const appLoader = loader.replace(START, "(function(){\nif(location.hash==='#platform'){location.replace('platform.html#platform');return;}\nvar k=[");
if (appLoader === loader) { console.error('refusing: app loader redirect not added'); process.exit(1); }
fs.writeFileSync(path.join(OUT, 'index.html'), appLoader);
fs.writeFileSync(path.join(OUT, 'version.json'), JSON.stringify({ build: STAMP }) + '\n');
fs.writeFileSync(path.join(OUT, 'sw.js'), fs.readFileSync(path.join(SRC, 'sw.js'), 'utf8').replace(/var CACHE = '[^']*';/, "var CACHE = 'bgatt-" + STAMP + "';"));
// Icon fonts (subset by tools/icons.js): publish the three .woff2 files. The build refuses when a ph('name') in the source has no glyph,
// because that icon would show as an empty square: run  node tools/icons.js  after adding an icon.
{
  const man = JSON.parse(fs.readFileSync(path.join(SRC, 'icons', 'manifest.json'), 'utf8')), have = new Set(man.weights.regular.names);
  const code = [fs.readFileSync(path.join(SRC, 'index.html'), 'utf8')].concat(fs.readdirSync(path.join(SRC, 'js')).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(SRC, 'js', f), 'utf8'))).join('\n');
  const miss = new Set(); let mm; const re = /\bph\('([a-z0-9-]+)'/g; while ((mm = re.exec(code))) if (!have.has(mm[1])) miss.add(mm[1]);
  if (miss.size) { console.error('refusing: icons without a glyph in icons/: ' + Array.from(miss).join(', ') + ' (run: node tools/icons.js)'); process.exit(1); }
  fs.mkdirSync(path.join(OUT, 'icons'), { recursive: true });
  for (const f of fs.readdirSync(path.join(SRC, 'icons'))) if (/^phosphor-.*\.woff2$/.test(f)) fs.copyFileSync(path.join(SRC, 'icons', f), path.join(OUT, 'icons', f));
}
// self-hosted fonts (only the .woff2 files and fonts.css; the generator's by-products stay private)
fs.mkdirSync(path.join(OUT, 'fonts'), { recursive: true });
for (const f of fs.readdirSync(path.join(SRC, 'fonts'))) if (/\.woff2$|^fonts\.css$/.test(f)) fs.copyFileSync(path.join(SRC, 'fonts', f), path.join(OUT, 'fonts', f));
for (const f of fs.readdirSync(path.join(OUT, 'fonts'))) if (!fs.existsSync(path.join(SRC, 'fonts', f))) fs.unlinkSync(path.join(OUT, 'fonts', f));
// artwork (img/): small WebP files referenced by the page and the modules
fs.mkdirSync(path.join(OUT, 'img'), { recursive: true });
for (const f of fs.readdirSync(path.join(SRC, 'img'))) if (/.(webp|png|svg)$/.test(f)) fs.copyFileSync(path.join(SRC, 'img', f), path.join(OUT, 'img', f));
for (const f of ['manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon-48.png', 'hub.webmanifest', 'hub-192.png', 'hub-512.png', 'hub-apple.png', 'privacy.html', 'delete-account.html']) {
  fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
}
// Lazily loaded screens (js/*.js) get the same treatment: a fresh key each, decoded and run in page scope.
const JS_IN = path.join(SRC, 'js'), JS_OUT = path.join(OUT, 'js');
let jsLong = 0, jsRaw = 0, jsZ = 0;
if (fs.existsSync(JS_IN)) {
  fs.mkdirSync(JS_OUT, { recursive: true });
  for (const f of fs.readdirSync(JS_OUT)) if (!fs.existsSync(path.join(JS_IN, f))) fs.unlinkSync(path.join(JS_OUT, f));
  for (const f of fs.readdirSync(JS_IN).filter(x => x.endsWith('.js'))) {
    const src = await minify(fs.readFileSync(path.join(JS_IN, f), 'utf8'), 'js/' + f);
    const k = crypto.randomBytes(48), d = Buffer.from(src, 'utf8'), z = squeeze(d, 'js/' + f), e = Buffer.alloc(z.length);
    for (let i = 0; i < z.length; i++) e[i] = z[i] ^ k[i % k.length];
    jsRaw += d.length; jsZ += z.length;
    const out = BGZ + '\n(function(){\nvar k=[\n' + lines(k.toString('base64')) + '\n].join(""),p=[\n' + lines(e.toString('base64')) + '\n].join("");\n' +
      'var kb=atob(k),pb=atob(p),o=new Uint8Array(pb.length);\nfor(var i=0;i<pb.length;i++)o[i]=pb.charCodeAt(i)^kb.charCodeAt(i%kb.length);\n' +
      '(0,eval)(new TextDecoder().decode(__bgz(o,' + d.length + ')));\n})();\n';
    fs.writeFileSync(path.join(JS_OUT, f), out);
    jsLong += out.split('\n').filter(l => /[A-Za-z0-9+/]{40,}/.test(l)).length;
    console.log('built js/' + f, Math.round(out.length / 1024) + ' KB');
  }
}
if (jsLong) { console.error('refusing: a js line holds a 40+ character run (GitHub push protection)'); process.exit(1); }
const long = loader.split('\n').filter(l => /[A-Za-z0-9+/]{40,}/.test(l)).length;
console.log('built ' + STAMP + ' app/index.html', Math.round(loader.length / 1024) + ' KB', 'source', Math.round(page.length / 1024) + ' KB', 'long runs:', long);
if (long) { console.error('refusing: a line holds a 40+ character run (GitHub push protection)'); process.exit(1); }
})();
