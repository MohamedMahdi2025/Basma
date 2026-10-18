/**
 * Demo company on the live Sheet: the 50-person simulation (tests/sim50.js), loaded by tools/demo-load.js and removed
 * again with one purge. Owner only (setup key), like diag. Every imported row is recorded in demoLedger, so the purge
 * deletes exactly those rows and nothing a real user wrote.
 *
 *   status  row counts per tab, demo rows per tab, payroll months already used
 *   import  { tab, rows, batch }: appends rows (only the tab's own columns), skips keys already on the Sheet
 *   purge   deletes every ledgered row from every tab, then empties the ledger
 *   payroll { month }: a locked payroll run (scope 'demo') over the ledgered people only, computed with calcSlip_,
 *           prepared by a demo HR person and approved by a different demo payroll holder; skipped when one exists
 *
 * Payroll scope: a run with scope 'demo' covers demo people only and the company's own runs (scope '') never include
 * them (payrollEmps_). Obligations (run_exists, month locks, recon block, WPS / journal calendar) look at the run of the
 * same scope only; views that pick one run per month take the real run when one exists (runsRealFirst_).
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

/** A demo run: marked scope 'demo', or loaded by the demo import before the scope column existed (in the ledger). */
function isDemoRun_(r) { return !!r && (String(r.scope || '') === 'demo' || !!demoRunIds_()[String(r.id)]); }
var DEMO_RUNS_MEMO_ = { src: null, out: null };
function demoRunIds_() {
  var led = readAll_(SHEETS.DEMO);
  if (DEMO_RUNS_MEMO_.src === led) return DEMO_RUNS_MEMO_.out;
  var out = {};
  led.forEach(function (x) { if (x.tab === SHEETS.RUN && String(x.key).indexOf('id:') === 0) out[String(x.key).slice(3)] = 1; });
  DEMO_RUNS_MEMO_ = { src: led, out: out };
  return out;
}
function runScope_(r) { return isDemoRun_(r) ? 'demo' : ''; }
/** Runs for one-run-per-month views: a demo run only for a month with no real (non-cancelled) run. */
function runsRealFirst_(runs) {
  var real = {};
  runs.forEach(function (r) { if (!isDemoRun_(r) && r.status !== 'cancelled') real[r.month] = 1; });
  return runs.filter(function (r) { return !isDemoRun_(r) || !real[r.month]; });
}
/** Ledger keys of one tab, { key: 1 }. One read of the ledger; empty when nothing was loaded. */
function demoKeySet_(tab) {
  var out = {};
  readAll_(SHEETS.DEMO).forEach(function (x) { if (x.tab === tab) out[x.key] = 1; });
  return out;
}
/** The demo people, { empId: 1 }. Kept while the request's ledger read is the same (monthLocked_ runs in loops). */
var DEMO_EMPS_MEMO_ = { src: null, out: null };
function demoEmpIds_() {
  var led = readAll_(SHEETS.DEMO);
  if (DEMO_EMPS_MEMO_.src === led) return DEMO_EMPS_MEMO_.out;
  var out = {};
  led.forEach(function (x) { if (x.tab === SHEETS.EMP && String(x.key).indexOf('id:') === 0) out[String(x.key).slice(3)] = 1; });
  DEMO_EMPS_MEMO_ = { src: led, out: out };
  return out;
}

function api_demoData(req) {
  demoKey_(req);
  var mode = String(req.mode || 'status');
  if (mode === 'status') return demoStatus_();
  if (mode === 'import') return withLock_(function () { return demoImport_(req); });
  if (mode === 'purge') return withLock_(function () { return demoPurge_(); });
  if (mode === 'payroll') return withLock_(function () { return demoPayroll_(req); });
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
    if (tab === SHEETS.RUN) o.scope = 'demo'; // a loaded run is the demo's own, whatever the export said
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

/**
 * A locked demo payroll for one month, from the real calculation (payrollCtx_ + calcSlip_) over the ledgered people.
 * Also marks any loaded run still without a scope as demo. Every row written goes into the ledger, so purge removes it.
 */
function demoPayroll_(req) {
  var month = String(req.month || '');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) fail_('bad_date');
  if (month > today_().slice(0, 7)) fail_('future_month');
  forget_(SHEETS.DEMO); forget_(SHEETS.RUN); forget_(SHEETS.SLIP);
  var runKeys = demoKeySet_(SHEETS.RUN), runs = readAll_(SHEETS.RUN);
  runs.forEach(function (r) { if (runKeys['id:' + r.id] && !isDemoRun_(r)) { r.scope = 'demo'; update_(SHEETS.RUN, r); } });
  var have = runs.filter(function (r) { return r.month === month && isDemoRun_(r) && r.status !== 'cancelled'; })[0];
  if (have) return { ok: true, skipped: true, month: month, run: publicRun_(have) };
  var emps = payrollEmps_(month, 'demo');
  if (!emps.length) fail_('not_found'); // nobody loaded (or nobody employed in the month)
  var inPay = function (e) { return e.role === 'payroll' || trimList_(e.extraRoles).indexOf('payroll') >= 0; };
  var active = emps.filter(function (e) { return e.status === 'active'; });
  var approver = active.filter(inPay)[0];
  var preparer = approver && (active.filter(function (e) { return e.role === 'hr' && e.id !== approver.id; })[0] ||
    active.filter(function (e) { return inPay(e) && e.id !== approver.id; })[0]);
  if (!approver || !preparer) fail_('second_approver_required'); // the demo has no HR + payroll pair to prepare and approve
  var now = new Date(), nowIso = now.toISOString(), after = function (days) {
    var t = Date.parse(monthLast_(month) + 'T06:00:00Z') + days * 864e5;
    return new Date(Math.min(t, now.getTime())).toISOString();
  };
  var run = { id: newId_('P'), ref: 'DEMO-PR-' + month, month: month, status: 'locked', preparedBy: preparer.id, preparedAt: after(1),
    approvedBy: approver.id, approvedAt: after(2), totalsJson: '', note: 'تجريبي / demo', emailedAt: '', createdAt: nowIso, updatedAt: nowIso, scope: 'demo' };
  var x = payrollCtx_(month), rows = [];
  emps.forEach(function (e) { var c = calcSlip_(e, x); if (c) rows.push(slipRow_(e, run, c, null)); });
  rows.forEach(function (r, i) { r.ref = 'DEMO-PS-' + month + '-' + ('000' + (i + 1)).slice(-4); });
  run.totalsJson = JSON.stringify(totals_(rows));
  append_(SHEETS.RUN, run);
  appendMany_(SHEETS.SLIP, rows);
  var batch = 'demo-payroll-' + month, led = [{ tab: SHEETS.RUN, key: demoRowKey_(SHEETS.RUN, run), batch: batch, at: nowIso }];
  rows.forEach(function (r) { led.push({ tab: SHEETS.SLIP, key: demoRowKey_(SHEETS.SLIP, r), batch: batch, at: nowIso }); });
  appendMany_(SHEETS.DEMO, led);
  return { ok: true, created: true, month: month, headcount: rows.length, run: publicRun_(run) };
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
