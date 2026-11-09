const INF_RULES={minFollowers:1000,minAvgViews:200,minAccountDays:7};
const INF_PLATFORMS={
  twitch:{n:'Twitch',ph:'https://twitch.tv/pseudo',re:/^https:\/\/(www\.)?twitch\.tv\/[A-Za-z0-9_]{3,25}\/?$/},
  youtube:{n:'YouTube',ph:'https://youtube.com/@chaine',re:/^https:\/\/(www\.)?youtube\.com\/(@[\w.-]{3,30}|channel\/[\w-]{10,40}|c\/[\w.-]{2,40})\/?$/},
  tiktok:{n:'TikTok',ph:'https://tiktok.com/@pseudo',re:/^https:\/\/(www\.)?tiktok\.com\/@[\w.]{2,24}\/?$/},
  kick:{n:'Kick',ph:'https://kick.com/pseudo',re:/^https:\/\/(www\.)?kick\.com\/[\w-]{3,25}\/?$/},
  x:{n:'X (Twitter)',ph:'https://x.com/pseudo',re:/^https:\/\/(www\.)?(x|twitter)\.com\/[A-Za-z0-9_]{1,15}\/?$/},
  instagram:{n:'Instagram',ph:'https://instagram.com/pseudo',re:/^https:\/\/(www\.)?instagram\.com\/[\w.]{1,30}\/?$/}
};
const INF={tab:'apply',req:undefined,isDev:false,all:null,platform:'twitch',busy:false};
const infCode=()=>'TICKRATE-'+String(AUTH.session?.account?.id||'').slice(0,6).toUpperCase();
const infOnline=()=>typeof fbLive==='function'&&fbLive()&&AUTH.mode==='firebase'&&!!FBA.uid;
const infNum=n=>Number(n||0).toLocaleString(LOC[lang]);

Object.assign(I18N.fr,{
  inf_nav:'Programme Influenceur',inf_grant_t:'Donner le statut',inf_grant_d:'sans demande ni conditions',inf_grant_name:'Pseudo du joueur',inf_grant_noplat:'Plateforme (facultatif)',inf_grant_opt:'facultatif',inf_grant_btn:'Donner le statut',inf_grant_ok:'{n} est maintenant influenceur (Premium offert)',inf_granted_by:'Statut donné par {b}',e_player_not_found:'Aucun joueur avec ce pseudo.',inf_badge:'Influenceur',inf_title:'Programme Influenceur',
  inf_sub:'Tu crées du contenu sur Counter-Strike ? Fais vérifier ta chaîne et profite de tout le Premium gratuitement, avec un badge visible par tous les joueurs.',
  inf_tab_apply:'Ma demande',inf_tab_review:'Validation',
  inf_perks:'Ce que tu obtiens',inf_p1:'Tous les avantages Premium, offerts tant que tu fais partie du programme',inf_p2:'Le badge INFLUENCEUR à côté de ton pseudo',inf_p3:'Un lien vers ta chaîne sur ton profil',
  inf_rules:'Conditions',inf_r_steam:'Compte Steam lié',inf_r_age:'Compte TICKRATE créé depuis au moins {n} jours',inf_r_fol:'Au moins {n} abonnés sur ta plateforme principale',inf_r_views:'Au moins {n} vues moyennes par vidéo (ou spectateurs par live)',inf_r_cs:'Du contenu Counter-Strike publié ces 30 derniers jours',inf_r_code:'Le code de vérification visible dans la description de ta chaîne',
  inf_form:'Ta demande',inf_platform:'Plateforme principale',inf_url:'Lien de la chaîne',inf_handle:'Nom de la chaîne',inf_followers:'Abonnés',inf_views:'Vues moyennes',inf_msg:'Message pour l\'équipe (facultatif)',inf_msg_ph:'Type de contenu, fréquence de publication, liens vers d\'autres réseaux…',
  inf_code_t:'Code de vérification',inf_code_d:'Ajoute ce code dans la bio ou la description de ta chaîne. Un membre de l\'équipe vérifiera qu\'il y est avant d\'accepter ta demande. Tu pourras le retirer ensuite.',inf_copy:'Copier',inf_copied:'Code copié',
  inf_ck_cs:'Je publie du contenu Counter-Strike',inf_ck_code:'J\'ai ajouté le code sur ma chaîne',inf_send:'Envoyer ma demande',inf_sending:'Envoi…',inf_sent:'Demande envoyée. Un membre de l\'équipe va la vérifier.',
  inf_st_pending:'Demande en cours de vérification',inf_st_pending_d:'Envoyée le {d}. L\'équipe vérifie ta chaîne et le code {c}.',
  inf_st_approved:'Tu fais partie du programme',inf_st_approved_d:'Validé le {d} par {b}. Le Premium est actif sur ton compte.',
  inf_st_rejected:'Demande refusée',inf_st_revoked:'Statut influenceur retiré',inf_st_note:'Motif : {x}',inf_st_retry:'Tu pourras refaire une demande 14 jours après le refus.',
  inf_login:'Connecte-toi avec un compte TICKRATE pour envoyer une demande.',
  inf_rv_empty:'Aucune demande pour le moment.',inf_rv_pending:'En attente',inf_rv_done:'Traitées',inf_approve:'Accepter',inf_reject:'Refuser',inf_revoke:'Retirer le statut',inf_note_ph:'Motif (affiché au joueur)',inf_open:'Ouvrir la chaîne',inf_rv_ok:'Décision enregistrée',
  inf_s_pending:'En attente',inf_s_approved:'Accepté',inf_s_rejected:'Refusé',inf_s_revoked:'Retiré',inf_offered:'Offert (Influenceur)',
  e_inf_already:'Tu fais déjà partie du programme.',e_inf_account_young:'Ton compte doit avoir au moins 7 jours.',e_inf_pending:'Tu as déjà une demande en cours.',e_inf_cooldown:'Ta dernière demande a été refusée il y a moins de 14 jours.',e_inf_bad_platform:'Plateforme non prise en charge.',e_inf_bad_url:'Le lien ne correspond pas à une chaîne de cette plateforme.',e_inf_low_followers:'Il faut au moins 1 000 abonnés.',e_inf_low_views:'Il faut au moins 200 vues moyennes.',e_inf_missing_checks:'Coche les deux cases de confirmation.',e_forbidden:'Réservé à l\'équipe TICKRATE.',e_inf_not_pending:'Cette demande a déjà été traitée.'
});
Object.assign(I18N.en,{
  inf_nav:'Influencer Program',inf_grant_t:'Grant status',inf_grant_d:'no application or requirements',inf_grant_name:'Player name',inf_grant_noplat:'Platform (optional)',inf_grant_opt:'optional',inf_grant_btn:'Grant status',inf_grant_ok:'{n} is now an influencer (free Premium)',inf_granted_by:'Granted by {b}',e_player_not_found:'No player with this name.',inf_badge:'Influencer',inf_title:'Influencer Program',
  inf_sub:'Do you make Counter-Strike content? Get your channel verified and enjoy every Premium feature for free, with a badge every player can see.',
  inf_tab_apply:'My application',inf_tab_review:'Review',
  inf_perks:'What you get',inf_p1:'Every Premium feature, free for as long as you are in the program',inf_p2:'The INFLUENCER badge next to your name',inf_p3:'A link to your channel on your profile',
  inf_rules:'Requirements',inf_r_steam:'Steam account linked',inf_r_age:'TICKRATE account at least {n} days old',inf_r_fol:'At least {n} followers on your main platform',inf_r_views:'At least {n} average views per video (or viewers per stream)',inf_r_cs:'Counter-Strike content posted in the last 30 days',inf_r_code:'The verification code visible in your channel description',
  inf_form:'Your application',inf_platform:'Main platform',inf_url:'Channel link',inf_handle:'Channel name',inf_followers:'Followers',inf_views:'Average views',inf_msg:'Message for the team (optional)',inf_msg_ph:'Content type, upload schedule, links to other networks…',
  inf_code_t:'Verification code',inf_code_d:'Add this code to your channel bio or description. A team member will check it is there before accepting. You can remove it afterwards.',inf_copy:'Copy',inf_copied:'Code copied',
  inf_ck_cs:'I make Counter-Strike content',inf_ck_code:'I added the code to my channel',inf_send:'Send application',inf_sending:'Sending…',inf_sent:'Application sent. A team member will review it.',
  inf_st_pending:'Application under review',inf_st_pending_d:'Sent on {d}. The team is checking your channel and the code {c}.',
  inf_st_approved:'You are in the program',inf_st_approved_d:'Approved on {d} by {b}. Premium is active on your account.',
  inf_st_rejected:'Application declined',inf_st_revoked:'Influencer status removed',inf_st_note:'Reason: {x}',inf_st_retry:'You can apply again 14 days after a refusal.',
  inf_login:'Log in with a TICKRATE account to apply.',
  inf_rv_empty:'No applications yet.',inf_rv_pending:'Pending',inf_rv_done:'Processed',inf_approve:'Accept',inf_reject:'Decline',inf_revoke:'Remove status',inf_note_ph:'Reason (shown to the player)',inf_open:'Open channel',inf_rv_ok:'Decision saved',
  inf_s_pending:'Pending',inf_s_approved:'Accepted',inf_s_rejected:'Declined',inf_s_revoked:'Removed',inf_offered:'Free (Influencer)',
  e_inf_already:'You are already in the program.',e_inf_account_young:'Your account must be at least 7 days old.',e_inf_pending:'You already have a pending application.',e_inf_cooldown:'Your last application was declined less than 14 days ago.',e_inf_bad_platform:'Unsupported platform.',e_inf_bad_url:'This link is not a channel on that platform.',e_inf_low_followers:'You need at least 1,000 followers.',e_inf_low_views:'You need at least 200 average views.',e_inf_missing_checks:'Tick both confirmation boxes.',e_forbidden:'TICKRATE team only.',e_inf_not_pending:'This application was already processed.'
});

if(typeof applyStatic==='function')applyStatic();
(()=>{const o=setLang;setLang=function(){const r=o.apply(this,arguments);if(!$('#influencer').hidden)renderInfluencer();return r}})();

Object.assign(I18N.ru,{inf_nav:'Программа инфлюенсеров',inf_badge:'Инфлюенсер',inf_title:'Программа инфлюенсеров',
  inf_sub:'Делаешь контент по Counter-Strike? Подтверди канал и получи весь Premium бесплатно и значок, который видят все игроки.',
  inf_tab_apply:'Моя заявка',inf_tab_review:'Проверка',inf_offered:'Бесплатно (инфлюенсер)',inf_s_pending:'На проверке',inf_s_approved:'Принято',inf_s_rejected:'Отклонено',inf_s_revoked:'Снято',
  inf_grant_t:'Выдать статус',inf_grant_d:'без заявки и условий',inf_grant_name:'Ник игрока',inf_grant_noplat:'Платформа (необязательно)',inf_grant_opt:'необязательно',inf_grant_btn:'Выдать статус',inf_grant_ok:'{n} теперь инфлюенсер (Premium бесплатно)',inf_granted_by:'Статус выдал {b}',e_player_not_found:'Игрок с таким ником не найден.',
  inf_perks:'Что ты получаешь',inf_p1:'Все возможности Premium бесплатно, пока ты в программе',inf_p2:'Значок ИНФЛЮЕНСЕР рядом с ником',inf_p3:'Ссылку на твой канал в профиле',
  inf_rules:'Условия',inf_r_steam:'Привязан аккаунт Steam',inf_r_age:'Аккаунту TICKRATE не меньше {n} дней',inf_r_fol:'Не менее {n} подписчиков на основной платформе',inf_r_views:'Не менее {n} просмотров в среднем на видео (или зрителей на стриме)',inf_r_cs:'Контент по Counter-Strike за последние 30 дней',inf_r_code:'Код подтверждения в описании канала',
  inf_form:'Твоя заявка',inf_platform:'Основная платформа',inf_url:'Ссылка на канал',inf_handle:'Название канала',inf_followers:'Подписчики',inf_views:'Средние просмотры',inf_msg:'Сообщение для команды (необязательно)',inf_msg_ph:'Тип контента, частота публикаций, ссылки на другие соцсети…',
  inf_code_t:'Код подтверждения',inf_code_d:'Добавь этот код в био или описание канала. Участник команды проверит его перед одобрением. Потом код можно убрать.',inf_copy:'Копировать',inf_copied:'Код скопирован',
  inf_ck_cs:'Я делаю контент по Counter-Strike',inf_ck_code:'Я добавил код на канал',inf_send:'Отправить заявку',inf_sending:'Отправка…',inf_sent:'Заявка отправлена. Участник команды её проверит.',
  inf_st_pending:'Заявка на проверке',inf_st_pending_d:'Отправлена {d}. Команда проверяет канал и код {c}.',
  inf_st_approved:'Ты в программе',inf_st_approved_d:'Одобрено {d} пользователем {b}. Premium активен на твоём аккаунте.',
  inf_st_rejected:'Заявка отклонена',inf_st_revoked:'Статус инфлюенсера снят',inf_st_note:'Причина: {x}',inf_st_retry:'Подать заявку снова можно через 14 дней после отказа.',
  inf_login:'Войди в аккаунт TICKRATE, чтобы подать заявку.',
  inf_rv_empty:'Заявок пока нет.',inf_rv_pending:'Ожидают',inf_rv_done:'Обработаны',inf_approve:'Принять',inf_reject:'Отклонить',inf_revoke:'Снять статус',inf_note_ph:'Причина (видна игроку)',inf_open:'Открыть канал',inf_rv_ok:'Решение сохранено',
  e_inf_already:'Ты уже в программе.',e_inf_account_young:'Аккаунту должно быть не меньше 7 дней.',e_inf_pending:'У тебя уже есть заявка на проверке.',e_inf_cooldown:'Последняя заявка была отклонена меньше 14 дней назад.',e_inf_bad_platform:'Платформа не поддерживается.',e_inf_bad_url:'Ссылка не ведёт на канал этой платформы.',e_inf_low_followers:'Нужно не меньше 1 000 подписчиков.',e_inf_low_views:'Нужно не меньше 200 средних просмотров.',e_inf_missing_checks:'Отметь оба флажка подтверждения.',e_forbidden:'Только для команды TICKRATE.',e_inf_not_pending:'Эта заявка уже обработана.'});
async function infCall(name,data){
  await fbAuthEnsure();
  try{const r=await fetch(`${FB_FN()}/${name}`,{method:'POST',headers:{'Content-Type':'application/json',...(FBA.idToken?{Authorization:'Bearer '+FBA.idToken}:{})},body:JSON.stringify({data})});
    const j=await r.json().catch(()=>({}));return j.error?{error:j.error.message||'server_error'}:(j.result||{})}catch(e){return {error:'network'}}
}
const infErr=c=>{const k='e_'+c;return t(k)!==k?t(k):t('e_server_error')};

async function infLoad(){
  if(!infOnline()){INF.req=null;INF.isDev=false;return}
  const [req,role]=await Promise.all([fbReq(`influencerRequests/${FBA.uid}`),fbReq(`roles/${FBA.uid}`)]);
  INF.req=req||null;INF.isDev=role==='dev';
  if(INF.isDev)INF.all=(await fbReq('influencerRequests'))||{};
}
async function openInfluencer(){INF.req=undefined;renderInfluencer();await infLoad();renderInfluencer()}

function infStatusCard(r){
  const d=x=>new Date(x||Date.now()).toLocaleDateString(LOC[lang]);
  const note=r.note?`<p>${t('inf_st_note',{x:escA(r.note)})}</p>`:'';
  if(r.status==='pending')return `<div class="card inf-st wait"><b>${t('inf_st_pending')}</b><p>${t('inf_st_pending_d',{d:d(r.at),c:`<code>${escA(r.code)}</code>`})}</p></div>`;
  if(r.status==='approved')return `<div class="card inf-st ok"><b>${t('inf_st_approved')} ${infBadge()}</b><p>${t('inf_st_approved_d',{d:d(r.reviewedAt),b:escA(r.reviewedBy||'TICKRATE')})}</p></div>`;
  return `<div class="card inf-st ko"><b>${t(r.status==='revoked'?'inf_st_revoked':'inf_st_rejected')}</b>${note}<p>${t('inf_st_retry')}</p></div>`;
}
function infApplyHTML(){
  const ageOk=ME.since&&Date.now()-ME.since>=INF_RULES.minAccountDays*864e5;
  const rule=(ok,txt)=>`<li class="${ok===true?'ok':ok===false?'ko':''}"><i></i><span>${txt}</span></li>`;
  const r=INF.req,canApply=infOnline()&&(!r||r.status==='rejected'||r.status==='revoked');
  const pl=INF_PLATFORMS[INF.platform];
  const form=!infOnline()?`<p class="inf-hint">${t('inf_login')}</p>`:!canApply?'':`
    <form class="inf-form" id="infForm" novalidate>
      <div class="inf-grid">
        <div class="fld"><label>${t('inf_platform')}</label><select id="infPlatform">${Object.entries(INF_PLATFORMS).map(([k,v])=>`<option value="${k}"${k===INF.platform?' selected':''}>${v.n}</option>`).join('')}</select></div>
        <div class="fld"><label>${t('inf_handle')}</label><input type="text" id="infHandle" maxlength="40" autocomplete="off"></div>
        <div class="fld inf-wide"><label>${t('inf_url')}</label><input type="text" id="infUrl" maxlength="200" placeholder="${pl.ph}" autocomplete="off"></div>
        <div class="fld"><label>${t('inf_followers')}</label><input type="number" id="infFollowers" min="0" step="1" inputmode="numeric"></div>
        <div class="fld"><label>${t('inf_views')}</label><input type="number" id="infViews" min="0" step="1" inputmode="numeric"></div>
        <div class="fld inf-wide"><label>${t('inf_msg')}</label><textarea id="infMsg" maxlength="500" rows="3" placeholder="${t('inf_msg_ph')}"></textarea></div>
      </div>
      <div class="inf-code"><div><b>${t('inf_code_t')}</b><p>${t('inf_code_d')}</p></div><div class="inf-code-box"><code>${infCode()}</code><button type="button" class="btn ghost sm" data-inf-copy>${t('inf_copy')}</button></div></div>
      <label class="inf-ck"><input type="checkbox" id="infCs"> ${t('inf_ck_cs')}</label>
      <label class="inf-ck"><input type="checkbox" id="infCodeOk"> ${t('inf_ck_code')}</label>
      <div class="inf-err" id="infErr" hidden></div>
      <button class="btn primary" id="infSend" type="submit">${t('inf_send')}</button>
    </form>`;
  return `${r?infStatusCard(r):''}
    <div class="inf-cols">
      <div class="card"><div class="h3">${t('inf_perks')}</div><ul class="inf-perks"><li>${t('inf_p1')}</li><li>${t('inf_p2')} ${infBadge()}</li><li>${t('inf_p3')}</li></ul>
        <div class="h3" style="margin-top:22px">${t('inf_rules')}</div><ul class="inf-rules">
        ${rule(!!ME.steam?.linked,t('inf_r_steam'))}${rule(!!ageOk,t('inf_r_age',{n:INF_RULES.minAccountDays}))}
        ${rule(null,t('inf_r_fol',{n:infNum(INF_RULES.minFollowers)}))}${rule(null,t('inf_r_views',{n:infNum(INF_RULES.minAvgViews)}))}
        ${rule(null,t('inf_r_cs'))}${rule(null,t('inf_r_code'))}</ul></div>
      ${form?`<div class="card"><div class="h3">${t('inf_form')}</div>${form}</div>`:''}
    </div>`;
}
function infReviewHTML(){
  const all=Object.entries(INF.all||{}).map(([uid,r])=>({...r,uid}));
  const grantForm=`<form class="card inf-grant" id="infGrant" novalidate><div class="h3">${t('inf_grant_t')}<span>${t('inf_grant_d')}</span></div>
    <div class="inf-grant-row"><input type="text" id="igName" maxlength="25" placeholder="${t('inf_grant_name')}" autocomplete="off" required>
      <select id="igPlatform"><option value="">${t('inf_grant_noplat')}</option>${Object.entries(INF_PLATFORMS).map(([k,v])=>`<option value="${k}">${v.n}</option>`).join('')}</select>
      <input type="text" id="igUrl" maxlength="200" placeholder="${t('inf_url')} (${t('inf_grant_opt')})" autocomplete="off">
      <button class="btn primary" type="submit">${t('inf_grant_btn')}</button></div></form>`;
  if(!all.length)return grantForm+`<div class="card inf-hint">${t('inf_rv_empty')}</div>`;
  const row=r=>{const pl=INF_PLATFORMS[r.platform]||{n:r.platform};const pend=r.status==='pending';
    return `<div class="card inf-rv" data-uid="${escA(r.uid)}">
      <div class="inf-rv-h"><div><b>${escA(r.name)}</b> <span class="pill">${r.elo||1000} ELO</span> <span class="tg2 ${pend?'off':'done'}">${t('inf_s_'+r.status)}</span></div><small>${new Date(r.at).toLocaleString(LOC[lang])}</small></div>
      ${r.granted?`<div class="inf-rv-d"><span>${t('inf_granted_by',{b:escA(r.reviewedBy||'')})}</span>${r.url?`<span>${pl.n}</span><a href="${escA(r.url)}" target="_blank" rel="noopener noreferrer">${escA(r.handle||r.url)}</a>`:''}</div>`:`<div class="inf-rv-d"><span>${pl.n}</span><a href="${escA(r.url)}" target="_blank" rel="noopener noreferrer">${escA(r.handle||r.url)}</a><span><b>${infNum(r.followers)}</b> ${t('inf_followers').toLowerCase()}</span><span><b>${infNum(r.avgViews)}</b> ${t('inf_views').toLowerCase()}</span><span>${t('inf_code_t')} : <code>${escA(r.code)}</code></span></div>`}
      ${r.message?`<p class="inf-rv-m">${escA(r.message)}</p>`:''}
      ${r.note&&!pend?`<p class="inf-rv-m">${t('inf_st_note',{x:escA(r.note)})}${r.reviewedBy?' · '+escA(r.reviewedBy):''}</p>`:''}
      ${pend||r.status==='approved'?`<div class="inf-rv-a"><input type="text" maxlength="300" placeholder="${t('inf_note_ph')}" data-note>
        ${pend?`<button class="btn primary sm" data-inf-act="approve">${t('inf_approve')}</button><button class="btn ghost sm" data-inf-act="reject">${t('inf_reject')}</button>`
             :`<button class="btn ghost sm" data-inf-act="revoke">${t('inf_revoke')}</button>`}</div>`:''}
    </div>`};
  const pend=all.filter(r=>r.status==='pending').sort((a,b)=>a.at-b.at),done=all.filter(r=>r.status!=='pending').sort((a,b)=>(b.reviewedAt||0)-(a.reviewedAt||0));
  return grantForm+`<div class="sec-t">${t('inf_rv_pending')} (${pend.length})</div>${pend.map(row).join('')||`<div class="card inf-hint">${t('inf_rv_empty')}</div>`}
    ${done.length?`<div class="sec-t">${t('inf_rv_done')}</div>${done.map(row).join('')}`:''}`;
}
function renderInfluencer(){
  const el=$('#influencer');if(!el)return;
  if(!INF.isDev)INF.tab='apply';
  const pend=Object.values(INF.all||{}).filter(r=>r.status==='pending').length;
  el.innerHTML=`<div class="pr-hero"><h1>${t('inf_title')}</h1><p>${t('inf_sub')}</p></div>
    ${INF.isDev?`<div class="inf-tabs seg"><button class="${INF.tab==='apply'?'on':''}" data-inf-tab="apply">${t('inf_tab_apply')}</button><button class="${INF.tab==='review'?'on':''}" data-inf-tab="review">${t('inf_tab_review')}${pend?` <span class="inf-n">${pend}</span>`:''}</button></div>`:''}
    ${INF.req===undefined?'<div class="inf-load"><span class="spin inl"></span></div>':INF.tab==='review'?infReviewHTML():infApplyHTML()}`;
}

$('#influencer').addEventListener('change',e=>{
  if(e.target.id==='infPlatform'){INF.platform=e.target.value;$('#infUrl').placeholder=INF_PLATFORMS[INF.platform].ph}
});
$('#influencer').addEventListener('click',async e=>{
  const tb=e.target.closest('[data-inf-tab]');if(tb){INF.tab=tb.dataset.infTab;return renderInfluencer()}
  if(e.target.closest('[data-inf-copy]')){try{await navigator.clipboard.writeText(infCode());toast(t('inf_copied'))}catch(_){}return}
  const act=e.target.closest('[data-inf-act]');if(!act||INF.busy)return;
  const box=act.closest('[data-uid]'),note=box.querySelector('[data-note]')?.value||'';
  INF.busy=true;box.querySelectorAll('button').forEach(b=>b.disabled=true);
  const r=await infCall('influencerReview',{uid:box.dataset.uid,decision:act.dataset.infAct,note});
  INF.busy=false;
  if(r.error){toast(infErr(r.error));box.querySelectorAll('button').forEach(b=>b.disabled=false);return}
  toast(t('inf_rv_ok'));await infLoad();renderInfluencer();
});
$('#influencer').addEventListener('submit',async e=>{
  if(e.target.id==='infGrant'){e.preventDefault();if(INF.busy)return;
    const name=$('#igName').value.trim();if(!name)return $('#igName').focus();
    const b=e.target.querySelector('button');INF.busy=true;b.disabled=true;
    const r=await infCall('influencerGrant',{name,platform:$('#igPlatform').value,url:$('#igUrl').value.trim()});
    INF.busy=false;b.disabled=false;
    if(r.error)return toast(infErr(r.error));
    toast(t('inf_grant_ok',{n:r.name}));await infLoad();return renderInfluencer()}
  if(e.target.id!=='infForm')return;e.preventDefault();if(INF.busy)return;
  const err=$('#infErr'),show=c=>{err.textContent=infErr(c);err.hidden=false};err.hidden=true;
  const d={platform:INF.platform,url:$('#infUrl').value.trim(),handle:$('#infHandle').value.trim(),followers:+$('#infFollowers').value||0,avgViews:+$('#infViews').value||0,
    message:$('#infMsg').value.trim(),lang,csContent:$('#infCs').checked,codeAdded:$('#infCodeOk').checked};
  if(!INF_PLATFORMS[d.platform].re.test(d.url))return show('inf_bad_url');
  if(d.followers<INF_RULES.minFollowers)return show('inf_low_followers');
  if(d.avgViews<INF_RULES.minAvgViews)return show('inf_low_views');
  if(!d.csContent||!d.codeAdded)return show('inf_missing_checks');
  const b=$('#infSend');INF.busy=true;b.disabled=true;b.innerHTML=`<span class="spin inl"></span> ${t('inf_sending')}`;
  const r=await infCall('influencerApply',d);INF.busy=false;
  if(r.error){b.disabled=false;b.textContent=t('inf_send');return show(r.error)}
  INF.req=r.request;toast(t('inf_sent'));renderInfluencer();
});
