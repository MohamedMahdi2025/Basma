// Payroll journal for the ledger (Journal.gs), 2026-10-08. For payroll holders: the balanced entry of each locked run,
// its tracker (generated -> imported in Odoo -> confirmed by a second person), the Odoo import file (CSV and Excel),
// a printable journal voucher, the account mapping, and the identifiers the bank and Mudad salary files need.
// The Odoo layout must be checked with a test import in Odoo before the first live month.
(function(){
'use strict';

Object.assign(T.ar, {
  vwJournal:'قيد الرواتب', jvTitle:'قيد الرواتب للمحاسبة', jvLead:'قيد متوازن لكل مسير معتمد، مؤرخ بآخر يوم في الشهر، جاهز للاستيراد في أودو. يجهزه شخص ويستورده، ويؤكده شخص آخر بعد مطابقته في أودو.',
  jvRuns:'المسيرات المعتمدة', jvMap:'ربط الحسابات', jvBank:'ملفات البنوك ومدد', jvNoRun:'لا يوجد مسير معتمد بعد.', jvDraft:'مسير {m} ({r}) لم يعتمد بعد: يظهر قيده هنا بعد أن يعتمده شخص ثان من الرواتب (الرواتب ← اعتماد الرواتب).', jvDemo:'{n} من المسيرات تجريبية (الشركة التجريبية) ولا تنشئ قيدا محاسبيا ولا ملف بنك أبدا.', gl_per_diem:'بدل الانتداب', jvNoMap:'اربط الحسابات أولا: لا يصدر القيد وفيه بند بلا حساب.',
  jvAccount:'الحساب', jvLabel:'البيان', jvAnalytic:'الحساب التحليلي', jvPartner:'الشريك', jvDebit:'مدين', jvCredit:'دائن', jvTotal:'الإجمالي', jvBalanced:'متوازن', jvUnbalanced:'غير متوازن',
  jvProblems:'مشكلات تمنع التصدير', jvp_unmapped:'بند بلا حساب', jvp_unknown_line:'بند غير معروف في قسيمة', jvp_slip_mismatch:'بنود القسيمة لا تساوي صافيها', jvChanged:'تغير القيد منذ تجهيز الملف (الربط أو القسائم). ألغه وجهزه من جديد.',
  jvGen:'تجهيز القيد', jvImp:'تم الاستيراد في أودو', jvConf:'تأكيد المطابقة (شخص آخر)', jvCancel:'إلغاء القيد', jvOdooRef:'رقم القيد في أودو', jvNoteReq:'السبب (مطلوب)',
  jvs_generated:'مجهز', jvs_imported:'مستورد', jvs_confirmed:'مؤكد', jvs_cancelled:'ملغى', jvNone:'لم يجهز بعد', jvCsv:'ملف أودو CSV', jvXlsx:'Excel', jvPrint:'طباعة سند القيد',
  jvVerify:'تحقق من تنسيق الاستيراد بقيد تجريبي في أودو قبل أول شهر فعلي.', jvJournal:'رمز اليومية في أودو', jvNetByEmp:'صافي الرواتب سطر لكل موظف (شريك)', jvEos:'إضافة مخصص نهاية الخدمة إذا ربط حساباه',
  jvAllowances:'البدلات الأخرى', jvDepts:'الحساب التحليلي لكل إدارة', jvSave:'حفظ الربط', jvSaved:'تم الحفظ', jvStep:'تم', jvVoucher:'سند قيد رواتب', jvVoucherKind:'قيد يومية',
  jvSignPrep:'أعده', jvSignImp:'استورده', jvSignConf:'أكده',
  gl_basic:'الراتب الأساسي', gl_housing:'بدل السكن', gl_transport:'بدل النقل', gl_allowance:'البدلات الأخرى (افتراضي)', gl_overtime:'العمل الإضافي', gl_bonus:'المكافآت', gl_commission:'العمولات',
  gl_other_earning:'استحقاقات أخرى', gl_reimbursement:'تعويض المصروفات', gl_gosi_expense:'مصروف التأمينات (حصة الشركة)', gl_pay_reduction:'حسم من الأجر (غياب وإجازات بدون أجر)',
  gl_gosi_payable:'التأمينات المستحقة', gl_net_payable:'رواتب مستحقة الدفع', gl_advances:'سلف الموظفين', gl_fines:'الجزاءات', gl_other_deductions:'خصومات أخرى', gl_eos_expense:'مصروف نهاية الخدمة', gl_eos_provision:'مخصص نهاية الخدمة',
  bkLead:'معرفات تحتاجها ملفات الرواتب لكل بنك ولمنصة مدد. اختر التنسيق من صفحة ملف حماية الأجور. كل تنسيق قراءة لعينات عامة: طابقه مع البنك قبل أول استخدام.',
  bkMol:'رقم المنشأة في وزارة الموارد البشرية', bkIban:'آيبان حساب الشركة المدين', bkCode:'رمز الشركة لدى', bkSave:'حفظ', bkFormat:'تنسيق الملف', bkValue:'تاريخ القيمة', bkMissing:'ينقص لهذا التنسيق',
  bkDownload:'تنزيل ملف البنك', bkVerify:'تحقق من التنسيق مع البنك أو مدد قبل أول رفع.',
  e_journal_unmapped:'بنود بلا حساب: أكمل الربط أولا.', e_journal_unbalanced:'القيد غير متوازن أو فيه مشكلات.', e_journal_changed:'تغير القيد منذ تجهيزه. ألغه وجهزه من جديد.', e_bad_iban:'الآيبان غير صحيح.'
});
Object.assign(T.en, {
  vwJournal:'Payroll journal', jvTitle:'Payroll journal for accounting', jvLead:'A balanced entry for each approved run, dated the month\'s last day, ready to import in Odoo. One person generates and imports it; another confirms it after checking it in Odoo.',
  jvRuns:'Approved runs', jvMap:'Account mapping', jvBank:'Bank and Mudad files', jvNoRun:'No approved run yet.', jvDraft:'The {m} run ({r}) is not approved yet: its journal shows here once a second payroll holder approves it (Pay → Payroll approval).', jvDemo:'{n} run(s) are demo runs (the demo company) and never produce a ledger entry or a bank file.', gl_per_diem:'Travel per diem', jvNoMap:'Map the accounts first: no entry is exported with an unmapped line.',
  jvAccount:'Account', jvLabel:'Label', jvAnalytic:'Analytic', jvPartner:'Partner', jvDebit:'Debit', jvCredit:'Credit', jvTotal:'Total', jvBalanced:'Balanced', jvUnbalanced:'Not balanced',
  jvProblems:'Problems blocking export', jvp_unmapped:'Line without an account', jvp_unknown_line:'Unknown payslip line', jvp_slip_mismatch:'Payslip lines do not add up to its net', jvChanged:'The entry changed since the file was made (mapping or payslips). Cancel it and generate again.',
  jvGen:'Generate entry', jvImp:'Imported in Odoo', jvConf:'Confirm match (another person)', jvCancel:'Cancel entry', jvOdooRef:'Odoo entry number', jvNoteReq:'Reason (required)',
  jvs_generated:'Generated', jvs_imported:'Imported', jvs_confirmed:'Confirmed', jvs_cancelled:'Cancelled', jvNone:'Not generated yet', jvCsv:'Odoo CSV file', jvXlsx:'Excel', jvPrint:'Print journal voucher',
  jvVerify:'Check the import layout with a test entry in Odoo before the first live month.', jvJournal:'Odoo journal code', jvNetByEmp:'Net pay as one line per employee (partner)', jvEos:'Add the end-of-service provision when both accounts are mapped',
  jvAllowances:'Other allowances', jvDepts:'Analytic account per department', jvSave:'Save mapping', jvSaved:'Saved', jvStep:'Done', jvVoucher:'Payroll journal voucher', jvVoucherKind:'Journal entry',
  jvSignPrep:'Prepared by', jvSignImp:'Imported by', jvSignConf:'Confirmed by',
  gl_basic:'Basic salary', gl_housing:'Housing allowance', gl_transport:'Transport allowance', gl_allowance:'Other allowances (default)', gl_overtime:'Overtime', gl_bonus:'Bonuses', gl_commission:'Commissions',
  gl_other_earning:'Other earnings', gl_reimbursement:'Expense reimbursements', gl_gosi_expense:'GOSI expense (employer share)', gl_pay_reduction:'Pay reductions (absence, unpaid leave)',
  gl_gosi_payable:'GOSI payable', gl_net_payable:'Salaries payable', gl_advances:'Employee advances', gl_fines:'Fines', gl_other_deductions:'Other deductions', gl_eos_expense:'End-of-service expense', gl_eos_provision:'End-of-service provision',
  bkLead:'Identifiers the salary files need for each bank and for Mudad. Pick the layout on the WPS file page. Each layout is a reading of public samples: match it with the bank before first use.',
  bkMol:'Establishment number (HRSD)', bkIban:'Company debit account IBAN', bkCode:'Company code at', bkSave:'Save', bkFormat:'File layout', bkValue:'Value date', bkMissing:'Missing for this layout',
  bkDownload:'Download bank file', bkVerify:'Check the layout with the bank or Mudad before the first upload.',
  e_journal_unmapped:'Lines without an account: complete the mapping first.', e_journal_unbalanced:'The entry is not balanced or has problems.', e_journal_changed:'The entry changed since it was generated. Cancel it and generate again.', e_bad_iban:'Invalid IBAN.'
});

var css = '.yc-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 12px}.yc-step{padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--card);font-size:13px}' +
  '.yc-step b{display:flex;gap:8px;align-items:center;font-weight:500}.yc-step.done{border-color:var(--ok);background:var(--ok-bg)}.yc-step small{display:block;color:var(--ink-2);margin-top:3px}@media (max-width:720px){.yc-steps{grid-template-columns:1fr}}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

var uid = 0;
function fmt(d){ return d ? new Date(String(d).slice(0, 10) + 'T12:00:00Z').toLocaleDateString(LOCALE(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''; }
function monthName(m){ return m ? new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1, 15)).toLocaleDateString(LOCALE(), { month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''; }
function sar(){ var v = t('mfSar'); return v === 'mfSar' ? (S.lang === 'en' ? 'SAR' : 'ر.س') : v; }
function n2(n){ return Number(n || 0).toLocaleString(LOCALE(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function money(n){ return '<span class="num">' + n2(n) + '</span> ' + sar(); }
function sep(){ return ' · '; }
function busy(el){ el.innerHTML = '<span class="sk" style="width:40%"></span><span class="sk"></span><span class="sk" style="width:70%"></span>'; }
function bad(code){ return '<p class="hr-bad" role="alert">' + esc(errText(code)) + '</p>'; }
function chip(label, cls){ return '<span class="chip' + (cls ? ' ' + cls : '') + '">' + label + '</span>'; }
function empty(icon, text){ return '<div class="empty">' + ph(icon) + '<b>' + text + '</b></div>'; }
function fld(label, control){ var id = 'jvf' + (++uid); return '<div class="field"><label for="' + id + '">' + label + '</label>' + control.replace(/^<(input|select|textarea)/, '<$1 id="' + id + '"') + '</div>'; }
function refreshTasks(){ if (typeof loadTasks === 'function') loadTasks(); }
function glLabel(k){ return k.indexOf('allowance:') === 0 ? k.slice(10) : t('gl_' + k); }
function lineLabel(l){ return glLabel(l.labelKey || l.key) + (l.dept ? ' - ' + l.dept : ''); }
var JS_CLS = { generated: 'late', imported: 'late', confirmed: 'in', cancelled: 'off' };

function section(body){
  var tab = S.jvTab || 'runs';
  body.innerHTML = '<div class="hr-h"><h2>' + t('jvTitle') + '</h2></div><p class="hr-hint" style="margin:-4px 0 12px">' + t('jvLead') + '</p>' +
    '<div class="op-tabs" role="tablist">' + [['runs', 'notebook', 'jvRuns'], ['map', 'tree-structure', 'jvMap'], ['bank', 'bank', 'jvBank']].map(function(x){ return '<button type="button" role="tab" data-tab="' + x[0] + '" aria-selected="' + (tab === x[0]) + '">' + ph(x[1]) + t(x[2]) + '</button>'; }).join('') + '</div><div id="jvB"></div>';
  $$('[data-tab]', body).forEach(function(b){ b.onclick = function(){ S.jvTab = b.dataset.tab; section(body); }; });
  var el = $('#jvB', body);
  if (tab === 'map') return mapping(el);
  if (tab === 'bank') return bank(el);
  runs(el);
}
function runs(el){
  busy(el);
  api('journalList', {}, true).then(function(r){
    if (!el.isConnected) return;
    if (!r.ok) return el.innerHTML = bad(r.error);
    // say why nothing is here: a draft waiting for its second approval, or only demo runs (never in the ledger)
    var why = (r.drafts || []).map(function(x){ return '<p class="notice">' + ph('hourglass') + ' ' + t('jvDraft').replace('{m}', esc(monthName(x.month))).replace('{r}', esc(x.ref)) + '</p>'; }).join('') +
      ((r.demo || []).length ? '<p class="notice">' + ph('flask') + ' ' + t('jvDemo').replace('{n}', r.demo.length) + '</p>' : '');
    if (!r.runs.length) return el.innerHTML = empty('notebook', t('jvNoRun')) + why;
    var cur = S.jvRun && r.runs.some(function(x){ return x.id === S.jvRun; }) ? S.jvRun : r.runs[0].id;
    el.innerHTML = why + (r.mapped ? '' : '<p class="notice">' + t('jvNoMap') + '</p>') + '<div class="toolbar"><select id="jvSel" aria-label="' + t('jvRuns') + '">' + r.runs.map(function(x){ return '<option value="' + esc(x.id) + '"' + (x.id === cur ? ' selected' : '') + '>' + esc(monthName(x.month) + ' · ' + x.ref) + (x.journal ? ' · ' + t('jvs_' + x.journal.status) : '') + '</option>'; }).join('') + '</select></div><div id="jvR"></div>';
    $('#jvSel', el).onchange = function(){ S.jvRun = this.value; runs(el); };
    entry($('#jvR', el), cur, function(){ runs(el); });
  });
}
function entry(box, runId, again){
  busy(box);
  api('journalBuild', { id: runId }, true).then(function(r){
    if (!box.isConnected) return;
    if (!r.ok) return box.innerHTML = bad(r.error);
    var e = r.entry, g = r.log, st = g ? g.status : '';
    var step = function(icon, title, done, who, act){ return '<div class="yc-step' + (done ? ' done' : '') + '"><b>' + ph(done ? 'check-circle' : icon, done ? 'fill' : '') + title + '</b><small>' + (who || '') + '</small>' + (act || '') + '</div>'; };
    var h = '<p>' + chip(e.balanced ? t('jvBalanced') : t('jvUnbalanced'), e.balanced ? 'in' : 'absent') + ' ' + t('jvDebit') + ' ' + money(e.debit) + sep() + t('jvCredit') + ' ' + money(e.credit) + sep() + '<bdi>' + esc(e.journal) + '</bdi>' + sep() + fmt(e.date) + sep() + '<bdi>' + esc(e.ref) + '</bdi></p>';
    if (r.changed) h += '<p class="notice">' + t('jvChanged') + '</p>';
    if (e.problems.length) h += '<h4 class="hr-sub">' + t('jvProblems') + '</h4><ul>' + e.problems.map(function(p){ return '<li>' + t('jvp_' + p.code) + (p.key ? ': ' + esc(glLabel(p.key)) : '') + (p.line ? ': ' + esc(p.line) : '') + (p.payslip ? ' <bdi>' + esc(p.payslip) + '</bdi>' : '') + '</li>'; }).join('') + '</ul>';
    h += '<div class="yc-steps">' +
      step('file-plus', t('jvGen'), !!g, g ? esc(g.generatedBy) + sep() + fmt(g.generatedAt) + sep() + '<bdi>' + esc(g.ref) + '</bdi>' : '', !g ? '<div class="btnrow" style="margin-top:6px"><button type="button" class="btn btn-dark btn-sm" data-st="generated"' + (e.balanced && !e.problems.length ? '' : ' disabled') + '>' + t('jvGen') + '</button></div>' : '') +
      step('upload-simple', t('jvImp'), st === 'imported' || st === 'confirmed', g && g.importedAt ? esc(g.importedBy) + sep() + fmt(g.importedAt) + sep() + '<bdi>' + esc(g.odooRef) + '</bdi>' : '',
        st === 'generated' ? '<form class="form" id="jvImpF" style="gap:8px;margin-top:6px"><input name="ref" required maxlength="60" dir="ltr" aria-label="' + t('jvOdooRef') + '" placeholder="MISC/..."><button class="btn btn-dark btn-sm" type="submit">' + t('jvImp') + '</button></form>' : '') +
      step('seal-check', t('jvConf'), st === 'confirmed', g && g.confirmedAt ? esc(g.confirmedBy) + sep() + fmt(g.confirmedAt) : '', st === 'imported' && g.canConfirm ? '<div class="btnrow" style="margin-top:6px"><button type="button" class="btn btn-dark btn-sm" data-st="confirmed">' + t('jvConf') + '</button></div>' : '') + '</div>';
    h += '<div class="btnrow" style="margin:0 0 8px"><button type="button" class="btn btn-line btn-sm" id="jvCsv"' + (e.problems.length ? ' disabled' : '') + '>' + ph('file-csv') + t('jvCsv') + '</button><button type="button" class="btn btn-line btn-sm" id="jvXl">' + ph('microsoft-excel-logo') + t('jvXlsx') + '</button>' +
      '<button type="button" class="btn btn-line btn-sm" id="jvPr">' + ph('printer') + t('jvPrint') + '</button>' + (g && st !== 'confirmed' ? '<button type="button" class="btn btn-line btn-sm" id="jvCx">' + t('jvCancel') + '</button>' : '') + '</div><p class="hr-hint">' + ph('info') + ' ' + t('jvVerify') + '</p><p class="hr-bad" id="jvE" role="alert"></p>';
    h += '<div class="tblwrap"><table class="tbl"><thead><tr><th>' + t('jvAccount') + '</th><th>' + t('jvLabel') + '</th><th>' + t('jvAnalytic') + '</th><th>' + t('jvPartner') + '</th><th>' + t('jvDebit') + '</th><th>' + t('jvCredit') + '</th></tr></thead><tbody>' +
      e.lines.map(function(l){ return '<tr><td><bdi>' + esc(l.account || '?') + '</bdi></td><td>' + esc(lineLabel(l)) + '</td><td><bdi>' + esc(l.analytic) + '</bdi></td><td>' + esc(l.partner) + '</td><td class="num">' + (l.debit ? n2(l.debit) : '') + '</td><td class="num">' + (l.credit ? n2(l.credit) : '') + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><td colspan="4">' + t('jvTotal') + '</td><td class="num">' + n2(e.debit) + '</td><td class="num">' + n2(e.credit) + '</td></tr></tfoot></table></div>';
    box.innerHTML = h;
    var er = $('#jvE', box), done = function(x){ if (!x.ok) return er.textContent = errText(x.error); toast(t('jvStep')); refreshTasks(); again(); };
    $$('[data-st]', box).forEach(function(b){ b.onclick = function(){ b.disabled = true; api('journalStep', { id: runId, step: b.dataset.st }).then(function(x){ b.disabled = false; done(x); }); }; });
    var fi = $('#jvImpF', box); if (fi) fi.onsubmit = function(ev){ ev.preventDefault(); api('journalStep', { id: runId, step: 'imported', odooRef: this.elements.ref.value.trim() }).then(done); };
    var cx = $('#jvCx', box); if (cx) cx.onclick = function(){
      var d = drawer('<h3>' + t('jvCancel') + '</h3><form class="form" id="jcF">' + fld(t('jvNoteReq'), '<input name="n" maxlength="300" required>') + '<p class="hr-bad" id="jcE"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + t('jvCancel') + '</button></div></form>');
      $('#jcF', d).onsubmit = function(ev){ ev.preventDefault(); api('journalStep', { id: runId, step: 'cancelled', note: this.elements.n.value.trim() }).then(function(x){ if (!x.ok) return $('#jcE', d).textContent = errText(x.error); d.remove(); done(x); }); };
    };
    $('#jvCsv', box).onclick = function(){ csv(e); };
    $('#jvXl', box).onclick = function(){ xlsx(e); };
    $('#jvPr', box).onclick = function(){ voucher(e, g); };
  });
}
function analytic(code){ if (!code) return ''; var o = {}; o[code] = 100; return JSON.stringify(o); }
/** The Odoo journal-entry import: header fields on the first row, one row per line (UTF-8 with BOM). */
function csv(e){
  var q = function(v){ v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  var rows = [['journal_id', 'date', 'ref', 'line_ids/account_id', 'line_ids/partner_id', 'line_ids/name', 'line_ids/debit', 'line_ids/credit', 'line_ids/analytic_distribution']];
  e.lines.forEach(function(l, i){ rows.push([i ? '' : e.journal, i ? '' : e.date, i ? '' : e.ref, l.account, l.partner, lineLabel(l), l.debit ? l.debit.toFixed(2) : '0.00', l.credit ? l.credit.toFixed(2) : '0.00', analytic(l.analytic)]); });
  var blob = new Blob(['﻿' + rows.map(function(r){ return r.map(q).join(','); }).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ODOO_' + e.ref + '_' + e.month + '.csv'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
function xlsx(e){
  loadScript('js/xl.js').then(function(){
    var en = S.lang === 'en', title = t('jvVoucher') + ' ' + e.ref;
    return XL.download({ fileName: 'JOURNAL_' + e.ref + '_' + e.month, title: title, lang: en ? 'en' : 'ar', company: coName(), by: S.me.name, logo: logoInk(), ref: e.ref, filters: [[t('jvJournal'), e.journal], [en ? 'Date' : 'التاريخ', e.date]],
      sheets: [{ name: t('jvTitle'), title: title, columns: [{ key: 'account', label: t('jvAccount'), type: 'text' }, { key: 'label', label: t('jvLabel'), type: 'text' }, { key: 'analytic', label: t('jvAnalytic'), type: 'text' }, { key: 'partner', label: t('jvPartner'), type: 'text' },
        { key: 'debit', label: t('jvDebit'), type: 'money', sum: true }, { key: 'credit', label: t('jvCredit'), type: 'money', sum: true }],
        rows: e.lines.map(function(l){ return { account: l.account, label: lineLabel(l), analytic: l.analytic, partner: l.partner, debit: l.debit, credit: l.credit }; }) }] });
  }).then(function(){ toast(t('v2Exported')); }, function(){ toast(errText('network')); });
}
function voucher(e, g){
  if (!window.Doc) return loadScript('js/doc.js').then(function(){ voucher(e, g); });
  var en = S.lang === 'en', D = Doc, L = en ? 'en' : 'ar';
  var body = '<section><dl class="grid c4">' + [[t('jvJournal'), e.journal], [en ? 'Date' : 'التاريخ', e.date], [en ? 'Payroll run' : 'المسير', e.ref], [t('jvOdooRef'), g ? g.odooRef : '']]
      .map(function(r){ return '<div><dt>' + D.esc(r[0]) + '</dt><dd>' + D.esc(r[1] || '-') + '</dd></div>'; }).join('') + '</dl></section>' +
    '<section><table class="tb"><thead><tr><th>' + D.esc(t('jvAccount')) + '</th><th>' + D.esc(t('jvLabel')) + '</th><th>' + D.esc(t('jvAnalytic')) + '</th><th>' + D.esc(t('jvPartner')) + '</th><th class="n">' + D.esc(t('jvDebit')) + '</th><th class="n">' + D.esc(t('jvCredit')) + '</th></tr></thead><tbody>' +
    e.lines.map(function(l){ return '<tr><td class="num">' + D.esc(l.account) + '</td><td>' + D.esc(lineLabel(l)) + '</td><td>' + D.esc(l.analytic) + '</td><td>' + D.esc(l.partner) + '</td><td class="n num">' + (l.debit ? D.money(l.debit, L) : '') + '</td><td class="n num">' + (l.credit ? D.money(l.credit, L) : '') + '</td></tr>'; }).join('') +
    '</tbody><tfoot><tr><td colspan="4">' + D.esc(t('jvTotal')) + '</td><td class="n num">' + D.money(e.debit, L) + '</td><td class="n num">' + D.money(e.credit, L) + '</td></tr></tfoot></table><p class="note">' + D.esc(D.words(e.debit, L)) + '</p></section>';
  D.open({ lang: L, kind: t('jvVoucherKind'), title: t('jvVoucher'), ref: g ? g.ref : e.ref, body: body, qr: (g ? g.ref : e.ref) + '|' + e.hash, by: S.me && S.me.name,
    signatures: [t('jvSignPrep') + (g && g.generatedBy ? ': ' + D.esc(g.generatedBy) : ''), t('jvSignImp') + (g && g.importedBy ? ': ' + D.esc(g.importedBy) : ''), t('jvSignConf') + (g && g.confirmedBy ? ': ' + D.esc(g.confirmedBy) : '')] });
}
function mapping(el){
  busy(el);
  api('journalMapGet', {}, true).then(function(r){
    if (!el.isConnected) return;
    if (!r.ok) return el.innerHTML = bad(r.error);
    var m = r.map, acc = m.accounts || {};
    el.innerHTML = '<form class="form op-box" id="jmF">' + fld(t('jvJournal'), '<input name="journal" dir="ltr" maxlength="64" value="' + esc(m.journal) + '" placeholder="SAL">') +
      '<div class="two">' + r.keys.map(function(k){ return fld(t('gl_' + k), '<input data-acc="' + k + '" dir="ltr" maxlength="64" value="' + esc(acc[k] || '') + '">'); }).join('') + '</div>' +
      (r.allowances.length ? '<h4 class="hr-sub">' + t('jvAllowances') + '</h4><div class="two">' + r.allowances.map(function(a){ return fld(esc(a), '<input data-acc="allowance:' + esc(a) + '" dir="ltr" maxlength="64" value="' + esc(acc['allowance:' + a] || '') + '">'); }).join('') + '</div>' : '') +
      '<h4 class="hr-sub">' + t('jvDepts') + '</h4><div class="two">' + r.departments.map(function(d){ return fld(esc(S.lang === 'en' && d.nameEn ? d.nameEn : d.nameAr), '<input data-an="' + esc(d.id) + '" dir="ltr" maxlength="64" value="' + esc((m.analytic || {})[d.id] || '') + '" placeholder="' + esc(d.costCenter || '') + '">'); }).join('') + '</div>' +
      '<div class="checks"><label><input type="checkbox" name="nbe"' + (m.netByEmployee ? ' checked' : '') + '>' + t('jvNetByEmp') + '</label><label><input type="checkbox" name="eos"' + (m.includeEos ? ' checked' : '') + '>' + t('jvEos') + '</label></div>' +
      '<p class="hr-bad" id="jmE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit"' + (r.canEdit ? '' : ' disabled') + '>' + t('jvSave') + '</button></div></form>';
    $('#jmF', el).onsubmit = function(ev){
      ev.preventDefault(); var f = this, b = f.querySelector('[type=submit]'), out = { journal: f.elements.journal.value.trim(), accounts: {}, analytic: {}, netByEmployee: f.elements.nbe.checked, includeEos: f.elements.eos.checked };
      $$('[data-acc]', f).forEach(function(x){ out.accounts[x.dataset.acc] = x.value.trim(); });
      $$('[data-an]', f).forEach(function(x){ out.analytic[x.dataset.an] = x.value.trim(); });
      b.disabled = true;
      api('journalMapSave', { map: out }).then(function(x){ b.disabled = false; if (!x.ok) return $('#jmE', el).textContent = errText(x.error); toast(t('jvSaved')); });
    };
  });
}
function bank(el){
  busy(el);
  api('journalMapGet', {}, true).then(function(r){
    if (!el.isConnected) return;
    if (!r.ok) return el.innerHTML = bad(r.error);
    if (!r.canBank) return el.innerHTML = bad('forbidden');
    var b = r.bank || { companyCode: {} };
    el.innerHTML = '<p class="hr-hint">' + t('bkLead') + '</p><form class="form op-box" id="bkF"><div class="two">' + fld(t('bkMol'), '<input name="molId" dir="ltr" maxlength="20" value="' + esc(b.molId) + '">') + fld(t('bkIban'), '<input name="debitIban" dir="ltr" maxlength="34" value="' + esc(b.debitIban) + '">') + '</div>' +
      '<div class="two">' + [['alrajhi', S.lang === 'en' ? 'Al Rajhi Bank' : 'مصرف الراجحي'], ['snb', S.lang === 'en' ? 'Saudi National Bank' : 'البنك الأهلي السعودي'], ['riyad', S.lang === 'en' ? 'Riyad Bank' : 'بنك الرياض']].map(function(k){ return fld(t('bkCode') + ' ' + k[1], '<input data-cc="' + k[0] + '" dir="ltr" maxlength="20" value="' + esc((b.companyCode || {})[k[0]] || '') + '">'); }).join('') + '</div>' +
      '<p class="hr-bad" id="bkE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit"' + (r.canBank ? '' : ' disabled') + '>' + t('bkSave') + '</button></div></form>';
    $('#bkF', el).onsubmit = function(ev){
      ev.preventDefault(); var f = this, bt = f.querySelector('[type=submit]'), cc = {};
      $$('[data-cc]', f).forEach(function(x){ cc[x.dataset.cc] = x.value.trim(); });
      bt.disabled = true;
      api('bankSetupSave', { setup: { molId: f.elements.molId.value.trim(), debitIban: f.elements.debitIban.value.trim(), companyCode: cc } }).then(function(x){ bt.disabled = false; if (!x.ok) return $('#bkE', el).textContent = errText(x.error); toast(t('jvSaved')); });
    };
  });
}
/** A bank or Mudad layout from wpsFile as CSV: header rows, column titles, records, trailer (compliance.js uses it). */
function bankFile(layout){
  var q = function(v){ v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  var rows = [].concat(layout.header || [], [layout.columns || []], layout.records || [], layout.trailer || []);
  var blob = new Blob(['﻿' + rows.map(function(r){ return r.map(q).join(','); }).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (layout.fileName || 'SALARY') + '.csv'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}

window.Journal = { section: section, bankFile: bankFile };
})();
