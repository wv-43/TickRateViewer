/* =====================================================
 * TICKRATE - Arène 1v1 (duel.js)
 * Salon dédié au 1v1 Aim Arena : rangs propres au site (pas ceux de CS:GO), calculés depuis l'ELO 1v1 (eloDuel),
 * emblèmes hexagonaux dessinés ici, échelle des rangs, top 1v1 et bouton de recherche.
 * La recherche passe par la file normale (bouton #find de la page Jouer) : on choisit le mode 1v1 puis on clique dessus,
 * donc toutes les vérifications (Steam lié, chef de groupe, bannissement) restent les mêmes.
 * ===================================================== */
// textes : js/i18n-modes.js (chargé tôt, avant le premier affichage de la page Jouer)

// ---------- rangs ----------
const DU_T=o=>({get(){return o[typeof lang==='string'?lang:'fr']||o.en}});
const DU_FAM=[
  ['fer',     {fr:'Fer',en:'Iron',ru:'Железо'},                  '#7d838c','dot'],
  ['bronze',  {fr:'Bronze',en:'Bronze',ru:'Бронза'},             '#c98b5a','cross'],
  ['argent',  {fr:'Argent',en:'Silver',ru:'Серебро'},            '#c3ccd6','ring'],
  ['or',      {fr:'Or',en:'Gold',ru:'Золото'},                   '#f2c443','blades'],
  ['platine', {fr:'Platine',en:'Platinum',ru:'Платина'},         '#4fd1c5','scope'],
  ['diamant', {fr:'Diamant',en:'Diamond',ru:'Алмаз'},            '#b98cff','ace'],
  ['mythique',{fr:'Mythique',en:'Mythic',ru:'Мифический'},       '#ff5d6c','flame'],
  ['legende', {fr:'Légende 128',en:'128 Legend',ru:'Легенда 128'},'#fff1c2','crown']
].map(([id,n,c,icon])=>Object.defineProperty({id,c,icon},'n',DU_T(n)));
const DU_RANKS=[['fer',0],['bronze',850],['bronze',950],['bronze',1050],['argent',1150],['argent',1250],['argent',1350],
  ['or',1450],['or',1550],['or',1650],['platine',1775],['platine',1900],['diamant',2025],['diamant',2150],['mythique',2275],['legende',2400]]
  .map(([f,min],i,all)=>{const fam=DU_FAM.find(x=>x.id===f),sib=all.filter(r=>r[0]===f);
    const step=sib.findIndex(r=>r[1]===min)+1,steps=sib.length;
    return Object.defineProperty({i,min,fam,step,steps},'name',{get(){return fam.n+(steps>1?' '+['I','II','III'][step-1]:'')}})});
const duelRankOf=e=>[...DU_RANKS].reverse().find(r=>(e??1000)>=r.min)||DU_RANKS[0];

// ---------- emblèmes : hexagone, signe de viseur par famille, repères des sous-rangs ----------
const DU_ICON={
  dot:c=>`<circle cx="32" cy="30" r="9.5" fill="none" stroke="${c}" stroke-opacity=".55" stroke-width="2.4"/><circle cx="32" cy="30" r="3.6" fill="${c}"/>`,
  cross:c=>`<circle cx="32" cy="30" r="9" fill="none" stroke="${c}" stroke-width="2.6"/><path d="M32 15v8M32 37v8M17 30h8M39 30h8" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`,
  ring:c=>`<circle cx="32" cy="30" r="11" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="13.3 4" transform="rotate(-38 32 30)"/><path d="M32 22.5v4M32 33.5v4M24.5 30h4M35.5 30h4" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/><circle cx="32" cy="30" r="1.8" fill="${c}"/>`,
  blades:c=>`<path d="M21.5 40.5L42.5 19.5M21.5 19.5L42.5 40.5" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/><path d="M19 34.5l6.5 6.5M45 34.5L38.5 41" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/><circle cx="32" cy="30" r="2.6" fill="#0b0c0e" stroke="${c}" stroke-width="1.8"/>`,
  scope:c=>`<circle cx="32" cy="30" r="12.5" fill="none" stroke="${c}" stroke-width="2.4"/><circle cx="32" cy="30" r="5" fill="none" stroke="${c}" stroke-width="2"/><path d="M32 16v8.5M32 35.5V44M18 30h8.5M37.5 30H46" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/><path d="M32 28l2 2-2 2-2-2z" fill="${c}"/>`,
  ace:c=>`<path d="M32 14.5l11.5 15.5L32 45.5 20.5 30z" fill="${c}"/><path d="M32 22l6 8-6 8-6-8z" fill="#0b0c0e"/><path d="M32 26.5l2.6 3.5-2.6 3.5-2.6-3.5z" fill="${c}"/>`,
  flame:c=>`<path d="M32 14c1.2 6.2 8.6 9.6 8.6 18.2A8.6 8.6 0 0132 42a8.6 8.6 0 01-8.6-8.6c0-4.4 2.4-6.8 4.2-8.6.2 3 1.4 4.8 3.2 5.6-.6-6.4.6-11.6 1.2-16.4z" fill="${c}"/><path d="M32 30.5c.6 2.6 3.4 3.8 3.4 6.6a3.4 3.4 0 01-6.8 0c0-1.8.9-3 1.8-3.8.3 1 .8 1.6 1.4 1.8-.3-1.8 0-3.2.2-4.6z" fill="#0b0c0e"/>`,
  crown:c=>`<path d="M19 37.5l-2.2-15 8.4 6.4 6.8-10.4 6.8 10.4 8.4-6.4-2.2 15z" fill="${c}"/><rect x="19" y="39.3" width="26" height="3.2" rx="1.2" fill="${c}"/><text x="32" y="35.2" text-anchor="middle" font-family="Rajdhani,system-ui,sans-serif" font-weight="800" font-size="7.5" fill="#0b0c0e">128</text>`
};
const DU_HEX='M32 3.5L56.7 17.75V46.25L32 60.5 7.3 46.25V17.75z',DU_HEX_IN='M32 8.6L52.3 20.3V43.7L32 55.4 11.7 43.7V20.3z';
const _DU_SVG=new Map();
function duelSVG(r){
  const k=r.i;if(_DU_SVG.has(k))return _DU_SVG.get(k);
  const f=r.fam,g='dug-'+r.i,pips=r.steps>1?Array.from({length:r.steps},(_,j)=>{const x=32+(j-(r.steps-1)/2)*5.4;
    return `<path d="M${x} 47.6l1.9 1.9-1.9 1.9-1.9-1.9z" fill="${j<r.step?f.c:'#3a3d45'}"/>`}).join(''):'';
  const out=`<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".22" stop-color="${f.c}"/><stop offset="1" stop-color="${f.c}" stop-opacity=".35"/></linearGradient>
    <linearGradient id="${g}-i" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1d21"/><stop offset="1" stop-color="#09090b"/></linearGradient></defs>
    <path d="${DU_HEX}" fill="url(#${g})"/><path d="${DU_HEX_IN}" fill="url(#${g}-i)"/><path d="${DU_HEX_IN}" fill="none" stroke="${f.c}" stroke-opacity=".3" stroke-width="1"/>
    ${DU_ICON[f.icon](f.c)}${pips}</svg>`;
  _DU_SVG.set(k,out);return out;
}
// pastille au format des niveaux (.lvl) : cartes du salon de groupe, barre du haut, tableaux
const duelLvlHTML=(e,big=false)=>{const r=duelRankOf(e);return `<div class="lvl du-lvl du-${r.fam.id}${big?' lvl-lg':''}" title="${escA(r.name)} · ${e??1000} ELO 1v1">${duelSVG(r)}</div>`};

// ---------- salon ----------
const DU_LB={rows:null,at:0,loading:false,err:false};
async function duLoadTop(force){
  if(DU_LB.loading||(!force&&DU_LB.rows&&Date.now()-DU_LB.at<60e3))return;
  DU_LB.loading=true;DU_LB.err=false;
  try{
    let rows;
    if(typeof fbLive==='function'&&fbLive()){
      const d=await fbReq('profiles?orderBy=%22eloDuel%22&limitToLast=50');
      if(d==null)throw new Error('offline');
      rows=Object.entries(d).filter(([,u])=>u&&typeof u.eloDuel==='number'&&u.name).map(([k,u])=>({key:k,...u,elo:u.eloDuel}));
    }else rows=(typeof LB!=='undefined'?LB:[]).map(p=>({...p,elo:p.eloDuel??p.elo}));
    DU_LB.rows=rows.sort((a,b)=>b.elo-a.elo);DU_LB.at=Date.now();
  }catch(e){DU_LB.err=true}
  DU_LB.loading=false;
  if(!$('#duel').hidden)renderDuel();
}
const duFmt=s=>{s=Math.max(0,s|0);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const duOnPhone=()=>innerWidth<=720;
function duFindHTML(){
  if(state.searching&&state.mode==='duel')
    return `<span class="fl">${t('searching_btn')} <b id="duQt">${qStart?duFmt((Date.now()-qStart)/1000):'00:00'}</b></span><span class="t">${t('click_cancel')}</span>`;
  return `<span class="fl">${t('du_find')}</span><span class="t">${t('du_find_s',{r:regObj().name})}</span>`;
}
function duSyncFind(){
  const b=$('#duFind');if(!b)return;
  const on=state.searching&&state.mode==='duel';
  b.classList.toggle('searching',on);b.classList.toggle('banned',typeof banned==='function'&&banned());
  b.disabled=state.searching&&state.mode!=='duel';
  b.innerHTML=duFindHTML();
}
function renderDuel(){
  const box=$('#duel');if(!box)return;
  const e=ME.eloDuel??1000,R=duelRankOf(e),N=DU_RANKS[R.i+1];
  const pct=N?Math.round((e-R.min)/(N.min-R.min)*100):100;
  const m=ME.matchesDuel||0,w=ME.winsDuel||0,peak=Math.max(ME.peakEloDuel||0,e);
  const stat=(k,v)=>`<div class="du-stat"><b>${v}</b><span>${t(k)}</span></div>`;
  const ladder=[...DU_RANKS].reverse().map(r=>`<li class="${r===R?'me':''}" style="--c:${r.fam.c}"><span class="du-emb">${duelSVG(r)}</span><span class="du-ln">${escA(r.name)}</span>${r===R?`<span class="du-you">${t('du_you')}</span>`:''}<span class="du-lm">${r.min?r.min+'+':'< '+DU_RANKS[1].min}</span></li>`).join('');
  let top;
  if(!DU_LB.rows)top=`<p class="du-note">${t(DU_LB.err?'du_err':'du_load')}</p>`;
  else if(!DU_LB.rows.length)top=`<p class="du-note">${t('du_empty')}</p>`;
  else{
    const me=n=>n&&ME.name&&String(n).toLowerCase()===ME.name.toLowerCase();
    top=`<ol class="du-top">${DU_LB.rows.slice(0,20).map((p,i)=>{const wr=p.matchesDuel?Math.round((p.winsDuel||0)/p.matchesDuel*100)+'%':'—';
      return `<li class="${me(p.name)?'me':''}"><span class="du-pos">${i+1}</span>${duelLvlHTML(p.elo)}<span class="du-pn" data-profile="${escA(p.name)}">${escA(p.name)}</span><span class="du-pm">${p.matchesDuel||0} · ${wr}</span><b class="du-pe">${p.elo}</b></li>`}).join('')}</ol>`;
  }
  const maps=MAPS.filter(isAimMap).map(x=>`<span class="du-chip">${escA(x.wm?.bsp||(x.slug.startsWith('aim_')||x.slug.startsWith('awp_')?x.slug:'de_'+x.slug))}</span>`).join('');
  box.innerHTML=`<div class="du-wrap">
    <section class="du-hero" style="--c:${R.fam.c}">
      <div class="du-big">${duelSVG(R)}</div>
      <div class="du-me">
        <div class="du-kicker">${t('du_kicker')}</div>
        <h1 class="du-rank">${escA(R.name)}</h1>
        <div class="du-elo"><b>${e}</b> ${t('du_elo')}</div>
        <div class="du-prog" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
        <div class="du-next">${N?t('du_next',{n:N.min-e,r:escA(N.name)}):t('du_max')}</div>
      </div>
      <div class="du-side">
        <div class="du-stats">${stat('du_m',m)}${stat('du_w',w)}${stat('du_wr',m?Math.round(w/m*100)+'%':'—')}${stat('du_peak',peak)}</div>
        ${duOnPhone()?`<p class="du-note">${t('du_pc')}</p>`:`<button class="find du-find" id="duFind" type="button">${duFindHTML()}</button>`}
      </div>
    </section>
    <div class="du-grid">
      <section class="card du-card"><h3 class="du-h">${t('du_ladder')}</h3><p class="du-sub">${t('du_ladder_d')}</p><ul class="du-ladder">${ladder}</ul></section>
      <div class="du-col">
        <section class="card du-card"><h3 class="du-h">${t('du_top')}</h3>${top}</section>
        <section class="card du-card"><h3 class="du-h">${t('du_maps')}</h3><div class="du-chips">${maps}</div>
          <h3 class="du-h" style="margin-top:16px">${t('du_rules')}</h3><ul class="du-rules"><li>${t('du_r1')}</li><li>${t('du_r2')}</li><li>${t('du_r3')}</li></ul></section>
      </div>
    </div>
  </div>`;
  duSyncFind();
  duLoadTop();
}
(function(){
  const box=$('#duel');if(!box)return;
  $$('[data-i18n="nav_duel"]').forEach(x=>{x.textContent=t('nav_duel')});
  $$('[data-i18n-title="nav_duel"]').forEach(x=>{x.title=t('nav_duel')});
  box.addEventListener('click',e=>{
    if(!e.target.closest('#duFind'))return;
    if(state.searching){if(state.mode==='duel')$('#find').click();return}
    if(state.mode!=='duel'){const tile=$('#modes .mode[data-id="duel"]');if(tile)tile.click();else{state.mode='duel';renderAll()}}
    if(state.mode==='duel')$('#find').click();
    duSyncFind();
  });
  // le bouton du salon suit l'état de la file (lancée ou annulée ici, sur la page Jouer ou par le chef du groupe)
  const oSet=setFind;setFind=function(){const r=oSet.apply(this,arguments);duSyncFind();return r};
  setInterval(()=>{if(state.searching&&state.mode==='duel'&&!box.hidden){const q=$('#duQt');if(q&&qStart)q.textContent=duFmt((Date.now()-qStart)/1000)}},1000);
  // barre du haut et profil : rang de l'arène en mode 1v1
  if(typeof refreshMe==='function'){const o=refreshMe;refreshMe=function(){o.apply(this,arguments);
    if(state.mode==='duel'&&$('#topLvl'))$('#topLvl').innerHTML=duelLvlHTML(ME.eloDuel??1000)}}
  if(typeof decorateProfile==='function'){const o=decorateProfile;decorateProfile=function(){o.apply(this,arguments);
    const c=$('#profile .p-duel');if(!c||c.dataset.du)return;
    const ed=(profileTarget||ME).eloDuel??1000,r=duelRankOf(ed);
    c.dataset.du=1;c.innerHTML=`${duelSVG(r)}${escA(r.name)} · ${ed} ELO`;c.style.setProperty('--c',r.fam.c)}}
  // langue changée : on redessine le salon s'il est affiché
  document.addEventListener('click',e=>{if(e.target.closest('[data-lang]'))setTimeout(()=>{if(!box.hidden)renderDuel()},0)});
  if(!box.hidden)renderDuel();
})();
