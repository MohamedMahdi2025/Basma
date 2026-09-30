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

function stripComments(html) {
  // Remove HTML comments and whole-line // comments inside scripts. Line-start
  // only, so URLs like https:// and regexes in code are never touched.
  return html.replace(/<!--[\s\S]*?-->/g, '').split('\n').filter(l => !/^\s*\/\/(?!\/)/.test(l)).join('\n');
}

const page = stripComments(fs.readFileSync(path.join(SRC, 'index.html'), 'utf8'));
const key = crypto.randomBytes(48);
const data = Buffer.from(page, 'utf8');
const enc = Buffer.alloc(data.length);
for (let i = 0; i < data.length; i++) enc[i] = data[i] ^ key[i % key.length];
const lines = s => s.match(/.{1,38}/g).map(x => '"' + x + '"').join(',\n');

const head = page.match(/<head>([\s\S]*?)<script/)[1]
  .split('\n').filter(l => /<meta|<link rel="(manifest|icon|apple-touch-icon)"|<title>/.test(l)).join('\n');

const loader = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
${head}
<style>html,body{margin:0;height:100%;background:#1C2A1F}</style>
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
for (const f of ['sw.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon-48.png']) {
  fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
}
const long = loader.split('\n').filter(l => /[A-Za-z0-9+/]{40,}/.test(l)).length;
console.log('built app/index.html', Math.round(loader.length / 1024) + ' KB', 'source', Math.round(page.length / 1024) + ' KB', 'long runs:', long);
if (long) { console.error('refusing: a line holds a 40+ character run (GitHub push protection)'); process.exit(1); }
