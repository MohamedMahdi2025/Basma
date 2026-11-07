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
const key = crypto.randomBytes(48);
// The loader's <head> carries the CSP and it stays in force after document.write; a second copy inside the written
// page is ignored by browsers ("outside the document's head") and only logs an error, so the encoded page drops it.
const data = Buffer.from(page.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\n?/, ''), 'utf8');
const enc = Buffer.alloc(data.length);
for (let i = 0; i < data.length; i++) enc[i] = data[i] ^ key[i % key.length];
const lines = s => s.match(/.{1,38}/g).map(x => '"' + x + '"').join(',\n');

const head = page.match(/<head>([\s\S]*?)<script/)[1]
  .split('\n').filter(l => /<meta|<link rel="(manifest|icon|apple-touch-icon)"|<title>/.test(l)).join('\n');

const loader = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
${head}
<style>html,body{margin:0;height:100%;background:#142236}</style>
</head>
<body>
<script>
(function(){
var k=[
${lines(key.toString('base64'))}
].join(""),p=[
${lines(enc.toString('base64'))}
].join("");
var kb=atob(k),pb=atob(p),o=new Uint8Array(pb.length);
for(var i=0;i<pb.length;i++)o[i]=pb.charCodeAt(i)^kb.charCodeAt(i%kb.length);
var h=new TextDecoder().decode(o);
document.open();document.write(h);document.close();
})();
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(OUT, 'index.html'), loader);
fs.writeFileSync(path.join(OUT, 'version.json'), JSON.stringify({ build: STAMP }) + '\n');
fs.writeFileSync(path.join(OUT, 'sw.js'), fs.readFileSync(path.join(SRC, 'sw.js'), 'utf8').replace(/var CACHE = '[^']*';/, "var CACHE = 'bgatt-" + STAMP + "';"));
for (const f of ['manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon-48.png', 'hub.webmanifest', 'hub-192.png', 'hub-512.png', 'hub-apple.png', 'privacy.html', 'delete-account.html']) {
  fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
}
// Lazily loaded screens (js/*.js) get the same treatment: a fresh key each, decoded and run in page scope.
const JS_IN = path.join(SRC, 'js'), JS_OUT = path.join(OUT, 'js');
let jsLong = 0;
if (fs.existsSync(JS_IN)) {
  fs.mkdirSync(JS_OUT, { recursive: true });
  for (const f of fs.readdirSync(JS_OUT)) if (!fs.existsSync(path.join(JS_IN, f))) fs.unlinkSync(path.join(JS_OUT, f));
  for (const f of fs.readdirSync(JS_IN).filter(x => x.endsWith('.js'))) {
    const src = await minify(fs.readFileSync(path.join(JS_IN, f), 'utf8'), 'js/' + f);
    const k = crypto.randomBytes(48), d = Buffer.from(src, 'utf8'), e = Buffer.alloc(d.length);
    for (let i = 0; i < d.length; i++) e[i] = d[i] ^ k[i % k.length];
    const out = '(function(){\nvar k=[\n' + lines(k.toString('base64')) + '\n].join(""),p=[\n' + lines(e.toString('base64')) + '\n].join("");\n' +
      'var kb=atob(k),pb=atob(p),o=new Uint8Array(pb.length);\nfor(var i=0;i<pb.length;i++)o[i]=pb.charCodeAt(i)^kb.charCodeAt(i%kb.length);\n' +
      '(0,eval)(new TextDecoder().decode(o));\n})();\n';
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
