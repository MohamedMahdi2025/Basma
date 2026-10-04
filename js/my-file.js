// "ملفي": the employee's own file. Loaded on demand so the check-in screen stays light.
// Everything shown here is what the server decided this person may see (api myFile).
(function(){
'use strict';

Object.assign(T.ar, {
  mfqNew:'طلب جديد', mfqAtt:'حضوري', mfqPay:'راتبي', mftOverview:'نظرة عامة', mftJob:'وظيفتي', mftRequests:'طلباتي وإجازاتي', mftPay:'راتبي', mftGrowth:'أدائي وتطوري', mftPersonal:'بياناتي ووثائقي',
  mfDashTitle:'شهري في لمحة', mfdAtt:'نسبة حضوري', mfdPunct:'في الموعد', mfdLateDays:'أيام التأخير', mfdLate:'دقائق التأخير', mfdOt:'ساعات إضافية', mfdLeave:'رصيد إجازتي السنوية',
  mfdOpen:'طلباتي المفتوحة', mfdAbsent:'غياب', mfdHours:'ساعات عملي يوما بيوم', mfdHoursLead:'هذا الشهر. العمود البرتقالي يوم تأخرت فيه.',
  mfEmpNo:'الرقم الوظيفي', mfService:'سنوات الخدمة', mfYears:'سنة', mfSince:'منذ', mfManagers:'مديري',
  mfDirect:'المدير المباشر', mfHead:'مدير الإدارة', mfAndHead:'ومدير الإدارة', mfNone:'لم يحدد بعد', mfJd:'الوصف الوظيفي', mfPurpose:'الغرض من الوظيفة',
  mfDuties:'المهام', mfReq:'المتطلبات', mfNoJd:'لم يضف الوصف الوظيفي لوظيفتك بعد. تواصل مع الموارد البشرية لإضافته.',
  mfPay:'الراتب والبدلات', mfShow:'إظهار المبالغ', mfHide:'إخفاء المبالغ', mfBasic:'الراتب الأساسي', mfHousing:'بدل السكن',
  mfTransport:'بدل النقل', mfTotal:'الإجمالي الشهري', mfEffective:'ساري من', mfNoPay:'لا يوجد راتب معتمد في ملفك بعد.',
  mfContract:'العقد', mfType:'نوع العقد', ct_fixed:'محدد المدة', ct_indefinite:'غير محدد المدة', mfEnds:'ينتهي في',
  mfProbation:'نهاية فترة التجربة', mfLeave:'الإجازة السنوية', mfDays:'يوما', mfWeek:'أيام العمل أسبوعيا', mfHours:'ساعات العمل يوميا',
  mfNotice:'فترة الإشعار', mfPersonal:'بياناتي', mfNid:'رقم الهوية أو الإقامة', mfIdExp:'انتهاء الهوية أو الإقامة', mfIban:'الآيبان',
  mfBank:'البنك', mfGosi:'رقم التأمينات', mfPassport:'رقم الجواز', mfPassExp:'انتهاء الجواز', mfFixHint:'لتصحيح أي بيان تواصل مع الموارد البشرية.',
  mfDocs:'وثائقي', mfNoDocs:'لا توجد وثائق مسجلة.', mfExpired:'منتهية', mfLeft:'متبقي', mfAtt:'سجل الحضور', mfAttLead:'حضورك وانصرافك وساعات العمل لكل يوم.',
  mfOpenAtt:'فتح سجل الحضور', mfTeam:'فريقي', mfTeamLead:'الموظفون الذين تديرهم.', mfOpenTeam:'فتح فريقي', mfPeople:'موظفين',
  mfHist:'مسيرتي الوظيفية', mfLoadFail:'تعذر تحميل ملفك. تحقق من الاتصال ثم أعد المحاولة.', mfRetry:'إعادة المحاولة', mfInbox:'طلبات بانتظار اعتمادك',
  mfSar:'ر.س', doc_iqama:'الإقامة', doc_passport:'جواز السفر', doc_work_permit:'رخصة العمل', doc_medical_insurance:'التأمين الطبي',
  doc_contract:'العقد', doc_driving_licence:'رخصة القيادة', doc_other:'وثيقة أخرى', doc_contract_end:'نهاية العقد', doc_probation_end:'نهاية التجربة'
});
Object.assign(T.en, {
  mfqNew:'New request', mfqAtt:'My attendance', mfqPay:'My pay', mftOverview:'Overview', mftJob:'My job', mftRequests:'Requests and leave', mftPay:'Pay', mftGrowth:'Performance and growth', mftPersonal:'Details and documents',
  mfDashTitle:'My month at a glance', mfdAtt:'My attendance', mfdPunct:'On time', mfdLateDays:'Late days', mfdLate:'Minutes late', mfdOt:'Overtime hours', mfdLeave:'Annual leave left',
  mfdOpen:'My open requests', mfdAbsent:'Absent', mfdHours:'My hours day by day', mfdHoursLead:'This month. Amber columns are days I was late.',
  mfEmpNo:'Employee ID', mfService:'Years of service', mfYears:'years', mfSince:'since', mfManagers:'My managers',
  mfDirect:'Direct manager', mfHead:'Department head', mfAndHead:'and department head', mfNone:'Not set yet', mfJd:'Job description', mfPurpose:'Purpose of the job',
  mfDuties:'Duties', mfReq:'Requirements', mfNoJd:'Your job description has not been added yet. Ask HR to add it.',
  mfPay:'Salary and allowances', mfShow:'Show amounts', mfHide:'Hide amounts', mfBasic:'Basic salary', mfHousing:'Housing allowance',
  mfTransport:'Transport allowance', mfTotal:'Monthly total', mfEffective:'Effective from', mfNoPay:'No approved salary on your file yet.',
  mfContract:'Contract', mfType:'Contract type', ct_fixed:'Fixed term', ct_indefinite:'Indefinite', mfEnds:'Ends on',
  mfProbation:'Probation ends', mfLeave:'Annual leave', mfDays:'days', mfWeek:'Working days a week', mfHours:'Working hours a day',
  mfNotice:'Notice period', mfPersonal:'My details', mfNid:'National ID or iqama', mfIdExp:'ID or iqama expiry', mfIban:'IBAN',
  mfBank:'Bank', mfGosi:'GOSI number', mfPassport:'Passport number', mfPassExp:'Passport expiry', mfFixHint:'To correct any detail, contact HR.',
  mfDocs:'My documents', mfNoDocs:'No documents recorded.', mfExpired:'Expired', mfLeft:'left:', mfAtt:'Attendance record', mfAttLead:'Your check-ins, check-outs and hours for each day.',
  mfOpenAtt:'Open attendance record', mfTeam:'My team', mfTeamLead:'The people you manage.', mfOpenTeam:'Open my team', mfPeople:'people',
  mfHist:'My job history', mfLoadFail:'Your file could not be loaded. Check the connection and try again.', mfRetry:'Try again', mfInbox:'Requests waiting for you',
  mfSar:'SAR', doc_iqama:'Iqama', doc_passport:'Passport', doc_work_permit:'Work permit', doc_medical_insurance:'Medical insurance',
  doc_contract:'Contract', doc_driving_licence:'Driving licence', doc_other:'Other document', doc_contract_end:'Contract end', doc_probation_end:'Probation end'
});

var css = '' +
'.mf{display:block}' +
'.mf-grid{display:grid;gap:14px}' +
'.mf-card{background:var(--card);border:1px solid var(--line);border-radius:var(--r-m);padding:16px 16px 14px;animation:mfIn .45s var(--ease) both;animation-delay:calc(var(--i,0) * 45ms)}' +
'@keyframes mfIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
'.mf-card h3{margin:0 0 10px;font-size:16px;font-weight:600;display:flex;align-items:center;gap:8px}' +
'.mf-card h3 i{color:var(--brand);font-size:20px}' +
'.mf-card h3 .sp{flex:1}' +
'.mf-card p{margin:0;color:var(--ink-2)}' +
/* the badge: a pine company ID card with a lanyard slot */
'.mf-id{position:relative;border-radius:22px;padding:30px 20px 18px;color:var(--cream);overflow:hidden;animation:mfCard .7s var(--ease) both;' +
  'background:radial-gradient(120% 80% at 100% 0%, rgba(159,224,174,.16), transparent 55%), linear-gradient(160deg, var(--pine-3), var(--pine) 70%);' +
  'box-shadow:0 18px 40px -18px rgba(28,42,31,.7), inset 0 0 0 1px rgba(242,238,228,.08)}' +
'@keyframes mfCard{from{opacity:0;transform:perspective(900px) rotateX(14deg) translateY(14px)}to{opacity:1;transform:none}}' +
'.mf-id::before{content:"";position:absolute;top:12px;left:50%;width:54px;height:8px;margin-left:-27px;border-radius:4px;background:var(--pine);box-shadow:inset 0 1px 2px rgba(0,0,0,.5)}' +
'.mf-id .top{display:flex;align-items:center;gap:10px;margin-bottom:18px}' +
'.mf-id .top img{height:34px}' +
'.mf-id .top span{font-size:12.5px;color:#AFC0AD;line-height:1.3}' +
'.mf-id .nm{font-size:22px;font-weight:600;line-height:1.3;margin:0}' +
'.mf-id .nme{font-size:13px;color:#AFC0AD;margin:2px 0 0;direction:ltr;text-align:start}' +
'.mf-id .role{margin:10px 0 0;font-size:14px;color:#DDE6DA}' +
'.mf-id .idno{margin-top:18px;padding-top:14px;border-top:1px dashed rgba(242,238,228,.18);display:flex;align-items:flex-end;justify-content:space-between;gap:12px}' +
'.mf-id .idno small{display:block;font-size:12px;color:#AFC0AD}' +
'.mf-id .idno b{display:block;font-size:40px;font-weight:600;line-height:1;letter-spacing:.02em;color:var(--signal);direction:ltr}' +
'.mf-id .svc{text-align:end;font-size:12.5px;color:#AFC0AD}' +
'.mf-id .svc b{display:block;font-size:20px;color:var(--cream);font-weight:600}' +
'.mf-kv{display:grid;grid-template-columns:1fr auto;gap:0}' +
'.mf-kv > *{padding:9px 0;border-bottom:1px solid var(--line)}' +
'.mf-kv > :nth-last-child(-n+2){border-bottom:0}' +
'.mf-kv dt{color:var(--ink-2);font-size:13.5px}' +
'.mf-kv dd{margin:0;text-align:end;font-weight:500;padding-inline-start:14px}' +
'.mf-kv dd.ltr{direction:ltr}' +
'.mf-pay dd{font-variant-numeric:tabular-nums}' +
'.mf-pay .tot dt,.mf-pay .tot dd{font-weight:600;color:var(--ink);font-size:16px}' +
'.mf-mask{letter-spacing:.2em;color:var(--ink-2)}' +
'.mf-toggle{height:34px;border-radius:999px;border:1px solid var(--line);background:var(--paper);padding:0 12px;font-size:13px;display:inline-flex;align-items:center;gap:6px}' +
'.mf-toggle[aria-pressed="true"]{background:var(--pine);color:var(--cream);border-color:var(--pine)}' +
'.mf-person{display:flex;align-items:center;gap:12px;padding:8px 0}' +
'.mf-person + .mf-person{border-top:1px solid var(--line)}' +
'.mf-person .main{flex:1;min-width:0}' +
'.mf-person .main small{display:block;color:var(--ink-2);font-size:12.5px}' +
'.mf-person .main b{font-weight:500}' +
'.mf-jd h4{margin:12px 0 6px;font-size:13.5px;color:var(--ink-2);font-weight:500}' +
'.mf-jd ul{margin:0;padding-inline-start:18px}' +
'.mf-jd li{margin:3px 0}' +
'.mf-jd li::marker{color:var(--brand)}' +
'.mf-doc{display:flex;align-items:center;gap:10px;padding:9px 0}' +
'.mf-doc + .mf-doc{border-top:1px solid var(--line)}' +
'.mf-doc .main{flex:1}' +
'.mf-doc .main small{display:block;color:var(--ink-2);font-size:12.5px}' +
'.mf-go{margin-top:12px}' +
'.mf-hist{list-style:none;margin:0;padding:0;position:relative}' +
'.mf-hist li{position:relative;padding:0 18px 12px 0;margin-inline-start:6px;border-inline-start:2px solid var(--line);padding-inline-start:16px;padding-inline-end:0}' +
'.mf-hist li::before{content:"";position:absolute;inset-inline-start:-6px;top:4px;width:10px;height:10px;border-radius:50%;background:var(--brand)}' +
'.mf-hist li:last-child{border-color:transparent}' +
'.mf-hist small{display:block;color:var(--ink-2);font-size:12.5px}' +
'@media (min-width:1024px){' +
  '.mf-grid{grid-template-columns:340px minmax(0,1fr);align-items:start;gap:20px}' +
  '.mf-side{position:sticky;top:12px;display:grid;gap:14px}' +
  '.mf-main{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}' +
  '.mf-main .wide{grid-column:1 / -1}' +
  '.page.mf{max-width:1180px}' +
'}' +
'@media (max-width:1023px){.mf-side,.mf-main{display:grid;gap:14px}}';
// Profile redesign (2026-09-30, redesign-skill + ui-ux-pro-max): identity header, tabbed sections, calmer cards.
css += '' +
'.page.mf{max-width:1180px}' +
'.mf-hero{position:relative;overflow:hidden;border-radius:28px;color:var(--cream);margin:0 0 6px;isolation:isolate;' +
  'background:radial-gradient(90% 120% at 100% 0%, rgba(159,224,174,.20), transparent 55%), radial-gradient(70% 90% at 0% 100%, rgba(77,109,81,.55), transparent 60%), linear-gradient(155deg, #2E4433, #1C2A1F 72%);' +
  'box-shadow:0 24px 48px -28px rgba(28,42,31,.75), inset 0 0 0 1px rgba(242,238,228,.07);animation:mfHero .6s var(--ease) both}' +
'.mf-hero::after{content:"";position:absolute;inset:0;z-index:-1;opacity:.35;mix-blend-mode:overlay;pointer-events:none;' +
  'background-image:url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\' opacity=\'.5\'/></svg>")}' +
'@keyframes mfHero{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}' +
'.mf-hero-in{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:22px;align-items:center;padding:28px 28px 22px}' +
'.mf-av{width:96px;height:96px;border-radius:30px;display:grid;place-items:center;font-size:34px;font-weight:600;color:#1C2A1F;letter-spacing:.02em;' +
  'background:linear-gradient(145deg,#C9EDD2,#9FE0AE 45%,#6FA97A);box-shadow:0 10px 24px -10px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.55)}' +
'.mf-who{min-width:0}' +
'.mf-co{display:flex;align-items:center;gap:8px;margin:0 0 8px;font-size:12.5px;color:#AFC0AD}.mf-co img{height:20px;opacity:.9}' +
'.mf-who h1{margin:0;font-size:30px;font-weight:600;line-height:1.2;letter-spacing:-.01em;text-wrap:balance}' +
'.mf-en{margin:3px 0 0;font-size:13.5px;color:#AFC0AD;direction:ltr;text-align:start}' +
'.mf-role{margin:8px 0 0;font-size:15px;color:#DDE6DA}.mf-role i{font-style:normal;margin:0 8px;color:#7F9683}' +
'.mf-flag{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:12.5px;padding:4px 10px;border-radius:8px;background:rgba(224,160,67,.16);color:#F3CE8E;border:1px solid rgba(224,160,67,.28)}' +
'.mf-acts{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;align-self:start}' +
'.mf-btn{height:44px;padding:0 16px;border-radius:12px;white-space:nowrap;display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:500;cursor:pointer;color:var(--cream);' +
  'background:rgba(242,238,228,.07);border:1px solid rgba(242,238,228,.16);transition:background-color .2s,transform .12s}' +
'.mf-btn:hover{background:rgba(242,238,228,.14)}.mf-btn:active{transform:translateY(1px)}.mf-btn:focus-visible{outline:2px solid var(--signal);outline-offset:2px}' +
'.mf-btn.pri{background:var(--cream);color:var(--pine);border-color:var(--cream)}.mf-btn.pri:hover{background:#fff}' +
'.mf-btn i{font-size:18px}' +
'.mf-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin:0;border-top:1px solid rgba(242,238,228,.1);background:rgba(0,0,0,.12)}' +
'.mf-facts div{padding:14px 28px 16px;border-inline-start:1px solid rgba(242,238,228,.08)}.mf-facts div:first-child{border-inline-start:0}' +
'.mf-facts dt{font-size:12px;color:#AFC0AD;margin-bottom:3px}.mf-facts dd{margin:0;font-size:15.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
'.mf-tabs{position:sticky;top:0;z-index:6;display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;margin:0 -4px 18px;padding:6px 4px 0;background:var(--paper);border-bottom:1px solid var(--line)}' +
'.mf-tabs::-webkit-scrollbar{display:none}' +
'.mf-tabs button{flex:none;height:48px;padding:0 14px;border:0;background:none;display:inline-flex;align-items:center;gap:8px;font-size:14.5px;font-weight:500;color:var(--ink-2);' +
  'border-bottom:3px solid transparent;margin-bottom:-1px;cursor:pointer;border-radius:10px 10px 0 0;transition:color .2s,background-color .2s,border-color .2s}' +
'.mf-tabs button i{font-size:19px}.mf-tabs button:hover{color:var(--ink);background:rgba(77,109,81,.06)}' +
'.mf-tabs button[aria-selected="true"]{color:var(--pine);border-bottom-color:var(--brand);font-weight:600}' +
'.mf-tabs button:focus-visible{outline:2px solid var(--brand);outline-offset:-2px}' +
'.mf-panel{animation:mfIn .3s var(--ease) both}' +
'.mf-cols{display:grid;gap:16px;align-items:start}' +
'.mf .mf-card{border:0;border-radius:20px;padding:18px 20px 16px;box-shadow:0 1px 2px rgba(28,42,31,.05), 0 10px 28px -16px rgba(28,42,31,.22)}' +
'.mf .mf-card h3{font-size:16px;margin-bottom:12px}.mf .mf-card h3 > i{display:none}' +
'.mf-card h3 .ic{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:#E6EFE7;flex:none}.mf-card h3 .ic i{font-size:19px;color:var(--brand)}' +
'.mf-lead{color:var(--ink)!important;font-size:15px;line-height:1.8;max-width:70ch}' +
'.mf-note{display:flex;gap:6px;align-items:flex-start;margin-top:10px!important;font-size:12.5px}' +
'.mf #mfDash .db-panel{background:var(--card);border:0;border-radius:20px;box-shadow:0 1px 2px rgba(28,42,31,.05), 0 10px 28px -16px rgba(28,42,31,.22);padding:16px 18px 4px}' +
'@media (min-width:900px){.mf-cols{grid-template-columns:repeat(2,minmax(0,1fr))}.mf-cols .wide{grid-column:1 / -1}}' +
'@media (max-width:760px){' +
  '.mf-hero{border-radius:22px}.mf-hero-in{grid-template-columns:auto minmax(0,1fr);padding:20px 18px 16px;gap:14px}' +
  '.mf-av{width:68px;height:68px;border-radius:22px;font-size:24px}.mf-who h1{font-size:23px}' +
  '.mf-acts{grid-column:1 / -1;justify-content:stretch}.mf-btn{flex:1;justify-content:center;padding:0 10px}' +
  '.mf-facts{grid-template-columns:1fr 1fr}.mf-facts div{padding:11px 18px 12px}.mf-facts div:nth-child(odd){border-inline-start:0}' +
  '.mf-tabs button{padding:0 11px;font-size:13.5px}' +
'}' +
'@media (prefers-reduced-motion:reduce){.mf-hero,.mf-panel,.mf-card{animation:none!important}}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

var shown = false;

function fmtDate(d){ if (!d) return ''; return new Date(String(d).slice(0, 10) + 'T12:00:00Z').toLocaleDateString(LOCALE(), { day:'numeric', month:'short', year:'numeric', timeZone:'UTC' }); }
function money(n){ return Number(n || 0).toLocaleString(LOCALE(), { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ' + t('mfSar'); }
function lang(ar, en){ return S.lang === 'en' && en ? en : ar; }
function daysLeft(d){ return Math.round((Date.parse(String(d).slice(0, 10) + 'T00:00:00Z') - Date.parse(riyadhToday() + 'T00:00:00Z')) / 86400000); }
function expiryChip(d){
  if (!d) return '';
  var n = daysLeft(d);
  if (n < 0) return '<span class="chip absent">' + t('mfExpired') + '</span>';
  if (n <= 60) return '<span class="chip late num">' + t('mfLeft') + ' ' + plural(n, 'days') + '</span>';
  return '<span class="chip num">' + fmtDate(d) + '</span>';
}
function kv(rows){
  rows = rows.filter(function(r){ return r[1] !== '' && r[1] != null; });
  if (!rows.length) return '';
  return '<dl class="mf-kv">' + rows.map(function(r){ return '<dt>' + r[0] + '</dt><dd' + (r[2] ? ' class="' + r[2] + '"' : '') + '>' + r[1] + '</dd>'; }).join('') + '</dl>';
}
function lines(s){
  var a = String(s || '').split(/\n+/).map(function(x){ return x.replace(/^[\s\-•*•]+/, '').trim(); }).filter(String);
  return a.length ? '<ul>' + a.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '';
}
function person(p, label){
  return '<div class="mf-person"><div class="av">' + (p ? esc(initials(p.name)) : I.user) + '</div><div class="main"><small>' + label + '</small><b>' +
    (p ? esc(lang(p.name, p.nameEn)) : t('mfNone')) + '</b>' + (p && p.title ? '<small>' + esc(p.title) + '</small>' : '') + '</div></div>';
}
function maskIban(s){ s = String(s || ''); return s ? s.slice(0, 4) + ' •••• ' + s.slice(-4) : ''; }

function payCard(c){
  if (!c) return '<p>' + t('mfNoPay') + '</p>';
  var amt = function(n){ return shown ? money(n) : '<span class="mf-mask">••••••</span>'; };
  var rows = [[t('mfBasic'), amt(c.basic)], [t('mfHousing'), amt(c.housing)], [t('mfTransport'), amt(c.transport)]];
  Object.keys(c.other || {}).forEach(function(k){ rows.push([esc(k), amt(c.other[k])]); });
  return '<dl class="mf-kv mf-pay">' + rows.map(function(r){ return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') +
    '<dt class="tot" style="font-weight:600;color:var(--ink)">' + t('mfTotal') + '</dt><dd style="font-weight:600;font-size:16px">' + amt(c.total) + '</dd></dl>' +
    '<p style="margin-top:8px;font-size:12.5px">' + t('mfEffective') + ' ' + fmtDate(c.effectiveFrom) + '</p>';
}

function draw(main, f){
  var e = f.emp, j = f.job, i = 0;
  var card = function(cls, html){ return '<div class="mf-card ' + (cls || '') + '" style="--i:' + (i++) + '">' + html + '</div>'; };
  var head = function(icon, title, extra){ return '<h3><span class="ic">' + ph(icon) + '</span>' + title + '<span class="sp"></span>' + (extra || '') + '</h3>'; };
  var pos = j.position ? lang(j.position.titleAr, j.position.titleEn) : (e.title || '');
  var dep = j.department ? lang(j.department.nameAr, j.department.nameEn) : (e.department || '');
  var hasPay = 'comp' in f, hasPriv = !!(f.priv || f.documents);

  // ---- profile header: who I am, the facts people look for, and what I do most ----
  var facts = [[t('mfEmpNo'), '<bdi class="num">' + esc(e.empNo) + '</bdi>']];
  if (j.serviceYears != null) facts.push([t('mfService'), '<span class="num">' + j.serviceYears.toLocaleString(LOCALE()) + '</span> ' + t('mfYears')]);
  if (j.hireDate) facts.push([t('mfSince'), fmtDate(j.hireDate)]);
  if (j.manager) facts.push([t('mfDirect'), esc(lang(j.manager.name, j.manager.nameEn))]);
  if (j.contractType) facts.push([t('mfType'), t('ct_' + j.contractType)]);
  var probation = j.probationEnd && daysLeft(j.probationEnd) >= 0 ? '<span class="mf-flag">' + ph('hourglass-medium') + t('mfProbation') + ' ' + fmtDate(j.probationEnd) + '</span>' : '';
  var hero = '<header class="mf-hero" role="banner"><div class="mf-hero-in">' +
    '<div class="mf-av" aria-hidden="true">' + esc(initials(e.name)) + '</div>' +
    '<div class="mf-who"><p class="mf-co"><img src="' + MARK + '" alt="">' + t('company') + '</p><h1>' + esc(lang(e.name, e.nameEn)) + '</h1>' +
      (S.lang !== 'en' && e.nameEn ? '<p class="mf-en">' + esc(e.nameEn) + '</p>' : '') +
      (pos || dep ? '<p class="mf-role">' + esc(pos) + (pos && dep ? '<i>·</i>' : '') + esc(dep) + '</p>' : '') + probation + '</div>' +
    '<div class="mf-acts"><button type="button" class="mf-btn pri" id="mfNewReq">' + ph('plus') + t('mfqNew') + '</button><button type="button" class="mf-btn" id="mfAtt">' + ph('calendar-check') + t('mfqAtt') + '</button>' +
      (hasPay ? '<button type="button" class="mf-btn" data-go="pay">' + ph('receipt') + t('mfqPay') + '</button>' : '') + '</div></div>' +
    '<dl class="mf-facts">' + facts.map(function(x){ return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('') + '</dl></header>';

  // ---- tabs ----
  var tabs = [['overview', 'squares-four', t('mftOverview')], ['job', 'briefcase', t('mftJob')], ['requests', 'paper-plane-tilt', t('mftRequests')]];
  if (hasPay) tabs.push(['pay', 'wallet', t('mftPay')]);
  tabs.push(['growth', 'trend-up', t('mftGrowth')]);
  if (hasPriv) tabs.push(['personal', 'identification-badge', t('mftPersonal')]);
  var cur = S.mfTab && tabs.some(function(x){ return x[0] === S.mfTab; }) ? S.mfTab : 'overview';
  var nav = '<nav class="mf-tabs" role="tablist" aria-label="' + t('tabFile') + '">' + tabs.map(function(x){
    return '<button type="button" role="tab" id="mft-' + x[0] + '" aria-controls="mfp-' + x[0] + '" aria-selected="' + (cur === x[0]) + '" tabindex="' + (cur === x[0] ? 0 : -1) + '" data-tab="' + x[0] + '">' + ph(x[1]) + '<span>' + x[2] + '</span></button>';
  }).join('') + '</nav>';

  // ---- panels ----
  var people = card('', head('users', t('mfManagers')) + (j.manager && j.head && j.manager.id === j.head.id ? person(j.manager, t('mfDirect') + ' ' + t('mfAndHead')) : person(j.manager, t('mfDirect')) + person(j.head, t('mfHead'))));
  var team = f.isManager ? card('', head('users-three', t('mfTeam'), '<span class="chip in num">' + plural(f.teamCount, 'people') + '</span>') + '<p>' + t('mfTeamLead') + '</p><button type="button" class="btn btn-dark btn-sm mf-go" id="mfTeam">' + t('mfOpenTeam') + '</button>') : '';

  var overview = '<div id="mfDash">' + (window.Viz ? Viz.panel('file', t('mfDashTitle'), Viz.skeleton(6)) : '') + '</div>' +
    '<div class="mf-cols"><div id="mfEngage" style="display:contents"></div><div id="mfOps" style="display:contents"></div>' + people + team + '</div>';

  var jd = f.jd, jdHtml = head('briefcase', t('mfJd'));
  if (jd && (jd.purposeAr || jd.dutiesAr || jd.requirementsAr || jd.purposeEn)) {
    var en = S.lang === 'en';
    var purpose = en && jd.purposeEn ? jd.purposeEn : jd.purposeAr, duties = en && jd.dutiesEn ? jd.dutiesEn : jd.dutiesAr, req = en && jd.requirementsEn ? jd.requirementsEn : jd.requirementsAr;
    jdHtml += '<div class="mf-jd">' + (purpose ? '<p class="mf-lead">' + esc(purpose) + '</p>' : '') +
      (duties ? '<h4>' + t('mfDuties') + '</h4>' + lines(duties) : '') + (req ? '<h4>' + t('mfReq') + '</h4>' + lines(req) : '') + '</div>';
  } else jdHtml += '<p>' + t('mfNoJd') + '</p>';
  var contract = card('', head('file-text', t('mfContract')) + (kv([
    [t('mfType'), j.contractType ? t('ct_' + j.contractType) : ''],
    [t('mfEnds'), j.contractType === 'fixed' && j.contractEnd ? fmtDate(j.contractEnd) : ''],
    [t('mfProbation'), j.probationEnd ? fmtDate(j.probationEnd) : ''],
    [t('mfLeave'), j.annualLeaveDays != null ? plural(j.annualLeaveDays, 'days') : ''],
    [t('mfWeek'), j.workDaysPerWeek != null ? '<span class="num">' + j.workDaysPerWeek + '</span>' : ''],
    [t('mfHours'), j.dailyHours != null ? '<span class="num">' + j.dailyHours + '</span>' : ''],
    [t('mfNotice'), j.noticeDays != null ? plural(j.noticeDays, 'days') : '']
  ]) || '<p>' + t('mfNone') + '</p>'));
  var hist = f.jobHistory && f.jobHistory.length ? card('', head('path', t('mfHist')) + '<ul class="mf-hist">' + f.jobHistory.map(function(h){
    return '<li><b>' + esc(h.department || t('mfNone')) + '</b><small>' + fmtDate(h.effectiveFrom) + (h.manager ? '، ' + t('mfDirect') + ': ' + esc(h.manager) : '') + '</small></li>';
  }).join('') + '</ul>') : '';
  var job = '<div class="mf-cols">' + card('wide', jdHtml) + contract + (hist || people) + '</div>';

  var requestsP = '<div class="mf-cols"><div class="mf-card wide" id="mfReq" style="--i:' + (i++) + '"><span class="sk" style="width:40%"></span><span class="sk"></span><span class="sk" style="width:70%"></span></div>' +
    '<div class="mf-card" id="mfLeave" style="--i:' + (i++) + '"><span class="sk" style="width:40%"></span><span class="sk"></span></div>' +
    card('', head('calendar-check', t('mfAtt')) + '<p>' + t('mfAttLead') + '</p><button type="button" class="btn btn-line btn-sm mf-go" id="mfAtt2">' + t('mfOpenAtt') + '</button>') + '</div>';

  var pay = hasPay ? '<div class="mf-cols">' + card('', head('wallet', t('mfPay'), f.comp ? '<button type="button" class="mf-toggle" id="mfShow" aria-pressed="' + shown + '">' + ph(shown ? 'eye-slash' : 'eye') + (shown ? t('mfHide') : t('mfShow')) + '</button>' : '') + payCard(f.comp)) +
    '<div class="mf-card" id="mfSlips" style="--i:' + (i++) + '"><span class="sk" style="width:40%"></span><span class="sk"></span></div></div>' : '';

  var growth = '<div class="mf-cols"><div class="mf-card wide" id="mfPerf"><span class="sk" style="width:40%"></span><span class="sk"></span></div></div>';

  var personal = '';
  if (hasPriv) {
    personal = '<div class="mf-cols">';
    if (f.priv) {
      var p = f.priv;
      personal += card('', head('identification-badge', t('mfPersonal')) + (kv([
        [t('mfNid'), esc(p.nationalId), 'ltr num'], [t('mfIdExp'), p.idExpiry ? expiryChip(p.idExpiry) : ''],
        [t('mfPassport'), esc(p.passportNo), 'ltr'], [t('mfPassExp'), p.passportExpiry ? expiryChip(p.passportExpiry) : ''],
        [t('mfIban'), esc(maskIban(p.iban)), 'ltr num'], [t('mfBank'), esc(p.bankName)], [t('mfGosi'), esc(p.gosiNumber), 'ltr num']
      ]) || '<p>' + t('mfNone') + '</p>') + '<p class="mf-note">' + ph('info') + t('mfFixHint') + '</p>');
    }
    if (f.documents) personal += card('', head('folder-simple', t('mfDocs')) + (f.documents.length ? f.documents.map(function(d){
      return '<div class="mf-doc"><div class="av">' + ph('file') + '</div><div class="main"><b>' + t('doc_' + d.type) + '</b>' + (d.number ? '<small><bdi>' + esc(d.number) + '</bdi></small>' : '') + '</div>' + expiryChip(d.expiryDate) + '</div>';
    }).join('') : '<p>' + t('mfNoDocs') + '</p>'));
    personal += '</div>';
  }
  var panels = { overview: overview, job: job, requests: requestsP, pay: pay, growth: growth, personal: personal };

  main.innerHTML = '<section class="page mf">' + hero + nav + tabs.map(function(x){
    return '<div class="mf-panel" role="tabpanel" id="mfp-' + x[0] + '" aria-labelledby="mft-' + x[0] + '"' + (cur === x[0] ? '' : ' hidden') + '>' + panels[x[0]] + '</div>';
  }).join('') + '</section>';

  // tabs: click, arrow keys (RTL aware), remembered for the session
  var btns = $$('.mf-tabs [data-tab]', main);
  function go(k, focus){
    S.mfTab = k;
    btns.forEach(function(b){ var on = b.dataset.tab === k; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    $$('.mf-panel', main).forEach(function(p){ p.hidden = p.id !== 'mfp-' + k; });
    var bar = $('.mf-tabs', main); if (bar && bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ block: 'start' });
  }
  btns.forEach(function(b, n){
    b.onclick = function(){ go(b.dataset.tab); };
    b.onkeydown = function(ev){
      var fwd = S.lang === 'ar' ? 'ArrowLeft' : 'ArrowRight', back = S.lang === 'ar' ? 'ArrowRight' : 'ArrowLeft', m = -1;
      if (ev.key === fwd) m = (n + 1) % btns.length; else if (ev.key === back) m = (n - 1 + btns.length) % btns.length; else if (ev.key === 'Home') m = 0; else if (ev.key === 'End') m = btns.length - 1;
      if (m >= 0) { ev.preventDefault(); go(btns[m].dataset.tab, true); }
    };
  });
  $$('[data-go]', main).forEach(function(b){ b.onclick = function(){ go(b.dataset.go, true); }; });

  var sb = $('#mfShow', main);
  if (sb) sb.onclick = function(){ shown = !shown; draw(main, f); };
  var toAtt = function(){ goArea('time', 'history'); };
  $('#mfAtt', main).onclick = toAtt; $('#mfAtt2', main).onclick = toAtt;
  $('#mfNewReq', main).onclick = function(){ if (window.Req) Req.newRequest(f, function(){ requests(main, f); }); };
  var tb = $('#mfTeam', main); if (tb) tb.onclick = function(){ goArea('people', 'team'); };
  myDash(main, null);
  requests(main, f);
  var sl = $('#mfSlips', main); if (sl && window.Payroll) Payroll.myCard(sl, f.emp);
  var pf = $('#mfPerf', main); if (pf && window.Perf) Perf.myCards(pf);
  var eg = $('#mfEngage', main); if (eg && window.Engage) Engage.myCards(eg);
  var op = $('#mfOps', main); if (op && window.Ops && Ops.myCards) Ops.myCards(op);
}

/**
 * My month at a glance: attendance, punctuality, lateness, overtime, leave left and open requests, and hours per day.
 * Draws from myHistory (this month) and the myRequests answer; either may arrive first.
 */
var DASH = { hist: null, req: null };
function myDash(main, reqRes){
  if (!window.Viz) return;
  if (reqRes) DASH.req = reqRes;
  if (!reqRes) apiFresh('myHistory', {}, function(r){ if (r.ok) { DASH.hist = r; paint(); } }, true);
  paint();
  function paint(){
    var box = $('#mfDash', main); if (!box || !DASH.hist) return;
    var H = DASH.hist, days = H.days.slice().reverse(), T0 = H.totals, V = Viz;
    var exp = days.filter(function(d){ return d.workday && ['upcoming', 'leave', 'holiday'].indexOf(d.status) < 0; }).length;
    var rate = exp ? T0.present / exp * 100 : null, punct = T0.present ? (T0.present - T0.lateDays) / T0.present * 100 : null;
    var q = DASH.req, av = q && q.leave && q.leave.annual ? q.leave.annual.available : null, open = q ? q.rows.filter(function(x){ return x.status === 'pending'; }).length : null;
    var tiles = V.tile(t('mfdAtt'), rate == null ? '-' : V.n1(rate, 0) + '%', plural(T0.present, 'days') + ' / ' + V.n1(exp, 0), null, true, true) +
      V.tile(t('mfdPunct'), punct == null ? '-' : V.n1(punct, 0) + '%', T0.lateDays ? t('mfdLateDays') + ' ' + T0.lateDays : '') +
      V.tile(t('mfdLate'), V.n1(T0.lateMin, 0) + ' ' + t('dbMinutes'), '') + V.tile(t('mfdOt'), V.n1(T0.overtimeMin / 60) + ' ' + t('dbHours'), '') +
      V.tile(t('mfdLeave'), av == null ? '-' : V.n1(av), t('dbDays')) + V.tile(t('mfdOpen'), open == null ? '-' : V.n1(open, 0), T0.absent ? t('mfdAbsent') + ' ' + T0.absent : '');
    var bars = days.filter(function(d){ return d.workday || d.firstIn; }).slice(-22).map(function(d){
      var hrs = Math.round(d.workedMin / 6) / 10;
      return { label: String(Number(d.date.slice(8))), value: hrs, alt: d.lateMin > 0, tip: V.shortDate(d.date) + ': ' + hrs + ' ' + t('dbHours') + (d.lateMin ? ' · ' + t('late') + ' ' + d.lateMin + ' ' + t('dbMinutes') : '') + (d.status === 'absent' ? ' · ' + t('st_absent') : d.status === 'leave' ? ' · ' + t('st_leave') : '') };
    });
    var chart = V.card('mfh', t('mfdHours'), t('mfdHoursLead'), V.cols(bars, {}) + '<div class="db-legend"><span><i style="background:var(--s1)"></i>' + t('st_present') + '</span><span><i style="background:var(--s2)"></i>' + t('late') + '</span></div>',
      V.tbl([t('date'), t('dbHours'), t('late')], days.filter(function(d){ return d.firstIn; }).map(function(d){ return [V.shortDate(d.date), Math.round(d.workedMin / 6) / 10, d.lateMin]; })));
    box.innerHTML = V.panel('file', t('mfDashTitle'), '<div class="db-tiles">' + tiles + '</div><div class="db-grid">' + chart + '</div>');
    V.wire(box);
  }
}

/** Leave balance and requests: their own call, so the file shows first and these fill in (from memory when seen before). */
function requests(main, f){
  if (!window.Req) return;
  apiFresh('myRequests', {}, function(r){
    var lv = $('#mfLeave', main), rq = $('#mfReq', main);
    if (!lv || !rq) return;
    if (!r.ok) { lv.remove(); rq.innerHTML = '<p>' + t('mfLoadFail') + '</p>'; return; }
    myDash(main, r);
    lv.innerHTML = Req.balanceCard(r.leave, r.holidays) + (r.inbox ? '<button type="button" class="btn btn-dark btn-sm mf-go" id="mfInbox">' + ph('seal-check') + t('mfInbox') + ' (' + r.inbox + ')</button>' : '');
    rq.innerHTML = Req.listCard(r.rows);
    Req.wireList(rq, r.rows, f, function(){ requests(main, f); });
    $('#rqNew', rq).onclick = function(){ Req.newRequest(f, function(){ requests(main, f); }); };
    var ib = $('#mfInbox', lv); if (ib) ib.onclick = function(){ goArea('requests', 'inbox'); };
  });
}

function render(main){
  main.innerHTML = '<section class="page mf"><div class="mf-grid"><div class="mf-side"><div class="mf-id" style="min-height:220px"></div></div>' +
    '<div class="mf-main">' + [0, 1, 2].map(function(){ return '<div class="mf-card"><span class="sk" style="width:40%"></span><span class="sk"></span><span class="sk" style="width:70%"></span></div>'; }).join('') + '</div></div></section>';
  apiFresh('myFile', {}, function(r){
    if (!main.isConnected) return;
    if (!r.ok) {
      main.innerHTML = '<section class="page"><div class="empty">' + ph('wifi-slash') + '<b>' + t('mfLoadFail') + '</b><div class="btnrow" style="justify-content:center;margin-top:12px"><button class="btn btn-dark btn-sm" id="mfRetry">' + t('mfRetry') + '</button></div></div></section>';
      $('#mfRetry').onclick = function(){ render(main); };
      return;
    }
    setHrAccess(r.file);
    draw(main, r.file);
  });
}

window.MyFile = { render: render };
})();
