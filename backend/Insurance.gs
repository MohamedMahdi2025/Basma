/**
 * Medical insurance (التأمين الطبي، مجلس الضمان الصحي CCHI), Wave 2, 2026-10-14.
 *  - Policies INP-001: insurer, policy number, period, classes (VIP / A / B / C ...) with an annual premium per employee
 *    and per dependant.
 *  - Members: the employee ('self') and dependants (spouse, child, parent), each with a class and the insurer's member no.
 *  - Additions and deletions are movements INS-YYYY-00001: requested -> submitted to the insurer -> confirmed (or rejected).
 *    The confirmation is by someone other than who requested or submitted it (premium money: two people).
 *    The premium of a movement is pro rata to the days left on the policy (a refund for a deletion is negative).
 *  - Employees ask to add their own dependants (insDependantRequest); HR handles the movement.
 *  - CCHI: every non-Saudi employee (and family) must be covered; iqama issue and renewal need valid cover. The calendar
 *    flags a non-Saudi without cover 30 days after hire and a policy within 60 days of its end. A son is covered to 25.
 */

var INS_RELATIONS = ['self', 'spouse', 'child', 'parent'];
var INS_LIVE = { pending_add: 1, active: 1, pending_delete: 1 };

function insSeesMoney_(me) { return !!me && (me.role === 'hr' || hasRole_(me, 'payroll') || hasRole_(me, 'executive')); }
function insSeesIds_(me) { return !!me && (me.role === 'hr' || hasRole_(me, 'payroll')); }
function insCanList_(me) { return isHr_(me) || hasRole_(me, 'payroll'); }
function insClasses_(p) { return parseJson_(p.classesJson, []); }
function insDays_(a, b) { return daysBetween_(a, b) + 1; }
/** Annual premium of a class for a relation, pro rata from `from` to the policy end. */
function insProRata_(p, cls, relation, from, to) {
  var c = insClasses_(p).filter(function (x) { return x.code === cls; })[0];
  if (!c) return 0;
  var annual = Number(relation === 'self' ? c.premiumEmployee : c.premiumDependant) || 0;
  var pf = String(p.fromDate).slice(0, 10), pt = String(p.toDate).slice(0, 10);
  return r2_(annual * insDays_(from, to || pt) / insDays_(pf, pt));
}
function insAge_(birth, on) {
  if (!birth) return null;
  var a = +on.slice(0, 4) - +birth.slice(0, 4);
  if (on.slice(5) < birth.slice(5)) a--;
  return a;
}
function insMask_(v) { v = String(v || ''); return v.length > 4 ? new Array(v.length - 3).join('•') + v.slice(-4) : v; }

function insPublicPolicy_(p, me, members) {
  var v = { id: p.id, ref: p.ref, insurer: p.insurer, policyNo: p.policyNo, fromDate: String(p.fromDate).slice(0, 10), toDate: String(p.toDate).slice(0, 10),
    status: p.status, note: p.note, classes: insClasses_(p).map(function (c) { var o = { code: c.code, nameAr: c.nameAr }; if (insSeesMoney_(me)) { o.premiumEmployee = c.premiumEmployee; o.premiumDependant = c.premiumDependant; } return o; }) };
  if (members) {
    var live = members.filter(function (m) { return m.policyId === p.id && (m.status === 'active' || m.status === 'pending_delete'); });
    v.members = live.length; v.byClass = {};
    live.forEach(function (m) { v.byClass[m.insClass] = (v.byClass[m.insClass] || 0) + 1; });
    if (insSeesMoney_(me)) v.annualPremium = r2_(live.reduce(function (s, m) { return s + (Number(m.premium) || 0); }, 0));
  }
  return v;
}
function insPublicMember_(m, ctx, me, policies) {
  var p = policies[m.policyId] || {}, own = m.empId === me.id;
  var v = { id: m.id, policyId: m.policyId, insurer: p.insurer || '', policyNo: p.policyNo || '', emp: empCard_(ctx.emps[m.empId]), relation: m.relation, name: m.name, nameEn: m.nameEn,
    birthDate: String(m.birthDate || '').slice(0, 10), gender: m.gender, insClass: m.insClass, memberNo: m.memberNo, fromDate: String(m.fromDate || '').slice(0, 10),
    toDate: String(m.toDate || '').slice(0, 10), status: m.status, note: m.note };
  v.idNo = own || insSeesIds_(me) ? String(m.idNo || '') : insMask_(m.idNo);
  if (own || insSeesMoney_(me)) v.premium = Number(m.premium) || 0;
  return v;
}
function insPublicMove_(x, ctx, me, members) {
  var m = members[x.memberId] || {};
  var v = { id: x.id, ref: x.ref, memberId: x.memberId, member: m.name || '', relation: m.relation || '', emp: empCard_(ctx.emps[x.empId]), kind: x.kind,
    effective: String(x.effective || '').slice(0, 10), insClass: x.toClass || x.fromClass, status: x.status, requestedBy: empCard_(ctx.emps[x.requestedBy]),
    submittedBy: empCard_(ctx.emps[x.submittedBy]), submittedAt: x.submittedAt, insurerRef: x.insurerRef, confirmedBy: empCard_(ctx.emps[x.confirmedBy]),
    confirmedAt: x.confirmedAt, note: x.note, createdAt: x.createdAt, canSubmit: insCanStep_(me, x, 'submit'), canConfirm: insCanStep_(me, x, 'confirm') };
  if (insSeesMoney_(me) || x.empId === me.id) v.premiumDelta = Number(x.premiumDelta) || 0;
  return v;
}
function insCanStep_(me, x, step) {
  if (!me || !isHr_(me) || x.empId === me.id) return false;
  if (step === 'submit' || step === 'reject') return x.status === 'requested' || (step === 'reject' && x.status === 'submitted');
  if (step === 'confirm') return x.status === 'submitted' && x.requestedBy !== me.id && x.submittedBy !== me.id;
  return false;
}
function insPolicyMap_() { var o = {}; readAll_(SHEETS.INSP).forEach(function (p) { o[p.id] = p; }); return o; }

// ---------------- policies ----------------

function api_insPolicySave(req, me) {
  var d = req.policy || {};
  return withLock_(function () {
    var now = new Date().toISOString(), p = d.id ? findBy_(SHEETS.INSP, 'id', d.id) : null;
    if (d.id && !p) fail_('not_found');
    var insurer = str_(d.insurer, 120), no = str_(d.policyNo, 60);
    if (!insurer || !no) fail_('missing_fields');
    var from = isoDate_(d.fromDate), to = isoDate_(d.toDate);
    if (!from || !to || to <= from || daysBetween_(from, to) > 731) fail_('bad_date');
    var cls = Array.isArray(d.classes) ? d.classes : [], seen = {}, clean = [];
    if (!cls.length || cls.length > 10) fail_('bad_value');
    cls.forEach(function (c) {
      var code = str_(c.code, 10).toUpperCase(), pe = num_(c.premiumEmployee), pd = num_(c.premiumDependant === '' || c.premiumDependant == null ? 0 : c.premiumDependant);
      if (!code || seen[code]) fail_('bad_value');
      if (!(pe >= 0) || !(pd >= 0)) fail_('bad_amount');
      seen[code] = 1; clean.push({ code: code, nameAr: str_(c.nameAr, 60) || code, premiumEmployee: pe, premiumDependant: pd });
    });
    if (p) { // a class in use cannot disappear
      readAll_(SHEETS.INSM).forEach(function (m) { if (m.policyId === p.id && INS_LIVE[m.status] && !seen[m.insClass]) fail_('bad_value'); });
    }
    var fresh = !p;
    if (!p) p = { id: newId_('P'), ref: nextRef_('ins_policy', refsOf_(SHEETS.INSP)), createdBy: me.id, createdAt: now };
    p.insurer = insurer; p.policyNo = no; p.fromDate = from; p.toDate = to; p.classesJson = JSON.stringify(clean); p.status = d.status === 'expired' ? 'expired' : 'active';
    p.note = str_(d.note, 300); p.updatedAt = now;
    if (fresh) append_(SHEETS.INSP, p); else update_(SHEETS.INSP, p);
    audit_(me.id, fresh ? 'ins_policy_create' : 'ins_policy_update', '', { ref: p.ref });
    return { ok: true, policy: insPublicPolicy_(p, me, readAll_(SHEETS.INSM)) };
  });
}

function api_insPolicyList(req, me) {
  var members = readAll_(SHEETS.INSM);
  return { ok: true, rows: readAll_(SHEETS.INSP).map(function (p) { return insPublicPolicy_(p, me, members); }), relations: INS_RELATIONS };
}

// ---------------- members and movements ----------------

/** Shared by HR (insMemberAdd) and the employee (insDependantRequest). Returns { member, move, warnings }. */
function insAdd_(me, emp, d, ctx) {
  var p = findBy_(SHEETS.INSP, 'id', d.policyId);
  if (!p || p.status !== 'active') fail_('not_found');
  if (INS_RELATIONS.indexOf(d.relation) < 0) fail_('bad_value');
  if (!insClasses_(p).some(function (c) { return c.code === String(d.insClass || '').toUpperCase(); })) fail_('bad_value');
  var cls = String(d.insClass).toUpperCase(), t = today_(), pf = String(p.fromDate).slice(0, 10), pt = String(p.toDate).slice(0, 10);
  var from = d.fromDate ? isoDate_(d.fromDate) : (t < pf ? pf : t);
  if (!from || from < pf || from > pt) fail_('bad_date');
  var members = readAll_(SHEETS.INSM).filter(function (m) { return m.empId === emp.id && m.policyId === p.id && INS_LIVE[m.status]; }), warnings = [];
  var name = d.relation === 'self' ? emp.name : str_(d.name, 100);
  if (!name) fail_('missing_fields');
  var birth = d.birthDate ? isoDate_(d.birthDate) : '';
  if (d.birthDate && (!birth || birth > t)) fail_('bad_date');
  var gender = d.gender === 'female' ? 'female' : d.gender === 'male' ? 'male' : (d.relation === 'self' ? String(emp.gender || '') : '');
  if (d.relation === 'self') { if (members.some(function (m) { return m.relation === 'self'; })) fail_('already_exists'); }
  else {
    if (!members.some(function (m) { return m.relation === 'self'; })) fail_('employee_not_covered');
    var idNo = str_(d.idNo, 20);
    if (idNo && members.some(function (m) { return String(m.idNo) === idNo; })) fail_('already_exists');
    if (d.relation === 'child' && birth) {
      var age = insAge_(birth, from);
      if (age >= 25 && gender !== 'female') fail_('dependant_over_age');
      if (age >= 25) warnings.push('daughter_over_25');
    }
    if (d.relation === 'spouse' && members.filter(function (m) { return m.relation === 'spouse'; }).length >= 4) fail_('bad_value');
  }
  var now = new Date().toISOString(), prem = insProRata_(p, cls, d.relation, from, pt);
  var m = { id: newId_('M'), policyId: p.id, empId: emp.id, relation: d.relation, name: name, nameEn: str_(d.nameEn, 100) || (d.relation === 'self' ? String(emp.nameEn || '') : ''),
    birthDate: birth, gender: gender, idNo: str_(d.idNo, 20), insClass: cls, memberNo: '', fromDate: from, toDate: '', status: 'pending_add', premium: 0,
    note: str_(d.note, 300), createdBy: me.id, createdAt: now, updatedAt: now };
  var mv = { id: newId_('Y'), ref: nextRef_('insurance', refsOf_(SHEETS.INSMV)), memberId: m.id, policyId: p.id, empId: emp.id, kind: 'add', effective: from, fromClass: '', toClass: cls,
    premiumDelta: prem, status: 'requested', requestedBy: me.id, submittedBy: '', submittedAt: '', insurerRef: '', confirmedBy: '', confirmedAt: '', note: str_(d.note, 300), createdAt: now, updatedAt: now };
  append_(SHEETS.INSM, m); append_(SHEETS.INSMV, mv);
  return { member: m, move: mv, warnings: warnings };
}

function api_insMemberAdd(req, me) {
  var d = req.member || {};
  return withLock_(function () {
    var ctx = orgCtx_(), emp = ctx.emps[d.empId];
    if (!emp || emp.status !== 'active') fail_('not_found');
    var r = insAdd_(me, emp, d, ctx), members = {}; members[r.member.id] = r.member;
    audit_(me.id, 'ins_member_add', emp.id, { ref: r.move.ref, relation: r.member.relation });
    return { ok: true, member: insPublicMember_(r.member, ctx, me, insPolicyMap_()), move: insPublicMove_(r.move, ctx, me, members), warnings: r.warnings };
  });
}

function api_insDependantRequest(req, me) {
  var d = Object.assign({}, req.member || {}, { empId: me.id });
  if (d.relation === 'self') fail_('bad_value');
  return withLock_(function () {
    var ctx = orgCtx_(), emp = ctx.emps[me.id];
    if (!emp || emp.status !== 'active') fail_('not_found');
    var r = insAdd_(me, emp, d, ctx), members = {}; members[r.member.id] = r.member;
    audit_(me.id, 'ins_dependant_request', me.id, { ref: r.move.ref, relation: r.member.relation });
    return { ok: true, member: insPublicMember_(r.member, ctx, me, insPolicyMap_()), move: insPublicMove_(r.move, ctx, me, members), warnings: r.warnings };
  });
}

function api_insMemberDelete(req, me) {
  return withLock_(function () {
    var ctx = orgCtx_(), m = findBy_(SHEETS.INSM, 'id', req.memberId), now = new Date().toISOString();
    if (!m || m.status !== 'active') fail_('not_found');
    var note = str_(req.note, 300);
    if (!note) fail_('note_required');
    var p = findBy_(SHEETS.INSP, 'id', m.policyId), pt = String(p.toDate).slice(0, 10), eff = isoDate_(req.effective) || today_();
    if (eff < String(m.fromDate).slice(0, 10) || eff > pt) fail_('bad_date');
    if (m.relation === 'self' && readAll_(SHEETS.INSM).some(function (x) { return x.empId === m.empId && x.policyId === m.policyId && x.relation !== 'self' && INS_LIVE[x.status] && x.status !== 'pending_delete'; })) fail_('dependants_first');
    var refund = eff < pt ? -insProRata_(p, m.insClass, m.relation, addDays_(eff, 1), pt) : 0;
    m.status = 'pending_delete'; m.updatedAt = now; update_(SHEETS.INSM, m);
    var mv = { id: newId_('Y'), ref: nextRef_('insurance', refsOf_(SHEETS.INSMV)), memberId: m.id, policyId: m.policyId, empId: m.empId, kind: 'delete', effective: eff, fromClass: m.insClass, toClass: '',
      premiumDelta: refund, status: 'requested', requestedBy: me.id, submittedBy: '', submittedAt: '', insurerRef: '', confirmedBy: '', confirmedAt: '', note: note, createdAt: now, updatedAt: now };
    append_(SHEETS.INSMV, mv);
    var members = {}; members[m.id] = m;
    audit_(me.id, 'ins_member_delete', m.empId, { ref: mv.ref });
    return { ok: true, move: insPublicMove_(mv, ctx, me, members) };
  });
}

/** requested -> submitted (sent to the insurer) -> confirmed by a different person; or rejected (note). */
function api_insMoveStep(req, me) {
  var step = ['submit', 'confirm', 'reject'].indexOf(req.step) >= 0 ? req.step : '';
  if (!step) fail_('bad_request');
  return withLock_(function () {
    var ctx = orgCtx_(), x = findBy_(SHEETS.INSMV, 'id', req.id), now = new Date().toISOString();
    if (!x || (x.status !== 'requested' && x.status !== 'submitted')) fail_('not_found');
    if (x.empId === me.id) fail_('cannot_decide_own');
    if (step === 'confirm' && x.status === 'submitted' && (x.requestedBy === me.id || x.submittedBy === me.id)) fail_('second_approver_required');
    if (!insCanStep_(me, x, step)) fail_('bad_request');
    var m = findBy_(SHEETS.INSM, 'id', x.memberId), note = str_(req.note, 300);
    if (step === 'submit') { x.status = 'submitted'; x.submittedBy = me.id; x.submittedAt = now; x.insurerRef = str_(req.insurerRef, 60) || x.insurerRef; }
    else if (step === 'reject') {
      if (!note) fail_('note_required');
      x.status = 'rejected'; x.note = note;
      if (m) { m.status = x.kind === 'add' ? 'rejected' : 'active'; m.updatedAt = now; update_(SHEETS.INSM, m); }
    } else {
      var ref = str_(req.insurerRef, 60) || x.insurerRef, memberNo = str_(req.memberNo, 40);
      if (x.kind === 'add' ? !memberNo : !ref) fail_('missing_fields'); // an addition is confirmed by the insurer's member number
      x.status = 'confirmed'; x.confirmedBy = me.id; x.confirmedAt = now; x.insurerRef = ref;
      if (m && x.kind === 'add') { m.status = 'active'; m.memberNo = memberNo || m.memberNo; m.premium = Number(x.premiumDelta) || 0; }
      if (m && x.kind === 'delete') { m.status = 'deleted'; m.toDate = x.effective; }
      if (m) { m.updatedAt = now; update_(SHEETS.INSM, m); }
    }
    x.updatedAt = now;
    update_(SHEETS.INSMV, x);
    audit_(me.id, 'ins_move_' + step, x.empId, { ref: x.ref, kind: x.kind });
    var members = {}; if (m) members[m.id] = m;
    return { ok: true, move: insPublicMove_(x, ctx, me, members) };
  });
}

// ---------------- views ----------------

/** The register (hr role, admin, payroll): members, movements and, per active employee, whether they are covered. */
function api_insList(req, me) {
  if (!insCanList_(me)) fail_('forbidden');
  var ctx = orgCtx_(), pol = insPolicyMap_(), all = readAll_(SHEETS.INSM), byId = {};
  all.forEach(function (m) { byId[m.id] = m; });
  var rows = all.filter(function (m) { return (!req.policyId || m.policyId === req.policyId) && (!req.status || m.status === req.status) && (!req.empId || m.empId === req.empId); })
    .map(function (m) { return insPublicMember_(m, ctx, me, pol); });
  var moves = readAll_(SHEETS.INSMV).filter(function (x) { return !req.policyId || x.policyId === req.policyId; }).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; })
    .slice(0, 500).map(function (x) { return insPublicMove_(x, ctx, me, byId); });
  var cover = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return e.status === 'active'; }).map(function (e) {
    var self = all.filter(function (m) { return m.empId === e.id && m.relation === 'self' && INS_LIVE[m.status] && pol[m.policyId] && pol[m.policyId].status === 'active'; })[0];
    return { emp: empCard_(e), isSaudi: bool_(e.isSaudi), covered: !!self && self.status !== 'pending_add', pending: !!self && self.status === 'pending_add',
      dependants: all.filter(function (m) { return m.empId === e.id && m.relation !== 'self' && (m.status === 'active' || m.status === 'pending_delete'); }).length };
  });
  if (insSeesIds_(me)) audit_(me.id, 'ins_register_view', '', { rows: rows.length });
  return { ok: true, rows: rows, moves: moves, coverage: cover, uncoveredNonSaudi: cover.filter(function (c) { return !c.isSaudi && !c.covered; }).length };
}

function api_myInsurance(req, me) {
  var ctx = orgCtx_(), pol = insPolicyMap_(), mine = readAll_(SHEETS.INSM).filter(function (m) { return m.empId === me.id; }), byId = {};
  mine.forEach(function (m) { byId[m.id] = m; });
  var policies = {};
  mine.forEach(function (m) { if (pol[m.policyId]) policies[m.policyId] = insPublicPolicy_(pol[m.policyId], me, null); });
  return { ok: true, members: mine.map(function (m) { return insPublicMember_(m, ctx, me, pol); }), policies: Object.keys(policies).map(function (k) { return policies[k]; }),
    moves: readAll_(SHEETS.INSMV).filter(function (x) { return x.empId === me.id; }).map(function (x) { return insPublicMove_(x, ctx, me, byId); }),
    activePolicies: readAll_(SHEETS.INSP).filter(function (p) { return p.status === 'active'; }).map(function (p) { return { id: p.id, insurer: p.insurer, classes: insClasses_(p).map(function (c) { return c.code; }) }; }),
    relations: INS_RELATIONS.filter(function (r) { return r !== 'self'; }) };
}

/** Premium cost (hr role, payroll, executive): per department and class, annual and pro rata for a month; confirmed movements by month. */
function api_insCost(req, me) {
  if (!insSeesMoney_(me)) fail_('forbidden');
  var ctx = orgCtx_(), pol = insPolicyMap_(), month = /^\d{4}-\d{2}$/.test(String(req.month || '')) ? String(req.month) : today_().slice(0, 7);
  var mf = month + '-01', ml = monthLast_(month), byDept = {}, byClass = {}, tot = { members: 0, annual: 0, month: 0 };
  readAll_(SHEETS.INSM).forEach(function (m) {
    var p = pol[m.policyId]; if (!p || !(m.status === 'active' || m.status === 'pending_delete' || m.status === 'deleted')) return;
    var pf = String(p.fromDate).slice(0, 10), pt = String(p.toDate).slice(0, 10), a = [String(m.fromDate).slice(0, 10), mf, pf].sort()[2];
    var b = [String(m.toDate || pt).slice(0, 10), ml, pt].sort()[0];
    var c = insClasses_(p).filter(function (x) { return x.code === m.insClass; })[0] || {}, annual = Number(m.relation === 'self' ? c.premiumEmployee : c.premiumDependant) || 0;
    var inMonth = a <= b ? r2_(annual * insDays_(a, b) / insDays_(pf, pt)) : 0;
    if (m.status === 'deleted' && !inMonth) return;
    var e = ctx.emps[m.empId] || {}, dn = ctx.depts[e.departmentId] ? ctx.depts[e.departmentId].nameAr : (e.department || '-');
    var gd = byDept[dn] = byDept[dn] || { department: dn, members: 0, annual: 0, month: 0 }, gc = byClass[m.insClass] = byClass[m.insClass] || { insClass: m.insClass, members: 0, annual: 0, month: 0 };
    var live = m.status !== 'deleted' ? 1 : 0;
    [gd, gc, tot].forEach(function (g) { g.members += live; g.annual = r2_(g.annual + (live ? annual : 0)); g.month = r2_(g.month + inMonth); });
  });
  var moves = {};
  readAll_(SHEETS.INSMV).forEach(function (x) {
    if (x.status !== 'confirmed') return;
    var k = String(x.confirmedAt).slice(0, 7), g = moves[k] = moves[k] || { month: k, additions: 0, deletions: 0, premiumDelta: 0 };
    if (x.kind === 'add') g.additions++; else g.deletions++;
    g.premiumDelta = r2_(g.premiumDelta + (Number(x.premiumDelta) || 0));
  });
  return { ok: true, month: month, byDepartment: Object.keys(byDept).map(function (k) { return byDept[k]; }), byClass: Object.keys(byClass).map(function (k) { return byClass[k]; }),
    totals: tot, movements: Object.keys(moves).sort().map(function (k) { return moves[k]; }) };
}

hrisHook_('tasks', function (me, ctx, add) {
  if (!isHr_(me)) return;
  var moves = readAll_(SHEETS.INSMV);
  add('insurance_move', moves.filter(function (x) { return insCanStep_(me, x, 'confirm') || (x.status === 'requested' && x.empId !== me.id && x.requestedBy !== x.empId); }).length, { tab: 'hr', sec: 'insurance' });
  add('insurance_request', moves.filter(function (x) { return x.status === 'requested' && x.requestedBy === x.empId && x.empId !== me.id; }).length, { tab: 'hr', sec: 'insurance' });
});
hrisHook_('calendar', function (add, ctx, t, me) {
  var pol = insPolicyMap_(), members = readAll_(SHEETS.INSM), anyPolicy = false;
  Object.keys(pol).forEach(function (k) {
    var p = pol[k]; if (p.status !== 'active') return; anyPolicy = true;
    var end = String(p.toDate).slice(0, 10);
    if (daysBetween_(t, end) <= 60) add('policy_renewal', end, null, { insurer: p.insurer, number: p.policyNo, ref: p.ref });
  });
  Object.keys(ctx.emps).forEach(function (id) {
    var e = ctx.emps[id], hire = String(e.hireDate || '').slice(0, 10);
    if (e.status !== 'active' || bool_(e.isSaudi) || !hire || daysBetween_(hire, t) < 30) return;
    var covered = members.some(function (m) { return m.empId === id && m.relation === 'self' && INS_LIVE[m.status] && pol[m.policyId] && pol[m.policyId].status === 'active'; });
    if (!covered) add('insurance_missing', addDays_(hire, 30), ctx.emps[id], { anyPolicy: anyPolicy });
  });
});
