/**
 * HR core (Phase 1): organisation, positions, employee file, private file,
 * effective-dated compensation, documents and expiries, Excel import, and the
 * employee's own file. Access is decided here, on the server, for every read.
 *
 * KSA rules enforced (docs/ksa-compliance-research-2026-09-30.md):
 *   Labour Law Art. 37  a non-Saudi contract is fixed-term      -> expat_contract_fixed
 *   Labour Law Art. 53  probation at most 180 days in total     -> probation_too_long
 *   Labour Law Art. 109 annual leave at least 21 days           -> leave_below_minimum
 *   Nitaqat             Saudi counts 1.0 at basic+housing >= 4,000, 0.5 at 3,000-3,999
 */

function today_() { return localParts_(new Date()).date; }
function trimList_(v) { return String(v || '').split(',').map(function (s) { return s.trim(); }).filter(String); }
function bool_(v) { return v === true || v === 'true' || v === 'TRUE' || v === 1 || v === '1'; }

function hasRole_(e, role) { return !!e && (e.role === role || trimList_(e.extraRoles).indexOf(role) >= 0); }
function isHr_(e) { return !!e && (e.role === 'hr' || e.role === 'admin'); }

/** Salary: self, HR, payroll. Admin only with payroll (separation of duties). Managers never. */
function canSeeSalary_(me, emp) {
  if (!me || !emp) return false;
  if (me.id === emp.id) return true;
  return me.role === 'hr' || hasRole_(me, 'payroll');
}

function orgCtx_() {
  var emps = {}, depts = {};
  readAll_(SHEETS.EMP).forEach(function (e) { emps[e.id] = e; });
  readAll_(SHEETS.DEPT).forEach(function (d) { depts[d.id] = d; });
  return { emps: emps, depts: depts };
}

/** True when me is up emp's manager chain, or heads emp's department or one above it. */
function manages_(me, emp, ctx) {
  if (!me || !emp || me.id === emp.id) return false;
  var seen = {}, cur = emp;
  for (var i = 0; i < 25 && cur && cur.managerId && !seen[cur.id]; i++) {
    seen[cur.id] = 1;
    if (cur.managerId === me.id) return true;
    cur = ctx.emps[cur.managerId];
  }
  var d = ctx.depts[emp.departmentId], dseen = {};
  for (var j = 0; j < 25 && d && !dseen[d.id]; j++) {
    dseen[d.id] = 1;
    if (d.headEmpId === me.id) return true;
    d = ctx.depts[d.parentId];
  }
  return false;
}

/**
 * Writes many already-read rows in one call: the block from the first to the last row touched,
 * taken from this request's memo (so rows in between are written back unchanged).
 * One update_ per row costs ~200 ms each, too slow for an import of hundreds.
 */
function updateMany_(name, objs) {
  if (!objs.length) return;
  if (objs.length <= 3) { objs.forEach(function (o) { update_(name, o); }); return; }
  var memo = READ_MEMO_[name];
  if (!memo || objs.some(function (o) { return memo.indexOf(o) < 0 || o._cached; })) { objs.forEach(function (o) { update_(name, o); }); return; }
  var lo = Infinity, hi = 0, byRow = {};
  memo.forEach(function (o) { byRow[o._row] = o; });
  objs.forEach(function (o) { lo = Math.min(lo, o._row); hi = Math.max(hi, o._row); });
  var width = HEADERS[name].length, block = [];
  for (var r = lo; r <= hi; r++) block.push(byRow[r] ? toRow_(name, byRow[r]) : HEADERS[name].map(function () { return ''; }));
  bumpTab_(name);
  var sh = sheet_(name);
  ensureHeader_(name, sh);
  sh.getRange(lo, 1, block.length, width).setValues(block);
}

// ---------------- departments ----------------

function publicDept_(d) {
  return { id: d.id, code: d.code, nameAr: d.nameAr, nameEn: d.nameEn, parentId: d.parentId, headEmpId: d.headEmpId,
    costCenter: d.costCenter, status: d.status };
}
/** Arabic-aware name key: spacing, alef forms, taa marbuta and alef maqsura do not make a second department. */
function normName_(s) { return String(s || '').trim().replace(/\s+/g, ' ').replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase(); }

function api_hrDeptList() { return { ok: true, rows: readAll_(SHEETS.DEPT).map(publicDept_) }; }

function api_hrDeptSave(req, me) {
  var d = req.dept || {};
  return withLock_(function () {
    var all = readAll_(SHEETS.DEPT), byId = {};
    all.forEach(function (x) { byId[x.id] = x; });
    var row = d.id ? byId[d.id] : null;
    if (d.id && !row) fail_('not_found');
    var nameAr = str_(d.nameAr, 80);
    if (!nameAr) fail_('missing_fields');
    if (all.some(function (x) { return x.id !== (row && row.id) && normName_(x.nameAr) === normName_(nameAr); })) fail_('duplicate_name');
    var parentId = str_(d.parentId, 40);
    if (parentId && !byId[parentId]) fail_('not_found');
    if (row && parentId) {
      if (parentId === row.id) fail_('dept_cycle');
      for (var p = byId[parentId], i = 0; p && i < 50; p = byId[p.parentId], i++) if (p.id === row.id) fail_('dept_cycle');
    }
    var headEmpId = str_(d.headEmpId, 40);
    if (headEmpId && !findBy_(SHEETS.EMP, 'id', headEmpId)) fail_('not_found');
    var now = new Date().toISOString(), created = !row;
    if (!row) row = { id: newId_('D'), createdAt: now };
    row.code = str_(d.code, 20); row.nameAr = nameAr; row.nameEn = str_(d.nameEn, 80); row.parentId = parentId;
    row.headEmpId = headEmpId; row.costCenter = str_(d.costCenter, 30); row.status = d.status === 'disabled' ? 'disabled' : 'active';
    row.updatedAt = now;
    if (created) append_(SHEETS.DEPT, row); else update_(SHEETS.DEPT, row);
    audit_(me.id, created ? 'dept_create' : 'dept_update', row.id, { nameAr: nameAr, parentId: parentId, headEmpId: headEmpId });
    return { ok: true, dept: publicDept_(row) };
  });
}

// ---------------- positions and job descriptions ----------------

var POS_TEXT = ['purposeAr', 'purposeEn', 'dutiesAr', 'dutiesEn', 'requirementsAr', 'requirementsEn'];

function publicPosition_(p) {
  var o = { id: p.id, code: p.code, titleAr: p.titleAr, titleEn: p.titleEn, departmentId: p.departmentId, grade: p.grade, status: p.status };
  POS_TEXT.forEach(function (k) { o[k] = p[k]; });
  return o;
}

function api_hrPositionList() { return { ok: true, rows: readAll_(SHEETS.POS).map(publicPosition_) }; }

function api_hrPositionSave(req, me) {
  var d = req.position || {};
  return withLock_(function () {
    var row = d.id ? findBy_(SHEETS.POS, 'id', d.id) : null;
    if (d.id && !row) fail_('not_found');
    var titleAr = str_(d.titleAr, 80);
    if (!titleAr) fail_('missing_fields');
    if (d.departmentId && !findBy_(SHEETS.DEPT, 'id', d.departmentId)) fail_('not_found');
    var now = new Date().toISOString(), created = !row;
    if (!row) row = { id: newId_('J'), createdAt: now };
    row.code = str_(d.code, 20); row.titleAr = titleAr; row.titleEn = str_(d.titleEn, 80);
    row.departmentId = str_(d.departmentId, 40); row.grade = str_(d.grade, 20);
    POS_TEXT.forEach(function (k) { row[k] = str_(d[k], 3000); });
    row.status = d.status === 'disabled' ? 'disabled' : 'active'; row.updatedAt = now;
    if (created) append_(SHEETS.POS, row); else update_(SHEETS.POS, row);
    audit_(me.id, created ? 'position_create' : 'position_update', row.id, { titleAr: titleAr });
    return { ok: true, position: publicPosition_(row) };
  });
}

// ---------------- validation ----------------

/** YYYY-MM-DD, dd/mm/yyyy, or an Excel serial number. Returns '' when unreadable or impossible (31/02). */
function isoDate_(v) {
  if (v === '' || v == null) return '';
  if (typeof v === 'number' && isFinite(v) && v > 20000 && v < 80000) return new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86400000).toISOString().slice(0, 10);
  var s = String(v).trim(), m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return ymd_(+m[1], +m[2], +m[3]);
  if ((m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/))) return ymd_(+m[3], +m[2], +m[1]);
  return '';
}
function ymd_(y, mo, d) {
  var dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return '';
  return dt.toISOString().slice(0, 10);
}
function daysBetween_(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000); }

/** Saudi IBAN: SA + 2 check digits + 20 characters, ISO 13616 mod-97 = 1. */
function validIban_(s) {
  s = String(s || '').replace(/\s+/g, '').toUpperCase();
  if (!/^SA\d{2}[0-9A-Z]{20}$/.test(s)) return false;
  var r = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, function (c) { return String(c.charCodeAt(0) - 55); });
  var rem = 0;
  for (var i = 0; i < r.length; i++) rem = (rem * 10 + Number(r[i])) % 97;
  return rem === 1;
}
/** 1xxxxxxxxx national ID (Saudi), 2xxxxxxxxx iqama (resident). */
function validNationalId_(s) { return /^[12]\d{9}$/.test(String(s || '')); }

function wouldCycle_(empId, managerId, emps) {
  for (var cur = managerId, i = 0; cur && i < 50; cur = emps[cur] && emps[cur].managerId, i++) if (cur === empId) return true;
  return false;
}

var SAUDI_RE = /^(SA|SAU|KSA|سعودي|سعودية|saudi|saudi arabia)$/i;

/** Qiwa contract type: fixed-term or indefinite. Arabic labels from HR files are accepted. */
function contractType_(v) {
  var s = String(v || '').trim().toLowerCase();
  if (!s) return '';
  if (/^(indefinite|unlimited|open|غير محدد|غير محدد المدة)$/.test(s)) return 'indefinite';
  if (/^(fixed|limited|fixed-term|محدد|محدد المدة)$/.test(s)) return 'fixed';
  return null;
}

/** The Labour Law checks shared by the form and the import. Returns an error code or ''. */
function contractRule_(e) {
  if (!bool_(e.isSaudi) && e.contractType === 'indefinite') return 'expat_contract_fixed';
  if (e.contractType === 'fixed' && e.contractEnd && e.hireDate && e.contractEnd <= e.hireDate) return 'bad_contract_end';
  if (e.probationEnd && e.hireDate && daysBetween_(e.hireDate, e.probationEnd) > 180) return 'probation_too_long';
  if (e.annualLeaveDays !== '' && e.annualLeaveDays != null && Number(e.annualLeaveDays) < 21) return 'leave_below_minimum';
  return '';
}

// ---------------- job data ----------------

/** HR may edit employees and HR colleagues; an administrator's record only an administrator may touch. */
function guardEdit_(me, target) {
  if (target.role === 'admin' && me.role !== 'admin') fail_('forbidden');
}

var JOB_KEYS = ['departmentId', 'positionId', 'managerId', 'hireDate', 'contractType', 'contractEnd', 'probationEnd',
  'nationality', 'isSaudi', 'gender', 'workLocation', 'contractNo', 'occupationCode', 'employmentType',
  'workDaysPerWeek', 'dailyHours', 'annualLeaveDays', 'noticeDays'];
var JOB_NUM = { workDaysPerWeek: [1, 7], dailyHours: [1, 12], annualLeaveDays: [0, 60], noticeDays: [0, 180] };

function api_hrEmpSave(req, me) {
  var d = req.emp || {};
  return withLock_(function () {
    var ctx = orgCtx_(), emp = ctx.emps[d.id];
    if (!emp) fail_('not_found');
    guardEdit_(me, emp);
    var before = { departmentId: emp.departmentId, positionId: emp.positionId, managerId: emp.managerId };
    if ('departmentId' in d && d.departmentId && !ctx.depts[d.departmentId]) fail_('not_found');
    var pos = null;
    if ('positionId' in d && d.positionId && !(pos = findBy_(SHEETS.POS, 'id', d.positionId))) fail_('not_found');
    if ('managerId' in d && d.managerId) {
      if (!ctx.emps[d.managerId]) fail_('not_found');
      if (d.managerId === emp.id || wouldCycle_(emp.id, d.managerId, ctx.emps)) fail_('manager_cycle');
    }
    ['hireDate', 'contractEnd', 'probationEnd'].forEach(function (k) { if (d[k] && !isoDate_(d[k])) fail_('bad_date'); });
    if ('contractType' in d && contractType_(d.contractType) === null) fail_('bad_value');
    Object.keys(JOB_NUM).forEach(function (k) {
      if (!(k in d) || d[k] === '' || d[k] == null) return;
      var n = Number(d[k]);
      if (!isFinite(n) || n < JOB_NUM[k][0] || n > JOB_NUM[k][1]) fail_('bad_value');
    });
    var next = {};
    JOB_KEYS.forEach(function (k) { next[k] = emp[k]; });
    JOB_KEYS.forEach(function (k) {
      if (!(k in d)) return;
      if (k === 'isSaudi') next.isSaudi = bool_(d.isSaudi);
      else if (k === 'contractType') next.contractType = contractType_(d.contractType);
      else if (k === 'hireDate' || k === 'contractEnd' || k === 'probationEnd') next[k] = isoDate_(d[k]);
      else if (JOB_NUM[k]) next[k] = d[k] === '' || d[k] == null ? '' : Number(d[k]);
      else next[k] = str_(d[k], 60);
    });
    if ('nationality' in d && !('isSaudi' in d)) next.isSaudi = SAUDI_RE.test(String(next.nationality || ''));
    var rule = contractRule_(next);
    if (rule) fail_(rule);
    JOB_KEYS.forEach(function (k) { emp[k] = next[k]; });
    // The attendance screens still show the text department and title: keep them in step.
    if (emp.departmentId && ctx.depts[emp.departmentId]) emp.department = ctx.depts[emp.departmentId].nameAr;
    if (pos) emp.title = pos.titleAr;
    emp.updatedAt = new Date().toISOString();
    update_(SHEETS.EMP, emp);
    if (before.departmentId !== emp.departmentId || before.positionId !== emp.positionId || before.managerId !== emp.managerId) {
      append_(SHEETS.JOBH, { id: newId_('H'), empId: emp.id, effectiveFrom: isoDate_(d.effectiveFrom) || today_(),
        departmentId: emp.departmentId, positionId: emp.positionId, managerId: emp.managerId, grade: pos ? pos.grade : '',
        reason: str_(d.reason, 200), enteredBy: me.id, createdAt: emp.updatedAt });
    }
    audit_(me.id, 'emp_job_update', emp.id, { before: before, fields: Object.keys(d).filter(function (k) { return k !== 'id'; }) });
    return { ok: true };
  });
}

/** Admin grants the payroll role. Kept apart from HR so the person who edits people is not the one who pays them. */
function api_hrRolesSave(req, me) {
  var roles = trimList_(req.extraRoles).filter(function (r) { return r === 'payroll'; });
  return withLock_(function () {
    var emp = findBy_(SHEETS.EMP, 'id', req.id);
    if (!emp) fail_('not_found');
    emp.extraRoles = roles.join(',');
    emp.tokenVer = Number(emp.tokenVer || 0) + 1; // new rights take effect on the next sign-in, old sessions end
    emp.updatedAt = new Date().toISOString();
    update_(SHEETS.EMP, emp);
    audit_(me.id, 'roles_update', emp.id, { extraRoles: emp.extraRoles });
    return { ok: true };
  });
}

var PRIV_KEYS = ['nationalId', 'idExpiry', 'birthDate', 'maritalStatus', 'iban', 'bankName', 'gosiNumber', 'gosiCohort',
  'address', 'emergencyName', 'emergencyPhone', 'borderNo', 'passportNo', 'passportExpiry', 'nationalAddress',
  'personalEmail', 'nameEnOfficial'];
var PRIV_DATES = { idExpiry: 1, birthDate: 1, passportExpiry: 1 };

function api_hrPrivateSave(req, me) {
  var d = req.priv || {};
  if ('iban' in d && d.iban && !validIban_(d.iban)) fail_('bad_iban');
  if ('nationalId' in d && d.nationalId && !validNationalId_(d.nationalId)) fail_('bad_national_id');
  Object.keys(PRIV_DATES).forEach(function (k) { if (d[k] && !isoDate_(d[k])) fail_('bad_date'); });
  if ('gosiCohort' in d && d.gosiCohort && ['legacy', 'new'].indexOf(d.gosiCohort) < 0) fail_('bad_value');
  if ('personalEmail' in d && d.personalEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.personalEmail)) fail_('bad_email');
  if ('borderNo' in d && d.borderNo && !/^\d{10}$/.test(String(d.borderNo))) fail_('bad_value');
  return withLock_(function () {
    var target = findBy_(SHEETS.EMP, 'id', req.empId);
    if (!target) fail_('not_found');
    guardEdit_(me, target);
    var row = findBy_(SHEETS.PRIV, 'empId', req.empId), created = !row;
    var newIban = 'iban' in d ? String(d.iban || '').replace(/\s+/g, '').toUpperCase() : null;
    // Salary goes to this account: a person may never change their own, so a fraudulent switch needs two people.
    if (newIban !== null && req.empId === me.id && newIban !== String((row && row.iban) || '')) fail_('cannot_change_own_bank');
    if (!row) row = { empId: req.empId };
    if (d.nationalId) {
      var dup = readAll_(SHEETS.PRIV).some(function (p) { return p.empId !== req.empId && String(p.nationalId) === String(d.nationalId); });
      if (dup) fail_('duplicate_national_id');
    }
    var ibanBefore = row.iban;
    PRIV_KEYS.forEach(function (k) {
      if (!(k in d)) return;
      row[k] = k === 'iban' ? String(d.iban || '').replace(/\s+/g, '').toUpperCase() : PRIV_DATES[k] ? isoDate_(d[k]) : str_(d[k], 200);
    });
    row.updatedAt = new Date().toISOString();
    if (created) append_(SHEETS.PRIV, row); else update_(SHEETS.PRIV, row);
    var det = { fields: Object.keys(d) };
    if (newIban !== null) det.iban = (String(ibanBefore || '').slice(-4) || '-') + ' > ' + (newIban.slice(-4) || '-');
    audit_(me.id, 'emp_private_update', req.empId, det);
    return { ok: true };
  });
}

// ---------------- the file, as each viewer may see it ----------------

function nameCard_(e) { return e ? { id: e.id, empNo: String(e.empNo), name: e.name, nameEn: e.nameEn, title: e.title } : null; }

function headFor_(emp, ctx) {
  for (var d = ctx.depts[emp.departmentId], i = 0; d && i < 25; d = ctx.depts[d.parentId], i++) {
    if (d.headEmpId && d.headEmpId !== emp.id) return ctx.emps[d.headEmpId] || null;
  }
  return null;
}

function serviceYears_(hireDate) {
  if (!hireDate) return null;
  return Math.max(0, Math.round(daysBetween_(hireDate, today_()) / 365.25 * 10) / 10);
}

function buildFile_(me, emp, ctx) {
  var self = me.id === emp.id, hr = isHr_(me), pay = hasRole_(me, 'payroll'), mgr = manages_(me, emp, ctx);
  if (!self && !hr && !mgr && !pay) fail_('forbidden');
  var pos = emp.positionId ? findBy_(SHEETS.POS, 'id', emp.positionId) : null;
  var dept = ctx.depts[emp.departmentId];
  var file = {
    emp: publicEmp_(emp),
    job: {
      department: dept ? publicDept_(dept) : null, position: pos ? { id: pos.id, titleAr: pos.titleAr, titleEn: pos.titleEn, grade: pos.grade } : null,
      manager: nameCard_(ctx.emps[emp.managerId]), head: nameCard_(headFor_(emp, ctx)),
      hireDate: emp.hireDate || '', serviceYears: serviceYears_(emp.hireDate), contractType: emp.contractType || '',
      contractEnd: emp.contractEnd || '', probationEnd: emp.probationEnd || '', workLocation: emp.workLocation || '',
      nationality: emp.nationality || '', isSaudi: bool_(emp.isSaudi), gender: emp.gender || '',
      contractNo: emp.contractNo || '', occupationCode: emp.occupationCode || '', employmentType: emp.employmentType || '',
      workDaysPerWeek: emp.workDaysPerWeek === '' ? null : emp.workDaysPerWeek, dailyHours: emp.dailyHours === '' ? null : emp.dailyHours,
      annualLeaveDays: emp.annualLeaveDays === '' ? null : emp.annualLeaveDays, noticeDays: emp.noticeDays === '' ? null : emp.noticeDays
    },
    jd: pos ? publicPosition_(pos) : null
  };
  if (self || hr || pay) {
    var p = findBy_(SHEETS.PRIV, 'empId', emp.id) || {};
    file.priv = {};
    PRIV_KEYS.forEach(function (k) { file.priv[k] = p[k] === undefined ? '' : String(p[k]); });
  }
  if (canSeeSalary_(me, emp)) {
    file.comp = currentComp_(emp.id, today_());
    if (!self) { file.compHistory = compRows_(emp.id); audit_(me.id, 'salary_view', emp.id, null); }
  }
  if (self || hr || mgr) {
    file.jobHistory = readAll_(SHEETS.JOBH).filter(function (h) { return h.empId === emp.id; })
      .sort(function (a, b) { return a.effectiveFrom < b.effectiveFrom ? 1 : -1; })
      .map(function (h) { return { effectiveFrom: h.effectiveFrom, department: ctx.depts[h.departmentId] ? ctx.depts[h.departmentId].nameAr : '',
        manager: ctx.emps[h.managerId] ? ctx.emps[h.managerId].name : '', positionId: h.positionId, reason: h.reason }; });
  }
  if (self || hr) file.documents = docRows_(emp.id);
  if (hr) file.extraRoles = String(emp.extraRoles || '');
  return file;
}

function api_hrEmpFile(req, me) {
  var ctx = orgCtx_(), emp = ctx.emps[req.id];
  if (!emp) fail_('not_found');
  return { ok: true, file: buildFile_(me, emp, ctx) };
}

function api_hrTeam(req, me) {
  var ctx = orgCtx_();
  var rows = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; })
    .filter(function (e) { return e.status === 'active' && manages_(me, e, ctx); })
    .map(function (e) {
      var o = publicEmp_(e); o.managerId = e.managerId; o.departmentId = e.departmentId; o.positionId = e.positionId;
      o.direct = e.managerId === me.id; return o;
    });
  return { ok: true, rows: rows };
}

/** Nitaqat weight of one Saudi from the package in force today. */
function nitaqatWeight_(comp) {
  if (!comp) return 0;
  var w = comp.basic + comp.housing;
  return w >= 4000 ? 1 : w >= 3000 ? 0.5 : 0;
}

function api_hrDirectory(req, me) {
  var ctx = orgCtx_(), pos = {}, t = today_();
  readAll_(SHEETS.POS).forEach(function (p) { pos[p.id] = p.titleAr; });
  var comps = currentCompMap_(t);
  var sum = { headcount: 0, saudis: 0, saudiWeighted: 0, saudiNoPackage: 0 };
  var rows = Object.keys(ctx.emps).map(function (k) {
    var e = ctx.emps[k], o = publicEmp_(e);
    o.departmentId = e.departmentId; o.positionId = e.positionId; o.managerId = e.managerId; o.hireDate = e.hireDate;
    o.departmentName = ctx.depts[e.departmentId] ? ctx.depts[e.departmentId].nameAr : e.department;
    o.positionName = pos[e.positionId] || e.title; o.managerName = ctx.emps[e.managerId] ? ctx.emps[e.managerId].name : '';
    o.extraRoles = String(e.extraRoles || ''); o.isSaudi = bool_(e.isSaudi); o.nationality = e.nationality || '';
    o.contractType = e.contractType || ''; o.contractEnd = e.contractEnd || '';
    if (e.status === 'active') {
      sum.headcount++;
      if (o.isSaudi) {
        sum.saudis++;
        if (!comps[e.id]) sum.saudiNoPackage++;
        sum.saudiWeighted += nitaqatWeight_(comps[e.id]);
      }
    }
    return o;
  });
  sum.saudiPct = sum.headcount ? Math.round(sum.saudiWeighted / sum.headcount * 1000) / 10 : 0;
  return { ok: true, rows: rows, saudization: sum };
}

// ---------------- compensation (effective-dated, two people) ----------------

function num_(v) {
  if (typeof v === 'string') v = v.replace(/[,\s٬،]/g, '').replace(/٫/g, '.').replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 0x660); });
  var n = Number(v);
  return v === '' || v == null || !isFinite(n) ? NaN : Math.round(n * 100) / 100;
}

function compView_(c) {
  var other = {};
  try { other = JSON.parse(c.otherJson || '{}') || {}; } catch (e) { other = {}; }
  var total = Number(c.basic || 0) + Number(c.housing || 0) + Number(c.transport || 0);
  Object.keys(other).forEach(function (k) { total += Number(other[k]) || 0; });
  return { id: c.id, empId: c.empId, effectiveFrom: c.effectiveFrom, basic: Number(c.basic || 0), housing: Number(c.housing || 0),
    transport: Number(c.transport || 0), other: other, total: Math.round(total * 100) / 100, currency: c.currency || 'SAR',
    status: c.status, reason: c.reason, enteredBy: c.enteredBy, approvedBy: c.approvedBy, batchId: c.batchId || '' };
}

function compRows_(empId) {
  return readAll_(SHEETS.COMP).filter(function (c) { return c.empId === empId; })
    .sort(function (a, b) { return a.effectiveFrom < b.effectiveFrom ? 1 : -1; }).map(compView_);
}

function better_(c, best) {
  return !best || String(c.effectiveFrom) > String(best.effectiveFrom) ||
    (String(c.effectiveFrom) === String(best.effectiveFrom) && String(c.approvedAt) > String(best.approvedAt));
}

/** The approved package in force on asOf: the latest effectiveFrom not after it. */
function currentComp_(empId, asOf) {
  var best = null;
  readAll_(SHEETS.COMP).forEach(function (c) {
    if (c.empId !== empId || c.status !== 'approved' || String(c.effectiveFrom) > asOf) return;
    if (better_(c, best)) best = c;
  });
  return best ? compView_(best) : null;
}

function currentCompMap_(asOf) {
  var best = {};
  readAll_(SHEETS.COMP).forEach(function (c) {
    if (c.status !== 'approved' || String(c.effectiveFrom) > asOf) return;
    if (better_(c, best[c.empId])) best[c.empId] = c;
  });
  var out = {};
  Object.keys(best).forEach(function (k) { out[k] = compView_(best[k]); });
  return out;
}

function canProposeComp_(me) { return me.role === 'hr' || hasRole_(me, 'payroll'); }
function canDecideComp_(me) { return me.role === 'admin' || hasRole_(me, 'payroll') || me.role === 'hr'; }

function compRowFrom_(d, enteredBy) {
  var basic = num_(d.basic), housing = num_(d.housing || 0), transport = num_(d.transport || 0);
  if (!(basic > 0) || !(housing >= 0) || !(transport >= 0)) fail_('bad_amount');
  var other = {};
  Object.keys(d.other || {}).forEach(function (k) {
    var v = num_(d.other[k]); if (!(v >= 0)) fail_('bad_amount'); if (str_(k, 40)) other[str_(k, 40)] = v;
  });
  var eff = isoDate_(d.effectiveFrom);
  if (!eff) fail_('bad_date');
  return { id: newId_('C'), empId: d.empId, effectiveFrom: eff, basic: basic, housing: housing, transport: transport,
    otherJson: JSON.stringify(other), currency: 'SAR', reason: str_(d.reason, 200), enteredBy: enteredBy, approvedBy: '',
    approvedAt: '', status: 'pending', createdAt: new Date().toISOString(), batchId: d.batchId || '' };
}

function api_hrCompPropose(req, me) {
  if (!canProposeComp_(me)) fail_('forbidden');
  if (req.empId === me.id) fail_('cannot_change_own_salary');
  return withLock_(function () {
    if (!findBy_(SHEETS.EMP, 'id', req.empId)) fail_('not_found');
    var row = compRowFrom_(req, me.id);
    append_(SHEETS.COMP, row);
    audit_(me.id, 'comp_propose', req.empId, { effectiveFrom: row.effectiveFrom });
    return { ok: true, comp: compView_(row) };
  });
}

function api_hrCompDecide(req, me) {
  if (!canDecideComp_(me)) fail_('forbidden');
  var decision = req.decision === 'approve' ? 'approved' : req.decision === 'reject' ? 'rejected' : '';
  if (!decision) fail_('bad_request');
  var ids = (req.ids || []).map(String);
  if (!ids.length || ids.length > 2000) fail_('bad_request');
  return withLock_(function () {
    var rows = readAll_(SHEETS.COMP).filter(function (c) { return ids.indexOf(c.id) >= 0; });
    if (rows.length !== ids.length || rows.some(function (c) { return c.status !== 'pending'; })) fail_('not_found');
    if (rows.some(function (c) { return c.enteredBy === me.id; })) fail_('second_approver_required');
    if (rows.some(function (c) { return c.empId === me.id; })) fail_('cannot_change_own_salary');
    var now = new Date().toISOString();
    rows.forEach(function (c) { c.status = decision; c.approvedBy = me.id; c.approvedAt = now; });
    updateMany_(SHEETS.COMP, rows);
    audit_(me.id, 'comp_' + decision, '', { count: rows.length });
    return { ok: true, decided: rows.length };
  });
}

function api_hrCompList(req, me) {
  if (!canDecideComp_(me) && !canProposeComp_(me)) fail_('forbidden');
  var emps = {};
  readAll_(SHEETS.EMP).forEach(function (e) { emps[e.id] = e; });
  var want = ['pending', 'approved', 'rejected'].indexOf(req.status) >= 0 ? req.status : 'pending';
  var rows = readAll_(SHEETS.COMP).filter(function (c) { return c.status === want && c.empId !== me.id; })
    .map(function (c) {
      var v = compView_(c); v.emp = nameCard_(emps[c.empId]); v.enteredByName = emps[c.enteredBy] ? emps[c.enteredBy].name : '';
      v.mine = c.enteredBy === me.id; return v;
    });
  if (rows.length) audit_(me.id, 'salary_view', '', { list: want, count: rows.length });
  return { ok: true, rows: rows };
}

// ---------------- documents and expiries (iqama, passport, work permit, insurance, contract) ----------------

var DOC_TYPES = ['iqama', 'passport', 'work_permit', 'medical_insurance', 'contract', 'driving_licence', 'other'];

function publicDoc_(x) {
  return { id: x.id, empId: x.empId, type: x.type, number: String(x.number || ''), issueDate: x.issueDate, expiryDate: x.expiryDate,
    note: x.note, status: x.status };
}
function docRows_(empId) {
  return readAll_(SHEETS.DOCS).filter(function (x) { return x.empId === empId && x.status !== 'deleted'; })
    .sort(function (a, b) { return String(a.expiryDate) < String(b.expiryDate) ? -1 : 1; }).map(publicDoc_);
}

function api_hrDocList(req, me) {
  var rows = readAll_(SHEETS.DOCS).filter(function (x) { return x.status !== 'deleted' && (!req.empId || x.empId === req.empId); });
  return { ok: true, rows: rows.map(publicDoc_) };
}

function api_hrDocSave(req, me) {
  var d = req.doc || {};
  if (DOC_TYPES.indexOf(d.type) < 0) fail_('bad_value');
  ['issueDate', 'expiryDate'].forEach(function (k) { if (d[k] && !isoDate_(d[k])) fail_('bad_date'); });
  var issue = isoDate_(d.issueDate), exp = isoDate_(d.expiryDate);
  if (issue && exp && exp <= issue) fail_('bad_date');
  return withLock_(function () {
    var row = d.id ? findBy_(SHEETS.DOCS, 'id', d.id) : null;
    if (d.id && !row) fail_('not_found');
    var empId = row ? row.empId : d.empId;
    if (!findBy_(SHEETS.EMP, 'id', empId)) fail_('not_found');
    var now = new Date().toISOString(), created = !row;
    if (!row) row = { id: newId_('F'), empId: empId, createdAt: now };
    row.type = d.type; row.number = str_(d.number, 40); row.issueDate = issue; row.expiryDate = exp;
    row.note = str_(d.note, 300); row.status = d.status === 'deleted' ? 'deleted' : 'active'; row.updatedAt = now;
    if (created) append_(SHEETS.DOCS, row); else update_(SHEETS.DOCS, row);
    audit_(me.id, created ? 'doc_create' : (row.status === 'deleted' ? 'doc_delete' : 'doc_update'), empId, { type: row.type });
    return { ok: true, doc: publicDoc_(row) };
  });
}

/**
 * Everything that lapses within `days` (default 60), plus what has already lapsed:
 * documents, iqama and passport dates on the private file, fixed-term contract ends and probation ends.
 */
function api_hrExpiring(req, me) {
  var days = Math.max(1, Math.min(365, Number(req.days) || 60)), t = today_(), limit = addDays_(t, days);
  var emps = {};
  readAll_(SHEETS.EMP).forEach(function (e) { if (e.status === 'active') emps[e.id] = e; });
  var out = [];
  function add(empId, kind, date, number, source) {
    var e = emps[empId];
    if (!e || !date || date > limit) return;
    out.push({ empId: empId, empNo: String(e.empNo), name: e.name, kind: kind, date: date, number: number || '', source: source,
      daysLeft: daysBetween_(t, date) });
  }
  var docKinds = {};
  readAll_(SHEETS.DOCS).forEach(function (x) {
    if (x.status === 'deleted') return;
    docKinds[x.empId + ':' + x.type] = 1;
    add(x.empId, x.type, String(x.expiryDate || ''), x.number, 'document');
  });
  readAll_(SHEETS.PRIV).forEach(function (p) {
    // A document row of the same kind is the fresher record; the private-file date would be a duplicate.
    if (!docKinds[p.empId + ':iqama'] && !bool_(emps[p.empId] && emps[p.empId].isSaudi)) add(p.empId, 'iqama', String(p.idExpiry || ''), p.nationalId, 'file');
    if (!docKinds[p.empId + ':passport']) add(p.empId, 'passport', String(p.passportExpiry || ''), p.passportNo, 'file');
  });
  Object.keys(emps).forEach(function (k) {
    var e = emps[k];
    if (e.contractType === 'fixed' && e.contractEnd) add(e.id, 'contract_end', String(e.contractEnd), e.contractNo, 'contract');
    if (e.probationEnd && String(e.probationEnd) >= t) add(e.id, 'probation_end', String(e.probationEnd), '', 'contract');
  });
  out.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  return { ok: true, days: days, rows: out };
}

// ---------------- Excel import ----------------

var IMPORT_REQUIRED = ['empNo', 'nameAr', 'department', 'position', 'hireDate', 'nationality', 'nationalId', 'basic'];
var IMPORT_DATES = ['hireDate', 'idExpiry', 'birthDate', 'contractEnd', 'probationEnd', 'passportExpiry'];

function validateImport_(rows, ctx, me) {
  if (!Array.isArray(rows) || !rows.length) fail_('bad_request');
  if (rows.length > 2000) fail_('too_many_rows');
  var errors = [], seenNo = {}, seenId = {}, fileMgr = {};
  var existingByNo = {}, idOwner = {};
  Object.keys(ctx.emps).forEach(function (k) { existingByNo[String(ctx.emps[k].empNo).trim()] = ctx.emps[k]; });
  readAll_(SHEETS.PRIV).forEach(function (p) { if (p.nationalId) idOwner[String(p.nationalId)] = p.empId; });
  var deptNames = {}, posNames = {}, newDepts = {}, newPos = {};
  Object.keys(ctx.depts).forEach(function (k) { deptNames[normName_(ctx.depts[k].nameAr)] = ctx.depts[k].id; });
  readAll_(SHEETS.POS).forEach(function (p) { posNames[normName_(p.titleAr)] = p.id; });
  var plan = [];
  rows.forEach(function (raw, i) {
    var line = i + 2, e = function (field, code) { errors.push({ row: line, field: field, code: code }); };
    var r = {};
    Object.keys(raw || {}).forEach(function (k) { r[k] = typeof raw[k] === 'string' ? raw[k].trim() : raw[k]; });
    r.empNo = String(r.empNo == null ? '' : r.empNo).trim();
    IMPORT_REQUIRED.forEach(function (k) { if (r[k] === '' || r[k] == null) e(k, 'required'); });
    if (r.empNo) { if (seenNo[r.empNo]) e('empNo', 'duplicate_emp_no'); else seenNo[r.empNo] = line; }
    var ex = existingByNo[r.empNo];
    if (ex && me && ex.id === me.id) e('empNo', 'cannot_import_self');
    else if (ex && me && ex.role === 'admin' && me.role !== 'admin') e('empNo', 'forbidden_row');
    var nid = String(r.nationalId == null ? '' : r.nationalId).trim();
    r.nationalId = nid;
    if (nid) {
      if (!validNationalId_(nid)) e('nationalId', 'bad_national_id');
      else if (seenId[nid]) e('nationalId', 'duplicate_national_id');
      else if (idOwner[nid] && (!existingByNo[r.empNo] || existingByNo[r.empNo].id !== idOwner[nid])) e('nationalId', 'duplicate_national_id');
      if (!seenId[nid]) seenId[nid] = line;
    }
    if (r.iban && !validIban_(r.iban)) e('iban', 'bad_iban');
    IMPORT_DATES.forEach(function (k) {
      if (r[k] !== '' && r[k] != null) { var d = isoDate_(r[k]); if (!d) e(k, 'bad_date'); else r[k] = d; }
    });
    ['basic', 'housing', 'transport'].forEach(function (k) {
      if (r[k] === '' || r[k] == null) { if (k !== 'basic') r[k] = 0; return; }
      var n = num_(r[k]); if (!(n >= 0) || (k === 'basic' && !(n > 0))) e(k, 'bad_amount'); else r[k] = n;
    });
    Object.keys(JOB_NUM).forEach(function (k) {
      if (r[k] === '' || r[k] == null) return;
      var n = Number(r[k]);
      if (!isFinite(n) || n < JOB_NUM[k][0] || n > JOB_NUM[k][1]) e(k, 'bad_value'); else r[k] = n;
    });
    if (r.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)) e('email', 'bad_email');
    if (r.personalEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.personalEmail)) e('personalEmail', 'bad_email');
    if (r.gosiCohort && ['legacy', 'new'].indexOf(r.gosiCohort) < 0) e('gosiCohort', 'bad_value');
    if (r.contractType !== undefined && r.contractType !== '') {
      var ct = contractType_(r.contractType);
      if (ct === null) e('contractType', 'bad_value'); else r.contractType = ct;
    }
    r.isSaudi = SAUDI_RE.test(String(r.nationality || '').trim());
    var rule = contractRule_(r);
    if (rule) e(rule === 'probation_too_long' ? 'probationEnd' : rule === 'leave_below_minimum' ? 'annualLeaveDays' : 'contractType', rule);
    var dn = normName_(r.department), pn = normName_(r.position);
    if (dn && !deptNames[dn]) newDepts[dn] = r.department;
    if (pn && !posNames[pn]) newPos[pn] = { title: r.position, dept: dn };
    r.managerEmpNo = String(r.managerEmpNo == null ? '' : r.managerEmpNo).trim();
    if (r.managerEmpNo) {
      if (r.managerEmpNo === r.empNo) e('managerEmpNo', 'manager_cycle');
      fileMgr[r.empNo] = r.managerEmpNo;
    }
    r._line = line;
    plan.push(r);
  });
  plan.forEach(function (r) {
    if (r.managerEmpNo && !seenNo[r.managerEmpNo] && !existingByNo[r.managerEmpNo]) errors.push({ row: r._line, field: 'managerEmpNo', code: 'unknown_manager' });
  });
  // Cycles through the file's own managers, falling back to existing managers for people not in the file.
  function mgrOf(no) {
    if (no in fileMgr) return fileMgr[no];
    var ex = existingByNo[no], m = ex && ex.managerId && ctx.emps[ex.managerId];
    return m ? String(m.empNo).trim() : '';
  }
  plan.forEach(function (r) {
    if (!r.managerEmpNo || r.managerEmpNo === r.empNo) return;
    for (var cur = r.managerEmpNo, i = 0; cur && i < 60; cur = mgrOf(cur), i++) {
      if (cur === r.empNo) { errors.push({ row: r._line, field: 'managerEmpNo', code: 'manager_cycle' }); break; }
    }
  });
  var create = plan.filter(function (r) { return !existingByNo[r.empNo]; }).length;
  return { errors: errors, plan: plan, existingByNo: existingByNo, deptNames: deptNames, posNames: posNames, newDepts: newDepts, newPos: newPos,
    summary: { rows: plan.length, create: create, update: plan.length - create, departments: Object.keys(newDepts).length, positions: Object.keys(newPos).length } };
}

function api_hrImportValidate(req, me) {
  var v = validateImport_(req.rows, orgCtx_(), me);
  return { ok: true, errors: v.errors, summary: v.summary };
}

var IMPORT_JOB = ['gender', 'workLocation', 'contractType', 'contractEnd', 'probationEnd', 'contractNo', 'occupationCode',
  'employmentType', 'workDaysPerWeek', 'dailyHours', 'annualLeaveDays', 'noticeDays'];
var IMPORT_PRIV = ['nationalId', 'idExpiry', 'birthDate', 'bankName', 'gosiNumber', 'gosiCohort', 'borderNo', 'passportNo',
  'passportExpiry', 'nationalAddress', 'personalEmail', 'nameEnOfficial', 'maritalStatus', 'emergencyName', 'emergencyPhone'];

/** All or nothing: the server re-validates the whole file inside the lock and writes nothing if one row is wrong. */
function api_hrImportCommit(req, me) {
  return withLock_(function () {
    var ctx = orgCtx_(), v = validateImport_(req.rows, ctx, me);
    if (v.errors.length) return { ok: false, error: 'import_invalid', errors: v.errors };
    var now = new Date().toISOString(), batch = newId_('B'), t = today_();
    var newDeptRows = [], newPosRows = [];
    Object.keys(v.newDepts).forEach(function (dn) {
      var d = { id: newId_('D'), code: '', nameAr: v.newDepts[dn], nameEn: '', parentId: '', headEmpId: '', costCenter: '', status: 'active', createdAt: now, updatedAt: now };
      v.deptNames[dn] = d.id; newDeptRows.push(d);
    });
    Object.keys(v.newPos).forEach(function (pn) {
      var p = { id: newId_('J'), code: '', titleAr: v.newPos[pn].title, titleEn: '', departmentId: v.deptNames[v.newPos[pn].dept] || '', grade: '', status: 'active', createdAt: now, updatedAt: now };
      POS_TEXT.forEach(function (k) { p[k] = ''; });
      v.posNames[pn] = p.id; newPosRows.push(p);
    });
    var idByNo = {}, newEmps = [], updEmps = [];
    v.plan.forEach(function (r) {
      var e = v.existingByNo[r.empNo];
      if (!e) { e = { id: newId_('E'), empNo: r.empNo, role: 'employee', status: 'active', tokenVer: 0, actHash: '', actExp: '', actTries: 0, createdAt: now, zoneIds: '', shiftStart: '', shiftEnd: '', workdays: '', extraRoles: '', title: '' }; newEmps.push(e); }
      else updEmps.push(e);
      idByNo[r.empNo] = e.id;
      e._before = { departmentId: e.departmentId, positionId: e.positionId, managerId: e.managerId };
      e.name = r.nameAr; if (r.nameEn) e.nameEn = r.nameEn; if (r.email) e.email = r.email; if (r.phone) e.phone = String(r.phone);
      e.departmentId = v.deptNames[normName_(r.department)]; e.department = r.department;
      e.positionId = v.posNames[normName_(r.position)]; e.title = r.position;
      e.hireDate = r.hireDate; e.nationality = r.nationality; e.isSaudi = r.isSaudi;
      IMPORT_JOB.forEach(function (k) { if (r[k] !== undefined && r[k] !== '') e[k] = r[k]; });
      e.updatedAt = now; e._r = r;
    });
    Object.keys(v.existingByNo).forEach(function (no) { if (!idByNo[no]) idByNo[no] = v.existingByNo[no].id; });
    var all = newEmps.concat(updEmps);
    all.forEach(function (e) { e.managerId = e._r.managerEmpNo ? idByNo[e._r.managerEmpNo] : (e.managerId || ''); });
    var jobRows = [], compRows = [], privNew = [], privUpd = [], privByEmp = {};
    readAll_(SHEETS.PRIV).forEach(function (p) { privByEmp[p.empId] = p; });
    var compNow = currentCompMap_(t), pendingByEmp = {};
    readAll_(SHEETS.COMP).forEach(function (c) { if (c.status === 'pending') pendingByEmp[c.empId] = compView_(c); });
    all.forEach(function (e) {
      var r = e._r, b = e._before;
      if (b.departmentId !== e.departmentId || b.positionId !== e.positionId || b.managerId !== e.managerId) {
        jobRows.push({ id: newId_('H'), empId: e.id, effectiveFrom: v.existingByNo[r.empNo] ? t : r.hireDate, departmentId: e.departmentId,
          positionId: e.positionId, managerId: e.managerId, grade: '', reason: 'import', enteredBy: me.id, createdAt: now });
      }
      // A salary line only when the package differs from the one in force and from one already waiting.
      var same = function (c) { return c && c.basic === r.basic && c.housing === r.housing && c.transport === r.transport; };
      if (!same(compNow[e.id]) && !same(pendingByEmp[e.id])) {
        compRows.push(compRowFrom_({ empId: e.id, effectiveFrom: r.hireDate > t ? r.hireDate : t, basic: r.basic, housing: r.housing, transport: r.transport, reason: 'import', batchId: batch }, me.id));
      }
      var p = privByEmp[e.id] || { empId: e.id };
      IMPORT_PRIV.forEach(function (k) { if (r[k] !== undefined && r[k] !== '') p[k] = typeof r[k] === 'number' ? r[k] : String(r[k]); });
      if (r.iban) p.iban = String(r.iban).replace(/\s+/g, '').toUpperCase();
      p.updatedAt = now;
      if (privByEmp[e.id]) privUpd.push(p); else privNew.push(p);
      delete e._r; delete e._before;
    });
    appendMany_(SHEETS.DEPT, newDeptRows);
    appendMany_(SHEETS.POS, newPosRows);
    updateMany_(SHEETS.EMP, updEmps);
    appendMany_(SHEETS.EMP, newEmps);
    updateMany_(SHEETS.PRIV, privUpd);
    appendMany_(SHEETS.PRIV, privNew);
    appendMany_(SHEETS.JOBH, jobRows);
    appendMany_(SHEETS.COMP, compRows);
    audit_(me.id, 'hr_import', batch, { created: newEmps.length, updated: updEmps.length, departments: newDeptRows.length, positions: newPosRows.length, salaries: compRows.length });
    return { ok: true, created: newEmps.length, updated: updEmps.length, departments: newDeptRows.length, positions: newPosRows.length,
      compBatch: batch, pendingSalaries: compRows.length };
  });
}

// ---------------- the employee's own file ----------------

function api_myFile(req, me) {
  var ctx = orgCtx_(), file = buildFile_(me, ctx.emps[me.id] || me, ctx);
  var team = Object.keys(ctx.emps).filter(function (k) { return ctx.emps[k].status === 'active' && manages_(me, ctx.emps[k], ctx); });
  file.isManager = team.length > 0;
  file.teamCount = team.length;
  file.roles = { hr: isHr_(me), payroll: hasRole_(me, 'payroll'), admin: me.role === 'admin' };
  return { ok: true, file: file };
}
