// Payroll variance analysis (2026-11-04): a run against the two months before it. node tests/variance.js
const crypto = require('crypto');
const { load } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const B = load({ setupKeyHash: crypto.createHash('sha256').update('k').digest('hex'), now: Date.parse('2026-11-04T06:00:00Z') });
B.raw({ action: 'bootstrap', orgId: '1001', setupKey: 'k', name: 'مدير', empNo: '1000' });
const L = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const org = B.raw({ action: 'orgCreate', setupKey: 'k', logo: L, nameAr: 'شركة', unn: '7000000077', adminName: 'م' });
const imp = (month, rows) => B.raw({ action: 'orgImport', setupKey: 'k', id: org.orgId, month, rows });
const A = { branch: 'فرع 1', empNo: '11', name: 'أحمد', days: 30, basic: 4000, housing: 1000 };
const S = { branch: 'فرع 1', empNo: '12', name: 'سارة', days: 30, basic: 3000 };
const K = { branch: 'فرع 2', empNo: '13', name: 'خالد', days: 30, basic: 2500 };
imp('2026-08', [A, S, K]);
imp('2026-09', [A, S, K]);
// October: Ahmed's basic rises and he gets a bonus, Sara has absence and an advance, Khalid left, Mona joined
imp('2026-10', [Object.assign({}, A, { basic: 4500, bonus: 500 }), Object.assign({}, S, { days: 25, absence: 500, advance: 300 }), { branch: 'فرع 2', empNo: '14', name: 'منى', days: 30, basic: 2800 }]);
B.ctx.setOrg_(B.ctx.orgRec_(org.orgId));
const runs = B.ctx.readAll_('payrollRuns'), oct = runs.find(r => r.month === '2026-10');
const v = B.ctx.api_payrollVariance({ id: oct.id }, { id: 'X', role: 'hr', extraRoles: 'payroll' });
const by = n => v.people.find(p => p.name === n);
ok(v.ok && v.months.m1 === '2026-09' && v.months.m2 === '2026-08' && v.months.have1 && v.months.have2, 'compares October with September and August', v.months);
ok(v.totals.headcount.m0 === 3 && v.totals.headcount.m1 === 3, 'headcount this run and last month', v.totals.headcount);
ok(by('خالد') && by('خالد').flags.indexOf('leaver') >= 0, 'Khalid was paid before and not now: leaver', by('خالد'));
ok(by('منى') && by('منى').flags.indexOf('joiner') >= 0, 'Mona is new: joiner', by('منى') && by('منى').flags);
const a = by('أحمد');
ok(a.flags.indexOf('package_change') >= 0 && a.flags.indexOf('net_up') >= 0 && a.flags.some(f => f.indexOf('new_line:e:bonus') === 0), 'Ahmed: basic changed, net up, a new bonus line', a.flags);
ok(a.lines['e:basic'][0] === 4500 && a.lines['e:basic'][1] === 4000 && a.lines['e:basic'][2] === 4000, 'each line shown for the three months', a.lines['e:basic']);
const s = by('سارة');
ok(s.flags.indexOf('net_down') >= 0 && s.flags.indexOf('deductions_spike') >= 0 && s.flags.indexOf('absence') >= 0, 'Sara: net down, deductions spike, absence', s.flags);
ok(v.people[0].score >= v.people[v.people.length - 1].score, 'riskiest first');
const br = v.bridge;
ok(Math.abs(br.from + br.joiners + br.leavers + br.stayers - br.to) < 0.01, 'the bridge adds up: last month + joiners + leavers + changes = this month', br);
ok(v.departments.length === 2 && v.lines.some(l => l.code === 'e:bonus' && l.m0 === 500 && l.m1 === 0), 'by department and by pay line', v.lines.map(l => l.code));
const v2 = B.ctx.api_payrollVariance({ id: oct.id, pct: 50, min: 2000 }, { id: 'X', role: 'hr', extraRoles: 'payroll' });
ok(v2.people.find(p => p.name === 'سارة').flags.indexOf('net_down') < 0, 'a higher threshold quiets smaller changes', v2.threshold);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
