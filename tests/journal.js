// Payroll journal for Odoo (balanced to the halala), its mapping and tracker, and the bank salary-file layouts: node tests/journal.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-11-04T06:00:00Z') }); // October is complete
B.ctx.DEFAULT_SETTINGS.adminSeesPay = false; // strict mode: the administrator maps accounts but sees no journal amounts
const devs = {}, ids = {}, toks = {};
function tok(no, fresh) { if (toks[no] && !fresh) return toks[no]; const b = B.call({ action: 'authBegin', empNo: no }); return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token); }
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no }) : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role } });
  devs[no] = new Authenticator(); const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) }); ids[no] = f.me.id; toks[no] = f.token;
}
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }
const cents = n => Math.round(n * 100);

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('4001', 'محاسب الرواتب', 'employee');
person('4002', 'مدير مالي', 'employee');
person('5002', 'مندوب مبيعات', 'employee');
person('5004', 'فني تشغيل', 'employee');
['4001', '4002'].forEach(no => call('1000', 'hrRolesSave', { id: ids[no], extraRoles: 'payroll' }));
Object.keys(toks).forEach(k => delete toks[k]);
const SAL = call('3001', 'hrDeptSave', { dept: { nameAr: 'المبيعات', costCenter: 'CC-SAL' } }).dept.id;
const OPS = call('3001', 'hrDeptSave', { dept: { nameAr: 'التشغيل', costCenter: 'CC-OPS' } }).dept.id;
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], departmentId: SAL, nationality: 'SA', hireDate: '2019-01-01' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5004'], departmentId: OPS, nationality: 'EG', hireDate: '2023-01-01', contractType: 'fixed', contractEnd: '2027-12-31' } });
call('3001', 'hrPrivateSave', { empId: ids['5002'], priv: { iban: 'SA0380000000608010167519', nationalId: '1012345678', gosiCohort: 'legacy' } });
call('3001', 'hrPrivateSave', { empId: ids['5004'], priv: { iban: 'SA0380000000608010167519', nationalId: '2123456789' } });
direct(() => {
  ['5002', '5004'].forEach(no => { const e = B.ctx.findBy_('employees', 'empNo', no); e.createdAt = '2026-09-01T00:00:00.000Z'; B.ctx.update_('employees', e); });
  const pk = { '5002': [9000, 2250, 900, { 'بدل هاتف': 200 }], '5004': [8000, 2000, 800, {}] };
  Object.keys(pk).forEach((no, i) => B.ctx.append_('compensation', { id: 'C' + no, ref: 'SAL-T' + i, empId: ids[no], effectiveFrom: '2026-01-01', basic: pk[no][0], housing: pk[no][1], transport: pk[no][2],
    otherJson: JSON.stringify(pk[no][3]), currency: 'SAR', reason: 'initial', enteredBy: ids['3001'], approvedBy: ids['4001'], approvedAt: '2026-01-01T00:00:00Z', status: 'approved', createdAt: '2026-01-01T00:00:00Z', batchId: '' }));
  const now = '2026-09-20T00:00:00.000Z';
  B.ctx.append_('requests', { id: 'R-ADV', ref: 'AD-2026-00001', empId: ids['5004'], type: 'advance', subtype: '', fromDate: '', toDate: '', days: '', amount: 1200, months: 3,
    payloadJson: JSON.stringify({ startMonth: '2026-10', installment: 400 }), reason: '', docNo: '', status: 'approved', step: 'done', stepsJson: '[]', effectJson: '{}', createdAt: now, updatedAt: now, decidedAt: now });
  B.ctx.append_('requests', { id: 'R-UNP', ref: 'LV-2026-00001', empId: ids['5004'], type: 'leave', subtype: 'unpaid', fromDate: '2026-10-05', toDate: '2026-10-06', days: 2, amount: '', months: '',
    payloadJson: '{}', reason: '', docNo: '', status: 'approved', step: 'done', stepsJson: '[]', effectJson: '{}', createdAt: now, updatedAt: now, decidedAt: now });
});
call('4001', 'payrollAdjSave', { adj: { empId: ids['5002'], month: '2026-10', code: 'bonus', amount: 500, reason: 'مكافأة مبيعات' } });
call('4001', 'payrollAdjSave', { adj: { empId: ids['5002'], month: '2026-10', code: 'other_deduction', amount: 300, reason: 'تسوية' } });
call('4001', 'payrollAdjSave', { adj: { empId: ids['5002'], month: '2026-10', code: 'fine', amount: 100, reason: 'DSC-2026-00001 جزاء' } });
const run = call('4001', 'payrollCreate', { month: '2026-10' }).run;
let r = call('4002', 'payrollApprove', { id: run.id });
ok(r.ok, 'October payroll prepared by one payroll holder and locked by the other');

console.log('The payslips, by hand');
r = call('4001', 'payrollGet', { id: run.id });
const s2 = r.slips.find(s => s.empId === ids['5002']), s4 = r.slips.find(s => s.empId === ids['5004']);
// 5002 (Saudi, legacy): 9,000 + 2,250 + 900 + 200 + 500 bonus = 12,850; GOSI 9.75% x 11,250 = 1,096.88; 300 + 100; net 11,353.12; employer 11.75% = 1,321.88; EOS 12,350 / 12 = 1,029.17
ok(s2.gross === 12850 && s2.net === 11353.12 && s2.gosiEmployee === 1096.88 && s2.gosiEmployer === 1321.88 && s2.eosAccrual === 1029.17, '5002: gross 12,850, net 11,353.12, GOSI 1,096.88 / 1,321.88, EOS 1,029.17', s2);
// 5004 (non-Saudi): 10,800; unpaid 2 x 360 = 720; advance 400; net 9,680; employer 2% x 10,000 = 200; EOS 10,800 / 24 = 450
ok(s4.gross === 10800 && s4.net === 9680 && s4.gosiEmployer === 200 && s4.eosAccrual === 450, '5004: gross 10,800, net 9,680, employer GOSI 200, EOS 450', s4);

console.log('Access and the mapping');
ok(call('5002', 'journalBuild', { id: run.id }).error === 'forbidden', 'an employee cannot see the journal');
ok(call('1000', 'journalBuild', { id: run.id }).error === 'forbidden', 'nor an administrator alone (amounts)');
r = call('4001', 'journalBuild', { id: run.id });
ok(r.ok && r.entry.problems.some(p => p.code === 'unmapped' && p.key === 'basic') && r.entry.balanced, 'before mapping: balanced, but every account is unmapped', r.entry.problems.length);
r = call('4001', 'journalStep', { id: run.id, step: 'generated' });
ok(!r.ok && r.error === 'journal_unmapped', 'export is blocked while a code is unmapped', r);
ok(call('5002', 'journalMapGet').error === 'forbidden', 'an employee cannot see the mapping');
r = call('1000', 'journalMapGet');
ok(r.ok && r.allowances.indexOf('بدل هاتف') >= 0 && r.departments.length === 2, 'the administrator opens the mapping form: codes, named allowances, departments');
ok(call('1000', 'journalMapSave', { map: { accounts: { basic: '<script>' } } }).error === 'bad_value', 'an account with markup is refused');
ok(call('1000', 'journalMapSave', { map: { accounts: { nonsense: '1' } } }).error === 'bad_value', 'an unknown key is refused');
ok(call('1000', 'journalMapSave', { map: { analytic: { NOPE: 'x' } } }).error === 'not_found', 'an analytic for an unknown department is refused');
const MAP = { journal: 'SAL', accounts: { basic: '610101', housing: '610102', transport: '610103', allowance: '610104', overtime: '610105', bonus: '610106', commission: '610106', other_earning: '610107',
  reimbursement: '620500', gosi_expense: '610201', pay_reduction: '610101', gosi_payable: '220301', net_payable: '220101', advances: '130501', fines: '220401', other_deductions: '220402',
  eos_expense: '610301', eos_provision: '230101' }, analytic: {}, netByEmployee: false };
MAP.analytic[SAL] = 'Sales'; MAP.analytic[OPS] = 'Operations';
r = call('1000', 'journalMapSave', { map: MAP });
ok(r.ok && r.map.accounts.basic === '610101' && r.map.analytic[OPS] === 'Operations', 'the administrator saves the mapping (settings JSON glMap)');

console.log('The journal entry, by hand');
r = call('4001', 'journalBuild', { id: run.id });
const E = r.entry, find = (acc, an, side) => E.lines.filter(l => l.account === acc && (an === undefined || l.analytic === an) && (side === 'cr' ? l.credit > 0 : l.debit > 0));
const dr = (acc, an) => find(acc, an, 'dr').reduce((t, l) => t + cents(l.debit), 0) / 100, cr = (acc, an) => find(acc, an, 'cr').reduce((t, l) => t + cents(l.credit), 0) / 100;
ok(E.problems.length === 0 && E.balanced && E.debit === 26651.05 && E.credit === 26651.05 && E.debitH === E.creditH, 'debits 26,651.05 = credits 26,651.05, to the halala', { d: E.debit, c: E.credit, p: E.problems });
ok(E.journal === 'SAL' && E.date === '2026-10-31' && E.ref === run.ref && E.lines.length === 19, 'journal SAL, dated 31 Oct, reference ' + run.ref + ', 19 lines', E.lines.length);
ok(dr('610101', 'Sales') === 9000 && dr('610101', 'Operations') === 8000 && dr('610102', 'Sales') === 2250 && dr('610103', 'Operations') === 800, 'Dr salaries and allowances per analytic account');
ok(dr('610104', 'Sales') === 200 && dr('610106', 'Sales') === 500, 'Dr the named allowance (general allowance account) and the bonus');
ok(dr('610201', 'Sales') === 1321.88 && dr('610201', 'Operations') === 200, 'Dr employer GOSI per department');
ok(dr('610301', 'Sales') === 1029.17 && cr('230101') === 1479.17, 'Dr / Cr the end-of-service provision');
ok(cr('610101', 'Operations') === 720, 'Cr the unpaid leave against the Operations salary expense');
ok(cr('220301') === 2618.76, 'Cr GOSI payable: 1,096.88 employee + 1,321.88 + 200 employer = 2,618.76');
const adv = find('130501', undefined, 'cr');
ok(adv.length === 1 && adv[0].credit === 400 && adv[0].partner === '5004 فني تشغيل' && !adv[0].analytic, 'Cr the advance to receivables, with the employee as partner', adv);
ok(cr('220401') === 100 && cr('220402') === 300 && cr('220101') === 21033.12, 'Cr fines 100, other deductions 300, net salaries payable 21,033.12');
ok(E.lines.filter(l => l.debit > 0 && l.credit > 0).length === 0 && E.lines.every(l => l.account), 'each line is a debit or a credit, every one with an account');

console.log('Tracker: generated, imported, confirmed by a second person');
r = call('4001', 'journalStep', { id: run.id, step: 'generated' });
const j1 = r.log;
ok(r.ok && j1.ref === 'JV-2026-00001' && j1.status === 'generated' && j1.debit === 26651.05, 'JV-2026-00001 generated', j1);
ok(call('4001', 'journalStep', { id: run.id, step: 'generated' }).error === 'already_exists', 'one live journal per run');
ok(call('4002', 'myTasks').tasks.some(t => t.kind === 'journal_import' && t.target.sec === 'journal'), 'the bell asks payroll to import it into Odoo');
r = call('3001', 'complianceCalendar');
ok(r.items.some(x => x.kind === 'journal_pending' && x.month === '2026-10' && x.status === 'generated'), 'the calendar shows October\'s journal not confirmed yet');
MAP.netByEmployee = true;
call('1000', 'journalMapSave', { map: MAP });
r = call('4002', 'journalStep', { id: run.id, step: 'imported', odooRef: 'SAL/2026/10/0042' });
ok(!r.ok && r.error === 'journal_changed', 'the mapping changed after the file was made: import refused', r);
ok(call('4001', 'journalStep', { id: run.id, step: 'cancelled' }).error === 'note_required', 'cancelling needs a note');
ok(call('4001', 'journalStep', { id: run.id, step: 'cancelled', note: 'صافي الرواتب لكل موظف' }).ok, 'cancelled with a note');
r = call('4001', 'journalBuild', { id: run.id });
ok(r.entry.balanced && r.entry.lines.filter(l => l.account === '220101').length === 2 && r.entry.lines.length === 20, 'net payable now one line per employee (partner); still balanced');
r = call('4001', 'journalStep', { id: run.id, step: 'generated' });
ok(r.ok && r.log.ref === 'JV-2026-00002', 'generated again: JV-2026-00002');
ok(call('4002', 'journalStep', { id: run.id, step: 'imported' }).error === 'missing_fields', 'the Odoo reference is required');
r = call('4002', 'journalStep', { id: run.id, step: 'imported', odooRef: 'SAL/2026/10/0042' });
ok(r.ok && r.log.status === 'imported' && r.log.odooRef === 'SAL/2026/10/0042', 'imported in Odoo as SAL/2026/10/0042');
ok(call('3001', 'myTasks').tasks.some(t => t.kind === 'journal_confirm'), 'someone else is asked to confirm');
ok(call('4002', 'journalStep', { id: run.id, step: 'confirmed' }).error === 'second_approver_required', 'the importer cannot confirm');
ok(call('4001', 'journalStep', { id: run.id, step: 'confirmed' }).error === 'second_approver_required', 'nor the one who generated it');
r = call('3001', 'journalStep', { id: run.id, step: 'confirmed' });
ok(r.ok && r.log.status === 'confirmed', 'a third person (HR, who holds payroll rights) confirms');
r = call('3001', 'journalList');
ok(r.ok && r.runs[0].journal.status === 'confirmed' && r.history.length === 2, 'the list shows the confirmed journal and the cancelled one');
ok(!call('3001', 'complianceCalendar').items.some(x => x.kind === 'journal_pending'), 'and the calendar item is gone');

console.log('Bank and Mudad salary files (verify each layout with the bank)');
r = call('4001', 'wpsFile', { id: run.id, format: 'alrajhi' });
ok(r.ok && r.errors === 0 && r.formats.length === 5 && r.layout.verify === true && r.layout.missing.indexOf('companyCode') >= 0, 'Al Rajhi layout: flagged "verify", and the company code is missing', r.layout && r.layout.missing);
ok(call('4001', 'bankSetupSave', { setup: { debitIban: 'SA0380000000608010167518' } }).error === 'bad_iban', 'the company debit IBAN is checked (mod 97)');
ok(call('5002', 'bankSetupSave', { setup: {} }).error === 'forbidden', 'an employee cannot change the bank setup');
ok(call('4001', 'bankSetupSave', { setup: { molId: '7-1234567', debitIban: 'SA0380000000608010167519', companyCode: { alrajhi: 'BG001', snb: 'SNB77', riyad: 'RB55' } } }).ok, 'payroll saves the establishment and bank identifiers');
r = call('4001', 'wpsFile', { id: run.id, format: 'alrajhi', valueDate: '2026-11-05' });
const Lr = r.layout;
ok(Lr.missing.length === 0 && Lr.count === 2 && Lr.total === 21033.12 && Lr.header[0].join('|') === 'H|BG001|SA0380000000608010167519|20261105|21033.12|2|' + run.ref, 'header: company, debit account, value date, total 21,033.12, 2 records', Lr.header);
ok(Lr.records.length === 2 && Lr.records.every(x => x[0] === 'D' && x.length === Lr.columns.length) && Lr.trailer[0].join('|') === 'T|2|21033.12', 'detail records and the control trailer');
r = call('4001', 'wpsFile', { id: run.id, format: 'mudad' });
ok(r.layout.records.length === 2 && r.layout.header[0][1] === '7-1234567' && r.layout.fileName === 'MUDAD_7-1234567_202610', 'Mudad layout with the establishment number', r.layout.fileName);
['snb', 'riyad'].forEach(f => { const x = call('4001', 'wpsFile', { id: run.id, format: f }).layout; ok(x && x.records.length === 2 && x.trailer[0][2] === '21033.12', f + ' layout totals match'); });
ok(call('4001', 'wpsFile', { id: run.id }).layout === null, 'without a format the general file is unchanged');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
