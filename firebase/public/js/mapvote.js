/* =====================================================
 * TICKRATE - Vote de la rotation compétitive (mapvote.js)
 * Chaque mois, chaque joueur (compte Steam lié) choisit jusqu'à 7 maps parmi COMP_CANDIDATES.
 * Le 1er du mois (00:05 UTC), le serveur applique les 7 maps les plus votées (fonction mapRotate, config/mapPool) :
 * c'est ce pool que le veto propose en 5v5. Le site lit config/mapPool pour afficher la rotation en cours.
 * Les votes de chacun restent privés (mapVotes/<mois>/<uid>) ; seuls les totaux sont publics (mapVoteCounts/<mois>).
 * ===================================================== */
// textes : js/i18n-modes.js (chargé tôt, avant le premier affichage de la page Jouer)
if(typeof FB_ERR==='object')Object.assign(FB_ERR,{bad_maps:'bad_maps',steam_required:'steam_required',no_profile:'no_profile'});

const MV={pool:null,counts:null,mine:null,pick:null,busy:false,msg:'',loaded:false};
const mvPeriod=(d=new Date())=>d.toISOString().slice(0,7);
const mvBsp=m=>'de_'+m.slug;
const mvByBsp=b=>MAPS.find(m=>mvBsp(m)===b);
const mvMonth=per=>{const [y,mo]=per.split('-').map(Number);return new Date(Date.UTC(y,mo-1,15)).toLocaleDateString(lang==='ru'?'ru-RU':lang==='en'?'en-GB':'fr-FR',{month:'long',year:'numeric',timeZone:'UTC'})};
// applique le pool voté à la grille de la page Jouer (curRot().maps = noms affichés)
function mvApplyPool(){
  const names=(MV.pool?.maps||[]).map(mvByBsp).filter(Boolean).map(m=>m.n);
  if(names.length!==7)return;
  curRot().maps=names;
  if(typeof renderMaps==='function'&&!state.searching)renderMaps();
}
async function mvLoad(force){
  if(!(typeof fbLive==='function'&&fbLive()))return;
  if(MV.loading||(MV.loaded&&!force))return;MV.loading=true;
  const per=mvPeriod();
  try{
    const [pool,counts,mine]=await Promise.all([fbReq('config/mapPool'),fbReq(`mapVoteCounts/${per}`),FBA.uid?fbReq(`mapVotes/${per}/${FBA.uid}`):null]);
    MV.pool=pool||null;MV.counts=counts||{voters:0,maps:{}};MV.mine=mine&&Array.isArray(mine.maps)?mine.maps:null;
    if(!MV.pick)MV.pick=new Set(MV.mine||[]);
    MV.loaded=true;mvApplyPool();
  }catch(e){}
  MV.loading=false;
  if(!$('#mapvote').hidden)renderMapVote();
}
function mvLeft(){
  const now=new Date(),end=Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,1,0,5),ms=end-now;
  const d=Math.floor(ms/864e5);return d>=1?t('mv_days',{n:d}):t('mv_hours',{n:Math.max(1,Math.ceil(ms/36e5))});
}
function renderMapVote(){
  const box=$('#mapvote');if(!box)return;
  const live=typeof fbLive==='function'&&fbLive();
  if(!MV.pick)MV.pick=new Set(MV.mine||[]);
  const per=mvPeriod(),cur=MV.pool?.maps?.length===7?MV.pool.maps:curRot().maps.map(n=>mvBsp(MAPS.find(m=>m.n===n)));
  const counts=MV.counts?.maps||{},voters=MV.counts?.voters||0;
  const cands=MAPS.filter(isVoteMap);
  const maxC=Math.max(1,...cands.map(m=>counts[mvBsp(m)]||0));
  const steamOk=!!(ME.steam&&ME.steam.linked);
  const last=MV.pool&&MV.pool.period?`<p class="mv-last">${t(MV.pool.applied?'mv_last':'mv_last_keep',{m:mvMonth(MV.pool.period),v:MV.pool.voters||0})}
    ${(MV.pool.added||[]).map(b=>`<span class="mv-tag in">+ ${escA(mvByBsp(b)?.n||b)}</span>`).join('')}${(MV.pool.removed||[]).map(b=>`<span class="mv-tag out">− ${escA(mvByBsp(b)?.n||b)}</span>`).join('')}</p>`:'';
  const tile=m=>{const b=mvBsp(m),on=MV.pick.has(b),n=counts[b]||0,inPool=cur.includes(b);
    return `<button type="button" class="mv-map${on?' on':''}" data-mv="${b}" aria-pressed="${on}">
      <span class="mv-bg" style="background:url('maps/${m.slug}.jpg?v=2.50') center/cover no-repeat,linear-gradient(135deg,${m.c},#141518 80%)"></span>
      <span class="mv-check">${ICON.check}</span>
      ${inPool?`<span class="mv-in">${t('mv_in')}</span>`:''}
      <span class="mv-name">${escA(m.n)}</span>
      <span class="mv-bar"><i style="width:${Math.round(n/maxC*100)}%"></i></span>
      <span class="mv-n">${t('mv_votes',{n})}</span>
    </button>`};
  const same=MV.mine&&MV.mine.length===MV.pick.size&&MV.mine.every(b=>MV.pick.has(b));
  let foot;
  if(!live)foot=`<p class="mv-note">${t('mv_offline')}</p>`;
  else if(!steamOk)foot=`<p class="mv-note">${t('mv_steam')}</p><button class="btn" type="button" data-goview="profile">Steam</button>`;
  else foot=`<span class="mv-count">${t('mv_pick',{n:MV.pick.size})}</span>${MV.msg?`<span class="mv-msg">${escA(MV.msg)}</span>`:same?`<span class="mv-msg">${t('mv_mine')}</span>`:''}
    <button class="find mv-save" type="button" id="mvSave" ${!MV.pick.size||same||MV.busy?'disabled':''}><span class="fl">${t('mv_save')}</span></button>`;
  box.innerHTML=`<div class="mv-wrap">
    <header class="mv-head">
      <div><h1 class="h1">${t('mv_title')}</h1><p class="mv-lead">${t('mv_lead')}</p></div>
      <div class="mv-meta"><b>${t('mv_ends',{m:mvMonth(per),d:mvLeft()})}</b><span>${t('mv_voters',{n:voters})}</span></div>
    </header>
    <section class="card mv-cur"><h3 class="mv-h">${t('mv_cur')}</h3>
      <div class="mv-chips">${cur.map(b=>`<span class="mv-chip">${escA(mvByBsp(b)?.n||b)}</span>`).join('')}</div>${last}</section>
    <div class="mv-grid">${cands.map(tile).join('')}</div>
    <div class="mv-foot">${foot}</div>
    <p class="mv-note">${t('mv_tie')}</p>
  </div>`;
}
(function(){
  const box=$('#mapvote');if(!box)return;
  $$('[data-i18n="nav_mapvote"]').forEach(x=>{x.textContent=t('nav_mapvote')});
  $$('[data-i18n-title="nav_mapvote"]').forEach(x=>{x.title=t('nav_mapvote')});
  box.addEventListener('click',async e=>{
    const tl=e.target.closest('[data-mv]');
    if(tl){const b=tl.dataset.mv;MV.msg='';
      if(MV.pick.has(b))MV.pick.delete(b);else{if(MV.pick.size>=7)return toast(t('mv_max'));MV.pick.add(b)}
      return renderMapVote()}
    if(e.target.closest('#mvSave')&&!MV.busy){
      MV.busy=true;renderMapVote();
      const r=await fbCall('mapVote',{maps:[...MV.pick]});
      MV.busy=false;
      if(r.error){MV.msg=r.error==='steam_required'?t('mv_steam'):t('mv_err');toast(MV.msg)}
      else{MV.mine=[...MV.pick];MV.msg=t('mv_saved');toast(t('mv_saved'));MV.loaded=false;await mvLoad(true)}
      renderMapVote();
    }
  });
  document.addEventListener('click',e=>{if(e.target.closest('[data-lang]'))setTimeout(()=>{if(!box.hidden)renderMapVote();if(typeof renderMaps==='function')renderMaps()},0)});
  // pool voté chargé dès que la session Firebase est prête (la page Jouer affiche la rotation en cours)
  let tries=0;const iv=setInterval(()=>{if(MV.loaded||++tries>30)return clearInterval(iv);if(typeof fbLive==='function'&&fbLive()&&FBA.uid)mvLoad()},1000);
  if(!box.hidden){renderMapVote();mvLoad()}
})();
