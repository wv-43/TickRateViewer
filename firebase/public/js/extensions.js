var FB_API_KEY='AIzaSyB8tB0xv9Xry6mo69XzPJ611S4dpT6YI_Y';
window.FB_API_KEY=FB_API_KEY;
window.FB_URL=window.FB_URL||'https://tickratecsgo-default-rtdb.europe-west1.firebasedatabase.app';
var FBA={uid:null,idToken:null,refresh:null,exp:0,pending:null,err:null};
try{const v=JSON.parse(localStorage.getItem('tr_fba')||'null');if(v&&v.refresh)Object.assign(FBA,{uid:v.uid,refresh:v.refresh})}catch(e){}
async function fbAuthEnsure(){
  if(!FB_API_KEY||!FBA)return null;
  if(FBA.idToken&&Date.now()<FBA.exp-60e3)return FBA.idToken;
  if(FBA.pending)return FBA.pending;
  FBA.pending=(async()=>{
    try{
      let r,j;
      if(FBA.refresh){
        r=await fetch(`https://securetoken.googleapis.com/v1/token?key=${FB_API_KEY}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`grant_type=refresh_token&refresh_token=${encodeURIComponent(FBA.refresh)}`});
        j=await r.json();
        if(r.ok)Object.assign(FBA,{idToken:j.id_token,refresh:j.refresh_token,uid:j.user_id,exp:Date.now()+(+j.expires_in||3600)*1e3});
      }
      if(!FBA.idToken){
        r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FB_API_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({returnSecureToken:true})});
        j=await r.json();
        if(!r.ok)throw new Error(j.error&&j.error.message||'auth');
        Object.assign(FBA,{idToken:j.idToken,refresh:j.refreshToken,uid:j.localId,exp:Date.now()+(+j.expiresIn||3600)*1e3});
      }
      try{localStorage.setItem('tr_fba',JSON.stringify({uid:FBA.uid,refresh:FBA.refresh}))}catch(e){}
      FBA.err=null;return FBA.idToken;
    }catch(e){FBA.err=String(e.message||e);FBA.idToken=null;return null}
    finally{FBA.pending=null}
  })();
  return FBA.pending;
}
function fbUrl(path){
  const [p,q]=String(path).split('?');const qs=new URLSearchParams(q||'');
  if(FBA&&FBA.idToken)qs.set('auth',FBA.idToken);
  const s=qs.toString();return `${FB_URL}/${p}.json${s?'?'+s:''}`;
}

const RLB={rows:null,at:0,err:null,loading:false,mode:'ranked'};
async function fbLoadLeaderboard(force){
  if(RLB.loading||(!force&&RLB.rows&&Date.now()-RLB.at<60e3))return;
  RLB.loading=true;RLB.err=null;
  try{
    let d=await fbReq('users?orderBy=%22elo%22&limitToLast=100');
    if(!d)d=await fbReq('users');
    if(!d)throw new Error('offline');
    RLB.rows=Object.entries(d).filter(([k,u])=>u&&typeof u.elo==='number'&&u.name).map(([k,u])=>({key:k,...u})).sort((a,b)=>b.elo-a.elo);
    RLB.at=Date.now();
  }catch(e){RLB.err=String(e.message||e)}
  RLB.loading=false;
  if(!$('#ranking').hidden&&rkTab!=='ladder')renderRanking();
}
function realRankingHTML(){
  if(!RLB.rows){fbLoadLeaderboard();return `<div class="card rl-empty">${RLB.err?t('rl_err'):t('rl_loading')}</div>`}
  const me=fbUserKey(),rows=RLB.rows;
  if(!rows.length)return `<div class="card rl-empty">${t('rl_none')}</div>`;
  const tr=rows.map((u,i)=>{const isMe=u.key===me||(typeof FBA!=='undefined'&&u.key===FBA.uid),l=lvl(u.elo),tv=typeof u.trust==='number'?u.trust:10,tier=TIERS.find(x=>tv>=x.min);
    return `<tr class="${isMe?'me':''}"><td class="rk">${i+1}</td><td><div class="pl"><span data-profile="${escA(u.name)}">${avHTML({name:u.name,avatar:u.avatar,steamAvatar:u.steamAvatar,color:u.color})}</span><span data-profile="${escA(u.name)}">${escA(u.name)}</span>${typeof planBadge==='function'?planBadge(u):(u.plan==='premium'?'<span class="pb prem">PREMIUM</span>':'')}${isMe?`<span class="pill" style="margin-left:6px">${t('rl_you')}</span>`:''}</div></td>
      <td><span class="cc">${escA(u.country||'')}</span></td><td>${lvlHTML(u.elo)}</td><td class="rt">${u.elo}</td><td>${u.totalMatches||0}</td><td>${u.winrate!=null?u.winrate+'%':'–'}</td>
      <td><span class="tf" style="--c:${tier.c}">${ICON.shield}${tv.toFixed(1)}</span></td></tr>`}).join('');
  return `<div class="rl-bar"><span>${t('rl_src',{n:rows.length})}</span><span>${t('rl_upd',{x:agoTxt(Date.now()-RLB.at)})}</span><span class="seg rl-modes"><button class="${RLB.mode==='wingman'?'':'on'}" data-rlmode="ranked">5v5</button><button class="${RLB.mode==='wingman'?'on':''}" data-rlmode="wingman">${t('pf_mode_wm')}</button></span><button class="btn ghost sm" data-rlrefresh>${t('rl_refresh')}</button></div>
    <div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl rk-table" style="min-width:600px"><thead><tr><th class="rk">${t('th_rank')}</th><th style="text-align:left">${t('th_player')}</th><th style="text-align:left">${t('th_country')}</th><th>${t('rl_lvl')}</th><th>ELO</th><th>${t('t_matches')}</th><th>${t('t_winrate')}</th><th>${t('trust_short')}</th></tr></thead><tbody>${tr}</tbody></table></div></div>`;
}
async function lookRows(rows,max=24){
  if(typeof realLook!=='function'||!rows)return false;let ch=false;
  await Promise.all(rows.slice(0,max).map(async u=>{if(!u||!u.name)return;const L=await realLook(u.name,false);
    if(L.avatar&&L.avatar!==u.avatar){u.avatar=L.avatar;ch=true}if(L.steamAvatar&&L.steamAvatar!==u.steamAvatar){u.steamAvatar=L.steamAvatar;ch=true}if(L.color&&L.color!==u.color){u.color=L.color;ch=true}}));
  return ch;
}
function realPodiumHTML(rows){
  if(!rows||rows.length<3)return '';
  return `<div class="podium">${rows.slice(0,3).map((u,i)=>`<div class="pod r${i+1}"><div class="rk">${i+1}</div><span data-profile="${escA(u.name)}">${avHTML({name:u.name,avatar:u.avatar,steamAvatar:u.steamAvatar,color:u.color})}</span>
    <div><div class="nm" data-profile="${escA(u.name)}">${escA(u.name)}</div><div class="el">${u.elo} ELO</div></div>${lvlHTML(u.elo)}</div>`).join('')}</div>`;
}
const RLD={bracket:null,data:null,loading:false};
const RL_BR=[['b9_10','Master',9,10],['b6_8','Diamond',6,8],['b4_5','Gold',4,5],['b1_3','Contender',1,3]];
const RL_RW=[[1,1,5000],[2,2,3000],[3,3,2000],[4,10,800],[11,50,300],[51,100,100]],RL_MULT={b9_10:1,b6_8:.75,b4_5:.55,b1_3:.4};
Object.assign(I18N.fr,{rl_br:'Palier {n} · Niv. {a} – {b}',rl_my_br:'TON PALIER',rl_lad_rules:'Victoire +30 pts, défaite +10 pts, bonus de performance jusqu\'à +15. Chaque lundi, les meilleurs de chaque palier reçoivent des Tick Coins (minimum {m} pts dans la semaine).',
  rl_pts:'Points',rl_no_week:'Personne n\'a encore joué cette semaine dans ce palier.',rl_my:'Tes points cette semaine : {n}{r}',rl_last:'Semaine dernière : #{r} de ton palier, +{c} TC versés'});
Object.assign(I18N.en,{rl_br:'{n} tier · Lv. {a} – {b}',rl_my_br:'YOUR TIER',rl_lad_rules:'Win +30 pts, loss +10 pts, performance bonus up to +15. Every Monday, the best of each tier earn Tick Coins (minimum {m} pts in the week).',
  rl_pts:'Points',rl_no_week:'Nobody has played in this tier yet this week.',rl_my:'Your points this week: {n}{r}',rl_last:'Last week: #{r} in your tier, +{c} TC paid'});
Object.assign(I18N.ru,{rl_br:'{n} · ур. {a} – {b}',rl_my_br:'ТВОЙ УРОВЕНЬ',rl_lad_rules:'Победа +30 очков, поражение +10, бонус за игру до +15. Каждый понедельник лучшие в каждой лиге получают Tick Coins (минимум {m} очков за неделю).',
  rl_pts:'Очки',rl_no_week:'На этой неделе в этой лиге ещё никто не играл.',rl_my:'Твои очки за неделю: {n}{r}',rl_last:'Прошлая неделя: #{r} в твоей лиге, +{c} TC начислено'});
function realLadderHTML(){
  if(!RLD.data){
    if(!RLD.loading){RLD.loading=true;fbCall('ladderBoard',{bracket:RLD.bracket}).then(r=>{RLD.loading=false;RLD.data=r&&!r.error?r:{rows:[],me:{},bracket:RLD.bracket||'b4_5',myBracket:'b4_5',ends:Date.now(),minPts:50};steamRows(RLD.data.rows);if(!$('#ranking').hidden&&rkTab==='ladder')renderRanking();
      lookRows(RLD.data.rows).then(ch=>{if(ch&&!$('#ranking').hidden&&rkTab==='ladder')renderRanking()})})}
    return `<div class="card rl-empty">${t('rl_loading')}</div>`;
  }
  const D=RLD.data,cur=D.bracket,mult=RL_MULT[cur]||1,left=Math.max(0,Math.floor((D.ends-Date.now())/1000));
  const tabs=`<div class="lad-brackets">${RL_BR.map(([id,n,a,b])=>`<div class="lad-br ${id===cur?'on':''}" data-rlbr="${id}">${id===D.myBracket?`<span class="my-tag">${t('rl_my_br')}</span>`:''}
    <b>${t('rl_br',{n,a,b})}</b><small>#1 : ${Math.round(5000*RL_MULT[id])} TC</small></div>`).join('')}</div>`;
  const rows=(D.rows||[]).map((u,i)=>`<tr class="${u.me?'me':''}"><td class="rk">${i+1}</td><td><div class="pl"><span data-profile="${escA(u.name)}">${avHTML({name:u.name,avatar:u.avatar,steamAvatar:u.steamAvatar})}</span><span data-profile="${escA(u.name)}">${escA(u.name)}</span></div></td>
    <td>${lvlHTML(u.elo)}</td><td class="rt">${u.elo}</td><td class="rt"><b>${u.pts}</b></td></tr>`).join('');
  return `<div class="lo-note">${t('rl_lad_rules',{m:D.minPts})}</div>${tabs}
    <div class="lad"><div class="card" style="padding:0">${rows?`<div class="tbl-wrap"><table class="tbl rk-table" style="min-width:460px"><thead><tr><th class="rk">#</th><th style="text-align:left">${t('th_player')}</th><th class="c">${t('th_level')}</th><th>ELO</th><th>${t('rl_pts')}</th></tr></thead><tbody>${rows}</tbody></table></div>`:`<div class="rl-empty" style="padding:22px">${t('rl_no_week')}</div>`}</div>
      <div class="card"><div class="h3">${t('rl_br',(()=>{const x=RL_BR.find(y=>y[0]===cur);return {n:x[1],a:x[2],b:x[3]}})())} <span>${t('ladder_ends',{x:t('days_s',{d:Math.floor(left/86400),h:Math.floor(left%86400/3600)})})}</span></div>
        ${RL_RW.map(([a,b,n])=>`<div class="rwd"><span>#${a}${b>a?'–'+b:''}</span><b>${tcHTML(Math.round(n*mult/10)*10)}</b></div>`).join('')}
        <div class="m-hint" style="margin-top:10px"><b style="color:var(--text)">${t('rl_my',{n:D.me?.pts||0,r:D.me?.rank?' · #'+D.me.rank:''})}</b></div>
        ${D.last?`<div class="m-hint">${t('rl_last',{r:D.last.rank,c:D.last.coins})}</div>`:''}</div></div>`;
}
(()=>{
  const oR=renderRanking;
  renderRanking=function(){
    if(!fbLive())return oR();
    if(rkTab==='ladder'){$('#ranking').innerHTML=rkHead()+realLadderHTML();return}
    const rows=RLB.rows||[],me=fbUserKey(),mi=rows.findIndex(u=>u.key===me);
    $('#ranking').innerHTML=rkHead(mi>=0?`<span class="pill" style="font-size:14px;padding:6px 10px"><b>${t('your_rank',{n:mi+1})}</b></span>`:'')+realPodiumHTML(rows)+realRankingHTML();
  };
  $('#ranking').addEventListener('click',e=>{if(e.target.closest('[data-rlrefresh]'))fbLoadLeaderboard(true);
    const lb=e.target.closest('[data-rlbr]');if(lb){RLD.bracket=lb.dataset.rlbr;RLD.data=null;return renderRanking()}
    const md=e.target.closest('[data-rlmode]');if(md&&md.dataset.rlmode!==RLB.mode){RLB.mode=md.dataset.rlmode;RLB.rows=null;renderRanking();fbLoadLeaderboard(true)}});
})();
Object.assign(I18N.fr,{rk_tab_real:'Joueurs inscrits',rl_loading:'Chargement des joueurs depuis Firebase…',rl_err:'Impossible de joindre Firebase pour l\'instant.',rl_none:'Aucun joueur inscrit pour l\'instant.',rl_you:'Toi',rl_src:'{n} joueurs réels (Firebase)',rl_upd:'mis à jour {x}',rl_refresh:'Actualiser',rl_lvl:'Niveau'});
Object.assign(I18N.en,{rk_tab_real:'Registered players',rl_loading:'Loading players from Firebase…',rl_err:'Cannot reach Firebase right now.',rl_none:'No registered player yet.',rl_you:'You',rl_src:'{n} real players (Firebase)',rl_upd:'updated {x}',rl_refresh:'Refresh',rl_lvl:'Level'});
Object.assign(I18N.ru,{rk_tab_real:'Реальные игроки',rl_loading:'Загрузка игроков из Firebase…',rl_err:'Firebase сейчас недоступен.',rl_none:'Пока нет игроков.',rl_you:'Ты',rl_src:'{n} реальных игроков (Firebase)',rl_upd:'обновлено {x}',rl_refresh:'Обновить',rl_lvl:'Уровень'});

Object.assign(I18N.fr,{md_title:'Détail du match',md_rounds:'Rounds',md_half:'Mi-temps',md_you:'Toi',md_demo:'Demo du match',md_copy:'Copier la commande',md_share:'Copier la carte',md_shared:'Carte du match copiée dans le presse-papiers',md_downloaded:'Carte du match téléchargée',md_gen:'Match ancien : composition des équipes reconstituée.',md_open:'Voir le détail',md_elo:'ELO',md_mvp:'MVP',md_first:'1re mi-temps',md_second:'2e mi-temps',md_streak:'Plus longue série : {n} rounds',
  ob_t:'Bien démarrer sur TICKRATE',ob_s:'{a}/{b} étapes · +{c} pièces à la fin',ob_steam:'Lier ton compte Steam',ob_audio:'Régler ton micro et ton casque',ob_match:'Jouer ton premier match',ob_friends:'Trouver des amis',ob_vigie:'Découvrir la Vigie (fair-play)',ob_done:'Tout est prêt ! +{c} pièces',ob_hide:'Masquer'});
Object.assign(I18N.en,{md_title:'Match details',md_rounds:'Rounds',md_half:'Half-time',md_you:'You',md_demo:'Match demo',md_copy:'Copy command',md_share:'Copy match card',md_shared:'Match card copied to clipboard',md_downloaded:'Match card downloaded',md_gen:'Older match: team line-ups reconstructed.',md_open:'See details',md_elo:'ELO',md_mvp:'MVP',md_first:'1st half',md_second:'2nd half',md_streak:'Longest streak: {n} rounds',
  ob_t:'Get started on TICKRATE',ob_s:'{a}/{b} steps · +{c} coins at the end',ob_steam:'Link your Steam account',ob_audio:'Set up your mic and headset',ob_match:'Play your first match',ob_friends:'Find friends',ob_vigie:'Discover Watch (fair play)',ob_done:'All set! +{c} coins',ob_hide:'Hide'});
Object.assign(I18N.ru,{md_title:'Детали матча',md_rounds:'Раунды',md_half:'Смена сторон',md_you:'Ты',md_demo:'Демка матча',md_copy:'Скопировать команду',md_share:'Скопировать карточку',md_shared:'Карточка матча скопирована',md_downloaded:'Карточка матча скачана',md_gen:'Старый матч: составы восстановлены.',md_open:'Подробнее',md_elo:'ELO',md_mvp:'MVP',md_first:'1-я половина',md_second:'2-я половина',md_streak:'Лучшая серия: {n} раундов',
  ob_t:'Начало на TICKRATE',ob_s:'{a}/{b} шагов · +{c} монет в конце',ob_steam:'Привязать Steam',ob_audio:'Настроить микрофон и наушники',ob_match:'Сыграть первый матч',ob_friends:'Найти друзей',ob_vigie:'Узнать про Дозор (фейр-плей)',ob_done:'Всё готово! +{c} монет',ob_hide:'Скрыть'});

function mdPack(A,B,mvp){const f=r=>({n:r.p.name,c:r.p.color,k:r.k,a:r.a,d:r.d,adr:r.adr,hs:r.hs,r:+r.rating.toFixed(2),e:r.ch.d,me:!!r.p.me,mvp:r===mvp});return {A:A.map(f),B:B.map(f)}}
function mdRounds(sW,sL,wonA){
  const W=wonA?'A':'B',L=wonA?'B':'A',arr=[...Array(sW-1).fill(W),...Array(sL).fill(L)];
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}
  return arr.concat(W).join('');
}
function mdSeeded(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return ((s>>>0)%1e6)/1e6}}
function mdFill(x,P){
  if(x.sb&&x.rs)return x;
  const R=mdSeeded(+new Date(x.date)||7),pk=a=>a[Math.floor(R()*a.length)],[sa,sb]=String(x.score).split('-').map(Number);
  if(x.sb){const R2=Math.random;Math.random=R;const rs=x.rs||mdRounds(Math.max(sa,sb),Math.min(sa,sb),sa>sb);Math.random=R2;return {...x,rs,gen:false}}
  const mk=(me)=>{const k=me?x.k:Math.round(8+R()*18),d=me?x.d:Math.round(10+R()*12);return {n:me?P.name:pk(NAMES)+(R()<.3?Math.floor(R()*99):''),c:me?P.color:pk(COLORS),k,a:me?x.a:Math.round(R()*8),d,adr:me?x.adr:Math.round(55+R()*45),hs:me?x.hs:Math.round(25+R()*40),r:me?x.rating:+(0.7+R()*0.7).toFixed(2),e:me?x.delta:(x.won?1:-1)*Math.round(15+R()*14),me}};
  const A=[mk(true),mk(),mk(),mk(),mk()].sort((a,b)=>b.r-a.r),B=[mk(),mk(),mk(),mk(),mk()].map(r=>({...r,e:-r.e})).sort((a,b)=>b.r-a.r);
  const all=[...A,...B],best=all.reduce((m,r)=>r.r>m.r?r:m);best.mvp=true;
  const R2=Math.random;Math.random=R;const rs=mdRounds(Math.max(sa,sb),Math.min(sa,sb),sa>sb);Math.random=R2;
  return {...x,sb:{A,B},rs,gen:true};
}
let MD=null,MD_P=null;
async function mdFetchRealSb(x0,P){
  if(x0.sb||typeof fbReq!=='function'||!String(x0.id||'').startsWith('m_'))return false;
  try{
    const m=await fbReq(`matches/${x0.id}`);
    if(!m||!m.players||!m.results)return false;
    const ids=Object.keys(m.results);if(!ids.length)return false;
    const mvp=ids.reduce((b,u)=>(m.results[u].rating>(m.results[b]||{}).rating?u:b),ids[0]);
    const meUid=ids.find(u=>(m.players[u]?.name||'').toLowerCase()===(P.name||'').toLowerCase())||(P===ME&&typeof FBA!=='undefined'?FBA.uid:null);
    const myT=(meUid&&m.players[meUid]?.team)||'A',oT=myT==='A'?'B':'A';
    const rowOf=u=>{const r=m.results[u],pl=m.players[u]||{};return {n:pl.name||'Joueur',c:lvColor(pl.name||u),k:r.k||0,a:r.a||0,d:r.d||0,adr:r.adr||0,hs:r.hs||0,r:+(r.rating||1).toFixed(2),e:r.delta||0,me:u===meUid,mvp:u===mvp}};
    x0.sb={A:(m[myT]||[]).filter(u=>m.results[u]).map(rowOf).sort((a,b)=>b.r-a.r),B:(m[oT]||[]).filter(u=>m.results[u]).map(rowOf).sort((a,b)=>b.r-a.r)};
    x0.gen=false;return true;
  }catch(_){return false}
}
function openMatchDetail(P,i){
  const x0=P.history[i];if(!x0)return;
  if(x0.sb)x0.sb.A.concat(x0.sb.B).forEach(r=>{if(!r.c)r.c=r.me?P.color:lvColor(r.n)});
  const x=mdFill(x0,P);MD=x;MD_P=P;
  if(!x0.sb&&String(x0.id||'').startsWith('m_'))mdFetchRealSb(x0,P).then(ok=>{if(ok&&$('#mdModal')?.classList.contains('on'))openMatchDetail(P,i)});
  const [sa,sb]=String(x.score).split('-').map(Number),win=Math.max(sa,sb),half=win>=16?15:win>=13?12:8;
  const map=MAPS.find(m=>m.n===x.map)||MAPS[0];
  const rs=[...x.rs];let best=0,cur=0,prev='';rs.forEach(r=>{cur=r===prev?cur+1:1;prev=r;if(r==='A')best=Math.max(best,cur)});
  const dots=rs.map((r,k)=>`${k===half?`<i class="md-half" title="${t('md_half')}"></i>`:''}<span class="md-r ${r==='A'?'w':'l'}" title="${t('md_rounds')} ${k+1}">${k+1}</span>`).join('');
  const board=(rows,us)=>`<div class="md-team ${us?'us':'them'}"><div class="md-th"><b>${us?(x.won?t('victory'):t('defeat')):(x.won?t('defeat'):t('victory'))}</b><span>${us?sa:sb}</span></div>
    <div class="tbl-wrap"><table class="tbl md-tbl"><thead><tr><th style="text-align:left">${t('th_player')}</th><th>K</th><th>A</th><th>D</th><th>ADR</th><th>HS %</th><th>${t('rating')}</th><th>${t('md_elo')}</th></tr></thead><tbody>
    ${rows.map(r=>`<tr class="${r.me?'me':''}"><td style="text-align:left"><div class="pl"><span class="md-av" style="background:${safeCol(r.c)}">${escA(r.n[0]||'?').toUpperCase()}</span><span>${escA(r.n)}</span>${r.mvp?`<span class="md-mvp">${t('md_mvp')}</span>`:''}${r.me?`<span class="pill">${t('md_you')}</span>`:''}</div></td>
      <td>${r.k}</td><td>${r.a}</td><td>${r.d}</td><td>${r.adr}</td><td>${r.hs}%</td><td class="rt ${rtClass(r.r)}">${(+r.r).toFixed(2)}</td><td class="rt ${r.e>0?'pos':r.e<0?'neg':''}">${sign(r.e)}</td></tr>`).join('')}</tbody></table></div></div>`;
  const demo=`playdemo tickrate_${escA(x.id||('m_'+(+new Date(x.date)).toString(16).slice(-8)))}`;
  $('#mdBody').innerHTML=`<div class="md-head" style="--bg:${mapBg(map)}"><div class="md-bg"></div>
      <div><div class="md-tag">${fmtDate(new Date(x.date))} · ${escA(x.map)} · ${t('rounds',{n:rs.length})}</div><div class="md-res ${x.won?'w':'l'}">${x.won?t('victory'):t('defeat')}</div></div>
      <div class="md-score"><span class="${x.won?'w':''}">${sa}</span><i>:</i><span class="${x.won?'':'w'}">${sb}</span></div></div>
    <div class="md-sec"><div class="md-st"><b>${t('md_rounds')}</b><small>${t('md_streak',{n:best})}</small></div><div class="md-rounds">${dots}</div></div>
    ${board(x.sb.A,true)}${board(x.sb.B,false)}
    <div class="md-foot" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><div class="vg-cmd" style="flex:1;margin:0"><code>${demo}</code><button class="btn sm" data-mdcopy="${demo}">${t('md_copy')}</button></div><button class="btn primary sm" data-mdcard>${t('md_share')}</button></div>
    ${x.gen?`<p class="m-hint">${t('md_gen')}</p>`:''}`;
  openModal('mdModal');
}
async function mdShareCard(x,P){
  if(!x)return;
  const W=800,H=420,cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const g=cv.getContext('2d'),ac=x.won?'#3fcf8e':'#ff4d5e';
  g.fillStyle='#0d0e12';g.fillRect(0,0,W,H);
  const grd=g.createLinearGradient(0,0,W,H);grd.addColorStop(0,x.won?'rgba(63,207,142,0.14)':'rgba(255,77,94,0.14)');grd.addColorStop(1,'rgba(255,178,31,0.04)');
  g.fillStyle=grd;g.fillRect(0,0,W,H);
  g.strokeStyle='#262830';g.lineWidth=2;g.strokeRect(1,1,W-2,H-2);
  g.fillStyle='#ffb21f';g.font='800 18px system-ui,-apple-system,sans-serif';g.fillText('TICKRATE · 128 TICK',36,44);
  const modeLbl=x.mode==='duel'?'1V1 AIM ARENA':x.mode==='wingman'?'WINGMAN 2V2':'COMPETITIVE 5V5';
  g.fillStyle='#8c909c';g.font='600 13px system-ui,-apple-system,sans-serif';g.fillText(`${modeLbl} · ${String(x.map||'').toUpperCase()} · ${fmtDate(new Date(x.date))}`,36,68);
  g.fillStyle=ac;g.font='900 38px system-ui,-apple-system,sans-serif';g.fillText((x.won?t('victory'):t('defeat')).toUpperCase(),36,124);
  const [sa,sb]=String(x.score||'0-0').split('-');
  g.fillStyle='#f3f4f6';g.font='900 54px system-ui,-apple-system,sans-serif';g.textAlign='right';g.fillText(`${sa} : ${sb}`,W-36,118);g.textAlign='left';
  g.fillStyle='#16181f';g.fillRect(36,150,W-72,82);g.strokeStyle='#262830';g.lineWidth=1;g.strokeRect(36,150,W-72,82);
  g.fillStyle='#f3f4f6';g.font='800 22px system-ui,-apple-system,sans-serif';g.fillText(String((P&&P.name)||ME.name||'Player'),56,188);
  const dTxt=(x.delta>=0?'+':'')+x.delta+' ELO';
  g.fillStyle=x.delta>=0?'#3fcf8e':'#ff4d5e';g.font='700 15px system-ui,-apple-system,sans-serif';g.fillText(`${x.elo||1000} ELO (${dTxt})`,56,214);
  const kd=(x.d?x.k/x.d:x.k).toFixed(2);
  const stats=[['K / D / A',`${x.k} / ${x.d} / ${x.a}`],['K/D',kd],['ADR',String(x.adr||0)],['HS %',`${x.hs||0}%`],[t('rating').toUpperCase(),(+x.rating||1).toFixed(2)]];
  stats.forEach(([k,v],idx)=>{
    const sx=310+idx*90;
    g.fillStyle='#8c909c';g.font='600 11px system-ui,-apple-system,sans-serif';g.fillText(k,sx,180);
    g.fillStyle='#f3f4f6';g.font='800 20px system-ui,-apple-system,sans-serif';g.fillText(v,sx,210);
  });
  const drawT=(rows,ox,title)=>{
    g.fillStyle='#8c909c';g.font='700 12px system-ui,-apple-system,sans-serif';g.fillText(title,ox,264);
    (rows||[]).slice(0,5).forEach((r,idx)=>{
      const y=288+idx*22;
      g.fillStyle=r.me?'#ffb21f':'#d5d8e0';g.font=(r.me?'700':'500')+' 13px system-ui,-apple-system,sans-serif';
      g.fillText(String(r.n||'').slice(0,16),ox,y);
      g.fillStyle='#8c909c';g.textAlign='right';g.fillText(`${r.k}/${r.d}/${r.a} · ${(+r.r).toFixed(2)}`,ox+330,y);g.textAlign='left';
    });
  };
  drawT(x.sb?.A,36,'TEAM A');drawT(x.sb?.B,430,'TEAM B');
  g.fillStyle='#5c606c';g.font='600 12px system-ui,-apple-system,sans-serif';g.textAlign='right';g.fillText('tickrate.eu',W-36,H-16);g.textAlign='left';
  cv.toBlob(async blob=>{
    if(!blob)return;
    try{
      if(navigator.clipboard&&window.ClipboardItem){await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);toast(t('md_shared'));beep(880,.06);return}
    }catch(_){}
    const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`tickrate-${x.id||'match'}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000);toast(t('md_downloaded'));
  },'image/png');
}
document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="mdModal"><div class="modal md-modal"><div class="m-h"><h3 data-i18n="md_title">${t('md_title')}</h3><button class="x2" data-close>×</button></div><div id="mdBody"></div></div></div>`);
$('#mdModal').addEventListener('click',async e=>{
  const c=e.target.closest('[data-mdcopy]');if(c){try{await navigator.clipboard.writeText(c.dataset.mdcopy)}catch(_){}toast(t('vg_copied'));return}
  if(e.target.closest('[data-mdcard]'))mdShareCard(MD,MD_P||ME);
});
$('#profile').addEventListener('click',e=>{
  const tr=e.target.closest('tr[data-md]');if(!tr||e.target.closest('button,[data-profile]'))return;
  openMatchDetail(profileTarget||ME,+tr.dataset.md);
});

const OB_REWARD=150;
let OB={};try{OB=JSON.parse(localStorage.getItem('tr_ob')||'{}')||{}}catch(e){}
const obSave=()=>{try{localStorage.setItem('tr_ob',JSON.stringify(OB))}catch(e){}};
function obSteps(){return [
  ['steam',!!(ME.steam&&ME.steam.linked),'profile'],
  ['match',!!OB.match,'play'],
  ['friends',!!OB.friends,'friends'],
  ['vigie',!!OB.vigie,'vigie']]}
function renderOnboard(){
  const el=$('#onb');if(el)el.innerHTML='';
}
$('#play').addEventListener('click',e=>{
  if(e.target.closest('[data-obhide]')){OB.hidden=true;obSave();return renderOnboard()}
  const g=e.target.closest('[data-obgo]');if(!g)return;
  const [v,sub]=g.dataset.obgo.split(':');
  if(v==='play'){$('#find')&&$('#find').scrollIntoView({behavior:'smooth',block:'center'});return}
  if(v==='settings'&&sub&&typeof stTab!=='undefined')stTab=sub;
  setView(v);
});
(()=>{const sv=setView;setView=function(v,k){
  if(v==='friends'&&!OB.friends){OB.friends=1;obSave()}
  if(v==='vigie'&&!OB.vigie){OB.vigie=1;obSave()}
  const r=sv.call(this,v,k);
  if(v==='settings'&&typeof stTab!=='undefined'&&stTab==='audio'&&!OB.audio){OB.audio=1;obSave()}
  if(v==='play')renderOnboard();return r}})();
(()=>{const sm=simulateMatch;simulateMatch=function(){
  const c=cur;const r=sm.apply(this,arguments);
  try{const res=c&&c.res,h=ME.history[0];if(res&&h&&!h.sb){h.sb=mdPack(res.A,res.B,res.mvp);h.rs=mdRounds(Math.max(res.sA,res.sB),Math.min(res.sA,res.sB),res.wonA);h.id=c.id}}catch(e){}
  if(!OB.match){OB.match=1;obSave()}
  return r}})();
document.addEventListener('click',e=>{if(e.target.closest('[data-sttab="audio"]')&&!OB.audio){OB.audio=1;obSave()}},true);
renderOnboard();

Object.assign(I18N.fr,{pl_btn:'Lien d\'invitation',pl_qcopy_t:'Copier le lien d\'invitation en 1 clic',pl_title:'Inviter avec un lien',pl_sub:'Envoie ce lien à tes amis : en l\'ouvrant, ils rejoignent directement ton groupe.',pl_copy:'Copier',pl_copied:'Lien copié',pl_exp:'Expire dans {x}',pl_new:'Nouveau lien',pl_joined:'Arrivés par le lien',pl_none:'Personne pour l\'instant.',pl_off:'Firebase injoignable : en démo, un ami simulé rejoindra dans quelques secondes.',pl_full:'Le groupe est complet.',
  pl_join_ok:'Tu as rejoint le groupe de {n}',pl_join_bad:'Ce lien d\'invitation a expiré ou n\'existe pas.',pl_join_full:'Le groupe de {n} est complet.',pl_in:'{n} a rejoint ton groupe par le lien',
  cmp_btn:'Comparer',cmp_title:'Comparaison',cmp_elo:'Courbe d\'ELO (20 derniers matchs)',cmp_maps:'Win rate par map',cmp_better:'{n} devant sur {k}/{t} stats',cmp_none:'Pas de map en commun sur les derniers matchs.',
  lv_title:'Matchs en direct',lv_sub:'Regarde les meilleurs matchs du moment en spectateur (GOTV, 90 s de délai).',lv_watch:'Regarder',lv_round:'Round {n}',lv_friend:'{n} joue',lv_feed:'Fil des kills',lv_gotv:'Regarder dans CS:GO',lv_gotv_go:'Ouverture de CS:GO en spectateur… (commande aussi copiée : colle-la dans la console si rien ne se passe)',lv_gotv_t:'Ouvre CS:GO en spectateur sur le serveur (GOTV). Le direct a 90 s de délai pour éviter la triche.',lv_end:'Match terminé',lv_next:'Nouveau match dans quelques secondes',lv_viewers:'{n} spectateurs',lv_avg:'{n} ELO moy.',lv_none:'Aucun match en direct pour le moment.',lv_none_off:'Connecte-toi pour voir les matchs en direct.'});
Object.assign(I18N.en,{pl_btn:'Invite link',pl_qcopy_t:'One-click copy invite link',pl_title:'Invite with a link',pl_sub:'Send this link to your friends: opening it puts them straight into your party.',pl_copy:'Copy',pl_copied:'Link copied',pl_exp:'Expires in {x}',pl_new:'New link',pl_joined:'Joined via link',pl_none:'Nobody yet.',pl_off:'Firebase unreachable: in demo, a simulated friend will join in a few seconds.',pl_full:'The party is full.',
  pl_join_ok:'You joined {n}\'s party',pl_join_bad:'This invite link expired or does not exist.',pl_join_full:'{n}\'s party is full.',pl_in:'{n} joined your party via the link',
  cmp_btn:'Compare',cmp_title:'Comparison',cmp_elo:'ELO curve (last 20 matches)',cmp_maps:'Win rate by map',cmp_better:'{n} ahead on {k}/{t} stats',cmp_none:'No common map in recent matches.',
  lv_title:'Live matches',lv_sub:'Watch the best matches right now as a spectator (GOTV, 90 s delay).',lv_watch:'Watch',lv_round:'Round {n}',lv_friend:'{n} is playing',lv_feed:'Kill feed',lv_gotv:'Watch in CS:GO',lv_gotv_go:'Opening CS:GO as a spectator… (command also copied: paste it in the console if nothing happens)',lv_gotv_t:'Opens CS:GO as a spectator on the server (GOTV). The stream has a 90 s delay to prevent cheating.',lv_end:'Match over',lv_next:'New match in a few seconds',lv_viewers:'{n} viewers',lv_avg:'{n} avg ELO',lv_none:'No live matches right now.',lv_none_off:'Log in to see live matches.'});
Object.assign(I18N.ru,{pl_btn:'Ссылка-приглашение',pl_qcopy_t:'Скопировать ссылку в 1 клик',pl_title:'Пригласить по ссылке',pl_sub:'Отправь ссылку друзьям: открыв её, они сразу попадут в твою группу.',pl_copy:'Копировать',pl_copied:'Ссылка скопирована',pl_exp:'Истекает через {x}',pl_new:'Новая ссылка',pl_joined:'Пришли по ссылке',pl_none:'Пока никого.',pl_off:'Firebase недоступен: в демо симулированный друг присоединится через несколько секунд.',pl_full:'Группа заполнена.',
  pl_join_ok:'Ты в группе {n}',pl_join_bad:'Ссылка устарела или не существует.',pl_join_full:'Группа {n} заполнена.',pl_in:'{n} присоединился по ссылке',
  cmp_btn:'Сравнить',cmp_title:'Сравнение',cmp_elo:'ELO (последние 20 матчей)',cmp_maps:'Винрейт по картам',cmp_better:'{n} впереди по {k}/{t} показателям',cmp_none:'Нет общих карт в последних матчах.',
  lv_title:'Матчи в прямом эфире',lv_sub:'Смотри лучшие матчи как зритель (GOTV, задержка 90 с).',lv_watch:'Смотреть',lv_round:'Раунд {n}',lv_friend:'{n} играет',lv_feed:'Лента убийств',lv_gotv:'Смотреть в CS:GO',lv_gotv_go:'Открываем CS:GO в режиме зрителя… (команда скопирована: вставь её в консоль, если ничего не произошло)',lv_gotv_t:'Открывает CS:GO в режиме зрителя (GOTV). Задержка 90 с против читов.',lv_end:'Матч окончен',lv_next:'Новый матч через несколько секунд',lv_viewers:'{n} зрителей',lv_avg:'Ср. ELO {n}',lv_none:'Сейчас нет матчей в эфире.',lv_none_off:'Войди, чтобы смотреть матчи в эфире.'});

const PL={code:null,exp:0,joined:[],poll:null,off:false,sim:null};
const plCode=()=>Array.from({length:6},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('');
const plLink=()=>`${location.href.split(/[?#]/)[0]}?party=${PL.code}&n=${encodeURIComponent(ME.name)}&e=${ME.elo}`;
async function plCreate(){
  clearInterval(PL.poll);clearTimeout(PL.sim);
  PL.code=plCode();PL.exp=Date.now()+30*60e3;PL.joined=[];PL.seen=new Set();PL.kicked=new Set();
  window.CURRENT_PARTY_CODE=PL.code;
  const ok=await fbReq(`parties/${PL.code}`,'PUT',{
    leader:{key:fbUserKey(),name:ME.name,elo:ME.elo,eloWm:ME.eloWm||1000,color:ME.color,cardStyle:typeof validCardId==='function'?validCardId(ME.cardStyle):'default',country:ME.country||'FR',steam:ME.steam||null},
    mode:state.mode,size:maxParty(),createdAt:Date.now(),expires:PL.exp
  });
  PL.off=!ok;
  PL.poll=setInterval(plPoll,1200);
  renderPL();
}
async function plPoll(){
  if(!PL.code||Date.now()>PL.exp){clearInterval(PL.poll);return}
  const m=await fbReq(`parties/${PL.code}/members`);if(!m)return;
  PL.kicked=PL.kicked||new Set();
  let lookChanged=false;
  Object.entries(m).forEach(([k,v])=>{
    if(PL.kicked.has(k)||(v&&v.name&&PL.kicked.has(v.name.toLowerCase())))return;
    if(!PL.seen.has(k)&&v&&v.name){PL.seen.add(k);plAdd(v);return}
    if(v&&v.name){
      const p=REG.get(v.name)||state.party.find(x=>x&&x.name&&x.name.toLowerCase()===v.name.toLowerCase());
      if(p&&v.cardStyle&&typeof validCardId==='function'){
        const vc=validCardId(v.cardStyle);
        if(vc!==(p.cardStyle||'default')){p.cardStyle=vc;lookChanged=true}
      }
    }
  });
  if(lookChanged)renderParty();
}
async function plAdd(v){
  if(!v||!/^[A-Za-z0-9_.-]{1,25}$/.test(String(v.name||'')))return;
  if(v.color&&!/^#[0-9a-fA-F]{3,8}$/.test(v.color))v.color=null;
  if(state.party.length>=maxParty()){toast(t('pl_full'));return}
  let p=REG.get(v.name);
  if(!p){p=makePlayer(v.name,+v.elo||1500,'high',0);p.elo=+v.elo||p.elo;p.color=v.color||p.color;REG.set(p.name,p)}
  if(v.cardStyle&&typeof validCardId==='function')p.cardStyle=validCardId(v.cardStyle);
  putAv(p,v.avatar);
  if(typeof applyLook==='function')applyLook(p).then(ch=>{if(ch)renderParty()});
  p.viaLink=true;
  if(v.steam)p.steam=v.steam;
  else if(typeof fbReq==='function'&&typeof fbMailbox==='function'){
    try{
      const dir=await fbReq(`playerDirectory/${fbMailbox(v.name)}`);
      if(dir&&dir.steam&&dir.steam.linked)p.steam=dir.steam;
    }catch(_){}
  }
  PL.joined.push(p.name);state.party.push(p);used.add(p.name);
  toast(t('pl_in',{n:p.name}));notify('party','pl_in',{n:p.name},'play');beep(700,.08);beep(940,.1,.1);
  renderParty();renderStats();renderPL();
}
let plTick=null;
function renderPL(){
  const b=$('#plBody');if(!b)return;
  if(!PL.code||Date.now()>PL.exp){b.innerHTML=`<p class="m-hint" style="margin:0">${t('pl_sub')}</p>`;return}
  const left=Math.max(0,PL.exp-Date.now()),mm=Math.floor(left/6e4),ss=String(Math.floor(left/1e3)%60).padStart(2,'0');
  const maxP=maxParty(),curP=state.party.length;

  const allFriends = [...FRIENDS].sort((a,b)=>{
    const sa=(a.status==='online'||a.status==='ingame')?2:(a.status==='away'?1:0);
    const sb=(b.status==='online'||b.status==='ingame')?2:(b.status==='away'?1:0);
    return sb-sa;
  });
  let friendsHtml = '';
  if(!allFriends.length){
    friendsHtml = `<div class="card m-hint" style="margin:4px 0 10px;text-align:center">${t('pl_no_online')}<br><button class="btn sm ghost" style="margin-top:8px" data-pl-friends>${t('pl_open_friends')}</button></div>`;
  } else {
    friendsHtml = `<div class="pl-friends-list">${allFriends.map(f => {
      const inParty = state.party.some(p => p.name === f.name);
      const isInvited = typeof FR_INVITES_CACHE !== 'undefined' && FR_INVITES_CACHE.has(f.name);
      const isOnline = f.status === 'online' || f.status === 'ingame';
      return `<div class="pl-friend-item">
        <div class="pl-friend-left">
          ${avHTML(f, 34)}
          <div style="min-width:0">
            <b>${escA(f.name)}</b>
            <span>${lvlHTML(f.elo)} ELO ${f.elo} · ${f.status === 'ingame' ? 'En match' : f.status === 'online' ? 'En ligne' : 'Hors ligne'}</span>
          </div>
        </div>
        <div>
          ${inParty
            ? `<span class="pill">${t('pl_btn_in')}</span>`
            : isInvited
              ? `<button class="btn sm ghost" disabled>${t('pl_btn_invited')}</button>`
              : `<button class="btn sm primary" data-pl-invite="${escA(f.name)}">${t('pl_btn_inv')}</button>`}
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  b.innerHTML=`
    <div style="font-size:13px;color:var(--muted);margin-bottom:12px">${t('pl_modal_sub', { m: modeObj().n, c: curP, max: maxP })}</div>
    
    <div class="pl-sec-title"><span>${t('pl_link_box_t')}</span></div>
    <p class="m-hint" style="margin:0 0 8px">${t('pl_link_box_h')}</p>
    <div class="pl-link"><input readonly value="${escA(plLink())}" id="plIn"><button class="btn primary" data-plcopy>${t('pl_copy')}</button></div>
    <div class="pl-meta"><span class="pl-code">${PL.code}</span><span id="plExp">${t('pl_exp',{x:`${mm}:${ss}`})}</span><button class="btn ghost sm" data-plnew>${t('pl_new')}</button></div>

    <div class="pl-sec-title"><span>${t('pl_friends_box_t')}</span><span style="font-size:12px;color:var(--dim)">${allFriends.filter(f=>f.status==='online'||f.status==='ingame').length} en ligne</span></div>
    ${friendsHtml}

    <div class="pl-sec-title"><span>${t('pl_quick_ph')}</span></div>
    <form class="pl-link" id="plQuickForm" style="margin-top:4px">
      <input id="plQuickIn" placeholder="Pseudo ou Code Ami (ex: TR-248102)...">
      <button class="btn ghost" type="submit">Inviter</button>
    </form>

    <div class="pl-j">
      <b>${t('pl_joined')} (${state.party.length}/${maxP})</b>
      ${state.party.map(p=>`<span class="pill">${escA(p.name)} ${p.name===ME.name?'(Toi)':''}</span>`).join('')}
    </div>`;
}
document.addEventListener('click',e=>{if(e.target.closest('[data-pl-friends]')){closeModal('plModal');setView('friends')}});
if(!$('#plModal')) document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="plModal"><div class="modal pl-modal"><div class="m-h"><h3 data-i18n="pl_title">${t('pl_title')}</h3><button class="x2" data-close>×</button></div><div id="plBody"></div></div></div>`);
$('.stage-head .right').insertAdjacentHTML('afterbegin',`<button class="btn ghost sm pl-btn" data-plquickcopy title="${escA(t('pl_qcopy_t'))}" aria-label="${escA(t('pl_qcopy_t'))}"><svg class="ic" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 512 512"><path d="M208 352h-64a96 96 0 010-192h64M304 160h64a96 96 0 010 192h-64M163.29 256h185.42"/></svg></button><button class="btn ghost sm pl-btn" data-plopen aria-label="${t('pl_btn')||'Inviter'}"><svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M288 256c52.79 0 99.43-49.71 104-110.82 2.27-30.7-7.36-59.33-27.12-80.6C345.33 43.57 318 32 288 32c-30.24 0-57.59 11.5-77 32.38-19.63 21.11-29.2 49.8-27 80.78C188.49 206.28 235.12 256 288 256zM495.38 439.76c-8.44-46.82-34.79-86.15-76.19-113.75C382.42 301.5 335.83 288 288 288s-94.42 13.5-131.19 38c-41.4 27.6-67.75 66.93-76.19 113.75-1.93 10.73.69 21.34 7.19 29.11A30.94 30.94 0 00112 480h352a30.94 30.94 0 0024.21-11.13c6.48-7.77 9.1-18.38 7.17-29.11zM104 288v-40h40a16 16 0 000-32h-40v-40a16 16 0 00-32 0v40H32a16 16 0 000 32h40v40a16 16 0 0032 0z"/></svg><span data-i18n="pl_btn">${t('pl_btn')||'Inviter'}</span></button>`);
document.addEventListener('click',async e=>{
  if(e.target.closest('[data-plquickcopy]')){
    if(!PL.code||Date.now()>PL.exp)await plCreate();
    try{await navigator.clipboard.writeText(plLink())}catch(_){}
    beep(880,.06);toast(t('pl_copied'));return;
  }
  if(e.target.closest('[data-plopen]')){
    if(typeof triggerFastInvitePoll==='function')triggerFastInvitePoll(20000);
    if(!PL.code||Date.now()>PL.exp)await plCreate();else{ if(typeof plPoll==='function')plPoll(); renderPL(); }
    openModal('plModal');
    clearInterval(plTick);plTick=setInterval(()=>{if(!$('#plModal').classList.contains('on'))return clearInterval(plTick);const x=$('#plExp');if(!x)return;const l=Math.max(0,PL.exp-Date.now());x.textContent=t('pl_exp',{x:`${Math.floor(l/6e4)}:${String(Math.floor(l/1e3)%60).padStart(2,'0')}`});if(!l)renderPL()},1000);return}
  if(e.target.closest('[data-plcopy]')){try{await navigator.clipboard.writeText(plLink())}catch(_){$('#plIn').select()}toast(t('pl_copied'));return}
  if(e.target.closest('[data-plnew]')){await plCreate();return}
  const pli=e.target.closest('[data-pl-invite]');
  if(pli){
    if(typeof sendPartyInvite==='function')sendPartyInvite(pli.dataset.plInvite);
    else invite(REG.get(pli.dataset.plInvite));
    return renderPL();
  }
});
document.addEventListener('submit',async e=>{
  if(e.target.id==='plQuickForm'){
    e.preventDefault();
    const inp=$('#plQuickIn');if(!inp)return;
    const v=inp.value.trim();if(!v)return;
    inp.value='';
    if(typeof sendPartyInvite==='function')sendPartyInvite(v);
    else toast(t('invited',{n:v}));
    renderPL();
  }
});
const PL_JOIN=(()=>{const q=new URLSearchParams(location.search);if(!q.has('party'))return null;
  const j={code:q.get('party'),n:q.get('n')||'',e:+q.get('e')||1500};
  try{const u=new URL(location.href);['party','n','e'].forEach(k=>u.searchParams.delete(k));history.replaceState(null,'',u.pathname+u.search)}catch(_){}
  return j})();
async function plJoin(j){
  const d=await fbReq(`parties/${j.code}`);
  let L=d&&d.leader;
  if(d&&(d.expires<Date.now()))return toast(t('pl_join_bad'));
  const myBox = typeof fbMailbox==='function'?fbMailbox(ME.name):ME.name.toLowerCase();
  if(d&&d.kicked&&(d.kicked[myBox]||d.kicked[ME.name.toLowerCase()]))return toast("Tu as été retiré de ce groupe.");
  if(d&&Object.keys(d.members||{}).length+1>=(d.size||5))return toast(t('pl_join_full',{n:L.name}));
  if(!L){if(!j.n)return toast(t('pl_join_bad'));L={name:j.n,elo:j.e}}
  if(L.name.toLowerCase()===ME.name.toLowerCase())return;
  window.CURRENT_PARTY_CODE=j.code;
  if(d)await fbReq(`parties/${j.code}/members/${myBox}`,'PUT',{
    name:ME.name,elo:ME.elo,eloWm:ME.eloWm||1000,color:ME.color,cardStyle:typeof validCardId==='function'?validCardId(ME.cardStyle):'default',steam:ME.steam||null,at:Date.now()
  });
  let p=REG.get(L.name);
  if(!p){p=makePlayer(L.name,+L.elo||1500,'high',0);p.elo=+L.elo||p.elo;if(L.color)p.color=L.color;REG.set(p.name,p)}
  if(L.cardStyle&&typeof validCardId==='function')p.cardStyle=validCardId(L.cardStyle);
  p.viaLink=true;
  if(typeof applyLook==='function')applyLook(p).then(ch=>{if(ch)renderParty()});
  if(L.steam)p.steam=L.steam;
  else if(typeof fbReq==='function'&&typeof fbMailbox==='function'){
    try{
      const dir=await fbReq(`playerDirectory/${fbMailbox(L.name)}`);
      if(dir&&dir.steam&&dir.steam.linked)p.steam=dir.steam;
    }catch(_){}
  }
  state.party=[p,ME];used.add(p.name);
  setView('play');renderParty();renderStats();toast(t('pl_join_ok',{n:p.name}));beep(700,.08);beep(940,.1,.1);
}
if(PL_JOIN){let n=0;const w=setInterval(()=>{if(AUTH.session&&ME&&ME.name){clearInterval(w);plJoin(PL_JOIN)}else if(++n>120)clearInterval(w)},500)}

async function partySyncPoll(){
  if(!window.CURRENT_PARTY_CODE || (typeof FBA !== 'undefined' && FBA && !FBA.idToken))return;
  const pCode=window.CURRENT_PARTY_CODE;
  try{
    const pData=await fbReq(`parties/${pCode}`);
    if(!pData||(pData.expires&&Date.now()>pData.expires)){
      if(state.party.length>1&&state.party[0].name.toLowerCase()!==ME.name.toLowerCase()){
        state.party=[ME];window.CURRENT_PARTY_CODE=null;
        renderParty();renderStats();toast(t('pt_disbanded'));
      }
      return;
    }

    const isLeader=!pData.leader||pData.leader.name.toLowerCase()===ME.name.toLowerCase();
    const myBox=typeof fbMailbox==='function'?fbMailbox(ME.name):ME.name.toLowerCase();

    if(!isLeader){
      if(pData.kicked&&(pData.kicked[myBox]||pData.kicked[ME.name.toLowerCase()])){
        state.party=[ME];
        window.CURRENT_PARTY_CODE=null;
        if(state.searching)stopQueue(false);
        renderParty();renderStats();
        toast("Tu as été retiré du groupe.");
        return;
      }

      const membersList=pData.members?Object.values(pData.members):[];
      const stillInMembers=membersList.some(m=>(m.name||'').toLowerCase()===ME.name.toLowerCase());
      if(!stillInMembers){
        state.party=[ME];
        window.CURRENT_PARTY_CODE=null;
        if(state.searching)stopQueue(false);
        renderParty();renderStats();
        toast("Tu as été retiré du groupe.");
        return;
      }

      const leaderObj=pData.leader;
      const expectedNames=[leaderObj.name,...membersList.map(m=>m.name)];

      const currentNames=state.party.map(p=>p.name);
      const isSame=expectedNames.length===currentNames.length&&expectedNames.every((n,i)=>n.toLowerCase()===currentNames[i].toLowerCase());
      if(!isSame){
        let newParty=[];
        let lP=REG.get(leaderObj.name);
        if(!lP){lP=makePlayer(leaderObj.name,+leaderObj.elo||1500,'high',0);lP.color=leaderObj.color||COLORS[0];REG.set(lP.name,lP)}
        lP.viaLink=true;
        if(leaderObj.eloWm!=null)lP.eloWm=leaderObj.eloWm;
        if(leaderObj.steam)lP.steam=leaderObj.steam;
        if(leaderObj.cardStyle&&typeof validCardId==='function')lP.cardStyle=validCardId(leaderObj.cardStyle);
        if(typeof applyLook==='function')applyLook(lP).then(ch=>{if(ch)renderParty()});
        newParty.push(lP);
        for(const m of membersList){
          if(m.name.toLowerCase()===ME.name.toLowerCase()){newParty.push(ME)}
          else{
            let mP=REG.get(m.name);
            if(!mP){mP=makePlayer(m.name,+m.elo||1500,'high',0);mP.color=m.color||COLORS[0];REG.set(mP.name,mP)}
            mP.viaLink=true;if(m.steam)mP.steam=m.steam;
            if(m.eloWm!=null)mP.eloWm=m.eloWm;
            if(m.cardStyle&&typeof validCardId==='function')mP.cardStyle=validCardId(m.cardStyle);
            newParty.push(mP);
            if(typeof applyLook==='function')applyLook(mP).then(ch=>{if(ch)renderParty()});
          }
        }
        state.party=newParty;renderParty();renderStats();
      }else{
        let cardChanged=false;
        const applyCs=(obj)=>{
          if(!obj||!obj.name||obj.name.toLowerCase()===ME.name.toLowerCase())return;
          const p=state.party.find(x=>x&&x.name&&x.name.toLowerCase()===obj.name.toLowerCase());
          if(p&&obj.cardStyle&&typeof validCardId==='function'){
            const vc=validCardId(obj.cardStyle);
            if(vc!==(p.cardStyle||'default')){p.cardStyle=vc;cardChanged=true}
          }
        };
        applyCs(leaderObj);
        membersList.forEach(applyCs);
        if(cardChanged)renderParty();
      }

      const q=pData.queue;
      if(q&&Date.now()-(q.at||0)<60000){
        if(q.status==='searching'&&!state.searching){
          if(q.mode)state.mode=q.mode;
          if(q.region)state.region=q.region;
          renderModes();renderRegions();
          startQueue(q.prio);
          toast(`Le chef d'équipe (${leaderObj.name}) a lancé la recherche !`);
        }else if(q.status==='idle'&&state.searching){
          stopQueue(false);
          toast(`Le chef d'équipe a annulé la recherche.`);
        }else if(q.status==='found'){
          if(state.searching)stopQueue(false);
          if(!$('#found').classList.contains('on')&&(!$('#lobby')||$('#lobby').hidden)){
            matchFound();
          }
        }else if(q.status==='lobby'){
          if($('#found').classList.contains('on'))$('#found').classList.remove('on');
          if($('#lobby').hidden)showLobby();
        }
      }
    }else{
      const fbMemberBoxes=pData.members?Object.keys(pData.members):[];
      const currentTeammates=state.party.slice(1);
      let partyChanged=false;
      for(const tm of currentTeammates){
        const tmBox=typeof fbMailbox==='function'?fbMailbox(tm.name):tm.name.toLowerCase();
        if(!fbMemberBoxes.includes(tmBox)&&(!PL.kicked||(!PL.kicked.has(tmBox)&&!PL.kicked.has(tm.name.toLowerCase())))){
          state.party=state.party.filter(p=>p.name.toLowerCase()!==tm.name.toLowerCase());
          used.delete(tm.name);
          if(PL.seen){PL.seen.delete(tmBox);PL.seen.delete(tm.name);}
          toast(t('left_party',{n:tm.name}));
          partyChanged=true;
        }
      }
      if(partyChanged){
        renderParty();renderStats();
        if($('#plModal')&&$('#plModal').classList.contains('on')&&typeof renderPL==='function'){
          renderPL();
        }
      }

      if(pData.members){
        let memberLookCh=false;
        for(const m of Object.values(pData.members)){
          if(!m||!m.name)continue;
          let p=state.party.find(x=>x&&x.name&&x.name.toLowerCase()===m.name.toLowerCase());
          if(p&&m.cardStyle&&typeof validCardId==='function'){
            const vc=validCardId(m.cardStyle);
            if(vc!==(p.cardStyle||'default')){p.cardStyle=vc;memberLookCh=true}
          }
          if(p&&(!p.steam||!p.steam.linked)){
            const dir=await fbReq(`playerDirectory/${fbMailbox(m.name)}`);
            if(dir&&dir.steam&&dir.steam.linked){
              p.steam=dir.steam;memberLookCh=true;
            }
          }
        }
        if(memberLookCh)renderParty();
      }
    }
  }catch(e){}
}
setInterval(partySyncPoll,1000);
const PS={ready:false,last:null,key:()=>'tr_party_'+((typeof FBA!=='undefined'&&FBA.uid)||'')};
setInterval(()=>{
  if(!PS.ready)return;
  const c=window.CURRENT_PARTY_CODE||null;if(c===PS.last)return;PS.last=c;
  try{c?localStorage.setItem(PS.key(),JSON.stringify({code:c,at:Date.now()})):localStorage.removeItem(PS.key())}catch(e){}
},1000);
async function partyRestore(){
  const done=()=>{PS.last=window.CURRENT_PARTY_CODE||null;PS.ready=true};
  let s=null;try{s=JSON.parse(localStorage.getItem(PS.key())||'null')}catch(e){}
  if(!s||!s.code||window.CURRENT_PARTY_CODE)return done();
  const d=await fbReq(`parties/${s.code}`);
  if(!d||(d.expires&&d.expires<Date.now())){try{localStorage.removeItem(PS.key())}catch(e){}return done()}
  const myBox=fbMailbox(ME.name);
  if(d.leader&&d.leader.key===FBA.uid){
    PL.code=s.code;PL.exp=d.expires||Date.now()+30*60e3;PL.joined=[];PL.seen=new Set();PL.kicked=new Set(Object.keys(d.kicked||{}));
    window.CURRENT_PARTY_CODE=s.code;clearInterval(PL.poll);PL.poll=setInterval(plPoll,1200);await plPoll();
  }else if(d.members&&d.members[myBox]&&!(d.kicked&&d.kicked[myBox])){
    window.CURRENT_PARTY_CODE=s.code;await partySyncPoll();
  }else{try{localStorage.removeItem(PS.key())}catch(e){}}
  done();
}
(()=>{let n=0;const w=setInterval(()=>{
  if(typeof FBA!=='undefined'&&FBA.uid&&FBA.idToken&&AUTH.session&&ME&&ME.name&&typeof fbLive==='function'&&fbLive()){clearInterval(w);
    if(!state.searching&&typeof fbCall==='function')fbCall('queueLeave');
    partyRestore()}
  else if(++n>120){clearInterval(w);PS.ready=true}
},500)})();

function pStats(P){
  ensureDetails(P);const h=P.history.slice(0,20),n=h.length||1,sum=f=>h.reduce((s,x)=>s+f(x),0),K=sum(x=>x.k),D=sum(x=>x.d);
  return {elo:P.elo,lvl:lvl(P.elo),wr:Math.round(sum(x=>x.won?1:0)/n*100),kd:+(D?K/D:K).toFixed(2),hs:Math.round(sum(x=>x.hs)/n),adr:Math.round(sum(x=>x.adr)/n),rating:+(sum(x=>x.rating)/n).toFixed(2),trust:+trust(P).toFixed(1),matches:P.matches,h};
}
function cmpCurve(a,b){
  const pa=[...a.h].reverse().map(x=>x.elo),pb=[...b.h].reverse().map(x=>x.elo),all=[...pa,...pb],mn=Math.min(...all)-20,mx=Math.max(...all)+20,W=640,H=170,P=24;
  const path=arr=>arr.map((v,i)=>`${i?'L':'M'}${(P+i*(W-2*P)/Math.max(1,arr.length-1)).toFixed(1)},${(H-P-(v-mn)/(mx-mn)*(H-2*P)).toFixed(1)}`).join('');
  const grid=[0,.5,1].map(f=>{const v=Math.round(mn+(mx-mn)*f),y=H-P-(v-mn)/(mx-mn)*(H-2*P);return `<line x1="${P}" x2="${W-P}" y1="${y}" y2="${y}" stroke="#25252a"/><text x="${W-P+4}" y="${y+4}" fill="#868690" font-size="11">${v}</text>`}).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="cmp-svg">${grid}<path d="${path(pa)}" fill="none" stroke="var(--acc)" stroke-width="2.4"/><path d="${path(pb)}" fill="none" stroke="#4fa3ff" stroke-width="2.4"/></svg>`;
}
function openCompare(name){
  const B=REG.get(name);if(!B)return;const A=ME,a=pStats(A),b=pStats(B);
  const rows=[['ELO','elo',0],[t('t_winrate'),'wr','%'],['K/D','kd',0],['HS %','hs','%'],['ADR','adr',0],[t('rating'),'rating',0],[t('trust'),'trust',0],[t('t_matches'),'matches',0]];
  let wa=0,wb=0;
  const html=rows.map(([l,k,u])=>{const x=a[k],y=b[k],tot=(+x)+(+y)||1,pa=x/tot*100;if(x>y)wa++;else if(y>x)wb++;
    return `<div class="cmp-r"><b class="${x>y?'win':''}">${x}${u||''}</b><div class="cmp-mid"><span>${l}</span><div class="cmp-bar"><i class="a" style="width:${pa}%"></i><i class="b" style="width:${100-pa}%"></i></div></div><b class="${y>x?'win':''}">${y}${u||''}</b></div>`}).join('');
  const mm=(h)=>{const m={};h.forEach(x=>{const o=m[x.map]||(m[x.map]={n:0,w:0});o.n++;o.w+=x.won?1:0});return m};
  const ma=mm(a.h),mb=mm(b.h),common=Object.keys(ma).filter(k=>mb[k]);
  const maps=common.length?common.map(k=>{const x=Math.round(ma[k].w/ma[k].n*100),y=Math.round(mb[k].w/mb[k].n*100);return `<div class="cmp-m"><span>${escA(k)}</span><b class="${x>y?'win':''}">${x}%</b><b class="${y>x?'win':''}">${y}%</b></div>`}).join(''):`<p class="m-hint">${t('cmp_none')}</p>`;
  const lead=wa>=wb?A.name:B.name;
  $('#cmpBody').innerHTML=`<div class="cmp-head"><div class="cmp-p a">${avHTML(A)}<div><b>${escA(A.name)}</b><small>${lvlHTML(A.elo)} ${A.elo} ELO</small></div></div>
      <div class="cmp-vs">VS<small>${t('cmp_better',{n:escA(lead),k:Math.max(wa,wb),t:rows.length})}</small></div>
      <div class="cmp-p b">${avHTML(B)}<div><b>${escA(B.name)}</b><small>${lvlHTML(B.elo)} ${B.elo} ELO</small></div></div></div>
    <div class="cmp-rows">${html}</div>
    <div class="cmp-two"><div><h4>${t('cmp_elo')}</h4>${cmpCurve(a,b)}<div class="cmp-leg"><span class="a">${escA(A.name)}</span><span class="b">${escA(B.name)}</span></div></div>
      <div><h4>${t('cmp_maps')}</h4><div class="cmp-m hd"><span></span><b>${escA(A.name)}</b><b>${escA(B.name)}</b></div>${maps}</div></div>`;
  openModal('cmpModal');
}
document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="cmpModal"><div class="modal cmp-modal"><div class="m-h"><h3 data-i18n="cmp_title">${t('cmp_title')}</h3><button class="x2" data-close>×</button></div><div id="cmpBody"></div></div></div>`);
document.addEventListener('click',e=>{const c=e.target.closest('[data-compare]');if(c){e.stopPropagation();openCompare(c.dataset.compare)}});
(()=>{const o=profileActions;profileActions=function(P){return o(P).replace('<div class="p-actions">',`<div class="p-actions"><button class="btn sm" data-compare="${escA(P.name)}"><svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" style="width:14px;height:14px"><path d="M218.31 340.69A16 16 0 00191 352v32h-20a28 28 0 01-28-28V152a64 64 0 10-64-1.16V356a92.1 92.1 0 0092 92h20v32a16 16 0 0027.31 11.31l64-64a16 16 0 000-22.62zM112 64a32 32 0 11-32 32 32 32 0 0132-32zM432 360.61V156a92.1 92.1 0 00-92-92h-20V32a16 16 0 00-27.31-11.31l-64 64a16 16 0 000 22.62l64 64A16 16 0 00320 160v-32h20a28 28 0 0128 28v204.61a64 64 0 1064 0zM400 448a32 32 0 1132-32 32 32 0 01-32 32z"/></svg>${t('cmp_btn')}</button>`)}})();

const LIVE=[];let lvTimer=null,lvOpen=null,lvLoaded=false;
const LV_POLL=10e3;
const lvColor=n=>`hsl(${[...String(n)].reduce((h,c)=>(h*31+c.charCodeAt(0))%360,7)},45%,42%)`;
function lvFrom(id,x){
  const map=MAPS.find(m=>'de_'+m.slug===x.map||m.slug===x.map)||{n:String(x.map||'').replace('de_',''),slug:String(x.map||'').replace('de_',''),c:'#2a2c31'};
  const ps=Object.entries(x.players||{}).map(([uid,p])=>({uid,name:p.name||'Joueur',elo:p.elo||1000,color:lvColor(p.name),k:p.k||0,a:p.a||0,d:p.d||0,dmg:p.dmg||0,hs:p.hs||0,team:p.team,friend:FRIENDS.some(f=>f.name===p.name)}));
  return {id,map,tA:x.tA||'Team A',tB:x.tB||'Team B',sA:x.sA||0,sB:x.sB||0,rs:x.rounds||'',viewers:x.viewers||0,gotv:x.gotv||null,
    A:ps.filter(p=>p.team==='A'),B:ps.filter(p=>p.team==='B'),feed:Array.isArray(x.feed)?x.feed:Object.values(x.feed||{}),end:0};
}
async function lvFetch(){
  if(!(typeof fbLive==='function'&&fbLive()&&AUTH.session)){LIVE.length=0;lvLoaded=true;return}
  const all=await fbReq('liveMatches');lvLoaded=true;
  if(all===null&&LIVE.length)return;
  const avg=m=>[...m.A,...m.B].reduce((s,p)=>s+p.elo,0)/Math.max(1,m.A.length+m.B.length);
  LIVE.splice(0,LIVE.length,...Object.entries(all||{}).map(([id,x])=>lvFrom(id,x)).sort((a,b)=>avg(b)-avg(a)).slice(0,6));
}
async function lvStep(){if(document.hidden&&!lvOpen)return;await lvFetch();renderLive();if(lvOpen)renderSpec()}
function renderLive(){
  let el=$('#live');if(!el){const miss=$('#missions');miss.insertAdjacentHTML('afterend','<section id="live"></section>');el=$('#live')}
  const avgE=arr=>arr.length?Math.round(arr.reduce((s,p)=>s+p.elo,0)/arr.length):0;
  const head=`<div class="lv-h"><div><b><i class="lv-dot"></i>${t('lv_title')}</b><small>${t('lv_sub')}</small></div></div>`;
  if(!LIVE.length){el.innerHTML=`${head}<div class="card lv-empty">${lvLoaded?t(AUTH.session?'lv_none':'lv_none_off'):'<span class="spin inl"></span>'}</div>`;return}
  el.innerHTML=`${head}
  <div class="lv-grid">${LIVE.map(m=>{const fr=[...m.A,...m.B].find(p=>p.friend);
    return `<button class="lv-card" data-live="${escA(m.id)}"><div class="lv-bg" style="background:${mapBg(m.map)}"></div>
      <div class="lv-top"><span class="lv-tag">LIVE</span><span>${escA(m.map.n)}</span><span class="lv-v">${t('lv_viewers',{n:m.viewers})}</span></div>
      <div class="lv-sc"><div><b>${escA(m.tA)}</b><small>${t('lv_avg',{n:avgE(m.A)})}</small></div><div class="lv-num"><span class="${m.sA>m.sB?'w':''}">${m.sA}</span>:<span class="${m.sB>m.sA?'w':''}">${m.sB}</span></div><div class="r"><b>${escA(m.tB)}</b><small>${t('lv_avg',{n:avgE(m.B)})}</small></div></div>
      <div class="lv-foot"><span>${t('lv_round',{n:m.sA+m.sB+1})}</span>${fr?`<span class="lv-fr">${t('lv_friend',{n:escA(fr.name)})}</span>`:''}${m.gotv?`<span class="lv-go lv-gotv" data-gotv="${escA(m.gotv)}" title="${escA(t('lv_gotv_t'))}">▶ ${t('lv_gotv')}</span>`:`<span class="lv-go">${t('lv_watch')}</span>`}</div></button>`}).join('')}</div>`;
}
function renderSpec(){
  const m=LIVE.find(x=>x.id===lvOpen);if(!m){closeModal('specModal');lvOpen=null;return}
  const R=m.sA+m.sB,rows=team=>[...team].sort((a,b)=>b.k-a.k||a.d-b.d).map(s=>`<tr class="${s.friend?'me':''}"><td style="text-align:left"><div class="pl"><span data-profile="${escA(s.name)}">${avHTML(s)}</span><span data-profile="${escA(s.name)}">${escA(s.name)}</span>${lvlHTML(s.elo)}</div></td><td>${s.k}</td><td>${s.a}</td><td>${s.d}</td><td>${R?Math.round(s.dmg/R):0}</td><td>${s.k?Math.round(s.hs/s.k*100):0}%</td></tr>`).join('');
  const tbl=(team,name,sc,cls)=>`<div class="md-team ${cls}"><div class="md-th"><b>${escA(name)}</b><span>${sc}</span></div><div class="tbl-wrap"><table class="tbl md-tbl"><thead><tr><th style="text-align:left">${t('th_player')}</th><th>K</th><th>A</th><th>D</th><th>ADR</th><th>HS %</th></tr></thead><tbody>${rows(team)}</tbody></table></div></div>`;
  const dots=[...m.rs].map((r,k)=>`${k===15?'<i class="md-half"></i>':''}<span class="md-r ${r==='A'?'w':'l'}">${k+1}</span>`).join('');
  $('#specBody').innerHTML=`<div class="md-head"><div class="md-bg" style="background:${mapBg(m.map)};background-size:cover;background-position:center"></div>
      <div><div class="md-tag"><span class="lv-tag">LIVE</span> ${escA(m.map.n)} · ${t('lv_viewers',{n:m.viewers})}</div><div class="md-res" style="font-size:22px">${escA(m.tA)} <span style="opacity:.5">vs</span> ${escA(m.tB)}</div></div>
      <div class="md-score"><span class="${m.sA>=m.sB?'w':''}">${m.sA}</span><i>:</i><span class="${m.sB>=m.sA?'w':''}">${m.sB}</span></div></div>
    <div class="md-sec"><div class="md-st"><b>${t('lv_round',{n:R+1})}</b></div><div class="md-rounds">${dots}</div></div>
    <div class="spec-grid"><div>${tbl(m.A,m.tA,m.sA,'us')}${tbl(m.B,m.tB,m.sB,'them')}</div>
      <div><div class="st-card spec-feed"><h3>${t('lv_feed')}</h3>${m.feed.map(f=>`<div class="kf"><span class="${f.ka?'ka':'kb'}">${escA(f.k)}</span><em>${escA(f.w)}${f.hs?' <b>HS</b>':''}</em><span class="${f.ka?'kb':'ka'}">${escA(f.v)}</span></div>`).join('')||'<p class="m-hint">…</p>'}</div>
      ${m.gotv?`<div class="st-card"><h3>${t('lv_gotv')}</h3><p class="m-hint" style="margin:0 0 10px">${t('lv_gotv_t')}</p><div class="vg-cmd"><code>connect ${escA(m.gotv)}</code></div><button class="btn primary" style="width:100%;margin-top:8px" data-gotv="${escA(m.gotv)}">${t('lv_gotv')}</button></div>`:''}</div></div>`;
}
document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="specModal"><div class="modal md-modal spec-modal"><div class="m-h"><h3 data-i18n="lv_title">${t('lv_title')}</h3><button class="x2" data-close>×</button></div><div id="specBody"></div></div></div>`);
document.addEventListener('click',async e=>{
  const g=e.target.closest('[data-gotv]');if(g){e.preventDefault();e.stopPropagation();
    try{await navigator.clipboard.writeText('connect '+g.dataset.gotv)}catch(_){}
    steamOpen(`steam://connect/${g.dataset.gotv}`);toast(t('lv_gotv_go'));beep(990,.06);return}
  const c=e.target.closest('[data-live]');if(c){lvOpen=c.dataset.live;renderSpec();openModal('specModal');return}
  if(e.target.closest('#specModal [data-close]')||e.target.id==='specModal')lvOpen=null;
});
document.addEventListener('click',e=>{if(e.target.closest('#specModal [data-profile]')){closeModal('specModal');lvOpen=null}},true);
(()=>{const sv=setView;setView=function(v,k){const r=sv.call(this,v,k);if(v==='play'){lvStep();clearInterval(lvTimer);lvTimer=setInterval(lvStep,LV_POLL)}else if(!lvOpen){clearInterval(lvTimer);lvTimer=null}return r}})();
renderLive();setTimeout(lvStep,0);clearInterval(lvTimer);lvTimer=setInterval(lvStep,LV_POLL);

var FB_PROJECT='tickratecsgo';
const FB_FN=()=>`https://europe-west1-${FB_PROJECT}.cloudfunctions.net`;
const fbLive=()=>!!FB_API_KEY;
Object.assign(I18N.fr,{e_auth_disabled:'La connexion par e-mail est désactivée sur le serveur pour le moment. Utilise Google en attendant.',au_migrate:'Les comptes sont maintenant enregistrés en ligne : reconnecte-toi une fois avec ton e-mail et ton mot de passe pour transférer ton compte.',au_fb:'Comptes TICKRATE (Firebase)',e_use_email:'Connecte-toi avec ton adresse e-mail.',e_steam_cancel:'Connexion Steam annulée.',e_rename_cooldown:'Tu as déjà changé de pseudo ces 30 derniers jours.',e_unlink_firebase:'Pour délier Steam, contacte le support.'});
Object.assign(I18N.en,{e_auth_disabled:'Email sign-in is disabled on the server for now. Use Google meanwhile.',au_migrate:'Accounts are now stored online: log in once with your email and password to transfer your account.',au_fb:'TICKRATE accounts (Firebase)',e_use_email:'Log in with your email address.',e_steam_cancel:'Steam sign-in cancelled.',e_rename_cooldown:'You already changed your username in the last 30 days.',e_unlink_firebase:'To unlink Steam, contact support.'});
Object.assign(I18N.ru,{e_auth_disabled:'Вход по e-mail сейчас отключён на сервере. Пока используй Google.',au_migrate:'Аккаунты теперь хранятся онлайн: войди один раз по e-mail и паролю, чтобы перенести аккаунт.',au_fb:'Аккаунты TICKRATE (Firebase)',e_use_email:'Войди по адресу e-mail.',e_steam_cancel:'Вход через Steam отменён.',e_rename_cooldown:'Ник уже меняли за последние 30 дней.',e_unlink_firebase:'Чтобы отвязать Steam, напиши в поддержку.'});

const FB_ERR={bad_credentials:'bad_credentials',rate_limited:'rate_limited',
  PASSWORD_LOGIN_DISABLED:'auth_disabled',OPERATION_NOT_ALLOWED:'auth_disabled',EMAIL_EXISTS:'email_taken',INVALID_LOGIN_CREDENTIALS:'bad_credentials',INVALID_PASSWORD:'bad_credentials',EMAIL_NOT_FOUND:'bad_credentials',USER_DISABLED:'bad_credentials',TOO_MANY_ATTEMPTS_TRY_LATER:'too_many_attempts',INVALID_EMAIL:'bad_email',MISSING_PASSWORD:'missing_fields',username_taken:'username_taken',rename_cooldown:'rename_cooldown'};
const fbErr=m=>{m=String(m||'');const k=Object.keys(FB_ERR).find(x=>m.startsWith(x));return k?FB_ERR[k]:m.startsWith('WEAK_PASSWORD')?'pw_short':'server_error'};
const fbUidOf=tok=>{try{const b=tok.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(decodeURIComponent(escape(atob(b+'==='.slice((b.length+3)%4))))).user_id||null}catch(e){return null}};
function fbSetTokens(j){
  FBA.idToken=j.idToken||j.id_token;FBA.refresh=j.refreshToken||j.refresh_token;FBA.uid=j.localId||j.user_id||fbUidOf(FBA.idToken)||FBA.uid;FBA.exp=Date.now()+(+(j.expiresIn||j.expires_in)||3600)*1e3;
  try{localStorage.setItem('tr_fba',JSON.stringify({uid:FBA.uid,refresh:FBA.refresh}))}catch(e){}
}
async function fbIdt(op,body){
  try{const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${op}?key=${FB_API_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();return r.ok?j:{error:fbErr(j.error&&j.error.message)}}catch(e){return {error:'network'}}
}
async function fbCall(name,data={}){
  await fbAuthEnsure();
  try{const r=await fetch(`${FB_FN()}/${name}`,{method:'POST',headers:{'Content-Type':'application/json',...(FBA.idToken?{Authorization:'Bearer '+FBA.idToken}:{})},body:JSON.stringify({data})});
    const j=await r.json().catch(()=>({}));
    if(j.error)return {error:fbErr(j.error.message)||j.error.message};return j.result||{}}catch(e){return {error:'network'}}
}
(()=>{const o=fbAuthEnsure;fbAuthEnsure=async function(){if(fbLive()&&!FBA.refresh&&!FBA.idToken)return null;return o()}})();

async function fbBuildSession(){
  if(!FBA.uid)return null;
  let prof=await fbReq(`profiles/${FBA.uid}`);
  if(!prof){
    const pending=FBA.pendingName||localStorage.getItem('tr_pending_name')||sessionStorage.getItem('tr_pending_name')||'';
    try{const r=await fbCall('profileInit',{name:pending,country:ME.country||'FR'});prof=r&&r.profile}catch(e){}
    if(!prof)return null;
  }
  try{localStorage.removeItem('tr_pending_name');sessionStorage.removeItem('tr_pending_name')}catch(_){}
  if(!prof)return null;
  const info=await fbIdt('lookup',{idToken:FBA.idToken}),u=info&&info.users&&info.users[0]||{};
  const hasPw=(u.providerUserInfo||[]).some(p=>p.providerId==='password');
  if(hasPw && u.emailVerified === false && !prof.dev){
    if(typeof showVerifyScreen==='function'){
      showVerifyScreen(u.email||'', FBA.idToken, FBA.refresh);
    }
    return null;
  }
  ME.uid=FBA.uid;
  ME.plan=prof.plan||'free';
  ME.influencer=prof.influencer||null;
  ME.beta=!!prof.beta;
  if(prof.dev)ME.dev=true;
  if(typeof prof.elo==='number')ME.elo=prof.elo;
  if(typeof prof.eloWm==='number')ME.eloWm=prof.eloWm;
  ME.steamAvatar=prof.avatar||null;
  if(ME.avatar&&!/^data:image\//.test(ME.avatar))ME.avatar=null;
  for(const k of ['matchesWm','winsWm','peakEloWm','eloDuel','matchesDuel','winsDuel','peakEloDuel'])if(typeof prof[k]==='number')ME[k]=prof[k];
  const myBox=typeof fbMailbox==='function'?fbMailbox(prof.name):prof.name.toLowerCase();
  let hist=await fbReq(`history/${FBA.uid}`);
  if(!hist&&myBox)hist=await fbReq(`history/${myBox}`);
  if(hist&&typeof hist==='object'){
    const MN=n=>(MAPS.find(m=>'de_'+m.slug===n||m.slug===String(n).replace('de_',''))||{n:String(n).replace('de_','')}).n;
    const h=Object.entries(hist).map(([id,x])=>({
      id,
      date:new Date(x.at||Date.now()),
      map:MN(x.map),
      won:!!x.won,
      score:x.score||'16-0',
      k:x.k||0,
      d:x.d||0,
      a:x.a||0,
      hs:x.hs||0,
      adr:x.adr||0,
      kast:x.kast||0,
      rating:x.rating||1.0,
      delta:x.delta||0,
      elo:x.elo||prof.elo||1000,
      mode:x.mode||'ranked',
      sb:x.sb||null
    })).sort((a,b)=>b.date-a.date);
    ME.history=h;
  }else{
    ME.history=[];
  }
  ME.career=0;
  return {account:{id:FBA.uid,username:prof.name,nameChangedAt:prof.renamedAt||0,email:u.email||null,steam_id:prof.steamId||null,has_password:hasPw,created_at:prof.createdAt},player:{plan:prof.plan||'free'},profile:prof};
}
async function fbEnter(msg){
  const s=await fbBuildSession();if(!s)return {error:'server_error'};
  AUTH.mode='firebase';AUTH.session=s;enterApp(s,msg);if(typeof amDev==='function')amDev();refreshMe();return {ok:true,session:s};
}
(()=>{
  const oReg=doRegister,oLog=doLogin,oOut=doLogout,oSteam=doSteam,oPw=doPassword,oUnl=doUnlinkSteam;
  doRegister=async function(f){
    if(!fbLive())return oReg(f);
    if(!f.accept)return {error:'must_accept'};
    const chosenName = String(f.username||'').trim();
    if(!RE_USER.test(chosenName))return {error:'bad_username',field:'username'};
    const cleanUser = chosenName.toLowerCase().replace(/[.#$/[\]]/g,'_');
    const existing=await fbReq(`usernames/${cleanUser}`);
    if(existing){
      return {error:'username_taken',field:'username'};
    }
    const j=await fbIdt('signUp',{email:f.email,password:f.password,returnSecureToken:true});
    if(j.error){
      return {error:j.error,field:j.error==='email_taken'?'email':undefined};
    }
    fbSetTokens(j);
    FBA.pendingName=chosenName;
    try{
      localStorage.setItem('tr_pending_name', chosenName);
      sessionStorage.setItem('tr_pending_name', chosenName);
    }catch(e){}
    try{
      await fbIdt('update',{idToken:j.idToken,displayName:chosenName,returnSecureToken:true});
    }catch(e){}
    try{
      await fbCall('profileInit',{name:chosenName,country:ME.country||'FR'});
    }catch(e){console.warn('profileInit during register error',e)}
    try{
      const contUrl=(location.origin||'https://tickrate.eu').replace(/^http:\/\//i,'https://')+'/';
      let r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FB_API_KEY}`,{
        method:'POST',
        headers:{'Content-Type':'application/json','X-Firebase-Locale':(window.lang||'fr')},
        body:JSON.stringify({requestType:'VERIFY_EMAIL',idToken:j.idToken,continueUrl:contUrl})
      });
      if(!r.ok){
        console.warn('sendOobCode with continueUrl returned',r.status,'; retrying without continueUrl fallback...');
        await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FB_API_KEY}`,{
          method:'POST',
          headers:{'Content-Type':'application/json','X-Firebase-Locale':(window.lang||'fr')},
          body:JSON.stringify({requestType:'VERIFY_EMAIL',idToken:j.idToken})
        });
      }
    }catch(e){console.warn('sendOobCode error',e)}
    return {
      ok:true,
      needVerification:true,
      email:f.email,
      username:chosenName,
      idToken:j.idToken,
      refreshToken:j.refreshToken
    };
  };
  doLogin=async function(f){
    if(!fbLive())return oLog(f);
    let email=String(f.login).trim();
    let j=null;
    if(!email.includes('@')){
      const a=dAcc().find(x=>x.username.toLowerCase()===email.toLowerCase());
      if(a&&a.email)email=a.email;
      else{
        const r=await fbCall('loginName',{name:email,password:f.password});
        if(r.error)return {error:r.error==='rate_limited'?r.error:'bad_credentials',field:'login'};
        j=r;
      }
    }
    if(!j)j=await fbIdt('signInWithPassword',{email,password:f.password,returnSecureToken:true});
    if(!j.error){
      fbSetTokens(j);
      const info=await fbIdt('lookup',{idToken:j.idToken});
      const u=info&&info.users&&info.users[0]||{};
      if(u.emailVerified===false){
        let prof=await fbReq(`profiles/${j.localId}`);
        if(!prof||!prof.dev){
          return {
            error:'email_not_verified',
            needVerification:true,
            email:u.email||email,
            idToken:j.idToken,
            refreshToken:j.refreshToken
          };
        }
      }
      const s=await fbBuildSession();if(!s)return {error:'server_error'};AUTH.mode='firebase';return {ok:true,session:s}
    }
    if(j.error!=='bad_credentials')return j;
    const loc=await oLog({...f,login:email});
    try{localStorage.removeItem('tr_auth');sessionStorage.removeItem('tr_auth')}catch(e){}
    if(!loc.ok)return {error:'bad_credentials'};
    const up=await fbIdt('signUp',{email,password:f.password,returnSecureToken:true});
    if(up.error)return {error:up.error==='email_taken'?'bad_credentials':up.error};
    fbSetTokens(up);FBA.pendingName=loc.session.account.username;
    const s=await fbBuildSession();if(!s)return {error:'server_error'};
    AUTH.mode='firebase';return {ok:true,session:s};
  };
  doLogout=async function(){
    if(!fbLive())return oOut();
    try{await fbSyncOnline(true)}catch(e){}
    if(typeof resetMeDefaults==='function')resetMeDefaults();
    Object.assign(FBA,{uid:null,idToken:null,refresh:null,exp:0});
    try{
      localStorage.removeItem('tr_fba');
      localStorage.removeItem('tr_auth');
      sessionStorage.removeItem('tr_auth');
      localStorage.removeItem('cs_profile');
      localStorage.removeItem('tr_pending_name');
      sessionStorage.removeItem('tr_pending_name');
    }catch(e){}
    AUTH.session=null;
  };
  doSteam=async function(){
    if(!fbLive())return oSteam();
    const secureOrigin=(location.origin||'https://tickrate.eu').replace(/^http:\/\//i,'https://');
    const p=new URLSearchParams({ret:secureOrigin+location.pathname});
    if(AUTH.mode==='firebase'&&FBA.uid){await fbAuthEnsure();if(!FBA.idToken)return {error:'server_error'};p.set('mode','link');p.set('idToken',FBA.idToken)}
    location.href=`${FB_FN()}/steamAuth?${p}`;
    return new Promise(()=>{});
  };
  window.fbInitApp=function(){
    if(window.firebase&&window.FB_API_KEY&&!firebase.apps.length){
      try{firebase.initializeApp({apiKey:FB_API_KEY,authDomain:`${FB_PROJECT||'tickratecsgo'}.firebaseapp.com`,databaseURL:FB_URL,projectId:FB_PROJECT||'tickratecsgo'})}catch(e){console.warn('Firebase init error',e)}
    }
  };
  window.fbDoGoogleAuth=async function(){
    if(!fbLive()){
      let all=dAcc(),a=all.find(x=>x.google_id||(x.email&&x.email.endsWith('@gmail.com')));
      if(!a){
        const gName='Google_'+Math.floor(100+Math.random()*900);
        a={id:Date.now(),username:gName,email:gName.toLowerCase()+'@gmail.com',google_id:'g_'+Date.now(),created:Date.now(),elo:1000,calib:{done:false,played:0,wins:0},history:[]};
        all.push(a);dSave(all);
      }
      dSessionSet(a.id,true);return {ok:true,session:dSessionGet()};
    }
    window.fbInitApp();
    if(!window.firebase||!firebase.auth)return {error:'Firebase SDK non chargé'};
    try{
      const provider=new firebase.auth.GoogleAuthProvider();
      provider.addScope('email');provider.addScope('profile');
      provider.setCustomParameters({prompt:'select_account'});
      const result=await firebase.auth().signInWithPopup(provider);
      const user=result.user,idToken=await user.getIdToken();
      fbSetTokens({idToken,refreshToken:user.refreshToken,localId:user.uid});
      if(user.displayName)FBA.pendingName=user.displayName.slice(0,16).replace(/[.#$/[\]]/g,'');
      const s=await fbBuildSession();if(!s)return {error:'server_error'};
      AUTH.mode='firebase';return {ok:true,session:s};
    }catch(err){
      console.warn('Google sign-in error:',err);
      if(err.code==='auth/popup-closed-by-user'||err.code==='auth/cancelled-popup-request')return {error:'cancel'};
      return {error:err.message||'google_error'};
    }
  };
  doPassword=async function(cur,next){
    if(!fbLive())return oPw(cur,next);
    const e=pwErr(next);if(e)return {error:e,field:'next'};
    const a=AUTH.session.account;
    if(a.has_password){const c=await fbIdt('signInWithPassword',{email:a.email,password:cur,returnSecureToken:true});if(c.error)return {error:'bad_credentials',field:'current'};fbSetTokens(c)}
    const j=await fbIdt('update',{idToken:FBA.idToken,password:next,returnSecureToken:true});if(j.error)return j;
    fbSetTokens(j);a.has_password=true;return {ok:true};
  };
  doUnlinkSteam=async function(){return oUnl();};
  const oShow=showAuth;showAuth=function(tab){
    if(fbLive()&&AUTH.mode==='firebase'&&AUTH.session)return;
    const r=oShow(tab);if($('#authMode'))$('#authMode').textContent='';return r;
  };
  const oLB=fbLoadLeaderboard;fbLoadLeaderboard=async function(force){
    if(!fbLive())return oLB(force);
    if(RLB.loading||(!force&&RLB.rows&&Date.now()-RLB.at<60e3))return;RLB.loading=true;RLB.err=null;
    const wm=RLB.mode==='wingman';
    try{let d=await fbReq(`profiles?orderBy=%22${wm?'eloWm':'elo'}%22&limitToLast=100`);if(!d)throw new Error('offline');
      RLB.rows=Object.entries(d).filter(([,u])=>u&&typeof (wm?u.eloWm:u.elo)==='number').map(([k,u])=>{const n=wm?u.matchesWm:u.matches,w=wm?u.winsWm:u.wins;const rc=typeof ADM_ROLES!=='undefined'&&ADM_ROLES[k];return {key:k,uid:k,...u,plan:u.plan||(rc&&rc.plan)||'free',influencer:u.influencer||(rc&&rc.influencer)||null,beta:!!(u.beta||(rc&&rc.beta)),dev:!!(u.dev||(rc&&rc.dev)),elo:wm?u.eloWm:u.elo,totalMatches:n,winrate:n?Math.round((w||0)/n*100):null}}).sort((a,b)=>b.elo-a.elo);RLB.at=Date.now();steamRows(RLB.rows);lookRows(RLB.rows).then(ch=>{if(ch&&!$('#ranking').hidden&&rkTab!=='ladder')renderRanking()});
      if(typeof admHydrateBadges==='function')admHydrateBadges(RLB.rows,()=>{if(!$('#ranking').hidden&&rkTab!=='ladder')renderRanking()})}
    catch(e){RLB.err=String(e.message||e)}
    RLB.loading=false;if(!$('#ranking').hidden&&rkTab!=='ladder')renderRanking();
  };
})();
(async()=>{
  if(!fbLive())return;
  const h=new URLSearchParams(location.hash.slice(1)),ft=h.get('ft'),sp=h.get('steam');
  if(ft||sp)history.replaceState(null,'',location.pathname+location.search);
  if(ft){const j=await fbIdt('signInWithCustomToken',{token:ft,returnSecureToken:true});if(!j.error)fbSetTokens(j)}
  if(FBA.refresh&&!FBA.idToken)await fbAuthEnsure();
  if(FBA.idToken){
    const r=await fbEnter(ft?null:null);
    if(r.ok){
      if(sp==='linked')toast(t('steam_linked_toast'));
      else if(sp==='taken')toast(t('au_steam_taken'));
      else if(ft)toast(t('au_hello',{n:ME.name}));
      return;
    }
  }
  const old=typeof dSessionGet==='function'&&dSessionGet();
  try{localStorage.removeItem('tr_auth');sessionStorage.removeItem('tr_auth')}catch(e){}
  AUTH.mode='demo';AUTH.session=null;showAuth(old||sp?'login':authFirstTab());
  if(old&&old.account){$('#liLogin')&&($('#liLogin').value=old.account.email||old.account.username);$('#liErr')&&($('#liErr').textContent=t('au_migrate'))}
  if(sp==='error')$('#liErr')&&($('#liErr').textContent=t('au_steam_err'));
  if(sp==='cancel')$('#liErr')&&($('#liErr').textContent=t('e_steam_cancel'));
})();

var ECO=null;
const CDB=window.CASE_DB||{cases:[],items:{},rare:{},pre:''},EC=window.ECO_CORE;
const ECO_CFG={fee:0.10,quick:0.40,minList:5};
Object.assign(I18N.fr,{rar_0:'Qualité militaire',rar_1:'Restreint',rar_2:'Classifié',rar_3:'Secret',rar_4:'★ Rare',iv_new:'NOUVEAU'});
Object.assign(I18N.en,{rar_0:'Mil-Spec',rar_1:'Restricted',rar_2:'Classified',rar_3:'Covert',rar_4:'★ Rare',iv_new:'NEW'});
Object.assign(I18N.ru,{rar_0:'Армейское',rar_1:'Запрещённое',rar_2:'Засекреченное',rar_3:'Тайное',rar_4:'★ Редкое',iv_new:'НОВОЕ'});
EC.RARITY.forEach((r,k)=>Object.defineProperty(r,'n',{get:()=>t('rar_'+k),configurable:true}));
EC.WEAR.forEach(w=>Object.defineProperty(w,'n',{get:()=>t('w_'+w.k),configurable:true}));
const slugW=n=>String(n).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const W_CAT=n=>/Gloves|Hand Wraps/.test(n)?'gloves':/Knife|Daggers|Bayonet|Karambit/.test(n)?'knife':['Dual Berettas','P2000','Tec-9','CZ75-Auto','R8 Revolver','Glock-18','USP-S','Desert Eagle','P250','Five-SeveN'].includes(n)?'pistol':['MP7','PP-Bizon','MP5-SD','MP9','MAC-10','P90','UMP-45'].includes(n)?'smg':['MAG-7','Sawed-Off','Nova','XM1014','M249','Negev'].includes(n)?'heavy':'rifle';
const W_TEAM={'Tec-9':'T','P2000':'CT','Sawed-Off':'T','MAG-7':'CT','AUG':'CT','SG 553':'T','G3SG1':'T','SCAR-20':'CT','Glock-18':'T','USP-S':'CT','Five-SeveN':'CT','AK-47':'T','M4A4':'CT','M4A1-S':'CT','Galil AR':'T','FAMAS':'CT','MP9':'CT','MAC-10':'T'};
const RN=['Mil-Spec Grade','Restricted','Classified','Covert','Extraordinary'];
if(!CATS.includes('heavy'))CATS.splice(CATS.indexOf('knife'),0,'heavy');

(function bridge(){
  for(const [k,it] of Object.entries(CDB.items)){
    let W=SKDB.weapons.find(w=>w.name===it.w);
    if(!W){W={id:slugW(it.w),name:it.w,cat:W_CAT(it.w),def:it.d,team:W_TEAM[it.w]||'both',skins:[]};SKDB.weapons.push(W)}
    if(!W.skins.some(s=>s.p===it.p))W.skins.push({p:it.p,n:it.n+(it.ph?` (${it.ph})`:''),r:EC.RARITY[it.t].c,rn:it.t===4?(it.g?'Extraordinary':'Covert ★'):RN[it.t],img:EC.img(CDB,k),min:it.mn,max:it.mx,st:!!it.st});
  }
  const T={'Consumer Grade':0,'Industrial Grade':0,'Mil-Spec Grade':0,'Restricted':1,'Classified':2,'Covert':3,'Extraordinary':4};
  for(const W of SKDB.weapons)for(const s of W.skins){
    if(Object.values(CDB.items).some(i=>i.w===W.name&&i.p===s.p))continue;
    CDB.items['sk_'+W.id+'_'+s.p]={w:W.name,d:W.def,n:s.n,p:s.p,t:W.cat==='knife'||W.cat==='gloves'?4:(T[s.rn]??1),mn:s.min??0,mx:s.max??1,i:s.img,st:s.st?1:0,g:W.cat==='gloves'?1:undefined};
  }
})();
const keyOf=(wid,p)=>{const W=weaponOf(wid);return W&&Object.keys(CDB.items).find(k=>CDB.items[k].w===W.name&&CDB.items[k].p===p)};
const itemW=item=>{const it=CDB.items[item.k];return SKDB.weapons.find(w=>w.name===it.w)};

const isoWeek=()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+3-(d.getDay()+6)%7);const w1=new Date(d.getFullYear(),0,4);return d.getFullYear()+'-'+(1+Math.round(((d-w1)/864e5-3+(w1.getDay()+6)%7)/7))};
try{ECO=JSON.parse(localStorage.getItem('tr_eco')||'null')}catch(e){}
if(!ECO||!Array.isArray(ECO.items))ECO={items:[],cases:[],listings:[],sold:[],bought:[],week:{w:isoWeek(),cases:0,items:0},pending:[],n:0};
const ecoSave=()=>{try{localStorage.setItem('tr_eco',JSON.stringify(ECO))}catch(e){}};
const eid=()=>'i'+Date.now().toString(36)+(ECO.n++).toString(36);
function ecoWeek(){if(ECO.week.w!==isoWeek())ECO.week={w:isoWeek(),cases:0,items:0};return ECO.week}
function addItem(it,src){const x={id:eid(),k:it.k,f:it.f,s:it.s,st:!!it.st,src,at:Date.now(),c:it.c||null,new:true};ECO.items.unshift(x);ecoSave();return x}
function addCase(cid,src){const x={id:eid(),c:String(cid),src,at:Date.now(),new:true};ECO.cases.unshift(x);ecoSave();return x}
if(!ECO.migrated){
  (SHOP.skins||[]).forEach(s=>{const [w,p]=s.split(':'),k=keyOf(w,+p);if(k)addItem(EC.makeItem(CDB,k,Math.random,{st:false}),'legacy')});
  SHOP.skins=[];saveShop();ECO.migrated=true;ecoSave();
}
const ecoOwns=(wid,p)=>!!ECO&&ECO.items.some(i=>!i.listed&&itemW(i)&&itemW(i).id===wid&&CDB.items[i.k].p===p);
const ecoInst=(wid,p)=>ECO.items.filter(i=>!i.listed&&itemW(i)&&itemW(i).id===wid&&CDB.items[i.k].p===p).sort((a,b)=>EC.price(CDB,b).v-EC.price(CDB,a).v);
const val=i=>EC.price(CDB,i).v;
const wearShort={fn:'FN',mw:'MW',ft:'FT',ww:'WW',bs:'BS'};

Object.assign(I18N.fr,{it_title:'Objet',nav_inv:'Inventaire',cat_heavy:'Lourdes',inv_title:'Inventaire',inv_sub:'Tes skins et tes caisses. Chaque objet est unique : usure, pattern et StatTrak™.',inv_value:'Valeur estimée',inv_items:'{n} objets',inv_cases:'Caisses : {n}',
  it_all:'Tout',it_w:'Armes',it_k:'Couteaux & gants',it_c:'Caisses',it_tu:'Contrat d\'échange',tu_hint:'Choisis 10 objets de même rareté (et même StatTrak™) : tu reçois un objet de la rareté au-dessus, tiré des caisses de tes objets. Son usure suit l\'usure moyenne des 10.',tu_odds:'Résultats possibles',tu_need:'Encore {n} objet(s)',tu_sign:'Signer le contrat',tu_clear:'Vider',tu_bad:'Objet non utilisable : même rareté et même StatTrak™ que les autres, pas équipé ni en vente.',tu_full:'Le contrat a déjà 10 objets.',tu_done:'Contrat signé : {x}',src_tradeup:'Contrat d\'échange',iv_wtype:'Type d\'arme',iv_wall:'Toutes les armes',iv_wone:'Arme',cat_pistol:'Pistolets',cat_smg:'Pistolets-mitrailleurs',cat_rifle:'Fusils',cat_heavy:'Lourdes',cat_knife:'Couteaux',cat_gloves:'Gants',so_new:'Récents',so_val:'Valeur',so_rar:'Rareté',so_flt:'Float',inv_empty:'Rien ici pour l\'instant. Joue des matchs : tu peux drop des caisses et des armes à la fin de chaque partie.',
  c_open:'Ouvrir',c_contains:'Contenu de la caisse',c_rare:'★ Objet rare spécial',c_free:'Ouverture gratuite : les caisses se gagnent en jouant, pas de clé à acheter.',c_skip:'Passer l\'animation',c_keep:'Garder',c_again:'Ouvrir une autre',c_odds:'Probabilités',
  i_float:'Float',i_seed:'Pattern',i_src:'Provenance',i_val:'Valeur estimée',i_how:'Calcul du prix',i_base:'Base (rareté)',i_weapon:'Arme',i_age:'Ancienneté de la caisse',i_wear:'Usure',i_st:'StatTrak™',i_pat:'Pattern',i_equip:'Équiper',i_sell:'Mettre en vente',i_quick:'Vente rapide · {x}',i_quick_t:'Vendu tout de suite à TICKRATE ({p} % de la valeur).',i_listed:'En vente',i_unlist:'Retirer de la vente',
  src_case:'Caisse',src_drop:'Drop de fin de match',src_pass:'Pass de combat',src_market:'Marché',src_legacy:'Ancien casier',
  sell_t:'Mettre en vente',sell_price:'Prix',sell_sugg:'Prix conseillé : {x}',sell_net:'Tu recevras {x} (commission {p} %)',sell_ok:'Mis en vente',sell_btn:'Mettre en vente',
  mk_title:'Marché',mk_mine:'Mes ventes',mk_buy:'Acheter',mk_bought:'Acheté : {x}',mk_sold:'Vendu : {x} · +{n}',mk_search:'Rechercher un skin…',mk_none:'Aucune offre avec ces filtres.',mk_seller:'Vendeur',mk_cancel:'Annuler',mk_hist:'Ventes terminées',mk_active:'En vente',mk_empty:'Tu n\'as rien en vente. Ouvre un objet de ton inventaire puis « Mettre en vente ».',mk_rule:'Les pièces ne se retirent pas en argent réel et les caisses ne se vendent pas : c\'est ce qui garde TICKRATE hors des jeux d\'argent.',mk_agents:'Agents du jour',
  any:'Tous',r_any:'Toutes raretés',w_any:'Toutes usures',
  dr_title:'Drops de fin de match',dr_none:'Pas de drop cette fois. Limite : {c} caisses et {i} armes par semaine ({x}).',dr_case:'Caisse',dr_item:'Arme',dr_week:'Cette semaine : {c}/{cm} caisses · {i}/{im} armes',dr_choose:'Choisir l\'usure',dr_open:'Ouvrir',
  wc_title:'Choisis l\'usure',wc_sub:'Avantage PREMIUM : tu choisis l\'état du skin. Le float exact et le pattern restent au hasard.',
  p_case:'Caisse',f_drops:'Drops de caisses et d\'armes à la fin des matchs',f_drop_plus:'Drops presque 2× plus fréquents, limites hebdo relevées',f_tag:'Name tags',f_stk:'4 stickers par arme',f_wear:'Choisis l\'usure des skins gagnés (pass et drops)',
  plan_plus_d:'Pour drop plus souvent.',plan_prem_d:'Pour choisir l\'usure de tes skins et progresser.',
  inv_hint:'Tes skins : caisses, drops, pass de combat, marché, et ceux de ton inventaire Steam.',n_drop:'Drop : {x}',n_sold:'Vendu : {x}'});
Object.assign(I18N.en,{it_title:'Item',nav_inv:'Inventory',cat_heavy:'Heavy',inv_title:'Inventory',inv_sub:'Your skins and cases. Every item is unique: wear, pattern and StatTrak™.',inv_value:'Estimated value',inv_items:'{n} items',inv_cases:'Cases: {n}',
  it_all:'All',it_w:'Weapons',it_k:'Knives & gloves',it_c:'Cases',it_tu:'Trade-up contract',tu_hint:'Pick 10 items of the same rarity (and same StatTrak™): you get one item of the next rarity, drawn from your items\' cases. Its wear follows the average wear of the 10.',tu_odds:'Possible results',tu_need:'{n} more item(s)',tu_sign:'Sign the contract',tu_clear:'Clear',tu_bad:'Item not usable: same rarity and StatTrak™ as the others, not equipped or listed.',tu_full:'The contract already has 10 items.',tu_done:'Contract signed: {x}',src_tradeup:'Trade-up contract',iv_wtype:'Weapon type',iv_wall:'All weapons',iv_wone:'Weapon',cat_pistol:'Pistols',cat_smg:'SMGs',cat_rifle:'Rifles',cat_heavy:'Heavy',cat_knife:'Knives',cat_gloves:'Gloves',so_new:'Recent',so_val:'Value',so_rar:'Rarity',so_flt:'Float',inv_empty:'Nothing here yet. Play matches: cases and weapons can drop at the end of every game.',
  c_open:'Open',c_contains:'Case contents',c_rare:'★ Rare special item',c_free:'Free to open: cases are earned by playing, no key to buy.',c_skip:'Skip animation',c_keep:'Keep',c_again:'Open another',c_odds:'Odds',
  i_float:'Float',i_seed:'Pattern',i_src:'Origin',i_val:'Estimated value',i_how:'Price breakdown',i_base:'Base (rarity)',i_weapon:'Weapon',i_age:'Case age',i_wear:'Wear',i_st:'StatTrak™',i_pat:'Pattern',i_equip:'Equip',i_sell:'List for sale',i_quick:'Quick sell · {x}',i_quick_t:'Sold instantly to TICKRATE ({p}% of value).',i_listed:'Listed',i_unlist:'Remove listing',
  src_case:'Case',src_drop:'End-of-match drop',src_pass:'Battle pass',src_market:'Market',src_legacy:'Old locker',
  sell_t:'List for sale',sell_price:'Price',sell_sugg:'Suggested price: {x}',sell_net:'You receive {x} ({p}% fee)',sell_ok:'Listed',sell_btn:'List for sale',
  mk_title:'Market',mk_mine:'My listings',mk_buy:'Buy',mk_bought:'Bought: {x}',mk_sold:'Sold: {x} · +{n}',mk_search:'Search skins…',mk_none:'No offer with these filters.',mk_seller:'Seller',mk_cancel:'Cancel',mk_hist:'Completed sales',mk_active:'Listed',mk_empty:'Nothing listed. Open an item in your inventory, then “List for sale”.',mk_rule:'Coins can\'t be cashed out and cases can\'t be sold: that keeps TICKRATE out of gambling.',mk_agents:'Agents of the day',
  any:'All',r_any:'All rarities',w_any:'All wears',
  dr_title:'End-of-match drops',dr_none:'No drop this time. Limit: {c} cases and {i} weapons per week ({x}).',dr_case:'Case',dr_item:'Weapon',dr_week:'This week: {c}/{cm} cases · {i}/{im} weapons',dr_choose:'Choose wear',dr_open:'Open',
  wc_title:'Choose the wear',wc_sub:'PREMIUM perk: you pick the skin condition. Exact float and pattern stay random.',
  p_case:'Case',f_drops:'Case and weapon drops at the end of matches',f_drop_plus:'Drops almost 2× more often, higher weekly limits',f_tag:'Name tags',f_stk:'4 stickers per weapon',f_wear:'Choose the wear of earned skins (pass and drops)',
  plan_plus_d:'To get more drops.',plan_prem_d:'To choose your skins\' wear and improve.',
  inv_hint:'Your skins: cases, drops, battle pass, market, and your Steam inventory.',n_drop:'Drop: {x}',n_sold:'Sold: {x}'});
Object.assign(I18N.ru,{it_title:'Предмет',nav_inv:'Инвентарь',cat_heavy:'Тяжёлое',inv_title:'Инвентарь',inv_sub:'Твои скины и кейсы. Каждый предмет уникален: износ, паттерн, StatTrak™.',inv_value:'Оценка',inv_items:'{n} предм.',inv_cases:'Кейсы: {n}',
  it_all:'Все',it_w:'Оружие',it_k:'Ножи и перчатки',it_c:'Кейсы',it_tu:'Контракт обмена',tu_hint:'Выбери 10 предметов одной редкости (и одного типа StatTrak™): получишь предмет следующей редкости из кейсов твоих предметов. Износ - средний износ десяти.',tu_odds:'Возможные результаты',tu_need:'Ещё {n} предм.',tu_sign:'Подписать контракт',tu_clear:'Очистить',tu_bad:'Предмет не подходит: та же редкость и StatTrak™, не экипирован и не на продаже.',tu_full:'В контракте уже 10 предметов.',tu_done:'Контракт подписан: {x}',src_tradeup:'Контракт обмена',iv_wtype:'Тип оружия',iv_wall:'Всё оружие',iv_wone:'Оружие',cat_pistol:'Пистолеты',cat_smg:'ПП',cat_rifle:'Винтовки',cat_heavy:'Тяжёлое',cat_knife:'Ножи',cat_gloves:'Перчатки',so_new:'Новые',so_val:'Цена',so_rar:'Редкость',so_flt:'Float',inv_empty:'Пока пусто. Играй матчи: после каждой игры могут выпасть кейсы и оружие.',
  c_open:'Открыть',c_contains:'Содержимое',c_rare:'★ Редкий предмет',c_free:'Открытие бесплатно: кейсы выпадают за игру, ключи не нужны.',c_skip:'Пропустить',c_keep:'Оставить',c_again:'Открыть ещё',c_odds:'Шансы',
  i_float:'Float',i_seed:'Паттерн',i_src:'Источник',i_val:'Оценка',i_how:'Расчёт цены',i_base:'База (редкость)',i_weapon:'Оружие',i_age:'Возраст кейса',i_wear:'Износ',i_st:'StatTrak™',i_pat:'Паттерн',i_equip:'Надеть',i_sell:'Выставить',i_quick:'Быстрая продажа · {x}',i_quick_t:'Сразу продаётся TICKRATE ({p} % цены).',i_listed:'На продаже',i_unlist:'Снять с продажи',
  src_case:'Кейс',src_drop:'Дроп после матча',src_pass:'Боевой пропуск',src_market:'Маркет',src_legacy:'Старый шкафчик',
  sell_t:'Выставить на продажу',sell_price:'Цена',sell_sugg:'Рекомендуемая: {x}',sell_net:'Получишь {x} (комиссия {p} %)',sell_ok:'Выставлено',sell_btn:'Выставить',
  mk_title:'Маркет',mk_mine:'Мои лоты',mk_buy:'Купить',mk_bought:'Куплено: {x}',mk_sold:'Продано: {x} · +{n}',mk_search:'Поиск скина…',mk_none:'Нет предложений.',mk_seller:'Продавец',mk_cancel:'Отменить',mk_hist:'Завершённые продажи',mk_active:'На продаже',mk_empty:'Ничего не выставлено.',mk_rule:'Монеты нельзя вывести в деньги, кейсы не продаются: так TICKRATE не является азартной игрой.',mk_agents:'Агенты дня',
  any:'Все',r_any:'Любая редкость',w_any:'Любой износ',
  dr_title:'Дропы после матча',dr_none:'В этот раз без дропа. Лимит: {c} кейсов и {i} оружия в неделю ({x}).',dr_case:'Кейс',dr_item:'Оружие',dr_week:'На этой неделе: {c}/{cm} кейсов · {i}/{im} оружия',dr_choose:'Выбрать износ',dr_open:'Открыть',
  wc_title:'Выбери износ',wc_sub:'Бонус PREMIUM: выбираешь состояние скина. Точный float и паттерн - случайные.',
  p_case:'Кейс',f_drops:'Дропы кейсов и оружия после матчей',f_drop_plus:'Дропы почти в 2 раза чаще',f_tag:'Name tags',f_stk:'4 наклейки на оружие',f_wear:'Выбор износа полученных скинов',
  plan_plus_d:'Чтобы чаще получать дропы.',plan_prem_d:'Чтобы выбирать износ скинов.',
  inv_hint:'Твои скины: кейсы, дропы, пропуск, маркет и инвентарь Steam.',n_drop:'Дроп: {x}',n_sold:'Продано: {x}'});

PRICES.premium={m:5.47,y:45.99};
FEATS.free=['f_mm_free','f_stats','f_drops','f_inv','f_hist'];
FEATS.plus=['f_mm_plus','f_drop_plus','f_tag','f_stk','f_badge_plus'];
FEATS.premium=['f_mm_prem','f_wear','f_agents','f_review','f_demo','f_hist_unl','f_profile','f_support'];
CMP.length=0;CMP.push(['cmp_gap','±400','±250','±150'],['cmp_trust',2],['f_mm',0],['f_stats',0],['f_drops',0],['f_inv',0],['f_hist',0],['f_drop_plus',1],['f_tag',1],['f_stk',1],['f_wear',2],['f_agents',2],['f_review',2],['f_demo',2],['f_hist_unl',2],['f_profile',2],['f_support',2]);
lo.src='inv';

function patBadge(i){const p=EC.pattern(CDB,i);return p.label?`<span class="pt-b ${p.tier||''}">${escA(p.label)}</span>`:''}
function itemCard(i,extra=''){
  const it=CDB.items[i.k],pr=EC.price(CDB,i);
  return `<button class="it-card ${i.new?'is-new':''} ${i.listed?'listed':''}" style="--rc:${EC.RARITY[it.t].c}" data-item="${i.id}">
    <span class="it-im">${imgTag(EC.img(CDB,i.k))}</span>${i.st?'<span class="st-b">ST™</span>':''}${patBadge(i)}${i.listed?`<span class="ls-b">${t('i_listed')}</span>`:''}
    <b>${escA(EC.name(CDB,{...i,st:false}).replace('★ ',''))}</b><small>${wearShort[pr.wear.k]} · ${i.f.toFixed(4)}</small><span class="it-pr">${tcHTML(pr.v)}</span>${extra}</button>`;
}
function caseCard(cs){const C=CDB.cases.find(c=>c.id===cs.c);if(!C)return '';
  return `<button class="it-card case ${cs.new?'is-new':''}" data-case="${cs.id}"><span class="it-im">${imgTag(EC.img(CDB,C.i))}</span><b>${escA(C.n)}</b><small>${C.y}</small><span class="it-pr open">${t('c_open')}</span></button>`}
function floatBar(i){
  const it=CDB.items[i.k],seg=EC.WEAR.map(w=>`<i class="fb-${w.k}" style="width:${(w.b-w.a)*100}%"></i>`).join('');
  return `<div class="fbar"><div class="fb-seg">${seg}</div><span class="fb-off" style="left:0;width:${it.mn*100}%"></span><span class="fb-off" style="left:${it.mx*100}%;right:0"></span><span class="fb-mk" style="left:${i.f*100}%"></span></div>`;
}

let invTab='all',invSort='new',invQ='',invPage=0,invMenu=null;
let invW='';
let TU=[];
const INV_PAGE=24;
Object.assign(I18N.fr,{src_beta:'Bêta testeur : skin débloqué',src_dev:'Compte dev : tous les skins',src_steam:'Inventaire Steam',iv_steam_new:'Skin récent (CS2) : pas encore équipable',iv_steam_priv:'Ton inventaire Steam est privé : rends-le public dans Steam pour voir tes armes ici.',iv_save:'Enregistrer',iv_cust_t:'Personnaliser',iv_ag_t:'Agents',src_shop:'Acheté en boutique',iv_eq_both:'Équiper (T et CT)',iv_eq_T:'Équiper côté T',iv_eq_CT:'Équiper côté CT',iv_unequip:'Retirer',iv_custom:'Personnaliser (autocollants, name tag)',iv_slot:'Équipement',iv_rifle:'Fusil CT',iv_pistol:'Pistolet CT',iv_agents:'Agents',iv_slot_hint:'Arme donnée au menu d’achat en jeu',iv_equipped:'Équipé',iv_inspect:'Inspecter',iv_equip:'Équiper',iv_sell:'Vendre sur le marché',iv_quick:'Vente rapide',iv_open:'Ouvrir la caisse',iv_page:'Page {p} / {n}',iv_items:'{n} objets',iv_coll:'Collection',iv_ext:'Usure',iv_val:'Valeur'});
Object.assign(I18N.en,{src_beta:'Beta tester: unlocked skin',src_dev:'Dev account: every skin',src_steam:'Steam inventory',iv_steam_new:'Recent skin (CS2): cannot be equipped yet',iv_steam_priv:'Your Steam inventory is private: make it public on Steam to see your weapons here.',iv_save:'Save',iv_cust_t:'Customize',iv_ag_t:'Agents',src_shop:'Bought in the shop',iv_eq_both:'Equip (T and CT)',iv_eq_T:'Equip T side',iv_eq_CT:'Equip CT side',iv_unequip:'Unequip',iv_custom:'Customize (stickers, name tag)',iv_slot:'Loadout',iv_rifle:'CT rifle',iv_pistol:'CT pistol',iv_agents:'Agents',iv_slot_hint:'Weapon given in the in-game buy menu',iv_equipped:'Equipped',iv_inspect:'Inspect',iv_equip:'Equip',iv_sell:'Sell on market',iv_quick:'Quick sell',iv_open:'Open case',iv_page:'Page {p} / {n}',iv_items:'{n} items',iv_coll:'Collection',iv_ext:'Exterior',iv_val:'Value'});
Object.assign(I18N.ru,{src_beta:'Бета-тестер: открытый скин',src_dev:'Аккаунт dev: все скины',src_steam:'Инвентарь Steam',iv_steam_new:'Новый скин (CS2): пока нельзя экипировать',iv_steam_priv:'Твой инвентарь Steam скрыт: открой его в Steam, чтобы видеть оружие здесь.',iv_save:'Сохранить',iv_cust_t:'Настройка',iv_ag_t:'Агенты',src_shop:'Куплено в магазине',iv_eq_both:'Экипировать (T и CT)',iv_eq_T:'Экипировать за T',iv_eq_CT:'Экипировать за CT',iv_unequip:'Снять',iv_custom:'Настроить (наклейки, name tag)',iv_slot:'Снаряжение',iv_rifle:'Винтовка CT',iv_pistol:'Пистолет CT',iv_agents:'Агенты',iv_slot_hint:'Оружие в меню покупки в игре',iv_equipped:'Экипировано',iv_inspect:'Осмотреть',iv_equip:'Экипировать',iv_sell:'Продать на маркете',iv_quick:'Быстрая продажа',iv_open:'Открыть кейс',iv_page:'Стр. {p} / {n}',iv_items:'{n} предметов',iv_coll:'Коллекция',iv_ext:'Износ',iv_val:'Цена'});
const SLOT_PAIRS={m4:['m4a4','m4a1-s'],ctp:['usp-s','p2000'],dg:['desert-eagle','r8-revolver'],cz:['five-seven','cz75-auto'],mp:['mp7','mp5-sd']};
const SLOT_DEF={m4:'m4a4',ctp:'usp-s',dg:'desert-eagle',cz:'five-seven',mp:'mp7'};
LOAD.pref={...SLOT_DEF,...(LOAD.pref||{})};
const slotOf=wid=>Object.keys(SLOT_PAIRS).find(k=>SLOT_PAIRS[k].includes(wid));
function shopItems(){return SHOP.skins.map(x=>{const [w,p]=x.split(':'),k=keyOf(w,+p);return k?{id:'shop:'+x,k,f:.1,s:0,st:false,at:0,src:'shop',virtual:true}:null}).filter(Boolean)}
const STEAMINV={at:0,items:null,private:false,loading:false};
const WEAR_MID=[.035,.11,.265,.415,.6];
async function steamInvLoad(){
  if(STEAMINV.loading||Date.now()-STEAMINV.at<10*60e3||!(typeof fbLive==='function'&&fbLive()&&AUTH.mode==='firebase'&&FBA.uid))return;
  STEAMINV.loading=true;const r=await fbCall('steamInventory');STEAMINV.loading=false;STEAMINV.at=Date.now();
  if(r&&!r.error){STEAMINV.items=r.items||[];STEAMINV.private=!!r.private;if(!$('#inventory').hidden)renderInventory()}
}
function steamBridge(x,w,n){
  if(!x.def||x.p==null)return null;
  const key='stm_'+x.def+'_'+x.p;
  if(!CDB.items[key]){
    let W=SKDB.weapons.find(v=>v.name===w);
    if(!W){W={id:slugW(w),name:w,cat:W_CAT(w),def:x.def,team:W_TEAM[w]||'both',skins:[]};SKDB.weapons.push(W)}
    const t=Math.min(4,Math.max(0,x.t|0)),img=x.icon?'~'+x.icon:'';
    CDB.items[key]={w,d:x.def,n:n||'Vanilla',p:x.p,t,mn:x.mn??0,mx:x.mx??1,i:img,st:1,g:W.cat==='gloves'?1:undefined};
    if(!W.skins.some(s=>s.p===x.p))W.skins.push({p:x.p,n:n||'Vanilla',r:EC.RARITY[t].c,rn:t===4?(W.cat==='gloves'?'Extraordinary':'Covert ★'):RN[t],img:EC.img(CDB,key),min:x.mn??0,max:x.mx??1,st:true});
  }
  return key;
}
function steamItems(){
  return (STEAMINV.items||[]).map(x=>{const [w,n]=x.name.split(' | ');
    const k=Object.keys(CDB.items).find(key=>{const it=CDB.items[key];return it.w===w&&(it.n===n||(n||'')==='')&&(!!n||it.n==='Vanilla')})||steamBridge(x,w,n);
    if(!k)return {id:'steam:'+x.id,ext:true,name:x.name,st:x.st,wear:x.wear,icon:x.icon,at:1};
    const it=CDB.items[k],f=Math.min(it.mx,Math.max(it.mn,WEAR_MID[x.wear]??.2));
    return {id:'steam:'+x.id,k,f:+f.toFixed(4),s:0,st:x.st,at:1,src:'steam',virtual:true}});
}
let DEV_ITEMS=null;
function devItems(){
  if(typeof ADM==='undefined'||!ADM.dev||ADM.devUid!==FBA.uid)return [];
  return DEV_ITEMS||(DEV_ITEMS=Object.keys(CDB.items).filter(k=>!k.startsWith('stm_')).map(k=>({id:'dev:'+k,k,f:.03,s:0,st:false,at:0,src:'dev',virtual:true})));
}
let BETA_ITEMS=null;
function betaItems(){
  if(!ME.beta||(typeof ADM!=='undefined'&&ADM.dev))return [];
  return BETA_ITEMS||(BETA_ITEMS=EC.betaSet(CDB).filter(k=>CDB.items[k]).map(k=>({id:'beta:'+k,k,f:.03,s:0,st:false,at:0,src:'beta',virtual:true})));
}
function betaOwns(wid,p){return betaItems().some(i=>{const W=itemW(i);return W&&W.id===wid&&CDB.items[i.k].p===p})}
const invFind=id=>ECO.items.find(x=>x.id===id)||shopItems().find(x=>x.id===id)||steamItems().find(x=>x.id===id)||devItems().find(x=>x.id===id)||betaItems().find(x=>x.id===id);
function equippedTeam(i){const W=itemW(i),c=W&&LOAD.w[W.id];if(!c)return null;
  const ok=i.virtual?(!c.iid&&c.p===CDB.items[i.k].p):c.iid===i.id;return ok?(W.team==='both'?(c.team||'both'):W.team):null}
function freeSlot(W,team){
  if(W.cat!=='knife'&&W.cat!=='gloves')return;
  for(const O of SKDB.weapons){
    const c=O.cat===W.cat&&O.id!==W.id&&LOAD.w[O.id];if(!c)continue;
    const ot=c.team||'both';
    if(team==='both'||ot===team)delete LOAD.w[O.id];
    else if(ot==='both')c.team=team==='T'?'CT':'T';
  }
}
function invEquip(i,team){
  const W=itemW(i);if(!W)return;
  freeSlot(W,W.team==='both'?(team||'both'):W.team);
  if(i.virtual){const prev=LOAD.w[W.id]||{},p=CDB.items[i.k].p;
    LOAD.w[W.id]={p,f:i.src==='steam'?i.f:prev.p===p&&prev.f!=null?prev.f:.1,seed:prev.seed||0,st:i.src==='steam'&&!!i.st,tag:prev.tag||'',team:'both',stk:Array.isArray(prev.stk)?prev.stk:Array(STK_SLOTS).fill(null)};
    toast(t('equipped_toast',{x:EC.name(CDB,i)}))}
  else equipItem(i);
  const cu=(LOAD.cust||{})[i.id];
  if(cu&&cu.st!=null)LOAD.w[W.id].st=!!cu.st;
  LOAD.w[W.id].tag=cu?cu.tag||'':'';LOAD.w[W.id].stk=cu&&Array.isArray(cu.stk)?cu.stk.map(x=>x&&{...x}):Array(STK_SLOTS).fill(null);
  LOAD.w[W.id].team=W.team==='both'?(team||'both'):W.team;
  const sl=slotOf(W.id);if(sl)LOAD.pref={...LOAD.pref,[sl]:W.id};
  saveLoad();renderInventory();
}
function invUnequip(i){const W=itemW(i);if(W&&equippedTeam(i)){delete LOAD.w[W.id];saveLoad();renderInventory()}}
let CUST=null;
function custOpen(i){
  const W=itemW(i);if(!W)return;
  if(!LOAD.cust)LOAD.cust={};
  const eq=equippedTeam(i),c=eq?LOAD.w[W.id]:null,cu=LOAD.cust[i.id]||(c?{tag:c.tag,stk:c.stk}:{});
  CUST={wid:W.id,i,eq:!!eq};
  draftCfg={w:W.id,p:CDB.items[i.k].p,team:c?c.team||'both':'both',st:cu.st!=null?!!cu.st:c?!!c.st:!!i.st,tag:cu.tag||'',stk:Array.isArray(cu.stk)?cu.stk.map(x=>x&&{...x}):Array(STK_SLOTS).fill(null)};stkSel=0;
  custRender();openModal('custModal');
}
function custPickerHTML(){
  const q=stkQ.trim().toLowerCase(),fx=[['all','stk_all'],['Holo','Holo'],['Foil','Foil'],['Gold','Gold'],['Other','stk_paper']];
  const list=STDB.filter(x=>(stkFx==='all'||x.fx===stkFx)&&(!q||x.n.toLowerCase().includes(q))).slice(0,240);
  return `<div class="cust-pick-h"><button class="btn ghost sm" data-cback>‹ ${t('back')}</button><b>${t('stickers')} · ${stkSel+1}/${STK_SLOTS}</b></div>
    <div class="stk-tools"><input id="cstkQ" placeholder="${t('stk_search')}" value="${escA(stkQ)}"><div class="seg">${fx.map(([k,l])=>`<button class="${stkFx===k?'on':''}" data-cfx="${k}">${l.startsWith('stk_')?t(l):l}</button>`).join('')}</div></div>
    <div class="stk-grid cust-stk-grid">${list.length?list.map(x=>`<button class="stk-it" style="--rc:${x.r}" data-cstk="${x.id}"><span class="im">${imgTag(x.img)}</span><span>${escA(x.n)}</span><small>${escA(x.rn)}</small></button>`).join(''):'<div class="m-hint">—</div>'}</div>`;
}
function custRender(){
  if(!CUST||!draftCfg)return;
  if(CUST.picking){$('#custBody').innerHTML=custPickerHTML();return}
  const W=weaponOf(CUST.wid),d=draftCfg,plus=stkPlus(),sk=W.skins.find(x=>x.p===d.p)||{n:'',img:EC.img(CDB,CUST.i.k),r:'#888'};
  $('#custBody').innerHTML=`<div class="cust-top" style="--rc:${sk.r}"><div class="big">${imgTag(sk.img)}${stkOverlay(d)}</div><div><h3>${escA(W.name)} | ${escA(sk.n)}</h3>${CUST.eq?`<small>${t('iv_equipped')} : ${d.team==='both'||!d.team?'T/CT':d.team}</small>`:''}</div></div>
    <div class="fld"><label>${t('nametag')} ${plus?'':'<span class="pb plus">PLUS</span>'}</label><input type="text" id="cfN" maxlength="20" placeholder="${t('nametag_ph')}" value="${escA(d.tag||'')}" ${plus?'':'disabled'}></div>
    ${stickersHTML(W,d)}
    ${CDB.items[CUST.i.k]&&CDB.items[CUST.i.k].st?`<div class="fld"><label class="cust-st"><input type="checkbox" id="cfSt" ${d.st?'checked':''} ${CUST.i.st||plus?'':'disabled'}> StatTrak™ ${CUST.i.st||plus?'':'<span class="pb plus">PLUS</span>'}</label></div>`:''}
    ${CUST.eq&&W.team==='both'?`<div class="fld"><label>${t('team_l')}</label><div class="seg">${['both','T','CT'].map(x=>`<button class="${(d.team||'both')===x?'on':''}" data-cteam="${x}">${x==='both'?t('team_both'):x}</button>`).join('')}</div></div>`:''}
    <div class="cfg-act"><button class="btn primary" data-csave>${t('iv_save')}</button><button class="btn ghost" data-close>${t('cancel')}</button></div>`;
}
function custSave(){
  const W=weaponOf(CUST.wid),d=draftCfg;
  let tag=d.tag||'',stk=canSticker(W)&&Array.isArray(d.stk)?d.stk:null;
  if(!stkPlus()){tag='';if(stk)stk=stk.map((x,i)=>i===0?x:null)}
  const st=!!d.st&&(!!CUST.i.st||stkPlus());
  LOAD.cust[CUST.i.id]={tag,stk,st};
  if(CUST.eq&&LOAD.w[W.id])freeSlot(W,W.team==='both'?d.team||'both':W.team);
  if(CUST.eq&&LOAD.w[W.id])LOAD.w[W.id].st=st;
  if(CUST.eq&&LOAD.w[W.id]){LOAD.w[W.id].tag=tag;if(stk)LOAD.w[W.id].stk=stk;else delete LOAD.w[W.id].stk;LOAD.w[W.id].team=W.team==='both'?d.team||'both':W.team}
  saveLoad();closeModal('custModal');CUST=null;draftCfg=null;toast(t('adm_ok'));renderInventory();
}
function agOpen(){$('#agBody').innerHTML=agentsHTML();openModal('agModal')}
const CHECK_SVG='<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M416 128L192 384l-96-96"/></svg>';
function invNames(i){const full=EC.name(CDB,{...i,st:false}),k=full.indexOf(' | ');
  return {w:(i.st?'StatTrak™ ':'')+(k<0?full:full.slice(0,k)),n:k<0?'':full.slice(k+3)}}
function invTile(i,n=1){
  const it=CDB.items[i.k],pr=EC.price(CDB,i),nm=invNames(i),R=EC.RARITY[it.t],C=i.c&&CDB.cases.find(c=>c.id===i.c),eq=equippedTeam(i);
  return `<button class="csi-t ${i.new?'is-new':''} ${i.listed?'listed':''} ${i.st?'csi-st':''} ${invTab==='tu'&&TU.includes(i.id)?'tu-sel':''}" style="--rc:${R.c}" data-iv="${i.id}">
    <span class="csi-im">${imgTag(EC.img(CDB,i.k))}</span>${n>1?`<span class="csi-stack">×${n}</span>`:''}${i.listed?`<span class="csi-tag">${t('i_listed')}</span>`:''}${i.src==='steam'?'<span class="csi-tag steam">Steam</span>':''}
    ${eq?`<span class="csi-eq" title="${t('iv_equipped')}">${CHECK_SVG}<em>${eq==='both'?'T/CT':eq}</em></span>`:''}
    <span class="csi-n"><b>${escA(nm.w)}</b><small>${escA(nm.n)}</small></span>
    <span class="csi-tip"><b style="color:${R.c}">${escA(EC.name(CDB,i))}</b><span>${R.n}</span>
      <span>${t('iv_ext')} : ${pr.wear.n} · ${i.virtual?'':`<span class="mono">${i.f.toFixed(6)}</span>`}</span>
      ${C?`<span>${t('iv_coll')} : ${escA(C.n)}</span>`:''}${i.virtual?`<span>${t(i.src==='steam'?'src_steam':i.src==='dev'?'src_dev':i.src==='beta'?'src_beta':'src_shop')}</span>`:`<span>${t('iv_val')} : ${tcHTML(pr.v)}</span>`}</span></button>`;
}
function invExtTile(x){
  const icon=x.icon?`https://community.akamai.steamstatic.com/economy/image/${x.icon}/256fx192f`:'';const [w,n]=x.name.split(' | ');
  return `<button class="csi-t ext" style="--rc:#5e6673" data-iv="${escA(x.id)}"><span class="csi-im">${icon?imgTag(icon):''}</span><span class="csi-tag steam">Steam</span>
    <span class="csi-n"><b>${escA((x.st?'StatTrak™ ':'')+w)}</b><small>${escA(n||'')}</small></span>
    <span class="csi-tip"><b>${escA(x.name)}</b><span>${t('src_steam')}</span>${x.wear>=0?`<span>${t('iv_ext')} : ${(EC.WEAR[x.wear]||{}).n||''}</span>`:''}<span>${t('iv_steam_new')}</span></span></button>`}
function invCaseTile(cs){const C=CDB.cases.find(c=>c.id===cs.c);if(!C)return '';
  return `<button class="csi-t case ${cs.new?'is-new':''}" style="--rc:#b0c3d9" data-ivc="${cs.id}"><span class="csi-im">${imgTag(EC.img(CDB,C.i))}</span>
    <span class="csi-n"><b>${escA(C.n)}</b><small>${C.y||''}</small></span></button>`}
Object.assign(I18N.fr,{sl_m4:'Fusil CT',sl_ctp:'Pistolet de départ CT',sl_dg:'Pistolet lourd',sl_cz:'Pistolet (T / CT)',sl_mp:'Pistolet-mitrailleur',sl_cz_a:'Five-SeveN · Tec-9',sl_title:'Équipement',sl_sub:'Comme le casier de CS:GO : l’arme choisie remplace l’autre dans le menu d’achat en jeu.'});
Object.assign(I18N.en,{sl_m4:'CT rifle',sl_ctp:'CT starting pistol',sl_dg:'Heavy pistol',sl_cz:'Pistol (T / CT)',sl_mp:'SMG',sl_cz_a:'Five-SeveN · Tec-9',sl_title:'Loadout',sl_sub:'Like the CS:GO loadout: the chosen weapon replaces the other one in the in-game buy menu.'});
Object.assign(I18N.ru,{sl_m4:'Винтовка CT',sl_ctp:'Стартовый пистолет CT',sl_dg:'Тяжёлый пистолет',sl_cz:'Пистолет (T / CT)',sl_mp:'Пистолет-пулемёт',sl_cz_a:'Five-SeveN · Tec-9',sl_title:'Снаряжение',sl_sub:'Как в снаряжении CS:GO: выбранное оружие заменяет другое в меню покупки в игре.'});
function slotImg(wid){
  const W=weaponOf(wid);if(!W)return '';
  const eq=LOAD.w[wid],sk=eq&&W.skins.find(s=>s.p===eq.p);
  return sk?`<img src="${sk.img}" alt="" loading="lazy" referrerpolicy="no-referrer">`:W.skins[0]?`<img class="sl-ghost" src="${W.skins[0].img}" alt="" loading="lazy" referrerpolicy="no-referrer">`:'';
}
function slotsHTML(){
  const opt=(k,w,i)=>{const on=LOAD.pref[k]===w,W=weaponOf(w)||{name:w};
    return `<button type="button" class="sl-opt ${on?'on':''}" data-slot="${k}:${w}"><span class="sl-im">${slotImg(w)}</span><span class="sl-n">${k==='cz'&&i===0?t('sl_cz_a'):escA(W.name)}</span>${on?`<span class="sl-ck">${CHECK_SVG}</span>`:''}</button>`};
  return `<div class="sl-panel"><div class="sl-h"><b>${t('sl_title')}</b><small>${t('sl_sub')}</small><button class="csi-agents" data-ivagents>${t('iv_agents')}</button></div>
    <div class="sl-grid">${Object.keys(SLOT_PAIRS).map(k=>`<div class="sl-card"><span class="sl-l">${t('sl_'+k)}</span><div class="sl-pair">${SLOT_PAIRS[k].map((w,i)=>opt(k,w,i)).join('<span class="sl-or">/</span>')}</div></div>`).join('')}</div></div>`;
}
let CO_ACTIVE_ID=null, CO_DEP_SEL=new Set(), CO_RET_SEL=new Set();

function containerSvg(c){
  const name=c&&c.name?String(c.name).slice(0,18):'Storage Unit';
  const uid=c&&c.id?c.id.replace(/[^a-zA-Z0-9_-]/g,''):'def';
  return `<svg viewBox="0 0 240 160" class="co-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="coBodyGrad_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#421a1a"/>
        <stop offset="50%" stop-color="#281111"/>
        <stop offset="100%" stop-color="#140808"/>
      </linearGradient>
      <linearGradient id="coTrimGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#555c69"/>
        <stop offset="50%" stop-color="#9199a8"/>
        <stop offset="100%" stop-color="#464d59"/>
      </linearGradient>
      <linearGradient id="coPlateGrad_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f0f3f8"/>
        <stop offset="50%" stop-color="#bcc4d2"/>
        <stop offset="100%" stop-color="#8a92a2"/>
      </linearGradient>
    </defs>
    <path d="M 85 24 Q 120 10 155 24 L 150 36 Q 120 26 90 36 Z" fill="#1c1e24" stroke="#484d56" stroke-width="2"/>
    <rect x="20" y="32" width="200" height="116" rx="14" fill="url(#coBodyGrad_${uid})" stroke="#542424" stroke-width="3"/>
    <path d="M 20 54 L 38 32 L 20 32 Z" fill="#181a20"/>
    <path d="M 220 54 L 202 32 L 220 32 Z" fill="#181a20"/>
    <path d="M 20 126 L 38 148 L 20 148 Z" fill="#181a20"/>
    <path d="M 220 126 L 202 148 L 220 148 Z" fill="#181a20"/>
    <rect x="36" y="52" width="168" height="14" rx="4" fill="#180b0b" stroke="#381414" stroke-width="1.5"/>
    <rect x="36" y="74" width="168" height="14" rx="4" fill="#180b0b" stroke="#381414" stroke-width="1.5"/>
    <rect x="36" y="96" width="168" height="14" rx="4" fill="#180b0b" stroke="#381414" stroke-width="1.5"/>
    <rect x="36" y="40" width="168" height="6" fill="#f59e0b" rx="2" opacity="0.85"/>
    <rect x="62" y="30" width="18" height="24" rx="3" fill="url(#coTrimGrad_${uid})" stroke="#1a1c22" stroke-width="1.5"/>
    <rect x="160" y="30" width="18" height="24" rx="3" fill="url(#coTrimGrad_${uid})" stroke="#1a1c22" stroke-width="1.5"/>
    <rect x="55" y="116" width="130" height="24" rx="3" fill="url(#coPlateGrad_${uid})" stroke="#383d46" stroke-width="1.5"/>
    <circle cx="62" cy="128" r="2" fill="#202227"/>
    <circle cx="178" cy="128" r="2" fill="#202227"/>
    <text x="120" y="132" fill="#111827" font-family="monospace" font-size="9.5" font-weight="bold" text-anchor="middle" letter-spacing="0.5">${escA(name)}</text>
  </svg>`;
}

function containerSvgBig(){
  return `<svg viewBox="0 0 240 160" class="co-svg" xmlns="http://www.w3.org/2000/svg">
    <path d="M 85 24 Q 120 10 155 24 L 150 36 Q 120 26 90 36 Z" fill="#1c1e24" stroke="#484d56" stroke-width="2"/>
    <rect x="20" y="32" width="200" height="116" rx="14" fill="#281111" stroke="#542424" stroke-width="3"/>
    <rect x="36" y="52" width="168" height="14" rx="4" fill="#180b0b" stroke="#381414" stroke-width="1.5"/>
    <rect x="36" y="74" width="168" height="14" rx="4" fill="#180b0b" stroke="#381414" stroke-width="1.5"/>
    <rect x="36" y="96" width="168" height="14" rx="4" fill="#180b0b" stroke="#381414" stroke-width="1.5"/>
    <rect x="36" y="40" width="168" height="6" fill="#f59e0b" rx="2" opacity="0.85"/>
    <rect x="62" y="30" width="18" height="24" rx="3" fill="#8890a0" stroke="#1a1c22" stroke-width="1.5"/>
    <rect x="160" y="30" width="18" height="24" rx="3" fill="#8890a0" stroke="#1a1c22" stroke-width="1.5"/>
    <rect x="55" y="116" width="130" height="24" rx="3" fill="#cfd6e0" stroke="#383d46" stroke-width="1.5"/>
    <text x="120" y="132" fill="#111827" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">CS:GO STORAGE</text>
  </svg>`;
}

function containerCardHTML(c){
  const cnt=c.count||(c.items?c.items.length:0),max=c.max||1000;
  const pct=Math.min(100,Math.round((cnt/max)*100));
  const v=(c.value||0).toLocaleString(LOC[lang]||'fr-FR');
  return `<div class="co-card" data-cid="${c.id}">
    <div class="co-card-svg">${containerSvg(c)}</div>
    <div class="co-card-info">
      <div class="co-card-title-row">
        <h4 class="co-card-title" title="${escA(c.name)}">${escA(c.name)}</h4>
        <span class="co-card-val">${v} TC</span>
      </div>
      <div class="co-card-bar-wrap">
        <div class="co-card-bar-lbl">
          <span>Capacité</span>
          <b>${cnt} / ${max}</b>
        </div>
        <div class="co-card-bar"><div class="co-card-bar-fill" style="width:${pct}%"></div></div>
      </div>
    </div>
    <div class="co-card-acts">
      <button type="button" class="btn primary sm" data-co-open="${c.id}">${t('co_open')}</button>
      <button type="button" class="btn sm" data-co-dep="${c.id}">${t('co_deposit')}</button>
      <button type="button" class="btn ghost sm" data-co-ren="${c.id}" title="${t('co_rename')}"><svg class="ic ico" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" width="14" height="14"><path d="M459.94 53.25a16.06 16.06 0 00-23.22-.56L424.35 65a8 8 0 000 11.31l11.34 11.32a8 8 0 0011.34 0l12.06-12c6.1-6.09 6.67-16.01.85-22.38zM399.34 90L218.82 270.2a9 9 0 00-2.31 3.93L208.16 299a3.91 3.91 0 004.86 4.86l24.85-8.35a9 9 0 003.93-2.31L422 112.66a9 9 0 000-12.66l-9.95-10a9 9 0 00-12.71 0z"/><path d="M386.34 193.66L264.45 315.79A41.08 41.08 0 01247.58 326l-25.9 8.67a35.92 35.92 0 01-44.33-44.33l8.67-25.9a41.08 41.08 0 0110.19-16.87l122.13-121.91a8 8 0 00-5.65-13.66H104a56 56 0 00-56 56v240a56 56 0 0056 56h240a56 56 0 0056-56V199.31a8 8 0 00-13.66-5.65z"/></svg></button>
      <button type="button" class="btn ghost sm danger" data-co-del="${c.id}" title="${t('co_delete')}" ${cnt>0?'disabled':''}><svg class="ic ico" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" width="14" height="14"><path d="M296 64h-80a7.91 7.91 0 00-8 8v24h96V72a7.91 7.91 0 00-8-8z" fill="none"/><path d="M432 96h-96V72a40 40 0 00-40-40h-80a40 40 0 00-40 40v24H80a16 16 0 000 32h17l19 304.92c1.42 26.85 22 47.08 48 47.08h184c26.13 0 46.3-19.78 48-47l19-305h17a16 16 0 000-32zM192.57 416H192a16 16 0 01-16-15.43l-8-224a16 16 0 1132-1.14l8 224A16 16 0 01192.57 416zM272 400a16 16 0 01-32 0V176a16 16 0 0132 0zm32-304h-96V72a7.91 7.91 0 018-8h80a7.91 7.91 0 018 8zm32 304.57A16 16 0 01320 416h-.58A16 16 0 01304 399.43l8-224a16 16 0 1132 1.14z"/></svg></button>
    </div>
  </div>`;
}

function renderContainersView(el){
  const list=ECO.containers||[];
  const totalCount=list.reduce((s,c)=>s+(c.count||(c.items?c.items.length:0)),0);
  const totalVal=list.reduce((s,c)=>s+(c.value||0),0);
  const isDev=!!(typeof ME!=='undefined'&&ME&&ME.dev);

  el.innerHTML=`<div class="csi" style="--new:'${t('iv_new')}'">
    <div class="csi-top">
      <nav class="csi-main"><button class="on">${t('it_co')}<span class="csi-cnt">${list.length} / 25</span></button></nav>
      <div class="csi-top-r" style="display:flex;align-items:center;gap:12px">
        ${isDev?`<button type="button" class="btn primary sm cs-dev-pack-btn" data-dev-pack title="Obtenir 50 caisses (Pack Développeur)">${t('co_dev_btn')}</button>`:''}
        <div class="csi-kpi"><span>${t('co_val')}</span><b>${tcHTML(totalVal)}</b></div>
      </div>
    </div>
    <div class="csi-bar">
      <div class="csi-cats">${[['all','it_all'],['w','it_w'],['k','it_k'],['c','it_c'],['tu','it_tu'],['co','it_co']].map(([k,l])=>`<button class="${invTab===k?'on':''}" data-itab="${k}">${t(l)}</button>`).join('')}</div>
      <div class="csi-tools">
        <button type="button" class="btn primary sm" data-co-act="new"><b>+</b> ${t('co_create')}</button>
      </div>
    </div>
    <div class="co-dashboard">
      <div class="co-banner">
        <div class="co-banner-info">
          <h3>${t('co_title')}</h3>
          <p>${t('co_desc')}</p>
        </div>
        <div class="co-stats">
          <div class="co-stat-box"><span class="co-st-l">Conteneurs</span><b>${list.length} <small>/ 25</small></b></div>
          <div class="co-stat-box"><span class="co-st-l">Skins rangés</span><b>${totalCount}</b></div>
          <div class="co-stat-box"><span class="co-st-l">Valeur totale</span><b>${totalVal.toLocaleString(LOC[lang]||'fr-FR')} TC</b></div>
        </div>
      </div>
      ${list.length?`<div class="co-grid">${list.map(c=>containerCardHTML(c)).join('')}</div>`:`<div class="co-empty-card">
        <div class="co-crate-ico-big">${containerSvgBig()}</div>
        <h4>${t('co_empty')}</h4>
        <p>${t('co_desc')}</p>
        <button type="button" class="btn primary" data-co-act="new">+ ${t('co_create')}</button>
      </div>`}
    </div>
  </div>`;
}

function openContainerModal(cid){
  const c=(ECO.containers||[]).find(x=>x.id===cid);
  if(!c)return toast(t('se_gone'));
  CO_ACTIVE_ID=cid;
  CO_RET_SEL.clear();
  renderContainerModalContent(c);
  openModal('coModal');
}

function renderContainerModalContent(c,q=''){
  const title=$('#coModalTitle');
  if(title)title.textContent=c.name;
  const body=$('#coModalBody');
  if(!body)return;
  const items=(c.items||[]).filter(i=>{
    if(!q)return true;
    return EC.name(CDB,i).toLowerCase().includes(q.toLowerCase());
  });
  const cnt=c.count||(c.items?c.items.length:0),max=c.max||1000;
  const v=(c.value||0).toLocaleString(LOC[lang]||'fr-FR');

  body.innerHTML=`
    <div class="co-m-body">
      <div class="co-m-topbar">
        <div class="co-m-top-info">
          <div><b>${cnt} / ${max}</b> skins stockés</div>
          <div class="co-card-val">${v} TC</div>
        </div>
        <div class="co-m-acts">
          <input type="text" id="coModalQ" placeholder="${t('mk_search')}" value="${escA(q)}" style="height:32px;padding:0 10px;font-size:12px;border-radius:6px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);color:#fff">
          <button type="button" class="btn primary sm" data-co-dep="${c.id}">${t('co_deposit')}</button>
          ${items.length?`<button type="button" class="btn ghost sm" data-co-ret-all="${c.id}">${t('co_retrieve_all')}</button>`:''}
          ${CO_RET_SEL.size?`<button type="button" class="btn sm" data-co-ret-sel="${c.id}">${t('co_retrieve_btn')} (${CO_RET_SEL.size})</button>`:''}
        </div>
      </div>
      ${items.length?`
        <div class="co-items-grid">
          ${items.map(i=>{
            const it=CDB.items[i.k],pr=EC.price(CDB,i);
            const isSel=CO_RET_SEL.has(i.id);
            return `<div class="co-tile ${isSel?'selected':''}" data-co-tile="${i.id}">
              <input type="checkbox" class="co-chk" ${isSel?'checked':''} data-co-chk="${i.id}">
              <div class="co-tile-im" style="--rc:${EC.RARITY[it.t].c}">${imgTag(EC.img(CDB,i.k))}</div>
              <div class="co-tile-n" title="${escA(EC.name(CDB,i))}">${escA(EC.name(CDB,i))}</div>
              <div class="co-tile-w">${pr.wear.n}${i.st?' · ST':''}</div>
              <div class="co-tile-p">${tcHTML(pr.v)}</div>
              <div class="co-tile-act">
                <button type="button" class="btn ghost sm" data-co-ret-one="${c.id}:${i.id}">${t('co_retrieve')}</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      `:`
        <div class="co-empty-card" style="margin:20px auto;padding:30px">
          <div style="margin-bottom:8px;opacity:.5"><svg class="ic ico" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" width="36" height="36"><path d="M440.9 136.3a4 4 0 000-6.91L288.16 40.65a64.14 64.14 0 00-64.33 0L71.12 129.39a4 4 0 000 6.91L254 243.88a4 4 0 004.06 0zM54 163.51a4 4 0 00-6 3.49v173.89a48 48 0 0023.84 41.39L234 479.51a4 4 0 006-3.46V274.3a4 4 0 00-2-3.46zM272 275v201a4 4 0 006 3.46l162.15-97.23A48 48 0 00464 340.89V167a4 4 0 00-6-3.45l-184 108a4 4 0 00-2 3.45z"/></svg></div>
          <h4>Conteneur vide</h4>
          <p>Ce conteneur ne contient aucun skin pour le moment.</p>
          <button type="button" class="btn primary sm" data-co-dep="${c.id}">${t('co_deposit')}</button>
        </div>
      `}
    </div>`;
}

function openDepositModal(cid){
  const c=(ECO.containers||[]).find(x=>x.id===cid);
  if(!c)return toast(t('se_gone'));
  CO_ACTIVE_ID=cid;
  CO_DEP_SEL.clear();
  renderDepositModalContent(c);
  openModal('coDepositModal');
}

function renderDepositModalContent(c,q=''){
  const title=$('#coDepositTitle');
  if(title)title.textContent=`Déposer dans « ${c.name} »`;
  const body=$('#coDepositBody');
  if(!body)return;
  const curCnt=c.count||(c.items?c.items.length:0);
  const remaining=Math.max(0,(c.max||1000)-curCnt);

  const eligible=ECO.items.filter(i=>{
    if(i.listed||i.virtual||i.ext)return false;
    if(!q)return true;
    return EC.name(CDB,i).toLowerCase().includes(q.toLowerCase());
  });

  body.innerHTML=`
    <div class="co-m-body">
      <div class="co-m-topbar">
        <div class="co-m-top-info">
          <div>Espace libre : <b>${remaining}</b> places</div>
          <div style="font-size:12px;color:var(--muted)">${CO_DEP_SEL.size} skin(s) sélectionné(s)</div>
        </div>
        <div class="co-m-acts">
          <input type="text" id="coDepQ" placeholder="${t('mk_search')}" value="${escA(q)}" style="height:32px;padding:0 10px;font-size:12px;border-radius:6px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);color:#fff">
          ${eligible.length?`<button type="button" class="btn ghost sm" data-co-sel-all>${CO_DEP_SEL.size===eligible.length?'Tout désélectionner':'Tout sélectionner'}</button>`:''}
          <button type="button" class="btn primary sm" data-co-do-dep="${c.id}" ${!CO_DEP_SEL.size||CO_DEP_SEL.size>remaining?'disabled':''}>Déposer (${CO_DEP_SEL.size})</button>
        </div>
      </div>
      ${eligible.length?`
        <div class="co-items-grid">
          ${eligible.map(i=>{
            const it=CDB.items[i.k],pr=EC.price(CDB,i);
            const isSel=CO_DEP_SEL.has(i.id);
            return `<div class="co-tile ${isSel?'selected':''}" data-co-dep-tile="${i.id}">
              <input type="checkbox" class="co-chk" ${isSel?'checked':''} data-co-dep-chk="${i.id}">
              <div class="co-tile-im" style="--rc:${EC.RARITY[it.t].c}">${imgTag(EC.img(CDB,i.k))}</div>
              <div class="co-tile-n" title="${escA(EC.name(CDB,i))}">${escA(EC.name(CDB,i))}</div>
              <div class="co-tile-w">${pr.wear.n}${i.st?' · ST':''}</div>
              <div class="co-tile-p">${tcHTML(pr.v)}</div>
            </div>`;
          }).join('')}
        </div>
      `:`
        <div class="co-empty-card" style="margin:20px auto;padding:30px">
          <h4>Aucun skin disponible</h4>
          <p>Vous n'avez pas de skins libres à déposer dans votre inventaire actif.</p>
        </div>
      `}
    </div>`;
}

function renderInventory(){
  const el=$('#inventory');if(!el)return;
  if(invTab==='co')return renderContainersView(el);
  const items=ECO.items,total=items.reduce((s,i)=>s+val(i),0);
  steamInvLoad();
  if(typeof amDev==='function'&&typeof ADM!=='undefined'&&ADM.devUid!==FBA.uid)amDev().then(d=>{if(d&&!$('#inventory').hidden)renderInventory()});
  const ext=steamItems().filter(x=>x.ext&&invTab!=='c'&&(!invQ||x.name.toLowerCase().includes(invQ.toLowerCase())));
  const own=[...items,...shopItems(),...steamItems().filter(x=>!x.ext)],have=new Set(own.map(i=>i.k));
  let list=invTab==='c'?[]:[...own,...devItems().filter(i=>!have.has(i.k)),...betaItems().filter(i=>!have.has(i.k))].filter(i=>{const it=CDB.items[i.k];return invTab==='all'||(invTab==='k'?it.t===4:it.t<4)});
  if(invTab==='tu')list=ECO.items.filter(tuOk);
  const wpnNames=[...new Set(list.map(i=>(itemW(i)||{}).name).filter(Boolean))].sort();
  if(invW)list=list.filter(i=>{const W=itemW(i);return W&&(invW.startsWith('cat:')?W.cat===invW.slice(4):W.name===invW)});
  if(invQ)list=list.filter(i=>EC.name(CDB,i).toLowerCase().includes(invQ.toLowerCase()));
  const srt={new:(a,b)=>b.at-a.at,val:(a,b)=>val(b)-val(a),rar:(a,b)=>CDB.items[b.k].t-CDB.items[a.k].t||val(b)-val(a),flt:(a,b)=>a.f-b.f}[invSort];
  list=[...list].sort((a,b)=>(!!equippedTeam(b))-(!!equippedTeam(a))||srt(a,b));
  const cases=invTab==='all'||invTab==='c'?ECO.cases.filter(c=>!invQ||(CDB.cases.find(x=>x.id===c.c)||{n:''}).n.toLowerCase().includes(invQ.toLowerCase())):[];
  const stacks=invTab==='tu'?list.map(i=>[i]):invStack(list);
  const tiles=[...cases.map(invCaseTile),...stacks.map(g=>invTile(g[0],g.length)),...(invTab==='k'||invTab==='tu'||invW?[]:ext.map(invExtTile))].filter(Boolean);
  const seg=(k,lbl)=>`<div class="csi-slot"><span>${lbl}</span><div>${SLOT_PAIRS[k].map(w=>`<button class="${LOAD.pref[k]===w?'on':''}" data-slot="${k}:${w}">${escA((weaponOf(w)||{name:w}).name)}</button>`).join('')}</div></div>`;
  const pages=Math.max(1,Math.ceil(tiles.length/INV_PAGE));invPage=Math.min(invPage,pages-1);
  const pageTiles=tiles.slice(invPage*INV_PAGE,(invPage+1)*INV_PAGE);
  const empty=Array.from({length:Math.max(0,INV_PAGE-pageTiles.length)},()=>'<span class="csi-t empty"></span>').join('');
  const wk=ecoWeek(),pl=ME.plan||'free',totalCount=items.length+ECO.cases.length;
  el.innerHTML=`<div class="csi" style="--new:'${t('iv_new')}'">
    <div class="csi-top">
      <nav class="csi-main"><button class="on">${t('inv_title')}<span class="csi-cnt">${totalCount+SHOP.skins.length+(STEAMINV.items||[]).length}</span></button></nav>
      <div class="csi-top-r" style="display:flex;align-items:center;gap:12px">
        ${ME.dev?`<button type="button" class="btn primary sm cs-dev-pack-btn" data-dev-pack title="Obtenir 50 caisses (Pack Développeur)">${t('co_dev_btn')}</button>`:''}
        <div class="csi-kpi"><span>${t('inv_value')}</span><b>${tcHTML(total)}</b></div>
      </div>
    </div>
    ${slotsHTML()}
    <div class="csi-bar">
      <div class="csi-cats">${[['all','it_all'],['w','it_w'],['k','it_k'],['c','it_c'],['tu','it_tu'],['co','it_co']].map(([k,l])=>`<button class="${invTab===k?'on':''}" data-itab="${k}">${t(l)}</button>`).join('')}</div>
      <div class="csi-tools"><select id="invW" title="${t('iv_wtype')}"><option value="">${t('iv_wall')}</option>${[['pistol','cat_pistol'],['smg','cat_smg'],['rifle','cat_rifle'],['heavy','cat_heavy'],['knife','cat_knife'],['gloves','cat_gloves']].map(([k,l])=>`<option value="cat:${k}" ${invW==='cat:'+k?'selected':''}>${t(l)}</option>`).join('')}<optgroup label="${t('iv_wone')}">${wpnNames.map(n=>`<option value="${escA(n)}" ${invW===n?'selected':''}>${escA(n)}</option>`).join('')}</optgroup></select><input type="text" id="invQ" placeholder="${t('mk_search')}" value="${escA(invQ)}"><select id="invSort">${[['new','so_new'],['val','so_val'],['rar','so_rar'],['flt','so_flt']].map(([k,l])=>`<option value="${k}" ${invSort===k?'selected':''}>${t(l)}</option>`).join('')}</select></div>
    </div>
    ${invTab==='c'&&ME.dev?`<div class="cs-dev-box"><span class="badge dev">DEV</span><div class="cs-dev-box-txt"><b>Mode Développeur Actif</b> : Vous disposez de l'accès direct aux caisses de test.</div><button type="button" class="btn primary sm cs-dev-pack-btn" data-dev-pack>${t('co_dev_btn')}</button></div>`:''}
    ${ECO.pending.length?`<div class="inv-pend">${ECO.pending.map(p=>`<div class="pend"><span class="it-im sm">${imgTag(EC.img(CDB,p.k))}</span><span><b>${escA(EC.name(CDB,{k:p.k,st:false}))}</b><small>${t('src_'+p.src)}</small></span><button class="btn primary sm" data-pend="${p.id}">${t('dr_choose')}</button></div>`).join('')}</div>`:''}
    ${STEAMINV.private?`<div class="csi-note">${t('iv_steam_priv')}</div>`:''}
    ${invTab==='tu'?tuPanel():''}
    ${tiles.length?`<div class="csi-grid">${pageTiles.join('')}${empty}</div>`:`<div class="csi-empty">${t('inv_empty')}</div>`}
    <div class="csi-foot"><span class="csi-week">${t('dr_week',{c:wk.cases,cm:EC.DROP.caseWeek[pl],i:wk.items,im:EC.DROP.itemWeek[pl]})}${hasPlan('plus')?'':` · <button class="link" data-go="premium">${t('f_drop_plus')}</button>`}</span>
      <div class="csi-pg"><button data-ipg="-1" ${invPage?'':'disabled'} aria-label="‹">‹</button><span>${t('iv_page',{p:invPage+1,n:pages})}</span><button data-ipg="1" ${invPage<pages-1?'':'disabled'} aria-label="›">›</button></div></div>
    <div class="csi-menu" id="invMenu" hidden></div></div>`;
  let ch=false;ECO.items.forEach(i=>{if(i.new){i.new=false;ch=true}});ECO.cases.forEach(c=>{if(c.new){c.new=false;ch=true}});if(ch)ecoSave();
}
function invOpenMenu(tile){
  const m=$('#invMenu');if(!m)return;
  const id=tile.dataset.iv,cid=tile.dataset.ivc;
  let html;
  if(cid)html=`<button data-ivm="open">${t('iv_open')}</button>`;
  else{const i=invFind(id);if(!i)return;if(i.ext){toast(t('iv_steam_new'));return}const W=itemW(i),eq=equippedTeam(i);
    const equip=!W||i.listed?'':eq?`<button data-ivm="unequip">${t('iv_unequip')}</button>`
      :W.team==='both'?`<button data-ivm="eq_both">${t('iv_eq_both')}</button><button data-ivm="eq_T">${t('iv_eq_T')}</button><button data-ivm="eq_CT">${t('iv_eq_CT')}</button>`
      :`<button data-ivm="eq_both">${t('iv_equip')}</button>`;
    const custom=W&&!i.listed&&(canSticker(W)||W.cat!=='gloves')?`<button data-ivm="custom">${t('iv_custom')}</button>`:'';
    const depCo=(ECO.containers&&ECO.containers.length&&!i.listed&&!i.virtual&&!i.ext)?`<button data-ivm="deposit_co">${t('iv_deposit_co')}</button>`:'';
    html=equip+custom+(i.virtual?'':`<button data-ivm="inspect">${t('iv_inspect')}</button>`)+depCo+(i.virtual?'':`${i.listed?`<button data-ivm="details">${t('i_unlist')}</button>`:`<button data-ivm="sell">${t('iv_sell')}</button><button data-ivm="quick">${t('iv_quick')}</button>`}`)}
  invMenu={id,cid};m.innerHTML=html;m.hidden=false;
  const r=tile.getBoundingClientRect(),host=$('.csi').getBoundingClientRect();
  m.style.left=Math.min(r.left-host.left+r.width*.5,host.width-200)+'px';m.style.top=(r.bottom-host.top-6)+'px';
}
function promptDepositContainer(itemId){
  const cs=ECO.containers||[];
  if(!cs.length)return toast(t('co_empty'));
  const opts=cs.map((c,i)=>`${i+1}. ${c.name} (${c.count||0}/1000)`).join('\n');
  const sel=prompt(`Choisissez un conteneur pour ranger ce skin :\n${opts}\n\nEntrez le numéro (1-${cs.length}) :`,'1');
  if(!sel)return;
  const idx=+sel-1;
  if(cs[idx]){
    seContainerDeposit(cs[idx].id,[itemId]).then(()=>renderInventory());
  }
}
const invCloseMenu=()=>{const m=$('#invMenu');if(m)m.hidden=true;invMenu=null};
document.addEventListener('click',e=>{
  const a=e.target.closest('#inventory [data-itab]');if(a){invTab=a.dataset.itab;invPage=0;return renderInventory()}
  const pg=e.target.closest('#inventory [data-ipg]');if(pg){invPage+=+pg.dataset.ipg;return renderInventory()}
  const sl=e.target.closest('#inventory [data-slot]');if(sl){const [k,w]=sl.dataset.slot.split(':');LOAD.pref={...LOAD.pref,[k]:w};saveLoad();toast(t('iv_slot_hint')+' : '+((weaponOf(w)||{}).name||w));return renderInventory()}
  if(e.target.closest('#inventory [data-ivagents]'))return agOpen();
  const mi=e.target.closest('#invMenu [data-ivm]');
  if(mi&&invMenu){const {id,cid}=invMenu,act=mi.dataset.ivm;invCloseMenu();
    if(act==='open')return openCaseModal(cid);
    const i=invFind(id);if(!i)return;
    if(act.startsWith('eq_'))return invEquip(i,act.slice(3));
    if(act==='unequip')return invUnequip(i);
    if(act==='custom')return custOpen(i);
    if(act==='deposit_co'){
      if(ECO.containers.length===1)return seContainerDeposit(ECO.containers[0].id,[id]).then(()=>renderInventory());
      return promptDepositContainer(id);
    }
    openItem(id);
    const btn=act==='sell'?'[data-isell]':act==='quick'?'[data-iquick]':null;
    if(btn)$('#itemBody '+btn)?.click();
    return}
  const tile=e.target.closest('#inventory .csi-t:not(.empty)');if(tile)return invTab==='tu'?tuToggle(tile.dataset.iv):invOpenMenu(tile);
  if(e.target.closest('#inventory [data-tusign]'))return tuSign();
  if(e.target.closest('#inventory [data-tuclear]')){TU=[];return renderInventory()}
  if(!e.target.closest('#invMenu'))invCloseMenu();
  const it=e.target.closest('[data-item]');if(it&&!e.target.closest('#mkBody'))return openItem(it.dataset.item);
  const cs=e.target.closest('[data-case]');if(cs)return openCaseModal(cs.dataset.case);
  const pd=e.target.closest('[data-pend]');if(pd)return chooseWear(pd.dataset.pend);
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')invCloseMenu()});
document.addEventListener('input',e=>{if(e.target.id==='invQ'){invQ=e.target.value;invPage=0;const p=e.target.selectionStart;renderInventory();const q=$('#invQ');q.focus();q.setSelectionRange(p,p)}});
document.addEventListener('change',e=>{if(e.target.id==='invSort'){invSort=e.target.value;invPage=0;renderInventory()}if(e.target.id==='invW'){invW=e.target.value;invPage=0;renderInventory()}});
function invStack(list){
  const g=new Map(),out=[];
  for(const i of list){const k=i.virtual||equippedTeam(i)?'u:'+i.id:i.k+'|'+(i.st?1:0);if(g.has(k))g.get(k).push(i);else{const a=[i];g.set(k,a);out.push(a)}}
  return out;
}

const TU_MAX=10;
const tuCase=i=>i.c||(CDB.cases.find(c=>(c.c||[]).includes(i.k))||{}).id||null;
function tuOk(i){
  const it=CDB.items[i.k];
  if(!it||i.virtual||i.listed||equippedTeam(i)||it.t>2||!tuCase(i))return false;
  const f=TU.length&&ECO.items.find(x=>x.id===TU[0]);
  return !f||(CDB.items[f.k].t===it.t&&!!f.st===!!i.st);
}
const tuItems=()=>TU.map(id=>ECO.items.find(x=>x.id===id)).filter(Boolean);
function tuToggle(id){
  const k=TU.indexOf(id);
  if(k>=0)TU.splice(k,1);
  else{const i=ECO.items.find(x=>x.id===id);if(!i||!tuOk(i))return toast(t('tu_bad'));if(TU.length>=TU_MAX)return toast(t('tu_full'));TU.push(id)}
  beep(660,.04);renderInventory();
}
function tuOdds(sel){
  const out={};if(!sel.length)return out;
  const t0=CDB.items[sel[0].k].t;let n=0;
  for(const i of sel){
    const C=CDB.cases.find(c=>c.id===tuCase(i)),pool=C?(C.c||[]).filter(k=>CDB.items[k]&&CDB.items[k].t===t0+1):[];
    if(!pool.length)continue;n++;
    for(const k of pool)out[k]=(out[k]||0)+1/pool.length;
  }
  for(const k in out)out[k]/=n;
  return out;
}
const tuWear=sel=>sel.reduce((s,i)=>{const it=CDB.items[i.k],r=(it.mx-it.mn)||1;return s+Math.min(1,Math.max(0,(i.f-it.mn)/r))},0)/sel.length;
function tuPanel(){
  const sel=tuItems(),odds=tuOdds(sel),ks=Object.keys(odds).sort((a,b)=>odds[b]-odds[a]),w=sel.length?tuWear(sel):0;
  const slots=Array.from({length:TU_MAX},(_,i)=>{const x=sel[i];return x?`<span class="tu-slot full" style="--rc:${EC.RARITY[CDB.items[x.k].t].c}">${imgTag(EC.img(CDB,x.k))}</span>`:'<span class="tu-slot"></span>'}).join('');
  const outc=ks.slice(0,8).map(k=>{const it=CDB.items[k],f=it.mn+w*(it.mx-it.mn);return `<div class="tu-out" style="--rc:${EC.RARITY[it.t].c}"><span class="tu-im">${imgTag(EC.img(CDB,k))}</span><span><b>${escA(EC.name(CDB,{k,st:sel[0]&&sel[0].st}))}</b><small>${EC.wearOf(f).n} · ${f.toFixed(4)}</small></span><em>${(odds[k]*100).toFixed(1)} %</em></div>`}).join('');
  return `<div class="tu-panel"><div class="tu-h"><b>${t('it_tu')}</b><span>${t('tu_hint')}</span></div>
    <div class="tu-slots">${slots}</div>
    ${ks.length?`<div class="tu-odds"><small>${t('tu_odds')}${ks.length>8?` (${ks.length})`:''}</small>${outc}</div>`:''}
    <div class="tu-act"><button class="btn primary" data-tusign ${sel.length===TU_MAX?'':'disabled'}>${sel.length===TU_MAX?t('tu_sign'):t('tu_need',{n:TU_MAX-sel.length})}</button>${sel.length?`<button class="btn ghost" data-tuclear>${t('tu_clear')}</button>`:''}</div></div>`;
}
function tuSign(){
  const sel=tuItems();if(sel.length<TU_MAX)return toast(t('tu_need',{n:TU_MAX-sel.length}));
  const odds=tuOdds(sel),ks=Object.keys(odds);if(!ks.length)return toast(t('tu_bad'));
  let r=Math.random(),k=ks[ks.length-1];for(const x of ks){r-=odds[x];if(r<=0){k=x;break}}
  const it=CDB.items[k],f=+(it.mn+tuWear(sel)*(it.mx-it.mn)).toFixed(6),C=CDB.cases.find(c=>(c.c||[]).includes(k));
  const ids=new Set(TU);ECO.items=ECO.items.filter(x=>!ids.has(x.id));TU=[];
  const x=addItem({k,f,s:Math.floor(Math.random()*1000),st:!!sel[0].st,c:C?C.id:null},'tradeup');
  beep(784,.1);beep(1047,.14,.1);beep(1319,.2,.22);
  toast(t('tu_done',{x:EC.name(CDB,x)}));
  invTab='all';invSort='new';invPage=0;renderInventory();refreshEco();
  if(typeof openItem==='function')openItem(x.id);
}

let ITEM_OPEN=null;
function openItem(id){
  const i=ECO.items.find(x=>x.id===id);if(!i)return;ITEM_OPEN=id;
  const it=CDB.items[i.k],pr=EC.price(CDB,i),W=itemW(i),C=i.c&&CDB.cases.find(c=>c.id===i.c);
  const row=(l,v)=>`<div class="ir"><span>${l}</span><b>${v}</b></div>`;
  const eq=W&&LOAD.w[W.id]&&LOAD.w[W.id].iid===i.id;
  $('#itemBody').innerHTML=`<div class="io-top" style="--rc:${EC.RARITY[it.t].c}"><div class="io-im">${imgTag(EC.img(CDB,i.k))}</div>
      <div class="io-meta"><span class="io-r">${EC.RARITY[it.t].n}${i.st?' · StatTrak™':''}</span><h3>${escA(EC.name(CDB,i))}</h3><span class="io-w">${pr.wear.n}</span>
      <div class="io-v">${tcHTML(pr.v)}<small>${t('i_val')}</small></div></div></div>
    <div class="io-f"><div class="ir"><span>${t('i_float')}</span><b class="mono">${i.f.toFixed(6)}</b></div>${floatBar(i)}</div>
    <div class="io-grid"><div>${row(t('i_seed'),`#${i.s}${pr.pattern.label?` · <span class="pt-b ${pr.pattern.tier||''}">${escA(pr.pattern.label)}</span>`:''}`)}${row(t('i_src'),t('src_'+i.src)+(C?' · '+escA(C.n):''))}</div></div>
    <div class="io-act">${i.listed?`<button class="btn" data-unlist="${i.id}">${t('i_unlist')}</button>`
      :`${W?`<button class="btn primary" data-ieq="${i.id}" ${eq?'disabled':''}>${eq?t('equipped'):t('i_equip')}</button>`:''}<button class="btn" data-isell="${i.id}">${t('i_sell')}</button><button class="btn ghost" data-iquick="${i.id}" title="${t('i_quick_t',{p:ECO_CFG.quick*100})}">${t('i_quick',{x:tcHTML(Math.floor(pr.v*ECO_CFG.quick))})}</button>${(ECO.containers&&ECO.containers.length&&!i.listed)?`<button type="button" class="btn sm" data-co-item-dep="${i.id}">${t('iv_deposit_co')}</button>`:''}`}</div>
    <div id="sellBox"></div>`;
  openModal('itemModal');
}
function equipItem(i){
  const W=itemW(i),it=CDB.items[i.k];if(!W)return;
  const prev=LOAD.w[W.id]||{};
  LOAD.w[W.id]={p:it.p,f:i.f,seed:i.s,st:i.st,tag:prev.tag||'',team:prev.team||'both',stk:Array.isArray(prev.stk)?prev.stk:Array(STK_SLOTS).fill(null),iid:i.id};
  saveLoad();toast(t('equipped_toast',{x:EC.name(CDB,i)}));
}
function unequipIf(i){const W=itemW(i);if(W&&LOAD.w[W.id]&&LOAD.w[W.id].iid===i.id){delete LOAD.w[W.id];saveLoad()}}
function removeItem(i){ECO.items=ECO.items.filter(x=>x.id!==i.id);unequipIf(i);ecoSave()}
document.addEventListener('click',e=>{
  const q=e.target.closest('[data-iquick]');if(q){const i=ECO.items.find(x=>x.id===q.dataset.iquick);if(!i)return;const n=Math.floor(val(i)*ECO_CFG.quick);
    confirmBox(t('i_quick',{x:''}).replace(' · ',''),`${escA(EC.name(CDB,i))} → ${n.toLocaleString(LOC[lang])} TC`,'OK',t('cancel'),()=>{removeItem(i);SHOP.coins+=n;saveShop();renderWallet();closeModal('itemModal');toast(t('coins_added',{n}));beep(988,.08);refreshEco()});return}
  const eq=e.target.closest('[data-ieq]');if(eq){const i=ECO.items.find(x=>x.id===eq.dataset.ieq);closeModal('caseModal');closeModal('itemModal');invEquip(i);return}
  const sl=e.target.closest('[data-isell]');if(sl){const i=ECO.items.find(x=>x.id===sl.dataset.isell),v=val(i);
    $('#sellBox').innerHTML=`<div class="sell-box"><label>${t('sell_price')}</label><div class="sell-row"><input type="number" id="sellP" min="${ECO_CFG.minList}" value="${v}"><button class="btn primary" data-sellgo="${i.id}">${t('sell_btn')}</button></div>
      <div class="m-hint" id="sellNet">${t('sell_sugg',{x:tcHTML(v)})} · ${t('sell_net',{x:tcHTML(Math.floor(v*(1-ECO_CFG.fee))),p:ECO_CFG.fee*100})}</div></div>`;$('#sellP').focus();return}
  const sg=e.target.closest('[data-sellgo]');if(sg){const i=ECO.items.find(x=>x.id===sg.dataset.sellgo),p=Math.max(ECO_CFG.minList,Math.round(+$('#sellP').value||0));
    i.listed={price:p,at:Date.now()};unequipIf(i);ECO.listings.unshift(i.id);ecoSave();closeModal('itemModal');toast(t('sell_ok'));refreshEco();return}
  const ul=e.target.closest('[data-unlist]');if(ul){const i=ECO.items.find(x=>x.id===ul.dataset.unlist);delete i.listed;ECO.listings=ECO.listings.filter(x=>x!==i.id);ecoSave();openItem(i.id);refreshEco();return}
});
document.addEventListener('input',e=>{if(e.target.id==='sellP'){const p=+e.target.value||0,i=ECO.items.find(x=>x.id===ITEM_OPEN),v=i?val(i):0;$('#sellNet').innerHTML=`${t('sell_sugg',{x:tcHTML(v)})} · ${t('sell_net',{x:tcHTML(Math.floor(p*(1-ECO_CFG.fee))),p:ECO_CFG.fee*100})}`}});

Object.assign(I18N.fr,{c_unlock:'Déverrouiller le conteneur',c_recv:'Vous avez reçu',c_unlocking:'Déverrouillage…',c_val_est:'Valeur estimée'});
Object.assign(I18N.en,{c_unlock:'Unlock container',c_recv:'You received',c_unlocking:'Unlocking…',c_val_est:'Estimated value'});
Object.assign(I18N.ru,{c_unlock:'Открыть контейнер',c_recv:'Вы получили',c_unlocking:'Открытие…',c_val_est:'Оценочная стоимость'});
let CASE_OPEN=null,spinning=false,CASE_SKIP=null;
const CS_LEN=36,CS_WIN=28,CS_DUR=5000;
const csTile=k=>{
  if(k==='__rare')return `<div class="cs-rt rare" style="--rc:#e4ae39"><div class="cs-rt-im"><span class="rare-q">★</span></div><div class="cs-rt-n"><small>${t('c_rare')}</small><b>★ Special Item ★</b></div></div>`;
  const it=CDB.items[k];
  return `<div class="cs-rt t${it.t}" style="--rc:${EC.RARITY[it.t].c}"><div class="cs-rt-im">${imgTag(EC.img(CDB,k)).replace(' loading="lazy"','')}</div><div class="cs-rt-n"><small>${escA(it.w)}</small><b>${escA(it.n)}</b></div></div>`;
};
const sfxOn=()=>!(typeof SET!=='undefined'&&SET&&SET.notif&&!SET.notif.sounds);
function sfxBus(){
  try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch(e){return null}
  if(!AC.trBus){const c=AC.createDynamicsCompressor();c.threshold.value=-14;c.ratio.value=6;c.connect(AC.destination);AC.trBus=c}
  return AC;
}
function sTone(f,at,d,{type='sine',vol=.06,to=0,att=.008}={}){
  const ac=sfxBus();if(!ac)return;const t=ac.currentTime+at,o=ac.createOscillator(),g=ac.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+d);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g).connect(ac.trBus);o.start(t);o.stop(t+d+.05);
}
function sNoise(at,d,{vol=.06,f0=400,f1=4000,q=.8,type='bandpass',peak=.3}={}){
  const ac=sfxBus();if(!ac)return;const t=ac.currentTime+at,n=ac.createBufferSource(),b=ac.createBuffer(1,Math.ceil(ac.sampleRate*d),ac.sampleRate),c=b.getChannelData(0);
  for(let i=0;i<c.length;i++)c[i]=Math.random()*2-1;
  const f=ac.createBiquadFilter(),g=ac.createGain();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+d);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+d*peak);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  n.buffer=b;n.connect(f).connect(g).connect(ac.trBus);n.start(t);n.stop(t+d);
}
const sChord=(fs,at,d,o={})=>fs.forEach(f=>{sTone(f,at,d,o);sTone(f*1.004,at,d,{...o,vol:(o.vol||.03)*.6})});
const sSparkle=(n,at,span,base=2400)=>{for(let k=0;k<n;k++)sTone(base+Math.random()*2200,at+Math.random()*span,.12+Math.random()*.2,{type:'sine',vol:.018})};
function caseUnlockSfx(){
  if(!sfxOn())return;
  sTone(520,0,.08,{type:'triangle',vol:.15,to:140,att:.002});
  sTone(780,.025,.08,{type:'sine',vol:.12,to:260,att:.002});
  sNoise(.02,.12,{vol:.09,f0:1900,f1:350,q:2.5,peak:.05});
  sTone(160,.06,.22,{type:'triangle',vol:.18,to:40,att:.005});
}
function caseTickSfx(intensity=1){
  if(!sfxOn())return;
  const ac=sfxBus();if(!ac)return;
  const t=ac.currentTime,dur=0.016;
  const b=ac.createBuffer(1,Math.ceil(ac.sampleRate*dur),ac.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(d.length*0.22));
  const noise=ac.createBufferSource();noise.buffer=b;
  const filter=ac.createBiquadFilter();filter.type='bandpass';filter.frequency.setValueAtTime(1150+Math.random()*250,t);filter.Q.value=4.2;
  const gain=ac.createGain(),vol=Math.min(0.24,0.05+0.12*Math.max(0,intensity));
  gain.gain.setValueAtTime(vol,t);gain.gain.exponentialRampToValueAtTime(0.001,t+dur);
  noise.connect(filter).connect(gain).connect(ac.trBus);noise.start(t);
  const osc=ac.createOscillator(),og=ac.createGain();osc.type='triangle';
  osc.frequency.setValueAtTime(220+Math.random()*40,t);osc.frequency.exponentialRampToValueAtTime(50,t+0.025);
  og.gain.setValueAtTime(vol*0.6,t);og.gain.exponentialRampToValueAtTime(0.001,t+0.025);
  osc.connect(og).connect(ac.trBus);osc.start(t);osc.stop(t+0.03);
}
function caseSuspense(tier){
  if(!sfxOn())return;
  sNoise(0,1.3,{vol:tier===4?.08:.06,f0:300,f1:6000,q:2,peak:.95});
  sTone(110,0,1.3,{type:'sawtooth',vol:.03,to:tier===4?660:440,att:.9});
  sTone(220,.2,1.1,{type:'triangle',vol:.035,to:tier===4?1320:880,att:.8});
}
function caseRevealSfx(tier){
  if(!sfxOn())return;
  sTone(150,0,.35,{type:'triangle',vol:.25,to:38,att:.003});
  sNoise(0,.55,{vol:.07,f0:250,f1:3800});
  if(tier<=1){sTone(784,.05,.3,{type:'triangle',vol:.05});sTone(1175,.13,.4,{type:'triangle',vol:.045});return}
  if(tier===2){[659,880,1319,1760].forEach((f,k)=>sTone(f,.04+k*.07,.45,{type:'triangle',vol:.045}));sSparkle(6,.25,.6);return}
  const gold=tier===4;
  sTone(gold?170:150,0,gold?1.1:.8,{vol:.32,to:38});
  sNoise(0,gold?.9:.6,{vol:.16,f0:900,f1:60,type:'lowpass',q:.5,peak:.02});
  const arp=gold?[523,659,784,1047,1319,1568,2093]:[440,554,659,880,1109,1319];
  arp.forEach((f,k)=>sTone(f,.12+k*.055,.5,{type:'triangle',vol:.05}));
  const ch=gold?[523,659,784,1047,1568]:[440,554,659,880];
  sChord(ch,.12+arp.length*.055,gold?2.8:1.8,{type:'sine',vol:.035,att:.08});
  sSparkle(gold?22:10,.35,gold?2.4:1.3,gold?2800:2300);
  if(gold){sTone(65,.05,2.2,{vol:.12,att:.05});sNoise(.5,2.2,{vol:.03,f0:5000,f1:9000,q:1,peak:.2})}
}
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function caseParticles(cv,color,tier){
  if(reduceMotion())return;
  const dpr=Math.min(2,devicePixelRatio||1),W=cv.clientWidth,H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;
  const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
  const cx=W/2,cy=H*.42,gold=tier===4,P=[];
  const cols=gold?['#ffd76a','#e4ae39','#fff4c8','#ffffff']:tier===3?[color,'#ff8a7a','#ffd0c8','#ffffff']:[color,'#ffffff'];
  const burst=(n,sp)=>{for(let k=0;k<n;k++){const a=Math.random()*Math.PI*2,v=sp*(.35+Math.random());P.push({x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1.5,l:1,d:.008+Math.random()*.012,s:1+Math.random()*2.4,c:cols[k%cols.length],star:gold&&Math.random()<.3})}};
  burst([18,24,45,150,230][tier],tier>=3?13:8);
  if(tier>=3)setTimeout(()=>burst(gold?120:60,9),260);
  let t0=performance.now(),emberEnd=gold?4200:tier===3?2200:0;
  const star=(x,y,r)=>{ctx.beginPath();for(let k=0;k<8;k++){const rr=k%2?r*.35:r,a=k*Math.PI/4;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}ctx.closePath();ctx.fill()};
  const step=now=>{
    if(!cv.isConnected)return;
    if(now-t0<emberEnd&&Math.random()<(gold?.7:.35))P.push({x:Math.random()*W,y:-6,vx:(Math.random()-.5)*.6,vy:.6+Math.random()*1.4,l:1,d:.004+Math.random()*.004,s:1+Math.random()*1.8,c:cols[Math.floor(Math.random()*cols.length)],star:gold&&Math.random()<.25,fall:1});
    ctx.clearRect(0,0,W,H);ctx.globalCompositeOperation='lighter';
    for(let k=P.length-1;k>=0;k--){
      const p=P[k];p.x+=p.vx;p.y+=p.vy;if(!p.fall){p.vx*=.965;p.vy=p.vy*.965+.12}p.l-=p.d;
      if(p.l<=0||p.y>H+10){P.splice(k,1);continue}
      ctx.globalAlpha=Math.min(1,p.l*1.4);ctx.fillStyle=ctx.strokeStyle=p.c;
      if(p.star)star(p.x,p.y,p.s*2.2);
      else if(p.fall){ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,7);ctx.fill()}
      else{ctx.lineWidth=p.s;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*2.2,p.y-p.vy*2.2);ctx.stroke()}
    }
    if(P.length||now-t0<emberEnd)requestAnimationFrame(step);else ctx.clearRect(0,0,W,H);
  };
  requestAnimationFrame(step);
}
function openCaseModal(cid){
  const cs=ECO.cases.find(x=>x.id===cid);if(!cs)return;CASE_OPEN=cid;spinning=false;
  const C=CDB.cases.find(c=>c.id===cs.c);
  const by=[3,2,1,0].map(tt=>C.c.filter(k=>CDB.items[k].t===tt));
  const stage=$('#csStage');if(stage)stage.classList.remove('revealed');
  $('#caseBody').innerHTML=`<div class="cs-stage" id="csStage">
      <div class="cs-crate"><span class="it-im">${imgTag(EC.img(CDB,C.i))}</span><h3>${escA(C.n)}</h3><small>${t('c_free')}</small></div>
    </div>
    <div class="cs-act" id="csAct"><button class="btn primary big cs-unlock" data-spin>${t('c_unlock')}</button></div>
    <div class="cs-cont"><div class="cs-ct"><b>${t('c_contains')}</b><small>${t('c_odds')} : ${EC.ODDS.map((o,i)=>`<span style="color:${EC.RARITY[i].c}">${(o*100).toFixed(2)} %</span>`).join(' · ')}</small></div>
    <div class="cs-grid">${by.flat().map(csTile).join('')}${csTile('__rare')}</div></div>`;
  openModal('caseModal');
}
function spinCase(){
  if(spinning)return;const cs=ECO.cases.find(x=>x.id===CASE_OPEN);if(!cs)return;spinning=true;
  const C=CDB.cases.find(c=>c.id===cs.c);
  caseUnlockSfx();
  const win=EC.openCase(CDB,C.id);
  ECO.cases=ECO.cases.filter(x=>x.id!==cs.id);const item=addItem(win,'case');refreshEco();
  const keys=EC.reel(CDB,C.id,win,Math.random,CS_LEN,CS_WIN);
  if(CDB.items[win.k].t===4)keys[CS_WIN]='__rare';
  const stage=$('#csStage');if(stage)stage.classList.remove('revealed');
  stage.innerHTML=`<div class="cs-reel" id="csReel"><div class="cs-strip" id="csStrip">${keys.map(csTile).join('')}</div><div class="cs-mark"><i class="cs-mark-t"></i><i class="cs-mark-line"></i><i class="cs-mark-b"></i></div></div>`;
  $('#csAct').innerHTML=`<button class="btn ghost" data-spinskip>${t('c_skip')}</button>`;
  const strip=$('#csStrip'),reelEl=$('#csReel'),tiles=strip.children;
  const TW=tiles[1].offsetLeft-tiles[0].offsetLeft,box=reelEl.clientWidth;
  const target=CS_WIN*TW+tiles[0].offsetWidth*(.24+Math.random()*.52)-box/2;
  const ease=p=>1-Math.pow(1-p,3.4);
  let t0=null,last=-1,raf=0;
  const place=x=>{strip.style.transform=`translate3d(${-x}px,0,0)`};
  const markEl=$('#csReel .cs-mark');
  const finish=()=>{
    if(!spinning)return;spinning=false;CASE_SKIP=null;cancelAnimationFrame(raf);place(target);
    const tier=CDB.items[item.k].t;
    tiles[CS_WIN].classList.add('win');reelEl.classList.add('done');
    if(tier>=2){reelEl.classList.add('hype');caseSuspense(tier)}
    else sTone(520,0,.14,{type:'triangle',vol:.08,to:260});
    setTimeout(()=>{if($('#csReel')===reelEl)showCaseResult(item)},tier>=2?1150:700);
  };
  const frame=ts=>{
    if(!spinning)return;
    if(!$('#caseModal').classList.contains('on')){finish();return}
    if(t0===null)t0=ts;
    const p=Math.min(1,(ts-t0)/CS_DUR),x=target*ease(p);place(x);
    const idx=Math.floor((x+box/2)/TW);
    if(idx!==last){
      last=idx;
      caseTickSfx(1-p);
      if(markEl){markEl.classList.remove('tick');void markEl.offsetWidth;markEl.classList.add('tick')}
    }
    if(p>=1)return finish();
    raf=requestAnimationFrame(frame);
  };
  CASE_SKIP=finish;place(0);raf=requestAnimationFrame(frame);
}
function showCaseResult(i){
  const it=CDB.items[i.k],pr=EC.price(CDB,i),R=EC.RARITY[it.t],rare=it.t>=3;
  caseRevealSfx(it.t);
  const more=ECO.cases.find(c=>c.c===i.c);
  const W=itemW(i);
  const stage=$('#csStage');if(stage)stage.classList.add('revealed');
  stage.innerHTML=`<div class="cs-reveal t${it.t} ${rare?'rare':''} ${it.t===4?'gold':''}" style="--rc:${R.c}">
      <i class="cs-flash"></i>${it.t>=2?'<i class="cs-ring"></i>':''}${it.t>=3?'<i class="cs-ring r2"></i>':''}<canvas class="cs-fx"></canvas>
      <div class="cs-rv-glow"></div>
      <div class="cs-rv-h">${t('c_recv')}</div>
      <div class="cs-rv-im">${rare?'<i class="cs-rays"></i>':''}${imgTag(EC.img(CDB,i.k))}</div>
      ${i.st?`<div class="cs-st-badge"><span class="cs-st-lbl">StatTrak™</span><span class="cs-st-box"><span class="cs-st-digits">000000</span></span></div>`:''}
      <div class="cs-rv-name">${it.t===4?'<span class="cs-star">★</span> ':''}${escA(it.w)}${it.n!=='Vanilla'?` <span class="cs-sep">|</span> <b>${escA(it.n)}</b>`:''}${it.ph?` <small class="cs-ph">(${escA(it.ph)})</small>`:''}</div>
      <div class="cs-rv-r"><span style="background:${R.c}">${R.n}</span></div>
      <div class="cs-rv-float-card">
        <div class="cs-rv-fmeta">
          <span class="cs-wear-name">${pr.wear.n}</span>
          <span class="cs-float-val mono">${i.f.toFixed(6)}</span>
          <span class="cs-seed-val">Pattern #${i.s}${pr.pattern.label?` · ${escA(pr.pattern.label)}`:''}</span>
        </div>
        <div class="cs-fbar-wrap">${floatBar(i)}</div>
      </div>
      <div class="cs-rv-val"><span class="lbl">${t('c_val_est')}</span> <b class="val">${tcHTML(pr.v)}</b></div>
    </div>`;
  caseParticles($('#csStage .cs-fx'),R.c,it.t);
  if(rare&&!reduceMotion()){const m=$('#caseModal .cs-modal');m.classList.remove('shake','shake2');void m.offsetWidth;m.classList.add(it.t===4?'shake2':'shake')}
  const eqBtn=W?`<button class="btn primary" data-ieq="${i.id}"><svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" width="16" height="16" style="margin-right:6px"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M416 128L192 384l-96-96"/></svg>${t('i_equip')}</button>`:'';
  const againBtn=more?`<button class="btn ${W?'':'primary'}" data-case="${more.id}"><svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" width="16" height="16" style="margin-right:6px"><path d="M320 146s24.36-12-64-12a160 160 0 10160 160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 58l80 80-80 80"/></svg>${t('c_again')}</button>`
    :i.c?`<button class="btn ${W?'':'primary'}" data-csbuy="${i.c}" data-open="1"><svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" width="16" height="16" style="margin-right:6px"><path d="M320 146s24.36-12-64-12a160 160 0 10160 160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 58l80 80-80 80"/></svg>${t('c_rebuy',{x:casePrice(i.c).toLocaleString(LOC[lang])+' TC'})}</button>`:'';
  $('#csAct').innerHTML=`<div class="cs-btns">${eqBtn}<button class="btn" data-item="${i.id}">${t('iv_inspect')}</button>${againBtn}<button class="btn ghost" data-close>${t('c_keep')}</button></div>`;
}
document.addEventListener('click',e=>{if(e.target.closest('[data-spin]'))return spinCase();if(e.target.closest('[data-spinskip]')&&CASE_SKIP)CASE_SKIP()});

function grantSkin(k,src){
  if(hasPlan('premium')){const p={id:eid(),k,src,at:Date.now()};ECO.pending.push(p);ecoSave();chooseWear(p.id);return null}
  const i=addItem(EC.makeItem(CDB,k,Math.random,{st:false}),src);toast(t('bought_toast',{x:EC.name(CDB,i)}));refreshEco();return i;
}
function chooseWear(pid){
  const p=ECO.pending.find(x=>x.id===pid);if(!p)return;const it=CDB.items[p.k];
  $('#wearBody').innerHTML=`<div class="io-top" style="--rc:${EC.RARITY[it.t].c}"><div class="io-im">${imgTag(EC.img(CDB,p.k))}</div><div class="io-meta"><span class="io-r">${EC.RARITY[it.t].n}</span><h3>${escA(EC.name(CDB,{k:p.k,st:false}))}</h3><span class="io-w">${t('src_'+p.src)}</span></div></div>
    <p class="m-hint" style="margin:12px 0">${t('wc_sub')}</p>
    <div class="wc-grid">${EC.wearsFor(it).map(w=>{const ex={k:p.k,f:Math.min(it.mx,Math.max(it.mn,(Math.max(w.a,it.mn)+Math.min(w.b,it.mx))/2)),s:0,st:false};return `<button class="wc" data-wear="${pid}:${w.k}"><b>${w.n}</b><small>${Math.max(w.a,it.mn).toFixed(2)} – ${Math.min(w.b,it.mx).toFixed(2)}</small><span>≈ ${tcHTML(EC.price(CDB,ex).v)}</span></button>`}).join('')}</div>`;
  openModal('wearModal');
}
document.addEventListener('click',e=>{const w=e.target.closest('[data-wear]');if(!w)return;const [pid,wk]=w.dataset.wear.split(':'),p=ECO.pending.find(x=>x.id===pid);if(!p)return;
  ECO.pending=ECO.pending.filter(x=>x.id!==pid);const i=addItem(EC.makeItem(CDB,p.k,Math.random,{st:false,wear:wk}),p.src);closeModal('wearModal');toast(t('bought_toast',{x:EC.name(CDB,i)}));refreshEco();openItem(i.id)});

(function rebuildPass(){
  const r=seeded(7777),pick1=a=>a[Math.floor(r()*a.length)];
  const recent=[...CDB.cases].sort((a,b)=>b.y-a.y).slice(0,12).map(c=>c.id);
  const tierKeys=tt=>[...new Set(CDB.cases.flatMap(c=>c.c))].filter(k=>CDB.items[k].t===tt);
  const bay=Object.keys(CDB.items).filter(k=>CDB.items[k].w==='Bayonet'&&CDB.items[k].t===4&&!CDB.items[k].ph);
  const night=bay.find(k=>CDB.items[k].n==='Night')||bay[0];
  PASS.length=0;
  for(let i=1;i<=PASS_TIERS;i++){
    const f=i%5===0?{type:'case',c:pick1(recent)}:i%7===0?{type:'skin',k:pick1(tierKeys(0))}:i%3===0?{type:'coins',n:60+i*4}:null;
    let p;
    if(i===30)p={type:'skin',k:night};
    else if(i===15)p={type:'agent',def:SKDB.agents[Math.floor(r()*SKDB.agents.length)].def};
    else if(i===29)p={type:'skin',k:pick1(tierKeys(3))};
    else if(i%2===0)p={type:'skin',k:pick1(tierKeys(i<=10?(i%4?0:1):i<=20?(i%4?1:2):2))};
    else p={type:'case',c:pick1(recent)};
    PASS.push({tier:i,f,p});
  }
})();
const _rewardHTML=rewardHTML;
rewardHTML=function(rw){
  if(rw.type==='case'){const C=CDB.cases.find(c=>c.id===rw.c);return C?`<span class="im">${imgTag(EC.img(CDB,C.i))}</span><span>${escA(C.n)}</span>`:''}
  if(rw.type==='skin'&&rw.k){const it=CDB.items[rw.k];return `<span class="im" style="box-shadow:inset 0 -3px 0 ${EC.RARITY[it.t].c}">${imgTag(EC.img(CDB,rw.k))}</span><span>${escA(EC.name(CDB,{k:rw.k,st:false}))}</span>`}
  return _rewardHTML(rw);
};
const _grant=grant;
grant=function(rw){
  if(rw.type==='case'){addCase(rw.c,'pass');const C=CDB.cases.find(c=>c.id===rw.c);toast(t('bought_toast',{x:C.n}));refreshEco();return}
  if(rw.type==='skin'&&rw.k){grantSkin(rw.k,'pass');return}
  return _grant(rw);
};

let LAST_DROPS=null;
function rollDrops(){
  const wk=ecoWeek(),pl=ME.plan||'free',d=EC.matchDrops(CDB,pl,wk),got={cases:[],items:[],pend:[]};
  d.cases.forEach(c=>{got.cases.push(addCase(c,'drop'));wk.cases++});
  d.items.forEach(it=>{wk.items++;
    if(hasPlan('premium')){const p={id:eid(),k:it.k,src:'drop',at:Date.now()};ECO.pending.push(p);got.pend.push(p)}
    else got.items.push(addItem(it,'drop'))});
  ecoSave();LAST_DROPS=got;
  [...got.cases.map(c=>CDB.cases.find(x=>x.id===c.c).n),...got.items.map(i=>EC.name(CDB,i)),...got.pend.map(p=>EC.name(CDB,{k:p.k,st:false}))].forEach(x=>notify('drop','n_drop',{x},'inventory'));
  return got;
}
function renderDropCard(){
  let el=$('#dropCard');if(!el){$('#reviewCard').insertAdjacentHTML('beforebegin','<div class="card" id="dropCard"></div>');el=$('#dropCard')}
  const g=LAST_DROPS;if(!g){el.hidden=true;return}el.hidden=false;
  const wk=ecoWeek(),pl=ME.plan||'free',n=g.cases.length+g.items.length+g.pend.length;
  const card=(rc,img,small,b,btn)=>({rc,img,small,b,btn});
  const list=[...g.cases.map(c=>{const C=CDB.cases.find(x=>x.id===c.c);return card('#e4ae39',EC.img(CDB,C.i),t('dr_case'),escA(C.n),`<button class="btn primary sm" data-case="${c.id}">${t('dr_open')}</button>`)}),
    ...g.items.map(i=>card(EC.RARITY[CDB.items[i.k].t].c,EC.img(CDB,i.k),`${t('dr_item')} · ${EC.wearOf(i.f).n}`,escA(EC.name(CDB,i)),`<button class="btn sm" data-item="${i.id}">${tcHTML(val(i))}</button>`)),
    ...g.pend.map(p=>card(EC.RARITY[CDB.items[p.k].t].c,EC.img(CDB,p.k),t('dr_item'),escA(EC.name(CDB,{k:p.k,st:false})),`<button class="btn primary sm" data-pend="${p.id}">${t('dr_choose')}</button>`))];
  const cards=list.map((c,i)=>`<div class="dr-c flip" style="--rc:${c.rc};animation-delay:${.25+i*.35}s"><span class="it-im">${imgTag(c.img)}</span><small>${c.small}</small><b>${c.b}</b>${c.btn}</div>`);
  el.innerHTML=`<div class="h3">${t('dr_title')} <span>${t('dr_week',{c:wk.cases,cm:EC.DROP.caseWeek[pl],i:wk.items,im:EC.DROP.itemWeek[pl]})}</span></div>
    ${n?`<div class="dr-row">${cards.join('')}</div>`
      :`<p class="m-hint" style="margin:0">${t('dr_none',{c:EC.DROP.caseWeek[pl],i:EC.DROP.itemWeek[pl],x:planName(pl)})}</p>`}`;
}
(()=>{const sm=simulateMatch;simulateMatch=function(){const r=sm.apply(this,arguments);try{rollDrops();renderDropCard()}catch(e){console.error(e)}return r}})();

let mkQ='',mkType='all',mkRar='-1',mkWear='all',mkSort='asc';
function marketList(){
  const day=Math.floor(Date.now()/864e5);
  if(!ECO.mk||ECO.mk.day!==day){
    const r=EC.mulberry(day*131+7),out=[];
    for(let n=0;n<54;n++){
      const C=CDB.cases[Math.floor(r()*CDB.cases.length)],roll=r(),tt=roll<.48?0:roll<.76?1:roll<.91?2:roll<.98?3:4;
      const pool=tt===4?(CDB.rare[C.r]||C.c):C.c.filter(k=>CDB.items[k].t===tt);if(!pool.length)continue;
      const it=EC.makeItem(CDB,pool[Math.floor(r()*pool.length)],r),v=EC.price(CDB,it).v;
      out.push({id:'m'+day+'_'+n,...it,price:Math.max(5,Math.round(v*(0.92+r()*0.3))),seller:NAMES[Math.floor(r()*NAMES.length)]+Math.floor(r()*99)});
    }
    ECO.mk={day,list:out};ECO.bought=[];ecoSave();
  }
  return ECO.mk.list.filter(x=>!ECO.bought.includes(x.id));
}
function marketHTML(){
  let L=marketList();
  if(mkQ)L=L.filter(x=>EC.name(CDB,x).toLowerCase().includes(mkQ.toLowerCase()));
  if(mkType!=='all')L=L.filter(x=>{const it=CDB.items[x.k];return mkType==='k'?(it.t===4&&!it.g):mkType==='g'?!!it.g:it.t<4});
  if(mkRar!=='-1')L=L.filter(x=>CDB.items[x.k].t===+mkRar);
  if(mkWear!=='all')L=L.filter(x=>EC.wearOf(x.f).k===mkWear);
  L.sort((a,b)=>mkSort==='asc'?a.price-b.price:mkSort==='desc'?b.price-a.price:a.f-b.f);
  const sel=(id,opts,cur)=>`<select id="${id}">${opts.map(([v,l])=>`<option value="${v}" ${String(cur)===String(v)?'selected':''}>${l}</option>`).join('')}</select>`;
  const card=x=>{const it=CDB.items[x.k],w=EC.wearOf(x.f),v=val(x),deal=x.price<v;
    return `<div class="it-card mk" style="--rc:${EC.RARITY[it.t].c}"><span class="it-im">${imgTag(EC.img(CDB,x.k))}</span>${x.st?'<span class="st-b">ST™</span>':''}${patBadge(x)}
      <b>${escA(EC.name(CDB,{...x,st:false}).replace('★ ',''))}</b><small>${wearShort[w.k]} · ${x.f.toFixed(4)} · #${x.s}</small>
      <small class="mk-s">${t('mk_seller')} : ${escA(x.seller)}</small>
      <div class="mk-f"><span class="it-pr ${deal?'deal':''}" title="${t('i_val')} : ${v}">${tcHTML(x.price)}</span><button class="btn primary sm" data-mkbuy="${x.id}">${t('mk_buy')}</button></div></div>`};
  const {ag}=featured();
  return `<div class="mk-tools"><input type="text" id="mkQ" placeholder="${t('mk_search')}" value="${escA(mkQ)}">
      ${sel('mkType',[['all',t('any')],['w',t('it_w')],['k',t('cat_knife')],['g',t('cat_gloves')]],mkType)}
      ${sel('mkRar',[['-1',t('r_any')],...EC.RARITY.map((r,i)=>[i,r.n])],mkRar)}
      ${sel('mkWear',[['all',t('w_any')],...EC.WEAR.map(w=>[w.k,w.n])],mkWear)}
      ${sel('mkSort',[['asc','Prix ↑'],['desc','Prix ↓'],['flt','Float ↑']],mkSort)}</div>
    ${L.length?`<div class="inv-grid">${L.map(card).join('')}</div>`:`<div class="card m-hint">${t('mk_none')}</div>`}
    <div class="sec-t" style="margin-top:22px">${t('mk_agents')}</div>
    <div class="sh-grid">${ag.map(a=>`<div class="item" style="--rc:${a.r}"><span class="im">${imgTag(a.img)}</span><div class="bd"><b>${escA(a.name.split('|')[0].trim())}</b><small>${t('r_agent')} · ${escA(a.rn)}</small><div class="pr">${tcHTML(agentPrice(a))}</div>${boughtAgent(a.def)?`<button class="btn" disabled>${t('bought')}</button>`:`<button class="btn primary" data-buyag="${a.def}">${t('buy')}</button>`}</div></div>`).join('')}</div>`;
}
function myListingsHTML(){
  const act=ECO.items.filter(i=>i.listed),sold=ECO.sold.slice(0,20);
  return `<div class="sec-t">${t('mk_active')}</div>${act.length?`<div class="inv-grid">${act.map(i=>itemCard(i,`<span class="mk-lp">${tcHTML(i.listed.price)}</span>`)).join('')}</div>`:`<div class="card m-hint">${t('mk_empty')}</div>`}
    <div class="sec-t" style="margin-top:22px">${t('mk_hist')}</div>${sold.length?`<div class="card" style="padding:0"><table class="tbl"><tbody>${sold.map(s=>`<tr><td style="text-align:left">${escA(s.n)}</td><td>${fmtDate(new Date(s.at))}</td><td class="rt pos">+${s.net.toLocaleString(LOC[lang])} TC</td></tr>`).join('')}</tbody></table></div>`:`<div class="card m-hint">—</div>`}`;
}
function simulateSales(){
  if(typeof srvOn==='function'&&srvOn())return;
  let ch=false;
  ECO.items.filter(i=>i.listed&&Date.now()-i.listed.at>30e3).forEach(i=>{
    const ratio=i.listed.price/Math.max(1,val(i)),p=ratio<=.95?.5:ratio<=1.05?.25:ratio<=1.2?.08:.01;
    if(Math.random()<p){const net=Math.floor(i.listed.price*(1-ECO_CFG.fee)),n=EC.name(CDB,i);ECO.sold.unshift({n,price:i.listed.price,net,at:Date.now()});ECO.items=ECO.items.filter(x=>x.id!==i.id);ECO.listings=ECO.listings.filter(x=>x!==i.id);SHOP.coins+=net;ch=true;
      toast(t('mk_sold',{x:n,n:net}));notify('sold','n_sold',{x:n},'shop:mine')}
  });
  if(ch){saveShop();ecoSave();renderWallet();refreshEco()}
}
setInterval(simulateSales,20e3);
const _renderShop=renderShop;
renderShop=function(){
  if(!['market','cases','bgs','cards','mine','pass','coins'].includes(shopTab))shopTab='market';
  if(shopTab==='pass'||shopTab==='coins'){_renderShop();fixShopTabs();return}
  const el=$('#shop');
  el.innerHTML=`<div class="sh-head"><div><h1 class="h1">${t('nav_shop')}</h1><div class="lo-sub">${t('shop_hint')}</div></div><span class="pill" style="font-size:15px;padding:6px 10px">${t('wallet')} : <b>${tcHTML(SHOP.coins)}</b></span></div>
    <div class="cats" id="shTabs"></div><div id="mkBody">${shopTab==='market'?marketHTML():shopTab==='cases'?shopCasesHTML():shopTab==='bgs'&&typeof shopBgsHTML==='function'?shopBgsHTML():shopTab==='cards'&&typeof shopCardsHTML==='function'?shopCardsHTML():myListingsHTML()}</div>`;
  fixShopTabs();
};
function fixShopTabs(){
  const c=$('#shop .cats');
  if(!c)return;
  const tabs=[
    ['market','mk_title'],
    ['cases','shop_cases'],
    ['bgs','shop_bgs'],
    ['cards','shop_cards'],
    ['mine','mk_mine'],
    ['pass','shop_pass'],
    ['coins','shop_coins']
  ];
  c.innerHTML=tabs.map(([k,l])=>`<button class="${shopTab===k?'on':''}" data-stab="${k}">${t(l)}${k==='mine'&&ECO.items.some(i=>i.listed)?` <span class="pill">${ECO.items.filter(i=>i.listed).length}</span>`:''}</button>`).join('');
}
shopTab='market';
Object.assign(I18N.fr,{shop_cases:'Caisses',shop_cards:'Cartes de profil',shop_bgs:'Fonds de profil',cs_shop_hint:'Le prix suit la valeur moyenne de ce que contient la caisse : les anciennes caisses, plus rares, coûtent plus cher.',cs_buy_open:'Acheter et ouvrir',cs_have:'Tu en as {n}',cs_bought:'{x} ajoutée à ton inventaire',cs_q:'Rechercher une caisse',c_rebuy:'Racheter · {x}'});
Object.assign(I18N.en,{shop_cases:'Cases',shop_cards:'Profile Cards',shop_bgs:'Profile Backgrounds',cs_shop_hint:'Prices follow the average value of what the case contains: older, rarer cases cost more.',cs_buy_open:'Buy & open',cs_have:'You own {n}',cs_bought:'{x} added to your inventory',cs_q:'Search a case',c_rebuy:'Buy again · {x}'});
Object.assign(I18N.ru,{shop_cases:'Кейсы',shop_cards:'Карточки профиля',shop_bgs:'Фоны профиля',cs_shop_hint:'Цена зависит от средней стоимости содержимого: старые и более редкие кейсы стоят дороже.',cs_buy_open:'Купить и открыть',cs_have:'У тебя {n}',cs_bought:'{x} добавлен в инвентарь',cs_q:'Найти кейс',c_rebuy:'Купить ещё · {x}'});
const CASE_PRICE={};
function casePrice(cid){
  if(CASE_PRICE[cid])return CASE_PRICE[cid];
  const r=EC.mulberry(EC.hash('case'+cid));let sum=0;
  for(let k=0;k<2000;k++)sum+=EC.price(CDB,EC.openCase(CDB,cid,r)).v;
  return CASE_PRICE[cid]=Math.max(50,Math.round(sum/2000*1.15/10)*10);
}
let csQ='';
function shopCasesHTML(){
  const q=csQ.trim().toLowerCase();
  const list=[...CDB.cases].sort((a,b)=>b.y-a.y||+b.id-+a.id).filter(C=>!q||C.n.toLowerCase().includes(q));
  const card=C=>{const n=ECO.cases.filter(x=>x.c===C.id).length,pr=casePrice(C.id);
    return `<div class="item cs-shop"><span class="im" data-ph="${escA(C.n)}">${imgTag(EC.img(CDB,C.i))}</span><div class="bd"><b title="${escA(C.n)}">${escA(C.n)}</b><small>${C.y}${n?` · ${t('cs_have',{n})}`:''}</small>
      <div class="pr">${tcHTML(pr)}</div><div class="cs-shop-b"><button class="btn primary" data-csbuy="${C.id}" data-open="1">${t('cs_buy_open')}</button><button class="btn" data-csbuy="${C.id}">${t('buy')}</button></div></div></div>`};
  return `<div class="lo-note">${t('cs_shop_hint')}</div><div class="mk-tools"><input id="csQ" placeholder="${escA(t('cs_q'))}" value="${escA(csQ)}"></div><div class="sh-grid">${list.map(card).join('')}</div>`;
}
function buyCase(cid,open){
  const C=CDB.cases.find(c=>c.id===String(cid));if(!C||!spend(casePrice(C.id)))return;
  const x=addCase(C.id,'shop');beep(988,.08);
  if(open){refreshEco();return openCaseModal(x.id)}
  toast(t('cs_bought',{x:C.n}));refreshEco();
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-csbuy]');if(b)buyCase(b.dataset.csbuy,!!b.dataset.open)});
document.addEventListener('input',e=>{if(e.target.id==='csQ'){csQ=e.target.value;const p=e.target.selectionStart;renderShop();const q=$('#csQ');q.focus();q.setSelectionRange(p,p)}});
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-mkbuy]');if(!b)return;const x=marketList().find(y=>y.id===b.dataset.mkbuy);if(!x)return;
  confirmBox(t('mk_buy'),`${escA(EC.name(CDB,x))} · ${x.price.toLocaleString(LOC[lang])} TC`,t('mk_buy'),t('cancel'),()=>{if(!spend(x.price))return;ECO.bought.push(x.id);const i=addItem(x,'market');toast(t('mk_bought',{x:EC.name(CDB,i)}));beep(988,.08);renderShop()});
});
document.addEventListener('input',e=>{if(e.target.id==='mkQ'){mkQ=e.target.value;const p=e.target.selectionStart;renderShop();const q=$('#mkQ');q.focus();q.setSelectionRange(p,p)}});
document.addEventListener('change',e=>{const m={mkType:v=>mkType=v,mkRar:v=>mkRar=v,mkWear:v=>mkWear=v,mkSort:v=>mkSort=v}[e.target.id];if(m){m(e.target.value);renderShop()}});

function ecoCfgFix(W,sk){
  const d=draftCfg;if(!d||d.w!==W.id||d.p!==sk.p)return '';
  const insts=ecoInst(W.id,sk.p);if(!insts.length){delete d.iid;return ''}
  if(!d.iid||!insts.some(i=>i.id===d.iid)){const eq=LOAD.w[W.id];const i0=(eq&&eq.p===sk.p&&insts.find(i=>i.id===eq.iid))||insts[0];d.iid=i0.id}
  const i=insts.find(x=>x.id===d.iid);d.f=i.f;d.seed=i.s;d.st=i.st;
  return `<div class="fld"><label>${t('i_float')} · ${t('i_seed')}</label>${insts.length>1?`<select id="cfI">${insts.map(x=>`<option value="${x.id}" ${x.id===d.iid?'selected':''}>${EC.wearOf(x.f).n} · ${x.f.toFixed(4)} · #${x.s}${x.st?' · ST™':''} · ${val(x)} TC</option>`).join('')}</select>`:''}
    <div class="io-f" style="margin-top:6px"><div class="ir"><span>${EC.wearOf(i.f).n}${i.st?' · StatTrak™':''}</span><b class="mono">${i.f.toFixed(6)} · #${i.s} ${patBadge(i)}</b></div>${floatBar(i)}</div></div>`;
}
document.addEventListener('change',e=>{if(e.target.id==='cfI'&&draftCfg){draftCfg.iid=e.target.value;renderLoadout()}});
document.addEventListener('click',e=>{if(e.target.closest('#loadout [data-equip]')&&draftCfg&&draftCfg.iid){const W=weaponOf(draftCfg.w);setTimeout(()=>{if(LOAD.w[W.id]){LOAD.w[W.id].iid=draftCfg.iid;saveLoad()}},0)}},true);

document.querySelector('#loadout').insertAdjacentHTML('afterend','<main class="page" id="inventory" hidden></main>');
document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="itemModal"><div class="modal io-modal"><div class="m-h"><h3 data-i18n="it_title">${t('it_title')}</h3><button class="x2" data-close>×</button></div><div id="itemBody"></div></div></div>
  <div class="overlay" id="caseModal"><div class="modal cs-modal"><div class="m-h"><h3 data-i18n="it_c">${t('it_c')}</h3><button class="x2" data-close>×</button></div><div id="caseBody"></div></div></div>
  <div class="overlay" id="wearModal"><div class="modal io-modal"><div class="m-h"><h3 data-i18n="wc_title">${t('wc_title')}</h3><button class="x2" data-close>×</button></div><div id="wearBody"></div></div></div>
  <div class="overlay" id="coModal"><div class="modal co-modal"><div class="m-h"><h3 id="coModalTitle">${t('co_title')}</h3><button class="x2" data-close>×</button></div><div id="coModalBody"></div></div></div>
  <div class="overlay" id="coDepositModal"><div class="modal co-modal"><div class="m-h"><h3 id="coDepositTitle">${t('co_deposit')}</h3><button class="x2" data-close>×</button></div><div id="coDepositBody"></div></div></div>`);
document.addEventListener('click',e=>{const b=e.target.closest('[data-invlo]');if(b)setView(b.dataset.invlo)});
document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="custModal"><div class="modal cust-modal"><div class="m-h"><h3>${t('iv_cust_t')}</h3><button class="x2" data-close>×</button></div><div id="custBody"></div></div></div>
  <div class="overlay" id="agModal"><div class="modal ag-modal"><div class="m-h"><h3>${t('iv_ag_t')}</h3><button class="x2" data-close>×</button></div><div id="agBody"></div></div></div>`);
$('#custModal').addEventListener('click',e=>{
  if(!draftCfg)return;
  const sl=e.target.closest('[data-slot]');
  if(sl){const i=+sl.dataset.slot;if(!slotOpen(i)){toast(t('stk_slot_plus'));return}
    stkSel=i;if(!draftCfg.stk[i]){CUST.picking=true;custRender();setTimeout(()=>$('#cstkQ')&&$('#cstkQ').focus(),50);return}return custRender()}
  if(e.target.closest('[data-cback]')){CUST.picking=false;return custRender()}
  const fx=e.target.closest('[data-cfx]');if(fx){stkFx=fx.dataset.cfx;return custRender()}
  const pk=e.target.closest('[data-cstk]');if(pk){draftCfg.stk[stkSel]={id:+pk.dataset.cstk,wr:0};CUST.picking=false;beep(660,.05);return custRender()}
  if(e.target.closest('[data-stkdel]')){draftCfg.stk[stkSel]=null;return custRender()}
  const tm=e.target.closest('[data-cteam]');if(tm){draftCfg.team=tm.dataset.cteam;return custRender()}
  if(e.target.closest('[data-csave]'))return custSave();
});
$('#custModal').addEventListener('input',e=>{
  if(!draftCfg)return;
  if(e.target.id==='cfN')draftCfg.tag=e.target.value.slice(0,20);
  if(e.target.id==='cfSt')draftCfg.st=e.target.checked;
  if(e.target.id==='cstkQ'){stkQ=e.target.value;const pos=e.target.selectionStart;custRender();const q=$('#cstkQ');q.focus();q.setSelectionRange(pos,pos)}
  if(e.target.id==='stkWr'&&draftCfg.stk[stkSel]){draftCfg.stk[stkSel].wr=+e.target.value;const l=e.target.previousElementSibling.querySelector('b');if(l)l.textContent=Math.round(draftCfg.stk[stkSel].wr*100)+' %';const ov=$('#custBody .stk-ov');if(ov)ov.outerHTML=stkOverlay(draftCfg)}
});
$('#agModal').addEventListener('click',e=>{
  const ag=e.target.closest('[data-ag]');if(!ag)return;
  const team=ag.dataset.teamAg,def=+ag.dataset.ag;
  if(!hasPlan('premium')&&!boughtAgent(def)){toast(t('need_prem'));closeModal('agModal');return setView('premium')}
  LOAD.ag[team]=LOAD.ag[team]===def?null:def;saveLoad();
  const a=SKDB.agents.find(x=>x.def===def);if(LOAD.ag[team])toast(t('equipped_toast',{x:a.name.split('|')[0].trim()}));
  $('#agBody').innerHTML=agentsHTML();
});
(()=>{const sv=setView;setView=function(v,k,skipHistory){
  if(v==='loadout')v='inventory';
  if(v==='inventory'){
    ['play','lobby','result','profile','friends','ranking','loadout','premium','shop','compet','settings','vigie','influencer'].forEach(id=>{const x=$('#'+id);if(x)x.hidden=true});
    $('#inventory').hidden=false;
    $$('[data-view]').forEach(e=>e.classList.toggle('active',e.dataset.view==='loadout'));
    renderInventory();
    window.scrollTo({top:0});
    if(!skipHistory){
      try{history.pushState({view:'inventory'},'','#/inventory');}catch(_){}
    }
    return;
  }
  $('#inventory').hidden=true;
  const [vv,sub]=String(v).split(':');
  if(vv==='shop'&&sub){shopTab=sub}
  return sv.call(this,vv,k,skipHistory);
}})();
function refreshEco(){if(!$('#inventory').hidden)renderInventory();if(!$('#shop').hidden)renderShop();if(!$('#loadout').hidden)renderLoadout()}
setInterval(()=>{
  const n=ECO.items.filter(i=>i.new).length+ECO.cases.filter(c=>c.new).length+ECO.pending.length;
  $$('.rail-btn[data-view="loadout"]').forEach(b=>{b.classList.toggle('has-new',n>0);b.dataset.n=n});
},1500);
applyStatic();

var CSGO_TEST_SERVER='';
let CC={owns:null,verified:false,at:0,skip:false};
try{const v=JSON.parse(localStorage.getItem('tr_cc')||'null');if(v)CC=Object.assign(CC,v)}catch(e){}
const ccSave=()=>{try{localStorage.setItem('tr_cc',JSON.stringify(CC))}catch(e){}};
let ccWait=null;
function steamOpen(uri){
  if(typeof steamLaunching!=='undefined')steamLaunching=Date.now();
  const w=window.open(uri,'_blank');
  if(!w){let f=document.getElementById('steamLaunchFrame');if(!f){f=document.createElement('iframe');f.id='steamLaunchFrame';f.style.display='none';document.body.appendChild(f)}f.src=uri}
  else setTimeout(()=>{try{w.close()}catch(e){}},4000);
}
Object.assign(I18N.fr,{nav_howto:'Comment jouer',hw_title:'Comment jouer',hw_sub:'TICKRATE se joue sur Counter-Strike: Global Offensive, pas sur CS2. Trois étapes et c\'est parti.',
  hw_s1:'Installe CS:GO',hw_s1t:'Il doit être installé dans ta bibliothèque Steam. Le bouton ouvre directement l\'installation dans Steam.',hw_s1b:'Installer CS:GO',
  hw_s2:'Lie ton compte Steam',hw_s2t:'C\'est ton SteamID qui te laisse entrer sur nos serveurs et qui applique tes skins.',hw_s2b:'Lier Steam',
  hw_s3:'Lance une partie',hw_s3t:'« Trouver un match », accepte, fais le veto puis clique sur CONNECTER : CS:GO se lance et te connecte tout seul au serveur.',hw_s3b:'Jouer',
  cc_title:'Vérifier mon installation',cc_sub:'À faire une fois : on vérifie que tout est prêt avant ta première partie.',
  cc_steam:'Compte Steam lié',cc_owns:'Counter-Strike dans ta bibliothèque Steam',cc_owns_priv:'Impossible de vérifier : rends « Détails des jeux » public dans la confidentialité de ton profil Steam.',cc_owns_no:'Counter-Strike n\'est pas dans ta bibliothèque Steam.',
  cc_run:'CS:GO se lance et rejoint le serveur',cc_run_t:'Lance le test : CS:GO s\'ouvre et se connecte à notre serveur de test, qui confirme que tout marche.',cc_run_demo:'Lance le test : CS:GO doit s\'ouvrir. Confirme ensuite ce que tu vois.',
  cc_launch:'Lancer le test',cc_install:'Installer / réparer',cc_waiting:'En attente de ta connexion au serveur de test…',cc_ok:'CS:GO est prêt',cc_yes:'CS:GO s\'est lancé',cc_no:'Rien ne s\'est passé',cc_check:'Vérifier',cc_retry:'Recommencer la vérification',
  cc_help:'Ça ne marche pas ?',cc_h1:'Steam ne s\'ouvre pas : installe Steam et connecte-toi, puis réessaie.',cc_h2:'CS2 se lance à la place : ferme CS2, puis relance le test depuis ce bouton (il ouvre bien CS:GO).',cc_h3:'« Jeu non installé » : clique sur « Installer / réparer » et attends la fin du téléchargement.',
  cc_gate_t:'CS:GO n\'est pas encore vérifié',cc_gate_d:'Si CS:GO n\'est pas installé, tu ne pourras pas rejoindre le serveur et tu risques un ban de 5 minutes pour absence.',cc_gate_go:'Vérifier maintenant',cc_gate_skip:'Jouer quand même',ob_csgo:'Vérifier que CS:GO est installé'});
Object.assign(I18N.en,{nav_howto:'How to play',hw_title:'How to play',hw_sub:'TICKRATE runs on Counter-Strike: Global Offensive, not CS2. Three steps and you\'re in.',
  hw_s1:'Install CS:GO',hw_s1t:'It must be installed in your Steam library. The button opens the install directly in Steam.',hw_s1b:'Install CS:GO',
  hw_s2:'Link your Steam account',hw_s2t:'Your SteamID lets you into our servers and applies your skins.',hw_s2b:'Link Steam',
  hw_s3:'Play a match',hw_s3t:'“Find a match”, accept, do the veto, then click CONNECT: CS:GO launches and joins the server by itself.',hw_s3b:'Play',
  cc_title:'Check my install',cc_sub:'Do it once: we check everything is ready before your first match.',
  cc_steam:'Steam account linked',cc_owns:'Counter-Strike in your Steam library',cc_owns_priv:'Can\'t check: set “Game details” to public in your Steam profile privacy.',cc_owns_no:'Counter-Strike is not in your Steam library.',
  cc_run:'CS:GO launches and joins the server',cc_run_t:'Run the test: CS:GO opens and connects to our test server, which confirms everything works.',cc_run_demo:'Run the test: CS:GO should open. Then confirm what you see.',
  cc_launch:'Run the test',cc_install:'Install / repair',cc_waiting:'Waiting for you to join the test server…',cc_ok:'CS:GO is ready',cc_yes:'CS:GO launched',cc_no:'Nothing happened',cc_check:'Check',cc_retry:'Check again',
  cc_help:'Not working?',cc_h1:'Steam doesn\'t open: install Steam and log in, then retry.',cc_h2:'CS2 launches instead: close CS2, then run the test again from this button (it opens CS:GO).',cc_h3:'“Game not installed”: click “Install / repair” and wait for the download to finish.',
  cc_gate_t:'CS:GO not verified yet',cc_gate_d:'If CS:GO isn\'t installed you won\'t be able to join the server and you risk a 5-minute no-show ban.',cc_gate_go:'Check now',cc_gate_skip:'Play anyway',ob_csgo:'Check that CS:GO is installed'});
Object.assign(I18N.ru,{nav_howto:'Как играть',hw_title:'Как играть',hw_sub:'TICKRATE работает на Counter-Strike: Global Offensive, а не на CS2. Три шага - и в бой.',
  hw_s1:'Установи CS:GO',hw_s1t:'Игра должна быть установлена в библиотеке Steam. Кнопка сразу открывает установку в Steam.',hw_s1b:'Установить CS:GO',
  hw_s2:'Привяжи Steam',hw_s2t:'По SteamID тебя пускают на наши серверы и применяют скины.',hw_s2b:'Привязать Steam',
  hw_s3:'Сыграй матч',hw_s3t:'«Найти матч», прими, проведи вето и нажми ПОДКЛЮЧИТЬСЯ: CS:GO запустится и сам подключится.',hw_s3b:'Играть',
  cc_title:'Проверить установку',cc_sub:'Один раз: проверяем, что всё готово к первому матчу.',
  cc_steam:'Steam привязан',cc_owns:'Counter-Strike в библиотеке Steam',cc_owns_priv:'Не удалось проверить: открой «Сведения об играх» в приватности профиля Steam.',cc_owns_no:'Counter-Strike нет в библиотеке Steam.',
  cc_run:'CS:GO запускается и заходит на сервер',cc_run_t:'Запусти тест: CS:GO откроется и подключится к тестовому серверу.',cc_run_demo:'Запусти тест: CS:GO должна открыться. Потом подтверди.',
  cc_launch:'Запустить тест',cc_install:'Установить / исправить',cc_waiting:'Ждём подключения к тестовому серверу…',cc_ok:'CS:GO готова',cc_yes:'CS:GO запустилась',cc_no:'Ничего не произошло',cc_check:'Проверить',cc_retry:'Проверить снова',
  cc_help:'Не работает?',cc_h1:'Steam не открывается: установи Steam, войди и попробуй снова.',cc_h2:'Запускается CS2: закрой CS2 и снова запусти тест этой кнопкой.',cc_h3:'«Игра не установлена»: нажми «Установить / исправить» и дождись загрузки.',
  cc_gate_t:'CS:GO ещё не проверена',cc_gate_d:'Без установленной CS:GO ты не сможешь зайти на сервер и получишь бан на 5 минут за неявку.',cc_gate_go:'Проверить',cc_gate_skip:'Всё равно играть',ob_csgo:'Проверить, что CS:GO установлена'});

async function ccCheckOwns(){
  if(typeof fbLive==='function'&&fbLive()&&AUTH.session){const r=await fbCall('steamGames');CC.owns=r&&!r.error?(r.private?'private':r.owns):null}
  else CC.owns=ME.steam&&ME.steam.linked?true:null;
  ccSave();renderHowto();
}
function ccStartTest(){
  CC.verified=false;ccSave();
  steamOpen(CSGO_TEST_SERVER?`steam://rungameid/${CSGO_APPID}//+connect%20${encodeURIComponent(CSGO_TEST_SERVER)}`:`steam://rungameid/${CSGO_APPID}`);
  ccWait={at:Date.now()};renderHowto();
  if(CSGO_TEST_SERVER&&typeof fbLive==='function'&&fbLive()&&AUTH.session){
    const poll=setInterval(async()=>{if(!ccWait||Date.now()-ccWait.at>150e3){clearInterval(poll);ccWait=null;return renderHowto()}
      const r=await fbReq(`csgoCheck/${AUTH.session.account.id}`);if(r&&r.at>ccWait.at){clearInterval(poll);ccDone()}},3000);
  }
}
function ccDone(){CC.verified=true;CC.at=Date.now();ccWait=null;ccSave();toast(t('cc_ok'));beep(880,.08);beep(1175,.12,.1);renderHowto();if(typeof renderOnboard==='function')renderOnboard()}
function ccHTML(){
  const live=!!CSGO_TEST_SERVER&&typeof fbLive==='function'&&fbLive();
  const st=(ok,label,extra='')=>`<div class="cc-row ${ok===true?'ok':ok===false?'ko':''}"><span class="cc-i">${ok===true?ICON.check:ok===false?'!':''}</span><div><b>${label}</b>${extra}</div></div>`;
  const owns=CC.owns===true?true:CC.owns===false?false:null;
  const ownsX=CC.owns==='private'?`<small>${t('cc_owns_priv')}</small>`:CC.owns===false?`<small>${t('cc_owns_no')}</small>`:'';
  let run;
  if(CC.verified)run=`<small>${t('cc_ok')}</small><button class="btn ghost sm" data-cc="retry">${t('cc_retry')}</button>`;
  else if(ccWait)run=live?`<small class="cc-wait"><span class="spin inl"></span> ${t('cc_waiting')}</small>`
    :`<small>${t('cc_run_demo')}</small><div class="cc-btns"><button class="btn primary sm" data-cc="yes">${t('cc_yes')}</button><button class="btn ghost sm" data-cc="no">${t('cc_no')}</button></div>`;
  else run=`<small>${live?t('cc_run_t'):t('cc_run_demo')}</small><div class="cc-btns"><button class="btn primary sm" data-cc="test">${t('cc_launch')}</button><button class="btn ghost sm" data-cc="install">${t('cc_install')}</button></div>`;
  return `<div class="st-card cc-card"><h3>${t('cc_title')}</h3><p class="m-hint" style="margin:0 0 10px">${t('cc_sub')}</p>
    ${st(!!(ME.steam&&ME.steam.linked),t('cc_steam'),ME.steam&&ME.steam.linked?'':`<div class="cc-btns"><button class="btn steam-btn sm" data-cc="link">${t('hw_s2b')}</button></div>`)}
    ${st(owns,t('cc_owns'),ownsX+(CC.owns==null||CC.owns==='private'?`<div class="cc-btns"><button class="btn ghost sm" data-cc="owns">${t('cc_check')}</button></div>`:''))}
    ${st(CC.verified?true:CC.failed?false:null,t('cc_run'),run)}
    <details class="cc-help"><summary>${t('cc_help')}</summary><ul><li>${t('cc_h1')}</li><li>${t('cc_h2')}</li><li>${t('cc_h3')}</li></ul></details></div>`;
}
function renderHowto(){
  const el=$('#howto');if(!el||el.hidden)return;
  const step=(n,h,p,btn)=>`<div class="hw-step"><span class="hw-n">${n}</span><div><b>${t(h)}</b><p>${t(p)}</p>${btn}</div></div>`;
  el.innerHTML=`<div class="cp-head"><h1 class="h1">${t('hw_title')}</h1><p class="vg-tag">${t('hw_sub')}</p></div>
    <div class="hw-grid"><div class="hw-steps">
      ${step(1,'hw_s1','hw_s1t',`<button class="btn primary sm" data-cc="install">${t('hw_s1b')}</button>`)}
      ${step(2,'hw_s2','hw_s2t',ME.steam&&ME.steam.linked?`<span class="pill">${ICON.check.replace('<svg','<svg style="width:12px;height:12px;vertical-align:-2px"')} ${t('cc_steam')}</span>`:`<button class="btn steam-btn sm" data-cc="link">${t('hw_s2b')}</button>`)}
      ${step(3,'hw_s3','hw_s3t',`<button class="btn sm" data-cc="play">${t('hw_s3b')}</button>`)}
    </div>${ccHTML()}</div>`;
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-cc]');if(!b)return;const a=b.dataset.cc;
  if(a==='install')return steamOpen(`steam://install/${CSGO_APPID}`);
  if(a==='link')return doSteam().then(r=>{if(r&&r.ok){applySession(AUTH.session);toast(t('steam_linked_toast'))}renderHowto()});
  if(a==='owns')return ccCheckOwns();
  if(a==='test'||a==='retry'){CC.failed=false;return ccStartTest()}
  if(a==='yes')return ccDone();
  if(a==='no'){ccWait=null;CC.failed=true;ccSave();const d=$('#howto .cc-help');renderHowto();const h=$('#howto .cc-help');if(h)h.open=true;return}
  if(a==='play'){closeModal('ccGate');return setView('play')}
  if(a==='gate-go'){closeModal('ccGate');return setView('howto')}
  if(a==='gate-skip'){CC.skip=true;ccSave();closeModal('ccGate');return $('#find').onclick()}
});
(()=>{const f=$('#find'),orig=f.onclick;f.onclick=function(e){
  if(!state.searching&&!CC.verified&&!CC.skip&&ME.steam&&ME.steam.linked&&!banned()){openModal('ccGate');return}
  return orig.call(this,e)}})();
document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="ccGate"><div class="modal" style="max-width:460px"><div class="m-h"><h3 data-i18n="cc_gate_t">${t('cc_gate_t')}</h3><button class="x2" data-close>×</button></div>
  <p class="m-hint" style="margin:0 0 16px" data-i18n="cc_gate_d">${t('cc_gate_d')}</p><div class="cc-btns"><button class="btn primary" data-cc="gate-go" data-i18n="cc_gate_go">${t('cc_gate_go')}</button><button class="btn ghost" data-cc="gate-skip" data-i18n="cc_gate_skip">${t('cc_gate_skip')}</button></div></div></div>`);
document.querySelector('#play').insertAdjacentHTML('afterend','<main class="page" id="howto" hidden></main>');
$$('.rail-btn[data-view="ranking"]').forEach(b=>b.insertAdjacentHTML('afterend',`<button class="rail-btn" data-view="howto" data-i18n-title="nav_howto"><svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M256 64C150 64 64 150 64 256s86 192 192 192 192-86 192-192S362 64 256 64zm-6 304a20 20 0 1120-20 20 20 0 01-20 20zm33.44-102C267.23 276.88 265 286.85 265 296a14 14 0 01-28 0c0-21.91 10.08-39.33 30.82-53.26C287.1 229.8 298 221.6 298 203.57c0-12.26-7-21.57-21.49-28.46-3.41-1.62-11-3.2-20.34-3.09-11.72.15-20.82 2.95-27.83 8.59C215.12 191.25 214 202.83 214 203a14 14 0 11-28-1.35c.11-2.43 1.8-24.32 24.77-42.8 11.91-9.58 27.06-14.56 45-14.78 12.7-.15 24.63 2 32.72 5.82C312.7 161.34 326 180.43 326 203.57c0 33.83-22.61 49.02-42.56 62.43z"/></svg><span class="rl" data-i18n="nav_howto">${t('nav_howto')}</span></button>`));
$$('.rail-btn[data-view="howto"]').forEach(b=>b.addEventListener('click',()=>setView('howto')));
(()=>{const sv=setView;setView=function(v,k){
  if(v==='howto'){$$('main.page').forEach(x=>x.hidden=x.id!=='howto');$$('[data-view]').forEach(e=>e.classList.toggle('active',e.dataset.view==='howto'));renderHowto();window.scrollTo({top:0});return}
  $('#howto').hidden=true;return sv.call(this,v,k)}})();
(()=>{if(typeof obSteps!=='function')return;const o=obSteps;obSteps=function(){const s=o();s.splice(1,0,['csgo',!!CC.verified,'howto']);return s}})();

document.addEventListener('click',e=>{
  const nc=e.target.closest('[data-co-act="new"]');
  if(nc){
    const name=prompt(t('co_name_prompt'),'Mon Conteneur');
    if(name&&name.trim())seContainerCreate(name.trim()).then(()=>renderInventory());
    return;
  }
  const ren=e.target.closest('[data-co-ren]');
  if(ren){
    const cid=ren.dataset.coRen,c=(ECO.containers||[]).find(x=>x.id===cid);
    const name=prompt(t('co_name_prompt'),c?c.name:'');
    if(name&&name.trim()&&(!c||name.trim()!==c.name))seContainerRename(cid,name.trim()).then(()=>renderInventory());
    return;
  }
  const del=e.target.closest('[data-co-del]');
  if(del){
    const cid=del.dataset.coDel,c=(ECO.containers||[]).find(x=>x.id===cid);
    if(c&&c.count>0)return toast(t('co_del_not_empty'));
    if(confirm(t('co_del_confirm')))seContainerDelete(cid).then(()=>renderInventory());
    return;
  }
  const op=e.target.closest('[data-co-open]');
  if(op){openContainerModal(op.dataset.coOpen);return}
  const dep=e.target.closest('[data-co-dep]');
  if(dep){closeModal('coModal');openDepositModal(dep.dataset.coDep);return}
  const retOne=e.target.closest('[data-co-ret-one]');
  if(retOne){
    const [cid,itemId]=retOne.dataset.coRetOne.split(':');
    seContainerRetrieve(cid,[itemId]).then(r=>{
      if(!r.error){const c=(ECO.containers||[]).find(x=>x.id===cid);if(c)renderContainerModalContent(c)}
      renderInventory();
    });
    return;
  }
  const retAll=e.target.closest('[data-co-ret-all]');
  if(retAll){
    const cid=retAll.dataset.coRetAll,c=(ECO.containers||[]).find(x=>x.id===cid);
    if(!c||!c.items||!c.items.length)return;
    const ids=c.items.map(x=>x.id);
    seContainerRetrieve(cid,ids).then(()=>{closeModal('coModal');renderInventory()});
    return;
  }
  const retSel=e.target.closest('[data-co-ret-sel]');
  if(retSel){
    const cid=retSel.dataset.coRetSel;if(!CO_RET_SEL.size)return;
    seContainerRetrieve(cid,[...CO_RET_SEL]).then(()=>{
      CO_RET_SEL.clear();
      const c=(ECO.containers||[]).find(x=>x.id===cid);if(c)renderContainerModalContent(c);
      renderInventory();
    });
    return;
  }
  const doDep=e.target.closest('[data-co-do-dep]');
  if(doDep){
    const cid=doDep.dataset.coDoDep;if(!CO_DEP_SEL.size)return;
    seContainerDeposit(cid,[...CO_DEP_SEL]).then(()=>{
      closeModal('coDepositModal');CO_DEP_SEL.clear();renderInventory();
    });
    return;
  }
  const itemDep=e.target.closest('[data-co-item-dep]');
  if(itemDep){
    const itemId=itemDep.dataset.coItemDep;closeModal('itemModal');
    if(ECO.containers.length===1){seContainerDeposit(ECO.containers[0].id,[itemId]).then(()=>renderInventory())}
    else{promptDepositContainer(itemId)}
    return;
  }
  const coTile=e.target.closest('[data-co-tile]');
  if(coTile&&!e.target.closest('button')){
    const id=coTile.dataset.coTile;
    if(CO_RET_SEL.has(id))CO_RET_SEL.delete(id);else CO_RET_SEL.add(id);
    const c=(ECO.containers||[]).find(x=>x.id===CO_ACTIVE_ID);
    if(c)renderContainerModalContent(c,($('#coModalQ')?$('#coModalQ').value:''));
    return;
  }
  const depTile=e.target.closest('[data-co-dep-tile]');
  if(depTile&&!e.target.closest('button')){
    const id=depTile.dataset.coDepTile;
    if(CO_DEP_SEL.has(id))CO_DEP_SEL.delete(id);else CO_DEP_SEL.add(id);
    const c=(ECO.containers||[]).find(x=>x.id===CO_ACTIVE_ID);
    if(c)renderDepositModalContent(c,($('#coDepQ')?$('#coDepQ').value:''));
    return;
  }
  const selAll=e.target.closest('[data-co-sel-all]');
  if(selAll&&CO_ACTIVE_ID){
    const c=(ECO.containers||[]).find(x=>x.id===CO_ACTIVE_ID);
    if(c){
      const q=$('#coDepQ')?$('#coDepQ').value:'';
      const eligible=ECO.items.filter(i=>!i.listed&&!i.virtual&&!i.ext&&(!q||EC.name(CDB,i).toLowerCase().includes(q.toLowerCase())));
      if(CO_DEP_SEL.size===eligible.length){CO_DEP_SEL.clear()}
      else{const remaining=Math.max(0,(c.max||1000)-(c.count||(c.items?c.items.length:0)));eligible.slice(0,remaining).forEach(i=>CO_DEP_SEL.add(i.id))}
      renderDepositModalContent(c,q);
    }
    return;
  }
});
document.addEventListener('input',e=>{
  if(e.target.id==='coModalQ'&&CO_ACTIVE_ID){const c=(ECO.containers||[]).find(x=>x.id===CO_ACTIVE_ID);if(c)renderContainerModalContent(c,e.target.value)}
  if(e.target.id==='coDepQ'&&CO_ACTIVE_ID){const c=(ECO.containers||[]).find(x=>x.id===CO_ACTIVE_ID);if(c)renderDepositModalContent(c,e.target.value)}
});

applyStatic();
