// Public careers page (2026-10-19): opened with #careers, no sign-in. Lists the jobs HR published (careersList) and takes
// applications (careersApply) with the PDPL consent. Nothing here reads or shows internal data; the server decides what is public.
(function(){
'use strict';

Object.assign(T.ar, {
  crTitle:'الوظائف الشاغرة', crLead:'انضم إلى فريقنا. اختر الوظيفة واملأ الطلب، وسيتواصل معك فريق التوظيف إن كان ملفك مناسبا.', crNone:'لا توجد وظائف شاغرة حاليا. عد لاحقا.',
  crApply:'قدّم على هذه الوظيفة', crBack:'كل الوظائف', crCloses:'آخر موعد', crCity:'المدينة', crDept:'القسم', crAbout:'عن الوظيفة', crReq:'المتطلبات', crSaudi:'هذه الوظيفة للمواطنين السعوديين.',
  crName:'الاسم الكامل', crPhone:'رقم الجوال', crEmail:'البريد الإلكتروني (اختياري)', crNat:'الجنسية', crYears:'سنوات الخبرة', crCurTitle:'المسمى الحالي', crCurEmp:'جهة العمل الحالية',
  crCv:'رابط السيرة الذاتية أو LinkedIn (اختياري)', crMsg:'رسالة قصيرة (اختياري)', crSend:'إرسال الطلب',
  crConsent:'أوافق على أن تحتفظ الشركة ببياناتي هذه لغرض التوظيف فقط، لمدة أقصاها سنة إن لم أُقبل، ولي أن أطلب حذفها في أي وقت (نظام حماية البيانات الشخصية).',
  crThanks:'شكرا لك، وصل طلبك.', crThanksLead:'سيراجع فريق التوظيف طلبك ويتواصل معك إن كان ملفك مناسبا.', crSignIn:'دخول الموظفين', crRef:'رقم الوظيفة',
  e_bad_phone:'رقم الجوال غير صحيح.', e_consent_required:'يلزم الموافقة على حفظ البيانات.'
});
Object.assign(T.en, {
  crTitle:'Open positions', crLead:'Join our team. Pick a job and fill in the application; the recruitment team will contact you if your profile fits.', crNone:'There are no open positions right now. Please check back later.',
  crApply:'Apply for this job', crBack:'All jobs', crCloses:'Closes', crCity:'City', crDept:'Department', crAbout:'About the job', crReq:'Requirements', crSaudi:'This job is for Saudi nationals.',
  crName:'Full name', crPhone:'Mobile number', crEmail:'E-mail (optional)', crNat:'Nationality', crYears:'Years of experience', crCurTitle:'Current job title', crCurEmp:'Current employer',
  crCv:'CV or LinkedIn link (optional)', crMsg:'Short message (optional)', crSend:'Send application',
  crConsent:'I agree that the company keeps these details for recruitment only, for at most one year if I am not hired, and that I may ask for them to be deleted at any time (Personal Data Protection Law).',
  crThanks:'Thank you, your application has arrived.', crThanksLead:'The recruitment team will review it and contact you if your profile fits.', crSignIn:'Staff sign-in', crRef:'Job no.',
  e_bad_phone:'The mobile number is not valid.', e_consent_required:'Please agree to the data notice.'
});

var DATA = null;
function L(ar, en){ return S.lang === 'en' && en ? en : ar || en || ''; }
function para(s){ return esc(s || '').split(/\n+/).filter(String).map(function(x){ return '<p>' + x + '</p>'; }).join(''); }
function day(d){ return d ? new Date(d + 'T12:00:00Z').toLocaleDateString(S.lang === 'en' ? 'en-GB' : 'ar-SA-u-ca-gregory', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''; }
function shell(inner){
  var co = DATA && DATA.company ? (S.lang === 'en' ? DATA.company.nameEn : DATA.company.nameAr) : coName();
  root('<div class="cr-page"><header class="cr-top"><span class="cr-mark" aria-hidden="true" style="-webkit-mask-image:url(' + MARK + ');mask-image:url(' + MARK + ')"></span><b>' + esc(co || '') + '</b><span class="sp"></span>' +
    langBtn() + '<a class="cr-in" href="#">' + t('crSignIn') + '</a></header><main class="cr-main">' + inner + '</main></div>');
  var a = $('.cr-in'); if (a) a.onclick = function(ev){ ev.preventDefault(); history.replaceState(null, '', location.pathname); location.reload(); };
}
function list(){
  rerender = list;
  var rows = (DATA && DATA.rows) || [];
  shell('<h1>' + t('crTitle') + '</h1><p class="cr-lead">' + t('crLead') + '</p>' + (rows.length ? '<div class="cr-list">' + rows.map(function(p, i){
    return '<button type="button" class="cr-card" data-i="' + i + '"><b>' + esc(L(p.titleAr, p.titleEn)) + '</b><span>' + [L(p.deptAr, p.deptEn), p.city].filter(String).map(esc).join(' · ') + '</span>' +
      (p.closesOn ? '<small>' + t('crCloses') + ': ' + day(p.closesOn) + '</small>' : '') + ph(S.lang === 'en' ? 'caret-right' : 'caret-left') + '</button>';
  }).join('') + '</div>' : '<p class="cr-empty">' + ph('briefcase') + t('crNone') + '</p>'));
  $$('[data-i]').forEach(function(b){ b.onclick = function(){ job(rows[b.dataset.i]); }; });
}
function job(p){
  rerender = function(){ job(p); };
  shell('<button type="button" class="cr-back" id="crBack">' + ph(S.lang === 'en' ? 'arrow-left' : 'arrow-right') + t('crBack') + '</button>' +
    '<h1>' + esc(L(p.titleAr, p.titleEn)) + '</h1><p class="cr-meta">' + [L(p.deptAr, p.deptEn), p.city, p.closesOn ? t('crCloses') + ': ' + day(p.closesOn) : '', t('crRef') + ' ' + p.ref].filter(String).map(esc).join(' · ') + '</p>' +
    (p.saudiOnly ? '<p class="cr-note">' + ph('info') + t('crSaudi') + '</p>' : '') +
    (L(p.summaryAr, p.summaryEn) ? '<h2>' + t('crAbout') + '</h2>' + para(L(p.summaryAr, p.summaryEn)) : '') +
    (L(p.requirementsAr, p.requirementsEn) ? '<h2>' + t('crReq') + '</h2>' + para(L(p.requirementsAr, p.requirementsEn)) : '') +
    '<h2>' + t('crApply') + '</h2><form class="form cr-form" id="crF" autocomplete="on">' +
    f('name', 'crName', '<input name="name" required maxlength="100" autocomplete="name">') +
    f('phone', 'crPhone', '<input name="phone" required inputmode="tel" dir="ltr" autocomplete="tel" placeholder="05xxxxxxxx">') +
    f('email', 'crEmail', '<input name="email" type="email" dir="ltr" autocomplete="email" maxlength="120">') +
    '<div class="two">' + f('nationality', 'crNat', '<input name="nationality" maxlength="40">') + f('yearsExperience', 'crYears', '<input name="yearsExperience" type="number" min="0" max="60" inputmode="numeric">') + '</div>' +
    '<div class="two">' + f('currentTitle', 'crCurTitle', '<input name="currentTitle" maxlength="100">') + f('currentEmployer', 'crCurEmp', '<input name="currentEmployer" maxlength="100">') + '</div>' +
    f('cvLink', 'crCv', '<input name="cvLink" type="url" dir="ltr" maxlength="200">') + f('message', 'crMsg', '<textarea name="message" rows="3" maxlength="1000"></textarea>') +
    '<div class="cr-hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>' +
    '<label class="cr-consent"><input type="checkbox" name="consent" required> <span>' + t('crConsent') + '</span></label>' +
    '<p class="err" id="crE" role="alert"></p><button class="btn btn-primary" type="submit">' + t('crSend') + '</button></form>');
  $('#crBack').onclick = list;
  var fm = $('#crF');
  fm.onsubmit = function(ev){
    ev.preventDefault(); var b = fm.querySelector('[type=submit]'), v = {};
    Array.prototype.forEach.call(fm.elements, function(x){ if (x.name) v[x.name] = x.type === 'checkbox' ? x.checked : x.value.trim(); });
    v.postId = p.id; b.disabled = true;
    api('careersApply', { application: v }).then(function(r){
      b.disabled = false;
      if (!r.ok) return $('#crE').textContent = errText(r.error);
      rerender = list;
      shell('<div class="cr-done">' + ph('check-circle', 'duotone') + '<h1>' + t('crThanks') + '</h1><p>' + t('crThanksLead') + '</p><button type="button" class="btn btn-line" id="crBack">' + t('crBack') + '</button></div>');
      $('#crBack').onclick = list;
    });
  };
}
var uid = 0;
function f(name, label, control){ var id = 'cr' + (++uid); return '<div class="field"><label for="' + id + '">' + t(label) + '</label>' + control.replace(/^<(input|textarea)/, '<$1 id="' + id + '"') + '</div>'; }

var css = document.createElement('style'); css.id = 'crcss';
css.textContent = '.cr-page{min-height:100dvh;background:var(--paper,#F7F5EF);color:var(--ink,#1C2A1F)}' +
  '.cr-top{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:10px;padding:10px 16px;padding-top:calc(10px + env(safe-area-inset-top));background:#1C2A1F;color:#F2EEE4}' +
  '.cr-top b{font-size:16px}.cr-top .sp{flex:1}.cr-top .langsw{position:static}.cr-mark{width:28px;height:32px;background:#F2EEE4;-webkit-mask-size:contain;mask-size:contain;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat}' +
  '.cr-in{color:#F2EEE4;font-size:13px;text-decoration:underline}' +
  '.cr-main{max-width:760px;margin:0 auto;padding:20px 16px 48px}.cr-main h1{font-size:26px;margin:8px 0}.cr-main h2{font-size:17px;margin:22px 0 6px}.cr-lead,.cr-meta{color:var(--ink-3,#5b6b5e)}' +
  '.cr-list{display:grid;gap:10px;margin-top:16px}.cr-card{position:relative;display:grid;gap:4px;text-align:start;padding:16px 44px 16px 16px;border-radius:14px;border:1px solid var(--line,#DDE2DE);background:var(--card,#fff);font:inherit;color:inherit;cursor:pointer}' +
  '[dir=rtl] .cr-card{padding:16px 16px 16px 44px}.cr-card b{font-size:16px}.cr-card span,.cr-card small{color:var(--ink-3,#5b6b5e)}.cr-card .ph{position:absolute;inset-inline-end:16px;top:50%;transform:translateY(-50%);color:var(--brand,#4D6D51)}' +
  '.cr-card:hover{border-color:var(--brand,#4D6D51)}.cr-empty{display:flex;gap:8px;align-items:center;padding:24px;border-radius:14px;background:var(--card,#fff);color:var(--ink-3,#5b6b5e)}' +
  '.cr-back{display:inline-flex;gap:6px;align-items:center;border:0;background:none;font:inherit;color:var(--brand,#4D6D51);cursor:pointer;padding:0}' +
  '.cr-note{display:flex;gap:6px;align-items:center;padding:10px 12px;border-radius:10px;background:var(--well,#EEF0EE)}.cr-form{margin-top:8px}' +
  '.cr-hp{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.cr-consent{display:flex;gap:8px;align-items:flex-start;margin:12px 0;font-size:13.5px}' +
  '.cr-done{text-align:center;padding:40px 8px}.cr-done .ph{font-size:56px;color:var(--brand,#4D6D51)}';
document.head.appendChild(css);

window.Careers = { render: function(){
  document.title = t('crTitle');
  shell('<p class="cr-lead">' + t('w2Loading') + '…</p>');
  api('careersList', {}, true).then(function(r){ DATA = r.ok ? r : { rows: [] }; list(); });
} };
})();
