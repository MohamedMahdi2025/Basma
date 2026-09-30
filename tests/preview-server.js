// Local preview: node tests/preview-server.js [port]
// Serves the app and answers /api with the REAL backend (*.gs in Node's vm).
// Face ID and GPS are simulated in the page (tests/preview-shims.js), and
// only here: the shim is injected by this server, never shipped.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { load } = require('./harness');

const PORT = Number(process.argv[2] || 8765);
const ORIGIN = 'http://localhost:' + PORT;
// 'built' serves the published, encoded app/ folder instead of the readable source.
const ROOT = process.argv[3] === 'built' ? path.join(__dirname, '..', '..', 'app') : path.join(__dirname, '..');
const SETUP = 'preview-setup';
const B = load({ props: { RP_ID: 'localhost', ORIGINS: ORIGIN }, setupKeyHash: crypto.createHash('sha256').update(SETUP).digest('hex') });

// Seed: HQ zone + demo staff with punches, so the board has something to show.
(function seed() {
  const HQ = { lat: 24.7136, lng: 46.6753 };
  const now = new Date().toISOString();
  B.ctx.append_('zones', { id: 'ZHQ', name: 'المقر الرئيسي', nameEn: 'Head office', lat: HQ.lat, lng: HQ.lng, radius: 150, status: 'active', createdAt: now, updatedAt: now });
  const staff = [['1000', 'محمد مهدي', 'admin', 'الإدارة'], ['2001', 'أحمد الزهراني', 'employee', 'المالية'], ['2002', 'سارة القحطاني', 'hr', 'الموارد البشرية'],
    ['2003', 'خالد العتيبي', 'employee', 'المشتريات'], ['2004', 'نورة الشهري', 'employee', 'المالية'], ['2005', 'فهد الدوسري', 'employee', 'العمليات'], ['2006', 'ريم الحربي', 'employee', 'تقنية المعلومات']];
  const today = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
  const at = (hm) => new Date(today + 'T' + hm + ':00+03:00').toISOString();
  staff.forEach(([no, name, role, dept], i) => {
    const id = 'E' + no;
    B.ctx.append_('employees', { id, empNo: no, name, nameEn: '', email: '', phone: '', department: dept, title: '', role, status: 'active', zoneIds: '', shiftStart: '', shiftEnd: '', workdays: '', tokenVer: 0, actHash: B.ctx.sha256Hex_(id + ':DEMO-' + no), actExp: new Date(Date.now() + 86400000 * 3).toISOString(), actTries: 0, createdAt: now, updatedAt: now });
    const ins = { 1: '07:52', 2: '08:04', 3: '08:41', 5: '07:58' };
    if (ins[i] && Date.parse(at(ins[i])) < Date.now()) B.ctx.append_('punches', { id: 'P' + no, empId: id, type: 'in', ts: at(ins[i]), date: today, lat: HQ.lat + 0.0002, lng: HQ.lng, acc: 14, zoneId: 'ZHQ', distance: 22, status: i === 3 ? 'review' : 'ok', risk: i === 3 ? 45 : 0, flags: i === 3 ? 'static_samples,new_device' : '', source: 'app', note: '', reviewBy: '', reviewAt: '', credId: '', ua: '', createdAt: now });
  });
})();

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api') {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      let out;
      try { out = B.call(JSON.parse(body)); } catch (e) { out = { ok: false, error: 'bad_request' }; }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(out));
    });
    return;
  }
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  let data = fs.readFileSync(file);
  if (p === '/index.html') {
    const shim = fs.readFileSync(path.join(__dirname, 'preview-shims.js'), 'utf8');
    data = Buffer.from(String(data).replace('<script>', '<script>window.BG_API="/api";</script><script>' + shim + '</script><script>'));
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(data);
}).listen(PORT, () => console.log('Preview on ' + ORIGIN + '  (setup key: ' + SETUP + ', demo codes: DEMO-<empNo>)'));
