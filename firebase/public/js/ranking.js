/* =====================================================
 * TICKRATE - Menu Classement, Reports & Résultat de match (ranking.js)
 * ===================================================== */
/* =====================================================
   CLASSEMENT
   ===================================================== */
const LB=[];
function initLeaderboard(){
  // Paliers : Niv 9-10 (1851-2720), Niv 6-8 (1401-1850), Niv 4-5 (1101-1400), Niv 1-3 (680-1100)
  const tiers=[[2720,1860,34],[1845,1405,28],[1395,1105,24],[1095,680,22]];
  for(const [hi,lo,cnt] of tiers){
    let e=hi;
    const step=Math.max(4,Math.floor((hi-lo)/cnt));
    for(let i=0;i<cnt;i++){
      const p=newPlayer(e,i%7===3?'mid':'high',25);
      p.elo=Math.max(lo,e-rnd(0,step));
      p.wr=rnd(48,66);p.lb=true;p.matches=Math.max(p.matches,rnd(120,1500));
      p.reports=Math.min(p.reports,Math.round(p.matches*.14));
      LB.push(p);
      e-=step;
    }
  }
  used=new Set([ME.name]);
}
function renderRanking(){
  if(rkTab==='ladder'){$('#ranking').innerHTML=rkHead()+ladderHTML();return}
  const list=[...LB,ME].sort((a,b)=>b.elo-a.elo);
  const myRank=list.indexOf(ME)+1;
  const wrOf=p=>p.me?Math.round(ME.history.filter(x=>x.won).length/Math.max(1,ME.history.length)*100):p.wr;
  const chalTag=(p,idx)=>lvl(p.elo)===10&&idx<10&&prestigeOf(p)?.k!=='pro'?`<span class="pb chal">CHALLENGER #${idx+1}</span>`:'';
  const row=(p,i)=>`<tr class="${p.me?'me':''}"><td class="rk">${i+1}</td><td><div class="pl"><span data-profile="${escA(p.name)}">${avHTML(p)}</span><span data-profile="${escA(p.name)}">${escA(p.name)}</span>${planBadge(p)}${chalTag(p,i)}</div></td>
    <td><span class="cc">${escA(p.country)}</span></td><td>${lvlHTML(p.elo)}</td><td class="rt">${p.elo}</td><td>${p.matches}</td><td>${wrOf(p)}%</td><td>${tfHTML(p)}</td></tr>`;
  const top=list.slice(0,25);
  let rows=top.map(row).join('');
  if(myRank>25)rows+=`<tr class="gap"><td colspan="8">···</td></tr>`+list.slice(myRank-2,myRank+1).map((p,j)=>row(p,myRank-2+j)).join('');
  $('#ranking').innerHTML=rkHead(`<span class="pill" style="font-size:14px;padding:6px 10px"><b>${t('your_rank',{n:myRank})}</b></span>`)+`
    <div class="podium">${list.slice(0,3).map((p,i)=>`<div class="pod r${i+1}"><div class="rk">${i+1}</div><span data-profile="${escA(p.name)}">${avHTML(p)}</span><div><div class="nm" data-profile="${escA(p.name)}">${escA(p.name)}</div><div class="el">${p.elo} ELO · ${tfHTML(p)}</div></div></div>`).join('')}</div>
    <div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl rk-table" style="min-width:600px"><thead><tr><th class="rk">${t('th_rank')}</th><th style="text-align:left">${t('th_player')}</th><th style="text-align:left">${t('th_country')}</th><th class="c">${t('th_level')}</th><th>ELO</th><th>${t('t_matches')}</th><th>${t('th_wr')}</th><th>${t('trust_short')}</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

function rkHead(extra=''){return `<div class="rk-head"><div><h1 class="h1">${t('ranking_title')}</h1><div class="rk-sub">${t('ranking_region')}</div></div>${extra}</div>
  <div class="rk-tabs">${[['elo','rk_tab_elo'],['ladder','rk_tab_ladder']].map(([k,l])=>`<button class="${rkTab===k?'on':''}" data-rk="${k}">${t(l)}</button>`).join('')}</div>`}
$('#ranking').addEventListener('click',e=>{
  const b=e.target.closest('[data-rk]');if(b){rkTab=b.dataset.rk;return renderRanking()}
  const br=e.target.closest('[data-lbr]');if(br){ladBracket=br.dataset.lbr;return renderRanking()}
});

/* =====================================================
   REPORTS
   ===================================================== */
/* Règles anti-abus (vérifiées aussi au moment de l'envoi) :
   - uniquement des joueurs croisés en match ces 7 derniers jours
   - 1 report par joueur tous les 7 jours (quel que soit le nombre de matchs)
   - 5 reports maximum par 24 h                                              */
const REP_COOLDOWN=7*864e5,REP_DAILY=5,SHARED_WINDOW=7*864e5;
let REPLOG={by:{},times:[]};
try{const v=JSON.parse(localStorage.getItem('cs_replog')||'null');if(v&&v.by&&Array.isArray(v.times))REPLOG=v}catch(e){}
const saveRep=()=>{try{localStorage.setItem('cs_replog',JSON.stringify(REPLOG))}catch(e){}};
const remain=ms=>ms>=864e5?t('dur_d',{n:Math.ceil(ms/864e5)}):ms>=36e5?t('dur_h',{n:Math.ceil(ms/36e5)}):t('dur_min',{n:Math.max(1,Math.ceil(ms/6e4))});
function repState(p){
  if(!p||p.me)return {ok:false,why:''};
  const now=Date.now(),last=REPLOG.by[p.name];
  if(last&&now-last<REP_COOLDOWN)return {ok:false,done:true,why:t('rep_cooldown',{x:remain(REP_COOLDOWN-(now-last))})};
  if(!p.lastPlayed||now-p.lastPlayed>SHARED_WINDOW)return {ok:false,why:t('rep_need_match')};
  const day=REPLOG.times.filter(x=>now-x<864e5).length;
  if(day>=REP_DAILY)return {ok:false,why:t('rep_daily')};
  return {ok:true,left:REP_DAILY-day};
}
let repTarget=null,repReason=null;
function reportBtn(p){
  if(p.me)return '';
  const st=repState(p);
  return `<button class="flag-btn ${st.done?'done':''}" data-report="${escA(p.name)}" title="${escA(st.ok?t('report'):st.why)}">${ICON.flag}</button>`;
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-report]');if(!b)return;
  const p=REG.get(b.dataset.report);if(!p)return;
  const st=repState(p);if(!st.ok)return toast(st.why);
  openReport(p);
});
function openReport(p){
  const st=repState(p);if(!st.ok)return toast(st.why);
  repTarget=p;repReason=null;$('#repNote').value='';$('#repSend').disabled=false;
  $('#repWho').innerHTML=`${avHTML(p)}<div><b>${escA(p.name)}</b><div class="ps"><span>ELO ${p.elo}</span>${tfHTML(p)}<span>${t('matches_n',{n:p.matches})}</span></div><div class="ps" style="margin-top:2px">${t('reports_left',{n:st.left})}</div></div>`;
  renderReasons();openModal('reportModal');
}
function renderReasons(){
  $('#repReasons').innerHTML=REASONS.map(r=>`<button class="reason ${repReason===r?'on':''}" data-reason="${r}"><i></i>${t('r_'+r)}</button>`).join('');
}
$('#repReasons').onclick=e=>{const b=e.target.closest('[data-reason]');if(!b)return;repReason=b.dataset.reason;renderReasons()};
$('#repSend').onclick=()=>{
  if(!repReason)return toast(t('choose_reason'));
  const p=repTarget,st=repState(p);
  if(!st.ok){closeModal('reportModal');return toast(st.why)}
  $('#repSend').disabled=true;
  const a=trust(p).toFixed(1),now=Date.now();
  p.reports++;p.reasons[repReason]=(p.reasons[repReason]||0)+1;
  REPLOG.by[p.name]=now;REPLOG.times=REPLOG.times.filter(x=>now-x<864e5).concat(now);saveRep();
  closeModal('reportModal');
  toast(t('report_sent',{n:p.name,a,b:trust(p).toFixed(1)}));
  refreshViews();
};
function refreshViews(){
  if(cur&&!$('#lobby').hidden)renderLobby();
  if(cur&&cur.res&&!$('#result').hidden)renderResult(cur.res);
  if(!$('#profile').hidden)renderProfile();
  if(!$('#friends').hidden)renderFriends();
}

/* =====================================================
   RATING DE PERFORMANCE + ELO
   ===================================================== */
function perfRating(s,R){
  const kpr=s.k/R,dpr=s.d/R,apr=s.a/R,impact=2.13*kpr+0.42*apr-0.41;
  return Math.max(0.2,0.0073*s.kast+0.3591*kpr-0.5329*dpr+0.2372*impact+0.0032*s.adr+0.1587);
}
const K_FACTOR=50;
// Scaling Level 10 (2001+ ELO) : plus on a d'ELO au-dessus de 2000, plus le gain est exigeant et la perte punitive
function lvl10Scale(elo,won){
  if(!elo||elo<=2000)return 1;
  const over=Math.min(1000,elo-2000); // 0 à 1000 au-dessus de 2000
  return won?Math.max(0.58,1-(over/1000)*0.40):Math.min(1.35,1+(over/1000)*0.30);
}
function eloChange(expected,won,rating,playerElo=1800){
  const base=K_FACTOR*((won?1:0)-expected);
  const perf=Math.max(.6,Math.min(1.4,1+(rating-1)*.6));
  const scale10=lvl10Scale(playerElo,won);
  const mult=(won?perf:2-perf)*scale10;
  let d=Math.round(base*mult);d=won?Math.max(4,d):Math.min(-5,d);
  return {base:Math.round(base),perf,mult,scale10,d};
}
const rtClass=r=>r>=1.1?'pos':r<0.9?'neg':'mid';
const sign=n=>(n>0?'+':n<0?'−':'±')+Math.abs(n);
const kd=(k,d)=>(k/Math.max(1,d)).toFixed(2);
function simPlayer(p,R,won,avgElo){
  const skill=(p.elo-avgElo)/900;
  const kpr=Math.max(.25,.66+skill+(won?.08:-.07)+(Math.random()-.45)*.38);
  const dpr=Math.max(.3,Math.min(.95,.66-skill*.6+(won?-.08:.08)+(Math.random()-.5)*.26));
  const k=Math.round(kpr*R),d=Math.min(R,Math.round(dpr*R)),a=rnd(1,Math.round(R*.2)+1);
  const hs=rnd(28,64),adr=Math.max(30,Math.round(kpr*104+a*1.6+rnd(-8,12)));
  const kast=Math.max(40,Math.min(96,Math.round(66+(kpr-dpr)*38+rnd(-6,9))));
  const s={k,d,a,hs,adr,kast};s.rating=perfRating(s,R);return s;
}
function genHistory(p){
  return [];
}
function seedHistory(){
  if(!Array.isArray(ME.history)) ME.history=[];
}
const ensureDetails=p=>{
  if(!p.history) p.history=[];
  return p;
};

/* ---------- Enregistrement réel dans Firebase ---------- */
async function fbRecordMatch(matchData){
  // en ligne, l'historique n'est écrit que par le serveur à la fin d'un vrai match (les règles refusent le reste)
  if(typeof fbReq!=='function'||(typeof realMM==='function'&&realMM()))return;
  const mId=matchData.id||('m_'+Date.now());
  const myBox=typeof fbMailbox==='function'?fbMailbox(ME.name):ME.name.toLowerCase();
  const uid=(typeof FBA!=='undefined'&&FBA&&FBA.uid)?FBA.uid:myBox;

  const matchRecord={
    id:mId,
    at:Date.now(),
    map:matchData.map,
    won:matchData.won,
    score:matchData.score,
    k:matchData.k,
    d:matchData.d,
    a:matchData.a,
    hs:matchData.hs,
    adr:matchData.adr,
    kast:matchData.kast||70,
    rating:matchData.rating,
    delta:matchData.delta,
    elo:matchData.elo,
    mode:(typeof state!=='undefined'&&state.mode)?state.mode:'ranked'
  };

  // 1. Enregistrer dans history/<uid> et history/<mailbox>
  if(uid&&uid!==myBox) fbReq(`history/${uid}/${mId}`,'PUT',matchRecord);
  fbReq(`history/${myBox}/${mId}`,'PUT',matchRecord);

  // 2. Mettre à jour profiles/<uid> si connecté
  const realWins=ME.history.filter(x=>x.won).length;
  const realMatches=ME.history.length;
  if(uid&&uid!==myBox){
    fbReq(`profiles/${uid}`,'PATCH',{
      elo:ME.elo,
      matches:realMatches,
      wins:realWins,
      lastMatchAt:Date.now()
    });
  }

  // 3. Mettre à jour playerDirectory/<mailbox>
  fbReq(`playerDirectory/${myBox}`,'PATCH',{
    elo:ME.elo,
    matches:realMatches,
    wins:realWins,
    lastMatchAt:Date.now()
  });

  // 4. Mettre à jour la table matches/
  fbReq(`matches/${mId}`,'PUT',{
    matchId:mId,
    map:matchData.map,
    score:matchData.score,
    won:matchData.won,
    eloAfter:ME.elo,
    delta:matchData.delta,
    mvp:matchData.mvp||ME.name,
    finishedAt:Date.now(),
    mode:(typeof state!=='undefined'&&state.mode)?state.mode:'ranked'
  });

  // 5. Enregistrer aussi pour les coéquipiers réels présents dans le groupe
  if(typeof state!=='undefined'&&Array.isArray(state.party)&&state.party.length>1&&matchData.teamA&&matchData.teamB){
    const allRows=[...matchData.teamA,...matchData.teamB];
    for(const tm of state.party.slice(1)){
      if(!tm||!tm.name||tm.name===ME.name)continue;
      const tmRow=allRows.find(r=>r.p&&r.p.name&&r.p.name.toLowerCase()===tm.name.toLowerCase());
      if(tmRow){
        const tmBox=typeof fbMailbox==='function'?fbMailbox(tm.name):tm.name.toLowerCase();
        const tmRecord={
          id:mId,
          at:Date.now(),
          map:matchData.map,
          won:tmRow.isA===matchData.won,
          score:matchData.score,
          k:tmRow.k,
          d:tmRow.d,
          a:tmRow.a,
          hs:tmRow.hs,
          adr:tmRow.adr,
          kast:tmRow.kast||70,
          rating:tmRow.rating,
          delta:tmRow.ch?tmRow.ch.d:0,
          elo:tmRow.p.elo,
          mode:(typeof state!=='undefined'&&state.mode)?state.mode:'ranked'
        };
        fbReq(`history/${tmBox}/${mId}`,'PUT',tmRecord);
        fbReq(`playerDirectory/${tmBox}`,'PATCH',{elo:tmRow.p.elo,lastMatchAt:Date.now()});
      }
    }
  }
}

/* ---------- Simulation du match ---------- */
$('#simBtn').onclick=()=>{
  if(!cur||!cur.map||!cur.join||!cur.join.live)return toast(t('join_wait_all'));
  const b=$('#simBtn');b.disabled=true;b.innerHTML='<span class="spin inl"></span> '+t('match_running');
  setTimeout(()=>{b.disabled=false;b.innerHTML=t('simulate');simulateMatch()},1600);
};
function calibDelta(won,rating,calib){
  const perf=Math.max(-10,Math.min(18,Math.round((rating-1.0)*35)));
  let d=won?(86+perf):(-46+Math.round(perf*0.5));
  const nextPlayed=(calib.played||0)+1,nextWins=(calib.wins||0)+(won?1:0);
  if(nextPlayed>=3){
    // Cibles exactes après 3 matchs : 3V -> Niv 4-5 (1215..1310), 2V -> Niv 3-4 (1080..1150), 1V -> low Niv 3 (955..1000), 0V -> Niv 2 (850..920)
    const bounds={3:[1215,1310],2:[1080,1150],1:[955,1000],0:[850,920]}[nextWins]||[955,1100];
    const target=Math.max(bounds[0],Math.min(bounds[1],ME.elo+d));
    d=target-ME.elo;
  }
  return {base:won?80:-45,perf:1,mult:1,scale10:1,d};
}
function saveCalibState(){
  if(AUTH&&AUTH.session&&AUTH.session.account){
    dUpdate(AUTH.session.account.id,a=>{a.calib=ME.calib;a.elo=ME.elo;a.history=ME.history.slice(0,50)});
  }
  try{localStorage.setItem('cs_calib',JSON.stringify({id:AUTH?.session?.account?.id||ME.name,calib:ME.calib,elo:ME.elo}))}catch(e){}
}
function simulateMatch(){
  const c=cur,wing=c.size===2,win=wing?9:16;
  const wonA=Math.random()<c.pA,lose=rnd(wing?2:5,win-2),R=win+lose;
  const sA=wonA?win:lose,sB=wonA?lose:win,avg=(c.aA+c.aB)/2;
  const rows=(tm,isA)=>tm.map(p=>({p,isA,...simPlayer(p,R,isA===wonA,avg)}));
  const A=rows(c.A,true),B=rows(c.B,false),all=[...A,...B];
  const wasCalib=state.mode!=='casual'&&isCalib(ME);
  all.forEach(r=>{
    const E=r.isA?c.pA:1-c.pA,won=r.isA===wonA;
    r.ch=state.mode==='casual'?{base:0,perf:1,mult:1,d:0}:(r.p.me&&wasCalib?calibDelta(won,r.rating,ME.calib):eloChange(E,won,r.rating,r.p.elo));
    if(!r.p.me)ensureDetails(r.p);
    r.before=r.p.elo;r.p.elo=Math.max(100,r.p.elo+r.ch.d);
    if(!r.p.me){r.p.matches++;r.p.history.unshift({date:new Date(),map:c.map.n,won,score:r.isA?`${sA}-${sB}`:`${sB}-${sA}`,k:r.k,d:r.d,a:r.a,hs:r.hs,adr:r.adr,kast:r.kast,rating:r.rating,delta:r.ch.d,elo:r.p.elo})}
  });
  A.sort((x,y)=>y.rating-x.rating);B.sort((x,y)=>y.rating-x.rating);
  const me=A.find(r=>r.p.me),mvp=all.reduce((m,r)=>r.rating>m.rating?r:m);
  const matchId=c.id||('m_'+Date.now());
  const newMatch={id:matchId,date:new Date(),map:c.map.n,won:wonA,score:`${sA}-${sB}`,k:me.k,d:me.d,a:me.a,hs:me.hs,adr:me.adr,kast:me.kast,rating:me.rating,delta:me.ch.d,elo:ME.elo};
  ME.history.unshift(newMatch);
  let calibJustDone=false;
  if(wasCalib){
    ME.calib.played=(ME.calib.played||0)+1;
    if(wonA)ME.calib.wins=(ME.calib.wins||0)+1;
    if(ME.calib.played>=3){
      ME.calib.done=true;
      calibJustDone=true;
    }
    saveCalibState();
  }else if(ME.calib&&ME.calib.done){
    saveCalibState();
  }
  const xp=(wonA?120:60)+(mvp===me?40:0),lp=(wonA?30:10)+Math.min(15,Math.max(0,Math.round((me.rating-1)*30)));
  SHOP.pass.xp=Math.min(PASS_TIERS*XP_TIER,SHOP.pass.xp+xp);SHOP.ladder+=lp;saveShop();missionProgress(me,wonA,mvp===me);setTimeout(()=>toast(t('xp_gain',{n:xp,p:lp})),1400);
  c.done=true;c.res={A,B,sA,sB,wonA,R,me,mvp,review:genReview(c,sA,sB,wonA,me)};
  if(state.mode!=='casual')notify(wonA?'win':'loss',wonA?'n_win':'n_loss',{m:c.map.n,s:`${sA}-${sB}`,d:(me.ch.d>0?'+':'')+me.ch.d},'profile');
  {const lvBefore=Math.floor((SHOP.pass.xp-xp)/XP_TIER),lvNow=passLevel();if(lvNow>lvBefore)notify('pass','n_tier',{n:lvNow},'shop:pass')}
  {const ids=todayMissions();ids.forEach(id=>{const M=MISSIONS[id],tg=M.once?1:M.n;if((SHOP.mis.prog[id]||0)>=tg&&!SHOP.mis.got.includes(id)&&!(SHOP.mis.told||[]).includes(id)){SHOP.mis.told=[...(SHOP.mis.told||[]),id];notify('mission','n_mission',{x:t(M.k,{n:M.n})},'play')}});saveShop()}
  if(calibJustDone){
    setTimeout(()=>{
      levelUpFx(null,ME.elo);
      toast(t('calib_done',{w:ME.calib.wins,l:3-ME.calib.wins,r:rankOf(ME.elo).name,e:ME.elo}));
    },900);
  }else if(!wasCalib){
    if(rankOf(ME.elo).i>rankOf(me.before).i)setTimeout(()=>levelUpFx(me.before,ME.elo),1100);
  }
  renderResult(c.res);refreshMe();setView('result');
  if(typeof fbRecordMatch==='function'){
    fbRecordMatch({id:matchId,map:c.map.n,won:wonA,score:`${sA}-${sB}`,k:me.k,d:me.d,a:me.a,hs:me.hs,adr:me.adr,kast:me.kast,rating:me.rating,delta:me.ch.d,elo:ME.elo,mvp:mvp.p.name,teamA:A,teamB:B});
  }
  if(typeof fbSyncMe==='function'){
    fbSyncMe();
  }
  wonA?(beep(784,.12),beep(1047,.12,.12),beep(1319,.3,.24)):(beep(440,.2,0,'sawtooth',.03),beep(330,.35,.2,'sawtooth',.03));
}
function lvlBarHTML(elo){
  if(elo===ME?.elo&&isCalib(ME)){
    const pl=ME.calib.played||0,w=ME.calib.wins||0,rem=Math.max(0,3-pl);
    return `<div class="lvlbar"><div class="row"><span>Placement : <b>${pl} / 3 matchs</b> (${w}V - ${pl-w}D)</span><span>${rem} match${rem>1?'s':''} avant ton niveau</span></div><div class="bar"><i style="width:${Math.max(8,pl/3*100)}%"></i></div></div>`;
  }
  const l=lvl(elo),lo=LV[l-1],hi=LV[l];
  if(l>=10){
    const sWin=Math.round(lvl10Scale(elo,true)*100),sLoss=Math.round(lvl10Scale(elo,false)*100);
    return `<div class="lvlbar"><div class="row"><span>${t('level_n',{n:10})} · Challenger (${elo} ELO)</span><span>Scaling ELO : Gain ${sWin}% / Perte ${sLoss}%</span></div><div class="bar"><i style="width:100%;background:linear-gradient(90deg,#ef5560,#ffb21f)"></i></div></div>`;
  }
  const pct=Math.max(2,Math.min(100,(elo-lo)/(hi-lo)*100));
  return `<div class="lvlbar"><div class="row"><span>${t('level_n',{n:l})}</span><span>${t('to_next',{x:hi-elo,n:l+1})}</span></div><div class="bar"><i style="width:${pct}%"></i></div></div>`;
}
function boardHTML(rows,mvp){
  return `<thead><tr><th>${t('th_player')}</th><th>K</th><th>A</th><th>D</th><th>+/−</th><th>K/D</th><th>ADR</th><th>HS %</th><th>KAST</th><th>${t('rating')}</th><th>ELO</th><th>${t('trust_short')}</th><th></th></tr></thead><tbody>`+
  rows.map(r=>`<tr class="${r.p.me?'me':''}"><td><div class="pl"><span data-profile="${escA(r.p.name)}">${avHTML(r.p)}</span><span data-profile="${escA(r.p.name)}">${escA(r.p.name)}</span>${planBadge(r.p)}${r===mvp?`<span class="crown" title="MVP">${ICON.crown}</span>`:''}${lvlHTML(r.p.elo)}</div></td>
    <td>${r.k}</td><td>${r.a}</td><td>${r.d}</td><td class="${r.k-r.d>=0?'pos':'neg'}">${sign(r.k-r.d)}</td><td>${kd(r.k,r.d)}</td>
    <td>${r.adr}</td><td>${r.hs}%</td><td>${r.kast}%</td><td class="rt ${rtClass(r.rating)}">${r.rating.toFixed(2)}</td>
    <td class="rt ${r.ch.d>0?'pos':r.ch.d<0?'neg':''}">${sign(r.ch.d)}</td><td>${tfHTML(r.p)}</td><td>${reportBtn(r.p)}</td></tr>`).join('')+'</tbody>';
}
function renderResult({A,B,sA,sB,wonA,R,me,mvp}){
  const c=cur;
  $('#resHead').innerHTML=`<div class="bg" style="background:${mapBg(c.map)}"></div>
    <div><div class="res-tag">${modeObj().n.toUpperCase()} · ${c.map.n.toUpperCase()} · ${t('rounds',{n:R})}</div>
    <div class="res-title ${wonA?'w':'l'}">${wonA?t('victory'):t('defeat')}</div></div>
    <div class="res-score"><span class="a">${sA}</span><i>:</i><span class="b">${sB}</span></div>`;
  const casual=state.mode==='casual';
  $('#eloCard').innerHTML=`<div class="h3">${t('your_elo')} <span>${casual?t('unranked_match'):t('transparent')}</span></div>
    <div class="elo-big"><b>${ME.elo}</b><span class="d ${me.ch.d>=0?'pos':'neg'}">${sign(me.ch.d)}</span><small>${me.before} → ${ME.elo}</small></div>
    <div class="breakdown">
      <div class="bk"><span>${t('base')}</span><b class="${me.ch.base>=0?'pos':'neg'}">${sign(me.ch.base)}</b><small>${t('vs_level')}</small></div>
      <div class="bk"><span>${t('rating')}</span><b class="${rtClass(me.rating)}">${me.rating.toFixed(2)}</b><small>${me.k}/${me.d}/${me.a} · ${me.adr} ADR</small></div>
      <div class="bk"><span>${t('multiplier')}</span><b>×${me.ch.mult.toFixed(2)}</b><small>${me.ch.mult>=1?(wonA?t('perf_bonus'):t('perf_malus')):(wonA?t('perf_low'):t('loss_reduced'))}</small></div>
    </div>${lvlBarHTML(ME.elo)}`;
  $('#mvpCard').innerHTML=`<div class="h3">${t('mvp_title')} <span>${t('best_rating')}</span></div>
    <div class="mvp"><span data-profile="${escA(mvp.p.name)}">${avHTML(mvp.p)}</span><div><div class="mvp-tag">MVP</div><div class="mvp-n" data-profile="${escA(mvp.p.name)}">${escA(mvp.p.name)}</div><div class="ps">${mvp.isA?t('your_team_s'):t('enemy_team')}</div></div></div>
    <div class="mvp-s">
      <div class="bk"><span>${t('rating')}</span><b class="pos">${mvp.rating.toFixed(2)}</b></div>
      <div class="bk"><span>K / D</span><b>${mvp.k} / ${mvp.d}</b></div>
      <div class="bk"><span>HS %</span><b>${mvp.hs}%</b></div>
    </div>`;
  $('#bnA').textContent=$('#nameA').textContent;$('#bnB').textContent=$('#nameB').textContent;
  $('#bsA').textContent=wonA?t('win'):t('loss');$('#bsB').textContent=wonA?t('loss'):t('win');
  $('#boardA').innerHTML=boardHTML(A,mvp);$('#boardB').innerHTML=boardHTML(B,mvp);
  renderReview();
}
$('#again').onclick=()=>{cur=null;setView('play')};
$('#toProfile').onclick=()=>setView('profile');

