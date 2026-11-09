const SKDB=window.SKIN_DB||{weapons:[],agents:[]};
const CATS=['pistol','rifle','smg','knife','gloves','agents'];
let LOAD={w:{},ag:{T:null,CT:null}};
try{const v=JSON.parse(localStorage.getItem('tr_loadout')||'null');if(v&&v.w&&v.ag)LOAD=v}catch(e){}
const saveLoad=()=>{try{localStorage.setItem('tr_loadout',JSON.stringify(LOAD))}catch(e){};if(typeof fbReq==='function')fbReq(`loadouts/${fbUserKey()}`,'PUT',{steamId:ME.steam&&ME.steam.id,user:ME.name,loadout:LOAD,updatedAt:Date.now()})};
let INV=null;
try{INV=JSON.parse(localStorage.getItem('tr_inv')||'null')}catch(e){}
if(!Array.isArray(INV)){
  INV=[];const pool=SKDB.weapons.filter(w=>w.cat!=='knife'&&w.cat!=='gloves');
  for(let i=0;i<14&&pool.length;i++){const w=pick(pool),sk=pick(w.skins);INV.push(w.id+':'+sk.p)}
  const k=SKDB.weapons.find(w=>w.cat==='knife');if(k)INV.push(k.id+':'+k.skins[Math.min(3,k.skins.length-1)].p);
  try{localStorage.setItem('tr_inv',JSON.stringify(INV))}catch(e){}
}
const owned=(wid,p)=>INV.includes(wid+':'+p);
const canUse=(wid,p)=>owned(wid,p)||boughtSkin(wid,p)||(typeof ecoOwns==='function'&&ecoOwns(wid,p))||(typeof devItems==='function'&&devItems().length>0)||(typeof betaOwns==='function'&&betaOwns(wid,p));
let lo={src:'inv',cat:'rifle',w:null,p:null,q:''},draftCfg=null;
const wearKey=f=>f<.07?'w_fn':f<.15?'w_mw':f<.38?'w_ft':f<.45?'w_ww':'w_bs';
const escA=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const imgTag=(src,ph,cls='')=>`<img class="${cls}" src="${src}" alt="" loading="lazy" referrerpolicy="no-referrer" data-fb="noimg">`;
function purgeLoadout(){
  for(const k of Object.keys(LOAD.w)){if(!canUse(k,LOAD.w[k].p))delete LOAD.w[k];else if(!stkPlus()&&Array.isArray(LOAD.w[k].stk))LOAD.w[k].stk=LOAD.w[k].stk.map((x,i)=>i===0?x:null)}
  for(const tm of ['T','CT'])if(LOAD.ag[tm]&&!hasPlan('premium')&&!boughtAgent(LOAD.ag[tm]))LOAD.ag[tm]=null;
  saveLoad();
}
function weaponOf(id){return SKDB.weapons.find(w=>w.id===id)}
function renderLoadout(){
  const el=$('#loadout');
  if(!SKDB.weapons.length){el.innerHTML='<div class="card">skins-data.js introuvable</div>';return}
  const totalCount = (typeof ECO!=='undefined'&&ECO&&ECO.items)?(ECO.items.length+ECO.cases.length):0;
  const navTabs = `
    <div class="inv-lo-tabs">
      <button class="inv-lo-tab" data-invlo="inventory">
        <svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M440.9 136.3a4 4 0 000-6.91L288.16 40.65a64.14 64.14 0 00-64.33 0L71.12 129.39a4 4 0 000 6.91L254 243.88a4 4 0 004.06 0zM54 163.51a4 4 0 00-6 3.49v173.89a48 48 0 0023.84 41.39L234 479.51a4 4 0 006-3.46V274.3a4 4 0 00-2-3.46zM272 275v201a4 4 0 006 3.46l162.15-97.23A48 48 0 00464 340.89V167a4 4 0 00-6-3.45l-184 108a4 4 0 00-2 3.45z"/></svg>
        <span>Mon Inventaire (Skins & Caisses)</span>
        ${totalCount ? `<span class="inv-lo-cnt">${totalCount}</span>` : ''}
      </button>
      <button class="inv-lo-tab on" data-invlo="loadout">
        <svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M503.58 126.2a16.85 16.85 0 00-27.07-4.55l-51.15 51.15a11.15 11.15 0 01-15.66 0l-22.48-22.48a11.17 11.17 0 010-15.67l50.88-50.89a16.85 16.85 0 00-5.27-27.4c-39.71-17-89.08-7.45-120 23.29-26.81 26.61-34.83 68-22 113.7a11 11 0 01-3.16 11.1L114.77 365.1a56.76 56.76 0 1080.14 80.18L357 272.08a11 11 0 0110.9-3.17c45 12 86 4 112.43-22 15.2-15 25.81-36.17 29.89-59.71 3.83-22.2 1.41-44.44-6.64-61z"/><path d="M437.33 378.41c-13.94-11.59-43.72-38.4-74.07-66.22l-66.07 70.61c28.24 30 53.8 57.85 65 70.88l.07.08A30 30 0 00383.72 464h1.1a30.11 30.11 0 0021-8.62l.07-.07 33.43-33.37a29.46 29.46 0 00-2-43.53zM118.54 214.55a20.48 20.48 0 00-3-10.76 2.76 2.76 0 012.62-4.22h.06c.84.09 5.33.74 11.7 4.61 4.73 2.87 18.23 12.08 41.73 35.54a34.23 34.23 0 007.22 22.12l66.23-61.55a33.73 33.73 0 00-21.6-9.2 2.65 2.65 0 01-.21-.26l-.65-.69-24.54-33.84a28.45 28.45 0 01-4-26.11 35.23 35.23 0 0111.78-16.35c5.69-4.41 18.53-9.72 29.44-10.62a52.92 52.92 0 0115.19.94 65.57 65.57 0 017.06 2.13 15.46 15.46 0 002.15.63 16 16 0 0016.38-25.06c-.26-.35-1.32-1.79-2.89-3.73a91.85 91.85 0 00-9.6-10.36c-8.15-7.36-29.27-19.77-57-19.77a123.13 123.13 0 00-46.3 9c-38.37 15.45-63.47 36.58-75.01 47.79l-.09.09A222.14 222.14 0 0063.7 129.5a27 27 0 00-4.7 11.77 7.33 7.33 0 01-7.71 6.17H50.2a20.65 20.65 0 00-14.59 5.9L6.16 182.05l-.32.32a20.89 20.89 0 00-.24 28.72c.19.2.37.39.57.58L53.67 258a21 21 0 0014.65 6 20.65 20.65 0 0014.59-5.9l29.46-28.79a20.51 20.51 0 006.17-14.76z"/></svg>
        <span>${t('lo_tab')}</span>
      </button>
    </div>`;
  const head=`<div class="lo-head"><div><h1 class="h1">${t('lo_title')}</h1><div class="lo-sub">${t('lo_sub')}</div></div>
    <div class="seg"><button class="${lo.src==='inv'?'on':''}" data-src="inv">${t('src_inv')}</button><button class="${lo.src==='cat'?'on':''}" data-src="cat">${hasPlan('plus')?'':LOCK.replace('<svg','<svg style="width:12px;height:12px"')} ${t('src_cat')}</button></div></div>`;
  const note=lo.cat==='agents'
    ?(hasPlan('premium')?`<div class="lo-note">${t('apply_hint')}</div>`:`<div class="lo-note lock">${LOCK.replace('<svg','<svg style="width:14px;height:14px;color:var(--acc)"')} ${t('agent_hint')}<button class="btn primary sm" data-go="premium">${t('unlock_prem')}</button></div>`)
    :lo.src==='inv'?`<div class="lo-note">${t('inv_hint')} · ${t('apply_hint')}</div>`
    :hasPlan('plus')?`<div class="lo-note">${t('cat_hint')} · ${t('apply_hint')}</div>`
    :`<div class="lo-note lock">${LOCK.replace('<svg','<svg style="width:14px;height:14px;color:var(--acc)"')} ${t('cat_hint')}<button class="btn primary sm" data-go="premium">${t('unlock_plus')}</button></div>`;
  const cats=`<div class="cats">${CATS.map(c=>`<button class="${lo.cat===c?'on':''}" data-cat="${c}">${t('cat_'+c)}</button>`).join('')}</div>`;
  el.innerHTML=navTabs+head+note+cats+(lo.cat==='agents'?agentsHTML():weaponsHTML());
}
function weaponsHTML(){
  const ws=SKDB.weapons.filter(w=>w.cat===lo.cat);
  if(!ws.find(w=>w.id===lo.w)){lo.w=ws[0].id;lo.p=null;draftCfg=null}
  const W=weaponOf(lo.w);
  const wl=ws.map(w=>{const eq=LOAD.w[w.id],sk=eq&&w.skins.find(x=>x.p===eq.p);
    return `<button class="wcard ${w.id===lo.w?'on':''}" data-w="${w.id}"><span class="th" data-ph="${escA(w.name)}">${sk?imgTag(sk.img):`<b style="font-size:12px;color:var(--dim)">${escA(w.name)}</b>`}</span><span><b>${escA(w.name)}</b><small>${sk?escA(sk.n):t('default_skin')}</small></span></button>`}).join('');
  let list=W.skins.filter(sk=>owned(W.id,sk.p)||boughtSkin(W.id,sk.p)||(typeof ecoOwns==='function'&&ecoOwns(W.id,sk.p)));
  if(lo.q)list=list.filter(sk=>sk.n.toLowerCase().includes(lo.q.toLowerCase()));
  const eq=LOAD.w[W.id];
  const grid=list.length?`<div class="skgrid">${list.map(sk=>`<button class="sk ${lo.p===sk.p?'on':''}" style="--rc:${sk.r}" data-p="${sk.p}">
      <span class="tg">${typeof ecoInst==='function'&&ecoInst(W.id,sk.p).length?`<span class="ow">×${ecoInst(W.id,sk.p).length}</span>`:owned(W.id,sk.p)?`<span class="ow">Steam</span>`:boughtSkin(W.id,sk.p)?`<span class="ow">${t('bought')}</span>`:''}${eq&&eq.p===sk.p?`<span class="eq">${t('equipped')}</span>`:''}</span>
      ${canUse(W.id,sk.p)?'':`<span class="lk">${LOCK}</span>`}
      <span class="im" data-ph="${escA(sk.n)}">${imgTag(sk.img)}</span><b>${escA(sk.n)}</b><small>${escA(sk.rn)}</small></button>`).join('')}</div>`
    :`<div class="card m-hint" style="margin:0">${lo.src==='inv'&&!lo.q?t('no_owned'):'—'}</div>`;
  const middle=`<div><div class="fld" style="margin:0 0 10px"><input type="text" id="skQ" placeholder="${t('search_skin')}" value="${escA(lo.q)}"></div>${grid}</div>`;
  return `<div class="lo-grid"><div class="wlist">${wl}</div>${middle}${cfgHTML(W)}</div>`;
}
const STDB=window.STICKER_DB||[];
const stkOf=id=>STDB.find(x=>x.id===id);
const STK_SLOTS=4;
const stkPlus=()=>hasPlan('plus')||(typeof devItems==='function'&&devItems().length>0);
const canSticker=W=>W&&W.cat!=='knife'&&W.cat!=='gloves'&&STDB.length>0;
const slotOpen=i=>i===0||stkPlus();
let stkSel=0,stkQ='',stkFx='all';
function stickersHTML(W,d){
  if(!canSticker(W))return '';
  if(!Array.isArray(d.stk))d.stk=Array(STK_SLOTS).fill(null);
  const plus=hasPlan('plus');
  const slots=d.stk.map((x,i)=>{const S=x&&stkOf(x.id);
    return `<button class="stk-slot ${S?'full':''} ${stkSel===i?'on':''}" data-slot="${i}" title="${S?escA(S.n):''}">${S?`<img src="${S.img}" alt="" data-fb="rm" style="opacity:${1-x.wr*.7}">`:'+'}${slotOpen(i)?'':`<span class="lk">${LOCK}</span>`}</button>`}).join('');
  const cx=d.stk[stkSel],CS=cx&&stkOf(cx.id);
  const sel=CS?`<div class="stk-sel"><b>${escA(CS.n)}</b><button class="btn ghost" data-stkdel>${t('stk_remove')}</button></div>
      <div class="fld" style="margin-top:6px"><label>${t('stk_scrape')} <b>${Math.round(cx.wr*100)} %</b></label><input type="range" id="stkWr" min="0" max="1" step="0.05" value="${cx.wr}"></div>`
    :`<div class="m-hint" style="margin-top:6px">${t('stk_empty')}${plus?'':` · ${t('stk_slot_plus')}`}</div>`;
  return `<div class="fld"><label>${t('stickers')} <b>${d.stk.filter(Boolean).length}/${STK_SLOTS}</b></label><div class="stk-slots">${slots}</div>${sel}</div>`;
}
function stkOverlay(d){
  if(!Array.isArray(d.stk))return '';
  const l=d.stk.map(x=>x&&stkOf(x.id)?`<img src="${stkOf(x.id).img}" alt="" data-fb="rm" style="opacity:${1-x.wr*.7}">`:'').join('');
  return l?`<div class="stk-ov">${l}</div>`:'';
}
function renderStkPicker(){
  const q=stkQ.trim().toLowerCase();
  const fx=[['all','stk_all'],['Holo','Holo'],['Foil','Foil'],['Gold','Gold'],['Other','stk_paper']];
  const list=STDB.filter(x=>(stkFx==='all'||x.fx===stkFx)&&(!q||x.n.toLowerCase().includes(q))).slice(0,240);
  $('#stkBody').innerHTML=`<div class="stk-tools"><input id="stkQ" placeholder="${t('stk_search')}" value="${escA(stkQ)}">
    <div class="seg">${fx.map(([k,l])=>`<button class="${stkFx===k?'on':''}" data-fx="${k}">${l.startsWith('stk_')?t(l):l}</button>`).join('')}</div></div>
    <div class="stk-grid">${list.length?list.map(x=>`<button class="stk-it" style="--rc:${x.r}" data-stk="${x.id}"><span class="im" data-ph="${escA(x.n)}">${imgTag(x.img)}</span><span>${escA(x.n)}</span><small>${escA(x.rn)}</small></button>`).join(''):'<div class="m-hint">—</div>'}</div>`;
}
$('#stkModal').addEventListener('click',e=>{
  const f=e.target.closest('[data-fx]');if(f){stkFx=f.dataset.fx;return renderStkPicker()}
  const it=e.target.closest('[data-stk]');
  if(it&&draftCfg){draftCfg.stk[stkSel]={id:+it.dataset.stk,wr:0};closeModal('stkModal');beep(660,.05);$('#custModal')?.classList.contains('on')?custRender():renderLoadout()}
});
$('#mmSort').addEventListener('change',e=>{mmSort=e.target.checked;try{localStorage.setItem('tr_mmsort',mmSort?'1':'0')}catch(_){}renderStats();toast(t(mmSort?'mm_sort':'mm_off'))});
$('#stkModal').addEventListener('input',e=>{if(e.target.id==='stkQ'){stkQ=e.target.value;const pos=e.target.selectionStart;renderStkPicker();const q=$('#stkQ');q.focus();q.setSelectionRange(pos,pos)}});

function cfgHTML(W){
  if(lo.p===null&&LOAD.w[W.id])lo.p=LOAD.w[W.id].p;
  const sk=W.skins.find(x=>x.p===lo.p);
  if(!sk)return `<div class="card skcfg"><div class="m-hint" style="margin:0">${t('select_skin')}</div></div>`;
  const eq=LOAD.w[W.id],isEq=eq&&eq.p===sk.p,plus=hasPlan('plus'),ok=canUse(W.id,sk.p);
  if(!draftCfg||draftCfg.w!==W.id||draftCfg.p!==sk.p){
    draftCfg=isEq?{...eq,w:W.id,stk:Array.isArray(eq.stk)?eq.stk.map(x=>x&&{...x}):Array(STK_SLOTS).fill(null)}:{w:W.id,p:sk.p,f:+(sk.min+(Math.min(sk.max,.15)-sk.min)*Math.random()).toFixed(4),seed:rnd(1,999),st:false,tag:'',team:'both',stk:Array(STK_SLOTS).fill(null)};stkSel=0;
  }
  const d=draftCfg,both=W.team==='both',ecoF=typeof ecoCfgFix==='function'?ecoCfgFix(W,sk):'';
  return `<div class="card skcfg" style="--rc:${sk.r}">
    <div class="big" data-ph="${escA(sk.n)}">${imgTag(sk.img)}${stkOverlay(d)}</div>
    <h3>${escA(W.name)} | ${escA(sk.n)}</h3><div class="rn">${escA(sk.rn)}</div>
    ${ecoF||`<div class="fld"><label>${t('wear')} <b>${d.f.toFixed(4)} · ${t(wearKey(d.f))}</b></label><input type="range" id="cfF" min="${sk.min}" max="${sk.max}" step="0.0001" value="${d.f}" disabled></div><div class="fld"><label>${t('seed')} <b>${d.seed}</b></label><input type="number" id="cfS" min="0" max="1000" value="${d.seed}" disabled></div>`}
    ${!ecoF&&sk.st?`<div class="fld"><label class="tog" style="justify-content:flex-start;text-transform:none;letter-spacing:0;font-family:var(--font-main);color:var(--text)"><input type="checkbox" id="cfT" ${d.st?'checked':''} disabled> StatTrak™ ${plus?'':`<span class="pb plus">PLUS</span>`}</label></div>`:''}
    <div class="fld"><label>${t('nametag')} ${plus?'':'<span class="pb plus">PLUS</span>'}</label><input type="text" id="cfN" maxlength="20" placeholder="${t('nametag_ph')}" value="${escA(d.tag)}" ${plus?'':'disabled'}></div>
    ${stickersHTML(W,d)}
    ${both?`<div class="fld"><label>${t('team_l')}</label><div class="seg">${['both','T','CT'].map(x=>`<button class="${d.team===x?'on':''}" data-team="${x}">${x==='both'?t('team_both'):x}</button>`).join('')}</div></div>`:''}
    <div class="cfg-act">${ok
      ?(isEq?`<button class="btn primary" data-equip>${t('equip')}</button><button class="btn ghost" data-unequip>${t('unequip')}</button>`:`<button class="btn primary" data-equip>${t('equip')}</button>`)
      :`<button class="btn primary" data-go="premium">${LOCK.replace('<svg','<svg style="width:14px;height:14px"')} ${t('unlock_plus')}</button>`}</div>
  </div>`;
}
function agentsHTML(){
  const prem=hasPlan('premium');
  const col=team=>{const list=SKDB.agents.filter(a=>a.team===team);
    return `<div><div class="label">${t('agent_'+team)}</div><div class="ag-grid">${list.map(a=>`<button class="sk ${LOAD.ag[team]===a.def?'on':''}" style="--rc:${a.r}" data-ag="${a.def}" data-team-ag="${team}">
      <span class="tg">${LOAD.ag[team]===a.def?`<span class="eq">${t('equipped')}</span>`:''}${boughtAgent(a.def)?`<span class="ow">${t('bought')}</span>`:''}</span>${prem||boughtAgent(a.def)?'':`<span class="lk">${LOCK}</span>`}
      <span class="im" data-ph="${escA(a.name.split('|')[0])}">${imgTag(a.img)}</span><b>${escA(a.name.split('|')[0].trim())}</b><small>${escA((a.name.split('|')[1]||'').trim())}</small></button>`).join('')}</div></div>`};
  return `<div class="ag-cols">${col('T')}${col('CT')}</div>`;
}
$('#loadout').addEventListener('click',e=>{
  const g=e.target.closest('[data-go]');if(g)return setView(g.dataset.go);
  const sr=e.target.closest('[data-src]');if(sr){lo.src=sr.dataset.src;lo.p=null;draftCfg=null;return renderLoadout()}
  const c=e.target.closest('[data-cat]');if(c){lo.cat=c.dataset.cat;lo.w=null;lo.p=null;lo.q='';draftCfg=null;return renderLoadout()}
  const w=e.target.closest('[data-w]');if(w){lo.w=w.dataset.w;lo.p=null;draftCfg=null;return renderLoadout()}
  const sk=e.target.closest('[data-p]');if(sk){lo.p=+sk.dataset.p;draftCfg=null;return renderLoadout()}
  const tm=e.target.closest('[data-team]');if(tm&&draftCfg){draftCfg.team=tm.dataset.team;return renderLoadout()}
  const sl=e.target.closest('[data-slot]');
  if(sl&&draftCfg){const i=+sl.dataset.slot;if(!slotOpen(i)){toast(t('stk_slot_plus'));return setView('premium')}
    stkSel=i;if(!draftCfg.stk[i]){renderStkPicker();openModal('stkModal');setTimeout(()=>$('#stkQ')&&$('#stkQ').focus(),50)}return renderLoadout()}
  if(e.target.closest('[data-stkdel]')&&draftCfg){draftCfg.stk[stkSel]=null;return renderLoadout()}
  if(e.target.closest('[data-equip]')&&draftCfg){
    const W=weaponOf(draftCfg.w),sk=W.skins.find(x=>x.p===draftCfg.p);
    if(!canUse(W.id,sk.p))return setView('premium');
    const {w,...cfg}=draftCfg;if(!stkPlus()){cfg.st=false;cfg.tag='';if(Array.isArray(cfg.stk))cfg.stk=cfg.stk.map((x,i)=>i===0?x:null)}
    if(!canSticker(W))delete cfg.stk;
    LOAD.w[W.id]=cfg;saveLoad();toast(t('equipped_toast',{x:`${W.name} | ${sk.n}`}));beep(880,.06);return renderLoadout();
  }
  if(e.target.closest('[data-unequip]')&&draftCfg){delete LOAD.w[draftCfg.w];saveLoad();draftCfg=null;toast(t('unequipped_toast'));return renderLoadout()}
  const ag=e.target.closest('[data-ag]');
  if(ag){
    const team=ag.dataset.teamAg,def=+ag.dataset.ag;
    if(!hasPlan('premium')&&!boughtAgent(def)){toast(t('need_prem'));return setView('premium')}LOAD.ag[team]=LOAD.ag[team]===def?null:def;saveLoad();
    const a=SKDB.agents.find(x=>x.def===def);if(LOAD.ag[team])toast(t('equipped_toast',{x:a.name.split('|')[0].trim()}));
    return renderLoadout();
  }
});
$('#loadout').addEventListener('input',e=>{
  if(!draftCfg)return;
  if(e.target.id==='cfF'){draftCfg.f=+(+e.target.value).toFixed(4);const l=e.target.previousElementSibling.querySelector('b');if(l)l.textContent=`${draftCfg.f.toFixed(4)} · ${t(wearKey(draftCfg.f))}`}
  if(e.target.id==='cfS'){draftCfg.seed=Math.max(0,Math.min(1000,+e.target.value||0));const l=e.target.previousElementSibling.querySelector('b');if(l)l.textContent=draftCfg.seed}
  if(e.target.id==='cfT')draftCfg.st=e.target.checked;
  if(e.target.id==='cfN')draftCfg.tag=e.target.value.slice(0,20);
  if(e.target.id==='stkWr'&&draftCfg.stk[stkSel]){draftCfg.stk[stkSel].wr=+e.target.value;const l=e.target.previousElementSibling.querySelector('b');if(l)l.textContent=Math.round(draftCfg.stk[stkSel].wr*100)+' %';const ov=$('.stk-ov');if(ov)ov.outerHTML=stkOverlay(draftCfg)}
  if(e.target.id==='skQ'){lo.q=e.target.value;const pos=e.target.selectionStart;renderLoadout();const q=$('#skQ');q.focus();q.setSelectionRange(pos,pos)}
});

