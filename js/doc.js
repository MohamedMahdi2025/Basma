// Printed documents (payslips, settlements, letters, certificates): one premium A4 template for every paper the system
// issues. Letterhead with the logo and the company profile (name, CR, VAT, address), a document-type tag with the
// reference, Gregorian and Hijri dates, a faint logo watermark, a verification QR, signature lines and a footer that
// repeats on every page. Amounts can be written in words (Arabic cheque style and English).
(function(){
'use strict';

// ---------------- amounts in words ----------------
var AR1 = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
var AR10 = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
var AR100 = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
function ar999(n){
  var h = Math.floor(n / 100), r = n % 100, parts = [];
  if (h) parts.push(AR100[h]);
  if (r) parts.push(r < 20 ? AR1[r] : (r % 10 ? AR1[r % 10] + ' و' + AR10[Math.floor(r / 10)] : AR10[Math.floor(r / 10)]));
  return parts.join(' و');
}
function arScale(n, one, two, few, many){
  if (n === 1) return one;
  if (n === 2) return two;
  var w = ar999(n);
  return w + ' ' + (n % 100 >= 3 && n % 100 <= 10 ? few : many);
}
function arWords(n){
  n = Math.floor(n); if (!n) return 'صفر';
  var parts = [], m = Math.floor(n / 1e6), k = Math.floor((n % 1e6) / 1000), u = n % 1000;
  if (m) parts.push(arScale(m, 'مليون', 'مليونان', 'ملايين', 'مليون'));
  if (k) parts.push(arScale(k, 'ألف', 'ألفان', 'آلاف', 'ألف'));
  if (u) parts.push(ar999(u));
  return parts.join(' و');
}
var EN1 = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
var EN10 = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function en999(n){
  var h = Math.floor(n / 100), r = n % 100, s = h ? EN1[h] + ' hundred' : '';
  if (r) s += (s ? ' ' : '') + (r < 20 ? EN1[r] : EN10[Math.floor(r / 10)] + (r % 10 ? '-' + EN1[r % 10] : ''));
  return s;
}
function enWords(n){
  n = Math.floor(n); if (!n) return 'zero';
  var p = [], m = Math.floor(n / 1e6), k = Math.floor((n % 1e6) / 1000), u = n % 1000;
  if (m) p.push(en999(m) + ' million'); if (k) p.push(en999(k) + ' thousand'); if (u) p.push(en999(u));
  return p.join(' ');
}
/** "فقط عشرة آلاف وستمائة وثلاثون ريال سعودي وخمس وعشرون هللة لا غير" / "Ten thousand six hundred thirty Saudi riyals and 25 halalas only". */
function words(amount, lang){
  var v = Math.round(Math.abs(Number(amount) || 0) * 100), sar = Math.floor(v / 100), hal = v % 100;
  if (lang === 'en') { var e = enWords(sar); e = e.charAt(0).toUpperCase() + e.slice(1); return e + ' Saudi riyals' + (hal ? ' and ' + hal + ' halalas' : '') + ' only'; }
  return 'فقط ' + arWords(sar) + ' ريال سعودي' + (hal ? ' و' + arWords(hal) + ' هللة' : '') + ' لا غير';
}

// ---------------- helpers ----------------
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function money(n, lang){ return acctFmt(n); }
function dates(d, lang){
  d = d instanceof Date ? d : new Date(d || Date.now());
  var g = d.toLocaleDateString((lang === 'en' ? 'en-GB' : 'ar-SA') + '-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Riyadh' });
  var h = d.toLocaleDateString((lang === 'en' ? 'en' : 'ar-SA') + '-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Riyadh' });
  return g + (lang === 'en' ? ' · ' : ' · ') + h;
}
/** A bilingual label: the document's language large, the other small beneath. */
function bi(ar, en, lang){ return lang === 'en' ? '<span class="bi"><b>' + esc(en) + '</b><i>' + esc(ar) + '</i></span>' : '<span class="bi"><b>' + esc(ar) + '</b><i>' + esc(en) + '</i></span>'; }

var CSS = '' +
'@page{size:A4;margin:0}' +
'*{box-sizing:border-box}html,body{margin:0;background:#fff}' +
'body{font-family:"IBM Plex Sans Arabic","IBM Plex Sans",Tahoma,Arial,sans-serif;color:var(--g-15201A,#15201A);font-size:10.5pt;line-height:1.55;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
'.sheet{position:relative;min-height:297mm;padding:0 14mm}.pgt{width:100%;border-collapse:collapse;border:0}.pgt>thead>tr>td,.pgt>tfoot>tr>td,.pgt>tbody>tr>td{padding:0;border:0;background:none}.pg-sp-t{height:13mm}.pg-sp-b{height:27mm}section,figure,.sign,table.kv tr,.eq,.box,.card{break-inside:avoid}h1,h2,h3{break-after:avoid}' +
'.wm{position:fixed;inset:0;display:grid;place-items:center;pointer-events:none;z-index:0}.wm img{width:120mm;opacity:.045}' +
'.sheet > *{position:relative;z-index:1}' +
'header.lh{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:16px;align-items:center;padding-bottom:12px}' +
'header.lh img{height:20mm;width:auto}' +
'.co b{display:block;font-size:14pt;font-weight:700;color:var(--g-2F5134,#2F5134);line-height:1.3}.co small{display:block;font-size:8pt;color:var(--g-5F6D63,#5F6D63);margin-top:2px}' +
'.kind{text-align:end}.kind span{display:inline-block;background:var(--g-2F5134,#2F5134);color:#fff;font-weight:600;font-size:9.5pt;padding:4px 12px;border-radius:999px}' +
'.kind small{display:block;margin-top:5px;font-size:8.5pt;color:var(--g-5F6D63,#5F6D63);direction:ltr;unicode-bidi:isolate}' +
'.rule{height:3px;background:linear-gradient(90deg,var(--g-2F5134,#2F5134),var(--brand));border-radius:2px;position:relative;margin-bottom:12px}' +
'.rule::after{content:"";position:absolute;top:0;inset-inline-start:0;width:28mm;height:3px;background:#B8913B;border-radius:2px}' +
'h1.dt{margin:6px 0 2px;font-size:19pt;line-height:1.25;font-weight:700;letter-spacing:-.01em}' +
'.issued{color:var(--g-5F6D63,#5F6D63);font-size:9pt;margin-bottom:12px}' +
'.bi{display:inline-flex;flex-direction:column;line-height:1.25}.bi b{font-weight:600}.bi i{font-style:normal;font-size:7.5pt;color:#6B786D;font-weight:400}' +
'section{margin-top:10px;break-inside:avoid}' +
'h2.sh{font-size:10.5pt;margin:0 0 6px;color:var(--g-2F5134,#2F5134);display:flex;align-items:center;gap:8px}h2.sh::before{content:"";width:4px;height:12px;border-radius:2px;background:#B8913B}' +
'.grid{display:grid;gap:0;border:1px solid #DCD6C9;border-radius:8px;overflow:hidden}' +
'.grid.c4{grid-template-columns:repeat(4,minmax(0,1fr))}.grid.c3{grid-template-columns:repeat(3,minmax(0,1fr))}' +
'.grid > div{padding:8px 12px;border-inline-start:1px solid #EEEAE0;border-top:1px solid #EEEAE0}' +
'.grid.c4 > div:nth-child(4n+1),.grid.c3 > div:nth-child(3n+1){border-inline-start:0}.grid.c4 > div:nth-child(-n+4),.grid.c3 > div:nth-child(-n+3){border-top:0}' +
'.grid dt{font-size:7.5pt;color:#6B786D;margin:0}.grid dd{margin:1px 0 0;font-weight:600;font-size:10pt}' +
'.num{font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:isolate}' +
'table.tb{width:100%;border-collapse:collapse;font-size:9.5pt}' +
'table.tb th{background:var(--g-2F5134,#2F5134);color:#fff;font-weight:600;text-align:start;padding:6px 8px}table.tb th.n,table.tb td.n{text-align:end}' +
'table.tb td{padding:6px 8px;border-bottom:1px solid #EEEAE0;vertical-align:top}table.tb tr:nth-child(even) td{background:#FAF8F3}' +
'table.tb td small{display:block;color:#6B786D;font-size:7.5pt}' +
'table.tb tfoot td{font-weight:700;background:var(--g-E7EFE6,#E7EFE6)!important;border-top:1.5px solid var(--brand);border-bottom:0}' +
'.foot{position:fixed;inset-inline:14mm;bottom:9mm;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;font-size:7.5pt;color:#6B786D;border-top:1px solid #DCD6C9;padding-top:4px;z-index:2;background:#fff}' +
'.foot .qr{width:17mm;height:17mm}.foot .qr img,.foot .qr canvas{width:17mm!important;height:17mm!important}' +
'.sign{display:grid;gap:14mm;margin-top:16mm;break-inside:avoid}.sign div{border-top:1px solid #8F8878;padding-top:4px;font-size:8.5pt;color:var(--g-4A5A4D,#4A5A4D);text-align:center}' +
'.note{font-size:8.5pt;color:var(--g-4A5A4D,#4A5A4D);background:#FBF6EA;border-inline-start:3px solid #B8913B;padding:6px 12px;border-radius:4px}' +
'.warn{background:#FDF1EF;border-color:#B42318}' +
'@media screen{body{background:#E9E6DD;padding-bottom:12mm}.sheet{width:210mm;margin:10mm auto 0;background:#fff;box-shadow:var(--e4);min-height:auto;padding-bottom:16mm}' +
  '.foot{position:relative;inset:auto;width:210mm;margin:0 auto;padding:8px 14mm 10px;box-shadow:var(--e4);border-top:1px solid #DCD6C9}}';

/**
 * Open a printable document in a new window and print it.
 * o = { lang, kind (tag text), title, ref, issued (Date), body (html), extraCss, qr (text), signatures: [labels], footnote, by }
 */
function open(o){
  var lang = o.lang === 'en' ? 'en' : 'ar', co = window.coName ? coName(lang) : '', meta = window.coMeta ? coMeta(lang) : '', logo = window.logoInk ? logoInk() : '';
  var sig = (o.signatures || []).length ? '<div class="sign" style="grid-template-columns:repeat(' + o.signatures.length + ',minmax(0,1fr))">' + o.signatures.map(function(x){ return '<div>' + x + '</div>'; }).join('') + '</div>' : '';
  var html = '<!doctype html><html lang="' + lang + '" dir="' + (lang === 'en' ? 'ltr' : 'rtl') + '"><head><meta charset="utf-8"><title>' + esc((o.ref ? o.ref + ' ' : '') + (o.title || '')) + '</title>' +
    '<link href="' + FONTS_CSS + '" rel="stylesheet">' +
    '<style>' + CSS + (o.extraCss || '') + '</style></head><body>' +
    (logo ? '<div class="wm"><img src="' + logo + '" alt=""></div>' : '') +
    '<div class="sheet"><table class="pgt" role="presentation"><thead><tr><td><div class="pg-sp-t"></div></td></tr></thead><tfoot><tr><td><div class="pg-sp-b"></div></td></tr></tfoot><tbody><tr><td><header class="lh">' + (logo ? '<img src="' + logo + '" alt="">' : '<span></span>') + '<div class="co"><b>' + esc(co) + '</b>' + (meta ? '<small>' + meta + '</small>' : '') + '</div>' +
    '<div class="kind"><span>' + esc(o.kind || '') + '</span>' + (o.ref ? '<small>' + esc(o.ref) + '</small>' : '') + '</div></header><div class="rule"></div>' +
    (o.title ? '<h1 class="dt">' + esc(o.title) + '</h1>' : '') + '<div class="issued">' + (lang === 'en' ? 'Issued ' : 'تاريخ الإصدار: ') + esc(dates(o.issued || new Date(), lang)) + '</div>' +
    o.body + sig + '</td></tr></tbody></table></div>' +
    '<div class="foot"><div class="qr" id="qr"></div><div>' + (o.footnote ? esc(o.footnote) + '<br>' : '') + esc(co) + (o.ref ? ' · <span class="num">' + esc(o.ref) + '</span>' : '') +
      (o.by ? ' · ' + (lang === 'en' ? 'Printed by ' : 'طبعه ') + esc(o.by) : '') + '</div><div class="num">' + esc(new Date().toISOString().slice(0, 10)) + '</div></div>' +
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" integrity="sha384-3zSEDfvllQohrq0PHL1fOXJuC/jSOO34H46t6UQfobFOmxE5BpjjaIJY5F2/bMnU" crossorigin="anonymous"><\/script><script>' +
    'function go(){try{if(window.QRCode&&' + JSON.stringify(!!o.qr) + ')new QRCode(document.getElementById("qr"),{text:' + JSON.stringify(o.qr || '') + ',width:160,height:160,correctLevel:QRCode.CorrectLevel.M})}catch(e){}' +
    'var f=document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve();f.then(function(){setTimeout(function(){window.print()},350)})}' +
    'if(document.readyState==="complete")go();else window.addEventListener("load",go);<\/script></body></html>';
  var w = window.open('', '_blank');
  if (!w) { if (window.toast) toast(window.t ? t('e_generic') : 'Allow pop-ups to print'); return null; }
  w.document.open(); w.document.write(window.brandVarsCss ? String(html).replace(/<head>/i, '<head><style>' + brandVarsCss() + '</style>') : html); w.document.close(); if (window.docBar) docBar(w);
  return w;
}

window.Doc = { open: open, words: words, money: money, dates: dates, bi: bi, esc: esc };
})();
