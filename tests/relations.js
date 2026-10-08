// Disciplinary cases and work injuries: node tests/relations.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-11-04T06:00:00Z') });
B.ctx.DEFAULT_SETTINGS.adminSeesPay = false; // these checks prove the strict mode: pay kept apart from administration (the default lets the admin hold payroll)
const devs = {}, ids = {}, toks = {};
function tok(no, fresh) { if (toks[no] && !fresh) return toks[no]; const b = B.call({ action: 'authBegin', empNo: no }); return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token); }
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no }) : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role } });
  devs[no] = new Authenticator(); const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) }); ids[no] = f.me.id; toks[no] = f.token;
}
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('3003', 'أخصائي علاقات الموظفين', 'hr');
person('5001', 'مشرف المستودع', 'employee');
['5002', '5003'].forEach(no => person(no, 'موظف ' + no, 'employee'));
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], managerId: ids['5001'] } });
direct(() => B.ctx.append_('compensation', { id: 'C1', ref: 'SAL-T1', empId: ids['5002'], effectiveFrom: '2026-01-01', basic: 6000, housing: 1500, transport: 0, otherJson: '{}', currency: 'SAR', reason: 'initial', enteredBy: ids['3001'], approvedBy: ids['1000'], approvedAt: '2026-01-01T00:00:00Z', status: 'approved', createdAt: '2026-01-01T00:00:00Z', batchId: '' }));
let r;

console.log('Penalty schedule');
r = call('5001', 'discCodes');
ok(r.ok && r.starter && r.rows.some(c => c.code === 'SMOKE'), 'managers see the starter schedule until HR saves the approved one', r.starter);
r = call('3001', 'discCodesSave', { rows: [{ code: 'LATE15', ar: 'تأخر', p: ['warning', 'fine_pct:5', 'fine_pct:10', 'fine_days:7'] }] });
ok(!r.ok && r.error === 'bad_penalty', 'a fine above 5 days is refused (Art. 66)', r);
const rows = r.ok ? [] : B.ctx.DISC_STARTER.map(c => ({ code: c.code, ar: c.ar, en: c.en, p: c.p }));
ok(call('3001', 'discCodesSave', { rows }).ok && call('3001', 'discCodes').starter === false, 'HR saves the approved schedule');

console.log('Opening a case');
const base = { empId: ids['5002'], code: 'LATE30', incidentDate: '2026-11-02', description: 'تأخر 25 دقيقة يوم الاثنين دون إذن' };
r = call('5003', 'discOpen', { case: base });
ok(!r.ok && r.error === 'forbidden', 'a colleague cannot open a case', r);
r = call('5001', 'discOpen', { case: Object.assign({}, base, { incidentDate: '2026-09-20', discoveredDate: '2026-09-25' }) });
ok(!r.ok && r.error === 'too_late', 'more than 30 days after discovery is too late (Art. 71)', r);
r = call('5001', 'discOpen', { case: base });
const c1 = r.case;
ok(r.ok && c1.ref === 'DSC-2026-00001' && c1.occurrence === 1 && c1.suggested === 'fine_pct:10' && c1.status === 'charged', 'the manager opens it: 1st occurrence, schedule says 10% of a day', c1);
r = call('5002', 'myTasks');
ok(r.tasks.some(t => t.kind === 'disc_respond'), 'the employee is asked to answer the charge');
r = call('5002', 'discList');
ok(r.ok && r.rows.length === 1 && r.rows[0].canRespond && !r.rows[0].reportedBy, 'the employee sees the charge (not who reported it)', r.rows[0]);

console.log('Answer, hearing, decision');
ok(call('5002', 'discRespond', { id: c1.id, text: 'تأخرت بسبب حادث على الطريق' }).ok, 'the employee answers in writing');
r = call('3003', 'discDecide', { id: c1.id });
ok(!r.ok && r.error === 'hearing_required', 'no penalty without a recorded hearing', r);
ok(call('3003', 'discHearing', { id: c1.id, minutes: 'استمعنا للموظف، لم يقدم ما يثبت الحادث', attendees: 'المشرف، الموارد البشرية' }).ok, 'HR records the hearing');
r = call('3003', 'discDecide', { id: c1.id, penalty: 'warning' });
ok(!r.ok && r.error === 'note_required', 'departing from the schedule needs a reason', r);
r = call('1000', 'discDecide', { id: c1.id });
ok(!r.ok && r.error === 'forbidden', 'an administrator alone cannot decide a fine (it is a pay deduction)', r);
r = call('3003', 'discDecide', { id: c1.id });
ok(r.ok && r.case.status === 'decided' && r.case.amount === 25 && r.case.adjMonth === '2026-11', 'decided as scheduled: 10% of a 250 SAR day = 25 SAR, in November payroll', r.case);
r = call('1000', 'discList');
ok(r.ok && r.rows.find(x => x.id === c1.id).amount === null && call('5002', 'discList').rows[0].amount === 25, 'the amount shows to the employee and HR, not to an administrator alone');
const adj = direct(() => B.ctx.readAll_('adjustments')).find(a => a.code === 'fine');
ok(adj && Number(adj.amount) === 25 && adj.empId === ids['5002'], 'a fine adjustment is waiting for payroll', adj);

console.log('Repeat and caps');
r = call('5001', 'discOpen', { case: Object.assign({}, base, { incidentDate: '2026-11-03', description: 'تأخر 20 دقيقة مرة أخرى دون إذن' }) });
ok(r.ok && r.case.occurrence === 2 && r.case.suggested === 'fine_pct:15', 'a repeat within 180 days is the 2nd occurrence', r.case);
const c2 = r.case;
call('3003', 'discHearing', { id: c2.id, minutes: 'تكرار التأخر، أقر الموظف بذلك' });
r = call('5001', 'discDecide', { id: c2.id });
ok(!r.ok && r.error === 'forbidden', 'a manager cannot decide', r);
r = call('3001', 'discDecide', { id: c2.id, penalty: 'suspend:6', note: 'x' });
ok(!r.ok && r.error === 'bad_penalty', 'suspension over 5 days is refused', r);
r = call('3001', 'discDecide', { id: c2.id, penalty: 'suspend:3', note: 'تكرار مع تحذير سابق' });
ok(r.ok && r.case.amount === 750, 'a 3-day suspension is deducted: 750 SAR', r.case && r.case.amount);
r = call('5001', 'discOpen', { case: Object.assign({}, base, { code: 'SAFETY', incidentDate: '2026-11-04', description: 'فتح صمام أسطوانة دون قفازات الحماية' }) });
const c3 = r.case; call('3003', 'discHearing', { id: c3.id, minutes: 'أقر بالمخالفة' });
r = call('3003', 'discDecide', { id: c3.id, penalty: 'suspend:3', note: 'خطورة المخالفة' });
ok(!r.ok && r.error === 'suspension_cap', 'at most 5 suspension days in a month (Art. 66)', r);

console.log('Objection');
r = call('5002', 'discObject', { id: c1.id, text: 'أطلب إعادة النظر فالحادث مثبت بتقرير المرور' });
ok(r.ok && r.case.status === 'objected', 'the employee objects within 15 days (Art. 72)');
r = call('3003', 'discObjectionDecide', { id: c1.id, result: 'cancelled', note: 'x' });
ok(!r.ok && r.error === 'second_approver_required', 'the one who decided does not rule on the objection', r);
r = call('1000', 'discObjectionDecide', { id: c1.id, result: 'cancelled', note: 'x' });
ok(!r.ok && r.error === 'forbidden', 'nor rule on the objection to it', r);
r = call('3001', 'discObjectionDecide', { id: c1.id, result: 'cancelled', note: 'قدم تقرير المرور' });
ok(r.ok && r.case.status === 'closed', 'another HR person cancels the penalty');
const adj2 = direct(() => B.ctx.readAll_('adjustments')).find(a => a.code === 'fine');
ok(adj2.status === 'deleted', 'the unpaid fine is removed from payroll');

console.log('Work injury');
r = call('5003', 'injuryReport', { injury: { empId: ids['5002'], occurredAt: '2026-11-03T10:30', place: 'x', description: 'y' } });
ok(!r.ok && r.error === 'forbidden', 'a colleague cannot report for someone else', r);
r = call('5001', 'injuryReport', { injury: { empId: ids['5002'], occurredAt: '2026-11-03T10:30', place: 'مستودع الأسطوانات', description: 'سقطت أسطوانة على القدم أثناء التحميل', firstAid: 'إسعاف أولي وثلج' } });
const inj = r.injury;
ok(r.ok && inj.ref === 'INJ-2026-00001' && inj.gosiDue === '2026-11-06', 'the manager reports it; GOSI is due in 3 days', inj);
r = call('3001', 'complianceCalendar');
ok(r.items.some(x => x.kind === 'injury_gosi' && x.due === '2026-11-06'), 'it appears in the compliance calendar');
r = call('3001', 'myTasks');
ok(r.tasks.some(t => t.kind === 'injury'), 'and in HR\'s tasks');
ok(call('3001', 'injuryUpdate', { id: inj.id, gosiRef: 'GOSI-OH-5521' }).ok, 'HR records the GOSI notification');
r = call('3001', 'injuryUpdate', { id: inj.id, offFrom: '2026-11-04', offTo: '2026-11-10' });
ok(r.ok && r.injury.status === 'recovering', 'days off recorded');
const off = direct(() => B.ctx.offIndex_('2026-11-01', '2026-11-30'));
ok(off(ids['5002'], '2026-11-05') && off(ids['5002'], '2026-11-05').leave === 'injury', 'injury days count as leave in attendance, never absence');
ok(call('3001', 'injuryUpdate', { id: inj.id, close: true, note: 'عاد للعمل' }).ok, 'closed with a note');

console.log('Art. 72 (amended 2025): 30 days from notice, official holidays not counted; the employer answers in 15');
ok(B.ctx.objectionDue_('2026-11-04', {}) === '2026-12-04', 'without holidays the window ends 30 calendar days after the notice', B.ctx.objectionDue_('2026-11-04', {}));
ok(B.ctx.objectionDue_('2026-11-04', { '2026-11-20': 'x', '2026-11-21': 'x', '2026-11-22': 'x' }) === '2026-12-07', 'three holiday days push it three days later');
ok(call('3001', 'holidaySave', { holiday: { date: '2026-11-20', toDate: '2026-11-22', nameAr: 'إجازة رسمية' } }).ok, 'HR adds a 3-day official holiday inside the window');
r = call('5002', 'discList');
const c2v = r.rows.find(x => x.id === c2.id);
ok(c2v.canObject && c2v.objectionDue === '2026-12-07' && c2v.notifiedOn === '2026-11-04' && c2v.objectDaysLeft === 33, 'the case card shows the deadline across the holiday and the countdown', c2v);
// a second decided case, then a later notice date recorded by HR (registered mail)
r = call('3001', 'discOpen', { case: { empId: ids['5003'], code: 'EARLY', incidentDate: '2026-11-03', description: 'انصرف قبل نهاية الدوام بساعة دون إذن' } });
const c4 = r.case;
call('3003', 'discHearing', { id: c4.id, minutes: 'أقر الموظف بالانصراف المبكر' });
ok(call('3003', 'discDecide', { id: c4.id }).ok, 'a warning is decided (no deduction)');
r = call('3001', 'discNotice', { id: c4.id, date: '2026-11-03' });
ok(!r.ok && r.error === 'bad_date', 'a notice date before the decision is refused', r);
r = call('5001', 'discNotice', { id: c4.id, date: '2026-11-04' });
ok(!r.ok && r.error === 'forbidden', 'only HR records the notice date', r);
B.setNow(Date.parse('2026-11-06T06:00:00Z')); Object.keys(toks).forEach(k => delete toks[k]);
r = call('3001', 'discNotice', { id: c4.id, date: '2026-11-06' });
ok(r.ok && r.case.notifiedOn === '2026-11-06' && r.case.objectionDue === '2026-12-09', 'notified by registered mail on 6 Nov: the window runs to 9 Dec (holidays skipped)', r.case);
B.setNow(Date.parse('2026-12-07T06:00:00Z')); Object.keys(toks).forEach(k => delete toks[k]);
r = call('5002', 'discObject', { id: c2.id, text: 'أعترض على مدة الإيقاف فهي أشد من اللائحة' });
ok(r.ok && r.case.status === 'objected' && r.case.decideDue === '2026-12-22', 'day 30 of the window (holidays not counted) is still accepted; HR must answer by 22 Dec', r.case);
B.setNow(Date.parse('2026-12-10T06:00:00Z')); Object.keys(toks).forEach(k => delete toks[k]);
r = call('5003', 'discObject', { id: c4.id, text: 'أعترض على القرار' });
ok(!r.ok && r.error === 'too_late', 'day 31 is refused', r);
r = call('3001', 'complianceCalendar');
const due72 = r.items.find(x => x.kind === 'disc_objection_decide');
ok(due72 && due72.due === '2026-12-22' && due72.level === 'warn', 'the 15-day answer deadline is in the compliance calendar', due72);
B.setNow(Date.parse('2026-12-22T06:00:00Z')); Object.keys(toks).forEach(k => delete toks[k]);
r = call('3003', 'myTasks');
let tk = r.tasks.find(x => x.kind === 'disc_objection');
ok(tk && tk.due === '2026-12-22' && tk.overdue === 0 && !call('3001', 'discList').rows.find(x => x.id === c2.id).decideOverdue, 'day 15: due today, not overdue yet', tk);
B.setNow(Date.parse('2026-12-23T06:00:00Z')); Object.keys(toks).forEach(k => delete toks[k]);
r = call('3003', 'myTasks'); tk = r.tasks.find(x => x.kind === 'disc_objection');
ok(tk && tk.overdue === 1, 'day 16: the bell marks it overdue', tk);
ok(call('3001', 'discList').rows.find(x => x.id === c2.id).decideOverdue === true, 'and the case carries the overdue flag');
r = call('3001', 'complianceCalendar');
ok(r.items.find(x => x.kind === 'disc_objection_decide').level === 'error', 'the calendar shows it as overdue');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
