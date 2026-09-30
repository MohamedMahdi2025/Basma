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
