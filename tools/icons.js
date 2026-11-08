// Subset the Phosphor icon fonts to the icons the app actually references.  node tools/icons.js
//
// Before: three render-blocking stylesheets and three fonts from unpkg (about 840 KB) for 1,530 icons per weight.
// After: one small inline stylesheet and three small fonts of our own holding only the icons the code mentions.
// An icon is "used" when its name appears as a word anywhere in index.html or js/*.js (class names like ph-house, quoted names
// like 'house', names in lookup tables). Over-including a word that happens to be an icon name costs a few bytes; missing an icon
// would show an empty square, so the scan errs on the side of keeping.
// tools/build.js refuses to build when a ph('name') literal is missing from the subset: run this script again after adding an icon.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const SRC = path.join(__dirname, '..'), V = path.join(__dirname, 'vendor', 'phosphor'), OUT = path.join(SRC, 'icons');
const WEIGHTS = [
  { id: 'regular', css: 'regular.css', font: 'Phosphor.woff2', family: 'Phosphor', cls: '.ph', rule: /\.ph\.ph-([a-z0-9-]+):(before|after)\s*\{([^}]*)\}/g },
  { id: 'fill', css: 'fill.css', font: 'Phosphor-Fill.woff2', family: 'Phosphor-Fill', cls: '.ph-fill', rule: /\.ph-fill\.ph-([a-z0-9-]+):(before|after)\s*\{([^}]*)\}/g },
  { id: 'duotone', css: 'duotone.css', font: 'Phosphor-Duotone.woff2', family: 'Phosphor-Duotone', cls: '.ph-duotone', rule: /\.ph-duotone\.ph-([a-z0-9-]+):(before|after)\s*\{([^}]*)\}/g }
];
const files = ['index.html'].concat(fs.readdirSync(path.join(SRC, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f));
const text = files.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
const words = new Set(); (text.match(/[a-z][a-z0-9-]*/g) || []).forEach(w => { words.add(w); if (w.indexOf('ph-') === 0) words.add(w.slice(3)); });

fs.mkdirSync(OUT, { recursive: true });
const manifest = { generated: new Date().toISOString().slice(0, 10), weights: {} }, cssParts = [];
let total = 0;
WEIGHTS.forEach(w => {
  const css = fs.readFileSync(path.join(V, w.css), 'utf8');
  const all = {}; let m; w.rule.lastIndex = 0;
  while ((m = w.rule.exec(css))) { const n = m[1]; (all[n] = all[n] || []).push({ pseudo: m[2], body: m[3].replace(/\s+/g, ' ').trim() }); }
  const names = Object.keys(all).filter(n => words.has(n)).sort();
  const cps = [];
  names.forEach(n => all[n].forEach(r => { const c = /content:\s*"\\([0-9a-f]+)"/i.exec(r.body); if (c) cps.push(c[1]); }));
  const outFont = path.join(OUT, 'phosphor-' + w.id + '.woff2');
  cp.execFileSync('python', ['-m', 'fontTools.subset', path.join(V, w.font), '--unicodes=' + cps.map(c => 'U+' + c).join(','), '--flavor=woff2', '--layout-features=', '--no-hinting', '--output-file=' + outFont], { stdio: 'pipe' });
  const size = fs.statSync(outFont).size; total += size;
  // base rules: everything before the first icon rule (the @font-face and the class that selects the font), re-pointed at our file
  const head = css.slice(0, css.search(/\.ph[a-z-]*\.ph-[a-z0-9-]+:before/)).replace(/@font-face\s*\{[^}]*\}/, '').trim();
  const fontFace = '@font-face{font-family:"' + w.family + '";src:url(icons/phosphor-' + w.id + '.woff2) format("woff2");font-weight:normal;font-style:normal;font-display:block}';
  const rules = names.map(n => all[n].map(r => w.cls + '.ph-' + n + ':' + r.pseudo + '{' + r.body + '}').join('')).join('');
  cssParts.push(fontFace + head.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{};:,])\s*/g, '$1') + rules);
  manifest.weights[w.id] = { icons: names.length, fontBytes: size, names };
  console.log(w.id.padEnd(8) + String(names.length).padStart(4) + ' icons  font ' + Math.round(size / 1024) + ' KB (was ' + Math.round(fs.statSync(path.join(V, w.font)).size / 1024) + ' KB)');
});
const css = cssParts.join('\n');
fs.writeFileSync(path.join(OUT, 'icons.inline.css'), css);
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest));
console.log('inline css ' + Math.round(css.length / 1024) + ' KB (was 395 KB), fonts ' + Math.round(total / 1024) + ' KB (was 443 KB)');

// check: every ph('literal') in the source has its glyph
const lit = new Set(); let q; const re = /\bph\('([a-z0-9-]+)'/g; while ((q = re.exec(text))) lit.add(q[1]);
const missing = Array.from(lit).filter(n => manifest.weights.regular.names.indexOf(n) < 0);
console.log(lit.size + ' ph(...) literals checked; ' + (missing.length ? 'NOT in the Phosphor set (typo or removed icon): ' + missing.join(', ') : 'all present'));
