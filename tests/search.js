// Search across records for the Ctrl K palette (api_searchAll, Hr.gs): node tests/search.js
// Every result must be something the caller could already open; nothing of another person leaks.
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-11-04T06:00:00Z') });

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
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }
const find = (no, q) => call(no, 'searchAll', { q });
const group = (r, key) => (r.groups || []).filter(g => g.key === key)[0] || { items: [] };
const refs = (r, key) => group(r, key).items.map(x => x.ref);

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('5001', 'مدير المبيعات', 'employee');
person('5002', 'سالم العتيبي', 'employee');
person('5003', 'منى القحطاني', 'employee');
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], managerId: ids['5001'], hireDate: '2024-01-01', nationality: 'SA' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5003'], managerId: ids['5001'], hireDate: '2024-01-01', nationality: 'SA' } });

// a letter request by each of the two employees, both naming a distinctive word in the reason
direct(() => {
  const now = '2026-11-03T08:00:00.000Z';
  const req = (id, ref, no, reason) => B.ctx.append_('requests', { id, ref, empId: ids[no], type: 'letter', subtype: 'salary_certificate', fromDate: '', toDate: '', days: '', amount: '', months: '',
    payloadJson: '{}', reason, docNo: '', status: 'pending', step: 'hr', stepsJson: '[]', requestedBy: ids[no], createdAt: now, updatedAt: now, decidedAt: '' });
  req('RQA', 'LT-2026-00071', '5002', 'شهادة راتب لبنك الراجحي لتمويل سيارة');
  req('RQB', 'LT-2026-00072', '5003', 'شهادة راتب لبنك الأهلي لتمويل منزل');
  B.ctx.append_('documents', { id: 'DA', empId: ids['5002'], type: 'passport', number: 'P-778899', issueDate: '2024-01-01', expiryDate: '2029-01-01', note: 'جواز سالم', status: 'active', createdAt: now, updatedAt: now, ref: 'DOC-2026-00001' });
  B.ctx.append_('documents', { id: 'DB', empId: ids['5003'], type: 'passport', number: 'P-112233', issueDate: '2024-01-01', expiryDate: '2029-01-01', note: 'جواز منى', status: 'active', createdAt: now, updatedAt: now, ref: 'DOC-2026-00002' });
});
let r = call('5002', 'hdCreate', { ticket: { category: 'payroll', subject: 'خصم غير مفهوم في الراتب', body: 'ظهر خصم تأمينات أعلى من المعتاد في قسيمة أكتوبر' } });
const hdA = r.ok && r.ticket.ref;
r = call('5003', 'hdCreate', { ticket: { category: 'conduct', subject: 'بلاغ سري عن سلوك', body: 'تفاصيل البلاغ السري' } });
const hdB = r.ok && r.ticket.ref;
call('3001', 'recruitReqSave', { requisition: { titleAr: 'محاسب تكاليف', headcount: 1 } });

console.log('Search: shape and limits');
r = find('5002', 'ش');
ok(r.ok && r.groups.length === 0, 'a one-letter query returns nothing (two letters at least)', r);
r = find('5002', 'تمويل');
ok(r.ok && refs(r, 'requests').length === 1 && refs(r, 'requests')[0] === 'LT-2026-00071', 'the employee finds their own request by a word inside the reason', r.groups);
const it = group(r, 'requests').items[0] || {};
ok(/تمويل/.test(it.snippet || '') && it.dest && it.dest.area === 'requests' && it.dest.sub === 'view' && it.dest.arg === 'RQA', 'the result carries a snippet around the match and opens the request page', it);

console.log('Search: nothing of another person leaks');
r = find('5002', 'الأهلي');
ok(r.ok && refs(r, 'requests').length === 0, 'an employee never finds a colleague\'s request (same type, different person)', r.groups);
r = find('5002', 'P-112233');
ok(r.ok && refs(r, 'documents').length === 0, 'an employee never finds a colleague\'s document', r.groups);
r = find('5002', 'P-778899');
ok(r.ok && refs(r, 'documents').length === 1, 'but finds their own document by its number', r.groups);
r = find('5002', 'سري');
ok(r.ok && group(r, 'helpdesk').items.length === 0, 'an employee never finds a colleague\'s confidential help-desk report', r.groups);
r = find('5002', 'تأمينات');
ok(r.ok && refs(r, 'helpdesk').length === 1 && refs(r, 'helpdesk')[0] === hdA, 'and finds their own ticket by a word in its body', r.groups);
r = find('5002', 'محاسب');
ok(r.ok && group(r, 'requisitions').items.length === 0 && group(r, 'candidates').items.length === 0, 'recruitment never shows to an ordinary employee', r.groups);

console.log('Search: roles see what they may open');
r = find('5001', 'الأهلي');
ok(r.ok && refs(r, 'requests').length === 0, 'the manager does not see a letter request (an HR-only step) by search either', r.groups);
r = find('3001', 'تمويل');
ok(r.ok && refs(r, 'requests').length === 2, 'HR finds both requests waiting for the HR step', r.groups);
r = find('3001', 'P-112233');
ok(r.ok && refs(r, 'documents').length === 1 && group(r, 'documents').items[0].dest.empId === ids['5003'], 'HR finds any document and it opens that person\'s file', r.groups);
r = find('3001', 'سري');
ok(r.ok && refs(r, 'helpdesk').length === 1 && refs(r, 'helpdesk')[0] === hdB, 'the hr role handles the confidential queue and finds the report', r.groups);
r = find('1000', 'سري');
ok(r.ok && group(r, 'helpdesk').items.length === 0, 'an administrator alone never finds a confidential conduct report', r.groups);
r = find('3001', 'محاسب تكاليف');
ok(r.ok && group(r, 'requisitions').items.length === 1, 'HR finds the hiring request', r.groups);

console.log('Search: Arabic normalisation');
r = find('5002', 'الراجحى');
ok(r.ok && refs(r, 'requests').length === 1, 'alef maqsura and ya match each other (الراجحى finds الراجحي)', r.groups);
r = find('5002', 'شهاده');
ok(r.ok && refs(r, 'requests').length === 1, 'ta marbuta and ha match each other (شهاده finds شهادة)', r.groups);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
