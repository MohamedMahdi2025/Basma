// Owner-approved package changes (Demo.gs packageSet_): node tools/package-set.js <rows.json> [--go]
// rows.json: [{ empNo, effectiveFrom, basic, housing?, transport?, gosiWage?, reason? }]. Without --go: dry run.
// The setup key is read from ../apps-script/SETUP-KEY.txt and never printed.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const DEP = (fs.readFileSync(path.join(ROOT, 'tools/deploy.sh'), 'utf8').match(/DEP="?([A-Za-z0-9_-]{40,})/) || [])[1];
const URL = 'https://script.google.com/macros/s/' + DEP.slice(2) + '/exec';
const KEY = fs.readFileSync(path.join(ROOT, '../apps-script/SETUP-KEY.txt'), 'utf8').trim();
(async () => {
  const rows = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow',
    body: JSON.stringify({ action: 'demoData', setupKey: KEY, mode: 'packageSet', rows, dryRun: !process.argv.includes('--go') }) });
  const text = await res.text();
  try { console.log(JSON.stringify(JSON.parse(text), null, 1)); } catch (e) { throw new Error('not JSON (' + res.status + '): ' + text.slice(0, 300)); }
})().catch(e => { console.error(e.message); process.exit(1); });
