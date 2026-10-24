// Ask HR (2026-10-23): a chat with the AI HR assistant (HelpDesk.gs api_aiAsk). Answers come from the company's policies,
// the knowledge base and the asker's own record. The conversation lives only in this browser tab (sessionStorage).
(function(){
'use strict';
Object.assign(T.ar, { aiTitle:'اسأل الموارد البشرية', aiLead:'مساعد ذكي يجيب من سياسات الشركة ومن ملفك أنت فقط. للتأكيد النهائي راجع الموارد البشرية.', aiPh:'اكتب سؤالك… (Enter للإرسال)', aiSend:'إرسال', aiNew:'محادثة جديدة', aiThinking:'يكتب…', aiTry:'جرّب أن تسأل', aiSugs:'كم رصيد إجازتي السنوية؟|ما سياسة التأخير عن الدوام؟|كيف أطلب خطاب تعريف بالراتب؟|ما الأوراق المطلوبة لإجازة الزواج؟', aiRefused:'لا أستطيع الإجابة عن هذا السؤال. يمكنك سؤال الموارد البشرية مباشرة.', aiCut:'(الإجابة طويلة وتوقفت هنا؛ اسأل «أكمل» للمزيد)', aiSources:'المصادر', aiTicket:'فتح تذكرة للموارد البشرية', aiNote:'لا تُحفظ أسئلتك في النظام. المحادثة تبقى في هذه الصفحة فقط.' });
Object.assign(T.en, { aiTitle:'Ask HR', aiLead:'An AI assistant that answers from company policies and your own file only. Confirm anything final with HR.', aiPh:'Type your question… (Enter to send)', aiSend:'Send', aiNew:'New chat', aiThinking:'Typing…', aiTry:'Try asking', aiSugs:'How much annual leave do I have?|What is the policy on arriving late?|How do I get a salary certificate?|What do I need for marriage leave?', aiRefused:'I can\'t answer that one. You can ask HR directly.', aiCut:'(The answer was long and stopped here; ask "continue" for more)', aiSources:'Sources', aiTicket:'Open a ticket for HR', aiNote:'Your questions are not stored in the system. The chat stays on this page only.' });
var KEY = 'bgAiChat', msgs = [], busy = false;
function keyFor(){ return KEY + ':' + (S.orgId || '') + ':' + (S.me ? S.me.id : ''); }
function load(){ try { msgs = JSON.parse(sessionStorage.getItem(keyFor()) || '[]') || []; } catch (e) { msgs = []; } }
function save(){ try { sessionStorage.setItem(keyFor(), JSON.stringify(msgs.slice(-20))); } catch (e) {} }
/** Plain text to safe HTML: escaped first, then **bold**, list dashes, line breaks and [REF] chips. */
function fmt(txt){
  return esc(txt).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/^[-•] (.*)$/gm, '<span class="ai-li">$1</span>')
    .replace(/\[([A-Z]{2,4}-\d{3,4}(?:-\d{5})?)\]/g, '<span class="chip ai-ref">$1</span>').replace(/\n/g, '<br>');
}
function bubble(m){
  if (m.role === 'user') return '<div class="ai-msg ai-me"><div class="ai-b">' + esc(m.text).replace(/\n/g, '<br>') + '</div></div>';
  return '<div class="ai-msg ai-bot"><span class="ai-av" aria-hidden="true">' + ph('sparkle') + '</span><div class="ai-b">' + (m.err ? '<span class="hr-bad">' + esc(m.text) + '</span>' : fmt(m.text)) +
    (m.cites && m.cites.length ? '<div class="ai-src"><small>' + t('aiSources') + ':</small> ' + m.cites.map(function(c){ return '<span class="chip">' + esc(c) + '</span>'; }).join(' ') + '</div>' : '') + '</div></div>';
}
function paint(el){
  var sugs = t('aiSugs').split('|');
  $('#aiLog', el).innerHTML = (msgs.length ? msgs.map(bubble).join('') : '<div class="ai-hello"><span class="ai-av big" aria-hidden="true">' + ph('sparkle') + '</span><p>' + t('aiTry') + '</p><div class="ai-sugs">' +
    sugs.map(function(q){ return '<button type="button" class="chip ai-sug">' + esc(q) + '</button>'; }).join('') + '</div></div>') +
    (busy ? '<div class="ai-msg ai-bot"><span class="ai-av" aria-hidden="true">' + ph('sparkle') + '</span><div class="ai-b ai-dots" aria-label="' + esc(t('aiThinking')) + '"><i></i><i></i><i></i></div></div>' : '');
  $$('.ai-sug', el).forEach(function(b){ b.onclick = function(){ ask(el, b.textContent); }; });
  var log = $('#aiLog', el); log.scrollTop = log.scrollHeight;
  $('#aiGo', el).disabled = busy;
}
function ask(el, q){
  q = String(q || '').trim(); if (!q || busy) return;
  var history = msgs.filter(function(m){ return !m.err; }).map(function(m){ return { role: m.role, text: m.text }; });
  msgs.push({ role: 'user', text: q }); busy = true; save(); paint(el);
  api('aiAsk', { question: q, history: history }).then(function(r){
    busy = false;
    if (!r.ok) msgs.push({ role: 'assistant', text: errText(r.error), err: true });
    else if (r.refused) msgs.push({ role: 'assistant', text: t('aiRefused'), err: true });
    else msgs.push({ role: 'assistant', text: r.answer + (r.truncated ? '\n' + t('aiCut') : ''), cites: r.cites || [] });
    save(); if (el.isConnected) paint(el);
  });
}
function section(body){
  load();
  body.innerHTML = '<div class="hr-h"><h2>' + ph('sparkle') + t('aiTitle') + '</h2><button type="button" class="btn btn-line btn-sm" id="aiNew">' + ph('plus') + t('aiNew') + '</button></div>' +
    '<p class="hr-hint" style="margin:-4px 0 12px">' + t('aiLead') + '</p>' +
    '<section class="ai-chat"><div id="aiLog" class="ai-log" role="log" aria-live="polite"></div>' +
    '<form id="aiF" class="ai-bar"><label class="sr-only" for="aiQ">' + t('aiPh') + '</label><textarea id="aiQ" rows="1" maxlength="1000" placeholder="' + esc(t('aiPh')) + '"></textarea>' +
    '<button class="btn btn-primary" id="aiGo" type="submit" aria-label="' + esc(t('aiSend')) + '">' + ph('paper-plane-right') + '</button></form>' +
    '<p class="hr-hint ai-foot">' + ph('lock-simple') + t('aiNote') + '</p></section>';
  var el = body, q = $('#aiQ', el);
  $('#aiF', el).onsubmit = function(ev){ ev.preventDefault(); var v = q.value; q.value = ''; q.style.height = ''; ask(el, v); };
  q.onkeydown = function(ev){ if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); $('#aiF', el).requestSubmit ? $('#aiF', el).requestSubmit() : $('#aiF', el).onsubmit(ev); } };
  q.oninput = function(){ q.style.height = ''; q.style.height = Math.min(q.scrollHeight, 160) + 'px'; };
  $('#aiNew', el).onclick = function(){ msgs = []; save(); paint(el); q.focus(); };
  paint(el);
}
var css = document.createElement('style');
css.textContent = '.ai-chat{display:flex;flex-direction:column;background:var(--card,#fff);border:1px solid var(--line);border-radius:16px;box-shadow:var(--e1);overflow:hidden;max-width:880px}' +
  '.ai-log{display:flex;flex-direction:column;gap:12px;padding:16px;min-height:360px;max-height:60vh;overflow:auto}' +
  '.ai-msg{display:flex;gap:8px;align-items:flex-end;max-width:85%}.ai-msg.ai-me{align-self:flex-end}.ai-msg.ai-bot{align-self:flex-start}' +
  '.ai-b{padding:12px 16px;border-radius:16px;font-size:14px;line-height:1.7;overflow-wrap:break-word;word-break:normal}.ai-me .ai-b{background:var(--brand);color:#fff;border-end-end-radius:4px}.ai-bot .ai-b{background:var(--line);border-end-start-radius:4px}' +
  '.ai-av{display:grid;place-items:center;flex:none;width:32px;height:32px;border-radius:50%;background:color-mix(in srgb,var(--brand) 14%,transparent);color:var(--brand)}.ai-av.big{width:56px;height:56px;font-size:24px}' +
  '.ai-li{display:block;padding-inline-start:12px;position:relative}.ai-li::before{content:"•";position:absolute;inset-inline-start:0}.ai-ref{font-size:11px}.ai-src{margin-top:8px}' +
  '.ai-hello{margin:auto;text-align:center;display:grid;justify-items:center;gap:8px;padding:24px}.ai-sugs{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}.ai-sug{cursor:pointer;border:1px solid var(--line)}.ai-sug:hover{border-color:var(--brand)}' +
  '[dir=rtl] #aiGo .ph{transform:scaleX(-1)}.ai-bar{display:flex;gap:8px;align-items:flex-end;padding:12px;border-top:1px solid var(--line)}.ai-bar textarea{flex:1;resize:none;font:inherit;font-size:16px;padding:8px 12px;border:1px solid var(--line);border-radius:12px;background:var(--card,#fff);color:inherit;max-height:160px}' +
  '.ai-foot{display:flex;gap:6px;align-items:center;margin:0;padding:0 12px 12px;font-size:12px}' +
  '.ai-dots{display:flex;gap:4px;padding:16px}.ai-dots i{width:6px;height:6px;border-radius:50%;background:var(--ink-3);opacity:.4}' +
  '@media (prefers-reduced-motion:no-preference){.ai-msg{animation:aiIn .25s ease both}.ai-dots i{animation:aiDot 1s infinite}.ai-dots i:nth-child(2){animation-delay:.15s}.ai-dots i:nth-child(3){animation-delay:.3s}}' +
  '@keyframes aiIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}@keyframes aiDot{50%{opacity:1}}' +
  '@media (max-width:600px){.ai-msg{max-width:100%}.ai-log{max-height:none;min-height:50vh}}';
document.head.appendChild(css);
window.Assistant = { section: section };
})();
