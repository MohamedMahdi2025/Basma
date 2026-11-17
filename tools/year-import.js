// Sends the full-period payroll (tools/year-build.py output) to the live home organisation (Demo.gs sheetYear_).
//   node tools/year-import.js <year-payload.json> [--go]
// Without --go it is a dry run. The setup key is read from ../apps-script/SETUP-KEY.txt and never printed.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const DEP = (fs.readFileSync(path.join(ROOT, 'tools/deploy.sh'), 'utf8').match(/DEP="?([A-Za-z0-9_-]{40,})/) || [])[1];
const URL = 'https://script.google.com/macros/s/' + DEP.slice(2) + '/exec';
const KEY = fs.readFileSync(path.join(ROOT, '../apps-script/SETUP-KEY.txt'), 'utf8').trim();
const DEPTS = { Operations: 'العمليات', Remotely: 'العمل عن بعد', Finance: 'المالية', Maintanance: 'الصيانة', Maintenance: 'الصيانة', Management: 'الإدارة',
  HR: 'الموارد البشرية', Fleet: 'الأسطول', 'Executive Management': 'الإدارة التنفيذية', Administration: 'الشؤون الإدارية' };
const LINE = ['nid', 'row', 'payMethod', 'basic', 'housing', 'transport', 'otherAllow', 'bonus', 'gross', 'gosi', 'traffic', 'penalties', 'loan', 'leave', 'newJoiner',
  'otherDed', 'grossDiff', 'totalDed', 'net', 'transferred', 'advanceSelf', 'advanceOther', 'action', 'route', 'matchedByName'];
const PERSON = ['nid', 'noId', 'empNo', 'name', 'nameEn', 'nationality', 'department', 'position', 'sponsor', 'costCenter', 'reliability', 'joined', 'months', 'isSaudi', 'iban', 'ibanOk', 'payToOther', 'bank'];
const pick = (o, ks) => Object.fromEntries(ks.filter(k => k in o).map(k => [k, o[k]]));
(async () => {
  const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), go = process.argv.includes('--go');
  const months = Object.fromEntries(Object.entries(d.months).map(([m, ls]) => [m, ls.map(l => pick(l, LINE))]));
  const body = { action: 'demoData', setupKey: KEY, mode: 'sheetYear', ownerNo: '1000', dryRun: !go, depts: DEPTS, netOnly: d.netOnly, notes: d.notes || {}, people: d.people.map(p => pick(p, PERSON)), months };
  const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' });
  const text = await res.text();
  try { console.log(JSON.stringify(JSON.parse(text), null, 1)); } catch (e) { throw new Error('not JSON (' + res.status + '): ' + text.slice(0, 300)); }
})().catch(e => { console.error(e.message); process.exit(1); });
