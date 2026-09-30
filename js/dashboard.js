// Management dashboard: every figure comes from api dashboard (Dashboard.gs); this file only draws.
// Palette validated with the dataviz validator on the white card surface: green #2E7D4F, amber #C98500, blue #2a78d6
// (CVD adjacent dE 10.5, normal-vision 21.7, all >= 3:1). Text never wears a series colour.
(function(){
'use strict';

Object.assign(T.ar, {
  dbTitle:'لوحة الإدارة', dbThisMonth:'هذا الشهر', dbLastMonth:'الشهر الماضي', dbLast30:'آخر 30 يوما', dbLast90:'آخر 90 يوما', dbPrint:'طباعة',
  dbAttRate:'نسبة الحضور', dbPunct:'الانضباط في الموعد', dbAvgLate:'متوسط التأخير', dbAbsent:'أيام الغياب', dbOvertime:'ساعات إضافية', dbOnLeave:'في إجازة اليوم',
  dbVsPrev:'عن الفترة السابقة', dbMinutes:'دقيقة', dbHours:'ساعة', dbTrend:'الحضور يوما بيوم', dbTrendLead:'نسبة من حضر من المتوقع حضورهم كل يوم عمل.',
  dbWeekday:'التأخير حسب يوم الأسبوع', dbWeekdayLead:'نسبة المتأخرين من المتوقع حضورهم.', dbCheckin:'أوقات تسجيل الحضور', dbCheckinLead:'عدد البصمات كل ربع ساعة. الأعمدة البرتقالية بعد بداية الدوام ومهلة التأخير.', dbPts:'نقطة',
  dbDepts:'الإدارات', dbDeptLead:'نسبة الحضور لكل إدارة، والانضباط بجانبها.', dbTopLate:'الأكثر تأخيرا', dbTopAbsent:'الأكثر غيابا', dbDays:'أيام', dbTimes:'مرات',
  dbWorkforce:'القوى العاملة', dbHeadcount:'الموظفون النشطون', dbSaudization:'التوطين المرجح (نطاقات)', dbTarget:'المستهدف', dbNoTarget:'حدد النسبة المستهدفة في الإعدادات (saudizationTarget) لإظهار الفجوة.',
  dbMix:'السعوديون وغير السعوديين حسب الإدارة', dbSaudi:'سعودي', dbNonSaudi:'غير سعودي', dbSaudisK:'السعوديون', dbTenure:'سنوات الخدمة', dbMovement:'المنضمون والمغادرون (12 شهرا)',
  dbJoiners:'انضموا', dbLeavers:'غادروا', dbExpiring:'وثائق تنتهي خلال 60 يوما', dbExpired:'وثائق منتهية', dbLeaveType:'الإجازات حسب النوع',
  dbPending:'طلبات تنتظر', dbOldest:'أقدم طلب مفتوح', dbSlow:'مفتوحة منذ أكثر من 3 أيام', dbSpeed:'متوسط وقت البت في الطلبات', dbPerf:'الأداء',
  dbPerfNone:'لا توجد دورة تقييم بعد.', dbNotRated:'لم يكتمل أي تقييم في هذه الدورة بعد.', dbRated:'قيموا', dbCost:'تكلفة الرواتب والالتزامات', dbWageBill:'الرواتب الشهرية السارية', dbLastCost:'تكلفة آخر مسير',
  dbGosiEr:'تأمينات على الشركة', dbOtCost:'تكلفة العمل الإضافي', dbLeaveLiab:'التزام الإجازات غير المستخدمة', dbEosLiab:'التزام مكافأة نهاية الخدمة',
  dbAdvances:'سلف غير مسددة', dbCostTrend:'تكلفة الرواتب الشهرية (الإجمالي والتأمينات على الشركة)', dbCostDept:'تكلفة آخر مسير حسب الإدارة', dbNoRuns:'لا توجد مسيرات معتمدة بعد.',
  dbTable:'جدول', dbChart:'رسم', dbGenerated:'أعدت في', dbReview:'بصمات للمراجعة', dbMissingOut:'بلا انصراف', dbLiabNote:'تقدير حتى اليوم: المكافأة كاملة لكل الموظفين حسب المادة 84، والإجازة بالأجر الإجمالي.',
  dbNoData:'لا توجد بيانات في هذه الفترة.', dbHideDash:'إخفاء الملخص', dbShowDash:'إظهار الملخص', lt_unpaid_short:'بدون راتب'
});
Object.assign(T.en, {
  dbTitle:'Management dashboard', dbThisMonth:'This month', dbLastMonth:'Last month', dbLast30:'Last 30 days', dbLast90:'Last 90 days', dbPrint:'Print',
  dbAttRate:'Attendance rate', dbPunct:'On time', dbAvgLate:'Average lateness', dbAbsent:'Absence days', dbOvertime:'Overtime hours', dbOnLeave:'On leave today',
  dbVsPrev:'vs previous period', dbMinutes:'min', dbHours:'h', dbTrend:'Attendance day by day', dbTrendLead:'Share of expected people who checked in, each working day.',
  dbWeekday:'Lateness by weekday', dbWeekdayLead:'Share of expected people who arrived late.', dbCheckin:'Check-in times', dbCheckinLead:'Check-ins per quarter hour. Amber columns are after the shift start and grace.', dbPts:'pts',
  dbDepts:'Departments', dbDeptLead:'Attendance rate per department, with on-time share beside it.', dbTopLate:'Late most often', dbTopAbsent:'Absent most often', dbDays:'days', dbTimes:'times',
  dbWorkforce:'Workforce', dbHeadcount:'Active employees', dbSaudization:'Weighted Saudization (Nitaqat)', dbTarget:'Target', dbNoTarget:'Set the target % in settings (saudizationTarget) to show the gap.',
  dbMix:'Saudi and non-Saudi by department', dbSaudi:'Saudi', dbNonSaudi:'Non-Saudi', dbSaudisK:'Saudis', dbTenure:'Years of service', dbMovement:'Joiners and leavers (12 months)',
  dbJoiners:'Joined', dbLeavers:'Left', dbExpiring:'Documents expiring within 60 days', dbExpired:'Expired documents', dbLeaveType:'Leave by type',
  dbPending:'Requests waiting', dbOldest:'Oldest open request', dbSlow:'Open more than 3 days', dbSpeed:'Average time to decide a request', dbPerf:'Performance',
  dbPerfNone:'No review cycle yet.', dbNotRated:'No review is complete in this cycle yet.', dbRated:'rated', dbCost:'Payroll cost and liabilities', dbWageBill:'Monthly wage bill in force', dbLastCost:'Last payroll cost',
  dbGosiEr:'Employer GOSI', dbOtCost:'Overtime cost', dbLeaveLiab:'Unused leave liability', dbEosLiab:'End-of-service liability',
  dbAdvances:'Advances outstanding', dbCostTrend:'Monthly payroll cost (gross plus employer GOSI)', dbCostDept:'Last payroll cost by department', dbNoRuns:'No approved payroll yet.',
  dbTable:'Table', dbChart:'Chart', dbGenerated:'Prepared', dbReview:'Punches to review', dbMissingOut:'No check-out', dbLiabNote:'Estimate as of today: full Art. 84 award for everyone, leave at total wage.',
  dbNoData:'No data in this period.', dbHideDash:'Hide summary', dbShowDash:'Show summary', lt_unpaid_short:'Unpaid'
});

var css = '' +
'.db{--s1:#2E7D4F;--s2:#C98500;--s3:#2a78d6;--grid:#e1e0d9;--axis:#c3c2b7;--muted:#898781;--wash:#F1EEE6}' +
'.db-filters{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:0 0 14px}' +
'.db-filters button{height:34px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:var(--card);font-size:13px;color:var(--ink-2)}' +
'.db-filters button[aria-pressed="true"]{background:var(--pine);color:var(--cream);border-color:var(--pine)}' +
'.db-filters .sp{flex:1}.db-filters small{color:var(--ink-2)}' +
'.db-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:14px}' +
'.db-tile{background:var(--card);border:1px solid var(--line);border-radius:var(--r-m);padding:12px 14px;min-width:0}' +
'.db-tile span{display:block;font-size:12.5px;color:var(--ink-2)}' +
'.db-tile b{display:block;font-size:26px;font-weight:600;line-height:1.2;margin-top:2px}' +
'.db-tile small{display:block;font-size:12px;color:var(--ink-2);margin-top:2px}' +
'.db-tile .up{color:#006300}.db-tile .down{color:#b3261e}' +
'.db-tile.lead{grid-column:1 / -1;background:var(--pine);border-color:var(--pine);color:var(--cream)}.db-tile.lead span,.db-tile.lead small{color:#AFC0AD}' +
'.db-tile.lead b{font-size:48px}.db-tile.lead .up{color:#9FE0AE}.db-tile.lead .down{color:#F4B4A8}' +
'.db-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;margin-bottom:14px}' +
'.db-card{background:var(--card);border:1px solid var(--line);border-radius:var(--r-m);padding:14px 16px;min-width:0;position:relative}' +
'.db-card h3{margin:0;font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px}.db-card h3 .sp{flex:1}' +
'.db-card > p{margin:2px 0 10px;color:var(--ink-2);font-size:12.5px}' +
'.db-card .tg{height:28px;padding:0 10px;border-radius:8px;border:1px solid var(--line);background:var(--paper);font-size:12px;color:var(--ink-2)}' +
'.db-h{margin:22px 0 10px;font-size:17px;font-weight:600}' +
'.db-svg{width:100%;height:auto;display:block;overflow:visible;direction:ltr;unicode-bidi:isolate}' +
'.db-svg text{direction:ltr;unicode-bidi:plaintext}' +
'.db-svg text{font-size:11px;fill:var(--muted);font-family:var(--font)}' +
'.db-cols{display:flex;align-items:flex-end;gap:2px;height:150px;direction:ltr;padding-top:18px}' +
'.db-cols .c{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;min-width:0;cursor:default}' +
'.db-cols .c i{display:block;width:78%;max-width:34px;background:var(--s1);border-radius:4px 4px 0 0;min-height:1px;transition:opacity .15s}' +
'.db-cols .c i.alt{background:var(--s2)}.db-cols .c:hover i,.db-cols .c:focus i{opacity:.75}' +
'.db-cols .c span{font-size:10.5px;color:var(--muted);margin-top:4px;white-space:nowrap}' +
'.db-cols .c em{font-style:normal;font-size:11px;color:var(--ink-2);margin-bottom:2px;font-variant-numeric:tabular-nums}' +
'.db-cols .grp{flex:1;display:flex;align-items:flex-end;justify-content:center;gap:2px;height:100%;flex-direction:row;position:relative;padding-bottom:18px}' +
'.db-cols .grp i{width:40%;max-width:14px;border-radius:4px 4px 0 0;background:var(--s1)}.db-cols .grp i.b{background:var(--s2)}' +
'.db-cols .grp span{position:absolute;bottom:0;font-size:10px;color:var(--muted)}' +
'.db-hbars{display:grid;gap:8px}' +
'.db-hb{display:grid;grid-template-columns:minmax(90px,32%) 1fr auto;gap:10px;align-items:center;font-size:13px}' +
'.db-hb .tr{height:14px;background:var(--wash);border-radius:4px;position:relative;overflow:hidden}' +
'.db-hb .tr i{position:absolute;inset-block:0;inset-inline-start:0;background:var(--s1);border-radius:4px}' +
'.db-hb .tr i.gray{background:var(--axis)}.db-hb b{font-weight:500;font-variant-numeric:tabular-nums;min-width:52px;text-align:end}' +
'.db-hb .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
'.db-stack{display:flex;height:14px;border-radius:4px;overflow:hidden;gap:2px;background:var(--card)}' +
'.db-stack i{display:block;height:100%}.db-stack i:first-child{background:var(--s1)}.db-stack i:last-child{background:var(--s3)}' +
'.db-meter{position:relative;height:18px;background:var(--wash);border-radius:6px;margin:14px 0 6px}' +
'.db-meter i{position:absolute;inset-block:0;inset-inline-start:0;background:var(--s1);border-radius:6px}' +
'.db-meter u{position:absolute;top:-6px;bottom:-6px;width:2px;background:var(--ink)}' +
'.db-legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;color:var(--ink-2);margin-top:8px}' +
'.db-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-inline-end:5px;vertical-align:middle}.db-legend i.ln{height:2px;width:14px;border-radius:1px}' +
'.db-tip{position:fixed;z-index:95;pointer-events:none;background:var(--ink);color:var(--cream);border-radius:8px;padding:6px 10px;font-size:12px;line-height:1.5;box-shadow:0 6px 18px rgba(0,0,0,.2);white-space:nowrap}' +
'.db-tip b{font-size:14px}.db-tip .k{display:inline-block;width:12px;height:2px;margin-inline-end:6px;vertical-align:middle}' +
'.db-status{display:inline-flex;align-items:center;gap:4px}' +
// calmer surfaces: no hard borders, one soft tinted shadow (redesign-skill: tinted shadows, hierarchy by elevation)
'.db-card,.db-tile{border-color:transparent;box-shadow:0 1px 2px rgba(28,42,31,.05), 0 10px 26px -18px rgba(28,42,31,.28)}.db-tile{border-radius:16px}.db-card{border-radius:18px}' +
'.db-tile.lead{box-shadow:0 14px 30px -18px rgba(28,42,31,.8);background:radial-gradient(90% 120% at 100% 0%, rgba(159,224,174,.18), transparent 55%), linear-gradient(155deg,#2E4433,#1C2A1F 75%)}' +
'.db-tile b{font-variant-numeric:tabular-nums;letter-spacing:-.01em}' +
'.db-tile b .db-status{display:inline-flex;font-size:inherit;color:inherit;gap:6px}.db-tile b .db-status i{font-size:.6em}' +
'.db-panel{background:var(--paper);border:1px solid var(--line);border-radius:var(--r-m);padding:12px 14px 2px;margin:0 0 16px}' +
'.db-ph{display:flex;align-items:center;gap:8px;margin-bottom:10px}.db-ph h3{margin:0;font-size:14.5px;font-weight:600;display:flex;align-items:center;gap:6px;flex:1}.db-ph h3 i{color:var(--brand);font-size:18px}' +
'.db-panel .db-tiles{margin-bottom:12px}.db-panel .db-grid{margin-bottom:12px}.db-panel .db-tile.lead b{font-size:34px}' +
'.db-panel .tg{height:28px;padding:0 10px;border-radius:8px;border:1px solid var(--line);background:var(--card);font-size:12px;color:var(--ink-2)}' +
'@media (min-width:1024px){.db-tiles{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}.db-tile.lead{grid-column:span 2}.db-grid.two{grid-template-columns:1.4fr 1fr}.db-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}}' +
'@media print{.tabs,.topbar,.hr-rail,.db-filters button,.db-card .tg,.update-bar{display:none!important}.app{padding:0!important}.hr-shell{display:block!important;min-height:0!important}.db-card,.db-tile{break-inside:avoid}body{background:#fff}}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

var tip = null;
function showTip(ev, html){
  if (!tip) { tip = document.createElement('div'); tip.className = 'db-tip'; document.body.appendChild(tip); }
  tip.innerHTML = html; tip.style.display = 'block';
  var x = ev.clientX, y = ev.clientY, w = tip.offsetWidth;
  tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x - w / 2)) + 'px'; tip.style.top = Math.max(8, y - tip.offsetHeight - 14) + 'px';
}
function hideTip(){ if (tip) tip.style.display = 'none'; }
function n1(v, d){ return v == null ? '-' : Number(v).toLocaleString(LOCALE(), { maximumFractionDigits: d == null ? 1 : d }); }
function sar(v){ return v == null ? '-' : Number(v).toLocaleString(LOCALE(), { maximumFractionDigits: 0 }) + ' ' + t('mfSar'); }
function shortDate(d){ return new Date(d + 'T12:00:00Z').toLocaleDateString(LOCALE(), { day: 'numeric', month: 'short', timeZone: 'UTC' }); }
function monthShort(m){ return new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1, 15)).toLocaleDateString(LOCALE(), { month: 'short', year: '2-digit' }); }
function hm(min){ return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0'); }
function tx(s){ return esc(s == null ? '' : String(s)); }

/** A stat tile. delta: change vs the previous period; goodUp: whether up is good. */
function tile(label, value, sub, delta, goodUp, hero, unit){
  var d = '';
  if (delta != null && isFinite(delta) && Math.abs(delta) >= 0.05) {
    var up = delta > 0, good = up === goodUp;
    d = '<small class="' + (good ? 'up' : 'down') + '">' + (up ? '▲ ' : '▼ ') + n1(Math.abs(delta)) + (unit ? ' ' + unit : '') + ' ' + t('dbVsPrev') + '</small>';
  }
  return '<div class="db-tile' + (hero ? ' lead' : '') + '"><span>' + label + '</span><b>' + value + '</b>' + d + (sub ? '<small>' + sub + '</small>' : '') + '</div>';
}

/** A card with a chart and its table view. */
function card(id, title, lead, chart, table){
  return '<div class="db-card" data-card="' + id + '"><h3>' + title + '<span class="sp"></span>' + (table ? '<button type="button" class="tg" data-tg="' + id + '" aria-pressed="false">' + t('dbTable') + '</button>' : '') + '</h3>' +
    (lead ? '<p>' + lead + '</p>' : '') + '<div data-v="chart">' + chart + '</div>' + (table ? '<div data-v="table" class="hidden">' + table + '</div>' : '') + '</div>';
}
function tbl(head, rows){ return '<div class="tblwrap"><table class="tbl"><thead><tr>' + head.map(function(h){ return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function(r){ return '<tr>' + r.map(function(c){ return '<td class="num">' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>'; }

/** Line chart, one series, y from 0 to max; crosshair snaps to the nearest point. */
function lineChart(pts, opts){
  if (!pts.length) return '<p class="hr-hint">' + t('dbNoData') + '</p>';
  var W = 640, H = 200, L = 48, R = 10, Tt = 10, Bm = 26, max = opts.max || Math.max.apply(null, pts.map(function(p){ return p.y || 0; }).concat([1]));
  var x = function(i){ return L + (pts.length === 1 ? (W - L - R) / 2 : i * (W - L - R) / (pts.length - 1)); }, y = function(v){ return Tt + (H - Tt - Bm) * (1 - (v || 0) / max); };
  var grid = [0, 0.5, 1].map(function(f){ var v = max * f, yy = y(v); return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '" stroke="var(--grid)" stroke-width="1"/><text x="' + (L - 6) + '" y="' + (yy + 4) + '" text-anchor="end">' + n1(v, 0) + (opts.suffix || '') + '</text>'; }).join('');
  var d = pts.map(function(p, i){ return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.y).toFixed(1); }).join(' ');
  var step = Math.max(1, Math.ceil(pts.length / 6)), labels = pts.map(function(p, i){ var last = pts.length - 1; return (i % step || (i !== last && last - i < step * 0.7)) && i !== last ? '' : '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + tx(p.label) + '</text>'; }).join('');
  var dotsLast = '<circle cx="' + x(pts.length - 1) + '" cy="' + y(pts[pts.length - 1].y) + '" r="4" fill="var(--s1)" stroke="var(--card)" stroke-width="2"/>';
  return '<svg class="db-svg" dir="ltr" viewBox="0 0 ' + W + ' ' + H + '" data-line=\'' + esc(JSON.stringify({ pts: pts, L: L, R: R, W: W, suffix: opts.suffix || '', fmt: opts.fmt || '' })) + '\' role="img" aria-label="' + tx(opts.aria || '') + '">' + grid +
    '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="var(--axis)"/>' + '<path d="' + d + '" fill="none" stroke="var(--s1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' + dotsLast + labels +
    '<line class="xh" x1="0" x2="0" y1="' + Tt + '" y2="' + (H - Bm) + '" stroke="var(--ink-2)" stroke-width="1" style="display:none"/><rect x="' + L + '" y="0" width="' + (W - L - R) + '" height="' + H + '" fill="transparent"/></svg>';
}
function wireLines(root){
  $$('svg[data-line]', root).forEach(function(svg){
    var o = JSON.parse(svg.getAttribute('data-line')), xh = svg.querySelector('.xh');
    svg.addEventListener('pointermove', function(ev){
      var r = svg.getBoundingClientRect(), sx = (ev.clientX - r.left) / r.width * o.W, n = o.pts.length;
      var i = n === 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round((sx - o.L) / (o.W - o.L - o.R) * (n - 1))));
      var px = n === 1 ? (o.W - o.L - o.R) / 2 + o.L : o.L + i * (o.W - o.L - o.R) / (n - 1);
      xh.setAttribute('x1', px); xh.setAttribute('x2', px); xh.style.display = '';
      var p = o.pts[i];
      showTip(ev, '<b>' + (o.fmt === 'sar' ? sar(p.y) : n1(p.y) + o.suffix) + '</b><br><span class="k" style="background:#2E7D4F"></span>' + tx(p.label) + (p.note ? '<br>' + tx(p.note) : ''));
    });
    svg.addEventListener('pointerleave', function(){ xh.style.display = 'none'; hideTip(); });
  });
}
/** Columns: items [{label, value, tip}] with optional marker at index. */
function cols(items, opts){
  if (!items.length) return '<p class="hr-hint">' + t('dbNoData') + '</p>';
  var max = Math.max.apply(null, items.map(function(i){ return i.value || 0; }).concat([opts && opts.max || 1]));
  return '<div class="db-cols">' + items.map(function(i){
    return '<div class="c" tabindex="0" data-tip="' + esc(i.tip || (n1(i.value) + ' ' + (i.label || ''))) + '">' + (opts && opts.labels ? '<em>' + (i.value ? n1(i.value, 0) + (opts.suffix || '') : '') + '</em>' : '') +
      '<i class="' + (i.alt ? 'alt' : '') + '" style="height:' + ((i.value || 0) / max * 100) + '%"></i><span>' + tx(i.label) + '</span></div>';
  }).join('') + '</div>';
}
function grouped(items){
  var max = Math.max.apply(null, items.map(function(i){ return Math.max(i.a, i.b); }).concat([1]));
  return '<div class="db-cols" style="height:140px">' + items.map(function(i){
    return '<div class="grp" tabindex="0" data-tip="' + esc(tx(i.label) + ': ' + t('dbJoiners') + ' ' + i.a + '، ' + t('dbLeavers') + ' ' + i.b) + '"><i style="height:' + (i.a / max * 100) + '%"></i><i class="b" style="height:' + (i.b / max * 100) + '%"></i><span>' + tx(i.label) + '</span></div>';
  }).join('') + '</div><div class="db-legend"><span><i style="background:var(--s1)"></i>' + t('dbJoiners') + '</span><span><i style="background:var(--s2)"></i>' + t('dbLeavers') + '</span></div>';
}
function hbars(items, opts){
  if (!items.length) return '<p class="hr-hint">' + t('dbNoData') + '</p>';
  var max = opts && opts.max || Math.max.apply(null, items.map(function(i){ return i.value || 0; }).concat([1]));
  return '<div class="db-hbars">' + items.map(function(i){
    return '<div class="db-hb" tabindex="0" data-tip="' + esc(i.tip || '') + '"><span class="nm">' + tx(i.label) + '</span><div class="tr"><i class="' + (i.gray ? 'gray' : '') + '" style="width:' + Math.max(0, Math.min(100, (i.value || 0) / max * 100)) + '%"></i></div><b>' + i.text + '</b></div>';
  }).join('') + '</div>';
}
function wireTips(root){
  $$('[data-tip]', root).forEach(function(el){
    if (!el.getAttribute('data-tip')) return;
    el.addEventListener('pointermove', function(ev){ showTip(ev, esc(el.getAttribute('data-tip'))); });
    el.addEventListener('pointerleave', hideTip);
    el.addEventListener('focus', function(){ var r = el.getBoundingClientRect(); showTip({ clientX: r.left + r.width / 2, clientY: r.top }, esc(el.getAttribute('data-tip'))); });
    el.addEventListener('blur', hideTip);
  });
  $$('[data-tg]', root).forEach(function(b){ b.onclick = function(){
    var c = b.closest('.db-card'), on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', on); b.textContent = on ? t('dbChart') : t('dbTable');
    c.querySelector('[data-v="chart"]').classList.toggle('hidden', on); c.querySelector('[data-v="table"]').classList.toggle('hidden', !on);
  }; });
}

function range(k){
  var td = riyadhToday(), d = new Date(td + 'T00:00:00Z');
  if (k === 'last') { var a = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)), b = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0)); return [a.toISOString().slice(0, 10), b.toISOString().slice(0, 10)]; }
  if (k === '30' || k === '90') return [new Date(d.getTime() - (Number(k) - 1) * 86400000).toISOString().slice(0, 10), td];
  return [td.slice(0, 8) + '01', td];
}

function section(body){
  var k = S.dbRange || 'month';
  body.innerHTML = '<div class="db"><div class="hr-h"><h2>' + t('dbTitle') + '</h2></div><div class="db-filters">' + [['month', 'dbThisMonth'], ['last', 'dbLastMonth'], ['30', 'dbLast30'], ['90', 'dbLast90']].map(function(x){
    return '<button type="button" data-r="' + x[0] + '" aria-pressed="' + (k === x[0]) + '">' + t(x[1]) + '</button>'; }).join('') + '<span class="sp"></span><small id="dbGen"></small><button type="button" id="dbPrint">' + ph('printer') + ' ' + t('dbPrint') + '</button></div><div id="dbBody"></div></div>';
  $$('[data-r]', body).forEach(function(b){ b.onclick = function(){ S.dbRange = b.dataset.r; section(body); }; });
  $('#dbPrint', body).onclick = function(){ window.print(); };
  var el = $('#dbBody', body), rg = range(k);
  el.innerHTML = '<div class="db-tiles">' + [0, 1, 2, 3, 4, 5].map(function(i){ return '<div class="db-tile' + (i ? '' : ' lead') + '"><span class="sk" style="width:60%"></span><span class="sk" style="margin-top:10px;height:22px"></span></div>'; }).join('') + '</div>';
  apiFresh('dashboard', { from: rg[0], to: rg[1] }, function(r){
    if (!el.isConnected) return;
    if (!r.ok) { el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>'; return; }
    $('#dbGen', body).textContent = t('dbGenerated') + ' ' + new Date(r.generatedAt).toLocaleTimeString(LOCALE(), { hour: '2-digit', minute: '2-digit' });
    el.innerHTML = draw(r); wireLines(el); wireTips(el);
  });
}

function draw(r){
  var A = r.attendance || {}, T0 = A.totals || {}, P = r.attendancePrev || {}, h = '';
  var dRate = P.attendanceRate != null && T0.attendanceRate != null ? T0.attendanceRate - P.attendanceRate : null;
  var dPunct = P.punctuality != null && T0.punctuality != null ? T0.punctuality - P.punctuality : null;
  h += '<div class="db-tiles">' + tile(t('dbAttRate'), n1(T0.attendanceRate) + '%', plural(T0.present || 0, 'days') + ' / ' + n1(T0.expected, 0), dRate, true, true, t('dbPts')) +
    tile(t('dbPunct'), n1(T0.punctuality) + '%', '', dPunct, true, false, t('dbPts')) + tile(t('dbAvgLate'), n1(T0.avgLate, 0) + ' ' + t('dbMinutes'), plural(T0.late || 0, 'days')) +
    tile(t('dbAbsent'), n1(T0.absent, 0), T0.missingOut ? t('dbMissingOut') + ' ' + T0.missingOut : '') + tile(t('dbOvertime'), n1(T0.overtimeHours), '') +
    tile(t('dbOnLeave'), n1(r.leave && r.leave.onLeaveToday, 0), T0.review ? '<span class="db-status">' + ph('warning') + ' ' + t('dbReview') + ' ' + T0.review + '</span>' : '') + '</div>';

  // attendance: trend, weekday, check-in times
  var daily = (A.daily || []).map(function(d){ return { label: shortDate(d.date), y: d.rate, note: d.present + ' / ' + d.expected }; });
  var wd = (A.weekday || []).map(function(w){ return { label: t('dows')[w.dow], value: w.lateRate || 0, tip: t('dows')[w.dow] + ': ' + n1(w.lateRate) + '% (' + w.late + ')' }; });
  var shiftMin = A.shiftStart ? Number(A.shiftStart.slice(0, 2)) * 60 + Number(A.shiftStart.slice(3, 5)) : 480;
  var raw = A.checkin || [], filled = [];
  if (raw.length) { var byM = {}; raw.forEach(function(b){ byM[b.minute] = b.count; }); for (var m = raw[0].minute; m <= raw[raw.length - 1].minute; m += 15) filled.push({ minute: m, count: byM[m] || 0 }); }
  var ci = filled.map(function(b){ return { label: hm(b.minute), value: b.count, alt: b.minute >= shiftMin + (A.grace || 0), tip: hm(b.minute) + ': ' + b.count }; });
  h += '<div class="db-grid two">' + card('trend', t('dbTrend'), t('dbTrendLead'), lineChart(daily, { max: 100, suffix: '%', aria: t('dbTrend') }), tbl([t('date'), t('dbAttRate')], (A.daily || []).map(function(d){ return [shortDate(d.date), n1(d.rate) + '%', ]; }))) +
    card('wd', t('dbWeekday'), t('dbWeekdayLead'), cols(wd, { labels: true, suffix: '%' }), tbl([t('date'), '%'], wd.map(function(w){ return [tx(w.label), n1(w.value) + '%']; }))) + '</div>';
  h += '<div class="db-grid two">' + card('ci', t('dbCheckin'), t('dbCheckinLead'), cols(ci, {}) + '<div class="db-legend"><span><i style="background:var(--s1)"></i>' + t('st_present') + '</span><span><i style="background:var(--s2)"></i>' + t('late') + '</span></div>',
      tbl(['', ''], ci.map(function(c){ return [c.label, c.value]; }))) +
    card('dept', t('dbDepts'), t('dbDeptLead'), hbars((A.departments || []).map(function(d){ return { label: d.department, value: d.rate, text: n1(d.rate) + '% / ' + n1(d.punctuality) + '%', tip: d.department + ': ' + n1(d.rate) + '% / ' + n1(d.punctuality) + '%' }; }), { max: 100 }),
      tbl([t('hrDept'), t('dbAttRate'), t('dbPunct'), t('dbAbsent')], (A.departments || []).map(function(d){ return [tx(d.department), n1(d.rate) + '%', n1(d.punctuality) + '%', d.absent]; }))) + '</div>';
  h += '<div class="db-grid two">' + card('late', t('dbTopLate'), '', (A.topLate || []).length ? tbl([t('hrName'), t('dbTimes'), t('dbMinutes')], A.topLate.map(function(x){ return [tx(x.emp.name) + ' <small style="color:var(--ink-2)">' + tx(x.emp.department) + '</small>', x.lateDays, x.lateMin]; })) : '<p class="hr-hint">' + t('dbNoData') + '</p>') +
    card('abs', t('dbTopAbsent'), '', (A.topAbsent || []).length ? tbl([t('hrName'), t('dbDays')], A.topAbsent.map(function(x){ return [tx(x.emp.name) + ' <small style="color:var(--ink-2)">' + tx(x.emp.department) + '</small>', x.absent]; })) : '<p class="hr-hint">' + t('dbNoData') + '</p>') + '</div>';

  // workforce
  var Wf = r.workforce || {};
  h += '<h3 class="db-h">' + t('dbWorkforce') + '</h3><div class="db-tiles">' + tile(t('dbHeadcount'), n1(Wf.headcount, 0), t('dbSaudisK') + ': ' + n1(Wf.saudis || 0, 0), null, true, true) +
    tile(t('dbSaudization'), n1(Wf.saudiPct) + '%', Wf.target ? t('dbTarget') + ' ' + Wf.target + '%' : '') +
    tile(t('dbExpiring'), n1(Wf.expiringSoon, 0), '') + tile(t('dbExpired'), '<span class="db-status">' + (Wf.expired ? ph('warning-circle') + ' ' : '') + n1(Wf.expired, 0) + '</span>', '') +
    tile(t('dbJoiners'), n1((Wf.movement || []).reduce(function(s, m){ return s + m.joiners; }, 0), 0), '12') + tile(t('dbLeavers'), n1((Wf.movement || []).reduce(function(s, m){ return s + m.leavers; }, 0), 0), '12') + '</div>';
  var meter = '<div class="db-meter"><i style="width:' + Math.min(100, Wf.saudiPct || 0) + '%"></i>' + (Wf.target ? '<u style="inset-inline-start:' + Math.min(100, Wf.target) + '%"></u>' : '') + '</div><p class="hr-hint">' + n1(Wf.saudiPct) + '%' + (Wf.target ? '، ' + t('dbTarget') + ' ' + Wf.target + '%' : '، ' + t('dbNoTarget')) + '</p>';
  var mix = (Wf.departments || []).map(function(d){ var n = d.saudi + d.nonSaudi; return '<div class="db-hb" tabindex="0" data-tip="' + esc(d.department + ': ' + t('dbSaudi') + ' ' + d.saudi + '، ' + t('dbNonSaudi') + ' ' + d.nonSaudi) + '"><span class="nm">' + tx(d.department) + '</span><div class="db-stack"><i style="width:' + (d.saudi / (n || 1) * 100) + '%"></i><i style="width:' + (d.nonSaudi / (n || 1) * 100) + '%"></i></div><b>' + d.saudi + ' / ' + n + '</b></div>'; }).join('');
  h += '<div class="db-grid two">' + card('mix', t('dbMix'), '', meter + '<div class="db-hbars">' + mix + '</div><div class="db-legend"><span><i style="background:var(--s1)"></i>' + t('dbSaudi') + '</span><span><i style="background:var(--s3)"></i>' + t('dbNonSaudi') + '</span></div>',
      tbl([t('hrDept'), t('dbSaudi'), t('dbNonSaudi')], (Wf.departments || []).map(function(d){ return [tx(d.department), d.saudi, d.nonSaudi]; }))) +
    card('ten', t('dbTenure'), '', cols(Object.keys(Wf.tenure || {}).map(function(k){ return { label: k, value: Wf.tenure[k], tip: k + ': ' + Wf.tenure[k] }; }), { labels: true }), tbl(['', ''], Object.keys(Wf.tenure || {}).map(function(k){ return [k, Wf.tenure[k]]; }))) + '</div>';
  h += '<div class="db-grid">' + card('mov', t('dbMovement'), '', grouped((Wf.movement || []).map(function(m){ return { label: monthShort(m.month), a: m.joiners, b: m.leavers }; })),
    tbl(['', t('dbJoiners'), t('dbLeavers')], (Wf.movement || []).map(function(m){ return [monthShort(m.month), m.joiners, m.leavers]; }))) + '</div>';

  // leave, requests, performance
  var Lv = r.leave || {}, Rq = r.requests || {}, Pf = r.performance || {};
  var lt = (Lv.byType || []).map(function(x){ return { label: t('lt_' + x.type), value: x.days, text: plural(x.days, 'days'), tip: t('lt_' + x.type) + ': ' + x.days }; });
  var pend = Rq.pending || {};
  h += '<div class="db-grid three">' + card('lv', t('dbLeaveType'), '', hbars(lt), tbl(['', t('dbDays')], lt.map(function(x){ return [tx(x.label), x.value]; }))) +
    card('rq', t('dbPending'), '', hbars(['manager', 'hr', 'payroll'].map(function(s){ return { label: t('rstep_' + s), value: pend[s] || 0, text: n1(pend[s] || 0, 0), gray: !pend[s] }; })) +
      '<p class="hr-hint" style="margin-top:10px">' + t('dbOldest') + ': ' + plural(Rq.oldestOpenDays || 0, 'days') + (Rq.openOver3Days ? '، <span class="db-status">' + ph('warning') + ' ' + t('dbSlow') + ' ' + Rq.openOver3Days + '</span>' : '') + '</p>' +
      ((Rq.speed || []).length ? '<h4 class="hr-sub">' + t('dbSpeed') + '</h4>' + hbars(Rq.speed.map(function(x){ return { label: t('rt_' + x.type), value: x.avgHours, text: n1(x.avgHours) + ' ' + t('dbHours'), tip: t('rt_' + x.type) + ': ' + n1(x.avgHours) + ' ' + t('dbHours') + ' (' + x.n + ')' }; })) : '')) +
    card('pf', t('dbPerf'), Pf.cycle ? tx(lang(Pf.cycle.nameAr, Pf.cycle.nameEn)) + '، ' + Pf.rated + ' / ' + Pf.people + ' ' + t('dbRated') : '',
      Pf.cycle && !Pf.rated ? '<p class="hr-hint">' + t('dbNotRated') + '</p>' : Pf.cycle ? cols([1, 2, 3, 4, 5].map(function(n){ return { label: String(n), value: Pf.distribution[n], tip: n + ': ' + Pf.distribution[n] }; }), { labels: true }) : '<p class="hr-hint">' + t('dbPerfNone') + '</p>',
      Pf.cycle ? tbl(['', ''], [1, 2, 3, 4, 5].map(function(n){ return [n, Pf.distribution[n]]; })) : '') + '</div>';

  // money
  if (r.money && r.cost && !r.cost.error) {
    var C = r.cost, last = (C.trend || [])[C.trend.length - 1] || {};
    h += '<h3 class="db-h">' + t('dbCost') + '</h3><div class="db-tiles">' + tile(t('dbWageBill'), sar(C.monthlyPackage), C.noPackage ? t('pw_no_package') + ' ' + C.noPackage : '', null, true, true) +
      tile(t('dbLastCost'), sar(last.cost), C.lastMonth ? monthShort(C.lastMonth) : t('dbNoRuns')) + tile(t('dbGosiEr'), sar(last.gosiEmployer), '') + tile(t('dbOtCost'), sar(last.overtime), '') +
      tile(t('dbLeaveLiab'), sar(C.leaveLiability), '') + tile(t('dbEosLiab'), sar(C.eosLiability), '') + '</div>' +
      '<p class="hr-hint" style="margin:-6px 0 12px">' + t('dbLiabNote') + (C.advancesOutstanding ? '، ' + t('dbAdvances') + ' ' + sar(C.advancesOutstanding) : '') + '</p>' +
      '<div class="db-grid two">' + card('cost', t('dbCostTrend'), '', (C.trend || []).length ? lineChart(C.trend.map(function(m){ return { label: monthShort(m.month), y: m.cost, note: plural(m.headcount, 'people') }; }), { fmt: 'sar' }) : '<p class="hr-hint">' + t('dbNoRuns') + '</p>',
        tbl(['', t('prGross'), t('prGosiEr'), t('dbOtCost')], (C.trend || []).map(function(m){ return [monthShort(m.month), sar(m.gross), sar(m.gosiEmployer), sar(m.overtime)]; }))) +
      card('cd', t('dbCostDept'), '', hbars((C.byDepartment || []).map(function(d){ return { label: d.department, value: d.cost, text: sar(d.cost), tip: d.department + ': ' + sar(d.cost) + ' (' + d.headcount + ')' }; })),
        tbl([t('hrDept'), t('prGross'), t('prHead')], (C.byDepartment || []).map(function(d){ return [tx(d.department), sar(d.cost), d.headcount]; }))) + '</div>';
  }
  return h;
}
function lang(ar, en){ return S.lang === 'en' && en ? en : ar; }

/** A screen's own dashboard: a titled band that can be folded (remembered per device). */
function panel(key, title, html){
  var hid = false; try { hid = (JSON.parse(localStorage.getItem('bgatt.dashFold') || '{}') || {})[key]; } catch (e) {}
  return '<section class="db db-panel" data-fold="' + key + '"><div class="db-ph"><h3>' + ph('chart-pie-slice') + title + '</h3><button type="button" class="tg" data-foldbtn aria-expanded="' + !hid + '">' + (hid ? t('dbShowDash') : t('dbHideDash')) + '</button></div>' +
    '<div class="db-pb' + (hid ? ' hidden' : '') + '">' + html + '</div></section>';
}
function wire(root){
  wireLines(root); wireTips(root);
  $$('[data-foldbtn]', root).forEach(function(b){ b.onclick = function(){
    var p = b.closest('[data-fold]'), body = p.querySelector('.db-pb'), hide = !body.classList.contains('hidden');
    body.classList.toggle('hidden', hide); b.setAttribute('aria-expanded', !hide); b.textContent = hide ? t('dbShowDash') : t('dbHideDash');
    try { var m = JSON.parse(localStorage.getItem('bgatt.dashFold') || '{}') || {}; m[p.dataset.fold] = hide; localStorage.setItem('bgatt.dashFold', JSON.stringify(m)); } catch (e) {}
  }; });
}
function skeleton(n){ return '<div class="db-tiles">' + Array.apply(null, Array(n || 4)).map(function(_, i){ return '<div class="db-tile' + (i ? '' : ' lead') + '"><span class="sk" style="width:60%"></span><span class="sk" style="margin-top:10px;height:22px"></span></div>'; }).join('') + '</div>'; }

window.Dash = { section: section };
// Shared chart kit: every other screen draws its own mini dashboard with these, so all charts look and behave alike.
window.Viz = { tile: tile, card: card, tbl: tbl, lineChart: lineChart, cols: cols, grouped: grouped, hbars: hbars, wireLines: wireLines, wireTips: wireTips,
  n1: n1, sar: sar, shortDate: shortDate, monthShort: monthShort, range: range, showTip: showTip, hideTip: hideTip, panel: panel, wire: wire, skeleton: skeleton };
})();
