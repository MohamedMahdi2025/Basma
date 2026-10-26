// Whole-company simulation: 50 people, one month, every cycle end to end, on the real backend. node tests/sim50.js
// Fictional data only: names, IBANs (valid mod 97) and ID numbers are made up. Add --verbose to print every check.
'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { load, Authenticator, DeviceKey } = require('./harness');
const VERBOSE = process.argv.includes('--verbose');
const T_START = Date.now();
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('sim-key') });
B.ctx.DEFAULT_SETTINGS.adminSeesPay = false; // these checks prove the strict mode: pay kept apart from administration (the default lets the admin hold payroll)

// ---------------- checks, grouped by cycle ----------------
const CY = {}, ORDER = [], NOTES = [];
let CUR = '';
function cycle(name) { CUR = name; if (!CY[name]) { CY[name] = { ok: 0, fail: 0, fails: [] }; ORDER.push(name); } if (VERBOSE) console.log('\n== ' + name); }
function ok(c, name, extra) {
  const cy = CY[CUR];
  if (c) { cy.ok++; if (VERBOSE) console.log('  ok  ' + name); return true; }
  cy.fail++; cy.fails.push(name);
  console.log('  FAIL [' + CUR + '] ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra).slice(0, 700) : ''));
  return false;
}
const near2 = (a, b, tol) => Math.abs(Number(a) - Number(b)) <= (tol == null ? 0.011 : tol);
const r2 = n => Math.round((Number(n) || 0) * 100) / 100;

// ---------------- time (Riyadh, +03:00) ----------------
function at(date, hm) { B.setNow(Date.parse(date + 'T' + (hm || '09:00') + ':00+03:00')); }
const addDays = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
const dow = d => new Date(d + 'T00:00:00Z').getUTCDay();
const hmMin = hm => { const p = hm.split(':'); return +p[0] * 60 + +p[1]; };
const minHm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
let seed = 20261001;
const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const between = (a, b) => a + Math.floor(rnd() * (b - a + 1));

// ---------------- fictional identities ----------------
/** A Saudi IBAN for a 20-character BBAN with correct ISO 13616 check digits. */
function iban(bban) {
  const s = (bban + 'SA00').replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55));
  let rem = 0; for (const ch of s) rem = (rem * 10 + Number(ch)) % 97;
  return 'SA' + String(98 - rem).padStart(2, '0') + bban;
}
const ibanFor = no => iban('80' + '0000000000' + String(no).padStart(8, '0'));
const idFor = (no, saudi) => (saudi ? '1' : '2') + '00000' + String(no).padStart(4, '0');

// ---------------- the company ----------------
const DEPTS = [ // key, Arabic, English, parent, head, cost centre
  ['ceo', 'مكتب الرئيس التنفيذي', 'CEO Office', '', 1001, 'CC100'], ['fin', 'الإدارة المالية', 'Finance', '', 1004, 'CC200'],
  ['acc', 'الحسابات', 'Accounts', 'fin', 1005, 'CC210'], ['trs', 'الخزينة', 'Treasury', 'fin', 1008, 'CC220'],
  ['hr', 'الموارد البشرية', 'Human Resources', '', 1011, 'CC300'], ['ops', 'العمليات', 'Operations', '', 1014, 'CC400'],
  ['dst', 'التوزيع', 'Distribution', 'ops', 1015, 'CC410'], ['stn', 'المحطات', 'Stations', 'ops', 1028, 'CC420'],
  ['mnt', 'الصيانة', 'Maintenance', '', 1034, 'CC500'], ['sal', 'المبيعات', 'Sales', '', 1038, 'CC600'],
  ['prc', 'المشتريات', 'Procurement', '', 1043, 'CC700'], ['it', 'تقنية المعلومات', 'IT', '', 1045, 'CC800'],
  ['hse', 'السلامة والصحة المهنية', 'HSE', '', 1047, 'CC900']];
const POSITIONS = [ // key, Arabic, English, grade, basic
  ['ceo', 'الرئيس التنفيذي', 'Chief Executive', 'G10', 40000], ['dir', 'مدير إدارة', 'Director', 'G9', 24000], ['adv', 'مستشار تنفيذي', 'Executive Advisor', 'G9', 22000],
  ['mgr', 'مدير قسم', 'Section Manager', 'G8', 15000], ['ssup', 'مشرف أول', 'Senior Supervisor', 'G7', 10500], ['sup', 'مشرف', 'Supervisor', 'G6', 8000],
  ['spec', 'أخصائي', 'Specialist', 'G5', 6500], ['acct', 'محاسب', 'Accountant', 'G4', 5200], ['tech', 'فني', 'Technician', 'G3', 4000],
  ['rep', 'مندوب مبيعات', 'Sales Representative', 'G3', 4000], ['drv', 'سائق توزيع', 'Delivery Driver', 'G2', 3200], ['help', 'عامل مساعد', 'Helper', 'G1', 2500]];
// no, Arabic name, gender (''=not recorded), nationality, dept, position, manager, role, extra role, hire date, contract, GOSI cohort ('-' = missing)
const P = [
  [1001, 'عبدالرحمن صالح الشمري', 'male', 'SA', 'ceo', 'ceo', 0, 'employee', '', '2014-10-05', 'indefinite'],
  [1002, 'نورة فهد القحطاني', 'female', 'SA', 'ceo', 'adv', 1001, 'employee', 'executive', '2019-03-01', 'indefinite'],
  [1003, 'هيفاء ماجد العتيبي', 'female', 'SA', 'ceo', 'acct', 1001, 'employee', '', '2021-06-15', 'indefinite'],
  [1004, 'خالد عبدالله الدوسري', 'male', 'SA', 'fin', 'dir', 1001, 'employee', '', '2015-01-10', 'indefinite'],
  [1005, 'سلطان محمد الحربي', 'male', 'SA', 'acc', 'mgr', 1004, 'employee', '', '2017-04-01', 'indefinite'],
  [1006, 'ريم سعد المطيري', 'female', 'SA', 'acc', 'acct', 1005, 'employee', '', '2020-02-01', 'indefinite'],
  [1007, 'محمود عادل حسن', 'male', 'EG', 'acc', 'acct', 1005, 'employee', '', '2022-09-01', 'fixed'],
  [1008, 'فيصل ناصر الزهراني', 'male', 'SA', 'trs', 'mgr', 1004, 'employee', '', '2018-05-20', 'indefinite'],
  [1009, 'تركي عبدالعزيز السبيعي', 'male', 'SA', 'trs', 'spec', 1008, 'employee', 'payroll', '2019-11-01', 'indefinite'],
  [1010, 'بندر علي الغامدي', 'male', 'SA', 'trs', 'tech', 1008, 'employee', '', '2023-02-01', 'fixed'],
  [1011, 'سعود إبراهيم العنزي', 'male', 'SA', 'hr', 'dir', 1001, 'hr', '', '2016-08-01', 'indefinite'],
  [1012, 'منيرة خالد الشهري', 'female', 'SA', 'hr', 'spec', 1011, 'hr', '', '2021-01-10', 'indefinite'],
  [1013, 'لمى يوسف البقمي', 'female', 'SA', 'hr', 'acct', 1011, 'employee', '', '2022-03-01', 'indefinite'],
  [1014, 'ماجد حمد السهلي', 'male', 'SA', 'ops', 'dir', 1001, 'employee', '', '2015-09-01', 'indefinite'],
  [1015, 'عبدالله فهد المالكي', 'male', 'SA', 'dst', 'mgr', 1014, 'employee', '', '2016-03-01', 'indefinite'],
  [1016, 'نايف سالم الرشيدي', 'male', 'SA', 'dst', 'sup', 1015, 'employee', '', '2018-01-15', 'indefinite'],
  [1017, 'مشعل راشد الجهني', 'male', 'SA', 'dst', 'sup', 1015, 'employee', '', '2019-07-01', 'indefinite'],
  [1018, 'عمر حسن الشمراني', 'male', 'SA', 'dst', 'drv', 1016, 'employee', '', '2020-05-01', 'indefinite'],
  [1019, 'يزيد خالد العمري', 'male', 'SA', 'dst', 'drv', 1016, 'employee', '', '2021-03-15', 'indefinite'],
  [1020, 'ثامر سعيد الأحمري', 'male', 'SA', 'dst', 'drv', 1016, 'employee', '', '2022-01-10', 'indefinite'],
  [1021, 'عمران أكرم', 'male', 'PK', 'dst', 'drv', 1016, 'employee', '', '2023-06-01', 'fixed'],
  [1022, 'شاهد إقبال', 'male', 'PK', 'dst', 'drv', 1017, 'employee', '', '2019-10-01', 'fixed'],
  [1023, 'راجيش كومار', 'male', 'IN', 'dst', 'drv', 1017, 'employee', '', '2024-02-01', 'fixed'],
  [1024, 'أحمد سمير عبدالفتاح', 'male', 'EG', 'dst', 'drv', 1017, 'employee', '', '2019-09-01', 'fixed'],
  [1025, 'سامي عوض البلوي', 'male', 'SA', 'dst', 'drv', 1017, 'employee', '', '2024-08-15', 'fixed'],
  [1026, 'حمد صالح الدعجاني', 'male', 'SA', 'dst', 'help', 1016, 'employee', '', '2023-11-01', 'indefinite'],
  [1027, 'رفيق الإسلام', 'male', 'BD', 'dst', 'help', 1016, 'employee', '', '2025-01-05', 'fixed'],
  [1028, 'زياد عبدالرحمن القرني', 'male', 'SA', 'stn', 'mgr', 1014, 'employee', '', '2017-02-01', 'indefinite'],
  [1029, 'وليد مبارك الدوسري', 'male', 'SA', 'stn', 'sup', 1028, 'employee', '', '2020-09-01', 'indefinite'],
  [1030, 'صالح علي اليافعي', 'male', 'YE', 'stn', 'tech', 1029, 'employee', '', '2022-11-01', 'fixed'],
  [1031, 'مازن عبدالله الحارثي', 'male', 'SA', 'stn', 'tech', 1029, 'employee', '', '2024-09-15', 'indefinite'],
  [1032, 'عثمان الطيب محمد', 'male', 'SD', 'stn', 'tech', 1029, 'employee', '', '2023-04-01', 'fixed'],
  [1033, 'فهد ناصر القحطاني', 'male', 'SA', 'stn', 'tech', 1029, 'employee', '', '2023-08-01', 'indefinite'],
  [1034, 'إبراهيم سليمان الفيفي', 'male', 'SA', 'mnt', 'mgr', 1001, 'employee', '', '2016-11-01', 'indefinite'],
  [1035, 'هشام فتحي عبدالله', 'male', 'EG', 'mnt', 'ssup', 1034, 'employee', '', '2018-06-01', 'fixed'],
  [1036, 'أنس محمد الزهراني', 'male', 'SA', 'mnt', 'tech', 1035, 'employee', '', '2021-08-01', 'indefinite'],
  [1037, 'خوسيه رييس', 'male', 'PH', 'mnt', 'tech', 1035, 'employee', '', '2022-05-01', 'fixed'],
  [1038, 'طلال عبدالمحسن العسيري', 'male', 'SA', 'sal', 'dir', 1001, 'employee', '', '2015-05-01', 'indefinite'],
  [1039, 'بدر حامد الثبيتي', 'male', 'SA', 'sal', 'ssup', 1038, 'employee', '', '2019-02-01', 'indefinite'],
  [1040, 'أمل عبدالله الخالدي', 'female', 'SA', 'sal', 'rep', 1039, 'employee', '', '2025-03-01', 'fixed'],
  [1041, 'راكان سعود الحربي', 'male', 'SA', 'sal', 'rep', 1039, 'employee', '', '2021-10-01', 'indefinite'],
  [1042, 'معاذ يوسف النابلسي', 'male', 'JO', 'sal', 'rep', 1039, 'employee', '', '2022-12-01', 'fixed'],
  [1043, 'عادل محمد الشهراني', 'male', 'SA', 'prc', 'mgr', 1001, 'employee', '', '2018-03-01', 'indefinite'],
  [1044, 'غادة صالح العمر', 'female', 'SA', 'prc', 'spec', 1043, 'employee', '', '2020-07-01', 'indefinite'],
  [1045, 'ياسر عبدالكريم المطيري', 'male', 'SA', 'it', 'mgr', 1001, 'admin', '', '2017-01-15', 'indefinite'],
  [1046, 'شهد فيصل العتيبي', 'female', 'SA', 'it', 'spec', 1045, 'employee', '', '2026-08-01', 'indefinite'],
  [1047, 'عبدالإله سعد الشمري', 'male', 'SA', 'hse', 'mgr', 1001, 'employee', '', '2019-04-01', 'indefinite'],
  [1048, 'مصطفى كمال سليم', '', 'EG', 'hse', 'spec', 1047, 'employee', '', '2023-01-15', 'fixed'],
  [1049, 'سعد مفلح العنزي', 'male', 'SA', 'dst', 'drv', 1017, 'employee', '', '2026-10-19', 'indefinite'],
  [1050, 'جود عبدالرحمن السالم', 'female', 'SA', 'sal', 'rep', 1039, 'employee', '', '2026-10-12', 'indefinite']
];
const EMP = {}; // no -> record built below
P.forEach(p => {
  const [no, name, gender, nat, dept, pos, mgr, role, extra, hire, contract] = p;
  const saudi = nat === 'SA', posRow = POSITIONS.find(x => x[0] === pos);
  const basic = !saudi && pos === 'drv' ? 3000 : posRow[4];
  EMP[no] = { no: String(no), name, gender, nat, saudi, dept, pos, mgr: mgr ? String(mgr) : '', role, extra, hire, contract,
    basic, housing: r2(basic * 0.25), transport: r2(basic * 0.1), other: no === 1001 ? { 'بدل تمثيل': 3000 } : {},
    cohort: !saudi ? '' : no === 1036 ? '' : hire >= '2024-07-01' ? 'new' : 'legacy', grade: posRow[3] };
});
const NOS = Object.keys(EMP);
const total = e => r2(e.basic + e.housing + e.transport + Object.values(e.other).reduce((a, b) => a + b, 0));
const driverNos = NOS.filter(n => EMP[n].pos === 'drv');
const ids = {}, auth = {}, tokens = {};
/** Who manages whom: the manager chain and the heads of each department and its parents (as the server's manages_). */
function managesSet(mgrNo) {
  const set = new Set();
  NOS.forEach(n => {
    if (n === mgrNo) return;
    for (let cur = EMP[n].mgr, i = 0; cur && i < 20; cur = EMP[cur].mgr, i++) if (cur === mgrNo) { set.add(n); return; }
    for (let d = DEPTS.find(x => x[0] === EMP[n].dept); d; d = DEPTS.find(x => x[0] === d[3])) if (String(d[4]) === mgrNo) { set.add(n); return; }
  });
  return set;
}

// ---------------- sign-in and calls ----------------
function signIn(no) {
  const a = auth[no];
  const b = B.call({ action: 'authBegin', empNo: no });
  if (!b.ok) throw new Error('authBegin ' + no + ' ' + b.error);
  const f = B.call({ action: 'authFinish', credential: a.dev.get(b.options), pin: a.pin });
  if (!f.ok) throw new Error('authFinish ' + no + ' ' + f.error);
  tokens[no] = { t: f.token, at: B.now() };
  return f.token;
}
function tok(no) { const x = tokens[no]; return x && B.now() - x.at < 7 * 3600000 ? x.t : signIn(no); }
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
const forget = no => { delete tokens[no]; };
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }
const tasks = no => { const r = call(no, 'myTasks'); return r.ok ? r.tasks : null; };
const taskCount = (no, kind) => { const t = (tasks(no) || []).find(x => x.kind === kind); return t ? t.count : 0; };
const canActOn = (no, reqId) => (call(no, 'reqInbox').rows || []).some(x => x.id === reqId && x.canAct);
function chain(label, reqId, next, prev) {
  next.forEach(n => ok(canActOn(n, reqId) && taskCount(n, 'requests') > 0, label + ': ' + n + ' has it in the inbox and the bell'));
  prev.forEach(n => ok(!canActOn(n, reqId), label + ': ' + n + ' no longer has it'));
}

// ---------------- geography and punches ----------------
const HQ = { lat: 24.7136, lng: 46.6753 }, DEPOT = { lat: 24.6400, lng: 46.7700 };
const zoneOf = no => (EMP[no].dept === 'dst' ? DEPOT : HQ);
function samples(z, opts) {
  opts = opts || {};
  const t = B.now();
  if (opts.spoof) return [0, 1, 2].map(i => ({ lat: z.lat, lng: z.lng, acc: 1, t: t - (2 - i) * 1000 })) // a mock-location app: same spot, advancing clock;
  const far = opts.far ? 0.05 : 0, acc = opts.acc || between(8, 25);
  return [0, 1, 2].map(i => ({ lat: z.lat + far + (rnd() - 0.5) * 0.0004, lng: z.lng + (rnd() - 0.5) * 0.0004, acc: acc + i, t: t - i * 1500 }));
}
function punch(no, opts) {
  opts = opts || {};
  if (opts.pw) { // check-in from a password session (punchPw), not from the enrolled device
    const p = B.call({ action: 'punchPw', token: PWTOK, geo: { samples: samples(zoneOf(no)) }, deviceTime: B.now() });
    ok(p.ok && /password_login/.test(p.punch.flags) && p.punch.status === 'ok', 'the cashier checks in from the password session, flagged for HR (risk 20, below review)', p);
    return p;
  }
  const a = auth[no];
  const b = B.call({ action: 'punchBegin', empNo: no });
  if (!b.ok) return b;
  return B.call({ action: 'punchFinish', credential: a.dev.get(b.options), pin: a.pin, geo: { samples: samples(zoneOf(no), opts) }, deviceTime: B.now(), ua: 'sim50' });
}

// =====================================================================================================
cycle('Setup: company, roles, organisation, people, packages');
const D0 = '2026-09-27';
at(D0, '09:00');
let r = B.call({ action: 'bootstrapStatus' });
ok(r.ok && r.needsSetup, 'an empty system asks for set-up');
function enroll(no, code, kind) {
  const b = B.call({ action: 'enrollBegin', empNo: no, code });
  if (!b.ok) return b;
  let f;
  if (kind === 'phonekey' || kind === 'laptop') {
    const dev = new DeviceKey(), pin = kind === 'laptop' ? '740263' : '582914';
    f = B.call({ action: 'enrollFinish', deviceKey: dev.create(b.options), pin, platform: kind === 'laptop' ? 'desktop' : 'mobile', label: kind });
    if (f.ok) auth[no] = { dev, pin };
  } else {
    const dev = new Authenticator();
    f = B.call({ action: 'enrollFinish', credential: dev.create(b.options), label: 'iPhone' });
    if (f.ok) auth[no] = { dev };
  }
  if (f.ok) { ids[no] = f.me.id; tokens[no] = { t: f.token, at: B.now() }; }
  return f;
}
r = B.call({ action: 'bootstrap', setupKey: 'sim-key', name: EMP['1045'].name, empNo: '1045' });
ok(r.ok && r.activationCode, 'the IT manager bootstraps as the first administrator');
ok(enroll('1045', r.activationCode).ok, 'and activates a phone');
r = call('1045', 'zoneSave', { zone: { name: 'المقر الرئيسي', nameEn: 'Head office', lat: HQ.lat, lng: HQ.lng, radius: 250 } });
const ZHQ = r.zone && r.zone.id;
r = call('1045', 'zoneSave', { zone: { name: 'مستودع التوزيع', nameEn: 'Distribution depot', lat: DEPOT.lat, lng: DEPOT.lng, radius: 300 } });
const ZDEP = r.zone && r.zone.id;
ok(ZHQ && ZDEP, 'two work zones: head office and the distribution depot');
const codes = {};
NOS.filter(n => n !== '1045').forEach(n => {
  const e = EMP[n];
  const rr = call('1045', 'empSave', { emp: { empNo: n, name: e.name, email: 'e' + n + '@example.test', phone: '05' + String(10000000 + +n), role: e.role,
    zoneIds: e.dept === 'dst' ? ZDEP : ZHQ } });
  codes[n] = rr.activationCode;
});
ok(Object.keys(codes).length === 49 && Object.values(codes).every(Boolean), '49 people added by the administrator, each with an activation code');
r = B.call({ action: 'enrollBegin', empNo: '1006', code: 'AAAA-BBBB' });
ok(!r.ok && r.error === 'bad_activation', 'a wrong activation code is refused');
let enrolled = 0;
NOS.filter(n => n !== '1045').forEach(n => { if (enroll(n, codes[n], n === '1036' ? 'phonekey' : n === '1046' ? 'laptop' : 'passkey').ok) enrolled++; });
ok(enrolled === 49, 'all 49 activate their device (passkeys, one old phone with a PIN, one laptop with a PIN)', enrolled);
r = B.call({ action: 'enrollBegin', empNo: '1006', code: codes['1006'] });
ok(!r.ok && r.error === 'bad_activation', 'an activation code works once');
r = call('1045', 'empList');
ok(r.ok && r.rows.length === 50 && r.rows.every(x => x.device), '50 people, every one with a linked device', r.rows && r.rows.filter(x => !x.device).map(x => x.empNo));
r = call('1011', 'empSave', { emp: { empNo: '1099', name: 'x', role: 'hr' } });
ok(!r.ok && r.error === 'forbidden', 'HR cannot create an HR account');
['1009', '1002'].forEach(n => { r = call('1045', 'hrRolesSave', { id: ids[n], extraRoles: EMP[n].extra }); forget(n); });
r = call('1045', 'hrRolesSave', { id: ids['1045'], extraRoles: 'payroll' });
ok(!r.ok && r.error === 'cannot_change_own_roles', 'the administrator cannot give themselves the payroll role');
ok(call('1009', 'myFile').file.roles.payroll && call('1002', 'myFile').file.roles.executive, 'payroll and executive roles granted by the administrator');

// departments, then positions
const DID = {};
DEPTS.forEach(d => {
  const rr = call('1011', 'hrDeptSave', { dept: { nameAr: d[1], nameEn: d[2], parentId: d[3] ? DID[d[3]] : '', headEmpId: ids[String(d[4])], costCenter: d[5] } });
  DID[d[0]] = rr.dept && rr.dept.id;
});
ok(Object.values(DID).every(Boolean) && Object.keys(DID).length === 13, '13 departments in a tree (Finance > Accounts, Treasury; Operations > Distribution, Stations)');
r = call('1011', 'hrDeptSave', { dept: { id: DID.fin, nameAr: 'الإدارة المالية', parentId: DID.acc } });
ok(!r.ok && r.error === 'dept_cycle', 'a department cannot sit under its own child');
const PID = {};
POSITIONS.forEach(p => {
  const rr = call('1011', 'hrPositionSave', { position: { titleAr: p[1], titleEn: p[2], grade: p[3], purposeAr: 'الغرض من وظيفة ' + p[1], dutiesAr: 'المهام الأساسية\nالالتزام بالسلامة', requirementsAr: 'مؤهل مناسب' } });
  PID[p[0]] = rr.position && rr.position.id;
});
const grades = new Set(POSITIONS.map(p => p[3]));
ok(Object.values(PID).every(Boolean) && grades.size === 10, 'positions cover every grade G1 to G10');

// job data and contracts
let jobOk = 0;
NOS.forEach(n => {
  const e = EMP[n], who = n === '1045' ? '1045' : '1011';
  const job = { id: ids[n], departmentId: DID[e.dept], positionId: PID[e.pos], managerId: e.mgr ? ids[e.mgr] : '', hireDate: e.hire, contractType: e.contract,
    nationality: e.nat, gender: e.gender, workLocation: 'الرياض', contractNo: n === '1050' ? '' : 'Q-' + n, occupationCode: '9' + n, employmentType: 'full_time',
    workDaysPerWeek: 5, dailyHours: 8, annualLeaveDays: ['G8', 'G9', 'G10'].includes(e.grade) ? 30 : '', noticeDays: 30, reason: 'بيانات التأسيس' };
  if (e.contract === 'fixed') job.contractEnd = n === '1023' ? '2026-12-15' : addDays(e.hire, 365 * 2 + 300);
  if (e.hire > '2026-07-01') job.probationEnd = addDays(e.hire, 89);
  const rr = call(who, 'hrEmpSave', { emp: job });
  if (rr.ok) jobOk++; else console.log('   job ' + n + ' ' + rr.error);
});
ok(jobOk === 50, 'job, manager and Qiwa contract data for all 50', jobOk);
r = call('1011', 'hrEmpSave', { emp: { id: ids['1045'], workLocation: 'جدة' } });
ok(!r.ok && r.error === 'forbidden', 'HR cannot edit the administrator record');
r = call('1011', 'hrEmpSave', { emp: { id: ids['1024'], contractType: 'indefinite' } });
ok(!r.ok && r.error === 'expat_contract_fixed', 'a non-Saudi contract cannot be indefinite (Art. 37)');
r = call('1011', 'hrEmpSave', { emp: { id: ids['1049'], probationEnd: addDays('2026-10-19', 200) } });
ok(!r.ok && r.error === 'probation_too_long', 'probation over 180 days is refused (Art. 53)');
r = call('1011', 'hrEmpSave', { emp: { id: ids['1016'], managerId: ids['1018'] } });
ok(!r.ok && r.error === 'manager_cycle', 'a supervisor cannot report to their own driver');
const depth = n => { let k = 0; for (let c = EMP[n].mgr; c; c = EMP[c].mgr) k++; return k; };
ok(Math.max(...NOS.map(depth)) === 4, 'the deepest manager chain has four levels (driver > supervisor > manager > COO > CEO)');

// private data: IDs, IBANs, GOSI
let privOk = 0;
NOS.forEach(n => {
  const e = EMP[n];
  const priv = { nationalId: idFor(n, e.saudi), birthDate: '1990-01-15', maritalStatus: 'married', bankName: 'مصرف الراجحي',
    gosiNumber: n === '1049' ? '' : 'GO' + n, gosiCohort: e.cohort, emergencyName: 'قريب ' + n, emergencyPhone: '0550000' + n.slice(1) };
  if (n !== '1044' && n !== '1045' && n !== '1011' && n !== '1012') priv.iban = ibanFor(n);
  if (!e.saudi) Object.assign(priv, { idExpiry: n === '1007' ? '2026-12-10' : '2027-08-01', passportNo: 'P' + n + '77', passportExpiry: '2029-05-01' });
  const who = n === '1045' ? '1045' : n === '1011' ? '1012' : '1011';
  if (call(who, 'hrPrivateSave', { empId: ids[n], priv }).ok) privOk++;
});
ok(privOk === 50, 'national ID / iqama, birth date, GOSI number and cohort for all 50', privOk);
ok(call('1012', 'hrPrivateSave', { empId: ids['1011'], priv: { iban: ibanFor('1011') } }).ok && call('1011', 'hrPrivateSave', { empId: ids['1012'], priv: { iban: ibanFor('1012') } }).ok,
  'each HR person files the other one\'s IBAN');
// A different account: re-sending the IBAN already on file is not a change, so the server rightly lets it through.
r = call('1011', 'hrPrivateSave', { empId: ids['1011'], priv: { iban: ibanFor('9011') } });
ok(!r.ok && r.error === 'cannot_change_own_bank', 'nobody changes their own IBAN');
r = call('1045', 'hrPrivateSave', { empId: ids['1045'], priv: { iban: ibanFor('1045') } });
ok(!r.ok && r.error === 'cannot_change_own_bank', 'not even the administrator');
r = call('1011', 'hrPrivateSave', { empId: ids['1006'], priv: { iban: 'SA0380000000608010167518' } });
ok(!r.ok && r.error === 'bad_iban', 'an IBAN with a wrong check digit is refused');
r = call('1045', 'requestCreate', { request: { type: 'data_change', payload: { fields: { iban: ibanFor('1045') } }, reason: 'حساب الراتب' } });
const admIbanReq = r.request && r.request.id;
ok(r.ok && call('1012', 'reqDecide', { id: admIbanReq, decision: 'approve' }).ok, 'the administrator\'s IBAN goes in through a data-change request approved by HR');
ok(call('1045', 'myFile').file.priv.iban === ibanFor('1045'), 'and is on file');
direct(() => B.ctx.append_('documents', { id: 'F-sim-1', ref: 'DOC-SIM-1', empId: ids['1007'], type: 'iqama', number: idFor('1007', false), issueDate: '2024-12-10', expiryDate: '2026-12-10', note: '', status: 'active', createdAt: new Date().toISOString(), updatedAt: '' }));

// packages: HR proposes, the payroll holder approves (never their own)
const compIds = {};
NOS.forEach(n => {
  const e = EMP[n], who = n === '1012' ? '1011' : '1012';
  const rr = call(who, 'hrCompPropose', { empId: ids[n], effectiveFrom: e.hire > '2026-09-01' ? e.hire : '2026-09-01', basic: e.basic, housing: e.housing, transport: e.transport, other: e.other, reason: 'الراتب الأول' });
  compIds[n] = rr.comp && rr.comp.id;
});
ok(NOS.every(n => compIds[n]), 'HR proposes a package for every one of the 50');
ok(taskCount('1009', 'salaries') === 49, 'the payroll holder sees 49 packages waiting (never their own)', taskCount('1009', 'salaries'));
// 1012 entered 49 packages and 1011 entered only 1012's own, so 1012 has nothing to approve; 1011 has the 49 minus his own.
ok(taskCount('1012', 'salaries') === 0, 'the HR proposer has nothing to approve: she entered all but her own', taskCount('1012', 'salaries'));
ok(taskCount('1011', 'salaries') === 48, 'the other HR person may approve the 48 he did not enter and that are not his', taskCount('1011', 'salaries'));
r = call('1012', 'hrCompDecide', { ids: [compIds['1006']], decision: 'approve' });
ok(!r.ok && r.error === 'second_approver_required', 'the proposer cannot approve their own proposal');
r = call('1045', 'hrCompDecide', { ids: [compIds['1006']], decision: 'approve' });
ok(!r.ok && r.error === 'forbidden', 'the administrator alone cannot approve packages');
r = call('1009', 'hrCompDecide', { ids: [compIds['1009']], decision: 'approve' });
ok(!r.ok && (r.error === 'cannot_change_own_salary' || r.error === 'not_found'), 'payroll cannot approve their own package', r);
r = call('1009', 'hrCompDecide', { ids: NOS.filter(n => n !== '1009' && n !== '1050').map(n => compIds[n]), decision: 'approve' });
ok(r.ok && r.decided === 48, 'the payroll holder approves 48 packages in one go (the new sales hire stays pending)', r);
ok(call('1011', 'hrCompDecide', { ids: [compIds['1009']], decision: 'approve' }).ok, 'the payroll holder\'s own package is approved by HR');
ok(taskCount('1009', 'salaries') === 1 && taskCount('1011', 'salaries') === 1, 'only the pending new-hire package is left in the bells');
r = call('1006', 'hrEmpFile', { id: ids['1006'] });
ok(r.ok && r.file.comp && r.file.comp.total === total(EMP['1006']), 'the employee sees their own package and total', r.file && r.file.comp);
r = call('1016', 'hrEmpFile', { id: ids['1018'] });
ok(r.ok && !('comp' in r.file) && !('priv' in r.file) && !('documents' in r.file), 'a supervisor opens a driver\'s file with no salary, private data or documents');
r = call('1007', 'hrEmpFile', { id: ids['1006'] });
ok(!r.ok && r.error === 'forbidden', 'a colleague cannot open another colleague\'s file');

// opening leave balances from the old system (not for two people, on purpose)
const OPEN = {};
NOS.filter(n => !['1037', '1048', '1046', '1049', '1050'].includes(n)).forEach(n => {
  const days = between(4, 24), who = n === '1011' ? '1012' : '1011';
  if (call(who, 'leaveOpeningSave', { empId: ids[n], days, asOf: '2026-09-26' }).ok) OPEN[n] = days;
});
r = call('1011', 'leaveOpeningSave', { empId: ids['1011'], days: 99, asOf: '2026-09-26' });
ok(!r.ok && r.error === 'cannot_change_own_balance', 'HR cannot set their own carried-over balance');
ok(Object.keys(OPEN).length === 45, 'carried-over balances loaded for 45 people, the administrator\'s included (by HR)', Object.keys(OPEN).length);
r = call('1045', 'leaveOpeningSave', { empId: ids['1045'], days: 99, asOf: '2026-09-26' });
ok(!r.ok && r.error === 'cannot_change_own_balance', 'the administrator cannot set his own');
r = call('1037', 'myRequests');
ok(r.ok && r.leave.annual.openingMissing, 'someone without a carried-over balance is told so');

// settings, a holiday, shifts and the drivers' roster
r = call('1045', 'settingsSave', { settings: { rostersEnabled: true, ramadanFrom: '2027-02-08', ramadanTo: '2027-03-09', ramadanHours: 6, saudizationTarget: 60, wpsDueDay: 10 } });
ok(r.ok, 'the administrator switches rosters on and sets Ramadan 2027 and the Saudization target', r);
r = call('1011', 'holidaySave', { holiday: { date: '2026-10-29', nameAr: 'عطلة رسمية (محاكاة)' } });
ok(r.ok, 'HR adds a public holiday on 29 October');

// =====================================================================================================
cycle('Shifts, rosters, Ramadan and the summer ban');
r = call('1011', 'shiftSave', { shift: { nameAr: 'وردية التوزيع الصباحية', nameEn: 'Early delivery', start: '06:00', end: '14:00', workdays: '0,1,2,3,4', outdoor: true } });
const SH = r.shift;
ok(r.ok && /^SH-\d{3,}$/.test(SH.code) && SH.hours === 8, 'HR defines the 06:00-14:00 outdoor delivery shift', SH);
r = call('1011', 'shiftSave', { shift: { nameAr: 'ليلية', start: '22:00', end: '06:00' } });
ok(r.ok && r.shift.overnight && r.shift.hours === 8, 'a 22:00-06:00 night shift is accepted (overnight shifts, 2026-10-18)', r.shift || r);
r = call('1016', 'shiftSave', { shift: { nameAr: 'x', start: '07:00', end: '15:00' } });
ok(!r.ok && r.error === 'forbidden', 'a supervisor cannot define shifts');
r = call('1011', 'rosterSave', { empIds: driverNos.map(n => ids[n]), shiftId: SH.id, fromDate: '2026-10-01', toDate: '2027-09-30' });
ok(r.ok && r.count === driverNos.length, 'all ' + driverNos.length + ' drivers are rostered on it for a year', r);
r = call('1016', 'rosterList', { from: '2026-10-01', to: '2026-10-31' });
const teamOf1016 = managesSet('1016');
ok(r.ok && r.rows.length === 4 && r.rows.every(x => teamOf1016.has(x.emp.empNo)) && r.warnings.length === 0, 'a supervisor sees only his own four drivers, and no summer warning in October', r.rows && r.rows.map(x => x.emp.empNo));
r = call('1006', 'rosterList');
ok(!r.ok && r.error === 'forbidden', 'an employee with no team has no roster view');
r = call('1011', 'rosterList', { from: '2027-06-01', to: '2027-06-30' });
ok(r.ok && r.warnings.length === driverNos.length && r.warnings.every(w => w.kind === 'summer_ban' && w.from === '2027-06-15'), 'June 2027: every outdoor driver is flagged from 15 June (midday ban)', r.warnings && r.warnings.length);
const sx = direct(() => B.ctx.settings_());
const ram = direct(() => B.ctx.adjustShift_(B.ctx.findBy_('employees', 'empNo', '1018'), B.ctx.shiftOf_(B.ctx.findBy_('employees', 'empNo', '1018'), sx), sx, '2027-02-10'));
ok(ram.start === '06:00' && ram.end === '12:00' && ram.ramadan, 'in Ramadan the driver\'s 8-hour shift ends after 6 hours (Art. 98)', ram);
direct(() => { const e = B.ctx.findBy_('employees', 'empNo', '1037'); e.ramadanReduced = 'no'; B.ctx.update_('employees', e); });
const ram2 = direct(() => B.ctx.adjustShift_(B.ctx.findBy_('employees', 'empNo', '1037'), B.ctx.shiftOf_(B.ctx.findBy_('employees', 'empNo', '1037'), sx), sx, '2027-02-10'));
ok(ram2.end === '17:00' && !ram2.ramadan, 'someone marked "no" keeps the full day (set by hand: there is no form field yet)', ram2);
const octDay = direct(() => B.ctx.adjustShift_(B.ctx.findBy_('employees', 'empNo', '1018'), B.ctx.shiftOf_(B.ctx.findBy_('employees', 'empNo', '1018'), sx), sx, '2026-10-05'));
ok(octDay.start === '06:00' && octDay.end === '14:00', 'outside Ramadan the roster shift stands');

// =====================================================================================================
cycle('Onboarding and probation');
r = call('1011', 'onboardList');
ok(r.ok && ['1046', '1049', '1050'].every(n => r.withoutPlan.some(x => x.emp.empNo === n)), 'HR sees the three recent hires without a plan', r.withoutPlan && r.withoutPlan.map(x => x.emp.empNo));
r = call('1016', 'onboardStart', { empId: ids['1049'] });
ok(!r.ok && r.error === 'forbidden', 'only HR starts a plan');
ok(call('1011', 'onboardStart', { empId: ids['1049'] }).ok && call('1011', 'onboardStart', { empId: ids['1050'] }).ok, 'HR starts the 30-60-90 plans for the two newest hires');
r = call('1049', 'onboardList');
const plan49 = r.plans && r.plans[0];
ok(plan49 && plan49.total === 18 && plan49.tasks.find(t => t.key === 'probation').dueDate === addDays('2026-10-19', 80) && plan49.tasks.find(t => t.key === 'workspace').dueDate === addDays('2026-10-19', -5),
  'the driver\'s plan: 18 tasks dated from the hire date, probation review on day 80', plan49 && plan49.tasks.slice(0, 2));
r = call('1011', 'onboardStart', { empId: ids['1049'] });
ok(!r.ok && r.error === 'already_exists', 'one plan per person');

// =====================================================================================================
cycle('Assets in custody (hand-over)');
const asset = {};
[['truck', 'vehicle', 'شاحنة توزيع أسطوانات', 'ر ح ك 4521', 95000], ['pos', 'pos', 'جهاز نقاط بيع', 'POS-58821', 1800], ['uniform', 'uniform', 'زي العمل', 'UNI-1033', 300]].forEach(a => {
  const rr = call('1011', 'assetSave', { asset: { type: a[1], nameAr: a[2], serial: a[3], value: a[4] } }); asset[a[0]] = rr.asset;
});
ok(asset.truck && /^AST-\d{3,}$/.test(asset.truck.ref), 'HR registers the truck, a POS device and a uniform', asset.truck);
ok(call('1011', 'assetAssign', { assetId: asset.truck.id, empId: ids['1021'] }).ok && call('1011', 'assetAssign', { assetId: asset.pos.id, empId: ids['1021'] }).ok &&
  call('1011', 'assetAssign', { assetId: asset.uniform.id, empId: ids['1033'] }).ok, 'truck and POS to driver 1021, uniform to 1033');
ok(taskCount('1021', 'asset_ack') === 2, 'the driver is asked to confirm receipt of two items');
r = call('1021', 'assetList');
r.mine.forEach(c => call('1021', 'assetAck', { id: c.id }));
ok(taskCount('1021', 'asset_ack') === 0, 'once confirmed the task is gone');
call('1033', 'assetList').mine.forEach(c => call('1033', 'assetAck', { id: c.id }));

// =====================================================================================================
cycle('Requests: chains, refusals and delegation');
// a salary advance in September (HR, then payroll), so October deducts the first instalment
r = call('1020', 'requestCreate', { request: { type: 'advance', amount: 3000, months: 3, reason: 'ظرف أسري' } });
const adv = r.request;
// The requester sees the repayment plan from the start: first instalment the month after the request.
ok(r.ok && adv.step === 'hr' && adv.installment === 1000 && adv.startMonth === '2026-10', 'an advance of 3,000 over 3 months goes to HR first; 1,000 a month from October', adv);
ok(!canActOn('1016', adv.id) && !(call('1016', 'reqInbox').rows || []).some(x => x.id === adv.id), 'the line manager never sees the advance');
chain('advance step 1', adv.id, ['1011', '1012'], ['1009']);
r = call('1020', 'reqDecide', { id: adv.id, decision: 'approve' });
ok(!r.ok && r.error === 'cannot_decide_own', 'nobody approves their own request');
ok(call('1012', 'reqDecide', { id: adv.id, decision: 'approve' }).ok, 'HR approves the HR step');
chain('advance step 2', adv.id, ['1009'], ['1011', '1012']);
r = call('1012', 'reqDecide', { id: adv.id, decision: 'approve' });
ok(!r.ok && r.error === 'forbidden', 'HR cannot also take the payroll step');
r = call('1009', 'reqDecide', { id: adv.id, decision: 'approve' });
ok(r.ok && r.request.status === 'approved' && r.request.startMonth === '2026-10', 'payroll approves; repayment starts in October', r.request);
chain('advance done', adv.id, [], ['1009', '1011', '1012']);

// the same person on two steps, and a rejection without a note
r = call('1013', 'requestCreate', { request: { type: 'leave', subtype: 'annual', fromDate: '2026-10-04', toDate: '2026-10-04' } });
const twoStep = r.request;
ok(r.ok && twoStep.step === 'manager', 'the HR assistant asks for a day off; her manager is the HR director');
ok(call('1011', 'reqDecide', { id: twoStep.id, decision: 'approve' }).ok, 'the HR director approves as her manager');
r = call('1011', 'reqDecide', { id: twoStep.id, decision: 'approve' });
ok(!r.ok && r.error === 'forbidden', 'and cannot also approve the HR step of the same request');
r = call('1012', 'reqDecide', { id: twoStep.id, decision: 'reject' });
ok(!r.ok && r.error === 'note_required', 'a rejection needs a reason');
r = call('1012', 'reqDecide', { id: twoStep.id, decision: 'reject', note: 'تزامن مع إغلاق الرواتب' });
ok(r.ok && r.request.status === 'rejected', 'the other HR person rejects it with a reason');

// annual leave through manager then HR
r = call('1006', 'requestCreate', { request: { type: 'leave', subtype: 'annual', fromDate: '2026-10-11', toDate: '2026-10-15', reason: 'إجازة عائلية' } });
const lv1006 = r.request;
ok(r.ok && lv1006.ref === 'LV-2026-00002' && lv1006.days === 5 && lv1006.step === 'manager', 'annual leave Sun-Thu 11-15 Oct: 5 working days, to the manager first', lv1006);
// At the manager step: her manager, everyone above him (manager chain, Finance head, CEO) and HR on their behalf; not a colleague.
chain('annual leave step 1', lv1006.id, ['1005', '1004', '1001', '1011'], ['1007', '1016']);
r = call('1007', 'reqDecide', { id: lv1006.id, decision: 'approve' });
ok(!r.ok && r.error === 'forbidden', 'a colleague cannot approve it');
ok(call('1005', 'reqDecide', { id: lv1006.id, decision: 'approve' }).ok, 'the accounts manager approves');
chain('annual leave step 2', lv1006.id, ['1011', '1012'], ['1005']);
ok(call('1012', 'reqDecide', { id: lv1006.id, decision: 'approve' }).ok, 'HR approves; the leave is approved');
chain('annual leave done', lv1006.id, [], ['1005', '1011', '1012']);
r = call('1006', 'requestCreate', { request: { type: 'leave', subtype: 'annual', fromDate: '2026-10-18', toDate: '2026-11-30' } });
ok(!r.ok && r.error === 'insufficient_balance', 'more days than the balance is refused');

// unpaid leave, a letter, a data change
r = call('1026', 'requestCreate', { request: { type: 'leave', subtype: 'unpaid', fromDate: '2026-10-25', toDate: '2026-10-26', reason: 'ظرف خاص' } });
ok(r.ok && r.request.days === 2, 'two days of unpaid leave');
call('1016', 'reqDecide', { id: r.request.id, decision: 'approve' }); call('1011', 'reqDecide', { id: r.request.id, decision: 'approve' });
const unpaidId = r.request.id;
r = call('1048', 'requestCreate', { request: { type: 'leave', subtype: 'maternity', fromDate: '2026-11-01', toDate: '2026-11-03', docNo: 'X' } });
ok(!r.ok && r.error === 'gender_required', 'maternity leave is refused while the gender is not on file');
r = call('1006', 'requestCreate', { request: { type: 'leave', subtype: 'paternity', fromDate: '2026-10-06', toDate: '2026-10-08', payload: { eventDate: '2026-10-05' } } });
ok(!r.ok && r.error === 'leave_not_eligible', 'paternity leave is not offered to a woman');

// =====================================================================================================
cycle('Attendance: a month of punches');
// What each person does each day: a plan the checks compare with the server's own day summaries.
const PLAN = {}; // no -> date -> { ins: [min], outs: [min], kind }
const EVENTS = {}; // date -> [{ hm, fn }]
const ev = (date, hm, fn) => { (EVENTS[date] = EVENTS[date] || []).push({ hm, fn }); };
const OCT = []; for (let d = '2026-10-01'; d <= '2026-10-31'; d = addDays(d, 1)) OCT.push(d);
const isWork = d => dow(d) <= 4 && d !== '2026-10-29';
const LEAVE_DAYS = { '1006': ['2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15'], '1026': ['2026-10-25', '2026-10-26'], '1019': ['2026-10-06', '2026-10-07', '2026-10-08'],
  '1007': ['2026-10-20'], '1031': ['2026-10-23', '2026-10-24', '2026-10-25'] };
OCT.filter(d => d >= '2026-10-18').forEach(d => (LEAVE_DAYS['1013'] = LEAVE_DAYS['1013'] || []).push(d));
const ABSENT = { '1030': ['2026-10-13', '2026-10-21'] };
const LATE = { '1018': ['2026-10-04', '2026-10-08', '2026-10-13', '2026-10-19', '2026-10-27'] };
const OVERTIME = { '1025': ['2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'] };
const startOf = n => (EMP[n].pos === 'drv' ? 360 : 480), endOf = n => (EMP[n].pos === 'drv' ? 840 : 1020);
const results = { review: [], rejected: [], ok: 0, refused: 0 };
OCT.forEach(d => NOS.forEach(n => {
  const e = EMP[n];
  if (e.hire > d || !isWork(d) || (LEAVE_DAYS[n] || []).includes(d) || (ABSENT[n] || []).includes(d)) return;
  const st = startOf(n), en = endOf(n);
  let tin = st + between(-12, 9), tout = en + between(0, 14);
  if ((LATE[n] || []).includes(d)) tin = st + 40;
  if ((OVERTIME[n] || []).includes(d)) tout = en + 120;
  (PLAN[n] = PLAN[n] || {})[d] = { ins: [tin], outs: [tout] };
}));
PLAN['1035'] = PLAN['1035'] || {}; PLAN['1035']['2026-10-10'] = { ins: [480], outs: [720] };        // Saturday work: all overtime
PLAN['1031']['2026-10-14'].outs = [];                                                               // forgets to check out
PLAN['1032']['2026-10-07'].outs = [];                                                               // forgets; asks for a correction
const SPECIAL = { '1027|2026-10-06|in': { spoof: true }, '1037|2026-10-07|out': { spoof: true },     // held for review
  '1010|2026-10-15|in': { pw: true } };                                                              // password session
// requests and events during the month
ev('2026-10-01', '09:30', () => {
  r = call('1040', 'requestCreate', { request: { type: 'letter', subtype: 'salary_certificate', payload: { addressee: 'بنك تجريبي' } } });
  ok(r.ok && r.request.step === 'hr', 'a salary letter goes straight to HR');
  ok(call('1011', 'reqDecide', { id: r.request.id, decision: 'approve' }).ok && call('1040', 'myRequests').rows.find(x => x.id === r.request.id).status === 'approved', 'HR approves; the letter can be printed');
  r = call('1040', 'requestCreate', { request: { type: 'data_change', payload: { fields: { phone: '0551112233', iban: ibanFor('2040') } } } });
  ok(r.ok && !(call('1039', 'reqInbox').rows || []).some(x => x.id === r.request.id), 'a bank and phone change goes to HR, never to the manager');
  call('1012', 'reqDecide', { id: r.request.id, decision: 'approve' });
  const f = call('1040', 'myFile').file;
  ok(f.priv.iban === ibanFor('2040') && f.emp.phone === '0551112233', 'approved: the new IBAN and mobile are on file');
});
ev('2026-10-05', '20:00', () => {
  r = call('1019', 'requestCreate', { request: { type: 'leave', subtype: 'paternity', fromDate: '2026-10-06', toDate: '2026-10-08', payload: { eventDate: '2026-10-05' } } });
  ok(r.ok && r.request.days === 3, 'paternity leave: three days right after the birth');
  call('1016', 'reqDecide', { id: r.request.id, decision: 'approve' }); call('1012', 'reqDecide', { id: r.request.id, decision: 'approve' });
});
ev('2026-10-06', '10:00', () => {
  r = call('1011', 'reviewList');
  const p = (r.rows || []).find(x => x.emp && x.emp.empNo === '1027');
  ok(p && /static_samples/.test(p.flags) && p.risk >= 40, 'a frozen, zero-accuracy fix is held for HR review', p);
  results.review.push(p && p.id);
  ok(p && call('1011', 'reviewDecide', { id: p.id, decision: 'approve', note: 'تحقق المشرف من حضوره' }).ok, 'HR approves it after checking');
});
ev('2026-10-07', '09:00', () => {
  r = call('1011', 'manualPunch', { empId: ids['1011'], type: 'in', date: '2026-10-07', time: '08:00', reason: 'x' });
  ok(!r.ok && r.error === 'cannot_correct_self', 'HR cannot correct their own attendance');
});
ev('2026-10-08', '09:00', () => {
  r = call('1011', 'reviewList');
  const p = (r.rows || []).find(x => x.emp && x.emp.empNo === '1037');
  ok(p && p.type === 'out', 'the technician\'s spoofed check-out waits for review');
  ok(p && call('1012', 'reviewDecide', { id: p.id, decision: 'reject', note: 'موقع غير موثوق' }).ok, 'HR rejects it');
  r = call('1012', 'manualPunch', { empId: ids['1037'], type: 'out', date: '2026-10-07', time: '17:05', reason: 'تأكيد المشرف بالانصراف' });
  ok(r.ok && r.punch.status === 'manual', 'and records the real check-out as a manual correction');
  PLAN['1037']['2026-10-07'].outs = [1025];
  r = call('1032', 'requestCreate', { request: { type: 'correction', payload: { date: '2026-10-07', time: '17:00', punchType: 'out' }, reason: 'نسيت تسجيل الانصراف' } });
  const corr = r.request;
  ok(r.ok && corr.step === 'manager', 'a forgotten check-out: correction request to the station supervisor');
  // At the manager step HR may also act (recorded "hr_on_behalf"), so HR is not a "previous" holder here; a colleague is not.
  chain('correction step 1', corr.id, ['1029', '1011'], ['1030', '1031']);
  call('1029', 'reqDecide', { id: corr.id, decision: 'approve' });
  chain('correction step 2', corr.id, ['1011', '1012'], ['1029']);
  call('1011', 'reqDecide', { id: corr.id, decision: 'approve' });
  PLAN['1032']['2026-10-07'].outs = [1020];
  ok(call('1032', 'myHistory', { month: '2026-10' }).days.find(x => x.date === '2026-10-07').lastOut, 'approved: the check-out is on the record');
});
ev('2026-10-12', '05:40', () => {
  at('2026-10-12', '05:40');
  r = punch('1022', { far: true });
  ok(!r.ok && r.error === 'outside_zone', 'a check-in 5 km from the depot is refused');
  const rows = direct(() => B.ctx.readAll_('punches')).filter(p => p.status === 'rejected' && p.empId === ids['1022']);
  ok(rows.length === 1 && rows[0].note === 'outside_zone', 'and stored as a rejected attempt');
});
ev('2026-10-15', '10:00', () => {
  r = call('1013', 'requestCreate', { request: { type: 'leave', subtype: 'maternity', fromDate: '2026-10-18', toDate: '2027-01-09', docNo: 'MAT-77' } });
  ok(r.ok && r.request.days === 84, 'maternity leave: 12 weeks (84 days, Art. 151)', r);
  call('1011', 'reqDecide', { id: r.request.id, decision: 'approve' });
  ok(call('1012', 'reqDecide', { id: r.request.id, decision: 'approve' }).ok, 'approved by her manager (HR director) and then the other HR person');
  r = call('1005', 'delegationSave', { delegation: { toEmpId: ids['1008'], fromDate: '2026-10-18', toDate: '2026-10-31', reason: 'إجازة' } });
  ok(r.ok, 'the accounts manager hands his approvals to the treasury manager for 18-31 October');
  r = call('1005', 'delegationSave', { delegation: { toEmpId: ids['1003'], fromDate: '2026-10-20', toDate: '2026-10-25' } });
  ok(!r.ok && r.error === 'delegation_overlap', 'no two delegations over the same days');
  r = call('1033', 'requestCreate', { request: { type: 'resignation', payload: { lastDay: '2026-11-14' }, reason: 'فرصة أخرى' } });
  const rs = r.request;
  ok(r.ok && rs.ref.startsWith('RS-') && !rs.warnings.includes('short_notice'), 'a station technician resigns with 30 days notice');
  call('1029', 'reqDecide', { id: rs.id, decision: 'approve' });
  ok(call('1012', 'reqDecide', { id: rs.id, decision: 'approve' }).ok, 'manager then HR approve');
  ok(direct(() => B.ctx.findBy_('employees', 'empNo', '1033')).lastWorkingDay === '2026-11-14', 'the last working day is on the file');
});
// A password session on a borrowed phone: allowed inside the zone, flagged. The password is set the evening before and
// the check-in happens at the cashier's planned time (an earlier draft moved the clock backwards and met too_soon).
let PWTOK = null;
ev('2026-10-14', '20:00', () => {
  ok(call('1010', 'passwordSet', { password: 'Rawda2026x' }).ok, 'the cashier sets a password');
  const pw = B.call({ action: 'pwLogin', empNo: '1010', password: 'Rawda2026x' });
  ok(pw.ok, 'and signs in with it on another phone');
  PWTOK = pw.token;
});
ev('2026-10-20', '21:00', () => {
  r = call('1007', 'requestCreate', { request: { type: 'leave', subtype: 'sick', fromDate: '2026-10-20', toDate: '2026-10-20' } });
  ok(!r.ok && r.error === 'document_required', 'sick leave needs the medical report number');
  r = call('1007', 'requestCreate', { request: { type: 'leave', subtype: 'sick', fromDate: '2026-10-20', toDate: '2026-10-20', docNo: 'SEHA-55871' } });
  const sk = r.request;
  ok(r.ok && sk.step === 'manager', 'sick leave with the report number');
  ok(taskCount('1008', 'delegated') === 1 && canActOn('1008', sk.id), 'the delegate sees it, marked as delegated approvals');
  r = call('1008', 'reqDecide', { id: sk.id, decision: 'approve' });
  ok(r.ok && r.request.history[0].role === 'delegate', 'the treasury manager approves on behalf of the accounts manager', r.request && r.request.history);
  chain('sick leave step 2', sk.id, ['1011', '1012'], ['1008', '1005']);
  call('1011', 'reqDecide', { id: sk.id, decision: 'approve' });
});
ev('2026-10-22', '10:30', () => {
  r = call('1006', 'injuryReport', { injury: { empId: ids['1031'], occurredAt: '2026-10-22T10:20', place: 'محطة الملز', description: 'جرح في اليد أثناء تبديل أسطوانة' } });
  ok(!r.ok && r.error === 'forbidden', 'a colleague from another department cannot report someone else\'s injury');
  r = call('1029', 'injuryReport', { injury: { empId: ids['1031'], occurredAt: '2026-10-22T10:20', place: 'محطة الملز', description: 'جرح في اليد أثناء تبديل أسطوانة', firstAid: 'إسعاف أولي' } });
  INJ = r.injury;
  ok(r.ok && INJ.gosiDue === '2026-10-25' && INJ.status === 'reported', 'the station supervisor reports a work injury; GOSI is due within 3 days');
  ok(taskCount('1011', 'injury') === 1 && call('1011', 'complianceCalendar').items.some(x => x.kind === 'injury_gosi' && x.ref === INJ.ref), 'HR is asked, and the compliance calendar lists it');
});
let INJ = null;
ev('2026-10-23', '09:00', () => {
  ok(call('1011', 'injuryUpdate', { id: INJ.id, gosiRef: 'GOSI-OH-99881' }).ok && taskCount('1011', 'injury') === 0, 'HR records the GOSI notification; the task is gone');
  ok(call('1011', 'injuryUpdate', { id: INJ.id, offFrom: '2026-10-23', offTo: '2026-10-25' }).ok, 'three days off for the injury');
});
ev('2026-10-31', '12:00', () => {
  r = call('1011', 'reviewList');
  ok(r.ok && r.rows.length === 0, 'nothing is left waiting for review at the end of the month', r.rows && r.rows.map(x => x.emp && x.emp.empNo));
});
// run the month: punches and events in time order
OCT.forEach(d => {
  const items = [];
  Object.keys(PLAN).forEach(n => {
    const p = PLAN[n][d]; if (!p) return;
    p.ins.forEach(m => items.push({ m, n, type: 'in' }));
    p.outs.forEach(m => items.push({ m, n, type: 'out' }));
  });
  (EVENTS[d] || []).forEach(x => items.push({ m: hmMin(x.hm), fn: x.fn }));
  items.sort((a, b) => a.m - b.m);
  items.forEach(x => {
    at(d, minHm(x.m));
    if (x.fn) return x.fn();
    const p = PLAN[x.n][d];
    if (p.done === x.type) return;
    const res = punch(x.n, SPECIAL[x.n + '|' + d + '|' + x.type]);
    if (res.ok) results.ok++; else { results.refused++; console.log('   punch refused ' + x.n + ' ' + d + ' ' + x.type + ' ' + res.error); }
  });
});
ok(results.refused === 0, 'every planned punch was accepted (' + results.ok + ' punches through the real passkey, PIN and geofence checks)', results);

// expected day summaries, computed here from the plan with the attendance rules
function expectDay(n, d) {
  const e = EMP[n], p = (PLAN[n] || {})[d], start = startOf(n), end = endOf(n), work = isWork(d);
  if (e.hire > d) return null;
  const o = { work, late: 0, worked: 0, ot: 0, status: '' };
  if (!p || !p.ins.length) {
    if ((LEAVE_DAYS[n] || []).includes(d)) o.status = 'leave'; else if (d === '2026-10-29') o.status = 'holiday'; else if (!work) o.status = 'off'; else o.status = 'absent';
    return o;
  }
  const tin = p.ins[0], tout = p.outs[0];
  o.status = tout == null ? 'missing_out' : 'present';
  if (tout != null) o.worked = tout - tin;
  if (work && tin > start + 15) o.late = tin - start;
  const planned = end - start;
  o.ot = !work ? o.worked : Math.max(0, o.worked - planned);
  return o;
}
let dayMismatch = [];
['1018', '1030', '1031', '1032', '1006', '1013', '1025', '1035', '1037', '1049', '1050', '1026', '1019'].forEach(n => {
  const h = call(n, 'myHistory', { month: '2026-10' });
  OCT.filter(d => d <= '2026-10-31').forEach(d => {
    const x = expectDay(n, d), got = h.days.find(y => y.date === d);
    if (!x) { if (got && got.status === 'absent') dayMismatch.push(n + ' ' + d + ' absent before the hire date'); return; }
    if (!got) { dayMismatch.push(n + ' ' + d + ' missing'); return; }
    if (got.status !== x.status || got.lateMin !== x.late || (x.status === 'present' && (got.workedMin !== x.worked || got.overtimeMin !== x.ot))) dayMismatch.push(n + ' ' + d + ' ' + JSON.stringify({ want: x, got: { s: got.status, late: got.lateMin, w: got.workedMin, ot: got.overtimeMin } }));
  });
});
ok(dayMismatch.length === 0, 'every day of 13 sampled people matches the plan (status, minutes late, worked, overtime)', dayMismatch.slice(0, 6));
let h = call('1018', 'myHistory', { month: '2026-10' });
ok(h.totals.lateDays === 5 && h.totals.lateMin === 200, 'driver 1018: late on 5 days, 40 minutes each against the 06:00 roster shift', h.totals);
h = call('1030', 'myHistory', { month: '2026-10' });
ok(h.totals.absent === 2, 'technician 1030: two unexcused absences', h.totals);
h = call('1031', 'myHistory', { month: '2026-10' });
ok(h.days.find(x => x.date === '2026-10-14').status === 'missing_out' && h.days.find(x => x.date === '2026-10-25').status === 'leave' && h.days.find(x => x.date === '2026-10-25').leaveType === 'injury',
  '1031: a missing check-out, and the injury day off shows as leave, never absence');
h = call('1049', 'myHistory', { month: '2026-10' });
ok(!h.days.some(x => x.date < '2026-10-19' && x.status === 'absent'), 'the new driver (hired 19 October) is not absent before his first day', h.days.filter(x => x.date < '2026-10-19').map(x => x.date + ':' + x.status).slice(0, 5));
at('2026-10-14', '10:00');
r = call('1011', 'board');
ok(r.ok && r.kpi.total === 49 && !r.rows.some(x => x.emp.empNo === '1049'), 'live board on 14 October: 49 people; the driver who starts on the 19th is not on it yet', r.kpi);
at('2026-10-21', '10:00');
r = call('1011', 'board');
const want = { absent: 0, leave: 0 };
NOS.forEach(n => { const x = expectDay(n, '2026-10-21'); if (x && x.status === 'absent') want.absent++; if (x && x.status === 'leave') want.leave++; });
ok(r.ok && r.kpi.total === 50 && r.kpi.absent === want.absent && r.kpi.leave === want.leave, 'live board on 21 October: absent and on-leave counts as planned', { kpi: r.kpi, want });
// The board is read after the whole month was punched, so the day already holds his 14:00 check-out: "present".
ok(r.rows.some(x => x.emp.empNo === '1049' && x.day.status === 'present'), 'the new driver, who started on the 19th, is on it and present');

// =====================================================================================================
cycle('Payroll: October');
at('2026-11-02', '09:00');
// adjustments: approved overtime, a bonus, a fine over the cap, a large deduction over half the wage
ok(call('1011', 'payrollAdjSave', { adj: { empId: ids['1025'], month: '2026-10', code: 'overtime_hours', amount: 10, reason: 'ساعات معتمدة من المشرف' } }).ok, 'HR records 10 approved overtime hours for driver 1025');
ok(call('1011', 'payrollAdjSave', { adj: { empId: ids['1041'], month: '2026-10', code: 'bonus', amount: 500, reason: 'تحقيق المستهدف' } }).ok, 'a 500 sales bonus');
ok(call('1012', 'payrollAdjSave', { adj: { empId: ids['1022'], month: '2026-10', code: 'fine', amount: 3000, reason: 'مخالفة مرورية متكررة' } }).ok, 'a 3,000 fine for driver 1022');
ok(call('1012', 'payrollAdjSave', { adj: { empId: ids['1010'], month: '2026-10', code: 'other_deduction', amount: 4000, reason: 'عجز في الصندوق' } }).ok, 'a 4,000 deduction for the cashier');
r = call('1009', 'payrollAdjSave', { adj: { empId: ids['1009'], month: '2026-10', code: 'bonus', amount: 9999, reason: 'x' } });
ok(!r.ok && r.error === 'cannot_change_own_salary', 'nobody adds a line to their own pay');
// The current month (November) may be drafted early on purpose; only a month still to come is refused. An earlier
// draft of this check used November and so created a stray November draft that disturbed the payroll bell checks.
r = call('1011', 'payrollCreate', { month: '2026-12' });
ok(!r.ok && r.error === 'future_month', 'December cannot be run yet');
r = call('1011', 'payrollCreate', { month: '2026-10' });
const run = r.run;
ok(r.ok && /^PR-2026-\d{5}$/.test(run.ref) && run.status === 'draft' && run.totals.headcount === 50, 'HR prepares the October draft for all 50', run);
ok(call('1006', 'mySlips').rows.length === 0, 'employees see nothing while it is a draft');
ok(taskCount('1009', 'payroll') === 1, 'the payroll holder is asked to approve it');
ok(call('1009', 'payrollRecalc', { id: run.id }).ok, 'the payroll holder recalculates');
r = call('1009', 'payrollApprove', { id: run.id });
ok(!r.ok && r.error === 'second_approver_required', 'and so becomes the preparer: he cannot approve');
ok(taskCount('1009', 'payroll') === 0, 'and the bell no longer asks him to');
ok(call('1012', 'payrollRecalc', { id: run.id }).ok && taskCount('1009', 'payroll') === 1, 'HR recalculates again; the approval is back with payroll');
// a GOSI wage mismatch blocks approval until a second person closes it
const gosiRows = NOS.filter(n => EMP[n].saudi && n !== '1049' && n !== '1050').map(n => ({ id: idFor(n, true), wage: n === '1041' ? EMP[n].basic + EMP[n].housing - 500 : EMP[n].basic + EMP[n].housing }));
r = call('1011', 'reconUpload', { source: 'gosi', month: '2026-10', rows: gosiRows });
const rec = r.recon;
ok(r.ok && rec.mismatches.length === 1 && rec.mismatches[0].empNo === '1041' && rec.mismatches[0].diff === -500 && rec.missing.some(m => m.empNo === '1049'), 'GOSI export: one wage 500 short, and the new driver not yet registered', rec && { m: rec.mismatches, miss: rec.missing.map(x => x.empNo) });
r = call('1009', 'payrollApprove', { id: run.id });
ok(!r.ok && r.error === 'recon_open', 'payroll cannot be approved while the mismatch is open');
ok(taskCount('1009', 'recon') === 1 && taskCount('1011', 'recon') === 0, 'the payroll holder is asked to close it, not the one who uploaded it');
r = call('1011', 'reconResolve', { id: rec.id, note: 'x' });
ok(!r.ok && r.error === 'second_approver_required', 'the uploader cannot close it');
ok(call('1009', 'reconResolve', { id: rec.id, note: 'صُحح الأجر في التأمينات' }).ok, 'the payroll holder closes it with a note');
r = call('1009', 'payrollApprove', { id: run.id });
ok(r.ok && r.run.status === 'locked', 'the payroll holder, who did not prepare it, approves and locks the run');
ok(taskCount('1009', 'payroll') === 0, 'the approval task is gone');
r = call('1012', 'payrollRecalc', { id: run.id });
ok(!r.ok && r.error === 'not_found', 'a locked run cannot be recalculated');
r = call('1011', 'payrollAdjSave', { adj: { empId: ids['1041'], month: '2026-10', code: 'bonus', amount: 1, reason: 'x' } });
ok(!r.ok && r.error === 'month_locked', 'no new lines for a locked month');
const PG = call('1009', 'payrollGet', { id: run.id });
const SL = {}; PG.slips.forEach(s => { SL[s.emp.empNo] = s; });
ok(PG.ok && PG.slips.length === 50, '50 payslips in the locked run');
const my = call('1006', 'mySlips');
ok(my.rows.length === 1 && my.rows[0].net === SL['1006'].net, 'now each employee sees their own payslip');

cycle('Payroll accuracy cross-checks');
const sum = (list, f) => r2(list.reduce((t, x) => t + (Number(f(x)) || 0), 0));
const T = PG.run.totals;
ok(near2(T.net, sum(PG.slips, s => s.net)) && near2(T.gross, sum(PG.slips, s => s.gross)) && near2(T.gosiEmployer, sum(PG.slips, s => s.gosiEmployer)), 'run totals equal the sum of the 50 payslips', T);
const lineSum = (s, kind) => r2(s.lines.filter(l => l.kind === kind).reduce((t, l) => t + l.amount, 0));
ok(PG.slips.every(s => near2(s.gross, lineSum(s, 'earning')) && near2(s.deductions, lineSum(s, 'deduction')) && near2(s.net, s.gross - s.deductions)), 'on every payslip: net = earnings - deductions, each equal to its lines');
const line = (n, code) => (SL[n].lines.find(l => l.code === code) || {}).amount || 0;
const daily = n => total(EMP[n]) / 30;
let gosiBad = [];
NOS.forEach(n => {
  const e = EMP[n], s = SL[n]; if (!s || !s.gross) return;
  const f = s.paidDays / 30, base = Math.min(45000, Math.max(e.saudi ? 1500 : 0, e.basic + e.housing)) * f;
  const er = !e.saudi ? 2 : e.cohort === 'new' ? 12.75 : 11.75, emp = !e.saudi ? 0 : e.cohort === 'new' ? 10.75 : 9.75;
  if (!near2(line(n, 'gosi'), r2(base * emp / 100)) || !near2(s.gosiEmployer, r2(base * er / 100))) gosiBad.push(n + ': ' + line(n, 'gosi') + '/' + s.gosiEmployer + ' want ' + r2(base * emp / 100) + '/' + r2(base * er / 100));
});
ok(gosiBad.length === 0, 'GOSI on every payslip: legacy 9.75/11.75, new cohort 10.75/12.75 (Oct 2026), non-Saudi 0/2, base capped at 45,000', gosiBad.slice(0, 5));
ok(SL['1001'].info.gosi.base === 45000, 'the CEO\'s GOSI base is capped at 45,000');
ok(SL['1036'].warnings.includes('gosi_cohort_missing'), 'a Saudi with no GOSI cohort on file is flagged');
const ot = 10 * (total(EMP['1025']) / 30 / 8 + EMP['1025'].basic / 30 / 8 * 0.5);
ok(near2(line('1025', 'overtime'), ot), 'Art. 107 overtime: 10 h x (hourly wage + 50% of the basic hourly) = ' + r2(ot), line('1025', 'overtime'));
ok(near2(line('1022', 'fine'), r2(daily('1022') * 5)) && SL['1022'].warnings.includes('fine_capped'), 'Art. 70: the 3,000 fine is cut to five days\' wage (' + r2(daily('1022') * 5) + ')', SL['1022'].lines);
const capped = s => r2(s.lines.filter(l => ['gosi', 'advance', 'fine', 'other_deduction'].includes(l.code)).reduce((t, l) => t + l.amount, 0));
const dueOf = s => r2(lineSum(s, 'earning') - s.lines.filter(l => ['unpaid_leave', 'sick_75', 'sick_unpaid', 'absence', 'late'].includes(l.code)).reduce((t, l) => t + l.amount, 0));
ok(near2(capped(SL['1010']), dueOf(SL['1010']) * 0.5) && SL['1010'].warnings.includes('deductions_capped'), 'Art. 92-93: the cashier\'s deductions stop at half the wage due', { capped: capped(SL['1010']), due: dueOf(SL['1010']) });
ok(PG.slips.every(s => capped(s) <= dueOf(s) * 0.5 + 0.01), 'and no payslip takes more than half the wage due');
ok(line('1020', 'advance') === 1000 && SL['1020'].lines.find(l => l.code === 'advance').ref === adv.ref, 'the advance instalment (1,000) with its request number');
ok(near2(line('1026', 'unpaid_leave'), r2(daily('1026') * 2)), 'two days of unpaid leave are not paid');
ok(!SL['1013'].lines.some(l => l.kind === 'deduction' && l.code !== 'gosi'), 'maternity leave is paid in full');
ok(!SL['1030'].lines.some(l => l.code === 'absence') && SL['1030'].absentDays === 2, 'absence is counted (2 days) but not deducted while deductAbsence is off');
ok(SL['1049'].paidDays === 13 && near2(line('1049', 'basic'), r2(EMP['1049'].basic * 13 / 30)), 'the driver hired on 19 October is paid 13 days', SL['1049'].paidDays);
ok(SL['1050'].gross === 0 && SL['1050'].warnings.includes('no_package'), 'no approved package: a zero payslip with a warning');
ok(SL['1044'].warnings.includes('no_iban'), 'a missing IBAN is flagged');
ok(near2(line('1041', 'bonus'), 500), 'the 500 bonus is paid');
ok(SL['1025'].info.overtimeHours === 10, 'only the 10 approved hours are paid, not the 8.3 h seen in the punches (payOvertimeFromAttendance is off)', SL['1025'].info.overtimeHours);
const ex = call('1009', 'payrollExport', { id: run.id });
ok(ex.ok && near2(sum(ex.rows, x => x.net), T.net) && near2(sum(ex.departments, x => x.gross), T.gross) && ex.departments.length === 13, 'the bank rows and the accounting summary by department add up to the run', { rows: ex.rows && ex.rows.length, depts: ex.departments && ex.departments.length });

cycle('WPS (Mudad)');
r = call('1009', 'wpsFile', { id: run.id });
ok(r.ok && r.errors === 1 && r.rows.find(x => x.empNo === '1044').problems.includes('no_iban') && r.skipped.some(x => x.empNo === '1050'), 'the file flags the missing IBAN and leaves out the zero payslip', { e: r.errors, s: r.skipped });
ok(r.due === '2026-11-10', 'due on the 10th of November');
r = call('1009', 'wpsStep', { id: run.id, step: 'generated' });
ok(!r.ok && r.error === 'wps_errors', 'a file with errors cannot be marked ready');
ok(call('1011', 'hrPrivateSave', { empId: ids['1044'], priv: { iban: ibanFor('1044') } }).ok, 'HR files the missing IBAN');
r = call('1009', 'wpsFile', { id: run.id });
ok(r.errors === 0 && near2(r.total, sum(r.rows, x => x.net)) && r.rows.length === 49, 'now 49 clean rows; the total is the sum of nets', { e: r.errors, n: r.rows.length });
ok(call('1009', 'wpsStep', { id: run.id, step: 'generated' }).ok, 'generated');
r = call('1009', 'wpsStep', { id: run.id, step: 'uploaded' });
ok(!r.ok && r.error === 'missing_fields', 'uploading needs the bank or Mudad reference');
ok(call('1009', 'wpsStep', { id: run.id, step: 'uploaded', bankRef: 'MUDAD-2026-10-7781' }).ok, 'uploaded with its reference');
ok(taskCount('1011', 'wps') === 1 && taskCount('1009', 'wps') === 0, 'HR is asked to confirm, not the uploader');
r = call('1009', 'wpsStep', { id: run.id, step: 'confirmed' });
ok(!r.ok && r.error === 'second_approver_required', 'the uploader cannot confirm');
ok(call('1011', 'wpsStep', { id: run.id, step: 'confirmed' }).ok && taskCount('1011', 'wps') === 0, 'HR confirms; done');

cycle('Leave balances and end of service');
/** Annual leave earned from a to b inclusive: 21 a year, 30 after the 5th anniversary (or the contract's days). */
function accrue(n, a, b) {
  const e = EMP[n], c = ['G8', 'G9', 'G10'].includes(e.grade) ? 30 : 0, lo = Math.max(21, c), hi = Math.max(30, c);
  const five = (Number(e.hire.slice(0, 4)) + 5) + e.hire.slice(4);
  const days = daysBetween(a, b) + 1;
  if (five > b) return days * lo / 365;
  if (five <= a) return days * hi / 365;
  const x = daysBetween(a, five); return x * lo / 365 + (days - x) * hi / 365;
}
function balance(n, asOf, used) { return r2((OPEN[n] || 0) + accrue(n, '2026-09-27', asOf) - (used || 0)); }
r = call('1006', 'myRequests');
ok(near2(r.leave.annual.balance, balance('1006', '2026-11-02', 5)) && r.leave.annual.used === 5 && r.leave.annual.perYear === 30, 'accountant 1006 (6 years): carried over + 30 a year since go-live - 5 used', { got: r.leave.annual, want: balance('1006', '2026-11-02', 5) });
r = call('1042', 'myRequests');
ok(near2(r.leave.annual.balance, balance('1042', '2026-11-02')) && r.leave.annual.perYear === 21, 'sales rep 1042 (under 5 years): 21 a year', { got: r.leave.annual.balance, want: balance('1042', '2026-11-02') });
r = call('1041', 'myRequests');
ok(near2(r.leave.annual.balance, balance('1041', '2026-11-02')), 'sales rep 1041 passed 5 years on 1 October: 21 a year until then, 30 after', { got: r.leave.annual.balance, want: balance('1041', '2026-11-02') });
r = call('1026', 'myRequests');
ok(near2(r.leave.annual.balance, r2(balance('1026', '2026-11-02'))), 'a 2-day unpaid leave does not pause accrual: only days beyond the 20th suspend the contract (Art. 116)', { got: r.leave.annual.balance });
function eosWant(n, last, reason) {
  const e = EMP[n], w = total(e), days = daysBetween(e.hire, last) + 1, y = days / 365;
  const full = Math.min(y, 5) * w / 2 + Math.max(0, y - 5) * w;
  const factor = reason === 'termination' ? 1 : y < 2 ? 0 : y < 5 ? 1 / 3 : y < 10 ? 2 / 3 : 1;
  return { years: r2(y), award: r2(full * factor), factor: r2(factor) };
}
let q = call('1009', 'eosQuote', { empId: ids['1033'], reason: 'resignation' });
let wq = eosWant('1033', '2026-11-14', 'resignation');
const bal33 = balance('1033', '2026-11-14');
ok(q.ok && q.eos.lastDay === '2026-11-14' && near2(q.eos.award, wq.award) && q.eos.factor === wq.factor && near2(q.eos.leaveDays, bal33) &&
  q.eos.lastMonthDays === 14 && q.eos.dueBy === '2026-11-28', 'resignation after 3.3 years (Art. 85): a third of the award, unused leave, 14 days of November, due within two weeks', { got: q.eos, want: wq, bal33 });
q = call('1011', 'eosQuote', { empId: ids['1024'], lastDay: '2026-11-30', reason: 'termination' });
wq = eosWant('1024', '2026-11-30', 'termination');
ok(q.ok && near2(q.eos.award, wq.award) && q.eos.factor === 1 && q.eos.dueBy === '2026-12-07', 'termination after 7.2 years (Art. 84): half a month for 5 years, a month after, due within a week', { got: q.eos.award, want: wq.award });
q = call('1006', 'eosQuote', { empId: ids['1006'] });
ok(!q.ok && q.error === 'forbidden', 'an employee cannot run the end-of-service calculator');

// =====================================================================================================
cycle('Performance: review cycle and 360');
at('2026-11-03', '09:00');
r = call('1016', 'perfCycleSave', { cycle: { year: 2026 } });
ok(!r.ok && r.error === 'forbidden', 'only HR opens a cycle');
r = call('1011', 'perfCycleSave', { cycle: { year: 2026, nameAr: 'تقييم الأداء 2026', kpiWeight: 70 } });
const CYC = r.cycle;
ok(r.ok && CYC.status === 'setup' && CYC.kpiWeight === 70 && CYC.compWeight === 30, 'HR opens the 2026 cycle (70% KPIs, 30% competencies)');
call('1011', 'perfCycleStage', { id: CYC.id, status: 'goals' });
const KP = (w) => [{ titleAr: 'نسبة التسليم في الموعد', measure: '%', target: '95', weight: w[0] }, { titleAr: 'صفر حوادث', measure: 'عدد', target: '0', weight: w[1] }, { titleAr: 'رضا العملاء', measure: 'نقاط', target: '4.5', weight: w[2] }];
r = call('1018', 'kpiSave', { empId: ids['1018'], cycleId: CYC.id, kpis: KP([40, 30, 30]) });
ok(!r.ok && r.error === 'cannot_edit_own', 'nobody sets their own KPIs');
r = call('1016', 'kpiSave', { empId: ids['1018'], cycleId: CYC.id, kpis: KP([40, 30, 20]) });
ok(!r.ok && r.error === 'kpi_total', 'the weights must total 100');
r = call('1017', 'kpiSave', { empId: ids['1018'], cycleId: CYC.id, kpis: KP([40, 30, 30]) });
ok(!r.ok && r.error === 'forbidden', 'another team\'s supervisor cannot set them');
const team = ['1018', '1019', '1020', '1021'];
team.forEach(n => call('1016', 'kpiSave', { empId: ids[n], cycleId: CYC.id, kpis: KP([40, 30, 30]) }));
['1006', '1007'].forEach(n => call('1005', 'kpiSave', { empId: ids[n], cycleId: CYC.id, kpis: KP([50, 25, 25]) }));
r = call('1011', 'perfOverview', { cycleId: CYC.id });
ok(r.ok && r.progress.kpisSet === 6, 'six people have KPIs that total 100', r.progress);
call('1011', 'perfCycleStage', { id: CYC.id, status: 'midyear' });
let mp = call('1018', 'myPerformance');
ok(call('1016', 'kpiMid', { kpiId: mp.kpis[0].id, midStatus: 'at_risk', midNote: 'تأخر متكرر' }).ok && call('1018', 'myPerformance').kpis[0].midStatus === 'at_risk', 'mid-year: the supervisor marks a KPI at risk and the driver sees it');
call('1011', 'feedbackLaunch', { cycleId: CYC.id, subjects: [ids['1016'], ids['1005']] });
call('1011', 'perfCycleStage', { id: CYC.id, status: 'review' });
const COMPS = ['safety', 'customer', 'teamwork', 'ownership', 'communication', 'problem_solving'];
const comps = v => COMPS.reduce((o, k) => { o[k] = v; return o; }, {});
r = call('1018', 'reviewSelf', { cycleId: CYC.id, kpis: [], comps: {}, submit: true });
ok(!r.ok && r.error === 'incomplete', 'a self-assessment needs every KPI and competency scored');
team.concat(['1006', '1007']).forEach(n => {
  const k = call(n, 'myPerformance').kpis;
  call(n, 'reviewSelf', { cycleId: CYC.id, kpis: k.map(x => ({ id: x.id, actual: 'تحقق', selfScore: 4 })), comps: comps(4), comment: 'سنة جيدة', submit: true });
});
const mgrScores = { '1018': [3, 4, 4], '1019': [4, 4, 4], '1020': [5, 4, 4], '1021': [3, 3, 3], '1006': [4, 5, 4], '1007': [3, 4, 3] };
team.concat(['1006', '1007']).forEach(n => {
  const mgr = n === '1006' || n === '1007' ? '1005' : '1016';
  const k = call(mgr, 'perfEmp', { empId: ids[n], cycleId: CYC.id }).kpis;
  call(mgr, 'reviewManager', { cycleId: CYC.id, empId: ids[n], kpis: k.map((x, i) => ({ id: x.id, mgrScore: mgrScores[n][i] })), comps: comps(3), comment: 'ملاحظات المدير', submit: true });
});
const pe = call('1016', 'perfEmp', { empId: ids['1018'], cycleId: CYC.id });
ok(pe.ok && pe.review.kpiScore === 3.6 && pe.review.compScore === 3 && pe.review.overall === 3.42, 'overall = 70% x KPIs 3.6 + 30% x competencies 3.0 = 3.42', pe.review);
ok(call('1018', 'myPerformance').review.overall === undefined, 'the driver does not see the manager\'s scores before the cycle closes');
// 360: three of six reports answer for 1016 (shown), two peers (hidden); two reports for 1005 (hidden)
// Each invitation lists the competencies to rate: both subjects manage people, so "leadership" is on the list too.
let fbDone = 0;
['1018', '1019', '1020', '1017', '1022', '1006', '1007'].forEach(n => {
  call(n, 'myPerformance').tasks.forEach(t => {
    const ans = t.competencies.reduce((o, k) => { o[k] = 4; return o; }, {});
    if (call(n, 'feedbackSubmit', { id: t.id, answers: ans, comment: 'تعليق ' + n }).ok) fbDone++;
  });
});
ok(fbDone === 7, 'seven 360 answers: three of the supervisor\'s reports, two of his peers, the accountant\'s two reports', fbDone);
r = call('1018', 'myPerformance').tasks;
ok(r.length === 0, 'a submitted invitation leaves the list');
call('1011', 'perfCycleStage', { id: CYC.id, status: 'calibration' });
const ov = call('1011', 'perfOverview', { cycleId: CYC.id });
const rv19 = ov.rows.find(x => x.emp.empNo === '1019');
r = call('1011', 'perfCalibrate', { reviewId: rv19.reviewId, finalRating: 5 });
ok(!r.ok && r.error === 'note_required', 'a rating other than the computed one needs a reason');
ok(call('1011', 'perfCalibrate', { reviewId: rv19.reviewId, finalRating: 5, note: 'أفضل سجل سلامة في الفريق' }).ok, 'HR calibrates driver 1019 to 5 with a reason');
call('1011', 'perfCycleStage', { id: CYC.id, status: 'closed' });
mp = call('1019', 'myPerformance');
ok(mp.last && mp.last.review.finalRating === 5 && mp.last.review.adjusted && mp.last.review.calibrationNote === '', 'closed: the driver sees 5, marked adjusted; the HR note stays internal', mp.last && mp.last.review);
mp = call('1018', 'myPerformance');
ok(mp.last && mp.last.review.finalRating === 3, 'and 1018 gets the rounded overall, 3');
ok(call('1018', 'reviewAck', { reviewId: mp.last.review.id, comment: 'شكرا' }).ok, 'the driver acknowledges');
r = call('1011', 'perfCycleStage', { id: CYC.id, status: 'review' });
ok(!r.ok && r.error === 'cycle_closed', 'a closed cycle cannot be reopened');
let fr = call('1016', 'feedbackResults', { cycleId: CYC.id });
ok(fr.ok && fr.groups.report.shown && fr.groups.report.n === 3 && !fr.groups.peer.shown && fr.groups.peer.n === 2 && fr.groups.peer.avg === null, '360 for the supervisor: three reports shown as a group, two peers hidden', fr.groups);
ok(!JSON.stringify(fr).includes(ids['1018']) && !fr.comments.some(c => c.includes('1017') || c.includes('1022')), 'no rater is named, and the hidden peers\' comments are left out');
fr = call('1005', 'feedbackResults', { cycleId: CYC.id });
ok(fr.ok && !fr.groups.report.shown && fr.groups.report.n === 2, 'the accounts manager\'s two reports stay hidden (fewer than 3)', fr.groups);
r = call('1019', 'feedbackResults', { cycleId: CYC.id, subjectId: ids['1016'] });
ok(!r.ok && r.error === 'forbidden', 'a driver cannot read his supervisor\'s 360');

// =====================================================================================================
cycle('Pulse survey, policies, IDP and PIP');
at('2026-11-04', '09:00');
r = call('1011', 'surveySave', { titleAr: 'استبيان النبض نوفمبر' });
const SV = r.survey;
ok(r.ok && SV.eligible === 50, 'HR opens a pulse survey for all 50');
ok(taskCount('1018', 'survey') === 1, 'everyone is asked to take part');
const ANS = [];
const answer = (n, nps) => { const a = { enps: nps, engaged: 4, belong: 4, manager: nps >= 9 ? 5 : 3, growth: 3, tools: 4 }; if (call(n, 'surveyAnswer', { id: SV.id, answers: a, comment: 'ملاحظة' }).ok) ANS.push({ n, a }); };
['1018', '1019', '1020', '1021'].forEach((n, i) => answer(n, [10, 9, 7, 3][i]));
r = call('1002', 'surveyResults', { id: SV.id });
ok(r.ok && r.overall.hidden && r.comments.length === 0, 'four answers: results and comments stay hidden (fewer than 5)', r.overall);
ok(taskCount('1018', 'survey') === 0, 'an answered survey leaves the bell');
r = call('1018', 'surveyAnswer', { id: SV.id, answers: { enps: 5, engaged: 3, belong: 3, manager: 3, growth: 3, tools: 3 } });
ok(!r.ok && r.error === 'already_submitted', 'one answer per person');
['1022', '1023', '1024', '1025', '1006', '1007', '1040', '1041'].forEach((n, i) => answer(n, [9, 10, 8, 6, 9, 2, 10, 9][i]));
r = call('1002', 'surveyResults', { id: SV.id });
const pro = ANS.filter(x => x.a.enps >= 9).length, det = ANS.filter(x => x.a.enps <= 6).length;
ok(r.ok && !r.overall.hidden && r.responses === 12 && r.overall.enps === Math.round((pro - det) / ANS.length * 100), 'twelve answers: eNPS = % promoters - % detractors = ' + Math.round((pro - det) / ANS.length * 100), r.overall);
const dDst = r.departments.find(x => x.department === 'التوزيع'), dAcc = r.departments.find(x => x.department === 'الحسابات');
ok(dDst && !dDst.hidden && dDst.n === 8 && dAcc && dAcc.hidden, 'distribution (8 answers) is shown, accounts (2) is hidden', r.departments.map(x => x.department + ':' + x.n + (x.hidden ? 'h' : '')));
const sa = direct(() => B.ctx.readAll_('surveyAnswers'));
const svRow = direct(() => B.ctx.findBy_('surveys', 'id', SV.id));
const voters = JSON.parse(svRow.votersJson);
ok(sa.length === 12 && sa.every(x => !('empId' in x) && !Object.values(x).some(v => Object.values(ids).includes(v))) && voters.join() === voters.slice().sort().join() && !voters.some(v => Object.values(ids).includes(v)),
  'answers carry no employee id; the voter list is sorted keyed hashes');
ok(!call('1018', 'surveyResults').ok, 'an employee cannot read the results');
// policies with versioned acknowledgement
r = call('1011', 'policySave', { policy: { titleAr: 'سياسة الحضور والانصراف', bodyAr: 'تبدأ ساعات العمل في الثامنة صباحا.' } });
const POL = r.policy;
ok(r.ok && POL.version === 1 && taskCount('1006', 'policies') === 1, 'HR publishes the attendance policy (version 1); everyone is asked to acknowledge');
const ackers = ['1006', '1007', '1018', '1019', '1020', '1021', '1022', '1040', '1041', '1042'];
ackers.forEach(n => call(n, 'policyAck', { id: POL.id, version: 1 }));
r = call('1011', 'policyList');
ok(r.coverage.find(c => c.id === POL.id).acked === 10 && r.coverage.find(c => c.id === POL.id).people === 50, 'coverage: 10 of 50 acknowledged, and HR sees who is missing');
call('1011', 'policySave', { policy: { id: POL.id, titleAr: 'سياسة الحضور والانصراف', bodyAr: 'تبدأ ساعات العمل في الثامنة صباحا، ومهلة التأخير 15 دقيقة.' } });
ok(taskCount('1006', 'policies') === 1, 'a change to the text makes version 2 and asks again');
r = call('1006', 'policyAck', { id: POL.id, version: 1 });
ok(!r.ok && r.error === 'policy_changed', 'acknowledging the old version is refused');
ok(call('1006', 'policyAck', { id: POL.id, version: 2 }).ok && taskCount('1006', 'policies') === 0, 'version 2 acknowledged');
// IDP and PIP
r = call('1018', 'planSave', { plan: { empId: ids['1018'], type: 'idp', endDate: '2027-06-30', goals: [{ title: 'x' }] } });
ok(!r.ok && r.error === 'forbidden', 'nobody writes their own plan');
r = call('1016', 'planSave', { plan: { empId: ids['1018'], type: 'pip', titleAr: 'تحسين الانضباط', startDate: '2026-11-04', endDate: '2026-12-31', reason: 'تأخر خمس مرات في أكتوبر بأربعين دقيقة', support: 'تعديل مسار التوزيع ومتابعة أسبوعية', goals: [{ title: 'الحضور في الموعد', measure: 'صفر تأخير لثمانية أسابيع' }] } });
const PIP = r.plan;
ok(r.ok && PIP.ref.startsWith('PIP-') && taskCount('1018', 'plans') === 1, 'the supervisor opens a 57-day PIP; the driver is asked to read it');
ok(call('1018', 'planAck', { id: PIP.id, comment: 'سألتزم' }).ok && taskCount('1018', 'plans') === 0, 'the driver acknowledges it');
ok(call('1016', 'planCheckIn', { id: PIP.id, note: 'أسبوع بلا تأخير', goalStatus: { 0: 'on_track' } }).ok, 'a check-in with goal status');
r = call('1011', 'planClose', { id: PIP.id, outcome: 'extended', endDate: '2027-02-15', note: 'x' });
ok(!r.ok && r.error === 'pip_length', 'an extension beyond 90 days is refused');
ok(call('1011', 'planClose', { id: PIP.id, outcome: 'extended', endDate: '2027-01-31', note: 'تمديد شهر للتأكد' }).ok, 'HR extends it within 90 days');
r = call('1005', 'planSave', { plan: { empId: ids['1006'], type: 'idp', titleAr: 'مسار محاسب أول', endDate: '2027-06-30', goals: [{ title: 'شهادة SOCPA' }] } });
ok(r.ok && r.plan.type === 'idp', 'an IDP for the accountant');

// =====================================================================================================
cycle('Disciplinary case');
at('2026-11-05', '09:00');
r = call('1016', 'discOpen', { case: { empId: ids['1018'], code: 'LATE60', incidentDate: '2026-09-28', discoveredDate: '2026-09-29', description: 'تأخر أربعين دقيقة دون إذن' } });
ok(!r.ok && r.error === 'too_late', 'a case more than 30 days after discovery is refused');
r = call('1016', 'discOpen', { case: { empId: ids['1018'], code: 'LATE60', incidentDate: '2026-10-27', discoveredDate: '2026-10-28', description: 'تأخر أربعين دقيقة عن وردية السادسة دون إذن' } });
const DC = r.case;
ok(r.ok && DC.occurrence === 1 && DC.suggested === 'fine_pct:25' && DC.status === 'charged', 'the supervisor opens a case: first occurrence, the schedule says 25% of a day', DC);
ok(taskCount('1018', 'disc_respond') === 1, 'the driver is asked to answer');
ok(call('1018', 'discRespond', { id: DC.id, text: 'زحام بسبب حادث' }).ok && taskCount('1018', 'disc_respond') === 0, 'he answers in writing');
r = call('1012', 'discDecide', { id: DC.id });
ok(!r.ok && r.error === 'hearing_required', 'no penalty without a recorded hearing');
ok(call('1012', 'discHearing', { id: DC.id, minutes: 'استمع للموظف ولم يقدم ما يثبت الحادث', attendees: 'المشرف، الموارد البشرية' }).ok, 'HR records the hearing');
ok(taskCount('1012', 'disc_decide') === 1 && taskCount('1016', 'disc_decide') === 0, 'HR is asked to decide, not the supervisor who reported it');
r = call('1012', 'discDecide', { id: DC.id, penalty: 'fine_days:6', note: 'x' });
ok(!r.ok && r.error === 'bad_penalty', 'a fine of more than 5 days is refused (Art. 66)');
r = call('1012', 'discDecide', { id: DC.id });
ok(r.ok && near2(r.case.amount, r2(daily('1018') * 0.25)) && r.case.adjMonth === '2026-11', 'decided as scheduled: 25% of a day\'s wage, deducted in November', r.case);
ok(call('1018', 'discObject', { id: DC.id, text: 'أطلب إعادة النظر' }).ok, 'the driver files a grievance within 30 days of notice (Art. 72 as amended)');
ok(taskCount('1011', 'disc_objection') === 1 && taskCount('1012', 'disc_objection') === 0, 'the objection goes to the other HR person, not the one who decided');
r = call('1012', 'discObjectionDecide', { id: DC.id, result: 'upheld', note: 'x' });
ok(!r.ok && r.error === 'second_approver_required', 'the one who decided cannot rule on it');
ok(call('1011', 'discObjectionDecide', { id: DC.id, result: 'upheld', note: 'لا يوجد ما يثبت العذر' }).ok, 'the other HR person upholds it');
const fineAdj = direct(() => B.ctx.readAll_('adjustments')).find(a => a.empId === ids['1018'] && a.code === 'fine' && a.status === 'active');
ok(fineAdj && fineAdj.month === '2026-11', 'the fine waits in November\'s payroll');

// =====================================================================================================
cycle('Assets return and charge; resignation, clearance and final settlement');
at('2026-11-06', '09:00');
const custody = call('1011', 'assetList').rows;
const cTruck = custody.find(a => a.id === asset.truck.id).holder.custodyId, cPos = custody.find(a => a.id === asset.pos.id).holder.custodyId, cUni = custody.find(a => a.id === asset.uniform.id).holder.custodyId;
ok(call('1011', 'assetReturn', { id: cTruck, condition: 'good' }).ok, 'the truck comes back in good condition');
r = call('1011', 'assetReturn', { id: cPos, condition: 'lost', charge: 2000 });
ok(!r.ok && r.error === 'charge_over_value', 'a charge cannot exceed the asset value');
ok(call('1011', 'assetReturn', { id: cPos, condition: 'lost', charge: 1500, note: 'فُقد الجهاز في المسار' }).ok, 'the POS is lost; HR proposes 1,500');
r = call('1009', 'assetList');
ok(taskCount('1009', 'asset_charge') === 1 && r.toDecide.length === 1 && r.toDecide[0].charge === 1500, 'the payroll holder is asked to approve it and can list it');
ok(call('1009', 'assetCharge', { id: cPos, approve: true }).ok && taskCount('1009', 'asset_charge') === 0, 'approved: it becomes a deduction');
ok(direct(() => B.ctx.readAll_('adjustments')).some(a => a.empId === ids['1021'] && a.code === 'other_deduction' && Number(a.amount) === 1500 && a.month === '2026-11'), 'in November\'s payroll');
// clearance of the resigning technician
let cl = call('1011', 'clearanceList').rows.find(x => x.emp.empNo === '1033');
ok(cl && cl.total === 8 && cl.tasks.find(t => t.key === 'assets').status === 'open', 'the approved resignation opened a clearance; the uniform is still held');
r = call('1033', 'clearanceTask', { id: cl.id, key: 'handover' });
ok(!r.ok && r.error === 'forbidden', 'the leaver cannot tick his own clearance');
ok(call('1029', 'clearanceTask', { id: cl.id, key: 'handover', note: 'سلم المحطة للبديل' }).ok, 'the supervisor confirms the hand-over');
r = call('1029', 'clearanceTask', { id: cl.id, key: 'gosi' });
ok(!r.ok && r.error === 'forbidden', 'the supervisor cannot tick HR tasks');
ok(call('1011', 'assetReturn', { id: cUni, condition: 'good' }).ok, 'the uniform is returned');
['access', 'gosi', 'qiwa', 'certificate'].forEach(k => call('1012', 'clearanceTask', { id: cl.id, key: k }));
r = call('1033', 'requestCreate', { request: { type: 'letter', subtype: 'experience' } });
ok(r.ok && call('1011', 'reqDecide', { id: r.request.id, decision: 'approve' }).ok, 'HR issues the service certificate (Art. 64) and the experience letter');
r = call('1009', 'clearanceTask', { id: cl.id, key: 'paid' });
ok(!r.ok && r.error === 'clearance_incomplete', 'the settlement cannot be paid before it is prepared');
q = call('1012', 'eosQuote', { empId: ids['1033'], reason: 'resignation' });
ok(q.ok && q.eos.net > 0, 'HR computes the final settlement');
r = call('1012', 'clearanceTask', { id: cl.id, key: 'settlement', note: 'المخالصة ' + q.eos.net });
ok(r.ok, 'HR prepares the settlement (the company has one payroll holder, who must stay free to pay it)', r);
r = call('1009', 'clearanceTask', { id: cl.id, key: 'paid' });
ok(r.ok && r.clearance.status === 'cleared', 'the payroll holder, who did not prepare it, pays it: cleared', r.clearance || r);

// =====================================================================================================
cycle('Reports: every report as every role');
at('2026-11-08', '10:00');
const ROLE = { employee: '1006', manager: '1016', hr: '1011', payroll: '1009', executive: '1002', admin: '1045' };
const REPORTS = B.ctx.REPORTS;
const RIDS = Object.keys(REPORTS);
ok(RIDS.length === 68, '68 reports in the catalogue (19 registers + 45 analytical + 4 talent)', RIDS.length);
const prm = id => {
  const ps = REPORTS[id].params, o = {};
  if (ps.some(p => /^range/.test(p))) Object.assign(o, id === 'hr_movement' ? { from: '2026-01-01', to: '2026-12-31' } : { from: '2026-10-01', to: '2026-10-31' });
  if (ps.includes('month')) o.month = '2026-10';
  if (ps.includes('asOf')) o.asOf = '2026-10-31';
  if (ps.includes('run')) o.run = run.id;
  if (ps.includes('cycle')) o.cycle = CYC.id;
  if (ps.includes('days')) o.days = 90;
  return o;
};
const allow = (acc, role) => acc === 'people' ? role !== 'employee' : acc === 'money' ? ['hr', 'payroll'].includes(role) : acc === 'cost' ? ['hr', 'payroll', 'executive'].includes(role) : ['hr', 'admin'].includes(role);
const RR = {}; let accBad = [], rlsBad = [];
const team16 = managesSet('1016');
Object.keys(ROLE).forEach(role => RIDS.forEach(id => {
  const res = call(ROLE[role], 'reportRun', { reportId: id, params: prm(id) });
  const want = allow(REPORTS[id].access, role);
  if (want !== !!res.ok || (!res.ok && res.error !== 'forbidden')) accBad.push(role + ':' + id + ' ' + (res.ok ? 'ok' : res.error));
  if (res.ok && role === 'manager' && res.rows.some(x => x.empNo && !team16.has(String(x.empNo)))) rlsBad.push(id);
  if (res.ok && role === 'manager' && !res.teamOnly) rlsBad.push(id + ' not marked team-only');
  (RR[role] = RR[role] || {})[id] = res;
}));
ok(accBad.length === 0, 'each report opens exactly for the roles allowed (people / money / cost / audit) and is forbidden for the rest', accBad);
ok(rlsBad.length === 0, 'the supervisor\'s reports hold only his own people (row-level security)', rlsBad);
const H = RR.hr;
const regNet = sum(H.pay_register.rows, x => x.net);
ok(near2(regNet, T.net) && near2(H.pay_register.checks.find(c => c.code === 'control_total').value, T.net), 'payroll register: the net column and its control total equal the run', { regNet, run: T.net });
ok(near2(sum(H.pay_cost.rows, x => x.gross), T.gross) && near2(sum(H.pay_cost.rows, x => x.gosiEmployer), T.gosiEmployer), 'cost by department equals the run gross and employer GOSI');
ok(near2(sum(H.pay_gosi.rows, x => x.employee), T.gosiEmployee), 'the GOSI report equals the employee GOSI of the run');
ok(H.pay_register.rows.every(x => !x.iban || /^SA\d{2}••••\d{4}$/.test(x.iban)), 'IBANs are masked in the register');
const attS = {}; H.att_summary.rows.forEach(x => { attS[x.empNo] = x; });
let attBad = [];
NOS.forEach(n => {
  let present = 0, absent = 0, lateDays = 0;
  OCT.forEach(d => { const x = expectDay(n, d); if (!x || !x.work) return; if (x.status === 'present' || x.status === 'missing_out') { present++; if (x.late) lateDays++; } if (x.status === 'absent') absent++; });
  const g = attS[n];
  if (!g ? present + absent > 0 : g.present !== present || g.absent !== absent || g.lateDays !== lateDays) attBad.push(n + ' want ' + [present, absent, lateDays] + ' got ' + (g ? [g.present, g.absent, g.lateDays] : 'none'));
});
ok(attBad.length === 0, 'attendance summary: present, absent and late days of all 50 equal the planned month', attBad.slice(0, 6));
const mon = H.att_monthly.rows.find(x => x.empNo === '1030');
ok(mon && mon.d13 === 'A' && mon.d21 === 'A' && H.att_monthly.rows.find(x => x.empNo === '1006').d12 === 'V' && mon.d29 === 'H', 'monthly sheet: A absent, V leave, H holiday');
ok(H.att_exceptions.rows.some(x => x.empNo === '1037' && x.status === 'rejected') && H.att_exceptions.rows.some(x => x.empNo === '1027' && x.status === 'approved') && H.att_exceptions.rows.some(x => x.empNo === '1032' && x.status === 'manual'), 'exceptions: the reviewed, rejected and corrected punches');
ok(H.leave_taken.rows.some(x => x.empNo === '1006' && x.leaveType === 'annual' && x.daysInPeriod === 5), 'leave taken: 1006, 5 days annual');
ok(H.leave_balances.checks.some(c => c.code === 'opening_missing'), 'balances: a check flags the people with no carried-over balance');
// The log filters by the date a request was made; the advance was made on 27 September, so look from 1 September.
const rlH = call('1011', 'reportRun', { reportId: 'requests_log', params: { from: '2026-09-01', to: '2026-11-08' } });
const rlM = call('1016', 'reportRun', { reportId: 'requests_log', params: { from: '2026-09-01', to: '2026-11-08' } });
ok(rlH.rows.some(x => x.type === 'advance' && x.empNo === '1020') && rlM.rows.some(x => x.empNo === '1019' && x.subtype === 'paternity') && !rlM.rows.some(x => x.type === 'advance'),
  'the requests log shows driver 1020\'s advance to HR, never to his supervisor (who still sees his team\'s other requests)');
ok(H.hr_headcount.rows.length === 50, 'employee register: 50 people');
ok(H.hr_expiry.rows.some(x => x.empNo === '1007' && x.kind === 'iqama') && H.hr_expiry.rows.some(x => x.empNo === '1023' && x.kind === 'contract_end'), 'expiring: the iqama of 1007 and the contract of 1023');
ok(H.hr_movement.rows.some(x => x.empNo === '1049' && x.movement === 'joined') && H.hr_movement.rows.some(x => x.empNo === '1033' && x.movement === 'left'), 'movement: the new driver joined, the technician leaves');
ok(H.perf_results.rows.find(x => x.empNo === '1018').overall === 3.42, 'performance results: 1018 at 3.42');
// Salary views happened on 27 September (set-up) and from 2 November (payroll), not in October: widen the range.
const al = call('1045', 'reportRun', { reportId: 'audit_log', params: { from: '2026-10-01', to: '2026-11-08', auditAction: 'salary_view' } });
ok(al.ok && al.rows.length > 0 && al.rows.every(x => x.action === 'salary_view'), 'audit log: the salary views of the payroll run are recorded (' + (al.rows || []).length + ')');
const eosRow = H.pay_eos.rows.find(x => x.empNo === '1024');
ok(eosRow && near2(eosRow.awardFull, eosWant('1024', '2026-10-31', 'termination').award), 'end-of-service liability for 1024 matches the Art. 84 award', eosRow);
// numbered export, review by someone else, fingerprint
r = call('1011', 'reportExport', { reportId: 'att_summary', params: prm('att_summary'), format: 'xlsx' });
const exp = r.export;
ok(r.ok && /^RPT-2026-\d{5}$/.test(exp.ref) && /^[0-9a-f]{64}$/.test(exp.hash), 'HR exports the attendance summary: numbered and fingerprinted');
ok(taskCount('1012', 'reports') === 1 && taskCount('1011', 'reports') === 0, 'the other HR person is asked to review it, not the maker');
r = call('1011', 'reportReview', { ref: exp.ref });
ok(!r.ok && r.error === 'second_approver_required', 'the maker cannot review their own export');
ok(call('1012', 'reportReview', { ref: exp.ref, note: 'راجعت الأرقام' }).ok && taskCount('1012', 'reports') === 0, 'reviewed by the other HR person');
r = call('1002', 'reportVerify', { ref: exp.ref, hash: exp.hash.slice(0, 16) });
ok(r.ok && r.found && r.match && r.unchanged, 'the executive verifies the printed copy: genuine and unchanged');
r = call('1002', 'reportVerify', { ref: exp.ref, hash: 'deadbeefdeadbeef' });
ok(r.ok && r.match === false, 'a wrong fingerprint does not match');
r = call('1009', 'reportExport', { reportId: 'pay_register', params: prm('pay_register'), format: 'pdf' });
ok(r.ok && taskCount('1011', 'reports') === 1, 'payroll exports the register; HR is asked to review it');
call('1011', 'reportReview', { ref: r.export.ref });

// =====================================================================================================
cycle('Dashboard as every role');
const actives = NOS.length;
let weighted = 0, saudis = 0;
NOS.forEach(n => { const e = EMP[n]; if (!e.saudi) return; saudis++; if (n === '1050') return; const w = e.basic + e.housing; weighted += w >= 4000 ? 1 : w >= 3000 ? 0.5 : 0; });
const wantPct = Math.round(weighted / actives * 1000) / 10;
Object.keys(ROLE).forEach(role => {
  const d = call(ROLE[role], 'dashboard', { from: '2026-10-01', to: '2026-10-31' });
  const canSee = ['hr', 'payroll', 'executive', 'admin'].includes(role), money = ['hr', 'payroll', 'executive'].includes(role);
  if (!canSee) { ok(!d.ok && d.error === 'forbidden', role + ': no dashboard'); return; }
  ok(d.ok && d.workforce.headcount === actives && d.workforce.saudis === saudis && d.workforce.saudiPct === wantPct, role + ': headcount ' + actives + ', ' + saudis + ' Saudis, weighted Saudization ' + wantPct + '%', d.workforce && { h: d.workforce.headcount, s: d.workforce.saudis, p: d.workforce.saudiPct });
  ok(!!d.cost === money && d.money === money, role + (money ? ': sees payroll cost and liabilities' : ': sees no money'));
  if (money) ok(d.cost.trend.some(x => x.month === '2026-10' && near2(x.net, T.net)), role + ': the October cost trend equals the run');
  ok(!JSON.stringify(d).includes(ibanFor('1006')), role + ': no IBAN leaves the server');
});

// =====================================================================================================
cycle('Compliance calendar');
r = call('1011', 'complianceCalendar');
const items = r.items || [];
ok(r.ok && items.some(x => x.kind === 'gosi_register' && x.emp.empNo === '1049' && x.level === 'error'), 'GOSI registration of the new driver is overdue (15 days)');
ok(items.some(x => x.kind === 'qiwa_contract' && x.emp.empNo === '1050'), 'the contract not documented in Qiwa is listed');
ok(items.some(x => x.kind === 'iqama' && x.emp.empNo === '1007') && items.some(x => x.kind === 'contract_end' && x.emp.empNo === '1023'), 'the expiring iqama and fixed-term contract');
ok(items.some(x => x.kind === 'payroll_not_locked' && x.month === '2026-09') && !items.some(x => x.month === '2026-10'), 'September has no locked payroll; October is done (locked, uploaded, confirmed)');
ok(!items.some(x => x.kind === 'recon_open') && !items.some(x => x.kind === 'injury_gosi'), 'no open mismatch, no injury waiting for GOSI');
// 36.5 weighted Saudis of 50 is 73%: above the 60% target, so nothing is listed. Raise the target to see the alert.
ok(!items.some(x => x.kind === 'saudization'), 'Saudization (' + wantPct + '%) is above the 60% target: no alert');
call('1045', 'settingsSave', { settings: { saudizationTarget: 80 } });
r = call('1011', 'complianceCalendar');
ok(r.items.some(x => x.kind === 'saudization' && x.target === 80 && x.value === wantPct), 'with an 80% target the calendar warns: ' + wantPct + '% against 80%');
call('1045', 'settingsSave', { settings: { saudizationTarget: 60 } });
ok(call('1009', 'complianceCalendar').ok && !call('1006', 'complianceCalendar').ok && !call('1016', 'complianceCalendar').ok, 'payroll sees it; employees and managers do not');

// =====================================================================================================
cycle('Wave 1 cycle links (docs/ROADMAP.md)');
// 1. Hire to onboarding, probation and the first payroll: the driver hired on 19 October has a plan and a prorated October slip.
{
  const c49 = direct(() => B.ctx.readAll_('compensation')).filter(c => c.empId === ids['1049'] && c.status === 'approved').sort((a, b) => a.effectiveFrom < b.effectiveFrom ? 1 : -1)[0];
  const b49 = line('1049', 'basic');
  ok(c49 && near2(b49, r2(Number(c49.basic) / 30 * 13), 0.02), 'link 1: the new hire\'s first payroll pays 13 days of October (hired 19 October)', { b49, basic: c49 && c49.basic });
  ok(call('1049', 'onboardList').plans[0].tasks.some(t => t.key === 'probation'), 'link 1: and the onboarding plan carries the probation review');
}
// 5. Iqama expiry to the calendar, the bell, the renewal and the fee ledger (1007, Egyptian, iqama ends 10 December).
at('2026-11-12', '09:00');
r = call('1011', 'complianceCalendar');
ok(r.ok && r.items.some(x => (x.kind === 'iqama' || x.kind === 'iqama_renewal') && x.emp && x.emp.empNo === '1007'), 'link 5: the iqama ending 10 December is in the compliance calendar');
ok(taskCount('1011', 'iqama_renewal') >= 1, 'link 5: and HR is asked in the bell (28 days left)');
r = call('1011', 'iqamaRenew', { renewal: { empId: ids['1007'], newExpiry: '2027-12-10', muqeemRef: 'MQ-77881', years: 1, fees: { iqama: 650, work_permit: 9600 } } });
ok(r.ok, 'link 5: HR records the renewal done in Muqeem with its fees', r);
const fees07 = call('1012', 'govOverview').fees.filter(x => x.emp && x.emp.empNo === '1007');
ok(fees07.length === 2 && fees07.every(x => x.status === 'recorded' && x.canVerify), 'link 5: two fees in the ledger, waiting for a second person', fees07);
ok(taskCount('1012', 'iqama_renewal') === 0 && !call('1011', 'complianceCalendar').items.some(x => x.kind === 'iqama_renewal' && x.emp && x.emp.empNo === '1007'), 'link 5: the renewal clears the bell and the calendar');
r = call('1012', 'approvalsAct', { items: fees07.map(x => ({ type: 'gov_fee', id: x.id })), decision: 'approve', confirm: true });
ok(r.ok && r.done === 2, 'link 5: the other HR person verifies both from the approvals centre', r);

// 4. Expense claim to approval, payroll reimbursement and the journal (1021, driver, manager 1016).
r = call('1021', 'expenseCreate', { claim: { title: 'وقود رحلة جدة', lines: [{ category: 'fuel', date: '2026-11-10', amount: 230, vat: 30, description: 'تعبئة الشاحنة', receiptRef: 'R-5521', merchant: 'محطة' }] } });
const EX = r.claim;
ok(r.ok && EX.step === 'manager', 'link 4: the driver claims 230 for fuel', r);
ok(taskCount('1016', 'expense_approve') === 1 && call('1016', 'approvalsInbox').items.some(i => i.type === 'expense' && i.id === EX.id && i.canAct), 'link 4: his supervisor sees it in the bell and the approvals centre');
ok(call('1016', 'approvalsAct', { items: [{ type: 'expense', id: EX.id }], decision: 'approve' }).results[0].ok, 'link 4: the supervisor approves it');
ok(call('1009', 'approvalsAct', { items: [{ type: 'expense', id: EX.id }], decision: 'approve' }).results[0].ok, 'link 4: payroll approves it for the next payroll');
const exAdj = direct(() => B.ctx.readAll_('adjustments')).find(a => a.empId === ids['1021'] && a.code === 'reimbursement');
ok(exAdj && exAdj.month === '2026-11' && Number(exAdj.amount) === 230, 'link 4: a reimbursement line of 230 waits in November', exAdj);

// 2. Leave request to approvals, pre-leave clearance, departure, return and the payroll effect (1021, Pakistani).
r = call('1021', 'requestCreate', { request: { type: 'leave', subtype: 'annual', fromDate: '2026-12-06', toDate: '2026-12-17', reason: 'إجازة سنوية' } });
const LV = r.request;
ok(r.ok && LV.days === 10, 'link 2: the driver asks for 10 working days of leave in December', r);
ok(call('1016', 'approvalsAct', { items: [{ type: 'request', id: LV.id }], decision: 'approve' }).results[0].ok && call('1011', 'approvalsAct', { items: [{ type: 'request', id: LV.id }], decision: 'approve' }).results[0].ok, 'link 2: approved through the centre (manager, then HR)');
let LC = (call('1011', 'leaveCycleList', { status: 'all' }).rows || []).find(c => c.requestRef === LV.ref);
ok(LC && LC.status === 'approved' && LC.tasks.find(t => t.key === 'exit_reentry').required, 'link 2: the approval opens the leave cycle; the exit/re-entry visa is required', LC);
ok(call('1021', 'leaveCycleTask', { id: LC.id, key: 'handover', data: { substituteId: ids['1023'], notes: 'خط جدة وعملاء الجملة' } }).ok && call('1023', 'leaveCycleTask', { id: LC.id, key: 'handover_accept', op: 'accept' }).ok, 'link 2: hand-over to a colleague, who accepts');
LC = call('1016', 'leaveCycleList', { status: 'all' }).rows.find(c => c.id === LC.id);
if (LC.tasks.find(t => t.key === 'custody').status === 'open') ok(call('1016', 'leaveCycleTask', { id: LC.id, key: 'custody', note: 'العهدة مع البديل' }).ok, 'link 2: the supervisor checks the assets held');
ok(call('1011', 'leaveCycleTask', { id: LC.id, key: 'exit_reentry', data: { visaNo: '7788990011', validUntil: '2027-02-01', kind: 'single' } }).ok, 'link 2: HR records the exit/re-entry visa');
const tkTask = call('1011', 'leaveCycleList', { status: 'all' }).rows.find(c => c.id === LC.id).tasks.find(t => t.key === 'ticket');
if (tkTask.status === 'open' && tkTask.required) ok(call('1011', 'leaveCycleTask', { id: LC.id, key: 'ticket', data: { bookingRef: 'PNR-JD77' } }).ok, 'link 2: HR records the ticket');
const sug = call('1009', 'leaveCycleList', { status: 'all' }).rows.find(c => c.id === LC.id).tasks.find(t => t.key === 'leave_salary').data.suggested;
r = call('1009', 'leaveCycleTask', { id: LC.id, key: 'leave_salary', data: { amount: sug } });
ok(r.ok && r.cycle.cleared && r.cycle.status === 'cleared', 'link 2: payroll pays the leave salary in advance; the clearance is complete', r.cycle || r);
const lsAdj = direct(() => B.ctx.readAll_('adjustments')).find(a => a.empId === ids['1021'] && a.code === 'other_earning' && String(a.reason).indexOf(LC.ref) >= 0);
ok(lsAdj && lsAdj.month === '2026-11' && near2(lsAdj.amount, sug), 'link 2: as an earning in November\'s payroll', lsAdj);

// 6. Disciplinary case to its decision, the objection window (30 days from notice, Art. 72) and the payroll fine.
const dcs = call('1018', 'discList').rows.find(x => x.mine && x.ref === DC.ref);
ok(dcs && dcs.notifiedOn === '2026-11-05' && dcs.objectionDue >= addDays('2026-11-05', 30), 'link 6: the grievance window runs 30 days from notice, holidays not counted', dcs && { n: dcs.notifiedOn, due: dcs.objectionDue });

// November payroll: the fine, the reimbursement and the leave salary all land on the payslips.
r = call('1011', 'payrollCreate', { month: '2026-11' });
const RUN11 = r.run;
ok(r.ok, 'HR prepares November\'s payroll', r);
r = call('1009', 'payrollApprove', { id: RUN11.id });
ok(r.ok && r.run.status === 'locked', 'payroll approves and locks it', r);
const slips11 = call('1009', 'payrollGet', { id: RUN11.id }).slips || [];
const sl = no => slips11.find(x => x.empId === ids[no]) || { lines: [] };
ok(sl('1021').lines.some(l => l.code === 'reimbursement' && near2(l.amount, 230)), 'link 4: the reimbursement is on the driver\'s November payslip', sl('1021').lines);
ok(sl('1021').lines.some(l => l.code === 'other_earning' && near2(l.amount, sug)), 'link 2: so is the leave salary paid in advance');
ok(sl('1018').lines.some(l => l.code === 'fine' && near2(l.amount, r2(daily('1018') * 0.25))), 'link 6: the upheld fine is deducted in November', sl('1018').lines);

// 3 and 4. The payroll journal for Odoo: mapped, generated, imported and confirmed by a second person.
const ACC = { basic: '510101', housing: '510102', transport: '510103', allowance: '510104', overtime: '510105', bonus: '510106', commission: '510107', other_earning: '510108', reimbursement: '510109',
  gosi_expense: '510110', pay_reduction: '510101', gosi_payable: '220201', net_payable: '220101', advances: '130501', fines: '410901', other_deductions: '220301', eos_expense: '510120', eos_provision: '230101' };
ok(call('1009', 'journalMapSave', { map: { journal: 'SAL', accounts: ACC, analytic: {}, netByEmployee: false, includeEos: true } }).ok, 'links 3-4: payroll maps the accounts');
r = call('1009', 'journalBuild', { id: RUN11.id });
const JE = r.entry;
ok(r.ok && JE.balanced && !JE.problems.length, 'the November entry is balanced with nothing unmapped', JE && JE.problems);
ok(JE.lines.some(l => l.key === 'reimbursement' && l.debit >= 230) && JE.lines.some(l => l.key === 'fines' && l.credit > 0), 'link 4 and 6: the entry carries the reimbursement (debit) and the fine (credit)');
ok(JE.lines.some(l => l.key === 'eos_provision' && l.credit > 0), 'link 3: and the end-of-service provision for the month');
ok(call('1009', 'journalStep', { id: RUN11.id, step: 'generated' }).ok && call('1009', 'journalStep', { id: RUN11.id, step: 'imported', odooRef: 'MISC/2026/11/0001' }).ok, 'the payroll holder generates and imports it in Odoo');
ok(taskCount('1011', 'journal_confirm') === 1 && call('1009', 'approvalsInbox').items.every(i => i.type !== 'journal' || !i.canAct), 'the confirmation goes to someone else (HR holds pay), never the importer');
ok(call('1011', 'approvalsAct', { items: [{ type: 'journal', id: RUN11.id }], decision: 'approve' }).results[0].ok, 'HR confirms it from the approvals centre');
// 3. The resignation's clearance closed with the service certificate (Art. 64) and the settlement paid (cycle above).
const cl33 = call('1011', 'clearanceList').rows.find(x => x.emp.empNo === '1033');
ok(cl33 && cl33.status === 'cleared' && cl33.tasks.find(t => t.key === 'certificate').status === 'done', 'link 3: the leaver\'s clearance is closed with the service certificate issued');

// 2 (continued). Departure, an early return and the balance.
const bal21 = call('1021', 'myRequests').leave.annual;
at('2026-12-06', '08:00');
ok(call('1021', 'leaveCycleDepart', { id: LC.id }).ok, 'link 2: the driver confirms the departure');
at('2026-12-14', '08:00');
ok(call('1021', 'leaveCycleReturn', { id: LC.id, date: '2026-12-14' }).ok, 'link 2: he is back early, on 14 December');
r = call('1016', 'approvalsAct', { items: [{ type: 'leavecycle', id: LC.id, task: 'confirm' }], decision: 'done' });
ok(r.ok && r.results[0].error === 'deep_link_only', 'link 2: the return is confirmed on the leave-cycle screen (it needs the date)');
r = call('1016', 'leaveCycleConfirm', { id: LC.id, date: '2026-12-14' });
ok(r.ok && r.cycle.outcome === 'early' && r.cycle.earlyDays === 4 && r.cycle.status === 'closed', 'link 2: the supervisor confirms: 4 working days back, cycle closed', r.cycle || r);
const bal21b = call('1021', 'myRequests').leave.annual;
ok(bal21.used - bal21b.used === 4, 'link 2: the 4 unused days are back in his balance', { before: bal21.used, after: bal21b.used });
at('2026-11-12', '09:00');

// =====================================================================================================
cycle('Flow links: every task opens a page its owner may open');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const SEC_DEST = {};
(html.match(/var SEC_DEST = \{([\s\S]*?)\};/) || ['', ''])[1].replace(/(\w+):\s*'([\w:]+)'/g, (m, k, v) => { SEC_DEST[k] = v; return m; });
// Mirror the client's gating exactly: each AREAS sub-page with a `sec` has an ok() that is one of the forms below.
// R() = the roles in myFile (hr is true for hr and admin), isHr/isAdmin = the sign-in role, salaryOk = payroll || (hr && !admin).
const SEC_OK = {}, unknownOk = [];
html.replace(/ok: (any\([^)]*\)|\w+), (?:[^{}]*?)sec: '(\w+)'/g, (m, okExpr, sec) => { SEC_OK[sec] = okExpr; if (!/^(any\(|ALL$|isHr$|isAdmin$|salaryOk$)/.test(okExpr)) unknownOk.push(sec + ':' + okExpr); return m; });
const AREA_SRC = (html.match(/var AREAS = \[([\s\S]*?)\n\];/) || ['', ''])[1];
Object.keys(SEC_DEST).forEach(k => { if (SEC_OK[k]) return; const sub = SEC_DEST[k].split(':')[1];
  const m = AREA_SRC.match(new RegExp("\\{ id: '" + sub + "', n: '\\w+', ok: (approverOk|ALL|isHr|isAdmin|salaryOk|any\\([^)]*\\)|function\\(\\)\\{ return isHr\\(\\) \\|\\| any\\([^)]*\\)\\(\\); \\})"));
  if (m) SEC_OK[k] = m[1]; else unknownOk.push(k + ':no rule'); });
ok(Object.keys(SEC_DEST).length >= 15 && Object.keys(SEC_OK).length >= 15 && unknownOk.length === 0, 'read the page map from index.html (SEC_DEST and each section\'s ok rule)', { dest: Object.keys(SEC_DEST).length, ok: SEC_OK, unknownOk });
// what each section loads when it opens (from the js modules)
const SEC_LOAD = { inbox: ['reqInbox'], leave: ['leaveTeam'], approvals: ['hrCompList'], payroll: ['payrollList'], compliance: ['complianceCalendar'], reports: ['reportCatalog'],
  dashboard: ['dashboard'], onboarding: ['onboardList'], offboarding: ['clearanceList'], custody: ['assetList'], relations: ['discList', 'injuryList', 'discCodes'], team: ['hrTeam'],
  people: ['hrBootstrap'], shifts: ['shiftList', 'rosterList'], performance: ['perfTeam'], plans: ['planList'], engagement: ['surveyResults'],
  leavecycle: ['leaveCycleList'], approvalcentre: ['approvalsInbox'], flows: ['flowList'], gov: ['govOverview'], expenses: ['myExpenses'], journal: ['journalList'] };
// The js/flows.js pages (leave cycle, approvals centre, approval flows) until index.html wires them (AREAS + SEC_DEST): the intended rule stands in.
const PENDING_SEC = { leavecycle: ['requests:cycle', "any('hr', 'payroll', 'manager')"], approvalcentre: ['requests:centre', 'ALL'], flows: ['settings:flows', 'isHr'] }, pendingSec = [];
Object.keys(PENDING_SEC).forEach(k => { if (!SEC_DEST[k]) { SEC_DEST[k] = PENDING_SEC[k][0]; pendingSec.push(k); } if (!SEC_OK[k]) SEC_OK[k] = PENDING_SEC[k][1]; });
if (pendingSec.length) NOTES.push('CLIENT: index.html does not route these sections yet (checked with the intended rules): ' + pendingSec.join(', '));
const rolesOf = n => { const f = call(n, 'myFile').file; return { hr: f.roles.hr, payroll: f.roles.payroll, executive: f.roles.executive, admin: f.roles.admin, manager: f.isManager }; };
const ROLES = {}; NOS.forEach(n => { ROLES[n] = rolesOf(n); });
function visible(n, sec) {
  let x = SEC_OK[sec]; const R = ROLES[n], role = EMP[n].role;
  if (!x) return false;
  if (x === 'approverOk') x = "isHr|any('hr', 'payroll', 'manager', 'executive')";
  const fm = /^function\(\)\{ return isHr\(\) \|\| (any\([^)]*\))\(\); \}$/.exec(x); if (fm) x = 'isHr|' + fm[1];
  if (x.indexOf('isHr|') === 0) { if (role === 'hr' || role === 'admin') return true; x = x.slice(5); }
  if (x === 'ALL') return true;
  if (x === 'isHr') return role === 'hr' || role === 'admin';
  if (x === 'isAdmin') return role === 'admin';
  if (x === 'salaryOk') return !!(R.payroll || (R.hr && role !== 'admin'));
  return x.slice(4, -1).replace(/'/g, '').split(/\s*,\s*/).some(k => R[k]);
}
let linkBad = [], linkCount = 0, reqMismatch = [];
NOS.forEach(n => {
  const list = tasks(n) || [];
  list.forEach(t => {
    linkCount++;
    const g = t.target || {};
    if (g.tab === 'file') return; // the person's own pages (MINE_DEST, else the profile): always open to them
    if (g.tab !== 'hr') { linkBad.push(n + ' ' + t.kind + ' tab ' + g.tab); return; }
    if (!SEC_DEST[g.sec]) { linkBad.push(n + ' ' + t.kind + ' unknown section ' + g.sec); return; }
    if (!visible(n, g.sec)) { linkBad.push(n + ' ' + t.kind + ' -> ' + g.sec + ' is not shown to this person'); return; }
    (SEC_LOAD[g.sec] || []).forEach(a => { const x = call(n, a, a === 'dashboard' ? { from: '2026-10-01', to: '2026-10-31' } : {}); if (!x.ok && x.error === 'forbidden') linkBad.push(n + ' ' + t.kind + ' -> ' + g.sec + ': ' + a + ' forbidden'); });
  });
  const inbox = (call(n, 'reqInbox').rows || []).length, rt = (list.find(x => x.kind === 'requests') || {}).count || 0;
  if (inbox !== rt) reqMismatch.push(n + ' inbox ' + inbox + ' bell ' + rt);
});
ok(linkBad.length === 0, 'all ' + linkCount + ' open tasks of the 50 people point to a page they are shown and may open', linkBad.slice(0, 8));
ok(reqMismatch.length === 0, 'for everyone, the bell\'s request count equals what their inbox lets them decide', reqMismatch);
// every section a person is shown must open without "forbidden" (client visibility vs server rules)
const visBad = [];
Object.keys(ROLE).forEach(role => {
  const n = ROLE[role];
  Object.keys(SEC_LOAD).forEach(sec => { if (!visible(n, sec)) return; SEC_LOAD[sec].forEach(a => { const x = call(n, a, a === 'dashboard' ? { from: '2026-10-01', to: '2026-10-31' } : {}); if (!x.ok && x.error === 'forbidden') visBad.push(role + ': ' + sec + ' (' + a + ')'); }); });
});
if (visBad.length) NOTES.push('CLIENT: sections shown in the menu but refused by the server: ' + visBad.join(', '));
ok(true, 'visible sections checked for the six roles (' + visBad.length + ' client notes)');

// =====================================================================================================
cycle('Workforce plan (2026-10-19)');
{
  let w = call(1011, 'workforcePlan', { year: 2026 });
  ok(w.ok && w.rows.length >= 10 && w.cost && w.totals.staff >= 40, 'HR sees every department with staff counts and cost', w.error || w.totals);
  const big = w.rows.filter(x => x.staff >= 3), small = w.rows.filter(x => x.staff > 0 && x.staff < 3);
  ok(big.length && big.every(x => x.avgMonthly > 0) && small.every(x => !('avgMonthly' in x)), 'average pay only for departments of 3 or more (an average of one or two people is their salary)', [big.length, small.length]);
  const d = big[0];
  r = call(1011, 'workforcePlanSave', { year: 2026, deptId: d.deptId, planned: d.staff + d.open + 2, note: 'توسع' });
  ok(r.ok, 'HR sets the planned headcount for a department', r);
  w = call(1011, 'workforcePlan', { year: 2026 });
  const d2 = w.rows.find(x => x.deptId === d.deptId);
  ok(d2.gap === 2 && d2.gapCostYear === 2 * d2.avgMonthly * 12 && d2.note === 'توسع', 'gap = planned - staff - open, costed for a year', d2);
  ok(call(1011, 'workforcePlanSave', { year: 2026, deptId: d.deptId, planned: -1 }).error === 'bad_value', 'a negative plan is refused');
  w = call(1015, 'workforcePlan', { year: 2026 });
  ok(w.ok && w.rows.length >= 1 && w.rows.length < 5 && !w.cost && w.rows.every(x => !('avgMonthly' in x) && !('gapCostYear' in x)) && !('gapCostYear' in w.totals), 'a manager sees their own departments, without any pay', w.rows && w.rows.map(x => x.nameAr));
  ok(call(1015, 'workforcePlanSave', { year: 2026, deptId: d.deptId, planned: 5 }).error === 'forbidden', 'only HR changes the plan');
  ok(call(1003, 'workforcePlan', {}).error === 'forbidden', 'an employee who manages nobody has no plan view');
  w = call(1002, 'workforcePlan', { year: 2026 });
  ok(w.ok && w.cost && w.rows.length >= 10, 'the executive sees the whole plan with cost');
}
cycle('1:1 meetings and goals (2026-10-19)');
{
  const emp1016 = call(1015, 'oneOnOneList', {}).team.find(e => e.empNo === '1016');
  ok(!!emp1016, 'the manager sees their report in the 1:1 picker');
  ok(call(1016, 'oneOnOneSave', { empId: call(1015, 'oneOnOneList', {}).team[0].id, date: '2026-11-10' }).error === 'forbidden', 'an employee cannot book a 1:1 on someone else');
  r = call(1015, 'oneOnOneSave', { empId: emp1016.id, date: '2026-11-10' });
  ok(r.ok, 'the manager books a 1:1', r);
  const mid = r.id;
  ok(call(1016, 'oneOnOneUpdate', { id: mid, agendaItem: 'طلب تدريب على القيادة' }).ok, 'the employee adds an agenda item');
  ok(call(1016, 'oneOnOneUpdate', { id: mid, notes: 'x' }).error === 'forbidden', 'the employee cannot write the meeting notes');
  r = call(1015, 'oneOnOneUpdate', { id: mid, notes: 'اتفقنا على دورة', privateNote: 'يحتاج متابعة في الانضباط', actionItem: 'التسجيل في الدورة', actionOwner: 'emp' });
  ok(r.ok && r.row.privateNote === 'يحتاج متابعة في الانضباط', 'the manager writes shared notes, a private note and an action item');
  let v = call(1016, 'oneOnOneList', {}).rows.find(x => x.id === mid);
  ok(v.notes === 'اتفقنا على دورة' && v.privateNote === undefined && v.actions.length === 1 && v.agenda.length === 1, 'the employee sees the shared notes and actions, never the private note', v);
  v = call(1011, 'oneOnOneList', { empId: emp1016.id }).rows.find(x => x.id === mid);
  ok(v && v.privateNote === undefined, 'HR does not see the manager\'s private note either');
  ok(call(1016, 'oneOnOneUpdate', { id: mid, actionDone: 0 }).row.actions[0].done === true, 'the employee ticks their action item');
  ok(call(1003, 'oneOnOneList', { empId: emp1016.id }).error === 'forbidden', 'a colleague cannot read someone else\'s 1:1s');
  r = call(1016, 'goalSave', { goal: { title: 'خفض زمن التوزيع 10%', measure: 'متوسط زمن الرحلة', dueDate: '2026-12-31' } });
  ok(r.ok && r.goal.setBy === 'self', 'the employee sets their own goal', r);
  const gid = r.goal.id;
  r = call(1015, 'goalCheckIn', { id: gid, progress: 50, note: 'منتصف الطريق' });
  ok(r.ok && r.goal.progress === 50, 'the manager checks in progress');
  ok(call(1016, 'goalList', {}).rows.find(x => x.id === gid).checkins.length === 1, 'the employee sees the check-in history');
  ok(call(1003, 'goalCheckIn', { id: gid, progress: 90 }).error === 'forbidden', 'a colleague cannot change it');
  ok(call(1016, 'goalCheckIn', { id: gid, progress: 120 }).error === 'bad_value', 'progress is 0-100');
  ok(call(1016, 'goalCheckIn', { id: gid, progress: 100 }).goal.status === 'done', 'at 100% the goal is done');
}
cycle('Talent: 9-box and succession (2026-10-19)');
{
  const id = no => call(1011, 'nineBox', {}).rows.find(x => x.emp.empNo === String(no)).emp.id;
  let g = call(1016, 'nineBox', {});
  const r19 = g.rows.find(x => x.emp.empNo === '1019'), r18 = g.rows.find(x => x.emp.empNo === '1018');
  ok(g.ok && r19 && r19.performance === 'high' && r19.rating === 5 && r18.performance === 'medium', 'the supervisor sees their drivers with performance from the closed review (5 high, 3 medium)', [r19, r18]);
  ok(!g.rows.some(x => x.emp.empNo === '1006'), 'and nobody outside their team');
  ok(call(1016, 'potentialSave', { empId: r19.emp.id, potential: 'high' }).error === 'note_required', 'a potential rating needs a reason');
  ok(call(1016, 'potentialSave', { empId: r19.emp.id, potential: 'high', note: 'يقود الفريق في غياب المشرف' }).ok, 'the supervisor rates 1019 high potential');
  ok(call(1019, 'nineBox', {}).error === 'forbidden', 'the driver cannot see the grid');
  ok(call(1019, 'potentialSave', { empId: r19.emp.id, potential: 'high', note: 'x' }).error === 'cannot_edit_own', 'nobody rates their own potential');
  ok(!JSON.stringify(call(1019, 'myFile', {})).includes('potential'), 'the potential rating is not in the person\'s own file');
  g = call(1011, 'nineBox', {});
  ok(g.grid['high|high'] === 1 && g.rows.length > 40, 'HR sees the whole company; 1019 is a star (high/high)', g.grid);
  ok(call(1016, 'successionList', {}).error === 'forbidden', 'managers do not see succession plans');
  r = call(1011, 'successionSave', { plan: { positionId: PID.sup, incumbentEmpId: id(1016), flightRisk: 'high', successors: [{ empId: id(1019), readiness: '1-2y' }, { empId: id(1016), readiness: 'now' }] } });
  ok(!r.ok && r.error === 'bad_value', 'the incumbent cannot be their own successor');
  r = call(1011, 'successionSave', { plan: { positionId: PID.sup, incumbentEmpId: id(1016), flightRisk: 'high', successors: [{ empId: id(1019), readiness: '1-2y' }] } });
  ok(r.ok, 'HR records the supervisor role as key, high flight risk, one successor in 1-2 years', r);
  let s = call(1002, 'successionList', {});
  ok(s.ok && s.rows.length === 1 && s.gaps === 1 && s.highRisk === 1 && s.rows[0].successors[0].rating === 5 && !s.canEdit, 'the executive sees it: a gap (nobody ready now) and a high risk', s.rows);
  ok(call(1002, 'successionSave', { plan: { positionId: PID.sup } }).error === 'forbidden', 'only HR edits succession');
  call(1011, 'successionSave', { plan: { id: s.rows[0].id, positionId: PID.sup, incumbentEmpId: id(1016), flightRisk: 'high', successors: [{ empId: id(1019), readiness: 'now' }] } });
  ok(call(1011, 'successionList', {}).gaps === 0, 'once a successor is ready now, the gap closes');
}
cycle('Roles and permissions overview (2026-10-19)');
{
  const o = call(1011, 'rolesOverview', {});
  ok(o.ok && o.holders.payroll.some(e => e.empNo === '1009') && o.holders.executive.some(e => e.empNo === '1002') && o.holders.hr.some(e => e.empNo === '1011'), 'HR sees who holds payroll, executive and HR', o.holders);
  ok(o.managers >= 5 && o.active >= 40, 'and how many people manage a team', [o.managers, o.active]);
  ok(o.changes.some(c => c.action === 'roles_update' && c.extraRoles === 'payroll'), 'the latest role changes come from the audit trail', o.changes.slice(0, 3));
  ok(!JSON.stringify(o).match(/basic|iban|nationalId|phone/i), 'no salary, ID or contact data');
  ok(call(1009, 'rolesOverview', {}).error === 'forbidden' && call(1016, 'rolesOverview', {}).error === 'forbidden', 'payroll and managers cannot open it');
}
cycle('Internal mobility and career paths (2026-10-20)');
{
  let q = call(1015, 'recruitReqSave', { requisition: { titleAr: 'مشرف توزيع', titleEn: 'Distribution supervisor', headcount: 1, contractType: 'indefinite', budgetMin: 8000, budgetMax: 11000, reason: 'growth', justification: 'فرع جديد', positionId: PID.sup } });
  ok(q.ok, 'a manager asks for a supervisor', q.error);
  ok(call(1011, 'recruitReqDecide', { id: q.requisition.id, decision: 'approve' }).ok, 'HR approves it');
  r = call(1011, 'careerPostSave', { post: { reqId: q.requisition.id, summaryAr: 'قيادة فريق توزيع', audience: 'internal' } });
  ok(r.ok, 'HR posts it to employees only', r);
  ok(!B.call({ action: 'careersList' }).rows.some(x => x.titleAr === 'مشرف توزيع'), 'an internal-only job is not on the public careers page');
  let j = call(1018, 'internalJobs', {});
  const job = j.rows.find(x => x.titleAr === 'مشرف توزيع');
  ok(j.ok && j.eligible && job && job.internalOnly, 'a driver with 6 years of service sees it as internal', j.rows.map(x => x.titleAr));
  ok(!call(1015, 'internalJobs', {}).rows.some(x => x.titleAr === 'مشرف توزيع'), 'the hiring manager does not see their own requisition as a job');
  ok(B.call({ action: 'careersApply', application: { postId: job.id, name: 'x', phone: '0551234567', consent: true } }).error === 'not_found', 'nobody outside can apply to it');
  r = call(1018, 'internalApply', { postId: job.id, note: 'أعرف المسارات والفريق' });
  ok(r.ok, 'the driver applies with one tap', r);
  ok(call(1018, 'internalApply', { postId: job.id }).error === 'already_exists', 'once');
  ok(call(1018, 'internalJobs', {}).rows.find(x => x.id === job.id).applied === 'applied', 'and sees that they applied');
  const c = call(1011, 'recruitCandList', { reqId: q.requisition.id }).rows.find(x => x.source === 'internal');
  ok(c && c.name && c.stage === 'applied', 'HR sees an internal candidate with the driver\'s name', c);
  j = call(1049, 'internalJobs', {});
  ok(!j.eligible && call(1049, 'internalApply', { postId: job.id }).error === 'too_early', 'someone hired last week must wait the minimum service');
  ok(call(1018, 'careerPathSave', { path: { fromPositionId: PID.drv, toPositionId: PID.sup, years: 3 } }).error === 'forbidden', 'only HR defines career paths');
  ok(call(1011, 'careerPathSave', { path: { fromPositionId: PID.drv, toPositionId: PID.sup, years: 3, requirementsAr: 'سجل سلامة نظيف ودورة قيادة' } }).ok, 'HR maps driver -> supervisor');
  const pl = call(1018, 'careerPathList', {});
  ok(pl.ok && pl.myPositionId === PID.drv && pl.rows.some(x => x.from.id === PID.drv && x.to.id === PID.sup && x.years === 3), 'the driver sees the path from their own position', pl.rows);
}
cycle('Talent reports (2026-10-20)');
{
  const run = (no, id, params) => call(no, 'reportRun', { reportId: id, params: params || {} });
  let r = run(1011, 'rec_pipeline');
  const sup = r.ok && r.rows.find(x => x.title === 'مشرف توزيع');
  ok(r.ok && sup && sup.candidates === 1 && sup.internal === 1 && sup.status === 'approved' && sup.daysOpen >= 0, 'hiring funnel: the supervisor requisition with one internal candidate', sup || r.error);
  ok(run(1009, 'rec_pipeline').error === 'forbidden' && run(1016, 'rec_pipeline').error === 'forbidden', 'candidate reports are HR only (not payroll, not managers)');
  r = run(1011, 'rec_sources', { from: '2026-01-01', to: '2026-12-31' });
  ok(r.ok && r.rows.some(x => x.source === 'internal' && x.candidates === 1 && x.hireRate === 0), 'sources: the internal channel counted', r.rows || r.error);
  r = run(1011, 'ins_coverage');
  ok(r.ok && r.rows.length > 40 && r.rows.every(x => x.covered === 'yes' || x.covered === 'no'), 'insurance coverage: one row per person', r.error);
  const nsu = r.rows.filter(x => x.saudi === 'non_saudi' && x.covered === 'no').length;
  ok(nsu === 0 ? !r.checks.length : r.checks.some(c => c.code === 'non_saudi_uncovered' && c.count === nsu), 'non-Saudis without cover are flagged as an error', r.checks);
  r = run(1016, 'trn_hours', { from: '2026-01-01', to: '2026-12-31' });
  ok(r.ok && r.rows.length >= 2 && r.rows.length < 10, 'training hours: a manager sees only their team', r.rows && r.rows.length);
  r = run(1011, 'trn_hours', { from: '2026-01-01', to: '2026-12-31' });
  ok(r.ok && r.rows.length > 40 && r.columns.some(c => c.key === 'cost' && c.type === 'money'), 'HR sees the whole company with cost', r.error);
}
cycle('Company data export (2026-10-20)');
{
  ok(call(1011, 'dataExport', {}).error === 'forbidden' && call(1009, 'dataExport', {}).error === 'forbidden', 'only the administrator exports (not HR, not payroll)');
  const x = call(1045, 'dataExport', {});
  const emp = x.ok && x.tabs.employees;
  ok(x.ok && emp && emp.rows.length >= 50 && Object.keys(x.tabs).length > 50, 'the administrator gets every table', x.ok ? Object.keys(x.tabs).length : x.error);
  ok(!x.tabs.credentials && ['pwHash', 'pwSalt', 'actHash', 'tokenVer'].every(h => emp.headers.indexOf(h) < 0), 'never sign-in secrets: no credentials tab, no password hash, activation code or session version', emp.headers.filter(h => /pw|act|token/i.test(h)));
  ok(!x.tabs.compensation && !x.tabs.payslips && !x.tabs.empPrivate && !x.withPay && x.skipped.indexOf('compensation') >= 0, 'an administrator alone gets no salaries, payslips or private data');
  ok(!JSON.stringify(x.tabs.surveyAnswers || {}).match(/votersJson/) && (!x.tabs.surveys || x.tabs.surveys.headers.indexOf('votersJson') < 0), 'the survey voter hashes stay out');
  const a = direct(() => B.ctx.readAll_('audit')).filter(r => r.action === 'data_export');
  ok(a.length === 1 && /withPay/.test(a[0].detail), 'the export is written to the audit trail');
  call(1045, 'dataExport', {}); call(1045, 'dataExport', {});
  ok(call(1045, 'dataExport', {}).error === 'too_many_attempts', 'at most three exports a day');
}
cycle('Access matrix');
const code = fs.readFileSync(path.join(__dirname, '..', 'backend', 'Code.gs'), 'utf8');
const mapOf = n => (code.match(new RegExp('var ' + n + ' = \\{([^}]*)\\}'))[1].match(/[a-zA-Z]+(?=:)/g));
const MAPS = { EMP: mapOf('EMP_ACTIONS'), HR: mapOf('HR_ACTIONS'), ADMIN: mapOf('ADMIN_ACTIONS') };
const COLS = ['employee', 'manager', 'hr', 'payroll', 'executive', 'admin'];
// Expected with an empty request. Actions that pick their target first are probed with a real target (PROBE).
const ALLW = { all: COLS, hrOnly: ['hr'], hrA: ['hr', 'admin'], adm: ['admin'], pay: ['hr', 'payroll'], payOnly: ['payroll'], dash: ['hr', 'payroll', 'executive', 'admin'], hrPay: ['hr', 'payroll', 'admin'],
  mgr: ['manager', 'hr', 'admin'], none: [], fileView: ['manager', 'hr', 'payroll', 'admin'],
  mgrX: ['manager', 'hr', 'executive', 'admin'], money: ['hr', 'payroll', 'executive'], hrExec: ['hr', 'executive'], hrExecA: ['hr', 'executive', 'admin'], mgrPay: ['manager', 'hr', 'payroll', 'admin'], mgrAll: ['manager', 'hr', 'payroll', 'executive', 'admin'] };
const EXPECT = {
  hrCompList: 'pay', hrCompPropose: 'pay', hrCompDecide: 'pay', leaveTeam: 'mgr', payrollList: 'pay', payrollGet: 'pay', payrollCreate: 'pay', payrollRecalc: 'pay', payrollApprove: 'payOnly',
  payrollDelete: 'pay', payrollAdjSave: 'pay', payrollAdjDelete: 'pay', payrollExport: 'pay', payrollEmail: 'pay', eosQuote: 'pay', dashboard: 'dash', reportLog: 'hrPay', reportReview: 'hrPay',
  reportVerify: 'dash', surveyResults: 'dash', wpsFile: 'pay', wpsStep: 'pay', reconUpload: 'pay', reconList: 'pay', reconResolve: 'pay', complianceCalendar: 'hrPay', shiftList: 'mgr',
  rosterList: 'mgr', discCodes: 'mgr', assetCharge: 'payOnly', punchPw: 'none', hrEmpFile: 'fileView', perfEmp: 'mgr', planSave: 'mgr', delegationSave: 'mgr', discOpen: 'mgr', injuryReport: 'mgr',
  // government services, expenses, journal (GovServices.gs, Expenses.gs, Journal.gs)
  govOverview: 'hrPay', iqamaRenew: 'hrPay', govFeeSave: 'pay', govFeeVerify: 'pay', govFeeVoid: 'pay', ticketUseApprove: 'pay',
  expensePaid: 'pay', expenseReport: 'pay', expenseLimitsSave: 'hrPay',
  journalList: 'pay', journalBuild: 'pay', journalStep: 'pay', journalMapGet: 'hrPay', journalMapSave: 'hrPay', bankSetupSave: 'pay',
  // Wave 2 (Recruitment.gs, Loans.gs, Training.gs, Insurance.gs, HelpDesk.gs): role checks inside EMP actions
  recruitReqSave: 'mgr', recruitBoard: 'mgrX', trainMatrix: 'mgrX', loanDisburse: 'payOnly', loanSettle: 'payOnly', loanSettleVerify: 'payOnly',
  loanPolicySave: 'hrPay', insList: 'hrPay', insCost: 'money', hdList: 'hrPay',
  // Wave 3 (Engage.gs): exit results for the hr role and executives (never an admin alone), recognition stats for HR, executives, admins
  exitSurveyResults: 'hrExec', kudosStats: 'hrExecA',
  // final settlement (Payroll.gs): prepare and list by hr role or payroll, decide and pay by payroll only
  finalSettlementCreate: 'pay', finalSettlementList: 'pay', finalSettlementDecide: 'payOnly', finalSettlementPaid: 'payOnly',
  // annual pay review (Payroll.gs): cycles by hr role / payroll; managers list and propose for their people
  compCycleSave: 'pay', compCycleClose: 'pay', compCycleList: 'mgrPay', compPropose: 'mgrPay',
  // timesheets (Attendance.gs): HR (incl. admin) and managers
  timesheetList: 'mgr', timesheetApprove: 'mgr', openShiftPost: 'mgr', shiftOfferDecide: 'mgr', workforcePlan: 'mgrAll', workforcePlanSave: 'hrA', oneOnOneSave: 'none', nineBox: 'mgrX', successionList: 'hrExecA', successionSave: 'hrA', dataExport: 'adm', notifyStatus: 'adm', notifyTest: 'adm', docUpload: 'hrA', kioskSave: 'adm', kioskList: 'hrA', logoSave: 'adm', brandSave: 'adm', apiKeyList: 'adm', apiKeySave: 'adm', webhookSave: 'adm', webhookDeliveries: 'adm', payGroupList: 'pay', payGroupSave: 'pay', payGroupAssign: 'pay', snapshotList: 'dash', snapshotView: 'dash', snapshotPeople: 'hrOnly', snapshotTake: 'hrA',
  // custom fields (Hr.gs): definitions and values written by HR (incl. admin); everyone may list and read what they may see
  customFieldSave: 'hrA', customValuesSave: 'hrA', customValuesAll: 'hrA',
  // Wave 5 (Wave5.gs): HSE run by HR (incl. admin) or the safety officer role; safety figures also for executives
  hseUpdate: 'hrA', hseActionSave: 'hrA', ppeIssue: 'hrA', hseStats: 'hrExecA',
  gradeList: 'money', gradeSave: 'pay', gradeDelete: 'pay', bandReport: 'pay', retroScan: 'pay', retroApply: 'pay', retroCancel: 'pay', retroLog: 'pay',
  cwSave: 'hrA', cwEnd: 'hrA', cwAgencySave: 'hrA', cwHoursDecide: 'hrPay', cwInvoiceSave: 'hrPay', cwInvoiceDecide: 'hrPay', cwInvoices: 'hrPay'
};
const T16 = ids['1018'];
const PROBE = { hrEmpFile: { id: T16 }, perfEmp: { empId: T16, cycleId: CYC.id }, planSave: { plan: { empId: T16, type: 'idp' } }, delegationSave: { delegation: { toEmpId: ids['1003'] } },
  discOpen: { case: { empId: T16, code: 'ZZZ' } }, injuryReport: { injury: { empId: T16 } }, dashboard: { from: '2026-10-01', to: '2026-10-31' } };
const RN = { employee: '1007', manager: '1016', hr: '1012', payroll: '1009', executive: '1002', admin: '1045' };
const matrix = {}, matBad = [];
COLS.forEach(role => {
  const F = B.fork(); // each role works on its own copy, so probes that write change nothing else
  const fcall = (n, action, extra) => F.call(Object.assign({ action, token: tok(n) }, extra || {}));
  ['EMP', 'HR', 'ADMIN'].forEach(m => MAPS[m].forEach(a => {
    const res = fcall(RN[role], a, PROBE[a] || {});
    const allowed = res.ok || res.error !== 'forbidden';
    const exp = (ALLW[EXPECT[a] || (m === 'EMP' ? 'all' : m === 'HR' ? 'hrA' : 'adm')]).includes(role);
    (matrix[a] = matrix[a] || { map: m })[role] = allowed;
    if (allowed !== exp) matBad.push(a + ' as ' + role + ': ' + (allowed ? 'allowed' : 'forbidden') + ', expected ' + (exp ? 'allowed' : 'forbidden') + (res.ok ? '' : ' (' + res.error + ')'));
  }));
});
const nAct = MAPS.EMP.length + MAPS.HR.length + MAPS.ADMIN.length;
ok(matBad.length === 0, 'all ' + nAct + ' actions x 6 roles behave as the access model says', matBad);

// =====================================================================================================
// SIM_EXPORT=file writes every tab of the finished company (tools/demo-load.js loads it on the live Sheet)
if (process.env.SIM_EXPORT) {
  B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {};
  const dump = {}; Object.keys(B.ctx.SHEETS).forEach(k => { const n = B.ctx.SHEETS[k]; dump[n] = B.ctx.readAll_(n); });
  fs.writeFileSync(process.env.SIM_EXPORT, JSON.stringify({ end: B.ctx.today_(), tabs: dump }));
}

// summary: the readable report first, the counter line last (tools/deploy.sh reads the last line)
let P_OK = 0, P_FAIL = 0;
console.log('\nAccess matrix (y = allowed, - = forbidden; E employee, M manager, H hr, P payroll, X executive, A admin)');
console.log('  ' + 'action'.padEnd(22) + 'map    E M H P X A');
Object.keys(matrix).forEach(a => { const m = matrix[a]; console.log('  ' + a.padEnd(22) + m.map.padEnd(7) + COLS.map(c => (m[c] ? 'y' : '-')).join(' ')); });
console.log('\nSummary by cycle');
ORDER.forEach(n => { const c = CY[n]; P_OK += c.ok; P_FAIL += c.fail; console.log('  ' + (c.fail ? 'FAIL ' : 'ok   ') + n.padEnd(70) + String(c.ok).padStart(4) + ' ok' + (c.fail ? ', ' + c.fail + ' failed: ' + c.fails.join(' | ') : '')); });
if (NOTES.length) { console.log('\nNotes (not counted as failures)'); NOTES.forEach(x => console.log('  ' + x)); }
console.log('\nCompany: 50 people, 13 departments, ' + POSITIONS.length + ' positions (G1-G10); ' + results.ok + ' punches; run time ' + ((Date.now() - T_START) / 1000).toFixed(1) + ' s');
console.log('\n' + P_OK + ' passed, ' + P_FAIL + ' failed');
process.exit(P_FAIL ? 1 : 0);
