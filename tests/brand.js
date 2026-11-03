// Organisation colours (2026-10-22): whatever colour a company picks, its generated palette stays readable. node tests/brand.js
const fs = require('fs'), path = require('path'), vm = require('vm');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const a = html.indexOf('var GREEN_LITERALS = '), b = html.indexOf('function applyBrand(hex, home, accent){');
const ctx = {}; vm.createContext(ctx); vm.runInContext(html.slice(a, b), ctx);
const W = [255, 255, 255];
console.log('Palette from any brand colour');
['#4D6D51', '#2F5D8C', '#FFD400', '#F8BBD0', '#FFFFFF', '#000000', '#E30613', '#00A3E0', '#7B2D8E', '#C8A2C8'].forEach(hex => {
  const p = ctx.brandPalette(hex), brand = ctx.hexRgb(p['--brand']), pine = ctx.hexRgb(p['--pine']), ink = ctx.hexRgb(p['--ink']), paper = ctx.hexRgb(p['--paper']);
  ok(ctx.contrast(brand, W) >= 4.5, hex + ': white text on the primary passes AA (' + ctx.contrast(brand, W).toFixed(2) + ':1)');
  ok(ctx.contrast(pine, W) >= 10 && ctx.contrast(ink, paper) >= 12, hex + ': dark chrome and body text stay strongly readable', { chrome: ctx.contrast(pine, W).toFixed(1), text: ctx.contrast(ink, paper).toFixed(1) });
});
ok(Array.isArray(ctx.GREEN_LITERALS.hex) && ctx.GREEN_LITERALS.hex.length > 50, 'every brand shade of the design is known to the theme (' + ctx.GREEN_LITERALS.hex.length + ' shades)');
const code = fs.readdirSync(path.join(__dirname, '..', 'js')).map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n') + html;
const raw = (code.replace(/var\(--g-[0-9A-F]{6},#[0-9A-F]{6}\)/gi, '').match(/[:(,\s]#(4D6D51|1C2A1F|2F6B48|173F2A)\b/gi) || []).length;
ok(raw === 0, 'no brand green is left as a raw value in a style (all go through tokens)', raw);
console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
