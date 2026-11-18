// The move to Postgres (2026-11-18): the old Apps Script answers "moved" to the app, and takes the platform's weekly backup.
// node tests/backup.js
const crypto = require('crypto');
const { load } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const T0 = Date.parse('2026-11-18T06:00:00Z');
const B = load({ setupKeyHash: sha('k'), now: T0 });
let r = B.call({ action: 'bootstrap', setupKey: 'k', name: 'مدير', empNo: '1000' });
ok(r.ok, 'bootstrap');
const KEY = 'b'.repeat(40);
const sign = (o, key) => { const body = o.ts + '|' + o.tab + '|' + o.start + '|' + JSON.stringify(o.header || null) + '|' + JSON.stringify(o.rows); return crypto.createHmac('sha256', key || KEY).update(body).digest('hex'); };
const push = (o, key) => B.call(Object.assign({ action: 'backupPush' }, o, { sig: o.sig || sign(o, key) }));
const hdr = B.ctx.HEADERS.holidays;
const row = hdr.map(c => c === 'id' ? 'H1' : c === 'date' ? '2026-12-02' : c === 'nameAr' ? 'اليوم الوطني' : c === 'createdAt' ? { d: '2026-11-01T00:00:00.000Z' } : '');
const msg = () => ({ ts: B.ctx.Date.now(), tab: 'holidays', start: 0, header: hdr, rows: [row] });

console.log('Before the move');
B.props.BACKUP_KEY = KEY;
ok(push(msg()).error === 'not_available', 'no backup is taken while the Sheet is still the live system');
ok(B.call({ action: 'bootstrapStatus' }).ok, 'and the app works as before');

console.log('After the move');
B.props.MOVED_TO = 'https://api.example.sa/c/bestgas/api';
r = B.call({ action: 'bootstrapStatus' });
ok(r.error === 'moved' && r.api === 'https://api.example.sa/c/bestgas/api', 'every app request is told the new address', r);
B.props.MOVED_TO = 'javascript:alert(1)';
ok(B.call({ action: 'bootstrapStatus' }).ok, 'a malformed address is ignored (never sent to the app)');
B.props.MOVED_TO = 'https://api.example.sa/c/bestgas/api';
ok(push(msg(), 'x'.repeat(40)).error === 'forbidden', 'a push signed with another key is refused');
ok(push(Object.assign(msg(), { ts: T0 - 3600000 })).error === 'bad_request', 'a push older than 10 minutes is refused (no replay)');
ok(push(Object.assign(msg(), { tab: 'nope' })).error === 'bad_request', 'only known tabs');
const m = msg(); m.rows[0][hdr.indexOf('nameAr')] = '0501234567';
r = push(m);
ok(r.ok && r.written === 1, 'a signed push writes the tab', r);
const raw = B.sheets.holidays._rows;
ok(raw.length === 2 && raw[1][hdr.indexOf('nameAr')] === '0501234567' && typeof raw[1][hdr.indexOf('nameAr')] === 'string', 'number-like text stays text (written quoted)', raw[1]);
ok(raw[1][hdr.indexOf('date')] === '2026-12-02' && typeof raw[1][hdr.indexOf('date')] === 'string', 'date-like text stays text', raw[1][hdr.indexOf('date')]);
ok(raw[1][hdr.indexOf('createdAt')] instanceof Date || typeof raw[1][hdr.indexOf('createdAt')].getTime === 'function', 'a date cell stays a date');
r = push(Object.assign(msg(), { start: 1, header: null, rows: [row.map((c, j) => hdr[j] === 'id' ? 'H2' : c)] }));
ok(r.ok && B.sheets.holidays._rows.length === 3, 'the next part adds rows after the first', r);
r = push(msg());
ok(r.ok && B.sheets.holidays._rows.filter(x => x.some(c => c !== '' && c != null)).length === 2, 'a new backup (start 0) replaces the tab (old rows cleared)');
ok(B.call({ action: 'demoData', setupKey: 'k', mode: 'bookExport' }).ok, "the owner's export still works after the move");
B.props.BACKUP_KEY = 'short';
ok(push(msg(), 'short').error === 'not_available', 'a key shorter than 32 characters is never accepted');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
