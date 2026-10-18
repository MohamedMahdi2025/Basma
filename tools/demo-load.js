// Loads the 50-person demo company (tests/sim50.js) into the LIVE Sheet, or removes it again.
//   SIM_EXPORT=sim.json node tests/sim50.js     (makes the export; every check must pass first)
//   node tools/demo-load.js status
//   node tools/demo-load.js load sim.json        (dates moved by whole weeks so the simulated month ends by today)
//   node tools/demo-load.js payroll 2026-07 2026-09   (a locked demo payroll for each month in the range, demo people only;
//                                                      months that already have a demo run are skipped)
//   node tools/demo-load.js purge                (deletes every row the load added, nothing else)
// The setup key is read from ../apps-script/SETUP-KEY.txt and never printed.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const DEP = (fs.readFileSync(path.join(ROOT, 'tools/deploy.sh'), 'utf8').match(/DEP="?([A-Za-z0-9_-]{40,})/) || [])[1];
const URL = 'https://script.google.com/macros/s/' + DEP.slice(2) + '/exec'; // deploy.sh keeps the id behind two padding characters
const KEY_FILE = path.join(ROOT, '../apps-script/SETUP-KEY.txt');

// Never loaded: sign-in secrets, live settings, holidays (they would apply to real staff), report fingerprints (moved dates break them).
const SKIP = new Set(['credentials', 'settings', 'holidays', 'reportLog', 'demoLedger']);
const ORDER = ['zones', 'departments', 'positions', 'employees', 'empPrivate', 'compensation', 'jobHistory'];

async function api(body) {
  const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action: 'demoData', setupKey: fs.readFileSync(KEY_FILE, 'utf8').trim() }, body)), redirect: 'follow' });
  const text = await res.text();
  try { return JSON.parse(text); } catch (e) { throw new Error('not JSON (' + res.status + '): ' + text.slice(0, 200)); }
}

function riyadhToday() { return new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10); }
const dayMs = 86400e3;

/** Moves every date, timestamp and month inside a value (JSON text included) back by `days`. */
function shifter(days) {
  const shiftDate = d => { const t = Date.parse(d + 'T00:00:00Z'); return isNaN(t) ? d : new Date(t - days * dayMs).toISOString().slice(0, 10); };
  const shiftMonth = m => { const t = Date.parse(m + '-15T00:00:00Z'); return isNaN(t) ? m : new Date(t - days * dayMs).toISOString().slice(0, 7); };
  const str = s => s
    .replace(/\b(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)(Z|[+-]\d{2}:\d{2})?/g, (m, d, t, z) => { const v = Date.parse(m.length === 16 ? m + ':00' : m); if (isNaN(v)) return m; const iso = new Date(v - days * dayMs).toISOString(); return z === 'Z' || !z ? (m.endsWith('Z') ? iso : iso.slice(0, m.length)) : shiftDate(d) + 'T' + t + z; })
    .replace(/\b(\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))(?!T)\b/g, d => shiftDate(d))
    .replace(/(^|")(\d{4}-(0[1-9]|1[0-2]))("|$)/g, (m, a, mo, x, b) => a + shiftMonth(mo) + b);
  const walk = v => typeof v === 'string' ? str(v) : Array.isArray(v) ? v.map(walk) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : v;
  return walk;
}

let p_replayed = 0;
function prepare(dump) {
  const end = dump.end, today = riyadhToday();
  const gap = Math.round((Date.parse(end + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / dayMs);
  const weeks = Number((process.argv.find(x => /^--weeks=\d+$/.test(x)) || "=0").split("=")[1]);
  const days = Math.max(0, Math.ceil(gap / 7) * 7, weeks * 7); // whole weeks keep every weekday (weekends, rosters) as simulated
  const walk = shifter(days), out = {};
  for (const [tab, rows] of Object.entries(dump.tabs)) {
    if (SKIP.has(tab) || !rows.length) continue;
    out[tab] = rows.map(r => {
      const o = walk(r);
      if ('empNo' in o && o.empNo !== '') o.empNo = 'T' + String(o.empNo);
      return o;
    });
  }
  out.employees.forEach(e => Object.assign(e, { actHash: '', actExp: '', actTries: 0, actIssuedBy: '', pwHash: '', pwSalt: '', pwTries: 0, pwLockUntil: '', pwMustChange: '' }));
  (out.zones || []).forEach(z => { z.name = 'تجريبي - ' + z.name; });
  (out.surveys || []).forEach(s => { if (s.status === 'open') s.status = 'closed'; });   // real staff must not be asked
  (out.policies || []).forEach(p => { if (p.status === 'active') p.status = 'retired'; }); // nor asked to acknowledge demo texts
  // The simulated month stops a few days before today. Replay each person's last simulated week, week after week, up to this
  // minute, so the live board and today's figures show them too (same pattern: the late stay late, the roster stays the roster).
  const now = Date.now(), punches = out.punches || [], emps = Object.fromEntries(out.employees.map(e => [e.id, e]));
  const lastDay = punches.map(x => String(x.date)).sort().pop();
  if (lastDay) {
    const from = new Date(Date.parse(lastDay + 'T00:00:00Z') - 6 * dayMs).toISOString().slice(0, 10);
    const week = punches.filter(x => String(x.date) >= from && x.status !== 'rejected');
    let n = 0;
    for (let k = 1; k < 16; k++) {
      const fwd = shifter(-7 * k);
      week.forEach(x => {
        const e = emps[x.empId], y = fwd(x);
        if (!e || e.status !== 'active' || Date.parse(y.ts) > now) return;
        if (e.lastWorkingDay && String(y.date) > String(e.lastWorkingDay).slice(0, 10)) return;
        punches.push(Object.assign(y, { id: 'PD' + (++n).toString(36) + Math.random().toString(36).slice(2, 10), status: x.status === 'manual' ? 'ok' : x.status, source: 'app', note: '', reviewBy: '', reviewAt: '' }));
      });
    }
    p_replayed = n;
  }
  return { days, end, replayed: p_replayed, tabs: out };
}

/** Every month from the earliest to the latest argument, inclusive: ['2026-07', '2026-09'] -> 07, 08, 09. */
function payrollMonths(args) {
  const ms = args.filter(a => /^\d{4}-(0[1-9]|1[0-2])$/.test(a)).sort();
  if (!ms.length) return [];
  const out = [];
  for (let m = ms[0]; m <= ms[ms.length - 1]; ) {
    out.push(m);
    const [y, mo] = m.split('-').map(Number);
    m = mo === 12 ? (y + 1) + '-01' : y + '-' + String(mo + 1).padStart(2, '0');
  }
  return out;
}

module.exports = { prepare, shifter, payrollMonths };
if (require.main === module) (async () => {
  const [mode, file] = process.argv.slice(2);
  if (mode === 'status') return console.log(JSON.stringify(await api({ mode: 'status' }), null, 1));
  if (mode === 'purge') return console.log(JSON.stringify(await api({ mode: 'purge' }), null, 1));
  if (mode === 'payroll') {
    const months = payrollMonths(process.argv.slice(3));
    if (!months.length) throw new Error('usage: payroll <YYYY-MM> [YYYY-MM]   (every month from the first to the last)');
    for (const month of months) {
      const r = await api({ mode: 'payroll', month });
      if (!r.ok) throw new Error(month + ': ' + JSON.stringify(r));
      console.log('  ' + month + '  ' + (r.skipped ? 'already has a demo run (' + r.run.ref + ', ' + r.run.status + ')' : 'locked ' + r.run.ref + ', ' + r.headcount + ' payslips, net ' + r.run.totals.net));
    }
    return console.log('done');
  }
  if (mode !== 'load' || !file) throw new Error('usage: status | load <sim.json> | payroll <from YYYY-MM> [to YYYY-MM] | purge');
  const p = prepare(JSON.parse(fs.readFileSync(file, 'utf8')));
  const st = await api({ mode: 'status' });
  if (!st.ok) throw new Error(JSON.stringify(st));
  const months = new Set((p.tabs.payrollRuns || []).map(r => r.month));
  const clash = (st.payrollMonths || []).filter(m => months.has(m.split(':')[0]));
  if (clash.length && !process.argv.includes('--force')) throw new Error('live already has a payroll run for ' + clash.join(', ') + '; not loading');
  console.log('replayed ' + p.replayed + ' punches up to now; moving dates back ' + p.days + ' days (simulated end ' + p.end + '), payroll months ' + [...months].join(', '));
  const tabs = ORDER.filter(t => p.tabs[t]).concat(Object.keys(p.tabs).filter(t => !ORDER.includes(t)));
  for (const tab of tabs) {
    const rows = p.tabs[tab];
    for (let i = 0; i < rows.length; i += 400) {
      const r = await api({ mode: 'import', tab, rows: rows.slice(i, i + 400), batch: 'sim50-' + riyadhToday() });
      if (!r.ok) throw new Error(tab + ': ' + JSON.stringify(r));
      console.log('  ' + tab.padEnd(15) + ' +' + r.added + (r.skipped ? ' (skipped ' + r.skipped + ')' : ''));
    }
  }
  console.log('done');
})().catch(e => { console.error('FAILED: ' + e.message); process.exit(1); });
