let SHOP={coins:1200,skins:[],agents:[],cards:[],pass:{xp:2350,prem:false,claimed:{f:[],p:[]}},ladder:420};
try{const v=JSON.parse(localStorage.getItem('tr_shop')||'null');if(v&&typeof v.coins==='number')SHOP=Object.assign(SHOP,v);if(!Array.isArray(SHOP.cards))SHOP.cards=[]}catch(e){}
const saveShop=()=>{try{localStorage.setItem('tr_shop',JSON.stringify(SHOP))}catch(e){}};
const tcHTML=n=>`<span class="tcv"><span class="tc">T</span>${Number(n).toLocaleString(LOC[lang])}</span>`;
const boughtSkin=(wid,p)=>SHOP.skins.includes(wid+':'+p);
const boughtAgent=def=>SHOP.agents.includes(def)||(typeof devItems==='function'&&devItems().length>0);
const PRICE_R={'Consumer Grade':100,'Industrial Grade':120,'Mil-Spec Grade':150,'Restricted':300,'Classified':600,'Covert':1200,'Extraordinary':1200,'Contraband':2500,'Distinguished':400,'Exceptional':600,'Superior':900,'Master':1400};
const skinPrice=(W,sk)=>W.cat==='knife'?4000:W.cat==='gloves'?3500:(PRICE_R[sk.rn]||300);
const agentPrice=a=>PRICE_R[a.rn]||900;
function renderWallet(){const w=$('#wallet');if(w)w.innerHTML=tcHTML(SHOP.coins)}
function spend(n){if(SHOP.coins<n){toast(t('not_enough'));shopTab='coins';setView('shop');return false}SHOP.coins-=n;saveShop();renderWallet();return true}
function seeded(seed){let x=seed%2147483647;if(x<=0)x+=2147483646;return()=>(x=x*16807%2147483647)/2147483647}
let shopTab='feat';
function featured(){
  const day=Math.floor(Date.now()/864e5),r=seeded(day*97+13),list=[];
  const ws=SKDB.weapons.filter(w=>w.cat!=='knife'&&w.cat!=='gloves');
  for(let i=0;i<10;i++){const W=ws[Math.floor(r()*ws.length)],c=W.skins.filter(x=>x.p>0);const sk=c[Math.floor(r()*c.length)];if(sk&&!list.some(x=>x.W===W&&x.sk===sk))list.push({W,sk})}
  const ag=[0,1].map(()=>SKDB.agents[Math.floor(r()*SKDB.agents.length)]);
  return {list,ag};
}
function untilMidnight(){const n=new Date(),m=new Date(n);m.setHours(24,0,0,0);const s=Math.floor((m-n)/1000);return `${Math.floor(s/3600)} h ${String(Math.floor(s%3600/60)).padStart(2,'0')}`}
const PASS_TIERS=30,XP_TIER=1000,PASS_PRICE=950;
const PASS=(()=>{const r=seeded(4242),out=[];const NORMAL=['Mil-Spec Grade','Restricted','Classified'];const ws=SKDB.weapons.filter(w=>w.cat!=='knife'&&w.cat!=='gloves').map(w=>({...w,skins:w.skins.filter(x=>NORMAL.includes(x.rn))})).filter(w=>w.skins.length);
  for(let i=1;i<=PASS_TIERS;i++){
    const f=i%3===0?(i%10===0?{type:'skin',...(()=>{const W=ws[Math.floor(r()*ws.length)];return {w:W.id,p:W.skins[Math.floor(r()*W.skins.length)].p}})()}:{type:'coins',n:100+i*5}):null;
    let pr;
    if(i===30){const K=SKDB.weapons.find(w=>w.id==='bayonet'),sk=K&&(K.skins.find(x=>x.n==='Night')||K.skins[1]);pr={type:'skin',w:K.id,p:sk.p}}
    else if(i===15)pr={type:'agent',def:SKDB.agents[Math.floor(r()*SKDB.agents.length)].def};
    else if(i%2===0){const W=ws[Math.floor(r()*ws.length)];pr={type:'skin',w:W.id,p:W.skins[Math.floor(r()*W.skins.length)].p}}
    else pr={type:'coins',n:150};
    out.push({tier:i,f,p:pr});
  }return out})();
const passLevel=()=>Math.min(PASS_TIERS,Math.floor(SHOP.pass.xp/XP_TIER));
function rewardHTML(rw){
  if(rw.type==='coins')return `<span class="cn">${tcHTML(rw.n)}</span>`;
  if(rw.type==='skin'){const W=weaponOf(rw.w),sk=W&&W.skins.find(x=>x.p===rw.p);return sk?`<span class="im" data-ph="${escA(sk.n)}">${imgTag(sk.img)}</span><span>${escA(W.name)} | ${escA(sk.n)}</span>`:''}
  if(rw.type==='agent'){const a=SKDB.agents.find(x=>x.def===rw.def);return a?`<span class="im" data-ph="${escA(a.name)}">${imgTag(a.img)}</span><span>${t('r_agent')} · ${escA(a.name.split('|')[0].trim())}</span>`:''}
  return '';
}
function grant(rw){
  if(rw.type==='coins'){SHOP.coins+=rw.n;toast(t('coins_added',{n:rw.n}))}
  if(rw.type==='skin'){const k=rw.w+':'+rw.p;if(!SHOP.skins.includes(k))SHOP.skins.push(k);const W=weaponOf(rw.w),sk=W.skins.find(x=>x.p===rw.p);toast(t('bought_toast',{x:`${W.name} | ${sk.n}`}))}
  if(rw.type==='agent'){if(!SHOP.agents.includes(rw.def))SHOP.agents.push(rw.def);const a=SKDB.agents.find(x=>x.def===rw.def);toast(t('bought_toast',{x:a.name.split('|')[0].trim()}))}
  saveShop();renderWallet();
}
function renderShop(){
  const el=$('#shop');
  const head=`<div class="sh-head"><div><h1 class="h1">${t('nav_shop')}</h1><div class="lo-sub">${t('shop_hint')}</div></div><span class="pill" style="font-size:15px;padding:6px 10px">${t('wallet')} : <b>${tcHTML(SHOP.coins)}</b></span></div>
    <div class="cats">${[
      ['feat',t('shop_feat')||'À la une'],
      ['bgs',t('shop_bgs')||'Fonds de profil'],
      ['cards',t('shop_cards')||'Cartes de profil'],
      ['pass',t('shop_pass')||'Battle Pass'],
      ['coins',t('shop_coins')||'Pièces']
    ].map(([k,label])=>`<button class="${shopTab===k?'on':''}" data-stab="${k}">${label}</button>`).join('')}</div>`;
  let body='';
  if(shopTab==='feat'){
    const {list,ag}=featured();
    const card=(o)=>{const own=o.agent?boughtAgent(o.agent.def):boughtSkin(o.W.id,o.sk.p)||owned(o.W.id,o.sk.p);
      const name=o.agent?o.agent.name.split('|')[0].trim():`${o.W.name} | ${o.sk.n}`,rc=o.agent?o.agent.r:o.sk.r,img=o.agent?o.agent.img:o.sk.img,rn=o.agent?`${t('r_agent')} · ${o.agent.rn}`:o.sk.rn,price=o.agent?agentPrice(o.agent):skinPrice(o.W,o.sk);
      return `<div class="item" style="--rc:${rc}"><span class="im" data-ph="${escA(name)}">${imgTag(img)}</span><div class="bd"><b title="${escA(name)}">${escA(name)}</b><small>${escA(rn)}</small>
        <div class="pr">${tcHTML(price)}</div>${own?`<button class="btn" disabled>${t('bought')}</button>`:`<button class="btn primary" ${o.agent?`data-buyag="${o.agent.def}"`:`data-buysk="${o.W.id}:${o.sk.p}"`}>${t('buy')}</button>`}</div></div>`};
    const promoBanner=`<div class="sh-promo-banner" data-stab="bgs">
      <div class="sh-pb-content">
        <h2>Fonds de profil et cartes CS:GO</h2>
        <p>Personnalise ton profil avec des arrière-plans et des cartes thématiques pour habiller ton identité sur toute la plateforme.</p>
        <div class="sh-pb-actions">
          <button class="btn primary" data-stab="bgs">${t('sh_open_bgs')||'Fonds de profil'}</button>
          <button class="btn ghost" data-stab="cards">${t('sh_open_cards')||'Cartes de profil'}</button>
        </div>
      </div>
    </div>`;
    body=promoBanner+`${hasPlan('plus')?'':`<div class="kg-band"><span><b>${t('shop_kg')}</b>${t('shop_kg_t')}</span><button class="btn primary" data-goplus>${t('see_plus')}</button></div>`}<div class="lo-note">${t('refresh_in',{x:untilMidnight()})}</div><div class="sh-grid">${list.map(card).join('')}${ag.map(a=>card({agent:a})).join('')}</div>`;
  }else if(shopTab==='cards'){
    body=typeof shopCardsHTML==='function'?shopCardsHTML():'';
  }else if(shopTab==='bgs'){
    body=typeof shopBgsHTML==='function'?shopBgsHTML():'';
  }else if(shopTab==='pass'){
    const lv=passLevel(),xpIn=SHOP.pass.xp%XP_TIER;
    const tier=T=>{const reached=T.tier<=lv;
      const cell=(rw,track)=>{if(!rw)return `<div class="rw" style="opacity:.25">—</div>`;
        const done=SHOP.pass.claimed[track].includes(T.tier),locked=!reached||(track==='p'&&!SHOP.pass.prem);
        return `<div class="rw ${track==='p'?'prem':''} ${done?'done':''}">${locked?`<span class="lk">${LOCK}</span>`:''}${rewardHTML(rw)}${done?`<span>${t('claimed')}</span>`:(!locked?`<button class="btn primary" data-claim="${track}:${T.tier}">${t('claim')}</button>`:'')}</div>`};
      return `<div class="tier ${reached?'reached':''}"><div class="tn">${T.tier}</div>${cell(T.f,'f')}${cell(T.p,'p')}</div>`};
    body=`<div class="card"><div class="pass-top"><div><div class="label" style="margin:0">${t('pass_season',{n:PASS_TIERS})}</div>
        <div class="pass-lv">${t('pass_tier',{n:lv})}</div>
        <div class="lvlbar" style="max-width:520px"><div class="row"><span>${xpIn} / ${XP_TIER} XP</span><span>${t('pass_tier',{n:Math.min(PASS_TIERS,lv+1)})}</span></div><div class="bar"><i style="width:${xpIn/XP_TIER*100}%"></i></div></div>
        <div class="m-hint">${t('pass_hint')}</div></div>
        <div>${SHOP.pass.prem?`<span class="pb premium" style="font-size:13px;padding:6px 10px">${t('pass_owned')}</span>`:`<button class="btn primary" data-buypass>${t('pass_buy',{x:PASS_PRICE})}</button>`}</div></div>
      <div class="track">${PASS.map(tier).join('')}</div>
      <div class="rw-lbl">▲ ${t('pass_free')} · ▼ ${t('pass_prem')}</div></div>`;
  }else{
    const packs=[[500,4.99,0],[1100,9.99,10],[2400,19.99,20],[6500,49.99,30]];
    const csBanner=typeof PAYMENTS_COMING_SOON!=='undefined'&&PAYMENTS_COMING_SOON ? `
      <div class="card pay-cs-banner" style="margin:0 0 20px;border:1px solid rgba(255,171,26,.3);background:linear-gradient(90deg,rgba(255,171,26,.08),transparent 80%);display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.05)">
        <svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" width="22" height="22" style="flex:none"><path d="M256 56C145.72 56 56 145.72 56 256s89.72 200 200 200 200-89.72 200-200S366.28 56 256 56zm0 82a26 26 0 11-26 26 26 26 0 0126-26zm48 226h-88a16 16 0 010-32h28v-88h-16a16 16 0 010-32h32a16 16 0 0116 16v104h28a16 16 0 010 32z"/></svg>
        <div style="font-size:13px;line-height:1.45;color:#cfd3dc"><b style="color:#fff">${t('pay_cs_title')} :</b> ${t('pay_cs_coins_desc')}</div>
      </div>` : '';
    const btnFor=(n,e)=>typeof PAYMENTS_COMING_SOON!=='undefined'&&PAYMENTS_COMING_SOON
      ?`<button class="btn ghost" data-coming-soon="pack" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;width:100%"><span style="width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.85;display:inline-block"></span>${t('coming_soon')}</button>`
      :`<button class="btn primary" data-pack="${n}:${e}">${eur(e)}</button>`;
    body=`${csBanner}<div class="packs">${packs.map(([n,e,b])=>`<div class="pack"><div class="n">${tcHTML(n)}</div><div class="bn">${b?t('bonus',{n:b}):''}</div>${btnFor(n,e)}</div>`).join('')}</div>
      <div class="m-hint" style="margin-top:14px">${typeof PAYMENTS_COMING_SOON!=='undefined'&&PAYMENTS_COMING_SOON?t('pay_cs_free_hint'):t('secure')}</div>`;
  }
  el.innerHTML=head+body;
}
let coPack=null;
$('#shop').addEventListener('click',e=>{
  const cs=e.target.closest('[data-coming-soon]');if(cs)return toast(t('pay_coming_soon'));
  if(e.target.closest('[data-goplus]'))return setView('premium');
  const tb=e.target.closest('[data-stab]');if(tb){shopTab=tb.dataset.stab;return renderShop()}
  const bs=e.target.closest('[data-buysk]');
  if(bs){const [w,p]=bs.dataset.buysk.split(':'),W=weaponOf(w),sk=W.skins.find(x=>x.p===+p);if(!spend(skinPrice(W,sk)))return;SHOP.skins.push(w+':'+p);saveShop();toast(t('bought_toast',{x:`${W.name} | ${sk.n}`}));beep(988,.08);return renderShop()}
  const ba=e.target.closest('[data-buyag]');
  if(ba){const a=SKDB.agents.find(x=>x.def===+ba.dataset.buyag);if(!spend(agentPrice(a)))return;SHOP.agents.push(a.def);saveShop();toast(t('bought_toast',{x:a.name.split('|')[0].trim()}));beep(988,.08);return renderShop()}
  if(e.target.closest('[data-buypass]')){if(!spend(PASS_PRICE))return;SHOP.pass.prem=true;saveShop();toast(t('pass_owned'));return renderShop()}
  const cl=e.target.closest('[data-claim]');
  if(cl){const [track,tier]=cl.dataset.claim.split(':'),T=PASS[+tier-1];if(SHOP.pass.claimed[track].includes(+tier))return;SHOP.pass.claimed[track].push(+tier);grant(track==='f'?T.f:T.p);return renderShop()}
  const pk=e.target.closest('[data-pack]');
  if(pk){
    if(typeof PAYMENTS_COMING_SOON!=='undefined'&&PAYMENTS_COMING_SOON)return toast(t('pay_coming_soon'));
    const [n,eu]=pk.dataset.pack.split(':');coPack=+n;coPlan=null;
    $('#coBody').innerHTML=`<div class="co-line"><span>${t('shop_coins')}</span><b>${tcHTML(n)}</b></div><div class="co-line" style="border:none"><span>${t('total')}</span><span class="co-total">${eur(+eu)}</span></div><div class="m-hint">${t('secure')}</div>`;
    const b=$('#coPay');b.disabled=false;b.textContent=t('pay');openModal('checkoutModal')}
});
let rkTab='elo',ladBracket=null;
const LADDER_BRACKETS=[
  {id:'b9_10',name:'Palier Master · Niv. 9 – 10',minL:9,maxL:10,eloTxt:'1851+ ELO',mult:1.0},
  {id:'b6_8',name:'Palier Diamond · Niv. 6 – 8',minL:6,maxL:8,eloTxt:'1401 – 1850 ELO',mult:0.75},
  {id:'b4_5',name:'Palier Gold · Niv. 4 – 5',minL:4,maxL:5,eloTxt:'1101 – 1400 ELO',mult:0.55},
  {id:'b1_3',name:'Palier Contender · Niv. 1 – 3',minL:1,maxL:3,eloTxt:'100 – 1100 ELO',mult:0.40}
];
const bracketForLvl=l=>LADDER_BRACKETS.find(b=>l>=b.minL&&l<=b.maxL)||LADDER_BRACKETS[1];
const LADDER_REWARDS=[[1,1,5000],[2,2,3000],[3,3,2000],[4,10,800],[11,50,300],[51,100,100]];
const rewardFor=(r,mult=1)=>{const x=LADDER_REWARDS.find(([a,b])=>r>=a&&r<=b);return x?Math.round(x[2]*mult/10)*10:0};
function weekEnd(){const n=new Date(),d=new Date(n);d.setDate(n.getDate()+((7-n.getDay())%7));d.setHours(23,59,59,0);if(d<n)d.setDate(d.getDate()+7);return d}
function ladderLeft(){const s=Math.max(0,Math.floor((weekEnd()-new Date())/1000));return t('days_s',{d:Math.floor(s/86400),h:Math.floor(s%86400/3600)})}
function ladderPts(p){if(p.me)return SHOP.ladder;if(p.lpts==null){const r=seeded(hashStr(p.name)+7);p.lpts=Math.round(260+r()*1650)}return p.lpts}
function ladderHTML(){
  const myBr=bracketForLvl(lvl(ME.elo));
  if(!ladBracket)ladBracket=myBr.id;
  const curBr=LADDER_BRACKETS.find(b=>b.id===ladBracket)||myBr;
  const all=[...LB,ME];
  const brTabs=`<div class="lad-brackets">${LADDER_BRACKETS.map(b=>{
    return `<div class="lad-br ${b.id===curBr.id?'on':''}" data-lbr="${b.id}">
      ${b.id===myBr.id?`<span class="my-tag">TON PALIER</span>`:''}
      <b>${b.name}</b>
      <small>${b.eloTxt} · #1 : ${Math.round(5000*b.mult)} TC</small>
    </div>`;
  }).join('')}</div>`;
  const list=all.filter(p=>{const l=lvl(p.elo);return l>=curBr.minL&&l<=curBr.maxL}).sort((a,b)=>ladderPts(b)-ladderPts(a));
  const my=list.indexOf(ME)+1;
  const row=(p,i)=>`<tr class="${p.me?'me':''}"><td class="rk">${i+1}</td><td><div class="pl"><span data-profile="${escA(p.name)}">${avHTML(p)}</span><span data-profile="${escA(p.name)}">${escA(p.name)}</span>${planBadge(p)}</div></td><td>${lvlHTML(p.elo)}</td><td>${p.elo}</td><td class="rt">${ladderPts(p)}</td><td>${rewardFor(i+1,curBr.mult)?tcHTML(rewardFor(i+1,curBr.mult)):'—'}</td></tr>`;
  let rows=list.slice(0,25).map(row).join('');
  if(my>25)rows+=`<tr class="gap"><td colspan="6">···</td></tr>`+list.slice(my-2,my+1).map((p,j)=>row(p,my-2+j)).join('');
  return `<div class="lo-note">${t('ladder_rules')}</div>
    ${brTabs}
    <div class="lad">
      <div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl rk-table" style="min-width:540px"><thead><tr><th class="rk">#</th><th style="text-align:left">${t('th_player')}</th><th class="c">${t('th_level')}</th><th>ELO</th><th>${t('points')}</th><th>${t('th_reward')}</th></tr></thead><tbody>${rows}</tbody></table></div></div>
      <div class="card"><div class="h3">${curBr.name} <span>${t('ladder_ends',{x:ladderLeft()})}</span></div>
        ${LADDER_REWARDS.map(([a,b,n])=>`<div class="rwd"><span>#${a}${b>a?'–'+b:''}</span><b>${tcHTML(Math.round(n*curBr.mult/10)*10)}</b></div>`).join('')}
        <div class="m-hint" style="margin-top:10px"><b style="color:var(--text)">${my>0?t('your_points',{n:SHOP.ladder,r:my}):`Tu es classé dans ${myBr.name} (${SHOP.ladder} pts)`}</b></div></div></div>`;
}

const MISSIONS={play:{n:3,xp:150,tc:0,k:'ms_play'},win:{n:2,xp:200,tc:50,k:'ms_win'},kills:{n:40,xp:150,tc:0,k:'ms_kills'},
  mvp:{n:1,xp:120,tc:50,k:'ms_mvp'},rating:{n:1.2,xp:150,tc:0,k:'ms_rating',once:true},adr:{n:90,xp:150,tc:30,k:'ms_adr',once:true}};
function todayMissions(){
  const day=Math.floor((Date.now()-new Date().getTimezoneOffset()*6e4)/864e5);
  if(!SHOP.mis||SHOP.mis.day!==day)SHOP.mis={day,prog:{},got:[]};
  const r=seeded(day*31+5),ids=Object.keys(MISSIONS);
  for(let i=ids.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}
  return ids.slice(0,4);
}
function missionProgress(me,won,isMvp){
  const ids=todayMissions(),pg=SHOP.mis.prog,add=(k,v)=>{pg[k]=(pg[k]||0)+v};
  for(const id of ids){const M=MISSIONS[id];
    if(id==='play')add(id,1);if(id==='win'&&won)add(id,1);if(id==='kills')add(id,me.k);if(id==='mvp'&&isMvp)add(id,1);
    if(id==='rating'&&me.rating>=M.n)pg[id]=1;if(id==='adr'&&me.adr>=M.n)pg[id]=1;}
  saveShop();
}
function renderMissions(){
  const el=$('#missions');if(!el)return;
  const ids=todayMissions(),plus=hasPlan('plus');
  const card=(id,i)=>{const M=MISSIONS[id];
    if(i===3&&!plus)return `<div class="ms locked" data-go-prem>${LOCK}<span>${t('ms_lock')}</span><span class="pb plus">PLUS</span></div>`;
    const target=M.once?1:M.n,cur=Math.min(target,SHOP.mis.prog[id]||0),done=cur>=target,got=SHOP.mis.got.includes(id);
    return `<div class="ms ${done?'done':''} ${got?'got':''}"><div class="tt">${t(M.k,{n:M.n})}</div>
      <div class="rw2"><span>+${M.xp} XP</span>${M.tc?`<span>${tcHTML(M.tc)}</span>`:''}</div>
      <div class="pg"><i style="width:${cur/target*100}%"></i></div>
      <div class="ft"><span>${M.once?(done?'1/1':'0/1'):`${cur}/${target}`}</span>${got?`<span>${t('claimed')}</span>`:done?`<button class="btn primary" data-mclaim="${id}">${t('claim')}</button>`:''}</div></div>`};
  el.innerHTML=`<div class="label pool-head"><i class="tx">${t('missions')}</i> <span>${t('ms_reset',{x:untilMidnight()})}</span></div><div class="ms-grid">${ids.map(card).join('')}</div>`;
}
$('#missions').addEventListener('click',e=>{
  if(e.target.closest('[data-go-prem]'))return setView('premium');
  const b=e.target.closest('[data-mclaim]');if(!b)return;const id=b.dataset.mclaim,M=MISSIONS[id];
  if(SHOP.mis.got.includes(id))return;SHOP.mis.got.push(id);
  SHOP.pass.xp=Math.min(PASS_TIERS*XP_TIER,SHOP.pass.xp+M.xp);if(M.tc)SHOP.coins+=M.tc;
  saveShop();renderWallet();toast(`+${M.xp} XP${M.tc?` · +${M.tc} TC`:''}`);beep(988,.08);renderMissions();
});
renderMissions();

const EICON={
  elim:'<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M256 96V56M256 456v-40M256 112a144 144 0 10144 144 144 144 0 00-144-144zM416 256h40M56 256h40"/></svg>',
  bomb:'<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M394.23 197.56a300.43 300.43 0 00-53.37-90C301.2 61.65 249.05 32 208 32a16 16 0 00-15.48 20c13.87 53-14.88 97.07-45.31 143.72C122 234.36 96 274.27 96 320c0 88.22 71.78 160 160 160s160-71.78 160-160c0-43.3-7.32-84.49-21.77-122.44zm-105.9 221.13C278 429.69 265.05 432 256 432s-22-2.31-32.33-13.31S208 390.24 208 368c0-25.14 8.82-44.28 17.34-62.78 4.95-10.74 10-21.67 13-33.37a8 8 0 0112.49-4.51A126.48 126.48 0 01275 292c18.17 24 29 52.42 29 76 0 22.24-5.42 39.77-15.67 50.69z"/></svg>',
  defuse:'<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M103.48 224a71.64 71.64 0 0044.76-15.66l41.5 16.89 6.82-12.63a39.15 39.15 0 014.32-6.37l14.22-14.42-41.17-24.94A72 72 0 10103.48 224zm0-112a40 40 0 11-40 40 40 40 0 0140-40z"/><path d="M480 169l-5.52-12.58c-4.48-10.42-14.74-16-32.78-17.85-10.12-1-26.95-1.24-49.69 3.81-20 4.45-122.14 28.2-164.95 58.62-20.25 14.39-24.06 33.67-27.06 49.16-2.78 14.14-5 25.31-18 35-15 11.14-27.27 16.38-33.58 18.6a71.74 71.74 0 1024.79 38zm-224.52 87a16 16 0 1116-16 16 16 0 01-16 16zm-152 144a40 40 0 1140-40 40 40 0 01-40 40z"/><path d="M343.79 259.87l-83.74 48.18 27.63 13.08 3.62 1.74C310 331.92 359.74 356 410.53 359c3.89.23 7.47.34 10.78.34C442 359.31 453 354 459.75 350L480 336z"/></svg>',
  time:'<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M256 48C141.13 48 48 141.13 48 256s93.13 208 208 208 208-93.13 208-208S370.87 48 256 48zm96 240h-96a16 16 0 01-16-16V128a16 16 0 0132 0v128h80a16 16 0 010 32z"/></svg>'
};
function hashStr(x){let h=0;for(const c of x)h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)}
const _radarGrid={};
function radarWalk(slug,u,v){const R=window.RADAR&&RADAR[slug];if(!R)return true;
  if(!_radarGrid[slug]){const b=atob(R.grid),bits=[];for(let i=0;i<b.length;i++){const c=b.charCodeAt(i);for(let k=7;k>=0;k--)bits.push((c>>k)&1)}_radarGrid[slug]=bits}
  const x=Math.min(63,Math.max(0,Math.floor(u*64))),y=Math.min(63,Math.max(0,Math.floor(v*64)));return _radarGrid[slug][y*64+x]===1}
function radarXY(slug,x,y){const R=RADAR[slug];return [(x-R.pos_x)/R.scale/1024*100,(R.pos_y-y)/R.scale/1024*100]}
function heatPts(slug,n){
  const R=window.RADAR&&RADAR[slug],out=[];
  const gauss=()=>{let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
  for(let i=0;i<n;i++){
    let p=null;
    for(let k=0;k<40&&!p;k++){
      let u,v;
      if(R&&R.spots&&R.spots.length&&Math.random()<.85){const tot=R.spots.reduce((s,x)=>s+x[2],0);let r=Math.random()*tot,sp=R.spots[0];for(const x of R.spots){r-=x[2];if(r<=0){sp=x;break}}u=sp[0]+gauss()*.055;v=sp[1]+gauss()*.055}
      else{u=.1+Math.random()*.8;v=.1+Math.random()*.8}
      if(u>.02&&u<.98&&v>.02&&v<.98&&radarWalk(slug,u,v))p=[u*100,v*100];
    }
    out.push(p||[50,50]);
  }
  return out;
}
function genReview(c,sA,sB,wonA,me){
  const last=wonA?'a':'b',w=[...Array(sA).fill('a'),...Array(sB).fill('b')];
  w.splice(w.lastIndexOf(last),1);for(let i=w.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[w[i],w[j]]=[w[j],w[i]]}w.push(last);
  const rounds=w.map(x=>({w:x,e:pick(['elim','elim','elim','bomb','defuse','time'])}));
  const rSlug=(c.size===2&&c.map.wm&&c.map.wm.slug)?c.map.wm.slug:c.map.slug;
  const pts=n=>heatPts(rSlug,n);
  const clutches=Array.from({length:rnd(0,3)},()=>({v:rnd(1,3),won:Math.random()<.45}));
  return {rounds,half:c.size===2?8:15,open:{w:rnd(1,Math.max(2,Math.round(me.k/5))),l:rnd(1,4)},clutches,
    multi:{k2:rnd(1,5),k3:rnd(0,2),k4:Math.random()<.2?1:0,k5:Math.random()<.04?1:0},
    util:{he:rnd(40,260),fa:rnd(0,6),bl:rnd(2,15)},kills:pts(me.k),deaths:pts(me.d)};
}
function renderReview(){
  const el=$('#reviewCard');if(!cur||!cur.res||!cur.res.review){el.innerHTML='';return}
  const rv=cur.res.review,prem=hasPlan('premium'),n=rv.rounds.length;
  const rounds=`<div class="rounds" style="--n:${n}">${rv.rounds.map((r,i)=>`<div class="rd ${r.w} ${i===rv.half?'half':''}" title="R${i+1} · ${t('rv_'+r.e)}">${EICON[r.e]}</div>`).join('')}</div>
    <div class="rnum" style="--n:${n}">${rv.rounds.map((r,i)=>`<span>${(i+1)%5===0||i===0?i+1:''}</span>`).join('')}</div>
    <div class="rv-legend"><span><i class="dot" style="background:var(--blue)"></i>${escA($('#nameA').textContent)}</span><span><i class="dot" style="background:var(--red)"></i>${escA($('#nameB').textContent)}</span>${['elim','bomb','defuse','time'].map(k=>`<span>${EICON[k]}${t('rv_'+k)}</span>`).join('')}</div>`;
  const cl=rv.clutches.length?rv.clutches.map(x=>`<span class="${x.won?'pos':'neg'}">1v${x.v}</span>`).join(' · '):t('rv_none');
  const tiles=`<div class="rv-grid">
    <div class="bk"><span>${t('rv_open')}</span><b>${rv.open.w}/${rv.open.w+rv.open.l}</b><small>${t('rv_won_lost',{w:rv.open.w,l:rv.open.l})}</small></div>
    <div class="bk"><span>${t('rv_clutch')}</span><b>${rv.clutches.filter(x=>x.won).length}/${rv.clutches.length}</b><small>${cl}</small></div>
    <div class="bk"><span>${t('rv_multi')}</span><b>${rv.multi.k2+rv.multi.k3+rv.multi.k4+rv.multi.k5}</b><small>2K ×${rv.multi.k2} · 3K ×${rv.multi.k3} · 4K ×${rv.multi.k4} · ACE ×${rv.multi.k5}</small></div>
    <div class="bk"><span>${t('rv_util')}</span><b>${rv.util.he}</b><small>${t('rv_he')} · ${rv.util.fa} ${t('rv_flash')} · ${rv.util.bl} ${t('rv_blind')}</small></div></div>`;
  const dots=(a,col)=>a.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.9" fill="${col}" fill-opacity=".85" stroke="#000" stroke-width=".4"/>`).join('');
  const rSlug=(cur.size===2&&cur.map.wm&&cur.map.wm.slug)?cur.map.wm.slug:cur.map.slug;
  const hasR=!!(window.RADAR&&RADAR[rSlug]);
  const heat=`<div><div class="label">${t('rv_heat')}</div><div class="heat ${hasR?'radar':'no-radar'}">${hasR?`<div class="bg" style="background-image:url('maps/radar/${rSlug}.png')"></div>`:`<div class="bg" style="background:${mapBg(cur.map)}"></div><span class="heat-na">${t('rv_noradar')}</span>`}
    <svg viewBox="0 0 100 100"><g stroke="rgba(255,255,255,.06)" stroke-width=".3">${[20,40,60,80].map(v=>`<line x1="${v}" y1="0" x2="${v}" y2="100"/><line x1="0" y1="${v}" x2="100" y2="${v}"/>`).join('')}</g>${dots(rv.kills,'#3fcf8e')}${dots(rv.deaths,'#ef5560')}</svg></div>
    <div class="rv-legend"><span><i class="dot" style="background:var(--green)"></i>${t('rv_kills')} (${rv.kills.length})</span><span><i class="dot" style="background:var(--red)"></i>${t('rv_deaths')} (${rv.deaths.length})</span></div></div>`;
  const h1=rv.rounds.slice(0,rv.half),h2=rv.rounds.slice(rv.half),cnt=(a,x)=>a.filter(r=>r.w===x).length;
  const acts=`<div><div class="label">${cur.map.n} · ${cur.res.sA}:${cur.res.sB}</div>
    <div class="halves"><div class="bk"><span>${t('rv_h1')}</span><b><span style="color:var(--blue)">${cnt(h1,'a')}</span> : <span style="color:var(--red)">${cnt(h1,'b')}</span></b></div>
    <div class="bk"><span>${t('rv_h2')}</span><b><span style="color:var(--blue)">${cnt(h2,'a')}</span> : <span style="color:var(--red)">${cnt(h2,'b')}</span></b></div></div>
    <div class="rv-act"><button class="btn primary" data-demo>${t('rv_demo')}</button><button class="btn" data-soonbtn>${t('rv_2d')}</button></div></div>`;
  const body=`<div class="h3">${t('rv_title')} <span class="pb premium">PREMIUM</span></div><div class="label">${t('rv_rounds')}</div>${rounds}${tiles}<div class="rv-two">${heat}${acts}</div>`;
  el.innerHTML=body+(prem?'':`<div class="rv-lock"><div class="in">${LOCK.replace('<svg','<svg style="width:26px;height:26px;color:var(--acc)"')}<b>${t('rv_lock_t')}</b><p>${t('rv_lock_d')}</p><button class="btn primary" data-go="premium">${t('unlock_prem')}</button></div></div>`);
}
$('#reviewCard').addEventListener('click',e=>{
  if(e.target.closest('[data-go]'))return setView('premium');
  if(e.target.closest('[data-demo]'))return toast(t('rv_demo_t'));
  if(e.target.closest('[data-soonbtn]'))return toast(t('soon'));
});
function refreshViews2(){
  if(!$('#loadout').hidden)renderLoadout();
  if(!$('#premium').hidden)renderPremium();
  if(!$('#profile').hidden)renderProfile();
  if(!$('#ranking').hidden)renderRanking();
  if(!$('#leagues').hidden)renderLeagues();
  if(cur&&cur.res)renderReview();
}

function isDevUser(){
  if(typeof window!=='undefined'&&window.IS_DEV_TEST)return true;
  if(typeof ME!=='undefined'&&ME&&(ME.dev||ME.isDev||ME.role==='dev'||ME.admin))return true;
  if(typeof ADM!=='undefined'&&ADM&&(ADM.dev||ADM.isDev))return true;
  if(typeof INF!=='undefined'&&INF&&(INF.isDev||INF.dev))return true;
  if(typeof FBA!=='undefined'&&FBA&&FBA.uid&&(typeof ADM_ROLES!=='undefined'&&ADM_ROLES[FBA.uid]?.dev))return true;
  if(typeof isDev==='function'&&isDev())return true;
  try{
    if(localStorage.getItem('cs_dev')==='1'||localStorage.getItem('dev_mode')==='1')return true;
    const s=JSON.parse(localStorage.getItem('cs_profile')||'null');
    if(s&&(s.dev||s.role==='dev'||s.isDev))return true;
  }catch(e){}
  return false;
}
if(typeof window!=='undefined'){
  window.setDev=function(on=true){
    if(typeof ME!=='undefined')ME.dev=!!on;
    try{localStorage.setItem('cs_dev',on?'1':'0')}catch(e){}
    if(typeof toast==='function')toast(on?'Mode Développeur Activé !':'Mode Développeur Désactivé');
    if(typeof renderShop==='function'&&$('#shop')&&!$('#shop').hidden)renderShop();
    if(typeof renderProfile==='function'&&$('#profile')&&!$('#profile').hidden)renderProfile();
    if(typeof renderEditor==='function'&&$('#editModal')&&!$('#editModal').hidden)renderEditor();
  };
}

const CARD_STYLES=[
  {id:'default',cat:'armory',name:'Acier Standard',tier:'Standard',tierCol:'#7a7e87',price:0,code:'STD // 00',desc:'Châssis d\'origine gris anthracite mat.'},
  {id:'carbon',cat:'armory',name:'Carbone Forgé',tier:'Armurerie',tierCol:'#8b95a5',price:600,code:'CRB // 01',desc:'Trame carbone diagonale 3K, rivets hexagonaux en titane et jauge technique.'},
  {id:'radar',cat:'animated',anim:true,name:'Opérateur Radar',tier:'Animé · Tactique',tierCol:'#3fcf8e',price:800,code:'RDR // 128Hz',desc:'Grille sonar tactique avec balayage radar rotatif à 360° et cibles verrouillées.'},
  {id:'damascus',cat:'armory',name:'Acier de Damas',tier:'Armurerie',tierCol:'#6085a8',price:950,code:'DMS // 02',desc:'Alliage forgé à strates ondulées gris-acier et gravures topographiques.'},
  {id:'tiger',cat:'armory',name:'Tiger Strike',tier:'Opérations',tierCol:'#d97724',price:1200,code:'TGR // 03',desc:'Rayures tactiques ambre, griffures balistiques et marquage Spec-Ops.'},
  {id:'asiimov',cat:'armory',name:'Châssis Asiimov',tier:'Collection',tierCol:'#e05a2b',price:1500,code:'ASM // 04',desc:'Bandes obliques ivoire mat, orange balistique, mire de visée et carbone.'},
  {id:'printstream',cat:'armory',name:'Printstream Noir',tier:'Collection',tierCol:'#d0d5dd',price:1800,code:'XX // 128T',desc:'Contraste titane nacré et noir mat avec croix géométriques XX et code-barres.'},
  {id:'gungnir',cat:'prestige',name:'Lance de Gungnir',tier:'Collection',tierCol:'#5ca8e6',price:2000,code:'ODN // 08',desc:'Runes nordiques gravées argent et bleu glacier, entrelacs vikings et lance d\'Odin.'},
  {id:'sakura',cat:'animated',anim:true,name:'Vent de Sakura',tier:'Animé · Zen',tierCol:'#e87da0',price:2100,code:'SKR // 09',desc:'Branche de cerisier sur nuit d\'encre avec pluie de pétales de sakura animés.'},
  {id:'aurora',cat:'animated',anim:true,name:'Aurore Boréale',tier:'Animé · Céleste',tierCol:'#46c9a7',price:2200,code:'AUR // 10',desc:'Ondes célestes émeraude et bleu polaire qui ondulent au-dessus d\'une crête étoilée.'},
  {id:'legion',cat:'prestige',name:'Or Légionnaire',tier:'Prestige',tierCol:'#d4a024',price:2400,code:'LGN // 06',desc:'Couronne de lauriers dorés, colonnes impériales biseautées et bronze poli.'},
  {id:'cyberpunk',cat:'animated',anim:true,name:'Matrice Néon',tier:'Animé · Cyberpunk',tierCol:'#06b6d4',price:2500,code:'CYB // 2077',desc:'Scanlines CRT cyan et magenta avec glitch holographique et pulsations néon.'},
  {id:'emerald',cat:'prestige',name:'Doppler Émeraude',tier:'Prestige',tierCol:'#2ec27e',price:2600,code:'EMR // 12',desc:'Cristal émeraude profond, facettes géométriques taillées et reflets vert jade.'},
  {id:'retrowave',cat:'animated',anim:true,name:'Synthwave 84',tier:'Animé · Rétro',tierCol:'#ec4899',price:2700,code:'SYN // 1984',desc:'Grille perspective rétro en fil de fer violet, soleil couchant néon et étoiles filantes.'},
  {id:'ruby',cat:'prestige',name:'Doppler Rubis',tier:'Prestige',tierCol:'#c83246',price:2800,code:'RBY // 07',desc:'Anodisation cramoisie profonde, éclats rubis taillés et liseré bordeaux.'},
  {id:'toxic',cat:'animated',anim:true,name:'Biohazard 128T',tier:'Animé · Toxique',tierCol:'#84cc16',price:2900,code:'BIO // 128T',desc:'Fluide radioactif vert toxique animé avec vapeurs chimiques et symbole danger biologique.'},
  {id:'storm',cat:'animated',anim:true,name:'Tempête d\'Éclairs',tier:'Animé · Surtension',tierCol:'#4da3ff',price:3000,code:'STM // 14',desc:'Arcs électriques haute tension animés qui zèbrent le cadre et la bannière.'},
  {id:'frost',cat:'animated',anim:true,name:'Blizzard Arctique',tier:'Animé · Cryo',tierCol:'#38bdf8',price:3100,code:'ICE // 00K',desc:'Flocons de givre cristallins flottants, lueur cryogénique bleu glacier et brume polaire.'},
  {id:'magma',cat:'animated',anim:true,name:'Braisier Volcanique',tier:'Animé · Incandescent',tierCol:'#f06428',price:3200,code:'MGM // 15',desc:'Fissures de lave incandescente et braises ardentes qui remontent sur la carte.'},
  {id:'fire_serpent',cat:'armory',anim:false,name:'Serpent de Feu',tier:'Collection',tierCol:'#10b981',price:3300,code:'FSP // AZT',desc:'Motifs aztèques traditionnels d\'écailles de serpent émeraude et nuages de braises.'},
  {id:'oni',cat:'animated',anim:true,name:'Katana Oni',tier:'Animé · Samouraï',tierCol:'#e03b4b',price:3400,code:'ONI // 16',desc:'Cornes de démon Oni japonais et entaille de katana sanglante animée.'},
  {id:'howl',cat:'prestige',name:'Prédateur Howl',tier:'Mythique',tierCol:'#ef4444',price:3600,code:'HWL // 17',desc:'Crocs et crinière de feu du prédateur Howl en rouge et or ardent sur obsidienne.'},
  {id:'hyperdrive',cat:'animated',anim:true,name:'Vitesse Lumière',tier:'Animé · Cosmique',tierCol:'#6366f1',price:3800,code:'HYP // 99C',desc:'Traînées d\'étoiles en distorsion hyperspatiale rapide et vortex stellaire.'},
  {id:'dragon',cat:'prestige',name:'Dragon Lore',tier:'Mythique',tierCol:'#e5b53b',price:4000,code:'DLORE // 18',desc:'Écailles d\'or ancien, entrelacs celtiques royaux et souffle de dragon gravé.'},
  {id:'dark_matter',cat:'prestige',anim:true,name:'Matière Noire',tier:'Animé · Néant',tierCol:'#a855f7',price:4200,code:'DRK // MAT',desc:'Ondes de plasma violet nébuleux et particules d\'antimatière absorbées vers le centre.'},
  {id:'singularity',cat:'animated',anim:true,name:'Singularité',tier:'Animé · Mythique',tierCol:'#e89b3c',price:4500,code:'SNG // 19',desc:'Trou noir gravitationnel et disque d\'accrétion en rotation continue autour de l\'avatar.'},
  {id:'gold_ingot',cat:'prestige',anim:false,name:'Lingot Pur 24K',tier:'Prestige Royal',tierCol:'#eab308',price:4800,code:'GLD // 999',desc:'Finition or pur massif 24 carats miroir poli, sceau de frappe bancaire et reflet spéculaire.'},
  {id:'sovereign',cat:'animated',anim:true,name:'Souverain Immortel',tier:'Animé · Mythique',tierCol:'#f2c14e',price:5000,code:'SVR // XX',desc:'Ailes métalliques déployées, halo solaire en rotation et blason maître 128-tick.'},
  {id:'blood_moon',cat:'animated',anim:true,name:'Lune de Sang',tier:'Animé · Occulte',tierCol:'#e11d48',price:2800,code:'BLD // MOON',desc:'Éclipse lunaire cramoisie avec volutes de fumée rouge sang et particules orbitales.'},
  {id:'mecha_industry',cat:'armory',anim:false,name:'Mecha Industrie',tier:'Collection',tierCol:'#f97316',price:3000,code:'MCH // 01',desc:'Blindage composite blanc céramique, joints hydrauliques orange vif et marquage mecha sci-fi.'},
  {id:'void_walker',cat:'animated',anim:true,name:'Marcheur du Néant',tier:'Animé · Astral',tierCol:'#6366f1',price:3400,code:'VOID // INF',desc:'Faille dimensionnelle d\'étoiles indigo et énergie du vide astral en distorsion continue.'},
  {id:'solar_flare',cat:'animated',anim:true,name:'Éruption Solaire',tier:'Animé · Plasma',tierCol:'#f59e0b',price:3600,code:'SOL // CORONA',desc:'Couronne de plasma stellaire haute température avec boucles coronales animées.'},
  {id:'neon_tokyo',cat:'animated',anim:true,name:'Tokyo Néo-Cyber',tier:'Animé · Synth',tierCol:'#ec4899',price:4000,code:'TKY // 2088',desc:'Néons verticaux Shibuya, reflets de pluie électrique cyan et rose cyberpunk.'},
  {id:'case_hardened',cat:'prestige',anim:false,name:'Cémenté Blue Gem',tier:'Prestige · CS:GO',tierCol:'#0284c7',price:4500,code:'CH // #661',desc:'Pattern légendaire Blue Gem #661 trempé à chaud avec reflets bleus irisés et or cuivré.'}
];
const VALID_CARD_IDS=new Set(CARD_STYLES.map(c=>c.id));
function validCardId(id){return VALID_CARD_IDS.has(id)?id:'default'}
function boughtCard(id){
  if(id==='default'||isDevUser())return true;
  return Array.isArray(SHOP.cards)&&SHOP.cards.includes(id);
}
function cardStyleOf(p){
  if(!p)return 'default';
  const isMe=p.me||(typeof ME!=='undefined'&&ME&&p.name&&p.name.toLowerCase()===ME.name.toLowerCase());
  const raw=isMe?(ME.cardStyle||p.cardStyle||'default'):(p.cardStyle||'default');
  return validCardId(raw);
}
function cardObjOf(id){return CARD_STYLES.find(c=>c.id===validCardId(id))||CARD_STYLES[0]}

function cardArtSVG(cid){
  switch(cid){
    case 'carbon':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g stroke="#8b95a5" stroke-width="1" opacity=".45" fill="none">
          <circle cx="14" cy="14" r="3"/><circle cx="186" cy="14" r="3"/>
          <circle cx="14" cy="172" r="3"/><circle cx="186" cy="172" r="3"/>
          <path d="M8 64h42l8-8h84l8 8h42"/>
        </g>
      </svg>`;
    case 'radar':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="xMidYMid slice">
        <g stroke="#3fcf8e" fill="none" opacity=".32">
          <circle cx="100" cy="64" r="28" stroke-dasharray="3 3"/>
          <circle cx="100" cy="64" r="52"/>
          <circle cx="100" cy="64" r="78" stroke-dasharray="6 4"/>
          <line x1="20" y1="64" x2="180" y2="64" stroke-width=".7"/>
          <line x1="100" y1="0" x2="100" y2="145" stroke-width=".7"/>
        </g>
        <g class="pcard-svg-spin" style="transform-origin:100px 64px">
          <path d="M100 64 L100 -14 A78 78 0 0 1 168 25 Z" fill="#3fcf8e" opacity=".22"/>
          <line x1="100" y1="64" x2="100" y2="-14" stroke="#3fcf8e" stroke-width="1.5" opacity=".75"/>
        </g>
        <circle cx="138" cy="36" r="2.8" fill="#3fcf8e" class="pcard-svg-blink"/>
        <circle cx="62" cy="48" r="2.2" fill="#3fcf8e" class="pcard-svg-blink" style="animation-delay:.9s"/>
      </svg>`;
    case 'damascus':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g fill="none" stroke="#7da3c7" stroke-width="1.1" opacity=".34">
          <path d="M-10 22 Q 45 4, 100 24 T 210 18"/>
          <path d="M-10 42 Q 55 20, 105 44 T 210 36"/>
          <path d="M-10 62 Q 35 48, 95 66 T 210 58"/>
          <path d="M-10 150 Q 50 132, 105 154 T 210 144"/>
          <path d="M-10 170 Q 60 156, 115 172 T 210 166"/>
        </g>
      </svg>`;
    case 'tiger':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g fill="#e0822b" opacity=".36">
          <polygon points="12,0 28,0 6,48 0,48"/>
          <polygon points="42,0 54,0 24,62 15,62"/>
          <polygon points="155,0 172,0 200,45 200,28"/>
          <polygon points="178,0 192,0 200,18 200,6"/>
        </g>
        <g stroke="#f59e0b" stroke-width="1.6" stroke-linecap="round" opacity=".55">
          <path d="M22 18 L52 74"/><path d="M32 14 L64 72"/><path d="M44 18 L72 66"/>
        </g>
      </svg>`;
    case 'asiimov':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <polygon points="0,0 56,0 0,56" fill="#e05a2b" opacity=".48"/>
        <polygon points="58,0 74,0 0,74 0,58" fill="#f0f2f5" opacity=".42"/>
        <polygon points="200,130 200,152 142,210 120,210" fill="#e05a2b" opacity=".32"/>
        <g stroke="#f0f2f5" stroke-width="1.2" fill="none" opacity=".55">
          <circle cx="100" cy="64" r="44" stroke-dasharray="14 8"/>
          <path d="M12 64h28M160 64h28"/>
        </g>
      </svg>`;
    case 'printstream':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <rect x="0" y="0" width="200" height="7" fill="#e6e9f0" opacity=".85"/>
        <g stroke="#e6e9f0" stroke-width="1.6" stroke-linecap="round" opacity=".65">
          <path d="M14 18l8 8m0-8l-8 8"/><path d="M28 18l8 8m0-8l-8 8"/>
          <path d="M166 156l7 7m0-7l-7 7"/><path d="M178 156l7 7m0-7l-7 7"/>
        </g>
        <g fill="#e6e9f0" opacity=".45">
          <rect x="12" y="156" width="2" height="10"/><rect x="16" y="156" width="4" height="10"/>
          <rect x="22" y="156" width="1.5" height="10"/><rect x="26" y="156" width="3" height="10"/>
          <rect x="31" y="156" width="1.5" height="10"/><rect x="35" y="156" width="5" height="10"/>
        </g>
      </svg>`;
    case 'gungnir':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="xMidYMid slice">
        <g stroke="#6cb8f7" fill="none" opacity=".48">
          <circle cx="100" cy="64" r="46" stroke-width="1.2" stroke-dasharray="8 4" class="pcard-svg-spin" style="transform-origin:100px 64px;animation-duration:18s"/>
          <polygon points="100,4 112,26 100,20 88,26" fill="#6cb8f7" opacity=".45"/>
          <path d="M16 64 L52 64 L62 52 M184 64 L148 64 L138 52" stroke-width="1.4"/>
          <path d="M30 162 L100 174 L170 162" stroke-width="1"/>
        </g>
      </svg>`;
    case 'sakura':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="xMidYMid slice">
        <path d="M0 16 Q 60 28, 118 12 T 200 24" stroke="#4a2533" stroke-width="2.5" fill="none"/>
        <g fill="#f48fb1" opacity=".82">
          <circle cx="28" cy="20" r="4.5"/><circle cx="34" cy="16" r="3.5"/><circle cx="72" cy="22" r="5"/>
          <circle cx="115" cy="14" r="4.5"/><circle cx="158" cy="20" r="4"/>
          <ellipse cx="42" cy="30" rx="4" ry="2.2" transform="rotate(-25 42 30)" class="pcard-petal p1"/>
          <ellipse cx="145" cy="26" rx="4.2" ry="2.2" transform="rotate(20 145 26)" class="pcard-petal p2"/>
          <ellipse cx="88" cy="18" rx="3.6" ry="2" transform="rotate(-15 88 18)" class="pcard-petal p3"/>
          <ellipse cx="170" cy="42" rx="3.8" ry="2" transform="rotate(35 170 42)" class="pcard-petal p4"/>
          <ellipse cx="24" cy="54" rx="3.5" ry="1.9" transform="rotate(-30 24 54)" class="pcard-petal p5"/>
        </g>
      </svg>`;
    case 'aurora':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g class="pcard-aurora-wave" fill="none" stroke-width="8" stroke-linecap="round" opacity=".38">
          <path d="M-10 38 Q 50 10, 105 36 T 210 22" stroke="#3fcf8e"/>
          <path d="M-10 52 Q 60 24, 115 48 T 210 36" stroke="#38bdf8"/>
          <path d="M-10 24 Q 45 4, 98 22 T 210 14" stroke="#2dd4bf"/>
        </g>
        <g fill="#e2f8f0" opacity=".65">
          <circle cx="24" cy="14" r="1.2" class="pcard-svg-blink"/>
          <circle cx="154" cy="18" r="1.4" class="pcard-svg-blink" style="animation-delay:.7s"/>
          <circle cx="122" cy="10" r="1" class="pcard-svg-blink" style="animation-delay:1.3s"/>
        </g>
      </svg>`;
    case 'legion':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="#d4a024" stroke-width="1.4" opacity=".58">
          <path d="M54 68 C 54 36, 74 20, 100 18 C 126 20, 146 36, 146 68"/>
          <path d="M50 76 C 46 52, 62 28, 82 22"/><path d="M150 76 C 154 52, 138 28, 118 22"/>
          <polygon points="100,6 105,16 116,16 107,22 110,32 100,26 90,32 93,22 84,16 95,16" fill="#d4a024" opacity=".45"/>
          <line x1="12" y1="64" x2="48" y2="64"/><line x1="152" y1="64" x2="188" y2="64"/>
        </g>
      </svg>`;
    case 'emerald':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g fill="#2ec27e" opacity=".28" stroke="#4ade80" stroke-width=".8">
          <polygon points="0,0 48,0 22,38 0,26"/>
          <polygon points="200,0 152,0 178,38 200,26"/>
          <polygon points="100,4 114,18 100,32 86,18"/>
          <polygon points="0,152 26,168 12,188 0,180"/>
          <polygon points="200,152 174,168 188,188 200,180"/>
        </g>
      </svg>`;
    case 'ruby':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g fill="#d6384c" opacity=".32" stroke="#f43f5e" stroke-width=".8">
          <polygon points="0,0 52,0 18,42 0,28"/>
          <polygon points="200,0 148,0 182,42 200,28"/>
          <polygon points="100,4 116,18 100,34 84,18"/>
          <polygon points="0,148 28,166 14,186 0,178"/>
          <polygon points="200,148 172,166 186,186 200,178"/>
        </g>
      </svg>`;
    case 'storm':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g fill="none" stroke="#60a5fa" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18,0 36,24 24,28 48,62 38,66 58,98" stroke-width="2" class="pcard-bolt b1"/>
          <polyline points="178,0 156,28 168,32 142,68 154,72 134,104" stroke-width="1.8" class="pcard-bolt b2"/>
          <polyline points="82,0 102,18 92,22 118,46" stroke-width="1.5" class="pcard-bolt b3"/>
        </g>
      </svg>`;
    case 'magma':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g fill="none" stroke="#f97316" stroke-width="1.6" opacity=".55">
          <path d="M0 168 L28 154 L44 162 L68 146"/>
          <path d="M200 164 L168 150 L152 160 L128 144"/>
          <path d="M10 62 L38 48 L52 58"/>
        </g>
        <g fill="#fb923c">
          <circle cx="26" cy="150" r="2.4" class="pcard-ember e1"/>
          <circle cx="54" cy="160" r="1.8" class="pcard-ember e2"/>
          <circle cx="146" cy="154" r="2.5" class="pcard-ember e3"/>
          <circle cx="172" cy="142" r="1.9" class="pcard-ember e4"/>
          <circle cx="88" cy="164" r="2.1" class="pcard-ember e5"/>
        </g>
      </svg>`;
    case 'oni':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="xMidYMid slice">
        <g fill="#e11d48" opacity=".52">
          <path d="M56 32 C 42 12, 48 2, 68 10 C 60 18, 60 26, 66 34 Z"/>
          <path d="M144 32 C 158 12, 152 2, 132 10 C 140 18, 140 26, 134 34 Z"/>
        </g>
        <line x1="-10" y1="118" x2="210" y2="18" stroke="#f43f5e" stroke-width="2.4" class="pcard-slash-line"/>
        <line x1="-10" y1="122" x2="210" y2="22" stroke="#ffffff" stroke-width="1" class="pcard-slash-glint"/>
      </svg>`;
    case 'howl':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g fill="#ef4444" opacity=".42">
          <polygon points="0,18 38,34 16,44 48,62 0,58"/>
          <polygon points="200,18 162,34 184,44 152,62 200,58"/>
        </g>
        <g fill="#f59e0b" opacity=".48">
          <polygon points="0,30 26,42 10,48 34,64 0,62"/>
          <polygon points="200,30 174,42 190,48 166,64 200,62"/>
          <polygon points="68,6 76,22 84,10"/><polygon points="132,6 124,22 116,10"/>
        </g>
      </svg>`;
    case 'dragon':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g fill="none" stroke="#e5b53b" stroke-width="1.3" opacity=".52">
          <path d="M8 14 H62 L72 24 H128 L138 14 H192"/>
          <path d="M8 168 H54 L64 158 H136 L146 168 H192"/>
          <path d="M48 64 Q 30 44, 52 26 Q 68 40, 56 64"/>
          <path d="M152 64 Q 170 44, 148 26 Q 132 40, 144 64"/>
        </g>
      </svg>`;
    case 'singularity':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="xMidYMid slice">
        <g class="pcard-svg-spin" style="transform-origin:100px 64px;animation-duration:10s">
          <ellipse cx="100" cy="64" rx="58" ry="22" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="28 14" opacity=".62"/>
          <ellipse cx="100" cy="64" rx="48" ry="48" fill="none" stroke="#ea580c" stroke-width="1.2" stroke-dasharray="16 20" opacity=".45"/>
        </g>
        <circle cx="100" cy="64" r="40" fill="none" stroke="#fde047" stroke-width="1" opacity=".5"/>
      </svg>`;
    case 'sovereign':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="xMidYMid slice">
        <g class="pcard-svg-spin" style="transform-origin:100px 64px;animation-duration:22s" stroke="#f2c14e" stroke-width="1.1" fill="none" opacity=".45">
          <circle cx="100" cy="64" r="48" stroke-dasharray="6 6"/>
        </g>
        <g fill="#f2c14e" opacity=".46">
          <polygon points="52,62 10,36 24,52 6,54 28,66 14,74 52,72"/>
          <polygon points="148,62 190,36 176,52 194,54 172,66 186,74 148,72"/>
          <polygon points="100,2 106,15 120,15 109,23 113,36 100,28 87,36 91,23 80,15 94,15"/>
        </g>
      </svg>`;
    case 'cyberpunk':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g stroke="#06b6d4" stroke-width="1.2" fill="none" opacity=".55">
          <line x1="0" y1="20" x2="200" y2="20" stroke-dasharray="8 6"/>
          <line x1="0" y1="160" x2="200" y2="160" stroke-dasharray="14 4"/>
          <polyline points="10,30 30,30 40,40" stroke="#f43f5e" stroke-width="1.5"/>
          <polyline points="190,30 170,30 160,40" stroke="#06b6d4" stroke-width="1.5"/>
        </g>
        <g fill="#06b6d4" opacity=".35">
          <rect x="150" y="8" width="36" height="3"/>
          <rect x="14" y="166" width="48" height="2"/>
        </g>
      </svg>`;
    case 'retrowave':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <defs>
          <linearGradient id="rwSun" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fb7185"/>
            <stop offset="100%" stop-color="#f59e0b"/>
          </linearGradient>
        </defs>
        <circle cx="100" cy="56" r="32" fill="url(#rwSun)" opacity=".45"/>
        <line x1="68" y1="52" x2="132" y2="52" stroke="#12131a" stroke-width="2.5"/>
        <line x1="72" y1="60" x2="128" y2="60" stroke="#12131a" stroke-width="2.5"/>
        <line x1="78" y1="68" x2="122" y2="68" stroke="#12131a" stroke-width="2.5"/>
        <g stroke="#ec4899" stroke-width="1" opacity=".4" fill="none">
          <line x1="0" y1="160" x2="200" y2="160"/>
          <line x1="0" y1="172" x2="200" y2="172"/>
          <line x1="0" y1="188" x2="200" y2="188"/>
          <line x1="100" y1="150" x2="20" y2="220"/><line x1="100" y1="150" x2="60" y2="220"/>
          <line x1="100" y1="150" x2="140" y2="220"/><line x1="100" y1="150" x2="180" y2="220"/>
        </g>
      </svg>`;
    case 'toxic':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="xMidYMid slice">
        <g stroke="#84cc16" stroke-width="1.6" fill="none" opacity=".58">
          <circle cx="100" cy="64" r="38" stroke-dasharray="12 8"/>
          <path d="M100 42 A 18 18 0 0 1 116 54 L 100 64 Z" fill="#84cc16" opacity=".35"/>
          <path d="M84 76 A 18 18 0 0 1 82 58 L 100 64 Z" fill="#84cc16" opacity=".35"/>
          <path d="M116 76 A 18 18 0 0 1 102 82 L 100 64 Z" fill="#84cc16" opacity=".35"/>
        </g>
        <g fill="#a3e635">
          <circle cx="34" cy="154" r="2.8" class="pcard-ember e1"/>
          <circle cx="68" cy="168" r="2" class="pcard-ember e2"/>
          <circle cx="138" cy="158" r="3" class="pcard-ember e3"/>
          <circle cx="166" cy="148" r="2.2" class="pcard-ember e4"/>
        </g>
      </svg>`;
    case 'frost':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g stroke="#38bdf8" stroke-width="1.2" fill="none" opacity=".55">
          <line x1="28" y1="20" x2="28" y2="44"/><line x1="16" y1="32" x2="40" y2="32"/>
          <line x1="20" y1="24" x2="36" y2="40"/><line x1="36" y1="24" x2="20" y2="40"/>
          <line x1="172" y1="154" x2="172" y2="178"/><line x1="160" y1="166" x2="184" y2="166"/>
        </g>
        <g fill="#e0f2fe" opacity=".75">
          <polygon points="100,6 104,18 100,15 96,18"/>
          <circle cx="48" cy="72" r="1.8" class="pcard-svg-blink"/>
          <circle cx="152" cy="80" r="2" class="pcard-svg-blink" style="animation-delay:.8s"/>
          <circle cx="88" cy="24" r="1.4" class="pcard-svg-blink" style="animation-delay:1.4s"/>
        </g>
      </svg>`;
    case 'fire_serpent':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g fill="none" stroke="#10b981" stroke-width="1.5" opacity=".48">
          <path d="M12 24 Q 50 8, 100 24 T 188 24"/>
          <path d="M12 34 Q 50 18, 100 34 T 188 34"/>
          <polyline points="30,48 42,60 54,48 66,60 78,48"/>
          <polyline points="122,48 134,60 146,48 158,60 170,48"/>
        </g>
        <g fill="#f97316">
          <circle cx="36" cy="154" r="2.2" class="pcard-ember e1"/>
          <circle cx="164" cy="158" r="2.4" class="pcard-ember e3"/>
        </g>
      </svg>`;
    case 'hyperdrive':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="xMidYMid slice">
        <g stroke="#818cf8" stroke-width="1.4" opacity=".62">
          <line x1="100" y1="64" x2="10" y2="8" stroke-dasharray="18 12" class="pcard-bolt b1"/>
          <line x1="100" y1="64" x2="190" y2="8" stroke-dasharray="22 10" class="pcard-bolt b2"/>
          <line x1="100" y1="64" x2="8" y2="120" stroke-dasharray="16 14" class="pcard-bolt b3"/>
          <line x1="100" y1="64" x2="192" y2="120" stroke-dasharray="20 12" class="pcard-bolt b1"/>
          <line x1="100" y1="64" x2="40" y2="190" stroke-dasharray="14 16" class="pcard-bolt b2"/>
          <line x1="100" y1="64" x2="160" y2="190" stroke-dasharray="18 14" class="pcard-bolt b3"/>
        </g>
        <circle cx="100" cy="64" r="8" fill="#e0e7ff" opacity=".8" class="pcard-svg-blink"/>
      </svg>`;
    case 'dark_matter':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="xMidYMid slice">
        <g class="pcard-svg-spin" style="transform-origin:100px 64px;animation-duration:8s">
          <circle cx="100" cy="64" r="44" fill="none" stroke="#a855f7" stroke-width="2.2" stroke-dasharray="32 18" opacity=".7"/>
          <circle cx="100" cy="64" r="32" fill="none" stroke="#d946ef" stroke-width="1.4" stroke-dasharray="18 24" opacity=".55"/>
        </g>
        <g fill="#c084fc" opacity=".75">
          <circle cx="100" cy="64" r="6"/>
          <circle cx="62" cy="48" r="2.2" class="pcard-svg-blink"/>
          <circle cx="138" cy="80" r="2" class="pcard-svg-blink" style="animation-delay:1s"/>
        </g>
      </svg>`;
    case 'gold_ingot':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g stroke="#facc15" stroke-width="1.4" fill="none" opacity=".65">
          <rect x="12" y="14" width="176" height="192" rx="6"/>
          <rect x="18" y="20" width="164" height="180" rx="4" stroke-dasharray="8 6"/>
          <line x1="12" y1="44" x2="188" y2="44"/>
          <line x1="12" y1="176" x2="188" y2="176"/>
        </g>
        <g fill="#fde047" opacity=".75">
          <polygon points="100,26 104,34 112,34 106,39 108,47 100,42 92,47 94,39 88,34 96,34"/>
          <text x="100" y="196" text-anchor="middle" font-size="9" font-family="monospace" font-weight="bold" fill="#facc15">FINE GOLD 999.9</text>
        </g>
      </svg>`;
    case 'blood_moon':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g fill="none" stroke="#e11d48" opacity=".7">
          <circle cx="100" cy="64" r="32" stroke-width="2" class="pcard-svg-pulse"/>
          <circle cx="100" cy="64" r="44" stroke-dasharray="6 4" stroke-width="1.2"/>
        </g>
        <g fill="#e11d48" opacity=".8">
          <circle cx="100" cy="64" r="22"/>
          <path d="M78 64 A22 22 0 0 0 122 64 A16 16 0 0 1 78 64" fill="#090508"/>
          <circle cx="55" cy="40" r="2.2" class="pcard-svg-blink"/>
          <circle cx="145" cy="85" r="2" class="pcard-svg-blink" style="animation-delay:1.2s"/>
        </g>
      </svg>`;
    case 'mecha_industry':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g stroke="#f97316" stroke-width="1.4" fill="none" opacity=".8">
          <path d="M14 24 L48 24 L60 36 L140 36 L152 24 L186 24"/>
          <rect x="24" y="50" width="152" height="60" rx="4" stroke-dasharray="10 4"/>
          <line x1="30" y1="180" x2="80" y2="180"/>
          <line x1="120" y1="180" x2="170" y2="180"/>
        </g>
        <g fill="#f97316" opacity=".9">
          <circle cx="30" cy="180" r="3"/><circle cx="170" cy="180" r="3"/>
          <text x="100" y="85" text-anchor="middle" font-size="8" font-family="monospace" font-weight="bold">MECHA-IND // SPEC-01</text>
        </g>
      </svg>`;
    case 'void_walker':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g fill="none" stroke="#6366f1" opacity=".75">
          <ellipse cx="100" cy="64" rx="42" ry="24" stroke-width="1.6" class="pcard-svg-spin"/>
          <ellipse cx="100" cy="64" rx="24" ry="42" stroke-width="1.2" class="pcard-svg-spin" style="animation-direction:reverse;animation-duration:12s"/>
        </g>
        <g fill="#818cf8" opacity=".85">
          <circle cx="100" cy="64" r="5" class="pcard-svg-pulse"/>
          <circle cx="68" cy="45" r="2" class="pcard-svg-blink"/>
          <circle cx="132" cy="82" r="2.2" class="pcard-svg-blink" style="animation-delay:.8s"/>
        </g>
      </svg>`;
    case 'solar_flare':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g stroke="#f59e0b" fill="none" opacity=".8">
          <circle cx="100" cy="64" r="28" stroke-width="2" class="pcard-svg-pulse"/>
          <circle cx="100" cy="64" r="48" stroke-dasharray="4 6" stroke-width="1.4" class="pcard-svg-spin"/>
        </g>
        <g fill="#f59e0b" opacity=".75">
          <circle cx="100" cy="64" r="18"/>
          <circle cx="50" cy="50" r="2.5" class="pcard-svg-blink"/>
          <circle cx="150" cy="78" r="2.2" class="pcard-svg-blink" style="animation-delay:1.1s"/>
        </g>
      </svg>`;
    case 'neon_tokyo':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <g stroke="#ec4899" stroke-width="1.2" fill="none" opacity=".75">
          <line x1="20" y1="20" x2="20" y2="190"/>
          <line x1="180" y1="20" x2="180" y2="190"/>
          <rect x="35" y="40" width="130" height="70" rx="3" stroke="#06b6d4" stroke-width="1.4"/>
        </g>
        <g fill="#ec4899" opacity=".85">
          <text x="100" y="80" text-anchor="middle" font-size="12" font-family="sans-serif" font-weight="900" fill="#06b6d4">TOKYO // 2088</text>
          <circle cx="35" cy="40" r="3" fill="#ec4899"/>
          <circle cx="165" cy="110" r="3" fill="#06b6d4"/>
        </g>
      </svg>`;
    case 'case_hardened':
      return `<svg class="pcard-art" viewBox="0 0 200 220" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0284c7" stop-opacity=".7"/>
            <stop offset="45%" stop-color="#38bdf8" stop-opacity=".85"/>
            <stop offset="70%" stop-color="#a855f7" stop-opacity=".6"/>
            <stop offset="100%" stop-color="#eab308" stop-opacity=".7"/>
          </linearGradient>
        </defs>
        <path d="M12 20 Q 50 4, 100 22 T 188 18 L 188 190 Q 140 205, 95 188 T 12 195 Z" fill="url(#chGrad)" opacity=".6"/>
        <g stroke="#38bdf8" stroke-width="1.2" fill="none" opacity=".6">
          <path d="M25 45 Q 70 30, 110 50 T 175 42"/>
          <path d="M25 150 Q 80 135, 120 155 T 175 146"/>
        </g>
        <text x="100" y="105" text-anchor="middle" font-size="10" font-family="monospace" font-weight="bold" fill="#facc15">#661 BLUE GEM</text>
      </svg>`;
    default:
      return '';
  }
}

function cardFrameHTML(p,overrideId){
  const cid=overrideId?validCardId(overrideId):cardStyleOf(p);
  if(cid==='default')return '';
  const c=cardObjOf(cid);
  return `<div class="pcard-deco pcard-deco-${cid}" aria-hidden="true">
    ${cardArtSVG(cid)}
    <span class="pcard-corner tl"></span><span class="pcard-corner tr"></span>
    <span class="pcard-corner bl"></span><span class="pcard-corner br"></span>
    <span class="pcard-serial">${c.code}</span>
  </div>`;
}

async function syncPartyCardStyle(cid){
  const vc=validCardId(cid);
  try{
    if(typeof LOOKC!=='undefined'&&typeof fbMailbox==='function')LOOKC.delete(fbMailbox(ME.name));
    const pCode=window.CURRENT_PARTY_CODE||(typeof PL!=='undefined'&&PL.code);
    if(pCode&&typeof fbReq==='function'){
      const isLeader=!state.party.length||state.party[0].me||(state.party[0].name&&state.party[0].name.toLowerCase()===ME.name.toLowerCase());
      if(isLeader){
        await fbReq(`parties/${pCode}/leader/cardStyle`,'PUT',vc);
      }else{
        const myBox=typeof fbMailbox==='function'?fbMailbox(ME.name):ME.name.toLowerCase();
        await fbReq(`parties/${pCode}/members/${myBox}/cardStyle`,'PUT',vc);
      }
    }
  }catch(_){}
}

let cardPreviewId=null,cardCatFilter='all';
function equipCardStyle(id,silent=false){
  const cid=validCardId(id);
  if(!boughtCard(cid))return toast('Tu ne possèdes pas encore cette carte.');
  ME.cardStyle=cid;
  cardPreviewId=cid;
  if(typeof saveLocalProfile==='function')saveLocalProfile();
  if(typeof fbSyncMe==='function'){
    if(typeof FBS!=='undefined')FBS.lastHash='';
    fbSyncMe({cardStyle:cid});
  }
  syncPartyCardStyle(cid);
  if(typeof fbSyncOnline==='function')fbSyncOnline(false);
  if(typeof renderParty==='function')renderParty();
  if(!$('#profile').hidden&&typeof renderProfile==='function')renderProfile();
  if(!$('#friends').hidden&&typeof renderFriends==='function')renderFriends();
  if(!$('#shop').hidden&&typeof renderShop==='function')renderShop();
  if(!silent){
    const c=cardObjOf(cid);
    beep(880,.07);
    toast(cid==='default'?'Carte standard équipée':`Carte équipée : ${c.name} (synchronisée en direct)`);
  }
}
function buyCardStyle(id){
  const c=CARD_STYLES.find(x=>x.id===id);
  if(!c||c.price<=0)return;
  if(boughtCard(c.id)){return equipCardStyle(c.id)}
  if(!spend(c.price))return;
  if(!Array.isArray(SHOP.cards))SHOP.cards=[];
  if(!SHOP.cards.includes(c.id))SHOP.cards.push(c.id);
  saveShop();
  equipCardStyle(c.id,true);
  beep(988,.09);
  toast(t('bought_toast',{x:c.name}));
  renderShop();
}
function pcardPreviewHTML(p,cid,isMini=false){
  const c=cardObjOf(cid);
  if(isMini){
    return `<div class="pcard pcard-mini pcard-cs-${c.id}">
      ${cardFrameHTML(p,c.id)}
      <div class="bn" style="background:${bannerCSS(p.banner)}"></div>
      <div class="avatar big" style="${avStyle(p)}">${avInner(p)}${lvlHTML(p.elo)}</div>
      <div class="pname ${p.plan==='premium'?'gold':''}">${escA(p.name)}</div>
      <div class="prole"><span class="crown">${ICON.leader}</span>${t('leader')}</div>
      <div class="pfoot"><span>ELO <b>${p.elo}</b></span>${tfHTML(p)}</div>
    </div>`;
  }
  return `<div class="pcard me pcard-cs-${c.id}" style="margin:0;flex:0 0 196px">
    ${cardFrameHTML(p,c.id)}
    <div class="bn" style="background:${bannerCSS(p.banner)}"></div>
    <div class="avatar big" style="${avStyle(p)}">${avInner(p)}${lvlHTML(p.elo)}</div>
    <div class="pname ${p.plan==='premium'?'gold':''}">${escA(p.name)}</div>
    <div class="prole"><span class="crown">${ICON.leader}</span>${t('leader')}</div>
    <div class="pfoot"><span>ELO <b>${p.elo}</b></span>${tfHTML(p)}</div>
  </div>`;
}
function shopCardsHTML(){
  const eqId=validCardId(ME.cardStyle||'default');
  const prevId=validCardId(cardPreviewId||eqId);
  const prevCard=cardObjOf(prevId);
  const prevOwned=boughtCard(prevId);
  const prevEquipped=eqId===prevId;
  const stageAct=prevEquipped
    ?`<span class="pill" style="border-color:var(--green);color:var(--green)">Actuellement équipée (visible par tout ton groupe)</span>`
    :prevOwned
      ?`<button class="btn primary" data-eqcard="${prevCard.id}">Équiper maintenant</button>`
      :`<button class="btn primary" data-buycard="${prevCard.id}">Acheter et équiper · ${prevCard.price.toLocaleString(LOC[lang])} TC</button>`;

  const filtered=CARD_STYLES.filter(c=>{
    if(cardCatFilter==='animated')return !!c.anim;
    if(cardCatFilter==='armory')return c.cat==='armory';
    if(cardCatFilter==='prestige')return c.cat==='prestige';
    if(cardCatFilter==='owned')return boughtCard(c.id);
    return true;
  });

  const catCounts={
    all:CARD_STYLES.length,
    animated:CARD_STYLES.filter(c=>c.anim).length,
    armory:CARD_STYLES.filter(c=>c.cat==='armory').length,
    prestige:CARD_STYLES.filter(c=>c.cat==='prestige').length,
    owned:CARD_STYLES.filter(c=>boughtCard(c.id)).length
  };

  const filterBar=`<div class="sh-cards-filters">
    ${[
      ['all',`Toutes les cartes (${catCounts.all})`],
      ['animated',`Effets Animés (${catCounts.animated})`],
      ['armory',`Armurerie & Tactique (${catCounts.armory})`],
      ['prestige',`Prestige & Mythique (${catCounts.prestige})`],
      ['owned',`Possédées (${catCounts.owned})`]
    ].map(([k,l])=>`<button type="button" class="fr-chip ${cardCatFilter===k?'on':''}" data-cardcat="${k}">${l}</button>`).join('')}
  </div>`;

  const cardsGrid=filtered.map(c=>{
    const own=boughtCard(c.id);
    const eq=eqId===c.id;
    const isPrev=prevId===c.id;
    const actBtn=eq
      ?`<button class="btn sm" disabled style="border-color:var(--green);color:var(--green)">Équipée</button>`
      :own
        ?`<button class="btn sm primary" data-eqcard="${c.id}">Équiper</button>`
        :`<button class="btn sm primary" data-buycard="${c.id}">${t('buy')} · ${c.price.toLocaleString(LOC[lang])} TC</button>`;
    return `<div class="sh-pcard-item ${eq?'is-eq':''} ${isPrev?'is-prev':''}" data-prevcard="${c.id}">
      <div class="sh-pcard-top">
        <span class="sh-pcard-tier" style="--tc:${c.tierCol}">${escA(c.tier)}</span>
        <span class="sh-pcard-code mono">${escA(c.code)}</span>
      </div>
      <div class="sh-pcard-stage">
        ${pcardPreviewHTML(ME,c.id,true)}
      </div>
      <div class="sh-pcard-body">
        <div class="sh-pcard-title">
          <b>${escA(c.name)}</b>
          <span>${c.price===0?'Gratuit':tcHTML(c.price)}</span>
        </div>
        <p class="sh-pcard-desc">${escA(c.desc)}</p>
        <div class="sh-pcard-actions">
          <button class="btn sm ghost" data-prevcard-btn="${c.id}">${isPrev?'Aperçu actif':'Aperçu'}</button>
          ${actBtn}
        </div>
      </div>
    </div>`;
  }).join('');

  const devBanner=isDevUser()?`<div class="sh-cards-dev-banner"><span class="pb dev">${typeof devBadge==='function'?devBadge():'DEV'}</span><b>Accès développeur complet · Les 28 cartes sont débloquées pour test</b></div>`:'';

  return `<div class="sh-cards-hero">
    <div class="sh-cards-hero-left">
      ${devBanner}
      <div class="sh-cards-kicker">COLLECTION DE 28 CARTES · EFFETS ANIMÉS & ARMURERIE</div>
      <h2>Cartes de profil & Effets d'accueil</h2>
      <p>Personnalise ton emplacement sur l'écran d'accueil (5v5 & Wingman), dans le salon de match, la liste d'amis et ton profil public. Synchronisé en temps réel avec tous les joueurs de ton groupe.</p>
      <div class="sh-cards-preview-meta">
        <span class="sh-pcard-tier" style="--tc:${prevCard.tierCol}">${escA(prevCard.tier)}</span>
        <b>${escA(prevCard.name)}</b>
        <span class="mono" style="color:var(--dim);font-size:12px">${escA(prevCard.code)}</span>
      </div>
      <div class="sh-cards-preview-btns">
        ${stageAct}
        <button class="btn ghost" data-go-play-preview>Voir sur l'accueil</button>
      </div>
    </div>
    <div class="sh-cards-hero-right">
      <div class="sh-cards-live-label">APERÇU EN DIRECT (TON EMPLACEMENT GROUPE)</div>
      ${pcardPreviewHTML(ME,prevId,false)}
    </div>
  </div>
  ${filterBar}
  <div class="sh-pcard-grid">${cardsGrid}</div>`;
}

const PROFILE_BGS=[
  {id:'default',cat:'classic',name:'Néant Standard',tier:'Standard',tierCol:'#7a7e87',price:0,anim:false,interactive:false,desc:'Fond d\'origine sombre et épuré gris anthracite mat.'},
  {id:'cyber_city',cat:'animated',name:'Mégalopole Cyberpunk',tier:'Animé · Néo-Tokyo',tierCol:'#06b6d4',price:1500,anim:true,interactive:false,desc:'Nuit pluvieuse sous les néons cyan et pourpre, gratte-ciels holographiques et halos lumineux.'},
  {id:'deep_cosmos',cat:'animated',name:'Nébuleuse Cosmique',tier:'Animé · Espace',tierCol:'#8b5cf6',price:1800,anim:true,interactive:false,desc:'Poussières d\'étoiles galactiques mouvantes, nébuleuse violette et étoiles scintillantes.'},
  {id:'matrix_code',cat:'animated',name:'Pluie Matricielle 128T',tier:'Animé · Terminal',tierCol:'#22c55e',price:2000,anim:true,interactive:false,desc:'Colonnes de code vert émeraude tombant en cascade numérique continue.'},
  {id:'frost_glacier',cat:'animated',name:'Sanctuaire Cryo',tier:'Animé · Glace',tierCol:'#38bdf8',price:2100,anim:true,interactive:false,desc:'Cristaux de glace dérivants, vents polaires et brume cryogénique scintillante.'},
  {id:'hyper_grid',cat:'interactive',name:'Grille Synthwave 3D',tier:'Interactif · Parallaxe',tierCol:'#ec4899',price:2400,anim:true,interactive:true,desc:'Grille perspective rétro en fil de fer néon qui s\'incline et suit les mouvements de la souris.'},
  {id:'magma_forge',cat:'animated',name:'Forge Magmatique',tier:'Animé · Feu',tierCol:'#f97316',price:2400,anim:true,interactive:false,desc:'Lave incandescente en fusion, flux de chaleur et volutes de braises ardentes qui montent.'},
  {id:'aurora_sky',cat:'animated',name:'Ciel d\'Aurore Polaire',tier:'Animé · Céleste',tierCol:'#2dd4bf',price:2500,anim:true,interactive:false,desc:'Draperies ondulantes vert émeraude et bleu glacier sur un fond étoilé apaisant.'},
  {id:'quantum_field',cat:'interactive',name:'Champ Quantique Réactif',tier:'Interactif · Réactif',tierCol:'#6366f1',price:2700,anim:true,interactive:true,desc:'Vortex de plasma énergétique et particules attirées par le curseur de la souris.'},
  {id:'bubble_ambient',cat:'interactive',name:'Bulles Holographiques',tier:'Interactif · Organique',tierCol:'#e87da0',price:2800,anim:true,interactive:true,desc:'Sphères d\'énergie flottantes réactives qui s\'adaptent et ondulent autour des cartes du profil.'},
  {id:'dragons_lair',cat:'prestige',name:'Repaire du Dragon',tier:'Prestige Mythique',tierCol:'#e5b53b',price:3200,anim:true,interactive:false,desc:'Ornementations royales or et bronze, yeux de dragon rougeoyants et braises dorées.'},
  {id:'golden_dynasty',cat:'prestige',name:'Dynastie d\'Or 24K',tier:'Prestige Royal',tierCol:'#eab308',price:3800,anim:false,interactive:false,desc:'Finition or brossé haute joaillerie, rayons de lumière spéculaire et géométrie noble.'},
  {id:'blood_eclipse',cat:'animated',name:'Éclipse Sanglante',tier:'Animé · Occulte',tierCol:'#e11d48',price:2200,anim:true,interactive:false,desc:'Lune rouge sang éclipsée, brumes pourpres denses et braises écarlates qui flottent lentement.'},
  {id:'cyber_arcade',cat:'animated',name:'Arcade Cyberpunk 84',tier:'Animé · Rétro',tierCol:'#06b6d4',price:2500,anim:true,interactive:false,desc:'Salle d\'arcade rétro baignée de néons verticaux, reflets de pluie et marquages synthwave.'},
  {id:'aurora_borealis_hd',cat:'animated',name:'Aurore Boréale Boréalis',tier:'Animé · Arctique',tierCol:'#34d399',price:2600,anim:true,interactive:false,desc:'Drapés célestes haute définition émeraude et cyan ondulant au-dessus d\'un horizon polaire.'},
  {id:'sakura_dream',cat:'animated',name:'Rêve de Sakura',tier:'Animé · Zen',tierCol:'#f472b6',price:2900,anim:true,interactive:false,desc:'Pluie continue de pétales de fleurs de cerisier rose pastel au crépuscule féerique.'},
  {id:'black_hole_event',cat:'animated',name:'Horizon des Événements',tier:'Animé · Cosmique',tierCol:'#a855f7',price:3500,anim:true,interactive:false,desc:'Disque d\'accrétion en rotation gravitationnelle extrême avec lentille relativiste.'},
  {id:'glitch_dimension',cat:'interactive',name:'Dimension Glitchée',tier:'Interactif · Cyber',tierCol:'#38bdf8',price:3900,anim:true,interactive:true,desc:'Distorsions de signal RGB et artefacts cybernétiques qui se déplacent et vibrent avec le curseur.'}
];
const VALID_BG_IDS=new Set(PROFILE_BGS.map(b=>b.id));
function validBgId(id){return VALID_BG_IDS.has(id)?id:'default'}
function boughtBg(id){
  if(id==='default'||isDevUser())return true;
  return Array.isArray(SHOP.bgs)&&SHOP.bgs.includes(id);
}
function profileBgOf(p){
  if(!p)return 'default';
  const isMe=p.me||(typeof ME!=='undefined'&&ME&&p.name&&p.name.toLowerCase()===ME.name.toLowerCase());
  const raw=isMe?(ME.bgStyle||p.bgStyle||'default'):(p.bgStyle||'default');
  return validBgId(raw);
}
function bgObjOf(id){return PROFILE_BGS.find(b=>b.id===validBgId(id))||PROFILE_BGS[0]}

function profileBgHTML(bgId){
  const id=validBgId(bgId);
  switch(id){
    case 'cyber_city':
      return `<div class="p-steam-bg p-steam-bg-cyber_city" id="profileSteamBg">
        <div class="pbg-layer pbg-sky"></div>
        <div class="pbg-layer pbg-city-skyline">
          <svg viewBox="0 0 1200 400" preserveAspectRatio="none">
            <g fill="#070a12" opacity=".95">
              <rect x="40" y="140" width="85" height="260"/><rect x="65" y="100" width="30" height="40"/>
              <rect x="150" y="190" width="70" height="210"/>
              <rect x="250" y="80" width="110" height="320"/><line x1="305" y1="20" x2="305" y2="80" stroke="#06b6d4" stroke-width="2"/>
              <rect x="390" y="170" width="90" height="230"/>
              <rect x="520" y="120" width="130" height="280"/>
              <rect x="680" y="160" width="80" height="240"/>
              <rect x="790" y="70" width="120" height="330"/><line x1="850" y1="10" x2="850" y2="70" stroke="#ec4899" stroke-width="2"/>
              <rect x="940" y="150" width="100" height="250"/>
              <rect x="1070" y="110" width="90" height="290"/>
            </g>
            <g fill="none" stroke="#06b6d4" stroke-width="1" opacity=".4">
              <line x1="260" y1="100" x2="350" y2="100"/><line x1="260" y1="130" x2="350" y2="130"/>
              <line x1="800" y1="90" x2="900" y2="90"/><line x1="800" y1="120" x2="900" y2="120"/>
            </g>
          </svg>
        </div>
        <div class="pbg-layer pbg-rain"></div>
        <div class="pbg-layer pbg-hologlow"></div>
      </div>`;
    case 'deep_cosmos':
      return `<div class="p-steam-bg p-steam-bg-deep_cosmos" id="profileSteamBg">
        <div class="pbg-layer pbg-nebula"></div>
        <div class="pbg-layer pbg-stars">
          <svg viewBox="0 0 1000 600" preserveAspectRatio="none">
            <g fill="#ffffff" opacity=".8">
              <circle cx="120" cy="80" r="1.5" class="pcard-svg-blink"/><circle cx="280" cy="140" r="1.2" class="pcard-svg-blink" style="animation-delay:.6s"/>
              <circle cx="450" cy="50" r="2" class="pcard-svg-blink" style="animation-delay:1.2s"/><circle cx="680" cy="110" r="1.6" class="pcard-svg-blink" style="animation-delay:.3s"/>
              <circle cx="850" cy="70" r="1.4" class="pcard-svg-blink" style="animation-delay:.9s"/><circle cx="920" cy="190" r="1.8" class="pcard-svg-blink" style="animation-delay:1.5s"/>
              <circle cx="180" cy="260" r="1.2" class="pcard-svg-blink" style="animation-delay:.7s"/><circle cx="560" cy="280" r="1.5" class="pcard-svg-blink" style="animation-delay:1.1s"/>
              <circle cx="780" cy="320" r="1.3" class="pcard-svg-blink" style="animation-delay:.4s"/><circle cx="340" cy="420" r="2.2" class="pcard-svg-blink" style="animation-delay:1.6s"/>
            </g>
          </svg>
        </div>
        <div class="pbg-layer pbg-cosmic-glow"></div>
      </div>`;
    case 'matrix_code':
      return `<div class="p-steam-bg p-steam-bg-matrix_code" id="profileSteamBg">
        <div class="pbg-layer pbg-matrix-rain"></div>
        <div class="pbg-layer pbg-matrix-overlay"></div>
      </div>`;
    case 'frost_glacier':
      return `<div class="p-steam-bg p-steam-bg-frost_glacier" id="profileSteamBg">
        <div class="pbg-layer pbg-ice-gradient"></div>
        <div class="pbg-layer pbg-snowflakes"></div>
        <div class="pbg-layer pbg-frost-mist"></div>
      </div>`;
    case 'hyper_grid':
      return `<div class="p-steam-bg p-steam-bg-hyper_grid is-interactive" id="profileSteamBg">
        <div class="pbg-layer pbg-synth-sun"></div>
        <div class="pbg-layer pbg-synth-grid"></div>
        <div class="pbg-layer pbg-synth-horizon"></div>
      </div>`;
    case 'magma_forge':
      return `<div class="p-steam-bg p-steam-bg-magma_forge" id="profileSteamBg">
        <div class="pbg-layer pbg-lava-gradient"></div>
        <div class="pbg-layer pbg-magma-embers"></div>
        <div class="pbg-layer pbg-heat-distortion"></div>
      </div>`;
    case 'aurora_sky':
      return `<div class="p-steam-bg p-steam-bg-aurora_sky" id="profileSteamBg">
        <div class="pbg-layer pbg-aurora-ribbons"></div>
        <div class="pbg-layer pbg-aurora-stars"></div>
      </div>`;
    case 'quantum_field':
      return `<div class="p-steam-bg p-steam-bg-quantum_field is-interactive" id="profileSteamBg">
        <div class="pbg-layer pbg-quantum-glow"></div>
        <div class="pbg-layer pbg-quantum-particles"></div>
      </div>`;
    case 'bubble_ambient':
      return `<div class="p-steam-bg p-steam-bg-bubble_ambient is-interactive" id="profileSteamBg">
        <div class="pbg-layer pbg-bubble-gradient"></div>
        <div class="pbg-bubbles-container">
          <span class="pbg-bubble b1"></span><span class="pbg-bubble b2"></span>
          <span class="pbg-bubble b3"></span><span class="pbg-bubble b4"></span>
          <span class="pbg-bubble b5"></span><span class="pbg-bubble b6"></span>
        </div>
      </div>`;
    case 'dragons_lair':
      return `<div class="p-steam-bg p-steam-bg-dragons_lair" id="profileSteamBg">
        <div class="pbg-layer pbg-dragon-scales"></div>
        <div class="pbg-layer pbg-dragon-eyes">
          <span class="dragon-eye left"></span><span class="dragon-eye right"></span>
        </div>
        <div class="pbg-layer pbg-dragon-glow"></div>
      </div>`;
    case 'golden_dynasty':
      return `<div class="p-steam-bg p-steam-bg-golden_dynasty" id="profileSteamBg">
        <div class="pbg-layer pbg-gold-sweep"></div>
        <div class="pbg-layer pbg-gold-pattern"></div>
      </div>`;
    case 'blood_eclipse':
      return `<div class="p-steam-bg p-steam-bg-blood_eclipse" id="profileSteamBg">
        <div class="pbg-layer pbg-blood-sky"></div>
        <div class="pbg-layer pbg-blood-moon"></div>
        <div class="pbg-layer pbg-blood-embers"></div>
      </div>`;
    case 'cyber_arcade':
      return `<div class="p-steam-bg p-steam-bg-cyber_arcade" id="profileSteamBg">
        <div class="pbg-layer pbg-arcade-grid"></div>
        <div class="pbg-layer pbg-arcade-neons"></div>
        <div class="pbg-layer pbg-arcade-scanlines"></div>
      </div>`;
    case 'aurora_borealis_hd':
      return `<div class="p-steam-bg p-steam-bg-aurora_borealis_hd" id="profileSteamBg">
        <div class="pbg-layer pbg-hd-aurora-sky"></div>
        <div class="pbg-layer pbg-hd-aurora-curtains"></div>
        <div class="pbg-layer pbg-hd-aurora-stars"></div>
      </div>`;
    case 'sakura_dream':
      return `<div class="p-steam-bg p-steam-bg-sakura_dream" id="profileSteamBg">
        <div class="pbg-layer pbg-sakura-night"></div>
        <div class="pbg-layer pbg-sakura-petals"></div>
        <div class="pbg-layer pbg-sakura-glow"></div>
      </div>`;
    case 'black_hole_event':
      return `<div class="p-steam-bg p-steam-bg-black_hole_event" id="profileSteamBg">
        <div class="pbg-layer pbg-bh-void"></div>
        <div class="pbg-layer pbg-bh-accretion"></div>
        <div class="pbg-layer pbg-bh-lensing"></div>
      </div>`;
    case 'glitch_dimension':
      return `<div class="p-steam-bg p-steam-bg-glitch_dimension is-interactive" id="profileSteamBg">
        <div class="pbg-layer pbg-glitch-layer1"></div>
        <div class="pbg-layer pbg-glitch-layer2"></div>
        <div class="pbg-layer pbg-glitch-scan"></div>
      </div>`;
    default:
      return `<div class="p-steam-bg p-steam-bg-default" id="profileSteamBg">
        <div class="pbg-layer pbg-default-vignette"></div>
      </div>`;
  }
}

function bindProfileBgInteractive(el,bgId){
  if(!el)return;
  const bg=el.querySelector('#profileSteamBg');
  if(!bg||!bg.classList.contains('is-interactive'))return;
  el.onmousemove=e=>{
    const r=el.getBoundingClientRect();
    if(!r.width||!r.height)return;
    const x=(e.clientX-r.left)/r.width;
    const y=(e.clientY-r.top)/r.height;
    const px=(x-0.5)*36;
    const py=(y-0.5)*36;
    bg.style.setProperty('--pbg-x',`${(x*100).toFixed(1)}%`);
    bg.style.setProperty('--pbg-y',`${(y*100).toFixed(1)}%`);
    bg.style.setProperty('--pbg-px',`${px.toFixed(1)}px`);
    bg.style.setProperty('--pbg-py',`${py.toFixed(1)}px`);
  };
  el.onmouseleave=()=>{
    bg.style.setProperty('--pbg-x','50%');
    bg.style.setProperty('--pbg-y','30%');
    bg.style.setProperty('--pbg-px','0px');
    bg.style.setProperty('--pbg-py','0px');
  };
}

let bgPreviewId=null;
let bgCatFilter='all';

async function equipBgStyle(id){
  const bgId=validBgId(id);
  if(!boughtBg(bgId)){
    toast(t('se_need_buy')||'Débloque d\'abord ce fond.');
    return;
  }
  ME.bgStyle=bgId;
  try{localStorage.setItem('tr_bg_style',bgId)}catch(e){}
  if(typeof saveLocalProfile==='function')saveLocalProfile();
  if(typeof fbSyncMe==='function')fbSyncMe({bgStyle:bgId});
  if(typeof fbReq==='function'&&typeof fbMailbox==='function'&&ME.name){
    fbReq(`playerDirectory/${fbMailbox(ME.name)}/bgStyle`,'PUT',bgId,true);
  }
  if(!$('#profile').hidden&&typeof renderProfile==='function')renderProfile();
  if($('#editModal')&&$('#editModal').classList.contains('on')&&typeof renderEditor==='function')renderEditor();
  if(!$('#shop').hidden&&typeof renderShop==='function')renderShop();
  toast(t('bg_equipped',{n:bgObjOf(bgId).name}));
}

async function buyBgStyle(id){
  const bg=bgObjOf(id);
  if(!bg)return;
  if(isDevUser()){equipBgStyle(bg.id);toast('Accès Développeur · Fond Steam « '+bg.name+' » équipé !');return;}
  if(srvOn()){
    const r=await fbCall('buyShop',{kind:'bg',ref:bg.id});
    if(r.error)return toast(seErr(r.error));
    if(!Array.isArray(SHOP.bgs))SHOP.bgs=[];
    if(!SHOP.bgs.includes(bg.id))SHOP.bgs.push(bg.id);
    saveShop();
    await seRefresh();
    equipBgStyle(bg.id);
    return;
  }
  if(!spend(bg.price))return;
  if(!Array.isArray(SHOP.bgs))SHOP.bgs=[];
  if(!SHOP.bgs.includes(bg.id))SHOP.bgs.push(bg.id);
  saveShop();
  equipBgStyle(bg.id);
}

function shopBgsHTML(){
  const eqId=validBgId(ME.bgStyle||'default');
  const prevId=validBgId(bgPreviewId||eqId);
  const prevBg=bgObjOf(prevId);
  const prevOwned=boughtBg(prevId);
  const prevEquipped=eqId===prevId;
  const isDev=isDevUser();

  const stageAct=prevEquipped
    ?`<span class="pill" style="border-color:var(--green);color:var(--green)">Actuellement équipé sur ton profil Steam</span>`
    :prevOwned||isDev
      ?`<button class="btn primary" data-eqbg="${prevBg.id}">Équiper sur mon profil${isDev&&!prevOwned?' (Test Dev)':''}</button>`
      :`<button class="btn primary" data-buybg="${prevBg.id}">Acheter et équiper · ${prevBg.price.toLocaleString(LOC[lang])} TC</button>`;

  const filtered=PROFILE_BGS.filter(b=>{
    if(bgCatFilter==='animated')return !!b.anim;
    if(bgCatFilter==='interactive')return !!b.interactive;
    if(bgCatFilter==='prestige')return b.cat==='prestige';
    if(bgCatFilter==='owned')return boughtBg(b.id);
    return true;
  });

  const catCounts={
    all:PROFILE_BGS.length,
    animated:PROFILE_BGS.filter(b=>b.anim).length,
    interactive:PROFILE_BGS.filter(b=>b.interactive).length,
    prestige:PROFILE_BGS.filter(b=>b.cat==='prestige').length,
    owned:PROFILE_BGS.filter(b=>boughtBg(b.id)).length
  };

  const filterBar=`<div class="sh-cards-filters">
    ${[
      ['all',`Tous les fonds (${catCounts.all})`],
      ['animated',`Effets Animés (${catCounts.animated})`],
      ['interactive',`Interactifs (Souris/Bulles) (${catCounts.interactive})`],
      ['prestige',`Prestige & Mythique (${catCounts.prestige})`],
      ['owned',`Possédés (${catCounts.owned})`]
    ].map(([k,l])=>`<button type="button" class="fr-chip ${bgCatFilter===k?'on':''}" data-bgcat="${k}">${l}</button>`).join('')}
  </div>`;

  const bgsGrid=filtered.map(b=>{
    const own=boughtBg(b.id);
    const eq=eqId===b.id;
    const isPrev=prevId===b.id;
    const actBtn=eq
      ?`<button class="btn sm" disabled style="border-color:var(--green);color:var(--green)">Équipé</button>`
      :own
        ?`<button class="btn sm primary" data-eqbg="${b.id}">Équiper</button>`
        :isDev
          ?`<button class="btn sm primary" data-eqbg="${b.id}">Équiper (Dev)</button>`
          :`<button class="btn sm primary" data-buybg="${b.id}">${t('buy')} · ${b.price.toLocaleString(LOC[lang])} TC</button>`;

    return `<div class="sh-bg-item ${eq?'is-eq':''} ${isPrev?'is-prev':''}" data-prevbg="${b.id}">
      <div class="sh-bg-thumb-wrap">
        <div class="sh-bg-thumb-stage">${profileBgHTML(b.id)}</div>
        <div class="sh-bg-tag" style="--tc:${b.tierCol}">${escA(b.tier)}</div>
        ${b.interactive?`<span class="sh-bg-inter-pill"><svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" width="12" height="12"><path d="M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192 192-86 192-192z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32"/><circle cx="256" cy="256" r="144"/></svg> Interactif</span>`:''}
      </div>
      <div class="sh-pcard-body">
        <div class="sh-pcard-title">
          <b>${escA(b.name)}</b>
          <span>${b.price===0?'Gratuit':tcHTML(b.price)}</span>
        </div>
        <p class="sh-pcard-desc">${escA(b.desc)}</p>
        <div class="sh-pcard-actions">
          <button class="btn sm ghost" data-prevbg-btn="${b.id}">${isPrev?'Aperçu actif':'Aperçu'}</button>
          ${actBtn}
        </div>
      </div>
    </div>`;
  }).join('');

  const devBanner=isDevUser()?`<div class="sh-cards-dev-banner"><span class="pb dev">${typeof devBadge==='function'?devBadge():'DEV'}</span><b>Accès développeur complet · Les 12 fonds de profil Steam sont débloqués pour test</b></div>`:'';

  return `<div class="sh-bgs-hero">
    <div class="sh-bgs-hero-stage">
      ${profileBgHTML(prevId)}
      <div class="sh-bgs-hero-content">
        <div class="sh-cards-hero-left">
          ${devBanner}
          <div class="sh-cards-kicker">FONDS DE PROFIL INTERACTIFS & ANIMÉS (STYLE STEAM)</div>
          <h2>Arrière-plans de Profil Steam</h2>
          <p>Un décor immersif qui habille l'intégralité de ton profil lorsque des joueurs le consultent. Certains fonds réagissent directement à la position du curseur et créent des bulles holographiques en temps réel.</p>
          <div class="sh-cards-preview-meta">
            <span class="sh-pcard-tier" style="--tc:${prevBg.tierCol}">${escA(prevBg.tier)}</span>
            <b>${escA(prevBg.name)}</b>
            ${prevBg.interactive?'<span class="pill" style="border-color:#ec4899;color:#ec4899">Curseur interactif</span>':''}
          </div>
          <div class="sh-cards-preview-btns">
            ${stageAct}
            <button class="btn ghost" data-go-profile-preview>Voir sur mon profil</button>
          </div>
        </div>
        <div class="sh-bgs-hero-right">
          <div class="sh-bgs-mini-profile">
            <div class="avatar big" style="${avStyle(ME)}">${avInner(ME)}</div>
            <b>${escA(ME.name)}</b>
            <span>${ME.elo} ELO · ${t('rank_'+rankOf(ME.elo).fam.id)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  ${filterBar}
  <div class="sh-bg-grid">${bgsGrid}</div>`;
}

document.addEventListener('click',e=>{
  const catB=e.target.closest('[data-cardcat]');
  if(catB){cardCatFilter=catB.dataset.cardcat;renderShop();return}
  const buyB=e.target.closest('[data-buycard]');
  if(buyB){buyCardStyle(buyB.dataset.buycard);return}
  const eqB=e.target.closest('[data-eqcard]');
  if(eqB){equipCardStyle(eqB.dataset.eqcard);return}
  const prB=e.target.closest('[data-prevcard-btn]');
  if(prB){cardPreviewId=validCardId(prB.dataset.prevcardBtn);renderShop();return}
  const cardTile=e.target.closest('[data-prevcard]');
  if(cardTile&&!e.target.closest('button')){cardPreviewId=validCardId(cardTile.dataset.prevcard);renderShop();return}
  if(e.target.closest('[data-go-play-preview]')){setView('play');return}

  const bgCatB=e.target.closest('[data-bgcat]');
  if(bgCatB){bgCatFilter=bgCatB.dataset.bgcat;renderShop();return}
  const buyBgB=e.target.closest('[data-buybg]');
  if(buyBgB){buyBgStyle(buyBgB.dataset.buybg);return}
  const eqBgB=e.target.closest('[data-eqbg]');
  if(eqBgB){equipBgStyle(eqBgB.dataset.eqbg);return}
  const prBgB=e.target.closest('[data-prevbg-btn]');
  if(prBgB){bgPreviewId=validBgId(prBgB.dataset.prevbgBtn);renderShop();return}
  const bgTile=e.target.closest('[data-prevbg]');
  if(bgTile&&!e.target.closest('button')){bgPreviewId=validBgId(bgTile.dataset.prevbg);renderShop();return}
  if(e.target.closest('[data-go-profile-preview]')){setView('profile');return}
});


