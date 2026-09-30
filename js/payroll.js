// Payroll (Phase 3): the HR console section, and the payslip shared with "ملفي".
// Amounts come from the server (Payroll.gs); this file only shows, collects and prints.
(function(){
'use strict';

var L = {
  ar: { basic:'الراتب الأساسي', housing:'بدل السكن', transport:'بدل النقل', allowance:'بدل', overtime:'عمل إضافي', bonus:'مكافأة', commission:'عمولة', other_earning:'استحقاق آخر',
    unpaid_leave:'إجازة بدون راتب', sick_75:'إجازة مرضية بثلاثة أرباع الأجر', sick_unpaid:'إجازة مرضية بدون أجر', absence:'غياب', late:'دقائق التأخير',
    gosi:'التأمينات الاجتماعية', advance:'قسط سلفة', fine:'جزاء', other_deduction:'خصم آخر', overtime_hours:'ساعات عمل إضافي' },
  en: { basic:'Basic salary', housing:'Housing allowance', transport:'Transport allowance', allowance:'Allowance', overtime:'Overtime', bonus:'Bonus', commission:'Commission', other_earning:'Other earning',
    unpaid_leave:'Unpaid leave', sick_75:'Sick leave at 75%', sick_unpaid:'Unpaid sick leave', absence:'Absence', late:'Minutes late',
    gosi:'GOSI (employee share)', advance:'Advance instalment', fine:'Fine', other_deduction:'Other deduction', overtime_hours:'Overtime hours' }
};
Object.assign(T.ar, {
  pdTitle:'الرواتب في لمحة', pdLastNet:'صافي آخر مسير', pdDrafts:'مسيرات بانتظار الاعتماد', pdDraftsNote:'يعتمدها شخص غير الذي أعدها', pdTrend:'صافي الرواتب شهرا بشهر',
  pdRunTitle:'تحليل المسير', pdEarn:'مكونات الإجمالي', pdDed:'الخصومات', pdDept:'الصافي حسب الإدارة', pdWarn:'قسائم عليها ملاحظات',
  prTitle:'الرواتب', prMine:'رواتبي', prMineEmpty:'تظهر هنا قسيمة كل شهر بعد اعتماد مسير الرواتب.', prOpen:'عرض القسيمة', prPrint:'طباعة القسيمة',
  prRuns:'مسيرات الرواتب', prNew:'إعداد مسير شهر', prMonth:'الشهر', prCreate:'إعداد المسير', prEmpty:'لا توجد مسيرات بعد. ابدأ بإعداد مسير الشهر الماضي.',
  pr_draft:'مسودة', pr_locked:'معتمد ومقفل', prHead:'الموظفون', prGross:'الإجمالي', prDed:'الاستقطاعات', prNet:'الصافي', prGosiEr:'تأمينات على الشركة', prWarn:'ملاحظات',
  prPrepared:'أعده', prApprovedBy:'اعتمده', prRecalc:'إعادة الحساب', prApprove:'اعتماد وقفل المسير', prDelete:'حذف المسودة', prExport:'ملف البنك وحماية الأجور (Excel)',
  prEmail:'إرسال القسائم بالبريد', prEmailed:'أرسلت القسائم', prEmailNo:'البريد غير مفعل بعد. يحتاج موافقة مسؤول Microsoft 365 على صلاحية الإرسال (Mail.Send)، ثم نربط الحساب.',
  prApproveHint:'يعتمده شخص لديه صلاحية الرواتب غير الذي أعده. بعد الاعتماد تظهر القسائم للموظفين ولا يمكن تعديل المسير.',
  prAdj:'إضافات وخصومات هذا الشهر', prAdjAdd:'إضافة بند', prAdjEmp:'الموظف', prAdjCode:'البند', prAdjAmount:'المبلغ أو الساعات', prAdjReason:'السبب', prAdjNone:'لا بنود.',
  prDays:'أيام مدفوعة', prAbsent:'أيام غياب', prLeaveBal:'رصيد الإجازة', prEarnings:'الاستحقاقات', prDeductions:'الاستقطاعات', prRef:'المرجع', prIban:'الحساب',
  prEos:'مكافأة نهاية الخدمة', prEosEmp:'الموظف', prEosLast:'آخر يوم عمل', prEosReason:'سبب انتهاء العلاقة', prEosCalc:'احسب',
  eos_resignation:'استقالة', eos_termination:'إنهاء من الشركة', eos_contract_end:'انتهاء العقد', eos_art87:'حالات المادة 87 (مكافأة كاملة)', eos_art80:'فصل حسب المادة 80 (بلا مكافأة)',
  eos_art81:'ترك العمل لإخلال صاحب العمل (المادة 81)', eos_art87_force_majeure:'قوة قاهرة (المادة 87)', eos_art87_marriage:'موظفة خلال 6 أشهر من الزواج (المادة 87)',
  eos_art87_childbirth:'موظفة خلال 3 أشهر من الولادة (المادة 87)', prEosPrint:'طباعة المخالصة', prEosService:'مدة الخدمة', prEosPeriod:'من - إلى', prEosExcluded:'إجازة بدون راتب لا تحتسب',
  prEosBasisT:'الأجر الإجمالي', prEosBasisBH:'الأساسي والسكن', prEosFirst5:'السنوات الخمس الأولى: نصف شهر عن كل سنة', prEosAfter5:'ما بعدها: شهر عن كل سنة',
  prEosSettlement:'المخالصة النهائية', prEosLastMonth:'أيام الشهر الأخير', prEosLastLocked:'مدفوعة في مسير معتمد', prEosAdvances:'سلف غير مسددة', prEosNet:'صافي المستحق',
  prEosDue:'يدفع في موعد أقصاه',
  prEosYears:'مدة الخدمة', prEosWage:'الأجر المعتمد للحساب', prEosFull:'المكافأة الكاملة', prEosFactor:'النسبة المستحقة', prEosAward:'المكافأة المستحقة', prEosLeave:'بدل رصيد الإجازة', prEosTotal:'الإجمالي المستحق', prYears:'سنة',
  pw_no_iban:'لا يوجد آيبان', pw_no_package:'لا يوجد راتب معتمد', pw_gosi_cohort_missing:'فئة التأمينات غير محددة', pw_fine_capped:'الجزاء خفض إلى 5 أيام', pw_advance_deferred:'أجل جزء من السلفة (50%)',
  pw_deductions_capped:'خفضت الخصومات إلى نصف الأجر', pw_net_negative:'الصافي سالب', e_run_exists:'يوجد مسير لهذا الشهر.', e_future_month:'لا يمكن إعداد مسير لشهر لم يأت.',
  e_month_locked:'مسير هذا الشهر معتمد ومقفل. أضف البند في الشهر التالي.', e_email_not_configured:'البريد غير مفعل بعد.', e_missing_hire_date:'تاريخ المباشرة غير مسجل.',
  prRecalcDone:'أعيد الحساب', prApproved:'اعتمد المسير وأقفل', prGosiNote:'حصة الشركة في التأمينات'
});
Object.assign(T.en, {
  pdTitle:'Payroll at a glance', pdLastNet:'Last run net', pdDrafts:'Runs awaiting approval', pdDraftsNote:'approved by someone other than the preparer', pdTrend:'Net pay month by month',
  pdRunTitle:'Run analysis', pdEarn:'What the gross is made of', pdDed:'Deductions', pdDept:'Net by department', pdWarn:'Payslips with notes',
  prTitle:'Payroll', prMine:'My payslips', prMineEmpty:'Each month\'s payslip appears here once payroll is approved.', prOpen:'View payslip', prPrint:'Print payslip',
  prRuns:'Payroll runs', prNew:'Prepare a month', prMonth:'Month', prCreate:'Prepare payroll', prEmpty:'No payroll runs yet. Start with last month.',
  pr_draft:'Draft', pr_locked:'Approved and locked', prHead:'Employees', prGross:'Gross', prDed:'Deductions', prNet:'Net', prGosiEr:'Employer GOSI', prWarn:'Notes',
  prPrepared:'Prepared by', prApprovedBy:'Approved by', prRecalc:'Recalculate', prApprove:'Approve and lock', prDelete:'Discard draft', prExport:'Bank and WPS file (Excel)',
  prEmail:'Email payslips', prEmailed:'Payslips emailed', prEmailNo:'Email is not switched on yet. The Microsoft 365 admin must grant Mail.Send, then we connect the account.',
  prApproveHint:'Approved by a payroll person other than the preparer. Once approved, employees see their payslips and the run cannot change.',
  prAdj:'This month\'s additions and deductions', prAdjAdd:'Add line', prAdjEmp:'Employee', prAdjCode:'Item', prAdjAmount:'Amount or hours', prAdjReason:'Reason', prAdjNone:'No lines.',
  prDays:'Paid days', prAbsent:'Absent days', prLeaveBal:'Leave balance', prEarnings:'Earnings', prDeductions:'Deductions', prRef:'Ref', prIban:'Account',
  prEos:'End of service', prEosEmp:'Employee', prEosLast:'Last working day', prEosReason:'How it ends', prEosCalc:'Calculate',
  eos_resignation:'Resignation', eos_termination:'Ended by the company', eos_contract_end:'Contract end', eos_art87:'Article 87 cases (full award)', eos_art80:'Dismissal under Article 80 (no award)',
  eos_art81:'Left for the employer\'s breach (Article 81)', eos_art87_force_majeure:'Force majeure (Article 87)', eos_art87_marriage:'Woman within 6 months of marriage (Article 87)',
  eos_art87_childbirth:'Woman within 3 months of childbirth (Article 87)', prEosPrint:'Print settlement', prEosService:'Service', prEosPeriod:'From - to', prEosExcluded:'Unpaid leave not counted',
  prEosBasisT:'Total wage', prEosBasisBH:'Basic and housing', prEosFirst5:'First five years: half a month per year', prEosAfter5:'After that: a month per year',
  prEosSettlement:'Final settlement', prEosLastMonth:'Final month days', prEosLastLocked:'paid in an approved payroll', prEosAdvances:'Advances still owed', prEosNet:'Net due',
  prEosDue:'Pay no later than',
  prEosYears:'Service', prEosWage:'Wage used', prEosFull:'Full award', prEosFactor:'Share due', prEosAward:'Award due', prEosLeave:'Unused leave pay', prEosTotal:'Total due', prYears:'years',
  pw_no_iban:'No IBAN', pw_no_package:'No approved salary', pw_gosi_cohort_missing:'GOSI group not set', pw_fine_capped:'Fine cut to 5 days', pw_advance_deferred:'Part of the advance deferred (50%)',
  pw_deductions_capped:'Deductions cut to half the wage', pw_net_negative:'Net below zero', e_run_exists:'This month already has a run.', e_future_month:'That month has not come yet.',
  e_month_locked:'This month is approved and locked. Add the line next month.', e_email_not_configured:'Email is not switched on yet.', e_missing_hire_date:'No start date on file.',
  prRecalcDone:'Recalculated', prApproved:'Payroll approved and locked', prGosiNote:'Employer GOSI share'
});

var css = '' +
'.pr-kpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:14px}' +
'.pr-kpis .net{grid-column:1 / -1;background:var(--pine);color:var(--cream);border-radius:var(--r-m);padding:14px 16px}' +
'.pr-kpis .net span{color:#AFC0AD;font-size:12.5px}.pr-kpis .net b{display:block;font-size:30px;font-weight:600}' +
'.pr-slip h4{margin:14px 0 6px;font-size:14px;color:var(--ink-2);font-weight:500}' +
'.pr-slip dl{display:grid;grid-template-columns:1fr auto;margin:0}' +
'.pr-slip dt,.pr-slip dd{padding:7px 0;border-bottom:1px solid var(--line);margin:0}.pr-slip dd{text-align:end;font-variant-numeric:tabular-nums;padding-inline-start:14px}' +
'.pr-slip dt small{display:block;color:var(--ink-2);font-size:12px}' +
'.pr-slip .tot dt,.pr-slip .tot dd{font-weight:600;font-size:16px;border-bottom:0}' +
'.pr-month{display:flex;align-items:center;gap:12px;padding:12px 0;cursor:pointer}.pr-month + .pr-month{border-top:1px solid var(--line)}' +
'.pr-month .main{flex:1}.pr-month .main small{display:block;color:var(--ink-2);font-size:12.5px}' +
'@media (min-width:1024px){.pr-kpis{grid-template-columns:2fr 1fr 1fr 1fr 1fr}.pr-kpis .net{grid-column:auto}}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

function lab(l){ var m = L[S.lang] || L.ar; if (l.code !== 'allowance') return m[l.code] || l.code; var n = String(l.label || ''); return /^(بدل|allowance)/i.test(n) ? n : m.allowance + ' ' + n; }
function money(n){ return Number(n || 0).toLocaleString(LOCALE(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function monthName(m){ return new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1, 15)).toLocaleDateString(LOCALE(), { month: 'long', year: 'numeric' }); }
function lineNote(l){
  var bits = [];
  if (l.days) bits.push(plural(l.days, 'days'));
  if (l.hours) bits.push(l.hours + (S.lang === 'en' ? ' h' : ' ساعة'));
  if (l.minutes) bits.push(l.minutes + ' ' + t('min'));
  if (l.rate) bits.push(l.rate + '%');
  if (l.ref) bits.push(l.ref);
  if (l.label && l.code !== 'allowance') bits.push(l.label);
  return bits.length ? '<small>' + esc(bits.join('، ')) + '</small>' : '';
}
function warnChips(ws){ return (ws || []).filter(function(w, i, a){ return a.indexOf(w) === i; }).map(function(w){ return '<span class="chip ' + (w === 'no_package' || w === 'net_negative' ? 'absent' : 'late') + '">' + t('pw_' + w) + '</span>'; }).join(' '); }

/** The payslip body: used in drawers and on paper. */
function slipHtml(s){
  var e = s.lines.filter(function(l){ return l.kind === 'earning'; }), d = s.lines.filter(function(l){ return l.kind === 'deduction'; });
  var rows = function(ls){ return ls.map(function(l){ return '<dt>' + esc(lab(l)) + lineNote(l) + '</dt><dd>' + money(l.amount) + '</dd>'; }).join(''); };
  return '<div class="pr-slip"><h4>' + t('prEarnings') + '</h4><dl>' + rows(e) + '<dt class="tot" style="font-weight:600">' + t('prGross') + '</dt><dd style="font-weight:600">' + money(s.gross) + '</dd></dl>' +
    '<h4>' + t('prDeductions') + '</h4><dl>' + (d.length ? rows(d) : '<dt>-</dt><dd>0.00</dd>') + '<dt style="font-weight:600">' + t('prDed') + '</dt><dd style="font-weight:600">' + money(s.deductions) + '</dd></dl>' +
    '<dl class="tot" style="margin-top:10px"><dt>' + t('prNet') + '</dt><dd>' + money(s.net) + ' ' + t('mfSar') + '</dd></dl>' +
    '<p class="hr-hint">' + [t('prDays') + ' ' + (s.paidDays || 0), s.absentDays ? t('prAbsent') + ' ' + s.absentDays : '', s.info.leaveBalance != null ? t('prLeaveBal') + ' ' + Number(s.info.leaveBalance).toLocaleString(LOCALE(), { maximumFractionDigits: 1 }) : '',
      s.gosiEmployer ? t('prGosiNote') + ' ' + money(s.gosiEmployer) : ''].filter(Boolean).join('، ') + '</p>' +
    (s.warnings && s.warnings.length ? '<div style="margin-top:6px">' + warnChips(s.warnings) + '</div>' : '') + '</div>';
}

function printSlip(s, who){
  var en = S.lang === 'en', e = s.emp || who || {}, iban = String((s.info && s.info.iban) || '');
  var html = '<!doctype html><html lang="' + (en ? 'en' : 'ar') + '" dir="' + (en ? 'ltr' : 'rtl') + '"><head><meta charset="utf-8"><title>' + esc(s.ref) + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;600&display=swap" rel="stylesheet"><style>' +
    '@page{size:A4;margin:16mm}body{font-family:"Readex Pro",Tahoma,sans-serif;color:#17221A;font-size:13px}header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #4D6D51;padding-bottom:10px}' +
    'header img{height:54px}h1{font-size:19px;margin:14px 0 4px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:4px 18px;margin:10px 0 14px;color:#4A5A4D}' +
    '.pr-slip h4{margin:12px 0 4px;font-size:13px;color:#4A5A4D}.pr-slip dl{display:grid;grid-template-columns:1fr auto;margin:0}.pr-slip dt,.pr-slip dd{padding:5px 0;border-bottom:1px solid #E5E1D6;margin:0}' +
    '.pr-slip dd{text-align:end;font-variant-numeric:tabular-nums}.pr-slip dt small{color:#6B786D;margin-inline-start:6px}.tot dt,.tot dd{font-weight:600;font-size:15px;border:0}.hr-hint{color:#4A5A4D}.chip{display:none}' +
    'footer{margin-top:24px;font-size:11px;color:#8A948B;border-top:1px solid #DAD5C8;padding-top:6px}</style></head><body>' +
    '<header><img src="' + LOGO + '" alt=""><div style="text-align:end;font-size:12px;color:#4A5A4D">' + (en ? 'Best Gas Carrier Co.<br>Payslip' : 'شركة الناقل الأفضل للغاز<br>قسيمة راتب') + '</div></header>' +
    '<h1>' + (en ? 'Payslip for ' : 'قسيمة راتب شهر ') + esc(monthName(s.month)) + '</h1>' +
    '<div class="meta"><span>' + esc(e.name || '') + '</span><span>' + t('mfEmpNo') + ': ' + esc(e.empNo || '') + '</span><span>' + esc(e.title || '') + '</span><span>' + esc(e.department || '') + '</span>' +
    '<span>' + t('prIban') + ': <bdi>' + (iban ? esc(iban.slice(0, 4) + ' •••• ' + iban.slice(-4)) : '-') + '</bdi></span><span>' + t('prRef') + ': <bdi>' + esc(s.ref) + '</bdi></span></div>' +
    slipHtml(s) + '<footer>' + (en ? 'Issued by HR. Questions: contact HR quoting ' : 'صادرة عن إدارة الموارد البشرية. للاستفسار اذكر المرجع ') + '<bdi>' + esc(s.ref) + '</bdi></footer>' +
    '<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>';
  var w = window.open('', '_blank'); if (!w) return toast(t('e_generic'));
  w.document.open(); w.document.write(html); w.document.close();
}

// ---------------- "ملفي": my payslips ----------------
function myCard(el, me){
  apiFresh('mySlips', {}, function(r){
    if (!el.isConnected) return;
    if (!r.ok) { el.remove(); return; }
    el.innerHTML = '<h3>' + ph('money') + t('prMine') + '</h3>' + (r.rows.length ? r.rows.slice(0, 12).map(function(s){
      return '<div class="pr-month" data-slip="' + s.id + '" tabindex="0"><div class="av">' + ph('receipt') + '</div><div class="main"><b>' + esc(monthName(s.month)) + '</b><small><bdi>' + esc(s.ref) + '</bdi></small></div><b class="num">' + money(s.net) + '</b></div>';
    }).join('') : '<p>' + t('prMineEmpty') + '</p>');
    $$('[data-slip]', el).forEach(function(x){ x.onclick = function(){ var s = r.rows.filter(function(y){ return y.id === x.dataset.slip; })[0]; openSlip(s, me); }; });
  });
}
function openSlip(s, who){
  var d = drawer('<h3>' + esc(monthName(s.month)) + '</h3><p class="hr-hint" style="margin-top:-8px"><bdi>' + esc(s.ref) + '</bdi>' + (s.emp ? '، ' + esc(s.emp.name) : '') + '</p>' + slipHtml(s) +
    '<div class="btnrow"><button type="button" class="btn btn-dark btn-sm" id="psPrint">' + ph('printer') + t('prPrint') + '</button></div>');
  $('#psPrint', d).onclick = function(){ printSlip(s, who); };
}

// ---------------- HR console: payroll ----------------
var xlsxP = null;
function xlsx(){ if (window.XLSX) return Promise.resolve(); if (xlsxP) return xlsxP; xlsxP = new Promise(function(res, rej){ var sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; sc.onload = res; sc.onerror = function(){ xlsxP = null; rej(); }; document.head.appendChild(sc); }); return xlsxP; }

function section(body){
  if (S.prRun) return runView(body, S.prRun);
  var last = (function(){ var d = new Date(riyadhToday() + 'T00:00:00Z'); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); })();
  body.innerHTML = '<div class="hr-h"><h2>' + t('prTitle') + '</h2></div>' +
    '<form class="toolbar" id="prNewF"><label class="hr-hint" style="margin:0">' + t('prMonth') + '</label><input type="month" name="month" value="' + last + '" max="' + riyadhToday().slice(0, 7) + '" required>' +
    '<button class="btn btn-dark btn-sm">' + ph('calculator') + t('prCreate') + '</button><span class="err" id="prErr" style="color:var(--red)"></span></form><div id="prList"></div>' +
    '<h3 class="hr-sub">' + t('prEos') + '</h3><div id="prEos"></div>';
  $('#prNewF', body).onsubmit = function(ev){
    ev.preventDefault(); var b = this.querySelector('button'); b.disabled = true;
    api('payrollCreate', { month: this.elements.month.value }).then(function(r){ b.disabled = false; if (!r.ok) { $('#prErr', body).textContent = errText(r.error); return; } S.prRun = r.run.id; section(body); });
  };
  var el = $('#prList', body);
  apiFresh('payrollList', {}, function(r){
    if (!r.ok) return el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>';
    el.innerHTML = (window.Viz && r.rows.length ? listDash(r.rows) : '') + (r.rows.length ? '<div class="list">' + r.rows.map(function(x){
      return '<div class="row click" data-run="' + x.id + '" tabindex="0"><div class="av">' + ph('money') + '</div><div class="main"><b>' + esc(monthName(x.month)) + '</b><small><bdi>' + esc(x.ref) + '</bdi>، ' + plural(x.totals.headcount || 0, 'people') + '</small></div>' +
        '<div class="end"><b class="num">' + money(x.totals.net) + '</b><small><span class="chip ' + (x.status === 'locked' ? 'in' : 'late') + '">' + t('pr_' + x.status) + '</span></small></div></div>';
    }).join('') + '</div>' : '<div class="empty">' + ph('money') + '<b>' + t('prEmpty') + '</b></div>');
    if (window.Viz) Viz.wire(el);
    $$('[data-run]', el).forEach(function(x){ x.onclick = function(){ S.prRun = x.dataset.run; section(body); }; });
  });
  eosBox($('#prEos', body));
}

/** The payroll over time: net and headcount per run, and what changed since the previous one. */
function listDash(rows){
  var V = Viz, asc = rows.slice().sort(function(a, b){ return a.month < b.month ? -1 : 1; }), last = asc[asc.length - 1], prev = asc[asc.length - 2];
  var ch = prev && prev.totals.net ? (last.totals.net - prev.totals.net) / prev.totals.net * 100 : null, drafts = rows.filter(function(x){ return x.status === 'draft'; }).length;
  var pts = asc.slice(-12).map(function(x){ return { label: V.monthShort(x.month), y: x.totals.net, note: plural(x.totals.headcount || 0, 'people') }; });
  return V.panel('payroll', t('pdTitle'), '<div class="db-tiles">' + V.tile(t('pdLastNet'), V.sar(last.totals.net), monthName(last.month), ch, true, true, '%') +
    V.tile(t('prGross'), V.sar(last.totals.gross), '') + V.tile(t('prGosiEr'), V.sar(last.totals.gosiEmployer), '') + V.tile(t('prHead'), V.n1(last.totals.headcount || 0, 0), '') +
    V.tile(t('pdDrafts'), V.n1(drafts, 0), drafts ? t('pdDraftsNote') : '') + '</div>' +
    (pts.length > 1 ? '<div class="db-grid">' + V.card('pn', t('pdTrend'), '', V.lineChart(pts, { fmt: 'sar', aria: t('pdTrend') }), V.tbl(['', t('prNet'), t('prHead')], asc.map(function(x){ return [monthName(x.month), money(x.totals.net), x.totals.headcount]; }))) + '</div>' : ''));
}
var EARN = { basic: 1, housing: 1, transport: 1, allowance: 1, overtime: 1, bonus: 1, commission: 1, other_earning: 1 };
/** One run: what the gross is made of, where the deductions go, and net by department. */
function runDash(r){
  var V = Viz, earn = {}, ded = {}, dept = {}, warn = 0, lab = L[S.lang] || L.ar;
  r.slips.forEach(function(s){
    (s.lines || []).forEach(function(l){ var a = Math.abs(Number(l.amount) || 0); if (!a) return; if (EARN[l.code]) earn[l.code] = (earn[l.code] || 0) + a; else ded[l.code] = (ded[l.code] || 0) + a; });
    var d = s.emp && s.emp.department || '-'; dept[d] = (dept[d] || 0) + s.net;
    if ((s.warnings || []).length) warn++;
  });
  var items = function(m, labels){ return Object.keys(m).sort(function(a, b){ return m[b] - m[a]; }).slice(0, 10).map(function(k){ var lb = labels ? labels[k] || k : k; return { label: lb, value: m[k], text: V.sar(m[k]), tip: lb + ': ' + V.sar(m[k]) }; }); };
  var e = items(earn, lab), d = items(ded, lab), n = items(dept);
  var tb = function(list){ return V.tbl(['', t('mfSar')], list.map(function(i){ return [esc(i.label), money(i.value)]; })); };
  return V.panel('payrun', t('pdRunTitle'), (warn ? '<p class="hr-hint" style="margin:0 0 10px"><span class="db-status">' + ph('warning') + ' ' + t('pdWarn') + ': ' + warn + '</span></p>' : '') +
    '<div class="db-grid three">' + V.card('pe', t('pdEarn'), '', V.hbars(e), tb(e)) + V.card('pdd', t('pdDed'), '', V.hbars(d), tb(d)) + V.card('pdn', t('pdDept'), '', V.hbars(n), tb(n)) + '</div>');
}

function runView(body, id){
  body.innerHTML = '<div id="prRun"></div>';
  var el = $('#prRun', body);
  el.innerHTML = '<div class="list"><div class="row"><div class="main"><span class="sk" style="width:40%"></span><span class="sk"></span></div></div></div>';
  api('payrollGet', { id: id }, true).then(function(r){
    if (!r.ok) { S.prRun = null; return section(body); }
    var run = r.run, tt = run.totals, draft = run.status === 'draft';
    el.innerHTML = '<div class="hr-h"><button type="button" class="iconbtn" id="prBack" aria-label="back">' + (S.lang === 'ar' ? I.chev : I.chevb) + '</button><h2>' + esc(monthName(run.month)) + ' <span class="chip ' + (draft ? 'late' : 'in') + '" style="vertical-align:middle">' + t('pr_' + run.status) + '</span></h2></div>' +
      '<p class="hr-hint" style="margin:-8px 0 12px"><bdi>' + esc(run.ref) + '</bdi>، ' + t('prPrepared') + ' ' + esc(run.preparedByName || '') + (run.approvedByName ? '، ' + t('prApprovedBy') + ' ' + esc(run.approvedByName) : '') + '</p>' +
      '<div class="pr-kpis"><div class="net"><span>' + t('prNet') + '</span><b class="num">' + money(tt.net) + '</b></div><div class="kpi"><span>' + t('prGross') + '</span><b class="num" style="font-size:20px">' + money(tt.gross) + '</b></div>' +
      '<div class="kpi"><span>' + t('prDed') + '</span><b class="num" style="font-size:20px">' + money(tt.deductions) + '</b></div><div class="kpi"><span>' + t('prGosiEr') + '</span><b class="num" style="font-size:20px">' + money(tt.gosiEmployer) + '</b></div>' +
      '<div class="kpi"><span>' + t('prHead') + '</span><b class="num" style="font-size:20px">' + tt.headcount + '</b></div></div>' +
      (window.Viz ? runDash(r) : '') + '<div class="btnrow" style="margin-bottom:12px">' + (draft ? '<button type="button" class="btn btn-line btn-sm" id="prRe">' + ph('arrows-clockwise') + t('prRecalc') + '</button>' + (r.canApprove ? '<button type="button" class="btn btn-dark btn-sm" id="prOk">' + ph('seal-check') + t('prApprove') + '</button>' : '') +
        '<button type="button" class="btn btn-danger btn-sm" id="prDel">' + t('prDelete') + '</button>' : '<button type="button" class="btn btn-dark btn-sm" id="prMail">' + ph('envelope-simple') + t('prEmail') + '</button>') +
      '<button type="button" class="btn btn-line btn-sm" id="prXls">' + ph('microsoft-excel-logo') + t('prExport') + '</button></div>' +
      (draft ? '<p class="hr-hint">' + t('prApproveHint') + '</p>' : '') + '<div class="err" id="prMsg" style="color:var(--red);margin-bottom:8px"></div>' +
      '<div class="tblwrap"><table class="tbl"><thead><tr><th>' + t('hrName') + '</th><th class="hr-amt">' + t('prGross') + '</th><th class="hr-amt">' + t('prDed') + '</th><th class="hr-amt">' + t('prNet') + '</th><th>' + t('prWarn') + '</th></tr></thead><tbody>' +
      r.slips.map(function(s){ return '<tr class="click" data-s="' + s.id + '" tabindex="0"><td><b style="font-weight:500">' + esc(s.emp ? s.emp.name : '') + '</b> <small class="num" style="color:var(--ink-2)">' + esc(s.emp ? s.emp.empNo : '') + '</small></td>' +
        '<td class="hr-amt">' + money(s.gross) + '</td><td class="hr-amt">' + money(s.deductions) + '</td><td class="hr-amt"><b>' + money(s.net) + '</b></td><td>' + warnChips(s.warnings) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<h3 class="hr-sub">' + t('prAdj') + '</h3><div id="prAdj"></div>';
    $('#prBack', el).onclick = function(){ S.prRun = null; section(body); };
    if (window.Viz) Viz.wire(el);
    $$('[data-s]', el).forEach(function(x){ x.onclick = function(){ openSlip(r.slips.filter(function(s){ return s.id === x.dataset.s; })[0]); }; });
    var msg = $('#prMsg', el), act = function(action, done){ return function(){ this.disabled = true; var b = this; api(action, { id: run.id }).then(function(x){ b.disabled = false; if (!x.ok) { msg.textContent = errText(x.error); if (x.error === 'email_not_configured') msg.textContent = t('prEmailNo'); return; } done(x); }); }; };
    if ($('#prRe', el)) $('#prRe', el).onclick = act('payrollRecalc', function(){ toast(t('prRecalcDone')); runView(body, id); });
    if ($('#prOk', el)) $('#prOk', el).onclick = act('payrollApprove', function(){ toast(t('prApproved')); runView(body, id); });
    if ($('#prDel', el)) $('#prDel', el).onclick = act('payrollDelete', function(){ S.prRun = null; section(body); });
    if ($('#prMail', el)) $('#prMail', el).onclick = act('payrollEmail', function(x){ toast(t('prEmailed') + ': ' + x.sent); });
    $('#prXls', el).onclick = function(){ exportXls(run); };
    adjBox($('#prAdj', el), r, draft, function(){ api('payrollRecalc', { id: run.id }).then(function(){ runView(body, id); }); });
  });
}

function adjBox(el, r, draft, changed){
  var names = {}; r.slips.forEach(function(s){ if (s.emp) names[s.emp.id] = s.emp.name; });
  var codes = ['overtime_hours', 'bonus', 'commission', 'other_earning', 'fine', 'other_deduction'];
  el.innerHTML = (r.adjustments.length ? '<div class="list">' + r.adjustments.map(function(a){
    return '<div class="row"><div class="main"><b>' + esc(a.empName) + '، ' + esc((L[S.lang] || L.ar)[a.code] || a.code) + '</b><small><bdi>' + esc(a.ref) + '</bdi>، ' + esc(a.reason) + '</small></div><b class="num">' + (a.code === 'overtime_hours' ? a.amount : money(a.amount)) + '</b>' +
      (draft ? '<button type="button" class="btn btn-line btn-sm" data-adel="' + a.id + '">' + I.x + '</button>' : '') + '</div>';
  }).join('') + '</div>' : '<p class="hr-hint">' + t('prAdjNone') + '</p>') +
    (draft ? '<form class="form" id="adjF" style="margin-top:10px"><div class="two"><div class="field"><label>' + t('prAdjEmp') + '</label><select name="empId" required>' + Object.keys(names).filter(function(k){ return k !== S.me.id; }).map(function(k){ return '<option value="' + k + '">' + esc(names[k]) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>' + t('prAdjCode') + '</label><select name="code">' + codes.map(function(c){ return '<option value="' + c + '">' + esc((L[S.lang] || L.ar)[c]) + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="two"><div class="field"><label>' + t('prAdjAmount') + '</label><input name="amount" type="number" min="0.01" step="0.01" required inputmode="decimal"></div><div class="field"><label>' + t('prAdjReason') + '</label><input name="reason" required maxlength="200"></div></div>' +
      '<div class="err" id="adjErr" style="color:var(--red)"></div><div class="btnrow"><button class="btn btn-dark btn-sm">' + ph('plus') + t('prAdjAdd') + '</button></div></form>' : '');
  $$('[data-adel]', el).forEach(function(b){ b.onclick = function(){ b.disabled = true; api('payrollAdjDelete', { id: b.dataset.adel }).then(function(x){ if (!x.ok) { b.disabled = false; return toast(errText(x.error)); } changed(); }); }; });
  var f = $('#adjF', el);
  if (f) f.onsubmit = function(ev){ ev.preventDefault(); var v = {}; Array.prototype.forEach.call(f.elements, function(x){ if (x.name) v[x.name] = x.value; }); v.month = r.run.month;
    var b = f.querySelector('button'); b.disabled = true;
    api('payrollAdjSave', { adj: v }).then(function(x){ b.disabled = false; if (!x.ok) return $('#adjErr', el).textContent = errText(x.error); changed(); }); };
}

function exportXls(run){
  Promise.all([xlsx(), api('payrollExport', { id: run.id })]).then(function(rs){
    var r = rs[1]; if (!r.ok) return toast(errText(r.error));
    var wb = XLSX.utils.book_new();
    var head = ['Employee No', 'National ID / Iqama', 'Name', 'Bank', 'IBAN', 'Basic', 'Housing', 'Other earnings', 'Deductions', 'Net', 'Payslip'];
    var ws = XLSX.utils.aoa_to_sheet([head].concat(r.rows.map(function(x){ return [x.empNo, x.nationalId, x.name, x.bankName, x.iban, x.basic, x.housing, x.other, x.deductions, x.net, x.ref]; })));
    ws['!cols'] = head.map(function(){ return { wch: 18 }; });
    XLSX.utils.book_append_sheet(wb, ws, 'WPS');
    var gl = [['Department', 'Cost centre', 'Employees', 'Gross (salary expense)', 'Employer GOSI (expense)', 'Employee GOSI (payable)', 'Other deductions', 'Net (payable to staff)']].concat(r.departments.map(function(d){
      return [d.department || '-', d.costCenter || '', d.headcount, d.gross, d.gosiEmployer, d.gosiEmployee, Math.round((d.deductions - d.gosiEmployee) * 100) / 100, d.net]; }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(gl), 'Accounting');
    XLSX.writeFile(wb, 'payroll-' + run.month + '-' + run.ref + '.xlsx');
  }, function(){ toast(t('imLibFail')); });
}

function eosBox(el){
  el.innerHTML = '<form class="form" id="eosF"><div class="two"><div class="field"><label>' + t('prEosEmp') + '</label><select name="empId" id="eosEmp"></select></div>' +
    '<div class="field"><label>' + t('prEosLast') + '</label><input type="date" name="lastDay" value="' + riyadhToday() + '" required></div></div>' +
    '<div class="field"><label>' + t('prEosReason') + '</label><select name="reason">' + ['resignation', 'termination', 'contract_end', 'art81', 'art87_force_majeure', 'art87_marriage', 'art87_childbirth', 'art80'].map(function(x){ return '<option value="' + x + '">' + t('eos_' + x) + '</option>'; }).join('') + '</select></div>' +
    '<div class="btnrow"><button class="btn btn-line btn-sm">' + ph('calculator') + t('prEosCalc') + '</button></div><div id="eosOut"></div></form>';
  apiFresh('hrBootstrap', {}, function(r){
    var sel = $('#eosEmp', el); if (!sel) return;
    if (!r.ok) { var i = document.createElement('input'); i.name = 'empNo'; i.required = true; i.inputMode = 'numeric'; i.placeholder = t('empNo'); sel.replaceWith(i); return; }
    sel.innerHTML = r.rows.filter(function(e){ return e.status === 'active'; }).map(function(e){ return '<option value="' + e.id + '">' + esc(e.name + ' (' + e.empNo + ')') + '</option>'; }).join('');
  }, true);
  $('#eosF', el).onsubmit = function(ev){
    ev.preventDefault(); var f = this, out = $('#eosOut', el);
    api('eosQuote', { empId: f.elements.empId ? f.elements.empId.value : '', empNo: f.elements.empNo ? f.elements.empNo.value : '', lastDay: f.elements.lastDay.value, reason: f.elements.reason.value }).then(function(r){
      if (!r.ok) { out.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>'; return; }
      var q = r.eos, name = f.elements.empId && f.elements.empId.selectedOptions && f.elements.empId.selectedOptions[0] ? f.elements.empId.selectedOptions[0].textContent : (f.elements.empNo ? f.elements.empNo.value : '');
      out.innerHTML = eosHtml(q) + '<div class="btnrow"><button type="button" class="btn btn-dark btn-sm" id="eosPrint">' + ph('printer') + t('prEosPrint') + '</button></div>';
      $('#eosPrint', out).onclick = function(){ printEos(q, name); };
    });
  };
}

/** The settlement statement: every figure with the article it comes from. */
function eosHtml(q){
  var row = function(label, note, val, neg){ return '<dt>' + label + (note ? '<small>' + note + '</small>' : '') + '</dt><dd>' + (neg ? '- ' : '') + money(val) + '</dd>'; };
  return '<div class="pr-slip"><h4>' + t('prEosService') + '</h4><dl>' +
    '<dt>' + t('prEosPeriod') + '</dt><dd>' + esc(q.hireDate) + ' - ' + esc(q.lastDay) + '</dd>' +
    '<dt>' + t('prEosYears') + (q.unpaidExcluded ? '<small>' + t('prEosExcluded') + ': ' + plural(q.unpaidExcluded, 'days') + ' (116)</small>' : '') + '</dt><dd>' + plural(q.serviceDays, 'days') + '، ' + q.years + ' ' + t('prYears') + '</dd>' +
    '<dt>' + t('prEosWage') + '<small>' + (q.basis === 'basic_housing' ? t('prEosBasisBH') : t('prEosBasisT')) + '</small></dt><dd>' + money(q.wage) + '</dd></dl>' +
    '<h4>' + t('prEosAward') + '</h4><dl>' + row(t('prEosFirst5'), '½ × ' + Math.min(q.years, 5).toFixed(2) + ' (84)', q.first5) +
    (q.after5 ? row(t('prEosAfter5'), '1 × ' + (q.years - 5).toFixed(2) + ' (84)', q.after5) : '') +
    row(t('prEosFull'), '', q.fullAward) + '<dt>' + t('prEosFactor') + '<small>' + t('eos_' + q.reason) + '</small></dt><dd>' + Math.round(q.factor * 100) + '%</dd>' +
    '<dt style="font-weight:600">' + t('prEosAward') + '</dt><dd style="font-weight:600">' + money(q.award) + '</dd></dl>' +
    '<h4>' + t('prEosSettlement') + '</h4><dl>' + row(t('prEosAward'), '', q.award) + row(t('prEosLeave'), plural(Math.round(q.leaveDays * 10) / 10, 'days') + ' (111)', q.leavePay) +
    row(t('prEosLastMonth'), q.lastMonthLocked ? t('prEosLastLocked') : plural(q.lastMonthDays, 'days'), q.lastMonthPay) +
    (q.advances ? row(t('prEosAdvances'), '', q.advances, true) : '') + '</dl>' +
    '<dl class="tot"><dt>' + t('prEosNet') + '</dt><dd>' + money(q.net) + ' ' + t('mfSar') + '</dd></dl>' +
    '<p class="hr-hint">' + t('prEosDue') + ' ' + esc(q.dueBy) + ' (' + plural(q.dueDays, 'days') + '، 88)</p></div>';
}
function printEos(q, name){
  var en = S.lang === 'en';
  var html = '<!doctype html><html lang="' + (en ? 'en' : 'ar') + '" dir="' + (en ? 'ltr' : 'rtl') + '"><head><meta charset="utf-8"><title>EOS</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;600&display=swap" rel="stylesheet"><style>@page{size:A4;margin:16mm}body{font-family:"Readex Pro",Tahoma,sans-serif;color:#17221A;font-size:13px}' +
    'header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #4D6D51;padding-bottom:10px}header img{height:54px}h1{font-size:19px;margin:14px 0 4px}' +
    '.pr-slip h4{margin:14px 0 4px;font-size:13px;color:#4A5A4D}.pr-slip dl{display:grid;grid-template-columns:1fr auto;margin:0}.pr-slip dt,.pr-slip dd{padding:5px 0;border-bottom:1px solid #E5E1D6;margin:0}' +
    '.pr-slip dd{text-align:end;font-variant-numeric:tabular-nums}.pr-slip dt small{color:#6B786D;margin-inline-start:8px}.tot dt,.tot dd{font-weight:600;font-size:15px;border:0}.hr-hint{color:#4A5A4D}' +
    '.sign{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;margin-top:40px}.sign div{border-top:1px solid #999;padding-top:6px;font-size:12px;color:#4A5A4D}</style></head><body>' +
    '<header><img src="' + LOGO + '" alt=""><div style="text-align:end;font-size:12px;color:#4A5A4D">' + (en ? 'Best Gas Carrier Co.<br>Final settlement' : 'شركة الناقل الأفضل للغاز<br>مخالصة نهائية') + '</div></header>' +
    '<h1>' + (en ? 'End-of-service and final settlement' : 'مكافأة نهاية الخدمة والمخالصة النهائية') + '</h1><p>' + esc(name || '') + '</p>' + eosHtml(q) +
    '<div class="sign"><div>' + (en ? 'Prepared by (HR)' : 'أعده (الموارد البشرية)') + '</div><div>' + (en ? 'Approved by (Finance)' : 'اعتمده (المالية)') + '</div><div>' + (en ? 'Received by the employee' : 'استلمه الموظف') + '</div></div>' +
    '<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>';
  var w = window.open('', '_blank'); if (!w) return toast(t('e_generic'));
  w.document.open(); w.document.write(html); w.document.close();
}

window.Payroll = { section: section, myCard: myCard, openSlip: openSlip, printSlip: printSlip };
})();
