// Excel exports for every report and every table (ExcelJS 4.4.0 from cdnjs, loaded on first export only).
// One builder, one look: a titled data sheet with a brand header row that repeats on every printed page, frozen panes,
// filters, typed number formats (zeros as "-", negatives in red brackets), totals that follow the filter (SUBTOTAL),
// status colours, A4 print setup with page numbers, and an "About" sheet with the logo, references and data checks.
// Right to left for Arabic. Fonts: Arial throughout (the xlsx skill's professional-font rule).
(function(){
'use strict';
var LIB = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js', libP = null;
function lib(){
  if (window.ExcelJS) return Promise.resolve();
  if (libP) return libP;
  var id = window.Progress ? Progress.start('script:exceljs') : 0;
  libP = new Promise(function(res, rej){
    var s = document.createElement('script'); s.src = LIB;
    s.onload = function(){ if (id) Progress.done(id); res(); };
    s.onerror = function(){ if (id) Progress.done(id, false); libP = null; s.remove(); rej(new Error('network')); };
    document.head.appendChild(s);
  });
  return libP;
}

var C = { brand: 'FF4D6D51', brandDark: 'FF2F4A33', tint: 'FFE7EFE6', well: 'FFF7F5EF', line: 'FFE4DFD3', ink: 'FF17221A', mute: 'FF5F6D63', white: 'FFFFFFFF' };
var TONE = { ok: ['FFE6F2EA', 'FF1E6B3F'], warn: ['FFFBF1DC', 'FF8A5A00'], bad: ['FFFDECEA', 'FFB42318'], info: ['FFE8F1FC', 'FF1F5FAE'], none: ['FFF1EFE9', 'FF5F6D63'] };
var FMT = {
  money: '#,##0.00;[Red](#,##0.00);"-"', int: '#,##0;[Red](#,##0);"-"', num: '#,##0.00;[Red](#,##0.00);"-"', one: '#,##0.0;[Red](#,##0.0);"-"',
  pct: '0.0%;[Red]-0.0%;"-"', date: 'yyyy-mm-dd', datetime: 'yyyy-mm-dd hh:mm', time: 'hh:mm'
};
var NUMERIC = { money: 1, int: 1, num: 1, one: 1, pct: 1, hours: 1, days: 1, min: 1 };
function fmtOf(type){ return type === 'hours' ? FMT.one : type === 'days' ? FMT.num : type === 'min' ? FMT.int : FMT[type]; }
var font = function(o){ return Object.assign({ name: 'Arial', size: 10.5, color: { argb: C.ink } }, o || {}); };
var fill = function(argb){ return { type: 'pattern', pattern: 'solid', fgColor: { argb: argb } }; };
var hair = { style: 'hair', color: { argb: C.line } }, thin = function(c){ return { style: 'thin', color: { argb: c || C.line } }; };

/** The cell value Excel should hold: real numbers, real dates (Riyadh time for timestamps), percentages as fractions. */
function value(col, v){
  if (v == null || v === '') return null;
  var t = col.type;
  if (NUMERIC[t]) {
    var n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.\-]/g, ''));
    if (!isFinite(n)) return String(v);
    return t === 'pct' ? (col.pctScale === 1 ? n : n / 100) : n;
  }
  if (t === 'date') { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v)); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : String(v); }
  if (t === 'datetime') { var ms = Date.parse(v); return isFinite(ms) ? new Date(ms + 3 * 3600000) : String(v); }
  return col.text ? col.text(v) : String(v);
}
function textLen(s){ s = String(s == null ? '' : s); return Math.ceil(s.length * (/[؀-ۿ]/.test(s) ? 1.15 : 1)); }
function safeName(s, used){
  var n = String(s || 'Sheet').replace(/[\[\]:*?\/\\]/g, ' ').trim().slice(0, 31) || 'Sheet', k = n, i = 2;
  while (used[k.toLowerCase()]) { k = n.slice(0, 28) + ' ' + i++; }
  used[k.toLowerCase()] = 1; return k;
}
function hf(s){ return String(s == null ? '' : s).replace(/&/g, '&&'); }

/** One data sheet: title block, header, rows, totals, formats, filters, frozen panes, print setup. */
function dataSheet(wb, sh, o, used){
  var ar = o.lang !== 'en', cols = sh.columns, n = cols.length;
  var ws = wb.addWorksheet(safeName(sh.name || o.title, used), {
    views: [{ rightToLeft: ar, showGridLines: false, state: 'frozen', xSplit: n > 3 ? 1 : 0, ySplit: 5 }],
    properties: { defaultRowHeight: 20 }
  });
  var last = String.fromCharCode(64 + Math.min(n, 26));
  // title block
  ws.mergeCells('A1:' + last + '1'); ws.mergeCells('A2:' + last + '2'); ws.mergeCells('A3:' + last + '3');
  var t1 = ws.getCell('A1'); t1.value = sh.title || o.title; t1.font = font({ size: 16, bold: true, color: { argb: C.brandDark } }); t1.alignment = { vertical: 'middle' };
  ws.getRow(1).height = 30;
  var t2 = ws.getCell('A2'); t2.value = [o.company, o.ref, o.when].filter(Boolean).join('  ·  '); t2.font = font({ size: 9.5, color: { argb: C.mute } });
  var t3 = ws.getCell('A3'); t3.value = (o.filters || []).map(function(f){ return f[0] + ': ' + f[1]; }).join('  ·  ') || o.subtitle || ''; t3.font = font({ size: 9.5, color: { argb: C.mute } });
  ws.getRow(4).height = 6;
  // header
  var hr = ws.getRow(5); hr.height = 34;
  cols.forEach(function(c, i){
    var cell = hr.getCell(i + 1); cell.value = c.label;
    cell.font = font({ bold: true, color: { argb: C.white }, size: 10.5 }); cell.fill = fill(C.brand);
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { bottom: { style: 'medium', color: { argb: C.brandDark } }, left: thin('FF6F8B73'), right: thin('FF6F8B73') };
  });
  // body
  var rows = sh.rows || [], first = 6;
  rows.forEach(function(r, ri){
    var row = ws.getRow(first + ri);
    cols.forEach(function(c, i){
      var cell = row.getCell(i + 1), raw = r[c.key], v = value(c, raw);
      cell.value = v;
      if (fmtOf(c.type) && v !== null && typeof v !== 'string') cell.numFmt = fmtOf(c.type);
      cell.font = font();
      cell.alignment = { vertical: 'middle', wrapText: c.wrap || false, horizontal: c.center ? 'center' : undefined };
      var tone = c.tone ? c.tone(raw, r) : null;
      if (tone && TONE[tone]) { cell.fill = fill(TONE[tone][0]); cell.font = font({ bold: true, color: { argb: TONE[tone][1] } }); if (!c.wrap) cell.alignment = { vertical: 'middle', horizontal: 'center' }; }
      else if (ri % 2) cell.fill = fill(C.well);
      cell.border = { bottom: hair };
    });
  });
  var lastRow = first + rows.length - 1;
  // totals that follow the filter: SUBTOTAL(109) sums only the visible rows; 101 averages
  if (rows.length && cols.some(function(c){ return c.sum || c.avg; })) {
    var tr = ws.getRow(lastRow + 1); tr.height = 24;
    cols.forEach(function(c, i){
      var cell = tr.getCell(i + 1), L = ws.getColumn(i + 1).letter;
      cell.fill = fill(C.tint); cell.font = font({ bold: true, color: { argb: C.brandDark } });
      cell.border = { top: { style: 'thin', color: { argb: C.brand } }, bottom: { style: 'double', color: { argb: C.brand } } };
      if (i === 0) { cell.value = o.lang === 'en' ? 'Total (visible rows)' : 'الإجمالي (الصفوف الظاهرة)'; return; }
      if (!(c.sum || c.avg)) return;
      var vals = rows.map(function(r){ var x = value(c, r[c.key]); return typeof x === 'number' ? x : 0; });
      var res = c.avg ? vals.reduce(function(a, b){ return a + b; }, 0) / (vals.length || 1) : vals.reduce(function(a, b){ return a + b; }, 0);
      cell.value = { formula: 'SUBTOTAL(' + (c.avg ? 101 : 109) + ',' + L + first + ':' + L + lastRow + ')', result: Math.round(res * 10000) / 10000 };
      if (fmtOf(c.type)) cell.numFmt = fmtOf(c.type);
    });
  }
  if (!rows.length) { ws.mergeCells('A6:' + last + '6'); var e = ws.getCell('A6'); e.value = o.lang === 'en' ? 'No records match.' : 'لا توجد سجلات مطابقة.'; e.font = font({ italic: true, color: { argb: C.mute } }); }
  // widths from the content (first 300 rows)
  cols.forEach(function(c, i){
    var w = c.width || Math.max(textLen(c.label) * 0.9, 8);
    if (!c.width) rows.slice(0, 300).forEach(function(r){ var x = r[c.key]; w = Math.max(w, c.type === 'date' ? 12 : c.type === 'datetime' ? 17 : NUMERIC[c.type] ? Math.min(16, textLen(x) + 4) : textLen(c.text ? c.text(x) : x) + 2); });
    ws.getColumn(i + 1).width = Math.min(c.wrap ? 60 : 46, Math.max(8, Math.round(w)));
  });
  if (rows.length) ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: n } };
  // print: A4, fit to one page wide, header row on every page, page x of y
  ws.pageSetup = { paperSize: 9, orientation: n > 6 ? 'landscape' : 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 }, printTitlesRow: '5:5', horizontalCentered: true };
  ws.headerFooter = { oddHeader: '&L&8' + hf(o.company) + '&R&8' + hf(sh.title || o.title),
    oddFooter: '&L&8' + hf(o.ref || '') + '&C&8' + (o.lang === 'en' ? 'Page &P of &N' : 'صفحة &P من &N') + '&R&8&D &T' };
  return ws;
}

/** The "About" sheet: logo, what this file is, who made it, filters and the data checks. */
function aboutSheet(wb, o, used){
  var en = o.lang === 'en';
  var ws = wb.addWorksheet(safeName(en ? 'About' : 'عن الملف', used), { views: [{ rightToLeft: !en, showGridLines: false }] });
  ws.getColumn(1).width = 28; ws.getColumn(2).width = 78;
  var r = 1;
  if (o.logo) { try { var id = wb.addImage({ base64: o.logo, extension: 'png' }); ws.addImage(id, { tl: { col: en ? 0 : 0.2, row: 0.2 }, ext: { width: 92, height: 80 } }); } catch (e) {} r = 6; }
  ws.getRow(1).height = 22;
  var put = function(a, b, st){ var row = ws.getRow(r++); row.getCell(1).value = a; row.getCell(2).value = b == null ? '' : b;
    row.getCell(1).font = font({ color: { argb: C.mute }, size: 10 }); row.getCell(2).font = font(st || {}); row.getCell(2).alignment = { wrapText: true, vertical: 'top' }; return row; };
  var h = ws.getRow(r++); ws.mergeCells('A' + h.number + ':B' + h.number); h.getCell(1).value = o.company; h.getCell(1).font = font({ size: 13, bold: true, color: { argb: C.brand } });
  var t = ws.getRow(r++); ws.mergeCells('A' + t.number + ':B' + t.number); t.getCell(1).value = o.title; t.getCell(1).font = font({ size: 17, bold: true }); t.height = 26;
  if (o.description) { var d = ws.getRow(r++); ws.mergeCells('A' + d.number + ':B' + d.number); d.getCell(1).value = o.description; d.getCell(1).font = font({ color: { argb: C.mute } }); d.getCell(1).alignment = { wrapText: true }; d.height = 32; }
  r++;
  (o.meta || []).forEach(function(m){ put(m[0], m[1], m[2] ? { name: 'Consolas', size: 9 } : { bold: true }); });
  if ((o.filters || []).length) { r++; put(en ? 'Filters' : 'المرشحات', '', { bold: true }); o.filters.forEach(function(f){ put(f[0], String(f[1])); }); }
  if (o.checks) {
    r++; put(en ? 'Data checks' : 'فحص البيانات', '', { bold: true });
    (o.checks.length ? o.checks : [{ level: 'ok', text: en ? 'No issues found.' : 'لا ملاحظات على البيانات.' }]).forEach(function(c){
      var tone = c.level === 'error' ? 'bad' : c.level === 'warn' ? 'warn' : c.level === 'info' ? 'info' : 'ok';
      var row = put(en ? { error: 'Error', warn: 'Warning', info: 'Note', ok: 'OK' }[tone === 'bad' ? 'error' : tone] || '' : { bad: 'خطأ', warn: 'تنبيه', info: 'ملاحظة', ok: 'سليم' }[tone], c.text);
      row.getCell(1).fill = fill(TONE[tone][0]); row.getCell(1).font = font({ bold: true, color: { argb: TONE[tone][1] } });
    });
  }
  if (o.footnote) { r++; var f2 = ws.getRow(r++); ws.mergeCells('A' + f2.number + ':B' + f2.number); f2.getCell(1).value = o.footnote; f2.getCell(1).font = font({ size: 9, italic: true, color: { argb: C.mute } }); f2.getCell(1).alignment = { wrapText: true }; f2.height = 30; }
  ws.pageSetup = { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  return ws;
}

/**
 * Build and download one workbook.
 * o = { fileName, title, description, lang, company, ref, when, logo (png data URL), meta: [[label, value, mono?]],
 *       filters: [[label, value]], checks: [{level, text}], footnote, sheets: [{ name, title, columns: [{key, label, type, sum, avg, tone, text, wrap, width}], rows }] }
 */
function download(o){
  return lib().then(function(){
    var X = window.ExcelJS, wb = new X.Workbook(), used = {};
    wb.creator = o.by || o.company || ''; wb.lastModifiedBy = wb.creator; wb.created = new Date(); wb.modified = new Date();
    wb.title = o.title || ''; wb.company = o.company || ''; wb.subject = o.ref || ''; wb.description = o.description || '';
    o.sheets.forEach(function(sh){ dataSheet(wb, sh, o, used); });
    aboutSheet(wb, o, used);
    wb.views = [{ x: 0, y: 0, width: 20000, height: 12000, firstSheet: 0, activeTab: 0 }];
    return wb.xlsx.writeBuffer();
  }).then(function(buf){
    var blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = String(o.fileName || 'export').replace(/[\\\/:*?"<>|]+/g, '-') + '.xlsx';
    document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  });
}

// ---------------- any screen: read its tables and lists into sheets ----------------
var NUMRE = /^[-−]?[\d,]+(\.\d+)?$/;
function cleanNum(s){ return String(s).replace(/[−]/g, '-').replace(/,/g, '').replace(/\s*(ر\.س|SAR|ريال)\s*/g, '').trim(); }
/** Guess each column's type from its cells: integers, decimals, percentages, money, dates; otherwise text. */
function guessType(vals){
  var v = vals.filter(function(x){ return x !== ''; }); if (!v.length) return 'text';
  if (v.every(function(x){ return /^\d{4}-\d{2}-\d{2}$/.test(x); })) return 'date';
  if (v.every(function(x){ return /%$/.test(x) && NUMRE.test(cleanNum(x.replace('%', ''))); })) return 'pct';
  if (v.every(function(x){ return /(ر\.س|SAR|ريال)/.test(x) && NUMRE.test(cleanNum(x)); })) return 'money';
  if (v.every(function(x){ return NUMRE.test(cleanNum(x)); })) return v.some(function(x){ return /\.\d/.test(x); }) ? 'num' : 'int';
  return 'text';
}
function headingFor(el, i, en, fallback){
  var box = el.closest('.db-card,.mf-card,.hm-card,.card,.v2-card,section,.panel');
  var h = box && box.querySelector('h1,h2,h3,h4'), s = '';
  if (h) { var c = h.cloneNode(true); Array.prototype.forEach.call(c.querySelectorAll('button,a,.badge,.chip,small'), function(x){ x.remove(); }); s = c.textContent.replace(/\s+/g, ' ').trim(); }
  return s || fallback || (en ? 'Table ' : 'جدول ') + (i + 1);
}
/** Employee numbers, IDs, years and codes are labels, not quantities: keep them as text. */
var IDHEAD = /رقم|الهوية|الإقامة|السنة|الكود|المرجع|\bno\.?\b|number|\bid\b|iqama|year|code|ref/i;
function fromTable(tb, i, en, fallback){
  var heads = Array.prototype.map.call(tb.querySelectorAll('thead th'), function(th){ return th.textContent.replace(/\s+/g, ' ').trim(); });
  var trs = Array.prototype.slice.call(tb.querySelectorAll('tbody tr'));
  if (!heads.length && trs.length) { heads = Array.prototype.map.call(trs[0].children, function(c, k){ return (en ? 'Column ' : 'عمود ') + (k + 1); }); }
  var raw = trs.map(function(tr){ return Array.prototype.map.call(tr.children, function(td){ return td.textContent.replace(/\s+/g, ' ').trim(); }); });
  var cols = heads.map(function(h, k){
    var vals = raw.map(function(r){ return r[k] || ''; }), type = guessType(vals);
    if ((type === 'int' || type === 'num') && IDHEAD.test(h)) type = 'text';
    return { key: 'c' + k, label: h || (k === 0 ? (en ? 'Item' : 'البند') : ' '), type: type, sum: type === 'money' };
  });
  var rows = raw.map(function(r){ var o = {}; cols.forEach(function(c, k){ var x = r[k] || ''; o[c.key] = c.type === 'text' || c.type === 'date' ? x : cleanNum(x.replace('%', '')); }); return o; });
  var name = headingFor(tb, i, en, fallback);
  return { name: name, title: name, columns: cols, rows: rows };
}
function fromList(list, i, en, fallback){
  var rows = Array.prototype.map.call(list.querySelectorAll(':scope > .row'), function(row){
    var b = row.querySelector('.main b, b'), sm = row.querySelector('.main small, small'), end = row.querySelector('.end, .chip');
    return { a: b ? b.textContent.trim() : row.textContent.trim().slice(0, 80), b: sm ? sm.textContent.replace(/\s+/g, ' ').trim() : '', c: end ? end.textContent.replace(/\s+/g, ' ').trim() : '' };
  }).filter(function(r){ return r.a; });
  var cols = [{ key: 'a', label: en ? 'Name' : 'الاسم', type: 'text' }, { key: 'b', label: en ? 'Details' : 'التفاصيل', type: 'text', wrap: true }, { key: 'c', label: en ? 'Status' : 'الحالة', type: 'text' }];
  var name = headingFor(list, i, en, fallback);
  return { name: name, title: name, columns: cols, rows: rows };
}
/**
 * Every table and list inside root becomes a sheet. Visible tables come first (the main one is named after the page);
 * the hidden "table view" of each chart follows; a list counts only when it is visible (phones hide duplicate lists).
 */
function sheetsFrom(root, en, title){
  var vis = [], hid = [], lists = [];
  Array.prototype.forEach.call(root.querySelectorAll('table'), function(tb){ if (tb.closest('svg')) return; (tb.offsetParent ? vis : hid).push(tb); });
  Array.prototype.forEach.call(root.querySelectorAll('.list'), function(l){ if (l.offsetParent) lists.push(l); });
  var out = [];
  vis.forEach(function(tb, i){ var s = fromTable(tb, i, en, i === 0 ? title : null); if (s.rows.length) out.push(s); });
  lists.forEach(function(l, i){ var s = fromList(l, i, en, !vis.length && i === 0 ? title : null); if (s.rows.length) out.push(s); });
  hid.forEach(function(tb, i){ var s = fromTable(tb, vis.length + i, en); if (s.rows.length) out.push(s); });
  return out;
}

window.XL = { download: download, sheetsFrom: sheetsFrom, lib: lib, TONE: TONE };
})();
