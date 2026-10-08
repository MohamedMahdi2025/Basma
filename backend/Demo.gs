/**
 * Demo company on the live Sheet: the 50-person simulation (tests/sim50.js), loaded by tools/demo-load.js and removed
 * again with one purge. Owner only (setup key), like diag. Every imported row is recorded in demoLedger, so the purge
 * deletes exactly those rows and nothing a real user wrote.
 *
 *   status  row counts per tab, demo rows per tab, payroll months already used
 *   import  { tab, rows, batch }: appends rows (only the tab's own columns), skips keys already on the Sheet
 *   purge   deletes every ledgered row from every tab, then empties the ledger
 *
 * Never imported: credentials and settings (sign-in secrets and live configuration). The loader also blanks every
 * password, PIN and activation hash, so no demo person can sign in.
 */
var DEMO_SKIP_TABS_ = { credentials: 1, settings: 1, demoLedger: 1 };

function demoKey_(req) {
  var expected = (typeof SETUP_KEY_HASH === 'string') ? SETUP_KEY_HASH : '';
  if (!expected || !safeEqual_(sha256Hex_(String(req.setupKey || '').trim()), expected)) {
    if (!rateLimit_('diagFail', 10, 3600)) fail_('too_many_attempts');
    fail_('bad_setup_key');
  }
}

/** The ledger key of a row: its id, the employee for the one-row-per-person private tab, else the audit line itself. */
function demoRowKey_(tab, o) {
  var h = HEADERS[tab];
  if (h.indexOf('id') >= 0) return 'id:' + String(o.id);
  if (tab === SHEETS.PRIV) return 'emp:' + String(o.empId);
  return 'line:' + h.map(function (k) { var v = o[k]; return v instanceof Date ? v.toISOString() : String(v == null ? '' : v); }).join('|');
}

function demoTabs_() {
  return Object.keys(SHEETS).map(function (k) { return SHEETS[k]; }).filter(function (n) { return HEADERS[n] && !DEMO_SKIP_TABS_[n]; });
}

function api_demoData(req) {
  demoKey_(req);
  var mode = String(req.mode || 'status');
  if (mode === 'status') return demoStatus_();
  if (mode === 'import') return withLock_(function () { return demoImport_(req); });
  if (mode === 'purge') return withLock_(function () { return demoPurge_(); });
  fail_('bad_request');
}

function demoStatus_() {
  var tabs = {}, demo = {};
  demoTabs_().forEach(function (n) { forget_(n); tabs[n] = readAll_(n).length; });
  forget_(SHEETS.DEMO);
  readAll_(SHEETS.DEMO).forEach(function (x) { demo[x.tab] = (demo[x.tab] || 0) + 1; });
  var months = readAll_(SHEETS.RUN).filter(function (r) { return r.status !== 'cancelled'; }).map(function (r) { return String(r.month) + ':' + r.status; });
  return { ok: true, tabs: tabs, demo: demo, payrollMonths: months };
}

function demoImport_(req) {
  var tab = String(req.tab || ''), rows = req.rows || [];
  if (demoTabs_().indexOf(tab) < 0) fail_('bad_tab');
  if (!Array.isArray(rows) || rows.length > 3000) fail_('bad_request');
  forget_(tab);
  var have = {};
  readAll_(tab).forEach(function (o) { have[demoRowKey_(tab, o)] = 1; });
  var h = HEADERS[tab], now = new Date().toISOString(), batch = str_(req.batch, 40) || 'demo', out = [], led = [];
  rows.forEach(function (r) {
    var o = {};
    h.forEach(function (k) { o[k] = r[k] == null ? '' : r[k]; });
    var key = demoRowKey_(tab, o);
    if (have[key]) return;
    have[key] = 1;
    out.push(o);
    led.push({ tab: tab, key: key, batch: batch, at: now });
  });
  appendMany_(tab, out);
  appendMany_(SHEETS.DEMO, led);
  return { ok: true, tab: tab, added: out.length, skipped: rows.length - out.length };
}

/** Rewrites each tab without the ledgered rows. Text goes back with its apostrophe so Sheets converts nothing. */
function demoPurge_() {
  forget_(SHEETS.DEMO);
  var byTab = {};
  readAll_(SHEETS.DEMO).forEach(function (x) { (byTab[x.tab] = byTab[x.tab] || {})[x.key] = 1; });
  var removed = {};
  Object.keys(byTab).forEach(function (tab) {
    if (!HEADERS[tab]) return;
    var sh = sheet_(tab), last = sh.getLastRow(), h = HEADERS[tab];
    if (last < 2) return;
    var width = Math.max(sh.getLastColumn(), h.length);
    var head = sh.getRange(1, 1, 1, width).getValues()[0].map(String);
    var vals = sh.getRange(2, 1, last - 1, width).getValues();
    var keep = vals.filter(function (row) {
      var o = {};
      head.forEach(function (k, i) { if (k) o[k] = row[i] instanceof Date ? cellDate_(row[i]) : row[i]; });
      return !byTab[tab][demoRowKey_(tab, o)];
    });
    removed[tab] = vals.length - keep.length;
    if (!removed[tab]) return;
    forget_(tab);
    bumpTab_(tab);
    sh.getRange(2, 1, last - 1, width).clearContent();
    if (keep.length) sh.getRange(2, 1, keep.length, width).setValues(keep.map(function (row) {
      return row.map(function (v) { return typeof v === 'string' && v !== '' ? "'" + v : v; });
    }));
  });
  var led = sheet_(SHEETS.DEMO);
  if (led.getLastRow() > 1) led.getRange(2, 1, led.getLastRow() - 1, Math.max(led.getLastColumn(), 1)).clearContent();
  forget_(SHEETS.DEMO);
  bumpTab_(SHEETS.DEMO);
  return { ok: true, removed: removed };
}
