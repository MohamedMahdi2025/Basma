# HR Phase 1 — People Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Best Gas one employee master (departments, positions with JDs, reporting lines, private file, effective-dated salary package), a validated Excel import, the employee's own "ملفي" tab, and a desktop HR console — all role-filtered on the server.

**Architecture:** A new `backend/Hr.gs` beside the attendance backend, sharing its sheet helpers, tokens, lock and audit. Role checks are computed on the server (manager and department head derive from the org; `payroll` is an extra role). The client gains two lazily loaded files, `js/my-file.js` and `js/hr-console.js`, so the check-in screen stays as it is.

**Tech Stack:** Google Apps Script (V8) + Google Sheet; vanilla JS client on GitHub Pages; SheetJS (cdnjs `xlsx` 0.18.5) in the browser for Excel; Node `vm` harness for tests.

**Spec:** `docs/superpowers/specs/2026-09-30-hr-system-design.md`

## Global Constraints

- One employee record for attendance and HR; the check-in tab does not change.
- No new Google scopes in Phase 1 (`spreadsheets.currentonly` only).
- Salary is visible to: the employee (own), HR, payroll. Admin sees salaries only when also holding `payroll`. Managers and department heads never see salaries.
- Every salary read by someone other than the employee is audited (`salary_view`).
- A compensation change needs a second person: proposer ≠ approver; approver holds `payroll` or is `admin`.
- Effective-dated tables (`compensation`, `jobHistory`) are append-only.
- No religion or health data stored.
- Import is all-or-nothing and the server re-validates every row.
- Arabic-first, English toggle; no em or en dashes in UI text; tabular numerals.
- Real employee data never enters the git repo.

## Review Focus

1. **Manager loops** — an import or edit that makes A manage B and B manage A must be refused (`manager_cycle`), otherwise the org walk never ends. Test in Task 3 and Task 5.
2. **Same person twice in the Excel file** (duplicate employee number or national ID) — refused with the row numbers of both. Test in Task 5.
3. **Salary leak through the team view** — a manager opening a report's file must get no compensation fields at all, not empty ones. Test in Task 3.
4. **Future-dated salary** — a raise effective next month must not show as current today. Test in Task 4.
5. **Arabic names and Excel dates** — Excel serial dates and `dd/mm/yyyy` text must both normalise to `YYYY-MM-DD`; Arabic text must survive the round trip. Test in Task 5 (server) and Task 8 (client parse).

---

## File structure

| File | Responsibility |
|---|---|
| `backend/Code.gs` (modify) | New sheet names and headers, `extraRoles` column, `appendMany_`, action maps |
| `backend/Hr.gs` (create) | Roles/access helpers, departments, positions, employee file, private file, compensation, import, `myFile` |
| `tests/harness.js` (modify) | Load `Hr.gs` |
| `tests/hr.js` (create) | HR checks; `node tests/hr.js` |
| `js/my-file.js` (create) | "ملفي" tab rendering |
| `js/hr-console.js` (create) | HR console at `#hr`: people, organisation, positions, approvals, import |
| `index.html` (modify) | "ملفي" tab, `#hr` route, lazy script loader |
| `sw.js` (modify) | Cache the two new files |

---

### Task 1: Schema, roles and access helpers

**Files:**
- Modify: `backend/Code.gs` (SHEETS, HEADERS, action maps, new `appendMany_`)
- Create: `backend/Hr.gs` (access helpers only in this task)
- Modify: `tests/harness.js:65`
- Create: `tests/hr.js`

**Interfaces:**
- Produces: `hasRole_(emp, role) -> bool`, `isHr_(emp) -> bool` (hr or admin), `canSeeSalary_(me, emp) -> bool`, `manages_(me, emp, ctx) -> bool`, `orgCtx_() -> { emps:{id:emp}, depts:{id:dept} }`, `appendMany_(sheetName, objs)`, `today_() -> 'YYYY-MM-DD'`.

- [ ] **Step 1: Extend schema in `Code.gs`**

```js
var SHEETS = { EMP: 'employees', CRED: 'credentials', ZONES: 'zones', PUNCH: 'punches', AUDIT: 'audit', SET: 'settings',
  DEPT: 'departments', POS: 'positions', PRIV: 'empPrivate', COMP: 'compensation', JOBH: 'jobHistory' };
```
Append to `HEADERS.employees` (after `'updatedAt'`):
```js
'extraRoles', 'departmentId', 'positionId', 'managerId', 'hireDate', 'contractType', 'contractEnd', 'probationEnd',
'nationality', 'isSaudi', 'gender', 'workLocation'
```
Add:
```js
departments: ['id', 'code', 'nameAr', 'nameEn', 'parentId', 'headEmpId', 'costCenter', 'status', 'createdAt', 'updatedAt'],
positions: ['id', 'code', 'titleAr', 'titleEn', 'departmentId', 'grade', 'purposeAr', 'purposeEn', 'dutiesAr', 'dutiesEn',
  'requirementsAr', 'requirementsEn', 'status', 'createdAt', 'updatedAt'],
empPrivate: ['empId', 'nationalId', 'idExpiry', 'birthDate', 'maritalStatus', 'iban', 'bankName', 'gosiNumber', 'gosiCohort',
  'address', 'emergencyName', 'emergencyPhone', 'updatedAt'],
compensation: ['id', 'empId', 'effectiveFrom', 'basic', 'housing', 'transport', 'otherJson', 'currency', 'reason',
  'enteredBy', 'approvedBy', 'approvedAt', 'status', 'createdAt', 'batchId'],
jobHistory: ['id', 'empId', 'effectiveFrom', 'departmentId', 'positionId', 'managerId', 'grade', 'reason', 'enteredBy', 'createdAt']
```
Add below `append_`:
```js
/** One write for many rows: appendRow per row is far too slow for an import. */
function appendMany_(name, objs) {
  if (!objs.length) return;
  var sh = sheet_(name);
  sh.getRange(sh.getLastRow() + 1, 1, objs.length, HEADERS[name].length).setValues(objs.map(function (o) { return toRow_(name, o); }));
}
```
Action maps (role checks for these happen inside each action, because payroll and managers are not levels):
```js
var EMP_ACTIONS = { me: 1, myHistory: 1, myFile: 1, hrEmpFile: 1, hrTeam: 1, hrCompList: 1, hrCompPropose: 1, hrCompDecide: 1 };
var HR_ACTIONS = { /* existing entries */ hrDirectory: 1, hrDeptList: 1, hrDeptSave: 1, hrPositionList: 1, hrPositionSave: 1,
  hrEmpSave: 1, hrPrivateSave: 1, hrImportValidate: 1, hrImportCommit: 1 };
```

- [ ] **Step 2: Write the failing test** — `tests/hr.js`

```js
// HR Phase 1 checks: node tests/hr.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const T0 = Date.parse('2026-10-04T04:55:00Z');
const B = load({ setupKeyHash: sha('k'), now: T0 });

// People: admin (1000), hr (3001), payroll (3002, employee + extraRoles payroll), head (5000), manager (5001), staff (5002, 5003)
const devs = {};
function person(no, name, role) {
  let r;
  if (no === '1000') r = B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no });
  else r = B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role } });
  const code = r.activationCode;
  devs[no] = new Authenticator();
  const b = B.call({ action: 'enrollBegin', empNo: no, code });
  return B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) });
}
function tok(no) { const b = B.call({ action: 'authBegin', empNo: no }); return B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token; }
function empId(no) { return B.call({ action: 'empList', token: tok('1000') }).rows.find(e => e.empNo === no).id; }

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('3002', 'الرواتب', 'employee');
person('5000', 'رئيس قسم المالية', 'employee');
person('5001', 'مدير الحسابات', 'employee');
person('5002', 'محاسب أول', 'employee');
person('5003', 'محاسب', 'employee');
B.ctx.withLock_(() => { const e = B.ctx.findBy_('employees', 'empNo', '3002'); e.extraRoles = 'payroll'; B.ctx.update_('employees', e); });

console.log('Access helpers');
{
  const E = no => B.ctx.findBy_('employees', 'empNo', no);
  ok(B.ctx.hasRole_(E('3002'), 'payroll'), 'extra role payroll is recognised');
  ok(!B.ctx.hasRole_(E('5001'), 'payroll'), 'a plain employee has no payroll role');
  ok(B.ctx.canSeeSalary_(E('3001'), E('5002')), 'HR can see salaries');
  ok(!B.ctx.canSeeSalary_(E('1000'), E('5002')), 'admin without payroll cannot see salaries');
  ok(B.ctx.canSeeSalary_(E('5002'), E('5002')), 'an employee sees their own salary');
  ok(!B.ctx.canSeeSalary_(E('5001'), E('5002')), 'a manager cannot see a report salary');
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
```
Add `'Hr.gs'` to the file list in `tests/harness.js:65`.

- [ ] **Step 3: Run test to verify it fails**

Run: `node tests/hr.js` — Expected: crash, `ENOENT ... Hr.gs` (or `hasRole_ is not a function`).

- [ ] **Step 4: Create `backend/Hr.gs` with the helpers**

```js
/**
 * HR core (Phase 1): organisation, positions, employee file, private file,
 * effective-dated compensation, Excel import, and the employee's own file.
 * Access is decided here, on the server, for every read.
 */

function today_() { return localParts_(new Date()).date; }
function trimList_(v) { return String(v || '').split(',').map(function (s) { return s.trim(); }).filter(String); }

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
```

- [ ] **Step 5: Run tests** — `node tests/hr.js` → `6 passed, 0 failed`; `node tests/run.js` → `68 passed, 0 failed`.

- [ ] **Step 6: Commit** — `git add backend/Code.gs backend/Hr.gs tests/harness.js tests/hr.js && git commit -m "HR: schema, roles and access helpers"`

---

### Task 2: Departments and positions (with JDs)

**Files:** Modify `backend/Hr.gs`, `tests/hr.js`

**Interfaces:**
- Consumes: `isHr_`, `appendMany_`, `str_` (Admin.gs), `newId_`, `withLock_`, `audit_`.
- Produces: actions `hrDeptList() -> {rows}`, `hrDeptSave({dept}) -> {dept}`, `hrPositionList() -> {rows}`, `hrPositionSave({position}) -> {position}`; helpers `publicDept_(d)`, `publicPosition_(p)`.

- [ ] **Step 1: Failing tests** (append before the summary line in `tests/hr.js`)

```js
console.log('Departments and positions');
let hrT = tok('3001');
let r = B.call({ action: 'hrDeptSave', token: hrT, dept: { nameAr: 'الإدارة المالية', nameEn: 'Finance', code: 'FIN', headEmpId: empId('5000') } });
ok(r.ok && r.dept.id, 'HR creates a department with a head', r);
const finId = r.dept.id;
r = B.call({ action: 'hrDeptSave', token: hrT, dept: { nameAr: 'الحسابات', parentId: finId } });
ok(r.ok, 'HR creates a sub-department', r);
const accId = r.dept.id;
r = B.call({ action: 'hrDeptSave', token: hrT, dept: { id: finId, nameAr: 'الإدارة المالية', parentId: accId } });
ok(!r.ok && r.error === 'dept_cycle', 'a department cannot sit under its own sub-department', r);
r = B.call({ action: 'hrDeptSave', token: hrT, dept: { nameAr: 'الإدارة المالية ' } });
ok(!r.ok && r.error === 'duplicate_name', 'duplicate department names are refused', r);
r = B.call({ action: 'hrPositionSave', token: hrT, position: { titleAr: 'محاسب', titleEn: 'Accountant', departmentId: accId, grade: 'G5',
  purposeAr: 'تسجيل القيود اليومية ومطابقة الحسابات', dutiesAr: 'إعداد القيود\nمطابقة البنوك', requirementsAr: 'بكالوريوس محاسبة' } });
ok(r.ok && r.position.id, 'HR creates a position with its job description', r);
const accountantPos = r.position.id;
r = B.call({ action: 'hrDeptList', token: tok('5002') });
ok(!r.ok && r.error === 'forbidden', 'an employee cannot list or edit the organisation', r);
```

- [ ] **Step 2: Run** `node tests/hr.js` — Expected: FAIL `unknown_action`.

- [ ] **Step 3: Implement** (append to `Hr.gs`)

```js
// ---------------- departments ----------------

function publicDept_(d) {
  return { id: d.id, code: d.code, nameAr: d.nameAr, nameEn: d.nameEn, parentId: d.parentId, headEmpId: d.headEmpId,
    costCenter: d.costCenter, status: d.status };
}
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
```

- [ ] **Step 4: Run** `node tests/hr.js` → all pass.
- [ ] **Step 5: Commit** — `git commit -am "HR: departments and positions with job descriptions"`

---

### Task 3: Employee file, job data, private data, team view

**Files:** Modify `backend/Hr.gs`, `tests/hr.js`

**Interfaces:**
- Consumes: Task 1 helpers, `publicEmp_` (Code.gs), `publicDept_`, `publicPosition_`.
- Produces: `hrEmpSave({emp:{id, departmentId, positionId, managerId, hireDate, contractType, contractEnd, probationEnd, nationality, isSaudi, gender, workLocation, effectiveFrom, reason}})`, `hrPrivateSave({empId, priv})`, `hrEmpFile({id}) -> {file}`, `hrTeam() -> {rows}`, `hrDirectory() -> {rows}`; helpers `jobFields_(e)`, `validIban_(s)`, `validNationalId_(s)`, `isoDate_(s) -> 'YYYY-MM-DD'|''`, `wouldCycle_(empId, managerId, emps) -> bool`, `buildFile_(me, emp, ctx) -> file`.
- `file` shape: `{ emp, job:{department, position, manager, head, hireDate, serviceYears, ...}, jd, priv?, comp?, compHistory?, jobHistory? }` — keys absent (not empty) when the viewer may not see them.

- [ ] **Step 1: Failing tests**

```js
console.log('Employee file and access');
const E5000 = empId('5000'), E5001 = empId('5001'), E5002 = empId('5002'), E5003 = empId('5003');
r = B.call({ action: 'hrEmpSave', token: hrT, emp: { id: E5001, departmentId: accId, managerId: E5000, hireDate: '2019-03-01' } });
ok(r.ok, 'HR sets department, manager and hire date', r);
r = B.call({ action: 'hrEmpSave', token: hrT, emp: { id: E5002, departmentId: accId, positionId: accountantPos, managerId: E5001, hireDate: '2021-06-15', nationality: 'SA', isSaudi: true } });
ok(r.ok, 'HR places an accountant under the accounts manager', r);
B.call({ action: 'hrEmpSave', token: hrT, emp: { id: E5003, departmentId: accId, positionId: accountantPos, managerId: E5001, hireDate: '2024-01-07' } });
r = B.call({ action: 'hrEmpSave', token: hrT, emp: { id: E5001, managerId: E5002 } });
ok(!r.ok && r.error === 'manager_cycle', 'a report cannot become their own manager\'s manager', r);
r = B.call({ action: 'hrEmpSave', token: hrT, emp: { id: E5002, managerId: E5002 } });
ok(!r.ok && r.error === 'manager_cycle', 'nobody manages themselves', r);
r = B.call({ action: 'hrPrivateSave', token: hrT, empId: E5002, priv: { nationalId: '1012345678', iban: 'SA0380000000608010167519' } });
ok(r.ok, 'HR saves ID and a valid Saudi IBAN', r);
r = B.call({ action: 'hrPrivateSave', token: hrT, empId: E5002, priv: { iban: 'SA0380000000608010167518' } });
ok(!r.ok && r.error === 'bad_iban', 'an IBAN with a wrong check digit is refused', r);
r = B.call({ action: 'hrPrivateSave', token: hrT, empId: E5002, priv: { nationalId: '3012345678' } });
ok(!r.ok && r.error === 'bad_national_id', 'a national ID must start with 1 (Saudi) or 2 (iqama) and have 10 digits', r);

let mgrT = tok('5001');
r = B.call({ action: 'hrEmpFile', token: mgrT, id: E5002 });
ok(r.ok && r.file.job.manager.id === E5001 && !('comp' in r.file) && !('priv' in r.file), 'a manager opens a report file without salary or private data', r.file && Object.keys(r.file));
r = B.call({ action: 'hrEmpFile', token: mgrT, id: E5000 });
ok(!r.ok && r.error === 'forbidden', 'a manager cannot open their own manager file', r);
r = B.call({ action: 'hrEmpFile', token: tok('5003'), id: E5002 });
ok(!r.ok && r.error === 'forbidden', 'a colleague cannot open another colleague file', r);
r = B.call({ action: 'hrEmpFile', token: tok('5000'), id: E5003 });
ok(r.ok && r.file.job.head.id === E5000, 'the department head reaches staff two levels down', r.file && r.file.job);
r = B.call({ action: 'hrTeam', token: mgrT });
ok(r.ok && r.rows.length === 2, 'the manager team view lists exactly their two reports', r.rows && r.rows.map(x => x.empNo));
r = B.call({ action: 'hrEmpFile', token: hrT, id: E5002 });
ok(r.ok && r.file.priv.iban === 'SA0380000000608010167519' && r.file.jobHistory.length >= 1, 'HR sees private data and job history', r.file && Object.keys(r.file));
```

- [ ] **Step 2: Run** — FAIL `unknown_action`.

- [ ] **Step 3: Implement**

```js
// ---------------- validation ----------------

/** YYYY-MM-DD, dd/mm/yyyy, or an Excel serial number. Returns '' when unreadable. */
function isoDate_(v) {
  if (v === '' || v == null) return '';
  if (typeof v === 'number' && isFinite(v) && v > 20000 && v < 80000) return new Date(Date.UTC(1899, 11, 30) + v * 86400000).toISOString().slice(0, 10);
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

/** Saudi IBAN: SA + 2 check digits + 20 characters, ISO 13616 mod-97 = 1. */
function validIban_(s) {
  s = String(s || '').replace(/\s+/g, '').toUpperCase();
  if (!/^SA\d{2}[0-9A-Z]{20}$/.test(s)) return false;
  var r = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, function (c) { return String(c.charCodeAt(0) - 55); });
  var rem = 0;
  for (var i = 0; i < r.length; i++) rem = (rem * 10 + Number(r[i])) % 97;
  return rem === 1;
}
function validNationalId_(s) { return /^[12]\d{9}$/.test(String(s || '')); }

function wouldCycle_(empId, managerId, emps) {
  for (var cur = managerId, i = 0; cur && i < 50; cur = emps[cur] && emps[cur].managerId, i++) if (cur === empId) return true;
  return false;
}

// ---------------- job data ----------------

var JOB_KEYS = ['departmentId', 'positionId', 'managerId', 'hireDate', 'contractType', 'contractEnd', 'probationEnd',
  'nationality', 'isSaudi', 'gender', 'workLocation'];

function api_hrEmpSave(req, me) {
  var d = req.emp || {};
  return withLock_(function () {
    var ctx = orgCtx_(), emp = ctx.emps[d.id];
    if (!emp) fail_('not_found');
    var before = { departmentId: emp.departmentId, positionId: emp.positionId, managerId: emp.managerId };
    if ('departmentId' in d && d.departmentId && !ctx.depts[d.departmentId]) fail_('not_found');
    if ('positionId' in d && d.positionId && !findBy_(SHEETS.POS, 'id', d.positionId)) fail_('not_found');
    if ('managerId' in d && d.managerId) {
      if (!ctx.emps[d.managerId]) fail_('not_found');
      if (d.managerId === emp.id || wouldCycle_(emp.id, d.managerId, ctx.emps)) fail_('manager_cycle');
    }
    ['hireDate', 'contractEnd', 'probationEnd'].forEach(function (k) { if (d[k] && !isoDate_(d[k])) fail_('bad_date'); });
    JOB_KEYS.forEach(function (k) {
      if (!(k in d)) return;
      if (k === 'isSaudi') emp.isSaudi = d.isSaudi === true || d.isSaudi === 'true';
      else if (/Date$|End$/.test(k)) emp[k] = isoDate_(d[k]);
      else emp[k] = str_(d[k], 60);
    });
    if (emp.department === '' && emp.departmentId && ctx.depts[emp.departmentId]) emp.department = ctx.depts[emp.departmentId].nameAr;
    emp.updatedAt = new Date().toISOString();
    update_(SHEETS.EMP, emp);
    if (before.departmentId !== emp.departmentId || before.positionId !== emp.positionId || before.managerId !== emp.managerId) {
      append_(SHEETS.JOBH, { id: newId_('H'), empId: emp.id, effectiveFrom: isoDate_(d.effectiveFrom) || today_(),
        departmentId: emp.departmentId, positionId: emp.positionId, managerId: emp.managerId, grade: '',
        reason: str_(d.reason, 200), enteredBy: me.id, createdAt: emp.updatedAt });
    }
    audit_(me.id, 'emp_job_update', emp.id, before);
    return { ok: true };
  });
}

var PRIV_KEYS = ['nationalId', 'idExpiry', 'birthDate', 'maritalStatus', 'iban', 'bankName', 'gosiNumber', 'gosiCohort',
  'address', 'emergencyName', 'emergencyPhone'];

function api_hrPrivateSave(req, me) {
  var d = req.priv || {};
  if ('iban' in d && d.iban && !validIban_(d.iban)) fail_('bad_iban');
  if ('nationalId' in d && d.nationalId && !validNationalId_(d.nationalId)) fail_('bad_national_id');
  ['idExpiry', 'birthDate'].forEach(function (k) { if (d[k] && !isoDate_(d[k])) fail_('bad_date'); });
  if ('gosiCohort' in d && d.gosiCohort && ['legacy', 'new'].indexOf(d.gosiCohort) < 0) fail_('bad_request');
  return withLock_(function () {
    if (!findBy_(SHEETS.EMP, 'id', req.empId)) fail_('not_found');
    var row = findBy_(SHEETS.PRIV, 'empId', req.empId), created = !row;
    if (!row) row = { empId: req.empId };
    if (d.nationalId) {
      var dup = readAll_(SHEETS.PRIV).some(function (p) { return p.empId !== req.empId && String(p.nationalId) === String(d.nationalId); });
      if (dup) fail_('duplicate_national_id');
    }
    PRIV_KEYS.forEach(function (k) {
      if (!(k in d)) return;
      row[k] = k === 'iban' ? String(d.iban || '').replace(/\s+/g, '').toUpperCase() : (k === 'idExpiry' || k === 'birthDate') ? isoDate_(d[k]) : str_(d[k], 200);
    });
    row.updatedAt = new Date().toISOString();
    if (created) append_(SHEETS.PRIV, row); else update_(SHEETS.PRIV, row);
    audit_(me.id, 'emp_private_update', req.empId, { fields: Object.keys(d) });
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
  return Math.max(0, Math.round((new Date(today_()) - new Date(hireDate)) / (365.25 * 86400000) * 10) / 10);
}

function buildFile_(me, emp, ctx) {
  var self = me.id === emp.id, hr = isHr_(me), mgr = manages_(me, emp, ctx);
  if (!self && !hr && !mgr && !hasRole_(me, 'payroll')) fail_('forbidden');
  var pos = emp.positionId ? findBy_(SHEETS.POS, 'id', emp.positionId) : null;
  var dept = ctx.depts[emp.departmentId];
  var file = {
    emp: publicEmp_(emp),
    job: {
      department: dept ? publicDept_(dept) : null, position: pos ? { id: pos.id, titleAr: pos.titleAr, titleEn: pos.titleEn, grade: pos.grade } : null,
      manager: nameCard_(ctx.emps[emp.managerId]), head: nameCard_(headFor_(emp, ctx)),
      hireDate: emp.hireDate || '', serviceYears: serviceYears_(emp.hireDate), contractType: emp.contractType || '',
      contractEnd: emp.contractEnd || '', probationEnd: emp.probationEnd || '', workLocation: emp.workLocation || ''
    },
    jd: pos ? publicPosition_(pos) : null
  };
  if (self || hr || hasRole_(me, 'payroll')) {
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
    .map(function (e) { var o = publicEmp_(e); o.managerId = e.managerId; o.departmentId = e.departmentId; o.positionId = e.positionId; return o; });
  return { ok: true, rows: rows };
}

function api_hrDirectory(req, me) {
  var ctx = orgCtx_(), pos = {};
  readAll_(SHEETS.POS).forEach(function (p) { pos[p.id] = p.titleAr; });
  var rows = Object.keys(ctx.emps).map(function (k) {
    var e = ctx.emps[k], o = publicEmp_(e);
    o.departmentId = e.departmentId; o.positionId = e.positionId; o.managerId = e.managerId; o.hireDate = e.hireDate;
    o.departmentName = ctx.depts[e.departmentId] ? ctx.depts[e.departmentId].nameAr : e.department;
    o.positionName = pos[e.positionId] || e.title; o.managerName = ctx.emps[e.managerId] ? ctx.emps[e.managerId].name : '';
    o.extraRoles = String(e.extraRoles || '');
    return o;
  });
  return { ok: true, rows: rows };
}
```
Note `currentComp_` and `compRows_` come from Task 4; stub them now so this task runs:
```js
function currentComp_(empId, asOf) { return null; }
function compRows_(empId) { return []; }
```

- [ ] **Step 4: Run** `node tests/hr.js` and `node tests/run.js` → all pass.
- [ ] **Step 5: Commit** — `git commit -am "HR: employee file, private data, team view with server-side access"`

---

### Task 4: Effective-dated compensation with a second approver

**Files:** Modify `backend/Hr.gs` (replace the two stubs), `tests/hr.js`

**Interfaces:**
- Produces: `hrCompPropose({empId, effectiveFrom, basic, housing, transport, other:{label:amount}, reason}) -> {comp}`, `hrCompDecide({ids:[...], decision:'approve'|'reject'}) -> {decided}`, `hrCompList({status}) -> {rows}`, `currentComp_(empId, asOf) -> {basic,housing,transport,other,total,effectiveFrom}|null`, `compRows_(empId) -> [...]`.

- [ ] **Step 1: Failing tests**

```js
console.log('Compensation');
r = B.call({ action: 'hrCompPropose', token: hrT, empId: E5002, effectiveFrom: '2026-10-01', basic: 9000, housing: 2250, transport: 900, other: { 'بدل هاتف': 200 }, reason: 'initial' });
ok(r.ok && r.comp.status === 'pending', 'HR proposes a salary package', r);
const c1 = r.comp.id;
r = B.call({ action: 'hrCompDecide', token: hrT, ids: [c1], decision: 'approve' });
ok(!r.ok && r.error === 'second_approver_required', 'the proposer cannot approve their own proposal', r);
r = B.call({ action: 'hrCompDecide', token: mgrT, ids: [c1], decision: 'approve' });
ok(!r.ok && r.error === 'forbidden', 'a manager cannot approve salaries', r);
let payT = tok('3002');
r = B.call({ action: 'hrCompDecide', token: payT, ids: [c1], decision: 'approve' });
ok(r.ok && r.decided === 1, 'payroll approves it', r);
r = B.call({ action: 'hrEmpFile', token: tok('5002'), id: E5002 });
ok(r.ok && r.file.comp.total === 12350 && r.file.comp.other['بدل هاتف'] === 200, 'the employee sees their own package and total', r.file && r.file.comp);
B.call({ action: 'hrCompPropose', token: payT, empId: E5002, effectiveFrom: '2026-11-01', basic: 9500, housing: 2375, transport: 900, reason: 'raise' });
const c2 = B.call({ action: 'hrCompList', token: hrT, status: 'pending' }).rows[0].id;
B.call({ action: 'hrCompDecide', token: hrT, ids: [c2], decision: 'approve' });
r = B.call({ action: 'hrEmpFile', token: tok('5002'), id: E5002 });
ok(r.file.comp.basic === 9000, 'a raise effective next month does not show as current today', r.file.comp);
r = B.call({ action: 'hrCompPropose', token: hrT, empId: E5002, effectiveFrom: '2026-12-01', basic: -5 });
ok(!r.ok && r.error === 'bad_amount', 'negative or missing basic salary is refused', r);
r = B.call({ action: 'hrEmpFile', token: tok('1000'), id: E5002 });
ok(r.ok && !('comp' in r.file), 'admin without payroll does not see the salary', r.file && Object.keys(r.file));
r = B.call({ action: 'auditList', token: tok('1000') });
ok(r.rows.some(a => a.action === 'salary_view'), 'salary views by others are audited');
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implement** (replace the stubs)

```js
// ---------------- compensation (effective-dated, two people) ----------------

function num_(v) { var n = Number(v); return isFinite(n) ? Math.round(n * 100) / 100 : NaN; }

function compView_(c) {
  var other = {};
  try { other = JSON.parse(c.otherJson || '{}') || {}; } catch (e) { other = {}; }
  var total = Number(c.basic || 0) + Number(c.housing || 0) + Number(c.transport || 0);
  Object.keys(other).forEach(function (k) { total += Number(other[k]) || 0; });
  return { id: c.id, empId: c.empId, effectiveFrom: c.effectiveFrom, basic: Number(c.basic || 0), housing: Number(c.housing || 0),
    transport: Number(c.transport || 0), other: other, total: Math.round(total * 100) / 100, currency: c.currency || 'SAR',
    status: c.status, reason: c.reason, enteredBy: c.enteredBy, approvedBy: c.approvedBy };
}

function compRows_(empId) {
  return readAll_(SHEETS.COMP).filter(function (c) { return c.empId === empId; })
    .sort(function (a, b) { return a.effectiveFrom < b.effectiveFrom ? 1 : -1; }).map(compView_);
}

function currentComp_(empId, asOf) {
  var best = null;
  readAll_(SHEETS.COMP).forEach(function (c) {
    if (c.empId !== empId || c.status !== 'approved' || String(c.effectiveFrom) > asOf) return;
    if (!best || String(c.effectiveFrom) > String(best.effectiveFrom) || (c.effectiveFrom === best.effectiveFrom && c.approvedAt > best.approvedAt)) best = c;
  });
  return best ? compView_(best) : null;
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
  if (!ids.length) fail_('bad_request');
  return withLock_(function () {
    var rows = readAll_(SHEETS.COMP).filter(function (c) { return ids.indexOf(c.id) >= 0; });
    if (rows.length !== ids.length || rows.some(function (c) { return c.status !== 'pending'; })) fail_('not_found');
    if (rows.some(function (c) { return c.enteredBy === me.id; })) fail_('second_approver_required');
    if (rows.some(function (c) { return c.empId === me.id; })) fail_('cannot_change_own_salary');
    var now = new Date().toISOString();
    rows.forEach(function (c) { c.status = decision; c.approvedBy = me.id; c.approvedAt = now; update_(SHEETS.COMP, c); });
    audit_(me.id, 'comp_' + decision, '', { count: rows.length });
    return { ok: true, decided: rows.length };
  });
}

function api_hrCompList(req, me) {
  if (!canDecideComp_(me) && !canProposeComp_(me)) fail_('forbidden');
  var emps = {};
  readAll_(SHEETS.EMP).forEach(function (e) { emps[e.id] = e; });
  var want = req.status || 'pending';
  var rows = readAll_(SHEETS.COMP).filter(function (c) { return c.status === want && c.empId !== me.id; })
    .map(function (c) { var v = compView_(c); v.emp = nameCard_(emps[c.empId]); v.enteredByName = emps[c.enteredBy] ? emps[c.enteredBy].name : ''; return v; });
  if (rows.length) audit_(me.id, 'salary_view', '', { list: want, count: rows.length });
  return { ok: true, rows: rows };
}
```

Note: `canDecideComp_` includes `hr` so HR can approve a proposal made by payroll (and vice versa). The two-person rule holds because proposer ≠ approver.

- [ ] **Step 4: Run both suites** → all pass.
- [ ] **Step 5: Commit** — `git commit -am "HR: effective-dated compensation with a second approver"`

---

### Task 5: Excel import — validate and commit

**Files:** Modify `backend/Hr.gs`, `tests/hr.js`

**Interfaces:**
- Row shape sent by the client (already parsed from Excel, dates as numbers or strings): `{ empNo, nameAr, nameEn, email, phone, department, position, managerEmpNo, hireDate, contractType, nationality, gender, nationalId, idExpiry, birthDate, iban, bankName, gosiNumber, gosiCohort, basic, housing, transport, workLocation }`.
- Produces: `hrImportValidate({rows}) -> {ok, errors:[{row, field, code}], summary:{create, update, departments, positions}}`, `hrImportCommit({rows}) -> {ok, created, updated, compBatch}`; helper `validateImport_(rows, ctx) -> {errors, plan}`.
- Row numbers in errors are spreadsheet rows (header is row 1, so the first data row is 2).

- [ ] **Step 1: Failing tests**

```js
console.log('Excel import');
const base = { department: 'المبيعات', position: 'مندوب مبيعات', hireDate: 45566, nationality: 'SA', basic: 6000, housing: 1500, transport: 600 };
const rows = [
  Object.assign({}, base, { empNo: '7001', nameAr: 'سلمان العنزي', nationalId: '1098765432', iban: 'SA4420000001234567891234', managerEmpNo: '' }),
  Object.assign({}, base, { empNo: '7002', nameAr: 'تركي المطيري', nationalId: '1098765433', managerEmpNo: '7001', hireDate: '15/02/2025' }),
  Object.assign({}, base, { empNo: '7003', nameAr: 'Ahmed Khan', nationality: 'PK', nationalId: '2123456789', managerEmpNo: '7001', hireDate: '2023-09-10' })
];
r = B.call({ action: 'hrImportValidate', token: hrT, rows });
ok(r.ok && r.errors.length === 0 && r.summary.create === 3 && r.summary.departments === 1 && r.summary.positions === 1, 'a clean file validates, with new department and position counted', r);
const bad = [
  Object.assign({}, rows[0]),
  Object.assign({}, rows[1], { empNo: '7001' }),
  Object.assign({}, rows[2], { iban: 'SA0000000000000000000000', hireDate: '31/02/2025', managerEmpNo: '9999', basic: 'abc' }),
  Object.assign({}, base, { empNo: '7004', nameAr: '', nationalId: '1098765432' }),
  Object.assign({}, base, { empNo: '7005', nameAr: 'دائري أ', nationalId: '1000000001', managerEmpNo: '7006' }),
  Object.assign({}, base, { empNo: '7006', nameAr: 'دائري ب', nationalId: '1000000002', managerEmpNo: '7005' })
];
r = B.call({ action: 'hrImportValidate', token: hrT, rows: bad });
const has = (row, code) => r.errors.some(e => e.row === row && e.code === code);
ok(has(3, 'duplicate_emp_no'), 'duplicate employee number in the file is reported on its row', r.errors);
ok(has(4, 'bad_iban') && has(4, 'bad_date') && has(4, 'unknown_manager') && has(4, 'bad_amount'), 'bad IBAN, impossible date, unknown manager and bad amount all reported', r.errors.filter(e => e.row === 4));
ok(has(5, 'required') && has(5, 'duplicate_national_id'), 'missing name and repeated national ID reported', r.errors.filter(e => e.row === 5));
ok(has(6, 'manager_cycle') || has(7, 'manager_cycle'), 'two people managing each other is refused', r.errors);
r = B.call({ action: 'hrImportCommit', token: hrT, rows: bad });
ok(!r.ok && r.error === 'import_invalid', 'a file with errors commits nothing', r.error);
ok(!B.call({ action: 'hrDirectory', token: hrT }).rows.some(e => e.empNo === '7001'), 'and nothing was written');
r = B.call({ action: 'hrImportCommit', token: hrT, rows });
ok(r.ok && r.created === 3, 'a clean file commits all rows in one go', r);
r = B.call({ action: 'hrDirectory', token: hrT });
const s2 = r.rows.find(e => e.empNo === '7002');
ok(s2 && s2.managerName === 'سلمان العنزي' && s2.hireDate === '2025-02-15' && s2.departmentName === 'المبيعات', 'manager, Arabic names and dd/mm/yyyy dates survive the import', s2);
ok(r.rows.find(e => e.empNo === '7001').hireDate === '2024-10-01', 'Excel serial dates become YYYY-MM-DD');
r = B.call({ action: 'hrCompList', token: payT, status: 'pending' });
ok(r.rows.filter(c => c.reason === 'import').length === 3, 'imported salaries wait for payroll approval', r.rows.length);
r = B.call({ action: 'hrImportCommit', token: hrT, rows: [Object.assign({}, rows[0], { nameEn: 'Salman Alanazi', basic: 6000 })] });
ok(r.ok && r.updated === 1 && r.created === 0, 'importing again updates by employee number instead of duplicating', r);
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implement**

```js
// ---------------- Excel import ----------------

var IMPORT_REQUIRED = ['empNo', 'nameAr', 'department', 'position', 'hireDate', 'nationality', 'nationalId', 'basic'];

function validateImport_(rows, ctx) {
  var errors = [], seenNo = {}, seenId = {}, fileMgr = {};
  var existingByNo = {}, idOwner = {};
  Object.keys(ctx.emps).forEach(function (k) { existingByNo[String(ctx.emps[k].empNo).trim()] = ctx.emps[k]; });
  readAll_(SHEETS.PRIV).forEach(function (p) { if (p.nationalId) idOwner[String(p.nationalId)] = p.empId; });
  var deptNames = {}, posNames = {}, newDepts = {}, newPos = {};
  Object.keys(ctx.depts).forEach(function (k) { deptNames[normName_(ctx.depts[k].nameAr)] = ctx.depts[k].id; });
  readAll_(SHEETS.POS).forEach(function (p) { posNames[normName_(p.titleAr)] = p.id; });
  var plan = [];
  if (!Array.isArray(rows) || !rows.length) fail_('bad_request');
  if (rows.length > 2000) fail_('too_many_rows');
  rows.forEach(function (raw, i) {
    var line = i + 2, e = function (field, code) { errors.push({ row: line, field: field, code: code }); };
    var r = {};
    Object.keys(raw || {}).forEach(function (k) { r[k] = typeof raw[k] === 'string' ? raw[k].trim() : raw[k]; });
    r.empNo = String(r.empNo == null ? '' : r.empNo).trim();
    IMPORT_REQUIRED.forEach(function (k) { if (r[k] === '' || r[k] == null) e(k, 'required'); });
    if (r.empNo) { if (seenNo[r.empNo]) { e('empNo', 'duplicate_emp_no'); } seenNo[r.empNo] = line; }
    var nid = String(r.nationalId || '');
    if (nid) {
      if (!validNationalId_(nid)) e('nationalId', 'bad_national_id');
      else if (seenId[nid]) e('nationalId', 'duplicate_national_id');
      else if (idOwner[nid] && (!existingByNo[r.empNo] || existingByNo[r.empNo].id !== idOwner[nid])) e('nationalId', 'duplicate_national_id');
      seenId[nid] = line;
    }
    if (r.iban && !validIban_(r.iban)) e('iban', 'bad_iban');
    ['hireDate', 'idExpiry', 'birthDate', 'contractEnd'].forEach(function (k) {
      if (r[k] !== '' && r[k] != null) { var d = isoDate_(r[k]); if (!d) e(k, 'bad_date'); else r[k] = d; }
    });
    ['basic', 'housing', 'transport'].forEach(function (k) {
      if (r[k] === '' || r[k] == null) { if (k !== 'basic') r[k] = 0; return; }
      var n = num_(r[k]); if (!(n >= 0) || (k === 'basic' && !(n > 0))) e(k, 'bad_amount'); else r[k] = n;
    });
    if (r.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)) e('email', 'bad_email');
    if (r.gosiCohort && ['legacy', 'new'].indexOf(r.gosiCohort) < 0) e('gosiCohort', 'bad_value');
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
  // cycles through the file's own managers, falling back to existing managers for people not in the file
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
    summary: { create: create, update: plan.length - create, departments: Object.keys(newDepts).length, positions: Object.keys(newPos).length } };
}

function api_hrImportValidate(req, me) {
  var v = validateImport_(req.rows, orgCtx_());
  return { ok: true, errors: v.errors, summary: v.summary };
}

function api_hrImportCommit(req, me) {
  return withLock_(function () {
    var ctx = orgCtx_(), v = validateImport_(req.rows, ctx);
    if (v.errors.length) return { ok: false, error: 'import_invalid', errors: v.errors };
    var now = new Date().toISOString(), batch = newId_('B');
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
    appendMany_(SHEETS.DEPT, newDeptRows);
    appendMany_(SHEETS.POS, newPosRows);
    var idByNo = {}, newEmps = [], updEmps = [];
    v.plan.forEach(function (r) {
      var e = v.existingByNo[r.empNo];
      if (!e) { e = { id: newId_('E'), empNo: r.empNo, role: 'employee', status: 'active', tokenVer: 0, actHash: '', actExp: '', actTries: 0, createdAt: now, zoneIds: '', shiftStart: '', shiftEnd: '', workdays: '', extraRoles: '', title: '' }; newEmps.push(e); }
      else updEmps.push(e);
      idByNo[r.empNo] = e.id;
      e.name = r.nameAr; if (r.nameEn) e.nameEn = r.nameEn; if (r.email) e.email = r.email; if (r.phone) e.phone = String(r.phone);
      e.departmentId = v.deptNames[normName_(r.department)]; e.department = r.department;
      e.positionId = v.posNames[normName_(r.position)]; e.title = r.position;
      e.hireDate = r.hireDate; e.nationality = r.nationality; e.isSaudi = /^(SA|SAU|سعودي|سعودية|saudi)$/i.test(String(r.nationality));
      if (r.gender) e.gender = r.gender; if (r.contractType) e.contractType = r.contractType; if (r.workLocation) e.workLocation = r.workLocation;
      e.updatedAt = now; e._r = r;
    });
    Object.keys(v.existingByNo).forEach(function (no) { if (!idByNo[no]) idByNo[no] = v.existingByNo[no].id; });
    newEmps.concat(updEmps).forEach(function (e) { e.managerId = e._r.managerEmpNo ? idByNo[e._r.managerEmpNo] : (e.managerId || ''); });
    var jobRows = [], compRows = [], privNew = [];
    var privByEmp = {};
    readAll_(SHEETS.PRIV).forEach(function (p) { privByEmp[p.empId] = p; });
    newEmps.concat(updEmps).forEach(function (e) {
      var r = e._r;
      jobRows.push({ id: newId_('H'), empId: e.id, effectiveFrom: r.hireDate, departmentId: e.departmentId, positionId: e.positionId, managerId: e.managerId, grade: '', reason: 'import', enteredBy: me.id, createdAt: now });
      var cur = currentComp_(e.id, today_());
      if (!cur || cur.basic !== r.basic || cur.housing !== r.housing || cur.transport !== r.transport) {
        compRows.push(compRowFrom_({ empId: e.id, effectiveFrom: r.hireDate > today_() ? r.hireDate : today_(), basic: r.basic, housing: r.housing, transport: r.transport, reason: 'import', batchId: batch }, me.id));
      }
      var p = privByEmp[e.id] || { empId: e.id };
      ['nationalId', 'idExpiry', 'birthDate', 'bankName', 'gosiNumber', 'gosiCohort'].forEach(function (k) { if (r[k] !== undefined && r[k] !== '') p[k] = r[k]; });
      if (r.iban) p.iban = String(r.iban).replace(/\s+/g, '').toUpperCase();
      p.updatedAt = now;
      if (privByEmp[e.id]) update_(SHEETS.PRIV, p); else privNew.push(p);
      delete e._r;
    });
    appendMany_(SHEETS.EMP, newEmps);
    updEmps.forEach(function (e) { update_(SHEETS.EMP, e); });
    appendMany_(SHEETS.PRIV, privNew);
    appendMany_(SHEETS.JOBH, jobRows);
    appendMany_(SHEETS.COMP, compRows);
    audit_(me.id, 'hr_import', batch, { created: newEmps.length, updated: updEmps.length, departments: newDeptRows.length, positions: newPosRows.length, salaries: compRows.length });
    return { ok: true, created: newEmps.length, updated: updEmps.length, compBatch: batch, pendingSalaries: compRows.length };
  });
}
```

- [ ] **Step 4: Run both suites** → all pass.
- [ ] **Step 5: Commit** — `git commit -am "HR: validated all-or-nothing Excel import"`

---

### Task 6: `myFile` — the employee's own file

**Files:** Modify `backend/Hr.gs`, `tests/hr.js`

**Interfaces:** Produces `myFile() -> {file}` (same shape as `buildFile_` with self access, plus `isManager: bool` and `teamCount`).

- [ ] **Step 1: Failing test**

```js
console.log('My file');
r = B.call({ action: 'myFile', token: tok('5002') });
ok(r.ok && r.file.emp.empNo === '5002' && r.file.job.manager.empNo === '5001' && r.file.job.head.empNo === '5000' &&
  r.file.jd.purposeAr.indexOf('القيود') >= 0 && r.file.comp.total === 12350 && r.file.isManager === false,
  'the employee sees ID, both managers, JD and salary package', r.file && { job: r.file.job, comp: r.file.comp });
r = B.call({ action: 'myFile', token: mgrT });
ok(r.ok && r.file.isManager === true && r.file.teamCount === 2, 'a manager sees they manage two people', r.file && r.file.teamCount);
```

- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement**

```js
function api_myFile(req, me) {
  var ctx = orgCtx_(), file = buildFile_(me, me, ctx);
  var team = Object.keys(ctx.emps).filter(function (k) { return ctx.emps[k].status === 'active' && manages_(me, ctx.emps[k], ctx); });
  file.isManager = team.length > 0;
  file.teamCount = team.length;
  file.roles = { hr: isHr_(me), payroll: hasRole_(me, 'payroll'), admin: me.role === 'admin' };
  return { ok: true, file: file };
}
```
- [ ] **Step 4: Run both suites** → pass.
- [ ] **Step 5: Commit** — `git commit -am "HR: myFile for the employee self-service tab"`

---

### Task 7: "ملفي" tab in the employee app

**Files:** Create `js/my-file.js`; modify `index.html` (tab list in `renderShell`, lazy loader, i18n), `sw.js`.

**Interfaces:**
- Consumes: `api('myFile')`, globals from `index.html`: `S`, `t`, `esc`, `$`, `$$`, `fmtTime`, `fmtDur`, `LOCALE`, `I`, `renderHistory`.
- Produces: `window.MyFile.render(mainEl)`; `loadScript(src) -> Promise` in `index.html`.

- [ ] **Step 1: Loader + tab in `index.html`**

```js
var loadedScripts = {};
function loadScript(src){
  if (loadedScripts[src]) return loadedScripts[src];
  return (loadedScripts[src] = new Promise(function(res, rej){ var s = document.createElement('script'); s.src = src + '?v=' + BUILD; s.onload = res; s.onerror = rej; document.head.appendChild(s); }));
}
```
In `renderShell` tabs: insert `['file', I.idcard, t('tabFile')]` after `home`; move history into "ملفي" (attendance sheet section links to it) and keep `history` tab removed from the bar. Branch: `else if (S.tab === 'file') loadScript('js/my-file.js').then(function(){ MyFile.render($('#main')); });`. Icon: `idcard: ph('identification-card')`. Strings: `tabFile:'ملفي'` / `'My file'`.

- [ ] **Step 2: `js/my-file.js`** — sections, in this order, each a `.mf-card`:
  1. Identity header: initials badge, name Ar/En, **employee ID** (large, tabular), position, department, service years ("x.y سنة").
  2. My managers: direct manager and department head rows (name, position); "—" never shown, use `t('none')`.
  3. My job description: purpose paragraph, duties as a list (split on newlines), requirements list.
  4. My salary package: amounts hidden until "إظهار المبالغ" is tapped (`aria-pressed`); rows basic, housing, transport, each other allowance, total (bold), effective date; "SAR" suffix; nothing rendered when `file.comp` is null (shows `t('noPackage')`).
  5. My attendance: button opening the existing month view (`renderHistory`) inside the tab.
  6. If `file.isManager`: "My team (n)" card linking to `#hr` team view.
  Motion: cards enter with a 40 ms stagger once (CSS `animation-delay: calc(var(--i) * 40ms)`), disabled by reduced motion.

- [ ] **Step 3: Verify in the preview** (`attendance-preview`): seed the preview server with a department, position, manager chain and an approved package for `2001` (extend `seed()` in `tests/preview-server.js` using `B.ctx.append_` for `departments`, `positions`, `compensation` with `status:'approved'`), activate `2001`, open "ملفي", check all five cards, the hidden amounts toggle, Arabic and English, phone and 1100 px widths, no console errors.
- [ ] **Step 4: Commit** — `git add js/my-file.js index.html sw.js tests/preview-server.js && git commit -m "HR: ملفي self-service tab"`

---

### Task 8: HR console at `#hr` (people, organisation, positions, approvals, import)

**Files:** Create `js/hr-console.js`; modify `index.html` (route + entry button for HR/payroll/managers), `sw.js`.

**Interfaces:**
- Consumes: `hrDirectory`, `hrEmpFile`, `hrEmpSave`, `hrPrivateSave`, `hrDeptList/Save`, `hrPositionList/Save`, `hrCompList/Propose/Decide`, `hrImportValidate/Commit`, `hrTeam`, existing `empSave`, `empActivation`.
- Produces: `window.HrConsole.open(section)`; route `location.hash === '#hr'` opens it after sign-in.

- [ ] **Step 1: Shell** — full-width layout (reuses `.adm` tokens), left rail sections: People, Organisation, Positions, Approvals (badge = pending count), Import, and a link back to attendance admin. Managers who are not HR see only "My team".
- [ ] **Step 2: People** — directory table (employee number, name, department, position, manager, hire date, device status) with search and department filter; row opens the employee file drawer with tabs Job / Personal / Compensation / Devices. Job tab edits via `hrEmpSave` (department, position, manager pickers from lists, dates as `<input type=date>`, reason). Personal tab via `hrPrivateSave` with inline IBAN check (same mod-97 in JS) before sending. Compensation tab: history table, "Propose change" form → `hrCompPropose`.
- [ ] **Step 3: Organisation** — department tree (indent by depth), edit drawer (name Ar/En, code, parent, head, cost centre); org chart: nested lists built from `managerId`, collapsible, with counts.
- [ ] **Step 4: Positions** — list + editor with the six JD text fields (Ar/En tabs).
- [ ] **Step 5: Approvals** — pending compensation list (employee, effective date, basic/housing/transport/total, proposer), select all, Approve / Reject → `hrCompDecide({ids})`; import batches grouped by `reason === 'import'`.
- [ ] **Step 6: Import** — "Download template" builds the .xlsx in the browser with SheetJS (`XLSX.utils.aoa_to_sheet` with the column headers listed in Task 5, Arabic header labels on row 1 and field keys mapped by position); "Upload file" parses with `XLSX.read(buf, {type:'array', cellDates:false})` and `sheet_to_json(ws, {raw:true, defval:''})`; header row mapped to field keys by label (Arabic or English). Client normalises: trims strings, keeps numbers (Excel serial dates stay numbers; the server converts). Calls `hrImportValidate`; shows summary (create/update/new departments/new positions) and an error table (row, column label, message in Arabic), rows with errors highlighted; "Import" button enabled only when there are zero errors → `hrImportCommit`; then offers "Go to approvals" for the pending salaries.
  SheetJS script: `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js`, loaded only on the Import screen.
- [ ] **Step 7: Verify in the preview** with a generated test workbook (fictional names only) containing 3 clean rows and 3 broken rows: the error table lists every broken row, fixing and re-uploading enables Import, commit creates the people, approvals shows 3 pending salaries, approving as a second account works. Phone and 1100 px. No console errors.
- [ ] **Step 8: Commit** — `git add js/hr-console.js index.html sw.js && git commit -m "HR: console with people, organisation, positions, approvals and import"`

---

### Task 9: Deploy and verify live

- [ ] **Step 1:** `node tests/run.js && node tests/hr.js` — both 0 failed.
- [ ] **Step 2:** Copy `backend/*.gs` (now including `Hr.gs`) into `../apps-script` as `.js`, add `Hr.js` to `filePushOrder` after `Admin.js`, `clasp push -f`, `clasp deploy -i AKfycbz1XJ-WF6qnXiGtieQev6g53pAMThwCWhpp7r-pwbWtQi-ShJrpQIJUFHr17E3AryKG -d "HR phase 1"`.
- [ ] **Step 3:** `curl` the `/exec` URL → JSON `{"ok":true,...}` (not an HTML page).
- [ ] **Step 4:** `git push origin main`; poll the Pages URL until `js/hr-console.js` returns 200.
- [ ] **Step 5:** In the browser pane on the live site: "ملفي" loads for the admin account; `#hr` opens the console; the Import screen downloads the template.
- [ ] **Step 6:** Update `CLAUDE.md` (HR files, actions, roles, Review Focus traps) and commit.
