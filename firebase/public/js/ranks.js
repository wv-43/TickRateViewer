/* =====================================================
 * TICKRATE - Rangs façon CS:GO (ranks.js)
 * 18 rangs de Silver I à The Global Elite, calculés depuis l'ELO.
 * Ils servent à la fois de ligues (familles) et de badge de niveau.
 * Emblèmes : vraies images des rangs CS:GO (ranks/skillgroupN.png) ; la Pro League garde son SVG.
 * ===================================================== */
// familles = ligues de la page Compétition (pc = part des joueurs, tc = récompense de fin de saison)
// noms officiels de CS:GO dans chaque langue ; « name » / « n » suivent la langue du site (variable lang)
const RK_T=o=>({get(){return o[typeof lang==='string'?lang:'fr']||o.en}});
const RANK_FAM=[
  ['silver', {fr:'Argent',en:'Silver',ru:'Серебро'},                              0,   '#c3ccd6','#5d6773','chev', 22, 100],
  ['gold',   {fr:"Nova d'or",en:'Gold Nova',ru:'Золотая Звезда'},              1100,'#f2c443','#8f620f','star', 30, 300],
  ['master', {fr:'Maître gardien',en:'Master Guardian',ru:'Магистр-хранитель'},  1500,'#72b4ff','#244f99','guard',28, 700],
  ['eagle',  {fr:'Aigle légendaire',en:'Legendary Eagle',ru:'Легендарный Беркут'},1950,'#cf9bff','#5b2f99','wings',13, 1500],
  ['supreme',{fr:'Suprême',en:'Supreme',ru:'Великий Магистр'},                   2250,'#ff9157','#94300f','crest',4,  2200],
  ['elite',  {fr:'Élite mondiale',en:'Global Elite',ru:'Всемирная Элита'},       2400,'#ff5d6c','#7e1424','globe',2.9,3000]
].map(([id,n,min,c,c2,icon,pc,tc])=>Object.defineProperty({id,min,c,c2,icon,pc,tc},'n',RK_T(n)));
const RANKS=[
  ['silver',{fr:'Argent I',en:'Silver I',ru:'Серебро I'},0],
  ['silver',{fr:'Argent II',en:'Silver II',ru:'Серебро II'},600],
  ['silver',{fr:'Argent III',en:'Silver III',ru:'Серебро III'},700],
  ['silver',{fr:'Argent IV',en:'Silver IV',ru:'Серебро IV'},800],
  ['silver',{fr:'Argent Élite',en:'Silver Elite',ru:'Серебро – Элита'},900],
  ['silver',{fr:'Argent Élite Master',en:'Silver Elite Master',ru:'Серебро – Великий Магистр'},1000],
  ['gold',{fr:"Nova d'or I",en:'Gold Nova I',ru:'Золотая Звезда I'},1100],
  ['gold',{fr:"Nova d'or II",en:'Gold Nova II',ru:'Золотая Звезда II'},1200],
  ['gold',{fr:"Nova d'or III",en:'Gold Nova III',ru:'Золотая Звезда III'},1300],
  ['gold',{fr:"Nova d'or Master",en:'Gold Nova Master',ru:'Золотая Звезда – Магистр'},1400],
  ['master',{fr:'Maître gardien I',en:'Master Guardian I',ru:'Магистр-хранитель I'},1500],
  ['master',{fr:'Maître gardien II',en:'Master Guardian II',ru:'Магистр-хранитель II'},1600],
  ['master',{fr:'Maître gardien Élite',en:'Master Guardian Elite',ru:'Магистр-хранитель – Элита'},1700],
  ['master',{fr:'Maître gardien distingué',en:'Distinguished Master Guardian',ru:'Заслуженный Магистр-хранитель'},1800],
  ['eagle',{fr:'Aigle légendaire',en:'Legendary Eagle',ru:'Легендарный Беркут'},1950],
  ['eagle',{fr:'Maître aigle légendaire',en:'Legendary Eagle Master',ru:'Легендарный Беркут-магистр'},2100],
  ['supreme',{fr:'Maître suprême de première classe',en:'Supreme Master First Class',ru:'Великий Магистр Высшего Ранга'},2250],
  ['elite',{fr:'Élite mondiale',en:'The Global Elite',ru:'Всемирная Элита'},2400]
].map(([f,n,min],i,all)=>{const fam=RANK_FAM.find(x=>x.id===f),sib=all.filter(r=>r[0]===f);
  return Object.defineProperty({i,min,fam,step:sib.findIndex(r=>r[1]===n)+1,steps:sib.length},'name',RK_T(n))});
const rankOf=elo=>[...RANKS].reverse().find(r=>(elo||0)>=r.min)||RANKS[0];

// ---------- emblèmes ----------
const RK_ICON={
  chev:c=>`<path d="M21 22.5l11 7 11-7M21 30.5l11 7 11-7" fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  star:c=>`<path d="M32 18.5l3.9 8 8.8 1.2-6.4 6.1 1.6 8.7L32 38.4l-7.9 4.1 1.6-8.7-6.4-6.1 8.8-1.2z" fill="${c}"/>`,
  guard:c=>`<path d="M32 17.5l10 4v7.5c0 6.5-4.2 11-10 13.5-5.8-2.5-10-7-10-13.5v-7.5z" fill="none" stroke="${c}" stroke-width="2.8" stroke-linejoin="round"/><path d="M27 30.5l5-4.5 5 4.5" fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  wings:c=>`<path d="M32 40.5c-3.2-5.8-9.6-9-17-10.8 2.4 6.6 8.3 10.9 17 12.6 8.7-1.7 14.6-6 17-12.6-7.4 1.8-13.8 5-17 10.8z" fill="${c}"/><path d="M32 39c-2.6-6.6-8.4-11.2-15-13.6M32 39c2.6-6.6 8.4-11.2 15-13.6" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" opacity=".55"/><circle cx="32" cy="24" r="3.6" fill="${c}"/>`,
  crest:c=>`<path d="M32 41.5c-3-5-8.6-7.8-15-9.4 2.1 5.7 7.2 9.4 15 10.9 7.8-1.5 12.9-5.2 15-10.9-6.4 1.6-12 4.4-15 9.4z" fill="${c}"/><path d="M32 15.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L32 28.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="${c}"/>`,
  globe:c=>`<circle cx="32" cy="30" r="11.5" fill="none" stroke="${c}" stroke-width="2.6"/><ellipse cx="32" cy="30" rx="5" ry="11.5" fill="none" stroke="${c}" stroke-width="2"/><path d="M20.5 30h23M22.5 23.5h19M22.5 36.5h19" stroke="${c}" stroke-width="1.8"/>`,
  pro:c=>`<path d="M32 15l4.2 8.6 9.4 1.3-6.8 6.6 1.6 9.4L32 36.5l-8.4 4.4 1.6-9.4-6.8-6.6 9.4-1.3z" fill="${c}"/><path d="M19 44c4 2.6 8.4 3.8 13 3.8s9-1.2 13-3.8" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`
};
const RK_SHIELD='M32 3.5L58 12.5V32c0 15-11.5 24.8-26 29.5C17.5 56.8 6 47 6 32V12.5z';
const RK_INNER='M32 8.5L53.5 16v16c0 12.2-9.3 20.4-21.5 24.6C19.8 52.4 10.5 44.2 10.5 32V16z';
// f : famille (ou PRO) ; step/steps : position du sous-rang (repères sous l'icône)
function rankSVGDrawn(f,step=0,steps=0){
  const g='rkg-'+f.id,pips=steps>1?Array.from({length:steps},(_,k)=>{const x=32+(k-(steps-1)/2)*5.2;
    return `<path d="M${x} 47.2l1.8 1.8-1.8 1.8-1.8-1.8z" fill="${k<step?f.c:'#3a3d45'}"/>`}).join(''):'';
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".18" stop-color="${f.c}"/><stop offset="1" stop-color="${f.c2}"/></linearGradient>
    <linearGradient id="${g}-i" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1f24"/><stop offset="1" stop-color="#0a0b0d"/></linearGradient></defs>
    <path d="${RK_SHIELD}" fill="url(#${g})"/><path d="${RK_INNER}" fill="url(#${g}-i)"/>
    <path d="${RK_INNER}" fill="none" stroke="${f.c}" stroke-opacity=".28" stroke-width="1"/>
    ${RK_ICON[f.icon](f.c)}${pips}</svg>`;
}
// Vrais emblèmes des rangs CS:GO (skillgroup1.png … skillgroup18.png, fichiers du jeu).
// f = famille ; step = sous-rang (1…n). Sans step (emblème de ligue) : le plus haut rang de la famille.
function rankImgIndex(f,step=0){
  const fam=RANKS.filter(r=>r.fam.id===f.id);
  if(!fam.length)return 18;
  const r=step?fam.find(x=>x.step===step)||fam[fam.length-1]:fam[fam.length-1];
  return r.i+1;
}
// ---------- Pro League : plaque dorée au format des rangs (5:2), laurier + couronne + reflet ----------
// rank : place mondiale (1…20) affichée sous « PRO » ; sans rank : « LEAGUE »
const PRO_LAUREL=(()=>{
  const pt=(t,a,b,c)=>(1-t)*(1-t)*a+2*(1-t)*t*b+t*t*c;   // courbe de Bézier quadratique
  const P0=[48,68],P1=[12,54],P2=[30,14],leaf='M0 0Q4.5-3.2 9.5 0Q4.5 3.2 0 0Z';   // feuille pointue, base à l'origine
  let out='';
  for(let k=0;k<8;k++){
    const t=.06+k*.12,x=pt(t,P0[0],P1[0],P2[0]),y=pt(t,P0[1],P1[1],P2[1]);
    const ang=Math.atan2(2*(1-t)*(P1[1]-P0[1])+2*t*(P2[1]-P1[1]),2*(1-t)*(P1[0]-P0[0])+2*t*(P2[0]-P1[0]))*180/Math.PI,s=(1.05-k*.055).toFixed(2);
    // une paire de feuilles à chaque nœud, inclinées vers le haut de la branche
    for(const side of [-42,42])out+=`<path d="${leaf}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(ang+side).toFixed(0)}) scale(${s})"/>`;
  }
  out+=`<path d="${leaf}" transform="translate(${P2[0]} ${P2[1]}) rotate(-75) scale(.85)"/>`;      // feuille du bout
  return `<path d="M${P0}Q${P1} ${P2}" fill="none" stroke="url(#pro-gold)" stroke-width="1.6" stroke-linecap="round"/><g fill="url(#pro-gold)">${out}</g>`;
})();
const _PRO_SVG_CACHE=new Map();
function proSVG(rank){
  const k=rank||0;
  if(_PRO_SVG_CACHE.has(k))return _PRO_SVG_CACHE.get(k);
  const plate='M16 6H184L196 40 184 74H16L4 40Z',inner='M20 11.5H180L190 40 180 68.5H20L10 40Z';
  const out=`<svg class="pro-svg" viewBox="0 0 200 80" aria-hidden="true"><defs>
    <linearGradient id="pro-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6cf"/><stop offset=".45" stop-color="#f2c14e"/><stop offset="1" stop-color="#9c6512"/></linearGradient>
    <linearGradient id="pro-in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2110"/><stop offset=".55" stop-color="#120e07"/><stop offset="1" stop-color="#060504"/></linearGradient>
    <linearGradient id="pro-shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <clipPath id="pro-clip"><path d="${plate}"/></clipPath></defs>
    <path d="${plate}" fill="url(#pro-gold)"/><path d="${inner}" fill="url(#pro-in)"/>
    <path d="${inner}" fill="none" stroke="#f2c14e" stroke-opacity=".35" stroke-width="1"/>
    <g opacity=".95">${PRO_LAUREL}</g><g transform="translate(200 0) scale(-1 1)" opacity=".95">${PRO_LAUREL}</g>
    <path d="M89 27.5l2.4-9.5 5.2 5.4L100 15l3.4 8.4 5.2-5.4 2.4 9.5z" fill="url(#pro-gold)"/><rect x="89" y="28.6" width="22" height="2.6" rx="1" fill="url(#pro-gold)"/>
    <text x="100" y="55" text-anchor="middle" font-family="Rajdhani,sans-serif" font-weight="800" font-size="26" letter-spacing="3" fill="url(#pro-gold)">PRO</text>
    <text x="100" y="66.5" text-anchor="middle" font-family="Rajdhani,sans-serif" font-weight="700" font-size="9" letter-spacing="3.4" fill="#f2c14e" fill-opacity=".85">${rank?'TOP #'+rank:'LEAGUE'}</text>
    <g clip-path="url(#pro-clip)"><rect class="pro-sweep" x="-60" y="-10" width="40" height="100" fill="url(#pro-shine)" transform="skewX(-20)"/></g></svg>`;
  _PRO_SVG_CACHE.set(k,out);
  return out;
}
const _RK_SVG_CACHE=new Map();
function rankSVG(f,step=0,steps=0){
  if(f.id==='pro')return proSVG();
  const k=`${typeof lang==='string'?lang:'fr'}:${f.id}:${step}`;
  if(_RK_SVG_CACHE.has(k))return _RK_SVG_CACHE.get(k);
  const n=rankImgIndex(f,step),r=RANKS[n-1];
  const out=`<img class="rk-img" src="ranks/skillgroup${n}.png" alt="${r?r.name:''}" width="55" height="22" draggable="false" loading="lazy" decoding="async">`;
  _RK_SVG_CACHE.set(k,out);
  return out;
}
const rankEmblem=(r,cls='')=>`<span class="rk-emb ${cls}" title="${r.name}">${rankSVG(r.fam,r.step,r.steps)}</span>`;
