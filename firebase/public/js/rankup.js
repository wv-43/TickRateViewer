/* =====================================================
 * TICKRATE - écran de fin de match (rankup.js), façon FACEIT
 * À la fin d'un vrai match (ou d'un test « fin réelle ») : victoire / défaite, map et score,
 * compteur d'ELO animé, barre de niveau qui se remplit (passage de niveau), rang CS:GO
 * (l'emblème change avec un flash en cas de promotion), stats du match et drops.
 * ===================================================== */
Object.assign(I18N.fr,{mr_win:'Victoire',mr_loss:'Défaite',mr_draw:'Égalité',mr_level:'Niveau {n}',mr_lvl_up:'Niveau supérieur !',mr_lvl_down:'Niveau perdu',
  mr_rank_up:'Promotion',mr_rank_down:'Rétrogradation',mr_next:'{n} ELO avant le niveau {l}',mr_max:'Niveau maximum',mr_drops:'Drops du match',mr_continue:'Continuer',mr_rank:'Rang'});
Object.assign(I18N.en,{mr_win:'Victory',mr_loss:'Defeat',mr_draw:'Draw',mr_level:'Level {n}',mr_lvl_up:'Level up!',mr_lvl_down:'Level lost',
  mr_rank_up:'Rank up',mr_rank_down:'Rank down',mr_next:'{n} ELO to level {l}',mr_max:'Max level',mr_drops:'Match drops',mr_continue:'Continue',mr_rank:'Rank'});
Object.assign(I18N.ru,{mr_win:'Победа',mr_loss:'Поражение',mr_draw:'Ничья',mr_level:'Уровень {n}',mr_lvl_up:'Новый уровень!',mr_lvl_down:'Уровень потерян',
  mr_rank_up:'Повышение',mr_rank_down:'Понижение',mr_next:'{n} ELO до уровня {l}',mr_max:'Максимальный уровень',mr_drops:'Дропы матча',mr_continue:'Продолжить',mr_rank:'Звание'});

const mrSlug=map=>String(map||'').replace(/^(de|gd|cs)_/,'');
function mrMap(map){
  const s=mrSlug(map),m=(typeof MAPS!=='undefined'?MAPS:[]).find(x=>x.slug===s||x.wm?.bsp===map||x.wm?.slug===s);
  return {n:m?m.n:s.charAt(0).toUpperCase()+s.slice(1),img:`maps/${m&&m.wm?.bsp===map&&m.wm.slug?m.wm.slug:m?m.slug:s}.jpg?v=2.50`};
}
// part de la barre du niveau courant (0..1)
function mrProg(e){const l=lvl(e);if(l>=10)return 1;const lo=LV[l-1],hi=LV[l];return Math.max(0,Math.min(1,(e-lo)/(hi-lo)))}
function mrDropNames(d){
  if(!d||typeof CDB==='undefined')return [];
  return [...(d.cases||[]).map(c=>(CDB.cases.find(x=>x.id===String(c.c))||{n:''}).n),...(d.items||[]).map(i=>EC.name(CDB,i)),...(d.pending||[]).map(p=>EC.name(CDB,{k:p.k,st:!!p.st}))].filter(Boolean);
}

function matchResultShow(m,r,drops){
  const e1=r.elo,e0=r.elo-r.delta,won=m.winner?m.winner===r.team:null,mp=mrMap(m.map);
  const my=r.team==='B'?[...(m.score||[0,0])].reverse():(m.score||[0,0]);
  const l0=lvl(e0),l1=lvl(e1),k0=rankOf(e0),k1=rankOf(e1),wm=m.mode==='wingman';
  const res=won===null?'draw':won?'win':'loss';
  const stat=(v,lb)=>`<div class="mr-st"><b>${v}</b><span>${lb}</span></div>`;
  const dn=mrDropNames(drops);
  document.querySelector('.mr-ov')?.remove();
  const el=document.createElement('div');el.className=`mr-ov ${res}`;
  el.innerHTML=`<div class="mr-card">
    <div class="mr-head" style="background-image:linear-gradient(90deg,rgba(10,11,13,.94) 30%,rgba(10,11,13,.55)),url('${mp.img}')">
      <div><div class="mr-res">${t('mr_'+res)}</div><div class="mr-map">${escA(mp.n)} · ${t(wm?'pf_mode_wm':'pf_mode_5v5')}</div></div>
      <div class="mr-score"><b>${my[0]}</b><i>:</i><b>${my[1]}</b></div>
    </div>
    <div class="mr-body">
      <div class="mr-elo">
        <div class="mr-lvl" data-mrlvl>${lvlHTML(e0,true)}</div>
        <div class="mr-elo-main">
          <div class="mr-elo-row"><b class="mr-num" data-mrnum>${e0}</b><small>ELO</small><span class="mr-delta ${r.delta>=0?'pos':'neg'}">${r.delta>=0?'+':''}${r.delta}</span></div>
          <div class="mr-bar"><i data-mrbar style="width:${mrProg(e0)*100}%"></i></div>
          <div class="mr-bar-t"><span data-mrlv>${t('mr_level',{n:l0})}</span><span data-mrnext></span></div>
          <div class="mr-banner" data-mrban hidden></div>
        </div>
      </div>
      <div class="mr-rank ${k1.i>k0.i?'up':k1.i<k0.i?'down':''}">
        <span class="mr-rank-l">${t('mr_rank')}</span>
        <div class="mr-emb"><img class="mr-emb-old" src="ranks/skillgroup${k0.i+1}.png" alt=""><img class="mr-emb-new" src="ranks/skillgroup${k1.i+1}.png" alt=""></div>
        <b>${escA(k1.name)}</b>
        ${k1.i!==k0.i?`<span class="mr-rank-tag">${t(k1.i>k0.i?'mr_rank_up':'mr_rank_down')}</span>`:''}
      </div>
      <div class="mr-stats">${stat(`${r.k} / ${r.d} / ${r.a}`,'K / D / A')}${stat(kd(r.k,r.d),'K/D')}${stat(r.adr,'ADR')}${stat((r.hs||0)+'%','HS')}${stat((r.kast||0)+'%','KAST')}${stat((+r.rating||0).toFixed(2),t('rating'))}</div>
      ${dn.length?`<div class="mr-drops"><span>${t('mr_drops')}</span>${dn.map(x=>`<em>${escA(x)}</em>`).join('')}</div>`:''}
      <button class="btn primary mr-go" type="button">${t('mr_continue')}</button>
    </div></div>`;
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('on'));
  const close=()=>{el.classList.remove('on');setTimeout(()=>el.remove(),300)};
  el.querySelector('.mr-go').onclick=close;
  el.addEventListener('click',ev=>{if(ev.target===el)close()});
  mrAnimate(el,e0,e1,k0,k1);
}
// compteur et barre : on avance l'ELO pas à pas ; à chaque changement de niveau la barre repart de zéro
function mrAnimate(el,e0,e1,k0,k1){
  const num=el.querySelector('[data-mrnum]'),bar=el.querySelector('[data-mrbar]'),lv=el.querySelector('[data-mrlv]'),
    nx=el.querySelector('[data-mrnext]'),badge=el.querySelector('[data-mrlvl]'),ban=el.querySelector('[data-mrban]');
  const reduce=document.documentElement.classList.contains('rm'),T=reduce?1:1600,t0=performance.now()+(reduce?0:700);
  let curL=lvl(e0);
  const setNext=e=>{const l=lvl(e);nx.textContent=l>=10?t('mr_max'):t('mr_next',{n:LV[l]-e,l:l+1})};setNext(e0);
  const step=now=>{
    const p=Math.max(0,Math.min(1,(now-t0)/T)),q=1-Math.pow(1-p,3),e=Math.round(e0+(e1-e0)*q),l=lvl(e);
    num.textContent=e;
    if(l!==curL){                         // passage de niveau : badge qui saute, bandeau, barre repartie
      const up=l>curL;curL=l;
      badge.innerHTML=lvlHTML(e,true);badge.classList.remove('pop');void badge.offsetWidth;badge.classList.add('pop');
      lv.textContent=t('mr_level',{n:l});ban.textContent=t(up?'mr_lvl_up':'mr_lvl_down');ban.className=`mr-banner ${up?'up':'down'}`;ban.hidden=false;
      bar.style.transition='none';bar.style.width=(up?0:100)+'%';void bar.offsetWidth;bar.style.transition='';
      if(typeof beep==='function'){if(up){beep(659,.08);beep(880,.1,.1);beep(1175,.2,.2)}else beep(330,.25)}
    }
    bar.style.width=mrProg(e)*100+'%';setNext(e);
    if(p<1)requestAnimationFrame(step);
    else if(k1.i!==k0.i){el.querySelector('.mr-rank').classList.add('go');if(typeof beep==='function'&&k1.i>k0.i){beep(523,.1);beep(784,.12,.12);beep(1047,.3,.24)}}
  };
  requestAnimationFrame(step);
}
// fin d'un vrai match : l'écran remplace le simple message
(()=>{const o=rmEnd;rmEnd=function(m,mid){
  try{const r=m&&m.status==='finished'&&(m.results||{})[FBA.uid];
    if(r&&(!m.test||m.testReal)&&typeof r.elo==='number'&&typeof r.delta==='number')setTimeout(()=>matchResultShow(m,r,(m.drops||{})[FBA.uid]),500)}catch(e){}
  return o.apply(this,arguments)}})();
