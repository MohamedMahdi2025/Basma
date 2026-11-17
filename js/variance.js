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
  vaCmp:'مقارنة مع', vaM1:'الشهر السابق', vaM2:'قبل شهرين', vaAvg3:'متوسط 3 أشهر', vaAvg6:'متوسط 6 أشهر', vaAvg12:'متوسط 12 شهراً', vaPick:'أشهر أختارها…', vaPickLead:'اختر أي أشهر سابقة؛ يقارن الشهر بمتوسطها.', vaPickGo:'قارن', vaAvgWord:'متوسط', vaPickAll:'الكل', vaPickNone:'لا شيء', vaBaseIs:'الشهر المختار يُقارن بـ', vaYoy:'نفس الشهر العام الماضي', vaPct:'نسبة التغير %', vaMin:'أقل مبلغ', vaChanged:'المتغيرون فقط',
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
  vaCmp:'Compare with', vaM1:'Previous month', vaM2:'Two months ago', vaAvg3:'3-month average', vaAvg6:'6-month average', vaAvg12:'12-month average', vaPick:'Months I choose…', vaPickLead:'Pick any earlier months; the month is compared with their average.', vaPickGo:'Compare', vaAvgWord:'average', vaPickAll:'All', vaPickNone:'None', vaBaseIs:'Compared with', vaYoy:'Same month last year', vaPct:'Change %', vaMin:'Minimum amount', vaChanged:'Changed only',
  vaBridge:'From base net to this month', vaFrom:'Base', vaJoin:'Joiners', vaLeave:'Leavers', vaTo:'This month', vaBy:'Breakdown by', vaPeople:'People, most important first',
  vaLines:'Pay lines', vaNow:'Now', vaBase:'Base', vaChg:'Difference', vaAvgOf:'Average of {n} months', vaNowLead:'Selected month', vaBaseLead:'Compared with', vaFlags:'Notes', vaCities:'Location cities', vaCityHint:'Shaded cities are assumed (Riyadh) because the location name does not say. Correct them here.', vaSave:'Save',
  dv_pay:'Fixed pay', dv_overtime:'Overtime', dv_oneoff:'One-off', dv_absence:'Absence and leave', dv_gosi:'GOSI', dv_advances:'Advances and loans', dv_fines:'Fines', dv_otherDeductions:'Other deductions', dv_other:'Other', dv_joiners:'Joiners', dv_leavers:'Leavers',
  fl_joiner:'Joiner', fl_returner:'Returner', fl_leaver:'Leaver', fl_net_up:'Net up', fl_net_down:'Net down', fl_deductions_spike:'Deductions spike', fl_package_change:'Package change', fl_new_line:'New line', fl_gone_line:'Line gone', fl_net_zero:'Net zero', fl_one_off:'One-off', fl_absence:'Absence', fl_off_package:'Off contract', fl_paid_inactive:'Paid while disabled'
});
var LN = { ar: { basic:'الأساسي', housing:'السكن', transport:'النقل', allowance:'بدلات', bonus:'مكافأة', overtime:'إضافي', gosi:'تأمينات', fine:'جزاءات', advance:'سلف/قروض', loan:'قرض', unpaid_leave:'إجازة', absence:'غياب', other_deduction:'خصومات أخرى', other_earning:'استحقاق آخر' },
  en: { basic:'Basic', housing:'Housing', transport:'Transport', allowance:'Allowances', bonus:'Bonus', overtime:'Overtime', gosi:'GOSI', fine:'Fines', advance:'Advances/loans', loan:'Loan', unpaid_leave:'Leave', absence:'Absence', other_deduction:'Other deductions', other_earning:'Other earning' } };
// Pay columns follow the payslip: basic, days worked, every other addition, total additions, deductions, total deductions, net.
var LORD = ['basic', 'housing', 'transport', 'allowance', 'other_allowance', 'bonus', 'commission', 'incentive', 'overtime', 'other_earning',
  'gosi', 'absence', 'late', 'unpaid_leave', 'sick_75', 'sick_unpaid', 'fine', 'advance', 'loan', 'other_deduction'];
function lineRank(k){ var p = String(k).split(':'), i = LORD.indexOf(p[1]); return (p[0] === 'd' ? 1000 : 0) + (i < 0 ? 500 : i); }
function orderLines(keys){ return keys.slice().sort(function(a, b){ return lineRank(a) - lineRank(b) || String(a).localeCompare(String(b)); }); }
function payCols(keys, days){ var k = orderLines(keys), e = k.filter(function(x){ return x.indexOf('d:') !== 0; }), d = k.filter(function(x){ return x.indexOf('d:') === 0; });
  var b = e[0] === 'e:basic' ? [e.shift()] : [], L = function(x){ return 'l:' + x; };
  return b.map(L).concat(days ? ['days'] : []).concat(e.map(L)).concat(['gross']).concat(d.map(L)).concat(['deductions', 'net']); }
function vaL(k){ var r = VA.r; if (!r) return t(k === 'now' ? 'vaNowLead' : 'vaBaseLead'); if (k === 'now') return mon(r.month); var b = r.baseMonths || []; return b.length === 1 ? mon(b[0]) : t('vaAvgOf').replace('{n}', b.length); }
function lineName(k){ var p = String(k).split(':'), en = S.lang === 'en'; if (p[2] && !en) return p[2]; var n = (LN[en ? 'en' : 'ar'][p[1]] || p[1]); return p[2] && en ? n + ' (' + p[2] + ')' : n; }
function amt(n){ return n == null ? '-' : '<span class="num">' + acctFmt(n) + '</span>'; }
function mon(m){ return new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1, 15)).toLocaleDateString(S.lang === 'en' ? 'en-GB' : 'ar-SA-u-ca-gregory-nu-latn', { month: 'short', year: 'numeric', timeZone: 'UTC' }); }
function level(title){ var s = String(title || '').toLowerCase(); return /ceo|chief|executive|director|رئيس|مدير عام|تنفيذي/.test(s) ? 'lvExec' : /manager|head|مدير/.test(s) ? 'lvMgr' : /supervisor|lead|مشرف/.test(s) ? 'lvSup' : 'lvStaff'; }
function chg(c){ if (!c) return '-'; var cls = c.diff > 0 ? 'up' : c.diff < 0 ? 'dn' : ''; return '<span class="vs-chg ' + cls + '">' + (c.diff > 0 ? '+' : '') + acctFmt(c.diff) + (c.pct != null && c.diff ? ' <small>(' + (c.pct > 0 ? '+' : '') + c.pct + '%)</small>' : '') + '</span>'; }
function sum(rows, f){ return Math.round(rows.reduce(function(t, r){ return t + (Number(r[f]) || 0); }, 0) * 100) / 100; }
function sel(id, label, list, cur){ return '<label class="vs-f"><span>' + t(label) + '</span><select data-f="' + id + '"><option value="">' + t('vsAll') + '</option>' + list.map(function(v){ var o = Array.isArray(v) ? v : [v, v]; return '<option value="' + esc(o[0]) + '"' + (String(cur || '') === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>'; }
function num(id, label, cur){ return '<label class="vs-f vs-n"><span>' + t(label) + '</span><input data-f="' + id + '" type="number" inputmode="decimal" dir="ltr" value="' + esc(cur == null ? '' : cur) + '"></label>'; }
function uniq(rows, k){ var o = {}; rows.forEach(function(r){ var v = r[k]; if (v !== '' && v != null) o[v] = 1; }); return Object.keys(o).sort(); }
function xlName(s){ return String(s).replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 30) || '-'; }

(function css(){ if (document.getElementById('vsCss')) return; var st = document.createElement('style'); st.id = 'vsCss'; st.textContent =
  '.vs-fl{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:flex-end;margin:8px 0 16px}.vs-f{display:flex;flex-direction:column;gap:4px;font-size:12px;min-width:140px;flex:1 1 140px;max-width:220px}.vs-f span{color:var(--ink-2,#5F6D63)}' +
  '.vs-f select,.vs-f input{height:36px;border-radius:8px;border:1px solid var(--q-hair,#E4DFD3);padding:0 8px;background:var(--paper,#fff);font:inherit;font-size:13px}.vs-n{max-width:130px;min-width:110px}.vs-q{flex:2 1 260px;max-width:none}' +
  '.vs-tbl{width:100%;border-collapse:collapse;font-size:13px}.vs-tbl th,.vs-tbl td{padding:8px 10px;border-bottom:1px solid var(--q-hair,#E4DFD3);text-align:start;white-space:nowrap}.vs-tbl th{position:sticky;top:0;background:var(--paper,#fff);font-weight:600;cursor:pointer;z-index:1}' +
  '.vs-tbl td.n,.vs-tbl th.n{text-align:end;font-variant-numeric:tabular-nums}.vs-tbl tfoot td{font-weight:700;border-top:2px solid var(--ink,#14202F)}.vs-tbl tr.go{cursor:pointer}.vs-tbl tr.go:hover td{background:color-mix(in srgb,var(--ink,#14202F) 4%,transparent)}' +
  '.vs-wrap{overflow:auto;max-height:70vh;border:1px solid var(--q-hair,#E4DFD3);border-radius:12px;margin:8px 0 20px}.vs-chg.up{color:#1E6B3F}.vs-chg.dn{color:#B42318}.vs-h{margin:20px 0 4px;font-size:16px}' +
  '.vs-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.vs-tabs button{border:1px solid var(--q-hair,#E4DFD3);background:none;border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer}.vs-tabs button[aria-pressed=true]{background:var(--ink,#14202F);color:var(--paper,#fff)}' +
  '.vs-pick{margin:8px 0 12px;padding:12px 16px;border-radius:16px;background:var(--q-tray,#F4F2EC);border:1px solid var(--q-hair,#E4DFD3)}.vs-pick p{margin:0 0 8px;font-size:13px;color:var(--ink-2)}.vs-pick-m{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}.vs-pick-m label{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:var(--card,#fff);border:1px solid var(--q-hair,#E4DFD3);font-size:13px;cursor:pointer}.vs-pick-m label:has(input:checked){border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)}.vs-base{margin:4px 0 12px;font-size:13px;color:var(--ink-2)}.vs-base b{color:var(--ink)}' + '.vs-flag{display:inline-block;font-size:11px;padding:2px 8px;border-radius:999px;background:color-mix(in srgb,var(--ink,#14202F) 7%,transparent);margin:1px 2px}.vs-bar{display:grid;grid-template-columns:160px 1fr 120px;gap:8px;align-items:center;font-size:13px;margin:4px 0}' +
  '.vs-bar i{display:block;height:14px;border-radius:4px;background:#2a78d6}.vs-bar i.neg{background:#B42318}.vs-bar i.pos{background:#2E7D4F}.vs-assumed td:first-child{background:color-mix(in srgb,#C98500 14%,transparent)}';
  document.head.appendChild(st); })();

// ======================================================================= combined payroll sheet
var PS = { month: '', n: 12, f: {}, metric: 'net', sort: null, dir: 1, pv: null };
function sheetSection(body){
  var box = K.head(body, 'vsTitle', 'vsLead');
  box.innerHTML = '<div id="vsBox"></div>'; var el = $('#vsBox', box);
  function load(){
    K.busy(el);
    api('payrollPivot', { months: PS.n, detail: PS.month || undefined }, true).then(function(r){
      if (!el.isConnected) return; if (!r.ok) return el.innerHTML = K.bad(r.error);
      if (!r.months.length) return el.innerHTML = K.empty('table', t('vsNone'));
      if (!PS.month || r.detail !== PS.month) { PS.month = r.detail || r.months[r.months.length - 1]; if (r.detail !== PS.month) return load(); }
      PS.pv = r; draw();
    });
  }
  function filtered(){
    var f = PS.f, q = String(f.q || '').trim().toLowerCase(), n = function(v){ return v === '' || v == null ? null : Number(v); };
    return PS.pv.rows.filter(function(x){
      if (f.sponsor && x.sponsor !== f.sponsor) return false; if (f.department && x.department !== f.department) return false; if (f.title && x.title !== f.title) return false;
      if (f.location && x.location !== f.location) return false; if (f.city && x.city !== f.city) return false; if (f.nationality && x.nationality !== f.nationality) return false;
      if (f.saudi && String(x.saudi) !== f.saudi) return false; if (f.employmentType && x.employmentType !== f.employmentType) return false; if (f.level && level(x.title) !== f.level) return false;
      if (f.status && x.status !== f.status) return false;
      if (n(f.gFrom) != null && x.gross < n(f.gFrom)) return false; if (n(f.gTo) != null && x.gross > n(f.gTo)) return false;
      if (n(f.nFrom) != null && x.net < n(f.nFrom)) return false; if (n(f.nTo) != null && x.net > n(f.nTo)) return false;
      if (q && String(x.name).toLowerCase().indexOf(q) < 0 && x.empNo.indexOf(q) < 0 && x.idNo.indexOf(q) < 0) return false;
      return true;
    });
  }
  function draw(){
    var r = PS.pv, f = PS.f, rows = filtered(), all = r.rows;
    var lineKeys = orderLines(r.lineKeys.filter(function(k){ return rows.some(function(x){ return x.lines[k]; }); }));
    var spCols = payCols(lineKeys, false), rowCols = payCols(lineKeys, true);
    var colLabel = function(c){ return c.indexOf('l:') === 0 ? esc(lineName(c.slice(2))) : t({ days: 'vsDays', gross: 'vsGross', deductions: 'vsDed', net: 'vsNet' }[c]); };
    var colVal = function(x, c){ return c.indexOf('l:') === 0 ? (x.lines[c.slice(2)] || 0) : (x[c] || 0); };
    var colCell = function(x, c){ return c === 'days' ? '<td class="n">' + (x.days == null ? '' : x.days) + '</td>' : '<td class="n">' + (c === 'net' ? '<b>' + amt(colVal(x, c)) + '</b>' : amt(colVal(x, c))) + '</td>'; };
    var colFoot = function(list, c){ return c === 'days' ? '<td></td>' : '<td class="n">' + amt(list.reduce(function(a, x){ return a + colVal(x, c); }, 0)) + '</td>'; };
    if (PS.sort) rows.sort(function(a, b){ var u = PS.sort.indexOf('l:') === 0 ? (a.lines[PS.sort.slice(2)] || 0) : a[PS.sort], v = PS.sort.indexOf('l:') === 0 ? (b.lines[PS.sort.slice(2)] || 0) : b[PS.sort]; return (typeof u === 'number' ? u - v : String(u).localeCompare(String(v))) * PS.dir; });
    var bySp = {}; rows.forEach(function(x){ var s = bySp[x.sponsor] = bySp[x.sponsor] || { sponsor: x.sponsor, head: 0, gross: 0, deductions: 0, net: 0, gosiEmployer: 0, lines: {} }; s.head++; ['gross', 'deductions', 'net', 'gosiEmployer'].forEach(function(k){ s[k] += x[k]; }); Object.keys(x.lines).forEach(function(k){ s.lines[k] = (s.lines[k] || 0) + x.lines[k]; }); });
    var cell = function(m, s){ for (var i = 0; i < r.cells.length; i++) if (r.cells[i].month === m && r.cells[i].sponsor === s) return r.cells[i]; return null; };
    var sps = f.sponsor ? [f.sponsor] : r.sponsors, M = PS.metric;
    var th = function(k, label, cls){ return '<th class="' + (cls || '') + '" data-s="' + k + '">' + label + (PS.sort === k ? (PS.dir > 0 ? ' ▲' : ' ▼') : '') + '</th>'; };
    el.innerHTML =
      '<div class="toolbar"><label class="vs-f"><span>' + t('vsMonth') + '</span><select id="vsM">' + r.allMonths.slice().reverse().map(function(m){ return '<option value="' + m + '"' + (m === PS.month ? ' selected' : '') + '>' + esc(mon(m)) + '</option>'; }).join('') + '</select></label>' +
      '<span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="vsX">' + ph('microsoft-excel-logo') + t('vsExcel') + '</button></div>' +
      '<div class="vs-fl"><label class="vs-f vs-q"><span>' + t('vsSearch') + '</span><input data-f="q" type="search" value="' + esc(f.q || '') + '"></label>' +
      sel('sponsor', 'vsSponsor', uniq(all, 'sponsor'), f.sponsor) + sel('department', 'vsDept', uniq(all, 'department'), f.department) + sel('title', 'vsPos', uniq(all, 'title'), f.title) +
      sel('level', 'vsLevel', ['lvExec', 'lvMgr', 'lvSup', 'lvStaff'].map(function(k){ return [k, t(k)]; }), f.level) + sel('employmentType', 'vsCat', uniq(all, 'employmentType'), f.employmentType) +
      sel('location', 'vsLoc', uniq(all, 'location'), f.location) + sel('city', 'vsCity', uniq(all, 'city'), f.city) + sel('nationality', 'vsNat', uniq(all, 'nationality'), f.nationality) +
      sel('saudi', 'vsSaudi', [['true', t('vsSaudiY')], ['false', t('vsSaudiN')]], f.saudi) + sel('status', 'vsStatus', uniq(all, 'status'), f.status) +
      num('gFrom', 'vsGrossFrom', f.gFrom) + num('gTo', 'vsGrossTo', f.gTo) + num('nFrom', 'vsNetFrom', f.nFrom) + num('nTo', 'vsNetTo', f.nTo) +
      '<button type="button" class="btn btn-line btn-sm" id="vsC">' + t('vsClear') + '</button></div>' +
      K.tiles([[t('vsHead'), String(rows.length), t('vsShown').replace('{n}', rows.length).replace('{t}', all.length), true], [t('vsGross'), amt(sum(rows, 'gross'))], [t('vsDed'), amt(sum(rows, 'deductions'))],
        [t('vsNet'), amt(sum(rows, 'net'))], [t('vsGosiR'), amt(sum(rows, 'gosiEmployer'))]]) +
      '<h3 class="vs-h">' + t('vsPivot') + '</h3><p class="hr-hint">' + t('vsPivotLead') + '</p><div class="toolbar">' +
      sel('metric', 'vsMetric', [['net', t('vsNet')], ['gross', t('vsGross')], ['deductions', t('vsDed')], ['companyCost', t('vsCost')], ['gosiEmployer', t('vsGosiR')], ['headcount', t('vsHead')]], M).replace('data-f="metric"', 'id="vsMet"') +
      sel('n', 'vsMonths', [6, 12, 24].map(function(x){ return [x, x]; }), PS.n).replace('data-f="n"', 'id="vsN"') + '</div>' +
      '<div class="vs-wrap"><table class="vs-tbl" id="vsPivot"><thead><tr><th>' + t('vsMonth') + '</th>' + sps.map(function(s){ return '<th class="n">' + esc(s) + '</th>'; }).join('') + '<th class="n">' + t('vsTotal') + '</th></tr></thead><tbody>' +
        r.months.map(function(m){ var tot = 0; return '<tr><td>' + esc(mon(m)) + '</td>' + sps.map(function(s){ var c = cell(m, s), v = c ? c[M] || 0 : 0; tot += v; return '<td class="n">' + (M === 'headcount' ? v : amt(v)) + '</td>'; }).join('') + '<td class="n"><b>' + (M === 'headcount' ? tot : amt(tot)) + '</b></td></tr>'; }).join('') +
        '</tbody><tfoot><tr><td>' + t('vsTotal') + '</td>' + sps.map(function(s){ var v = r.months.reduce(function(a, m){ var c = cell(m, s); return a + (c ? c[M] || 0 : 0); }, 0); return '<td class="n">' + (M === 'headcount' ? v : amt(v)) + '</td>'; }).join('') +
        '<td class="n">' + (function(){ var v = r.months.reduce(function(a, m){ return a + sps.reduce(function(b, s){ var c = cell(m, s); return b + (c ? c[M] || 0 : 0); }, 0); }, 0); return M === 'headcount' ? v : amt(v); })() + '</td></tr></tfoot></table></div>' +
      '<h3 class="vs-h">' + t('vsBySponsor') + ' · ' + esc(mon(PS.month)) + '</h3><div class="vs-wrap"><table class="vs-tbl"><thead><tr><th>' + t('vsSponsor') + '</th><th class="n">' + t('vsHead') + '</th>' + spCols.map(function(c){ return '<th class="n">' + colLabel(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        Object.keys(bySp).map(function(k){ var s = bySp[k]; return '<tr class="go" data-sp="' + esc(k) + '"><td>' + esc(k) + '</td><td class="n">' + s.head + '</td>' + spCols.map(function(c){ return colCell(s, c); }).join('') + '</tr>'; }).join('') +
        '</tbody><tfoot><tr><td>' + t('vsTotal') + '</td><td class="n">' + rows.length + '</td>' + spCols.map(function(c){ return colFoot(rows, c); }).join('') + '</tr></tfoot></table></div>' +
      '<h3 class="vs-h">' + t('vsSheet') + ' · ' + t('vsShown').replace('{n}', rows.length).replace('{t}', all.length) + '</h3><div class="vs-wrap"><table class="vs-tbl"><thead><tr>' + th('sponsor', t('vsSponsor')) + th('empNo', t('vsEmpNo')) + th('name', t('vsName')) + th('idNo', t('vsId')) +
        th('department', t('vsDept')) + th('title', t('vsPos')) + th('location', t('vsLoc')) + th('city', t('vsCity')) + th('nationality', t('vsNat')) +
        rowCols.map(function(c){ return th(c, colLabel(c), 'n'); }).join('') + '</tr></thead><tbody>' +
        rows.map(function(x){ return '<tr><td>' + esc(x.sponsor) + '</td><td dir="ltr">' + esc(x.empNo) + '</td><td>' + esc(x.name) + '</td><td dir="ltr">' + esc(x.idNo) + '</td><td>' + esc(x.department) + '</td><td>' + esc(x.title) + '</td><td>' + esc(x.location) + '</td><td>' + esc(x.city) + '</td><td>' + esc(x.nationality) + '</td>' +
          rowCols.map(function(c){ return colCell(x, c); }).join('') + '</tr>'; }).join('') +
        '</tbody><tfoot><tr><td colspan="9">' + t('vsTotal') + '</td>' + rowCols.map(function(c){ return colFoot(rows, c); }).join('') + '</tr></tfoot></table></div>';
    $('#vsM', el).onchange = function(){ PS.month = this.value; load(); };
    $('#vsN', el).onchange = function(){ PS.n = +this.value; load(); };
    $('#vsMet', el).onchange = function(){ PS.metric = this.value; draw(); };
    $('#vsC', el).onclick = function(){ PS.f = {}; draw(); };
    $$('[data-f]', el).forEach(function(c){ var go = function(){ PS.f[c.dataset.f] = c.value; var pos = c.selectionStart; draw(); var n = $('[data-f="' + c.dataset.f + '"]', el); if (n && n.type !== 'select-one') { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } };
      if (c.tagName === 'SELECT') c.onchange = go; else { var tm; c.oninput = function(){ clearTimeout(tm); tm = setTimeout(go, 300); }; } });
    $$('[data-s]', el).forEach(function(h){ h.onclick = function(){ if (PS.sort === h.dataset.s) PS.dir = -PS.dir; else { PS.sort = h.dataset.s; PS.dir = 1; } draw(); }; });
    $$('[data-sp]', el).forEach(function(tr){ tr.onclick = function(){ PS.f.sponsor = tr.dataset.sp; draw(); }; });
    $('#vsX', el).onclick = function(){ exportSheet(rows, lineKeys, sps, cell); };
  }
  function exportSheet(rows, lineKeys, sps, cell){
    var r = PS.pv, en = S.lang === 'en', title = t('vsTitle') + ' ' + PS.month;
    var cols = [{ key: 'sponsor', label: t('vsSponsor'), type: 'text' }, { key: 'empNo', label: t('vsEmpNo'), type: 'text' }, { key: 'name', label: t('vsName'), type: 'text' }, { key: 'idNo', label: t('vsId'), type: 'text' },
      { key: 'department', label: t('vsDept'), type: 'text' }, { key: 'title', label: t('vsPos'), type: 'text' }, { key: 'level', label: t('vsLevel'), type: 'text' }, { key: 'employmentType', label: t('vsCat'), type: 'text' },
      { key: 'location', label: t('vsLoc'), type: 'text' }, { key: 'city', label: t('vsCity'), type: 'text' }, { key: 'nationality', label: t('vsNat'), type: 'text' }, { key: 'status', label: t('vsStatus'), type: 'text' }]
      .concat(payCols(lineKeys, true).map(function(c){ return c === 'days' ? { key: 'days', label: t('vsDays'), type: 'num' } : c.indexOf('l:') === 0 ? { key: 'L' + c.slice(2), label: lineName(c.slice(2)), type: 'money', sum: true }
        : { key: c, label: t({ gross: 'vsGross', deductions: 'vsDed', net: 'vsNet' }[c]), type: 'money', sum: true }; }))
      .concat([{ key: 'gosiEmployer', label: t('vsGosiR'), type: 'money', sum: true }]);
    var flat = function(list){ return list.map(function(x){ var o = Object.assign({}, x, { level: t(level(x.title)) }); lineKeys.forEach(function(k){ o['L' + k] = x.lines[k] || 0; }); delete o.lines; return o; }); };
    var pivotCols = [{ key: 'month', label: t('vsMonth'), type: 'text' }].concat(sps.map(function(s, i){ return { key: 's' + i, label: s, type: 'money', sum: true }; })).concat([{ key: 'total', label: t('vsTotal'), type: 'money', sum: true }]);
    var pivot = function(metric){ return r.months.map(function(m){ var o = { month: m }, tt = 0; sps.forEach(function(s, i){ var c = cell(m, s), v = c ? c[metric] || 0 : 0; o['s' + i] = v; tt += v; }); o.total = tt; return o; }); };
    var sheets = [{ name: xlName(t('vsSheet')), title: title, columns: cols, rows: flat(rows) },
      { name: xlName(t('vsPivot') + ' ' + t('vsNet')), title: t('vsPivot') + ' · ' + t('vsNet'), columns: pivotCols, rows: pivot('net') },
      { name: xlName(t('vsPivot') + ' ' + t('vsGross')), title: t('vsPivot') + ' · ' + t('vsGross'), columns: pivotCols, rows: pivot('gross') },
      { name: xlName(t('vsPivot') + ' ' + t('vsCost')), title: t('vsPivot') + ' · ' + t('vsCost'), columns: pivotCols, rows: pivot('companyCost') }];
    var seen = {}; uniq(rows, 'sponsor').forEach(function(s){ var n = xlName(s), i = 2; while (seen[n]) n = xlName(s).slice(0, 27) + ' ' + i++; seen[n] = 1; sheets.push({ name: n, title: s + ' · ' + PS.month, columns: cols, rows: flat(rows.filter(function(x){ return x.sponsor === s; })) }); });
    var fl = Object.keys(PS.f).filter(function(k){ return PS.f[k]; }).map(function(k){ return [k, String(PS.f[k])]; });
    loadScript('js/xl.js').then(function(){ return XL.download({ fileName: 'PAYROLL_' + PS.month + '_ALL_SPONSORS', title: title, lang: en ? 'en' : 'ar', company: coName(), by: S.me.name, logo: logoInk(), filters: fl, sheets: sheets }); })
      .then(function(){ toast(t('v2Exported')); }, function(){ toast(errText('network')); });
  }
  load();
}

// ======================================================================= variance analysis
var VA = { month: '', compare: 'm1', pct: 10, min: 100, f: {}, dim: 'payGroup' };
var DIMS = [['payGroup', 'vsSponsor'], ['department', 'vsDept'], ['location', 'vsLoc'], ['city', 'vsCity'], ['title', 'vsPos'], ['nationality', 'vsNat'], ['saudi', 'vsSaudi'], ['employmentType', 'vsCat']];
function dimVal(k, v){ return k === 'saudi' ? t(v === 'saudi' ? 'vsSaudiY' : 'vsSaudiN') : v; }
function varianceSection(body){
  var box = K.head(body, 'vaTitle2', 'vaLead2'); box.innerHTML = '<div id="vaBox"></div>'; var el = $('#vaBox', box), R = null;
  function load(){
    K.busy(el);
    var filters = {}; Object.keys(VA.f).forEach(function(k){ var v = VA.f[k]; if (v === '' || v == null) return; filters[k] = k === 'q' || k === 'changed' ? v : [v]; });
    api('payrollVarianceMonth', { month: VA.month || undefined, compare: VA.compare, pct: VA.pct, min: VA.min, filters: filters }, true).then(function(r){
      if (!el.isConnected) return; if (!r.ok) return el.innerHTML = K.bad(r.error); if (r.empty) return el.innerHTML = K.empty('chart-line-up', t('vsNone'));
      R = r; VA.r = r; VA.month = r.month; draw();
    });
  }
  function draw(){
    var r = R, T0 = r.totals, b = r.bridge, D = r.drivers;
    var steps = [['vaFrom', b.from, 'base']].concat([['dv_joiners', b.joiners], ['dv_leavers', b.leavers]]).concat(Object.keys(D).filter(function(k){ return D[k]; }).map(function(k){ return ['dv_' + k, D[k]]; })).concat([['vaTo', b.to, 'base']]);
    var mx = Math.max.apply(null, steps.map(function(s){ return Math.abs(s[1]); }).concat([1]));
    var dimRows = r.dims[VA.dim] || [];
    el.innerHTML = '<div class="toolbar vs-fl">' +
      '<label class="vs-f"><span>' + t('vsMonth') + '</span><select id="vaM">' + r.months.map(function(m){ return '<option value="' + m + '"' + (m === r.month ? ' selected' : '') + '>' + esc(mon(m)) + '</option>'; }).join('') + '</select></label>' +
      '<label class="vs-f"><span>' + t('vaCmp') + '</span><select id="vaC">' + [['m1', t('vaM1')], ['m2', t('vaM2')], ['avg3', t('vaAvg3')], ['avg6', t('vaAvg6')], ['avg12', t('vaAvg12')], ['yoy', t('vaYoy')], ['pick', t('vaPick')]].concat(r.months.filter(function(m){ return m !== r.month; }).map(function(m){ return [m, mon(m)]; }))
        .map(function(o){ return '<option value="' + o[0] + '"' + (o[0] === r.compare || (o[0] === 'pick' && String(r.compare).indexOf('pick:') === 0) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>' +
      '<label class="vs-f vs-n"><span>' + t('vaPct') + '</span><input id="vaP" type="number" dir="ltr" value="' + r.threshold.pct + '"></label><label class="vs-f vs-n"><span>' + t('vaMin') + '</span><input id="vaN" type="number" dir="ltr" value="' + r.threshold.min + '"></label>' +
      '<label class="vs-f vs-q"><span>' + t('vsSearch') + '</span><input id="vaQ" type="search" value="' + esc(VA.f.q || '') + '"></label>' +
      DIMS.map(function(d){ return sel(d[0], d[1], (r.options[d[0]] || []).map(function(o){ return [o.value, dimVal(d[0], o.value) + ' (' + o.count + ')']; }), VA.f[d[0]]); }).join('') +
      sel('flags', 'vaFlags', Object.keys(r.flagCounts).map(function(k){ return [k, t('fl_' + k) + ' (' + r.flagCounts[k] + ')']; }), VA.f.flags) +
      '<label class="vs-f" style="flex-direction:row;align-items:center;gap:6px;max-width:none"><input id="vaCh" type="checkbox"' + (VA.f.changed ? ' checked' : '') + '><span>' + t('vaChanged') + '</span></label>' +
      '<button type="button" class="btn btn-line btn-sm" id="vaClr">' + t('vsClear') + '</button><button type="button" class="btn btn-line btn-sm" id="vaCity">' + ph('map-pin') + t('vaCities') + '</button>' +
      '<button type="button" class="btn btn-dark btn-sm" id="vaX">' + ph('microsoft-excel-logo') + 'Excel</button></div>' +
      (function(){ var picked = String(r.compare).indexOf('pick:') === 0 ? r.baseMonths : [], open = VA.picking || picked.length;
        var earlier = r.months.filter(function(m){ return m < r.month; });
        return (open ? '<div class="vs-pick" id="vaPk"><p>' + t('vaPickLead') + '</p><div class="vs-pick-m">' + earlier.map(function(m){ return '<label><input type="checkbox" value="' + m + '"' + (picked.indexOf(m) >= 0 ? ' checked' : '') + '><span>' + esc(mon(m)) + '</span></label>'; }).join('') + '</div>' +
          '<div class="btnrow"><button type="button" class="btn btn-line btn-sm" data-pk="all">' + t('vaPickAll') + '</button><button type="button" class="btn btn-line btn-sm" data-pk="none">' + t('vaPickNone') + '</button><button type="button" class="btn btn-dark btn-sm" id="vaPkGo">' + t('vaPickGo') + '</button></div></div>' : '') +
          '<p class="vs-base">' + t('vaBaseIs') + ': <b>' + (r.baseMonths || []).map(function(m){ return esc(mon(m)); }).join('، ') + '</b>' + ((r.baseMonths || []).length > 1 ? ' (' + t('vaAvgWord') + ')' : '') + '</p>'; })() +
      K.tiles([[t('vsHead'), String(T0.headcount.cur), chg(T0.headcount.change), true], [t('vsGross'), amt(T0.gross.cur), chg(T0.gross.change)], [t('vsDed'), amt(T0.deductions.cur), chg(T0.deductions.change)],
        [t('vsNet'), amt(T0.net.cur), chg(T0.net.change)], [t('vsCost'), amt(T0.companyCost.cur), chg(T0.companyCost.change)]]) +
      '<h3 class="vs-h">' + t('vaBridge') + '</h3>' + steps.map(function(s){ var w = Math.round(Math.abs(s[1]) / mx * 100); return '<div class="vs-bar"><span>' + t(s[0]) + '</span><span><i class="' + (s[2] ? '' : s[1] < 0 ? 'neg' : 'pos') + '" style="width:' + Math.max(1, w) + '%"></i></span><b class="num" dir="ltr">' + (s[2] ? '' : s[1] > 0 ? '+' : '') + acctFmt(s[1]) + '</b></div>'; }).join('') +
      '<h3 class="vs-h">' + t('vaBy') + '</h3><div class="vs-tabs">' + DIMS.map(function(d){ return '<button type="button" data-dim="' + d[0] + '" aria-pressed="' + (VA.dim === d[0]) + '">' + t(d[1]) + '</button>'; }).join('') + '</div>' +
      '<div class="vs-wrap"><table class="vs-tbl"><thead><tr><th>' + t(DIMS.filter(function(d){ return d[0] === VA.dim; })[0][1]) + '</th><th class="n">' + vaL('base') + ' · ' + t('vsHead') + '</th><th class="n">' + vaL('now') + ' · ' + t('vsHead') + '</th><th class="n">' + t('vaJoin') + '</th><th class="n">' + t('vaLeave') + '</th>' +
        '<th class="n">' + vaL('base') + ' · ' + t('vsNet') + '</th><th class="n">' + vaL('now') + ' · ' + t('vsNet') + '</th><th class="n">' + t('vaChg') + '</th><th>' + t('vaFlags') + '</th></tr></thead><tbody>' +
        dimRows.map(function(d){ return '<tr class="go' + (VA.dim === 'city' && d.assumed ? ' vs-assumed' : '') + '" data-dv="' + esc(d.key) + '"><td>' + esc(dimVal(VA.dim, d.key)) + '</td><td class="n">' + d.headBase + '</td><td class="n">' + d.headCur + '</td><td class="n">' + d.joiners + '</td><td class="n">' + d.leavers + '</td>' +
          '<td class="n">' + amt(d.netBase) + '</td><td class="n">' + amt(d.netCur) + '</td><td class="n">' + chg(d.net) + '</td><td>' + (d.topDriver ? '<span class="vs-flag">' + t('dv_' + d.topDriver.key) + ' ' + acctFmt(d.topDriver.amount) + '</span>' : '') + (d.flagged ? ' <small>' + d.flagged + '</small>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<h3 class="vs-h">' + t('vaLines') + '</h3><div class="vs-wrap"><table class="vs-tbl"><thead><tr><th>' + t('vaLines') + '</th><th class="n">' + vaL('base') + '</th><th class="n">' + vaL('now') + '</th><th class="n">' + t('vaChg') + '</th></tr></thead><tbody>' +
        r.lines.slice().sort(function(a, b){ return lineRank(a.code) - lineRank(b.code); }).map(function(l){ return '<tr><td>' + esc(lineName(l.code)) + (l.code.indexOf('d:') === 0 ? ' <small>(-)</small>' : '') + '</td><td class="n">' + amt(l.base) + '</td><td class="n">' + amt(l.cur) + '</td><td class="n">' + chg(l.change) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<h3 class="vs-h">' + t('vaPeople') + ' · ' + t('vsShown').replace('{n}', r.shown).replace('{t}', r.all) + '</h3><div class="vs-wrap"><table class="vs-tbl"><thead><tr><th>' + t('vsEmpNo') + '</th><th>' + t('vsName') + '</th><th>' + t('vsSponsor') + '</th><th>' + t('vsDept') + '</th><th>' + t('vsLoc') + '</th>' +
        '<th class="n">' + vaL('base') + '</th><th class="n">' + vaL('now') + '</th><th class="n">' + t('vaChg') + '</th><th>' + t('vaFlags') + '</th></tr></thead><tbody>' +
        r.people.slice(0, 400).map(function(p, i){ return '<tr class="go" data-pi="' + i + '"><td dir="ltr">' + esc(p.empNo) + '</td><td>' + esc(p.name) + '</td><td>' + esc(p.dims.payGroup) + '</td><td>' + esc(p.dims.department) + '</td><td>' + esc(p.dims.location) + '</td>' +
          '<td class="n">' + amt(p.base ? p.base.net : null) + '</td><td class="n">' + amt(p.cur ? p.cur.net : null) + '</td><td class="n">' + chg(p.net) + '</td><td>' + p.flags.map(function(f){ return '<span class="vs-flag">' + t('fl_' + f) + '</span>'; }).join('') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    var re = function(){ load(); };
    $('#vaM', el).onchange = function(){ VA.month = this.value; re(); };
    $('#vaC', el).onchange = function(){ if (this.value === 'pick') { VA.picking = true; draw(); return; } VA.picking = false; VA.compare = this.value; re(); };
    if ($('#vaPk', el)) {
      $$('[data-pk]', el).forEach(function(b){ b.onclick = function(){ $$('#vaPk input', el).forEach(function(c){ c.checked = b.dataset.pk === 'all'; }); }; });
      $('#vaPkGo', el).onclick = function(){ var ms = $$('#vaPk input', el).filter(function(c){ return c.checked; }).map(function(c){ return c.value; }); if (!ms.length) return toast(t('vaPickLead')); VA.compare = 'pick:' + ms.join(','); VA.picking = false; re(); };
    }
    $('#vaP', el).onchange = function(){ VA.pct = +this.value || 10; re(); };
    $('#vaN', el).onchange = function(){ VA.min = this.value === '' ? 100 : +this.value; re(); };
    var tm; $('#vaQ', el).oninput = function(){ var v = this.value; clearTimeout(tm); tm = setTimeout(function(){ VA.f.q = v; re(); }, 400); };
    $('#vaCh', el).onchange = function(){ VA.f.changed = this.checked; re(); };
    $('#vaClr', el).onclick = function(){ VA.f = {}; re(); };
    $$('select[data-f]', el).forEach(function(s){ s.onchange = function(){ VA.f[s.dataset.f] = s.value; re(); }; });
    $$('[data-dim]', el).forEach(function(b2){ b2.onclick = function(){ VA.dim = b2.dataset.dim; draw(); }; });
    $$('[data-dv]', el).forEach(function(tr){ tr.onclick = function(){ VA.f[VA.dim] = tr.dataset.dv; re(); }; });
    $$('[data-pi]', el).forEach(function(tr){ tr.onclick = function(){ person(r.people[+tr.dataset.pi]); }; });
    $('#vaCity', el).onclick = cities;
    $('#vaX', el).onclick = function(){ exportVar(r); };
  }
  function person(p){
    var keys = orderLines(Object.keys(p.lines));
    drawer('<h3>' + esc(p.name) + ' <small dir="ltr">' + esc(p.empNo) + '</small></h3><p class="hr-hint">' + esc([p.dims.payGroup, p.dims.department, p.dims.title, p.dims.location, p.dims.city].join(' · ')) + '</p>' +
      '<p>' + p.flags.map(function(f){ return '<span class="vs-flag">' + t('fl_' + f) + '</span>'; }).join('') + '</p>' +
      '<div class="vs-wrap"><table class="vs-tbl"><thead><tr><th>' + t('vaLines') + '</th><th class="n">' + vaL('base') + '</th><th class="n">' + vaL('now') + '</th><th class="n">' + t('vaChg') + '</th></tr></thead><tbody>' +
      keys.map(function(k){ var v = p.lines[k]; return '<tr><td>' + esc(lineName(k)) + (k.indexOf('d:') === 0 ? ' (-)' : '') + '</td><td class="n">' + amt(v[1]) + '</td><td class="n">' + amt(v[0]) + '</td><td class="n">' + chg({ diff: Math.round((v[0] - v[1]) * 100) / 100, pct: null }) + '</td></tr>'; }).join('') +
      '<tr><td><b>' + t('vsNet') + '</b></td><td class="n">' + amt(p.base ? p.base.net : null) + '</td><td class="n"><b>' + amt(p.cur ? p.cur.net : null) + '</b></td><td class="n">' + chg(p.net) + '</td></tr></tbody></table></div>' +
      (p.package != null ? '<p class="hr-hint">' + t('fl_off_package') + ': ' + acctFmt(p.package) + '</p>' : '') +
      '<div class="vs-bar" style="grid-template-columns:repeat(12,1fr);align-items:end;height:80px" dir="ltr">' + (function(){ var mx = Math.max.apply(null, p.hist.map(function(v){ return Math.abs(v || 0); }).concat([1])); return p.hist.map(function(v){ return '<i title="' + (v == null ? '-' : acctFmt(v)) + '" style="height:' + Math.max(2, Math.round(Math.abs(v || 0) / mx * 70)) + 'px;' + (v == null ? 'opacity:.15' : '') + '"></i>'; }).join(''); })() + '</div>');
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
        { key: 'baseGross', label: vaL('base') + ' ' + t('vsGross'), type: 'money', sum: true }, { key: 'curGross', label: vaL('now') + ' ' + t('vsGross'), type: 'money', sum: true }, { key: 'flags', label: t('vaFlags'), type: 'text' }, { key: 'score', label: 'Score', type: 'int' }]);
    var prow = r.people.map(function(p){ var o = { empNo: p.empNo, name: p.name, baseNet: p.base ? p.base.net : 0, curNet: p.cur ? p.cur.net : 0, diff: p.net.diff, baseGross: p.base ? p.base.gross : 0, curGross: p.cur ? p.cur.gross : 0,
      flags: p.flags.map(function(f){ return t('fl_' + f); }).join(', '), score: p.score }; DIMS.forEach(function(d){ o[d[0]] = dimVal(d[0], p.dims[d[0]]); }); return o; });
    var dc = [{ key: 'key', label: t('vaBy'), type: 'text' }, { key: 'headBase', label: vaL('base') + ' ' + t('vsHead'), type: 'int', sum: true }, { key: 'headCur', label: vaL('now') + ' ' + t('vsHead'), type: 'int', sum: true },
      { key: 'joiners', label: t('vaJoin'), type: 'int', sum: true }, { key: 'leavers', label: t('vaLeave'), type: 'int', sum: true }, { key: 'netBase', label: vaL('base') + ' ' + t('vsNet'), type: 'money', sum: true },
      { key: 'netCur', label: vaL('now') + ' ' + t('vsNet'), type: 'money', sum: true }, { key: 'diff', label: t('vaChg'), type: 'money', sum: true }];
    var sheets = [{ name: xlName(t('vaPeople')), title: title, columns: pc, rows: prow }].concat(DIMS.map(function(d){ return { name: xlName(t(d[1])), title: title + ' · ' + t(d[1]), columns: dc,
      rows: r.dims[d[0]].map(function(x){ return { key: dimVal(d[0], x.key), headBase: x.headBase, headCur: x.headCur, joiners: x.joiners, leavers: x.leavers, netBase: x.netBase, netCur: x.netCur, diff: x.net.diff }; }) }; }))
      .concat([{ name: xlName(t('vaLines')), title: title, columns: [{ key: 'l', label: t('vaLines'), type: 'text' }, { key: 'b', label: vaL('base'), type: 'money', sum: true }, { key: 'c', label: vaL('now'), type: 'money', sum: true }, { key: 'd', label: t('vaChg'), type: 'money', sum: true }],
        rows: r.lines.slice().sort(function(a, b){ return lineRank(a.code) - lineRank(b.code); }).map(function(l){ return { l: lineName(l.code), b: l.base, c: l.cur, d: l.change.diff }; }) }]);
    loadScript('js/xl.js').then(function(){ return XL.download({ fileName: 'VARIANCE_' + r.month, title: title, lang: en ? 'en' : 'ar', company: coName(), by: S.me.name, logo: logoInk(), sheets: sheets }); })
      .then(function(){ toast(t('v2Exported')); }, function(){ toast(errText('network')); });
  }
  load();
}
window.PaySheet = { section: sheetSection };
window.Variance = { section: varianceSection };
})();
