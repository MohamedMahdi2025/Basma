/**
 * Demo company on the live Sheet: the 50-person simulation (tests/sim50.js), loaded by tools/demo-load.js and removed
 * again with one purge. Owner only (setup key), like diag. Every imported row is recorded in demoLedger, so the purge
 * deletes exactly those rows and nothing a real user wrote.
 *
 *   status  row counts per tab, demo rows per tab, payroll months already used
 *   import  { tab, rows, batch }: appends rows (only the tab's own columns), skips keys already on the Sheet
 *   purge   deletes every ledgered row from every tab, then empties the ledger
 *   payroll { month }: a locked payroll run (scope 'demo') over the ledgered people only, computed with calcSlip_,
 *           prepared by a demo HR person and approved by a different demo payroll holder; skipped when one exists
 *
 * Payroll scope: a run with scope 'demo' covers demo people only and the company's own runs (scope '') never include
 * them (payrollEmps_). Obligations (run_exists, month locks, recon block, WPS / journal calendar) look at the run of the
 * same scope only; views that pick one run per month take the real run when one exists (runsRealFirst_).
 *
 * Never imported: credentials and settings (sign-in secrets and live configuration). The loader also blanks every
 * password, PIN and activation hash, so no demo person can sign in.
 */
var DEMO_SKIP_TABS_ = { credentials: 1, settings: 1, demoLedger: 1 };

function demoKey_(req) {
  var expected = (typeof SETUP_KEY_HASH === 'string') ? SETUP_KEY_HASH : '';
  if (!expected || !safeEqual_(sha256Hex_(String(req.setupKey || '').trim()), expected)) {
    if (!rateLimit_('diagFail', 10, 3600)) fail_('too_many_attempts');
    fail_('bad_setup_key');
  }
}

/** The ledger key of a row: its id, the employee for the one-row-per-person private tab, else the audit line itself. */
function demoRowKey_(tab, o) {
  var h = HEADERS[tab];
  if (h.indexOf('id') >= 0) return 'id:' + String(o.id);
  if (tab === SHEETS.PRIV) return 'emp:' + String(o.empId);
  return 'line:' + h.map(function (k) { var v = o[k]; return v instanceof Date ? v.toISOString() : String(v == null ? '' : v); }).join('|');
}

function demoTabs_() {
  return Object.keys(SHEETS).map(function (k) { return SHEETS[k]; }).filter(function (n) { return HEADERS[n] && !DEMO_SKIP_TABS_[n]; });
}

/** A demo run: marked scope 'demo', or loaded by the demo import before the scope column existed (in the ledger). */
function isDemoRun_(r) { return !!r && (String(r.scope || '') === 'demo' || !!demoRunIds_()[String(r.id)]); }
var DEMO_RUNS_MEMO_ = { src: null, out: null };
function demoRunIds_() {
  var led = readAll_(SHEETS.DEMO);
  if (DEMO_RUNS_MEMO_.src === led) return DEMO_RUNS_MEMO_.out;
  var out = {};
  led.forEach(function (x) { if (x.tab === SHEETS.RUN && String(x.key).indexOf('id:') === 0) out[String(x.key).slice(3)] = 1; });
  DEMO_RUNS_MEMO_ = { src: led, out: out };
  return out;
}
function runScope_(r) { return isDemoRun_(r) ? 'demo' : ''; }
/** Runs for one-run-per-month views: a demo run only for a month with no real (non-cancelled) run. */
function runsRealFirst_(runs) {
  var real = {};
  runs.forEach(function (r) { if (!isDemoRun_(r) && r.status !== 'cancelled') real[r.month] = 1; });
  return runs.filter(function (r) { return !isDemoRun_(r) || !real[r.month]; });
}
/** Ledger keys of one tab, { key: 1 }. One read of the ledger; empty when nothing was loaded. */
function demoKeySet_(tab) {
  var out = {};
  readAll_(SHEETS.DEMO).forEach(function (x) { if (x.tab === tab) out[x.key] = 1; });
  return out;
}
/** The demo people, { empId: 1 }. Kept while the request's ledger read is the same (monthLocked_ runs in loops). */
var DEMO_EMPS_MEMO_ = { src: null, out: null };
function demoEmpIds_() {
  var led = readAll_(SHEETS.DEMO);
  if (DEMO_EMPS_MEMO_.src === led) return DEMO_EMPS_MEMO_.out;
  var out = {};
  led.forEach(function (x) { if (x.tab === SHEETS.EMP && String(x.key).indexOf('id:') === 0) out[String(x.key).slice(3)] = 1; });
  DEMO_EMPS_MEMO_ = { src: led, out: out };
  return out;
}

function api_demoData(req) {
  demoKey_(req);
  var mode = String(req.mode || 'status');
  if (mode === 'status') return demoStatus_();
  if (mode === 'import') return withLock_(function () { return demoImport_(req); });
  if (mode === 'purge') return withLock_(function () { return demoPurge_(); });
  if (mode === 'payroll') return withLock_(function () { return demoPayroll_(req); });
  if (mode === 'people') return resetPeople_();
  if (mode === 'reset') return withLock_(function () { return resetKeepOne_(req); });
  if (mode === 'sheetImport') return withLock_(function () { return sheetImport_(req); });
  if (mode === 'packageSet') return withLock_(function () { return packageSet_(req); });
  if (mode === 'sheetYear') return withLock_(function () { return sheetYear_(req); });
  fail_('bad_request');
}

/**
 * The company's approved payroll sheets, loaded once into a clean organisation (owner only, home organisation; 2026-11-17).
 * tools/salary-sheets.py parses and reconciles the workbooks; tools/sheet-import.js sends:
 *   { people: [...], months: { 'YYYY-MM': [lines] }, depts: { en: ar }, ownerNo, dryRun }
 * - Refuses unless the organisation holds only the owner and no payroll run (rollback = demoData reset <ownerNo>).
 * - People match on national ID; the owner's row (ownerNo) is updated in place (never role, status, devices or tokens).
 * - Departments by name, one pay group per sponsor (its WPS establishment), positions are the title text.
 * - empPrivate: a 1/2-prefixed ID is the national ID, anything else the border number. IBAN and bank only when the IBAN
 *   is valid and the pay method is not "Transfer to ..." (that IBAN belongs to someone else).
 * - Packages: approved, effective-dated: a new row from the first month a person's basic/housing/transport/other changes.
 * - Each month and pay group: one locked run, scope 'import', payslips line for line as the sheet (no recalculation, no
 *   employer GOSI), plus a confirmed WPS line ("handled outside BASMA") so past months raise no WPS duty.
 * - People not on the latest sheet, or Exit with a last day, are disabled with that last working day.
 * dryRun: everything is computed and checked, nothing is written; the answer carries the same counts and month totals.
 */
var IMPORT_LINES_ = [
  ['earning', 'basic', 'basic'], ['earning', 'housing', 'housing'], ['earning', 'transport', 'transport'],
  ['earning', 'allowance', 'otherAllow', 'بدلات أخرى'], ['earning', 'bonus', 'bonus'],
  ['deduction', 'gosi', 'gosi'], ['deduction', 'fine', 'penalties'], ['deduction', 'advance', 'loan', 'قسط سلفة / قرض'],
  ['deduction', 'unpaid_leave', 'leave', 'إجازة'], ['deduction', 'other_deduction', 'newJoiner', 'انضمام جديد'],
  ['deduction', 'other_deduction', 'otherDed']
];
function sheetImport_(req) {
  resetHomeOnly_();
  var people = Array.isArray(req.people) ? req.people : [], months = req.months || {}, depAr = req.depts || {}, dry = req.dryRun !== false;
  var ownerNo = String(req.ownerNo || '').trim(), keys = Object.keys(months).sort();
  if (!people.length || people.length > 2000 || !keys.length || keys.some(function (m) { return !/^\d{4}-(0[1-9]|1[0-2])$/.test(m); })) fail_('bad_request');
  [SHEETS.EMP, SHEETS.PRIV, SHEETS.DEPT, SHEETS.PGRP, SHEETS.RUN, SHEETS.SLIP, SHEETS.COMP].forEach(forget_);
  var emps = readAll_(SHEETS.EMP), owner = emps.filter(function (e) { return String(e.empNo) === ownerNo; })[0];
  if (!owner) fail_('not_found');
  if (emps.length !== 1 || readAll_(SHEETS.RUN).some(function (r) { return r.status !== 'cancelled'; })) fail_('not_empty');
  var now = new Date().toISOString(), num = function (v) { var x = Number(v); return isFinite(x) ? Math.round(x * 100) / 100 : 0; };
  var seenNo = {}, seenId = {};
  people.forEach(function (p) {
    var no = String(p.empNo || '').trim(), nid = String(p.nid || '').trim();
    if (!/^[A-Z0-9-]{1,12}$/.test(no) || !/^\d{10}$/.test(nid) || !str_(p.name, 120)) fail_('missing_fields');
    if (seenNo[no] || seenId[nid]) fail_('duplicate_emp_no'); seenNo[no] = 1; seenId[nid] = p;
  });
  if (!people.some(function (p) { return String(p.empNo) === ownerNo; })) fail_('not_found');
  // departments and pay groups, by name
  var depts = readAll_(SHEETS.DEPT), dByName = {}, newDepts = [];
  depts.forEach(function (d) { dByName[normName_(d.nameEn || '')] = d; dByName[normName_(d.nameAr || '')] = d; });
  var dCodes = codesOf_(depts), dNames = [];
  people.forEach(function (p) { var n = str_(p.department, 80); if (n && !dByName[normName_(n)] && dNames.indexOf(n) < 0) dNames.push(n); });
  dNames.forEach(function (n) {
    var d = { id: newId_('D'), code: '', nameAr: str_(depAr[n], 80) || n, nameEn: n, parentId: '', headEmpId: '', costCenter: '', status: 'active', createdAt: now, updatedAt: now };
    dByName[normName_(n)] = d; newDepts.push(d);
  });
  var groups = readAll_(SHEETS.PGRP), gByName = {}, newGroups = [];
  groups.forEach(function (g) { if (g.status !== 'deleted') gByName[normName_(g.nameAr || '')] = g; });
  people.forEach(function (p) {
    var n = str_(p.sponsor, 120); if (!n || gByName[normName_(n)]) return;
    var g = { id: newId_('G'), code: '', nameAr: n, nameEn: '', payDay: 0, cutoffDay: 0,
      costCenter: '', wpsEstablishment: n, managersJson: '[]', status: 'active', createdBy: 'import', createdAt: now, updatedAt: now };
    gByName[normName_(n)] = g; newGroups.push(g);
  });
  // people
  var last = keys[keys.length - 1], newEmps = [], privs = [], privUpd = [], byNid = {}, ownerPriv = null;
  readAll_(SHEETS.PRIV).forEach(function (x) { if (x.empId === owner.id) ownerPriv = x; });
  people.forEach(function (p) {
    var isOwner = String(p.empNo) === ownerNo, d = dByName[normName_(str_(p.department, 80))], g = gByName[normName_(str_(p.sponsor, 120))];
    var left = (p.months || []).indexOf(last) < 0, exit = String(p.status) === 'Exit' && isoDate_(p.lastDay);
    var lwd = exit ? isoDate_(p.lastDay) : left ? monthLast_(String((p.months || []).slice(-1)[0] || last)) : '';
    var e = isOwner ? owner : { id: newId_('E'), empNo: String(p.empNo), email: '', phone: '', role: 'employee', zoneIds: '', shiftStart: '', shiftEnd: '', workdays: '',
      tokenVer: 0, actHash: '', actExp: '', actTries: 0, createdAt: now };
    e.name = str_(p.name, 120); if (!isOwner) e.nameEn = /[A-Za-z]/.test(e.name) && !/[؀-ۿ]/.test(e.name) ? e.name : '';
    e.department = d ? d.nameAr : ''; e.departmentId = d ? d.id : ''; e.title = str_(p.position, 80);
    e.hireDate = isoDate_(p.joined) || ''; e.nationality = str_(p.nationality, 40); e.isSaudi = !!p.isSaudi;
    e.workLocation = str_(p.costCenter, 80); e.employmentType = String(p.sponsor) === 'Outsource' ? 'outsourced' : str_(p.reliability, 40);
    e.payGroupId = g ? g.id : ''; e.updatedAt = now;
    if (!isOwner) { e.status = lwd && lwd <= today_() ? 'disabled' : 'active'; e.lastWorkingDay = lwd; newEmps.push(e); }
    p.emp = e;
    var nid = String(p.nid), pv = isOwner && ownerPriv ? ownerPriv : { empId: e.id };
    if (/^[12]\d{9}$/.test(nid)) pv.nationalId = nid; else pv.borderNo = nid;
    if (p.ibanOk && !p.payToOther) { pv.iban = String(p.iban); pv.bankName = str_(p.bank, 60); }
    pv.updatedAt = now;
    if (isOwner && ownerPriv) privUpd.push(pv); else privs.push(pv);
    byNid[nid] = p;
  });
  // packages, effective-dated from the sheets
  var comps = [];
  people.forEach(function (p) {
    var prev = '';
    keys.forEach(function (m) {
      var x = (months[m] || []).filter(function (l) { return String(l.nid) === String(p.nid); })[0];
      if (!x || !(num(x.basic) > 0)) return;
      var sig = [num(x.basic), num(x.housing), num(x.transport), num(x.otherAllow)].join('|'); if (sig === prev) return; prev = sig;
      var c = compRowFrom_({ empId: p.emp.id, effectiveFrom: m + '-01', basic: num(x.basic), housing: num(x.housing), transport: num(x.transport),
        other: num(x.otherAllow) ? { other: num(x.otherAllow) } : {}, reason: 'كشف الرواتب المعتمد ' + m }, 'import');
      c.status = 'approved'; c.approvedBy = 'import'; c.approvedAt = now; comps.push(c);
    });
  });
  // runs: one per month and pay group, payslips exactly as the sheet
  var runs = [], slips = [], wps = [], totals = {}, mismatch = [];
  keys.forEach(function (m) {
    var byGroup = {};
    (months[m] || []).forEach(function (x) {
      var p = byNid[String(x.nid)]; if (!p) fail_('missing_fields');
      if (!num(x.gross) && !num(x.totalDed) && !num(x.net)) return; // on the sheet with nothing paid: no payslip
      (byGroup[p.emp.payGroupId] = byGroup[p.emp.payGroupId] || []).push({ x: x, p: p });
    });
    var mt = { people: 0, gross: 0, deductions: 0, net: 0 };
    Object.keys(byGroup).forEach(function (gid) {
      var run = { id: newId_('P'), ref: '', month: m, status: 'locked', preparedBy: 'import', preparedAt: now, approvedBy: 'import', approvedAt: now, totalsJson: '',
        note: 'مستورد من كشف الرواتب المعتمد كما هو، بلا حصة صاحب العمل في التأمينات / imported from the approved payroll sheet as is', emailedAt: '',
        createdAt: now, updatedAt: now, scope: 'import', payGroupId: gid };
      var rs = [];
      byGroup[gid].forEach(function (it) {
        var x = it.x, lines = [];
        IMPORT_LINES_.forEach(function (d) { var a = num(x[d[2]]); if (a) { var l = { kind: d[0], code: d[1], amount: a }; if (d[3]) l.label = d[3]; lines.push(l); } });
        var calc = finish_({ lines: lines, warnings: [], info: { imported: true, payMethod: str_(x.payMethod, 80), sheetRow: x.row || '' } });
        if (Math.abs(calc.net - num(x.net)) > 0.01) mismatch.push({ month: m, empNo: it.p.empNo, sheet: num(x.net), net: calc.net });
        rs.push(slipRow_(it.p.emp, run, calc, null));
      });
      run.totalsJson = JSON.stringify(totals_(rs));
      wps.push({ id: newId_('W'), ref: '', runId: run.id, month: m, status: 'confirmed', rows: rs.length, total: totals_(rs).net, generatedBy: 'import', generatedAt: now,
        uploadedBy: 'import', uploadedAt: now, bankRef: '', confirmedBy: 'import', confirmedAt: now, note: 'دفع خارج بصمة قبل الاستيراد / paid outside BASMA before the import' });
      runs.push(run); slips = slips.concat(rs);
      rs.forEach(function (s) { mt.people++; mt.gross += s.gross; mt.deductions += s.deductions; mt.net += s.net; });
    });
    ['gross', 'deductions', 'net'].forEach(function (k) { mt[k] = r2_(mt[k]); }); totals[m] = mt;
  });
  if (mismatch.length) return { ok: false, error: 'net_mismatch', mismatch: mismatch.slice(0, 50) };
  var out = { ok: true, dryRun: dry, departments: newDepts.length, payGroups: newGroups.map(function (g) { return g.nameAr; }), employees: newEmps.length,
    disabled: newEmps.filter(function (e) { return e.status === 'disabled'; }).length, ownerUpdated: true, privateRows: privs.length + privUpd.length,
    ibans: privs.concat(privUpd).filter(function (x) { return x.iban; }).length, packages: comps.length, runs: runs.length, payslips: slips.length, months: totals };
  if (dry) return out;
  // document numbers only for a real import (each call moves the organisation's counters), one call per kind
  [['department', newDepts, SHEETS.DEPT, 'code'], ['payGroup', newGroups, SHEETS.PGRP, 'code'], ['salary', comps, SHEETS.COMP, 'ref'], ['payroll', runs, SHEETS.RUN, 'ref'],
   ['payslip', slips, SHEETS.SLIP, 'ref'], ['wps', wps, SHEETS.WPS, 'ref']].forEach(function (k) {
    var refs = nextRefs_(k[0], k[1].length, codesOf_(readAll_(k[2]), k[3])); k[1].forEach(function (row, i) { row[k[3]] = refs[i]; });
  });
  appendMany_(SHEETS.DEPT, newDepts); appendMany_(SHEETS.PGRP, newGroups);
  update_(SHEETS.EMP, owner); appendMany_(SHEETS.EMP, newEmps);
  privUpd.forEach(function (x) { update_(SHEETS.PRIV, x); }); appendMany_(SHEETS.PRIV, privs);
  appendMany_(SHEETS.COMP, comps); appendMany_(SHEETS.RUN, runs); appendMany_(SHEETS.SLIP, slips); appendMany_(SHEETS.WPS, wps);
  audit_('import', 'sheet_import', '', { employees: newEmps.length, packages: comps.length, runs: runs.length, payslips: slips.length, months: keys });
  return out;
}

/**
 * The approved payroll sheets for a whole period, loaded again over an earlier import (owner only, home organisation;
 * 2026-11-18). Unlike sheetImport_ it runs on an organisation that already has people:
 * - every run with scope 'import' (and its payslips and WPS lines) and every package entered by 'import' is removed first;
 *   runs made in BASMA itself and packages approved by the owner (packageSet) are never touched;
 * - people are matched by national ID / border number (empPrivate); a match keeps its employee number, role, devices and
 *   sign-in; its job fields follow the latest full month it appears in. Unknown IDs become new employees with the number
 *   the caller sends (refused if that number is taken); one not paid in the latest full month is disabled with the last
 *   day of the last month they were paid;
 * - packages are rebuilt from the full months (basic, housing, transport, other allowances), a new approved row from each
 *   month the amounts change, none dated at or after the first month of an owner package for that person;
 * - each month and pay group becomes one locked run (scope 'import'), payslips line for line as the sheet, with a confirmed
 *   WPS line. A net-only month (netOnly: true) gets one line, "approved net" (label), and the transfer details in the
 *   payslip info. A line matched by name instead of ID carries matchedByName in its info.
 *   { people, months: { 'YYYY-MM': [lines] }, netOnly: ['YYYY-MM'], depts, ownerNo, dryRun }
 */
function sheetYear_(req) {
  resetHomeOnly_();
  var people = Array.isArray(req.people) ? req.people : [], months = req.months || {}, depAr = req.depts || {}, dry = req.dryRun !== false;
  var netOnly = {}; (Array.isArray(req.netOnly) ? req.netOnly : []).forEach(function (m) { netOnly[String(m)] = 1; });
  var keys = Object.keys(months).sort(), fullKeys = keys.filter(function (m) { return !netOnly[m]; });
  if (!people.length || people.length > 3000 || !keys.length || keys.some(function (m) { return !/^\d{4}-(0[1-9]|1[0-2])$/.test(m); })) fail_('bad_request');
  [SHEETS.EMP, SHEETS.PRIV, SHEETS.DEPT, SHEETS.PGRP, SHEETS.RUN, SHEETS.SLIP, SHEETS.COMP, SHEETS.WPS].forEach(forget_);
  var now = new Date().toISOString(), num = function (v) { var x = Number(v); return isFinite(x) ? Math.round(x * 100) / 100 : 0; };
  var emps = readAll_(SHEETS.EMP), empById = {}, byNo = {}, privOf = {}, byNid = {};
  emps.forEach(function (e) { empById[e.id] = e; byNo[String(e.empNo)] = e; });
  readAll_(SHEETS.PRIV).forEach(function (p) { privOf[p.empId] = p; var n = String(p.nationalId || p.borderNo || ''); if (n && empById[p.empId]) byNid[n] = empById[p.empId]; });
  // departments and pay groups by name (new ones added)
  var depts = readAll_(SHEETS.DEPT), dByName = {}, newDepts = [];
  depts.forEach(function (d) { dByName[normName_(d.nameEn || '')] = d; dByName[normName_(d.nameAr || '')] = d; });
  var groups = readAll_(SHEETS.PGRP), gByName = {}, newGroups = [];
  groups.forEach(function (g) { if (g.status !== 'deleted') gByName[normName_(g.nameAr || '')] = g; });
  var dOf = function (n) { n = str_(n, 80); if (!n) return null; var d = dByName[normName_(n)]; if (d) return d;
    d = { id: newId_('D'), code: '', nameAr: str_(depAr[n], 80) || n, nameEn: n, parentId: '', headEmpId: '', costCenter: '', status: 'active', createdAt: now, updatedAt: now };
    dByName[normName_(n)] = d; newDepts.push(d); return d; };
  var gOf = function (n) { n = str_(n, 120); if (!n) return null; var g = gByName[normName_(n)]; if (g) return g;
    g = { id: newId_('G'), code: '', nameAr: n, nameEn: '', payDay: 0, cutoffDay: 0, costCenter: '', wpsEstablishment: n, managersJson: '[]', status: 'active', createdBy: 'import', createdAt: now, updatedAt: now };
    gByName[normName_(n)] = g; newGroups.push(g); return g; };
  // people
  var lastFull = fullKeys[fullKeys.length - 1], newEmps = [], updEmps = [], newPrivs = [], updPrivs = [], seenNo = {}, P = {};
  people.forEach(function (p) {
    var nid = String(p.nid || '').trim(); if (!/^\d{10}$/.test(nid) || !str_(p.name, 120)) fail_('missing_fields');
    if (P[nid]) fail_('duplicate_emp_no'); P[nid] = p;
    var e = byNid[nid], isNew = !e;
    if (isNew) {
      var no = String(p.empNo || '').trim(); if (!/^[A-Z0-9-]{1,12}$/.test(no) || byNo[no] || seenNo[no]) fail_('duplicate_emp_no'); seenNo[no] = 1;
      e = { id: newId_('E'), empNo: no, email: '', phone: '', role: 'employee', zoneIds: '', shiftStart: '', shiftEnd: '', workdays: '', tokenVer: 0, actHash: '', actExp: '', actTries: 0, createdAt: now };
    }
    var d = dOf(p.department), g = gOf(p.sponsor), inLast = (p.months || []).indexOf(lastFull) >= 0 || (p.months || []).some(function (m) { return m > lastFull; });
    if (p.name) e.name = str_(p.name, 120);
    if (isNew) e.nameEn = str_(p.nameEn, 120) || (/[A-Za-z]/.test(e.name) && !/[؀-ۿ]/.test(e.name) ? e.name : '');
    if (d) { e.department = d.nameAr; e.departmentId = d.id; }
    if (p.position) e.title = str_(p.position, 80);
    if (isoDate_(p.joined)) e.hireDate = isoDate_(p.joined);
    if (p.nationality) { e.nationality = str_(p.nationality, 40); e.isSaudi = !!p.isSaudi; }
    if (p.costCenter) e.workLocation = str_(p.costCenter, 80);
    if (p.sponsor) e.employmentType = String(p.sponsor) === 'Outsource' ? 'outsourced' : (str_(p.reliability, 40) || e.employmentType || '');
    if (g) e.payGroupId = g.id;
    if (isNew) { var lastM = (p.months || []).slice().sort().pop() || lastFull, lwd = inLast ? '' : monthLast_(lastM); e.lastWorkingDay = lwd; e.status = lwd && lwd <= today_() ? 'disabled' : 'active'; }
    e.updatedAt = now;
    (isNew ? newEmps : updEmps).push(e); p.emp = e;
    var pv = privOf[e.id], fresh = !pv; if (fresh) pv = { empId: e.id };
    if (/^[12]\d{9}$/.test(nid)) pv.nationalId = nid; else pv.borderNo = nid;
    if (p.ibanOk && !p.payToOther) { pv.iban = String(p.iban); pv.bankName = str_(p.bank, 60); }
    pv.updatedAt = now; (fresh ? newPrivs : updPrivs).push(pv);
  });
  // what goes: earlier imported runs, their payslips and WPS lines, imported packages
  var oldRuns = {}; readAll_(SHEETS.RUN).forEach(function (r) { if (String(r.scope) === 'import') oldRuns[r.id] = 1; });
  var ownerFrom = {}; readAll_(SHEETS.COMP).forEach(function (c) { if (c.enteredBy === 'owner' && c.status === 'approved') { var f = String(c.effectiveFrom).slice(0, 7); if (!ownerFrom[c.empId] || f < ownerFrom[c.empId]) ownerFrom[c.empId] = f; } });
  var removed = { runs: Object.keys(oldRuns).length, payslips: readAll_(SHEETS.SLIP).filter(function (s) { return oldRuns[s.runId]; }).length,
    packages: readAll_(SHEETS.COMP).filter(function (c) { return c.enteredBy === 'import'; }).length };
  // packages from the full months
  var comps = [];
  people.forEach(function (p) {
    var prev = '';
    fullKeys.forEach(function (m) {
      var x = (months[m] || []).filter(function (l) { return String(l.nid) === String(p.nid); })[0];
      if (!x || !(num(x.basic) > 0) || (ownerFrom[p.emp.id] && m >= ownerFrom[p.emp.id])) return;
      var sig = [num(x.basic), num(x.housing), num(x.transport), num(x.otherAllow)].join('|'); if (sig === prev) return; prev = sig;
      var c = compRowFrom_({ empId: p.emp.id, effectiveFrom: m + '-01', basic: num(x.basic), housing: num(x.housing), transport: num(x.transport),
        other: num(x.otherAllow) ? { other: num(x.otherAllow) } : {}, reason: 'كشف الرواتب المعتمد ' + m }, 'import');
      c.status = 'approved'; c.approvedBy = 'import'; c.approvedAt = now; comps.push(c);
    });
  });
  // runs
  var LINES = IMPORT_LINES_.concat([['deduction', 'fine', 'traffic', 'مخالفات مرورية']]);
  var runs = [], slips = [], wps = [], totals = {}, mismatch = [];
  keys.forEach(function (m) {
    var byGroup = {};
    (months[m] || []).forEach(function (x) {
      var p = P[String(x.nid)]; if (!p) fail_('missing_fields');
      if (!num(x.gross) && !num(x.totalDed) && !num(x.net)) return;
      var gid = p.emp.payGroupId || ''; (byGroup[gid] = byGroup[gid] || []).push({ x: x, p: p });
    });
    var mt = { people: 0, gross: 0, deductions: 0, net: 0 };
    Object.keys(byGroup).forEach(function (gid) {
      var run = { id: newId_('P'), ref: '', month: m, status: 'locked', preparedBy: 'import', preparedAt: now, approvedBy: 'import', approvedAt: now, totalsJson: '',
        note: (netOnly[m] ? 'صافي معتمد من تقرير الصرف والتسوية بلا تفصيل البنود / approved net from the disbursement report, no breakdown' :
          'مستورد من كشف الرواتب المعتمد كما هو، بلا حصة صاحب العمل في التأمينات / imported from the approved payroll sheet as is'),
        emailedAt: '', createdAt: now, updatedAt: now, scope: 'import', payGroupId: gid };
      var rs = [];
      byGroup[gid].forEach(function (it) {
        var x = it.x, lines = [], info = { imported: true, payMethod: str_(x.payMethod, 80), sheetRow: x.row || '' };
        if (x.matchedByName) info.matchedByName = true;
        if (netOnly[m]) {
          if (num(x.net)) lines.push({ kind: 'earning', code: 'other_earning', label: 'صافي الراتب المعتمد', amount: num(x.net) });
          info.transferred = num(x.transferred); info.advanceSelf = num(x.advanceSelf); info.advanceOther = num(x.advanceOther); info.action = str_(x.action, 300); info.route = str_(x.route, 40);
        } else LINES.forEach(function (d) { var a = num(x[d[2]]); if (a) { var l = { kind: d[0], code: d[1], amount: a }; if (d[3]) l.label = d[3]; lines.push(l); } });
        var calc = finish_({ lines: lines, warnings: [], info: info });
        if (Math.abs(calc.net - num(x.net)) > 0.01) mismatch.push({ month: m, nid: String(x.nid), sheet: num(x.net), net: calc.net });
        rs.push(slipRow_(it.p.emp, run, calc, null));
      });
      run.totalsJson = JSON.stringify(totals_(rs));
      wps.push({ id: newId_('W'), ref: '', runId: run.id, month: m, status: 'confirmed', rows: rs.length, total: totals_(rs).net, generatedBy: 'import', generatedAt: now,
        uploadedBy: 'import', uploadedAt: now, bankRef: '', confirmedBy: 'import', confirmedAt: now, note: 'دفع خارج بصمة قبل الاستيراد / paid outside BASMA before the import' });
      runs.push(run); slips = slips.concat(rs);
      rs.forEach(function (s) { mt.people++; mt.gross += s.gross; mt.deductions += s.deductions; mt.net += s.net; });
    });
    ['gross', 'deductions', 'net'].forEach(function (k) { mt[k] = r2_(mt[k]); }); totals[m] = mt;
  });
  if (mismatch.length) return { ok: false, error: 'net_mismatch', mismatch: mismatch.slice(0, 50) };
  var out = { ok: true, dryRun: dry, removed: removed, newDepartments: newDepts.length, newPayGroups: newGroups.map(function (g) { return g.nameAr; }),
    newEmployees: newEmps.length, newDisabled: newEmps.filter(function (e) { return e.status === 'disabled'; }).length, updatedEmployees: updEmps.length,
    packages: comps.length, runs: runs.length, payslips: slips.length, months: totals };
  if (dry) return out;
  var dropRun = function (o) { return !!oldRuns[o.runId]; };
  resetRewrite_(SHEETS.SLIP, dropRun, {}); resetRewrite_(SHEETS.WPS, dropRun, {});
  resetRewrite_(SHEETS.RUN, function (o) { return String(o.scope) === 'import'; }, {});
  resetRewrite_(SHEETS.COMP, function (o) { return o.enteredBy === 'import'; }, {});
  [SHEETS.SLIP, SHEETS.WPS, SHEETS.RUN, SHEETS.COMP].forEach(forget_);
  [['department', newDepts, SHEETS.DEPT, 'code'], ['payGroup', newGroups, SHEETS.PGRP, 'code'], ['salary', comps, SHEETS.COMP, 'ref'], ['payroll', runs, SHEETS.RUN, 'ref'],
   ['payslip', slips, SHEETS.SLIP, 'ref'], ['wps', wps, SHEETS.WPS, 'ref']].forEach(function (k) {
    var refs = nextRefs_(k[0], k[1].length, codesOf_(readAll_(k[2]), k[3])); k[1].forEach(function (row, i) { row[k[3]] = refs[i]; });
  });
  appendMany_(SHEETS.DEPT, newDepts); appendMany_(SHEETS.PGRP, newGroups);
  if (updEmps.length) updateMany_(SHEETS.EMP, updEmps); appendMany_(SHEETS.EMP, newEmps);
  updPrivs.forEach(function (x) { update_(SHEETS.PRIV, x); }); appendMany_(SHEETS.PRIV, newPrivs);
  appendMany_(SHEETS.COMP, comps); appendMany_(SHEETS.RUN, runs); appendMany_(SHEETS.SLIP, slips); appendMany_(SHEETS.WPS, wps);
  audit_('import', 'sheet_year', '', { months: keys, removed: removed, newEmployees: newEmps.length, packages: comps.length, runs: runs.length, payslips: slips.length });
  return out;
}

/**
 * Owner-approved package changes in one batch (owner only, home organisation; 2026-11-17): the owner's decision that a
 * person's package is what they are actually paid, while GOSI keeps the wage registered there (empPrivate.gosiWage, so
 * every payslip carries the visible 'gosi_wage_differs' warning instead of hiding the gap).
 *   { rows: [{ empNo, effectiveFrom, basic, housing, transport, gosiWage, reason }], dryRun }
 * Each row adds an approved package (approvedBy 'owner') from effectiveFrom; nothing is overwritten (packages are
 * effective-dated and append-only). gosiWage 0 leaves the registered wage as it is. One audit line for the batch.
 */
function packageSet_(req) {
  resetHomeOnly_();
  var rows = Array.isArray(req.rows) ? req.rows : [], dry = req.dryRun !== false;
  if (!rows.length || rows.length > 500) fail_('bad_request');
  [SHEETS.EMP, SHEETS.PRIV, SHEETS.COMP].forEach(forget_);
  var byNo = {}, privOf = {}, now = new Date().toISOString(), comps = [], privUpd = [], plan = [];
  readAll_(SHEETS.EMP).forEach(function (e) { byNo[String(e.empNo)] = e; });
  readAll_(SHEETS.PRIV).forEach(function (p) { privOf[p.empId] = p; });
  rows.forEach(function (r) {
    var e = byNo[String(r.empNo || '').trim()]; if (!e) fail_('not_found');
    var c = compRowFrom_({ empId: e.id, effectiveFrom: r.effectiveFrom, basic: r.basic, housing: r.housing || 0, transport: r.transport || 0,
      reason: str_(r.reason, 200) || 'قرار المالك: الراتب كما يصرف فعلا' }, 'owner');
    c.status = 'approved'; c.approvedBy = 'owner'; c.approvedAt = now; comps.push(c);
    var gw = Number(r.gosiWage) || 0, p = privOf[e.id];
    if (gw > 0) { if (!p) fail_('not_found'); p.gosiWage = gw; p.updatedAt = now; privUpd.push(p); }
    plan.push({ empNo: e.empNo, from: c.effectiveFrom, package: c.basic + c.housing + c.transport, gosiWage: gw || null });
  });
  if (dry) return { ok: true, dryRun: true, packages: comps.length, gosiWages: privUpd.length, rows: plan };
  var refs = nextRefs_('salary', comps.length, codesOf_(readAll_(SHEETS.COMP), 'ref')); comps.forEach(function (c, i) { c.ref = refs[i]; });
  appendMany_(SHEETS.COMP, comps); privUpd.forEach(function (p) { update_(SHEETS.PRIV, p); });
  audit_('owner', 'package_set', '', { packages: comps.length, gosiWages: privUpd.length, empNos: plan.map(function (x) { return x.empNo; }) });
  return { ok: true, dryRun: false, packages: comps.length, gosiWages: privUpd.length, rows: plan };
}

/**
 * Clean start for the home organisation (owner only, same setup key; modes of demoData, so no new public action):
 *   people  every employee: id, number, name, role, status (nothing private)
 *   reset   { keepEmpNo, confirm: 'RESET' }: keeps that one employee, deletes every other employee and every row about
 *           them (any tab with a person column: sign-in devices, private file, packages, punches, requests ...), and
 *           empties the payroll books (runs, payslips, adjustments, snapshots, WPS, reconciliation, retro pay) so real
 *           salary history can be loaded. The audit trail and settings stay. Links from what stays to a removed person
 *           (manager, department head) are blanked.
 */
var RESET_PERSON_COLS_ = ['empId', 'subjectId', 'menteeId', 'mentorId', 'incumbentEmpId', 'fromEmpId', 'toEmpId', 'raterId', 'peerId'];
var RESET_LINK_COLS_ = ['managerId', 'headEmpId'];
var RESET_PAY_TABS_ = ['payrollRuns', 'payslips', 'adjustments', 'snapshots', 'wpsLog', 'salaryRecon', 'retroLog'];
var RESET_SKIP_TABS_ = { settings: 1, audit: 1, demoLedger: 1 };

function resetHomeOnly_() { if (ORG_ && !ORG_.home) fail_('bad_request'); }

function resetPeople_() {
  resetHomeOnly_();
  forget_(SHEETS.EMP);
  return { ok: true, people: readAll_(SHEETS.EMP).map(function (e) {
    return { id: String(e.id), empNo: String(e.empNo), name: String(e.name || ''), role: String(e.role || ''), status: String(e.status || '') };
  }) };
}

/** Rewrites one tab: drops rows `drop(o)` says, blanks link columns that point at a removed person. Returns rows removed. */
function resetRewrite_(tab, drop, gone) {
  var sh = sheet_(tab), last = sh.getLastRow();
  if (last < 2) return 0;
  var width = Math.max(sh.getLastColumn(), HEADERS[tab].length);
  var head = sh.getRange(1, 1, 1, width).getValues()[0].map(String);
  var vals = sh.getRange(2, 1, last - 1, width).getValues(), changed = false;
  var keep = vals.filter(function (row) {
    var o = {};
    head.forEach(function (k, i) { if (k) o[k] = row[i] instanceof Date ? cellDate_(row[i]) : row[i]; });
    return !drop(o);
  });
  keep.forEach(function (row) {
    head.forEach(function (k, i) { if (RESET_LINK_COLS_.indexOf(k) >= 0 && gone[String(row[i])]) { row[i] = ''; changed = true; } });
  });
  var removed = vals.length - keep.length;
  if (!removed && !changed) return 0;
  forget_(tab); bumpTab_(tab);
  sh.getRange(2, 1, last - 1, width).clearContent();
  if (keep.length) sh.getRange(2, 1, keep.length, width).setValues(keep.map(function (row) {
    return row.map(function (v) { return typeof v === 'string' && v !== '' ? "'" + v : v; });
  }));
  bumpTab_(tab);
  return removed;
}

function resetKeepOne_(req) {
  resetHomeOnly_();
  if (String(req.confirm || '') !== 'RESET') fail_('bad_request');
  var no = String(req.keepEmpNo || '').trim();
  forget_(SHEETS.EMP);
  var emps = readAll_(SHEETS.EMP), me = emps.filter(function (e) { return String(e.empNo) === no; });
  if (!no || me.length !== 1) fail_('not_found');
  var keepId = String(me[0].id), gone = {};
  emps.forEach(function (e) { if (String(e.id) !== keepId) gone[String(e.id)] = 1; });
  var removed = {};
  Object.keys(HEADERS).forEach(function (tab) {
    if (RESET_SKIP_TABS_[tab]) return;
    var h = HEADERS[tab], pay = RESET_PAY_TABS_.indexOf(tab) >= 0;
    var cols = RESET_PERSON_COLS_.filter(function (c) { return h.indexOf(c) >= 0; });
    var isEmp = tab === SHEETS.EMP;
    if (!pay && !isEmp && !cols.length && !h.some(function (c) { return RESET_LINK_COLS_.indexOf(c) >= 0; })) return;
    var n = resetRewrite_(tab, function (o) {
      if (pay) return true;
      if (isEmp) return String(o.id) !== keepId;
      return cols.some(function (c) { return gone[String(o[c])]; });
    }, gone);
    if (n) removed[tab] = n;
  });
  return { ok: true, kept: { id: keepId, empNo: no, name: String(me[0].name || '') }, removed: removed };
}

function demoStatus_() {
  var tabs = {}, demo = {};
  demoTabs_().forEach(function (n) { forget_(n); tabs[n] = readAll_(n).length; });
  forget_(SHEETS.DEMO);
  readAll_(SHEETS.DEMO).forEach(function (x) { demo[x.tab] = (demo[x.tab] || 0) + 1; });
  var months = readAll_(SHEETS.RUN).filter(function (r) { return r.status !== 'cancelled'; }).map(function (r) { return String(r.month) + ':' + r.status; });
  return { ok: true, tabs: tabs, demo: demo, payrollMonths: months };
}

function demoImport_(req) {
  var tab = String(req.tab || ''), rows = req.rows || [];
  if (demoTabs_().indexOf(tab) < 0) fail_('bad_tab');
  if (!Array.isArray(rows) || rows.length > 3000) fail_('bad_request');
  forget_(tab);
  var have = {};
  readAll_(tab).forEach(function (o) { have[demoRowKey_(tab, o)] = 1; });
  var h = HEADERS[tab], now = new Date().toISOString(), batch = str_(req.batch, 40) || 'demo', out = [], led = [];
  rows.forEach(function (r) {
    var o = {};
    h.forEach(function (k) { o[k] = r[k] == null ? '' : r[k]; });
    if (tab === SHEETS.RUN) o.scope = 'demo'; // a loaded run is the demo's own, whatever the export said
    var key = demoRowKey_(tab, o);
    if (have[key]) return;
    have[key] = 1;
    out.push(o);
    led.push({ tab: tab, key: key, batch: batch, at: now });
  });
  appendMany_(tab, out);
  appendMany_(SHEETS.DEMO, led);
  return { ok: true, tab: tab, added: out.length, skipped: rows.length - out.length };
}

/**
 * A locked demo payroll for one month, from the real calculation (payrollCtx_ + calcSlip_) over the ledgered people.
 * Also marks any loaded run still without a scope as demo. Every row written goes into the ledger, so purge removes it.
 */
function demoPayroll_(req) {
  var month = String(req.month || '');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) fail_('bad_date');
  if (month > today_().slice(0, 7)) fail_('future_month');
  forget_(SHEETS.DEMO); forget_(SHEETS.RUN); forget_(SHEETS.SLIP);
  var runKeys = demoKeySet_(SHEETS.RUN), runs = readAll_(SHEETS.RUN);
  runs.forEach(function (r) { if (runKeys['id:' + r.id] && !isDemoRun_(r)) { r.scope = 'demo'; update_(SHEETS.RUN, r); } });
  var have = runs.filter(function (r) { return r.month === month && isDemoRun_(r) && r.status !== 'cancelled'; })[0];
  if (have) return { ok: true, skipped: true, month: month, run: publicRun_(have) };
  var emps = payrollEmps_(month, 'demo');
  if (!emps.length) fail_('not_found'); // nobody loaded (or nobody employed in the month)
  var inPay = function (e) { return e.role === 'payroll' || trimList_(e.extraRoles).indexOf('payroll') >= 0; };
  var active = emps.filter(function (e) { return e.status === 'active'; });
  var approver = active.filter(inPay)[0];
  var preparer = approver && (active.filter(function (e) { return e.role === 'hr' && e.id !== approver.id; })[0] ||
    active.filter(function (e) { return inPay(e) && e.id !== approver.id; })[0]);
  if (!approver || !preparer) fail_('second_approver_required'); // the demo has no HR + payroll pair to prepare and approve
  var now = new Date(), nowIso = now.toISOString(), after = function (days) {
    var t = Date.parse(monthLast_(month) + 'T06:00:00Z') + days * 864e5;
    return new Date(Math.min(t, now.getTime())).toISOString();
  };
  var run = { id: newId_('P'), ref: 'DEMO-PR-' + month, month: month, status: 'locked', preparedBy: preparer.id, preparedAt: after(1),
    approvedBy: approver.id, approvedAt: after(2), totalsJson: '', note: 'تجريبي / demo', emailedAt: '', createdAt: nowIso, updatedAt: nowIso, scope: 'demo' };
  var x = payrollCtx_(month), rows = [];
  emps.forEach(function (e) { var c = calcSlip_(e, x); if (c) rows.push(slipRow_(e, run, c, null)); });
  rows.forEach(function (r, i) { r.ref = 'DEMO-PS-' + month + '-' + ('000' + (i + 1)).slice(-4); });
  run.totalsJson = JSON.stringify(totals_(rows));
  append_(SHEETS.RUN, run);
  appendMany_(SHEETS.SLIP, rows);
  var batch = 'demo-payroll-' + month, led = [{ tab: SHEETS.RUN, key: demoRowKey_(SHEETS.RUN, run), batch: batch, at: nowIso }];
  rows.forEach(function (r) { led.push({ tab: SHEETS.SLIP, key: demoRowKey_(SHEETS.SLIP, r), batch: batch, at: nowIso }); });
  appendMany_(SHEETS.DEMO, led);
  return { ok: true, created: true, month: month, headcount: rows.length, run: publicRun_(run) };
}

/** Rewrites each tab without the ledgered rows. Text goes back with its apostrophe so Sheets converts nothing. */
function demoPurge_() {
  forget_(SHEETS.DEMO);
  var byTab = {};
  readAll_(SHEETS.DEMO).forEach(function (x) { (byTab[x.tab] = byTab[x.tab] || {})[x.key] = 1; });
  var removed = {};
  Object.keys(byTab).forEach(function (tab) {
    if (!HEADERS[tab]) return;
    var sh = sheet_(tab), last = sh.getLastRow(), h = HEADERS[tab];
    if (last < 2) return;
    var width = Math.max(sh.getLastColumn(), h.length);
    var head = sh.getRange(1, 1, 1, width).getValues()[0].map(String);
    var vals = sh.getRange(2, 1, last - 1, width).getValues();
    var keep = vals.filter(function (row) {
      var o = {};
      head.forEach(function (k, i) { if (k) o[k] = row[i] instanceof Date ? cellDate_(row[i]) : row[i]; });
      return !byTab[tab][demoRowKey_(tab, o)];
    });
    removed[tab] = vals.length - keep.length;
    if (!removed[tab]) return;
    forget_(tab);
    bumpTab_(tab);
    sh.getRange(2, 1, last - 1, width).clearContent();
    if (keep.length) sh.getRange(2, 1, keep.length, width).setValues(keep.map(function (row) {
      return row.map(function (v) { return typeof v === 'string' && v !== '' ? "'" + v : v; });
    }));
    bumpTab_(tab);
  });
  var led = sheet_(SHEETS.DEMO);
  if (led.getLastRow() > 1) led.getRange(2, 1, led.getLastRow() - 1, Math.max(led.getLastColumn(), 1)).clearContent();
  forget_(SHEETS.DEMO);
  bumpTab_(SHEETS.DEMO);
  return { ok: true, removed: removed };
}
