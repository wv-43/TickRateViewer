Object.assign(I18N.fr,{
  se_locked:'Palier pas encore atteint.',se_need_pass:'Il faut le pass premium.',se_not_done:'Mission pas encore terminée.',se_imported:'Ton inventaire est maintenant enregistré sur ton compte TICKRATE.',se_owned:'Tu l\'as déjà.',se_gone:'Cette offre n\'est plus disponible.',se_err:'Action impossible ({e})',mk_real:'Joueur',
  it_co:'Conteneurs',co_title:'Unités de stockage (Conteneurs)',co_desc:'Stockez jusqu\'à 1 000 skins par conteneur pour organiser votre inventaire comme sur Steam.',co_create:'Nouveau conteneur',co_name_prompt:'Nom de l\'unité de stockage :',co_name_ph:'Ex: Couteaux & Gants, Collection Rouge...',co_empty:'Aucun conteneur. Créez votre première unité de stockage !',co_deposit:'Déposer des skins',co_retrieve:'Retirer vers l\'inventaire',co_rename:'Renommer',co_delete:'Supprimer',co_items_cnt:'{n} / {max} objets',co_val:'Valeur stockée',co_open:'Ouvrir le conteneur',co_deposit_btn:'Déposer dans ce conteneur',co_retrieve_btn:'Retirer sélection',co_retrieve_all:'Tout retirer',co_del_confirm:'Supprimer ce conteneur vide ?',co_del_not_empty:'Le conteneur doit être vide avant suppression.',co_dev_btn:'Pack Dev (+50 Caisses)',co_dev_pack_ok:'50 caisses ajoutées à votre inventaire développeur !',co_err_full:'Ce conteneur est plein (max 1 000).',co_err_not_empty:'Le conteneur doit être vide avant de pouvoir être supprimé.',co_err_max:'Limite maximale de 25 conteneurs atteinte.',iv_deposit_co:'Ranger dans un conteneur'
});
Object.assign(I18N.en,{
  se_locked:'Tier not reached yet.',se_need_pass:'You need the premium pass.',se_not_done:'Mission not finished yet.',se_imported:'Your inventory is now saved on your TICKRATE account.',se_owned:'You already own it.',se_gone:'This offer is no longer available.',se_err:'Action not possible ({e})',mk_real:'Player',
  it_co:'Storage Units',co_title:'Storage Units (Containers)',co_desc:'Store up to 1,000 skins per container to organize your inventory just like on Steam.',co_create:'New Storage Unit',co_name_prompt:'Storage unit name:',co_name_ph:'E.g.: Knives & Gloves, Red Collection...',co_empty:'No storage units yet. Create your first container!',co_deposit:'Deposit skins',co_retrieve:'Retrieve to inventory',co_rename:'Rename',co_delete:'Delete',co_items_cnt:'{n} / {max} items',co_val:'Stored Value',co_open:'Open Storage Unit',co_deposit_btn:'Deposit into this container',co_retrieve_btn:'Retrieve selection',co_retrieve_all:'Retrieve all',co_del_confirm:'Delete this empty storage unit?',co_del_not_empty:'The container must be empty before deletion.',co_dev_btn:'Dev Pack (+50 Cases)',co_dev_pack_ok:'50 cases added to your developer inventory!',co_err_full:'This container is full (max 1,000).',co_err_not_empty:'The container must be empty before deletion.',co_err_max:'Maximum limit of 25 storage units reached.',iv_deposit_co:'Deposit into storage unit'
});
Object.assign(I18N.ru,{
  se_locked:'Уровень ещё не достигнут.',se_need_pass:'Нужен премиум-пропуск.',se_not_done:'Миссия ещё не выполнена.',se_imported:'Твой инвентарь теперь сохранён в аккаунте TICKRATE.',se_owned:'Уже есть.',se_gone:'Предложение больше недоступно.',se_err:'Действие невозможно ({e})',mk_real:'Игрок',
  it_co:'Контейнеры',co_title:'Хранилища (Контейнеры)',co_desc:'Храните до 1 000 скинов в каждом контейнере, как в Steam.',co_create:'Новый контейнер',co_name_prompt:'Название контейнера:',co_name_ph:'Напр.: Ножи и перчатки...',co_empty:'Нет контейнеров. Создайте первое хранилище!',co_deposit:'Положить скины',co_retrieve:'Забрать в инвентарь',co_rename:'Переименовать',co_delete:'Удалить',co_items_cnt:'{n} / {max} предметов',co_val:'Стоимость',co_open:'Открыть хранилище',co_deposit_btn:'Положить сюда',co_retrieve_btn:'Забрать выбранное',co_retrieve_all:'Забрать всё',co_del_confirm:'Удалить это пустое хранилище?',co_del_not_empty:'Хранилище должно быть пустым перед удалением.',co_dev_btn:'Пак Dev (+50 кейсов)',co_dev_pack_ok:'50 кейсов добавлено в инвентарь разработчика!',co_err_full:'Контейнер переполнен (макс 1000).',co_err_not_empty:'Контейнер должен быть пустым перед удалением.',co_err_max:'Достигнут лимит в 25 контейнеров.',iv_deposit_co:'Спрятать в контейнер'
});

const SE={uid:null,busy:false,loaded:false,market:[],marketAt:0};
const srvOn=()=>typeof realMM==='function'&&realMM();
function seErr(e){
  if(e==='not_enough')return t('not_enough');
  if(e==='owned')return t('se_owned');
  if(e==='gone'||e==='sold'||e==='no_item'||e==='no_case'||e==='no_container')return t('se_gone');
  if(String(e).startsWith('tu_'))return t('tu_bad');
  if(e==='claimed')return t('claimed');
  if(e==='need_plus')return t('ms_lock');
  if(e==='locked')return t('se_locked');
  if(e==='need_pass')return t('se_need_pass');
  if(e==='not_done')return t('se_not_done');
  if(e==='container_full')return t('co_err_full');
  if(e==='not_empty')return t('co_err_not_empty');
  if(e==='max_containers')return t('co_err_max');
  return t('se_err',{e});
}

function seApply(st,map){
  if(map&&Object.keys(map).length){
    for(const w of Object.values(LOAD.w||{}))if(w&&w.iid&&map[w.iid])w.iid=map[w.iid];
    if(LOAD.cust)for(const [old,nw] of Object.entries(map))if(LOAD.cust[old]){LOAD.cust[nw]=LOAD.cust[old];delete LOAD.cust[old]}
    saveLoad();
  }
  const oldI=new Set(ECO.items.map(i=>i.id)),oldC=new Set(ECO.cases.map(c=>c.id));
  ECO.items=(st.items||[]).filter(x=>CDB.items[x.k]).map(x=>({id:x.id,k:x.k,f:x.f,s:x.s,st:!!x.st,src:x.src||'case',at:x.at||0,c:x.c||null,
    ...(x.listed?{listed:x.listed}:{}),new:SE.loaded&&!oldI.has(x.id)})).sort((a,b)=>b.at-a.at);
  ECO.cases=(st.cases||[]).filter(x=>CDB.cases.some(c=>c.id===String(x.c))).map(x=>({id:x.id,c:String(x.c),src:x.src||'drop',at:x.at||0,new:SE.loaded&&!oldC.has(x.id)}));
  ECO.pending=(st.pending||[]).filter(x=>CDB.items[x.k]).map(x=>({id:x.id,k:x.k,st:!!x.st,src:x.src||'drop',at:x.at||0}));
  SE.stc=st.stattrak||{};
  ECO.listings=ECO.items.filter(i=>i.listed).map(i=>i.id);
  ECO.containers=st.containers||[];
  SHOP.coins=st.coins||0;SHOP.skins=st.skins||[];SHOP.agents=st.agents||[];if(Array.isArray(st.cards))SHOP.cards=st.cards;if(Array.isArray(st.bgs))SHOP.bgs=st.bgs;SHOP.pass.prem=!!st.passPrem;
  let roleChanged=false;
  if(st.dev!==undefined&&!!ME.dev!==!!st.dev){ME.dev=!!st.dev;if(typeof ADM!=='undefined'){ADM.dev=!!st.dev;ADM.devUid=FBA.uid}roleChanged=true}
  if(st.beta!==undefined&&!!ME.beta!==!!st.beta){ME.beta=!!st.beta;roleChanged=true}
  if(st.plan&&ME.plan!==st.plan){ME.plan=st.plan;roleChanged=true}
  if(st.influencer!==undefined&&JSON.stringify(ME.influencer||null)!==JSON.stringify(st.influencer||null)){ME.influencer=st.influencer||null;roleChanged=true}
  if(st.missions){SE.mis=st.missions;SHOP.mis={day:st.missions.day,prog:st.missions.prog||{},got:st.missions.got||[],told:(SHOP.mis&&SHOP.mis.told)||[]}}
  if(st.pass){SHOP.pass.xp=st.pass.xp||0;SHOP.pass.claimed={f:st.pass.claimed.f||[],p:st.pass.claimed.p||[]}}
  if(typeof st.ladder==='number')SHOP.ladder=st.ladder;
  ecoSave();saveShop();renderWallet();if(typeof refreshEco==='function')refreshEco();
  if(typeof renderMissions==='function')renderMissions();
  if(roleChanged){
    if(typeof refreshMe==='function')refreshMe();
    if($('#shop')&&!$('#shop').hidden&&typeof renderShop==='function')renderShop();
    if($('#editModal')&&$('#editModal').classList.contains('on')&&typeof renderEditor==='function')renderEditor();
    if($('#compet')&&!$('#compet').hidden&&typeof renderCompet==='function')renderCompet();
    if($('#ranking')&&!$('#ranking').hidden&&typeof renderRanking==='function')renderRanking();
    if($('#profile')&&!$('#profile').hidden&&!profileTarget&&typeof renderProfile==='function')renderProfile();
  }
  SE.loaded=true;
}
async function seRefresh(){
  if(!srvOn())return;
  SE.refreshAt=Date.now();
  const st=await fbCall('ecoState');
  if(!st.error)seApply(st);
}
async function seLoad(){
  if(!srvOn()||SE.busy)return;
  SE.busy=true;SE.uid=FBA.uid;
  let st=await fbCall('ecoState');
  if(!st.error&&!st.imported){
    st=await fbCall('ecoImport',{items:ECO.items.map(i=>({id:i.id,k:i.k,f:i.f,s:i.s,st:!!i.st,at:i.at,c:i.c||null})),cases:ECO.cases.map(c=>({c:c.c})),
      pending:ECO.pending.map(p=>({k:p.k})),coins:SHOP.coins,skins:SHOP.skins,agents:SHOP.agents,cards:SHOP.cards||[],bgs:SHOP.bgs||[],passPrem:!!SHOP.pass.prem});
    if(!st.error)toast(t('se_imported'));
  }
  if(!st.error)seApply(st,st.map);else SE.uid=null;
  SE.busy=false;
}
setInterval(()=>{if(srvOn()&&SE.uid!==FBA.uid)seLoad()},3000);
setInterval(()=>{if(srvOn()&&SE.loaded&&!document.hidden)seRefresh()},300e3);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&srvOn()&&SE.loaded&&Date.now()-(SE.refreshAt||0)>120e3)seRefresh()});

(()=>{const tm=todayMissions;todayMissions=function(){return srvOn()&&SE.mis?SE.mis.ids:tm.apply(this,arguments)}})();
function rewardName(rw){
  if(!rw)return '';
  if(rw.type==='coins')return rw.n+' TC';
  if(rw.type==='case')return (CDB.cases.find(c=>c.id===rw.c)||{n:''}).n;
  if(rw.type==='skin')return EC.name(CDB,{k:rw.k,st:false});
  if(rw.type==='agent')return ((SKDB.agents.find(a=>a.def===rw.def)||{name:''}).name.split('|')[0]).trim();
  return '';
}

Object.assign(I18N.fr,{st_kills:'Kills confirmés',st_kills_n:'{n} kills',dv_title:'Réglages dev',dv_sub:'visible par les devs · appliqué en jeu à la prochaine apparition',dv_wear:'Usure (float)',dv_seed:'Pattern',dv_apply:'Appliquer',dv_done:'Objet modifié',e_no_item:'Objet introuvable.',e_bad_wear:'Usure invalide.'});
Object.assign(I18N.en,{st_kills:'Confirmed kills',st_kills_n:'{n} kills',dv_title:'Dev settings',dv_sub:'visible to devs · applied in game at next spawn',dv_wear:'Wear (float)',dv_seed:'Pattern',dv_apply:'Apply',dv_done:'Item updated',e_no_item:'Item not found.',e_bad_wear:'Invalid wear.'});
Object.assign(I18N.ru,{st_kills:'Подтверждённые убийства',st_kills_n:'{n} убийств',dv_title:'Настройки dev',dv_sub:'видно разработчикам · применяется в игре при следующем появлении',dv_wear:'Износ (float)',dv_seed:'Паттерн',dv_apply:'Применить',dv_done:'Предмет изменён',e_no_item:'Предмет не найден.',e_bad_wear:'Неверный износ.'});
const stKills=i=>(SE.stc||{})[String(i.id).replace(/[.#$/[\]]/g,'_').slice(0,40)]||0;
(()=>{const o=openItem;openItem=function(id){
  o.apply(this,arguments);
  const i=ECO.items.find(x=>x.id===id),box=$('#itemBody');if(!i||!box)return;
  const it=CDB.items[i.k];
  if(i.st)box.querySelector('.io-grid>div')?.insertAdjacentHTML('beforeend',`<div class="ir st-row"><span>StatTrak™ · ${t('st_kills')}</span><b class="mono">${t('st_kills_n',{n:stKills(i).toLocaleString(LOC[lang])})}</b></div>`);
  if(!srvOn()||!ME.dev||i.virtual||i.src==='steam')return;
  const mn=it.mn??0,mx=it.mx??1;
  box.insertAdjacentHTML('beforeend',`<div class="dv-box" data-dvid="${escA(i.id)}"><div class="adm-h"><b>${t('dv_title')}</b><small>${t('dv_sub')}</small></div>
    <label>${t('dv_wear')} <small class="mono">${mn.toFixed(2)} – ${mx.toFixed(2)}</small></label>
    <div class="dv-row"><input type="range" id="dvRange" min="${mn}" max="${mx}" step="0.0001" value="${i.f}"><input type="number" id="dvF" class="mono" min="${mn}" max="${mx}" step="0.000001" value="${i.f.toFixed(6)}"><span id="dvW">${EC.wearOf(i.f).n}</span></div>
    <div class="dv-row"><label>${t('dv_seed')} <input type="number" id="dvS" min="0" max="1000" value="${i.s}"></label>${it.st?`<label class="cust-st"><input type="checkbox" id="dvSt" ${i.st?'checked':''}> StatTrak™</label>`:''}<button class="btn sm primary" id="dvGo">${t('dv_apply')}</button></div></div>`);
}})();
document.addEventListener('input',e=>{
  if(e.target.id==='dvRange'){$('#dvF').value=(+e.target.value).toFixed(6);$('#dvW').textContent=EC.wearOf(+e.target.value).n}
  if(e.target.id==='dvF'){$('#dvRange').value=e.target.value;$('#dvW').textContent=EC.wearOf(+e.target.value||0).n}
});
document.addEventListener('click',async e=>{
  if(!e.target.closest('#dvGo'))return;
  const id=e.target.closest('[data-dvid]').dataset.dvid,b=$('#dvGo');b.disabled=true;
  const r=await fbCall('devItemEdit',{id,f:+$('#dvF').value,s:+$('#dvS').value,...($('#dvSt')?{st:$('#dvSt').checked}:{})});
  b.disabled=false;if(r.error)return toast(seErr(r.error));
  for(const w of Object.values(LOAD.w||{}))if(w&&w.iid===id){w.f=r.item.f;w.seed=r.item.s;w.st=!!r.item.st}
  saveLoad();await seRefresh();toast(t('dv_done'));openItem(id);
});

const DEVW_KEY='tr_devwear';
const devWearAll=()=>{try{return JSON.parse(localStorage.getItem(DEVW_KEY)||'{}')}catch(e){return {}}};
(()=>{const o=devItems;let done=false;devItems=function(){const l=o.apply(this,arguments);
  if(l.length&&!done){done=true;const ov=devWearAll();l.forEach(i=>{const x=ov[i.k];if(x){i.f=x.f;i.s=x.s}})}return l}})();
(()=>{const o=custRender;custRender=function(){
  o.apply(this,arguments);
  if(!CUST||CUST.picking||!draftCfg||!ME.dev||CUST.i.src==='steam')return;
  const i=CUST.i,it=CDB.items[i.k];if(!it)return;
  const mn=it.mn??0,mx=it.mx??1,d=draftCfg;
  if(d.devF==null){d.devF=i.f;d.devS=i.s}
  $('#custBody .cfg-act')?.insertAdjacentHTML('beforebegin',`<div class="dv-box"><div class="adm-h"><b>${t('dv_title')}</b><small>${t('dv_sub')}</small></div>
    <label>${t('dv_wear')} <small class="mono">${mn.toFixed(2)} – ${mx.toFixed(2)}</small></label>
    <div class="dv-row"><input type="range" id="dvRange" min="${mn}" max="${mx}" step="0.0001" value="${d.devF}"><input type="number" id="dvF" class="mono" min="${mn}" max="${mx}" step="0.000001" value="${(+d.devF).toFixed(6)}"><span id="dvW">${EC.wearOf(d.devF).n}</span></div>
    <div class="dv-row"><label>${t('dv_seed')} <input type="number" id="dvS" min="0" max="1000" value="${d.devS}"></label></div></div>`);
}})();
document.addEventListener('input',e=>{
  if(!draftCfg||!$('#custBody')?.contains(e.target))return;
  if(e.target.id==='dvRange'||e.target.id==='dvF')draftCfg.devF=+e.target.value;
  if(e.target.id==='dvS')draftCfg.devS=Math.max(0,Math.min(1000,Math.round(+e.target.value)||0));
});
(()=>{const o=custSave;custSave=async function(){
  const c=CUST,d=draftCfg;
  if(!c||!d||!ME.dev||d.devF==null||(d.devF===c.i.f&&d.devS===c.i.s))return o.apply(this,arguments);
  const i=c.i,it=CDB.items[i.k],f=Math.min(it.mx??1,Math.max(it.mn??0,+d.devF)),s=d.devS,W=itemW(i);
  o.apply(this,arguments);
  if(i.virtual){i.f=f;i.s=s;const ov=devWearAll();ov[i.k]={f,s};try{localStorage.setItem(DEVW_KEY,JSON.stringify(ov))}catch(e){}}
  else{const r=await fbCall('devItemEdit',{id:i.id,f,s});if(r.error)return toast(seErr(r.error));await seRefresh()}
  if(W&&LOAD.w[W.id]&&(LOAD.w[W.id].iid===i.id||LOAD.w[W.id].p===it.p)){LOAD.w[W.id].f=f;LOAD.w[W.id].seed=s;saveLoad()}
  renderInventory();
}})();

(()=>{const sp=spinCase;spinCase=async function(){
  if(!srvOn())return sp.apply(this,arguments);
  if(spinning)return;
  const cs=ECO.cases.find(x=>x.id===CASE_OPEN);if(!cs)return;
  spinning=true;
  const btn=$('#csAct button[data-spin]');
  if(btn){
    btn.disabled=true;
    btn.classList.add('loading');
    btn.innerHTML='<span class="spin inl"></span> '+(t('c_unlocking')||'Déverrouillage…');
  }
  const crate=$('#csStage .cs-crate');
  if(crate)crate.classList.add('opening');
  if(typeof caseUnlockSfx==='function')caseUnlockSfx();
  const r=await fbCall('openCase',{caseId:cs.id});
  spinning=false;
  if(r.error){
    if(btn){btn.disabled=false;btn.classList.remove('loading');btn.textContent=t('c_unlock')}
    if(crate)crate.classList.remove('opening');
    toast(seErr(r.error));return seRefresh();
  }
  const win={k:r.item.k,f:r.item.f,s:r.item.s,st:!!r.item.st,c:cs.c};
  const oc=EC.openCase,ai=addItem;
  EC.openCase=()=>win;
  addItem=()=>{const x={id:r.item.id,...win,src:'case',at:Date.now(),new:true};ECO.items.unshift(x);ecoSave();return x};
  try{sp.apply(this,arguments)}finally{EC.openCase=oc;addItem=ai}
}})();
(()=>{const bc=buyCase;buyCase=async function(cid,open){
  if(!srvOn())return bc.apply(this,arguments);
  const r=await fbCall('buyCase',{caseId:String(cid)});
  if(r.error)return toast(seErr(r.error));
  beep(988,.08);await seRefresh();
  if(open)return openCaseModal(r.caseId);
  toast(t('cs_bought',{x:(CDB.cases.find(c=>c.id===String(cid))||{n:''}).n}));
}})();

(()=>{const ts=tuSign;tuSign=async function(){
  if(!srvOn())return ts.apply(this,arguments);
  if(tuItems().length<TU_MAX)return toast(t('tu_need',{n:TU_MAX-tuItems().length}));
  const r=await fbCall('tradeUp',{ids:TU});
  if(r.error)return toast(seErr(r.error));
  TU=[];beep(784,.1);beep(1047,.14,.1);beep(1319,.2,.22);
  toast(t('tu_done',{x:EC.name(CDB,r.item)}));
  await seRefresh();invTab='all';invSort='new';invPage=0;renderInventory();
  if(typeof openItem==='function')openItem(r.item.id);
}})();

async function seMarket(){
  if(!srvOn()||Date.now()-SE.marketAt<15e3)return;
  SE.marketAt=Date.now();
  const m=(await fbReq('market'))||{};
  SE.market=Object.entries(m).filter(([,x])=>x&&x.item&&CDB.items[x.item.k]&&x.seller!==FBA.uid)
    .map(([id,x])=>({id,k:x.item.k,f:x.item.f,s:x.item.s,st:!!x.item.st,price:x.price,seller:x.sellerName||t('mk_real'),real:true}));
  if(!$('#shop').hidden&&shopTab==='market')renderShop();
}
setInterval(seMarket,20e3);
(()=>{const ml=marketList;marketList=function(){
  const npc=ml.apply(this,arguments);
  if(!srvOn())return npc;
  if(Date.now()-SE.marketAt>15e3)seMarket();
  return [...SE.market,...npc];
}})();

function seConfirm(title,html,yes,fn){confirmBox(title,html,yes,t('cancel'),fn)}
document.addEventListener('click',e=>{
  if(!srvOn())return;
  const stop=()=>{e.stopImmediatePropagation();e.preventDefault()};
  const q=e.target.closest('[data-iquick]');
  if(q){stop();const i=ECO.items.find(x=>x.id===q.dataset.iquick);if(!i)return;const n=Math.floor(val(i)*ECO_CFG.quick);
    return seConfirm(t('i_quick',{x:''}).replace(' · ',''),`${escA(EC.name(CDB,i))} → ${n.toLocaleString(LOC[lang])} TC`,'OK',async()=>{
      const r=await fbCall('quickSell',{itemId:i.id});if(r.error)return toast(seErr(r.error));
      unequipIf(i);closeModal('itemModal');toast(t('coins_added',{n:r.coins}));beep(988,.08);seRefresh()})}
  const sg=e.target.closest('[data-sellgo]');
  if(sg){stop();const i=ECO.items.find(x=>x.id===sg.dataset.sellgo),p=Math.max(ECO_CFG.minList,Math.round(+$('#sellP').value||0));if(!i)return;
    return fbCall('marketList',{itemId:i.id,price:p}).then(r=>{if(r.error)return toast(seErr(r.error));unequipIf(i);closeModal('itemModal');toast(t('sell_ok'));seRefresh()})}
  const ul=e.target.closest('[data-unlist]');
  if(ul){stop();const i=ECO.items.find(x=>x.id===ul.dataset.unlist);if(!i||!i.listed)return;
    return fbCall('marketCancel',{listingId:i.listed.lid}).then(async r=>{if(r.error)toast(seErr(r.error));await seRefresh();openItem(i.id)})}
  const mb=e.target.closest('[data-mkbuy]');
  if(mb){stop();const x=marketList().find(y=>y.id===mb.dataset.mkbuy);if(!x)return;
    return seConfirm(t('mk_buy'),`${escA(EC.name(CDB,x))} · ${x.price.toLocaleString(LOC[lang])} TC`,t('mk_buy'),async()=>{
      const r=x.real?await fbCall('marketBuy',{listingId:x.id}):await fbCall('buyNpc',{offerId:x.id});
      if(r.error){toast(seErr(r.error));SE.marketAt=0;return seMarket()}
      if(!x.real)ECO.bought.push(x.id);
      toast(t('mk_bought',{x:EC.name(CDB,x)}));beep(988,.08);SE.marketAt=0;await seRefresh();seMarket();renderShop()})}
  const w=e.target.closest('[data-wear]');
  if(w){stop();const [pid,wk]=w.dataset.wear.split(':');
    return fbCall('claimPending',{id:pid,wear:wk==='rand'?null:wk}).then(async r=>{if(r.error)return toast(seErr(r.error));closeModal('wearModal');toast(t('bought_toast',{x:EC.name(CDB,r.item)}));await seRefresh()})}
  const mc=e.target.closest('[data-mclaim]');
  if(mc){stop();return fbCall('claimMission',{id:mc.dataset.mclaim}).then(async r=>{if(r.error)return toast(seErr(r.error));
    toast(`+${r.xp} XP${r.coins?` · +${r.coins} TC`:''}`);beep(988,.08);await seRefresh()})}
  const pc=e.target.closest('[data-claim]');
  if(pc){stop();const [track,tier]=pc.dataset.claim.split(':');
    return fbCall('claimPass',{track,tier:+tier}).then(async r=>{if(r.error)return toast(seErr(r.error));
      toast(r.reward&&r.reward.type==='coins'?t('coins_added',{n:r.coins}):t('bought_toast',{x:rewardName(r.reward)}));beep(988,.08);await seRefresh();renderShop()})}
  const bs=e.target.closest('[data-buysk]'),ba=e.target.closest('[data-buyag]'),bp=e.target.closest('[data-buypass]'),bcard=e.target.closest('[data-buycard]');
  if(bs||ba||bp||bcard){stop();
    const cid=bcard?bcard.dataset.buycard:null;
    const cObj=cid&&typeof CARD_STYLES!=='undefined'?CARD_STYLES.find(x=>x.id===cid):null;
    const [kind,ref,name]=bs?['skin',bs.dataset.buysk,bs.dataset.buysk]:ba?['agent',+ba.dataset.buyag,(SKDB.agents.find(a=>a.def===+ba.dataset.buyag)||{name:''}).name.split('|')[0].trim()]:bcard?['card',cid,(cObj&&cObj.name)||cid]:['pass',null,t('pass_owned')];
    return fbCall('buyShop',{kind,ref}).then(async r=>{if(r.error)return toast(seErr(r.error));beep(988,.08);if(kind==='card'&&typeof equipCardStyle==='function'){if(!Array.isArray(SHOP.cards))SHOP.cards=[];if(!SHOP.cards.includes(cid))SHOP.cards.push(cid);equipCardStyle(cid,true)}toast(kind==='pass'?t('pass_owned'):t('bought_toast',{x:name}));await seRefresh();renderShop()})}
  const dp=e.target.closest('[data-dev-pack]');
  if(dp){stop();return seDevGrantCases(50)}
},true);

async function seContainerCreate(name){
  if(!srvOn())return {error:'offline'};
  const r=await fbCall('containerCreate',{name});
  if(r.error){toast(seErr(r.error));return r}
  toast(t('co_created'));await seRefresh();return r;
}
async function seContainerRename(containerId,name){
  if(!srvOn())return {error:'offline'};
  const r=await fbCall('containerRename',{containerId,name});
  if(r.error){toast(seErr(r.error));return r}
  await seRefresh();return r;
}
async function seContainerDeposit(containerId,itemIds){
  if(!srvOn())return {error:'offline'};
  const r=await fbCall('containerDeposit',{containerId,itemIds});
  if(r.error){toast(seErr(r.error));return r}
  toast(t('co_deposit_success',{n:r.count})||(r.count+' objet(s) déposé(s)'));await seRefresh();return r;
}
async function seContainerRetrieve(containerId,itemIds){
  if(!srvOn())return {error:'offline'};
  const r=await fbCall('containerRetrieve',{containerId,itemIds});
  if(r.error){toast(seErr(r.error));return r}
  toast(t('co_retrieve_success',{n:r.count})||(r.count+' objet(s) retiré(s)'));await seRefresh();return r;
}
async function seContainerDelete(containerId){
  if(!srvOn())return {error:'offline'};
  const r=await fbCall('containerDelete',{containerId});
  if(r.error){toast(seErr(r.error));return r}
  await seRefresh();return r;
}
async function seDevGrantCases(count=50){
  if(!srvOn())return {error:'offline'};
  const r=await fbCall('devGrantCases',{count});
  if(r.error){toast(seErr(r.error));return r}
  toast(t('co_dev_pack_ok'));await seRefresh();return r;
}
