(function(){
  let c=null;
  try{c=JSON.parse(localStorage.getItem('tr_music')||'null')}catch(e){}
  if(!c||c.hidden||!((c.list&&c.list.length)||c.url)||window.I18N)return;

  const root=document.documentElement;
  let code='fr';
  try{code=(localStorage.getItem('cs_lang')||root.lang||'fr').slice(0,2)}catch(e){}
  window.I18N={fr:{},en:{},ru:{}};
  const lang=window.I18N[code]?code:'fr';
  window.t=(k,v={})=>{let s=(window.I18N[lang]&&window.I18N[lang][k])??window.I18N.fr[k]??k;for(const x in v)s=s.split('{'+x+'}').join(v[x]);return s};
  window.fbCall=async()=>({error:'network'});

  root.classList.add('trm-lite');
  const css=document.createElement('style');
  css.textContent='#trMusic,#trmLayout,#trmSnap{--acc:#f5f5f5;--acc-h:#fff;--acc-rgb:245,245,245;--on-acc:#0a0a0a;--line:rgba(255,255,255,.08);--line2:rgba(255,255,255,.14);--text:#ececec;--muted:#9a9a9a;--dim:#6e6e73;--panel2:#1c1c1e;--panel3:#2c2c2e;--bg2:#101012;--red:#f43f5e;--font-main:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif}'
    +'html.trm-lite body{padding-bottom:var(--trm-h,0px);padding-right:var(--trm-side,0px)}'
    +'html.trm-lite .trm-acct{display:none}';
  document.head.appendChild(css);

  const add=src=>new Promise((ok,ko)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=ko;document.head.appendChild(s)});
  add('/js/sc-account.js?v=3').then(()=>add('/js/music.js?v=9')).catch(()=>{});
})();
