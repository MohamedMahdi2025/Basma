// Visual workflow designer: "try it" (flowPreview) runs a draft exactly as a real request would. node tests/flowdesign.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-10-04T07:00:00Z') });

const devs = {}, ids = {}, toks = {};
function tok(no, fresh) {
  if (toks[no] && !fresh) return toks[no];
  const b = B.call({ action: 'authBegin', empNo: no });
  return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token);
}
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no })
    : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role } });
  devs[no] = new Authenticator();
  const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) });
  ids[no] = f.me.id; toks[no] = f.token;
}
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
const prev = (extra) => call('3001', 'flowPreview', Object.assign({ type: 'leave' }, extra));

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('5001', 'مدير المبيعات', 'employee');
person('5002', 'مندوب مبيعات', 'employee');
person('5003', 'موظف بلا مدير', 'employee');
person('5009', 'المستشار', 'employee');
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], managerId: ids['5001'] } });
const draft = [{ kind: 'manager' }, { kind: 'hr', when: { daysOver: 5 } }, { kind: 'person', personId: ids['5009'] }];

console.log('Try a draft before saving it');
ok(call('5002', 'flowPreview', { type: 'leave', steps: draft, empId: ids['5002'] }).error === 'forbidden', 'only HR and admin can use the designer');
let r = prev({ steps: draft, empId: ids['5002'], days: 3 });
ok(r.ok && r.steps.map(s => s.kind).join() === 'manager,person', 'a 3-day leave skips the "more than 5 days" step', r.steps);
ok(r.steps[0].who && r.steps[0].who.id === ids['5001'] && r.steps[1].who.id === ids['5009'], 'each step names who would approve');
ok(r.skipped.length === 1 && r.skipped[0].at === 1 && r.skipped[0].reason === 'condition', 'and says why a step was skipped', r.skipped);
r = prev({ steps: draft, empId: ids['5002'], days: 10 });
ok(r.steps.map(s => s.kind).join() === 'manager,hr,person', 'a 10-day leave passes HR too');
r = prev({ steps: draft, empId: ids['5003'], days: 2 });
ok(r.skipped.some(s => s.reason === 'no_manager'), 'someone without a manager skips the manager step', r.skipped);
r = prev({ steps: draft, empId: ids['5009'], days: 2 });
ok(r.skipped.some(s => s.reason === 'is_requester'), 'the named person never approves their own request');
r = prev({ steps: [{ kind: 'manager' }], empId: ids['5003'] });
ok(r.fallback && r.steps.length === 1 && r.steps[0].kind === 'hr', 'when no step applies the request falls back to HR, and the preview says so');
ok(prev({ steps: [{ kind: 'hr', when: { daysOver: 2 } }], empId: ids['5002'] }).error === 'flow_needs_unconditional', 'a draft is checked by the same rules as saving');
ok(call('3001', 'flowPreview', { type: 'advance', steps: [{ kind: 'manager' }, { kind: 'payroll' }], empId: ids['5002'] }).error === 'flow_step_not_allowed', 'advances still cannot go through the line manager');
ok(prev({ builtin: true, empId: ids['5002'] }).steps.map(s => s.kind).join() === 'manager,hr', 'the built-in chain can be tried too');
ok(!call('3001', 'flowList').types.filter(t => t.type === 'leave')[0].active, 'trying a flow saves nothing');

console.log('What you try is what requests get');
ok(call('3001', 'flowSave', { type: 'leave', steps: draft, note: 'designer' }).ok, 'the draft is saved as a new version');
const ctx = B.ctx.orgCtx_(), emp = ctx.emps[ids['5002']];
const real = B.ctx.flowPlan_('leave', emp, { days: 10 }, ctx).steps.map(s => s.key);
ok(real.join() === ['manager', 'hr', 'person:' + ids['5009']].join(), 'a real 10-day request takes the same steps as the preview', real);
ok(B.ctx.flowPlan_('leave', emp, { days: 3 }, ctx).steps.length === 2, 'and a real 3-day request skips the same step');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
