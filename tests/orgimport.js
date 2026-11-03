// Platform import of a company's salary sheet (2026-11-03): cost centres, employees, packages and a month's payroll as the sheet.
// node tests/orgimport.js
const crypto = require('crypto');
const { load } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-11-03T06:00:00Z') });
B.raw({ action: 'bootstrap', orgId: '1001', setupKey: 'k', name: 'مدير', empNo: '1000' });
const org = B.raw({ action: 'orgCreate', setupKey: 'k', logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', color: '#1E6B3F', accent: '#C98500', nameAr: 'ونس', unn: '7056469011', adminName: 'صبحي' });
ok(org.ok, 'organisation created', org);
ok(B.raw({ action: 'orgCreate', setupKey: 'k', nameAr: 'بلا شعار', unn: '7000000001', adminName: 'م' }).error === 'logo_required', 'a new organisation needs its logo');
const chk = B.raw({ action: 'orgCheck', orgId: org.orgId });
ok(chk.ok && chk.logoVer && chk.brandColor === '#1E6B3F' && chk.brandAccent === '#C98500', 'it is born with its logo and the two colours read from it', chk);
const set = B.raw({ action: 'orgBrandSet', setupKey: 'k', id: org.orgId, logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', color: '#2F5D8C', accent: '' });
ok(set.ok && B.raw({ action: 'orgCheck', orgId: org.orgId }).brandColor === '#2F5D8C', 'the platform owner can change an organisation logo and theme later');
const rows = [
  { branch: 'الإدارة العامة', empNo: '', name: 'حسين', days: 30, basic: 12000, housing: 0, transport: 0, net: 12000 },
  { branch: 'فرع 1 - كافيه', empNo: '6', name: 'رقيب', days: 27, basic: 1700, absence: 170, fine: 28, advance: 100, net: 1402 },
  { branch: 'فرع 1 - كافيه', empNo: '8', name: 'سعد', days: 30, basic: 3000, housing: 500, transport: 300, bonus: 300, other: 15, net: 4085 },
  { branch: 'فرع 2 - لاونج', empNo: '80', name: 'رحمن', days: 30, basic: 1800, net: 0, note: 'الصافي صفر في الكشف' }
];
ok(B.raw({ action: 'orgImport', setupKey: 'bad', id: org.orgId, month: '2026-10', rows }).error === 'bad_setup_key', 'only the platform owner imports');
const r = B.raw({ action: 'orgImport', setupKey: 'k', id: org.orgId, month: '2026-10', rows });
ok(r.ok && r.departments.length === 3 && r.departments.map(d => d.costCenter).join() === 'CC-01,CC-02,CC-03', 'three branches become departments with cost centres CC-01..03', r);
ok(r.created === 4 && r.numbered === 1, 'four employees; the one without a number gets the next one', r);
ok(r.totals.headcount === 4 && r.totals.net === 12000 + 1402 + 4085 + 0, 'the run equals the sheet net, the row left at 0 included', r.totals);
ok(r.totals.gross === 12000 + 1700 + 3800 + 300 + 1800 && r.totals.gosiEmployee === 0, 'gross as the sheet (bonus included), no GOSI added', r.totals);
ok(r.mismatch.length === 1 && r.mismatch[0].name === 'رحمن', 'the row whose sheet net is 0 is reported and withheld', r.mismatch);
ok(B.raw({ action: 'orgImport', setupKey: 'k', id: org.orgId, month: '2026-10', rows }).error === 'run_exists', 'importing the same month twice is refused');
// the run cannot be recalculated by the system rules
B.ctx.setOrg_(B.ctx.orgRec_(org.orgId));
const runRow = B.ctx.readAll_('payrollRuns').filter(x => x.month === '2026-10')[0];
ok(runRow && runRow.scope === 'import' && runRow.status === 'draft', 'the run is a draft marked import, waiting for the organisation payroll to approve', runRow);
const comps = B.ctx.readAll_('compensation');
ok(comps.length === 4 && comps.every(c => c.status === 'approved' && c.effectiveFrom === '2026-10-01'), 'packages approved from 1 October', comps.map(c => c.status + c.effectiveFrom));
const emps = B.ctx.readAll_('employees');
ok(emps.some(e => e.empNo === '6' && e.department === 'فرع 1 - كافيه'), 'numbers from the sheet are kept, department set');
B.ctx.setOrg_(B.ctx.orgRec_('1001'));
ok(B.ctx.readAll_('employees').length === 1, 'nothing landed in the home organisation');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
