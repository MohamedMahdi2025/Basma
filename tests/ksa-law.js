// KSA statutory golden numbers (Labour Law incl. the 2025 amendments, Social Insurance Law 2024): node tests/ksa-law.js
// Every expected figure below is worked by hand in the comment next to it; none is copied from the code.
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const near = (a, b, tol = 0.01) => Math.abs(a - b) <= tol;
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const T0 = Date.parse('2026-10-14T06:00:00Z');
const B = load({ setupKeyHash: sha('k'), now: T0 });
const C = B.ctx;

// ---------------------------------------------------------------- end of service (Art. 84, 85, 80, 87)
console.log('End of service award, wage 10,000 (Art. 84 half a month for each of the first 5 years, a month after)');
// full award: min(y,5)*5,000 + max(0,y-5)*10,000
const FULL = { 1.5: 7500, 2: 10000, 3: 15000, 5: 25000, 7: 45000, 10: 75000, 12: 95000 };
// Art. 85 resignation: <2 none, 2-<5 a third, 5-<10 two thirds, 10+ all
const RESIGN = { 1.5: 0, 2: 3333.33, 3: 5000, 5: 16666.67, 7: 30000, 10: 75000, 12: 95000 };
Object.keys(FULL).forEach(k => {
  const y = Number(k);
  const res = C.eosAward_(y, 10000, 'resignation').award, term = C.eosAward_(y, 10000, 'termination').award;
  const a80 = C.eosAward_(y, 10000, 'art80').award, a87 = C.eosAward_(y, 10000, 'art87_marriage').award, fm = C.eosAward_(y, 10000, 'art87_force_majeure').award;
  ok(near(res, RESIGN[k]), y + ' years, resignation = ' + RESIGN[k], res);
  ok(near(term, FULL[k]), y + ' years, termination by the employer = ' + FULL[k], term);
  ok(a80 === 0, y + ' years, Art. 80 dismissal = 0', a80);
  ok(near(a87, FULL[k]) && near(fm, FULL[k]), y + ' years, Art. 87 (marriage / force majeure) = full ' + FULL[k], [a87, fm]);
});
ok(near(C.eosAward_(4.999, 10000, 'resignation').factor, 1 / 3) && near(C.eosAward_(9.999, 10000, 'resignation').factor, 2 / 3), 'Art. 85 bands are "less than" 5 and 10 years');
// Art. 116: unpaid leave beyond 20 days is outside service; 30 unpaid days -> 10 excluded
(function () {
  const reqs = [{ empId: 'E', type: 'leave', subtype: 'unpaid', status: 'approved', fromDate: '2024-03-01', toDate: '2024-03-30' }];
  const s = C.eosService_({ id: 'E' }, '2021-01-01', '2025-12-31', reqs);
  // 2021-01-01..2025-12-31 = 1826 days (2024 is leap); minus 10
  ok(s.excluded === 10 && s.days === 1816, 'Art. 116: a 30-day unpaid leave takes 10 days off the service (1826 - 10 = 1816)', s);
})();

// ---------------------------------------------------------------- GOSI rates
console.log('GOSI rates by cohort and contribution month');
const R = (s, c, m) => { const r = C.gosiRates_(s, c, m); return [r.emp, r.er]; };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// legacy (registered before 3 Jul 2024): annuity 9 + SANED 0.75 / annuity 9 + SANED 0.75 + hazards 2
ok(eq(R(true, 'legacy', '2026-06'), [9.75, 11.75]) && eq(R(true, 'legacy', '2026-07'), [9.75, 11.75]), 'legacy Saudi: 9.75% / 11.75% in June and July 2026 (no step)');
// new law (first registered from 3 Jul 2024): annuity +0.5% each side every July 2025-2028
ok(eq(R(true, 'new', '2025-06'), [9.75, 11.75]), 'new cohort, Jun 2025: 9.75 / 11.75');
ok(eq(R(true, 'new', '2026-06'), [10.25, 12.25]), 'new cohort, Jun 2026: 10.25 / 12.25 (annuity 9.5)');
ok(eq(R(true, 'new', '2026-07'), [10.75, 12.75]), 'new cohort, Jul 2026: 10.75 / 12.75 (annuity 10)');
ok(eq(R(true, 'new', '2028-07'), [11.75, 13.75]) && eq(R(true, 'new', '2031-01'), [11.75, 13.75]), 'new cohort tops out at annuity 11: 11.75 / 13.75 from Jul 2028');
ok(eq(R(false, 'new', '2026-07'), [0, 2]), 'non-Saudi: employer 2% occupational hazards only');

// ---------------------------------------------------------------- payslips (calcSlip_ with a hand-built context)
console.log('Payslips');
function ctx(month, comps, extra) {
  const first = month + '-01', last = C.monthLast_(month);
  return Object.assign({ month, first, last, s: { eosWageBasis: 'total' }, now: new Date(T0), today: first, comps, reqs: [], adjs: [],
    off: () => null, byEmpDay: {}, priv: {}, advDone: {} }, extra || {});
}
function comp(empId, basic, housing, transport, other) {
  return { id: 'C' + empId, empId, effectiveFrom: '2020-01-01', basic, housing, transport, otherJson: JSON.stringify(other || {}), status: 'approved', createdAt: '2020-01-01T00:00:00Z' };
}
const emp = (id, o) => Object.assign({ id, hireDate: '2022-01-01', isSaudi: true, dailyHours: 8, createdAt: '2022-01-01T00:00:00Z' }, o || {});
const amt = (s, code) => s.lines.filter(l => l.code === code).reduce((t, l) => t + l.amount, 0);

// GOSI per month: basic 8,000 + housing 2,000 = 10,000 base
let s = C.calcSlip_(emp('G1'), ctx('2026-06', [comp('G1', 8000, 2000, 500)], { priv: { G1: { gosiCohort: 'new', iban: 'x' } } }));
ok(near(s.gosiEmployee, 1025) && near(s.gosiEmployer, 1225), 'new cohort, June 2026, base 10,000: employee 1,025.00, employer 1,225.00', [s.gosiEmployee, s.gosiEmployer]);
s = C.calcSlip_(emp('G1'), ctx('2026-07', [comp('G1', 8000, 2000, 500)], { priv: { G1: { gosiCohort: 'new', iban: 'x' } } }));
ok(near(s.gosiEmployee, 1075) && near(s.gosiEmployer, 1275), 'new cohort, July 2026, base 10,000: employee 1,075.00, employer 1,275.00', [s.gosiEmployee, s.gosiEmployer]);
s = C.calcSlip_(emp('G2'), ctx('2026-07', [comp('G2', 8000, 2000, 500)], { priv: { G2: { gosiCohort: 'legacy', iban: 'x' } } }));
ok(near(s.gosiEmployee, 975) && near(s.gosiEmployer, 1175), 'legacy, July 2026, base 10,000: 975.00 / 1,175.00 (transport excluded)', [s.gosiEmployee, s.gosiEmployer]);
s = C.calcSlip_(emp('G3'), ctx('2026-07', [comp('G3', 50000, 12500, 0)], { priv: { G3: { gosiCohort: 'legacy', iban: 'x' } } }));
ok(near(s.gosiEmployee, 4387.5) && near(s.gosiEmployer, 5287.5), 'cap: base 62,500 capped at 45,000 -> 4,387.50 / 5,287.50', [s.gosiEmployee, s.gosiEmployer]);
s = C.calcSlip_(emp('G4'), ctx('2026-07', [comp('G4', 1000, 250, 0)], { priv: { G4: { gosiCohort: 'legacy', iban: 'x' } } }));
ok(near(s.gosiEmployee, 146.25) && near(s.gosiEmployer, 176.25), 'floor: Saudi base 1,250 raised to 1,500 -> 146.25 / 176.25', [s.gosiEmployee, s.gosiEmployer]);
s = C.calcSlip_(emp('G5', { isSaudi: false, nationality: 'EG' }), ctx('2026-07', [comp('G5', 8000, 2000, 800)], { priv: { G5: { iban: 'x' } } }));
ok(s.gosiEmployee === 0 && near(s.gosiEmployer, 200), 'non-Saudi base 10,000: employee 0, employer 2% = 200.00', [s.gosiEmployee, s.gosiEmployer]);
s = C.calcSlip_(emp('G6', { isSaudi: false, nationality: 'KW' }), ctx('2026-07', [comp('G6', 8000, 2000, 0)], { priv: { G6: { iban: 'x' } } }));
ok(s.warnings.indexOf('gosi_gcc_national') >= 0, 'a GCC national is flagged: GOSI applies the home-country scheme (GCC extension), not the 2% expat rate', s.warnings);
// housing in kind: GOSI values it at two months' basic a year (basic x 2/12); with no cash housing the slip says so
s = C.calcSlip_(emp('G7'), ctx('2026-07', [comp('G7', 6000, 0, 500)], { priv: { G7: { gosiCohort: 'legacy', iban: 'x' } } }));
ok(s.warnings.indexOf('gosi_housing_zero') >= 0 && near(s.info.gosi.inKindWage, 7000), 'no cash housing: warning + in-kind GOSI wage 6,000 + 1,000 = 7,000', [s.warnings, s.info.gosi]);

// part-month: hired 15 Oct -> 17 days of 30
s = C.calcSlip_(emp('P1', { hireDate: '2026-10-15', createdAt: '2026-10-15T00:00:00Z' }), ctx('2026-10', [comp('P1', 6000, 1500, 600)], { priv: { P1: { gosiCohort: 'new', iban: 'x' } } }));
ok(s.info.paidDays === 17 && near(amt(s, 'basic'), 3400) && near(amt(s, 'housing'), 850), 'joined 15 Oct: 17/30 -> basic 3,400.00, housing 850.00', [s.info.paidDays, amt(s, 'basic')]);

// overtime Art. 107: total 8,000, basic 6,000, 8 h: 8,000/240 = 33.333 + 0.5 x 6,000/240 = 12.5 -> 45.8333/h x 10 = 458.33
s = C.calcSlip_(emp('O1'), ctx('2026-09', [comp('O1', 6000, 1500, 500)], { priv: { O1: { gosiCohort: 'legacy', iban: 'x' } },
  adjs: [{ empId: 'O1', code: 'overtime_hours', amount: 10, month: '2026-09' }] }));
ok(near(amt(s, 'overtime'), 458.33), 'Art. 107: 10 overtime hours = 458.33', amt(s, 'overtime'));

// fines Art. 70: at most 5 days' (actual) wage a month: 8,000/30 x 5 = 1,333.33
s = C.calcSlip_(emp('F1'), ctx('2026-09', [comp('F1', 6000, 1500, 500)], { priv: { F1: { gosiCohort: 'legacy', iban: 'x' } },
  adjs: [{ empId: 'F1', code: 'fine', amount: 3000, month: '2026-09' }] }));
ok(near(amt(s, 'fine'), 1333.33) && s.warnings.indexOf('fine_capped') >= 0, 'Art. 70: a 3,000 fine is cut to 5 days = 1,333.33', amt(s, 'fine'));

// Art. 93 half the wage: due 8,000 -> 4,000. GOSI 7,500 x 9.75% = 731.25; fine 1,333.33; other 5,000 cut to 1,935.42
s = C.calcSlip_(emp('H1'), ctx('2026-09', [comp('H1', 6000, 1500, 500)], { priv: { H1: { gosiCohort: 'legacy', iban: 'x' } },
  adjs: [{ empId: 'H1', code: 'fine', amount: 3000, month: '2026-09' }, { empId: 'H1', code: 'other_deduction', amount: 5000, month: '2026-09' }] }));
ok(near(s.deductions, 4000) && near(s.net, 4000) && near(amt(s, 'other_deduction'), 1935.42) && near(amt(s, 'gosi'), 731.25), 'Art. 93: deductions held at 4,000 (GOSI 731.25 + fine 1,333.33 + other 1,935.42)', [s.deductions, amt(s, 'other_deduction')]);

// sick pay Art. 117: 40 days -> 30 full + 10 at 75%; daily 8,000/30 -> deduction 10 x 266.667 x 0.25 = 666.67
s = C.calcSlip_(emp('S1'), ctx('2026-09', [comp('S1', 6000, 1500, 500)], { priv: { S1: { gosiCohort: 'legacy', iban: 'x' } },
  reqs: [{ empId: 'S1', type: 'leave', subtype: 'sick', status: 'approved', fromDate: '2026-08-22', toDate: '2026-09-30', days: 40, effectJson: JSON.stringify({ sick: { full: 30, p75: 10, unpaid: 0 } }) }] }));
// days 1-30 = 22 Aug..20 Sep (full); 21-30 Sep = 10 days at 75%
ok(near(amt(s, 'sick_75'), 666.67), 'Art. 117: 10 days at three quarters cost 666.67', amt(s, 'sick_75'));

// monthly EOS provision: <5 years 8,000/24 = 333.33; >=5 years 8,000/12 = 666.67
s = C.calcSlip_(emp('E1', { hireDate: '2024-01-01' }), ctx('2026-09', [comp('E1', 6000, 1500, 500)], { priv: { E1: { gosiCohort: 'legacy', iban: 'x' } } }));
ok(near(s.eosAccrual, 333.33), 'EOS provision under 5 years: 333.33 a month', s.eosAccrual);
s = C.calcSlip_(emp('E2', { hireDate: '2019-01-01' }), ctx('2026-09', [comp('E2', 6000, 1500, 500)], { priv: { E2: { gosiCohort: 'legacy', iban: 'x' } } }));
ok(near(s.eosAccrual, 666.67), 'EOS provision after 5 years: 666.67 a month', s.eosAccrual);

// ---------------------------------------------------------------- sick tiers
console.log('Sick tiers (Art. 117: 30 full, 60 at 75%, 30 unpaid in a year from the first sick day)');
let sp = C.sickSplit_('S', '2026-01-10', 40, [], null);
ok(sp.full === 30 && sp.p75 === 10 && sp.unpaid === 0, '40 days: 30 full + 10 at 75%', sp);
const prior = [{ empId: 'S', type: 'leave', subtype: 'sick', status: 'approved', fromDate: '2026-01-10', toDate: '2026-02-18', days: 40 }];
sp = C.sickSplit_('S', '2026-05-01', 70, prior, null);
ok(sp.full === 0 && sp.p75 === 50 && sp.unpaid === 20, 'then 70 more in the same year: 50 at 75% + 20 unpaid', sp);
prior.push({ empId: 'S', type: 'leave', subtype: 'sick', status: 'approved', fromDate: '2026-05-01', toDate: '2026-07-09', days: 70 });
sp = C.sickSplit_('S', '2026-09-01', 15, prior, null);
ok(sp.unpaid === 10 && sp.over === 5, 'then 15 more: 10 unpaid, 5 beyond the 120-day year', sp);
sp = C.sickSplit_('S', '2027-01-10', 5, prior, null);
ok(sp.full === 5 && sp.usedBefore === 0, 'a new sick year starts after 365 days: full pay again', sp);

// ---------------------------------------------------------------- annual leave
console.log('Annual leave (Art. 109) and unpaid leave (Art. 116)');
ok(near(C.accrueBetween_({ hireDate: '2020-01-01' }, '2021-01-01', '2021-12-31'), 21), 'a year in the first five: 21 days');
ok(near(C.accrueBetween_({ hireDate: '2020-01-01' }, '2025-01-01', '2025-12-31'), 30), 'a year after five years: 30 days');
(function () {
  const e = { id: 'L', hireDate: '2020-01-01', createdAt: '2020-01-01T00:00:00Z', leaveOpeningDate: '2024-12-31', leaveOpeningDays: 0 };
  const reqs = [{ empId: 'L', type: 'leave', subtype: 'unpaid', status: 'approved', fromDate: '2025-03-01', toDate: '2025-03-30', days: 30 }];
  const b = C.annualBalance_(e, '2025-12-31', reqs, null);
  // 2025 earns 30; only the 10 days beyond the 20th suspend the contract: 30 - 10 x 30/365 = 29.18
  ok(near(b.accrued, 29.18), 'Art. 116: a 30-day unpaid leave pauses accrual for 10 days only (30 - 0.82 = 29.18)', b);
})();

// ---------------------------------------------------------------- resignation (Art. 75, 2025)
console.log('Resignation (2025 amendments)');
let q = C.quote_({ id: 'NOPE', noticeDays: 15 }, { type: 'resignation', payload: {} }, null);
ok(q.payload && q.payload.noticeDays === 30 && q.payload.minLastDay === '2026-11-13', 'Art. 75: notice from the employee is at least 30 days even if the file says 15', q);
q = C.quote_({ id: 'NOPE', noticeDays: 45 }, { type: 'resignation', payload: {} }, null);
ok(q.payload && q.payload.noticeDays === 45, 'a longer contractual notice (45) is kept', q.payload);
ok(C.resignationAcceptBy_({ createdAt: '2026-10-01T09:00:00Z' }) === '2026-10-31', 'Art. 79 (2025): a resignation not answered within 30 days counts as accepted on day 30', C.resignationAcceptBy_({ createdAt: '2026-10-01T09:00:00Z' }));

// ---------------------------------------------------------------- end-of-service quote through the API
console.log('End-of-service quote (api_eosQuote)');
const devs = {}, ids = {}, toks = {};
function tok(no, fresh) {
  if (toks[no] && !fresh) return toks[no];
  const b = B.call({ action: 'authBegin', empNo: no });
  return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token);
}
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no })
    : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role, email: no + '@bestgas.sa' } });
  devs[no] = new Authenticator();
  const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) });
  ids[no] = f.me.id; toks[no] = f.token;
}
function direct(fn) { C.USE_TAB_CACHE_ = false; C.TAB_PREFETCH_ = null; C.READ_MEMO_ = {}; const v = C.withLock_(fn); C.READ_MEMO_ = {}; return v; }
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('3002', 'محاسب الرواتب', 'employee');
person('5001', 'موظف', 'employee');
B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3002'], extraRoles: 'payroll' }); tok('3002', true);
call('3001', 'hrEmpSave', { emp: { id: ids['5001'], hireDate: '2019-10-15', nationality: 'SA' } });
direct(() => C.append_('compensation', Object.assign(comp(ids['5001'], 6000, 1500, 500), { ref: 'SAL-T1', approvedBy: ids['3002'], approvedAt: '2020-01-01T00:00:00Z', reason: 'initial', currency: 'SAR', enteredBy: ids['3001'], batchId: '' })));
direct(() => C.append_('settings', { key: 'eosWageBasis', value: 'basic_housing' }));
C.CacheService.getScriptCache().remove('settings:v1');
// 2019-10-15 .. 2026-10-14 = 2557 days / 365 = 7.0055 years; Art. 84 on the actual wage 8,000 (not basic + housing 7,500):
// 5 x 4,000 + 2.0055 x 8,000 = 36,043.84; resignation two thirds = 24,029.22
let r = call('3002', 'eosQuote', { empId: ids['5001'], lastDay: '2026-10-14', reason: 'resignation' });
ok(r.ok && r.eos.wage === 8000 && near(r.eos.fullAward, 36043.84) && near(r.eos.award, 24029.22), 'Art. 84 uses the last actual wage 8,000 even when eosWageBasis is basic_housing', r.eos || r);
ok(r.ok && (r.eos.warnings || []).indexOf('eos_basis_below_actual') >= 0, 'and says the basic + housing setting is below the statutory wage', r.eos && r.eos.warnings);
ok(r.ok && r.eos.dueDays === 14 && r.eos.dueBy === '2026-10-28', 'Art. 88: resignation settled within two weeks', r.eos && r.eos.dueBy);
r = call('3002', 'eosQuote', { empId: ids['5001'], lastDay: '2026-10-14', reason: 'termination' });
ok(r.ok && near(r.eos.award, 36043.84) && r.eos.dueDays === 7, 'termination: full award, due within a week', r.eos);

// ---------------------------------------------------------------- resignation deemed acceptance, enforced (2025, 2026-10-18)
console.log('Resignation deemed acceptance (enforced) and the written deferral up to 60 days');
person('5002', 'مستقيل مؤجل', 'employee');
person('5003', 'مستقيل بلا رد', 'employee');
const rsg = (id, ref, no, created) => direct(() => C.append_('requests', { id, ref, empId: ids[no], type: 'resignation', subtype: '', fromDate: '', toDate: '', days: '', amount: '', months: '',
  reason: 'ظروف شخصية', docNo: '', payloadJson: JSON.stringify({ lastDay: '2026-11-30', noticeDays: 30, minLastDay: '2026-11-13' }), status: 'pending', step: 'hr', stepsJson: '[]',
  requestedBy: ids[no], createdAt: created, updatedAt: created, decidedAt: '' }));
// RS-T2: submitted 2026-09-01, accept-by 2026-10-01 (+30), today 2026-10-14: already deemed accepted
rsg('RQT2', 'RS-2026-09002', '5003', '2026-09-01T08:00:00Z');
const hrRow = () => C.findBy_('employees', 'id', ids['3001']);
let thrown = '';
try { direct(() => C.api_reqDecide({ id: 'RQT2', decision: 'reject', note: 'لا' }, hrRow())); } catch (e) { thrown = String(e.message); }
ok(thrown === 'E:deemed_accepted', 'past day 30 HR can no longer reject the resignation', thrown);
const swept = C.resignationDeemedSweep_(true);
const t2 = direct(() => C.findBy_('requests', 'id', 'RQT2')), e3 = direct(() => C.findBy_('employees', 'id', ids['5003']));
ok(swept.indexOf('RS-2026-09002') >= 0 && t2.status === 'approved' && t2.step === 'done', 'the sweep accepts it as the system', [swept, t2.status]);
ok(JSON.parse(t2.stepsJson).some(h => h.by === 'system' && h.decision === 'deemed_accepted'), 'the history records a system "deemed accepted" step');
ok(String(e3.resignedOn).slice(0, 10) === '2026-09-01' && String(e3.lastWorkingDay).slice(0, 10) === '2026-11-30', 'same effect as an approval: resigned on the submission day, last day kept', [e3.resignedOn, e3.lastWorkingDay]);
ok(direct(() => C.readAll_('clearance')).some(x => x.empId === ids['5003'] && x.reason === 'resignation'), 'the offboarding clearance opens');
ok(C.resignationDeemedSweep_(true).length === 0, 'a second sweep changes nothing');
// RS-T1: submitted 2026-09-20, accept-by 2026-10-20; HR may defer to at most 2026-11-19 (+60)
rsg('RQT1', 'RS-2026-09001', '5002', '2026-09-20T08:00:00Z');
let d = call('5002', 'resignationDefer', { id: 'RQT1', until: '2026-11-10', reason: 'x' });
ok(!d.ok && d.error === 'forbidden', 'an employee cannot defer (HR only)', d);
d = call('3001', 'resignationDefer', { id: 'RQT1', until: '2026-11-20', reason: 'تسليم الأعمال' });
ok(!d.ok && d.error === 'bad_date', 'deferral beyond 60 days from submission (2026-11-19) is refused', d);
d = call('3001', 'resignationDefer', { id: 'RQT1', until: '2026-11-19', reason: '' });
ok(!d.ok && d.error === 'note_required', 'the written reason is required', d);
d = call('3001', 'resignationDefer', { id: 'RQT1', until: '2026-11-19', reason: 'تسليم الأعمال' });
ok(d.ok && d.request.resignation.acceptBy === '2026-11-19' && d.request.resignation.deferUntil === '2026-11-19' && d.request.resignation.deferReason === 'تسليم الأعمال' && !d.request.resignation.deemedAccepted,
  'deferred to day 60: the new accept-by day and the reason show on the request', d.request && d.request.resignation);
d = call('3001', 'resignationDefer', { id: 'RQT1', until: '2026-11-19', reason: 'مرة ثانية' });
ok(!d.ok && d.error === 'bad_date', 'it cannot be pushed again past the same limit', d);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
