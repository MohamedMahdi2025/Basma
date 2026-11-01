// Office kiosk (2026-10-20): opened on a tablet at #kiosk/<setup code>; shows a QR that changes every 20 seconds.
// No sign-in. The setup code (from Administration > Kiosks) holds this kiosk's secret; the server can revoke it.
(function(){
'use strict';
Object.assign(T.ar, { kTitle:'سجّل حضورك', kLead:'افتح التطبيق واضغط «مسح رمز المكتب» ثم وجّه الكاميرا إلى هذا الرمز.', kSetup:'إعداد شاشة الحضور', kSetupLead:'الصق رمز الإعداد من «الإدارة والصلاحيات» ثم «شاشات الحضور».', kSave:'تشغيل', kRevoked:'هذه الشاشة أوقفت أو أعيد إعدادها. اطلب رمز إعداد جديدا من مدير النظام.', kOffline:'لا يوجد اتصال؛ الرمز يستمر بالعمل، والتحقق يتم عند التسجيل.', kRefresh:'يتغير خلال' });
Object.assign(T.en, { kTitle:'Check in here', kLead:'Open the app, tap "Scan office QR" and point the camera at this code.', kSetup:'Set up this attendance screen', kSetupLead:'Paste the setup code from Administration > Attendance screens.', kSave:'Start', kRevoked:'This screen was stopped or set up again. Ask the administrator for a new setup code.', kOffline:'Offline: the code keeps working; it is checked when people check in.', kRefresh:'Changes in' });
var QR_LIB = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js', WIN = 20000, skew = 0, cfg = null, key = null, lastW = -1, qr = null;
function store(v){ try { if (v === null) localStorage.removeItem('bgKiosk'); else localStorage.setItem('bgKiosk', v); } catch (e) {} }
function load(){ try { return localStorage.getItem('bgKiosk'); } catch (e) { return null; } }
function b64u(buf){ var s = '', b = new Uint8Array(buf); for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function lib(){ return window.QRCode ? Promise.resolve() : new Promise(function(res, rej){ var s = document.createElement('script'); s.src = QR_LIB; sri(s, QR_LIB); s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
function setupScreen(msg){
  root('<div class="k-page"><div class="k-card"><h1>' + t('kSetup') + '</h1><p>' + (msg || t('kSetupLead')) + '</p><input id="kIn" dir="ltr" style="width:100%;font-size:16px;padding:12px;border-radius:12px;border:1px solid var(--line)"><button class="btn btn-primary" id="kGo" style="margin-top:12px;width:100%">' + t('kSave') + '</button></div></div>');
  $('#kGo').onclick = function(){ var v = $('#kIn').value.trim(); if (v) start(v); };
}
function start(setup){
  var p = setup.split('.'); if (p.length < 3) return setupScreen();
  api('kioskPing', { setup: setup }, true).then(function(r){
    if (!r.ok) { store(null); return setupScreen(r.error === 'kiosk_revoked' ? t('kRevoked') : errText(r.error)); }
    store(setup); history.replaceState(null, '', location.pathname + '#kiosk' + (S.orgId ? '/' + S.orgId : ''));
    cfg = { id: p[0], secret: p.slice(2).join('.'), label: r.label, zone: r.zone, company: r.company || {} }; skew = r.serverTime - Date.now(); WIN = r.windowMs || WIN;
    crypto.subtle.importKey('raw', new TextEncoder().encode(cfg.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']).then(function(k){ key = k; return lib(); }).then(paint);
    setInterval(function(){ api('kioskPing', { setup: setup }, true).then(function(x){ if (x.ok) { skew = x.serverTime - Date.now(); $('#kNet') && ($('#kNet').textContent = ''); } else if (x.error === 'kiosk_revoked') { store(null); location.reload(); } else if ($('#kNet')) $('#kNet').textContent = t('kOffline'); }); }, 60000);
    try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(function(){}); document.addEventListener('visibilitychange', function(){ if (!document.hidden && navigator.wakeLock) navigator.wakeLock.request('screen').catch(function(){}); }); } catch (e) {}
  });
}
function paint(){
  var co = S.lang === 'en' ? cfg.company.nameEn : cfg.company.nameAr;
  root('<div class="k-page"><div class="k-card"><p class="k-co">' + esc(co || '') + '</p><h1>' + t('kTitle') + '</h1><p class="k-place">' + esc(cfg.label) + ' · ' + esc(cfg.zone) + '</p>' +
    '<div id="kQr" class="k-qr" aria-label="QR"></div><div class="k-bar"><i id="kFill"></i></div><p class="k-lead">' + t('kLead') + '</p><p class="k-clock num" id="kClock"></p><p class="k-net" id="kNet"></p></div></div>');
  qr = new QRCode($('#kQr'), { text: ' ', width: 360, height: 360, correctLevel: QRCode.CorrectLevel.M });
  lastW = -1; tick();
}
function tick(){
  var now = Date.now() + skew, w = Math.floor(now / WIN), left = WIN - (now % WIN);
  var fill = $('#kFill'); if (fill) fill.style.width = (left / WIN * 100).toFixed(1) + '%';
  var ck = $('#kClock'); if (ck) ck.textContent = new Date(now).toLocaleTimeString(S.lang === 'en' ? 'en-GB' : 'ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Riyadh' });
  if (w !== lastW && key) {
    lastW = w;
    crypto.subtle.sign('HMAC', key, new TextEncoder().encode(cfg.id + '|' + w)).then(function(sig){
      var url = location.origin + location.pathname + '#qr/' + cfg.id + '.' + w + '.' + b64u(sig).slice(0, 10);
      qr.clear(); qr.makeCode(url);
    });
  }
  setTimeout(tick, 250);
}
var css = document.createElement('style');
css.textContent = '.k-page{min-height:100dvh;display:grid;place-items:center;background:var(--pine);padding:24px}.k-card{background:#F7F5EF;color:var(--g-17221A,#17221A);border-radius:24px;padding:32px;max-width:560px;width:100%;text-align:center}' +
  '.k-card h1{font-size:32px;margin:4px 0}.k-co{margin:0;color:var(--brand);font-weight:700}.k-place{margin:0 0 18px;color:var(--g-4A5A4D,#4A5A4D)}.k-qr{display:grid;place-items:center;padding:20px;background:#fff;border-radius:24px;margin:0 auto;width:max-content}' +
  '.k-qr img,.k-qr canvas{width:min(70vw,360px)!important;height:auto!important}.k-bar{height:6px;border-radius:4px;background:var(--g-E3E8E3,#E3E8E3);margin:16px auto 0;max-width:396px;overflow:hidden}.k-bar i{display:block;height:100%;background:var(--brand);transition:width .25s linear}' +
  '.k-lead{font-size:18px;margin:16px 0 4px}.k-clock{font-size:28px;font-weight:700;margin:6px 0}.k-net{color:#A15C00;min-height:1em}';
document.head.appendChild(css);
// #kiosk/<Org ID>/<setup>: the tablet remembers its organisation with its setup code (older links without the Org ID: the home one)
window.Kiosk = { render: function(){
  var m = location.hash.match(/^#kiosk\/(\d{4,8})(?:\/(.+))?$/) || location.hash.match(/^#kiosk\/()(.+)$/);
  var s = m && m[2] ? decodeURIComponent(m[2]) : load(), org = m && m[1];
  try { if (org) localStorage.setItem('bgKioskOrg', org); else org = localStorage.getItem('bgKioskOrg'); } catch (e) {}
  if (org) S.orgId = org;
  if (s) start(s); else setupScreen();
} };
})();
