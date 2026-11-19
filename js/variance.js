// Payroll sheet (all sponsors in one sheet, every filter, month x sponsor pivot, full Excel) and the deep variance
// analysis (2026-11-17). Server: api_payrollPivot and api_payrollVarianceMonth (backend/Payroll.gs), payroll access only.
(function(){
'use strict';
var K = window.W2K;
Object.assign(T.ar, {
  vsTitle:'كشف الرواتب الموحد', vsLead:'كل الجهات (الكفالات) في كشف واحد للشهر، مع كل الفلاتر، ثم تجميع الأشهر حسب الجهة. التنزيل يشمل الكشف كاملا وكل جهة في ورقة.',
  vsMonth:'الشهر', vsMonths:'أشهر الجدول', vsSearch:'بحث: الاسم أو الرقم الوظيفي أو الهوية/الإقامة', vsAll:'الكل', vsClear:'مسح الفلاتر', vsExcel:'تنزيل التقرير الكامل (Excel)',
  vsSponsor:'الجهة', vsDept:'الإدارة', vsPos:'المسمى', vsLoc:'الموقع', vsCity:'المدينة', vsNat:'الجنسية', vsSaudi:'سعودي/غير سعودي', vsCat:'الفئة', vsLevel:'المستوى الإداري', vsStatus:'الحالة',
  vsGrossFrom:'الإجمالي من', vsGrossTo:'إلى', vsNetFrom:'الصافي من', vsNetTo:'إلى',
  vsHead:'عدد الموظفين', vsGross:'إجمالي الاستحقاقات', vsDed:'إجمالي الخصومات', vsNet:'الصافي', vsGosiE:'تأمينات الموظف', vsGosiR:'تأمينات صاحب العمل', vsCost:'تكلفة الشركة',
  vsPivot:'الرواتب الشهرية حسب الجهة', vsPivotLead:'الأشهر في الصفوف والجهات في الأعمدة. الجدول لكل الموظفين (فلاتر الجهة فقط تنطبق عليه).', vsMetric:'القيمة', vsTotal:'الإجمالي',
  vsBySponsor:'ملخص الشهر حسب الجهة (بعد الفلاتر)', vsSheet:'تفاصيل الكشف', vsShown:'{n} من {t}', vsEmpNo:'الرقم', vsName:'الاسم', vsId:'الهوية/الإقامة', vsDays:'أيام العمل',
  vsNone:'لا توجد مسيرات بعد.', vsSaudiY:'سعودي', vsSaudiN:'غير سعودي', lvExec:'إدارة عليا', lvMgr:'مدير', lvSup:'مشرف', lvStaff:'موظف',
  vaTitle2:'تحليل الفروقات', vaLead2:'الشهر مقابل أساس تختاره، لكل الجهات معا: من تغير ولماذا، حسب الموظف والإدارة والموقع والمدينة والجهة وغيرها. اضغط أي صف لتصفية القائمة.',
  vaCmp:'مقارنة مع', vaM1:'الشهر السابق', vaM2:'قبل شهرين', vaAvg3:'متوسط 3 أشهر', vaAvg6:'متوسط 6 أشهر', vaAvg12:'متوسط 12 شهراً', vaPick:'أشهر أختارها…', vaPickLead:'اختر أي أشهر سابقة؛ يقارن الشهر بمتوسطها.', vaPickGo:'قارن', vaFilt:'الفلاتر والإعدادات', vaStory1:'صافي رواتب {now} هو {net} ر.س،', vaStoryUp:'بزيادة {d} {p}', vaStoryDown:'بانخفاض {d} {p}', vaStorySame:'دون تغيير', vaStoryCmp:'مقارنة بـ {base}.', vaWhyJoin:'موظفون جدد ({n})', vaWhyLeave:'موظفون غادروا ({n})', vaWhyPay:'تغيّر رواتب الموظفين المستمرين', vaAvgWord:'متوسط', vaPickAll:'الكل', vaPickNone:'لا شيء', vaBaseIs:'الشهر المختار يُقارن بـ', vaYoy:'نفس الشهر العام الماضي', vaPct:'نسبة التغير %', vaMin:'أقل مبلغ', vaChanged:'المتغيرون فقط',
  vaBridge:'من صافي الأساس إلى صافي الشهر', vaFrom:'الأساس', vaJoin:'منضمون', vaLeave:'مغادرون', vaTo:'هذا الشهر', vaBy:'التفصيل حسب', vaPeople:'الموظفون مرتبون حسب الأهمية',
  vaLines:'بنود الرواتب', vaNow:'الآن', vaBase:'الأساس', vaChg:'الفرق', vaAvgOf:'متوسط {n} أشهر', vaNowLead:'الشهر المختار', vaBaseLead:'شهر/أشهر المقارنة', vaFlags:'الملاحظات', vaCities:'مدن المواقع', vaCityHint:'المدن المظللة مفترضة (الرياض) لأن اسم الموقع لا يدل عليها. صححها هنا.', vaSave:'حفظ',
  dv_pay:'الراتب الثابت', dv_overtime:'إضافي', dv_oneoff:'مكافآت لمرة', dv_absence:'غياب وإجازات', dv_gosi:'التأمينات', dv_advances:'سلف وقروض', dv_fines:'جزاءات', dv_otherDeductions:'خصومات أخرى', dv_other:'أخرى', dv_joiners:'منضمون', dv_leavers:'مغادرون',
  fl_joiner:'منضم', fl_returner:'عائد', fl_leaver:'مغادر', fl_net_up:'صافي أعلى', fl_net_down:'صافي أقل', fl_deductions_spike:'قفزة خصومات', fl_package_change:'تغير الراتب', fl_new_line:'بند جديد', fl_gone_line:'بند اختفى', fl_net_zero:'صافي صفر', fl_one_off:'مكافأة', fl_absence:'غياب', fl_off_package:'يختلف عن العقد', fl_paid_inactive:'مدفوع وهو موقوف'
});
Object.assign(T.en, {
  vsTitle:'Combined payroll sheet', vsLead:'Every sponsor in one sheet for the month, with every filter, then the months aggregated by sponsor. The download has the full sheet and one sheet per sponsor.',
  vsMonth:'Month', vsMonths:'Months in the table', vsSearch:'Search: name, employee no. or ID / iqama', vsAll:'All', vsClear:'Clear filters', vsExcel:'Download full report (Excel)',
  vsSponsor:'Sponsor', vsDept:'Department', vsPos:'Position', vsLoc:'Location', vsCity:'City', vsNat:'Nationality', vsSaudi:'Saudi / non-Saudi', vsCat:'Category', vsLevel:'Management level', vsStatus:'Status',
  vsGrossFrom:'Gross from', vsGrossTo:'to', vsNetFrom:'Net from', vsNetTo:'to',
  vsHead:'Headcount', vsGross:'Total additions', vsDed:'Total deductions', vsNet:'Net', vsGosiE:'GOSI employee', vsGosiR:'GOSI employer', vsCost:'Company cost',
  vsPivot:'Monthly payroll by sponsor', vsPivotLead:'Months in rows, sponsors in columns. Covers everyone (only the sponsor filter applies here).', vsMetric:'Value', vsTotal:'Total',
  vsBySponsor:'This month by sponsor (after filters)', vsSheet:'Sheet detail', vsShown:'{n} of {t}', vsEmpNo:'No.', vsName:'Name', vsId:'ID / iqama', vsDays:'Days worked',
  vsNone:'No payroll runs yet.', vsSaudiY:'Saudi', vsSaudiN:'Non-Saudi', lvExec:'Executive', lvMgr:'Manager', lvSup:'Supervisor', lvStaff:'Staff',
  vaTitle2:'Variance analysis', vaLead2:'The month against a base you choose, all sponsors together: who changed and why, by employee, department, location, city, sponsor and more. Tap any row to filter the list.',
  vaCmp:'Compare with', vaM1:'Previous month', vaM2:'Two months ago', vaAvg3:'3-month average', vaAvg6:'6-month average', vaAvg12:'12-month average', vaPick:'Months I choose…', vaPickLead:'Pick any earlier months; the month is compared with their average.', vaPickGo:'Compare', vaFilt:'Filters and settings', vaStory1:'Net pay for {now} is SAR {net},', vaStoryUp:'up {d} {p}', vaStoryDown:'down {d} {p}', vaStorySame:'unchanged', vaStoryCmp:'compared with {base}.', vaWhyJoin:'New joiners ({n})', vaWhyLeave:'Leavers ({n})', vaWhyPay:'Pay changes for continuing staff', vaAvgWord:'average', vaPickAll:'All', vaPickNone:'None', vaBaseIs:'Compared with', vaYoy:'Same month last year', vaPct:'Change %', vaMin:'Minimum amount', vaChanged:'Changed only',
  vaBridge:'From base net to this month', vaFrom:'Base', vaJoin:'Joiners', vaLeave:'Leavers', vaTo:'This month', vaBy:'Breakdown by', vaPeople:'People, most important first',
  vaLines:'Pay lines', vaNow:'Now', vaBase:'Base', vaChg:'Difference', vaAvgOf:'Average of {n} months', vaNowLead:'Selected month', vaBaseLead:'Compared with', vaFlags:'Notes', vaCities:'Location cities', vaCityHint:'Shaded cities are assumed (Riyadh) because the location name does not say. Correct them here.', vaSave:'Save',
  dv_pay:'Fixed pay', dv_overtime:'Overtime', dv_oneoff:'One-off', dv_absence:'Absence and leave', dv_gosi:'GOSI', dv_advances:'Advances and loans', dv_fines:'Fines', dv_otherDeductions:'Other deductions', dv_other:'Other', dv_joiners:'Joiners', dv_leavers:'Leavers',
  fl_joiner:'Joiner', fl_returner:'Returner', fl_leaver:'Leaver', fl_net_up:'Net up', fl_net_down:'Net down', fl_deductions_spike:'Deductions spike', fl_package_change:'Package change', fl_new_line:'New line', fl_gone_line:'Line gone', fl_net_zero:'Net zero', fl_one_off:'One-off', fl_absence:'Absence', fl_off_package:'Off contract', fl_paid_inactive:'Paid while disabled'
});
// 2026-11-18: chip filters, charts, month by month, net-only months
Object.assign(T.ar, {
  vsPivotLead:'الأشهر في الصفوف والجهات في الأعمدة، لنفس الموظفين الظاهرين بعد الفلاتر.', vsPivotOld:'هذا الجدول يشمل كل الموظفين لأن الخادم لم يُحدَّث بعد؛ ستنطبق عليه الفلاتر بعد التحديث.',
  cfAdd:'فلتر', cfPick:'تصفية حسب', cfSel:'مختارة', cfRemove:'إزالة', cfBack:'رجوع', cfFind:'ابحث في القائمة', cfNone:'إلغاء الكل', cfApply:'تطبيق', cfSettings:'الإعدادات', cfSetLead:'متى يُعد تغير راتب الموظف كبيرا ويُعلَّم.', cfRanges:'نطاقات المبالغ',
  cfMore:'زيادة', cfLess:'نقص',
  vaNetOnly:'{m}: الصافي فقط (من تقرير الصرف والتسوية، بلا تفصيل البنود). الصافي وعدد الموظفين دقيقان؛ الإجمالي والخصومات والبنود وأسباب التغير لا يمكن مقارنتها لهذا الشهر.', vaNetOnlyShort:'صافي فقط', vaNA:'غير متاح',
  vaStoryFilt:'(بعد الفلاتر: {n} من {t} موظف)', vaTrend:'الصافي شهريا', vaTrendLead:'آخر 12 شهرا لنفس الفلاتر.', vaTrendFew:'لا يكفي عدد الأشهر لرسم الاتجاه.',
  vaBridgeLead:'من {a} إلى {b}: ما الذي أضاف وما الذي أنقص.', vaStayers:'تغير رواتب المستمرين', vaMix:'الصافي حسب {d}', vaMixLead:'هذا الشهر. اختر التفصيل من الأزرار أسفل الصفحة.', vaOther:'أخرى ({n})',
  vaMovers:'أكبر الزيادات والانخفاضات', vaMoversLead:'الموظفون المستمرون فقط. اضغط اسما لفتح تفاصيله.', vaRate:'العدد أم الراتب؟', vaRateLead:'كم من التغير سببه تغير عدد الموظفين، وكم سببه تغير متوسط الراتب.',
  vaRateHead:'أثر عدد الموظفين', vaRatePay:'أثر متوسط الراتب', vaAvgBefore:'متوسط الصافي قبل', vaAvgNow:'متوسط الصافي الآن', vaShare:'الحصة', vaLimit:'يظهر أول {n} من {t}. المجاميع تشمل الجميع.', vaShowAll:'عرض الكل', vaNotPaid:'لم يُصرف له',
  vwMonthly:'مقارنة شهرية', moTitle:'مقارنة شهرية', moLead:'أي أشهر جنبا إلى جنب في كشف واحد: لكل موظف أو جهة أو إدارة أو موقع، مع الفرق من شهر لآخر. كل الأرقام تتبع الفلاتر.',
  moMonths:'الأشهر', moAll:'الكل', moPick:'أختار…', moPickLead:'اختر الأشهر التي تريدها في الكشف.', moBy:'الصفوف حسب', moPerson:'الموظف', moShow:'العرض', moAmt:'المبالغ', moChg:'الفرق', moPct:'الفرق %',
  moSince:'منذ {m}', moAvg:'متوسط الشهر', moPeak:'أعلى شهر', moRows:'الصفوف', moTrend:'{x} شهرا بشهر', moTrendLead:'مجموع الصفوف الظاهرة لكل شهر.', moFirstLast:'من أول شهر لآخر شهر', moShape:'الاتجاه', moNew:'جديد',
  moStar:'شهر صافي فقط: الإجمالي والخصومات والتكلفة فيه تساوي الصافي لأن تقرير الصرف لا يفصلها.', moServer:'المقارنة الشهرية تحتاج تحديث الخادم (Apps Script). بعد التحديث تعمل هذه الصفحة مباشرة.'
});
Object.assign(T.en, {
  vsPivotLead:'Months in rows, sponsors in columns, for the same people the filters show.', vsPivotOld:'This table still covers everyone because the server has not been updated yet; filters will apply to it after the update.',
  cfAdd:'Filter', cfPick:'Filter by', cfSel:'selected', cfRemove:'Remove', cfBack:'Back', cfFind:'Search the list', cfNone:'Clear all', cfApply:'Apply', cfSettings:'Settings', cfSetLead:'When a change in someone\'s pay counts as big and gets flagged.', cfRanges:'Amount ranges',
  cfMore:'Increase', cfLess:'Decrease',
  vaNetOnly:'{m}: net only (from the disbursement report, no breakdown). Net and headcount are exact; gross, deductions, pay lines and the reasons for changes cannot be compared for this month.', vaNetOnlyShort:'net only', vaNA:'n/a',
  vaStoryFilt:'(filtered: {n} of {t} people)', vaTrend:'Net by month', vaTrendLead:'The last 12 months for the same filters.', vaTrendFew:'Not enough months to draw a trend.',
  vaBridgeLead:'From {a} to {b}: what added and what took away.', vaStayers:'Pay changes for continuing staff', vaMix:'Net by {d}', vaMixLead:'This month. Choose the breakdown with the buttons below.', vaOther:'Other ({n})',
  vaMovers:'Biggest increases and decreases', vaMoversLead:'Continuing staff only. Tap a name for the detail.', vaRate:'Headcount or pay?', vaRateLead:'How much of the change comes from the number of people, and how much from the average pay.',
  vaRateHead:'Headcount effect', vaRatePay:'Average pay effect', vaAvgBefore:'Average net before', vaAvgNow:'Average net now', vaShare:'Share', vaLimit:'Showing the first {n} of {t}. Totals include everyone.', vaShowAll:'Show all', vaNotPaid:'Not paid',
  vwMonthly:'Month by month', moTitle:'Month by month', moLead:'Any months side by side in one sheet: by employee, sponsor, department, location and more, with the change from month to month. Every number follows the filters.',
  moMonths:'Months', moAll:'All', moPick:'Choose…', moPickLead:'Choose the months you want in the sheet.', moBy:'Rows by', moPerson:'Employee', moShow:'Show', moAmt:'Amounts', moChg:'Change', moPct:'Change %',
  moSince:'since {m}', moAvg:'Monthly average', moPeak:'Highest month', moRows:'Rows', moTrend:'{x} month by month', moTrendLead:'Sum of the rows shown, each month.', moFirstLast:'First to last month', moShape:'Trend', moNew:'new',
  moStar:'Net-only month: gross, deductions and cost there equal net, because the disbursement report has no breakdown.', moServer:'Month by month needs the server (Apps Script) update. Once it is updated this page works straight away.'
});
var LN = { ar: { basic:'الأساسي', housing:'السكن', transport:'النقل', allowance:'بدلات', bonus:'مكافأة', overtime:'إضافي', gosi:'تأمينات', fine:'جزاءات', advance:'سلف/قروض', loan:'قرض', unpaid_leave:'إجازة', absence:'غياب', other_deduction:'خصومات أخرى', other_earning:'استحقاق آخر' },
  en: { basic:'Basic', housing:'Housing', transport:'Transport', allowance:'Allowances', bonus:'Bonus', overtime:'Overtime', gosi:'GOSI', fine:'Fines', advance:'Advances/loans', loan:'Loan', unpaid_leave:'Leave', absence:'Absence', other_deduction:'Other deductions', other_earning:'Other earning' } };
// Pay columns follow the payslip: basic, days worked, every other addition, total additions, deductions, total deductions, net.
// PAY ORDER: the same list and rule as js/payroll.js (tests/payorder.js checks they agree); evidence in
// docs/research/2026-11-18-pay-item-order-rea.md.
var PAY_ORDER = { e: ['basic', 'housing', 'transport', 'allowance', 'other_allowance', 'arrears', 'overtime', 'commission', 'incentive', 'bonus', 'per_diem', 'reimbursement', 'other_earning'],
  d: ['gosi', 'fine', 'advance', 'loan', 'unpaid_leave', 'sick_75', 'sick_unpaid', 'absence', 'late', 'join', 'other_deduction'] };
function payRank(kind, code, label){
  var ded = kind === 'deduction' || kind === 'd', c = code === 'other_deduction' && /انضمام|join/i.test(String(label || '')) ? 'join' : code, i = PAY_ORDER[ded ? 'd' : 'e'].indexOf(c);
  return (ded ? 1000 : 0) + (i < 0 ? 500 : i * 10) - (code === 'fine' && /مرور|traffic/i.test(String(label || '')) ? 1 : 0);
}
function lineRank(k){ var p = String(k).split(':'); return payRank(p[0], p[1], p.slice(2).join(':')); }
function orderLines(keys){ return keys.slice().sort(function(a, b){ return lineRank(a) - lineRank(b) || String(a).localeCompare(String(b)); }); }
function payCols(keys, days){ var k = orderLines(keys), e = k.filter(function(x){ return x.indexOf('d:') !== 0; }), d = k.filter(function(x){ return x.indexOf('d:') === 0; });
  var b = e[0] === 'e:basic' ? [e.shift()] : [], L = function(x){ return 'l:' + x; };
  return b.map(L).concat(days ? ['days'] : []).concat(e.map(L)).concat(['gross']).concat(d.map(L)).concat(['deductions', 'net']); }
function lineName(k){ var p = String(k).split(':'), en = S.lang === 'en'; if (p[2] && !en) return p[2]; var n = (LN[en ? 'en' : 'ar'][p[1]] || p[1]); return p[2] && en ? n + ' (' + p[2] + ')' : n; }
function amt(n){ return n == null ? '-' : '<span class="num">' + acctFmt(n) + '</span>'; }
function mon(m){ return new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1, 15)).toLocaleDateString(S.lang === 'en' ? 'en-GB' : 'ar-SA-u-ca-gregory-nu-latn', { month: 'short', year: 'numeric', timeZone: 'UTC' }); }
function level(title){ var s = String(title || '').toLowerCase(); return /ceo|chief|executive|director|رئيس|مدير عام|تنفيذي/.test(s) ? 'lvExec' : /manager|head|مدير/.test(s) ? 'lvMgr' : /supervisor|lead|مشرف/.test(s) ? 'lvSup' : 'lvStaff'; }
function vaL(k){ var r = VA.r; if (!r) return t(k === 'now' ? 'vaNowLead' : 'vaBaseLead'); if (k === 'now') return mon(r.month); var b = r.baseMonths || []; return b.length === 1 ? mon(b[0]) : t('vaAvgOf').replace('{n}', b.length); }
// change: the sign and an arrow carry the direction; the arrow alone is coloured (red = more, blue = less), the number stays ink
function chg(c){ if (!c) return '-'; var d = Number(c.diff) || 0; if (!d) return '<span class="vs-chg">0</span>'; var up = d > 0;
  return '<span class="vs-chg"><i class="' + (up ? 'up' : 'dn') + '" aria-hidden="true">' + (up ? '▲' : '▼') + '</i>' + (up ? '+' : '−') + acctFmt(Math.abs(d)) + (c.pct != null ? ' <small>(' + (up ? '+' : '−') + Math.abs(c.pct) + '%)</small>' : '') + '</span>'; }
function pctChg(p){ p = Math.round((Number(p) || 0) * 10) / 10; if (!p) return '<span class="vs-chg">0%</span>'; var up = p > 0;
  return '<span class="vs-chg"><i class="' + (up ? 'up' : 'dn') + '" aria-hidden="true">' + (up ? '▲' : '▼') + '</i>' + (up ? '+' : '−') + Math.abs(p) + '%</span>'; }
function sgn(n){ n = Math.round((Number(n) || 0) * 100) / 100; return (n > 0 ? '+' : n < 0 ? '−' : '') + acctFmt(Math.abs(n)); }
function sum(rows, f){ return Math.round(rows.reduce(function(t, r){ return t + (Number(r[f]) || 0); }, 0) * 100) / 100; }
function uniq(rows, k){ var o = {}; rows.forEach(function(r){ var v = r[k]; if (v !== '' && v != null) o[v] = 1; }); return Object.keys(o).sort(); }
function xlName(s){ return String(s).replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 30) || '-'; }
function selBox(id, label, list, cur){ return '<label class="vs-sel"><span>' + t(label) + '</span><select id="' + id + '">' + list.map(function(o){ return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>'; }
function seg(id, list, cur){ return '<span class="vs-seg" role="group" id="' + id + '">' + list.map(function(o){ return '<button type="button" data-v="' + esc(o[0]) + '" aria-pressed="' + (String(o[0]) === String(cur)) + '">' + esc(o[1]) + '</button>'; }).join('') + '</span>'; }
function V(){ return window.Viz; }
function wireViz(el){ if (V()) { V().wireTips(el); V().wireLines(el); } }
function card(id, title, lead, chart, table){ return V() ? V().card(id, title, lead, chart, table) : '<div class="db-card"><h3>' + title + '</h3>' + chart + '</div>'; }
function vtbl(head, rows){ return V() ? V().tbl(head, rows) : ''; }
/** Diverging bars around zero: decreases to the left in blue, increases to the right in red, the signed number beside each. */
function dvBars(items){
  if (!items.length) return '<p class="hr-hint">-</p>';
  var mx = Math.max.apply(null, items.map(function(i){ return Math.abs(i.value || 0); }).concat([1]));
  return '<div class="vs-dvs">' + items.map(function(i){ var w = Math.abs(i.value || 0) / mx * 100, pos = (i.value || 0) > 0; if (!Math.round((i.value || 0) * 100)) w = 0;
    return '<div class="vs-dv' + (i.go != null ? ' go' : '') + '" tabindex="0"' + (i.go != null ? ' data-go-p="' + i.go + '"' : '') + ' data-tip="' + esc(i.tip || (i.label + ': ' + sgn(i.value))) + '"><span class="nm">' + esc(i.label) + '</span>' +
      '<span class="tr" dir="ltr"><span class="l">' + (pos ? '' : '<i class="dn" style="width:' + w + '%"></i>') + '</span><span class="r">' + (pos ? '<i class="up" style="width:' + w + '%"></i>' : '') + '</span></span><b class="num" dir="ltr">' + sgn(i.value) + '</b></div>'; }).join('') +
    '<div class="vs-dvk"><span><i class="dn"></i>' + t('cfLess') + '</span><span><i class="up"></i>' + t('cfMore') + '</span></div></div>';
}

// ======================================================================= chip filter bar
/**
 * One row above the results: a search pill, a chip for each active filter (tap to edit, x to remove), on/off toggles,
 * "+ Filter" which opens a searchable checklist per dimension with live counts (each count follows every other filter,
 * so it never promises rows the page will not show), and an optional settings popover. The host stays on the page across
 * reloads, so typing in the search keeps its focus.
 * cfg: { f, dims: [[key, labelKey]], opts(key) -> [{value, count}], val(key, value), onChange(), toggles: [[key, labelKey]],
 *        more: { icon, label, html(), wire(pop) } }
 */
function chipBar(host, cfg){
  host.__cfg = cfg;
  if (!host.__cf) {
    host.__cf = 1;
    host.innerHTML = '<div class="cf" role="search"><label class="cf-q">' + ph('magnifying-glass') + '<input type="search" data-cfq placeholder="' + esc(t('vsSearch')) + '" aria-label="' + esc(t('vsSearch')) + '"></label><div class="cf-chips" data-cfc></div></div>' +
      '<div class="cf-pop" data-cfp role="dialog" hidden></div>';
    var q = host.querySelector('[data-cfq]'), tm; q.value = cfg.f.q || '';
    q.oninput = function(){ var v = q.value; clearTimeout(tm); tm = setTimeout(function(){ host.__cfg.f.q = v.trim(); host.__cfg.onChange(); }, 400); };
    // the popover is kept on host.__pop: on a phone it moves to <body> as a bottom sheet (the page scroller would clip a
    // fixed element and the bottom bar would cover it), and comes back when it closes
    var P = host.__pop = host.querySelector('[data-cfp]');
    var close = function(){ if (P.hidden) return; P.hidden = true; P.dataset.m = ''; if (P.parentNode !== host) host.appendChild(P); };
    host.__close = close;
    var outside = function(e){ if (!host.isConnected) { close(); document.removeEventListener('pointerdown', outside); window.removeEventListener('hashchange', close); return; } if (!P.hidden && !host.contains(e.target) && !P.contains(e.target)) close(); };
    document.addEventListener('pointerdown', outside); window.addEventListener('hashchange', close);
    var esc2 = function(e){ if (e.key === 'Escape' && !P.hidden) { close(); e.stopPropagation(); var a = host.querySelector('[data-cfa]'); if (a) a.focus(); } };
    host.addEventListener('keydown', esc2); P.addEventListener('keydown', esc2);
  }
  var f = cfg.f, box = host.querySelector('[data-cfc]'), pop = host.__pop, closePop = host.__close;
  var show = function(){ if (window.matchMedia && matchMedia('(max-width: 700px)').matches) { pop.classList.add('cf-sheet'); document.body.appendChild(pop); } else { pop.classList.remove('cf-sheet'); if (pop.parentNode !== host) host.appendChild(pop); } pop.hidden = false; };
  var label = function(k){ var d = cfg.dims.filter(function(x){ return x[0] === k; })[0]; return d ? t(d[1]) : k; };
  var active = cfg.dims.filter(function(d){ return Array.isArray(f[d[0]]) && f[d[0]].length; });
  var moreN = cfg.more && cfg.more.count ? cfg.more.count() : 0;
  var on = active.length + (cfg.toggles || []).filter(function(x){ return f[x[0]]; }).length + (f.q ? 1 : 0) + moreN;
  box.innerHTML = active.map(function(d){ var vs = f[d[0]];
      return '<span class="cf-chip"><button type="button" class="cf-ed" data-cfe="' + d[0] + '"><span>' + t(d[1]) + '</span><b>' + (vs.length === 1 ? esc(cfg.val(d[0], vs[0])) : vs.length + ' ' + t('cfSel')) + '</b></button>' +
        '<button type="button" class="cf-x" data-cfx="' + d[0] + '" aria-label="' + esc(t('cfRemove') + ' ' + t(d[1])) + '">' + ph('x') + '</button></span>'; }).join('') +
    (cfg.toggles || []).map(function(x){ return '<button type="button" class="cf-tog" data-cft="' + x[0] + '" aria-pressed="' + !!f[x[0]] + '">' + ph(f[x[0]] ? 'check-circle' : 'circle') + t(x[1]) + '</button>'; }).join('') +
    '<button type="button" class="cf-add" data-cfa aria-haspopup="dialog">' + ph('plus') + t('cfAdd') + '</button>' +
    (cfg.more ? '<button type="button" class="cf-add' + (moreN ? ' cf-on' : '') + '" data-cfm aria-haspopup="dialog">' + ph(cfg.more.icon) + t(cfg.more.label) + (moreN ? ' <b class="cf-n">' + moreN + '</b>' : '') + '</button>' : '') +
    (on ? '<button type="button" class="cf-clr" data-cfclr>' + t('vsClear') + '</button>' : '');
  var focusFirst = function(){ var x = pop.querySelector('input,button'); if (x) x.focus(); };
  var list = function(){
    pop.innerHTML = '<div class="cf-ph"><b>' + t('cfPick') + '</b></div><div class="cf-dl">' + cfg.dims.map(function(d){ var o = cfg.opts(d[0]) || [], n = o.filter(function(x){ return x.count; }).length;
      return '<button type="button" data-cfd="' + d[0] + '"><span>' + t(d[1]) + '</span><small>' + n + '</small>' + ph(S.lang === 'ar' ? 'caret-left' : 'caret-right') + '</button>'; }).join('') + '</div>';
    show(); focusFirst();
    $$('[data-cfd]', pop).forEach(function(b){ b.onclick = function(){ edit(b.dataset.cfd); }; });
  };
  var edit = function(k){
    var o = cfg.opts(k) || [], cur = f[k] || [];
    pop.innerHTML = '<div class="cf-ph"><button type="button" class="cf-back" data-cfb aria-label="' + esc(t('cfBack')) + '">' + ph(S.lang === 'ar' ? 'arrow-right' : 'arrow-left') + '</button><b>' + esc(label(k)) + '</b></div>' +
      (o.length > 8 ? '<input type="search" class="cf-s" data-cfs placeholder="' + esc(t('cfFind')) + '" aria-label="' + esc(t('cfFind')) + '">' : '') +
      '<div class="cf-ol">' + o.map(function(x){ return '<label class="' + (x.count ? '' : 'z') + '"><input type="checkbox" value="' + esc(x.value) + '"' + (cur.indexOf(x.value) >= 0 ? ' checked' : '') + '><span>' + esc(cfg.val(k, x.value)) + '</span><small>' + x.count + '</small></label>'; }).join('') + '</div>' +
      '<div class="cf-pf"><button type="button" class="btn btn-line btn-sm" data-cfn>' + t('cfNone') + '</button><span class="sp"></span><button type="button" class="btn btn-dark btn-sm" data-cfok>' + t('cfApply') + '</button></div>';
    show(); focusFirst();
    $('[data-cfb]', pop).onclick = list;
    var s = $('[data-cfs]', pop); if (s) s.oninput = function(){ var v = s.value.trim().toLowerCase(); $$('.cf-ol label', pop).forEach(function(l){ l.hidden = v && l.textContent.toLowerCase().indexOf(v) < 0; }); };
    $('[data-cfn]', pop).onclick = function(){ $$('.cf-ol input', pop).forEach(function(c){ c.checked = false; }); };
    $('[data-cfok]', pop).onclick = function(){ var vs = $$('.cf-ol input', pop).filter(function(c){ return c.checked; }).map(function(c){ return c.value; });
      if (vs.length) f[k] = vs; else delete f[k]; closePop(); cfg.onChange(); };
  };
  $('[data-cfa]', box).onclick = function(){ if (!pop.hidden && pop.querySelector('[data-cfd]')) { closePop(); return; } list(); };
  if (cfg.more) $('[data-cfm]', box).onclick = function(){ if (!pop.hidden && pop.dataset.m) { closePop(); return; } pop.innerHTML = cfg.more.html(); show(); pop.dataset.m = '1'; cfg.more.wire(pop); focusFirst(); };
  $$('[data-cfe]', box).forEach(function(b){ b.onclick = function(){ edit(b.dataset.cfe); }; });
  $$('[data-cfx]', box).forEach(function(b){ b.onclick = function(){ delete f[b.dataset.cfx]; cfg.onChange(); }; });
  $$('[data-cft]', box).forEach(function(b){ b.onclick = function(){ f[b.dataset.cft] = !f[b.dataset.cft]; cfg.onChange(); }; });
  var clr = $('[data-cfclr]', box); if (clr) clr.onclick = function(){ Object.keys(f).forEach(function(k){ delete f[k]; }); host.querySelector('[data-cfq]').value = ''; cfg.onChange(); };
}
function netOnlyNote(ms){ return ms && ms.length ? '<div class="vs-note" role="note">' + ph('info') + '<p>' + t('vaNetOnly').replace('{m}', ms.map(function(m){ return '<b>' + esc(mon(m)) + '</b>'; }).join('، ')) + '</p></div>' : ''; }

(function css(){ if (document.getElementById('vsCss')) return; var st = document.createElement('style'); st.id = 'vsCss'; st.textContent =
  'html body{--vs-up:#e34948;--vs-dn:#2a78d6;--vs-mid:#f0efec}html[data-theme="dark"] body{--vs-up:#e66767;--vs-dn:#3987e5;--vs-mid:#383835}' +
  '.vs-top{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px;margin:4px 0 12px}.vs-top .sp{flex:1}' +
  '.vs-sel{display:flex;flex-direction:column;gap:4px;min-width:170px}.vs-sel>span{font-size:12px;font-weight:600;color:var(--ink-2)}' +
  'html body .vs-sel select{height:40px;border-radius:999px;border:1px solid var(--q-hair-3,#D6D0C2);background:var(--card,#fff);padding:0 16px;font:inherit;font-size:14px;color:var(--ink);min-width:170px}' +
  '.vs-seg{display:inline-flex;padding:4px;gap:4px;border-radius:999px;background:var(--q-tray,#F4F2EC);border:1px solid var(--q-hair,#E4DFD3)}.vs-seg button{border:0;background:none;border-radius:999px;padding:6px 14px;font:inherit;font-size:13px;color:var(--ink-2);cursor:pointer;min-height:32px}.vs-seg button[aria-pressed=true]{background:var(--card,#fff);color:var(--ink);font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.08)}' +
  // chip bar
  '.vs-cfh{position:relative;margin:0 0 16px}.cf{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.cf-q{display:flex;align-items:center;gap:8px;flex:1 1 260px;max-width:420px;height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--q-hair-3,#D6D0C2);background:var(--card,#fff);color:var(--ink-2)}' +
  'html body .cf .cf-q input,html body.v2-on :is(#main,.drawer,.toolbar,.form,.v2-area) .cf.cf .cf-q.cf-q input[type=search][data-cfq][data-cfq],html body.v2-on :is(#main,.drawer) .cf.cf .cf-q.cf-q input[type=search][data-cfq][data-cfq]:is(:hover,:focus){border:0!important;background:transparent!important;outline:0!important;flex:1;min-width:0;width:auto!important;height:38px!important;min-height:0!important;font:inherit;font-size:14px;color:var(--ink);padding:0!important;margin:0!important;box-shadow:none!important;border-radius:0!important}.cf-q:focus-within{outline:2px solid var(--brand);outline-offset:1px}' +
  '.cf-chips{display:contents}.cf-chip{display:inline-flex;align-items:center;height:36px;border-radius:999px;background:var(--ink);color:var(--paper,#fff);overflow:hidden}.cf-chip button{border:0;background:none;color:inherit;font:inherit;cursor:pointer;height:100%}' +
  '.cf-ed{display:inline-flex;gap:6px;align-items:center;padding:0 4px 0 14px;font-size:13px}html[dir=rtl] .cf-ed{padding:0 14px 0 4px}.cf-ed span{opacity:.72}.cf-ed b{font-weight:600;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cf-x{width:34px;display:grid;place-items:center}.cf-x:hover{background:rgba(255,255,255,.14)}' +
  '.cf-tog,.cf-add,.cf-clr{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 14px;border-radius:999px;font:inherit;font-size:13px;cursor:pointer;border:1px solid var(--q-hair-3,#D6D0C2);background:var(--card,#fff);color:var(--ink)}.cf-add{border-style:dashed}.cf-add.cf-on{border-style:solid;border-color:var(--ink);font-weight:600}.cf-n{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:var(--ink);color:var(--paper,#fff);font-size:11px}.cf-tog[aria-pressed=true]{background:var(--q-tray,#F4F2EC);border-color:var(--ink);font-weight:600}.cf-clr{border:0;background:none;color:var(--ink-2);text-decoration:underline;text-underline-offset:3px}' +
  '.cf-pop{position:absolute;z-index:30;top:calc(100% + 8px);inset-inline-start:0;width:min(360px,calc(100vw - 32px));max-height:min(460px,70vh);display:flex;flex-direction:column;background:var(--card,#fff);border:1px solid var(--q-hair,#E4DFD3);border-radius:16px;box-shadow:0 12px 32px rgba(20,18,15,.16);padding:8px}.cf-pop[hidden]{display:none}' +
  '.cf-ph{display:flex;align-items:center;gap:8px;padding:8px 8px 10px;font-size:14px}.cf-back{border:0;background:none;width:32px;height:32px;border-radius:999px;cursor:pointer;color:var(--ink)}.cf-back:hover{background:var(--q-tray,#F4F2EC)}' +
  '.cf-dl{overflow:auto}.cf-dl button{display:flex;align-items:center;gap:8px;width:100%;border:0;background:none;padding:10px 12px;border-radius:10px;font:inherit;font-size:14px;color:var(--ink);cursor:pointer;text-align:start;min-height:44px}.cf-dl button:hover,.cf-dl button:focus-visible{background:var(--q-tray,#F4F2EC)}.cf-dl span{flex:1}.cf-dl small{color:var(--ink-2)}' +
  'html body .cf-s{height:38px;border-radius:999px;border:1px solid var(--q-hair-3,#D6D0C2);padding:0 14px;margin:0 4px 8px;font:inherit;font-size:14px;background:var(--q-tray,#F4F2EC)}' +
  '.cf-ol{overflow:auto;flex:1;padding:0 4px}.cf-ol label{display:flex;align-items:center;gap:10px;padding:8px;border-radius:10px;font-size:14px;cursor:pointer;min-height:40px}.cf-ol label:hover{background:var(--q-tray,#F4F2EC)}.cf-ol label span{flex:1}.cf-ol label small{color:var(--ink-2);font-variant-numeric:tabular-nums}.cf-ol label.z{opacity:.5}.cf-ol input{width:18px;height:18px;accent-color:var(--ink)}' +
  '.cf-pf{display:flex;gap:8px;padding:10px 4px 4px;border-top:1px solid var(--q-hair,#E4DFD3);margin-top:6px}.cf-pf .sp{flex:1}.cf-set{display:grid;gap:12px;padding:4px 8px 8px}.cf-set label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:600;color:var(--ink-2)}html body .cf-set input{height:40px;border-radius:12px;border:1px solid var(--q-hair-3,#D6D0C2);padding:0 12px;font:inherit;font-size:14px}' +
  '.cf-pop.cf-sheet{position:fixed;z-index:2147483000;inset:auto 0 0 0;top:auto;width:auto;max-height:80vh;border-radius:20px 20px 0 0;padding:12px 12px max(16px,env(safe-area-inset-bottom));box-shadow:0 0 0 100vmax rgba(20,18,15,.38),0 -8px 32px rgba(20,18,15,.2)}@media (max-width:700px){.cf-q{max-width:none}}' +
  // results: money tiles hold up to 13 characters (1,234,567.89), so their figures scale with the width instead of being cut
  'html body.v2-on :is(#vaBox,#moBox,#vsBox) .db-tile b{font-size:clamp(18px,2vw,26px)!important;white-space:nowrap;letter-spacing:-.01em}html body.v2-on :is(#vaBox,#moBox,#vsBox) .db-tiles{grid-template-columns:repeat(auto-fit,minmax(170px,1fr))!important}' +
  '.vs-note{display:flex;gap:10px;align-items:flex-start;padding:12px 16px;border-radius:14px;background:var(--q-tray,#F4F2EC);border:1px solid var(--q-hair,#E4DFD3);margin:0 0 16px;font-size:13px;line-height:1.6}.vs-note p{margin:0}' +
  '.vs-tbl{width:100%;border-collapse:collapse;font-size:13px}.vs-tbl th,.vs-tbl td{padding:9px 12px;border-bottom:1px solid var(--q-hair,#E4DFD3);text-align:start;white-space:nowrap}.vs-tbl th{position:sticky;top:0;background:var(--card,#fff);font-weight:600;color:var(--ink-2);font-size:12px;z-index:1}.vs-tbl th[data-s]{cursor:pointer}' +
  '.vs-tbl td.n,.vs-tbl th.n{text-align:end;font-variant-numeric:tabular-nums}.vs-tbl tfoot td{font-weight:700;border-top:2px solid var(--ink);background:var(--card,#fff);position:sticky;bottom:0}.vs-tbl tr.go{cursor:pointer}.vs-tbl tr.go:hover td{background:color-mix(in srgb,var(--ink) 4%,transparent)}.vs-tbl td.na{color:var(--ink-2)}' +
  '.vs-wrap{overflow:auto;max-height:70vh;border:1px solid var(--q-hair,#E4DFD3);border-radius:14px;margin:8px 0 20px;background:var(--card,#fff)}.vs-h{margin:24px 0 4px;font-size:16px}.vs-sub{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.vs-sub .sp{flex:1}' +
  '.vs-chg{white-space:nowrap;direction:ltr;unicode-bidi:isolate;display:inline-block}.vs-chg i{font-style:normal;font-size:9px;margin-inline-end:4px;vertical-align:1px}.vs-chg i.up{color:var(--vs-up)}.vs-chg i.dn{color:var(--vs-dn)}' +
  '.vs-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.vs-tabs button{border:1px solid var(--q-hair,#E4DFD3);background:var(--card,#fff);border-radius:999px;padding:6px 14px;font:inherit;font-size:13px;cursor:pointer;min-height:34px}.vs-tabs button[aria-pressed=true]{background:var(--ink);color:var(--paper,#fff);border-color:var(--ink)}' +
  '.vs-story{margin:0 0 16px;padding:18px 20px;border-radius:16px;background:var(--card,#fff);border:1px solid var(--q-hair,#E4DFD3)}.vs-lead{margin:0 0 12px;font-size:18px;line-height:1.7;color:var(--ink)}' +
  '.vs-why{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px}.vs-why li{display:flex;justify-content:space-between;gap:12px;padding:12px 16px;border-radius:12px;background:var(--q-tray,#F4F2EC);font-size:13px}.vs-why b{font-size:15px;color:var(--ink);direction:ltr;unicode-bidi:isolate}' +
  '.vs-pick{margin:0 0 12px;padding:12px 16px;border-radius:16px;background:var(--q-tray,#F4F2EC);border:1px solid var(--q-hair,#E4DFD3)}.vs-pick p{margin:0 0 8px;font-size:13px;color:var(--ink-2)}.vs-pick-m{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}.vs-pick-m label{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:var(--card,#fff);border:1px solid var(--q-hair,#E4DFD3);font-size:13px;cursor:pointer}.vs-pick-m label:has(input:checked){border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)}.vs-base{margin:0 0 12px;font-size:13px;color:var(--ink-2)}.vs-base b{color:var(--ink)}' +
  '.vs-flag{display:inline-block;font-size:11px;padding:2px 8px;border-radius:999px;background:color-mix(in srgb,var(--ink) 7%,transparent);margin:1px 2px}.vs-assumed td:first-child{background:color-mix(in srgb,#C98500 14%,transparent)}' +
  '.vs-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:16px 0}.vs-grid .wide{grid-column:1 / -1}@media (max-width:900px){.vs-grid{grid-template-columns:1fr}}' +
  '.vs-dvs{display:grid;gap:6px}.vs-dv{display:grid;grid-template-columns:minmax(90px,30%) 1fr 110px;gap:10px;align-items:center;font-size:13px;min-height:28px;border-radius:8px}.vs-dv.go{cursor:pointer}.vs-dv.go:hover{background:var(--q-tray,#F4F2EC)}.vs-dv .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.vs-dv b{text-align:end;font-weight:600}' +
  '.vs-dv .tr{display:grid;grid-template-columns:1fr 1fr;height:16px}.vs-dv .l{display:flex;justify-content:flex-end;border-inline-end:1px solid var(--axis,#C3C8C4)}.vs-dv .r{display:flex}.vs-dv i{display:block;height:16px}.vs-dv i:not([style*="width:0%"]){min-width:2px}.vs-dv i.up{background:var(--vs-up);border-radius:0 4px 4px 0}.vs-dv i.dn{background:var(--vs-dn);border-radius:4px 0 0 4px}' +
  '.vs-dvk{display:flex;gap:16px;font-size:12px;color:var(--ink-2);margin-top:6px}.vs-dvk i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-inline-end:6px;vertical-align:-1px}.vs-dvk i.up{background:var(--vs-up)}.vs-dvk i.dn{background:var(--vs-dn)}' +
  '.vs-rate{display:grid;grid-template-columns:1fr 1fr;gap:8px}.vs-rate div{padding:12px 14px;border-radius:12px;background:var(--q-tray,#F4F2EC)}.vs-rate span{display:block;font-size:12px;color:var(--ink-2);margin-bottom:4px}.vs-rate b{font-size:17px;direction:ltr;unicode-bidi:isolate}' +
  '.vs-ins .db-ch h3{display:flex;align-items:center;gap:8px}.vs-ins .db-ch h3 i{color:var(--brand)}.vs-insl{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:8px}.vs-insl li{display:grid;grid-template-columns:36px 1fr auto;gap:12px;align-items:center;padding:10px 12px;border-radius:12px;background:var(--well);font-size:14px;line-height:1.6}.vs-insl li.sev{background:color-mix(in srgb,#C98500 12%,var(--card))}.vs-insl .vi-ic{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--brand) 12%,var(--card));color:var(--brand);font-size:18px}.vs-insl li.sev .vi-ic{background:color-mix(in srgb,#C98500 20%,var(--card));color:#8F5A0C}' +
  '.vs-tbl td.vs-why-c{white-space:normal;min-width:240px;max-width:360px;font-size:12.5px;line-height:1.5;color:var(--ink-2)}.vs-tbl td.vs-why-c div+div{margin-top:2px}' +
  '.vs-heat td.vh0{color:var(--ink-3)}.vs-heat td,.vs-heat th{min-width:92px}.vs-heat td:first-child,.vs-heat th:first-child{position:sticky;inset-inline-start:0;background:var(--card);z-index:1}' +
  '.vs-more-p{display:flex;align-items:center;gap:12px;margin:-12px 0 20px;font-size:13px;color:var(--ink-2)}.vs-mo td.sp-c svg{display:block}.vs-mo th.mo,.vs-mo td.mo{min-width:96px}.vs-mo td.nonly{color:var(--ink-2);font-style:italic}';
  document.head.appendChild(st); })();

var DIMS = [['payGroup', 'vsSponsor'], ['department', 'vsDept'], ['location', 'vsLoc'], ['city', 'vsCity'], ['title', 'vsPos'], ['nationality', 'vsNat'], ['saudi', 'vsSaudi'], ['employmentType', 'vsCat']];
function dimVal(k, v){ return k === 'saudi' ? t(v === 'saudi' ? 'vsSaudiY' : 'vsSaudiN') : k === 'flags' ? t('fl_' + v) : v; }
function serverFilters(f){ var o = {}; Object.keys(f).forEach(function(k){ var v = f[k]; if (v === '' || v == null || v === false || (Array.isArray(v) && !v.length)) return; o[k] = v; }); return o; }
function xlFilters(f){ return Object.keys(f).filter(function(k){ var v = f[k]; return v && (!Array.isArray(v) || v.length); }).map(function(k){ return [k, Array.isArray(f[k]) ? f[k].map(function(v){ return dimVal(k, v); }).join(', ') : String(f[k])]; }); }

// ======================================================================= combined payroll sheet
var PS = { month: '', n: 12, f: {}, metric: 'net', sort: null, dir: 1, pv: null, mm: null };
var PS_DIMS = [['sponsor', 'vsSponsor'], ['department', 'vsDept'], ['title', 'vsPos'], ['level', 'vsLevel'], ['employmentType', 'vsCat'], ['location', 'vsLoc'], ['city', 'vsCity'], ['nationality', 'vsNat'], ['saudi', 'vsSaudi'], ['status', 'vsStatus']];
function sheetSection(body){
  var box = K.head(body, 'vsTitle', 'vsLead');
  box.innerHTML = '<div id="vsTop"></div><div class="vs-cfh" id="vsCf"></div><div id="vsBox"></div>'; var el = $('#vsBox', box), top = $('#vsTop', box), cf = $('#vsCf', box);
  function load(){
    K.busy(el);
    api('payrollPivot', { months: PS.n, detail: PS.month || undefined }, true).then(function(r){
      if (!el.isConnected) return; if (!r.ok) return el.innerHTML = K.bad(r.error);
      if (!r.months.length) return el.innerHTML = K.empty('table', t('vsNone'));
      if (!PS.month || r.detail !== PS.month) { PS.month = r.detail || r.months[r.months.length - 1]; if (r.detail !== PS.month) return load(); }
      PS.pv = r;
      // the month x sponsor table is rebuilt from each person's months so it follows every filter (payrollMonthly)
      return api('payrollMonthly', { months: r.months }, true).then(function(m){ PS.mm = m && m.ok ? m : null; draw(); });
    });
  }
  // a row of the month's sheet (or a person of the month-by-month book, as { dims, status, name, empNo }) against the filters
  var rowVal = function(x, k){ return k === 'level' ? level(x.title) : k === 'saudi' ? String(!!x.saudi) : x[k]; };
  var pass = function(x, skip){ var f = PS.f, q = String(f.q || '').toLowerCase();
    for (var i = 0; i < PS_DIMS.length; i++) { var k = PS_DIMS[i][0]; if (k !== skip && Array.isArray(f[k]) && f[k].length && f[k].indexOf(rowVal(x, k)) < 0) return false; }
    if (q && String(x.name).toLowerCase().indexOf(q) < 0 && String(x.empNo).indexOf(q) < 0 && String(x.idNo || '').indexOf(q) < 0) return false;
    var n = function(v){ return v === '' || v == null ? null : Number(v); };
    if (n(f.gFrom) != null && !(x.gross >= n(f.gFrom))) return false; if (n(f.gTo) != null && !(x.gross <= n(f.gTo))) return false;
    if (n(f.nFrom) != null && !(x.net >= n(f.nFrom))) return false; if (n(f.nTo) != null && !(x.net <= n(f.nTo))) return false;
    return true; };
  // a person in month m, as a row of that month's sheet: the sponsor is the one whose run paid them that month (as in the
  // sheet below), the amount ranges look at the selected month, and an ID / iqama search matches through the sheet's rows
  var asRow = function(p, m){ var d = p.dims, cur = p.m[PS.month], v = p.m[m] || []; return { sponsor: v[6] || d.payGroup, department: d.department, title: d.title, employmentType: d.employmentType, location: d.location, city: d.city,
    nationality: d.nationality, saudi: d.saudi === 'saudi', status: p.status, name: p.name, empNo: p.empNo, idNo: idOf[p.empNo] || '', gross: cur ? cur[0] : null, net: cur ? cur[2] : null }; };
  var idOf = {};
  function draw(){
    var r = PS.pv, f = PS.f, all = r.rows, rows = all.filter(function(x){ return pass(x); });
    idOf = {}; all.forEach(function(x){ if (x.idNo) idOf[x.empNo] = x.idNo; });
    var lineKeys = orderLines(r.lineKeys.filter(function(k){ return rows.some(function(x){ return x.lines[k]; }); }));
    var spCols = payCols(lineKeys, false), rowCols = payCols(lineKeys, true);
    var colLabel = function(c){ return c.indexOf('l:') === 0 ? esc(lineName(c.slice(2))) : t({ days: 'vsDays', gross: 'vsGross', deductions: 'vsDed', net: 'vsNet' }[c]); };
    var colVal = function(x, c){ return c.indexOf('l:') === 0 ? (x.lines[c.slice(2)] || 0) : (x[c] || 0); };
    var colCell = function(x, c){ return c === 'days' ? '<td class="n">' + (x.days == null ? '' : x.days) + '</td>' : '<td class="n">' + (c === 'net' ? '<b>' + amt(colVal(x, c)) + '</b>' : amt(colVal(x, c))) + '</td>'; };
    var colFoot = function(list, c){ return c === 'days' ? '<td></td>' : '<td class="n">' + amt(list.reduce(function(a, x){ return a + colVal(x, c); }, 0)) + '</td>'; };
    if (PS.sort) rows.sort(function(a, b){ var u = PS.sort.indexOf('l:') === 0 ? (a.lines[PS.sort.slice(2)] || 0) : a[PS.sort], v = PS.sort.indexOf('l:') === 0 ? (b.lines[PS.sort.slice(2)] || 0) : b[PS.sort]; return (typeof u === 'number' ? u - v : String(u).localeCompare(String(v))) * PS.dir; });
    var bySp = {}; rows.forEach(function(x){ var s = bySp[x.sponsor] = bySp[x.sponsor] || { sponsor: x.sponsor, head: 0, gross: 0, deductions: 0, net: 0, gosiEmployer: 0, lines: {} }; s.head++; ['gross', 'deductions', 'net', 'gosiEmployer'].forEach(function(k){ s[k] += x[k]; }); Object.keys(x.lines).forEach(function(k){ s.lines[k] = (s.lines[k] || 0) + x.lines[k]; }); });
    // month x sponsor: from the people who pass the filters (falls back to the whole month when the server is older)
    var M = PS.metric, MI = { gross: 0, deductions: 1, net: 2, companyCost: 3, gosiEmployer: 5 }[M], cells = {}, sps = {}, pivMonths = r.months, live = !!PS.mm;
    if (live) { pivMonths = PS.mm.months; PS.mm.people.forEach(function(p){ pivMonths.forEach(function(m){ var v = p.m[m]; if (!v) return; var x = asRow(p, m); if (!pass(x)) return; var k = m + '|' + x.sponsor; sps[x.sponsor] = 1; cells[k] = (cells[k] || 0) + (M === 'headcount' ? 1 : v[MI] || 0); }); }); }
    else r.cells.forEach(function(c){ if (Array.isArray(f.sponsor) && f.sponsor.length && f.sponsor.indexOf(c.sponsor) < 0) return; sps[c.sponsor] = 1; cells[c.month + '|' + c.sponsor] = c[M] || 0; });
    sps = r.sponsors.filter(function(s){ return sps[s]; }).concat(Object.keys(sps).filter(function(s){ return r.sponsors.indexOf(s) < 0; }));
    var cell = function(m, s){ return cells[m + '|' + s] || 0; }, fmtV = function(v){ return M === 'headcount' ? String(Math.round(v)) : amt(Math.round(v * 100) / 100); };
    var th = function(k, label, cls){ return '<th class="' + (cls || '') + '" data-s="' + k + '">' + label + (PS.sort === k ? (PS.dir > 0 ? ' ▲' : ' ▼') : '') + '</th>'; };
    top.innerHTML = '<div class="vs-top">' + selBox('vsM', 'vsMonth', r.allMonths.slice().reverse().map(function(m){ return [m, mon(m)]; }), PS.month) +
      '<span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="vsX">' + ph('microsoft-excel-logo') + t('vsExcel') + '</button></div>';
    chipBar(cf, { f: f, dims: PS_DIMS, val: function(k, v){ return k === 'level' ? t(v) : k === 'saudi' ? t(v === 'true' ? 'vsSaudiY' : 'vsSaudiN') : v; }, onChange: draw,
      opts: function(k){ var c = {}; all.forEach(function(x){ var v = rowVal(x, k); if (v === '' || v == null) return; if (!(v in c)) c[v] = 0; if (pass(x, k)) c[v]++; }); return Object.keys(c).sort().map(function(v){ return { value: v, count: c[v] }; }); },
      more: { icon: 'sliders-horizontal', label: 'cfRanges', count: function(){ return ['gFrom', 'gTo', 'nFrom', 'nTo'].filter(function(k){ return f[k] != null && f[k] !== ''; }).length; }, html: function(){ return '<div class="cf-ph"><b>' + t('cfRanges') + '</b></div><div class="cf-set">' + [['gFrom', 'vsGrossFrom'], ['gTo', 'vsGrossTo'], ['nFrom', 'vsNetFrom'], ['nTo', 'vsNetTo']].map(function(x){ return '<label>' + t(x[1]) + '<input data-rg="' + x[0] + '" type="number" inputmode="decimal" dir="ltr" value="' + esc(f[x[0]] == null ? '' : f[x[0]]) + '"></label>'; }).join('') + '</div><div class="cf-pf"><span class="sp"></span><button type="button" class="btn btn-dark btn-sm" data-rgok>' + t('cfApply') + '</button></div>'; },
        wire: function(pop){ $('[data-rgok]', pop).onclick = function(){ $$('[data-rg]', pop).forEach(function(i){ if (i.value === '') delete f[i.dataset.rg]; else f[i.dataset.rg] = i.value; }); cf.__close ? cf.__close() : (pop.hidden = true); draw(); }; } } });
    el.innerHTML =
      K.tiles([[t('vsHead'), String(rows.length), t('vsShown').replace('{n}', rows.length).replace('{t}', all.length), true], [t('vsGross'), amt(sum(rows, 'gross'))], [t('vsDed'), amt(sum(rows, 'deductions'))],
        [t('vsNet'), amt(sum(rows, 'net'))], [t('vsGosiR'), amt(sum(rows, 'gosiEmployer'))]]) +
      '<div class="vs-sub"><h3 class="vs-h">' + t('vsPivot') + '</h3><span class="sp"></span>' + selBox('vsMet', 'vsMetric', [['net', t('vsNet')], ['gross', t('vsGross')], ['deductions', t('vsDed')], ['companyCost', t('vsCost')], ['gosiEmployer', t('vsGosiR')], ['headcount', t('vsHead')]], M) +
        selBox('vsN', 'vsMonths', [6, 12, 24].map(function(x){ return [x, x]; }), PS.n) + '</div>' +
      '<p class="hr-hint">' + t(live ? 'vsPivotLead' : 'vsPivotOld') + '</p>' + (live ? netOnlyNote(PS.mm.netOnlyMonths) : '') +
      '<div class="vs-wrap"><table class="vs-tbl" id="vsPivot"><thead><tr><th>' + t('vsMonth') + '</th>' + sps.map(function(s){ return '<th class="n">' + esc(s) + '</th>'; }).join('') + '<th class="n">' + t('vsTotal') + '</th></tr></thead><tbody>' +
        pivMonths.map(function(m){ var tot = 0; return '<tr><td>' + esc(mon(m)) + '</td>' + sps.map(function(s){ var v = cell(m, s); tot += v; return '<td class="n">' + fmtV(v) + '</td>'; }).join('') + '<td class="n"><b>' + fmtV(tot) + '</b></td></tr>'; }).join('') +
        '</tbody>' + (M === 'headcount' ? '' : '<tfoot><tr><td>' + t('vsTotal') + '</td>' + sps.map(function(s){ return '<td class="n">' + fmtV(pivMonths.reduce(function(a, m){ return a + cell(m, s); }, 0)) + '</td>'; }).join('') +
        '<td class="n">' + fmtV(pivMonths.reduce(function(a, m){ return a + sps.reduce(function(b, s){ return b + cell(m, s); }, 0); }, 0)) + '</td></tr></tfoot>') + '</table></div>' +
      '<h3 class="vs-h">' + t('vsBySponsor') + ' · ' + esc(mon(PS.month)) + '</h3><div class="vs-wrap"><table class="vs-tbl"><thead><tr><th>' + t('vsSponsor') + '</th><th class="n">' + t('vsHead') + '</th>' + spCols.map(function(c){ return '<th class="n">' + colLabel(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        Object.keys(bySp).map(function(k){ var s = bySp[k]; return '<tr class="go" data-sp="' + esc(k) + '"><td>' + esc(k) + '</td><td class="n">' + s.head + '</td>' + spCols.map(function(c){ return colCell(s, c); }).join('') + '</tr>'; }).join('') +
        '</tbody><tfoot><tr><td>' + t('vsTotal') + '</td><td class="n">' + rows.length + '</td>' + spCols.map(function(c){ return colFoot(rows, c); }).join('') + '</tr></tfoot></table></div>' +
      '<h3 class="vs-h">' + t('vsSheet') + ' · ' + t('vsShown').replace('{n}', rows.length).replace('{t}', all.length) + '</h3><div class="vs-wrap"><table class="vs-tbl"><thead><tr>' + th('sponsor', t('vsSponsor')) + th('empNo', t('vsEmpNo')) + th('name', t('vsName')) + th('idNo', t('vsId')) +
        th('department', t('vsDept')) + th('title', t('vsPos')) + th('location', t('vsLoc')) + th('city', t('vsCity')) + th('nationality', t('vsNat')) +
        rowCols.map(function(c){ return th(c, colLabel(c), 'n'); }).join('') + '</tr></thead><tbody>' +
        rows.map(function(x){ return '<tr><td>' + esc(x.sponsor) + '</td><td dir="ltr">' + esc(x.empNo) + '</td><td>' + esc(x.name) + '</td><td dir="ltr">' + esc(x.idNo) + '</td><td>' + esc(x.department) + '</td><td>' + esc(x.title) + '</td><td>' + esc(x.location) + '</td><td>' + esc(x.city) + '</td><td>' + esc(x.nationality) + '</td>' +
          rowCols.map(function(c){ return colCell(x, c); }).join('') + '</tr>'; }).join('') +
        '</tbody><tfoot><tr><td colspan="9">' + t('vsTotal') + '</td>' + rowCols.map(function(c){ return colFoot(rows, c); }).join('') + '</tr></tfoot></table></div>';
    $('#vsM', top).onchange = function(){ PS.month = this.value; load(); };
    $('#vsN', el).onchange = function(){ PS.n = +this.value; load(); };
    $('#vsMet', el).onchange = function(){ PS.metric = this.value; draw(); };
    $$('[data-s]', el).forEach(function(h){ h.onclick = function(){ if (PS.sort === h.dataset.s) PS.dir = -PS.dir; else { PS.sort = h.dataset.s; PS.dir = 1; } draw(); }; });
    $$('[data-sp]', el).forEach(function(tr){ tr.onclick = function(){ PS.f.sponsor = [tr.dataset.sp]; draw(); }; });
    $('#vsX', top).onclick = function(){ exportSheet(rows, lineKeys, sps, pivMonths, cells, live); };
  }
  function exportSheet(rows, lineKeys, sps, pivMonths, cellsNow, live){
    var en = S.lang === 'en', title = t('vsTitle') + ' ' + PS.month;
    var cols = [{ key: 'sponsor', label: t('vsSponsor'), type: 'text' }, { key: 'empNo', label: t('vsEmpNo'), type: 'text' }, { key: 'name', label: t('vsName'), type: 'text' }, { key: 'idNo', label: t('vsId'), type: 'text' },
      { key: 'department', label: t('vsDept'), type: 'text' }, { key: 'title', label: t('vsPos'), type: 'text' }, { key: 'level', label: t('vsLevel'), type: 'text' }, { key: 'employmentType', label: t('vsCat'), type: 'text' },
      { key: 'location', label: t('vsLoc'), type: 'text' }, { key: 'city', label: t('vsCity'), type: 'text' }, { key: 'nationality', label: t('vsNat'), type: 'text' }, { key: 'status', label: t('vsStatus'), type: 'text' }]
      .concat(payCols(lineKeys, true).map(function(c){ return c === 'days' ? { key: 'days', label: t('vsDays'), type: 'num' } : c.indexOf('l:') === 0 ? { key: 'L' + c.slice(2), label: lineName(c.slice(2)), type: 'money', sum: true }
        : { key: c, label: t({ gross: 'vsGross', deductions: 'vsDed', net: 'vsNet' }[c]), type: 'money', sum: true }; }))
      .concat([{ key: 'gosiEmployer', label: t('vsGosiR'), type: 'money', sum: true }]);
    var flat = function(list){ return list.map(function(x){ var o = Object.assign({}, x, { level: t(level(x.title)) }); lineKeys.forEach(function(k){ o['L' + k] = x.lines[k] || 0; }); delete o.lines; return o; }); };
    var pivotCols = [{ key: 'month', label: t('vsMonth'), type: 'text' }].concat(sps.map(function(s, i){ return { key: 's' + i, label: s, type: 'money', sum: true }; })).concat([{ key: 'total', label: t('vsTotal'), type: 'money', sum: true }]);
    var pivot = function(metric){ var MI = { gross: 0, deductions: 1, net: 2, companyCost: 3 }[metric], c = {};
      if (live) PS.mm.people.forEach(function(p){ pivMonths.forEach(function(m){ var v = p.m[m]; if (!v) return; var x = asRow(p, m); if (pass(x)) c[m + '|' + x.sponsor] = (c[m + '|' + x.sponsor] || 0) + (v[MI] || 0); }); });
      else PS.pv.cells.forEach(function(x){ c[x.month + '|' + x.sponsor] = x[metric] || 0; });
      return pivMonths.map(function(m){ var o = { month: m }, tt = 0; sps.forEach(function(s, i){ var v = Math.round((c[m + '|' + s] || 0) * 100) / 100; o['s' + i] = v; tt += v; }); o.total = Math.round(tt * 100) / 100; return o; }); };
    var sheets = [{ name: xlName(t('vsSheet')), title: title, columns: cols, rows: flat(rows) },
      { name: xlName(t('vsPivot') + ' ' + t('vsNet')), title: t('vsPivot') + ' · ' + t('vsNet'), columns: pivotCols, rows: pivot('net') },
      { name: xlName(t('vsPivot') + ' ' + t('vsGross')), title: t('vsPivot') + ' · ' + t('vsGross'), columns: pivotCols, rows: pivot('gross') },
      { name: xlName(t('vsPivot') + ' ' + t('vsCost')), title: t('vsPivot') + ' · ' + t('vsCost'), columns: pivotCols, rows: pivot('companyCost') }];
    var seen = {}; uniq(rows, 'sponsor').forEach(function(s){ var n = xlName(s), i = 2; while (seen[n]) n = xlName(s).slice(0, 27) + ' ' + i++; seen[n] = 1; sheets.push({ name: n, title: s + ' · ' + PS.month, columns: cols, rows: flat(rows.filter(function(x){ return x.sponsor === s; })) }); });
    loadScript('js/xl.js').then(function(){ return XL.download({ fileName: 'PAYROLL_' + PS.month + '_ALL_SPONSORS', title: title, lang: en ? 'en' : 'ar', company: coName(), by: S.me.name, logo: logoInk(), filters: xlFilters(PS.f), sheets: sheets }); })
      .then(function(){ toast(t('v2Exported')); }, function(){ toast(errText('network')); });
  }
  load();
}

// ======================================================================= variance: smart findings, extra charts, print report (2026-11-19)
Object.assign(T.ar, { viTitle:'ما يلفت الانتباه', viLead:'ملاحظات مكتوبة من الأرقام نفسها بعد الفلاتر. اضغط "اعرض" لتصفية القائمة.', viShow:'اعرض',
  viDriver:'أكبر سبب لتغير رواتب المستمرين هو {d}: {a} ({p}% من تغيرهم).', viDim:'{d} هي الأكثر تغيرا: {a} ({p}% من حركة الإدارات كلها، زيادات ونقص).',
  viConc:'{n} موظفين فقط يفسرون {p}% من حركة الرواتب كلها (زيادات ونقص).', viJoin:'{n} منضمين أضافوا {a} للصافي.', viLeave:'{n} مغادرين خفضوا الصافي {a}.',
  viReview:'{n} موظفين عليهم ملاحظات تحتاج مراجعة (يختلف عن العقد، قفزة خصومات، صافي صفر، مدفوع وهو موقوف).', viBig:'{n} موظفين تغير صافيهم أكثر من 25%.',
  viRate:'متوسط الصافي للموظف {w} من {a} إلى {b}.', viRise:'ارتفع', viFall:'انخفض', viTrendUp:'الصافي يرتفع للشهر {n} على التوالي ({a} منذ {m}).', viTrendDn:'الصافي ينخفض للشهر {n} على التوالي ({a} منذ {m}).',
  viNone:'لا شيء لافت في هذه المقارنة.', viTm:'المؤشر', viAvgHead:'متوسط الصافي للموظف', vaLinesMv:'بنود الراتب الأكثر تغيرا', vaLinesMvLead:'أكبر الفروقات بين الأساس والشهر.',
  vaHeat:'الإدارات × أسباب التغير', vaHeatLead:'أحمر = زيادة، أزرق = نقص، والأغمق أكبر. الصف الأخير هو الإجمالي.', vaDist:'توزيع نسب التغير', vaDistLead:'عدد الموظفين المستمرين حسب نسبة تغير صافيهم.',
  vaPrint:'طباعة التقرير', prKind:'تقرير فروقات الرواتب', prTitle:'تحليل فروقات الرواتب: {m} مقابل {b}', prSummary:'الخلاصة', prKpi:'المؤشرات', prFilters:'الفلاتر المطبقة', prNoFilters:'بدون فلاتر: كل الموظفين',
  prTop:'أكبر الزيادات', prBottom:'أكبر الانخفاضات', prFlagged:'موظفون يحتاجون مراجعة', prFoot:'تقرير من بصمة. كل الأرقام من مسيرات الرواتب المقفلة بعد الفلاتر المذكورة.', prSignPay:'مسؤول الرواتب', prSignFin:'المدير المالي', prSignCeo:'الاعتماد' });
Object.assign(T.en, { viTitle:'What stands out', viLead:'Findings written from the numbers themselves, after the filters. Tap "Show" to filter the list.', viShow:'Show',
  viDriver:'The biggest cause of change for continuing staff is {d}: {a} ({p}% of their change).', viDim:'{d} changed the most: {a} ({p}% of all department movement, up and down).',
  viConc:'Just {n} people explain {p}% of all pay movement (up and down).', viJoin:'{n} joiners added {a} to net.', viLeave:'{n} leavers took {a} off net.',
  viReview:'{n} people carry notes that need a look (off contract, deductions spike, net zero, paid while disabled).', viBig:'{n} people\'s net changed by more than 25%.',
  viRate:'Average net per person {w} from {a} to {b}.', viRise:'rose', viFall:'fell', viTrendUp:'Net has risen {n} months in a row ({a} since {m}).', viTrendDn:'Net has fallen {n} months in a row ({a} since {m}).',
  viNone:'Nothing stands out in this comparison.', viTm:'Measure', viAvgHead:'Average net per person', vaLinesMv:'Pay lines that moved most', vaLinesMvLead:'The largest differences between the base and the month.',
  vaHeat:'Departments × causes of change', vaHeatLead:'Red = increase, blue = decrease, darker = larger. The last row is the total.', vaDist:'How big the changes are', vaDistLead:'Continuing staff by the % change in their net.',
  vaPrint:'Print report', prKind:'Payroll variance report', prTitle:'Payroll variance: {m} against {b}', prSummary:'Summary', prKpi:'Key figures', prFilters:'Filters applied', prNoFilters:'No filters: everyone',
  prTop:'Largest increases', prBottom:'Largest decreases', prFlagged:'People to review', prFoot:'Report from BASMA. Every figure comes from locked payroll runs after the filters shown.', prSignPay:'Payroll officer', prSignFin:'Finance manager', prSignCeo:'Approval' });
var VA_REVIEW = ['off_package', 'deductions_spike', 'net_zero', 'paid_inactive'];
// hire date, days worked and the reason for each change, per person (owner 2026-11-20: "need to see all data as the hiring
// date, the reason of the increases, days working comparison")
Object.assign(T.ar, { wyPkgNote:'الراتب الجديد من {d}: {r} (اعتمده {b})', wyNoReason:'بدون سبب مسجل', vaHire:'تاريخ التعيين', vaDaysCol:'أيام العمل', vaWhy:'سبب التغير', wyNew:'تعيين جديد في {d}', wyPartial:'شهر جزئي: {n} يوم مدفوع', wyLeft:'لم يُصرف له هذا الشهر (غادر أو أُوقف)',
  wyBack:'عاد بعد انقطاع', wyDays:'أيام العمل {a} → {b}', wyPkg:'تغير الراتب الثابت (عقد أو باقة جديدة)', wyNone:'بدون تغير', wyNetOnly:'صافي فقط هذا الشهر: لا تفصيل للبنود' });
Object.assign(T.en, { wyPkgNote:'New pay from {d}: {r} (approved by {b})', wyNoReason:'no reason recorded', vaHire:'Hire date', vaDaysCol:'Days worked', vaWhy:'Reason for the change', wyNew:'New hire on {d}', wyPartial:'Part month: {n} days paid', wyLeft:'Not paid this month (left or stopped)',
  wyBack:'Back after a break', wyDays:'Days worked {a} → {b}', wyPkg:'Fixed pay changed (new contract or package)', wyNone:'No change', wyNetOnly:'Net only this month: no line breakdown' });
function vaDays(p){ var a = p.base ? p.base.days : null, b = p.cur ? p.cur.days : null; return { base: a, cur: b, diff: a != null && b != null ? Math.round((b - a) * 100) / 100 : null }; }
/** The reasons behind one person's change, most important first, as plain sentences (no server call: lines and flags are in the answer). */
function vaWhy(p, netOnly){
  var out = [], d = vaDays(p), f = p.flags || [];
  if (f.indexOf('joiner') >= 0) { out.push(t('wyNew').replace('{d}', p.hireDate || '-')); if (d.cur != null && d.cur > 0 && d.cur < 28) out.push(t('wyPartial').replace('{n}', d.cur)); }
  if (f.indexOf('returner') >= 0) out.push(t('wyBack'));
  if (f.indexOf('leaver') >= 0) out.push(t('wyLeft'));
  if (p.cur && p.base) {
    if (d.diff) out.push(t('wyDays').replace('{a} → {b}', '⁦' + d.base + ' → ' + d.cur + '⁩'));
    if (f.indexOf('package_change') >= 0) { out.push(t('wyPkg')); var pn = p.pkgNote; if (pn && (pn.from || pn.reason || pn.by)) out.push(t('wyPkgNote').replace('{d}', pn.from || '-').replace('{r}', pn.reason || t('wyNoReason')).replace('{b}', pn.by || '-')); }
    if (netOnly) out.push(t('wyNetOnly'));
    else (p.reasons || []).slice(0, 4).forEach(function(x){ out.push(lineName(x.line) + ': ⁦' + acctFmt(x.from) + ' → ' + acctFmt(x.to) + ' (' + sgn(x.effect) + ')⁩'); });
  }
  return out.length ? out : [t('wyNone')];
}
/** Plain-language findings from one variance answer; each may carry the filter that shows the people behind it. */
function vaInsights(r){
  var out = [], T0 = r.totals, tot = r.people.reduce(function(a, p){ return a + Math.abs(p.net.diff || 0); }, 0) || 1, netOnly = (r.netOnlyMonths || []).length > 0, b = r.bridge;
  var pct = function(x, of){ return Math.round(Math.abs(x) / (of || tot) * 100); };
  var stay = r.people.filter(function(p){ return p.cur && p.base; });
  if (!netOnly) { var D = r.drivers, ks = Object.keys(D).filter(function(k){ return D[k]; }).sort(function(a, c){ return Math.abs(D[c]) - Math.abs(D[a]); });
    if (ks.length && Math.abs(b.stayers) > 0.5) out.push({ ic: 'lightning', s: t('viDriver').replace('{d}', t('dv_' + ks[0])).replace('{a}', sgn(D[ks[0]])).replace('{p}', pct(D[ks[0]], Math.abs(b.stayers) || 1)) }); }
  var dep = (r.dims.department || []).slice().sort(function(a, c){ return Math.abs(c.net.diff) - Math.abs(a.net.diff); })[0];
  var depMove = (r.dims.department || []).reduce(function(a, d){ return a + Math.abs(d.net.diff || 0); }, 0) || 1;
  if (dep && Math.abs(dep.net.diff) > 0.5 && (r.dims.department || []).length > 1) out.push({ ic: 'buildings', s: t('viDim').replace('{d}', esc(dep.key)).replace('{a}', sgn(dep.net.diff)).replace('{p}', pct(dep.net.diff, depMove)), f: { department: [dep.key] } });
  var byAbs = r.people.slice().sort(function(a, c){ return Math.abs(c.net.diff) - Math.abs(a.net.diff); }), cum = 0, n = 0;
  for (var i = 0; i < byAbs.length && n < 10; i++) { cum += Math.abs(byAbs[i].net.diff); n++; if (cum / tot >= 0.8) break; }
  if (r.people.length > 8 && n <= Math.max(3, r.people.length / 5) && cum > 0.5) out.push({ ic: 'target', s: t('viConc').replace('{n}', n).replace('{p}', Math.min(100, Math.round(cum / tot * 100))) });
  var jn = r.people.filter(function(p){ return p.cur && !p.base; }).length, lv = r.people.filter(function(p){ return !p.cur && p.base; }).length;
  if (jn) out.push({ ic: 'user-plus', s: t('viJoin').replace('{n}', jn).replace('{a}', sgn(b.joiners)), f: { flags: ['joiner', 'returner'] } });
  if (lv) out.push({ ic: 'user-minus', s: t('viLeave').replace('{n}', lv).replace('{a}', sgn(b.leavers)), f: { flags: ['leaver'] } });
  var rev = r.people.filter(function(p){ return p.flags.some(function(f){ return VA_REVIEW.indexOf(f) >= 0; }); }).length;
  if (rev) out.push({ ic: 'warning', sev: 1, s: t('viReview').replace('{n}', rev), f: { flags: VA_REVIEW.slice() } });
  var big = stay.filter(function(p){ return p.net.pct != null && Math.abs(p.net.pct) > 25; }).length;
  if (big) out.push({ ic: 'arrows-out-line-vertical', s: t('viBig').replace('{n}', big), f: { changed: true } });
  var vr = r.volumeRate || {}; if (vr.avgBefore && Math.abs(vr.avgNow - vr.avgBefore) >= 1) out.push({ ic: 'user', s: t('viRate').replace('{w}', t(vr.avgNow > vr.avgBefore ? 'viRise' : 'viFall')).replace('{a}', acctFmt(vr.avgBefore)).replace('{b}', acctFmt(vr.avgNow)) });
  var tr = (r.trend || []).filter(function(p){ return !p.none; });
  if (tr.length >= 3) { var dir = 0, run = 0; for (var j = tr.length - 1; j > 0; j--) { var d = tr[j].net - tr[j - 1].net, s = d > 0.5 ? 1 : d < -0.5 ? -1 : 0; if (!s || (dir && s !== dir)) break; dir = s; run++; }
    if (run >= 2) out.push({ ic: dir > 0 ? 'trend-up' : 'trend-down', s: t(dir > 0 ? 'viTrendUp' : 'viTrendDn').replace('{n}', run).replace('{a}', sgn(tr[tr.length - 1].net - tr[tr.length - 1 - run].net)).replace('{m}', mon(tr[tr.length - 1 - run].month)) }); }
  return out;
}
/** Department x driver heatmap: diverging colour (red up, blue down) scaled to the largest cell; a total row at the end. */
function vaHeat(rows, keys){
  if (!rows.length || !keys.length) return '<p class="hr-hint">-</p>';
  var mx = 1; rows.forEach(function(r){ keys.forEach(function(k){ mx = Math.max(mx, Math.abs(r.drivers[k] || 0)); }); });
  var cell = function(v){ v = Math.round((v || 0) * 100) / 100; if (!v) return '<td class="n vh0">-</td>'; var a = Math.min(1, Math.abs(v) / mx), mix = Math.round(10 + a * 55);
    return '<td class="n" style="background:color-mix(in srgb,var(' + (v > 0 ? '--vs-up' : '--vs-dn') + ') ' + mix + '%,var(--card));' + (mix > 45 ? 'color:#fff' : '') + '" title="' + esc(sgn(v)) + '">' + '<bdi dir="ltr">' + sgn(v) + '</bdi>' + '</td>'; };
  var tot = {}; keys.forEach(function(k){ tot[k] = rows.reduce(function(a, r){ return a + (r.drivers[k] || 0); }, 0); });
  return '<div class="vs-wrap"><table class="vs-tbl vs-heat"><thead><tr><th>' + t('vsDept') + '</th>' + keys.map(function(k){ return '<th class="n">' + t('dv_' + k) + '</th>'; }).join('') + '<th class="n">' + t('vaChg') + '</th></tr></thead><tbody>' +
    rows.map(function(r){ return '<tr class="go" data-hv="' + esc(r.key) + '"><td>' + esc(r.key) + '</td>' + keys.map(function(k){ return cell(r.drivers[k]); }).join('') + '<td class="n"><b>' + '<bdi dir="ltr">' + sgn(r.net.diff) + '</bdi>' + '</b></td></tr>'; }).join('') +
    '</tbody><tfoot><tr><td>' + t('vsTotal') + '</td>' + keys.map(function(k){ return '<td class="n">' + '<bdi dir="ltr">' + sgn(tot[k]) + '</bdi>' + '</td>'; }).join('') + '<td class="n">' + sgn(rows.reduce(function(a, r){ return a + r.net.diff; }, 0)) + '</td></tr></tfoot></table></div>';
}
var VA_BINS = [[-Infinity, -20, '< −20%'], [-20, -10, '−20…−10%'], [-10, -2, '−10…−2%'], [-2, 2, '±2%'], [2, 10, '+2…+10%'], [10, 20, '+10…+20%'], [20, Infinity, '> +20%']];
function vaDist(stay){
  var c = VA_BINS.map(function(){ return 0; });
  stay.forEach(function(p){ var x = p.net.pct == null ? 0 : p.net.pct; for (var i = 0; i < VA_BINS.length; i++) if (x >= VA_BINS[i][0] && x < VA_BINS[i][1]) { c[i]++; break; } });
  return VA_BINS.map(function(bn, i){ return { label: bn[2], value: c[i], alt: i < 3, tip: bn[2] + ': ' + c[i] }; });
}
/** A static SVG line for the print report (no hover, no animation). */
function vaPrintLine(pts){
  if (pts.length < 2) return '';
  var W = 640, H = 170, L = 56, R = 12, Tt = 12, B = 26, mx = Math.max.apply(null, pts.map(function(p){ return p.y; }).concat([1])), mn = Math.min.apply(null, pts.map(function(p){ return p.y; }).concat([0]));
  mn = Math.min(0, mn); var x = function(i){ return L + i * (W - L - R) / (pts.length - 1); }, y = function(v){ return Tt + (H - Tt - B) * (1 - (v - mn) / ((mx - mn) || 1)); };
  var d = pts.map(function(p, i){ return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.y).toFixed(1); }).join(' ');
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto" dir="ltr"><g font-size="9" fill="#6B786D">' + [mx, (mx + mn) / 2, mn].map(function(v){ var yy = y(v); return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '" stroke="#E6E9E6"/><text x="' + (L - 6) + '" y="' + (yy + 3) + '" text-anchor="end">' + acctFmt(Math.round(v)) + '</text>'; }).join('') +
    pts.map(function(p, i){ return '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(p.label) + '</text>'; }).join('') + '</g><path d="' + d + '" fill="none" stroke="#2F5134" stroke-width="2"/>' +
    pts.map(function(p, i){ return '<circle cx="' + x(i) + '" cy="' + y(p.y) + '" r="3" fill="#2F5134"/>'; }).join('') + '</svg>';
}
function vaPrintBars(items){
  var mx = Math.max.apply(null, items.map(function(i){ return Math.abs(i.value || 0); }).concat([1]));
  return '<table class="tb pbars"><tbody>' + items.map(function(i){ var w = Math.abs(i.value || 0) / mx * 100, up = (i.value || 0) > 0;
    return '<tr><td style="width:34%">' + esc(i.label) + '</td><td><div style="display:grid;grid-template-columns:1fr 1fr;direction:ltr"><div style="display:flex;justify-content:flex-end;border-right:1px solid #B9C0BA">' + (up ? '' : '<i style="display:block;height:10px;width:' + w + '%;background:#2a78d6;border-radius:3px 0 0 3px"></i>') + '</div><div>' + (up ? '<i style="display:block;height:10px;width:' + w + '%;background:#e34948;border-radius:0 3px 3px 0"></i>' : '') + '</div></div></td><td class="n" style="width:18%">' + sgn(i.value) + '</td></tr>'; }).join('') + '</tbody></table>';
}
/** The printable report: A4, the shared document kit (letterhead, page numbers, footer), charts drawn as static SVG. */
function printVar(r){
  if (!window.Doc) return loadScript('js/doc.js').then(function(){ printVar(r); });
  var lang = S.lang === 'en' ? 'en' : 'ar', T0 = r.totals, b = r.bridge, netOnly = (r.netOnlyMonths || []).length > 0, ins = vaInsights(r);
  var kv = function(lbl, v, c){ return '<div><dt>' + esc(lbl) + '</dt><dd class="num">' + v + (c ? ' <small style="font-weight:400;color:#6B786D">' + c + '</small>' : '') + '</dd></div>'; };
  var cTxt = function(c){ return c && c.diff ? sgn(c.diff) + (c.pct != null ? ' (' + (c.diff > 0 ? '+' : '−') + Math.abs(c.pct) + '%)' : '') : '0'; };
  var steps = [['dv_joiners', b.joiners], ['dv_leavers', b.leavers]].concat(netOnly ? [['vaStayers', b.stayers]] : Object.keys(r.drivers).filter(function(k){ return r.drivers[k]; }).map(function(k){ return ['dv_' + k, r.drivers[k]]; }));
  var stay = r.people.filter(function(p){ return p.cur && p.base && p.net.diff; }).sort(function(a, c){ return c.net.diff - a.net.diff; });
  var ptab = function(list){ return '<table class="tb"><thead><tr><th>' + t('vsEmpNo') + '</th><th>' + t('vsName') + '</th><th>' + t('vsDept') + '</th><th class="n">' + esc(vaL('base')) + '</th><th class="n">' + esc(vaL('now')) + '</th><th class="n">' + t('vaChg') + '</th><th>' + t('vaHire') + '</th><th class="n">' + t('vaDaysCol') + '</th><th>' + t('vaWhy') + '</th></tr></thead><tbody>' +
    list.map(function(p){ var dd = vaDays(p); return '<tr><td class="num">' + esc(p.empNo) + '</td><td>' + esc(p.name) + '</td><td>' + esc(p.dims.department) + '</td><td class="n num">' + acctFmt(p.base ? p.base.net : 0) + '</td><td class="n num">' + acctFmt(p.cur ? p.cur.net : 0) + '</td><td class="n num">' + sgn(p.net.diff) + '</td><td class="num">' + esc(p.hireDate || '-') + '</td><td class="n num">' + (dd.base == null ? '-' : dd.base) + ' → ' + (dd.cur == null ? '-' : dd.cur) + '</td><td><small style="color:#15201A;font-size:8pt">' + vaWhy(p, netOnly).map(esc).join('<br>') + '</small></td></tr>'; }).join('') + '</tbody></table>'; };
  var dtab = function(k, lbl){ var rows = (r.dims[k] || []).slice(0, 15); return '<table class="tb"><thead><tr><th>' + lbl + '</th><th class="n">' + t('vsHead') + '</th><th class="n">' + esc(vaL('base')) + '</th><th class="n">' + esc(vaL('now')) + '</th><th class="n">' + t('vaChg') + '</th><th class="n">' + t('vaShare') + '</th></tr></thead><tbody>' +
    rows.map(function(d){ return '<tr><td>' + esc(dimVal(k, d.key)) + '</td><td class="n num">' + d.headCur + '</td><td class="n num">' + acctFmt(d.netBase) + '</td><td class="n num">' + acctFmt(d.netCur) + '</td><td class="n num">' + sgn(d.net.diff) + '</td><td class="n num">' + (d.shareCur || 0) + '%</td></tr>'; }).join('') +
    '</tbody><tfoot><tr><td>' + t('vsTotal') + '</td><td class="n num">' + T0.headcount.cur + '</td><td class="n num">' + acctFmt(T0.net.base) + '</td><td class="n num">' + acctFmt(T0.net.cur) + '</td><td class="n num">' + sgn(T0.net.change.diff) + '</td><td class="n">100%</td></tr></tfoot></table>'; };
  var flagged = r.people.filter(function(p){ return p.flags.length; }).slice(0, 30);
  var fl = xlFilters(VA.f);
  var tr = (r.trend || []).filter(function(p){ return !p.none; });
  var body =
    '<section><div class="grid c4">' + kv(t('vsHead'), T0.headcount.cur, cTxt(T0.headcount.change)) + kv(t('vsNet'), acctFmt(T0.net.cur), cTxt(T0.net.change)) +
      kv(t('vsGross'), acctFmt(T0.gross.cur), netOnly ? t('vaNA') : cTxt(T0.gross.change)) + kv(t('vsCost'), acctFmt(T0.companyCost.cur), netOnly ? t('vaNA') : cTxt(T0.companyCost.change)) + '</div></section>' +
    (netOnly ? '<section><p class="note warn">' + esc(t('vaNetOnly').replace('{m}', r.netOnlyMonths.map(mon).join('، '))) + '</p></section>' : '') +
    '<section><h2 class="sh">' + t('prSummary') + '</h2><p>' + esc(t('vaStory1').replace('{now}', vaL('now')).replace('{net}', acctFmt(T0.net.cur))) + ' ' + esc(T0.net.change.diff ? t(T0.net.change.diff > 0 ? 'vaStoryUp' : 'vaStoryDown').replace('{d}', acctFmt(Math.abs(T0.net.change.diff))).replace('{p}', T0.net.change.pct == null ? '' : '(' + Math.abs(T0.net.change.pct) + '%)') : t('vaStorySame')) + ' ' + esc(t('vaStoryCmp').replace('{base}', vaL('base'))) + '</p>' +
      (ins.length ? '<ul style="margin:6px 0 0;padding-inline-start:18px">' + ins.map(function(x){ return '<li>' + x.s + '</li>'; }).join('') + '</ul>' : '') + '</section>' +
    '<section><h2 class="sh">' + t('prFilters') + '</h2><p style="margin:0">' + (fl.length ? fl.map(function(x){ return esc(x[0]) + ': ' + esc(x[1]); }).join(' · ') : t('prNoFilters')) + ' · ' + t('vaBaseIs') + ': ' + esc((r.baseMonths || []).map(mon).join('، ')) + '</p></section>' +
    (tr.length > 1 ? '<section><h2 class="sh">' + t('vaTrend') + '</h2>' + vaPrintLine(tr.map(function(p){ return { label: mon(p.month), y: p.net }; })) + '</section>' : '') +
    '<section><h2 class="sh">' + t('vaBridge') + '</h2><p style="margin:0 0 4px">' + esc(t('vaBridgeLead').replace('{a}', acctFmt(b.from)).replace('{b}', acctFmt(b.to))) + '</p>' + vaPrintBars(steps.map(function(s){ return { label: t(s[0]), value: s[1] }; })) + '</section>' +
    '<section><h2 class="sh">' + t('vsSponsor') + '</h2>' + dtab('payGroup', t('vsSponsor')) + '</section>' +
    '<section><h2 class="sh">' + t('vsDept') + '</h2>' + dtab('department', t('vsDept')) + '</section>' +
    (stay.length ? '<section><h2 class="sh">' + t('prTop') + '</h2>' + ptab(stay.slice(0, 10)) + '</section><section><h2 class="sh">' + t('prBottom') + '</h2>' + ptab(stay.slice(-10).reverse().filter(function(p){ return p.net.diff < 0; })) + '</section>' : '') +
    (netOnly ? '' : '<section><h2 class="sh">' + t('vaLines') + '</h2><table class="tb"><thead><tr><th>' + t('vaLines') + '</th><th class="n">' + esc(vaL('base')) + '</th><th class="n">' + esc(vaL('now')) + '</th><th class="n">' + t('vaChg') + '</th></tr></thead><tbody>' +
      r.lines.slice().sort(function(a, c){ return lineRank(a.code) - lineRank(c.code); }).map(function(l){ return '<tr><td>' + esc(lineName(l.code)) + (l.code.indexOf('d:') === 0 ? ' (-)' : '') + '</td><td class="n num">' + acctFmt(l.base) + '</td><td class="n num">' + acctFmt(l.cur) + '</td><td class="n num">' + sgn(l.change.diff) + '</td></tr>'; }).join('') + '</tbody></table></section>') +
    (flagged.length ? '<section><h2 class="sh">' + t('prFlagged') + '</h2><table class="tb"><thead><tr><th>' + t('vsEmpNo') + '</th><th>' + t('vsName') + '</th><th class="n">' + t('vaChg') + '</th><th>' + t('vaFlags') + '</th></tr></thead><tbody>' +
      flagged.map(function(p){ return '<tr><td class="num">' + esc(p.empNo) + '</td><td>' + esc(p.name) + '</td><td class="n num">' + sgn(p.net.diff) + '</td><td>' + p.flags.map(function(f){ return esc(t('fl_' + f)); }).join('، ') + '</td></tr>'; }).join('') + '</tbody></table></section>' : '');
  Doc.open({ lang: lang, kind: t('prKind'), title: t('prTitle').replace('{m}', vaL('now')).replace('{b}', vaL('base')), ref: 'VAR-' + r.month, body: body,
    extraCss: 'table.pbars td{border-bottom:1px solid #F1EEE6;padding:4px 8px}table.pbars tr:nth-child(even) td{background:none}', by: S.me ? S.me.name : '', footnote: t('prFoot'),
    qr: 'VAR|' + r.month + '|' + (r.baseMonths || []).join('+') + '|' + T0.net.cur.toFixed(2), signatures: [Doc.bi(T.ar.prSignPay, T.en.prSignPay, lang), Doc.bi(T.ar.prSignFin, T.en.prSignFin, lang), Doc.bi(T.ar.prSignCeo, T.en.prSignCeo, lang)] });
}

// ======================================================================= variance analysis
var VA = { month: '', compare: 'm1', pct: 10, min: 100, f: {}, dim: 'payGroup', limit: 200 };
var VA_DIMS = DIMS.concat([['flags', 'vaFlags']]);
function varianceSection(body){
  var box = K.head(body, 'vaTitle2', 'vaLead2');
  box.innerHTML = '<div id="vaTop"></div><div class="vs-cfh" id="vaCf"></div><div id="vaBox"></div>'; var el = $('#vaBox', box), top = $('#vaTop', box), cf = $('#vaCf', box), R = null;
  function load(){
    K.busy(el);
    api('payrollVarianceMonth', { month: VA.month || undefined, compare: VA.compare, pct: VA.pct, min: VA.min, filters: serverFilters(VA.f) }, true).then(function(r){
      if (!el.isConnected) return; if (!r.ok) return el.innerHTML = K.bad(r.error); if (r.empty) return el.innerHTML = K.empty('chart-line-up', t('vsNone'));
      R = r; VA.r = r; VA.month = r.month; draw();
    });
  }
  function draw(){
    var r = R, T0 = r.totals, b = r.bridge, D = r.drivers, netOnly = (r.netOnlyMonths || []).length > 0;
    var dimRows = r.dims[VA.dim] || [];
    var nc = T0.net.change || {}, up = (nc.diff || 0) >= 0, jn = 0, lv = 0; (r.dims.payGroup || []).forEach(function(d){ jn += d.joiners || 0; lv += d.leavers || 0; });
    var other = Math.round(((nc.diff || 0) - (b.joiners || 0) - (b.leavers || 0)) * 100) / 100;
    top.innerHTML = '<div class="vs-top">' + selBox('vaM', 'vsMonth', r.months.map(function(m){ return [m, mon(m)]; }), r.month) +
      selBox('vaC', 'vaCmp', [['m1', t('vaM1')], ['m2', t('vaM2')], ['avg3', t('vaAvg3')], ['avg6', t('vaAvg6')], ['avg12', t('vaAvg12')], ['yoy', t('vaYoy')], ['pick', t('vaPick')]].concat(r.months.filter(function(m){ return m !== r.month; }).map(function(m){ return [m, mon(m)]; })),
        String(r.compare).indexOf('pick:') === 0 ? 'pick' : r.compare) +
      '<span class="sp"></span><button type="button" class="btn btn-line btn-sm" id="vaPr">' + ph('printer') + t('vaPrint') + '</button><button type="button" class="btn btn-dark btn-sm" id="vaX">' + ph('microsoft-excel-logo') + 'Excel</button></div>' +
      (function(){ var picked = String(r.compare).indexOf('pick:') === 0 ? r.baseMonths : [], open = VA.picking || picked.length, earlier = r.months.filter(function(m){ return m < r.month; });
        return (open ? '<div class="vs-pick" id="vaPk"><p>' + t('vaPickLead') + '</p><div class="vs-pick-m">' + earlier.map(function(m){ return '<label><input type="checkbox" value="' + m + '"' + (picked.indexOf(m) >= 0 ? ' checked' : '') + '><span>' + esc(mon(m)) + '</span></label>'; }).join('') + '</div>' +
          '<div class="btnrow"><button type="button" class="btn btn-line btn-sm" data-pk="all">' + t('vaPickAll') + '</button><button type="button" class="btn btn-line btn-sm" data-pk="none">' + t('vaPickNone') + '</button><button type="button" class="btn btn-dark btn-sm" id="vaPkGo">' + t('vaPickGo') + '</button></div></div>' : '') +
          '<p class="vs-base">' + t('vaBaseIs') + ': <b>' + (r.baseMonths || []).map(function(m){ return esc(mon(m)); }).join('، ') + '</b>' + ((r.baseMonths || []).length > 1 ? ' (' + t('vaAvgWord') + ')' : '') + '</p>'; })();
    chipBar(cf, { f: VA.f, dims: VA_DIMS, val: dimVal, onChange: load, toggles: [['changed', 'vaChanged']],
      opts: function(k){ return k === 'flags' ? Object.keys(r.flagCounts).sort().map(function(x){ return { value: x, count: r.flagCounts[x] }; }) : (r.options[k] || []); },
      more: { icon: 'sliders-horizontal', label: 'cfSettings', html: function(){ return '<div class="cf-ph"><b>' + t('cfSettings') + '</b></div><div class="cf-set"><p class="hr-hint" style="margin:0">' + t('cfSetLead') + '</p>' +
          '<label>' + t('vaPct') + '<input id="vaP" type="number" dir="ltr" value="' + r.threshold.pct + '"></label><label>' + t('vaMin') + '<input id="vaN" type="number" dir="ltr" value="' + r.threshold.min + '"></label>' +
          '<button type="button" class="btn btn-line btn-sm" id="vaCity">' + ph('map-pin') + t('vaCities') + '</button></div><div class="cf-pf"><span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="vaSetOk">' + t('cfApply') + '</button></div>'; },
        wire: function(pop){ $('#vaCity', pop).onclick = function(){ cf.__close(); cities(); };
          $('#vaSetOk', pop).onclick = function(){ var p = +$('#vaP', pop).value, n = $('#vaN', pop).value; VA.pct = p > 0 ? p : 10; VA.min = n === '' ? 100 : +n; cf.__close(); load(); }; } } });
    // the story in one paragraph: how net moved and why
    var story = '<div class="vs-story"><p class="vs-lead">' + t('vaStory1').replace('{now}', '<b>' + esc(vaL('now')) + '</b>').replace('{net}', '<b class="num">' + acctFmt(T0.net.cur) + '</b>') + ' ' +
      (nc.diff ? t(up ? 'vaStoryUp' : 'vaStoryDown').replace('{d}', '<b class="num">' + acctFmt(Math.abs(nc.diff)) + '</b>').replace('{p}', nc.pct == null ? '' : '(' + Math.abs(Math.round(nc.pct * 10) / 10) + '%)') : t('vaStorySame')) + ' ' + t('vaStoryCmp').replace('{base}', '<b>' + esc(vaL('base')) + '</b>') +
      (r.shown < r.all ? ' <small class="hr-hint">' + t('vaStoryFilt').replace('{n}', r.shown).replace('{t}', r.all) + '</small>' : '') + '</p>' +
      '<ul class="vs-why"><li><span>' + t('vaWhyJoin').replace('{n}', jn) + '</span><b class="num">' + sgn(b.joiners) + '</b></li>' +
      '<li><span>' + t('vaWhyLeave').replace('{n}', lv) + '</span><b class="num">' + sgn(b.leavers) + '</b></li>' +
      '<li><span>' + t('vaWhyPay') + '</span><b class="num">' + sgn(other) + '</b></li></ul></div>';
    var na = function(c){ return netOnly ? '<small>' + t('vaNA') + '</small>' : chg(c); };
    // charts
    var tr = (r.trend || []).filter(function(p){ return !p.none; });
    // trend: one measure at a time on one axis (net, gross, deductions, cost, headcount, average net per person); net-only months
    // drop out of the gross / deductions / cost lines instead of showing net as if it were gross
    var TM = [['net', 'vsNet'], ['gross', 'vsGross'], ['deductions', 'vsDed'], ['companyCost', 'vsCost'], ['headcount', 'vsHead'], ['avg', 'viAvgHead']], tm = VA.tm || 'net';
    var tv = function(p){ return tm === 'avg' ? (p.headcount ? Math.round(p.net / p.headcount * 100) / 100 : 0) : p[tm] || 0; };
    var trP = tr.filter(function(p){ return !(p.netOnly && ['gross', 'deductions', 'companyCost'].indexOf(tm) >= 0); });
    var trendCard = card('vaTr', t('vaTrend'), seg('vaTm', TM.map(function(x){ return [x[0], t(x[1])]; }), tm), trP.length > 1 && V() ? V().lineChart(trP.map(function(p){ return { label: mon(p.month), y: tv(p), note: t('vsHead') + ' ' + p.headcount + (p.netOnly ? ' · ' + t('vaNetOnlyShort') : '') }; }), { fmt: tm === 'headcount' ? '' : 'sar', aria: t('vaTrend') }) : '<p class="hr-hint">' + t('vaTrendFew') + '</p>',
      vtbl([t('vsMonth'), t('vsHead'), t('vsNet'), t('vsGross'), t('vsDed'), t('viAvgHead')], tr.map(function(p){ return [esc(mon(p.month)), p.headcount, acctFmt(p.net), p.netOnly ? '-' : acctFmt(p.gross), p.netOnly ? '-' : acctFmt(p.deductions || 0), p.headcount ? acctFmt(Math.round(p.net / p.headcount)) : '-']; })));
    var ins = vaInsights(r);
    var insCard = '<div class="db-card vs-ins"><div class="db-ch"><h3>' + ph('sparkle') + ' ' + t('viTitle') + '</h3></div><p>' + t('viLead') + '</p>' + (ins.length ? '<ul class="vs-insl">' + ins.map(function(x, i){ return '<li class="' + (x.sev ? 'sev' : '') + '"><span class="vi-ic">' + ph(x.ic) + '</span><span class="vi-t">' + x.s + '</span>' + (x.f ? '<button type="button" class="btn btn-line btn-sm" data-vi="' + i + '">' + t('viShow') + '</button>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="hr-hint">' + t('viNone') + '</p>') + '</div>';
    var mvLines = netOnly ? [] : r.lines.filter(function(l){ return l.change.diff; }).slice(0, 8);
    var linesCard = mvLines.length ? card('vaLm', t('vaLinesMv'), t('vaLinesMvLead'), dvBars(mvLines.map(function(l){ var effect = l.code.indexOf('d:') === 0 ? -l.change.diff : l.change.diff; return { label: lineName(l.code) + (l.code.indexOf('d:') === 0 ? ' (−)' : ''), value: effect, tip: lineName(l.code) + ': ' + acctFmt(l.base) + ' → ' + acctFmt(l.cur) }; })),
      vtbl([t('vaLines'), vaL('base'), vaL('now'), t('vaChg')], mvLines.map(function(l){ return [esc(lineName(l.code)), acctFmt(l.base), acctFmt(l.cur), sgn(l.change.diff)]; }))) : '';
    var hk = netOnly ? ['joiners', 'leavers'] : ['joiners', 'leavers'].concat(Object.keys(D).filter(function(k){ return D[k]; }));
    var heatCard = (r.dims.department || []).length > 1 ? '<div class="db-card"><div class="db-ch"><h3>' + t('vaHeat') + '</h3></div><p>' + t('vaHeatLead') + '</p>' + vaHeat((r.dims.department || []).slice(0, 15), hk) + '</div>' : '';
    var stayAll = r.people.filter(function(p){ return p.cur && p.base; });
    var distCard = stayAll.length > 2 && V() ? card('vaDs', t('vaDist'), t('vaDistLead'), V().cols(vaDist(stayAll), { labels: true }), vtbl([t('vaDist'), t('vsHead')], vaDist(stayAll).map(function(x){ return [esc(x.label), x.value]; }))) : '';
    var steps = [['dv_joiners', b.joiners], ['dv_leavers', b.leavers]].concat(netOnly ? [['vaStayers', b.stayers]] : Object.keys(D).filter(function(k){ return D[k]; }).map(function(k){ return ['dv_' + k, D[k]]; }));
    var bridgeCard = card('vaBr', t('vaBridge'), t('vaBridgeLead').replace('{a}', acctFmt(b.from)).replace('{b}', acctFmt(b.to)), dvBars(steps.map(function(s){ return { label: t(s[0]), value: s[1] }; })),
      vtbl([t('vaBy'), t('vaChg')], [[t('vaFrom'), acctFmt(b.from)]].concat(steps.map(function(s){ return [t(s[0]), sgn(s[1])]; })).concat([[t('vaTo'), acctFmt(b.to)]])));
    var dimLabel = t(DIMS.filter(function(d){ return d[0] === VA.dim; })[0][1]);
    var topDims = dimRows.slice().sort(function(a, c){ return c.netCur - a.netCur; }), shownD = topDims.slice(0, 10), restD = topDims.slice(10);
    var brItems = shownD.map(function(d){ return { label: dimVal(VA.dim, d.key), value: d.netCur, tip: dimVal(VA.dim, d.key) + ': ' + acctFmt(d.netCur) + ' (' + sgn(d.net.diff) + ')' }; });
    if (restD.length) brItems.push({ label: t('vaOther').replace('{n}', restD.length), value: restD.reduce(function(a, d){ return a + d.netCur; }, 0), gray: true });
    var mixCard = card('vaMix', t('vaMix').replace('{d}', dimLabel), t('vaMixLead'), V() ? V().hbars(brItems) : '', vtbl([dimLabel, t('vsNet'), t('vaChg')], topDims.map(function(d){ return [esc(dimVal(VA.dim, d.key)), acctFmt(d.netCur), sgn(d.net.diff)]; })));
    var stay = r.people.filter(function(p){ return p.cur && p.base && p.net.diff; }).sort(function(a, c){ return c.net.diff - a.net.diff; });
    var movers = stay.slice(0, 6).concat(stay.length > 6 ? stay.slice(Math.max(6, stay.length - 6)) : []);
    var moverCard = card('vaMv', t('vaMovers'), t('vaMoversLead'), dvBars(movers.map(function(p){ return { label: p.name, value: p.net.diff, go: r.people.indexOf(p), tip: p.name + ' · ' + acctFmt(p.base.net) + ' → ' + acctFmt(p.cur.net) }; })),
      vtbl([t('vsName'), vaL('base'), vaL('now'), t('vaChg')], movers.map(function(p){ return [esc(p.name), acctFmt(p.base.net), acctFmt(p.cur.net), sgn(p.net.diff)]; })));
    var vr = r.volumeRate || {};
    var rateCard = card('vaRt', t('vaRate'), t('vaRateLead'), '<div class="vs-rate"><div><span>' + t('vaRateHead') + '</span><b>' + sgn(vr.headcountEffect) + '</b></div><div><span>' + t('vaRatePay') + '</span><b>' + sgn(vr.rateEffect) + '</b></div>' +
      '<div><span>' + t('vaAvgBefore') + '</span><b>' + acctFmt(vr.avgBefore || 0) + '</b></div><div><span>' + t('vaAvgNow') + '</span><b>' + acctFmt(vr.avgNow || 0) + '</b></div></div>');
    var lim = VA.limit, ppl = lim ? r.people.slice(0, lim) : r.people;
    el.innerHTML = netOnlyNote(r.netOnlyMonths) + story +
      K.tiles([[t('vsHead'), String(T0.headcount.cur), chg(T0.headcount.change), true], [t('vsNet'), amt(T0.net.cur), chg(T0.net.change)], [t('vsGross'), amt(T0.gross.cur), na(T0.gross.change)],
        [t('vsDed'), amt(T0.deductions.cur), na(T0.deductions.change)], [t('vsCost'), amt(T0.companyCost.cur), na(T0.companyCost.change)]]) +
      '<div class="vs-grid"><div class="wide">' + insCard + '</div><div class="wide">' + trendCard + '</div>' + bridgeCard + moverCard + (linesCard || '') + (distCard || '') + mixCard + rateCard + (heatCard ? '<div class="wide">' + heatCard + '</div>' : '') + '</div>' +
      '<h3 class="vs-h">' + t('vaBy') + '</h3><div class="vs-tabs">' + DIMS.map(function(d){ return '<button type="button" data-dim="' + d[0] + '" aria-pressed="' + (VA.dim === d[0]) + '">' + t(d[1]) + '</button>'; }).join('') + '</div>' +
      '<div class="vs-wrap"><table class="vs-tbl"><thead><tr><th>' + dimLabel + '</th><th class="n">' + esc(vaL('base')) + ' · ' + t('vsHead') + '</th><th class="n">' + esc(vaL('now')) + ' · ' + t('vsHead') + '</th><th class="n">' + t('vaJoin') + '</th><th class="n">' + t('vaLeave') + '</th>' +
        '<th class="n">' + esc(vaL('base')) + ' · ' + t('vsNet') + '</th><th class="n">' + esc(vaL('now')) + ' · ' + t('vsNet') + '</th><th class="n">' + t('vaChg') + '</th><th class="n">' + t('vaShare') + '</th><th>' + t('vaFlags') + '</th></tr></thead><tbody>' +
        dimRows.map(function(d){ return '<tr class="go' + (VA.dim === 'city' && d.assumed ? ' vs-assumed' : '') + '" data-dv="' + esc(d.key) + '"><td>' + esc(dimVal(VA.dim, d.key)) + '</td><td class="n">' + d.headBase + '</td><td class="n">' + d.headCur + '</td><td class="n">' + d.joiners + '</td><td class="n">' + d.leavers + '</td>' +
          '<td class="n">' + amt(d.netBase) + '</td><td class="n">' + amt(d.netCur) + '</td><td class="n">' + chg(d.net) + '</td><td class="n">' + (d.shareCur || 0) + '%</td><td>' + (d.topDriver && !netOnly ? '<span class="vs-flag">' + t('dv_' + d.topDriver.key) + ' ' + sgn(d.topDriver.amount) + '</span>' : '') + (d.flagged ? ' <small>' + d.flagged + '</small>' : '') + '</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><td>' + t('vsTotal') + '</td><td class="n">' + T0.headcount.base + '</td><td class="n">' + T0.headcount.cur + '</td><td class="n">' + jn + '</td><td class="n">' + lv + '</td><td class="n">' + amt(T0.net.base) + '</td><td class="n">' + amt(T0.net.cur) + '</td><td class="n">' + chg(T0.net.change) + '</td><td class="n">100%</td><td></td></tr></tfoot></table></div>' +
      (netOnly ? '' : '<h3 class="vs-h">' + t('vaLines') + '</h3><div class="vs-wrap"><table class="vs-tbl"><thead><tr><th>' + t('vaLines') + '</th><th class="n">' + esc(vaL('base')) + '</th><th class="n">' + esc(vaL('now')) + '</th><th class="n">' + t('vaChg') + '</th></tr></thead><tbody>' +
        r.lines.slice().sort(function(a, c){ return lineRank(a.code) - lineRank(c.code); }).map(function(l){ return '<tr><td>' + esc(lineName(l.code)) + (l.code.indexOf('d:') === 0 ? ' <small>(-)</small>' : '') + '</td><td class="n">' + amt(l.base) + '</td><td class="n">' + amt(l.cur) + '</td><td class="n">' + chg(l.change) + '</td></tr>'; }).join('') + '</tbody></table></div>') +
      '<h3 class="vs-h">' + t('vaPeople') + ' · ' + t('vsShown').replace('{n}', r.shown).replace('{t}', r.all) + '</h3><div class="vs-wrap"><table class="vs-tbl"><thead><tr><th>' + t('vsEmpNo') + '</th><th>' + t('vsName') + '</th><th>' + t('vsSponsor') + '</th><th>' + t('vsDept') + '</th><th>' + t('vsLoc') + '</th><th>' + t('vaHire') + '</th><th class="n">' + t('vaDaysCol') + '</th>' +
        '<th class="n">' + esc(vaL('base')) + '</th><th class="n">' + esc(vaL('now')) + '</th><th class="n">' + t('vaChg') + '</th><th>' + t('vaWhy') + '</th><th>' + t('vaFlags') + '</th></tr></thead><tbody>' +
        ppl.map(function(p, i){ var dd = vaDays(p); return '<tr class="go" data-pi="' + i + '"><td dir="ltr">' + esc(p.empNo) + '</td><td>' + esc(p.name) + '</td><td>' + esc(p.dims.payGroup) + '</td><td>' + esc(p.dims.department) + '</td><td>' + esc(p.dims.location) + '</td>' +
          '<td class="num" dir="ltr">' + esc(p.hireDate || '-') + '</td><td class="n"><bdi dir="ltr">' + (dd.base == null ? '-' : dd.base) + ' → ' + (dd.cur == null ? '-' : dd.cur) + '</bdi></td>' +
          '<td class="n">' + amt(p.base ? p.base.net : null) + '</td><td class="n">' + amt(p.cur ? p.cur.net : null) + '</td><td class="n">' + chg(p.net) + '</td><td class="vs-why-c">' + vaWhy(p, netOnly).map(function(x){ return '<div>' + esc(x) + '</div>'; }).join('') + '</td><td>' + p.flags.map(function(f){ return '<span class="vs-flag">' + t('fl_' + f) + '</span>'; }).join('') + '</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><td colspan="7">' + t('vsTotal') + ' (' + r.shown + ')</td><td class="n">' + amt(T0.net.base) + '</td><td class="n">' + amt(T0.net.cur) + '</td><td class="n">' + chg(T0.net.change) + '</td><td></td><td></td></tr></tfoot></table></div>' +
      (lim && r.people.length > lim ? '<p class="vs-more-p">' + t('vaLimit').replace('{n}', lim).replace('{t}', r.people.length) + ' <button type="button" class="btn btn-line btn-sm" id="vaAll">' + t('vaShowAll') + '</button></p>' : '');
    wireViz(el);
    $('#vaM', top).onchange = function(){ VA.month = this.value; load(); };
    $('#vaC', top).onchange = function(){ if (this.value === 'pick') { VA.picking = true; draw(); return; } VA.picking = false; VA.compare = this.value; load(); };
    if ($('#vaPk', top)) {
      $$('[data-pk]', top).forEach(function(x){ x.onclick = function(){ $$('#vaPk input', top).forEach(function(c){ c.checked = x.dataset.pk === 'all'; }); }; });
      $('#vaPkGo', top).onclick = function(){ var ms = $$('#vaPk input', top).filter(function(c){ return c.checked; }).map(function(c){ return c.value; }); if (!ms.length) return toast(t('vaPickLead')); VA.compare = 'pick:' + ms.join(','); VA.picking = false; load(); };
    }
    $$('[data-dim]', el).forEach(function(b2){ b2.onclick = function(){ VA.dim = b2.dataset.dim; draw(); }; });
    $$('[data-dv]', el).forEach(function(tr2){ tr2.onclick = function(){ VA.f[VA.dim] = [tr2.dataset.dv]; load(); }; });
    $$('[data-pi]', el).forEach(function(tr2){ tr2.onclick = function(){ person(r.people[+tr2.dataset.pi]); }; });
    $$('[data-go-p]', el).forEach(function(x){ x.onclick = function(){ person(r.people[+x.dataset.goP]); }; x.onkeydown = function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); x.onclick(); } }; });
    var all2 = $('#vaAll', el); if (all2) all2.onclick = function(){ VA.limit = 0; draw(); };
    $('#vaX', top).onclick = function(){ exportVar(r); };
    $('#vaPr', top).onclick = function(){ printVar(r); };
    $$('#vaTm button', el).forEach(function(b2){ b2.onclick = function(){ VA.tm = b2.dataset.v; draw(); }; });
    $$('[data-vi]', el).forEach(function(b2){ b2.onclick = function(){ var x = ins[+b2.dataset.vi]; if (!x || !x.f) return; Object.keys(x.f).forEach(function(k){ VA.f[k] = x.f[k]; }); load(); }; });
    $$('[data-hv]', el).forEach(function(tr2){ tr2.onclick = function(){ VA.f.department = [tr2.dataset.hv]; load(); }; });
  }
  function person(p){
    var keys = orderLines(Object.keys(p.lines)), netOnly = (R.netOnlyMonths || []).length > 0;
    var hist = (R.trend || []).map(function(x, i){ return p.hist[i]; });
    var dw = drawer('<h3>' + esc(p.name) + ' <small dir="ltr">' + esc(p.empNo) + '</small></h3><p class="hr-hint">' + esc([p.dims.payGroup, p.dims.department, p.dims.title, p.dims.location, p.dims.city].join(' · ')) + '</p>' +
      '<p>' + p.flags.map(function(f){ return '<span class="vs-flag">' + t('fl_' + f) + '</span>'; }).join('') + '</p>' +
      (netOnly ? netOnlyNote(R.netOnlyMonths) : '') +
      '<div class="vs-wrap"><table class="vs-tbl"><thead><tr><th>' + t('vaLines') + '</th><th class="n">' + esc(vaL('base')) + '</th><th class="n">' + esc(vaL('now')) + '</th><th class="n">' + t('vaChg') + '</th></tr></thead><tbody>' +
      (netOnly ? '' : keys.map(function(k){ var v = p.lines[k]; return '<tr><td>' + esc(lineName(k)) + (k.indexOf('d:') === 0 ? ' (-)' : '') + '</td><td class="n">' + amt(v[1]) + '</td><td class="n">' + amt(v[0]) + '</td><td class="n">' + chg({ diff: Math.round((v[0] - v[1]) * 100) / 100, pct: null }) + '</td></tr>'; }).join('')) +
      '<tr><td><b>' + t('vsNet') + '</b></td><td class="n">' + amt(p.base ? p.base.net : null) + '</td><td class="n"><b>' + amt(p.cur ? p.cur.net : null) + '</b></td><td class="n">' + chg(p.net) + '</td></tr></tbody></table></div>' +
      (p.package != null ? '<p class="hr-hint">' + t('fl_off_package') + ': ' + acctFmt(p.package) + '</p>' : '') +
      '<h4>' + t('vaTrend') + '</h4>' + (V() && hist.filter(function(v){ return v != null; }).length > 1 ? V().lineChart((R.trend || []).map(function(x, i){ return { label: mon(x.month), y: hist[i] || 0, note: hist[i] == null ? t('vaNotPaid') : '' }; }), { fmt: 'sar', aria: t('vaTrend') }) : '<p class="hr-hint">' + t('vaTrendFew') + '</p>'));
    wireViz(dw || document.body);
  }
  function cities(){
    api('varianceCities', {}, true).then(function(c){
      if (!c.ok) return toast(errText(c.error));
      var d = drawer('<h3>' + t('vaCities') + '</h3><p class="hr-hint">' + t('vaCityHint') + '</p><form id="vcF"><div class="vs-wrap"><table class="vs-tbl"><tbody>' +
        c.locations.map(function(l, i){ return '<tr' + (l.source === 'assumed' ? ' class="vs-assumed"' : '') + '><td>' + esc(l.location) + ' <small>(' + l.people + ')</small></td><td><input name="c' + i + '" value="' + esc(l.city) + '" style="width:160px"></td></tr>'; }).join('') +
        '</tbody></table></div><button class="btn btn-dark" type="submit">' + t('vaSave') + '</button></form>');
      $('#vcF', d).onsubmit = function(e){ e.preventDefault(); var map = {}; c.locations.forEach(function(l, i){ var v = this.elements['c' + i].value.trim(); if (v) map[l.location] = v; }, this);
        api('varianceCities', { mode: 'save', map: map }).then(function(x){ if (!x.ok) return toast(errText(x.error)); toast(t('vaSave') + ' ✓'); load(); }); };
    });
  }
  function exportVar(r){
    var en = S.lang === 'en', title = t('vaTitle2') + ' ' + r.month + ' / ' + r.baseMonths.join('+');
    var pc = [{ key: 'empNo', label: t('vsEmpNo'), type: 'text' }, { key: 'name', label: t('vsName'), type: 'text' }].concat(DIMS.map(function(d){ return { key: d[0], label: t(d[1]), type: 'text' }; }))
      .concat([{ key: 'baseNet', label: vaL('base') + ' ' + t('vsNet'), type: 'money', sum: true }, { key: 'curNet', label: vaL('now') + ' ' + t('vsNet'), type: 'money', sum: true }, { key: 'diff', label: t('vaChg'), type: 'money', sum: true },
        { key: 'baseGross', label: vaL('base') + ' ' + t('vsGross'), type: 'money', sum: true }, { key: 'curGross', label: vaL('now') + ' ' + t('vsGross'), type: 'money', sum: true }, { key: 'hireDate', label: t('vaHire'), type: 'text' }, { key: 'baseDays', label: vaL('base') + ' · ' + t('vaDaysCol'), type: 'num' }, { key: 'curDays', label: vaL('now') + ' · ' + t('vaDaysCol'), type: 'num' }, { key: 'why', label: t('vaWhy'), type: 'text' },
        { key: 'flags', label: t('vaFlags'), type: 'text' }, { key: 'score', label: 'Score', type: 'int' }]);
    var nOnly = (r.netOnlyMonths || []).length > 0; // a net-only month has no real gross: leave those cells empty
    var prow = r.people.map(function(p){ var o = { empNo: p.empNo, name: p.name, baseNet: p.base ? p.base.net : 0, curNet: p.cur ? p.cur.net : 0, diff: p.net.diff, baseGross: nOnly ? null : p.base ? p.base.gross : 0, curGross: nOnly ? null : p.cur ? p.cur.gross : 0,
      hireDate: p.hireDate || '', baseDays: p.base ? p.base.days : null, curDays: p.cur ? p.cur.days : null, why: vaWhy(p, nOnly).join(' · '),
      flags: p.flags.map(function(f){ return t('fl_' + f); }).join(', '), score: p.score }; DIMS.forEach(function(d){ o[d[0]] = dimVal(d[0], p.dims[d[0]]); }); return o; });
    var dc = [{ key: 'key', label: t('vaBy'), type: 'text' }, { key: 'headBase', label: vaL('base') + ' ' + t('vsHead'), type: 'int', sum: true }, { key: 'headCur', label: vaL('now') + ' ' + t('vsHead'), type: 'int', sum: true },
      { key: 'joiners', label: t('vaJoin'), type: 'int', sum: true }, { key: 'leavers', label: t('vaLeave'), type: 'int', sum: true }, { key: 'netBase', label: vaL('base') + ' ' + t('vsNet'), type: 'money', sum: true },
      { key: 'netCur', label: vaL('now') + ' ' + t('vsNet'), type: 'money', sum: true }, { key: 'diff', label: t('vaChg'), type: 'money', sum: true }];
    var sheets = [{ name: xlName(t('vaPeople')), title: title, columns: pc, rows: prow }].concat(DIMS.map(function(d){ return { name: xlName(t(d[1])), title: title + ' · ' + t(d[1]), columns: dc,
      rows: r.dims[d[0]].map(function(x){ return { key: dimVal(d[0], x.key), headBase: x.headBase, headCur: x.headCur, joiners: x.joiners, leavers: x.leavers, netBase: x.netBase, netCur: x.netCur, diff: x.net.diff }; }) }; }))
      .concat([{ name: xlName(t('vaTrend')), title: title, columns: [{ key: 'm', label: t('vsMonth'), type: 'text' }, { key: 'h', label: t('vsHead'), type: 'int' }, { key: 'n', label: t('vsNet'), type: 'money', sum: true }, { key: 'g', label: t('vsGross'), type: 'money', sum: true }],
        rows: (r.trend || []).filter(function(p){ return !p.none; }).map(function(p){ return { m: p.month, h: p.headcount, n: p.net, g: p.netOnly ? null : p.gross }; }) }])
      .concat((r.netOnlyMonths || []).length ? [] : [{ name: xlName(t('vaLines')), title: title, columns: [{ key: 'l', label: t('vaLines'), type: 'text' }, { key: 'b', label: vaL('base'), type: 'money', sum: true }, { key: 'c', label: vaL('now'), type: 'money', sum: true }, { key: 'd', label: t('vaChg'), type: 'money', sum: true }],
        rows: r.lines.slice().sort(function(a, b){ return lineRank(a.code) - lineRank(b.code); }).map(function(l){ return { l: lineName(l.code), b: l.base, c: l.cur, d: l.change.diff }; }) }]);
    loadScript('js/xl.js').then(function(){ return XL.download({ fileName: 'VARIANCE_' + r.month, title: title, lang: en ? 'en' : 'ar', company: coName(), by: S.me.name, logo: logoInk(), filters: xlFilters(VA.f), sheets: sheets }); })
      .then(function(){ toast(t('v2Exported')); }, function(){ toast(errText('network')); });
  }
  load();
}

// ======================================================================= month by month
var MO = { n: 6, months: null, metric: 'net', by: 'person', show: 'amt', f: {}, sort: null, dir: -1, limit: 300, picking: false };
var MO_METRICS = [['net', 'vsNet', 2], ['gross', 'vsGross', 0], ['deductions', 'vsDed', 1], ['companyCost', 'vsCost', 3], ['headcount', 'vsHead', -1]];
function monthlySection(body){
  var box = K.head(body, 'moTitle', 'moLead');
  box.innerHTML = '<div id="moTop"></div><div class="vs-cfh" id="moCf"></div><div id="moBox"></div>'; var el = $('#moBox', box), top = $('#moTop', box), cf = $('#moCf', box), R = null;
  function load(){
    K.busy(el);
    api('payrollMonthly', { months: MO.months || undefined, n: MO.n || 24, filters: serverFilters(MO.f) }, true).then(function(r){
      if (!el.isConnected) return;
      if (!r.ok) return el.innerHTML = r.error === 'unknown_action' ? '<div class="vs-note">' + ph('info') + '<p>' + t('moServer') + '</p></div>' : K.bad(r.error);
      if (r.empty) return el.innerHTML = K.empty('table', t('vsNone'));
      R = r; draw();
    });
  }
  function draw(){
    var r = R, ms = r.months, mt = MO_METRICS.filter(function(x){ return x[0] === MO.metric; })[0], idx = mt[2], netOnly = r.netOnlyMonths || [];
    var val = function(p, m){ var v = p.m[m]; return idx < 0 ? (v ? 1 : 0) : v ? v[idx] : null; };
    // rows: one per person, or one per value of the chosen dimension (summed)
    var rows;
    if (MO.by === 'person') rows = r.people.map(function(p){ var o = { key: p.empId, label: p.name, sub: p.empNo, p: p, v: {} }; ms.forEach(function(m){ o.v[m] = val(p, m); }); return o; });
    else { var g = {}; r.people.forEach(function(p){ var k = p.dims[MO.by], o = g[k] = g[k] || { key: k, label: dimVal(MO.by, k), v: {}, n: 0 }; o.n++; ms.forEach(function(m){ var x = val(p, m); if (x != null) o.v[m] = (o.v[m] || 0) + x; }); }); rows = Object.keys(g).map(function(k){ return g[k]; }); }
    rows.forEach(function(o){ var vals = ms.map(function(m){ return o.v[m]; }), have = vals.filter(function(x){ return x != null; });
      o.total = have.reduce(function(a, x){ return a + x; }, 0); o.avg = have.length ? o.total / have.length : 0;
      var first = o.v[ms[0]] || 0, last = o.v[ms[ms.length - 1]] || 0; o.change = Math.round((last - first) * 100) / 100; });
    var s = MO.sort || 'last', dir = MO.dir; rows.sort(function(a, b){ var A = s === 'label' ? a.label : s === 'last' ? (a.v[ms[ms.length - 1]] || 0) : s === 'total' ? a.total : s === 'change' ? a.change : (a.v[s] || 0), B = s === 'label' ? b.label : s === 'last' ? (b.v[ms[ms.length - 1]] || 0) : s === 'total' ? b.total : s === 'change' ? b.change : (b.v[s] || 0);
      return (typeof A === 'string' ? String(A).localeCompare(String(B)) : A - B) * dir; });
    var colTot = {}; ms.forEach(function(m){ colTot[m] = rows.reduce(function(a, o){ return a + (o.v[m] || 0); }, 0); });
    var hc = idx < 0, money = function(v){ return hc ? String(Math.round(v)) : acctFmt(Math.round(v * 100) / 100); };
    var cellOf = function(o, m, i){ var v = o.v[m]; if (v == null) return '<td class="n mo na">-</td>';
      var bad = !hc && idx !== 2 && netOnly.indexOf(m) >= 0;
      if (MO.show === 'amt' || i === 0) return '<td class="n mo' + (bad ? ' nonly' : '') + '">' + money(v) + (bad ? '*' : '') + '</td>';
      var pv = o.v[ms[i - 1]]; if (pv == null) return '<td class="n mo na">' + t('moNew') + '</td>';
      var d = Math.round((v - pv) * 100) / 100; return '<td class="n mo">' + (MO.show === 'pct' ? (pv ? pctChg(d / Math.abs(pv) * 100) : '-') : chg({ diff: d, pct: null })) + '</td>'; };
    var lim = MO.limit, shown = lim ? rows.slice(0, lim) : rows;
    var th = function(k, label, cls){ return '<th class="' + (cls || '') + '" data-s="' + k + '">' + label + (MO.sort === k ? (MO.dir > 0 ? ' ▲' : ' ▼') : '') + '</th>'; };
    top.innerHTML = '<div class="vs-top"><div class="vs-sel"><span>' + t('moMonths') + '</span>' + seg('moN', [[3, '3'], [6, '6'], [12, '12'], [24, t('moAll')], ['pick', t('moPick')]], MO.months ? 'pick' : MO.n) + '</div>' +
      selBox('moMet', 'vsMetric', MO_METRICS.map(function(x){ return [x[0], t(x[1])]; }), MO.metric) +
      selBox('moBy', 'moBy', [['person', t('moPerson')]].concat(DIMS.map(function(d){ return [d[0], t(d[1])]; })), MO.by) +
      '<div class="vs-sel"><span>' + t('moShow') + '</span>' + seg('moSh', [['amt', t('moAmt')], ['chg', t('moChg')], ['pct', t('moPct')]], MO.show) + '</div>' +
      '<span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="moX">' + ph('microsoft-excel-logo') + 'Excel</button></div>' +
      (MO.picking || MO.months ? '<div class="vs-pick" id="moPk"><p>' + t('moPickLead') + '</p><div class="vs-pick-m">' + r.allMonths.map(function(m){ return '<label><input type="checkbox" value="' + m + '"' + (ms.indexOf(m) >= 0 ? ' checked' : '') + '><span>' + esc(mon(m)) + '</span></label>'; }).join('') + '</div>' +
        '<div class="btnrow"><button type="button" class="btn btn-line btn-sm" data-pk="all">' + t('vaPickAll') + '</button><button type="button" class="btn btn-line btn-sm" data-pk="none">' + t('vaPickNone') + '</button><button type="button" class="btn btn-dark btn-sm" id="moPkGo">' + t('vaPickGo') + '</button></div></div>' : '');
    chipBar(cf, { f: MO.f, dims: DIMS, val: dimVal, onChange: load, opts: function(k){ return r.options[k] || []; } });
    var totFirst = colTot[ms[0]] || 0, totLast = colTot[ms[ms.length - 1]] || 0, avg = ms.length ? ms.reduce(function(a, m){ return a + colTot[m]; }, 0) / ms.length : 0;
    var pk = ms.reduce(function(a, m){ return colTot[m] > colTot[a] ? m : a; }, ms[0]);
    var trendPts = ms.map(function(m){ return { label: mon(m), y: Math.round(colTot[m] * 100) / 100, note: netOnly.indexOf(m) >= 0 && !hc && idx !== 2 ? t('vaNetOnlyShort') : '' }; });
    el.innerHTML = (netOnly.length ? netOnlyNote(netOnly) : '') +
      K.tiles([[t(mt[1]) + ' · ' + esc(mon(ms[ms.length - 1])), money(totLast), ms.length > 1 ? chg({ diff: Math.round((totLast - totFirst) * 100) / 100, pct: totFirst ? Math.round((totLast - totFirst) / Math.abs(totFirst) * 1000) / 10 : null }) + ' <small>' + t('moSince').replace('{m}', esc(mon(ms[0]))) + '</small>' : '', true],
        [t('moAvg'), money(avg)], [t('moPeak'), money(colTot[pk] || 0), esc(mon(pk))], [t('moRows'), String(rows.length), t('vsShown').replace('{n}', r.shown).replace('{t}', r.all)]]) +
      '<div class="vs-grid"><div class="wide">' + card('moTr', t('moTrend').replace('{x}', t(mt[1])), t('moTrendLead'), ms.length > 1 && V() ? V().lineChart(trendPts, { fmt: hc ? '' : 'sar', aria: t('moTrend').replace('{x}', t(mt[1])) }) : '<p class="hr-hint">' + t('vaTrendFew') + '</p>',
        vtbl([t('vsMonth'), t(mt[1])], ms.map(function(m){ return [esc(mon(m)), money(colTot[m])]; }))) + '</div></div>' +
      '<div class="vs-wrap"><table class="vs-tbl vs-mo"><thead><tr>' + th('label', MO.by === 'person' ? t('vsName') : t(DIMS.filter(function(d){ return d[0] === MO.by; })[0][1])) + (MO.by === 'person' ? '<th>' + t('vsSponsor') + '</th>' : '<th class="n">' + t('vsHead') + '</th>') +
        ms.map(function(m){ return th(m, esc(mon(m)), 'n mo'); }).join('') + (hc ? '' : th('total', t('vsTotal'), 'n')) + th('change', t('moFirstLast'), 'n') + '<th>' + t('moShape') + '</th></tr></thead><tbody>' +
        shown.map(function(o){ return '<tr' + (o.p ? ' class="go" data-mp="' + esc(o.key) + '"' : ' class="go" data-mg="' + esc(o.key) + '"') + '><td>' + esc(o.label) + (o.sub ? ' <small dir="ltr">' + esc(o.sub) + '</small>' : '') + '</td>' + (o.p ? '<td>' + esc(o.p.dims.payGroup) + '</td>' : '<td class="n">' + o.n + '</td>') +
          ms.map(function(m, i){ return cellOf(o, m, i); }).join('') + (hc ? '' : '<td class="n"><b>' + money(o.total) + '</b></td>') + '<td class="n">' + chg({ diff: o.change, pct: null }) + '</td><td class="sp-c">' + (V() ? V().spark(ms.map(function(m){ return o.v[m]; })) : '') + '</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><td>' + t('vsTotal') + '</td><td class="n">' + (MO.by === 'person' ? '' : r.shown) + '</td>' + ms.map(function(m, i){ return '<td class="n mo">' + (MO.show === 'amt' || i === 0 ? money(colTot[m]) : chg({ diff: Math.round((colTot[m] - colTot[ms[i - 1]]) * 100) / 100, pct: MO.show === 'pct' && colTot[ms[i - 1]] ? Math.round((colTot[m] - colTot[ms[i - 1]]) / Math.abs(colTot[ms[i - 1]]) * 1000) / 10 : null })) + '</td>'; }).join('') +
        (hc ? '' : '<td class="n">' + money(ms.reduce(function(a, m){ return a + colTot[m]; }, 0)) + '</td>') + '<td class="n">' + chg({ diff: Math.round((totLast - totFirst) * 100) / 100, pct: null }) + '</td><td></td></tr></tfoot></table></div>' +
      (lim && rows.length > lim ? '<p class="vs-more-p">' + t('vaLimit').replace('{n}', lim).replace('{t}', rows.length) + ' <button type="button" class="btn btn-line btn-sm" id="moAll">' + t('vaShowAll') + '</button></p>' : '') +
      (netOnly.length && !hc && idx !== 2 ? '<p class="hr-hint">* ' + t('moStar') + '</p>' : '');
    wireViz(el);
    $$('#moN button', top).forEach(function(b){ b.onclick = function(){ if (b.dataset.v === 'pick') { MO.picking = true; draw(); return; } MO.months = null; MO.picking = false; MO.n = +b.dataset.v; load(); }; });
    $('#moMet', top).onchange = function(){ MO.metric = this.value; draw(); };
    $('#moBy', top).onchange = function(){ MO.by = this.value; MO.sort = null; draw(); };
    $$('#moSh button', top).forEach(function(b){ b.onclick = function(){ MO.show = b.dataset.v; draw(); }; });
    if ($('#moPk', top)) {
      $$('[data-pk]', top).forEach(function(x){ x.onclick = function(){ $$('#moPk input', top).forEach(function(c){ c.checked = x.dataset.pk === 'all'; }); }; });
      $('#moPkGo', top).onclick = function(){ var sel2 = $$('#moPk input', top).filter(function(c){ return c.checked; }).map(function(c){ return c.value; }); if (!sel2.length) return toast(t('moPickLead')); MO.months = sel2; MO.picking = false; load(); };
    }
    $$('[data-s]', el).forEach(function(h){ h.onclick = function(){ var k = h.dataset.s; if (MO.sort === k) MO.dir = -MO.dir; else { MO.sort = k; MO.dir = k === 'label' ? 1 : -1; } draw(); }; });
    $$('[data-mg]', el).forEach(function(tr2){ tr2.onclick = function(){ MO.f[MO.by] = [tr2.dataset.mg]; MO.by = 'person'; load(); }; });
    $$('[data-mp]', el).forEach(function(tr2){ tr2.onclick = function(){ var o = rows.filter(function(x){ return x.key === tr2.dataset.mp; })[0]; if (o) showPerson(o.p); }; });
    var a2 = $('#moAll', el); if (a2) a2.onclick = function(){ MO.limit = 0; draw(); };
    $('#moX', top).onclick = function(){ exportMo(rows, ms); };
  }
  function showPerson(p){
    var ms = R.months;
    var dw = drawer('<h3>' + esc(p.name) + ' <small dir="ltr">' + esc(p.empNo) + '</small></h3><p class="hr-hint">' + esc([p.dims.payGroup, p.dims.department, p.dims.title, p.dims.location].join(' · ')) + '</p>' +
      '<div class="vs-wrap"><table class="vs-tbl"><thead><tr><th>' + t('vsMonth') + '</th><th class="n">' + t('vsGross') + '</th><th class="n">' + t('vsDed') + '</th><th class="n">' + t('vsNet') + '</th><th class="n">' + t('vsCost') + '</th><th class="n">' + t('vsDays') + '</th></tr></thead><tbody>' +
      ms.map(function(m){ var v = p.m[m], no = (R.netOnlyMonths || []).indexOf(m) >= 0; return '<tr><td>' + esc(mon(m)) + '</td>' + (v ? '<td class="n">' + (no ? '-' : amt(v[0])) + '</td><td class="n">' + (no ? '-' : amt(v[1])) + '</td><td class="n"><b>' + amt(v[2]) + '</b></td><td class="n">' + (no ? '-' : amt(v[3])) + '</td><td class="n">' + (v[4] || '') + '</td>' : '<td colspan="5" class="na">' + t('vaNotPaid') + '</td>') + '</tr>'; }).join('') +
      '</tbody></table></div>' + (V() ? V().lineChart(ms.map(function(m){ return { label: mon(m), y: p.m[m] ? p.m[m][2] : 0, note: p.m[m] ? '' : t('vaNotPaid') }; }), { fmt: 'sar', aria: t('vsNet') }) : ''));
    wireViz(dw || document.body);
  }
  function exportMo(rows, ms){
    var en = S.lang === 'en', title = t('moTitle') + ' ' + ms[0] + ' → ' + ms[ms.length - 1];
    var byPerson = MO.by === 'person', head = [{ key: 'label', label: byPerson ? t('vsName') : t(DIMS.filter(function(d){ return d[0] === MO.by; })[0][1]), type: 'text' }].concat(byPerson ? [{ key: 'empNo', label: t('vsEmpNo'), type: 'text' }].concat(DIMS.map(function(d){ return { key: d[0], label: t(d[1]), type: 'text' }; })) : [{ key: 'n', label: t('vsHead'), type: 'int' }]);
    var sheetFor = function(metric){ var mt = MO_METRICS.filter(function(x){ return x[0] === metric; })[0], idx = mt[2];
      var list = byPerson ? R.people.map(function(p){ var o = { label: p.name, empNo: p.empNo }; DIMS.forEach(function(d){ o[d[0]] = dimVal(d[0], p.dims[d[0]]); }); ms.forEach(function(m, i){ var v = p.m[m]; o['m' + i] = idx < 0 ? (v ? 1 : 0) : v ? v[idx] : null; }); return o; })
        : (function(){ var g = {}; R.people.forEach(function(p){ var k = p.dims[MO.by], o = g[k] = g[k] || { label: dimVal(MO.by, k), n: 0 }; o.n++; ms.forEach(function(m, i){ var v = p.m[m]; if (v) o['m' + i] = (o['m' + i] || 0) + (idx < 0 ? 1 : v[idx]); }); }); return Object.keys(g).map(function(k){ return g[k]; }); })();
      list.forEach(function(o){ o.total = ms.reduce(function(a, m, i){ return a + (o['m' + i] || 0); }, 0); o.change = (o['m' + (ms.length - 1)] || 0) - (o.m0 || 0); });
      return { name: xlName(t(mt[1])), title: title + ' · ' + t(mt[1]), columns: head.concat(ms.map(function(m, i){ return { key: 'm' + i, label: m + ((R.netOnlyMonths || []).indexOf(m) >= 0 && idx !== 2 && idx >= 0 ? ' *' : ''), type: idx < 0 ? 'int' : 'money', sum: true }; }))
        .concat(idx < 0 ? [] : [{ key: 'total', label: t('vsTotal'), type: 'money', sum: true }]).concat([{ key: 'change', label: t('moFirstLast'), type: idx < 0 ? 'int' : 'money', sum: true }]), rows: list }; };
    var sheets = [sheetFor(MO.metric)].concat(MO_METRICS.filter(function(x){ return x[0] !== MO.metric; }).map(function(x){ return sheetFor(x[0]); }));
    loadScript('js/xl.js').then(function(){ return XL.download({ fileName: 'MONTH_BY_MONTH_' + ms[0] + '_' + ms[ms.length - 1], title: title, lang: en ? 'en' : 'ar', company: coName(), by: S.me.name, logo: logoInk(), filters: xlFilters(MO.f), sheets: sheets }); })
      .then(function(){ toast(t('v2Exported')); }, function(){ toast(errText('network')); });
  }
  load();
}
window.PaySheet = { section: sheetSection };
window.Variance = { section: varianceSection, monthly: monthlySection };
})();
