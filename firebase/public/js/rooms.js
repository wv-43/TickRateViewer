Object.assign(I18N.fr,{ro_title:'Room privée',ro_create:'Créer une room privée',ro_create_t:'Invite qui tu veux, choisis la map et lance même à 2 (les places vides sont complétées par des bots).',
  ro_of:'Room de {n}',ro_mode:'Mode',ro_map:'Map',ro_rounds:'Rounds',ro_bots:'Compléter avec des bots',ro_real:'Fin réelle (ELO + drops)',ro_invite_ph:'Pseudo du joueur',ro_invite:'Inviter',
  ro_team:'Équipe {x}',ro_empty_team:'Personne',ro_bots_fill:'+ {n} bot(s)',ro_pending:'Invités en attente',ro_start:'Lancer la partie',ro_leave:'Quitter',ro_close:'Fermer la room',ro_kick:'Retirer',ro_swap:'Changer d’équipe',
  ro_started:'Partie lancée : rejoins le serveur depuis le salon.',ro_inv_from:'{n} t’invite dans sa room privée',ro_join:'Rejoindre',ro_decline:'Refuser',ro_joined:'Tu as rejoint la room de {n}',ro_invited:'Invitation envoyée à {n}',ro_owner:'Hôte',
  e_room_unknown:'Cette room n’existe plus.',e_room_not_invited:'Tu n’es pas invité dans cette room.',e_room_other:'Tu es déjà dans une autre room : quitte-la d’abord.',e_room_full:'La room est pleine (10 joueurs).',e_room_already:'Ce joueur est déjà dans la room.',
  e_room_started:'La partie est déjà lancée.',e_room_team_size:'Trop de joueurs dans une équipe pour ce mode.',e_room_team_empty:'L’équipe A doit avoir au moins un joueur.',e_room_steam:'{n} doit lier son compte Steam avant de jouer.',e_room_in_match:'{n} est déjà dans un match.'});
Object.assign(I18N.en,{ro_title:'Private room',ro_create:'Create a private room',ro_create_t:'Invite anyone, pick the map and start even with 2 players (empty slots are filled with bots).',
  ro_of:'{n}’s room',ro_mode:'Mode',ro_map:'Map',ro_rounds:'Rounds',ro_bots:'Fill with bots',ro_real:'Real ending (ELO + drops)',ro_invite_ph:'Player name',ro_invite:'Invite',
  ro_team:'Team {x}',ro_empty_team:'Nobody',ro_bots_fill:'+ {n} bot(s)',ro_pending:'Pending invites',ro_start:'Start the match',ro_leave:'Leave',ro_close:'Close the room',ro_kick:'Remove',ro_swap:'Switch team',
  ro_started:'Match started: join the server from the lobby.',ro_inv_from:'{n} invites you to a private room',ro_join:'Join',ro_decline:'Decline',ro_joined:'You joined {n}’s room',ro_invited:'Invite sent to {n}',ro_owner:'Host',
  e_room_unknown:'This room no longer exists.',e_room_not_invited:'You are not invited to this room.',e_room_other:'You are already in another room: leave it first.',e_room_full:'The room is full (10 players).',e_room_already:'This player is already in the room.',
  e_room_started:'The match has already started.',e_room_team_size:'Too many players in one team for this mode.',e_room_team_empty:'Team A needs at least one player.',e_room_steam:'{n} must link their Steam account before playing.',e_room_in_match:'{n} is already in a match.'});
Object.assign(I18N.ru,{ro_title:'Приватная комната',ro_create:'Создать приватную комнату',ro_create_t:'Пригласи кого хочешь, выбери карту и играй даже вдвоём (пустые места займут боты).',
  ro_of:'Комната {n}',ro_mode:'Режим',ro_map:'Карта',ro_rounds:'Раунды',ro_bots:'Добавить ботов',ro_real:'Настоящий финал (ELO + дропы)',ro_invite_ph:'Ник игрока',ro_invite:'Пригласить',
  ro_team:'Команда {x}',ro_empty_team:'Никого',ro_bots_fill:'+ {n} бот(ов)',ro_pending:'Ожидают ответа',ro_start:'Начать матч',ro_leave:'Выйти',ro_close:'Закрыть комнату',ro_kick:'Убрать',ro_swap:'Сменить команду',
  ro_started:'Матч начался: заходи на сервер из лобби.',ro_inv_from:'{n} приглашает тебя в приватную комнату',ro_join:'Войти',ro_decline:'Отклонить',ro_joined:'Ты в комнате {n}',ro_invited:'Приглашение отправлено {n}',ro_owner:'Хост',
  e_room_unknown:'Этой комнаты больше нет.',e_room_not_invited:'Тебя не приглашали в эту комнату.',e_room_other:'Ты уже в другой комнате: сначала выйди из неё.',e_room_full:'Комната заполнена (10 игроков).',e_room_already:'Этот игрок уже в комнате.',
  e_room_started:'Матч уже начался.',e_room_team_size:'Слишком много игроков в одной команде для этого режима.',e_room_team_empty:'В команде A должен быть хотя бы один игрок.',e_room_steam:'{n} должен привязать Steam перед игрой.',e_room_in_match:'{n} уже в матче.'});

const RO={room:null,invites:[],busy:false,dev:false,last:0};
const roOn=()=>typeof realMM==='function'&&realMM();
const roErr=r=>{const k='e_'+r.error;return t(k)!==k?t(k,{n:r.name||''}):t('e_server_error')};
const roMap=x=>{const m=MAPS.find(m=>'de_'+m.slug===x||m.slug===String(x).replace('de_',''));return m?m.n:String(x).replace('de_','').replace(/^./,c=>c.toUpperCase())};
$('#rmTestBox').insertAdjacentHTML('afterend','<div id="rmRoom" class="ro-wrap" hidden></div>');

async function roCall(action,data={}){
  if(RO.busy)return null;RO.busy=true;
  const r=await fbCall('room',{action,...data});RO.busy=false;
  if(r.error){toast(roErr(r));return r}
  if(r.room!==undefined){RO.room=r.room;RO.invites=r.invites||RO.invites}
  roRender();return r;
}
function roRender(){
  const el=$('#rmRoom');if(!el)return;
  const sig=JSON.stringify([RO.room,RO.invites,RO.dev,lang,roOn()]);if(sig===RO.sig)return;RO.sig=sig;
  const R=RO.room,inv=RO.invites||[];
  if(!roOn()||(!R&&!inv.length&&!RO.dev)){el.hidden=true;return}
  el.hidden=false;
  const invHTML=!R?inv.map(i=>`<div class="ro-inv"><span>${t('ro_inv_from',{n:`<b>${escA(i.from)}</b>`})}</span><button class="btn sm primary" data-ro="join:${escA(i.rid)}">${t('ro_join')}</button><button class="btn sm ghost" data-ro="decline:${escA(i.rid)}">${t('ro_decline')}</button></div>`).join(''):'';
  if(!R){el.innerHTML=invHTML+(RO.dev?`<button class="btn ghost sm ro-new" data-ro="create" title="${escA(t('ro_create_t'))}">+ ${t('ro_create')}</button>`:'');return}
  const own=R.owner===R.me,open=R.status==='open',dis=own&&open?'':'disabled';
  const mem=Object.entries(R.members||{}).map(([u,m])=>({u,...m}));
  const teamCol=x=>{const list=mem.filter(m=>m.team===x),bots=R.bots?Math.max(0,R.size-list.length):0;
    return `<div class="ro-team"><h4>${t('ro_team',{x})} <small>${list.length}/${R.size}</small></h4>${list.length?list.map(m=>`<div class="ro-pl"><span>${escA(m.name)}${m.u===R.owner?` <em>${t('ro_owner')}</em>`:''}</span>${own&&open?`<button class="ro-ic" title="${t('ro_swap')}" data-ro="team:${escA(m.u)}:${x==='A'?'B':'A'}"><svg class="ic ico" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" width="14" height="14"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M304 48l112 112-112 112M398.87 160H96M208 464L96 352l112-112M114 352h302"/></svg></button>${m.u!==R.owner?`<button class="ro-ic" title="${t('ro_kick')}" data-ro="kick:${escA(m.u)}">×</button>`:''}`:''}</div>`).join(''):`<p class="m-hint">${t('ro_empty_team')}</p>`}${bots?`<p class="ro-bots">${t('ro_bots_fill',{n:bots})}</p>`:''}</div>`};
  const pending=Object.values(R.invited||{});
  el.innerHTML=`<div class="ro card"><div class="ro-h"><b>${t('ro_title')}</b><span>${t('ro_of',{n:escA(R.ownerName)})}</span>${R.status==='started'?`<span class="tk-st answered">${t('ro_started')}</span>`:''}</div>
    <div class="ro-set">
      <label>${t('ro_mode')}<select data-ros="mode" ${dis}><option value="ranked" ${R.mode==='ranked'?'selected':''}>5v5</option><option value="wingman" ${R.mode==='wingman'?'selected':''}>Wingman (2v2)</option><option value="duel" ${R.mode==='duel'?'selected':''}>Aim Arena (1v1)</option></select></label>
      <label>${t('ro_map')}<select data-ros="map" ${dis}>${R.pools[R.mode].map(x=>`<option value="${x}" ${R.map===x?'selected':''}>${escA(roMap(x))}</option>`).join('')}</select></label>
      <label>${t('ro_rounds')}<select data-ros="rounds" ${dis}>${[2,6,12,16,24,30].map(n=>`<option value="${n}" ${R.rounds===n?'selected':''}>${n}</option>`).join('')}</select></label>
      <label class="ro-ck"><input type="checkbox" data-ros="bots" ${R.bots?'checked':''} ${dis}> ${t('ro_bots')}</label>
      <label class="ro-ck"><input type="checkbox" data-ros="real" ${R.real?'checked':''} ${dis}> ${t('ro_real')}</label>
    </div>
    ${own&&open?`<div class="ro-invrow"><input type="text" id="roName" maxlength="25" placeholder="${t('ro_invite_ph')}"><button class="btn sm" data-ro="invite">${t('ro_invite')}</button></div>`:''}
    <div class="ro-teams">${teamCol('A')}${teamCol('B')}</div>
    ${pending.length?`<p class="m-hint">${t('ro_pending')} : ${pending.map(escA).join(', ')}</p>`:''}
    <div class="ro-act">${own&&open?`<button class="btn primary" data-ro="start">${t('ro_start')}</button>`:''}<button class="btn ghost sm" data-ro="leave">${own?t('ro_close'):t('ro_leave')}</button></div></div>`;
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('#rmRoom [data-ro]');if(!b)return;
  const [act,a1,a2]=b.dataset.ro.split(':'),R=RO.room;
  if(act==='create')return roCall('create',{mode:state.mode==='duel'?'duel':state.mode==='wingman'?'wingman':'ranked',lang});
  if(act==='join'){const r=await roCall('join',{rid:a1,lang});if(r&&!r.error&&r.room)toast(t('ro_joined',{n:r.room.ownerName}));return}
  if(act==='decline'){await fbCall('room',{action:'decline',rid:a1});RO.invites=RO.invites.filter(i=>i.rid!==a1);return roRender()}
  if(!R)return;
  if(act==='invite'){const n=$('#roName').value.trim();if(!n)return;const r=await roCall('invite',{rid:R.id,name:n});if(r&&!r.error)toast(t('ro_invited',{n}));return}
  if(act==='team')return roCall('team',{rid:R.id,uid:a1,team:a2});
  if(act==='kick')return roCall('kick',{rid:R.id,uid:a1});
  if(act==='leave'){await fbCall('room',{action:'leave',rid:R.id});RO.room=null;return roRender()}
  if(act==='start'){const r=await roCall('start',{rid:R.id});if(r&&r.ok){toast(t('ro_started'));if(typeof rmPoll==='function')rmPoll();roSync(true)}return}
});
document.addEventListener('change',e=>{
  const s=e.target.closest('#rmRoom [data-ros]');if(!s||!RO.room)return;
  const k=s.dataset.ros,v=s.type==='checkbox'?s.checked:k==='rounds'?+s.value:s.value;
  roCall('settings',{rid:RO.room.id,[k]:v});
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='roName')$('#rmRoom [data-ro="invite"]')?.click()});

async function roSync(force){
  if(!roOn()){RO.room=null;RO.invites=[];return roRender()}
  if(typeof amDev==='function')RO.dev=!!(await amDev());
  const [rid,inv]=await Promise.all([fbReq(`roomOf/${FBA.uid}`),fbReq(`roomInv/${FBA.uid}`)]);
  const hasInv=inv&&Object.keys(inv).length;
  if(!rid&&!hasInv){RO.room=null;RO.invites=[];return roRender()}
  if(force||rid||hasInv){const r=await fbCall('room',{action:'get'});if(!r.error){RO.room=r.room;RO.invites=r.invites||[]}}
  roRender();
}
setInterval(()=>{if(!document.hidden&&!$('#play').hidden&&!RO.busy&&!(document.activeElement&&document.activeElement.id==='roName'))roSync()},5000);
setTimeout(()=>roSync(),2500);
(()=>{const o=setLang;setLang=function(){const r=o.apply(this,arguments);roRender();return r}})();
