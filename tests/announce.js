// Announcements: drafts, audiences, publishing, reads and acknowledgements: node tests/announce.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-11-04T06:00:00Z') });
const devs = {}, ids = {}, toks = {};
function tok(no, fresh) { if (toks[no] && !fresh) return toks[no]; const b = B.call({ action: 'authBegin', empNo: no }); return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token); }
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no }) : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role } });
  devs[no] = new Authenticator(); const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) }); ids[no] = f.me.id; toks[no] = f.token;
}
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('5001', 'سائق 1', 'employee');
person('5002', 'سائق 2', 'employee');
person('5003', 'محاسب', 'employee');
let r = call('3001', 'hrDeptSave', { dept: { code: 'OPS', nameAr: 'العمليات' } });
const ops = r.dept.id;
r = call('3001', 'hrDeptSave', { dept: { code: 'TRN', nameAr: 'النقل', parentId: ops } });
const trn = r.dept.id;
call('3001', 'hrEmpSave', { emp: { id: ids['5001'], departmentId: trn } });
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], departmentId: ops } });

console.log('Drafts');
const A = { kind: 'urgent', titleAr: 'تعليمات السلامة في الصيف', bodyAr: 'يمنع العمل تحت الشمس من 12 إلى 3', audience: { departmentIds: [ops] }, requireAck: true, pinned: true };
ok(call('5001', 'annSave', { announcement: A }).error === 'forbidden', 'only HR writes announcements');
ok(call('3001', 'annSave', { announcement: Object.assign({}, A, { bodyAr: '' }) }).error === 'missing_fields', 'a body is required');
ok(call('3001', 'annSave', { announcement: Object.assign({}, A, { audience: {} }) }).error === 'missing_fields', 'an audience is required');
ok(call('3001', 'annSave', { announcement: Object.assign({}, A, { audience: { departmentIds: ['nope'] } }) }).error === 'not_found', 'audience ids must exist');
ok(call('3001', 'annSave', { announcement: Object.assign({}, A, { publishAt: '2026-11-10', expiresAt: '2026-11-09' }) }).error === 'bad_date', 'the expiry is after publishing');
r = call('3001', 'annSave', { announcement: A });
const A1 = r.announcement;
ok(r.ok && A1.ref === 'ANN-2026-00001' && A1.status === 'draft' && A1.audienceSize === 2, 'ANN-2026-00001 draft for Operations and its sub-department: 2 people', A1);
ok(call('5001', 'myAnnouncements').rows.length === 0, 'a draft is not shown');

console.log('Publishing and audience');
r = call('3001', 'annPublish', { id: A1.id });
ok(r.ok && r.announcement.status === 'published', 'HR publishes it');
ok(call('3001', 'annSave', { announcement: Object.assign({ id: A1.id }, A) }).error === 'bad_request', 'a published one cannot be edited');
r = call('5001', 'myAnnouncements');
ok(r.rows.length === 1 && r.unread === 1 && r.toAck === 1 && r.rows[0].pinned, '5001 (sub-department) sees it, unread, to acknowledge');
ok(call('5002', 'myAnnouncements').rows.length === 1, '5002 (the department) sees it');
ok(call('5003', 'myAnnouncements').rows.length === 0, '5003 (elsewhere) does not');
ok(call('5003', 'annRead', { id: A1.id }).error === 'not_found', 'and cannot mark it read');
ok(call('5001', 'myTasks').tasks.some(t => t.kind === 'announcement_ack' && t.count === 1 && t.target.tab === 'file'), 'the bell asks 5001 to acknowledge');
r = call('5001', 'annRead', { id: A1.id });
ok(r.ok && r.readAt && !r.ackAt, 'read');
call('5001', 'annRead', { id: A1.id });
ok(B.ctx.readAll_('annReads').length === 1, 'reading twice keeps one row');
r = call('5001', 'annRead', { id: A1.id, ack: true });
ok(r.ackAt, 'acknowledged');
ok(!call('5001', 'myTasks').tasks.some(t => t.kind === 'announcement_ack'), 'the bell item goes');
r = call('3001', 'annList');
ok(r.ok && r.rows[0].reads === 1 && r.rows[0].acks === 1 && r.rows[0].notAcked.length === 1 && r.rows[0].notAcked[0].empNo === '5002', 'HR sees 1 read, 1 acknowledged, 5002 still to acknowledge', r.rows[0]);

console.log('Scheduling, expiry, archive');
r = call('3001', 'annSave', { announcement: { titleAr: 'إجازة اليوم الوطني', bodyAr: 'إجازة رسمية', audience: { all: true }, publishAt: '2026-11-06', expiresAt: '2026-11-08' } });
const A2 = r.announcement;
call('3001', 'annPublish', { id: A2.id });
ok(call('5003', 'myAnnouncements').rows.length === 0, 'scheduled for 6 Nov: not shown yet');
B.setNow(Date.parse('2026-11-06T06:00:00Z')); Object.keys(toks).forEach(k => delete toks[k]);
r = call('5003', 'myAnnouncements');
ok(r.rows.length === 1 && r.rows[0].requireAck === false && r.toAck === 0, 'shown to everyone from 6 Nov, no acknowledgement needed');
r = call('5002', 'myAnnouncements');
ok(r.rows[0].pinned === true, 'pinned announcements come first');
B.setNow(Date.parse('2026-11-08T06:00:00Z')); Object.keys(toks).forEach(k => delete toks[k]);
ok(call('5003', 'myAnnouncements').rows.length === 0, 'gone after its expiry');
ok(call('3001', 'annArchive', { id: A1.id }).announcement.status === 'archived', 'HR archives the first');
ok(call('5002', 'myAnnouncements').rows.length === 0 && !call('5002', 'myTasks').tasks.some(t => t.kind === 'announcement_ack'), 'archived: no longer shown or asked');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
