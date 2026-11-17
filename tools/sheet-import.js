// Sends the parsed payroll sheets (tools/salary-sheets.py output) to the live home organisation (Demo.gs sheetImport_).
//   node tools/sheet-import.js <salaries.json> [--owner 1000] [--go]
// Without --go it is a dry run: the server checks everything and writes nothing. The setup key is read from
// ../apps-script/SETUP-KEY.txt and never printed. Personal data is sent only to the company's own Apps Script.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const DEP = (fs.readFileSync(path.join(ROOT, 'tools/deploy.sh'), 'utf8').match(/DEP="?([A-Za-z0-9_-]{40,})/) || [])[1];
const URL = 'https://script.google.com/macros/s/' + DEP.slice(2) + '/exec';
const KEY = fs.readFileSync(path.join(ROOT, '../apps-script/SETUP-KEY.txt'), 'utf8').trim();

// Arabic names for the sheet's departments (the English stays as nameEn; "Maintanance" is the sheet's spelling).
const DEPTS = { Operations: 'العمليات', Remotely: 'العمل عن بعد', Finance: 'المالية', Maintanance: 'الصيانة', Management: 'الإدارة',
  HR: 'الموارد البشرية', Fleet: 'الأسطول', 'Executive Management': 'الإدارة التنفيذية', Administration: 'الشؤون الإدارية' };
const LINE_KEYS = ['nid', 'row', 'payMethod', 'basic', 'housing', 'transport', 'otherAllow', 'bonus', 'gross', 'gosi', 'penalties', 'loan', 'leave',
  'newJoiner', 'otherDed', 'totalDed', 'net'];
const PERSON_KEYS = ['nid', 'empNo', 'name', 'nationality', 'department', 'position', 'sponsor', 'costCenter', 'reliability', 'joined', 'lastDay',
  'status', 'months', 'isSaudi', 'iban', 'ibanOk', 'payToOther', 'bank'];
const pick = (o, ks) => Object.fromEntries(ks.filter(k => k in o).map(k => [k, o[k]]));

(async () => {
  const file = process.argv[2], go = process.argv.includes('--go');
  const owner = (process.argv[process.argv.indexOf('--owner') + 1] || '1000');
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (d.problems && d.problems.length) throw new Error(d.problems.length + ' sheet problems: fix the sheets first');
  const months = Object.fromEntries(Object.entries(d.months).map(([m, ls]) => [m, ls.map(l => pick(l, LINE_KEYS))]));
  const body = { action: 'demoData', setupKey: KEY, mode: 'sheetImport', ownerNo: owner, dryRun: !go, depts: DEPTS,
    people: d.people.map(p => pick(p, PERSON_KEYS)), months };
  const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' });
  const text = await res.text();
  let r; try { r = JSON.parse(text); } catch (e) { throw new Error('not JSON (' + res.status + '): ' + text.slice(0, 300)); }
  console.log(JSON.stringify(r, null, 1));
  // the sheet's own totals, to compare with the server's
  console.log('sheet totals:', JSON.stringify(d.report));
})().catch(e => { console.error(e.message); process.exit(1); });
