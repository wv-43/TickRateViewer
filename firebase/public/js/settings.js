/* =====================================================
 * TICKRATE - Menu Paramètres & Système de Thèmes / Custom CSS (settings.js)
 * ===================================================== */
/* =====================================================
   PARAMÈTRES (page dédiée) : compte, audio & vocal, notifications, interface, confidentialité
   Stockés dans ce navigateur + copiés dans Firebase (private/<id>/settings, lisible par toi seul) quand tu es connecté.
   ===================================================== */
const CSS_THEMES=[
  {id:'amber',n:'th_amber',d:'th_amber_d',c:'#ffb21f'},
  {id:'crimson',n:'Crimson Red',d:'th_crimson_d',c:'#ff4d5e'},
  {id:'cyber',n:'Cyber Blue',d:'th_cyber_d',c:'#3b9eff'},
  {id:'emerald',n:'th_emerald',d:'th_emerald_d',c:'#3fcf8e'},
  {id:'violet',n:'th_violet',d:'th_violet_d',c:'#9d6cff'}
];
const CSS_SURFACES=[
  {id:'carbon',n:'th_carbon',d:'th_carbon_d',c:'#0d0e10'},
  {id:'oled',n:'th_oled',d:'th_oled_d',c:'#000000'},
  {id:'slate',n:'th_slate',d:'th_slate_d',c:'#101622'}
];
const SET_DEF={
  notif:{sounds:true,dm:true,desktop:false},
  ui:{reduceMotion:false,theme:'amber',surface:'carbon',customCss:''},
  privacy:{showOnline:true,dmFriendsOnly:true,profilePublic:true}
};
let SET=JSON.parse(JSON.stringify(SET_DEF));
function sanitizeCustomCss(raw){
  if(typeof raw!=='string')return '';
  return raw.slice(0,4000)
    .replace(/<\/?\s*style[^>]*>/gi,'')
    .replace(/[<>]/g,'')
    .replace(/@import\b[^;]*;?/gi,'/* @import bloque */')
    .replace(/url\s*\([^)]*\)/gi,'none')
    .replace(/expression\s*\([^)]*\)/gi,'none')
    .replace(/-moz-binding\s*:[^;\}]+/gi,'')
    .replace(/javascript\s*:/gi,'');
}
try{const v=JSON.parse(localStorage.getItem('tr_settings')||'null');if(v){for(const k in SET)Object.assign(SET[k],v[k]||{});SET.ui.customCss=sanitizeCustomCss(SET.ui.customCss)}}catch(e){}
let stTab='account',stSaveT=null;
Object.assign(I18N.fr,{
  del_acc_t:'Zone de danger',del_acc_btn:'Supprimer mon compte',
  del_acc_d:'Supprime définitivement ton compte TICKRATE, ton profil, ton ELO, ton inventaire et tes liaisons Steam. Cette action est irréversible.',
  del_acc_modal_t:'Supprimer définitivement le compte',
  del_acc_modal_d:'Toutes tes données (profil, ELO, historique, inventaire, Tick Coins, amis et liaison Steam) seront effacées immédiatement conformément au RGPD. Pour confirmer, saisis ton pseudo ci-dessous :',
  del_acc_ph:'Saisis « {n} » ou SUPPRIMER',
  del_acc_err:'Saisis exactement ton pseudo ({n}) ou SUPPRIMER pour confirmer.',
  del_acc_in_match:'Impossible de supprimer ton compte pendant un match en cours.',
  del_acc_ok:'Ton compte et toutes tes données ont été supprimés.'
});
Object.assign(I18N.en,{
  del_acc_t:'Danger zone',del_acc_btn:'Delete my account',
  del_acc_d:'Permanently deletes your TICKRATE account, profile, ELO, inventory, and Steam link. This action cannot be undone.',
  del_acc_modal_t:'Permanently delete account',
  del_acc_modal_d:'All your data (profile, ELO, match history, inventory, Tick Coins, friends, and Steam link) will be erased immediately under GDPR. Type your username below to confirm:',
  del_acc_ph:'Type "{n}" or DELETE',
  del_acc_err:'Please type your exact username ({n}) or DELETE to confirm.',
  del_acc_in_match:'Cannot delete your account while in an active match.',
  del_acc_ok:'Your account and all associated data have been deleted.'
});
Object.assign(I18N.ru,{
  del_acc_t:'Опасная зона',del_acc_btn:'Удалить аккаунт',
  del_acc_d:'Навсегда удаляет аккаунт TICKRATE, профиль, ELO, инвентарь и привязку Steam. Это действие необратимо.',
  del_acc_modal_t:'Удаление аккаунта навсегда',
  del_acc_modal_d:'Все твои данные (профиль, ELO, история, инвентарь, монеты, друзья и привязка Steam) будут немедленно удалены. Введи свой ник ниже для подтверждения:',
  del_acc_ph:'Введи «{n}» или DELETE',
  del_acc_err:'Введи точно свой ник ({n}) или DELETE для подтверждения.',
  del_acc_in_match:'Нельзя удалить аккаунт во время активного матча.',
  del_acc_ok:'Твой аккаунт и все данные удалены.'
});
Object.assign(I18N.fr,{ubg_title:'Image de fond',ubg_note:'Choisis une image à afficher derrière toutes les pages. Elle reste dans ce navigateur : elle n\'est jamais envoyée sur nos serveurs, et il faudra la remettre sur un autre appareil. Sans image, c\'est le logo TICKRATE qui s\'affiche.',ubg_pick:'Choisir une image',ubg_change:'Changer d\'image',ubg_remove:'Retirer',ubg_dim:'Assombrissement',ubg_ok:'Image de fond appliquée.',ubg_removed:'Image de fond retirée.',ubg_err_type:'Format non pris en charge : utilise un PNG, JPG ou WebP.',ubg_err_size:'Image trop lourde (25 Mo maximum).',ubg_err_decode:'Impossible de lire cette image.',ubg_err_store:'Ce navigateur refuse d\'enregistrer l\'image (navigation privée ?).'});
Object.assign(I18N.en,{ubg_title:'Background image',ubg_note:'Pick an image to show behind every page. It stays in this browser: it is never sent to our servers, and you will need to add it again on another device. Without an image, the TICKRATE logo is shown.',ubg_pick:'Choose an image',ubg_change:'Change image',ubg_remove:'Remove',ubg_dim:'Darkness',ubg_ok:'Background image applied.',ubg_removed:'Background image removed.',ubg_err_type:'Unsupported format: use a PNG, JPG or WebP.',ubg_err_size:'Image too large (25 MB maximum).',ubg_err_decode:'This image could not be read.',ubg_err_store:'This browser refused to save the image (private window?).'});
Object.assign(I18N.ru,{ubg_title:'Фоновое изображение',ubg_note:'Выбери изображение для фона всех страниц. Оно остаётся в этом браузере и никогда не отправляется на наши серверы; на другом устройстве его нужно добавить заново. Без изображения показывается логотип TICKRATE.',ubg_pick:'Выбрать изображение',ubg_change:'Сменить изображение',ubg_remove:'Убрать',ubg_dim:'Затемнение',ubg_ok:'Фон применён.',ubg_removed:'Фон убран.',ubg_err_type:'Формат не поддерживается: используй PNG, JPG или WebP.',ubg_err_size:'Файл слишком большой (максимум 25 МБ).',ubg_err_decode:'Не удалось прочитать изображение.',ubg_err_store:'Браузер не дал сохранить изображение (приватный режим?).'});
function saveSet(){
  SET.ui.customCss=sanitizeCustomCss(SET.ui.customCss);
  try{localStorage.setItem('tr_settings',JSON.stringify(SET))}catch(e){}
  applySet();
  clearTimeout(stSaveT);stSaveT=setTimeout(()=>{if(AUTH&&AUTH.session&&typeof fbReq==='function'){fbReq(`private/${fbUserKey()}/settings`,'PUT',{...SET,updatedAt:Date.now()})}},1200);
}
function renderThemePop(){
  const pop=$('#themePop');if(!pop)return;
  const curT=SET.ui.theme||'amber',curS=SET.ui.surface||'carbon';
  pop.innerHTML=`<div class="theme-pop-h"><span>${t('th_accent')}</span></div>
    <div class="theme-pop-dots">${CSS_THEMES.map(th=>`<button class="theme-pop-dot ${curT===th.id?'on':''}" data-qtheme="${th.id}" title="${t(th.n)}" style="background:${th.c}"></button>`).join('')}</div>
    <div class="theme-pop-h" style="margin-top:6px"><span>${t('th_bg')}</span></div>
    <div class="seg" style="width:100%;margin-bottom:10px">${CSS_SURFACES.map(sf=>`<button class="${curS===sf.id?'on':''}" style="flex:1" data-qsurf="${sf.id}">${t(sf.n)}</button>`).join('')}</div>
    <button class="btn sm ghost" style="width:100%" data-qcss>${t('th_editor')}</button>`;
}
function applySet(){
  document.documentElement.classList.toggle('rm',!!SET.ui.reduceMotion);
  document.documentElement.dataset.theme=SET.ui.theme||'amber';
  document.documentElement.dataset.surface=SET.ui.surface||'carbon';
  const customEl=$('#userCustomCss');
  if(customEl)customEl.textContent=sanitizeCustomCss(SET.ui.customCss||'');
  renderThemePop();
}
// interrupteur d'un réglage (lu par le listener 'change' ci-dessous via son id)
const tog=(id,on,label,hint)=>`<label class="st-tog"><span><b>${label}</b>${hint?`<small>${hint}</small>`:''}</span><input type="checkbox" id="${id}"${on?' checked':''}><i class="sw"></i></label>`;
function renderSettings(){
  const el=$('#settings'),a=AUTH.session&&AUTH.session.account;
  const tabs=[['account','st_account'],['notif','st_notif'],['ui','st_ui'],['privacy','st_privacy']];
  let body='';
  if(stTab==='account'){
    body=`<div class="st-card"><h3>${t('st_profile')}</h3>
        <div class="st-row"><div class="st-who">${avHTML(ME)}<span><b>${escA(ME.name)}</b><small>${ME.elo} ELO · ${t('level_n',{n:lvl(ME.elo)})}</small></span></div><button class="btn" data-st="editor">${t('st_edit_profile')}</button></div>
        <div class="st-note">${t('st_name_cd')}</div></div>
      <div class="st-card"><h3>${t('st_login')}</h3>
        <div class="st-row"><span><b>${t('au_mail')}</b><small>${a&&a.email?escA(a.email):t('au_none')}</small></span></div>
        <div class="st-row"><span><b>${t('au_pw')}</b><small>${a&&a.has_password?'••••••••':t('au_none')}</small></span><button class="btn" data-st="password">${a&&a.has_password?t('au_change_pw'):t('au_set_pw')}</button></div>
        <div class="st-row"><span><b>Steam</b><small>${ME.steam&&ME.steam.linked?escA(ME.steam.id||''):t('no_steam')}</small></span>${ME.steam&&ME.steam.linked?`<button class="btn ghost" data-st="unlink">${t('unlink')}</button>`:`<button class="btn steam-btn" data-st="link">${t('steam_login')}</button>`}</div></div>
      <div class="st-card"><h3>${t('language')}</h3><div class="seg st-lang">${['fr','en','ru'].map(l=>`<button class="${lang===l?'on':''}" data-stlang="${l}">${{fr:'Français',en:'English',ru:'Русский'}[l]}</button>`).join('')}</div></div>
      <div class="st-card"><div class="st-row"><span><b>${t('au_logout')}</b><small>${a?escA(a.username):''}</small></span><button class="btn" data-st="logout">${t('au_logout')}</button></div></div>
      <div class="st-card st-danger-zone"><h3>${t('del_acc_t')}</h3><div class="st-row"><span><b>${t('del_acc_btn')}</b><small>${t('del_acc_d')}</small></span><button class="btn danger" data-st="delete-account">${t('del_acc_btn')}</button></div></div>`;
  }else if(stTab==='notif'){
    body=`<div class="st-card"><h3>${t('st_notif')}</h3>${tog('stSnd',SET.notif.sounds,t('st_sounds'),t('st_sounds_h'))}${tog('stDm',SET.notif.dm,t('st_dm'),t('st_dm_h'))}${tog('stDesk',SET.notif.desktop,t('st_desk'),t('st_desk_h'))}</div>`;
  }else if(stTab==='ui'){
    const curT=SET.ui.theme||'amber',curS=SET.ui.surface||'carbon';
    body=`<div class="st-card"><h3>${t('th_title_css')}</h3>
        <div class="st-note">${t('th_css_d')}</div>
        <div class="theme-grid">${CSS_THEMES.map(th=>`<button class="theme-swatch ${curT===th.id?'on':''}" data-sttheme="${th.id}"><span class="theme-dot" style="background:${th.c}"></span><span><b>${t(th.n)}</b><small>${t(th.d)}</small></span></button>`).join('')}</div></div>
      <div class="st-card"><h3>${t('th_surface')}</h3>
        <div class="theme-grid">${CSS_SURFACES.map(sf=>`<button class="theme-swatch ${curS===sf.id?'on':''}" data-stsurf="${sf.id}"><span class="theme-dot" style="background:${sf.c}"></span><span><b>${t(sf.n)}</b><small>${t(sf.d)}</small></span></button>`).join('')}</div></div>
      <div class="st-card"><h3>${t('ubg_title')}</h3>
        <div class="st-note">${t('ubg_note')}</div>
        <div class="st-actions"><button class="btn" data-st="bgpick">${t(TRUserBg.has()?'ubg_change':'ubg_pick')}</button>${TRUserBg.has()?`<button class="btn ghost" data-st="bgclear">${t('ubg_remove')}</button>`:''}</div>
        <input type="file" id="stBgFile" accept="image/png,image/jpeg,image/webp" hidden>
        ${TRUserBg.has()?`<label class="st-row" style="margin-top:10px;gap:16px"><span><b>${t('ubg_dim')}</b></span><input type="range" id="stBgDim" min="${TRUserBg.range.min}" max="${TRUserBg.range.max}" value="${TRUserBg.dim()}" style="flex:1;max-width:260px;accent-color:var(--acc)"></label>`:''}</div>
      <div class="st-card"><h3>${t('st_ui')}</h3>${tog('stRm',SET.ui.reduceMotion,t('st_rm'),t('st_rm_h'))}</div>
      <div class="st-card"><h3>${t('th_custom')}</h3>
        <div class="st-note">${t('th_custom_d')}</div>
        <textarea id="stCustomCss" class="css-editor" placeholder="/* Exemple :&#10;:root { --acc: #ff6b00; }&#10;.map { border-radius: 10px; } */" spellcheck="false">${escA(SET.ui.customCss||'')}</textarea>
        <div class="st-actions" style="margin-top:8px"><button class="btn ghost sm" data-st="resetcss">${t('th_reset')}</button></div></div>`;
  }else{
    body=`<div class="st-card"><h3>${t('lg_data')}</h3><div class="st-note">${t('lg_data_d')}</div><div class="st-actions"><a class="btn ghost sm" href="/confidentialite" target="_blank" rel="noopener">${t('lg_privacy')}</a><a class="btn ghost sm" href="/mentions-legales" target="_blank" rel="noopener">${t('lg_legal')}</a></div></div><div class="st-card"><h3>${t('st_privacy')}</h3>${tog('stOnline',SET.privacy.showOnline,t('st_online'),t('st_online_h'))}${tog('stDmF',SET.privacy.dmFriendsOnly,t('st_dmf'),t('st_dmf_h'))}${tog('stPub',SET.privacy.profilePublic,t('st_pub'),t('st_pub_h'))}</div>
      <div class="st-card st-danger-zone"><h3>${t('del_acc_t')}</h3><div class="st-row"><span><b>${t('del_acc_btn')}</b><small>${t('del_acc_d')}</small></span><button class="btn danger" data-st="delete-account">${t('del_acc_btn')}</button></div></div>`;
  }
  el.innerHTML=`<div class="cp-head"><h1 class="h1">${t('nav_settings')}</h1></div>
    <div class="st-wrap"><nav class="st-nav">${tabs.map(([k,l])=>`<button class="${stTab===k?'on':''}" data-sttab="${k}">${t(l)}</button>`).join('')}</nav><div class="st-body">${body}</div></div>`;
}
// ----- interactions page Paramètres -----
$('#settings').addEventListener('input',e=>{const id=e.target.id;
  if(id==='stCustomCss'){SET.ui.customCss=e.target.value;saveSet()}
  if(id==='stBgDim')TRUserBg.setDim(e.target.value);
});
$('#themeBtn')?.addEventListener('click',e=>{
  e.stopPropagation();
  if(typeof toggleNotifs==='function')toggleNotifs(false);
  if(typeof toggleUmenu==='function')toggleUmenu(false);
  $('#themePop')?.classList.toggle('open');
});
$('#themePop')?.addEventListener('click',e=>{
  e.stopPropagation();
  const th=e.target.closest('[data-qtheme]');if(th){SET.ui.theme=th.dataset.qtheme;saveSet();if(!$('#settings').hidden&&stTab==='ui')renderSettings();return}
  const sf=e.target.closest('[data-qsurf]');if(sf){SET.ui.surface=sf.dataset.qsurf;saveSet();if(!$('#settings').hidden&&stTab==='ui')renderSettings();return}
  if(e.target.closest('[data-qcss]')){$('#themePop')?.classList.remove('open');stTab='ui';setView('settings')}
});
addEventListener('click',()=>$('#themePop')?.classList.remove('open'));
$('#settings').addEventListener('change',e=>{const id=e.target.id,c=e.target.checked;
  const map={stSnd:['notif','sounds'],stDm:['notif','dm'],stRm:['ui','reduceMotion'],stOnline:['privacy','showOnline'],stDmF:['privacy','dmFriendsOnly'],stPub:['privacy','profilePublic']};
  if(map[id]){const [g,k]=map[id];SET[g][k]=c;saveSet();toast(t('st_saved'))}
  if(id==='stBgFile'){const f=e.target.files[0];if(f){TRUserBg.set(f).then(()=>{toast(t('ubg_ok'));renderSettings()}).catch(err=>toast(t('ubg_err_'+err.message)))}}
  if(id==='stDesk'){if(c&&'Notification' in window){Notification.requestPermission().then(r=>{SET.notif.desktop=r==='granted';saveSet();if(r!=='granted')toast(t('st_desk_denied'));renderSettings()})}else{SET.notif.desktop=false;saveSet()}}
  });
$('#settings').addEventListener('click',async e=>{
  const tb=e.target.closest('[data-sttab]');if(tb){stTab=tb.dataset.sttab;return renderSettings()}
  const lg=e.target.closest('[data-stlang]');if(lg){setLang(lg.dataset.stlang);return renderSettings()}
  const th=e.target.closest('[data-sttheme]');if(th){SET.ui.theme=th.dataset.sttheme;saveSet();toast(t('th_applied'));return renderSettings()}
  const sf=e.target.closest('[data-stsurf]');if(sf){SET.ui.surface=sf.dataset.stsurf;saveSet();toast(t('th_surf_ok'));return renderSettings()}
  const b=e.target.closest('[data-st]');if(!b)return;const a=b.dataset.st;
  if(a==='bgpick')return $('#stBgFile').click();
  if(a==='bgclear'){await TRUserBg.clear();toast(t('ubg_removed'));return renderSettings()}
  if(a==='resetcss'){SET.ui.customCss='';saveSet();toast(t('th_reset_ok'));return renderSettings()}
  if(a==='editor')return openEditor();
  if(a==='password')return openAccount();
  if(a==='link'){const r=await doSteam();if(r&&r.ok){applySession(AUTH.session);toast(t('steam_linked_toast'))}return renderSettings()}
  if(a==='unlink'){const r=await doUnlinkSteam();if(r.error)return toast(errMsg(r.error));if(r.session)applySession(r.session);toast(t('steam_unlinked'));return renderSettings()}
  if(a==='logout'){await doLogout();AUTH.session=null;showAuth('login');return toast(t('au_logged_out'))}
  if(a==='delete-account')return openDeleteAccountModal();
  });

function openDeleteAccountModal(){
  let m=$('#delAccModal');
  if(!m){
    document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="delAccModal"><div class="modal modal-danger">
      <div class="m-h"><h3 id="delAccTitle"></h3><button class="x2" data-close>×</button></div>
      <div id="delAccBody"></div>
    </div></div>`);
    m=$('#delAccModal');
  }
  $('#delAccTitle').textContent=t('del_acc_modal_t');
  $('#delAccBody').innerHTML=`
    <div class="del-acc-warn">
      <div class="st-who" style="margin-bottom:12px">${avHTML(ME)}<span><b>${escA(ME.name)}</b><small style="display:block;color:var(--muted)">${ME.elo} ELO · ${t('level_n',{n:lvl(ME.elo)})}</small></span></div>
      <p class="warn-txt" style="margin:0">${t('del_acc_modal_d')}</p>
    </div>
    <form id="fDelAcc" novalidate style="margin-top:14px">
      <div class="af" style="margin-bottom:10px">
        <input id="delAccIn" autocomplete="off" spellcheck="false" placeholder="${escA(t('del_acc_ph',{n:ME.name}))}">
      </div>
      <div class="af-err" id="delAccErr"></div>
      <div class="m-f">
        <button class="btn ghost" type="button" data-close>${t('cancel')}</button>
        <button class="btn danger" id="delAccSubmit" type="submit">${t('del_acc_btn')}</button>
      </div>
    </form>`;
  const form=$('#fDelAcc'),inp=$('#delAccIn'),err=$('#delAccErr'),btn=$('#delAccSubmit');
  form.onsubmit=async ev=>{
    ev.preventDefault();
    const v=(inp.value||'').trim();
    const ok=v.toLowerCase()===String(ME.name||'').toLowerCase()||v.toUpperCase()==='SUPPRIMER'||v.toUpperCase()==='DELETE';
    if(!ok){
      inp.classList.add('bad');
      err.textContent=t('del_acc_err',{n:ME.name});
      return;
    }
    btn.disabled=true;err.textContent='';
    const res=await doDeleteAccount();
    btn.disabled=false;
    if(res&&res.error){
      err.textContent=res.error==='in_match'?t('del_acc_in_match'):(typeof errMsg==='function'?errMsg(res.error):t('e_server_error'));
      return;
    }
    closeModal('delAccModal');
    closeModal('accModal');
    showAuth('login');
    toast(t('del_acc_ok'));
  };
  openModal('delAccModal');
  setTimeout(()=>inp&&inp.focus(),60);
}

async function doDeleteAccount(){
  if(state.searching&&typeof stopQueue==='function')stopQueue(true);
  if(typeof fbLive==='function'&&fbLive()&&AUTH.mode==='firebase'&&typeof FBA!=='undefined'&&FBA.uid){
    const r=await fbCall('deleteAccount',{});
    if(r&&r.error)return r;
    try{if(FBA.idToken&&typeof fbIdt==='function')await fbIdt('delete',{idToken:FBA.idToken})}catch(e){}
  }
  try{
    const curId=AUTH.session&&AUTH.session.account&&AUTH.session.account.id;
    const all=typeof dAcc==='function'?dAcc():[];
    const next=all.filter(x=>String(x.id)!==String(curId)&&String(x.username||'').toLowerCase()!==String(ME.name||'').toLowerCase());
    if(typeof dSave==='function')dSave(next);
  }catch(e){}
  try{
    await doLogout();
  }catch(e){}
  try{
    ['tr_fba','tr_auth','cs_profile','tr_eco','tr_shop','tr_load','tr_friends','tr_notifs','tr_dm','tr_ob','tr_cc','tr_plan','cs_csgocfg','tr_csgo_runtime_cvars'].forEach(k=>{
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  }catch(e){}
  try{await TRUserBg.clear()}catch(e){}
  AUTH.session=null;
  return {ok:true};
}

/* ---------- Toast ---------- */
let tt;
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>el.classList.remove('on'),2800)}

/* ---------- Init ---------- */
loadSavedProfile();
seedHistory();
initFriends();
initLeaderboard();
applyStatic();
refreshMe();
renderAll();
seedNotifs();renderNotifs();renderDockBtn();
authInit();

