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
  // HR demo (fictional people): organisation, a job description, a manager chain, packages, private data, documents.
  const addDays = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  B.ctx.append_('departments', { id: 'DFIN', code: 'FIN', nameAr: 'الإدارة المالية', nameEn: 'Finance', parentId: '', headEmpId: 'E2004', costCenter: '100', status: 'active', createdAt: now, updatedAt: now });
  B.ctx.append_('departments', { id: 'DACC', code: 'ACC', nameAr: 'الحسابات', nameEn: 'Accounts', parentId: 'DFIN', headEmpId: '', costCenter: '110', status: 'active', createdAt: now, updatedAt: now });
  B.ctx.append_('departments', { id: 'DOPS', code: 'OPS', nameAr: 'العمليات', nameEn: 'Operations', parentId: '', headEmpId: 'E2005', costCenter: '200', status: 'active', createdAt: now, updatedAt: now });
  B.ctx.append_('positions', { id: 'JACC', code: 'ACC-2', titleAr: 'محاسب', titleEn: 'Accountant', departmentId: 'DACC', grade: 'G5',
    purposeAr: 'تسجيل العمليات المالية اليومية ومطابقة الحسابات البنكية لضمان دقة القوائم المالية.', purposeEn: 'Record daily transactions and reconcile bank accounts so the statements are accurate.',
    dutiesAr: 'إعداد قيود اليومية\nمطابقة كشوف البنوك شهريا\nمتابعة ذمم الموردين\nإعداد تقارير الإقفال الشهري', dutiesEn: 'Prepare journal entries\nReconcile bank statements monthly\nFollow up supplier balances\nPrepare month-end reports',
    requirementsAr: 'بكالوريوس محاسبة\nخبرة سنتين\nإجادة Excel', requirementsEn: "Bachelor's in accounting\nTwo years' experience\nStrong Excel", status: 'active', createdAt: now, updatedAt: now });
  B.ctx.append_('positions', { id: 'JMGR', code: 'FIN-1', titleAr: 'مدير مالي', titleEn: 'Finance manager', departmentId: 'DFIN', grade: 'G9', purposeAr: '', purposeEn: '', dutiesAr: '', dutiesEn: '', requirementsAr: '', requirementsEn: '', status: 'active', createdAt: now, updatedAt: now });
  const job = { E2001: { departmentId: 'DACC', positionId: 'JACC', managerId: 'E2004', hireDate: '2021-06-15', nationality: 'SA', isSaudi: true, contractType: 'indefinite', annualLeaveDays: 30, workDaysPerWeek: 5, dailyHours: 8, noticeDays: 60 },
    E2004: { departmentId: 'DFIN', positionId: 'JMGR', managerId: '', hireDate: '2018-02-01', nationality: 'SA', isSaudi: true, contractType: 'indefinite' },
    E2003: { departmentId: 'DACC', positionId: 'JACC', managerId: 'E2004', hireDate: '2024-01-07', nationality: 'IN', isSaudi: false, contractType: 'fixed', contractEnd: addDays(40), probationEnd: '' },
    E2005: { departmentId: 'DOPS', managerId: '', hireDate: '2020-09-01', nationality: 'SA', isSaudi: true }, E2006: { departmentId: 'DOPS', managerId: 'E2005', hireDate: '2025-03-10', nationality: 'EG', isSaudi: false, contractType: 'fixed', contractEnd: addDays(300) } };
  B.ctx.readAll_('employees').forEach(e => { if (job[e.id]) { Object.assign(e, job[e.id]); B.ctx.update_('employees', e); } });
  const pkg = [['E2001', 9000, 2250, 900, { 'بدل هاتف': 200 }], ['E2004', 18000, 4500, 1500, {}], ['E2003', 7000, 1750, 700, {}], ['E2005', 3200, 500, 400, {}]];
  pkg.forEach(([emp, b, h, t, o], i) => B.ctx.append_('compensation', { id: 'C' + i, empId: emp, effectiveFrom: '2026-01-01', basic: b, housing: h, transport: t, otherJson: JSON.stringify(o), currency: 'SAR', reason: 'initial', enteredBy: 'E2002', approvedBy: 'E1000', approvedAt: now, status: 'approved', createdAt: now, batchId: '' }));
  B.ctx.append_('compensation', { id: 'CP1', empId: 'E2006', effectiveFrom: addDays(10), basic: 6000, housing: 1500, transport: 600, otherJson: '{}', currency: 'SAR', reason: 'initial', enteredBy: 'E1000', approvedBy: '', approvedAt: '', status: 'pending', createdAt: now, batchId: '' });
  B.ctx.append_('empPrivate', { empId: 'E2001', nationalId: '1012345678', idExpiry: '2029-05-01', iban: 'SA0380000000608010167519', bankName: 'الراجحي', gosiNumber: '401234567', gosiCohort: 'legacy', updatedAt: now });
  B.ctx.append_('empPrivate', { empId: 'E2003', nationalId: '2123456780', idExpiry: addDays(18), passportNo: 'P1234567', passportExpiry: addDays(400), updatedAt: now });
  B.ctx.append_('documents', { id: 'F1', empId: 'E2003', type: 'work_permit', number: 'WP-8841', issueDate: '2025-11-01', expiryDate: addDays(25), note: '', status: 'active', createdAt: now, updatedAt: now });
  // Phase 2 demo: holidays and a few requests waiting at each step
  B.ctx.append_('holidays', { id: 'O1', date: addDays(12), toDate: addDays(14), nameAr: 'عطلة تجريبية', nameEn: 'Demo holiday', createdBy: 'E2002', createdAt: now, status: 'active' });
  const rq = (id, ref, emp, type, sub, from, to, days, step, extra) => B.ctx.append_('requests', Object.assign({ id, ref, empId: emp, type, subtype: sub, fromDate: from, toDate: to, days, amount: '', months: '',
    payloadJson: '{}', reason: 'طلب تجريبي', docNo: '', status: 'pending', step, stepsJson: '[]', effectJson: '{}', createdAt: now, updatedAt: now, decidedAt: '' }, extra || {}));
  rq('R1', 'LV-2026-00001', 'E2001', 'leave', 'annual', addDays(20), addDays(24), 5, 'manager');
  rq('R2', 'LV-2026-00002', 'E2003', 'leave', 'sick', addDays(-2), addDays(-1), 2, 'hr', { docNo: 'SEHA-1', stepsJson: JSON.stringify([{ step: 'manager', by: 'E2004', decision: 'approve', note: '', at: now }]) });
  rq('R3', 'LT-2026-00001', 'E2001', 'letter', 'salary_certificate', '', '', '', 'hr', { payloadJson: JSON.stringify({ addressee: 'بنك الراجحي', lang: 'ar' }) });
  rq('R4', 'LV-2026-00003', 'E2006', 'leave', 'annual', addDays(3), addDays(5), 3, 'done', { status: 'approved' });
  // Dashboard demo: 45 days of check-ins (a few late, a few absent) for the staff, who joined 60 days ago
  B.ctx.readAll_('employees').forEach(e => { e.createdAt = new Date(Date.now() - 60 * 86400000).toISOString(); B.ctx.update_('employees', e); });
  const hist = [];
  B.ctx.readAll_('employees').forEach((e, idx) => {
    for (let back = 1; back <= 45; back++) {
      const ds = new Date(Date.now() + 3 * 3600000 - back * 86400000).toISOString().slice(0, 10), dow = new Date(ds + 'T00:00:00Z').getUTCDay();
      if (dow > 4 || (back * (idx + 3)) % 17 === 0) continue;
      const inAt = (back + idx) % 6 === 0 ? '08:3' + (idx % 10) : (back + idx) % 4 === 0 ? '08:1' + (idx % 5) : '07:5' + (idx % 10);
      [['in', inAt], ['out', (back + idx) % 5 === 0 ? '18:40' : '17:0' + (idx % 10)]].forEach(([ty, hm]) => hist.push({ id: 'H' + e.id + ds + ty, empId: e.id, type: ty, ts: new Date(ds + 'T' + hm + ':00+03:00').toISOString(), date: ds, lat: HQ.lat, lng: HQ.lng, acc: 12, zoneId: 'ZHQ', distance: 20, status: 'ok', risk: 0, flags: '', source: 'app', note: '', reviewBy: '', reviewAt: '', credId: '', ua: '', createdAt: now }));
    }
  });
  B.ctx.appendMany_('punches', hist);
  // Phase 4 demo: a 2026 cycle in the review stage with KPIs for 2001 and a 360 request to 2001
  B.ctx.append_('perfCycles', { id: 'Y1', ref: 'PC-2026-00001', year: 2026, nameAr: 'تقييم الأداء 2026', nameEn: 'Performance 2026', type: 'annual', status: 'review', kpiWeight: 70, compWeight: 30, goalsDue: '', midDue: '', reviewDue: '', createdBy: 'E2002', createdAt: now, updatedAt: now });
  [['تحقيق خطة التحصيل الشهرية', '95', '%', 40, 'on_track'], ['مطابقة البنوك قبل اليوم الخامس', '12', 'مرة', 30, 'at_risk'], ['تقليل القيود المرفوضة', '2', '%', 30, 'on_track']].forEach((k, i) =>
    B.ctx.append_('kpis', { id: 'K' + i, ref: 'KPI-2026-0000' + (i + 1), cycleId: 'Y1', empId: 'E2001', titleAr: k[0], titleEn: '', measure: '', target: k[1], unit: k[2], weight: k[3], status: 'agreed', midStatus: k[4], midNote: i === 1 ? 'تأخر كشف بنك واحد' : '', actual: '', selfScore: '', selfComment: '', mgrScore: '', mgrComment: '', setBy: 'E2004', createdAt: now, updatedAt: now }));
  B.ctx.append_('feedback360', { id: 'B1', ref: 'FB-2026-00001', cycleId: 'Y1', subjectId: 'E2004', raterId: 'E2001', relation: 'report', status: 'invited', answersJson: '', comment: '', createdAt: now, submittedAt: '' });
  B.ctx.append_('documents', { id: 'F2', empId: 'E2001', type: 'medical_insurance', number: 'MI-22019', issueDate: '2026-01-01', expiryDate: '2026-12-31', note: '', status: 'active', createdAt: now, updatedAt: now });
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
