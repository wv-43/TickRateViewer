const ADM={dev:null,devUid:null,busy:false};
const admOn=()=>typeof fbLive==='function'&&fbLive()&&AUTH.mode==='firebase'&&!!FBA.uid;
const ADM_ROLES_KEY='tr_roles_cache_v1',ADM_ROLES_TTL=10*60e3;
const ADM_ROLES=(()=>{try{return JSON.parse(localStorage.getItem(ADM_ROLES_KEY)||'{}')||{}}catch(e){return {}}})();
const ADM_INFLIGHT={};
function saveAdmRoles(){try{localStorage.setItem(ADM_ROLES_KEY,JSON.stringify(ADM_ROLES))}catch(e){}}
function applyBadgeEntry(p,e){
  if(!p||!e)return false;
  let ch=false;
  const dv=!!(p.dev||e.dev),bt=!!(p.beta||e.beta),pl=(p.plan&&p.plan!=='free')?p.plan:(e.plan||p.plan||'free'),inf=p.influencer||e.influencer||null;
  if(!!p.dev!==dv){p.dev=dv;ch=true}
  if(!!p.beta!==bt){p.beta=bt;ch=true}
  if((p.plan||'free')!==pl){p.plan=pl;ch=true}
  if(JSON.stringify(p.influencer||null)!==JSON.stringify(inf)){p.influencer=inf;ch=true}
  if(typeof PLAYERS!=='undefined'&&Array.isArray(PLAYERS)){
    const local=PLAYERS.find(x=>x&&(x===p||(p.uid&&x.uid===p.uid)||(p.name&&x.name&&x.name.toLowerCase()===p.name.toLowerCase())));
    if(local&&local!==p){local.dev=dv;local.beta=bt;if(pl!=='free')local.plan=pl;if(inf)local.influencer=inf}
  }
  return ch;
}
async function admHydrateBadges(list,onUpdate){
  if(!admOn()||!Array.isArray(list)||!list.length)return;
  const now=Date.now();
  let syncChanged=false;
  const todo=[];
  for(const p of list){
    if(!p)continue;
    if(p===ME||(FBA.uid&&(p.uid===FBA.uid||(p.name&&ME.name&&p.name.toLowerCase()===ME.name.toLowerCase())))){
      if(applyBadgeEntry(p,{dev:!!ME.dev,beta:!!ME.beta,plan:ME.plan||'free',influencer:ME.influencer||null}))syncChanged=true;
      if(ADM.devUid!==FBA.uid)todo.push(p);
      continue;
    }
    const c=p.uid&&ADM_ROLES[p.uid];
    if(c){
      if(applyBadgeEntry(p,c))syncChanged=true;
      if(now-(c.at||0)<ADM_ROLES_TTL)continue;
    }
    todo.push(p);
  }
  if(syncChanged&&typeof onUpdate==='function')try{onUpdate()}catch(e){}
  if(!todo.length)return;
  let asyncChanged=false;
  const batch=todo.slice(0,12);
  await Promise.all(batch.map(async p=>{
    try{
      if(p===ME||(FBA.uid&&p.uid===FBA.uid)){
        await amDev();
        if(applyBadgeEntry(p,{dev:!!ME.dev,beta:!!ME.beta,plan:ME.plan||'free',influencer:ME.influencer||null}))asyncChanged=true;
        return;
      }
      if(!p.uid&&p.name){
        const k=String(p.name).toLowerCase().replace(/[.#$/[\]]/g,'_');
        if(window._TR_UIDS&&window._TR_UIDS[k])p.uid=window._TR_UIDS[k];
        else{
          p.uid=await fbReq(`usernames/${k}`)||null;
          if(p.uid){window._TR_UIDS=window._TR_UIDS||{};window._TR_UIDS[k]=p.uid}
        }
      }
      if(!p.uid)return;
      const uid=p.uid;
      if(!ADM_INFLIGHT[uid]){
        ADM_INFLIGHT[uid]=(async()=>{
          const needProf=p.beta===undefined||p.influencer===undefined||!p.plan||p.plan==='free';
          const [role,prof]=await Promise.all([fbReq(`roles/${uid}`),needProf?fbReq(`profiles/${uid}`):Promise.resolve(null)]);
          const prev=ADM_ROLES[uid]||{};
          const entry={
            dev:role==='dev'||!!(prof&&prof.dev),
            beta:prof?!!prof.beta:!!(p.beta||prev.beta),
            plan:(prof&&prof.plan)||p.plan||prev.plan||'free',
            influencer:(prof&&prof.influencer)||p.influencer||prev.influencer||null,
            at:Date.now()
          };
          ADM_ROLES[uid]=entry;
          return entry;
        })().finally(()=>{delete ADM_INFLIGHT[uid]});
      }
      const entry=await ADM_INFLIGHT[uid];
      if(applyBadgeEntry(p,entry))asyncChanged=true;
    }catch(e){}
  }));
  saveAdmRoles();
  if(asyncChanged&&typeof onUpdate==='function')try{onUpdate()}catch(e){}
}
async function amDev(){
  if(!admOn())return false;
  if(ADM.devUid!==FBA.uid){
    ADM.devUid=FBA.uid;
    const [role,prof]=await Promise.all([fbReq(`roles/${FBA.uid}`),fbReq(`profiles/${FBA.uid}`)]);
    ADM.dev=role==='dev'||!!(prof&&prof.dev);
    ME.dev=ADM.dev;
    ME.beta=!!(prof&&prof.beta);
    if(prof&&prof.plan)ME.plan=prof.plan;
    if(prof&&prof.influencer!==undefined)ME.influencer=prof.influencer||null;
    ADM_ROLES[FBA.uid]={dev:!!ME.dev,beta:!!ME.beta,plan:ME.plan||'free',influencer:ME.influencer||null,at:Date.now()};
    saveAdmRoles();
    if(typeof refreshMe==='function')refreshMe();
    if(!$('#profile').hidden&&!profileTarget&&typeof renderProfile==='function')renderProfile();
    if($('#compet')&&!$('#compet').hidden&&typeof renderCompet==='function')renderCompet();
    if($('#ranking')&&!$('#ranking').hidden&&typeof renderRanking==='function')renderRanking();
    if($('#shop')&&!$('#shop').hidden&&typeof renderShop==='function')renderShop();
    if($('#editModal')&&$('#editModal').classList.contains('on')&&typeof renderEditor==='function')renderEditor();
    if($('#inventory')&&!$('#inventory').hidden&&typeof renderInventory==='function')renderInventory();
  }
  return ADM.dev;
}
setInterval(()=>{if(admOn()&&ADM.devUid!==FBA.uid)amDev()},1500);
setTimeout(()=>{if(admOn())amDev()},250);
const BAN_OPTS=[[60,'1 h'],[1440,'24 h'],[10080,'7 j'],[43200,'30 j'],[0,'∞']];
Object.assign(I18N.fr,{adm_title:'Modération',adm_banned_tag:'Banni',adm_dev_noban:'Compte dev : ban impossible (retire le rôle dans la console Firebase).',adm_dev_only:'visible par les devs uniquement',adm_role:'Rôles',adm_inf:'Influenceur',adm_beta:'Bêta testeur',adm_dev:'Dev',adm_ban:'Bannir',adm_unban:'Débannir',adm_reason:'Motif du ban',adm_banned:'Banni jusqu’au {d}',adm_banned_perm:'Banni définitivement',adm_by:'par {b}',adm_ban_q:'Bannir {n} ?',adm_ban_t:'Durée : {d}. Le joueur est retiré de la file et ne peut plus lancer de match.',adm_ok:'Modifié',adm_perm:'définitif',
  e_adm_self:'Impossible sur ton propre compte.',e_adm_target_dev:'Retire d’abord son rôle dev.'});
Object.assign(I18N.en,{adm_title:'Moderation',adm_banned_tag:'Banned',adm_dev_noban:'Dev account: cannot be banned (remove the role in the Firebase console).',adm_dev_only:'visible to devs only',adm_role:'Roles',adm_inf:'Influencer',adm_beta:'Beta tester',adm_dev:'Dev',adm_ban:'Ban',adm_unban:'Unban',adm_reason:'Ban reason',adm_banned:'Banned until {d}',adm_banned_perm:'Permanently banned',adm_by:'by {b}',adm_ban_q:'Ban {n}?',adm_ban_t:'Duration: {d}. The player is removed from the queue and cannot start matches.',adm_ok:'Updated',adm_perm:'permanent',
  e_adm_self:'Not possible on your own account.',e_adm_target_dev:'Remove their dev role first.'});
Object.assign(I18N.ru,{adm_title:'Модерация',adm_banned_tag:'Забанен',adm_dev_noban:'Аккаунт dev: бан невозможен (сними роль в консоли Firebase).',adm_dev_only:'видно только разработчикам',adm_role:'Роли',adm_inf:'Инфлюенсер',adm_beta:'Бета-тестер',adm_dev:'Dev',adm_ban:'Забанить',adm_unban:'Разбанить',adm_reason:'Причина бана',adm_banned:'Бан до {d}',adm_banned_perm:'Бан навсегда',adm_by:'от {b}',adm_ban_q:'Забанить {n}?',adm_ban_t:'Срок: {d}. Игрок убран из очереди и не может играть.',adm_ok:'Изменено',adm_perm:'навсегда',
  e_adm_self:'Нельзя для своего аккаунта.',e_adm_target_dev:'Сначала сними роль dev.'});

async function admEnrich(P){
  if(!admOn()||!P||P===ME)return;
  if(!P.uid){const k=String(P.name).toLowerCase().replace(/[.#$/[\]]/g,'_');P.uid=await fbReq(`usernames/${k}`)||null}
  if(!P.uid&&typeof fbCall==='function'){const r=await fbCall('playerLookup',{name:P.name});P.uid=(r&&r.uid)||null}
  if(!P.uid)return;
  const prof=await fbReq(`profiles/${P.uid}`);
  if(prof){Object.assign(P,{plan:prof.plan||'free',planSource:prof.planSource||null,influencer:prof.influencer||null,beta:!!prof.beta,bgStyle:prof.bgStyle||null,eloWm:prof.eloWm??null,matchesWm:prof.matchesWm??null,winsWm:prof.winsWm??null,peakEloWm:prof.peakEloWm??null});if(typeof prof.elo==='number')P.elo=prof.elo;if(prof.avatar)P.steamAvatar=prof.avatar}
  if(typeof applyLook==='function')await applyLook(P);
  const hist=await fbReq(`history/${P.uid}`);
  if(hist&&typeof hist==='object'){
    const MN=n=>(MAPS.find(m=>'de_'+m.slug===n||m.slug===String(n).replace('de_',''))||{n:String(n).replace('de_','')}).n;
    P.history=Object.entries(hist).map(([id,x])=>({id,date:new Date(x.at||Date.now()),map:MN(x.map),won:!!x.won,score:x.score||'0-0',
      k:x.k||0,d:x.d||0,a:x.a||0,hs:x.hs||0,adr:x.adr||0,kast:x.kast||0,rating:x.rating||1,delta:x.delta||0,elo:x.elo||P.elo,mode:x.mode||'ranked'})).sort((a,b)=>b.date-a.date);
  }else P.history=[];
  if(prof&&typeof prof.matches==='number')P.matches=prof.matches;
  const dev=await amDev();
  let ban;
  if(dev)ban=await fbReq(`bans/${P.uid}`);
  else{const [until,reason]=await Promise.all([fbReq(`bans/${P.uid}/until`),fbReq(`bans/${P.uid}/reason`)]);ban=until?{until,reason}:null}
  P.ban=ban&&ban.until>Date.now()?ban:null;
  const isTargetDev=(await fbReq(`roles/${P.uid}`))==='dev'||!!(prof&&prof.dev);
  P.dev=isTargetDev;
  if(dev)P.adm={dev:isTargetDev};
  ADM_ROLES[P.uid]={dev:isTargetDev,beta:!!P.beta,plan:P.plan||'free',influencer:P.influencer||null,at:Date.now()};
  saveAdmRoles();
  if(typeof DIVREAL!=='undefined'&&Array.isArray(DIVREAL))for(const x of DIVREAL)if(x&&(x.uid===P.uid||x.name===P.name))applyBadgeEntry(x,ADM_ROLES[P.uid]);
  if(typeof WREAL!=='undefined'&&Array.isArray(WREAL))for(const x of WREAL)if(x&&(x.uid===P.uid||x.name===P.name))applyBadgeEntry(x,ADM_ROLES[P.uid]);
  if(typeof RLB!=='undefined'&&Array.isArray(RLB.rows))for(const x of RLB.rows)if(x&&(x.uid===P.uid||x.name===P.name))applyBadgeEntry(x,ADM_ROLES[P.uid]);
}
(()=>{const o=openProfile;openProfile=async function(name){
  await o(name);
  const P=profileTarget;if(!P)return;
  await admEnrich(P);
  if(profileTarget===P&&!$('#profile').hidden)renderProfile();
}})();

function admPanel(P){
  const a=P.adm,b=P.ban;
  const tog=(on,act,label)=>`<button type="button" class="adm-tog ${on?'on':''}" data-adm="${act}_${on?'off':'on'}">${label}</button>`;
  return `<div class="adm card"><div class="adm-h"><b>${t('adm_title')}</b><small>${t('adm_dev_only')}</small></div>
    <div class="adm-row"><span class="adm-l">${t('adm_role')}</span>${tog(!!P.influencer,'influencer',t('adm_inf'))}${tog(!!P.beta,'beta',t('adm_beta'))}${a.dev?`<span class="adm-devtag">${t('adm_dev')}</span>`:''}</div>
    <div class="adm-row">${a.dev?`<span class="adm-l">${t('adm_dev_noban')}</span>`:b?`<span class="adm-ban">${b.by?t('adm_by',{b:escA(b.by)}):''}</span><button type="button" class="btn sm" data-adm="unban">${t('adm_unban')}</button>`
      :`<select id="admDur">${BAN_OPTS.map(([m,l])=>`<option value="${m}">${m?l:t('adm_perm')}</option>`).join('')}</select><input type="text" id="admReason" maxlength="200" placeholder="${t('adm_reason')}"><button type="button" class="btn sm adm-danger" data-adm="ban">${t('adm_ban')}</button>`}</div></div>`;
}
function banLine(b){const perm=b.until-Date.now()>50*365*864e5;
  return `<div class="p-banned"><b>${t('adm_banned_tag')}</b><span>${perm?t('adm_banned_perm'):t('adm_banned',{d:new Date(b.until).toLocaleString(LOC[lang])})}${b.reason?' · '+escA(b.reason):''}</span></div>`}
(()=>{const o=profileActions;profileActions=function(P){const h=o(P);return P?(P.ban?banLine(P.ban):'')+h+(P.adm?admPanel(P):''):h}})();

async function admRun(P,data){
  if(ADM.busy)return;ADM.busy=true;
  const r=await infCall('devAction',{uid:P.uid,...data});ADM.busy=false;
  if(r.error)return toast(infErr(r.error));
  toast(t('adm_ok'));await admEnrich(P);if(profileTarget===P)renderProfile();
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-adm]');if(!b||!profileTarget||!profileTarget.adm)return;
  const P=profileTarget,act=b.dataset.adm;
  if(act!=='ban')return admRun(P,{action:act});
  const min=+$('#admDur').value,reason=$('#admReason').value.trim(),dur=(BAN_OPTS.find(x=>x[0]===min)||[0,''])[1];
  confirmBox(t('adm_ban_q',{n:escA(P.name)}),t('adm_ban_t',{d:min?dur:t('adm_perm')}),t('adm_ban'),t('cancel'),()=>admRun(P,{action:'ban',minutes:min,reason}));
});

Object.assign(I18N.fr,{fb_title:'Tickets et retours bêta',fb_sub:'page Support et !feedback en jeu · visible par les devs',fb_none:'Aucun ticket pour l’instant.',fb_reply:'Répondre',fb_close:'Clore',fb_reply_ph:'Réponse au joueur (visible sur sa page Support)'});
Object.assign(I18N.en,{fb_title:'Tickets & beta feedback',fb_sub:'Support page and in-game !feedback · visible to devs',fb_none:'No tickets yet.',fb_reply:'Reply',fb_close:'Close',fb_reply_ph:'Reply to the player (shown on their Support page)'});
Object.assign(I18N.ru,{fb_title:'Тикеты и отзывы беты',fb_sub:'страница поддержки и !feedback в игре · видно разработчикам',fb_none:'Тикетов пока нет.',fb_reply:'Ответить',fb_close:'Закрыть',fb_reply_ph:'Ответ игроку (виден на его странице поддержки)'});
async function devFeedback(box){
  const d=await fbReq('feedback?orderBy="$key"&limitToLast=60');
  const list=Object.entries(d||{}).map(([id,f])=>({id,...f})).sort((a,b)=>(a.status==='closed')-(b.status==='closed')||b.at-a.at);
  box.querySelector('.fb-list').innerHTML=list.length?list.map(f=>`<div class="fb-it ${f.status==='closed'?'closed':''}" data-fbid="${escA(f.id)}"><div><b>${escA(f.name||f.steamId||'?')}</b><span class="tk-st ${escA(f.status||'open')}">${t('tk_st_'+(f.status||'open'))}</span><span class="tk-cat">${t('tk_cat_'+(f.cat||'other'))}</span><small>${new Date(f.at).toLocaleString(LOC[lang])} · ${f.source==='site'?t('tk_src_site'):t('tk_src_game')}${f.server?' · '+escA(f.server):''}${f.lang?' · '+escA(String(f.lang).toUpperCase()):''}</small></div><p>${escA(f.text)}</p>
    ${f.reply?`<div class="tk-reply"><b>${escA(f.repliedBy||'TICKRATE')}</b><p>${escA(f.reply)}</p></div>`:''}
    ${f.uid&&f.status!=='closed'?`<div class="fb-act"><textarea maxlength="1500" rows="2" placeholder="${t('fb_reply_ph')}"></textarea><button class="btn sm primary" data-fbsend>${t('fb_reply')}</button><button class="btn sm ghost" data-fbclose>${t('fb_close')}</button></div>`:''}</div>`).join(''):`<p class="m-hint">${t('fb_none')}</p>`;
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-fbsend],[data-fbclose]');if(!b)return;
  const it=b.closest('[data-fbid]'),box=b.closest('#devFb');if(!it||!box)return;
  b.disabled=true;
  const r=await infCall('ticketReply',{id:it.dataset.fbid,reply:it.querySelector('textarea').value.trim(),close:b.hasAttribute('data-fbclose')});
  b.disabled=false;
  if(r.error)return toast(infErr(r.error));
  toast(t('adm_ok'));devFeedback(box);
});

Object.assign(I18N.fr,{dev_badge:'DEV',dev_badge_t:'Développeur TICKRATE',dev_plaque:'Développeur'});
Object.assign(I18N.en,{dev_badge:'DEV',dev_badge_t:'TICKRATE developer',dev_plaque:'Developer'});
Object.assign(I18N.ru,{dev_badge:'РАЗРАБ',dev_badge_t:'Разработчик TICKRATE',dev_plaque:'Разработчик'});
const DEV_ICON='<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M160 389a20.91 20.91 0 01-13.82-5.2l-128-112a21 21 0 010-31.6l128-112a21 21 0 0127.66 31.61L63.89 256l109.94 96.19A21 21 0 01160 389zM352 389a21 21 0 01-13.84-36.81L448.11 256l-109.94-96.19a21 21 0 0127.66-31.61l128 112a21 21 0 010 31.6l-128 112A20.89 20.89 0 01352 389zM208 437a21 21 0 01-20.12-27l96-320a21 21 0 1140.23 12l-96 320A21 21 0 01208 437z"/></svg>';
const devBadge=()=>`<span class="pb dev" title="${t('dev_badge_t')}">${DEV_ICON}${t('dev_badge')}</span>`;
Object.assign(I18N.fr,{beta_badge:'Bêta testeur',beta_badge_t:'A testé TICKRATE pendant la bêta'});
Object.assign(I18N.en,{beta_badge:'Beta tester',beta_badge_t:'Tested TICKRATE during the beta'});
Object.assign(I18N.ru,{beta_badge:'Бета-тестер',beta_badge_t:'Тестировал TICKRATE во время беты'});
const BETA_ICON='<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M452.32 365L327.4 167.12a48.07 48.07 0 01-7.4-25.64V64h15.56c8.61 0 16-6.62 16.43-15.23A16 16 0 00336 32H176.45c-8.61 0-16 6.62-16.43 15.23A16 16 0 00176 64h16v77.48a47.92 47.92 0 01-7.41 25.63L59.68 365a74 74 0 00-2.5 75.84C70.44 465.19 96.36 480 124.13 480h263.74c27.77 0 53.69-14.81 66.95-39.21a74 74 0 00-2.5-75.79zM211.66 184.2A79.94 79.94 0 00224 141.48V68a4 4 0 014-4h56a4 4 0 014 4v73.48a79.94 79.94 0 0012.35 42.72l57.8 91.53a8 8 0 01-6.78 12.27H160.63a8 8 0 01-6.77-12.27z"/></svg>';
const betaBadge=()=>`<span class="pb beta" title="${t('beta_badge_t')}">${BETA_ICON}${t('beta_badge')}</span>`;
function getPlayerBadges(p){
  if(!p)return [];
  const list=[];
  const isMe=!!(p.me||(p.name&&typeof ME!=='undefined'&&ME.name&&p.name.toLowerCase()===ME.name.toLowerCase()));
  const isDev=!!(p.dev||(isMe&&typeof ME!=='undefined'&&ME.dev));
  const isBeta=!!(p.beta||(isMe&&typeof ME!=='undefined'&&ME.beta));
  const isInf=p.influencer||(isMe&&typeof ME!=='undefined'&&ME.influencer);
  const plan=(p.plan&&p.plan!=='free')?p.plan:(isMe&&typeof ME!=='undefined'?ME.plan:'free')||'free';
  if(isDev)list.push({id:'dev',html:devBadge(),title:t('dev_badge_t')||'Développeur'});
  if(typeof prestigeChip==='function'){
    const pr=prestigeChip(p);
    if(pr)list.push({id:'prestige',html:pr,title:'Prestige Pro'});
  }
  if(isInf)list.push({id:'inf',html:typeof infBadge==='function'?infBadge():`<span class="pb inf">Influenceur</span>`,title:t('inf_badge')||'Influenceur'});
  if(isBeta)list.push({id:'beta',html:betaBadge(),title:t('beta_badge_t')||'Bêta testeur'});
  if(plan==='premium')list.push({id:'prem',html:`<span class="pb prem">${typeof PREM_ICON!=='undefined'?PREM_ICON:''}PREMIUM</span>`,title:'Premium'});
  else if(plan==='plus')list.push({id:'plus',html:`<span class="pb plus">${typeof PLUS_ICON!=='undefined'?PLUS_ICON:''}PLUS</span>`,title:'Plus'});
  return list;
}
function formatBadgesWithLimit(list,max=2){
  if(!list||!list.length)return '';
  if(list.length<=max)return list.map(b=>b.html).join('');
  const shown=list.slice(0,max);
  const extra=list.slice(max);
  const extraTitles=extra.map(b=>b.title).join(' · ');
  return shown.map(b=>b.html).join('')+`<span class="pb pb-more" title="${escA(extraTitles)}">+${extra.length}</span>`;
}
(()=>{
  planBadge=function(p){
    return formatBadgesWithLimit(getPlayerBadges(p),2);
  };
  try{
    if(typeof renderParty==='function')setTimeout(renderParty,0);
    if(typeof refreshMe==='function')setTimeout(refreshMe,0);
  }catch(e){}
})();
(()=>{const o=decorateProfile;decorateProfile=function(){
  o.apply(this,arguments);
  const el=$('#profile'),P=profileTarget||ME;
  el.classList.toggle('pp-dev',!!P.dev);
  const b=el.querySelector('.p-banner');
  if(P.dev&&b&&!b.querySelector('.dev-plaque')){
    const target=b.querySelector('.p-banner-badges')||b;
    target.insertAdjacentHTML('beforeend',`<div class="dev-plaque">${DEV_ICON}<span><b>${t('dev_plaque')}</b><small>TICKRATE</small></span></div>`);
  }
  if(!profileTarget&&ME.dev&&admOn()&&!el.querySelector('#devFb')){
    el.insertAdjacentHTML('beforeend',`<section class="card fb-box" id="devFb"><div class="adm-h"><b>${t('fb_title')}</b><small>${t('fb_sub')}</small></div><div class="fb-list"><p class="m-hint">…</p></div></section>`);
    devFeedback(el.querySelector('#devFb'));
  }
}})();
