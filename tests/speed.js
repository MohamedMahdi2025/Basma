// Speed on an organisation with its own book (2026-11-06): the book layout comes from the cache and a read-only screen
// fetches all its tabs in one values:batchGet the second time. node tests/speed.js
const crypto = require('crypto');
const { load, DeviceKey } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const B = load({ setupKeyHash: crypto.createHash('sha256').update('k').digest('hex'), now: Date.parse('2026-11-06T06:30:00Z') });
B.raw({ action: 'bootstrap', orgId: '1001', setupKey: 'k', name: 'مالك', empNo: '1000' });
const L = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const org = B.raw({ action: 'orgCreate', setupKey: 'k', logo: L, nameAr: 'شركة', unn: '7000000099', adminName: 'مدير' });
ok(org.ok, 'an organisation on its own book', org);
const ac = B.raw({ action: 'orgActivation', setupKey: 'k', id: org.orgId, empNo: '1001' });
const dev = new DeviceKey(); dev.pin = '582049';
let r = B.raw({ action: 'enrollBegin', orgId: org.orgId, empNo: ac.empNo, code: ac.activationCode });
r = B.raw({ action: 'enrollFinish', orgId: org.orgId, deviceKey: dev.create(r.options), pin: dev.pin, label: 'Phone' });
ok(r.ok && r.token, 'its administrator signs in', r);
const T = r.token;
const http = req => { global.__HTTP = []; const out = B.raw(Object.assign({ orgId: org.orgId, token: T }, req)); const n = global.__HTTP; global.__HTTP = null; return { out, n }; };
const forget = () => { B.ctx.setOrg_(B.ctx.orgRec_(org.orgId)); Object.keys(B.ctx.CACHED_TABS_).forEach(n => B.ctx.bumpTab_(n)); }; // as after writes to every tab

const first = http({ action: 'myTasks' });
const reads1 = first.n.filter(x => /^get \/values\/'/.test(x)).length;
ok(first.out.ok && reads1 <= 3 && first.n.length <= 6, 'first time: the bell fetches its tabs in batches, not one by one (' + first.n.length + ' calls, was about 49)', first.n);
forget();
const second = http({ action: 'myTasks' });
const one = second.n.filter(x => /values:batchGet/.test(x)).length, single = second.n.filter(x => /^get \/values\/'/.test(x)).length;
ok(second.out.ok && one === 1 && single <= 2, 'next time, with every copy out of date: one batched call (' + second.n.length + ' calls in all, was ' + first.n.length + ')', second.n);
ok(JSON.stringify(second.out.tasks) === JSON.stringify(first.out.tasks), 'and the same answer');
ok(!second.n.some(x => /^get $/.test(x) || x === 'get '), 'the book layout comes from the cache, not a call per request', second.n.slice(0, 3));

// a write between the two: the batched read shows it
r = B.raw({ action: 'empSave', orgId: org.orgId, token: T, emp: { name: 'موظف جديد', role: 'employee' } });
ok(r.ok, 'a new employee', r);
const dir = http({ action: 'hrDirectory' }); forget(); const dir2 = http({ action: 'hrDirectory' });
const names = o => JSON.stringify(o.out).indexOf('موظف جديد') >= 0;
ok(dir.out.ok && dir2.out.ok && names(dir) && names(dir2), 'batched reads see the latest data');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
