Object.assign(I18N.fr,{rs_title:'Mot de passe oublié',rs_sub:'Entre l’e-mail ou le pseudo de ton compte : on t’envoie un lien pour choisir un nouveau mot de passe.',rs_send:'Envoyer le lien',
  rs_sent:'Si un compte existe, le lien vient d’être envoyé à son adresse e-mail. Pense à regarder dans les spams.',rs_new_t:'Nouveau mot de passe',rs_for:'Compte : {e}',rs_save:'Enregistrer',
  rs_done:'Mot de passe changé. Tu peux te connecter.',rs_bad:'Ce lien n’est plus valide (déjà utilisé ou expiré). Redemande un e-mail.',rs_mail_bad:'E-mail ou pseudo invalide.',rs_slow:'Trop de demandes : réessaie dans quelques minutes.',
  rs_confirm:'Confirme le mot de passe',rs_mismatch:'Les deux mots de passe sont différents.'});
Object.assign(I18N.en,{rs_title:'Forgot password',rs_sub:'Enter your account email or username: we will send you a link to choose a new password.',rs_send:'Send the link',
  rs_sent:'If an account exists, the link has just been sent to its email address. Check your spam folder.',rs_new_t:'New password',rs_for:'Account: {e}',rs_save:'Save',
  rs_done:'Password changed. You can log in now.',rs_bad:'This link is no longer valid (already used or expired). Request a new email.',rs_mail_bad:'Invalid email or username.',rs_slow:'Too many requests: try again in a few minutes.',
  rs_confirm:'Confirm the password',rs_mismatch:'The two passwords do not match.'});
Object.assign(I18N.ru,{rs_title:'Забыл пароль',rs_sub:'Введи e-mail или ник аккаунта: мы отправим ссылку для нового пароля.',rs_send:'Отправить ссылку',
  rs_sent:'Если аккаунт существует, ссылка уже отправлена на его e-mail. Проверь папку «Спам».',rs_new_t:'Новый пароль',rs_for:'Аккаунт: {e}',rs_save:'Сохранить',
  rs_done:'Пароль изменён. Теперь можно войти.',rs_bad:'Ссылка недействительна (уже использована или истекла). Запроси новое письмо.',rs_mail_bad:'Неверный e-mail или ник.',rs_slow:'Слишком много запросов: попробуй через несколько минут.',
  rs_confirm:'Подтверди пароль',rs_mismatch:'Пароли не совпадают.'});

document.body.insertAdjacentHTML('beforeend',`<div class="overlay rs-ov" id="rsModal" role="dialog" aria-modal="true" aria-labelledby="rsTitle"><div class="modal" style="max-width:420px"><div class="m-h"><h3 id="rsTitle">Mot de passe oublié</h3><button class="x2" data-close aria-label="Fermer">×</button></div><form id="rsForm" novalidate></form></div></div>`);
async function rsIdt(op,body){
  try{const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${op}?key=${FB_API_KEY}`,{method:'POST',headers:{'Content-Type':'application/json','X-Firebase-Locale':lang},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));return r.ok?j:{error:String(j.error&&j.error.message||'error')}}catch(e){return {error:'network'}}
}
const rsMsg=code=>/TOO_MANY|EXCEED/.test(code)?t('rs_slow'):/INVALID_EMAIL|MISSING_EMAIL/.test(code)?t('rs_mail_bad'):/OOB_CODE/.test(code)?t('rs_bad'):/WEAK_PASSWORD/.test(code)?t('e_pw_short'):t('e_server_error');

function rsAsk(){
  const v=($('#liLogin')?.value||'').trim();
  $('#rsTitle').textContent=t('rs_title');
  $('#rsForm').dataset.step='ask';
  $('#rsForm').innerHTML=`<p class="m-hint" style="margin:0 0 12px">${t('rs_sub')}</p>
    <div class="af"><label for="rsMail">${t('au_id')}</label><input id="rsMail" type="text" autocomplete="username" maxlength="254" value="${escA(v)}"></div>
    <div class="af-err" id="rsErr" role="alert"></div><div class="rs-ok" id="rsOk" hidden></div>
    <button class="btn primary" type="submit" style="width:100%">${t('rs_send')}</button>`;
  openModal('rsModal');setTimeout(()=>$('#rsMail').focus(),50);
}
async function rsNew(code){
  $('#rsTitle').textContent=t('rs_new_t');
  $('#rsForm').dataset.step='new';$('#rsForm').dataset.code=code;
  $('#rsForm').innerHTML='<div class="inf-load"><span class="spin inl"></span></div>';openModal('rsModal');
  const chk=await rsIdt('resetPassword',{oobCode:code});
  if(chk.error){$('#rsForm').innerHTML=`<div class="af-err">${t('rs_bad')}</div><button class="btn primary" type="button" data-rsask style="width:100%;margin-top:12px">${t('rs_title')}</button>`;return}
  $('#rsForm').innerHTML=`<p class="m-hint" style="margin:0 0 12px">${t('rs_for',{e:escA(chk.email||'')})}</p>
    <div class="af"><label for="rsPw">${t('au_pw_new')}</label><input id="rsPw" type="password" autocomplete="new-password" maxlength="128"></div>
    <div class="af"><label for="rsPw2">${t('rs_confirm')}</label><input id="rsPw2" type="password" autocomplete="new-password" maxlength="128"></div>
    <div class="af-err" id="rsErr" role="alert"></div>
    <button class="btn primary" type="submit" style="width:100%">${t('rs_save')}</button>`;
  $('#rsForm').dataset.email=chk.email||'';
  setTimeout(()=>$('#rsPw').focus(),50);
}
$('#rsForm').addEventListener('click',e=>{if(e.target.closest('[data-rsask]'))rsAsk()});
$('#rsForm').addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target,err=$('#rsErr'),btn=f.querySelector('button[type=submit]');if(!btn||btn.disabled)return;
  const fail=x=>{err.textContent=x;btn.disabled=false};err.textContent='';
  if(f.dataset.step==='ask'){
    const email=$('#rsMail').value.trim(),byName=!email.includes('@');
    if(byName?!/^[A-Za-z0-9_.-]{1,25}$/.test(email):!RE_MAIL.test(email))return fail(t('rs_mail_bad'));
    btn.disabled=true;
    const r=byName?await fbCall('resetName',{name:email,lang}):await rsIdt('sendOobCode',{requestType:'PASSWORD_RESET',email});
    if(r.error==='rate_limited')return fail(t('rs_slow'));
    if(r.error&&!/EMAIL_NOT_FOUND/.test(r.error))return fail(rsMsg(r.error));
    $('#rsOk').textContent=t('rs_sent');$('#rsOk').hidden=false;btn.hidden=true;return;
  }
  const pw=$('#rsPw').value,pw2=$('#rsPw2').value,pe=pwErr(pw);
  if(pe)return fail(t('e_'+pe));if(pw!==pw2)return fail(t('rs_mismatch'));
  btn.disabled=true;const r=await rsIdt('resetPassword',{oobCode:f.dataset.code,newPassword:pw});
  if(r.error)return fail(rsMsg(r.error));
  closeModal('rsModal');toast(t('rs_done'));
  if($('#liLogin'))$('#liLogin').value='';
  if(typeof showAuth==='function'&&!(AUTH&&AUTH.session))showAuth('login');
});
document.addEventListener('click',e=>{if(e.target.closest('#forgot')){e.stopImmediatePropagation();rsAsk()}},true);
(()=>{const q=new URLSearchParams(location.search);if(q.get('mode')!=='resetPassword'||!q.get('oobCode'))return;
  const code=q.get('oobCode');try{history.replaceState(null,'',location.pathname+(location.hash||''))}catch(_){}
  setTimeout(()=>rsNew(code),400)})();

(()=>{
  const q=new URLSearchParams(location.search);
  if(q.get('mode')!=='verifyEmail'||!q.get('oobCode'))return;
  const code=q.get('oobCode');
  try{history.replaceState(null,'',location.pathname+(location.hash||''))}catch(_){}
  setTimeout(async ()=>{
    const r=await rsIdt('update',{oobCode:code});
    if(r.error){
      toast(t('au_verify_link_expired')||'Ce lien de confirmation a expiré ou est invalide.');
    }else{
      toast(t('au_verify_success')||'Adresse e-mail vérifiée avec succès !');
      if(typeof hideVerifyScreen==='function')hideVerifyScreen();
      if(window.FBA&&FBA.uid&&typeof fbBuildSession==='function'){
        const s=await fbBuildSession();
        if(s)enterApp(s,t('au_hello',{n:s.account.username}));
        else if(typeof showAuth==='function')showAuth('login');
      }else if(typeof showAuth==='function'&&!(AUTH&&AUTH.session)){
        showAuth('login');
      }
    }
  },400);
})();
