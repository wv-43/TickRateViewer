const PLAN_RANK={free:0,plus:1,premium:2};
const PRICES={plus:{m:2.99,y:24.99},premium:{m:5.99,y:49.99}};
let billing='m';
try{const v=localStorage.getItem('tr_plan');if(PLAN_RANK[v]!==undefined)ME.plan=v}catch(e){}
const hasPlan=need=>PLAN_RANK[ME.plan||'free']>=PLAN_RANK[need];
const planName=pl=>t('plan_'+pl);
const INF_ICON='<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M464 384.39a32 32 0 01-13-2.77 15.77 15.77 0 01-2.71-1.54l-82.71-58.22A32 32 0 01352 295.7v-79.4a32 32 0 0113.58-26.16l82.71-58.22a15.77 15.77 0 012.71-1.54 32 32 0 0145 29.24v192.76a32 32 0 01-32 32zM268 400H84a68.07 68.07 0 01-68-68V180a68.07 68.07 0 0168-68h184.48A67.6 67.6 0 01336 179.52V332a68.07 68.07 0 01-68 68z"/></svg>';
const PLUS_ICON='<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm80 224h-64v64a16 16 0 01-32 0v-64h-64a16 16 0 010-32h64v-64a16 16 0 0132 0v64h64a16 16 0 010 32z"/></svg>';
const PREM_ICON='<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M121.72 32a4 4 0 00-3.72 5.56l2.3 5.43 40.7 94.9a4 4 0 006.88.82L243 38.4a4 4 0 00-3.2-6.4zM419.93 58.06l-41.28 96.37a4 4 0 003.68 5.57h101a4 4 0 003.4-6.11L427 57.53a4 4 0 00-7.07.53zM85 57.57l-59.71 96.32a4 4 0 003.4 6.11h101a4 4 0 003.67-5.58L92 58.1a4 4 0 00-7-.53zM393.27 32H267.82a1.94 1.94 0 00-1.56 3.11l79.92 106.46a1.94 1.94 0 003.34-.4L391.6 43l3.4-8.34a1.92 1.92 0 00-1.7-2.66zM239 448l-89.43-253.49A3.78 3.78 0 00146 192H25.7a3.72 3.72 0 00-2.95 6l216 279.81a5.06 5.06 0 006.39 1.37 5 5 0 002.39-6.08zM486.3 192H366a3.75 3.75 0 00-3.54 2.51l-98.2 278.16a5.21 5.21 0 002.42 6.31 5.22 5.22 0 006.61-1.39L489.25 198a3.72 3.72 0 00-2.95-6zM259.2 78.93l56 74.67a4 4 0 01-3.2 6.4H200a4 4 0 01-3.2-6.4l56-74.67a4 4 0 016.4 0zm-7 310.31l-67.7-191.91a4 4 0 013.77-5.33h135.46a4 4 0 013.77 5.33l-67.73 191.91a4 4 0 01-7.54 0z"/></svg>';
const infBadge=()=>`<span class="pb inf">${INF_ICON}${t('inf_badge')}</span>`;
function planBadge(p){const pl=p.plan||'free';return prestigeChip(p)+(p.influencer?infBadge():pl==='free'?'':`<span class="pb ${pl}">${pl==='plus'?PLUS_ICON+'PLUS':PREM_ICON+'PREMIUM'}</span>`)}
const planOffered=()=>!!ME.influencer&&ME.planSource==='influencer';
const eur=n=>n.toLocaleString(LOC[lang],{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
const CHECK='<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M416 128L192 384l-96-96"/></svg>';
const LOCK='<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M368 192h-16v-80a96 96 0 10-192 0v80h-16a64.07 64.07 0 00-64 64v176a64.07 64.07 0 0064 64h224a64.07 64.07 0 0064-64V256a64.07 64.07 0 00-64-64zm-48 0H192v-80a64 64 0 11128 0z"/></svg>';
const FEATS={free:['f_mm_free','f_stats','f_inv','f_hist'],plus:['f_mm_plus','f_skins','f_knives','f_st','f_badge_plus'],premium:['f_mm_prem','f_agents','f_review','f_demo','f_hist_unl','f_profile','f_support']};
const CMP=[['cmp_gap','±400','±250','±150'],['cmp_trust',2],['f_mm',0],['f_stats',0],['f_inv',0],['f_hist',0],['f_skins',1],['f_knives',1],['f_st',1],['f_agents',2],['f_review',2],['f_demo',2],['f_hist_unl',2],['f_profile',2],['f_support',2]];

const PAYMENTS_COMING_SOON = typeof window !== 'undefined' && window.PAYMENTS_COMING_SOON !== undefined ? window.PAYMENTS_COMING_SOON : true;
const payLive=()=>typeof fbLive==='function'&&fbLive()&&AUTH.mode==='firebase'&&!!FBA.uid;
const paidSub=()=>ME.planSource==='stripe'&&ME.plan!=='free';
Object.assign(I18N.fr,{pay_login:'Connecte-toi avec un compte TICKRATE pour payer.',pay_wait:'Paiement reçu, activation en cours…',pay_cancel:'Paiement annulé : rien n’a été débité.',pay_manage:'Gérer mon abonnement',pay_coins_ok:'+{n} Tick Coins ajoutés',pay_slow:'Paiement validé, l’activation prend du retard : recharge la page dans une minute.',
  coming_soon:'Bientôt disponible',pay_cs_title:'Lancement officiel à venir',pay_cs_desc:'Les abonnements et paiements par carte ouvriront très prochainement. Tous les drops de skins, caisses, missions et récompenses en jeu sont 100 % actifs et gratuits !',pay_cs_coins_desc:'L’achat de packs de pièces sera disponible lors du lancement officiel. Gagne des pièces et des skins gratuitement dès maintenant en jouant tes matchs et en accomplissant tes missions !',pay_cs_free_hint:'Astuce : gagne des Tick Coins et des caisses/skins gratuitement à la fin de chaque match.',pay_coming_soon:'Paiements par carte bientôt disponibles (lancement officiel). Profite dès maintenant des caisses, missions et drops gratuits en jeu !',
  e_pay_coming_soon:'Les paiements par carte sont temporairement en mode aperçu (lancement officiel à venir).',e_pay_has_sub:'Tu as déjà un abonnement : change de formule depuis « Gérer mon abonnement ».',e_pay_influencer:'Ton Premium est déjà offert par le programme Influenceur.',e_pay_bad_item:'Cet article n’existe pas.',e_pay_no_customer:'Aucun abonnement à gérer.'});
Object.assign(I18N.en,{pay_login:'Log in with a TICKRATE account to pay.',pay_wait:'Payment received, activating…',pay_cancel:'Payment cancelled: nothing was charged.',pay_manage:'Manage subscription',pay_coins_ok:'+{n} Tick Coins added',pay_slow:'Payment confirmed, activation is running late: reload the page in a minute.',
  coming_soon:'Coming soon',pay_cs_title:'Official launch coming soon',pay_cs_desc:'Credit card subscriptions will be activated very soon. All skin drops, cases, missions, and in-game rewards are 100% active and free!',pay_cs_coins_desc:'Purchasing coin packs will be available at official launch. Earn coins and skins for free right now by playing matches and completing missions!',pay_cs_free_hint:'Tip: earn free Tick Coins, cases, and skins at the end of every match.',pay_coming_soon:'Card payments coming soon (official launch). Enjoy all free cases, missions, and in-game drops right now!',
  e_pay_coming_soon:'Online payments are temporarily in preview mode (official launch upcoming).',e_pay_has_sub:'You already have a subscription: switch plans from “Manage subscription”.',e_pay_influencer:'Your Premium is already free through the Influencer Program.',e_pay_bad_item:'This item does not exist.',e_pay_no_customer:'No subscription to manage.'});
Object.assign(I18N.ru,{pay_login:'Войди в аккаунт TICKRATE, чтобы оплатить.',pay_wait:'Оплата получена, активируем…',pay_cancel:'Оплата отменена: деньги не списаны.',pay_manage:'Управлять подпиской',pay_coins_ok:'+{n} Tick Coins',pay_slow:'Оплата подтверждена, активация задерживается: обнови страницу через минуту.',
  coming_soon:'Скоро',pay_cs_title:'Скоро официальный запуск',pay_cs_desc:'Подписки по банковским картам станут доступны в ближайшее время. Все дропы скинов, кейсы, миссии и награды в игре на 100% активны и бесплатны!',pay_cs_coins_desc:'Покупка коинов откроется при официальном запуске. Зарабатывайте коины и скины бесплатно за матчи и задания!',pay_cs_free_hint:'Совет: получайте бесплатные Tick Coins, кейсы и скины после каждого матча.',pay_coming_soon:'Оплата картой скоро откроется (официальный запуск). Забирайте бесплатные кейсы, миссии и дропы за игру!',
  e_pay_coming_soon:'Онлайн-оплата временно в режиме предпросмотра (скоро запуск).',e_pay_has_sub:'У тебя уже есть подписка: смени тариф в «Управлять подпиской».',e_pay_influencer:'Premium уже выдан по программе инфлюенсеров.',e_pay_bad_item:'Такого товара нет.',e_pay_no_customer:'Нет подписки для управления.'});
async function payCall(name,data){
  await fbAuthEnsure();
  try{const r=await fetch(`${FB_FN()}/${name}`,{method:'POST',headers:{'Content-Type':'application/json',...(FBA.idToken?{Authorization:'Bearer '+FBA.idToken}:{})},body:JSON.stringify({data:{...data,origin:location.origin}})});
    const j=await r.json().catch(()=>({}));return j.error?{error:j.error.message||'server_error'}:(j.result||{})}catch(e){return {error:'network'}}
}
const payErr=c=>{const k='e_'+c;return t(k)!==k?t(k):t('e_server_error')};
async function openBillingPortal(){
  const r=await payCall('payPortal',{});
  if(r.error)return toast(payErr(r.error));
  location.href=r.url;
}

function setPlan(pl){
  ME.plan=pl;if(!payLive())try{localStorage.setItem('tr_plan',pl)}catch(e){}
  purgeLoadout();refreshMe();renderParty();refreshViews2();
}
function renderGoPrem(){
  const b=$('#goPrem');if(!b)return;
  if(ME.plan==='free'&&!ME.influencer){b.className='go-prem';b.textContent=t('go_premium')}
  else{b.className='go-prem has';b.innerHTML=planBadge(ME)}
}
function renderPremium(){
  const price=pl=>billing==='m'?PRICES[pl].m:PRICES[pl].y;
  const card=pl=>{
    const cur=ME.plan===pl,feat=pl==='premium';
    const head=pl==='plus'?`<li class="hd">${t('f_all_free')}</li>`:pl==='premium'?`<li class="hd">${t('f_all_plus')}</li>`:'';
    const pr=pl==='free'?`<div class="price">0 €</div><div class="bil"></div>`
      :`<div class="price">${eur(price(pl))}<small>${billing==='m'?t('per_month'):t('per_year')}</small></div><div class="bil">${billing==='y'?t('billed_year',{x:eur(PRICES[pl].y/12)}):''}</div>`;
    let cta;
    if(cur&&planOffered())cta=`<button class="btn" disabled>${t('inf_offered')}</button>`;
    else if(planOffered())cta=`<button class="btn ghost" disabled>${t('choose',{x:planName(pl)})}</button>`;
    else if(cur&&paidSub())cta=`<button class="btn" disabled>${t('current_plan')}</button><button class="btn ghost sm" style="margin-top:6px" data-manage>${t('pay_manage')}</button>`;
    else if(paidSub())cta=`<button class="btn ghost" data-manage>${t('choose',{x:planName(pl)})}</button>`;
    else if(cur)cta=`<button class="btn" disabled>${t('current_plan')}</button>${pl!=='free'?`<button class="btn ghost sm" style="margin-top:6px" data-cancel>${t('cancel_sub')}</button>`:''}`;
    else if(pl==='free')cta=`<button class="btn ghost" data-cancel>${t('choose',{x:planName('free')})}</button>`;
    else if(PAYMENTS_COMING_SOON)cta=`<button class="btn ${feat?'primary':''}" data-coming-soon="sub" style="display:inline-flex;align-items:center;justify-content:center;gap:7px;width:100%"><span style="width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.85;display:inline-block"></span>${t('coming_soon')}</button>`;
    else cta=`<button class="btn ${feat?'primary':''}" data-buy="${pl}">${t('choose',{x:planName(pl)})}</button>`;
    return `<div class="plan ${cur?'cur':''}">
      <h3 class="${pl!=='free'?'gold':''}">${planName(pl)}</h3><div class="pd">${t('plan_'+(pl==='premium'?'prem':pl)+'_d')}</div>${pr}
      <ul class="pl-list">${head}${FEATS[pl].map(f=>`<li><span>${t(f)}</span></li>`).join('')}</ul>${cta}</div>`;
  };
  const yn=v=>v?`<span class="yes">${CHECK.replace('<svg','<svg style="width:16px;height:16px"')}</span>`:'<span class="no">—</span>';
  const csBanner = PAYMENTS_COMING_SOON ? `
    <div class="card pay-cs-banner" style="margin:0 0 24px;border:1px solid rgba(255,171,26,.3);background:linear-gradient(90deg,rgba(255,171,26,.08),transparent 80%);display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.05)">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--acc)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <div style="font-size:13px;line-height:1.45;color:#cfd3dc"><b style="color:#fff">${t('pay_cs_title')} :</b> ${t('pay_cs_desc')}</div>
    </div>` : '';
  $('#premium').innerHTML=`<div class="pr-hero"><h1>${t('pr_title')}</h1><p>${t('pr_sub')}</p>
      <div class="bill"><button class="${billing==='m'?'on':''}" data-bill="m">${t('monthly')}</button><button class="${billing==='y'?'on':''}" data-bill="y">${t('yearly')}<span class="save">−30 %</span></button></div></div>
    ${csBanner}
    <div class="plans">${['free','plus','premium'].map(card).join('')}</div>
    <div class="card cmp"><div class="h3" style="padding:16px 18px 0">${t('compare')}</div><div class="tbl-wrap"><table class="tbl">
      <thead><tr><th></th><th>${planName('free')}</th><th class="gold">PLUS</th><th class="gold">PREMIUM</th></tr></thead>
      <tbody>${CMP.map(([f,lvl,b,c])=>typeof lvl==='string'?`<tr><td style="text-align:left">${t(f)}</td><td>${lvl}</td><td class="gold">${b}</td><td class="gold"><b>${c}</b></td></tr>`:`<tr><td style="text-align:left">${t(f)}</td><td>${yn(lvl<=0)}</td><td>${yn(lvl<=1)}</td><td>${yn(lvl<=2)}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="sec-t">${t('faq')}</div>
    <div class="faq">${[1,2,3].map(i=>`<div class="card"><b>${t('q'+i)}</b><p>${t('a'+i)}</p></div>`).join('')}</div>
    <div class="card inf-cta"><div><b>${t('inf_title')} ${infBadge()}</b><p>${t('inf_sub')}</p></div><button class="btn" data-view-go="influencer">${t(ME.influencer?'inf_tab_apply':'inf_send')}</button></div>`;
}
$('#premium').addEventListener('click',e=>{
  const b=e.target.closest('[data-bill]');if(b){billing=b.dataset.bill;return renderPremium()}
  const cs=e.target.closest('[data-coming-soon]');if(cs)return toast(t('pay_coming_soon'));
  const buy=e.target.closest('[data-buy]');if(buy)return openCheckout(buy.dataset.buy);
  if(e.target.closest('[data-view-go]'))return setView(e.target.closest('[data-view-go]').dataset.viewGo);
  if(e.target.closest('[data-manage]'))return openBillingPortal();
  if(e.target.closest('[data-cancel]'))confirmBox(t('cancel_title'),t('cancel_text'),t('cancel_sub'),t('keep'),()=>{setPlan('free');toast(t('cancel_ok'))});
});
let coPlan=null;
function openCheckout(pl){
  if(PAYMENTS_COMING_SOON)return toast(t('pay_coming_soon'));
  coPlan=pl;coPack=null;const amount=billing==='m'?PRICES[pl].m:PRICES[pl].y;
  $('#coBody').innerHTML=`<div class="co-line"><span>${t('plan_'+pl)}</span><b>${planBadge({plan:pl})}</b></div>
    <div class="co-line"><span>${t('period_l')}</span><b>${billing==='m'?t('monthly'):t('yearly')}</b></div>
    <div class="co-line" style="border:none"><span>${t('total')}</span><span class="co-total">${eur(amount)}</span></div>
    <div class="m-hint">${LOCK.replace('<svg','<svg style="width:13px;height:13px;vertical-align:-2px"')} ${t('secure')}</div>`;
  const b=$('#coPay');b.disabled=false;b.textContent=t('pay');openModal('checkoutModal');
}
$('#coPay').onclick=async()=>{
  if(PAYMENTS_COMING_SOON)return toast(t('pay_coming_soon'));
  if(!payLive())return toast(t('pay_login'));
  const b=$('#coPay');b.disabled=true;b.innerHTML='<span class="spin inl"></span> '+t('paying');
  const r=await payCall('payCheckout',coPack?{kind:'coins',pack:coPack}:{kind:'plan',plan:coPlan,period:billing});
  if(r.error){b.disabled=false;b.textContent=t('pay');return toast(payErr(r.error))}
  location.href=r.url;
};

async function payReturn(){
  const q=new URLSearchParams(location.search),st=q.get('pay'),sid=q.get('sid');
  if(!st)return;
  history.replaceState(history.state,'',location.pathname+location.hash);
  if(st==='cancel')return toast(t('pay_cancel'));
  if(st!=='ok'||!/^cs_[A-Za-z0-9_]+$/.test(sid||''))return;
  toast(t('pay_wait'));
  for(let i=0;i<20;i++){
    const p=await fbReq(`purchases/${FBA.uid}/${sid}`);
    if(p&&p.status==='paid'){
      if(p.kind==='coins'){
        let done=false;try{done=localStorage.getItem('tr_paid_'+sid)==='1';localStorage.setItem('tr_paid_'+sid,'1')}catch(e){}
        if(typeof srvOn==='function'&&srvOn()&&typeof seRefresh==='function')await seRefresh();
        else if(!done){SHOP.coins+=p.coins;saveShop();renderWallet()}
        toast(t('pay_coins_ok',{n:p.coins}));
      }else{
        const prof=await fbReq(`profiles/${FBA.uid}`)||{};
        ME.plan=prof.plan||'free';ME.planSource=prof.planSource||null;
        purgeLoadout();refreshMe();renderParty();refreshViews2();if(!$('#premium').hidden)renderPremium();
        if(ME.plan!=='free')toast(t('welcome',{x:planName(ME.plan)}));
      }
      return beep(784,.1),beep(1047,.14,.1);
    }
    await new Promise(r=>setTimeout(r,2000));
  }
  toast(t('pay_slow'));
}
(function payWait(n=0){let ready=false;try{ready=payLive()&&!!AUTH.session}catch(e){}
  if(ready)return payReturn();if(n<40)setTimeout(()=>payWait(n+1),500)})();

