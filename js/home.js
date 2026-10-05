// Home (design system v2, 2026-09-30): the first page of the HR system, role-aware.
// Company view for HR, payroll and executives: the day's attendance gauge, workforce facts, what waits for a decision,
// legal deadlines, attendance by department and joiners/leavers. Personal view for everyone: today's shift with the
// check-in card (the only pine surface), my tasks, leave balance, last payslip and my month.
(function(){
'use strict';
var V = window.Viz;

Object.assign(T.ar, {
  hmMorning:'صباح الخير', hmEvening:'مساء الخير', hmCompany:'الشركة', hmMine:'أنا', hmToday:'الحضور اليوم', hmTodaySentence:'{p} من {e} بدأوا يومهم. {l} متأخرون و{v} في إجازة.',
  hmHeadcount:'الموظفون النشطون', hmSaudi:'التوطين المرجح', hmPayroll:'آخر مسير', hmOpenReq:'طلبات مفتوحة', hmDecide:'يحتاج قرارك', hmAllTasks:'كل المهام', hmNothing:'لا شيء ينتظر قرارك الآن.',
  hmDeadlines:'مواعيد نظامية', hmCalendar:'التقويم', hmDeadLead:'الأقرب موعدا أولا', hmNoDeadlines:'لا مواعيد قريبة.', hmDepts:'الحضور حسب الإدارة اليوم', hmMove:'حركة القوى العاملة',
  hmMoveLead:'المنضمون والمغادرون كل شهر', hmJoin:'انضموا', hmLeft:'غادروا', hmShift:'دوامك اليوم', hmIn:'سجلت حضورك', hmOut:'سجلت انصرافك', hmNotYet:'لم تسجل حضورك بعد',
  hmCheckIn:'تسجيل الحضور', hmCheckOut:'تسجيل الانصراف', hmOff:'يوم راحة', hmMyTasks:'مهامي', hmLeave:'رصيد إجازتي', hmAvail:'في رصيدك', hmUsed:'مستخدم', hmAskLeave:'طلب إجازة',
  hmK_present:'حاضرون الآن', hmK_late:'متأخرون', hmK_leave:'في إجازة', hmK_absent:'غائبون', hmOfExpected:'من المتوقع', hmSlip:'آخر قسيمة راتب', hmNoSlip:'تظهر قسائمك هنا بعد اعتماد المسير.', hmMonth:'شهري حتى الآن', hmAttRate:'حضوري', hmLateDays:'أيام تأخير', hmOt:'إضافي', hmOpen:'فتح', hmAt:'في'
});
Object.assign(T.en, {
  hmMorning:'Good morning', hmEvening:'Good evening', hmCompany:'Company', hmMine:'Me', hmToday:'Attendance today', hmTodaySentence:'{p} of {e} have started their day. {l} late and {v} on leave.',
  hmHeadcount:'Active employees', hmSaudi:'Weighted Saudization', hmPayroll:'Last payroll', hmOpenReq:'Open requests', hmDecide:'Waiting for your decision', hmAllTasks:'All tasks', hmNothing:'Nothing is waiting for you.',
  hmDeadlines:'Legal deadlines', hmCalendar:'Calendar', hmDeadLead:'Soonest first', hmNoDeadlines:'Nothing due soon.', hmDepts:'Attendance by department today', hmMove:'Workforce movement',
  hmMoveLead:'Joiners and leavers each month', hmJoin:'Joined', hmLeft:'Left', hmShift:'Your hours today', hmIn:'Checked in', hmOut:'Checked out', hmNotYet:'Not checked in yet',
  hmCheckIn:'Check in', hmCheckOut:'Check out', hmOff:'Day off', hmMyTasks:'My tasks', hmLeave:'My leave balance', hmAvail:'available', hmUsed:'Used', hmAskLeave:'Request leave',
  hmK_present:'Present now', hmK_late:'Late', hmK_leave:'On leave', hmK_absent:'Absent', hmOfExpected:'of expected', hmSlip:'Last payslip', hmNoSlip:'Your payslips appear here once payroll is approved.', hmMonth:'My month so far', hmAttRate:'Attendance', hmLateDays:'Late days', hmOt:'Overtime', hmOpen:'Open', hmAt:'at'
});

var css = '' +
'.hm-ph{display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:22px}.hm-ph .sp{flex:1}' +
'.hm-ph h1{margin:0;font-size:30px;line-height:1.25;font-weight:600;letter-spacing:-.01em;font-variation-settings:"HEXP" 35;text-wrap:balance}.hm-ph p{margin:4px 0 0;color:var(--ink-2);font-size:14.5px}' +
'.hm-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px}.hm-grid > *{min-width:0}' +
'.hm-s4{grid-column:span 4}.hm-s5{grid-column:span 5}.hm-s7{grid-column:span 7}.hm-s8{grid-column:span 8}.hm-s12{grid-column:1 / -1}' +
'.hm-card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 20px}' +
'.hm-card h2{margin:0;font-size:16px;font-weight:600;line-height:1.4;display:flex;align-items:center;gap:8px}.hm-card h2 i{color:var(--brand);font-size:19px}.hm-card h2 .sp{flex:1}' +
'.hm-card h2 button{border:0;background:none;color:var(--brand);font-size:13px;font-weight:500;padding:0;cursor:pointer}' +
'.hm-card .lead{margin:2px 0 12px;color:var(--ink-3,#5F6D63);font-size:13px}' +
'.hm-hero{display:grid;grid-template-columns:auto minmax(0,1fr);gap:28px;align-items:center;padding:22px 26px}' +
'.hm-hero h2{font-size:14px;color:var(--ink-3,#5F6D63);font-weight:500}.hm-hero .big{font-size:21px;font-weight:600;margin:2px 0 14px;line-height:1.45;text-wrap:balance}' +
'.hm-facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin:0;border-top:1px solid var(--line-2,#EEEAE0)}' +
'.hm-facts div{padding:12px 14px 2px;border-inline-start:1px solid var(--line-2,#EEEAE0)}.hm-facts div:first-child{border-inline-start:0;padding-inline-start:0}' +
'.hm-facts dt{font-size:12.5px;color:var(--ink-3,#5F6D63)}.hm-facts dd{margin:0;font-size:22px;font-weight:600;font-variation-settings:"HEXP" 40;line-height:1.35;font-variant-numeric:tabular-nums}' +
'.hm-facts dd small{font-size:12.5px;font-weight:500;color:var(--ink-3,#5F6D63);font-variation-settings:normal}' +
'.hm-rows{display:grid}.hm-r{display:flex;align-items:center;gap:12px;padding:11px 0;border-top:1px solid var(--line-2,#EEEAE0)}.hm-r:first-child{border-top:0}' +
'.hm-r .m{flex:1;min-width:0}.hm-r .m b{display:block;font-weight:500;font-size:14.5px;line-height:1.45}.hm-r .m small{display:block;color:var(--ink-3,#5F6D63);font-size:12.5px}' +
'.hm-r .ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--brand-tint,#E7EFE6);color:var(--brand);font-size:18px;flex:none}' +
'.hm-r .n{min-width:28px;height:24px;border-radius:7px;display:grid;place-items:center;font-size:12.5px;font-weight:600;background:var(--warn-bg,#FBF1DC);color:var(--warn,#8A5A00);padding:0 7px}' +
'.hm-sev{border-inline-start:3px solid var(--line);padding-inline-start:12px}.hm-sev.error{border-color:#B42318}.hm-sev.warn{border-color:#C98500}.hm-sev.info{border-color:#2a78d6}' +
'.hm-mini{height:32px;padding:0 12px;border-radius:6px;border:1px solid var(--line);background:var(--card);font-size:13px;color:var(--ink);cursor:pointer}.hm-mini:hover{border-color:var(--input,#8F8878)}' +
'.hm-clock{background:var(--pine);color:#F2EEE4;border-color:var(--pine);position:relative;overflow:hidden}' +
'.hm-clock::after{content:"";position:absolute;inset:auto -40px -60px auto;width:220px;height:220px;border-radius:50%;border:1px solid rgba(159,224,174,.18);box-shadow:0 0 0 30px rgba(159,224,174,.05),0 0 0 60px rgba(159,224,174,.035);pointer-events:none}' +
'.hm-clock h2{color:#AFC0AD;font-weight:500;font-size:13.5px}.hm-clock h2 i{color:#9FE0AE}.hm-clock .t{font-size:clamp(28px,7.5vw,38px);white-space:nowrap;font-weight:600;line-height:1.2;font-variation-settings:"HEXP" 70;margin:6px 0 2px;font-variant-numeric:tabular-nums}' +
'.hm-clock small{color:#AFC0AD;font-size:13px}.hm-clock .go{margin-top:16px;height:44px;padding:0 18px;border-radius:8px;border:0;background:#F2EEE4;color:#1C2A1F;font-weight:600;font-size:15px;display:inline-flex;align-items:center;gap:8px;cursor:pointer;position:relative;z-index:1}' +
'.hm-clock .go:hover{background:#fff}.hm-clock .go:focus-visible{outline:2px solid #9FE0AE;outline-offset:2px}' +
'.hm-big{display:flex;align-items:baseline;gap:8px;margin:6px 0 10px}.hm-big b{font-size:clamp(26px,7vw,34px);font-weight:600;font-variation-settings:"HEXP" 70;font-variant-numeric:tabular-nums;line-height:1.1}.hm-big span{color:var(--ink-3,#5F6D63)}' +
'.hm-bar{height:8px;border-radius:4px;background:var(--well,#F6F3EC);overflow:hidden}.hm-bar i{display:block;height:100%;background:#2E7D4F;border-radius:4px}' +
'.hm-btn{height:40px;padding:0 16px;border-radius:8px;border:1px solid var(--brand);background:var(--brand);color:#fff;font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:8px;margin-top:12px;cursor:pointer}.hm-btn:hover{filter:brightness(.93)}' +
'.hm-banner{margin-bottom:18px}.hm-scope{display:inline-flex;gap:4px;padding:4px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22)}' +
'.hm-scope button{height:34px;padding:0 14px;border-radius:999px;border:0;background:none;color:#fff;font:inherit;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;cursor:pointer}' +
'.hm-scope button[aria-pressed="true"]{background:#fff;color:#1D5E3A;box-shadow:0 6px 14px -8px rgba(0,0,0,.4)}.hm-scope i{font-size:17px}' +
'.hm-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}' +
'.hm-k{position:relative;overflow:hidden;background:#fff;border-radius:16px;padding:16px 18px;box-shadow:0 1px 2px rgba(15,28,20,.05),0 8px 24px -14px rgba(15,28,20,.18);display:grid;gap:4px;transition:transform .22s cubic-bezier(.2,.8,.2,1),box-shadow .22s}' +
'.hm-k:hover{transform:translateY(-2px);box-shadow:0 2px 4px rgba(15,28,20,.06),0 18px 36px -18px rgba(15,28,20,.32)}' +
'.hm-k .ic{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;font-size:22px}' +
'.hm-k .lb{color:var(--ink-3);font-size:13px;font-weight:500}.hm-k .v{font-family:var(--f-num,Manrope,sans-serif);font-size:30px;font-weight:800;line-height:1.1;letter-spacing:-.02em}.hm-k small{color:var(--ink-3);font-size:12px}' +
'.hm-k::after{content:"";position:absolute;inset-inline-end:-26px;bottom:-30px;width:100px;height:100px;border-radius:50%;opacity:.55}' +
'.hm-k.k-g .ic{background:#E4F2E9;color:#1D6B43}.hm-k.k-g::after{background:#E4F2E9}.hm-k.k-y .ic{background:#FEF0C7;color:#B54708}.hm-k.k-y::after{background:#FEF0C7}' +
'.hm-k.k-b .ic{background:#D1E9FF;color:#175CD3}.hm-k.k-b::after{background:#D1E9FF}.hm-k.k-r .ic{background:#FEE4E2;color:#B42318}.hm-k.k-r::after{background:#FEE4E2}' +
'@media (max-width:900px){.hm-kpis{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.hm-k .v{font-size:26px}}' +
'@media (max-width:1100px){.hm-s4,.hm-s5,.hm-s7,.hm-s8{grid-column:1 / -1}.hm-facts{grid-template-columns:repeat(2,minmax(0,1fr))}.hm-facts div:nth-child(3){border-inline-start:0;padding-inline-start:0}}' +
'@media (max-width:900px){.hm-hero{grid-template-columns:1fr;justify-items:center}.hm-hero > div{justify-self:stretch}.hm-ph h1{font-size:25px}}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

function go(area, sub){ if (window.goArea) goArea(area, sub); }
function first(n){ return String(n || '').trim().split(/\s+/)[0]; }
function dateLine(){
  var d = new Date(), g = d.toLocaleDateString((S.lang === 'en' ? 'en-GB' : 'ar-SA') + '-u-ca-gregory-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Riyadh' });
  var h = d.toLocaleDateString((S.lang === 'en' ? 'en' : 'ar-SA') + '-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Riyadh' });
  return g + (S.lang === 'en' ? ' · ' : '، ') + h;
}
function greet(){ var h = new Date(Date.now() + 180 * 60000).getUTCHours(); return t(h < 12 ? 'hmMorning' : 'hmEvening') + (S.lang === 'en' ? ', ' : '، ') + esc(first(S.me.name)); }
function sk(n){ var h = ''; for (var i = 0; i < (n || 3); i++) h += '<span class="sk" style="width:' + (80 - i * 15) + '%"></span>'; return h; }
function money(n){ return Number(n || 0).toLocaleString(LOCALE(), { maximumFractionDigits: 0 }) + ' ' + t('mfSar'); }
function fmtHm(iso){ return iso ? new Date(iso).toLocaleTimeString(LOCALE(), { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' }) : ''; }
function companyRole(){ var r = S.fileRoles || {}; return isHr() || r.hr || r.payroll || r.executive; }

function render(main){
  var company = companyRole(), scope = company ? (S.homeScope || 'company') : 'mine';
  var h = new Date(Date.now() + 180 * 60000).getUTCHours();
  main.innerHTML = '<div class="page v2"><header class="v3-hero hm-banner"><span class="v3-hero-ic">' + ph(h < 12 ? 'sun-horizon' : h < 17 ? 'sun' : 'moon-stars', 'duotone') + '</span><div><h1>' + greet() + '</h1><p>' + dateLine() + '</p></div>' +
    '<div class="v3-hero-stats">' + (company ? '<div class="hm-scope" role="group"><button type="button" data-sc="company" aria-pressed="' + (scope === 'company') + '">' + ph('buildings', 'duotone') + t('hmCompany') + '</button><button type="button" data-sc="mine" aria-pressed="' + (scope === 'mine') + '">' + ph('user', 'duotone') + t('hmMine') + '</button></div>' : '') + '</div></header>' +
    '<div id="hmBody"></div></div>';
  $$('[data-sc]', main).forEach(function(b){ b.onclick = function(){ S.homeScope = b.dataset.sc; render(main); }; });
  var body = $('#hmBody', main);
  if (scope === 'company') companyHome(body); else myHome(body);
}

// ---------------- company ----------------
function companyHome(el){
  var today = riyadhToday(), canCal = isHr() || (S.fileRoles || {}).payroll;
  el.innerHTML = '<div class="hm-grid"><section class="hm-kpis hm-s12" id="hmKpis">' + kpis(null) + '</section><section class="hm-card hm-hero hm-s12" id="hmHero">' + (V ? V.gauge(null, t('hmToday')) : '') + '<div>' + sk(3) + '</div></section>' +
    '<section class="hm-card hm-s7" id="hmDecide"><h2>' + ph('tray') + t('hmDecide') + '<span class="sp"></span><button type="button" data-open-tasks>' + t('hmAllTasks') + '</button></h2><div class="hm-rows">' + sk(3) + '</div></section>' +
    (canCal ? '<section class="hm-card hm-s5" id="hmCal"><h2>' + ph('shield-check') + t('hmDeadlines') + '<span class="sp"></span><button type="button" data-go="pay:compliance">' + t('hmCalendar') + '</button></h2><p class="lead">' + t('hmDeadLead') + '</p><div class="hm-rows">' + sk(3) + '</div></section>' : '') +
    '<section class="hm-card hm-s8" id="hmMove"><h2>' + ph('users-three') + t('hmMove') + '</h2><p class="lead">' + t('hmMoveLead') + '</p>' + sk(2) + '</section>' +
    '<section class="hm-card hm-s4" id="hmDept"><h2>' + ph('buildings') + t('hmDepts') + '</h2>' + sk(4) + '</section></div>';
  wire(el);
  apiFresh('dashboard', { from: today, to: today }, function(r){
    if (!el.isConnected || !r.ok) return;
    var A = r.attendance || {}, T0 = A.totals || {}, W = r.workforce || {}, Rq = r.requests || {}, C = r.cost || {};
    var rate = T0.attendanceRate, pend = Rq.pending || {}, open = (pend.manager || 0) + (pend.hr || 0) + (pend.payroll || 0);
    var kb = $('#hmKpis', el); if (kb) kb.innerHTML = kpis(T0);
    var last = C.trend && C.trend.length ? C.trend[C.trend.length - 1] : null;
    var sent = t('hmTodaySentence').replace('{p}', V.n1(T0.present || 0, 0)).replace('{e}', V.n1(T0.expected || 0, 0)).replace('{l}', V.n1(T0.late || 0, 0)).replace('{v}', V.n1(T0.leave || 0, 0));
    $('#hmHero', el).innerHTML = V.gauge(rate == null ? null : Math.round(rate), t('hmToday')) + '<div><h2>' + t('hmToday') + '</h2><p class="big">' + sent + '</p><dl class="hm-facts">' +
      '<div><dt>' + t('hmHeadcount') + '</dt><dd>' + V.n1(W.headcount, 0) + '</dd></div><div><dt>' + t('hmSaudi') + '</dt><dd>' + V.n1(W.saudiPct) + '%' + (W.target ? ' <small>/ ' + W.target + '%</small>' : '') + '</dd></div>' +
      '<div><dt>' + t('hmPayroll') + '</dt><dd>' + (r.money && last ? V.n1(last.cost / 1000, 0) + 'K <small>' + V.monthShort(last.month) + '</small>' : '-') + '</dd></div><div><dt>' + t('hmOpenReq') + '</dt><dd>' + V.n1(open, 0) + (Rq.openOver3Days ? ' <small>' + Rq.openOver3Days + ' &gt; 3 ' + t('dbDays') + '</small>' : '') + '</dd></div></dl></div>';
    V.spinGauges(el);
    var dp = (A.departments || []).slice().sort(function(a, b){ return (b.expected || 0) - (a.expected || 0); }).slice(0, 7);
    $('#hmDept', el).innerHTML = '<h2>' + ph('buildings') + t('hmDepts') + '</h2>' + (dp.length ? V.hbars(dp.map(function(d){ return { label: d.department, value: d.rate || 0, text: V.n1(d.rate, 0) + '%', tip: d.department + ': ' + V.n1(d.rate) + '%' }; }), { max: 100 }) : '<p class="lead">' + t('dbNoData') + '</p>');
    var mv = W.movement || [];
    $('#hmMove', el).innerHTML = '<h2>' + ph('users-three') + t('hmMove') + '</h2><p class="lead">' + t('hmMoveLead') + '</p>' + (mv.length ? V.grouped(mv.map(function(m){ return { label: V.monthShort(m.month), a: m.joiners, b: m.leavers }; })) : '<p class="lead">' + t('dbNoData') + '</p>');
    V.wire(el);
  }, true);
  tasksInto($('#hmDecide .hm-rows', el), true);
  if (canCal) apiFresh('complianceCalendar', {}, function(r){
    var box = $('#hmCal .hm-rows', el); if (!box || !r.ok) return;
    var items = r.items.filter(function(x){ return x.level !== 'info'; }).slice(0, 5);
    box.innerHTML = items.length ? items.map(function(x){
      var who = x.emp ? esc(x.emp.name) : x.month ? esc(x.month) : '';
      var when = x.due ? (x.daysLeft < 0 ? t('cpLate') + ' ' + plural(-x.daysLeft, 'days') : t('cpLeft') + ' ' + plural(x.daysLeft, 'days')) : '';
      return '<div class="hm-r"><div class="m hm-sev ' + x.level + '"><b>' + (T[S.lang]['ck_' + x.kind] || x.kind) + '</b><small>' + [who, when].filter(Boolean).join(' · ') + '</small></div></div>';
    }).join('') : '<p class="lead">' + t('hmNoDeadlines') + '</p>';
  }, true);
}

/** Four tiles for the day: present, late, on leave, absent; each with its icon and colour. */
function kpis(T0){
  var d = T0 || {}, rows = [['present', 'user-check', 'g', d.present, d.expected ? Math.round((d.present || 0) / d.expected * 100) + '% ' + t('hmOfExpected') : ''],
    ['late', 'clock-countdown', 'y', d.late, d.lateMin ? Math.round(d.lateMin) + ' ' + t('dbMinutes') : ''], ['leave', 'airplane-tilt', 'b', d.leave, ''], ['absent', 'user-minus', 'r', d.absent, '']];
  return rows.map(function(x){
    return '<div class="hm-k k-' + x[2] + '"><span class="ic">' + ph(x[1], 'duotone') + '</span><span class="lb">' + t('hmK_' + x[0]) + '</span>' +
      (T0 ? '<b class="v">' + V.n1(x[3] || 0, 0) + '</b>' : '<span class="sk" style="width:40%;height:26px"></span>') + '<small>' + esc(x[4] || '') + '</small></div>';
  }).join('');
}

// ---------------- personal ----------------
function myHome(el){
  var td = S.today || {}, sh = S.shift || {}, next = td.next || 'in', off = td.status === 'off';
  var status = td.lastOut && next === 'in' ? t('hmOut') + ' ' + fmtHm(td.lastOut) : td.firstIn ? t('hmIn') + ' ' + fmtHm(td.firstIn) : off ? t('hmOff') : t('hmNotYet');
  sh = { start: td.shiftStart || sh.start, end: td.shiftEnd || sh.end };
  el.innerHTML = '<div class="hm-grid">' +
    '<section class="hm-card hm-clock hm-s5"><h2>' + ph('clock') + t('hmShift') + '</h2><div class="t"><bdi dir="ltr">' + esc(sh.start || '--:--') + ' – ' + esc(sh.end || '--:--') + '</bdi></div><small>' + status + '</small><br>' +
      '<button type="button" class="go" data-go="time:punch">' + ph('fingerprint') + (next === 'out' ? t('hmCheckOut') : t('hmCheckIn')) + '</button></section>' +
    '<section class="hm-card hm-s7" id="hmTasks"><h2>' + ph('bell') + t('hmMyTasks') + '<span class="sp"></span><button type="button" data-open-tasks>' + t('hmAllTasks') + '</button></h2><div class="hm-rows">' + sk(3) + '</div></section>' +
    '<section class="hm-card hm-s4" id="hmLeave"><h2>' + ph('calendar-dots') + t('hmLeave') + '</h2>' + sk(2) + '</section>' +
    '<section class="hm-card hm-s4" id="hmSlip"><h2>' + ph('receipt') + t('hmSlip') + '</h2>' + sk(2) + '</section>' +
    '<section class="hm-card hm-s4" id="hmMonth"><h2>' + ph('calendar-check') + t('hmMonth') + '</h2>' + sk(2) + '</section></div>';
  wire(el);
  tasksInto($('#hmTasks .hm-rows', el), false);
  apiFresh('myRequests', {}, function(r){
    var box = $('#hmLeave', el); if (!box || !r.ok) return;
    var a = r.leave && r.leave.annual || {}, per = a.perYear || 21, used = a.used || 0;
    box.innerHTML = '<h2>' + ph('calendar-dots') + t('hmLeave') + '</h2><div class="hm-big"><b>' + plural(Math.round((a.available || 0) * 10) / 10, 'days') + '</b><span>' + t('hmAvail') + '</span></div>' +
      '<div class="hm-bar"><i style="width:' + Math.min(100, used / per * 100) + '%"></i></div><p class="lead" style="margin-top:6px">' + t('hmUsed') + ' ' + V.n1(used) + ' / ' + per + '</p>' +
      '<button type="button" class="hm-btn" data-go="requests:mine">' + ph('plus') + t('hmAskLeave') + '</button>';
    wire(box);
  }, true);
  apiFresh('mySlips', {}, function(r){
    var box = $('#hmSlip', el); if (!box || !r.ok) return;
    var s = r.rows[0];
    box.innerHTML = '<h2>' + ph('receipt') + t('hmSlip') + '</h2>' + (s ? '<p class="lead">' + esc(V.monthShort(s.month)) + ' · <bdi>' + esc(s.ref) + '</bdi></p><div class="hm-big"><b>' + V.n1(s.net, 2) + '</b><span>' + t('mfSar') + '</span></div><button type="button" class="hm-mini" data-go="pay:slips">' + t('hmOpen') + '</button>' : '<p class="lead">' + t('hmNoSlip') + '</p>');
    wire(box);
  }, true);
  apiFresh('myHistory', {}, function(r){
    var box = $('#hmMonth', el); if (!box || !r.ok) return;
    var T0 = r.totals, exp = r.days.filter(function(d){ return d.workday && ['upcoming', 'leave', 'holiday'].indexOf(d.status) < 0; }).length, rate = exp ? T0.present / exp * 100 : null;
    box.innerHTML = '<h2>' + ph('calendar-check') + t('hmMonth') + '</h2><dl class="hm-facts" style="border-top:0;grid-template-columns:repeat(3,minmax(0,1fr))"><div><dt>' + t('hmAttRate') + '</dt><dd>' + (rate == null ? '-' : V.n1(rate, 0) + '%') + '</dd></div>' +
      '<div><dt>' + t('hmLateDays') + '</dt><dd>' + T0.lateDays + '</dd></div><div><dt>' + t('hmOt') + '</dt><dd>' + V.n1(T0.overtimeMin / 60) + ' <small>' + t('dbHours') + '</small></dd></div></dl>' +
      '<button type="button" class="hm-mini" data-go="time:history" style="margin-top:10px">' + t('hmOpen') + '</button>';
    wire(box);
  }, true);
}

/** My tasks as rows; each opens where the work is. */
var TK = { requests: 'tray', salaries: 'seal-check', payroll: 'money', reports: 'file-text', recon: 'scales', wps: 'bank', onboarding: 'rocket-launch', policies: 'book-open-text', survey: 'heartbeat', plans: 'path',
  disc_respond: 'scales', disc_decide: 'gavel', disc_objection: 'gavel', injury: 'first-aid-kit', asset_ack: 'package', asset_charge: 'package', clearance: 'sign-out', delegated: 'handshake' };
function tasksInto(box, decideOnly){
  apiFresh('myTasks', {}, function(r){
    if (!box || !box.isConnected || !r.ok) return;
    var list = r.tasks.filter(function(x){ return x.kind !== 'delegated' && (!decideOnly || (x.target && x.target.tab === 'hr')); });
    box.innerHTML = list.length ? list.slice(0, 6).map(function(x){
      var dest = taskDest(x);
      return '<div class="hm-r"><span class="ic">' + ph(TK[x.kind] || 'circle') + '</span><div class="m"><b>' + (T[S.lang]['tk_' + x.kind] || x.kind) + '</b></div><span class="n">' + x.count + '</span><button type="button" class="hm-mini" data-go="' + dest + '">' + t('hmOpen') + '</button></div>';
    }).join('') : '<p class="lead" style="margin:6px 0">' + t('hmNothing') + '</p>';
    wire(box);
  }, true);
}
function wire(root){
  $$('[data-go]', root).forEach(function(b){ b.onclick = function(){ var p = b.dataset.go.split(':'); go(p[0], p[1]); }; });
  $$('[data-open-tasks]', root).forEach(function(b){ b.onclick = function(){ if (window.openTasks) openTasks(); }; });
}

window.Home = { render: render };
})();
