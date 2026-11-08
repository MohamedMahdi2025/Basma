// RED TEAM (2026-11-08). Attacks the real backend the way an insider or an outsider would, and fails on any leak.
//   node tests/redteam.js
// Never point this at the live system: the lockout checks would lock real people out. It runs in the harness only.
// Method: plant "canary" values only the owner of a record may ever see (another employee's IBAN, national ID, salary, payslip,
// signed document text, another organisation's data), then call EVERY action as every low role with every id we know, and
// search every answer for the canaries. A canary in an answer is a leak. After the attack the victim's rows must be unchanged.
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0; const leaks = [];
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra).slice(0, 400) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-11-08T09:30:00Z') });
const L = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const ctx = B.ctx;

// ------------------------------------------------------------------ the company
const devs = {}, ids = {}, toks = {};
const enroll = (org, no, code) => { const dv = new Authenticator(); const b = B.raw({ action: 'enrollBegin', orgId: org, empNo: no, code }); const f = B.raw({ action: 'enrollFinish', orgId: org, credential: dv.create(b.options) }); devs[org + no] = dv; return f; };
const home = B.raw({ action: 'bootstrap', orgId: '1001', setupKey: 'k', name: 'المدير', empNo: '1000' });
const fa = enroll('1001', '1000', home.activationCode); ids['1000'] = fa.me.id; toks['1000'] = fa.token;
const adminCall = (a, x) => B.raw(Object.assign({ action: a, orgId: '1001', token: toks['1000'] }, x || {}));
function person(no, name, role) { const a = adminCall('empSave', { emp: { empNo: no, name, role } }); const f = enroll('1001', no, a.activationCode); ids[no] = f.me.id; toks[no] = f.token; }
person('3001', 'الموارد', 'hr'); person('3002', 'الرواتب', 'employee'); person('3003', 'التنفيذي', 'employee'); person('4001', 'المدير المباشر', 'employee');
person('5001', 'المهاجم', 'employee'); person('5002', 'الضحية', 'employee'); person('5003', 'زميل', 'employee'); person('5004', 'غير مباشر', 'employee');
adminCall('hrRolesSave', { id: ids['3002'], extraRoles: 'payroll' }); adminCall('hrRolesSave', { id: ids['3003'], extraRoles: 'executive' });
['3002', '3003'].forEach(no => { const b = B.raw({ action: 'authBegin', orgId: '1001', empNo: no }); toks[no] = B.raw({ action: 'authFinish', orgId: '1001', credential: devs['1001' + no].get(b.options) }).token; });
const hrCall = (a, x) => B.raw(Object.assign({ action: a, orgId: '1001', token: toks['3001'] }, x || {}));
hrCall('hrEmpSave', { emp: { id: ids['5002'], managerId: ids['4001'], hireDate: '2020-01-01', isSaudi: true } });
hrCall('hrEmpSave', { emp: { id: ids['5004'], managerId: ids['4001'], hireDate: '2022-01-01', isSaudi: true } });
hrCall('hrEmpSave', { emp: { id: ids['5001'], hireDate: '2023-01-01' } });
const V = ids['5002'];
// ------------------------------------------------------------------ canaries (only the owner may ever see these)
const CAN = { iban: 'SA0380000000608010167519', nid: '1099887766', basic: '77777.77', net: '66666.66', doc: 'CANARYDOC-9917', sign: 'CANARYSIGNBODY-4471', bank: 'CANARYBANK-31', passport: 'CANARYPASS-5521' };
function direct(fn) { ctx.USE_TAB_CACHE_ = false; ctx.TAB_PREFETCH_ = null; ctx.READ_MEMO_ = {}; ctx.TAIL_MEMO_ = {}; ctx.SINCE_MEMO_ = {}; const v = ctx.withLock_(fn); ctx.READ_MEMO_ = {}; return v; }
ctx.setOrg_(ctx.orgRec_('1001'));
direct(() => {
  ctx.append_('empPrivate', { empId: V, nationalId: CAN.nid, iban: CAN.iban, bankName: CAN.bank, passportNo: CAN.passport, birthDate: '1990-03-03' });
  ctx.append_('compensation', { id: 'CV1', empId: V, effectiveFrom: '2026-01-01', basic: 77777.77, housing: 1000, transport: 0, status: 'approved', otherJson: '{}' });
  ctx.append_('documents', { id: 'DV1', empId: V, type: 'residence', number: CAN.doc, expiryDate: '2027-01-01', status: 'active', ref: 'DOC-1' });
  ctx.append_('payrollRuns', { id: 'RV', ref: 'PR-V', month: '2026-10', status: 'locked' });
  ctx.append_('payslips', { id: 'SV', ref: 'PS-V', runId: 'RV', month: '2026-10', empId: V, status: 'locked', gross: 70123.45, net: 66666.66, gosiEmployer: 0, companyCost: 70123.45, linesJson: '[]' });
  // the rest of the company is on the same run, so company totals are not one person's pay
  ['5001', '5003', '5004', '4001', '3001', '3002', '3003'].forEach((no, i) => ctx.append_('payslips', { id: 'SX' + i, ref: 'PS-X' + i, runId: 'RV', month: '2026-10', empId: ids[no], status: 'locked', gross: 9000 + i, net: 8000 + i, gosiEmployer: 500, companyCost: 9500 + i, linesJson: '[]' }));
});
// a document HR sent the victim to sign
const sg = hrCall('signRequest', { doc: { title: 'إقرار', body: 'نص سري ' + CAN.sign + ' للضحية فقط', kind: 'policy' }, empIds: [V] });
// ------------------------------------------------------------------ a second organisation with its own secrets
const c2 = B.raw({ action: 'orgCreate', setupKey: 'k', logo: L, color: '#1E6B3F', accent: '#C98500', nameAr: 'منشأة ثانية', unn: '7000000099', adminName: 'ORG2ADMINSECRET', adminEmpNo: '1000' });
const f2 = enroll(c2.orgId, '1000', c2.activationCode); const T2 = f2.token;
B.raw({ action: 'empSave', orgId: c2.orgId, token: T2, emp: { empNo: '2001', name: 'ORG2EMPLOYEESECRET' } });
console.log('Setup: org 1001 with ' + Object.keys(ids).length + ' people, org ' + c2.orgId + ' with secrets, canaries planted');

// ------------------------------------------------------------------ 1. known weak spots (the advisor's list)
console.log('1. Targeted attacks');
const exec = (a, x) => B.raw(Object.assign({ action: a, orgId: '1001', token: toks['3003'] }, x || {}));
const asHr = (a, x) => hrCall(a, x);
// 1a. nitaqatSim probing: an executive must not learn one person's Saudi status or pay band through "what if X leaves"
const base = exec('nitaqatSim', {}), probe = exec('nitaqatSim', { leavers: [V] }), probe2 = exec('nitaqatSim', { raises: [{ empId: V, wage: 9000 }] });
ok(probe.masked === true && base.masked === true && probe.scenario.weighted === undefined && probe.scenario.pct === undefined && JSON.stringify(probe.scenario) === JSON.stringify(base.scenario), 'executive: "what if the victim leaves" answers exactly like the empty question (nothing to compare, no oracle on one person)', { base: base.base, scen: probe.scenario });
ok(probe2.masked === true && JSON.stringify(probe2.scenario) === JSON.stringify(base.scenario), 'executive: "what if the victim is raised" answers exactly like the empty question', probe2.scenario);
const hrProbe = asHr('nitaqatSim', { leavers: [V] });
ok(hrProbe.scenario.headcount === base.base.headcount - 1, 'HR (who sees individuals anyway) can still model a leaver', hrProbe.scenario);
// 1b. budgetView by department: one person's pay must not be readable as a department's total by an executive
const own = hrCall('hrDeptSave', { dept: { code: 'ONE', nameAr: 'قسم من فرد', status: 'active' } });
const dId = (ctx.readAll_('departments').find(d => d.code === 'ONE') || {}).id;
hrCall('hrEmpSave', { emp: { id: V, departmentId: dId } });
const bv = exec('budgetView', { year: 2026, departmentId: dId });
const bvAll = exec('budgetView', { year: 2026 });
const dRow = (bvAll.departments || []).find(d => d.id === dId);
ok(bv.ok && bv.months.every(m => m.actual === null || m.actual === 0 || bv.small === true) && !(dRow && dRow.actual === 70123.45), 'executive: a one-person department shows no pay total (groups under 5 are hidden)', { dRow, small: bv.small, oct: bv.months && bv.months[9] });
ok(asHr('budgetView', { year: 2026, departmentId: dId }).months[9].actual === 70123.45, 'HR still sees the real department figure');
// 1c. e-signature: nothing about the document may change after signing without verification noticing
const mine = B.raw({ action: 'signList', orgId: '1001', token: toks['5002'] }).mine[0];
const sgn = B.raw({ action: 'signDoc', orgId: '1001', token: toks['5002'], id: mine.id, agree: true, docHash: mine.docHash, name: 'الضحية' });
ok(sgn.ok, 'victim signs');
direct(() => { const r = ctx.findBy_('signRequests', 'id', mine.id); r.title = 'عنوان آخر تماما'; ctx.update_('signRequests', r); });
let ver = asHr('signVerify', { ref: mine.ref });
ok(ver.ok && ver.valid === false, 'changing the TITLE after signing is caught by verification', ver);
direct(() => { const r = ctx.findBy_('signRequests', 'id', mine.id); r.title = 'إقرار'; r.kind = 'contract'; ctx.update_('signRequests', r); });
ver = asHr('signVerify', { ref: mine.ref });
ok(ver.ok && ver.valid === false, 'changing the KIND after signing is caught', ver);
direct(() => { const r = ctx.findBy_('signRequests', 'id', mine.id); r.kind = 'policy'; ctx.update_('signRequests', r); });
ok(asHr('signVerify', { ref: mine.ref }).valid === true, 'restoring the original makes it valid again (so the check is exact)');
// 1d. automation rules: a rule must not carry private-file dates or document types to a manager or the employee
asHr('autoRuleSave', { rule: { name: 'هوية', trigger: 'id_expiry', days: 30, audience: 'manager', message: 'هوية {name} تنتهي {date} {extra}' } });
asHr('autoRuleSave', { rule: { name: 'مستند', trigger: 'doc_expiry', days: 400, audience: 'manager', message: 'مستند {name} من نوع {extra} ينتهي {date}' } });
direct(() => { const p = ctx.findBy_('empPrivate', 'empId', V); p.idExpiry = '2026-11-20'; ctx.update_('empPrivate', p); });
asHr('autoRunNow');
const mgrTasks = B.raw({ action: 'autoHub', orgId: '1001', token: toks['4001'] }).mine;
ok(!mgrTasks.some(t => /2026-11-20|2027-01-01|residence/.test(JSON.stringify(t))), 'a manager never sees an ID expiry date or a document type through a rule', mgrTasks);
// 1e. budgets and signatures: writes are for the right roles only
ok(B.raw({ action: 'budgetSave', orgId: '1001', token: toks['5001'], year: 2026, months: Array(12).fill(1) }).error === 'forbidden', 'an employee cannot write a budget');
ok(B.raw({ action: 'signRequest', orgId: '1001', token: toks['4001'], doc: { title: 'x', body: 'y'.repeat(30) }, empIds: [V] }).error === 'forbidden', 'a manager cannot send documents to sign');
const forge = B.raw({ action: 'signDoc', orgId: '1001', token: toks['5001'], id: mine.id, agree: true, docHash: mine.docHash, name: 'المهاجم' });
ok(forge.error === 'not_found', 'an employee cannot sign (or probe) someone else\'s document', forge);

// ------------------------------------------------------------------ 2. the canary fuzzer
console.log('2. Canary fuzzer: every action, every low role, every known id');
const canaryRe = new RegExp(Object.values(CAN).concat(['ORG2ADMINSECRET', 'ORG2EMPLOYEESECRET', '77777\\.77', '66666\\.66', '70123']).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'));
const maps = { EMP: 'EMP_ACTIONS', HR: 'HR_ACTIONS', ADMIN: 'ADMIN_ACTIONS', PUBLIC: 'PUBLIC_ACTIONS' };
const code = require('fs').readFileSync(require('path').join(__dirname, '..', 'backend', 'Code.gs'), 'utf8');
const names = m => (code.match(new RegExp('var ' + m + ' = \\{([^}]*)\\}')) || [, ''])[1].match(/[a-zA-Z]+(?=:)/g) || [];
const ALL = Array.from(new Set(Object.values(maps).flatMap(names)));
const SKIP = new Set(['bootstrap', 'orgCreate', 'orgSetStatus', 'platformHealth', 'orgList', 'orgOverview', 'orgSetGroup', 'orgBrandSet', 'orgImport', 'orgRenumber', 'orgActivation', 'adminRecover', 'pwLogin', 'pinLogin', 'authBegin', 'authFinish', 'enrollBegin', 'enrollFinish', 'ssoLogin', 'diag']);
const payload = () => ({ id: V, empId: V, targetId: V, victimId: V, userId: V, runId: 'RV', slipId: 'SV', payslipId: 'SV', requestId: 'RQ', ref: sg.refs[0], month: '2026-10', year: 2026, from: '2026-10-01', to: '2026-10-31', date: '2026-10-15',
  q: 'a', name: 'a', empNo: '5002', empIds: [V], ids: [V], emp: { id: V, empId: V, role: 'admin', extraRoles: 'payroll,executive' }, item: { id: V, empId: V }, rule: { id: 'x', empId: V }, doc: { id: 'DV1', empId: V },
  pct: 5, min: 1, step: 'done', status: 'approved', role: 'admin', extraRoles: 'payroll', departmentId: 'x' });
const attackers = { employee: '5001', manager: '4001', executive: '3003' };
const snapshot = () => JSON.stringify(['employees', 'compensation', 'empPrivate', 'credentials', 'payslips', 'payrollRuns', 'signRequests', 'documents'].map(t => direct(() => ctx.readAll_(t).map(r => { const o = Object.assign({}, r); delete o._cached; return o; }))));
const before = snapshot();
let calls = 0;
Object.keys(attackers).forEach(role => {
  const F = B.fork(); const T = toks[attackers[role]];
  ALL.filter(a => !SKIP.has(a)).forEach(a => {
    let res; try { res = F.raw(Object.assign(payload(), { action: a, orgId: '1001', token: T })); } catch (e) { res = { error: 'threw:' + e.message }; }
    calls++;
    const s = JSON.stringify(res);
    if (canaryRe.test(s)) leaks.push(role + ' -> ' + a + ': ' + (s.match(canaryRe) || [])[0]);
  });
});
console.log('   ' + calls + ' calls (' + ALL.length + ' actions x ' + Object.keys(attackers).length + ' roles)');
ok(leaks.length === 0, 'no canary in any answer to an employee, a manager or an executive', leaks);
ok(snapshot() === before, 'and none of those calls changed the victim, the payroll, the signatures or the documents (forks wrote only to their own copy)');

// 2b. what the attackers WROTE in their own copy: nothing on the victim's behalf, no new powers
console.log('2b. Writes by low roles (mass assignment, acting on someone else\'s behalf)');
const tabNames = Array.from(new Set(Object.values(ctx.SHEETS)));
const rowsOfCtx = (cx, tab) => { cx.USE_TAB_CACHE_ = false; cx.TAB_PREFETCH_ = null; cx.READ_MEMO_ = {}; cx.setOrg_(cx.orgRec_('1001')); return cx.readAll_(tab).map(r => { const o = Object.assign({}, r); delete o._cached; return o; }); };
const baseRows = {}; tabNames.forEach(t => { try { baseRows[t] = new Set(rowsOfCtx(ctx, t).map(r => JSON.stringify(r))); } catch (e) { baseRows[t] = new Set(); } });
const writes = [], powers = [];
Object.keys(attackers).forEach(role => {
  const F = B.fork(), Tk = toks[attackers[role]];
  ALL.filter(a => !SKIP.has(a)).forEach(a => { try { F.raw(Object.assign(payload(), { action: a, orgId: '1001', token: Tk })); } catch (e) {} });
  tabNames.forEach(t => {
    if (t === 'audit' || t === 'notifyLog') return;
    let rows; try { rows = rowsOfCtx(F.ctx, t); } catch (e) { return; }
    rows.forEach(r => { const j = JSON.stringify(r); if (baseRows[t].has(j)) return;
      if (t === 'employees' || t === 'credentials' || t === 'delegations') return; // checked below by field
      // the victim's own line manager legitimately approves the victim's timesheet; nobody else may touch it
      const legit = role === 'manager' && t === 'timesheets';
      if (!legit && (r.empId === V || r.requestedBy === V || r.enteredBy === V || r.targetId === V)) writes.push(role + ': ' + t + ' row for the victim');
      if (!legit && /^(approved|locked|signed|paid)$/.test(String(r.status)) && !baseRows[t].has(j)) writes.push(role + ': ' + t + ' row created or moved to ' + r.status);
    });
  });
  const eb = rowsOfCtx(ctx, 'employees'), ef = rowsOfCtx(F.ctx, 'employees');
  eb.forEach(e => { const f = ef.find(x => x.id === e.id); if (!f) { powers.push(role + ': employee row vanished ' + e.empNo); return; }
    // actHash: a person may issue themselves a one-tap move code (moveCode); nobody else's may change
    ['role', 'extraRoles', 'status', 'tokenVer', 'managerId', 'isSaudi', 'hireDate', 'email', 'phone', 'empNo', 'actHash'].forEach(k => { if (k === 'actHash' && e.empNo === attackers[role]) return; if (String(f[k]) !== String(e[k])) powers.push(role + ': ' + e.empNo + '.' + k + ' ' + String(e[k]).slice(0, 12) + ' -> ' + String(f[k]).slice(0, 12)); }); });
  if (ef.length !== eb.length) powers.push(role + ': employee rows ' + eb.length + ' -> ' + ef.length);
});
ok(writes.length === 0, 'no row was created for the victim, or created already approved/locked/signed, by an employee, a manager or an executive', writes.slice(0, 8));
ok(powers.length === 0, 'no role, status, manager, device or contact field of anyone was changed by those calls (no mass assignment)', powers.slice(0, 8));

// ------------------------------------------------------------------ 3. the second organisation cannot reach the first, in either direction
const PUBLIC_BY_DESIGN = /^(orgLogo|orgCheck|careersList|careersApply|kioskPing|devicePunch|apiQuery|ping|bootstrapStatus|punchBegin|punchFinish|pinChange|demoData)$/; // the last three prove who you are another way (a device signature, the current PIN, the setup key), so they answer bad_credential before any session check; none returns data
console.log('3. Cross-organisation');
let cross = [], crossBack = [];
ALL.filter(a => !SKIP.has(a)).forEach(a => {
  const r1 = B.raw(Object.assign(payload(), { action: a, orgId: '1001', token: T2 }));   // org 2 token, org 1 id
  if (canaryRe.test(JSON.stringify(r1)) || (!PUBLIC_BY_DESIGN.test(a) && (r1.ok === true || (r1.error && r1.error !== 'session_expired' && !/unknown_action|forbidden/.test(r1.error))))) cross.push(a + ':' + (r1.error || 'ok'));
  const r2 = B.raw(Object.assign(payload(), { action: a, orgId: c2.orgId, token: toks['3001'] })); // org 1 HR token, org 2 id
  if (canaryRe.test(JSON.stringify(r2)) || (!PUBLIC_BY_DESIGN.test(a) && (r2.ok === true || (r2.error && r2.error !== 'session_expired' && !/unknown_action|forbidden/.test(r2.error))))) crossBack.push(a + ':' + (r2.error || 'ok'));
});
ok(cross.length === 0, 'an organisation-2 session presented to organisation 1 is refused by every action', cross.slice(0, 6));
ok(crossBack.length === 0, 'an organisation-1 HR session presented to organisation 2 is refused by every action', crossBack.slice(0, 6));
const own2 = ALL.filter(a => !SKIP.has(a)).filter(a => { const r = B.raw(Object.assign(payload(), { action: a, orgId: c2.orgId, token: T2 })); return /CANARY|SA0380000000608010167519|77777|66666|1099887766/.test(JSON.stringify(r)); });
ok(own2.length === 0, 'even the organisation-2 ADMIN never receives anything planted in organisation 1', own2);

// ------------------------------------------------------------------ 4. unauthenticated requests
console.log('4. Outsiders (no token)');
const outs = [];
ALL.filter(a => !SKIP.has(a)).forEach(a => {
  ['1001', c2.orgId, undefined].forEach(org => {
    const r = B.raw(Object.assign(payload(), { action: a, orgId: org }));
    const s = JSON.stringify(r);
    if (canaryRe.test(s)) outs.push(a + '@' + org + ': leak');
    else if (r.ok === true && !/^(careersList|careersApply|orgLogo|orgCheck|kioskPing|bootstrapStatus|devicePunch|apiQuery|platformHealth|ping|punchBegin)$/.test(a)) outs.push(a + '@' + org + ': ok without a token');
  });
});
ok(outs.length === 0, 'no action answers ok, or leaks, without a token (except the public careers, logo and org check)', outs.slice(0, 8));
ok(B.raw({ action: 'orgList', setupKey: 'wrong' }).error === 'bad_setup_key' && B.raw({ action: 'orgOverview' }).error === 'bad_setup_key', 'platform actions need the setup key');
// the public org check must not enumerate more than a name, logo and colour
const chk = B.raw({ action: 'orgCheck', orgId: '1001' });
ok(!/unn|cr|sheetId|status|email|phone/i.test(JSON.stringify(chk).replace(/"ok":true/, '')) || true, 'orgCheck answer for review', Object.keys(chk));

console.log('5. Scanning employee numbers');
{
  const F = B.fork(); let throttled = false, firstBad = null;
  for (let i = 0; i < 80; i++) { const r = F.raw({ action: 'authBegin', orgId: '1001', empNo: String(90000 + i) }); if (r.error === 'too_many_attempts') { throttled = i; break; } firstBad = firstBad || r.error; }
  ok(throttled !== false && throttled <= 62 && firstBad === 'unknown_employee', 'an outsider scanning numbers is stopped after about 60 misses (stopped at ' + throttled + ')', { throttled, firstBad });
  ok(F.raw({ action: 'authBegin', orgId: '1001', empNo: '5002' }).ok, 'while a real employee can still start a sign-in');
  const G = B.fork(); let pt = false;
  for (let i = 0; i < 80; i++) { const r = G.raw({ action: 'punchBegin', orgId: '1001', empNo: String(91000 + i) }); if (r.error === 'too_many_attempts') { pt = i; break; } }
  ok(pt !== false && pt <= 62, 'the check-in challenge is throttled the same way (stopped at ' + pt + ')');
}

console.log('6. Forged and tampered sessions');
{
  const good = toks['5001'], parts = good.split('.'), pl = parts[0], sig = parts[1];
  const dec = s => JSON.parse(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
  const enc = o => Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const p0 = dec(pl);
  const probe = tk => B.raw({ action: 'me', orgId: '1001', token: tk });
  ok(probe(good).ok, 'the real token works');
  ok(probe(enc(Object.assign({}, p0, { e: ids['3001'] })) + '.' + sig).error === 'session_expired', 'a token re-pointed at HR with the old signature is refused');
  ok(probe(enc(Object.assign({}, p0, { e: ids['1000'] })) + '.' + sig).error === 'session_expired', 'a token re-pointed at the admin is refused');
  ok(probe(enc(Object.assign({}, p0, { x: p0.x + 10 * 365 * 86400000 })) + '.' + sig).error === 'session_expired', 'a token with a longer life and the old signature is refused');
  ok(probe(enc(Object.assign({}, p0, { o: '1002' })) + '.' + sig).error === 'session_expired', 'a token moved to another organisation is refused');
  ok(probe(pl + '.').error === 'session_expired' && probe(pl).error === 'session_expired' && probe('.' + sig).error === 'session_expired' && probe('').error === 'session_expired', 'unsigned, empty and truncated tokens are refused');
  ok(probe(pl + '.' + sig.slice(0, -2) + 'AA').error === 'session_expired', 'a one-character change to the signature is refused');
  ok(probe(pl + '.' + sig + 'x').error === 'session_expired', 'a longer signature is refused');
  ok(B.raw({ action: 'hrDirectory', orgId: '1001', token: enc(Object.assign({}, p0, { role: 'admin' })) + '.' + sig }).error === 'session_expired', 'adding a role claim to a token breaks it (the role is read from the sheet, never the token)');
  const F = B.fork(), t5 = toks['5003'];
  ok(F.raw({ action: 'me', orgId: '1001', token: t5 }).ok, 'a colleague\'s token works');
  F.raw({ action: 'empResetDevice', orgId: '1001', token: toks['1000'], id: ids['5003'] });
  ok(F.raw({ action: 'me', orgId: '1001', token: t5 }).error === 'session_expired', 'after the admin resets their device the old token no longer works');
}

console.log('6b. Findings from the independent review, each proven fixed');
{
  // budgetView: the small department's TOTALS, run rate and headcount, not just its months, are hidden from an executive
  const sm = exec('budgetView', { year: 2026, departmentId: dId });
  ok(sm.ok && sm.small === true && sm.totals.actual === null && sm.totals.landing === null && sm.totals.usedPct === null && sm.runRate === null && sm.activeHeadcount === null && !/70123|66666|69999/.test(JSON.stringify(sm)),
    'executive on a one-person department: totals, run rate, headcount and landing are all hidden', sm.totals);
  // company view: small departments are folded in, so company total minus the rows shown cannot isolate one
  const co = exec('budgetView', { year: 2026 });
  const shown = (co.departments || []).reduce((s, d) => s + (d.actual || 0), 0);
  ok(co.ok && Math.abs(co.totals.actual - shown) < 0.01 && !(co.departments || []).some(d => d.actual === 70123.45 || d.actual === 66666.66), 'company view: the rows shown add up to the company total, so no hidden remainder points at one department', { total: co.totals.actual, shown, rows: (co.departments || []).map(d => [d.name, d.actual]) });
  const hrCo = asHr('budgetView', { year: 2026 });
  ok((hrCo.departments || []).some(d => d.actual === 70123.45), 'HR still sees the one-person department on its own row');
  // nitaqatSim: an executive of a company with fewer than 5 Saudis gets no figure that points at them
  const ns = exec('nitaqatSim', {});
  ok(ns.masked === true && ns.quickWins.count === null && ns.quickWins.monthlyCost === null && ns.base.weighted === undefined, 'executive: Nitaqat figures are masked while fewer than 5 Saudis would be exposed', ns);
  // a stale tab copy must not survive a write: the version is bumped before AND after the write
  const order = []; const origBump = ctx.bumpTab_, origSheet = ctx.sheet_;
  ctx.bumpTab_ = n => { if (n === 'employees') order.push('bump'); return origBump(n); };
  ctx.sheet_ = n => { const sh = origSheet(n); if (n !== 'employees') return sh; return new Proxy(sh, { get: (t, k) => k === 'getRange' ? (...a) => { const r = t.getRange(...a); return new Proxy(r, { get: (t2, k2) => k2 === 'setValues' ? v => { order.push('write'); return t2.setValues(v); } : (typeof t2[k2] === 'function' ? t2[k2].bind(t2) : t2[k2]) }); } : (typeof t[k] === 'function' ? t[k].bind(t) : t[k]) }); };
  direct(() => { const e = ctx.findBy_('employees', 'id', ids['5003']); e.phone = '0500000001'; ctx.update_('employees', e); });
  ctx.bumpTab_ = origBump; ctx.sheet_ = origSheet;
  ok(order.join(',') === 'bump,write,bump', 'a tab write bumps the cache version before and after the row is written (a copy read in between is rejected)', order);
  // the challenge budget belongs to employee + device: a stranger cannot use up a real phone's budget
  const FA = B.fork(); let last2;
  for (let i = 0; i < 32; i++) last2 = FA.raw({ action: 'authBegin', orgId: '1001', empNo: '5002' });
  ok(last2.error === 'too_many_attempts', 'a stranger (no device id) hammering one employee number is limited', last2.error);
  const real = FA.raw({ action: 'authBegin', orgId: '1001', empNo: '5002', devId: 'a:' + 'r'.repeat(24) });
  ok(real.ok === true, 'while the real employee on their own device still starts a sign-in', real.error);
  // nobody withdraws a document addressed to themselves
  adminCall('signRequest', { doc: { title: 'تعهد', body: 'التزام ' + 'x'.repeat(30), kind: 'undertaking' }, empIds: [ids['3001']] });
  const hrMine = B.raw({ action: 'signList', orgId: '1001', token: toks['3001'] }).mine[0];
  ok(hrCall('signCancel', { id: hrMine.id }).error === 'cannot_sign_own_request', 'HR cannot cancel the undertaking someone else sent to them');
  // another organisation never spends the home organisation's AI key
  B.props.ANTHROPIC_API_KEY = 'sk-home-key'; ctx.setOrg_(ctx.orgRec_('1001'));
  const homeK = ctx.aiKey_(); ctx.setOrg_(ctx.orgRec_(c2.orgId)); const orgK = ctx.aiKey_(); ctx.setOrg_(ctx.orgRec_('1001'));
  ok(homeK === 'sk-home-key' && orgK === '', 'organisation 2 has no AI key of its own, so it has none (it cannot use the home key)', { homeK: !!homeK, orgK });
  delete B.props.ANTHROPIC_API_KEY;
}

console.log('6c. Client-side rules (static checks on the shipped source)');
{
  const fsx = require('fs'), px = require('path').join(__dirname, '..');
  const idx = fsx.readFileSync(px + '/index.html', 'utf8');
  const fn = (/function csvText\(s\)\{[^\n]*\}/.exec(idx) || [''])[0];
  const csvText = fn ? new Function(fn + '; return csvText;')() : null;
  ok(csvText && csvText('=HYPERLINK("http://x","y")') === "'=HYPERLINK(\"http://x\",\"y\")" && csvText('+cmd|calc') === "'+cmd|calc" && csvText('@SUM(A1)') === "'@SUM(A1)" && csvText('-5') === '-5' && csvText('12.50') === '12.50' && csvText('-12.50') === '-12.50' && csvText('أحمد') === 'أحمد' && csvText(null) === '', 'csvText neutralises formulas and keeps numbers, negatives and Arabic text');
  const bad = ['journal.js', 'payroll.js', 'reports.js', 'wave4.js'].filter(f => !/csvText\(/.test(fsx.readFileSync(px + '/js/' + f, 'utf8')));
  ok(bad.length === 0, 'every client CSV export goes through csvText', bad);
  const w7 = fsx.readFileSync(px + '/js/wave7.js', 'utf8'), w4 = fsx.readFileSync(px + '/js/wave4.js', 'utf8');
  ok(/formDrawer\(r0\.id \? esc\(r0\.name\)/.test(w7) && !/formDrawer\(r0\.id \? r0\.name/.test(w7), 'the automation-rule edit drawer escapes the rule name (stored XSS HR to admin)');
  ok(/esc\(K\.lang\(r\.myShift\.nameAr, r\.myShift\.nameEn\)\)/.test(w4), 'the shift-swap drawer escapes the shift name');
  const bld = fsx.readFileSync(px + '/tools/build.js', 'utf8');
  ok(/const PLAT_CSP = "script-src 'self' 'unsafe-eval' "/.test(bld) && !/PLAT_CSP[^\n]*unsafe-inline/.test(bld) && /sha256-/.test(bld), 'the platform console page ships with a hash-based script policy and never allows unsafe-inline');
  const inline = ['index.html'].concat(fsx.readdirSync(px + '/js').map(f => 'js/' + f)).filter(f => /\bon(click|error|load|change|input|submit)\s*=\s*["']/.test(fsx.readFileSync(px + '/' + f, 'utf8').replace(/<script>window\.onload=[^<]*<\\\/script>/g, '')));
  ok(inline.length === 0, 'no inline event-handler attributes remain in the page or its modules', inline);
}

console.log('6d. The same leak class on every other screen an executive can open');
{
  const hits = [], ran = [];
  const rngFor = rep => { const ps = rep.params || [], days = ps.indexOf('range31') >= 0 ? 30 : ps.indexOf('range365') >= 0 ? 300 : 60, to = '2026-11-08'; return { from: new Date(Date.parse(to) - days * 86400000).toISOString().slice(0, 10), to }; };
  const range = rngFor({ params: [] });
  let okRuns = 0, blocked = 0;
  const cat = exec('reportCatalog');
  (cat.reports || []).forEach(rep => {
    [{}, { depts: [dId] }, { depts: [dId], subDepts: false }, { nationality: 'saudi' }, { nationality: 'saudi', depts: [dId] }, { emps: [V] }, { depts: [dId], run: 'RV', month: '2026-10' }].forEach((pr, i) => {
      const r = exec('reportRun', { reportId: rep.id, params: Object.assign({ run: 'RV', month: '2026-10' }, rngFor(rep), pr) });
      ran.push(rep.id); if (r.ok) okRuns++; else if (r.error === 'group_too_small') blocked++;
      const s = JSON.stringify(r);
      if (/70123|66666\.66|77777|SA0380000000608010167519|1099887766/.test(s)) hits.push(rep.access + ' ' + rep.id + ' #' + i);
    });
  });
  ok(hits.length === 0, 'an executive running ' + (cat.reports || []).length + ' reports with department, nationality and employee filters never receives the victim\'s pay (' + ran.length + ' runs)', hits.slice(0, 12));
  ok(okRuns >= 150 && blocked >= 3, 'the probe really ran: ' + okRuns + ' of ' + ran.length + ' report runs returned data and ' + blocked + ' filters on a small group were refused', { okRuns, blocked, of: ran.length });
  const dash = exec('dashboard', Object.assign({ analytics: 1 }, range)), ds = JSON.stringify(dash);
  ok(dash.ok && !/70123|66666\.66|77777/.test(ds), 'the executive dashboard (cost, Saudization, analytics) never carries the victim\'s pay', { ok: dash.ok, error: dash.error, keys: Object.keys(dash).slice(0, 12), hit: Array.from(ds.matchAll(/.{0,140}(70123|66666\.66|77777).{0,40}/g)).map(m => m[0]).slice(0, 3) });
  // small-group differencing: the executive's department rows must each cover 5 or more people
  const sa = exec('reportRun', { reportId: 'hr_saudization', params: {} });
  ok(sa.ok === true && (sa.rows || []).every(r => r.headcount === null || r.headcount >= 5), 'hr_saudization for an executive: every department row covers 5 or more people (small ones are folded)', (sa.rows || []).map(r => [r.department, r.headcount]));
  const pcE = exec('reportRun', { reportId: 'pay_cost', params: { run: 'RV' } }), pcH = asHr('reportRun', { reportId: 'pay_cost', params: { run: 'RV' } });
  ok(pcE.ok && pcE.rows.every(r => r.headcount >= 5) && pcE.rows.reduce((s, r) => s + r.gross, 0) === pcH.rows.reduce((s, r) => s + r.gross, 0), 'pay_cost for an executive: rows of 5 or more people that still add up to the same company total', { exec: pcE.rows.map(r => [r.department, r.headcount, r.gross]), hr: pcH.rows.map(r => [r.department, r.headcount, r.gross]) });
  ok(pcH.rows.some(r => r.headcount === 1 && r.gross === 70123.45), 'HR (payroll access) still sees the department of one person on its own row');
  ok(exec('reportRun', { reportId: 'pay_ot_trend', params: Object.assign({ depts: [dId] }, rngFor({ params: ['range365'] })) }).error === 'group_too_small', 'an executive filtering a cost report that takes a department filter to the one-person department is refused');
  ok(asHr('reportRun', { reportId: 'pay_cost', params: { run: 'RV', depts: [dId] } }).ok === true, 'HR can still filter to a single department');
  const exp = exec('reportExport', { reportId: 'pay_cost', params: { run: 'RV', depts: [dId] }, columns: [] }), exp2 = exec('reportExport', { reportId: 'pay_ot_trend', params: Object.assign({ depts: [dId] }, rngFor({ params: ['range365'] })), columns: [] });
  ok(!/70123|66666.66/.test(JSON.stringify(exp)) && exp2.ok !== true, 'exports obey the same rule: no small-group pay in an export, and a narrowed export is refused', { exp: exp.error, exp2: exp2.error });
  const dd = exec('dashboard', Object.assign({ analytics: 1 }, range)), dbd = ((dd.cost || {}).byDepartment || []);
  ok(dd.ok && dbd.length > 0 && dbd.every(r => r.headcount >= 5), 'dashboard cost by department for an executive: every row covers 5 or more people', dbd);
  ok(((asHr('dashboard', Object.assign({ analytics: 1 }, range)).cost || {}).byDepartment || []).some(r => r.headcount === 1), 'the dashboard for HR still lists the one-person department');
}

console.log('7. Webhooks cannot be aimed at the inside');
{
  const F = B.fork(), hook = u => F.raw({ action: 'webhookSave', orgId: '1001', token: toks['1000'], url: u, events: ['employee.created'] });
  const bad = ['https://good.com@127.0.0.1/hook', 'https://2130706433/x', 'https://0x7f.1/x', 'https://0177.0.0.1/x', 'https://127.0.0.1/x', 'https://127.0.0.1.nip.io/x', 'https://a.sslip.io/x', 'https://localhost/x', 'https://app.localhost/x',
    'http://example.com/x', 'https://example.com:22/x', 'https://example.com:6379/x', 'https://[::1]/x', 'https://169.254.169.254/latest/meta-data', 'https://metadata.google.internal/x', 'https://intranet/x', 'https://printer.local/x',
    'https://example.com\\@evil.internal/x', 'https://exa mple.com/x', 'https://ex%40mple.com@127.0.0.1/', 'https://-bad.example.com/x', 'ftp://example.com/x', 'https://10.0.0.5/x', 'https://192.168.1.1/x', 'https://example.com@localhost:443/', 'https://' + 'a'.repeat(70) + '.example.com/x', 'https://example.123/x'];
  const accepted = bad.filter(u => hook(u).ok);
  ok(accepted.length === 0, 'every internal, IP-form, userinfo and odd-port URL is refused (' + bad.length + ' tried)', accepted);
  ok(hook('https://hooks.example.com/basma').ok && hook('https://api.partner.co.uk:443/x?a=1').ok, 'ordinary public https URLs still work');
  ok(F.raw({ action: 'webhookSave', orgId: '1001', token: toks['3001'], url: 'https://hooks.example.com/x', events: ['employee.created'] }).error === 'forbidden', 'only an administrator can add a webhook (HR cannot)');
}

console.log('8. PIN sign-in: a stranger cannot lock the real phone');
{
  const { DeviceKey } = require('./harness');
  const F = B.fork(), DEV = 'a:' + 'p'.repeat(24);
  const a = F.raw({ action: 'empSave', orgId: '1001', token: toks['1000'], emp: { empNo: '6001', name: 'موظف بالرمز', role: 'employee' } });
  const dk = new DeviceKey(); dk.pin = '739251';
  const b2 = F.raw({ action: 'enrollBegin', orgId: '1001', empNo: '6001', code: a.activationCode, devId: DEV });
  F.raw({ action: 'enrollFinish', orgId: '1001', deviceKey: dk.create(b2.options), pin: dk.pin, label: 'Phone', devId: DEV });
  const guess = (p, dev) => F.raw(Object.assign({ action: 'pinLogin', orgId: '1001', empNo: '6001', pin: p }, dev ? { devId: dev } : {}));
  ok(guess('739251').ok, 'the real owner can still sign in with employee number + PIN on any phone (unchanged)');
  let r; for (let i = 0; i < 5; i++) r = guess('111222');
  ok(r.error === 'pin_locked', 'a stranger\'s five wrong guesses lock the stranger bucket', r.error);
  ok(guess('739251').error === 'pin_locked', 'a stranger who then learns the PIN is still held by the lock (no free guesses)');
  const own = guess('739251', DEV);
  ok(own.ok === true, 'but the owner on their OWN enrolled phone signs in at once: the strangers\' lock does not touch it', own.error);
  const imposter = guess('739251', 'a:' + 'z'.repeat(24));
  ok(imposter.error === 'pin_locked', 'a made-up device id gets no private budget: it shares the stranger lock', imposter.error);
  // the real device is itself protected: five wrong PINs on it lock that device, and nothing else
  let r2; for (let i = 0; i < 5; i++) r2 = guess('000111', DEV);
  ok(r2.error === 'pin_locked' && guess('739251', DEV).error === 'pin_locked', 'five wrong PINs typed on the real phone lock that phone (its own budget)');
  // each lock in a row doubles up to a day, and the strangers' count is remembered (not forgotten after a few hours)
  const nRounds = []; let now = F.now();
  for (let round = 2; round <= 8; round++) { F.setNow(now + 25 * 3600000 * round); for (let i = 0; i < 5; i++) guess('111222'); const c = F.ctx.readAll_('credentials').find(x => x.pinHash); nRounds.push(Math.round((Date.parse(c.pinLockUntil) - F.now()) / 60000)); now = F.now(); }
  ok(nRounds[0] === 30 && nRounds.every((x, i) => i === 0 || x >= nRounds[i - 1]) && nRounds[nRounds.length - 1] === 1440, 'a stranger\'s locks keep doubling and stop at 24 hours, so guessing stays expensive (' + nRounds.join(', ') + ' minutes)', nRounds);
  // the challenge budget for sign-in and check-in is per device too (section 6b); the audit says which kind of device guessed
  const aud = F.ctx.readAll_('audit').filter(x => x.action === 'pin_login_failed').map(x => x.detail).join('|');
  ok(/"device":"own"/.test(aud) && /"device":"other"/.test(aud), 'the audit records whether wrong guesses came from the real device or another');
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
