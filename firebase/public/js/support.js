/* =====================================================
 * TICKRATE - Support : tickets et lien Discord (support.js)
 * - formulaire : catégorie + message -> Cloud Function ticketSend (feedback/ dans la base, lu par les devs)
 * - « Mes tickets » : statut et réponse de l'équipe (ticketMine), y compris les !feedback envoyés en jeu
 * - bouton Discord (barre de gauche et page Support) : lien dans DISCORD_URL
 * ===================================================== */
const DISCORD_URL='https://discord.gg/KNXbGrTDj';   // lien d'invitation du serveur Discord TICKRATE (vide = boutons masqués)
const TK_CATS=['bug','idea','payment','report','account','other'];
Object.assign(I18N.fr,{nav_support:'Support',sp_title:'Support',sp_sub:'Un bug, une idée, un souci de paiement ? Écris-nous : un membre de l’équipe te répond ici.',
  sp_new:'Nouveau ticket',sp_ph:'Explique ce qui se passe (ce que tu faisais, ce que tu as vu, sur quelle page ou quelle map)…',sp_send:'Envoyer',sp_sent:'Ticket envoyé : on te répond ici.',sp_mine:'Mes tickets',sp_none:'Tu n’as encore envoyé aucun ticket.',
  sp_login:'Connecte-toi pour envoyer un ticket et suivre la réponse.',sp_ingame:'En jeu : tape !feedback <message> pour nous écrire sans quitter la partie.',sp_dc_t:'Rejoins le Discord TICKRATE',sp_dc_s:'Annonces, recherche de mates, aide rapide de la communauté.',sp_dc_b:'Rejoindre',
  tk_cat_bug:'Bug',tk_cat_idea:'Idée',tk_cat_payment:'Paiement',tk_cat_report:'Signaler un joueur',tk_cat_account:'Compte',tk_cat_other:'Autre',
  tk_st_open:'Ouvert',tk_st_answered:'Répondu',tk_st_closed:'Résolu',tk_src_site:'site',tk_src_game:'en jeu',tk_team:'Équipe TICKRATE',
  e_tk_short:'Message trop court (10 caractères minimum).',e_tk_wait:'Attends une minute avant d’envoyer un autre ticket.',e_tk_many:'Tu as déjà 5 tickets ouverts : attends notre réponse.'});
Object.assign(I18N.en,{nav_support:'Support',sp_title:'Support',sp_sub:'A bug, an idea, a payment issue? Write to us: a team member will answer you here.',
  sp_new:'New ticket',sp_ph:'Tell us what happened (what you were doing, what you saw, which page or map)…',sp_send:'Send',sp_sent:'Ticket sent: we’ll answer you here.',sp_mine:'My tickets',sp_none:'You haven’t sent any ticket yet.',
  sp_login:'Log in to send a ticket and follow the answer.',sp_ingame:'In game: type !feedback <message> to write to us without leaving the match.',sp_dc_t:'Join the TICKRATE Discord',sp_dc_s:'News, find teammates, quick help from the community.',sp_dc_b:'Join',
  tk_cat_bug:'Bug',tk_cat_idea:'Idea',tk_cat_payment:'Payment',tk_cat_report:'Report a player',tk_cat_account:'Account',tk_cat_other:'Other',
  tk_st_open:'Open',tk_st_answered:'Answered',tk_st_closed:'Resolved',tk_src_site:'site',tk_src_game:'in game',tk_team:'TICKRATE team',
  e_tk_short:'Message too short (10 characters minimum).',e_tk_wait:'Wait a minute before sending another ticket.',e_tk_many:'You already have 5 open tickets: please wait for our answer.'});
Object.assign(I18N.ru,{nav_support:'Поддержка',sp_title:'Поддержка',sp_sub:'Баг, идея, проблема с оплатой? Напиши нам - команда ответит здесь.',
  sp_new:'Новый тикет',sp_ph:'Опиши, что случилось (что ты делал, что увидел, на какой странице или карте)…',sp_send:'Отправить',sp_sent:'Тикет отправлен: ответ появится здесь.',sp_mine:'Мои тикеты',sp_none:'Ты ещё не отправлял тикетов.',
  sp_login:'Войди, чтобы отправить тикет и увидеть ответ.',sp_ingame:'В игре: введи !feedback <сообщение>, чтобы написать нам, не выходя из матча.',sp_dc_t:'Присоединяйся к Discord TICKRATE',sp_dc_s:'Новости, поиск тиммейтов, быстрая помощь сообщества.',sp_dc_b:'Войти',
  tk_cat_bug:'Баг',tk_cat_idea:'Идея',tk_cat_payment:'Оплата',tk_cat_report:'Жалоба на игрока',tk_cat_account:'Аккаунт',tk_cat_other:'Другое',
  tk_st_open:'Открыт',tk_st_answered:'Есть ответ',tk_st_closed:'Решён',tk_src_site:'сайт',tk_src_game:'в игре',tk_team:'Команда TICKRATE',
  e_tk_short:'Слишком короткое сообщение (минимум 10 символов).',e_tk_wait:'Подожди минуту перед следующим тикетом.',e_tk_many:'У тебя уже 5 открытых тикетов: дождись ответа.'});

const SP={cat:'bug',busy:false,list:null};
const spOn=()=>typeof fbLive==='function'&&fbLive()&&AUTH.mode==='firebase'&&!!FBA.uid;
const spErr=c=>{const k='e_'+c;return t(k)!==k?t(k):t('e_server_error')};
const DC_ICON=()=>($('[data-discord] svg')||{outerHTML:''}).outerHTML;

function renderSupport(){
  const on=spOn();
  $('#support').innerHTML=`<div class="sp-legal"><a href="/mentions-legales" target="_blank" rel="noopener">${t('lg_legal')}</a> · <a href="/confidentialite" target="_blank" rel="noopener">${t('lg_privacy')}</a></div><div class="sp-wrap">
    <div class="sp-hero"><div><h1>${t('sp_title')}</h1><p>${t('sp_sub')}</p></div></div>
    ${DISCORD_URL?`<div class="sp-dc">${DC_ICON()}<div><b>${t('sp_dc_t')}</b><p>${t('sp_dc_s')}</p></div><a class="btn" href="${escA(DISCORD_URL)}" target="_blank" rel="noopener noreferrer">${t('sp_dc_b')}</a></div>`:''}
    <div class="sp-grid">
      <section class="card sp-card"><h3>${t('sp_new')}</h3>
        ${on?`<div class="sp-cats">${TK_CATS.map(c=>`<button type="button" class="${SP.cat===c?'on':''}" data-tkcat="${c}">${t('tk_cat_'+c)}</button>`).join('')}</div>
        <textarea id="tkText" maxlength="1500" placeholder="${t('sp_ph')}"></textarea>
        <div class="sp-row"><small id="tkCount">0 / 1500</small><button class="btn primary" id="tkSend">${t('sp_send')}</button></div>`
        :`<p class="m-hint">${t('sp_login')}</p>`}
        <p class="m-hint" style="margin-top:12px">${t('sp_ingame')}</p>
      </section>
      <section class="card sp-card"><h3>${t('sp_mine')}</h3><div class="tk-list" id="tkList">${on?'<p class="m-hint">…</p>':`<p class="m-hint">${t('sp_login')}</p>`}</div></section>
    </div></div>`;
  if(on)loadTickets();
}
function ticketHTML(k){
  return `<div class="tk"><div class="tk-h"><span class="tk-st ${escA(k.status)}">${t('tk_st_'+k.status)}</span><span class="tk-cat">${t('tk_cat_'+k.cat)}</span><small>${new Date(k.at).toLocaleString(LOC[lang])} · ${k.source==='site'?t('tk_src_site'):t('tk_src_game')}</small></div>
    <p>${escA(k.text)}</p>${k.reply?`<div class="tk-reply"><b>${t('tk_team')}</b><p>${escA(k.reply)}</p></div>`:''}</div>`;
}
async function loadTickets(){
  const r=await fbCall('ticketMine');
  const el=$('#tkList');if(!el)return;
  if(r.error){el.innerHTML=`<p class="m-hint">${spErr(r.error)}</p>`;return}
  SP.list=r.tickets||[];
  el.innerHTML=SP.list.length?SP.list.map(ticketHTML).join(''):`<p class="m-hint">${t('sp_none')}</p>`;
}
$('#support').addEventListener('click',async e=>{
  const c=e.target.closest('[data-tkcat]');
  if(c){SP.cat=c.dataset.tkcat;$$('#support [data-tkcat]').forEach(b=>b.classList.toggle('on',b===c));return}
  if(!e.target.closest('#tkSend')||SP.busy)return;
  const txt=$('#tkText').value.trim();
  if(txt.length<10)return toast(t('e_tk_short'));
  SP.busy=true;const b=$('#tkSend');b.disabled=true;
  const r=await fbCall('ticketSend',{cat:SP.cat,text:txt,lang});
  SP.busy=false;b.disabled=false;
  if(r.error)return toast(spErr(r.error));
  $('#tkText').value='';$('#tkCount').textContent='0 / 1500';toast(t('sp_sent'));beep(988,.08);loadTickets();
});
$('#support').addEventListener('input',e=>{if(e.target.id==='tkText')$('#tkCount').textContent=`${e.target.value.length} / 1500`});
(()=>{const sv=setView;setView=function(v,k,h){const r=sv.call(this,v,k,h);if(v==='support')renderSupport();return r}})();
// changement de langue : la page Support se redessine dans la nouvelle langue
(()=>{const o=setLang;setLang=function(){const r=o.apply(this,arguments);if(!$('#support').hidden)renderSupport();return r}})();

// bouton Discord de la barre de gauche : masqué tant qu'il n'y a pas de lien
$$('[data-discord]').forEach(a=>{if(DISCORD_URL)a.href=DISCORD_URL;else a.hidden=true});
$$('[data-i18n="nav_support"]').forEach(e=>e.textContent=t('nav_support'));
