let cpTab='leagues',cpTn=null,tnFilter='all',lgRegion='all';
let lgSel=null;
const cpSave=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const cpLoad=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}};

const LEAGUES=RANK_FAM;
const PRO_SIZE=20;
const PRO={id:'pro',n:'Pro League',c:'#ffb21f',c2:'#8a5400',icon:'pro',pc:.1,prize:10000};
const lgName=L=>L.n;
const leagueOf=elo=>rankOf(elo).fam;
function divInfo(elo){
  const R=rankOf(elo),N=RANKS[R.i+1];
  return {L:R.fam,R,d:R.name,next:N?N.name:null,nextAt:N?N.min:null,lo:R.min,hi:N?N.min:R.min+600};
}
function seasonInfo(){const n=new Date(),q=Math.floor(n.getMonth()/3),end=new Date(n.getFullYear(),q*3+3,1);return {n:(n.getFullYear()-2026)*4+q-2,days:Math.ceil((end-n)/864e5)}}
const emblem=(L,R,sm)=>`<div class="emb2 ${sm?'sm':''}">${R?rankSVG(R.fam,R.step,R.steps):rankSVG(L)}</div>`;
const REGION={FR:'EU',DE:'EU',PL:'EU',SE:'EU',ES:'EU',BE:'EU',CZ:'EU',RS:'EU',DK:'EU',FI:'EU',RU:'CIS',UA:'CIS',KZ:'CIS',BY:'CIS',US:'NA',CA:'NA',BR:'SA',AR:'SA',CN:'ASIA',KR:'ASIA',MN:'ASIA',JP:'ASIA',AU:'OCE'};
let WORLD=null;
function worldList(){
  if(divReal()){loadWorld();return WREAL.list||[]}
  if(WORLD)return WORLD;
  const r=seeded(2026),names=['s1lent','Vyrex','Kaspar','blixx','Morrow','Nitr0x','coldfire','Aleksa','Tw1st','R1ck','ShaoLin','Kuro','dukes','Fenrir','Hollow','yuzu','b1t3','Ravn','Strix','Elgo','Axion','Perpetua','frozen','Kestrel','yekin','Mazino','Tabby','Bymo','iMo','Jael','Shiro','headtr1ck','Dunk','w0nder','Jamo','Xanth','Brolo','Hunta','zont','Dega'];
  const ctry=['US','BR','DK','FI','CN','KR','MN','AU','CA','AR','RU','UA','KZ','DE','PL','SE','FR'];
  const extra=names.map((n,i)=>{let p=REG.get(n);if(!p){p=makePlayer(n,2700,'high',260);p.country=ctry[Math.floor(r()*ctry.length)];p.elo=Math.round(2420+r()*560);REG.set(n,p)}return p});
  WORLD=[...extra,...LB.filter(p=>p.elo>=2100)];
  return WORLD;
}
let DIVCACHE={};
function divisionOf(elo,withMe=true){
  const di=divInfo(elo),key=di.L.id+(di.d||'');
  if(!DIVCACHE[key]){const lst=[];const base=Math.round((di.lo+di.hi)/2),spread=Math.round((di.hi-di.lo)/2);
    for(let i=0;i<29;i++){const p=newPlayer(base,'high',spread);if(p.elo<di.lo)p.elo=di.lo+rnd(0,20);if(p.elo>=di.hi)p.elo=di.hi-rnd(1,20);lst.push(p)}DIVCACHE[key]=lst}
  return [...DIVCACHE[key],...(withMe?[ME]:[])].sort((a,b)=>b.elo-a.elo);
}
const DIVREAL={},DIV_TTL=60e3,DIV_MAX=80,DIV_PAGE=30;
let lgShowAll=false,lgFilter='';
let _cpRaf=0;
function scheduleRenderCompet(){
  if(_cpRaf)return;
  _cpRaf=requestAnimationFrame(()=>{
    _cpRaf=0;
    const el=$('#compet');
    if(!el||el.hidden)return;
    if(document.activeElement&&el.contains(document.activeElement)&&document.activeElement.tagName==='INPUT')return;
    renderCompet();
  });
}
const divReal=()=>typeof fbLive==='function'&&fbLive()&&AUTH.mode==='firebase'&&!!FBA.uid;
function pBadgeSig(p){return `${p.name}:${p.elo}:${p.plan||'free'}:${p.dev?1:0}:${p.beta?1:0}:${p.influencer?1:0}`}
function realPlayer(uid,x){
  if(typeof FBA!=='undefined'&&uid===FBA.uid){
    ME.uid=FBA.uid;
    if(x.plan)ME.plan=x.plan;
    if(x.influencer!==undefined)ME.influencer=x.influencer||null;
    if(x.beta!==undefined)ME.beta=!!(ME.beta||x.beta);
    if(x.dev!==undefined)ME.dev=!!(ME.dev||x.dev);
    return ME;
  }
  const name=x.name||'Joueur';let p=REG.get(name);
  if(!p){p=makePlayer(name,x.elo||1000,'high',0);p.matches=0;p.history=[];REG.set(name,p)}
  const rc=typeof ADM_ROLES!=='undefined'&&uid&&ADM_ROLES[uid];
  Object.assign(p,{
    uid,
    elo:typeof x.elo==='number'?x.elo:1000,
    country:x.country||p.country,
    matches:x.matches||0,
    wins:x.wins||0,
    plan:x.plan||(rc&&rc.plan)||p.plan||'free',
    influencer:x.influencer||(rc&&rc.influencer)||p.influencer||null,
    beta:!!(x.beta||(rc&&rc.beta)||p.beta),
    dev:!!(x.dev||(rc&&rc.dev)||p.dev)
  });
  if(x.avatar)p.steamAvatar=x.avatar;
  return p;
}
function saveDivCache(){
  try{
    const out={};
    for(const [k,v] of Object.entries(DIVREAL)){
      if(v&&Array.isArray(v.list)){
        out[k]={at:v.at||0,rows:v.list.slice(0,DIV_MAX).map(p=>({uid:p.uid||(p.me&&typeof FBA!=='undefined'?FBA.uid:'me'),name:p.name,elo:p.elo,country:p.country,matches:p.matches||0,wins:p.wins||0,plan:p.plan||'free',influencer:p.influencer||null,beta:!!p.beta,dev:!!p.dev,avatar:p.steamAvatar||null}))};
      }
    }
    localStorage.setItem('tr_divreal_cache',JSON.stringify(out));
  }catch(e){}
}
async function loadDivision(key,query,keep=()=>true){
  const c=DIVREAL[key];if(c&&(c.loading||Date.now()-c.at<DIV_TTL))return;
  DIVREAL[key]={...(c||{}),loading:true};
  const res=await fbReq(query);
  const list=res&&typeof res==='object'?Object.entries(res).map(([u,x])=>realPlayer(u,x||{})).filter(keep).sort((a,b)=>b.elo-a.elo):(c&&c.list)||[];
  const prevSig=(c&&c.list||[]).map(pBadgeSig).join('|');
  const nextSig=list.map(pBadgeSig).join('|');
  DIVREAL[key]={at:Date.now(),list,loading:false};
  saveDivCache();
  if(prevSig!==nextSig&&cpTab==='leagues'&&!$('#compet').hidden)scheduleRenderCompet();
  if(typeof admHydrateBadges==='function')admHydrateBadges(list,()=>{saveDivCache();if(cpTab==='leagues'&&!$('#compet').hidden)scheduleRenderCompet()});
}
const WREAL={at:0,list:null,loading:false,above:null,aboveElo:null,aboveCap:false},WORLD_MAX=100,ABOVE_CAP=500;
function hydrateCompetCache(){
  try{
    const w=JSON.parse(localStorage.getItem('tr_wreal_cache')||'null');
    if(w&&Array.isArray(w.rows)){
      WREAL.list=w.rows.map(x=>realPlayer(x.uid||x.name,x)).sort((a,b)=>b.elo-a.elo);
      WREAL.above=typeof w.above==='number'?w.above:0;
      WREAL.aboveCap=!!w.aboveCap;
      WREAL.aboveElo=typeof w.aboveElo==='number'?w.aboveElo:ME.elo;
      WREAL.at=0;
    }
    const dv=JSON.parse(localStorage.getItem('tr_divreal_cache')||'null');
    if(dv&&typeof dv==='object'){
      for(const [k,v] of Object.entries(dv)){
        if(v&&Array.isArray(v.rows)&&!DIVREAL[k]){
          DIVREAL[k]={at:0,list:v.rows.map(x=>realPlayer(x.uid||x.name,x)).sort((a,b)=>b.elo-a.elo),loading:false};
        }
      }
    }
  }catch(e){}
}
hydrateCompetCache();
function saveWorldCache(){
  try{
    localStorage.setItem('tr_wreal_cache',JSON.stringify({
      at:WREAL.at,above:WREAL.above,aboveCap:WREAL.aboveCap,aboveElo:WREAL.aboveElo,
      rows:(WREAL.list||[]).slice(0,WORLD_MAX).map(p=>({uid:p.uid||(p.me&&typeof FBA!=='undefined'?FBA.uid:'me'),name:p.name,elo:p.elo,country:p.country,matches:p.matches||0,wins:p.wins||0,plan:p.plan||'free',influencer:p.influencer||null,beta:!!p.beta,dev:!!p.dev,avatar:p.steamAvatar||null}))
    }));
  }catch(e){}
}
async function loadWorld(){
  const fresh=Date.now()-WREAL.at<DIV_TTL;
  if(WREAL.loading||(fresh&&WREAL.aboveElo===ME.elo))return;
  WREAL.loading=true;
  const prevSig=(WREAL.list||[]).slice(0,25).map(pBadgeSig).join('|')+':'+WREAL.above;
  const needTop=!fresh;
  const needAbove=WREAL.aboveElo!==ME.elo;
  const [res,up]=await Promise.all([
    needTop?fbReq(`profiles?orderBy="elo"&limitToLast=${WORLD_MAX}`):Promise.resolve(null),
    needAbove?fbReq(`profiles?orderBy="elo"&startAt=${ME.elo+1}&limitToFirst=${ABOVE_CAP}`):Promise.resolve(null)
  ]);
  if(needTop){
    if(res&&typeof res==='object')WREAL.list=Object.entries(res).map(([u,x])=>realPlayer(u,x||{})).sort((a,b)=>b.elo-a.elo);
    else if(!WREAL.list)WREAL.list=[];
    PRO_RANK=null;
  }
  if(WREAL.list&&WREAL.list.includes(ME)){
    WREAL.above=WREAL.list.indexOf(ME);WREAL.aboveCap=false;WREAL.aboveElo=ME.elo;
  }else if(needAbove&&up&&typeof up==='object'){
    const n=Object.keys(up).filter(u=>u!==FBA.uid).length;
    WREAL.above=n;WREAL.aboveCap=n>=ABOVE_CAP;WREAL.aboveElo=ME.elo;
  }else if(WREAL.above==null){
    WREAL.above=0;WREAL.aboveCap=false;WREAL.aboveElo=ME.elo;
  }
  WREAL.at=Date.now();WREAL.loading=false;
  const nextSig=(WREAL.list||[]).slice(0,25).map(pBadgeSig).join('|')+':'+WREAL.above;
  saveWorldCache();
  if(prevSig!==nextSig&&cpTab==='leagues'&&!$('#compet').hidden)scheduleRenderCompet();
  if(typeof admHydrateBadges==='function'&&WREAL.list)admHydrateBadges(WREAL.list,()=>{saveWorldCache();if(cpTab==='leagues'&&!$('#compet').hidden)scheduleRenderCompet()});
}
setTimeout(()=>{
  const warm=()=>{
    if(!divReal())return false;
    loadWorld();
    const di=divInfo(ME.elo),sel=di.R.i,next=RANKS[sel+1];
    loadDivision('r'+sel,`profiles?orderBy="elo"&startAt=${di.R.min}${next?`&endAt=${next.min-1}`:''}&limitToLast=${DIV_MAX}`);
    if(typeof tqLoad==='function')tqLoad();
    return true;
  };
  if(!warm()){let n=0;const iv=setInterval(()=>{if(warm()||++n>25)clearInterval(iv)},1000)}
},1200);
function myWorldRank(world){
  const i=world.indexOf(ME);
  if(!divReal()||WREAL.list&&WREAL.list.includes(ME))return {n:i+1,cap:false};
  if(WREAL.above==null||WREAL.aboveElo!==ME.elo)return null;
  return {n:WREAL.above+1,cap:WREAL.aboveCap};
}
function cpQuickBarHTML(){
  const tm=typeof TQ!=='undefined'&&TQ.me&&TQ.me.team;
  const invCnt=typeof TQ!=='undefined'&&TQ.me&&Array.isArray(TQ.me.invites)?TQ.me.invites.length:0;
  const chalCnt=typeof TQ!=='undefined'&&TQ.me&&Array.isArray(TQ.me.challenges)?TQ.me.challenges.length:0;
  const tnOpen=typeof TZ!=='undefined'&&Array.isArray(TZ.list)?TZ.list.filter(x=>x&&(x.status==='open'||x.status==='live')).length:0;
  const lblTeam=lang==='en'?'My Team':lang==='ru'?'Моя команда':'Mon Équipe';
  const lblNoTeam=lang==='en'?'No active team':lang==='ru'?'Нет команды':'Aucune équipe active';
  const lblManage=lang==='en'?'Manage team':lang==='ru'?'Управление':'Gérer mon équipe';
  const lblCreate=lang==='en'?'Create / Join a team':lang==='ru'?'Создать / Вступить':'Créer ou rejoindre une équipe';
  const lblTn=lang==='en'?'Active tournaments':lang==='ru'?'Активные турниры':'Tournois ouverts';
  const lblSeeTn=lang==='en'?'View tournaments':lang==='ru'?'Смотреть турниры':'Voir les tournois';
  const se=tm&&tm.season||{w:0,l:0};
  const dvName=tm&&typeof divName==='function'?divName(tm.div||'open'):'OPEN DIVISION';
  const alertPill=(invCnt+chalCnt)>0?`<span class="pb elite" style="margin-left:6px">${invCnt+chalCnt} ALERTE${invCnt+chalCnt>1?'S':''}</span>`:'';
  const teamBlock=tm
    ?`<div class="cp-qitem"><span class="avatar" style="background:${safeCol(tm.color)};width:34px;height:34px;min-width:34px;font-size:11px;font-weight:800">${escA(tm.tag)}</span><div class="cp-qtxt"><small>${lblTeam}${alertPill}</small><b>[${escA(tm.tag)}] ${escA(tm.name)} · ${dvName} (${se.w}V - ${se.l}D)</b></div><button type="button" class="btn ghost sm" data-cpt="teamlg">${lblManage}</button></div>`
    :`<div class="cp-qitem"><span class="avatar" style="background:#1c2029;width:34px;height:34px;min-width:34px;font-size:14px;font-weight:800;color:var(--acc)">5v5</span><div class="cp-qtxt"><small>${lblTeam}${alertPill}</small><b>${lblNoTeam}${invCnt?` (${invCnt} invitation${invCnt>1?'s':''})`:''}</b></div><button type="button" class="btn primary sm" data-cpt="teamlg">${lblCreate}</button></div>`;
  const tnBlock=`<div class="cp-qitem"><span class="avatar" style="background:#1c2029;width:34px;height:34px;min-width:34px;font-size:12px;font-weight:800;color:#f2c14e">CUP</span><div class="cp-qtxt"><small>${lblTn}</small><b>${tnOpen} ${lang==='en'?'open / live':lang==='ru'?'открыто':'en cours ou inscriptions ouvertes'}</b></div><button type="button" class="btn ghost sm" data-cpt="tourneys">${lblSeeTn}</button></div>`;
  return `<div class="cp-quickbar">${teamBlock}${tnBlock}</div>`;
}
function lgSliderCardsHTML(divList){
  if(!Array.isArray(divList)||!divList.length)return '';
  const topList=divList.slice(0, 10);
  const cards=topList.map(({p,i})=>{
    const csId=typeof cardStyleOf==='function'?cardStyleOf(p):(p&&(p.cardStyle||p.card)||'default');
    const csObj=typeof cardObjOf==='function'?cardObjOf(csId):null;
    const tierCol=csObj?csObj.tierCol:'#8b95a5';
    const tierName=csObj?csObj.tier:'Standard';
    const isMe=p.me||(typeof ME!=='undefined'&&ME&&p.name&&p.name.toLowerCase()===ME.name.toLowerCase());
    return `<div class="dc-card ${isMe?'is-me':''} pcard-cs-${csId}" data-profile="${escA(p.name)}" style="--tc:${tierCol}">
      <div class="dc-card-top" style="background:${bannerCSS(p.banner)}">
        <span class="dc-rank-pill">#${i+1}</span>
        ${csId!=='default'?`<span class="dc-card-tag">${escA(tierName)}</span>`:''}
      </div>
      <div class="dc-card-body">
        <div class="dc-card-av-slot">
          ${avHTML(p, 46)}
        </div>
        <div class="dc-card-meta">
          <div class="dc-card-name">
            <b>${escA(p.name)}</b>
            ${p.country==='FR'?'<span class="flag" title="France"></span>':`<span class="cc">${escA(p.country||'EU')}</span>`}
          </div>
          <div class="dc-card-badges">${planBadge(p)}</div>
          <div class="dc-card-score">
            ${lvlHTML(p.elo)}
            <span class="dc-elo"><b>${p.elo}</b> ELO</span>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
  return `<div class="lg-slider-section">
    <div class="lg-slider-header">
      <div class="lg-slider-title">
        <svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" width="16" height="16"><path d="M368 16H144a64.07 64.07 0 00-64 64v352a64.07 64.07 0 0064 64h224a64.07 64.07 0 0064-64V80a64.07 64.07 0 00-64-64zm-34.52 268.51c7.57 8.17 11.27 19.16 10.39 30.94C342.14 338.91 324.25 358 304 358s-38.17-19.09-39.88-42.55c-.86-11.9 2.81-22.91 10.34-31S292.4 272 304 272a39.65 39.65 0 0129.48 12.51zM192 80a16 16 0 0116-16h96a16 16 0 010 32h-96a16 16 0 01-16-16zm189 363.83a12.05 12.05 0 01-9.31 4.17H236.31a12.05 12.05 0 01-9.31-4.17 13 13 0 01-2.76-10.92c3.25-17.56 13.38-32.31 29.3-42.66C267.68 381.06 285.6 376 304 376s36.32 5.06 50.46 14.25c15.92 10.35 26.05 25.1 29.3 42.66a13 13 0 01-2.76 10.92z"/></svg>
        <span>${t('lg_top_cards_title')||'Profils de la division'}</span>
      </div>
      <small>Top joueurs de la division · Défilement horizontal</small>
    </div>
    <div class="lg-cards-slider">${cards}</div>
  </div>`;
}

function leaguesHTML(){
  const di=divInfo(ME.elo),L=di.L,se=seasonInfo(),world=[...new Set([...worldList(),ME])].sort((a,b)=>b.elo-a.elo),wr=myWorldRank(world),myW=wr?wr.n:0,isPro=L.id==='elite'&&!!wr&&!wr.cap&&myW<=PRO_SIZE;
  const shown=isPro?PRO:L,pct=di.next?Math.max(0,Math.min(100,(ME.elo-di.lo)/(di.hi-di.lo)*100)):100;
  const hero=`<div class="lg-hero" style="--lc:${shown.c}">${isPro?`<div class="emb2 pro">${proSVG(myW)}</div>`:emblem(shown,di.R)}
    <div><div class="label" style="margin:0">${t('lg_season',{n:se.n})}</div><div class="lg-name">${isPro?lgName(PRO):di.R.name}</div>
      <div class="lg-sub">${isPro?t('lg_you_pro'):`${ME.elo} ELO · ${wr?`#${myW.toLocaleString(LOC[lang])}${wr.cap?'+':''}`:'<span class="spin inl"></span>'} ${t('lg_all').toLowerCase()}`}</div>
      <div class="lg-bar"><i style="width:${pct}%"></i></div>
      <div class="lg-meta"><span>${di.lo}</span><span>${di.next?t('lg_next',{n:di.nextAt-ME.elo,x:di.next}):t('lg_top')}</span><span>${di.next?di.hi:'∞'}</span></div></div>
    <div class="lg-season"><b>${se.days} j</b><small>${t('lg_ends',{d:se.days})}</small></div></div>`;
  const mine=isPro?'pro':di.R.i,sel=lgSel==null?mine:lgSel,selR=sel==='pro'?null:RANKS[sel],selFam=sel==='pro'?PRO:selR.fam;
  const steps=[...LEAGUES,PRO].map(x=>`<button type="button" class="lg-step ${(isPro?x.id==='pro':x===L)?'me':''} ${x===selFam?'sel':''}" data-lgfam="${x.id}" style="--lc:${x.c}">${emblem(x,null,true)}<b>${lgName(x)}</b><small>${x.id==='pro'?'Top '+PRO_SIZE:x.min+'+'}</small><span class="pc">${x.pc} %</span></button>`).join('');
  const world20=world.slice(0,PRO_SIZE);
  let div,divLoading=false;
  if(divReal()){
    const key=sel==='pro'?'pro':'r'+sel,next=sel==='pro'?null:RANKS[sel+1];
    const q=sel==='pro'?`profiles?orderBy="elo"&startAt=${LEAGUES.at(-1).min}&limitToLast=${PRO_SIZE}`
      :`profiles?orderBy="elo"&startAt=${selR.min}${next?`&endAt=${next.min-1}`:''}&limitToLast=${DIV_MAX}`;
    loadDivision(key,q);
    const c=DIVREAL[key];div=c&&c.list||[];divLoading=!c||(!c.list&&c.loading);
  }else div=sel==='pro'?world20:divisionOf(selR.min,sel===mine);
  const n=div.length,hasNext=sel!=='pro'&&!!RANKS[sel+1];
  const qf=lgFilter.trim().toLowerCase();
  const filteredDiv=qf?div.map((p,i)=>({p,i})).filter(x=>x.p.name.toLowerCase().includes(qf)):div.map((p,i)=>({p,i}));
  const shownDiv=lgShowAll||qf?filteredDiv:filteredDiv.slice(0,DIV_PAGE);
  const rows=shownDiv.map(({p,i})=>`<tr class="${p.me?'me':''} ${i<3&&hasNext?'zone-up':''} ${sel!=='pro'&&i>=n-3&&sel>0?'zone-down':''}"><td class="rk">${i+1}</td><td><div class="pl"><span data-profile="${escA(p.name)}">${avHTML(p,28)}</span><span data-profile="${escA(p.name)}">${escA(p.name)}</span>${planBadge(p)}</div></td><td><span class="rgn">${REGION[p.country]||'EU'}</span></td><td>${lvlHTML(p.elo)}</td><td class="rt">${p.elo}</td></tr>`).join('');
  const moreBtn=!qf&&filteredDiv.length>DIV_PAGE?`<div style="padding:10px 16px;border-top:1px solid var(--line);text-align:center"><button type="button" class="btn ghost sm" data-lgmore>${lgShowAll?(lang==='en'?'Show top 30':'Réduire aux 30 premiers'):(lang==='en'?`Show all (${filteredDiv.length})`:`Afficher toute la division (${filteredDiv.length})`)}</button></div>`:'';
  const rw=[...LEAGUES].reverse().map(x=>`<div class="rwd"><span style="display:flex;align-items:center;gap:8px">${emblem(x,null,true)}${lgName(x)}</span><b>${tcHTML(x.tc)}${x.min>=1950?` <small style="color:var(--muted);font-weight:400">+ ${t('lg_badge')}</small>`:''}</b></div>`).join('');
  const regs=['all','EU','CIS','NA','SA','ASIA','OCE'];
  const wl=world.filter(p=>lgRegion==='all'||(REGION[p.country]||'EU')===lgRegion).slice(0,20);
  if(divReal()&&typeof admHydrateBadges==='function'){
    const seen=new Set(),allShown=[];
    for(const x of [...shownDiv.map(d=>d.p),...wl])if(x&&!seen.has(x)){seen.add(x);allShown.push(x)}
    admHydrateBadges(allShown,()=>{saveDivCache();saveWorldCache();if(cpTab==='leagues'&&!$('#compet').hidden)scheduleRenderCompet()});
  }
  const wrows=wl.map(p=>{const r=p===ME&&wr?myW:world.indexOf(p)+1;return `<tr class="${p.me?'me':''}"><td class="rk">${r}</td><td><div class="pl"><span data-profile="${escA(p.name)}">${avHTML(p,28)}</span><span data-profile="${escA(p.name)}">${escA(p.name)}</span>${planBadge(p)}</div></td><td><span class="rgn">${REGION[p.country]||'EU'}</span></td><td class="rt">${p.elo}</td></tr>`}).join('');
  const searchPh=lang==='en'?'Filter division players...':lang==='ru'?'Поиск игрока в дивизионе...':'Filtrer un joueur dans cette division...';
  return hero+`<div class="lg-ladder">${steps}</div>
    <div class="cpl-grid"><div class="card lg-divcard" style="padding:0"><div class="h3" style="padding:14px 16px 0;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><div>${sel===mine?t('lg_your_div'):t('lg_div',{d:sel==='pro'?lgName(PRO):selR.name})} ${sel===mine?`<span style="margin-left:6px">${isPro?lgName(PRO):di.R.name}</span>`:''}</div><div style="display:flex;align-items:center;gap:8px"><input id="lgFilterIn" class="cp-filter-in" type="search" value="${escA(lgFilter)}" placeholder="${searchPh}" autocomplete="off">${sel===mine?'':`<button type="button" class="btn ghost sm" data-lgmine>${t('lg_mine')}</button>`}</div></div>
      ${sel==='pro'?'':`<div class="lg-subs">${RANKS.filter(r=>r.fam===selFam).map(r=>`<button type="button" class="${r.i===sel?'on':''} ${r.i===di.R.i&&!isPro?'me':''}" data-lgrank="${r.i}" title="${r.min}+ ELO"><span class="lg-subs-im">${rankSVG(r.fam,r.step,r.steps)}</span><b>${r.name}</b><small>${r.min}+</small></button>`).join('')}</div>`}
      ${lgSliderCardsHTML(shownDiv)}
      <div class="tbl-wrap"><table class="tbl rk-table" style="min-width:420px"><thead><tr><th class="rk">#</th><th style="text-align:left">${t('th_player')}</th><th style="text-align:left"></th><th class="c">${t('th_level')}</th><th>ELO</th></tr></thead><tbody id="lgDivTbody">${rows||`<tr><td colspan="5" class="lg-empty">${divLoading?'<span class="spin inl"></span>':t('lg_div_empty')}</td></tr>`}</tbody></table></div>
      ${moreBtn}
      <div class="lg-legend"><span><i style="background:var(--green)"></i>${t('lg_up')}</span><span><i style="background:var(--red)"></i>${t('lg_down')}</span></div></div>
      <div class="card"><div class="h3">${t('lg_rewards')} <span>${t('lg_ends',{d:se.days})}</span></div>${rw}</div></div>
    <div class="pro-band">${emblem(PRO,null,true)}<div><b>${t('lg_pro')} · ${t('lg_world')}</b><br><span>${t('lg_pro_t')}</span></div></div>
    <div class="card" style="padding:0"><div class="tn-tools" style="padding:12px 14px 0;margin:0"><div class="seg">${regs.map(x=>`<button class="${lgRegion===x?'on':''}" data-lgr="${x}">${x==='all'?t('lg_all'):x}</button>`).join('')}</div></div>
      <div class="tbl-wrap"><table class="tbl rk-table" style="min-width:380px"><thead><tr><th class="rk">#</th><th style="text-align:left">${t('th_player')}</th><th style="text-align:left"></th><th>ELO</th></tr></thead><tbody>${wrows||`<tr><td colspan="4" class="lg-empty">${divReal()&&!WREAL.list?'<span class="spin inl"></span>':t('lg_div_empty')}</td></tr>`}</tbody></table></div></div>`;
}

function renderCompet(){
  $('#competBody').innerHTML=`<div class="cp-head"><h1 class="h1">${t('cp_title')}</h1><button class="btn ghost sm" data-goview="ranking">${t('nav_ranking')}</button></div>
    <div class="cp-tabs">${[['leagues','cp_leagues'],['teamlg','cp_teamlg'],['tourneys','cp_tourneys']].map(([k,l])=>`<button class="${cpTab===k?'on':''}" data-cpt="${k}">${t(l)}</button>`).join('')}</div>
    ${cpTab==='leagues'?cpQuickBarHTML()+leaguesHTML():cpTab==='tourneys'?'<div id="tzBox"></div>':''}`;
  $('#leagues').hidden=cpTab!=='teamlg';
  if(cpTab==='teamlg')renderLeagues();
  if(cpTab==='tourneys')tzRender();
}
$('#compet').addEventListener('click',e=>{
  const g=e.target.closest('[data-goview]');if(g)return setView(g.dataset.goview);
  const tb=e.target.closest('[data-cpt]');if(tb){cpTab=tb.dataset.cpt;cpTn=null;return renderCompet()}
  const lr=e.target.closest('[data-lgr]');if(lr){lgRegion=lr.dataset.lgr;return renderCompet()}
  const lf=e.target.closest('[data-lgfam]');if(lf){const f=lf.dataset.lgfam;lgShowAll=false;
    if(f==='pro')lgSel='pro';else{const mineR=rankOf(ME.elo),fam=RANKS.filter(r=>r.fam.id===f);lgSel=(fam.find(r=>r===mineR)||fam[0]).i}
    renderCompet();return $('.lg-divcard')?.scrollIntoView({behavior:'smooth',block:'start'})}
  const lk=e.target.closest('[data-lgrank]');if(lk){lgSel=+lk.dataset.lgrank;lgShowAll=false;return renderCompet()}
  if(e.target.closest('[data-lgmine]')){lgSel=null;lgShowAll=false;return renderCompet()}
  if(e.target.closest('[data-lgmore]')){lgShowAll=!lgShowAll;return renderCompet()}
});
$('#compet').addEventListener('input',e=>{
  if(e.target.id==='lgFilterIn'){
    lgFilter=e.target.value;
    const q=lgFilter.trim().toLowerCase();
    $$('#lgDivTbody tr').forEach(tr=>{
      const nm=(tr.querySelector('[data-profile]')?.getAttribute('data-profile')||'').toLowerCase();
      if(nm)tr.hidden=!!q&&!nm.includes(q);
    });
  }
});

let PRO_RANK=null;
function proRanks(){
  if(PRO_RANK)return PRO_RANK;
  const w=[...new Set([...worldList(),ME])].sort((a,b)=>b.elo-a.elo);PRO_RANK=new Map();
  w.slice(0,PRO_SIZE).forEach((p,i)=>{if(p.elo>=2400)PRO_RANK.set(p.name,i+1)});
  setTimeout(()=>{PRO_RANK=null},20000);return PRO_RANK;
}
function prestigeOf(p){
  if(!p||p.elo==null||!p.name||!LB.length)return null;
  const r=proRanks().get(p.name);
  if(r)return {k:'pro',r};
  if(p.elo>=2400)return {k:'elite'};
  if(p.elo>=2100)return {k:'master'};
  return null;
}
function prestigeChip(p){const pr=prestigeOf(p);return !pr?'':pr.k==='pro'?`<span class="pb pro"><svg viewBox="0 0 24 16" aria-hidden="true"><path d="M5 13L3 4l4.5 4L12 3l4.5 5L21 4l-2 9H5z" fill="currentColor"/></svg>PRO #${pr.r}</span>`:pr.k==='elite'?`<span class="pb elite">${lgName(LEAGUES.at(-1)).toUpperCase()}</span>`:''}
function decorateProfile(){
  const el=$('#profile'),P=profileTarget||ME,pr=prestigeOf(P);
  el.classList.toggle('pp-pro',pr?.k==='pro');el.classList.toggle('pp-elite',pr?.k==='elite');
  const nm=el.querySelector('.p-banner');if(!nm||!pr||pr.k==='master'||nm.querySelector('.pro-plaque'))return;
  const target=nm.querySelector('.p-banner-actions')||nm;
  target.insertAdjacentHTML('afterbegin',pr.k==='pro'
    ?`<div class="pro-plaque"><span class="pro-mini">${proSVG(pr.r)}</span>${t('pp_pro',{n:pr.r})}</div>`
    :`<div class="pro-plaque elite"><b>${lgName(LEAGUES.at(-1))}</b>${t('pp_elite')}</div>`);
}

let psT=null,psSeq=0;
const psLive=()=>typeof fbLive==='function'&&fbLive()&&AUTH.mode==='firebase'&&!!FBA.uid;
async function psReal(q){
  const k=q.replace(/[.#$/[\]]/g,'_'),seq=++psSeq;
  const idx=await fbReq(`usernames?orderBy=%22$key%22&startAt=%22${encodeURIComponent(k)}%22&endAt=%22${encodeURIComponent(k)}%EF%A3%BF%22&limitToFirst=8`);
  const uids=[...new Set(Object.values(idx||{}))].filter(u=>typeof u==='string'&&u!==FBA.uid).slice(0,7);
  const profs=await Promise.all(uids.map(async u=>{const [p,role]=await Promise.all([fbReq(`profiles/${u}`),fbReq(`roles/${u}`)]);if(!p||!p.name)return null;const L=typeof realLook==='function'?await realLook(p.name):{};
    return {uid:u,name:p.name,elo:typeof p.elo==='number'?p.elo:1000,avatar:L.avatar||null,steamAvatar:L.steamAvatar||null,color:L.color||null,plan:p.plan||'free',influencer:p.influencer||null,beta:!!p.beta,dev:!!(p.dev||role==='dev'),friend:FRIENDS.some(f=>f.name===p.name)}}));
  return seq===psSeq?profs.filter(Boolean).sort((a,b)=>b.elo-a.elo):null;
}
function psRender(q){
  const box=$('#psRes');q=q.trim().toLowerCase();
  if(!q){box.hidden=true;return}
  const show=hits=>{box.innerHTML=hits.length?hits.map(p=>`<button class="ps-it" data-ps="${escA(p.name)}">${avHTML(p)}<span><b>${escA(p.name)}</b>${planBadge(p)}<small>${p.elo} ELO${p.friend?' · '+t('is_friend'):''}</small></span>${lvlHTML(p.elo)}</button>`).join(''):`<div class="ps-none">${t('ps_none')}</div>`;box.hidden=false};
  if(psLive()){clearTimeout(psT);psT=setTimeout(async()=>{const r=await psReal(q);if(r)show(r)},250);return}
  const seen=new Set(),all=[...FRIENDS,...LB,...REG.values()].filter(p=>p&&!p.me&&!seen.has(p.name)&&seen.add(p.name));
  show(all.filter(p=>p.name.toLowerCase().includes(q)).sort((a,b)=>(a.name.toLowerCase().startsWith(q)?0:1)-(b.name.toLowerCase().startsWith(q)?0:1)||b.elo-a.elo).slice(0,7));
}
$('#psIn').addEventListener('input',e=>psRender(e.target.value));
$('#psIn').addEventListener('focus',e=>psRender(e.target.value));
$('#psIn').addEventListener('keydown',e=>{if(e.key==='Escape'){e.target.value='';psRender('');e.target.blur()}if(e.key==='Enter'){const f=$('#psRes [data-ps]');if(f)f.click()}});
$('#psRes').addEventListener('click',e=>{const b=e.target.closest('[data-ps]');if(!b)return;$('#psIn').value='';$('#psRes').hidden=true;openProfile(b.dataset.ps)});
document.addEventListener('click',e=>{if(!e.target.closest('#psearch'))$('#psRes').hidden=true});
const _applyPh=()=>$$('[data-i18n-ph]').forEach(el=>el.placeholder=t(el.dataset.i18nPh));
_applyPh();

addEventListener('beforeunload',e=>{if(cur&&!cur.done&&Date.now()-steamLaunching>5000){e.preventDefault();e.returnValue=t('leave_guard');return t('leave_guard')}});

const LCF={es:null,room:null,mine:new Map(),seen:new Set()};
const FB_ON=()=>typeof FB_URL==='string'&&typeof fbReq==='function'&&!!window.EventSource;
function lcfOpen(matchId){
  lcfClose();if(!FB_ON())return;
  LCF.room=`lobbyChat/${String(matchId).replace(/[.#$/[\]]/g,'_')}`;
  try{
    LCF.es=new EventSource(typeof fbUrl==='function'?fbUrl(`${LCF.room}/msgs`):`${FB_URL}/${LCF.room}/msgs.json`);
    const take=(key,m)=>{if(!m||typeof m!=='object'||LCF.mine.has(key)||LCF.seen.has(key))return;LCF.seen.add(key);
      if(m.ch==='team'&&m.tm!==cur?.A?.[0]?.name)return;
      chatPush({id:'fb_'+key,from:String(m.from||'?').slice(0,24),team:m.tm===cur?.A?.[0]?.name?'A':'B',ch:m.ch==='team'?'team':'all',text:String(m.text||'').slice(0,300),at:+m.at||Date.now()})};
    const onEv=e=>{try{const d=JSON.parse(e.data);if(!d)return;
      if(d.path==='/'){if(d.data&&typeof d.data==='object')Object.entries(d.data).forEach(([k,v])=>take(k,v))}
      else{const k=d.path.replace(/^\//,'').split('/')[0];if(d.data)take(k,d.data)}}catch(_){}};
    LCF.es.addEventListener('put',onEv);LCF.es.addEventListener('patch',onEv);
  }catch(e){LCF.es=null}
}
function lcfClose(){if(LCF.es){try{LCF.es.close()}catch(e){}}LCF.es=null;lcfPurge();LCF.room=null}
async function lcfSend(m){
  if(!LCF.room||!FB_ON())return;
  const r=await fbReq(`${LCF.room}/msgs`,'POST',{from:ME.name,uid:fbUserKey(),tm:cur?.A?.[0]?.name||'',ch:m.ch,text:m.text,at:m.at});
  if(r&&r.name){const key=r.name,room=LCF.room;LCF.mine.set(key,room);setTimeout(()=>{fbReq(`${room}/msgs/${key}`,'DELETE');LCF.mine.delete(key)},90000)}
}
function lcfPurge(){LCF.mine.forEach((room,key)=>fbReq(`${room}/msgs/${key}`,'DELETE',undefined,true));LCF.mine.clear()}
addEventListener('pagehide',lcfPurge);

let REPORTS_SENT=0;
async function reportMessage(m,where){
  if(m.reported)return toast(t('rep_done'));
  if(REPORTS_SENT>=5)return toast(t('rep_limit'));
  const ctx=(where==='dm'?(DMS[m.from]||[]).map(x=>({from:x.me?ME.name:m.from,text:x.txt,at:x.at})):(cur?.chat||[]).filter(x=>!x.sys))
    .filter(x=>x.at<=m.at).slice(-9).map(x=>({from:String(x.from).slice(0,24),text:String(x.text).slice(0,140),at:x.at}));
  const rep={where,match:where==='lobby'?(cur?.id||null):null,reporter:ME.name,reporterKey:typeof fbUserKey==='function'?fbUserKey():null,
    reported:m.from,message:String(m.text).slice(0,300),at:m.at,context:ctx,createdAt:Date.now()};
  m.reported=true;if(m._dm)m._dm.reported=true;REPORTS_SENT++;
  if(FB_ON())fbReq(`chatReports/${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`,'PUT',rep);
  toast(t('rep_sent',{n:m.from}));
  if(where==='lobby')renderChat();else{saveDM();renderDkWin()}
}

function nextLevelAt(elo){const l=lvl(elo);return LV[l]!=null?LV[l]:null}
function levelUpFx(from,to){
  const R0=from==null?null:rankOf(from),R1=rankOf(to),N=RANKS[R1.i+1];
  const el=$('#lvup'),c=R1.fam.c,R=88,C=2*Math.PI*R;
  el.style.setProperty('--lc',c);
  const sparks=Array.from({length:18},(_,i)=>{const a=i/18*Math.PI*2,d=130+Math.random()*90;return `<i class="spark" style="--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d}px;animation-delay:${1.05+Math.random()*.15}s"></i>`}).join('');
  el.innerHTML=`<div class="rays"></div><div class="box"><div class="k">${t('lvup_k')}</div>
    <div class="badge"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="96" fill="#0b0b0c"/><circle cx="100" cy="100" r="${R}" fill="none" stroke="#26262b" stroke-width="10"/>
      <circle class="ring" cx="100" cy="100" r="${R}" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round" transform="rotate(-90 100 100)" style="--c:${C.toFixed(1)}"/></svg>
      <div class="old">${R0?rankSVG(R0.fam,R0.step,R0.steps):'?'}</div><div class="new">${rankSVG(R1.fam,R1.step,R1.steps)}</div>${sparks}</div>
    <h2>${R1.name}</h2><p>${N?t('lvup_next',{n:N.name,e:N.min}):t('lvup_max')}</p><div class="hint">${t('lvup_close')}</div></div>`;
  el.classList.add('on');
  [523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,.16,0,'triangle',.05),1050+i*90));
  const close=()=>{el.classList.remove('on');clearTimeout(el._t)};
  el.onclick=close;el._t=setTimeout(close,5200);
  notify('level','lvup_t',{n:R1.name},'profile');
}

