/* =====================================================================
   VRAI MATCHMAKING (Cloud Functions) : remplace la simulation de play.js
   dès que le joueur est connecté avec un compte Firebase.
   - file      : queueJoin / queueLeave
   - acceptation : accept / decline (délai géré par le serveur, matchTick pour réagir vite)
   - veto      : vetoBan (seul le capitaine de l'équipe dont c'est le tour peut bannir)
   - serveur   : matches/<id>/server + matchSecrets/<id>/password, connexion confirmée par le plugin (/joined)
   L'état est lu toutes les 2 s : userMatch/<uid> donne l'id du match, matches/<id> son état.
   Sans compte Firebase (mode local), la simulation de play.js reste utilisée.
   ===================================================================== */
Object.assign(I18N.fr,{rm_wait_srv:'Map choisie : on attend qu\'un serveur se libère…',rm_cap_turn:'{x}, ton capitaine, choisit la map à bannir',rm_no_leave:'Impossible de quitter un vrai match : rejoins le serveur, sinon tu seras banni {x}.',rm_done:'Match terminé · {s} · {d} ELO',rm_no_server:'Aucun serveur libre : match annulé, sans sanction. Relance la recherche.',rm_err:'Matchmaking indisponible ({e})',rm_banned:'Tu es banni du matchmaking encore {x}.',rm_restored:'Tu as un match en cours : retour au salon.'});
Object.assign(I18N.en,{rm_wait_srv:'Map picked: waiting for a free server…',rm_cap_turn:'{x}, your captain, is picking the map to ban',rm_no_leave:'You can\'t leave a real match: join the server or you will be banned {x}.',rm_done:'Match over · {s} · {d} ELO',rm_no_server:'No free server: match cancelled, no penalty. Search again.',rm_err:'Matchmaking unavailable ({e})',rm_banned:'You are banned from matchmaking for {x}.',rm_restored:'You have a match in progress: back to the lobby.'});
Object.assign(I18N.ru,{rm_wait_srv:'Карта выбрана: ждём свободный сервер…',rm_cap_turn:'{x}, твой капитан, выбирает карту для бана',rm_no_leave:'Нельзя покинуть настоящий матч: зайди на сервер, иначе бан на {x}.',rm_done:'Матч окончен · {s} · {d} ELO',rm_no_server:'Нет свободного сервера: матч отменён без штрафа. Начни поиск снова.',rm_err:'Матчмейкинг недоступен ({e})',rm_banned:'Ты забанен в матчмейкинге ещё на {x}.',rm_restored:'У тебя идёт матч: возвращаемся в лобби.'});

const RM={mid:null,m:null,acc:false,pw:'',key:'',timer:null,clk:null,ticked:0,sq:startQueue};
const realMM=()=>typeof fbLive==='function'&&fbLive()&&typeof AUTH!=='undefined'&&AUTH.mode==='firebase'&&typeof FBA!=='undefined'&&!!FBA.uid;
const rmMapName=s=>{const m=MAPS.find(x=>'de_'+x.slug===s);return m?m.n:s};
const rmSrvMap=n=>{const m=MAPS.find(x=>x.n===n);return m?'de_'+m.slug:n};
function rmErr(e){
  if(e==='steam_required')return t('link_to_search');
  if(e==='banned')return t('rm_banned',{x:'?'});
  if(e==='region_closed')return t('e_region_closed');
  if(e==='match_live')return t('e_match_live');
  return t('rm_err',{e});
}

// ---------- file d'attente ----------
(()=>{const sq=startQueue;startQueue=function(prio){
  sq.apply(this,arguments);
  if(!realMM())return;
  clearTimeout(qTo);                                   // pas de faux « match trouvé »
  fbCall('queueJoin',{region:state.region,mode:state.mode,party:window.CURRENT_PARTY_CODE||null,lang}).then(r=>{
    if(r.error==='in_match')return rmPoll();
    if(r.error){if(state.searching)stopQueue(false);return toast(rmErr(r.error))}
    rmPoll();
  });
}})();
(()=>{const st=stopQueue;stopQueue=function(byUser){
  const was=state.searching;st.apply(this,arguments);
  if(realMM()&&was&&!RM.mid)fbCall('queueLeave');
}})();
// remise en file prioritaire faite par le serveur : on réaffiche juste la recherche
function rmRequeued(){RM.sq(true);clearTimeout(qTo)}

// ---------- ELO, niveau et historique relus sur le serveur (sans recharger la page) ----------
// après un vrai match, au retour sur l'onglet et toutes les minutes : le match a pu se finir pendant que la page
// n'était pas ouverte sur le salon (rechargée, autre vue, onglet en arrière-plan)
let RM_SYNC=0;
async function rmSyncMe(){
  if(!realMM()||RM_SYNC>Date.now()-5000)return;RM_SYNC=Date.now();
  const [prof,hist]=await Promise.all([fbReq(`profiles/${FBA.uid}`),fbReq(`history/${FBA.uid}`)]);
  if(!prof)return;
  const before=ME.elo,n0=(ME.history||[]).length;
  if(typeof prof.elo==='number')ME.elo=prof.elo;
  if(typeof prof.eloWm==='number')ME.eloWm=prof.eloWm;
  for(const k of ['matchesWm','winsWm','peakEloWm','eloDuel','matchesDuel','winsDuel','peakEloDuel'])if(typeof prof[k]==='number')ME[k]=prof[k];
  if(typeof prof.matches==='number')ME.matches=prof.matches;
  if(hist&&typeof hist==='object'){
    const MN=x=>(MAPS.find(m=>'de_'+m.slug===x||m.slug===String(x).replace('de_',''))||{n:String(x).replace('de_','')}).n;
    ME.history=Object.entries(hist).map(([id,x])=>({id,date:new Date(x.at||Date.now()),map:MN(x.map),won:!!x.won,score:x.score||'0-0',k:x.k||0,d:x.d||0,a:x.a||0,hs:x.hs||0,adr:x.adr||0,kast:x.kast||0,rating:x.rating||1,delta:x.delta||0,elo:x.elo||prof.elo||1000,mode:x.mode||'ranked'})).sort((a,b)=>b.date-a.date);
  }
  if(ME.elo===before&&(ME.history||[]).length===n0)return;
  if(typeof refreshMe==='function')refreshMe();
  if(!$('#profile').hidden&&!profileTarget)renderProfile();
  if(!$('#play').hidden&&typeof renderStats==='function')renderStats();
}
setInterval(()=>{if(!document.hidden&&!RM.mid)rmSyncMe()},60e3);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)rmSyncMe()});

// ---------- ELO Wingman et 1v1 Duel séparés ----------
Object.assign(I18N.fr,{wm_elo:'Wingman',wm_elo_t:'ELO Wingman (classement séparé du 5v5)',duel_elo:'1v1 Aim',duel_elo_t:'ELO 1v1 Aim Arena (classement séparé du 5v5)'});
Object.assign(I18N.en,{wm_elo:'Wingman',wm_elo_t:'Wingman ELO (separate from 5v5)',duel_elo:'1v1 Aim',duel_elo_t:'1v1 Aim Arena ELO (separate from 5v5)'});
Object.assign(I18N.ru,{wm_elo:'Напарники',wm_elo_t:'ELO в режиме «Напарники» (отдельно от 5v5)',duel_elo:'1v1 Aim',duel_elo_t:'ELO в режиме 1v1 Aim (отдельно от 5v5)'});
(()=>{const o=refreshMe;refreshMe=function(){
  o.apply(this,arguments);
  if(state.mode==='duel'){
    const e=ME.eloDuel??1000;
    $('#topElo').textContent=`${e} ELO · ${t('duel_elo')}`;$('#topElo').title=t('duel_elo_t');
    $('#topLvl').innerHTML=lvlHTML(e,false,false);
  }else if(state.mode==='wingman'){
    const e=ME.eloWm??1000;
    $('#topElo').textContent=`${e} ELO · ${t('wm_elo')}`;$('#topElo').title=t('wm_elo_t');
    $('#topLvl').innerHTML=lvlHTML(e,false,false);
  }
}})();
$('#modes').addEventListener('click',()=>setTimeout(()=>{refreshMe();if(typeof renderParty==='function')renderParty();if(typeof renderStats==='function')renderStats();},0));
(()=>{const o=decorateProfile;decorateProfile=function(){
  o.apply(this,arguments);
  const P=profileTarget||ME,el=$('#profile .p-name');if(!el)return;
  if(!el.querySelector('.p-wm')){
    const e=profileTarget?P.eloWm:ME.eloWm;
    el.insertAdjacentHTML('beforeend',`<span class="p-wm" title="${t('wm_elo_t')}">${t('wm_elo')} · ${e??1000} ELO</span>`);
  }
  if(!el.querySelector('.p-duel')){
    const ed=profileTarget?P.eloDuel:ME.eloDuel;
    el.insertAdjacentHTML('beforeend',`<span class="p-duel" title="${t('duel_elo_t')}">${t('duel_elo')} · ${ed??1000} ELO</span>`);
  }
}})();

// ---------- lecture de l'état ----------
async function rmPoll(){
  clearTimeout(RM.timer);
  if(realMM()){
    try{
      const mid=await fbReq(`userMatch/${FBA.uid}`);
      const id=typeof mid==='string'?mid:RM.mid;     // match terminé ou annulé : userMatch est vidé, on relit une dernière fois
      if(id){const m=await fbReq(`matches/${id}`);if(m&&m.players&&m.players[FBA.uid])rmShow(id,m);else if(!mid)RM.mid=null}
    }catch(e){console.error(e)}
  }
  RM.timer=setTimeout(rmPoll,state.searching||RM.mid?2000:8000);
}
function rmShow(mid,m){
  const restored=!RM.mid&&!state.searching&&m.status!=='accept';
  if(RM.mid!==mid){RM.mid=mid;RM.acc=!!m.players[FBA.uid].accepted;RM.pw='';RM.key='';RM.ticked=0}
  RM.m=m;
  if(m.status==='accept')return rmFound(m);
  rmCloseFound();
  if(m.status==='cancelled'||m.status==='finished')return rmEnd(m,mid);
  if(restored&&!m.test)toast(t('rm_restored'));
  rmLobby(mid,m);
}

// ---------- « Match trouvé » ----------
function rmFound(m){
  const P=m.players,ids=Object.keys(P),ok=ids.filter(u=>P[u].accepted).length;
  if(state.searching)stopQueue(false);
  const box=$('#found');
  if(!box.classList.contains('on')){
    mf={total:ids.length,ok:0,accepted:RM.acc,left:20,timers:[],done:false};
    $('#accepts').innerHTML='<div class="acc"></div>'.repeat(ids.length);
    $('#fMode').textContent=`${(MODES.find(x=>x.id===m.mode)||modeObj()).n} · ${(REGIONS.find(r=>r.id===m.region)||regObj()).id}`;
    const ab=$('#acceptBtn');ab.disabled=RM.acc;ab.textContent=t(RM.acc?'accepted':'accept');
    const db=$('#declineBtn');db.hidden=RM.acc;db.title=t('decline_free');
    box.classList.add('on');
    TRMatchSound.play();
    flashTitle(true);
    clearInterval(RM.ring);
    RM.ring=setInterval(()=>{
      if(!RM.m||RM.m.status!=='accept')return;
      const left=Math.max(0,(RM.m.deadline-Date.now())/1000);
      ring(Math.min(1,left/20));$('#ringNum').textContent=Math.ceil(left);
      if(left<=0&&!RM.ticked){RM.ticked=1;fbCall('matchTick',{matchId:RM.mid}).then(()=>rmPoll())}
    },100);
  }
  $$('#accepts .acc').forEach((d,i)=>d.classList.toggle('ok',i<ok));
  $('#fStatus').textContent=t('n_accepted',{n:ok,t:ids.length});
}
function rmCloseFound(){
  if(!RM.ring)return;
  clearInterval(RM.ring);RM.ring=null;flashTitle(false);$('#found').classList.remove('on');
}
(()=>{const a=$('#acceptBtn').onclick,d=$('#declineBtn').onclick;
  $('#acceptBtn').onclick=e=>{
    if(!RM.m||RM.m.status!=='accept')return a(e);
    if(RM.acc)return;RM.acc=true;
    const b=$('#acceptBtn');b.disabled=true;b.textContent=t('accepted');$('#declineBtn').hidden=true;beep(920,.06,0,'sine',.03);
    fbCall('accept',{matchId:RM.mid}).then(r=>{if(r.error){RM.acc=false;b.disabled=false;b.textContent=t('accept');toast(rmErr(r.error))}rmPoll()});
  };
  $('#declineBtn').onclick=e=>{
    if(!RM.m||RM.m.status!=='accept')return d(e);
    if(RM.acc)return;
    RM.declined=RM.mid;fbCall('decline',{matchId:RM.mid}).then(()=>rmPoll());
    rmCloseFound();toast(t('declined_free'));beep(380,.14);
  };
})();

// ---------- salon : veto, serveur, connexion ----------
function rmPlayer(uid,p){
  const isWm = (RM.m && RM.m.mode === 'wingman') || state.mode === 'wingman';
  const isDuel = (RM.m && RM.m.mode === 'duel') || state.mode === 'duel';
  if(uid===FBA.uid){
    const meClone = Object.create(ME);
    meClone.elo = isWm ? (ME.eloWm ?? p.elo ?? 1000) : isDuel ? (ME.eloDuel ?? p.elo ?? 1000) : ME.elo;
    meClone.eloWm = ME.eloWm ?? p.elo ?? 1000;
    meClone.eloDuel = ME.eloDuel ?? p.elo ?? 1000;
    meClone.me = true;
    return meClone;
  }
  let o=REG.get(p.name);
  if(!o||o.me){o=makePlayer(p.name,p.elo,'high',0);REG.set(p.name,o)}
  o.elo=p.elo;o.steamId=p.steamId||null;o.uid=uid;
  if(isWm) o.eloWm = p.elo;
  if(isDuel) o.eloDuel = p.elo;
  if(typeof applyLook==='function')applyLook(o).then(ch=>{if(ch&&cur&&!$('#lobby').hidden&&typeof renderLobby==='function')renderLobby()});   // vraie photo, bannière et couleur
  return o;
}
function rmLobby(mid,m){
  const P=m.players,myT=P[FBA.uid].team,oT=myT==='A'?'B':'A';
  if(state.searching)stopQueue(false);
  const team=tm=>(m[tm]||[]).map(u=>rmPlayer(u,P[u])).sort((x,y)=>y.elo-x.elo);   // capitaine (meilleur ELO) en premier, comme sur le serveur
  const bots=()=>Array.from({length:m.mode==='duel'?1:m.mode==='wingman'?2:5},(_,i)=>{const b=makePlayer('BOT '+(i+1),P[FBA.uid].elo,'high',0);b.elo=P[FBA.uid].elo;return b});   // match de test
  let first=false;
  if(!cur||cur.mid!==mid){
    clearVeto();if(cur)clearJoin();
    const A=team(myT),B=m.test&&!(m[oT]||[]).length?bots():team(oT),avg=x=>Math.round(x.reduce((s,p)=>s+p.elo,0)/x.length),aA=avg(A),aB=avg(B);
    cur={real:true,mid,A,B,aA,aB,pA:1/(1+10**((aB-aA)/400)),map:null,size:A.length,pool:partyTier(),plan:'free',mode:m.mode,gap:400,sorted:true,done:false,
      veto:{left:[],log:[],turn:'A',deadline:0},srvN:1,id:mid.replace(/^m_/,'').toUpperCase()};
    chatInit();first=true;
  }
  const v=m.veto;
  if(v){
    const banned=v.banned||{};
    cur.veto.left=v.pool.filter(x=>!banned[x]).map(rmMapName);
    cur.veto.log=Object.keys(banned).filter(k=>k!=='_').map(k=>({m:rmMapName(k),team:banned[k]===myT?'A':'B'}));
    cur.veto.turn=v.turn===myT?'A':'B';cur.veto.deadline=m.deadline||0;
    cur.canVeto=v.captains&&v.captains[myT]===FBA.uid;
  }
  if(m.map&&!cur.map){
    cur.map=MAPS.find(x=>'de_'+x.slug===m.map)||{n:rmMapName(m.map),slug:m.map.replace(/^de_/,'')};
    if(!first){toast(t('veto_done',{m:cur.map.n}));beep(784,.1);beep(1047,.14,.1);chatSys('sys_pick',{m:cur.map.n})}
  }
  if(m.server&&(m.status==='ready'||m.status==='live')){
    ip=m.server.connect;
    cur.join={deadline:m.joinDeadline||0,joined:new Set(Object.values(P).filter(p=>p.joined).map(p=>p.name)),timers:[],done:m.status==='live',live:m.status==='live'};
    if(!RM.pw)fbReq(`matchSecrets/${mid}/password`).then(pw=>{if(typeof pw==='string'){RM.pw=pw;srvPass=pw;rmPatch()}});
  }else{ip='';srvPass='';cur.join=null}
  // joueur qui vient de quitter le serveur (signalé par le plugin) : il a 5 min pour revenir
  if(['ready','live'].includes(m.status)&&!first){
    const now=new Set(Object.entries(P).filter(([,p])=>p.leftAt&&!p.joined).map(([u])=>u));
    for(const u of now)if(!(RM.leftSeen||new Set()).has(u)&&u!==FBA.uid)toast(t('rm_left',{n:P[u].name}));
    RM.leftSeen=now;
  }else if(first)RM.leftSeen=new Set();
  // on ne redessine tout le salon que si quelque chose a changé (sinon les lignes clignotent)
  const key=[m.status,cur.veto.log.length,cur.veto.turn,cur.join?cur.join.joined.size:0].join('|');
  if(first){renderLobby();setView('lobby')}
  else if(key!==RM.key){renderVeto();lobbyMapUI()}
  RM.key=key;rmPatch();rmClock();
}
// retouches du salon simulé pour le vrai match
function rmPatch(){
  if(!cur||!cur.real)return;
  const sim=$('#simBtn');if(sim)sim.hidden=true;
  $('#ip').textContent=ip?`${srvPass?'password '+srvPass+'; ':''}connect ${ip}`:'connect …';
  $('#connect').disabled=!ip||!!(cur.join&&cur.join.joined.has(ME.name));
  if(cur.server!==ip&&ip){cur.server=ip;$('#srv').textContent=ip}
  if(!cur.map&&cur.veto.turn==='A'&&!cur.canVeto){const s=$('#veto .veto-s');if(s){s.classList.remove('me');s.textContent=t('rm_cap_turn',{x:cur.A[0].name})}$$('#veto .vmap.can').forEach(b=>b.classList.remove('can'))}
  if(RM.m&&RM.m.status==='waiting_server'){const box=$('#joinBox');box.hidden=false;box.className='joinbox';box.innerHTML=`<b>${t('rm_wait_srv')}</b>`}
}
function rmClock(){
  if(RM.clk)return;
  RM.clk=setInterval(()=>{
    if(!cur||!cur.real||!RM.m){clearInterval(RM.clk);RM.clk=null;return}
    const m=RM.m;
    if(m.status==='veto'){
      const left=Math.max(0,Math.ceil((m.deadline-Date.now())/1000)),c=$('#vetoClock');if(c)c.textContent=left+'s';
      if(left<=0&&RM.ticked!==m.deadline){RM.ticked=m.deadline;fbCall('matchTick',{matchId:RM.mid}).then(()=>rmPoll())}   // capitaine absent : le serveur bannit au hasard
    }
    if(m.status==='ready'&&cur.join)renderJoin();
  },250);
}
$('#veto').addEventListener('click',e=>{
  if(!cur||!cur.real)return;
  e.stopPropagation();                                 // la version simulée ne doit pas réagir
  const b=e.target.closest('[data-veto]');
  if(!b||cur.map||cur.veto.turn!=='A'||!cur.canVeto||cur.veto.log.some(l=>l.m===b.dataset.veto))return;
  beep(520,.07);
  fbCall('vetoBan',{matchId:RM.mid,map:rmSrvMap(b.dataset.veto)}).then(r=>{if(r.error)toast(rmErr(r.error));rmPoll()});
},true);
// connexion au serveur : c'est le plugin qui la confirme (/joined), pas le clic
(()=>{const jp=joinPlayer;joinPlayer=function(){if(cur&&cur.real)return;return jp.apply(this,arguments)}})();
['leave','afkBtn'].forEach(id=>{const b=$('#'+id);if(!b)return;const o=b.onclick;b.onclick=e=>{
  if(!(cur&&cur.real))return o&&o.call(b,e);
  if(RM.m&&RM.m.test&&id==='leave'){fbCall('devTestCancel',{matchId:RM.mid}).then(r=>{if(r.error)toast(rmErr(r.error));else toast(t('rm_test_left'));rmPoll()});return}   // match de test : on peut l'abandonner
  if(id!=='leave'||!RM.m||RM.m.status==='live')return toast(t('rm_live_leave'));   // en direct : on quitte le serveur dans le jeu
  // avant le direct : quitter = ban progressif (sauf non classé), les autres repartent en tête de file
  const casual=RM.m.mode==='casual';
  confirmBox(t('leave_title'),casual?t('casual_free'):t('leave_text',{x:durTxt(nextBan())}),t('leave_confirm'),t('stay'),()=>{
    const mid=RM.mid;RM.declined=mid;
    fbCall('matchLeave',{matchId:mid}).then(r=>{
      if(r.error){RM.declined=null;return toast(rmErr(r.error))}
      if(r.ban)toast(t('ban_applied',{x:durTxt(r.ban.minutes),r:t('ban_r_left')}));
      rmPoll();
    });
  });
}});

// ---------- fin : annulé ou terminé ----------
// drops d'un vrai match (tirés par le serveur) : ajoutés une seule fois à l'inventaire du site
function rmDrops(mid,d){
  if(typeof srvOn==='function'&&srvOn()&&d){            // inventaire sur le serveur : les drops y sont déjà, on recharge
    seRefresh().then(()=>{
      LAST_DROPS={cases:(d.cases||[]).map(c=>({id:c.id,c:String(c.c)})),items:(d.items||[]).map(x=>({...x})),pend:(d.pending||[]).map(p=>({id:p.id,k:p.k,src:'drop'}))};
      [...LAST_DROPS.cases.map(c=>(CDB.cases.find(x=>x.id===c.c)||{n:''}).n),...LAST_DROPS.items.map(i=>EC.name(CDB,i)),...LAST_DROPS.pend.map(p=>EC.name(CDB,{k:p.k,st:false}))].forEach(x=>notify('drop','n_drop',{x},'inventory'));
      if(typeof renderDropCard==='function')renderDropCard();
    });
    return;
  }
  let done=[];try{done=JSON.parse(localStorage.getItem('tr_drops_claimed')||'[]')}catch(e){}
  if(!d||done.includes(mid)||typeof addCase!=='function')return;
  done=[...done,mid].slice(-50);try{localStorage.setItem('tr_drops_claimed',JSON.stringify(done))}catch(e){}
  const got={cases:[],items:[],pend:[]};
  (d.cases||[]).forEach(c=>{if(CDB.cases.some(x=>x.id===c.c))got.cases.push(addCase(c.c,'drop'))});
  (d.items||[]).forEach(it=>{if(CDB.items[it.k])got.items.push(addItem(it,'drop'))});
  (d.pending||[]).forEach(p=>{if(CDB.items[p.k]){const x={id:eid(),k:p.k,src:'drop',at:Date.now()};ECO.pending.push(x);got.pend.push(x)}});
  if(!got.cases.length&&!got.items.length&&!got.pend.length)return;
  ecoSave();LAST_DROPS=got;
  [...got.cases.map(c=>CDB.cases.find(x=>x.id===c.c).n),...got.items.map(i=>EC.name(CDB,i)),...got.pend.map(p=>EC.name(CDB,{k:p.k,st:false}))].forEach(x=>notify('drop','n_drop',{x},'inventory'));
  if(typeof renderDropCard==='function')renderDropCard();
  if(typeof refreshEco==='function')refreshEco();
}
function rmEnd(m,mid){
  const me=m.players[FBA.uid],inLobby=cur&&cur.real,declined=RM.declined===RM.mid;
  RM.mid=null;RM.m=null;
  if(inLobby){clearInterval(RM.clk);RM.clk=null;chatClear();cur=null;ip='';srvPass=''}
  if(m.status==='finished'){
    const r=(m.results||{})[FBA.uid];
    if(r&&m.test&&!m.testReal)toast(t('rm_test_done',{s:(m.score||[]).join('-'),k:r.k,d:r.d}));
    else if(r){if(m.mode==='duel')ME.eloDuel=r.elo;else if(m.mode==='wingman')ME.eloWm=r.elo;else ME.elo=r.elo;if(typeof refreshMe==='function')refreshMe();toast(t('rm_done',{s:(m.score||[]).join('-'),d:(r.delta>=0?'+':'')+r.delta}));beep(784,.12);beep(1047,.12,.12);rmSyncMe()}
    if(!m.test||m.testReal)rmDrops(mid,(m.drops||{})[FBA.uid]);
    if(inLobby)setView('play');
    return;
  }
  if(inLobby)setView('play');
  if(m.test||declined)return;                          // match de test, ou c'est moi qui ai quitté/refusé : pas de remise en file
  // annulé : le serveur a remis en file (prioritaire) ceux qui n'y sont pour rien
  if(m.reason==='no_server')return toast(t('rm_no_server'));
  if(m.reason==='no_show'){
    if(!me.joined)return toast(t('join_kick_me',{x:durTxt(5)}));
    toast(t('prio_requeue'));return rmRequeued();
  }
  if(me.accepted){toast(t('prio_requeue'));return rmRequeued()}
  if(!declined)toast(t('match_cancelled'));
}

// ---------- attente estimée, régions ouvertes, badge bêta ----------
Object.assign(I18N.fr,{beta_tag:'BÊTA',est_need:'Il manque {n}',est_tip:'Moyenne des dernières attentes réelles ({m}, {r}). « Il manque n » : joueurs encore nécessaires pour lancer un match.',reg_soon:'Bientôt',reg_soon_tip:'Pas encore disponible : aucun serveur dans cette région pour le moment.',e_region_closed:'Région pas encore disponible.'});
Object.assign(I18N.en,{beta_tag:'BETA',est_need:'{n} more needed',est_tip:'Average of the latest real waits ({m}, {r}). “n more needed”: players still required to start a match.',reg_soon:'Soon',reg_soon_tip:'Not available yet: no server in this region for now.',e_region_closed:'Region not available yet.'});
Object.assign(I18N.ru,{beta_tag:'БЕТА',est_need:'Нужно ещё {n}',est_tip:'Среднее последних реальных ожиданий ({m}, {r}). «Нужно ещё n»: столько игроков не хватает для матча.',reg_soon:'Скоро',reg_soon_tip:'Пока недоступно: в этом регионе ещё нет серверов.',e_region_closed:'Регион пока недоступен.'});
$$('[data-i18n="beta_tag"]').forEach(e=>e.textContent=t('beta_tag'));
const OPEN_REGIONS=['EU'];
if(!OPEN_REGIONS.includes(state.region))state.region='EU';
RM.stats=null;RM.statsAt=0;
async function rmStats(){
  if(!realMM()||document.hidden||$('#play').hidden||Date.now()-RM.statsAt<15e3)return;
  RM.statsAt=Date.now();
  RM.stats=await fbReq('mmStats');
  renderStats();
}
setInterval(rmStats,5e3);
// estimation : assez de joueurs en file -> moins de 30 s ; sinon moyenne glissante des vraies attentes ; sinon combien il en manque
function estWait(){
  const s=((RM.stats||{})[state.region]||{})[state.mode]||{},size=state.mode==='duel'?2:state.mode==='wingman'?4:10;
  const need=size-(s.inQueue||0)-(state.searching?0:state.party.length);
  if(need<=0)return '< 00:30';
  if(s.wait&&s.wait.avg&&Date.now()-(s.wait.last||0)<7*864e5)return '~'+fmt(Math.round(s.wait.avg/1000));
  return t('est_need',{n:need});
}
(()=>{const rs=renderStats;renderStats=function(){
  rs.apply(this,arguments);
  if(!realMM())return;
  const w=$('#sWait');if(!w)return;
  w.textContent=estWait();
  w.title=t('est_tip',{m:modeObj().n,r:state.region});
  const s=((RM.stats||{})[state.region]||{})[state.mode];
  if(s&&$('#sQueue'))$('#sQueue').textContent=(s.inQueue||0).toLocaleString(LOC[lang]);
}})();
// NA et AS : affichées mais pas encore sélectionnables
(()=>{const rr=renderRegions;renderRegions=function(){
  rr.apply(this,arguments);
  $$('#regions .chip').forEach(c=>{
    if(OPEN_REGIONS.includes(c.dataset.id))return;
    c.classList.add('soon');c.title=t('reg_soon_tip');
    const sm=c.querySelector('small');if(sm){sm.textContent=t('reg_soon');sm.style.color=''}
  });
}})();
$('#regions').addEventListener('click',e=>{
  const c=e.target.closest('.chip');
  if(c&&!OPEN_REGIONS.includes(c.dataset.id)){e.stopImmediatePropagation();toast(t('reg_soon_tip'))}
},true);
renderRegions();renderStats();

// ---------- match de test (comptes dev) ----------
Object.assign(I18N.fr,{rm_left:'{n} s\'est déconnecté du serveur : 5 min pour revenir, sinon abandon.',rm_live_leave:'Le match est en cours : pour partir, quitte le serveur dans le jeu (5 min pour revenir, sinon ban pour abandon).',e_match_live:'Le match est déjà en direct.',rm_test_left:'Match de test abandonné : le serveur se libère.',rm_test:'Match de test (dev)',rm_test_rounds:'Nombre de rounds du match de test',rm_test_real:'Fin réelle (ELO + drops)',rm_test_real_tip:'Comme un vrai match : ELO enregistré sur ton profil (niveau, victoires, historique) et vrais drops.',rm_test_tip:'Toi seul contre des bots sur un vrai serveur, 2 rounds, sans ELO : pour tester toute la chaîne.',rm_test_go:'Match de test lancé : rejoins le serveur depuis le salon.',rm_test_done:'Match de test terminé · {s} · {k} kills / {d} morts (sans ELO)'});
Object.assign(I18N.en,{rm_left:'{n} left the server: 5 min to come back, or it counts as an abandon.',rm_live_leave:'The match is live: to leave, quit the server in game (5 min to come back, or an abandon ban).',e_match_live:'The match is already live.',rm_test_left:'Test match abandoned: the server is being freed.',rm_test:'Test match (dev)',rm_test_rounds:'Test match rounds',rm_test_real:'Real ending (ELO + drops)',rm_test_real_tip:'Like a real match: ELO saved on your profile (level, wins, history) and real drops.',rm_test_tip:'You alone against bots on a real server, 2 rounds, no ELO: to test the whole chain.',rm_test_go:'Test match started: join the server from the lobby.',rm_test_done:'Test match over · {s} · {k} kills / {d} deaths (no ELO)'});
Object.assign(I18N.ru,{rm_left:'{n} покинул сервер: 5 минут на возвращение, иначе это выход из матча.',rm_live_leave:'Матч идёт: чтобы уйти, выйди с сервера в игре (5 минут на возвращение, иначе бан за выход).',e_match_live:'Матч уже идёт.',rm_test_left:'Тестовый матч отменён: сервер освобождается.',rm_test:'Тестовый матч (dev)',rm_test_rounds:'Раунды тестового матча',rm_test_real:'Настоящий финал (ELO + дропы)',rm_test_real_tip:'Как настоящий матч: ELO сохраняется в профиле (уровень, победы, история), настоящие дропы.',rm_test_tip:'Ты один против ботов на настоящем сервере, 2 раунда, без ELO: проверка всей цепочки.',rm_test_go:'Тестовый матч запущен: заходи на сервер из лобби.',rm_test_done:'Тестовый матч окончен · {s} · {k} убийств / {d} смертей (без ELO)'});
$('#find').insertAdjacentHTML('afterend',`<div class="rm-test-box" id="rmTestBox" hidden><button class="btn ghost sm rm-test" id="rmTest">${t('rm_test')}</button>
  <select id="rmTestRounds" title="${escA(t('rm_test_rounds'))}">${[2,6,12,16,24,30].map(n=>`<option value="${n}">${t('rm_rounds_n',{n})}</option>`).join('')}</select>
  <label class="rm-test-real" title="${escA(t('rm_test_real_tip'))}"><input type="checkbox" id="rmTestReal"> <span id="rmTestRealT">${t('rm_test_real')}</span></label></div>`);
// changement de langue : le bloc est créé une seule fois, on remet ses textes à jour
(()=>{const o=setLang;setLang=function(){const r=o.apply(this,arguments);const sel=$('#rmTestRounds');
  if(sel){sel.title=t('rm_test_rounds');[...sel.options].forEach(op=>op.textContent=t('rm_rounds_n',{n:op.value}))}
  const lb=$('#rmTestReal')?.parentElement;if(lb){lb.title=t('rm_test_real_tip');$('#rmTestRealT').textContent=t('rm_test_real')}
  rmTestBtn();return r}})();
async function rmTestBtn(){
  const b=$('#rmTest');if(!b)return;
  const dev=realMM()&&typeof amDev==='function'&&await amDev();
  $('#rmTestBox').hidden=!dev;b.textContent=t('rm_test');b.title=t('rm_test_tip');
}
setInterval(rmTestBtn,5e3);setTimeout(rmTestBtn,1500);
$('#rmTest').onclick=async()=>{
  if(state.searching||RM.mid)return toast(t('locked'));
  const b=$('#rmTest');b.disabled=true;
  const r=await fbCall('devTestMatch',{mode:state.mode==='duel'?'duel':state.mode==='wingman'?'wingman':'ranked',rounds:+$('#rmTestRounds').value,real:$('#rmTestReal').checked,lang});
  b.disabled=false;
  if(r.error)return toast(rmErr(r.error));
  toast(t('rm_test_go'));rmPoll();
};

rmPoll();
