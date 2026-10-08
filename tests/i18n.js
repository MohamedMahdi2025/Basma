// Strings: every server error code, bell kind, calendar kind and sub-page name has an Arabic and an English text,
// and every t('key') in the Wave 1 screens is defined in both languages. node tests/i18n.js
// A key counts as defined in both languages when it is written as `key:'...'` at least twice across index.html and
// js/*.js (one Object.assign(T.ar, ...) and one Object.assign(T.en, ...)); a raw key on screen is a defect (DESIGN.md 9).
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra).slice(0, 900) : '')); } }

const gs = fs.readdirSync(path.join(ROOT, 'backend')).filter(f => f.endsWith('.gs')).map(f => fs.readFileSync(path.join(ROOT, 'backend', f), 'utf8')).join('\n');
const jsFiles = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js'));
const client = [fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')].concat(jsFiles.map(f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'))).join('\n');
const defs = {};
{ const re = /(?:^|[\s{,])([A-Za-z_][A-Za-z0-9_]*)\s*:\s*['"]/g; let m; while ((m = re.exec(client))) defs[m[1]] = (defs[m[1]] || 0) + 1; }
const both = k => (defs[k] || 0) >= 2;
const all = (re, src) => { const out = new Set(); let m; while ((m = re.exec(src))) out.add(m[1]); return [...out].sort(); };

console.log('Server error codes');
const codes = all(/fail_\('([a-z_0-9]+)'\)/g, gs).concat(all(/error: '([a-z_0-9]+)'/g, gs)).filter((x, i, a) => a.indexOf(x) === i);
const missE = codes.filter(c => !both('e_' + c));
ok(missE.length === 0, codes.length + ' error codes each have an ar and an en message', missE);

console.log('Bell and calendar');
const bellKinds = all(/add\('([a-z_0-9]+)',[^\n]*\{ ?tab:/g, gs);
const missTk = bellKinds.filter(k => !both('tk_' + k));
ok(bellKinds.length > 20 && missTk.length === 0, bellKinds.length + ' bell kinds each have a label', missTk);
const iconKinds = all(/([a-z_0-9]+): '[a-z-]+'/g, (client.match(/var TK_ICON = \{[\s\S]*?\};/) || [''])[0]);
const missIc = bellKinds.filter(k => iconKinds.indexOf(k) < 0 && k !== 'delegated');
ok(missIc.length === 0, 'each bell kind has an icon', missIc);
const calKinds = all(/add\('([a-z_0-9]+)', (?!\w+\.length|n\b|[a-z]+\.filter|sec\b|mine\b)[^\n;]*?(?:ctx\.emps|null|, e\b|, e,|emp\b)/g, gs).filter(k => bellKinds.indexOf(k) < 0 || ['iqama_renewal', 'ticket_due'].indexOf(k) >= 0);
const missCk = calKinds.filter(k => !both('ck_' + k));
ok(calKinds.length > 10 && missCk.length === 0, calKinds.length + ' calendar kinds each have a label', missCk);
const dest = (client.match(/var SEC_DEST = \{[\s\S]*?\};/) || [''])[0];
const secs = all(/sec: '([a-z]+)'/g, gs);
const missSec = secs.filter(x => dest.indexOf(x + ':') < 0);
ok(secs.length > 10 && missSec.length === 0, 'every bell target section opens a page (SEC_DEST)', missSec);

console.log('Pages');
const subs = all(/\bn: '([A-Za-z]+)'/g, (client.match(/var AREAS = \[[\s\S]*?\n\];/) || [''])[0]);
const missVw = subs.filter(k => !both(k));
ok(subs.length > 30 && missVw.length === 0, subs.length + ' sub-page names in both languages', missVw);
const subIds = all(/id: '([a-z]+)', n:/g, (client.match(/var AREAS = \[[\s\S]*?\n\];/) || [''])[0]);
const areaIds = all(/\{ id: '([a-z]+)', i:/g, (client.match(/var AREAS = \[[\s\S]*?\n\];/) || [''])[0]);
const badDest = all(/: '([a-z]+:[a-z]+)'/g, dest).filter(d => areaIds.indexOf(d.split(':')[0]) < 0 || subIds.indexOf(d.split(':')[1]) < 0);
ok(badDest.length === 0, 'every SEC_DEST target is a real area and sub-page', badDest);

console.log('Wave 1 screens');
['flows.js', 'gov.js', 'expenses.js', 'journal.js'].forEach(f => {
  const src = fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
  const used = all(/\bt\('([A-Za-z][A-Za-z0-9_]*)'\)/g, src);
  const miss = used.filter(k => !both(k));
  ok(used.length > 20 && miss.length === 0, f + ': ' + used.length + ' strings, each in ar and en', miss);
  ok(!/Best Gas|الناقل الأفضل/.test(src), f + ': no literal company name');
  ok(!/#[0-9A-Fa-f]{6}\b/.test(src.replace(/\/\/.*$/gm, '')), f + ': colours from the design tokens only');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
