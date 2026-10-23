// Live office map (2026-10-23), after Roam's floor map: one room per office (zone) with the people checked in there,
// then remote, on a work trip, done for the day and away. Colleagues see presence only; the server adds the day status
// (late, absent, leave) only for HR, executive, a manager's own people and yourself. Refreshes every minute while open.
(function(){
'use strict';
Object.assign(T.ar, { omTitle:'خريطة المكتب', omLead:'من في المكتب الآن، ومن يعمل عن بعد أو في رحلة عمل. تتحدث كل دقيقة.', om_office:'في المكتب', om_remote:'عن بعد', om_trip:'رحلة عمل', om_done:'انصرف', om_away:'غير متواجد', omAll:'كل الأقسام', omFind:'ابحث باسم أو قسم', omMyStatus:'حالتي', omEmptyRoom:'لا أحد هنا الآن', omSince:'منذ', omLive:'مباشر', omUpdated:'آخر تحديث', omStatusTitle:'حالتك على الخريطة', omStatusLead:'جملة قصيرة يراها زملاؤك بجانب صورتك، مثل «في اجتماع» أو «أعود 2:00».', omText:'الحالة', omUntil:'تختفي عند', omClear:'مسح الحالة', omSave:'حفظ', omSaved:'تم تحديث حالتك', omYou:'أنت', omLate:'تأخر {m} دقيقة', omWorked:'عمل {h}', omDay:'حالة اليوم', omNone:'لا يوجد موظفون نشطون بعد.', omPresets:'في اجتماع|استراحة غداء|أعمل بتركيز|في زيارة عمل', omUntilNone:'بدون وقت', omHome:'مقر العمل', omNoZone:'بدون موقع' });
Object.assign(T.en, { omTitle:'Office map', omLead:'Who is in the office now, who works remotely or travels. Updates every minute.', om_office:'In the office', om_remote:'Remote', om_trip:'Work trip', om_done:'Left for the day', om_away:'Away', omAll:'All departments', omFind:'Find a name or department', omMyStatus:'My status', omEmptyRoom:'Nobody here right now', omSince:'since', omLive:'Live', omUpdated:'Updated', omStatusTitle:'Your status on the map', omStatusLead:'A short line colleagues see next to your picture, like "In a meeting" or "Back at 2:00".', omText:'Status', omUntil:'Clears at', omClear:'Clear status', omSave:'Save', omSaved:'Your status is updated', omYou:'You', omLate:'{m} min late', omWorked:'worked {h}', omDay:'Today', omNone:'No active employees yet.', omPresets:'In a meeting|Lunch break|Focus time|Visiting a client', omUntilNone:'No end time', omHome:'Workplace', omNoZone:'No location' });
var ICON = { office: 'buildings', remote: 'house-line', trip: 'airplane-tilt', done: 'sign-out', away: 'moon' };
var ORDER = ['office', 'remote', 'trip', 'done', 'away'];
var st = { dept: '', q: '', only: '', data: null, timer: null };
function nm(p){ return S.lang === 'en' && p.nameEn ? p.nameEn : p.name; }
function mins(m){ m = Math.round(m || 0); return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); }
function avatar(p, i){
  return '<button type="button" class="om-av om-' + p.presence + (p.me ? ' om-me' : '') + '" data-p="' + esc(p.id) + '" style="--i:' + Math.min(i, 24) + '" aria-label="' + esc(nm(p) + ' · ' + t('om_' + p.presence)) + '" title="' + esc(nm(p)) + '">' +
    '<span class="om-ini">' + esc(initials(nm(p))) + '</span><i class="om-dot" aria-hidden="true"></i>' + (p.note ? '<i class="om-note" aria-hidden="true">' + ph('chat-circle-dots') + '</i>' : '') +
    '<span class="om-nm">' + esc(p.me ? t('omYou') : nm(p).split(/\s+/)[0]) + '</span></button>';
}
function room(key, title, icon, list, wide){
  return '<section class="om-room om-r-' + key + (wide ? ' om-wide' : '') + '" aria-label="' + esc(title) + '"><header>' + ph(icon) + '<b>' + esc(title) + '</b><span class="om-n num">' + list.length + '</span></header>' +
    (list.length ? '<div class="om-avs">' + list.map(avatar).join('') + '</div>' : '<p class="om-empty">' + t('omEmptyRoom') + '</p>') + '</section>';
}
function visible(d){
  var q = st.q.trim().toLowerCase();
  return d.people.filter(function(p){
    if (st.dept && p.department !== st.dept) return false;
    if (q && (p.name + ' ' + p.nameEn + ' ' + p.department + ' ' + p.title).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
}
function paint(el){
  var d = st.data, list = visible(d), by = {};
  ORDER.forEach(function(k){ by[k] = []; });
  list.forEach(function(p){ by[p.presence].push(p); });
  var depts = d.people.map(function(p){ return p.department; }).filter(function(x, i, a){ return x && a.indexOf(x) === i; }).sort();
  var pills = ORDER.map(function(k){ return '<button type="button" class="om-pill om-' + k + (st.only === k ? ' on' : '') + '" data-only="' + k + '" aria-pressed="' + (st.only === k) + '"><i class="om-dot" aria-hidden="true"></i>' + t('om_' + k) + ' <b class="num">' + by[k].length + '</b></button>'; }).join('');
  var rooms = '';
  if (!st.only || st.only === 'office') {
    d.zones.forEach(function(z){ rooms += room('office', z.name, 'map-pin-area', by.office.filter(function(p){ return p.zone === z.id; })); });
    var stray = by.office.filter(function(p){ return !d.zones.some(function(z){ return z.id === p.zone; }); });
    if (stray.length) rooms += room('office', t('omNoZone'), 'map-pin', stray);
  }
  ['remote', 'trip', 'done', 'away'].forEach(function(k){ if (!st.only || st.only === k) rooms += room(k, t('om_' + k), ICON[k], by[k], k === 'away'); });
  el.innerHTML = '<div class="om-bar"><div class="om-pills" role="group" aria-label="' + esc(t('omTitle')) + '">' + pills + '</div>' +
    '<div class="om-tools"><select id="omDept" aria-label="' + esc(t('omAll')) + '"><option value="">' + t('omAll') + '</option>' + depts.map(function(x){ return '<option' + (x === st.dept ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>' +
    '<input id="omQ" type="search" placeholder="' + esc(t('omFind')) + '" aria-label="' + esc(t('omFind')) + '" value="' + esc(st.q) + '">' +
    '<button type="button" class="btn btn-line btn-sm" id="omMine">' + ph('chat-circle-dots') + t('omMyStatus') + '</button></div></div>' +
    '<p class="om-live"><i aria-hidden="true"></i>' + t('omLive') + ' · ' + t('omUpdated') + ' <bdi class="num">' + fmtTime(d.serverTime) + '</bdi></p>' +
    (d.people.length ? '<div class="om-floor">' + rooms + '</div>' : '<p class="hr-hint">' + t('omNone') + '</p>');
  $('#omDept', el).onchange = function(){ st.dept = this.value; paint(el); };
  var qi = $('#omQ', el); qi.oninput = function(){ st.q = this.value; var pos = this.selectionStart; paint(el); var n = $('#omQ', el); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} };
  $('#omMine', el).onclick = function(){ myStatus(el); };
  el.querySelectorAll('[data-only]').forEach(function(b){ b.onclick = function(){ st.only = st.only === b.dataset.only ? '' : b.dataset.only; paint(el); }; });
  el.querySelectorAll('[data-p]').forEach(function(b){ b.onclick = function(){ card(d.people.filter(function(p){ return p.id === b.dataset.p; })[0], d); }; });
}
function card(p, d){
  if (!p) return;
  var z = d.zones.filter(function(x){ return x.id === p.zone; })[0], where = t('om_' + p.presence) + (z ? ' · ' + esc(z.name) : '');
  var html = '<h3>' + esc(nm(p)) + '</h3><p class="hr-hint">' + esc([p.title, p.department].filter(String).join(' · ')) + '</p>' +
    '<div class="om-card"><span class="om-av om-' + p.presence + ' om-big"><span class="om-ini">' + esc(initials(nm(p))) + '</span><i class="om-dot"></i></span>' +
    '<div><b>' + where + '</b>' + (p.since ? '<div class="hr-hint">' + t('omSince') + ' <bdi class="num">' + fmtTime(p.since) + '</bdi></div>' : '') + '</div></div>' +
    (p.note ? '<blockquote class="om-q">' + ph('chat-circle-dots') + ' ' + esc(p.note.text) + (p.note.until ? ' <small class="hr-hint">' + t('omUntil') + ' <bdi class="num">' + fmtTime(p.note.until) + '</bdi></small>' : '') + '</blockquote>' : '') +
    (p.day ? '<p class="hr-hint" style="margin-top:12px"><b>' + t('omDay') + ':</b> ' + esc(t('st_' + p.day.status) !== 'st_' + p.day.status ? t('st_' + p.day.status) : p.day.status) +
      (p.day.lateMin ? ' · ' + t('omLate').replace('{m}', p.day.lateMin) : '') + (p.day.workedMin ? ' · ' + t('omWorked').replace('{h}', '<bdi class="num">' + mins(p.day.workedMin) + '</bdi>') : '') + '</p>' : '');
  drawer(html);
}
function myStatus(el){
  var mine = (st.data.people.filter(function(p){ return p.me; })[0] || {}).note || {};
  var presets = t('omPresets').split('|');
  var d = drawer('<h3>' + t('omStatusTitle') + '</h3><p class="hr-hint">' + t('omStatusLead') + '</p>' +
    '<div class="om-presets">' + presets.map(function(x){ return '<button type="button" class="chip" data-pre="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div>' +
    '<div class="field"><label for="omT">' + t('omText') + '</label><input id="omT" maxlength="60" value="' + esc(mine.text || '') + '"></div>' +
    '<div class="field"><label for="omU">' + t('omUntil') + '</label><select id="omU"><option value="">' + t('omUntilNone') + '</option>' + [30, 60, 120, 240].map(function(m){ return '<option value="' + m + '">' + fmtTime(new Date(Date.now() + m * 6e4).toISOString()) + '</option>'; }).join('') + '</select></div>' +
    '<p class="hr-bad" id="omErr" role="alert"></p><div class="btnrow"><button type="button" class="btn btn-primary" id="omSave">' + t('omSave') + '</button>' + (mine.text ? '<button type="button" class="btn btn-line" id="omClr">' + t('omClear') + '</button>' : '') + '</div>');
  d.querySelectorAll('[data-pre]').forEach(function(b){ b.onclick = function(){ $('#omT', d).value = b.dataset.pre; }; });
  function send(text){
    var m = Number($('#omU', d).value) || 0;
    api('presenceSet', { text: text, until: text && m ? new Date(Date.now() + m * 6e4).toISOString() : '' }).then(function(r){
      if (!r.ok) { $('#omErr', d).textContent = errText(r.error); return; }
      toast(t('omSaved')); d.remove(); delete READ_CACHE['officeMap:{}']; load(el, true);
    });
  }
  $('#omSave', d).onclick = function(){ send($('#omT', d).value.trim()); };
  if ($('#omClr', d)) $('#omClr', d).onclick = function(){ send(''); };
}
function load(el, quiet){
  apiFresh('officeMap', {}, function(r){
    if (!el.isConnected) return;
    if (!r.ok) { el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>'; return; }
    st.data = r; paint(el);
  }, quiet);
}
function section(body){
  body.innerHTML = '<div class="hr-h"><h2>' + t('omTitle') + '</h2></div><p class="hr-hint" style="margin:-4px 0 12px">' + t('omLead') + '</p><div id="omB"><p class="hr-hint">…</p></div>';
  var el = $('#omB', body);
  load(el);
  clearInterval(st.timer);
  st.timer = setInterval(function(){
    if (!el.isConnected) { clearInterval(st.timer); return; }
    if (!document.hidden && !$('.dp-page')) { delete READ_CACHE['officeMap:{}']; load(el, true); }
  }, 60000);
}
var css = document.createElement('style');
css.textContent =
  '.om-bar{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-bottom:8px}.om-pills{display:flex;flex-wrap:wrap;gap:8px}' +
  '.om-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--card,#fff);color:inherit;border-radius:999px;padding:6px 12px;font-size:13px;cursor:pointer}' +
  '.om-pill.on{border-color:var(--om-c);box-shadow:inset 0 0 0 1px var(--om-c)}.om-pill b{font-size:14px}.om-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center}' +
  '.om-tools select,.om-tools input{font:inherit;font-size:14px;padding:6px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card,#fff);color:inherit;min-width:0}' +
  '.om-live{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-3);margin:4px 0 12px}.om-live i{width:8px;height:8px;border-radius:50%;background:var(--brand)}' +
  '.om-office{--om-c:var(--brand)}.om-remote{--om-c:var(--info)}.om-trip{--om-c:var(--amber)}.om-done{--om-c:var(--ink-3)}.om-away{--om-c:var(--line)}' +
  '.om-floor{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}' +
  '.om-room{background:var(--card,#fff);border:1px solid var(--line);border-radius:16px;padding:12px 16px 16px;box-shadow:var(--e1);min-height:132px}' +
  '.om-r-office{border-top:4px solid var(--brand)}.om-r-remote{border-top:4px solid var(--info)}.om-r-trip{border-top:4px solid var(--amber)}.om-r-done,.om-r-away{border-top:4px solid var(--line);background:transparent;box-shadow:none}' +
  '.om-wide{grid-column:1/-1}.om-room header{display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:12px}.om-room header b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
  '.om-n{font-size:12px;border-radius:999px;padding:2px 8px;background:var(--line)}.om-empty{font-size:13px;color:var(--ink-3);border:1px dashed var(--line);border-radius:12px;padding:16px;text-align:center;margin:0}' +
  '.om-avs{display:flex;flex-wrap:wrap;gap:12px 8px}' +
  '.om-av{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;width:56px;background:none;border:0;padding:0;color:inherit;cursor:pointer;font:inherit}' +
  '.om-ini{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;font-size:14px;font-weight:700;color:#fff;background:var(--om-c);box-shadow:var(--e1)}' +
  '.om-done .om-ini,.om-away .om-ini{color:var(--ink-2);background:var(--line);box-shadow:none}' +
  '.om-me .om-ini{outline:2px solid var(--om-c);outline-offset:2px}.om-av:focus-visible .om-ini{outline:3px solid var(--brand);outline-offset:2px}' +
  '.om-dot{position:absolute;top:32px;inset-inline-end:6px;width:12px;height:12px;border-radius:50%;background:var(--om-c);border:2px solid var(--card,#fff)}' +
  '.om-pill .om-dot{position:static;border:0;width:8px;height:8px}' +
  '.om-note{position:absolute;top:-4px;inset-inline-start:2px;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--card,#fff);box-shadow:var(--e1);font-size:12px;font-style:normal}' +
  '.om-nm{font-size:12px;max-width:56px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
  '.om-card{display:flex;gap:16px;align-items:center;margin:8px 0}.om-big{width:auto;cursor:default}.om-big .om-ini{width:64px;height:64px;font-size:20px}.om-big .om-dot{top:48px}' +
  '.om-q{margin:12px 0 0;padding:8px 12px;border-inline-start:4px solid var(--brand);background:var(--line);border-radius:8px}.om-presets{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}.om-presets .chip{cursor:pointer;border:0}' +
  '@media (prefers-reduced-motion:no-preference){.om-av{animation:omIn .32s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i) * 18ms)}.om-office .om-dot{animation:omPulse 2.4s ease-out infinite}.om-live i{animation:omPulse 2.4s ease-out infinite}}' +
  '@keyframes omIn{from{opacity:0;transform:translateY(4px) scale(.94)}to{opacity:1;transform:none}}' +
  '@keyframes omPulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--brand) 45%,transparent)}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}' +
  '@media (max-width:600px){.om-floor{grid-template-columns:1fr}.om-tools{width:100%}.om-tools input{flex:1}}';
document.head.appendChild(css);
window.OfficeMap = { section: section };
})();
