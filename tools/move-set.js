#!/usr/bin/env node
'use strict';
// Freezes (or undoes) the move to Postgres on the live Apps Script, without the editor:
//   node tools/move-set.js freeze     MOVED_TO = the Railway API, BACKUP_KEY from ../platform/.env.supabase (HRP_BACKUP_KEY)
//   node tools/move-set.js undo       removes MOVED_TO (rollback: the Sheet serves again)
// The setup key comes from ../apps-script/SETUP-KEY.txt. Prints only yes / no answers, never a key.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const URL = 'https://script.google.com/macros/s/AKfycbz1XJ-WF6qnXiGtieQev6g53pAMThwCWhpp7r-pwbWtQi-ShJrpQIJUFHr17E3AryKG/exec';
const API = 'https://basma-api-production.up.railway.app/c/bestgas/api';
const what = process.argv[2];
if (what !== 'freeze' && what !== 'undo') { console.error('usage: node tools/move-set.js freeze|undo'); process.exit(1); }
const KEY = fs.readFileSync(path.join(ROOT, '../apps-script/SETUP-KEY.txt'), 'utf8').trim();
let backupKey = null;
if (what === 'freeze') {
  for (const l of fs.readFileSync(path.join(ROOT, '../platform/.env.supabase'), 'utf8').split(/\r?\n/)) { const m = l.match(/^HRP_BACKUP_KEY=(.+)$/); if (m) backupKey = m[1].trim(); }
  if (!backupKey) { console.error('HRP_BACKUP_KEY missing in platform/.env.supabase'); process.exit(1); }
}
(async () => {
  const body = { action: 'demoData', orgId: '1001', setupKey: KEY, mode: 'moveSet', moved: what === 'freeze' ? API : '' };
  if (backupKey) body.backupKey = backupKey;
  const r = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' });
  const j = await r.json();
  console.log(JSON.stringify({ ok: j.ok, error: j.error, moved: j.moved, backupKey: j.backupKey }));
  process.exit(j.ok ? 0 : 1);
})().catch(e => { console.error(String(e && e.message || e)); process.exit(1); });
