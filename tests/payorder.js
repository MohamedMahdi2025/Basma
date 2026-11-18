// Pay-item order (docs/research/2026-11-18-pay-item-order-rea.md): js/payroll.js and js/variance.js carry the same list and rule,
// and the rule puts every line where the study says. node tests/payorder.js
const fs = require('fs');
const path = require('path');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('  FAIL ' + m); } };
const grab = (file) => {
  const s = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const a = s.indexOf('var PAY_ORDER = '), b = s.indexOf('\n}', s.indexOf('function payRank(')) + 2;
  return a < 0 || b < 2 ? '' : s.slice(a, b);
};
const p = grab('js/payroll.js'), v = grab('js/variance.js');
ok(p && v, 'both files define PAY_ORDER and payRank');
ok(p.replace(/\s+/g, ' ') === v.replace(/\s+/g, ' '), 'payroll.js and variance.js agree word for word');
const payRank = new Function(p + '; return payRank;')();
const L = (kind, code, label) => ({ kind, code, label });
const order = (ls) => ls.slice().sort((a, b) => payRank(a.kind, a.code, a.label) - payRank(b.kind, b.code, b.label)).map((l) => l.code + (l.label ? ':' + l.label : ''));
const earn = order([L('earning', 'bonus'), L('earning', 'other_earning'), L('earning', 'overtime'), L('earning', 'transport'), L('earning', 'housing'), L('earning', 'allowance', 'بدل طعام'), L('earning', 'basic'), L('earning', 'commission'), L('earning', 'arrears')]);
ok(earn.join(',') === 'basic,housing,transport,allowance:بدل طعام,arrears,overtime,commission,bonus,other_earning', 'earnings: GOSI wage, fixed allowances, arrears, variable (overtime first), other');
const ded = order([L('deduction', 'other_deduction'), L('deduction', 'unpaid_leave'), L('deduction', 'other_deduction', 'انضمام جديد'), L('deduction', 'advance'), L('deduction', 'fine'), L('deduction', 'fine', 'مخالفات مرورية'), L('deduction', 'gosi'), L('deduction', 'absence')]);
ok(ded.join(',') === 'gosi,fine:مخالفات مرورية,fine,advance,unpaid_leave,absence,other_deduction:انضمام جديد,other_deduction', 'deductions: GOSI, traffic fines, penalties, loans, leave and absence, new joiner, other');
ok(payRank('earning', 'something_new') < payRank('deduction', 'gosi'), 'an unknown earning still sits before every deduction');
ok(payRank('deduction', 'something_new') > payRank('deduction', 'other_deduction'), 'an unknown deduction goes last');
ok(payRank('e', 'housing') === payRank('earning', 'housing') && payRank('d', 'gosi') === payRank('deduction', 'gosi'), "'e'/'d' prefixes rank like the kinds");
// the printed payslip sorts its lines too (it did not before 2026-11-18)
const pj = fs.readFileSync(path.join(__dirname, '..', 'js/payroll.js'), 'utf8');
ok(/var ear = inOrder\(s\.lines\.filter/.test(pj), 'printed payslip lists earnings in pay order');
// server and register split lines by their own name the same way
const g = fs.readFileSync(path.join(__dirname, '..', 'backend/Payroll.gs'), 'utf8');
ok(/function lineKey_\(l\)/.test(g) && !/l\.label && l\.code !== 'basic' \? ':' \+ l\.label/.test(g), 'server builds every line key with lineKey_');
const lk = new Function(g.slice(g.indexOf('function lineKey_(l)'), g.indexOf('\n}', g.indexOf('function lineKey_(l)')) + 2) + '; return lineKey_;')();
const rs = pj.indexOf('function regKey(l)'), re = pj.indexOf("); }", rs) + 4;
const rk = new Function(pj.slice(rs, re) + '; return regKey;')();
[L('deduction', 'fine', 'مخالفات مرورية'), L('earning', 'basic', 'x'), Object.assign(L('earning', 'bonus', 'شكر على الأداء'), { ref: 'ADJ-1' }), L('earning', 'allowance', 'بدل: هاتف')].forEach((l) =>
  ok(lk(l) === rk(l), 'same key on screen and server for ' + l.code + (l.label ? ' / ' + l.label : '') + ' -> ' + lk(l)));
console.log('\n' + pass + ' passed, ' + fail + ' failed');
