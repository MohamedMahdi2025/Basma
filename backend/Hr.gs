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

/**
 * Extra roles. An administrator also holds payroll while the setting adminSeesPay is on (default): the owner runs
 * everything. A company that wants pay kept apart from system administration switches it off; the two-person rules
 * (nobody approves what they prepared, proposed or own) apply either way.
 */
function hasRole_(e, role) {
  if (!e) return false;
  if (e.role === role || trimList_(e.extraRoles).indexOf(role) >= 0) return true;
  return role === 'payroll' && adminPay_(e);
}
/** The administrator while the setting adminSeesPay is on (the default): the owner who runs pay as well. */
function adminPay_(e) { return !!e && e.role === 'admin' && settings_().adminSeesPay !== false; }
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
  if (typeof whTap_ === 'function') objs.forEach(function (o) { whTap_(name, o, false); });
  bumpTab_(name);
  var sh = sheet_(name);
  ensureHeader_(name, sh);
  sh.getRange(lo, 1, block.length, width).setValues(block);
}

// ---------------- departments ----------------

function codesOf_(rows, key) { var o = {}; rows.forEach(function (r) { var v = r[key || 'code']; if (v) o[String(v).toUpperCase()] = 1; }); return o; }
/** Numbers already in a tab: a new number never repeats one, even if rows came in by hand. */
function refsOf_(name) { return codesOf_(readAll_(name), 'ref'); }

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
    row.code = str_(d.code, 20) || row.code || nextRef_('department', codesOf_(all)); row.nameAr = nameAr; row.nameEn = str_(d.nameEn, 80); row.parentId = parentId;
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
    row.code = str_(d.code, 20) || row.code || nextRef_('position', codesOf_(readAll_(SHEETS.POS))); row.titleAr = titleAr; row.titleEn = str_(d.titleEn, 80);
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
  var roles = trimList_(req.extraRoles).filter(function (r) { return r === 'payroll' || r === 'executive' || r === 'hse'; });
  if (String(req.id) === String(me.id)) fail_('cannot_change_own_roles'); // nobody grants or removes their own rights
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
  'personalEmail', 'nameEnOfficial', 'gosiWage'];
var PRIV_DATES = { idExpiry: 1, birthDate: 1, passportExpiry: 1 };

function api_hrPrivateSave(req, me) {
  var d = req.priv || {};
  if ('iban' in d && d.iban && !validIban_(d.iban)) fail_('bad_iban');
  if ('nationalId' in d && d.nationalId && !validNationalId_(d.nationalId)) fail_('bad_national_id');
  Object.keys(PRIV_DATES).forEach(function (k) { if (d[k] && !isoDate_(d[k])) fail_('bad_date'); });
  if ('gosiCohort' in d && d.gosiCohort && ['legacy', 'new'].indexOf(d.gosiCohort) < 0) fail_('bad_value');
  if ('personalEmail' in d && d.personalEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.personalEmail)) fail_('bad_email');
  if ('borderNo' in d && d.borderNo && !/^\d{10}$/.test(String(d.borderNo))) fail_('bad_value');
  // the wage registered with GOSI (from the GOSI portal) when it is not basic + housing; empty = use the package
  if ('gosiWage' in d && d.gosiWage !== '' && d.gosiWage != null && !(Number(d.gosiWage) >= 400 && Number(d.gosiWage) <= 1000000)) fail_('bad_value');
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

/** The HR console's lists in one round trip (was three calls of about two seconds each). */
function api_hrBootstrap(req, me) {
  var d = api_hrDirectory(req, me);
  return { ok: true, rows: d.rows, saudization: d.saudization, depts: api_hrDeptList().rows, positions: api_hrPositionList().rows };
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
    o.contractType = e.contractType || ''; o.contractEnd = e.contractEnd || ''; o.gender = e.gender || ''; o.lastWorkingDay = e.lastWorkingDay || '';
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
    status: c.status, reason: c.reason, enteredBy: c.enteredBy, approvedBy: c.approvedBy, batchId: c.batchId || '', ref: c.ref || '' };
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

/** Packages are seen, proposed and decided only by the hr role or a payroll holder; an administrator alone never. */
function canProposeComp_(me) { return me.role === 'hr' || hasRole_(me, 'payroll'); }
function canDecideComp_(me) { return me.role === 'hr' || hasRole_(me, 'payroll'); }

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
    approvedAt: '', status: 'pending', createdAt: new Date().toISOString(), batchId: d.batchId || '', ref: d.ref || '' };
}

function api_hrCompPropose(req, me) {
  if (!canProposeComp_(me)) fail_('forbidden');
  if (req.empId === me.id) fail_('cannot_change_own_salary');
  return withLock_(function () {
    if (!findBy_(SHEETS.EMP, 'id', req.empId)) fail_('not_found');
    var row = compRowFrom_(req, me.id);
    row.ref = nextRef_('salary', refsOf_(SHEETS.COMP));
    append_(SHEETS.COMP, row);
    audit_(me.id, 'comp_propose', req.empId, { ref: row.ref, effectiveFrom: row.effectiveFrom });
    var emp = findBy_(SHEETS.EMP, 'id', req.empId), band = typeof bandOf_ === 'function' ? bandOf_(gradeOfPosition_(emp.positionId), compView_(row)) : null; // Wave5.gs
    return { ok: true, comp: compView_(row), band: band };
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
  return { id: x.id, ref: x.ref || '', empId: x.empId, type: x.type, number: String(x.number || ''), issueDate: x.issueDate, expiryDate: x.expiryDate,
    note: x.note, status: x.status, hasFile: !!x.fileId, fileName: x.fileName || '', fileSize: Number(x.fileSize) || 0 };
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
    if (!row) row = { id: newId_('F'), empId: empId, createdAt: now, ref: nextRef_('document', refsOf_(SHEETS.DOCS)) };
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

var IMPORT_REQUIRED = ['nameAr', 'department', 'position', 'hireDate', 'nationality', 'nationalId', 'basic'];
var IMPORT_DATES = ['hireDate', 'idExpiry', 'birthDate', 'contractEnd', 'probationEnd', 'passportExpiry', 'leaveOpeningDate'];

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
    if (!r.empNo) { if (!ctx.autoNos) ctx.autoNos = nextEmpNos_(rows.length, Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; })); r.empNo = ctx.autoNos[ctx.autoUsed = (ctx.autoUsed || 0) + 1, ctx.autoUsed - 1]; r._autoNo = true; }
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
    if (r.leaveOpeningDays !== undefined && r.leaveOpeningDays !== '') {
      var od = num_(r.leaveOpeningDays);
      if (!(od >= -60 && od <= 365)) e('leaveOpeningDays', 'bad_value'); else r.leaveOpeningDays = od;
      if (!r.leaveOpeningDate) e('leaveOpeningDate', 'required');
    }
    if (r.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)) e('email', 'bad_email');
    if (r.personalEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.personalEmail)) e('personalEmail', 'bad_email');
    if (r.gosiCohort && ['legacy', 'new'].indexOf(r.gosiCohort) < 0) e('gosiCohort', 'bad_value');
    if (r.gosiWage !== undefined && r.gosiWage !== '' && !(Number(r.gosiWage) >= 400 && Number(r.gosiWage) <= 1000000)) e('gosiWage', 'bad_value');
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

var IMPORT_JOB = ['leaveOpeningDays', 'leaveOpeningDate', 'gender', 'workLocation', 'contractType', 'contractEnd', 'probationEnd', 'contractNo', 'occupationCode',
  'employmentType', 'workDaysPerWeek', 'dailyHours', 'annualLeaveDays', 'noticeDays'];
var IMPORT_PRIV = ['nationalId', 'idExpiry', 'birthDate', 'bankName', 'gosiNumber', 'gosiCohort', 'borderNo', 'passportNo',
  'passportExpiry', 'nationalAddress', 'personalEmail', 'nameEnOfficial', 'maritalStatus', 'emergencyName', 'emergencyPhone', 'gosiWage'];

/** All or nothing: the server re-validates the whole file inside the lock and writes nothing if one row is wrong. */
function api_hrImportCommit(req, me) {
  return withLock_(function () {
    var ctx = orgCtx_(), v = validateImport_(req.rows, ctx, me);
    if (v.errors.length) return { ok: false, error: 'import_invalid', errors: v.errors };
    var now = new Date().toISOString(), batch = '', t = today_();
    var newDeptRows = [], newPosRows = [];
    // Codes (DEP-, POS-, IMP-) are reserved only after the last check below, so a refused import leaves no gap.
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
    // Salary lines are packages: an administrator without the hr role or payroll may not write them. Nothing is written yet.
    if (compRows.length && !canProposeComp_(me)) fail_('forbidden');
    var deptCodes = nextRefs_('department', newDeptRows.length, codesOf_(readAll_(SHEETS.DEPT)));
    var posCodes = nextRefs_('position', newPosRows.length, codesOf_(readAll_(SHEETS.POS)));
    newDeptRows.forEach(function (d, i) { d.code = deptCodes[i] || ''; });
    newPosRows.forEach(function (p, i) { p.code = posCodes[i] || ''; });
    batch = nextRef_('import');
    compRows.forEach(function (c) { c.batchId = batch; });
    appendMany_(SHEETS.DEPT, newDeptRows);
    appendMany_(SHEETS.POS, newPosRows);
    updateMany_(SHEETS.EMP, updEmps);
    appendMany_(SHEETS.EMP, newEmps);
    updateMany_(SHEETS.PRIV, privUpd);
    appendMany_(SHEETS.PRIV, privNew);
    appendMany_(SHEETS.JOBH, jobRows);
    var salRefs = nextRefs_('salary', compRows.length, refsOf_(SHEETS.COMP));
    compRows.forEach(function (c, i) { c.ref = salRefs[i]; });
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
  file.roles = { hr: isHr_(me), payroll: hasRole_(me, 'payroll'), executive: hasRole_(me, 'executive'), hse: hasRole_(me, 'hse'), admin: me.role === 'admin' };
  return { ok: true, file: file };
}


// ======================================================================= custom fields (Wave 3, 2026-10-18)
// HR defines extra fields (text, number, date, select, yes/no) and who may see them: hr (HR only), manager (HR and the
// person's managers), employee (also the person, read-only). Values are written by HR only, never on their own file.
var CF_TYPES = ['text', 'number', 'date', 'select', 'bool'];
var CF_VIS = ['hr', 'manager', 'employee'];
function cfFields_(all) { return readAll_(SHEETS.CFD).filter(function (f) { return all || f.status !== 'disabled'; }).sort(function (a, b) { return (Number(a.order) || 0) - (Number(b.order) || 0); }); }
function cfPublic_(f) { return { id: f.id, key: f.key, labelAr: f.labelAr, labelEn: f.labelEn, type: f.type, options: parseJson_(f.optionsJson, []), visibleTo: f.visibleTo, status: f.status, order: Number(f.order) || 0 }; }
/** Which fields a viewer may read on an employee's file. */
function cfVisible_(me, emp, ctx, f) {
  if (isHr_(me)) return true;
  if (f.visibleTo === 'employee' && emp.id === me.id) return true;
  return (f.visibleTo === 'manager' || f.visibleTo === 'employee') && emp.id !== me.id && manages_(me, emp, ctx);
}
function cfClean_(f, v) {
  if (v === null || v === undefined || v === '') return '';
  if (f.type === 'number') { var n = Number(v); if (!isFinite(n)) fail_('bad_value'); return n; }
  if (f.type === 'date') { var d = isoDate_(v); if (!d) fail_('bad_date'); return d; }
  if (f.type === 'bool') return v === true || v === 'true' || v === 'yes' ? 'yes' : 'no';
  if (f.type === 'select') { if (parseJson_(f.optionsJson, []).indexOf(String(v)) < 0) fail_('bad_value'); return String(v); }
  return str_(v, 300);
}
function api_customFieldList(req, me) {
  return { ok: true, fields: cfFields_(isHr_(me) && req.all).filter(function (f) { return isHr_(me) || f.visibleTo !== 'hr'; }).map(cfPublic_), types: CF_TYPES, canEdit: isHr_(me) };
}
function api_customFieldSave(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var d = req.field || {}, labelAr = str_(d.labelAr, 80);
  if (!labelAr) fail_('missing_fields');
  if (CF_TYPES.indexOf(d.type) < 0 || CF_VIS.indexOf(d.visibleTo) < 0) fail_('bad_value');
  var opts = (Array.isArray(d.options) ? d.options : String(d.options || '').split(/[,،\n]/)).map(function (o) { return str_(o, 60); }).filter(Boolean).slice(0, 40);
  if (d.type === 'select' && opts.length < 2) fail_('missing_fields');
  return withLock_(function () {
    var all = readAll_(SHEETS.CFD), f = d.id ? findBy_(SHEETS.CFD, 'id', d.id) : null, now = new Date().toISOString();
    if (d.id && !f) fail_('not_found');
    if (f && f.type !== d.type && readAll_(SHEETS.CFV).some(function (v) { return v.fieldId === f.id && v.value !== ''; })) fail_('bad_request'); // a used field keeps its type
    var fresh = !f;
    if (!f) f = { id: newId_('F'), key: 'cf' + (all.length + 1), order: all.length + 1, createdAt: now };
    f.labelAr = labelAr; f.labelEn = str_(d.labelEn, 80); f.type = d.type; f.optionsJson = JSON.stringify(d.type === 'select' ? opts : []); f.visibleTo = d.visibleTo;
    f.status = d.status === 'disabled' ? 'disabled' : 'active'; f.updatedAt = now;
    if (fresh) append_(SHEETS.CFD, f); else update_(SHEETS.CFD, f);
    audit_(me.id, fresh ? 'custom_field_create' : 'custom_field_update', '', { key: f.key, type: f.type, visibleTo: f.visibleTo });
    return { ok: true, field: cfPublic_(f) };
  });
}
function api_customValuesGet(req, me) {
  var ctx = orgCtx_(), emp = ctx.emps[req.empId || me.id];
  if (!emp) fail_('not_found');
  var vals = {}; readAll_(SHEETS.CFV).forEach(function (v) { if (v.empId === emp.id) vals[v.fieldId] = v.value; });
  var out = cfFields_(false).filter(function (f) { return cfVisible_(me, emp, ctx, f); }).map(function (f) { var o = cfPublic_(f); o.value = vals[f.id] === undefined ? '' : vals[f.id]; return o; });
  if (!out.length && emp.id !== me.id && !isHr_(me) && !manages_(me, emp, ctx)) fail_('forbidden');
  return { ok: true, empId: emp.id, fields: out, canEdit: isHr_(me) && emp.id !== me.id };
}
function api_customValuesSave(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  if (req.empId === me.id) fail_('cannot_decide_own');
  var values = req.values || {};
  return withLock_(function () {
    var ctx = orgCtx_(), emp = ctx.emps[req.empId], now = new Date().toISOString(), defs = {};
    if (!emp) fail_('not_found');
    cfFields_(true).forEach(function (f) { defs[f.id] = f; });
    var have = {}; readAll_(SHEETS.CFV).forEach(function (v) { if (v.empId === emp.id) have[v.fieldId] = v; });
    var changed = [];
    Object.keys(values).forEach(function (fid) {
      var f = defs[fid]; if (!f) fail_('not_found');
      var v = cfClean_(f, values[fid]), row = have[fid];
      if (row) { if (String(row.value) === String(v)) return; row.value = v; row.updatedBy = me.id; row.updatedAt = now; update_(SHEETS.CFV, row); }
      else { if (v === '') return; append_(SHEETS.CFV, { id: newId_('V'), empId: emp.id, fieldId: fid, value: v, updatedBy: me.id, updatedAt: now }); }
      changed.push(f.key);
    });
    audit_(me.id, 'custom_values_save', emp.id, { fields: changed });
    return { ok: true, changed: changed.length };
  });
}
/** Every value of every active employee (HR): the report builder joins them to the directory. */
function api_customValuesAll(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var by = {}; readAll_(SHEETS.CFV).forEach(function (v) { (by[v.empId] = by[v.empId] || {})[v.fieldId] = v.value; });
  return { ok: true, fields: cfFields_(false).map(cfPublic_), values: by };
}


// ======================================================================= search across records (2026-10-18)
// DESIGN CHOICE, after Microsoft Sticky Notes' visible behaviour: the whole text of a record is searched, as the user types,
// and the matched words come back with a snippet so the palette can highlight them. Not reverse-engineered (the Sticky Notes
// installed on the build machine is only a Store install stub). Every source applies the rule the app already uses to show
// that record, so search never reveals anything the caller could not open: own requests and those they can act on, the
// announcements addressed to them, their own help-desk tickets and the queues they handle, active courses, documents (own;
// HR all), and recruitment for HR only. At most SEARCH_PER_GROUP results per source.
var SEARCH_PER_GROUP = 5;
function searchNorm_(s) { return String(s == null ? '' : s).toLowerCase().replace(/[\u064B-\u0652\u0640]/g, '').replace(/[\u0623\u0625\u0622]/g, '\u0627').replace(/\u0629/g, '\u0647').replace(/\u0649/g, '\u064A'); }
/** A short piece of the original text around the first match (by normalised position), or '' when the text has no match. */
function searchSnippet_(text, q) {
  var src = String(text == null ? '' : text), n = '', map = [];
  for (var i = 0; i < src.length; i++) { var c = searchNorm_(src.charAt(i)); for (var k = 0; k < c.length; k++) { n += c.charAt(k); map.push(i); } }
  var at = n.indexOf(q);
  if (at < 0) return '';
  var from = map[at], to = map[Math.min(n.length - 1, at + q.length - 1)] + 1, a = Math.max(0, from - 40), b = Math.min(src.length, to + 60);
  return (a > 0 ? '…' : '') + src.slice(a, b).replace(/\s+/g, ' ') + (b < src.length ? '…' : '');
}
function api_searchAll(req, me) {
  var q = searchNorm_(String(req.q || '').trim()).slice(0, 60);
  if (q.length < 2) return { ok: true, q: q, groups: [] };
  var ctx = orgCtx_(), hr = isHr_(me), groups = [];
  var hit = function (fields) { for (var i = 0; i < fields.length; i++) { var s = searchSnippet_(fields[i], q); if (s) return s; } return ''; };
  var add = function (key, items) { if (items.length) groups.push({ key: key, items: items.slice(0, SEARCH_PER_GROUP), more: items.length > SEARCH_PER_GROUP }); };
  // requests: mine, and those waiting for my step
  add('requests', readAll_(SHEETS.REQ).filter(function (r) { return r.empId === me.id || canAct_(me, r, ctx.emps[r.empId], ctx); })
    .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).map(function (r) {
      var e = ctx.emps[r.empId], s = hit([r.ref, r.reason, r.subtype, r.type, e && r.empId !== me.id ? e.name : '']);
      return s ? { ref: r.ref, kind: r.type, sub: r.subtype, status: r.status, who: r.empId !== me.id && e ? e.name : '', snippet: s, dest: { area: 'requests', sub: 'view', arg: r.id } } : null;
    }).filter(Boolean));
  // announcements addressed to me (HR also searches drafts on the announcements page, not here)
  add('announcements', (typeof annMine_ === 'function' ? annMine_(me, ctx) : []).map(function (a) {
    var s = hit([a.titleAr, a.titleEn, a.bodyAr, a.bodyEn, a.ref]);
    return s ? { ref: a.ref, title: a.titleAr, titleEn: a.titleEn, snippet: s, dest: { area: 'profile', sub: 'main' } } : null;
  }).filter(Boolean));
  // help desk: my own tickets, and the queues I handle (never someone else's confidential ticket outside my queue)
  if (SHEETS.HDT) add('helpdesk', readAll_(SHEETS.HDT).filter(function (x) { return x.empId === me.id || (typeof hdCanWork_ === 'function' && hdCanWork_(me, x)); })
    .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).map(function (x) {
      var own = x.empId === me.id, s = hit([x.subject, x.body, x.ref]);
      return s ? { ref: x.ref, title: x.subject, status: x.status, snippet: s, dest: own ? { area: 'profile', sub: 'main' } : { area: 'requests', sub: 'helpdesk' } } : null;
    }).filter(Boolean));
  // training courses (the catalogue everyone may browse)
  if (SHEETS.COURSE) add('courses', readAll_(SHEETS.COURSE).filter(function (c) { return c.status === 'active'; }).map(function (c) {
    var s = hit([c.titleAr, c.titleEn, c.code, c.provider]);
    return s ? { ref: c.code, title: c.titleAr, titleEn: c.titleEn, snippet: s, dest: hr || managesAnyone_(me, ctx) ? { area: 'growth', sub: 'training' } : { area: 'profile', sub: 'main' } } : null;
  }).filter(Boolean));
  // documents: my own; HR (and the administrator) all — never a manager (Hr.gs buildFile_ rule)
  add('documents', readAll_(SHEETS.DOCS).filter(function (d) { return d.status !== 'deleted' && (d.empId === me.id || hr); }).map(function (d) {
    var e = ctx.emps[d.empId], s = hit([d.number, d.type, d.note, d.ref, e && d.empId !== me.id ? e.name : '']);
    return s ? { ref: d.ref || d.number, kind: d.type, who: e && d.empId !== me.id ? e.name : '', snippet: s, expiry: String(d.expiryDate || '').slice(0, 10),
      dest: d.empId === me.id ? { area: 'profile', sub: 'main' } : { area: 'people', sub: 'directory', empId: d.empId } } : null;
  }).filter(Boolean));
  // recruitment: HR only (contact data stays out of results)
  if (hr && SHEETS.REQN) {
    add('requisitions', readAll_(SHEETS.REQN).map(function (r) { var s = hit([r.titleAr, r.titleEn, r.ref, r.justification]); return s ? { ref: r.ref, title: r.titleAr, titleEn: r.titleEn, status: r.status, snippet: s, dest: { area: 'people', sub: 'recruitment' } } : null; }).filter(Boolean));
    add('candidates', readAll_(SHEETS.CAND).filter(function (c) { return c.stage !== 'erased'; }).map(function (c) { var s = hit([c.name, c.nameEn, c.ref, c.currentTitle, c.currentEmployer]); return s ? { ref: c.ref, title: c.name, status: c.stage, snippet: s, dest: { area: 'people', sub: 'recruitment' } } : null; }).filter(Boolean));
  }
  return { ok: true, q: q, groups: groups };
}

// ---------------- document attachments (2026-10-20; switched on by the owner) ----------------
/**
 * A scan (PDF, JPG, PNG, WebP up to 5 MB) attached to a document record, stored in Google Drive in a folder the app
 * creates. Least access: the drive.file scope only lets the app see files it created itself. Files are never shared by
 * link; they reach people only through docFile, with the same rules as the record (the person themself, HR). Every view
 * is audited. Off until: setting attachmentsEnabled = true, and the drive.file + script.external_request scopes are in
 * appsscript.json and authorised once by the owner. Until then both actions answer attachments_off.
 */
var ATTACH_TYPES_ = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
var ATTACH_MAX_ = 5 * 1024 * 1024;
function attachOn_() { var s = settings_(); return s.attachmentsEnabled === true || String(s.attachmentsEnabled) === 'true'; }
function driveCall_(method, url, opts) {
  var r;
  try {
    r = UrlFetchApp.fetch(url, Object.assign({ method: method, muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } }, opts || {}));
  } catch (e) { fail_('attachments_off'); } // no external-request scope yet
  var code = r.getResponseCode();
  if (code === 401 || code === 403) fail_('attachments_off'); // no drive.file scope yet
  if (code >= 300) fail_('attachment_failed');
  return r;
}
function driveFolder_() {
  var p = PropertiesService.getScriptProperties(), id = p.getProperty(orgKey_('DRIVE_FOLDER_ID')); // one folder per organisation
  if (id) return id;
  var r = driveCall_('post', 'https://www.googleapis.com/drive/v3/files?fields=id', { contentType: 'application/json', payload: JSON.stringify({ name: 'HR documents (attendance system)', mimeType: 'application/vnd.google-apps.folder' }) });
  id = JSON.parse(r.getContentText()).id; p.setProperty(orgKey_('DRIVE_FOLDER_ID'), id);
  return id;
}
function canSeeDoc_(me, row) { return !!row && (row.empId === me.id || isHr_(me)); }
function api_docUpload(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  if (!attachOn_()) fail_('attachments_off');
  var mime = String(req.mime || ''), ext = ATTACH_TYPES_[mime];
  if (!ext) fail_('bad_file_type');
  var bytes;
  try { bytes = Utilities.base64Decode(String(req.data || '')); } catch (e) { fail_('bad_value'); }
  if (!bytes.length || bytes.length > ATTACH_MAX_) fail_('file_too_big');
  return withLock_(function () {
    var row = findBy_(SHEETS.DOCS, 'id', req.docId);
    if (!row || row.status === 'deleted') fail_('not_found');
    var emp = findBy_(SHEETS.EMP, 'id', row.empId) || {}, name = String(emp.empNo || 'x') + '-' + row.type + '-' + (row.ref || row.id) + '.' + ext;
    var boundary = 'bgatt' + newId_(''), meta = JSON.stringify({ name: name, parents: [driveFolder_()] });
    var head = '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + meta + '\r\n--' + boundary + '\r\nContent-Type: ' + mime + '\r\n\r\n';
    var payload = Utilities.newBlob(head).getBytes().concat(bytes).concat(Utilities.newBlob('\r\n--' + boundary + '--').getBytes());
    var r = driveCall_('post', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { contentType: 'multipart/related; boundary=' + boundary, payload: payload });
    var newId = JSON.parse(r.getContentText()).id, old = row.fileId;
    row.fileId = newId; row.fileName = name; row.fileMime = mime; row.fileSize = bytes.length; row.fileAt = new Date().toISOString(); row.fileBy = me.id; row.updatedAt = row.fileAt;
    update_(SHEETS.DOCS, row);
    if (old) { try { driveCall_('delete', 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(old)); } catch (e) {} }
    audit_(me.id, 'doc_attach', row.empId, { ref: row.ref, size: bytes.length, replaced: !!old });
    return { ok: true, doc: publicDoc_(row) };
  });
}
function api_docFile(req, me) {
  var row = findBy_(SHEETS.DOCS, 'id', req.docId);
  if (!canSeeDoc_(me, row) || row.status === 'deleted') fail_('not_found');
  if (!row.fileId) fail_('no_attachment');
  if (!attachOn_()) fail_('attachments_off');
  var r = driveCall_('get', 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(row.fileId) + '?alt=media');
  audit_(me.id, 'doc_view', row.empId, { ref: row.ref });
  return { ok: true, name: row.fileName, mime: row.fileMime, data: Utilities.base64Encode(r.getBlob().getBytes()) };
}
