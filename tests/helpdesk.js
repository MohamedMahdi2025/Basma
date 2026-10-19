// HR help desk: queues, confidentiality, SLA, replies and internal notes, status, rating: node tests/helpdesk.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-11-04T06:00:00Z') });
B.ctx.DEFAULT_SETTINGS.adminSeesPay = false;
const devs = {}, ids = {}, toks = {};
function tok(no, fresh) { if (toks[no] && !fresh) return toks[no]; const b = B.call({ action: 'authBegin', empNo: no }); return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token); }
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no }) : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role } });
  devs[no] = new Authenticator(); const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) }); ids[no] = f.me.id; toks[no] = f.token;
}
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
const fresh = () => Object.keys(toks).forEach(k => delete toks[k]);

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('3002', 'أخصائي موارد بشرية', 'hr');
person('4001', 'محاسب الرواتب', 'employee');
person('5001', 'سائق', 'employee');
person('5002', 'محاسب', 'employee');
call('1000', 'hrRolesSave', { id: ids['4001'], extraRoles: 'payroll' });
fresh();
let r;

console.log('Creating tickets and queues');
ok(call('5001', 'hdCreate', { ticket: { category: 'weather', subject: 's', body: 'b' } }).error === 'bad_value', 'an unknown category is refused');
ok(call('5001', 'hdCreate', { ticket: { category: 'leave', subject: '', body: 'b' } }).error === 'missing_fields', 'subject and body are required');
r = call('5001', 'hdCreate', { ticket: { category: 'payroll', subject: 'خصم غير مفهوم', body: 'ظهر خصم 200 ريال في راتب أكتوبر', priority: 'high' } });
const T1 = r.ticket;
ok(r.ok && T1.ref === 'HD-2026-00001' && T1.queue === 'payroll' && T1.status === 'open' && T1.slaDue === '2026-11-05T06:00:00.000Z', 'HD-2026-00001 in the payroll queue, due in 24 h', T1);
r = call('5001', 'hdCreate', { ticket: { category: 'conduct', subject: 'بلاغ', body: 'سلوك غير لائق من زميل', priority: 'urgent' } });
const T2 = r.ticket;
ok(r.ok && T2.queue === 'hr_confidential' && T2.confidential === true && T2.slaDue === '2026-11-04T10:00:00.000Z', 'a conduct report is confidential, due in 4 h', T2);
r = call('5002', 'hdCreate', { ticket: { category: 'letters', subject: 'تعريف بالراتب', body: 'للبنك' } });
const T3 = r.ticket;
ok(r.ok && T3.queue === 'hr' && T3.priority === 'normal', 'a letter question in the HR queue, normal priority');
ok(call('5001', 'hdMine').rows.length === 2, 'the employee lists their own tickets');

console.log('Who sees what');
ok(call('5002', 'hdList').error === 'forbidden', 'a plain employee has no agent view');
ok(call('5002', 'hdGet', { id: T1.id }).error === 'not_found', 'nor someone else\'s ticket');
r = call('4001', 'hdList');
ok(r.ok && r.rows.length === 1 && r.rows[0].id === T1.id && r.queues.join() === 'payroll', 'payroll sees the payroll queue only');
r = call('1000', 'hdList');
ok(r.ok && r.rows.length === 1 && r.rows[0].id === T3.id, 'the administrator sees the HR queue, not payroll (adminSeesPay off) nor the confidential report');
r = call('3001', 'hdList');
ok(r.ok && r.rows.length === 3 && r.counts.unassigned === 3 && r.rows[0].id === T2.id, 'the hr role sees all three, the urgent one first');
ok(call('1000', 'hdGet', { id: T2.id }).error === 'not_found', 'the administrator cannot open the confidential report');
ok(call('3001', 'myTasks').tasks.some(t => t.kind === 'hd_unassigned' && t.count === 3 && t.target.sec === 'helpdesk'), 'the HR bell shows three unassigned');

console.log('Working a ticket');
r = call('4001', 'hdAssign', { id: T1.id });
ok(r.ok && r.ticket.assignee.empNo === '4001', 'payroll takes the payroll ticket');
ok(call('4001', 'hdAssign', { id: T1.id, assigneeId: ids['5002'] }).error === 'forbidden', 'it cannot be handed to someone who does not handle the queue');
ok(call('4001', 'hdAssign', { id: T1.id, assigneeId: ids['5001'] }).error === 'forbidden', 'nor to the requester');
r = call('4001', 'hdReply', { id: T1.id, text: 'الخصم قسط سلفة؟ تحقق من الكشف', internal: true });
ok(r.ok && r.ticket.messages.length === 1 && r.ticket.messages[0].internal && !r.ticket.firstResponseAt, 'an internal note does not count as a response');
r = call('5001', 'hdGet', { id: T1.id });
ok(r.ticket.messages.length === 0, 'the requester never sees internal notes');
r = call('4001', 'hdReply', { id: T1.id, text: 'الخصم قسط سلفة AD-2026-00003. هل لديك سؤال آخر؟', status: 'waiting_employee' });
ok(r.ok && r.ticket.status === 'waiting_employee' && r.ticket.firstResponseAt, 'a public reply: first response recorded, waiting for the employee');
ok(call('5001', 'myTasks').tasks.some(t => t.kind === 'hd_reply' && t.count === 1 && t.target.tab === 'file'), 'the employee\'s bell shows the reply');
r = call('5001', 'hdReply', { id: T1.id, text: 'نسيت السلفة، شكرا' });
ok(r.ok && r.ticket.status === 'open' && r.ticket.messages.length === 2, 'the employee answers; the ticket is open again');
ok(call('5001', 'hdStatus', { id: T1.id, status: 'resolved' }).error === 'forbidden', 'the requester cannot mark it resolved');
r = call('4001', 'hdStatus', { id: T1.id, status: 'resolved' });
ok(r.ok && r.ticket.status === 'resolved' && r.ticket.resolvedAt, 'payroll resolves it');
ok(call('5001', 'hdRate', { id: T1.id, rating: 9 }).error === 'bad_value', 'ratings are 1-5');
ok(call('4001', 'hdRate', { id: T1.id, rating: 5 }).error === 'not_found', 'only the requester rates');
r = call('5001', 'hdRate', { id: T1.id, rating: 5, note: 'رد سريع' });
ok(r.ok && r.ticket.rating === 5, 'rated 5');
ok(call('5001', 'hdRate', { id: T1.id, rating: 4 }).error === 'bad_request', 'once');

console.log('Resolution without a word, SLA, reopening');
ok(call('3002', 'hdStatus', { id: T3.id, status: 'resolved' }).error === 'note_required', 'resolving without any answer needs a note');
B.setNow(Date.parse('2026-11-07T08:00:00Z')); fresh();
r = call('3001', 'hdList', { status: 'active' });
ok(r.counts.overdue === 2, 'past their SLA: the conduct report and the letter question are overdue', r.counts);
r = call('3002', 'hdStatus', { id: T3.id, status: 'resolved', note: 'أصدرنا التعريف LT-2026-00010' });
ok(r.ok && r.ticket.status === 'resolved' && r.ticket.assignee.empNo === '3002', 'resolved with the answer; the resolver becomes the assignee');
r = call('5002', 'hdStatus', { id: T3.id, status: 'open' });
ok(r.ok && r.ticket.status === 'open', 'the requester reopens within 7 days');
call('3002', 'hdStatus', { id: T3.id, status: 'resolved', note: 'أعيد الإرسال' });
B.setNow(Date.parse('2026-11-20T08:00:00Z')); fresh();
ok(call('5002', 'hdStatus', { id: T3.id, status: 'open' }).error === 'bad_request', 'not after 7 days');
ok(call('5002', 'hdStatus', { id: T3.id, status: 'closed' }).ticket.status === 'closed', 'the requester closes it');
ok(call('3002', 'hdReply', { id: T3.id, text: 'x' }).error === 'bad_request', 'a closed ticket takes no replies');

console.log('Nobody handles their own ticket');
r = call('3001', 'hdCreate', { ticket: { category: 'leave', subject: 'رصيدي', body: 'رصيد الإجازة غير صحيح' } });
ok(!call('3001', 'hdList').rows.some(x => x.id === r.ticket.id), 'an HR person\'s own ticket is not in their agent view');
ok(call('3001', 'hdAssign', { id: r.ticket.id }).error === 'not_found', 'and they cannot take it');
ok(call('3002', 'hdAssign', { id: r.ticket.id }).ok, 'a colleague can');

console.log('Knowledge base (2026-10-19)');
{
  ok(call('5001', 'kbSeed', {}).error === 'forbidden', 'only HR loads the starter articles');
  let r = call('3001', 'kbSeed', {});
  ok(r.ok && r.count === 6, 'HR loads six starter articles', r);
  ok(call('3001', 'kbSeed', {}).error === 'already_exists', 'only once');
  ok(call('5001', 'kbList', {}).rows.length === 0, 'starters are drafts: employees see none yet');
  ok(call('5001', 'kbSearch', { q: 'رصيد الاجازة' }).rows.length === 0, 'and search finds no drafts');
  const all = call('3001', 'kbList', {}).rows;
  ok(all.length === 6 && all.every(a => a.status === 'draft'), 'HR sees the drafts with their stats');
  const leave = all.find(a => a.category === 'leave');
  const full = call('3001', 'kbGet', { id: leave.id }).article;
  ok(call('3001', 'kbSave', { article: Object.assign({}, full, { status: 'published' }) }).ok, 'HR checks and publishes the leave article');
  ok(call('5001', 'kbSave', { article: { category: 'leave', titleAr: 'x', bodyAr: 'y' } }).error === 'forbidden', 'employees cannot write articles');
  r = call('5001', 'kbSearch', { q: 'كم رصيد إجازتي السنوية؟', category: 'leave' });
  ok(r.ok && r.rows.length === 1 && r.rows[0].id === leave.id && r.rows[0].snippetAr, 'typing a question finds it (hamza and ta marbuta ignored)', r.rows);
  ok(call('5001', 'kbSearch', { q: 'leave balance' }).rows.length === 1, 'English words find it too');
  ok(call('5001', 'kbSearch', { q: 'سيارة الشركة' }).rows.length === 0, 'an unrelated question finds nothing');
  ok(call('5001', 'kbGet', { id: leave.id }).ok, 'the employee opens it');
  ok(call('5001', 'kbFeedback', { id: leave.id, helpful: true, deflected: true }).counted, 'and says it answered the question');
  ok(call('5001', 'kbFeedback', { id: leave.id, helpful: true, deflected: true }).counted === false, 'one vote per person per article a day');
  call('5002', 'kbFeedback', { id: leave.id, helpful: false });
  const s = call('3001', 'kbList', {}).rows.find(a => a.id === leave.id);
  ok(s.views === 2 && s.helpful === 1 && s.notHelpful === 1 && s.deflected === 1, 'HR sees views, helpful votes and tickets avoided', s);
  ok(!('views' in call('5001', 'kbList', {}).rows[0]), 'employees do not see the stats');
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
