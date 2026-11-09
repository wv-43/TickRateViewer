Object.assign(I18N.fr,{up_new:'Une nouvelle version du site est disponible.',up_reload:'Recharger'});
Object.assign(I18N.en,{up_new:'A new version of the site is available.',up_reload:'Reload'});
Object.assign(I18N.ru,{up_new:'Доступна новая версия сайта.',up_reload:'Обновить'});
const UPD={base:null,ready:false};
async function updVersion(){try{const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'});return r.ok?(await r.json()).v||null:null}catch(e){return null}}
const updBusy=()=>!!((typeof state!=='undefined'&&state.searching)||(typeof cur!=='undefined'&&cur)||(typeof RM!=='undefined'&&RM.mid));
function updShow(){
  if($('#updBar'))return;
  document.body.insertAdjacentHTML('beforeend',`<div class="upd-bar" id="updBar"><span>${t('up_new')}</span><button class="btn primary sm" data-upd>${t('up_reload')}</button></div>`);
}
async function updCheck(){
  const v=await updVersion();if(!v)return;
  if(!UPD.base){UPD.base=v;return}
  if(v===UPD.base)return;
  UPD.ready=true;updShow();
}
document.addEventListener('click',e=>{if(e.target.closest('[data-upd]'))location.reload()});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden)return;
  if(UPD.ready&&!updBusy())return location.reload();
  updCheck();
});
updCheck();setInterval(updCheck,120e3);
