// Whole-month payroll variance (2026-11-17): every pay group added, any base, every dimension, filters. node tests/variance-month.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const C = load({ setupKeyHash: sha('k'), now: Date.parse('2026-10-05T06:00:00Z') });
const bt = C.call({ action: 'bootstrap', setupKey: 'k', name: 'المالك', empNo: '1000' });
const dv = new Authenticator();
const e1 = C.call({ action: 'enrollBegin', empNo: '1000', code: bt.activationCode });
const tk = C.call({ action: 'enrollFinish', credential: dv.create(e1.options) }).token;
const P = o => Object.assign({ nationality: 'باكستاني', department: 'Operations', position: 'Driver', sponsor: 'شركة أ', costCenter: 'Al-Nassem النسيم', reliability: 'Sponsored',
  joined: '2024-01-01', lastDay: '', status: 'Active', months: ['2026-07', '2026-08', '2026-09'], isSaudi: false, iban: '', ibanOk: false, payToOther: false, bank: '' }, o);
const people = [
  P({ nid: '3630000001', empNo: '1000', name: 'المالك', department: 'Finance', costCenter: 'HQ الاداره', sponsor: 'شركة ب' }),
  P({ nid: '2000000001', empNo: '1001', name: 'Ali Riyadh' }),
  P({ nid: '2000000002', empNo: '1002', name: 'Omar Arar', costCenter: '(Al-Musadiyah-Arar)المساعدية عرعر', sponsor: 'شركة ب' }),
  P({ nid: '2000000003', empNo: '1003', name: 'Leaver Jed', costCenter: 'Jeddah جدة', months: ['2026-07', '2026-08'] }),
  P({ nid: '1000000004', empNo: '1004', name: 'سعود', nationality: 'سعودي', isSaudi: true, reliability: 'Saudi', months: ['2026-09'] }),
];
const L = (nid, o) => Object.assign({ nid, row: 2, payMethod: 'WPS', basic: 0, housing: 0, transport: 0, otherAllow: 0, bonus: 0, gross: 0, gosi: 0, penalties: 0, loan: 0, leave: 0, newJoiner: 0, otherDed: 0, totalDed: 0, net: 0 }, o);
const pay = (nid, basic, extra) => { const o = Object.assign({ basic, housing: 0, bonus: 0, loan: 0 }, extra || {}); const g = o.basic + o.housing + o.bonus; return L(nid, Object.assign(o, { gross: g, totalDed: o.loan, net: g - o.loan })); };
const months = {
  '2026-07': [pay('3630000001', 8000), pay('2000000001', 2000), pay('2000000002', 2000), pay('2000000003', 2000)],
  '2026-08': [pay('3630000001', 8000), pay('2000000001', 2000), pay('2000000002', 2000), pay('2000000003', 2000)],
  '2026-09': [pay('3630000001', 8000), pay('2000000001', 2500, { bonus: 500 }), pay('2000000002', 2000, { loan: 300 }), pay('1000000004', 4000)],
};
const imp = C.call({ action: 'demoData', setupKey: 'k', mode: 'sheetImport', ownerNo: '1000', depts: { Operations: 'العمليات', Finance: 'المالية' }, people, months, dryRun: false });
ok(imp.ok && imp.runs === 6, 'fixture: two pay groups over three months', imp);
C.ctx.READ_MEMO_ = {};
const owner = C.ctx.readAll_('employees').find(e => e.empNo === '1000');
C.ctx.update_('employees', Object.assign({}, owner, { extraRoles: 'payroll' }));
C.ctx.READ_MEMO_ = {};
const V = extra => C.call(Object.assign({ action: 'payrollVarianceMonth', token: tk }, extra));
let v = V({});
const by = n => v.people.find(p => p.name === n);
ok(v.ok && v.month === '2026-09' && v.baseMonths[0] === '2026-08' && v.months[0] === '2026-09', 'defaults to the latest month against the one before', v.ok ? { m: v.month, b: v.baseMonths } : v);
ok(v.totals.headcount.cur === 4 && v.totals.headcount.base === 4, 'every pay group of the month is added (4 now, 4 before)', v.totals && v.totals.headcount);
ok(by('Ali Riyadh') && !by('Ali Riyadh').flags.includes('leaver') && !by('Ali Riyadh').flags.includes('joiner'), 'nobody is a false leaver or joiner because of pay groups', by('Ali Riyadh') && by('Ali Riyadh').flags);
ok(by('Leaver Jed') && by('Leaver Jed').flags.includes('leaver') && by('سعود').flags.includes('joiner'), 'real leaver and joiner found');
ok(by('Ali Riyadh').flags.includes('package_change') && by('Ali Riyadh').flags.includes('one_off'), 'package change and one-off bonus flagged', by('Ali Riyadh').flags);
const br = v.bridge;
ok(Math.abs(br.from + br.joiners + br.leavers + br.stayers - br.to) < 0.01, 'the bridge adds up', br);
const sumD = Object.keys(v.drivers).reduce((t, k) => t + v.drivers[k], 0);
ok(Math.abs(sumD - br.stayers) < 0.01 && v.drivers.advances === -300 && v.drivers.oneoff === 500, 'drivers add up to the stayers\' change', v.drivers);
ok(Math.abs(v.volumeRate.headcountEffect + v.volumeRate.rateEffect - (br.to - br.from)) < 0.01, 'volume + rate = whole change');
const city = k => v.dims.city.find(r => r.key === k);
ok(city('عرعر') && city('جدة') && city('الرياض') && city('الرياض').source === 'assumed', 'cities from location names; Riyadh marked assumed', v.dims.city.map(r => r.key + ':' + r.source));
ok(['department', 'location', 'city', 'payGroup', 'nationality', 'saudi', 'employmentType', 'title'].every(k => Array.isArray(v.dims[k]) && v.dims[k].length), 'every dimension has a breakdown');
const dimSum = k => v.dims[k].reduce((t, r) => t + r.netCur, 0);
ok(['department', 'city', 'payGroup', 'location'].every(k => Math.abs(dimSum(k) - v.totals.net.cur) < 0.01), 'each breakdown adds up to the total');
v = V({ filters: { city: ['عرعر'] } });
ok(v.people.length === 1 && v.people[0].name === 'Omar Arar' && v.totals.net.cur === 1700, 'city filter narrows people and totals', v.totals && v.totals.net);
ok(v.options.city.length >= 3, 'filter options still list every city');
v = V({ filters: { payGroup: ['شركة ب'], saudi: ['nonSaudi'] } });
ok(v.people.length >= 1 && v.people.every(p => p.dims.payGroup === 'شركة ب' && p.dims.saudi === 'nonSaudi'), 'filters combine');
v = V({ filters: { flags: ['leaver', 'joiner'] } });
ok(v.people.length === 2, 'flag filter', v.people.map(p => p.name));
v = V({ filters: { q: '1002' } });
ok(v.people.length === 1 && v.people[0].empNo === '1002', 'search by employee number');
v = V({ compare: 'avg3' });
ok(v.baseMonths.length === 3 && v.haveBase.length === 2, 'average of three months, only months with runs counted', v.haveBase);
v = V({ month: '2026-08', compare: '2026-07' });
ok(v.month === '2026-08' && v.totals.net.change.diff === 0, 'any two months can be compared');
v = V({ compare: 'yoy' });
ok(v.ok && v.totals.headcount.base === 0 && v.people.every(p => p.flags.includes('joiner') || p.flags.includes('returner')), 'same month last year with no run: all new, no error');
v = V({});
ok(v.trend.length === 12 && v.trend[11].month === '2026-09' && v.trend[11].headcount === 4 && v.trend[0].none, 'twelve-month trend');
ok(C.call({ action: 'payrollVarianceMonth', token: 'x' }).ok === false, 'needs a session');
let refused = false; try { C.ctx.api_payrollVarianceMonth({}, { id: 'E', role: 'employee', extraRoles: '' }); } catch (e) { refused = /forbidden/.test(String(e.message)); }
ok(refused, 'an employee is refused');
const cities = C.call({ action: 'varianceCities', token: tk, mode: 'save', map: { 'Al-Nassem النسيم': 'الرياض' } });
ok(cities.ok && cities.locations.find(l => l.location === 'Al-Nassem النسيم').source === 'set', 'a city set by HR wins over the guess', cities);
C.ctx.READ_MEMO_ = {};
v = V({});
const riy = v.dims.city.find(r => r.key === 'الرياض');
ok(riy && riy.assumed === 1 && riy.headCur + riy.headBase > 2, 'each city says how many of its people are on a guessed city (HQ still assumed, Al-Nassem now set)', riy);
console.log('Monthly payroll by sponsor');
const pv = C.call({ action: 'payrollPivot', token: tk, detail: '2026-09' });
ok(pv.ok && pv.months.join() === '2026-07,2026-08,2026-09' && pv.sponsors.length === 2, 'months and sponsors', pv.ok ? { m: pv.months, s: pv.sponsors } : pv);
const cell = (m, s) => pv.cells.find(c => c.month === m && c.sponsor === s) || {};
ok(cell('2026-09', 'شركة ب').net === 9700 && cell('2026-09', 'شركة أ').net === 7000, 'each month x sponsor cell is the sum of its payslips', pv.cells);
ok(pv.totals.every(t => Math.abs(pv.sponsors.reduce((a, s) => a + (cell(t.month, s).net || 0), 0) - t.net) < 0.01), 'month totals = sum of the sponsors');
ok(pv.totals[2].net === 16700 && pv.totals[2].headcount === 4, 'September total', pv.totals[2]);
ok(pv.rows.length === 4 && pv.rows.every(r => r.sponsor && r.lines) && pv.rows.find(r => r.empNo === '1002').lines['d:advance:قسط سلفة / قرض'] === 300, 'detail: every payslip of the month with its lines', pv.rows.map(r => r.empNo));
ok(Math.abs(pv.rows.reduce((t, r) => t + r.net, 0) - pv.totals[2].net) < 0.01, 'the detail adds up to the month total');
let pvRefused = false; try { C.ctx.api_payrollPivot({}, { id: 'E', role: 'employee', extraRoles: '' }); } catch (e) { pvRefused = /forbidden/.test(String(e.message)); }
ok(pvRefused, 'an employee is refused the sponsor report');
console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
