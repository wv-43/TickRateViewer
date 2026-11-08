/* =====================================================
 * TICKRATE - Inventaire des autres joueurs et échanges (trade.js)
 * - profil d'un joueur : bouton « Inventaire » -> ses objets (invPublic) ; on coche ce qu'on veut,
 *   ce qu'on donne, et on propose l'échange (tradeOffer)
 * - inventaire : bouton « Échanges » -> offres reçues (accepter / refuser) et envoyées (annuler)
 * Tout est vérifié et fait par le serveur (functions/lib/trades.js) : le site n'échange rien lui-même.
 * ===================================================== */
Object.assign(I18N.fr,{tr_inv:'Inventaire',tr_title:'Inventaire de {n}',tr_theirs:'Ses objets',tr_mine:'Tes objets',tr_pick_hint:'Coche ce que tu veux recevoir et ce que tu donnes en échange (10 objets max de chaque côté).',
  tr_give:'Tu donnes',tr_get:'Tu reçois',tr_send:'Proposer l’échange',tr_sent:'Offre envoyée à {n}',tr_none_theirs:'Aucun objet à échanger.',tr_none_mine:'Tu n’as aucun objet à donner.',tr_trades:'Échanges',
  tr_in:'Reçues',tr_out:'Envoyées',tr_empty_list:'Aucun échange pour l’instant. Ouvre le profil d’un joueur et clique sur « Inventaire » pour lui proposer un échange.',tr_from:'{n} te propose',tr_to:'Ton offre à {n}',tr_accept:'Accepter',tr_decline:'Refuser',tr_cancel:'Annuler',
  tr_st_pending:'En attente',tr_st_done:'Échangé',tr_st_declined:'Refusé',tr_st_cancelled:'Annulé',tr_st_failed:'Échoué',tr_st_processing:'En cours',tr_nothing:'rien',tr_done:'Échange effectué !',tr_value:'Valeur',tr_login:'Connecte-toi pour voir les inventaires et échanger.',
  e_tr_item:'Un objet n’est plus disponible (vendu, mis en vente ou déjà échangé).',e_tr_many:'Tu as déjà 5 offres en attente.',e_tr_empty:'Choisis au moins un objet.',e_tr_bad_target:'Joueur invalide.',e_tr_closed:'Cet échange est déjà terminé.',e_tr_unknown:'Échange introuvable.',e_player_not_found:'Joueur introuvable.'});
Object.assign(I18N.en,{tr_inv:'Inventory',tr_title:'{n}’s inventory',tr_theirs:'Their items',tr_mine:'Your items',tr_pick_hint:'Tick what you want to receive and what you give in return (up to 10 items on each side).',
  tr_give:'You give',tr_get:'You get',tr_send:'Send trade offer',tr_sent:'Offer sent to {n}',tr_none_theirs:'No items to trade.',tr_none_mine:'You have no items to give.',tr_trades:'Trades',
  tr_in:'Received',tr_out:'Sent',tr_empty_list:'No trades yet. Open a player’s profile and click “Inventory” to offer a trade.',tr_from:'{n} offers you',tr_to:'Your offer to {n}',tr_accept:'Accept',tr_decline:'Decline',tr_cancel:'Cancel',
  tr_st_pending:'Pending',tr_st_done:'Traded',tr_st_declined:'Declined',tr_st_cancelled:'Cancelled',tr_st_failed:'Failed',tr_st_processing:'Processing',tr_nothing:'nothing',tr_done:'Trade complete!',tr_value:'Value',tr_login:'Log in to view inventories and trade.',
  e_tr_item:'An item is no longer available (sold, listed or already traded).',e_tr_many:'You already have 5 pending offers.',e_tr_empty:'Pick at least one item.',e_tr_bad_target:'Invalid player.',e_tr_closed:'This trade is already closed.',e_tr_unknown:'Trade not found.',e_player_not_found:'Player not found.'});
Object.assign(I18N.ru,{tr_inv:'Инвентарь',tr_title:'Инвентарь {n}',tr_theirs:'Его предметы',tr_mine:'Твои предметы',tr_pick_hint:'Отметь, что хочешь получить и что отдаёшь взамен (до 10 предметов с каждой стороны).',
  tr_give:'Ты отдаёшь',tr_get:'Ты получаешь',tr_send:'Предложить обмен',tr_sent:'Предложение отправлено {n}',tr_none_theirs:'Нет предметов для обмена.',tr_none_mine:'Тебе нечего отдать.',tr_trades:'Обмены',
  tr_in:'Входящие',tr_out:'Исходящие',tr_empty_list:'Обменов пока нет. Открой профиль игрока и нажми «Инвентарь», чтобы предложить обмен.',tr_from:'{n} предлагает',tr_to:'Твоё предложение {n}',tr_accept:'Принять',tr_decline:'Отклонить',tr_cancel:'Отменить',
  tr_st_pending:'Ожидает',tr_st_done:'Обменяно',tr_st_declined:'Отклонено',tr_st_cancelled:'Отменено',tr_st_failed:'Не удалось',tr_st_processing:'Обработка',tr_nothing:'ничего',tr_done:'Обмен завершён!',tr_value:'Стоимость',tr_login:'Войди, чтобы смотреть инвентари и меняться.',
  e_tr_item:'Предмет больше недоступен (продан, выставлен или уже обменян).',e_tr_many:'У тебя уже 5 ожидающих предложений.',e_tr_empty:'Выбери хотя бы один предмет.',e_tr_bad_target:'Неверный игрок.',e_tr_closed:'Этот обмен уже завершён.',e_tr_unknown:'Обмен не найден.',e_player_not_found:'Игрок не найден.'});

const TR={target:null,theirs:[],want:new Set(),give:new Set(),busy:false,list:[],pendingIn:0};
const trOn=()=>typeof srvOn==='function'&&srvOn();
const trErr=c=>{const k='e_'+c;return t(k)!==k?t(k):t('e_server_error')};
const trVal=i=>EC.price(CDB,i).v;
document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="tradeModal" role="dialog" aria-modal="true" aria-labelledby="trTitle"><div class="modal tr-modal"><div class="m-h"><h3 id="trTitle">Échange d'objets</h3><button class="x2" data-close aria-label="Fermer">×</button></div><div id="trBody"></div></div></div>
<div class="overlay" id="tradesModal" role="dialog" aria-modal="true" aria-labelledby="trsTitle"><div class="modal tr-modal"><div class="m-h"><h3 id="trsTitle">Historique des échanges</h3><button class="x2" data-close aria-label="Fermer">×</button></div><div id="trsBody"></div></div></div>`);

function trItem(i,side,sel){
  const it=CDB.items[i.k],R=EC.RARITY[it.t];
  return `<button type="button" class="it-card tr-it ${sel?'on':''}" style="--rc:${R.c}" ${side?`data-trsel="${side}:${escA(i.id)}"`:''} title="${escA(EC.name(CDB,i))}">
    <span class="it-im">${imgTag(EC.img(CDB,i.k))}</span>${i.st?'<span class="st-b">ST™</span>':''}
    <b>${escA(EC.name(CDB,i))}</b><small>${EC.wearOf(i.f).n} · <span class="mono">${(+i.f).toFixed(4)}</span></small><small>${tcHTML(trVal(i))}</small></button>`;
}
const myTradable=()=>ECO.items.filter(i=>!i.listed&&!i.virtual&&i.src!=='steam');

// ---------- fenêtre d'échange depuis un profil ----------
async function openTrade(P){
  if(!trOn())return toast(t('tr_login'));
  TR.target={uid:P.uid,name:P.name};TR.want=new Set();TR.give=new Set();TR.theirs=[];
  $('#trTitle').textContent=t('tr_title',{n:P.name});$('#trBody').innerHTML='<p class="m-hint">…</p>';openModal('tradeModal');
  const r=await fbCall('invPublic',{uid:P.uid});
  if(r.error){$('#trBody').innerHTML=`<p class="m-hint">${trErr(r.error)}</p>`;return}
  TR.theirs=r.items||[];renderTrade();
}
function renderTrade(){
  const mine=myTradable(),sum=(arr,set)=>arr.filter(i=>set.has(i.id)).reduce((s,i)=>s+trVal(i),0);
  $('#trBody').innerHTML=`<p class="m-hint">${t('tr_pick_hint')}</p>
    <div class="tr-cols">
      <section><h4>${t('tr_theirs')} <small>${TR.want.size}/10</small></h4><div class="tr-grid">${TR.theirs.length?TR.theirs.map(i=>trItem(i,'w',TR.want.has(i.id))).join(''):`<p class="m-hint">${t('tr_none_theirs')}</p>`}</div></section>
      <section><h4>${t('tr_mine')} <small>${TR.give.size}/10</small></h4><div class="tr-grid">${mine.length?mine.map(i=>trItem(i,'g',TR.give.has(i.id))).join(''):`<p class="m-hint">${t('tr_none_mine')}</p>`}</div></section>
    </div>
    <div class="tr-foot"><span>${t('tr_give')} : <b>${TR.give.size}</b> · ${tcHTML(sum(mine,TR.give))}</span><span>${t('tr_get')} : <b>${TR.want.size}</b> · ${tcHTML(sum(TR.theirs,TR.want))}</span>
      <button class="btn primary" id="trSend" ${TR.give.size+TR.want.size?'':'disabled'}>${t('tr_send')}</button></div>`;
}

// ---------- liste des échanges ----------
async function loadTrades(){
  if(!trOn())return;
  const r=await fbCall('tradeList');if(r.error)return;
  TR.list=r.trades||[];TR.pendingIn=TR.list.filter(x=>!x.mine&&x.status==='pending').length;
  $$('[data-trades] .csi-cnt').forEach(e=>{e.textContent=TR.pendingIn;e.hidden=!TR.pendingIn});
}
function tradeRow(x){
  const side=(arr)=>arr&&arr.length?`<div class="tr-mini">${arr.map(i=>trItem(i,null,false)).join('')}</div>`:`<p class="m-hint">${t('tr_nothing')}</p>`;
  const youGive=x.mine?x.give:x.want,youGet=x.mine?x.want:x.give;
  const act=x.status!=='pending'?'':x.mine?`<button class="btn sm ghost" data-tract="cancel:${escA(x.id)}">${t('tr_cancel')}</button>`
    :`<button class="btn sm primary" data-tract="accept:${escA(x.id)}">${t('tr_accept')}</button><button class="btn sm ghost" data-tract="decline:${escA(x.id)}">${t('tr_decline')}</button>`;
  return `<div class="tr-row"><div class="tr-row-h"><b>${escA(x.mine?t('tr_to',{n:x.toName}):t('tr_from',{n:x.fromName}))}</b><span class="tk-st ${x.status==='done'?'answered':x.status==='pending'?'open':'closed'}">${t('tr_st_'+x.status)}</span><small>${new Date(x.at).toLocaleString(LOC[lang])}</small></div>
    <div class="tr-cols"><section><h4>${t('tr_give')}</h4>${side(youGive)}</section><section><h4>${t('tr_get')}</h4>${side(youGet)}</section></div>${act?`<div class="tr-acts">${act}</div>`:''}</div>`;
}
async function openTrades(){
  if(!trOn())return toast(t('tr_login'));
  $('#trsTitle').textContent=t('tr_trades');$('#trsBody').innerHTML='<p class="m-hint">…</p>';openModal('tradesModal');
  await loadTrades();renderTrades();
}
function renderTrades(){
  const inc=TR.list.filter(x=>!x.mine),out=TR.list.filter(x=>x.mine);
  $('#trsBody').innerHTML=TR.list.length?`${inc.length?`<h4 class="tr-sec">${t('tr_in')}</h4>${inc.map(tradeRow).join('')}`:''}${out.length?`<h4 class="tr-sec">${t('tr_out')}</h4>${out.map(tradeRow).join('')}`:''}`
    :`<p class="m-hint">${t('tr_empty_list')}</p>`;
}

document.addEventListener('click',async e=>{
  const s=e.target.closest('[data-trsel]');
  if(s){const [side,id]=s.dataset.trsel.split(/:(.*)/s),set=side==='w'?TR.want:TR.give;
    if(set.has(id))set.delete(id);else{if(set.size>=10)return toast(t('tu_full'));set.add(id)}
    return renderTrade()}
  if(e.target.closest('#trSend')&&!TR.busy){
    TR.busy=true;const b=$('#trSend');b.disabled=true;
    const r=await fbCall('tradeOffer',{to:TR.target.uid,give:[...TR.give],want:[...TR.want]});
    TR.busy=false;b.disabled=false;
    if(r.error)return toast(trErr(r.error));
    closeModal('tradeModal');toast(t('tr_sent',{n:TR.target.name}));beep(988,.08);return}
  const a=e.target.closest('[data-tract]');
  if(a&&!TR.busy){const [action,id]=a.dataset.tract.split(/:(.*)/s);TR.busy=true;a.disabled=true;
    const r=await fbCall('tradeRespond',{id,action});TR.busy=false;
    if(r.error){toast(trErr(r.error))}else if(r.status==='done'){toast(t('tr_done'));beep(784,.1);beep(1175,.16,.1);if(typeof seRefresh==='function')await seRefresh()}
    await loadTrades();renderTrades();return}
  const ti=e.target.closest('[data-tinv]');if(ti&&profileTarget)return openTrade(profileTarget);
  if(e.target.closest('[data-trades]'))return openTrades();
});

// bouton « Inventaire » sur le profil d'un vrai joueur (compte TICKRATE)
(()=>{const o=profileActions;profileActions=function(P){
  const h=o(P);if(!P||!P.uid||!trOn())return h;
  return h.replace('<div class="p-actions">',`<div class="p-actions"><button class="btn sm" data-tinv><svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" style="width:14px;height:14px"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M304 48l112 112-112 112M398.87 160H96M208 464L96 352l112-112M114 352h302"/></svg>${t('tr_inv')}</button>`);
}})();
// bouton « Échanges » dans l'inventaire (avec le nombre d'offres reçues en attente)
(()=>{const o=renderInventory;renderInventory=function(){
  o.apply(this,arguments);
  const nav=$('#inventory .csi-main');
  if(nav&&trOn()&&!nav.querySelector('[data-trades]')){nav.insertAdjacentHTML('beforeend',`<button data-trades>${t('tr_trades')}<span class="csi-cnt" ${TR.pendingIn?'':'hidden'}>${TR.pendingIn}</span></button>`);loadTrades()}
}})();

// offres reçues : vérifiées toutes les 30 s ; une nouvelle offre -> notification (toast, cloche, son) et pastille
Object.assign(I18N.fr,{tr_new:'{n} te propose un échange'});Object.assign(I18N.en,{tr_new:'{n} offers you a trade'});Object.assign(I18N.ru,{tr_new:'{n} предлагает обмен'});
const TR_SEEN=(()=>{try{return new Set(JSON.parse(localStorage.getItem('tr_seen_offers')||'[]'))}catch(e){return new Set()}})();
async function trPoll(){
  if(!trOn()||document.hidden)return;
  await loadTrades();
  const fresh=TR.list.filter(x=>!x.mine&&x.status==='pending'&&!TR_SEEN.has(x.id));
  for(const x of fresh){
    TR_SEEN.add(x.id);
    toast(t('tr_new',{n:x.fromName||'?'}));
    if(typeof notify==='function')notify('trade','tr_new',{n:x.fromName||'?'},'inventory');
  }
  if(fresh.length){if(typeof beep==='function'){beep(740,.08);beep(988,.12,.1)}try{localStorage.setItem('tr_seen_offers',JSON.stringify([...TR_SEEN].slice(-200)))}catch(e){}}
  if(!$('#tradesModal')?.classList.contains('on'))return;
  renderTrades();
}
setInterval(trPoll,30e3);setTimeout(trPoll,6e3);
// anciens comptes : le pseudo est réservé au compte à la connexion (retrouvé par les autres joueurs et les devs)
(()=>{let done=null;setInterval(()=>{if(trOn()&&done!==FBA.uid){done=FBA.uid;fbCall('claimOwnName')}},5000)})();
