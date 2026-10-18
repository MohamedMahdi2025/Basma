/**
 * Payroll journal for the ledger (Odoo first), gap matrix P0-6, and the bank / Mudad salary-file layouts, P0-11.
 * 2026-10-05.
 *
 * Journal: from a locked run, one balanced entry dated the month's last day, reference = the run (PR-...).
 *   Dr  each earning line by code (basic, housing, transport, each named allowance, overtime, bonus, commission,
 *       other earnings, expense reimbursements) and the employer GOSI expense, per department (analytic account);
 *   Cr  pay reductions (unpaid leave, sick tiers, absence, late) against the salary expense of the same department;
 *   Cr  GOSI payable (employee + employer), advances receivable (per employee as partner), fines, other deductions,
 *       net salaries payable (one line, or one per employee when netByEmployee is set);
 *   Dr/Cr the end-of-service provision when both EOS accounts are mapped (includeEos, default on).
 * Every amount is summed in whole halalas, so debits equal credits exactly; a payslip whose lines do not add up to
 * its net is reported and blocks the export. Export is also blocked while any code used is unmapped.
 * The mapping is the setting glMap (JSON), edited with journalMapSave (an administrator or a payroll holder).
 * Tracker (journalLog, JV-...): generated -> imported in Odoo (its reference) -> confirmed by a second person who
 * neither generated nor imported it. A mapping change after generation is caught by the fingerprint.
 * The Odoo layout (journal, date, reference, account, partner, label, debit, credit, analytic) must be checked with a
 * test import in Odoo before the first live month.
 */

var GL_KEYS = ['basic', 'housing', 'transport', 'allowance', 'overtime', 'bonus', 'commission', 'other_earning', 'reimbursement', 'gosi_expense', 'pay_reduction',
  'gosi_payable', 'net_payable', 'advances', 'fines', 'other_deductions', 'eos_expense', 'eos_provision'];
var GL_EARN = { basic: 'basic', housing: 'housing', transport: 'transport', overtime: 'overtime', bonus: 'bonus', commission: 'commission', other_earning: 'other_earning', reimbursement: 'reimbursement' };
var GL_REDUCE = { unpaid_leave: 1, sick_75: 1, sick_unpaid: 1, absence: 1, late: 1 };
var GL_DEDUCT = { gosi: 'gosi_payable', advance: 'advances', fine: 'fines', other_deduction: 'other_deductions' };

/** One settings key written alone (the settings screen rewrites them all; this keeps the others untouched). */
function saveSettingKey_(key, value) {
  var row = readAll_(SHEETS.SET).filter(function (r) { return r.key === key; })[0];
  if (row) { row.value = value; update_(SHEETS.SET, row); } else append_(SHEETS.SET, { key: key, value: value });
  forget_(SHEETS.SET);
  try { CacheService.getScriptCache().remove(SETTINGS_CACHE_KEY); } catch (e) {}
}
function glMap_() {
  var m = parseJson_(settings_().glMap, {});
  if (!m || typeof m !== 'object') m = {};
  return { journal: m.journal || '', accounts: m.accounts || {}, analytic: m.analytic || {}, netByEmployee: !!m.netByEmployee, includeEos: m.includeEos !== false };
}
function canMap_(me) { return !!me && (me.role === 'admin' || canPayroll_(me)); }

/** The journal of a locked run: lines (SAR, two decimals), totals, problems and a fingerprint. Never writes. */
function journalOf_(run) {
  var map = glMap_(), acc = map.accounts, ctx = orgCtx_(), lines = {}, problems = [], need = {}, dr = 0, cr = 0;
  var put = function (side, key, analytic, partner, h, dept, labelKey) {
    if (!h) return;
    if (h < 0) { side = side === 'dr' ? 'cr' : 'dr'; h = -h; }
    var account = key.indexOf('allowance:') === 0 ? (acc[key] || acc.allowance || '') : (acc[key] || '');
    need[key.indexOf('allowance:') === 0 && !acc[key] ? 'allowance' : key] = 1;
    var k = [side, account || '?' + key, analytic, partner, labelKey || key].join('|');
    var l = lines[k] = lines[k] || { side: side, key: key, account: account, analytic: analytic, partner: partner, dept: dept, labelKey: labelKey || key, h: 0 };
    l.h += h;
    if (side === 'dr') dr += h; else cr += h;
  };
  readAll_(SHEETS.SLIP).filter(function (s) { return s.runId === run.id && s.status === 'locked'; }).forEach(function (s) {
    var e = ctx.emps[s.empId] || {}, d = ctx.depts[e.departmentId], an = String(map.analytic[e.departmentId] || (d && d.costCenter) || ''), dn = d ? d.nameAr : (e.department || '');
    var partner = String(e.empNo || '') + ' ' + (e.name || ''), earn = 0, ded = 0;
    lines_(s).forEach(function (l) {
      var h = Math.round(Number(l.amount) * 100);
      if (l.kind === 'earning') {
        earn += h;
        if (l.code === 'allowance') put('dr', 'allowance:' + String(l.label || ''), an, '', h, dn, 'allowance:' + String(l.label || ''));
        else if (GL_EARN[l.code]) put('dr', GL_EARN[l.code], an, '', h, dn);
        else { problems.push({ code: 'unknown_line', line: l.code, payslip: s.ref }); put('dr', 'other_earning', an, '', h, dn); }
      } else {
        ded += h;
        if (GL_REDUCE[l.code]) put('cr', 'pay_reduction', an, '', h, dn);
        else if (l.code === 'advance' || l.code === 'loan') put('cr', 'advances', '', partner, h, '', 'advances'); // employee loans (Loans.gs) clear the same employee receivable
        else if (GL_DEDUCT[l.code]) put('cr', GL_DEDUCT[l.code], '', '', h, '');
        else { problems.push({ code: 'unknown_line', line: l.code, payslip: s.ref }); put('cr', 'other_deductions', '', '', h, ''); }
      }
    });
    var net = earn - ded;
    if (net !== Math.round(Number(s.net) * 100)) problems.push({ code: 'slip_mismatch', payslip: s.ref });
    put('cr', 'net_payable', '', map.netByEmployee ? partner : '', net, '', 'net_payable');
    var er = Math.round(Number(s.gosiEmployer) * 100);
    put('dr', 'gosi_expense', an, '', er, dn); put('cr', 'gosi_payable', '', '', er, '', 'gosi_payable');
    var eos = Math.round((Number(s.eosAccrual) || 0) * 100);
    if (map.includeEos && acc.eos_expense && acc.eos_provision && eos) { put('dr', 'eos_expense', an, '', eos, dn); put('cr', 'eos_provision', '', '', eos, ''); }
  });
  Object.keys(need).forEach(function (k) { if (!acc[k]) problems.push({ code: 'unmapped', key: k }); });
  var out = Object.keys(lines).map(function (k) { return lines[k]; }).sort(function (a, b) {
    return a.side !== b.side ? (a.side === 'dr' ? -1 : 1) : GL_KEYS.indexOf(a.key.split(':')[0]) - GL_KEYS.indexOf(b.key.split(':')[0]) || String(a.analytic + a.partner + a.key).localeCompare(String(b.analytic + b.partner + b.key));
  }).map(function (l) {
    return { account: l.account, key: l.key, analytic: l.analytic, partner: l.partner, dept: l.dept, labelKey: l.labelKey, debit: l.side === 'dr' ? l.h / 100 : 0, credit: l.side === 'cr' ? l.h / 100 : 0, h: l.h, side: l.side };
  });
  var fp = sha256Hex_(JSON.stringify([run.id, map.journal, out.map(function (l) { return [l.account, l.analytic, l.partner, l.side, l.h]; })]));
  out.forEach(function (l) { delete l.h; delete l.side; });
  return { journal: map.journal || 'SAL', date: monthLast_(run.month), ref: run.ref, month: run.month, lines: out, debit: dr / 100, credit: cr / 100, debitH: dr, creditH: cr,
    balanced: dr === cr, problems: problems, hash: fp, includeEos: map.includeEos && !!(acc.eos_expense && acc.eos_provision) };
}
function journalLogOf_(runId) { return readAll_(SHEETS.JOURNAL).filter(function (j) { return j.runId === runId && j.status !== 'cancelled'; })[0] || null; }
function publicJournal_(j, me) {
  if (!j) return null;
  var names = {}; readAll_(SHEETS.EMP).forEach(function (e) { names[e.id] = e.name; });
  return { id: j.id, ref: j.ref, runId: j.runId, month: j.month, status: j.status, lines: Number(j.lines) || 0, debit: Number(j.debit) || 0, credit: Number(j.credit) || 0, hash: j.hash,
    generatedBy: names[j.generatedBy] || '', generatedAt: j.generatedAt, importedBy: names[j.importedBy] || '', importedAt: j.importedAt, odooRef: j.odooRef,
    confirmedBy: names[j.confirmedBy] || '', confirmedAt: j.confirmedAt, note: j.note,
    canConfirm: j.status === 'imported' && j.generatedBy !== me.id && j.importedBy !== me.id, mineGenerated: j.generatedBy === me.id };
}

function api_journalList(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  var logs = readAll_(SHEETS.JOURNAL), map = glMap_();
  var runs = readAll_(SHEETS.RUN).filter(function (r) { return r.status === 'locked' && !isDemoRun_(r); }).sort(function (a, b) { return a.month < b.month ? 1 : -1; }).slice(0, 24).map(function (r) {
    var o = publicRun_(r), j = logs.filter(function (x) { return x.runId === r.id && x.status !== 'cancelled'; })[0];
    o.journal = publicJournal_(j, me);
    return o;
  });
  return { ok: true, runs: runs, mapped: Object.keys(map.accounts).length > 0, history: logs.slice(-60).reverse().map(function (j) { return publicJournal_(j, me); }) };
}
function api_journalBuild(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  var run = findBy_(SHEETS.RUN, 'id', req.id);
  if (!run || run.status !== 'locked') fail_('run_not_locked');
  if (isDemoRun_(run)) fail_('demo_run'); // demo payroll never goes to the bank or the ledger
  var j = journalOf_(run), log = journalLogOf_(run.id);
  audit_(me.id, 'journal_build', run.id, { ref: run.ref, lines: j.lines.length, balanced: j.balanced });
  return { ok: true, run: publicRun_(run), entry: j, log: publicJournal_(log, me), changed: !!log && log.hash !== j.hash };
}
/** generated -> imported (Odoo reference) -> confirmed (a second person); cancelled before confirmation, with a note. */
function api_journalStep(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  return withLock_(function () {
    var run = findBy_(SHEETS.RUN, 'id', req.id);
    if (!run || run.status !== 'locked') fail_('run_not_locked');
    if (isDemoRun_(run)) fail_('demo_run'); // demo payroll never goes to the bank or the ledger
    var log = journalLogOf_(run.id), now = new Date().toISOString(), step = req.step;
    if (step === 'generated') {
      if (log) fail_('already_exists');
      var j = journalOf_(run);
      if (!j.lines.length) fail_('not_found');
      if (j.problems.some(function (p) { return p.code === 'unmapped'; })) fail_('journal_unmapped');
      if (!j.balanced || j.problems.length) fail_('journal_unbalanced');
      log = { id: newId_('L'), ref: nextRef_('journal', refsOf_(SHEETS.JOURNAL)), runId: run.id, month: run.month, status: 'generated', lines: j.lines.length, debit: j.debit, credit: j.credit,
        hash: j.hash, generatedBy: me.id, generatedAt: now, importedBy: '', importedAt: '', odooRef: '', confirmedBy: '', confirmedAt: '', note: str_(req.note, 300) };
      append_(SHEETS.JOURNAL, log);
    } else if (step === 'imported') {
      if (!log || log.status !== 'generated') fail_('bad_state');
      var ref = str_(req.odooRef, 60); if (!ref) fail_('missing_fields');
      if (journalOf_(run).hash !== log.hash) fail_('journal_changed'); // the mapping changed since the file was made
      log.status = 'imported'; log.importedBy = me.id; log.importedAt = now; log.odooRef = ref; log.note = str_(req.note, 300) || log.note;
      update_(SHEETS.JOURNAL, log);
    } else if (step === 'confirmed') {
      if (!log || log.status !== 'imported') fail_('bad_state');
      if (log.generatedBy === me.id || log.importedBy === me.id) fail_('second_approver_required');
      log.status = 'confirmed'; log.confirmedBy = me.id; log.confirmedAt = now; log.note = str_(req.note, 300) || log.note;
      update_(SHEETS.JOURNAL, log);
    } else if (step === 'cancelled') {
      if (!log || log.status === 'confirmed') fail_('bad_state');
      var n = str_(req.note, 300); if (!n) fail_('note_required');
      log.status = 'cancelled'; log.note = n;
      update_(SHEETS.JOURNAL, log);
    } else fail_('bad_value');
    audit_(me.id, 'journal_' + step, run.id, { ref: log.ref, month: run.month });
    return { ok: true, log: publicJournal_(log, me) };
  });
}
function api_journalMapGet(req, me) {
  if (!canMap_(me)) fail_('forbidden');
  var map = glMap_(), allowances = {};
  readAll_(SHEETS.COMP).forEach(function (c) { Object.keys(parseJson_(c.otherJson, {})).forEach(function (k) { allowances[k] = 1; }); });
  return { ok: true, map: map, keys: GL_KEYS, allowances: Object.keys(allowances).sort(),
    departments: readAll_(SHEETS.DEPT).filter(function (d) { return d.status !== 'disabled'; }).map(function (d) { return { id: d.id, nameAr: d.nameAr, nameEn: d.nameEn, costCenter: String(d.costCenter || '') }; }),
    bank: canPayroll_(me) ? bankSetup_() : null, canEdit: canMap_(me), canBank: canPayroll_(me) }; // the company debit IBAN: payroll holders only
}
var GL_TEXT_RE = /^[^<>"\u0000-\u001f]{1,64}$/;
function api_journalMapSave(req, me) {
  if (!canMap_(me)) fail_('forbidden');
  var m = req.map || {}, acc = {}, an = {}, depts = {};
  readAll_(SHEETS.DEPT).forEach(function (d) { depts[d.id] = 1; });
  Object.keys(m.accounts || {}).forEach(function (k) {
    var v = String(m.accounts[k] == null ? '' : m.accounts[k]).trim();
    if (GL_KEYS.indexOf(k) < 0 && !/^allowance:.{1,40}$/.test(k)) fail_('bad_value');
    if (!v) return;
    if (!GL_TEXT_RE.test(v)) fail_('bad_value');
    acc[k] = v;
  });
  Object.keys(m.analytic || {}).forEach(function (k) {
    var v = String(m.analytic[k] == null ? '' : m.analytic[k]).trim();
    if (!depts[k]) fail_('not_found');
    if (!v) return;
    if (!GL_TEXT_RE.test(v)) fail_('bad_value');
    an[k] = v;
  });
  var journal = String(m.journal || '').trim();
  if (journal && !GL_TEXT_RE.test(journal)) fail_('bad_value');
  var clean = { journal: journal, accounts: acc, analytic: an, netByEmployee: !!m.netByEmployee, includeEos: m.includeEos !== false };
  return withLock_(function () {
    saveSettingKey_('glMap', JSON.stringify(clean));
    audit_(me.id, 'journal_map_save', '', { accounts: Object.keys(acc).length, analytic: Object.keys(an).length });
    return { ok: true, map: clean };
  });
}
/** Calendar: locked runs of the last three months with no confirmed journal (only once a mapping exists). */
function journalCalendar_(add, t) {
  if (!Object.keys(glMap_().accounts).length) return;
  var logs = readAll_(SHEETS.JOURNAL);
  readAll_(SHEETS.RUN).forEach(function (r) {
    if (r.status !== 'locked' || isDemoRun_(r) || r.month < govAddMonths_(t.slice(0, 7) + '-01', -3).slice(0, 7)) return;
    var j = logs.filter(function (x) { return x.runId === r.id && x.status !== 'cancelled'; })[0];
    if (!j || j.status !== 'confirmed') add('journal_pending', addDays_(monthLast_(r.month), 10), null, { month: r.month, run: r.ref, status: j ? j.status : '' });
  });
}
function journalTasks_(me, add) {
  if (!canPayroll_(me)) return;
  var logs = readAll_(SHEETS.JOURNAL);
  add('journal_import', logs.filter(function (j) { return j.status === 'generated'; }).length, { tab: 'hr', sec: 'journal' });
  add('journal_confirm', logs.filter(function (j) { return j.status === 'imported' && j.generatedBy !== me.id && j.importedBy !== me.id; }).length, { tab: 'hr', sec: 'journal' });
}

// ---------------- salary files per bank (P0-11): verify each layout with the bank before first use ----------------

/** Identifiers the bank files need, JSON in the setting bankFileSetup (bankSetupSave). */
function bankSetup_() {
  var o = parseJson_(settings_().bankFileSetup, {});
  o = o && typeof o === 'object' ? o : {};
  return { molId: String(o.molId || ''), debitIban: String(o.debitIban || ''), companyCode: { alrajhi: String((o.companyCode || {}).alrajhi || ''), snb: String((o.companyCode || {}).snb || ''), riyad: String((o.companyCode || {}).riyad || '') } };
}
function api_bankSetupSave(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  var x = req.setup || {}, cc = x.companyCode || {}, iban = String(x.debitIban || '').replace(/\s+/g, '').toUpperCase(), mol = String(x.molId || '').trim();
  if (iban && !ibanOk_(iban)) fail_('bad_iban');
  if (mol && !/^[0-9-]{1,20}$/.test(mol)) fail_('bad_value');
  var codes = {};
  ['alrajhi', 'snb', 'riyad'].forEach(function (k) { var v = String(cc[k] || '').trim(); if (v && !/^[A-Za-z0-9-]{1,20}$/.test(v)) fail_('bad_value'); codes[k] = v; });
  return withLock_(function () {
    var clean = { molId: mol, debitIban: iban, companyCode: codes };
    saveSettingKey_('bankFileSetup', JSON.stringify(clean));
    audit_(me.id, 'bank_setup_save', '', { molId: !!mol, debitIban: iban ? iban.slice(-4) : '' });
    return { ok: true, setup: clean };
  });
}
var BANK_FORMATS = {
  generic: { ar: 'الملف العام (الحالي)', en: 'General file (current)', bank: '' },
  mudad: { ar: 'مدد (رفع ملف الرواتب)', en: 'Mudad (WPS upload)', bank: '', needs: ['molId'] },
  alrajhi: { ar: 'مصرف الراجحي', en: 'Al Rajhi Bank', bank: '80', needs: ['debitIban', 'companyCode'] },
  snb: { ar: 'البنك الأهلي السعودي', en: 'Saudi National Bank', bank: '10', needs: ['debitIban', 'companyCode'] },
  riyad: { ar: 'بنك الرياض', en: 'Riyad Bank', bank: '20', needs: ['debitIban', 'companyCode'] }
};
function ymdCompact_(d) { return String(d).replace(/-/g, ''); }
/**
 * The records of one salary file, as rows of fields (the page writes them as CSV or Excel). Header and trailer carry the
 * control totals banks check (record count and total). Every layout is a best reading of public samples; confirm it.
 */
function bankLayout_(format, rows, run, valueDate) {
  var f = BANK_FORMATS[format]; if (!f || format === 'generic') return null;
  var b = bankSetup_(), missing = [], code = b.companyCode[format] || '';
  (f.needs || []).forEach(function (k) { if (k === 'companyCode' ? !code : !b[k]) missing.push(k); });
  var total = rows.reduce(function (s, r) { return s + Math.round(Number(r.net) * 100); }, 0), n = rows.length, vd = ymdCompact_(valueDate || today_());
  var amt = function (v) { return (Math.round(Number(v) * 100) / 100).toFixed(2); }, desc = 'SALARY ' + run.month;
  var out = { format: format, name: { ar: f.ar, en: f.en }, verify: true, missing: missing, count: n, total: total / 100, header: [], columns: [], records: [], trailer: [] };
  if (format === 'mudad') {
    out.columns = ['Employee ID / Iqama', 'Employee Name', 'Bank Code', 'IBAN', 'Basic Salary', 'Housing Allowance', 'Other Earnings', 'Deductions', 'Net Salary', 'Payment Description'];
    out.records = rows.map(function (r) { return [r.idNumber, r.name, r.bankCode, r.iban, amt(r.basic), amt(r.housing), amt(r.other), amt(r.deductions), amt(r.net), desc]; });
    out.header = [['Establishment No.', b.molId, 'Month', run.month, 'Employees', String(n), 'Total', amt(total / 100)]];
    out.fileName = 'MUDAD_' + (b.molId || 'EST') + '_' + run.month.replace('-', '');
  } else {
    var head = { alrajhi: ['H', code, b.debitIban, vd, amt(total / 100), String(n), run.ref], snb: ['HDR', code, vd, b.debitIban, String(n), amt(total / 100), 'SAR', run.ref], riyad: ['111', code, b.debitIban, vd, String(n), amt(total / 100), run.ref] }[format];
    out.header = [head];
    out.columns = { alrajhi: ['Type', 'IBAN', 'Name', 'Amount', 'Basic', 'Housing', 'Other', 'Deductions', 'ID / Iqama', 'MOL Establishment', 'Description'],
      snb: ['Type', 'Beneficiary IBAN', 'Beneficiary Name', 'Amount', 'Currency', 'ID / Iqama', 'Basic', 'Housing', 'Other', 'Deductions', 'Reference'],
      riyad: ['Type', 'IBAN', 'Name', 'ID / Iqama', 'Amount', 'Basic', 'Housing', 'Other', 'Deductions', 'Narrative'] }[format];
    out.records = rows.map(function (r) {
      return { alrajhi: ['D', r.iban, r.name, amt(r.net), amt(r.basic), amt(r.housing), amt(r.other), amt(r.deductions), r.idNumber, b.molId, desc],
        snb: ['DTL', r.iban, r.name, amt(r.net), 'SAR', r.idNumber, amt(r.basic), amt(r.housing), amt(r.other), amt(r.deductions), r.payslip],
        riyad: ['112', r.iban, r.name, r.idNumber, amt(r.net), amt(r.basic), amt(r.housing), amt(r.other), amt(r.deductions), desc] }[format];
    });
    out.trailer = [{ alrajhi: ['T', String(n), amt(total / 100)], snb: ['TRL', String(n), amt(total / 100)], riyad: ['999', String(n), amt(total / 100)] }[format]];
    out.fileName = format.toUpperCase() + '_SALARY_' + run.month.replace('-', '') + '_' + vd;
  }
  return out;
}
