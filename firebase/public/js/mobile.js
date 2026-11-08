/* =====================================================
 * TICKRATE - menu « Plus » du téléphone (mobile.js)
 * On ne joue pas à CS:GO sur téléphone : l'onglet « Jouer » devient « Accueil » (sans file d'attente, voir mobile.css).
 * Sous 720 px le menu latéral est masqué : la barre du bas garde 4 pages et « Plus » ouvre un panneau
 * avec toutes les autres entrées du menu latéral (mêmes libellés, mêmes icônes), la langue et les pages légales.
 * ===================================================== */
Object.assign(I18N.fr,{nav_more:'Plus',ms_lang:'Langue',nav_home:'Accueil'});
Object.assign(I18N.en,{nav_more:'More',ms_lang:'Language',nav_home:'Home'});
Object.assign(I18N.ru,{nav_more:'Ещё',ms_lang:'Язык',nav_home:'Главная'});
(function(){
  const nav=$('.mnav');if(!nav)return;
  $$('[data-i18n="nav_home"]').forEach(e=>{e.textContent=t('nav_home')});   // libellé ajouté après le premier affichage des textes
  const MORE_IC='<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M204 240H68a36 36 0 01-36-36V68a36 36 0 0136-36h136a36 36 0 0136 36v136a36 36 0 01-36 36zM444 240H308a36 36 0 01-36-36V68a36 36 0 0136-36h136a36 36 0 0136 36v136a36 36 0 01-36 36zM204 480H68a36 36 0 01-36-36V308a36 36 0 0136-36h136a36 36 0 0136 36v136a36 36 0 01-36 36zM444 480H308a36 36 0 01-36-36V308a36 36 0 0136-36h136a36 36 0 0136 36v136a36 36 0 01-36 36z"/></svg>';
  nav.insertAdjacentHTML('beforeend',`<button type="button" data-more aria-haspopup="dialog" aria-expanded="false">${MORE_IC}<span data-i18n="nav_more">${t('nav_more')}</span></button>`);
  document.body.insertAdjacentHTML('beforeend','<div class="msheet" id="msheet" hidden><div class="msh-back" data-msclose></div><div class="msh-panel" role="dialog" aria-modal="true"><div class="msh-grip"></div><div id="msBody"></div></div></div>');
  const sheet=$('#msheet'),btn=nav.querySelector('[data-more]');
  const inBar=()=>new Set($$('.mnav [data-view]').map(b=>b.dataset.view));

  // contenu : les sections du menu latéral, sans les pages déjà dans la barre du bas
  function fill(){
    const skip=inBar(),cur=($('.rail [data-view].active')||{}).dataset?.view;
    let html='',grid='',sec='';
    const flush=()=>{if(grid)html+=(sec?`<div class="msh-sec">${sec}</div>`:'')+`<div class="msh-grid">${grid}</div>`;grid=''};
    for(const el of $$('.rail > .rail-sec, .rail > .rail-btn')){
      if(el.classList.contains('rail-sec')){flush();sec=escA(el.textContent.trim());continue}
      const v=el.dataset.view,svg=(el.querySelector('svg')||{}).outerHTML||'',label=escA((el.querySelector('.rl')||el).textContent.trim());
      if(v&&skip.has(v))continue;
      grid+=v?`<button type="button" class="msh-item${v===cur?' active':''}" data-msview="${escA(v)}">${svg}<span>${label}</span></button>`
        :`<a class="msh-item discord" href="${escA(el.getAttribute('href')||'#')}" target="_blank" rel="noopener noreferrer" data-msclose>${svg}<span>${label}</span></a>`;
    }
    flush();
    html+=`<div class="msh-sec">${t('ms_lang')}</div><div class="msh-langs">${LANGS.map(l=>`<button type="button" data-lang="${l.id}" class="${l.id===lang?'on':''}">${l.id.toUpperCase()}</button>`).join('')}</div>`;
    html+=`<div class="msh-legal"><a href="/mentions-legales">${t('lg_legal')}</a><a href="/confidentialite">${t('lg_privacy')}</a></div>`;
    $('#msBody').innerHTML=html;
  }
  function open(){fill();sheet.hidden=false;btn.setAttribute('aria-expanded','true');requestAnimationFrame(()=>sheet.classList.add('on'))}
  function close(){if(sheet.hidden)return;sheet.classList.remove('on');btn.setAttribute('aria-expanded','false');setTimeout(()=>{if(!sheet.classList.contains('on'))sheet.hidden=true},260)}
  btn.addEventListener('click',()=>sheet.hidden?open():close());
  sheet.addEventListener('click',e=>{
    const v=e.target.closest('[data-msview]');
    if(v){close();setView(v.dataset.msview);return}
    if(e.target.closest('[data-msclose],[data-lang]'))close();
  });
  addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  addEventListener('resize',()=>{if(innerWidth>720)close()});
  // « Plus » s'allume quand la page affichée n'a pas d'onglet dans la barre du bas
  const mark=()=>{const a=$('.rail [data-view].active');btn.classList.toggle('active',!!a&&!inBar().has(a.dataset.view))};
  new MutationObserver(mark).observe($('.rail'),{subtree:true,attributes:true,attributeFilter:['class']});
  mark();
})();
