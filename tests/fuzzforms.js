// Server-side form validation fuzz (2026-11-09). node tests/fuzzforms.js
const crypto = require('crypto');
const { load, DeviceKey } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const B = load({ setupKeyHash: crypto.createHash('sha256').update('k').digest('hex'), now: Date.parse('2026-11-06T06:30:00Z') });
const home = B.raw({ action: 'bootstrap', orgId: '1001', setupKey: 'k', name: 'مدير', empNo: '1000' });
const PHONE_A = 'a:' + 'A'.repeat(32), PHONE_B = 'a:' + 'B'.repeat(32), PC = 'w:' + 'P'.repeat(24), TAB = 'w:' + 'T'.repeat(24), OLD = 'w:' + 'O'.repeat(24);
const enrol = (empNo, code, devId, pin) => {
  const d = new DeviceKey(); d.pin = pin || '583920';
  const b = B.call({ action: 'enrollBegin', empNo, code, devId });
  const f = B.call({ action: 'enrollFinish', deviceKey: d.create(b.options), pin: d.pin, label: 'x', devId });
  return { d, f };
};
const fs = require('fs'), path = require('path');
const admin = enrol('1000', home.activationCode, PHONE_A);
ok(admin.f.ok, 'the administrator activates his phone', admin.f);
const T = admin.f.token, ctx = B.ctx;
const code = fs.readFileSync(path.join(__dirname, '..', 'backend', 'Code.gs'), 'utf8');
const names = m => (code.match(new RegExp('var ' + m + ' = \{([^}]*)\}')) || [, ''])[1].match(/[a-zA-Z]+(?=:)/g) || [];
const SKIP = new Set(['bootstrap', 'orgCreate', 'orgSetStatus', 'platformHealth', 'orgList', 'orgOverview', 'orgSetGroup', 'orgBrandSet', 'orgImport', 'orgRenumber', 'orgActivation', 'adminRecover', 'authBegin', 'authFinish', 'enrollBegin', 'enrollFinish', 'pinLogin', 'pwLogin', 'ssoLogin', 'diag', 'waTest', 'notifyTest', 'pushTest']);
const ACTIONS = Array.from(new Set(['EMP_ACTIONS', 'HR_ACTIONS', 'ADMIN_ACTIONS'].flatMap(names))).filter(a => !SKIP.has(a));
const FIELDS = ['id', 'empId', 'name', 'nameEn', 'title', 'titleEn', 'note', 'notes', 'reason', 'text', 'body', 'message', 'comment', 'email', 'phone', 'type', 'kind', 'status', 'month', 'date', 'from', 'to', 'fromDate', 'toDate', 'amount', 'days', 'hours', 'count', 'rate', 'pct', 'url', 'label', 'code', 'ref', 'stage', 'step', 'role', 'departmentId', 'positionId', 'managerId', 'iban', 'nationalId', 'q', 'query', 'filter', 'tab', 'key', 'value', 'lang', 'currency', 'start', 'end', 'level', 'score', 'rating'];
const HOSTILE = {
  huge: () => 'A'.repeat(120000),
  formula: () => '=HYPERLINK("http://evil","x")',
  html: () => '<img src=x onerror=alert(1)><script>alert(1)</script>',
  nul: () => 'a\u0000b\u202eevil',
  arr: () => [1, 'x', { a: 1 }],
  obj: () => ({ $gt: '', __proto__: { admin: true }, constructor: { prototype: { x: 1 } } }),
  num: () => -1e308,
  nan: () => 'NaN',
  bool: () => true,
  nil: () => null,
  neg: () => -1,
  deep: () => { let o = {}, c = o; for (let i = 0; i < 40; i++) { c.n = {}; c = c.n; } return o; }
};
const build = (fn) => { const o = {}; FIELDS.forEach(f => { o[f] = fn(); }); o.emp = Object.assign({}, o); o.item = Object.assign({}, o); o.priv = Object.assign({}, o); o.settings = Object.assign({}, o); return o; };
const serverErrors = [];
let calls = 0;
console.log('Fuzz: ' + ACTIONS.length + ' actions x ' + Object.keys(HOSTILE).length + ' hostile shapes');
Object.keys(HOSTILE).forEach(shape => {
  const F = B.fork(), payload = build(HOSTILE[shape]);
  ACTIONS.forEach(a => {
    let res; try { res = F.raw(Object.assign({}, payload, { action: a, orgId: '1001', token: T })); } catch (e) { res = { error: 'threw:' + String(e.message).slice(0, 80) }; }
    calls++;
    if (res && (res.error === 'server_error' || /^threw:/.test(res.error || ''))) serverErrors.push(a + ' [' + shape + '] ' + (res.error || '') + (res.detail ? ' ' + String(res.detail).slice(0, 80) : ''));
  });
});
console.log('   ' + calls + ' hostile calls');
const uniq = Array.from(new Set(serverErrors.map(s => s.split(' [')[0])));
ok(uniq.length === 0, 'no hostile input crashes an action (every one answers with a clean error code)', uniq.slice(0, 25).join(', ') + (uniq.length > 25 ? ' …' + uniq.length : ''));
// oversize values must never be stored: after the huge-string round, no stored cell is longer than the cap
const FAT_OK = new Set(['logo', 'dataUrl', 'payload', 'stepsJson', 'effectJson', 'flowJson', 'linesJson', 'infoJson', 'totalsJson', 'questionsJson', 'body', 'data']);
const oversize = [];
const F2 = B.fork(), huge = build(HOSTILE.huge);
ACTIONS.forEach(a => { try { F2.raw(Object.assign({}, huge, { action: a, orgId: '1001', token: T })); } catch (e) {} });
const tabs = Object.keys(F2.ctx.HEADERS || ctx.HEADERS || {});
tabs.forEach(t => { let rows = []; try { rows = F2.ctx.readAll_(t); } catch (e) {} rows.forEach(r => Object.keys(r).forEach(k => { if (typeof r[k] === 'string' && r[k].length > 20000 && !FAT_OK.has(k)) oversize.push(t + '.' + k + ' ' + r[k].length); })); });
ok(oversize.length === 0, 'no 100,000-character value was stored in a field that should be short', Array.from(new Set(oversize)).slice(0, 15));
ok(tabs.length > 100 && ACTIONS.length > 300, 'the fuzz covers every tab and every action (it cannot go quietly empty)', { tabs: tabs.length, actions: ACTIONS.length });
console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
