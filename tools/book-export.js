// Copies the whole live home book (every tab, every row, typed cells, and the script properties) to the owner's PC, for the
// move to Postgres (platform/scripts/import-book.js). Read-only on the server (Demo.gs bookExport_).
//   node tools/book-export.js [--out ../apps-script/book-export]
// The setup key is read from ../apps-script/SETUP-KEY.txt and never printed. The files hold personal data and secrets: they
// are written only under ../apps-script (private, outside every git repo) unless --out says otherwise.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const DEP = (fs.readFileSync(path.join(ROOT, 'tools/deploy.sh'), 'utf8').match(/DEP="?([A-Za-z0-9_-]{40,})/) || [])[1];
const URL = process.env.BASMA_EXPORT_URL || 'https://script.google.com/macros/s/' + DEP.slice(2) + '/exec';
const KEY = process.env.BASMA_SETUP_KEY || fs.readFileSync(path.join(ROOT, '../apps-script/SETUP-KEY.txt'), 'utf8').trim(); // the env form is for the local rehearsal
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const OUT = path.resolve(arg('--out', path.join(ROOT, '../apps-script/book-export')));

async function call(body) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action: 'demoData', orgId: '1001', setupKey: KEY, mode: 'bookExport' }, body)), redirect: 'follow' });
      const text = await res.text();
      const r = JSON.parse(text);
      if (!r.ok) throw new Error('server said ' + r.error);
      return r;
    } catch (e) {
      if (attempt >= 4 || /server said (bad_setup_key|too_many_attempts|not_found)/.test(e.message)) throw e;
      await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }
}

(async () => {
  fs.mkdirSync(path.join(OUT, 'tabs'), { recursive: true });
  const man = await call({});
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ at: man.at, tabs: man.tabs, props: man.props }, null, 1));
  let rows = 0;
  for (const t of man.tabs) {
    const header = [], all = [];
    for (let off = 0; ; off += 2000) {
      const r = await call({ tab: t.name, offset: off, limit: 2000 });
      if (!header.length) header.push(...r.header);
      all.push(...r.rows);
      if (all.length >= r.total || !r.rows.length) break;
    }
    if (all.length !== t.rows) console.log('  note: ' + t.name + ' had ' + t.rows + ' rows in the list and ' + all.length + ' now (written meanwhile)');
    fs.writeFileSync(path.join(OUT, 'tabs', encodeURIComponent(t.name) + '.json'), JSON.stringify({ name: t.name, header, rows: all }));
    rows += all.length;
    console.log('  ' + t.name.padEnd(22) + String(all.length).padStart(7) + ' rows');
  }
  console.log('\n' + man.tabs.length + ' tabs, ' + rows + ' rows, ' + Object.keys(man.props).length + ' properties -> ' + OUT);
})().catch(e => { console.error('export failed: ' + e.message); process.exit(1); });
