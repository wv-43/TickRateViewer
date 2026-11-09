function currentViewName(){
  const views=['play','lobby','result','profile','friends','ranking','loadout','premium','shop','compet','settings','vigie','influencer','support','duel','mapvote','clans'];
  return views.find(id=>$('#'+id)&&!$('#'+id).hidden)||'play';
}

function openModal(id){
  const el=$('#'+id);
  if(!el)return;
  el.classList.add('on');
  try{
    history.pushState({ modal: id, view: currentViewName() }, '', location.hash||('#/'+currentViewName()));
  }catch(_){}
}
function closeModal(id){
  const el=$('#'+id);
  if(!el)return;
  el.classList.remove('on');
}
document.addEventListener('click',e=>{
  if(e.target.closest('[data-close]'))e.target.closest('.overlay').classList.remove('on');
  else if(e.target.classList.contains('overlay')&&e.target.id!=='found')e.target.classList.remove('on');
  const g=e.target.closest('[data-goview]');if(g)setView(g.dataset.goview);
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')$$('.overlay.on:not(#found)').forEach(el=>el.classList.remove('on'))});

function setView(v,keepTarget,skipHistory){
  if(v.startsWith('shop:')){shopTab=v.split(':')[1];v='shop'}
  if(v==='play'&&cur&&!cur.done)v='lobby';
  if(v==='leagues'){v='compet';cpTab='teamlg'}
  const views=['play','lobby','result','profile','friends','ranking','loadout','premium','shop','compet','settings','vigie','influencer','support','duel','mapvote','clans'];
  const curV=views.find(id=>$('#'+id)&&!$('#'+id).hidden);
  if(curV&&curV!=='profile')prevView=curV;
  if(v==='profile'&&!keepTarget)profileTarget=null;
  views.forEach(id=>{const el=$('#'+id);if(el)el.hidden=id!==v;});
  const nav=(v==='lobby'||v==='result')?'play':v==='profile'&&profileTarget?(profileTarget.friend?'friends':(prevView==='friends'?'friends':'play')):v;
  $$('[data-view]').forEach(e=>e.classList.toggle('active',e.dataset.view===nav));
  if(v==='profile')renderProfile();
  if(v==='friends')renderFriends();
  if(v==='ranking')renderRanking();
  if(v==='leagues')renderLeagues();
  if(v==='loadout')renderLoadout();
  if(v==='premium')renderPremium();
  if(v==='shop')renderShop();
  if(v==='settings')renderSettings();
  if(v==='compet')renderCompet();
  if(v==='influencer')openInfluencer();
  if(v==='duel'&&typeof renderDuel==='function')renderDuel();
  if(v==='mapvote'&&typeof renderMapVote==='function'){renderMapVote();mvLoad(true)}
  if(v==='clans'&&typeof renderClans==='function'){renderClans();clLoad()}
  if(v==='play')renderMissions();
  if(v==='play'){renderParty();renderStats()}
  window.scrollTo({top:0});

  if(!skipHistory){
    const targetHash='#/'+v;
    if(location.hash!==targetHash){
      try{
        history.pushState({ view: v, profileTarget: profileTarget?profileTarget.name:null }, '', targetHash);
      }catch(_){}
    }
  }
}

window.addEventListener('popstate',e=>{
  const openOverlay=document.querySelector('.overlay.on');
  if(openOverlay){
    openOverlay.classList.remove('on');
    return;
  }
  const hashView=(location.hash.replace(/^#\/?/, '').split('/')[0] || '').trim();
  const views=['play','lobby','result','profile','friends','ranking','loadout','premium','shop','compet','settings','vigie','influencer','support','inventory','duel','mapvote','clans'];
  let targetView=(e.state&&e.state.view)||hashView||'play';
  if(targetView==='leagues')targetView='compet';
  if(views.includes(targetView)){
    setView(targetView,false,true);
  }else{
    setView('play',false,true);
  }
});

function initRouting(){
  const hashView=(location.hash.replace(/^#\/?/, '').split('/')[0] || '').trim();
  const views=['play','lobby','result','profile','friends','ranking','loadout','premium','shop','compet','settings','vigie','influencer','support','duel','mapvote','clans'];
  if(views.includes(hashView)&&hashView!=='play'){
    setView(hashView,false,true);
    try{history.replaceState({view:hashView},'','#/'+hashView);}catch(_){}
  }else{
    if(!location.hash||location.hash==='#'){
      try{history.replaceState({view:'play'},'','#/play');}catch(_){}
    }
  }
}
$$('[data-view]').forEach(e=>e.addEventListener('click',()=>{histShown=5;setView(e.dataset.view)}));
$$('[data-soon]').forEach(e=>e.addEventListener('click',()=>toast(t('soon'))));
function refreshMe(){
  if(typeof fbSyncSoon==='function')fbSyncSoon();
  $('#topElo').textContent=isCalib(ME)?`Placement (${ME.calib.played||0}/3)`:ME.elo+' ELO';
  $('#topLvl').innerHTML=lvlHTML(ME.elo,false,isCalib(ME));
  $('#topAv').innerHTML=avHTML(ME);
  const tb=$('#topBadges');if(tb&&typeof planBadge==='function')tb.innerHTML=planBadge(ME);
  renderGoPrem();renderWallet();
}

function applyStatic(){
  $$('[data-i18n]').forEach(e=>e.textContent=t(e.dataset.i18n));
  $$('[data-i18n-html]').forEach(e=>e.innerHTML=t(e.dataset.i18nHtml));
  $$('[data-i18n-title]').forEach(e=>e.title=t(e.dataset.i18nTitle));
  $$('[data-i18n-ph]').forEach(e=>e.placeholder=t(e.dataset.i18nPh));
  $$('[data-lang-code]').forEach(e=>e.textContent=lang.toUpperCase());
  $$('[data-lang-list]').forEach(e=>e.innerHTML=LANGS.map(L=>`<button class="lang-opt ${L.id===lang?'on':''}" data-lang="${L.id}"><span class="code">${L.id.toUpperCase()}</span>${L.name}<span class="chk2">${ICON.check}</span></button>`).join(''));
  document.documentElement.lang=lang;
}
function setLang(l,silent){
  if(!I18N[l])return;lang=l;
  try{localStorage.setItem('cs_lang',l)}catch(e){}
  applyStatic();renderAll();
  if(state.searching)$('#bMode').textContent=modeObj().n;
  if(cur)renderLobby();
  if(cur&&cur.res)renderResult(cur.res);
  renderBan();
  if(!$('#profile').hidden)renderProfile();
  if(!$('#friends').hidden)renderFriends();
  if(!$('#ranking').hidden)renderRanking();
  if(!$('#leagues').hidden)renderLeagues();
  if(!$('#loadout').hidden)renderLoadout();
  if(!$('#premium').hidden)renderPremium();
  if(!$('#shop').hidden)renderShop();
  if(!$('#compet').hidden)renderCompet();
  renderMissions();
  renderGoPrem();renderWallet();
  if($('#reportModal').classList.contains('on'))renderReasons();
  if($('#editModal').classList.contains('on'))renderEditor();
  if($('#found').classList.contains('on')){$('#fMode').textContent=`${modeObj().n} · ${regObj().name}`;$('#fStatus').textContent=mf.ok?t('n_accepted',{n:mf.ok,t:mf.total}):t('waiting_players');$('#acceptBtn').textContent=mf.accepted?t('accepted'):t('accept')}
  if(typeof window.updateAuthSliderLang==='function')window.updateAuthSliderLang();
  if(!silent)toast(t('lang_changed'));
}
document.addEventListener('click',e=>{
  const opt=e.target.closest('[data-lang]');
  if(opt){setLang(opt.dataset.lang);$$('[data-lang-root]').forEach(r=>r.classList.remove('open'));return}
  const tg=e.target.closest('[data-lang-toggle]');
  $$('[data-lang-root]').forEach(r=>{if(!tg||!r.contains(tg))r.classList.remove('open')});
  if(tg)tg.closest('[data-lang-root]').classList.toggle('open');
});

const AUTH={mode:'demo',session:null,fails:{}};
const RE_USER=/^[A-Za-z0-9_.-]{3,16}$/,RE_MAIL=/^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
const pwErr=pw=>!pw||pw.length<8?'pw_short':pw.length>128?'pw_long':(!/[A-Za-z]/.test(pw)||!/\d/.test(pw))?'pw_weak':null;
const errMsg=c=>t('e_'+c)!=='e_'+c?t('e_'+c):t('e_server_error');
async function api(path,body){
  let r;try{r=await fetch(path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,credentials:'same-origin'})}catch(e){return {error:'network'}}
  try{return await r.json()}catch(e){return {error:'server_error'}}
}
const dAcc=()=>{try{return JSON.parse(localStorage.getItem('tr_accounts')||'[]')}catch(e){return []}};
const dSave=a=>{try{localStorage.setItem('tr_accounts',JSON.stringify(a))}catch(e){}};
const toHex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function dHash(pw,salt){
  if(window.crypto&&crypto.subtle){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveBits']);
    return toHex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:120000},k,256))}
  let h=5381;for(const c of salt+pw)h=(h*33^c.charCodeAt(0))>>>0;return 'weak'+h.toString(16);
}
function dSessionSet(id,remember){try{sessionStorage.removeItem('tr_auth');localStorage.removeItem('tr_auth');(remember?localStorage:sessionStorage).setItem('tr_auth',String(id))}catch(e){}}
function dSessionGet(){let id=null;try{id=localStorage.getItem('tr_auth')||sessionStorage.getItem('tr_auth')}catch(e){}
  const a=dAcc().find(x=>String(x.id)===id);return a?{account:{id:a.id,username:a.username,nameChangedAt:a.nameChangedAt||0,email:a.email,steam_id:a.steam_id||null,has_password:!!a.hash,created_at:a.created,calib:a.calib||null,elo:a.elo,history:a.history||null}}:null}
const dUpdate=(id,fn)=>{const all=dAcc(),a=all.find(x=>x.id===id);if(a){fn(a);dSave(all)}return a};
const fakeSteam64=()=>'7656119'+String(Math.floor(Math.random()*1e10)).padStart(10,'0');
const steam2=id=>{if(!id)return null;try{const n=BigInt(id)-76561197960265728n;return `STEAM_1:${n%2n}:${n/2n}`}catch(e){return id}};

async function doRegister(f){
  if(AUTH.mode==='server')return api('/api/auth/register',f);
  const all=dAcc();
  if(all.some(a=>a.username.toLowerCase()===f.username.toLowerCase()))return {error:'username_taken',field:'username'};
  if(all.some(a=>a.email===f.email))return {error:'email_taken',field:'email'};
  const salt=toHex(crypto.getRandomValues?crypto.getRandomValues(new Uint8Array(16)):[Date.now()]);
  const a={id:Date.now(),username:f.username,email:f.email,salt,hash:await dHash(f.password,salt),steam_id:null,created:Date.now(),calib:{done:false,played:0,wins:0},elo:1000,history:[]};
  all.push(a);dSave(all);dSessionSet(a.id,true);return {ok:true,session:dSessionGet()};
}
async function doLogin(f){
  if(AUTH.mode==='server')return api('/api/auth/login',f);
  const k=f.login.toLowerCase(),fl=AUTH.fails[k]||{n:0,until:0};
  if(fl.until>Date.now())return {error:'too_many_attempts'};
  const a=dAcc().find(x=>x.email===k||x.username.toLowerCase()===k);
  const ok=a&&a.hash&&(await dHash(f.password,a.salt))===a.hash;
  if(!ok){fl.n++;if(fl.n>=5){fl.until=Date.now()+15*60e3;fl.n=0}AUTH.fails[k]=fl;return {error:'bad_credentials'}}
  delete AUTH.fails[k];dSessionSet(a.id,f.remember);return {ok:true,session:dSessionGet()};
}
async function doLogout(){
  if(typeof fbSyncOnline==='function')await fbSyncOnline(true);
  if(typeof resetMeDefaults==='function')resetMeDefaults();
  if(AUTH.mode==='server')await api('/api/auth/logout',{});else{try{localStorage.removeItem('tr_auth');sessionStorage.removeItem('tr_auth');localStorage.removeItem('cs_profile');localStorage.removeItem('tr_pending_name');sessionStorage.removeItem('tr_pending_name');}catch(e){}}
}
const STEAM_OID='https://steamcommunity.com/openid/login';
function steamOpenIdUrl(ret){
  const origin=(location.origin||'https://tickrate.eu').replace(/^http:\/\//i,'https://');
  const secureRet=String(ret||'').replace(/^http:\/\//i,'https://');
  const q=new URLSearchParams({'openid.ns':'http://specs.openid.net/auth/2.0','openid.mode':'checkid_setup','openid.return_to':secureRet,'openid.realm':origin,'openid.identity':'http://specs.openid.net/auth/2.0/identifier_select','openid.claimed_id':'http://specs.openid.net/auth/2.0/identifier_select'});
  return STEAM_OID+'?'+q.toString();
}
async function doSteam(){
  if(AUTH.mode==='server'){location.href='/auth/steam';return new Promise(()=>{})}
  if(!/^https?:/.test(location.protocol)){toast(t('au_steam_need_http'));return {error:'need_http'}}
  const cur=(AUTH.session&&AUTH.session.account) || (typeof dSessionGet==='function'&&dSessionGet()&&dSessionGet().account);
  const linkId=cur?cur.id:null;
  const linkData={link:linkId,username:cur?cur.username:null,email:cur?cur.email:null,at:Date.now()};
  try{
    localStorage.setItem('tr_steam_pending',JSON.stringify(linkData));
    sessionStorage.setItem('tr_steam_pending',JSON.stringify(linkData));
  }catch(e){}
  location.href=steamOpenIdUrl(location.origin+location.pathname+'?steam_oid=1');
  return new Promise(()=>{});
}
async function doGoogleAuth(){
  if(typeof window.fbDoGoogleAuth==='function')return window.fbDoGoogleAuth();
  let all=dAcc(),a=all.find(x=>x.google_id||(x.email&&x.email.endsWith('@gmail.com')));
  if(!a){
    const gName='Google_'+Math.floor(100+Math.random()*900);
    a={id:Date.now(),username:gName,email:gName.toLowerCase()+'@gmail.com',google_id:'g_'+Date.now(),created:Date.now(),elo:1000,calib:{done:false,played:0,wins:0},history:[]};
    all.push(a);dSave(all);
  }
  dSessionSet(a.id,true);const sess=dSessionGet();
  return {ok:true,session:sess};
}
function steamReturnDemo(q){
  if(!q.has('steam_oid') && q.get('openid.mode')!=='id_res')return null;
  let pend=null;
  try{
    pend=JSON.parse(localStorage.getItem('tr_steam_pending')||sessionStorage.getItem('tr_steam_pending')||'null');
    localStorage.removeItem('tr_steam_pending');
    sessionStorage.removeItem('tr_steam_pending');
  }catch(e){}
  if(q.get('openid.mode')==='cancel')return 'cancel';
  const claimed=q.get('openid.claimed_id')||'';
  const m=/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/.exec(claimed);
  if(!m)return 'error';

  const sid=m[1];
  const all=dAcc();
  const curSess=typeof dSessionGet==='function'?dSessionGet():null;
  const linkId=(pend&&pend.link)||(curSess&&curSess.account&&curSess.account.id)||(AUTH.session&&AUTH.session.account&&AUTH.session.account.id)||null;
  const owner=all.find(x=>x.steam_id===sid);

  if(linkId){
    if(owner&&String(owner.id)!==String(linkId)){
      if((!owner.email&&!owner.hash)||String(owner.username).startsWith('Steam')){
        owner.steam_id=null;
        dSave(all);
      }else{
        return 'taken';
      }
    }
    dUpdate(linkId,a=>{a.steam_id=sid;a.steam_unverified=false});
    dSessionSet(linkId,true);
    if(typeof ME!=='undefined'){
      ME.steam={linked:true,id:steam2(sid),sid};
    }
    if(typeof fbReq==='function'&&typeof fbUserKey==='function'){
      try{
        fbReq(`profiles/${fbUserKey()}/steamId`,'PUT',sid);
        fbReq(`profiles/${fbUserKey()}/steamLinked`,'PUT',true);
        fbReq(`users/${fbUserKey()}/steam`,'PUT',{linked:true,id:steam2(sid),sid});
        if(typeof fbMailbox==='function')fbReq(`playerDirectory/${fbMailbox(ME.name)}/steam`,'PUT',{linked:true,id:steam2(sid),sid});
      }catch(_){}
    }
    return 'linked';
  }

  let a=owner;
  if(!a){
    a={id:Date.now(),username:'Steam'+sid.slice(-4),email:null,steam_id:sid,steam_unverified:false,created:Date.now(),calib:{done:false,played:0,wins:0},elo:1000,history:[]};
    all.push(a);
    dSave(all);
  }
  dSessionSet(a.id,true);
  if(typeof ME!=='undefined'){
    ME.steam={linked:true,id:steam2(sid),sid};
  }
  return 'login';
}
async function doDirectSteamLink(rawInput){
  if(!rawInput) return {error:'missing_steam_id'};
  let sid=String(rawInput).trim();
  const m=sid.match(/\d{17}/);
  if(!m) return {error:'invalid_steam_id'};
  sid=m[0];
  const cur=(AUTH.session&&AUTH.session.account)||(typeof dSessionGet==='function'&&dSessionGet()&&dSessionGet().account);
  if(!cur) return {error:'not_logged_in'};

  if(typeof fbReq==='function'&&typeof fbUserKey==='function'){
    try{
      fbReq(`profiles/${fbUserKey()}/steamId`,'PUT',sid);
      fbReq(`profiles/${fbUserKey()}/steamLinked`,'PUT',true);
      fbReq(`users/${fbUserKey()}/steam`,'PUT',{linked:true,id:steam2(sid),sid});
      if(typeof fbMailbox==='function')fbReq(`playerDirectory/${fbMailbox(ME.name)}/steam`,'PUT',{linked:true,id:steam2(sid),sid});
    }catch(_){}
  }

  const all=dAcc();
  const owner=all.find(x=>x.steam_id===sid);
  if(owner&&String(owner.id)!==String(cur.id)){
    if((!owner.email&&!owner.hash)||String(owner.username).startsWith('Steam')){
      owner.steam_id=null;
      dSave(all);
    }else{
      return {error:'steam_taken'};
    }
  }

  dUpdate(cur.id,a=>{a.steam_id=sid;a.steam_unverified=false});
  dSessionSet(cur.id,true);
  const sess=dSessionGet();
  if(sess) applySession(sess);
  if(typeof ME!=='undefined'){
    ME.steam={linked:true,id:steam2(sid),sid};
  }
  return {ok:true,steamId:sid};
}
async function doPassword(cur,next){
  if(AUTH.mode==='server')return api('/api/auth/password',{current:cur,next});
  const id=AUTH.session.account.id,a=dAcc().find(x=>x.id===id);
  if(a.hash&&(await dHash(cur,a.salt))!==a.hash)return {error:'bad_credentials',field:'current'};
  const e=pwErr(next);if(e)return {error:e,field:'next'};
  const salt=a.salt||toHex(crypto.getRandomValues(new Uint8Array(16))),h=await dHash(next,salt);
  dUpdate(id,x=>{x.salt=salt;x.hash=h});AUTH.session=dSessionGet();return {ok:true};
}
async function doUnlinkSteam(){
  if(AUTH.mode==='server')return api('/api/auth/steam/unlink',{});
  const a=AUTH.session.account;if(!a.has_password||!a.email)return {error:'set_password_first'};
  dUpdate(a.id,x=>x.steam_id=null);return {ok:true,session:dSessionGet()};
}

let authTab='login';
let verifyPollTimer=null;
let verifyResendTimer=null;
let verifyPending={email:null,idToken:null,refreshToken:null};

function showVerifyScreen(email,idToken,refreshToken){
  verifyPending={email,idToken,refreshToken};
  $('#auth').hidden=false;
  document.body.style.overflow='hidden';
  const tabs=$('.auth-tabs');if(tabs)tabs.style.display='none';
  $('#fLogin').hidden=true;
  $('#fReg').hidden=true;
  const fv=$('#fVerify');
  if(fv)fv.hidden=false;
  const tm=$('#verifyTargetMail');
  if(tm)tm.textContent=email||'';
  const al=$('#verifyAlert');
  if(al){al.hidden=true;al.className='verify-alert';al.textContent=''}
  const btnC=$('#btnVerifyCheck');
  if(btnC){btnC.disabled=false;btnC.textContent=t('au_verify_check')||"J'ai validé mon e-mail"}
  const btnR=$('#btnVerifyResend');
  if(btnR&&!verifyResendTimer){btnR.disabled=false;btnR.textContent=t('au_verify_resend')||"Renvoyer l'e-mail"}

  clearInterval(verifyPollTimer);
  verifyPollTimer=setInterval(async ()=>{
    const curFv=$('#fVerify');
    if(!curFv||curFv.hidden||$('#auth').hidden){
      clearInterval(verifyPollTimer);
      return;
    }
    await checkVerificationStatus(true);
  },4000);
}

function hideVerifyScreen(){
  clearInterval(verifyPollTimer);
  const tabs=$('.auth-tabs');if(tabs)tabs.style.display='';
  const fv=$('#fVerify');if(fv)fv.hidden=true;
}

async function checkVerificationStatus(silent){
  const tok=verifyPending.idToken||(window.FBA&&FBA.idToken);
  if(!tok)return false;
  const btn=$('#btnVerifyCheck');
  if(!silent&&btn){btn.disabled=true;btn.textContent=(t('spin_checking')||'Vérification en cours...')}
  let u=null;
  try{
    const idt=window.fbIdt||(async (op,body)=>{const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${op}?key=${window.FB_API_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return await r.json().catch(()=>({}))});
    const info=await idt('lookup',{idToken:tok});
    u=info&&info.users&&info.users[0];
  }catch(e){}
  if(u&&u.emailVerified){
    clearInterval(verifyPollTimer);
    hideVerifyScreen();
    toast(t('au_verify_success')||'Adresse e-mail vérifiée avec succès !');
    if(typeof fbBuildSession==='function'){
      const s=await fbBuildSession();
      if(s)return enterApp(s,t('au_hello',{n:s.account.username}));
    }
    showAuth('login');
    return true;
  }
  if(!silent){
    if(btn){btn.disabled=false;btn.textContent=t('au_verify_check')||"J'ai validé mon e-mail"}
    const al=$('#verifyAlert');
    if(al){
      al.className='verify-alert err';
      al.textContent=t('au_verify_not_yet')||"Ton adresse e-mail n'est pas encore validée. Clique d'abord sur le lien reçu par mail.";
      al.hidden=false;
    }
  }
  return false;
}

async function resendVerificationEmail(){
  let tok=verifyPending.idToken||(window.FBA&&FBA.idToken);
  const ref=verifyPending.refreshToken||(window.FBA&&FBA.refresh);
  if(ref){
    try{
      const rk=await fetch(`https://securetoken.googleapis.com/v1/token?key=${window.FB_API_KEY}`,{
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:new URLSearchParams({grant_type:'refresh_token',refresh_token:ref})
      });
      const jk=await rk.json();
      if(jk&&jk.id_token){tok=jk.id_token;verifyPending.idToken=tok;if(window.FBA)FBA.idToken=tok;}
    }catch(e){}
  }
  if(!tok)return;
  const btn=$('#btnVerifyResend');
  if(btn)btn.disabled=true;
  try{
    const contUrl=(location.origin||'https://tickrate.eu').replace(/^http:\/\//i,'https://')+'/';
    let r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${window.FB_API_KEY}`,{
      method:'POST',
      headers:{'Content-Type':'application/json','X-Firebase-Locale':(window.lang||'fr')},
      body:JSON.stringify({requestType:'VERIFY_EMAIL',idToken:tok,continueUrl:contUrl})
    });
    let j=await r.json().catch(()=>({}));
    if(!r.ok && j?.error?.message!=='TOO_MANY_ATTEMPTS_TRY_LATER'){
      console.warn('sendOobCode with continueUrl failed in nav-auth, retrying without continueUrl...');
      r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${window.FB_API_KEY}`,{
        method:'POST',
        headers:{'Content-Type':'application/json','X-Firebase-Locale':(window.lang||'fr')},
        body:JSON.stringify({requestType:'VERIFY_EMAIL',idToken:tok})
      });
      j=await r.json().catch(()=>({}));
    }
    const al=$('#verifyAlert');
    if(!r.ok){
      if(al){
        al.className='verify-alert err';
        al.textContent=j.error&&j.error.message==='TOO_MANY_ATTEMPTS_TRY_LATER'
          ? (t('rs_slow')||'Trop de demandes : réessaie dans quelques minutes.')
          : (t('e_server_error')||'Erreur lors de l’envoi.');
        al.hidden=false;
      }
    }else{
      if(al){
        al.className='verify-alert ok';
        al.textContent=t('au_verify_sent')||'Un nouvel e-mail de confirmation vient d’être envoyé !';
        al.hidden=false;
      }
    }
  }catch(e){
    const al=$('#verifyAlert');
    if(al){
      al.className='verify-alert err';
      al.textContent=t('e_server_error')||'Erreur lors de l’envoi.';
      al.hidden=false;
    }
  }
  let sec=60;
  clearInterval(verifyResendTimer);
  verifyResendTimer=setInterval(()=>{
    sec--;
    if(sec<=0){
      clearInterval(verifyResendTimer);
      verifyResendTimer=null;
      if(btn){btn.disabled=false;btn.textContent=t('au_verify_resend')||"Renvoyer l'e-mail"}
    }else{
      if(btn)btn.textContent=(t('au_verify_resend')||"Renvoyer l'e-mail")+` (${sec}s)`;
    }
  },1000);
}

function backFromVerify(){
  hideVerifyScreen();
  showAuth('login');
}

function showAuth(tab){
  hideVerifyScreen();
  authTab=tab||authTab;
  $('#auth').hidden=false;document.body.style.overflow='hidden';
  $$('.auth-tabs [data-atab]').forEach(b=>b.classList.toggle('on',b.dataset.atab===authTab));
  $('#fLogin').hidden=authTab!=='login';$('#fReg').hidden=authTab!=='register';
  const fv=$('#fVerify');if(fv)fv.hidden=true;
  $('#authMode').textContent='';
  $('#authLangs').innerHTML=['fr','en','ru'].map(l=>`<button class="${lang===l?'on':''}" data-alang="${l}">${l.toUpperCase()}</button>`).join('');
  pwRules();
  setTimeout(()=>{const f=authTab==='login'?$('#liLogin'):$('#reUser');if(f&&!f.value)f.focus()},50);
}
function hideAuth(){$('#auth').hidden=true;document.body.style.overflow=''}
function applySession(sess){
  AUTH.session=sess;const a=sess.account;
  const old=ME.name;
  const uKey=(typeof FBA!=='undefined'&&FBA&&FBA.uid)?FBA.uid:(typeof fbUserKey==='function'?fbUserKey():String(a.id));

  ME.avatar=null;
  ME.steamAvatar=null;
  ME.banner={type:'map',slug:'mirage'};
  ME.color='#c4562a';
  ME.cardStyle='default';
  ME.bgStyle='default';

  let savedName=null,savedCd=0;
  try{const s=JSON.parse(localStorage.getItem('cs_profile_'+uKey)||'null');if(s){savedName=s.name;savedCd=s.nameChangedAt||0}}catch(e){}
  if(a.nameChangedAt&&a.nameChangedAt>=savedCd){ME.name=a.username;ME.nameChangedAt=a.nameChangedAt}
  else if(savedName&&savedCd>0){ME.name=savedName;ME.nameChangedAt=savedCd;a.username=savedName;a.nameChangedAt=savedCd;dUpdate(a.id,x=>{x.username=savedName;x.nameChangedAt=savedCd})}
  else{ME.name=a.username;ME.nameChangedAt=a.nameChangedAt||0}
  if(old!==ME.name){REG.delete(old);used.delete(old);REG.set(ME.name,ME);used.add(ME.name)}
  ME.email=a.email;ME.since=new Date(a.created_at||Date.now());
  ME.steam={linked:!!a.steam_id,id:steam2(a.steam_id)};
  if(a.calib&&typeof a.calib==='object'){
    ME.calib=a.calib;
    ME.elo=typeof a.elo==='number'?a.elo:1000;
    ME.career=0;
    ME.history=Array.isArray(a.history)?a.history.map(x=>({...x,date:new Date(x.date)})):[];
  }else{
    ME.calib={done:true,played:3,wins:3};
  }
  if(sess.player&&sess.player.plan&&PLAN_RANK[sess.player.plan]!=null)ME.plan=sess.player.plan;
  ME.influencer=sess.profile&&sess.profile.influencer||null;ME.planSource=sess.profile&&sess.profile.planSource||null;
  $('#topName').textContent=ME.name;$('#umName').textContent=ME.name;$('#umMail').textContent=a.email||(a.steam_id?'Steam':'');
  refreshMe();renderParty();if(!$('#profile').hidden)renderProfile();
  fbLoadMe().then(()=>{
    fbSyncMe();
    fbSyncOnline(false);
    if(typeof loadFriendsFromFirebase==='function')loadFriendsFromFirebase(true);
    if(!$('#influencer').hidden)openInfluencer();
  });
}
function enterApp(sess,msg){applySession(sess);hideAuth();if(msg)toast(msg)}
function pwRules(){
  const v=$('#rePass').value,r=[[v.length>=8,'au_r_len'],[/[A-Za-z]/.test(v),'au_r_let'],[/\d/.test(v),'au_r_num']];
  $('#pwRules').innerHTML=r.map(([ok,k])=>`<span class="${ok?'ok':''}">${ok?'✓':'·'} ${t(k)}</span>`).join('');
  let sc=r.filter(x=>x[0]).length+(v.length>=12?1:0)+(/[^A-Za-z0-9]/.test(v)?1:0);
  const b=$('#pwBar');b.style.width=Math.min(100,sc*20)+'%';b.style.background=sc<=2?'var(--red)':sc<=3?'#f2c94c':'var(--green)';
}
function fieldErr(form,res){
  const box=form.querySelector('.af-err');box.textContent=errMsg(res.error);
  form.querySelectorAll('input').forEach(i=>i.classList.remove('bad'));
  const map={username:'#reUser',email:'#reMail',password:'#rePass',accept:'#reCgu',login:'#liLogin'};
  const el=res.field&&$(map[res.field]);if(el){el.classList.add('bad');el.focus()}
}
$('#auth').addEventListener('click',async e=>{
  const tb=e.target.closest('[data-atab]');if(tb){$$('.af-err').forEach(x=>x.textContent='');return showAuth(tb.dataset.atab)}
  const al=e.target.closest('[data-alang]');if(al){setLang(al.dataset.alang);return showAuth()}
  const ey=e.target.closest('[data-eye]');if(ey){const i=ey.parentNode.querySelector('input');i.type=i.type==='password'?'text':'password';ey.classList.toggle('on',i.type==='text');return}
  if(e.target.closest('#forgot'))return toast(t('au_forgot_t'));
  const gg=e.target.closest('[data-google-auth]');
  if(gg){gg.disabled=true;const old=gg.innerHTML;gg.innerHTML='<span class="spin inl"></span> '+(t('google_connecting')||'Connexion Google...');
    const r=await doGoogleAuth();gg.disabled=false;gg.innerHTML=old;
    if(r&&r.ok&&r.session)enterApp(r.session,t('au_hello',{n:r.session.account.username}));
    else if(r&&r.error&&r.error!=='cancel'){
      const errEl=authTab==='login'?$('#liErr'):$('#reErr');
      if(errEl)errEl.textContent=t('au_google_err')||'Connexion Google annulée ou échouée.';
    }}
  const st=e.target.closest('[data-steam-auth]');
  if(st){st.disabled=true;const old=st.innerHTML;st.innerHTML='<span class="spin inl"></span> '+t('steam_connecting');
    const r=await doSteam();st.disabled=false;st.innerHTML=old;
    if(r.ok&&r.session)enterApp(r.session,t('au_hello',{n:r.session.account.username}));}
});
$('#auth').addEventListener('input',e=>{if(e.target.matches('input'))e.target.classList.remove('bad')});
$('#rePass').addEventListener('input',pwRules);
$('#reUser').addEventListener('input',e=>{const v=e.target.value;e.target.classList.toggle('bad',v.length>2&&!RE_USER.test(v));e.target.classList.toggle('good',RE_USER.test(v))});
$('#rePass2').addEventListener('input',e=>{const ok=e.target.value&&e.target.value===$('#rePass').value;e.target.classList.toggle('good',!!ok);e.target.classList.toggle('bad',!!e.target.value&&!ok&&e.target.value.length>=$('#rePass').value.length)});
$('#fLogin').addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target,btn=f.querySelector('.af-go');
  const body={login:$('#liLogin').value.trim(),password:$('#liPass').value,remember:$('#liRem').checked};
  if(!body.login||!body.password)return fieldErr(f,{error:'missing_fields',field:body.login?null:'login'});
  btn.disabled=true;const r=await doLogin(body);btn.disabled=false;
  if(r.ok){
    $('#liPass').value='';enterApp(r.session,t('au_hello',{n:r.session.account.username}));
  }else if(r.needVerification){
    $('#liPass').value='';
    showVerifyScreen(r.email, r.idToken, r.refreshToken);
  }else{
    fieldErr(f,r);$('#liPass').value='';$('#liPass').focus();
  }
});
$('#fReg').addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target,btn=f.querySelector('.af-go');
  const body={username:$('#reUser').value.trim(),email:$('#reMail').value.trim().toLowerCase(),password:$('#rePass').value,accept:$('#reCgu').checked};
  const pe=pwErr(body.password);
  const err=!RE_USER.test(body.username)?{error:'bad_username',field:'username'}:!RE_MAIL.test(body.email)?{error:'bad_email',field:'email'}
    :pe?{error:pe,field:'password'}:body.password!==$('#rePass2').value?{error:'pw_mismatch',field:null}:!body.accept?{error:'must_accept',field:'accept'}:null;
  if(err){if(err.error==='pw_mismatch')$('#rePass2').classList.add('bad');return fieldErr(f,err)}
  btn.disabled=true;const r=await doRegister(body);btn.disabled=false;
  if(r.ok){
    f.reset();pwRules();
    if(r.needVerification){
      showVerifyScreen(r.email, r.idToken, r.refreshToken);
    }else{
      enterApp(r.session,t('au_created'));
    }
  }else fieldErr(f,r);
});

$('#btnVerifyCheck')?.addEventListener('click',()=>checkVerificationStatus(false));
$('#btnVerifyResend')?.addEventListener('click',()=>resendVerificationEmail());
$('#btnVerifyBack')?.addEventListener('click',()=>backFromVerify());

async function submitManualVerification(){
  const inp=$('#verifyManualCode');if(!inp)return;
  const raw=inp.value.trim();if(!raw)return;
  const match=raw.match(/[?&]oobCode=([^&]+)/);
  const code=match?decodeURIComponent(match[1]):raw;
  const btn=$('#btnVerifyManual');if(btn)btn.disabled=true;
  const al=$('#verifyAlert');
  try{
    const idt=window.fbIdt||(async (op,body)=>{const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${op}?key=${window.FB_API_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return await r.json().catch(()=>({}))});
    const r=await idt('update',{oobCode:code});
    if(btn)btn.disabled=false;
    if(r.error){
      if(al){al.className='verify-alert err';al.textContent=t('au_verify_invalid_code')||'Lien ou code invalide.';al.hidden=false}
    }else{
      clearInterval(verifyPollTimer);
      hideVerifyScreen();
      toast(t('au_verify_success')||'Adresse e-mail vérifiée avec succès !');
      if(typeof fbBuildSession==='function'){
        const s=await fbBuildSession();
        if(s)return enterApp(s,t('au_hello',{n:s.account.username}));
      }
      showAuth('login');
    }
  }catch(e){
    if(btn)btn.disabled=false;
    if(al){al.className='verify-alert err';al.textContent=t('e_server_error');al.hidden=false}
  }
}
$('#btnVerifyManual')?.addEventListener('click',()=>submitManualVerification());
$('#verifyManualCode')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submitManualVerification();}});

function toggleUmenu(force){
  const m=$('#umenu'),open=force!=null?force:m.hidden;m.hidden=!open;
  if(open){
    if(typeof toggleNotifs==='function')toggleNotifs(false);
    $('#themePop')?.classList.remove('open');
    const r=$('#topProfile').getBoundingClientRect();
    m.style.top=(r.bottom+6)+'px';
    m.style.right=Math.max(8,innerWidth-r.right)+'px';
  }
}
$('#topProfile').onclick=e=>{e.stopPropagation();toggleUmenu()};
document.addEventListener('click',e=>{if(!e.target.closest('#umenu'))toggleUmenu(false)});
$('#umenu').addEventListener('click',async e=>{
  const b=e.target.closest('[data-um]');if(!b)return;toggleUmenu(false);
  if(b.dataset.um==='profile')return setView('profile');
  if(b.dataset.um==='account'){stTab='account';return setView('settings')}
  if(b.dataset.um==='influencer')return setView('influencer');
  if(b.dataset.um==='logout'){if(state.searching)stopQueue(true);await doLogout();AUTH.session=null;if($('#liLogin'))$('#liLogin').value='';if($('#liPass'))$('#liPass').value='';showAuth('login');toast(t('au_logged_out'))}
});
function openAccount(){
  const a=AUTH.session.account,cd=nameCdStatus();
  $('#accBody').innerHTML=`
    <form class="acc-pw" id="fAccName" novalidate style="margin:0 0 14px;padding-bottom:14px;border-bottom:1px solid var(--line)">
      <div class="label" style="margin:0 0 8px"><span>${t('au_user')}</span><span class="ed-cd-pill ${cd.locked?'lock':'ok'}">${cd.locked?t('name_cd_lock',{x:cd.txt}):t('name_cd_ok')}</span></div>
      <div class="ed-name-row">
        <input class="ed-name-in" id="accNameIn" value="${escA(ME.name)}" maxlength="16" ${cd.locked?'disabled':''} autocomplete="off" spellcheck="false">
        <button class="btn primary sm" type="submit" style="height:38px" ${cd.locked?'disabled':''}>${t('au_save')}</button>
      </div>
      <div class="ed-name-msg" id="accNameMsg">${cd.locked?t('name_cd_wait',{x:cd.txt}):t('name_cd_hint')}</div>
    </form>
    <div class="acc-row"><span>${t('au_mail')}</span><b>${a.email?escA(a.email):t('au_none')}</b></div>
    <div class="acc-row"><span>Steam</span><b>${a.steam_id?steam2(a.steam_id):t('no_steam')}</b></div>
    <div class="acc-row"><span>${t('au_since')}</span><b>${new Date(a.created_at||Date.now()).toLocaleDateString(LOC[lang])}</b></div>
    <form class="acc-pw" id="fPw" novalidate><div class="label" style="margin:0 0 10px">${a.has_password?t('au_change_pw'):t('au_set_pw')}</div>
      ${a.has_password?`<div class="af"><label>${t('au_pw_cur')}</label><input type="password" id="pwCur" autocomplete="current-password"></div>`:''}
      <div class="af"><label>${t('au_pw_new')}</label><input type="password" id="pwNew" autocomplete="new-password"></div>
      <div class="af"><label>${t('au_pw2')}</label><input type="password" id="pwNew2" autocomplete="new-password"></div>
      <div class="af-err" id="pwErr"></div>
      <div class="m-f" style="margin-top:4px"><button class="btn ghost sm" type="button" id="accDelBtn" style="margin-right:auto;color:var(--red);border-color:rgba(239,85,96,.35)">${t('del_acc_btn')||'Supprimer mon compte'}</button><button class="btn ghost" type="button" data-close>${t('cancel')}</button><button class="btn primary" type="submit">${t('au_save')}</button></div></form>`;
  const delB=$('#accDelBtn');
  if(delB)delB.onclick=()=>{closeModal('accModal');if(typeof openDeleteAccountModal==='function')openDeleteAccountModal()};
  const fName=$('#fAccName');
  if(fName)fName.onsubmit=ev=>{
    ev.preventDefault();
    const ck=checkNewUsername($('#accNameIn').value);
    const m=$('#accNameMsg');
    if(!ck.ok){m.className='ed-name-msg err';m.textContent=ck.err;return}
    if(ck.same)return closeModal('accModal');
    applyUsernameChange(ck.val);
    refreshMe();renderParty();if(!$('#profile').hidden)renderProfile();if(!$('#ranking').hidden)renderRanking();
    openAccount();
    toast(t('name_changed',{n:ME.name}));
  };
  $('#fPw').onsubmit=async ev=>{ev.preventDefault();
    const n=$('#pwNew').value;if(n!==$('#pwNew2').value){$('#pwErr').textContent=t('e_pw_mismatch');return}
    const pe=pwErr(n);if(pe){$('#pwErr').textContent=errMsg(pe);return}
    const r=await doPassword($('#pwCur')?$('#pwCur').value:'',n);
    if(r.ok){closeModal('accModal');toast(t('au_pw_saved'));if(AUTH.mode==='server'){const s=await api('/api/auth/session');if(s.session)AUTH.session=s.session}}else $('#pwErr').textContent=errMsg(r.error)};
  openModal('accModal');
}

async function authInit(){
  if(/^https?:/.test(location.protocol)&&!/(^|\.)tickrate\.eu$|\.web\.app$|\.firebaseapp\.com$/.test(location.hostname)){
    const r=await api('/api/auth/session');
    if(r&&r.ok){AUTH.mode='server';AUTH.session=r.session}
  }
  const q=new URLSearchParams(location.search);
  let sp=q.get('steam');
  if(q.has('steam_oid') || q.get('openid.mode')==='id_res'){
    const r=steamReturnDemo(q);
    if(r)sp=r;
    if(typeof dSessionGet==='function'){
      const curSess=dSessionGet();
      if(curSess)AUTH.session=curSess;
    }
  }
  if(q.has('steam')||q.has('welcome')||q.has('steam_oid')||q.has('openid.mode')){
    const cleanHash=location.hash||'#/play';
    try{history.replaceState(null,'',location.pathname+cleanHash);}catch(_){}
  }
  if(!AUTH.session && typeof dSessionGet==='function'){
    AUTH.session = dSessionGet();
  }
  if(AUTH.session){
    applySession(AUTH.session);
    hideAuth();
    if(sp==='linked')toast(t('steam_linked_toast'));
    else if(sp==='login')toast(t('au_hello',{n:ME.name}));
    else if(sp==='taken')toast(t('au_steam_taken'));
    else if(q.has('welcome'))toast(t('au_hello',{n:ME.name}));
  } else {
    showAuth('login');
    if(typeof fbSyncOnline==='function')fbSyncOnline(false);
    if(sp==='error'||sp==='cancel')$('#liErr')&&($('#liErr').textContent=t('au_steam_err'));
  }
  initRouting();
}

document.addEventListener('click', e => {
  const gs = e.target.closest('[data-go-shop]');
  if (gs) {
    const tab = gs.dataset.goShop;
    if (typeof setView === 'function') {
      shopTab = tab;
      setView('shop:' + tab);
    }
  }
});


