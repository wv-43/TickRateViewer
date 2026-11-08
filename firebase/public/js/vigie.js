/* =====================================================
 * TICKRATE - Menu Vigie : Anti-cheat & Revue communautaire (vigie.js)
 * ===================================================== */
/* =====================================================
   VIGIE : fair-play sans rien installer
   reports pondérés + analyse des matchs (plugin serveur) + revue communautaire
   (en mode serveur : /api/vigie/*, /api/reports ; ici en démo tout est simulé)
   ===================================================== */
Object.assign(I18N.fr,{vg_copy:'Copier',nav_vigie:'Vigie',vg_title:'Vigie',vg_tag:'Le fair-play de TICKRATE. Rien à installer sur ton PC.',
  vg_s1:'Reports pondérés',vg_s1t:'Chaque report a un poids. Si tes reports sont souvent confirmés, ils comptent plus. Si tu reportes à chaque défaite, ils comptent moins.',
  vg_s2:'Analyse des matchs',vg_s2t:'Le serveur CS:GO mesure ton jeu, pas ton PC : temps de réaction, flicks, viseur qui suit un ennemi derrière un mur… comparé aux joueurs de ton niveau, sur plusieurs matchs.',
  vg_s3:'Revue par la communauté',vg_s3t:'Les cas suspects partent en revue chez des joueurs fiables, avec la demo anonymisée. Seul leur verdict peut bannir.',
  vg_status:'Mon statut',vg_pool:'File',vg_pool_normal:'Normale',vg_pool_low:'Faible confiance',vg_pool_t:'Les joueurs à trust bas ou très suspects jouent entre eux, en attendant la revue.',
  vg_rep:'Mes reports',vg_rep_acc:'Fiabilité',vg_rep_w:'Poids actuel de tes reports',vg_rep_conf:'Confirmés',vg_rep_rej:'Rejetés',vg_rep_pend:'En revue',vg_rep_other:'Autres motifs',vg_rep_t:'Seuls les reports « triche » passent par la revue. Les autres motifs jouent uniquement sur le trust factor.',
  vg_rev:'Examinateur',vg_rev_acc:'Précision',vg_rev_n:'Dossiers examinés',vg_rev_ok:'En accord avec le verdict',vg_rev_reward:'+{n} pièces par dossier où tu es d\'accord avec le verdict final (5 par jour).',
  vg_elig_no:'Pour examiner des dossiers : niveau 6 minimum, 50 matchs, trust 7/10 et aucune sanction en cours.',
  vg_take:'Examiner un dossier',vg_nocase:'Aucun dossier en attente pour l\'instant. Reviens plus tard.',
  vg_case:'Dossier #{n}',vg_anon:'Le suspect est anonymisé (« Suspect »), les autres joueurs aussi. Regarde la demo, surtout les moments signalés, puis donne ton avis.',
  vg_demo:'Demo du match',vg_demo_dl:'Télécharger la demo',vg_demo_how:'Mets le fichier dans csgo/, ouvre la console puis colle la commande. Shift+F2 ouvre le lecteur de demo.',vg_demo_off:'Mode démo : pas de vraie demo à télécharger. En ligne, le plugin serveur enregistre la demo GOTV de chaque match.',
  vg_moments:'Moments signalés par l\'analyse',vg_go:'Aller au moment',vg_copied:'Commande copiée',
  vg_stats:'Ce match comparé aux joueurs du même niveau',vg_avg:'moy.',vg_z:'Écart',
  f_hidden:'Viseur sur un ennemi caché',f_react:'Temps de réaction',f_flick:'Kills après un flick',f_preaim:'Viseur déjà sur la tête',f_through:'Kills à travers fumée/mur',f_hs:'Headshots',f_acc:'Précision des tirs',
  m_flick:'Flick',m_track:'Suit à travers un mur',m_react:'Réaction',m_wallbang:'Wallbang',m_smoke:'À travers fumée',m_hs:'Headshot',
  vg_round:'Round {n}',vg_wait:'Vote possible dans {n} s',vg_q:'Ton avis sur le Suspect',
  v_cheat_aim:'Aide à la visée',v_cheat_wall:'Wallhack',v_cheat_other:'Autre triche',v_clean:'Rien d\'anormal',v_unsure:'Je ne sais pas',
  vg_thanks:'Merci, ton avis est enregistré.',vg_final:'Verdict de la communauté : {x} ({n} avis)',vg_guilty:'Coupable',vg_cleanv:'Innocent',vg_insuf:'Preuves insuffisantes',
  vg_agree:'Tu es d\'accord avec le verdict : précision {a} → {b}',vg_disagree:'Tu n\'es pas d\'accord avec le verdict : précision {a} → {b}',vg_unsure_t:'« Je ne sais pas » ne change pas ta précision.',
  vg_next:'Dossier suivant',vg_hist:'Mes dernières revues',vg_none:'Aucune revue pour l\'instant.',
  vg_what:'Ce que la Vigie ne fait pas',vg_w1:'Rien n\'est installé chez toi : tout est mesuré par le serveur de jeu.',vg_w2:'Jamais de ban automatique : seul un verdict de revue peut bannir (30 jours, puis définitif).',vg_w3:'Un seul gros match ne suffit pas : le score se construit sur plusieurs matchs et tient compte de ton niveau.',vg_w4:'Ton score de suspicion n\'est jamais affiché, pour ne pas aider les tricheurs à rester juste en dessous.',
  vg_rep_weight:'Poids de ton report : ×{w}',vg_resolved:'Ton report sur {n} : {x}',vg_conf_s:'confirmé',vg_rej_s:'rejeté',anticheat:'Vigie active'});
Object.assign(I18N.en,{vg_copy:'Copy',nav_vigie:'Watch',vg_title:'Watch',vg_tag:'TICKRATE fair play. Nothing to install on your PC.',
  vg_s1:'Weighted reports',vg_s1t:'Every report has a weight. If your reports are often confirmed, they count more. Report after every loss and they count less.',
  vg_s2:'Match analysis',vg_s2t:'The CS:GO server measures how you play, not your PC: reaction time, flicks, crosshair following an enemy behind a wall… compared to players of your level, over several matches.',
  vg_s3:'Community review',vg_s3t:'Suspicious cases go to trusted players with the anonymized demo. Only their verdict can ban.',
  vg_status:'My status',vg_pool:'Queue',vg_pool_normal:'Normal',vg_pool_low:'Low trust',vg_pool_t:'Low-trust or highly suspicious players play each other until reviewed.',
  vg_rep:'My reports',vg_rep_acc:'Reliability',vg_rep_w:'Current weight of your reports',vg_rep_conf:'Confirmed',vg_rep_rej:'Rejected',vg_rep_pend:'In review',vg_rep_other:'Other reasons',vg_rep_t:'Only “cheating” reports go to review. Other reasons only affect trust factor.',
  vg_rev:'Reviewer',vg_rev_acc:'Accuracy',vg_rev_n:'Cases reviewed',vg_rev_ok:'Agreed with the verdict',vg_rev_reward:'+{n} coins per case where you agree with the final verdict (5 per day).',
  vg_elig_no:'To review cases: level 6+, 50 matches, trust 7/10 and no active penalty.',
  vg_take:'Review a case',vg_nocase:'No case waiting right now. Come back later.',
  vg_case:'Case #{n}',vg_anon:'The suspect is anonymized (“Suspect”), so are the other players. Watch the demo, especially the flagged moments, then give your opinion.',
  vg_demo:'Match demo',vg_demo_dl:'Download demo',vg_demo_how:'Put the file in csgo/, open the console and paste the command. Shift+F2 opens the demo player.',vg_demo_off:'Demo mode: no real demo to download. Online, the server plugin records the GOTV demo of every match.',
  vg_moments:'Moments flagged by the analysis',vg_go:'Go to moment',vg_copied:'Command copied',
  vg_stats:'This match vs players of the same level',vg_avg:'avg',vg_z:'Gap',
  f_hidden:'Crosshair on a hidden enemy',f_react:'Reaction time',f_flick:'Kills after a flick',f_preaim:'Already aiming at the head',f_through:'Kills through smoke/wall',f_hs:'Headshots',f_acc:'Shot accuracy',
  m_flick:'Flick',m_track:'Tracks through a wall',m_react:'Reaction',m_wallbang:'Wallbang',m_smoke:'Through smoke',m_hs:'Headshot',
  vg_round:'Round {n}',vg_wait:'Vote available in {n} s',vg_q:'Your opinion on the Suspect',
  v_cheat_aim:'Aim assistance',v_cheat_wall:'Wallhack',v_cheat_other:'Other cheat',v_clean:'Nothing wrong',v_unsure:'Not sure',
  vg_thanks:'Thanks, your opinion is saved.',vg_final:'Community verdict: {x} ({n} opinions)',vg_guilty:'Guilty',vg_cleanv:'Innocent',vg_insuf:'Insufficient evidence',
  vg_agree:'You agree with the verdict: accuracy {a} → {b}',vg_disagree:'You disagree with the verdict: accuracy {a} → {b}',vg_unsure_t:'“Not sure” does not change your accuracy.',
  vg_next:'Next case',vg_hist:'My recent reviews',vg_none:'No reviews yet.',
  vg_what:'What Watch does not do',vg_w1:'Nothing is installed on your PC: everything is measured by the game server.',vg_w2:'Never an automatic ban: only a review verdict can ban (30 days, then permanent).',vg_w3:'One big match is not enough: the score builds over several matches and accounts for your level.',vg_w4:'Your suspicion score is never shown, so cheaters cannot stay just below it.',
  vg_rep_weight:'Your report weight: ×{w}',vg_resolved:'Your report on {n}: {x}',vg_conf_s:'confirmed',vg_rej_s:'rejected',anticheat:'Watch active'});
Object.assign(I18N.ru,{vg_copy:'Копировать',nav_vigie:'Дозор',vg_title:'Дозор',vg_tag:'Фейр-плей TICKRATE. Ничего не нужно устанавливать.',
  vg_s1:'Взвешенные жалобы',vg_s1t:'У каждой жалобы есть вес. Если твои жалобы подтверждаются, они весят больше. Жалуешься после каждого поражения - меньше.',
  vg_s2:'Анализ матчей',vg_s2t:'Сервер CS:GO измеряет твою игру, а не твой ПК: реакцию, флики, прицел на враге за стеной… в сравнении с игроками твоего уровня, по нескольким матчам.',
  vg_s3:'Проверка сообществом',vg_s3t:'Подозрительные случаи проверяют надёжные игроки по анонимной демке. Забанить может только их вердикт.',
  vg_status:'Мой статус',vg_pool:'Очередь',vg_pool_normal:'Обычная',vg_pool_low:'Низкое доверие',vg_pool_t:'Игроки с низким трастом или очень подозрительные играют между собой до проверки.',
  vg_rep:'Мои жалобы',vg_rep_acc:'Надёжность',vg_rep_w:'Текущий вес твоих жалоб',vg_rep_conf:'Подтверждены',vg_rep_rej:'Отклонены',vg_rep_pend:'На проверке',vg_rep_other:'Другие причины',vg_rep_t:'На проверку идут только жалобы «читы». Остальные влияют только на траст.',
  vg_rev:'Проверяющий',vg_rev_acc:'Точность',vg_rev_n:'Проверено дел',vg_rev_ok:'Совпало с вердиктом',vg_rev_reward:'+{n} монет за дело, где ты согласен с итоговым вердиктом (5 в день).',
  vg_elig_no:'Чтобы проверять: уровень 6+, 50 матчей, траст 7/10 и нет активных наказаний.',
  vg_take:'Проверить дело',vg_nocase:'Сейчас дел нет. Загляни позже.',
  vg_case:'Дело №{n}',vg_anon:'Подозреваемый анонимен («Подозреваемый»), остальные игроки тоже. Посмотри демку, особенно отмеченные моменты, и дай оценку.',
  vg_demo:'Демка матча',vg_demo_dl:'Скачать демку',vg_demo_how:'Положи файл в csgo/, открой консоль и вставь команду. Shift+F2 открывает плеер демок.',vg_demo_off:'Демо-режим: настоящей демки нет. Онлайн плагин сервера записывает GOTV-демку каждого матча.',
  vg_moments:'Моменты, отмеченные анализом',vg_go:'К моменту',vg_copied:'Команда скопирована',
  vg_stats:'Этот матч в сравнении с игроками того же уровня',vg_avg:'ср.',vg_z:'Отклонение',
  f_hidden:'Прицел на скрытом враге',f_react:'Время реакции',f_flick:'Убийства после флика',f_preaim:'Прицел уже на голове',f_through:'Убийства сквозь дым/стену',f_hs:'Хедшоты',f_acc:'Точность',
  m_flick:'Флик',m_track:'Ведёт сквозь стену',m_react:'Реакция',m_wallbang:'Прострел',m_smoke:'Сквозь дым',m_hs:'Хедшот',
  vg_round:'Раунд {n}',vg_wait:'Голосование через {n} с',vg_q:'Твоё мнение о подозреваемом',
  v_cheat_aim:'Помощь в прицеливании',v_cheat_wall:'Волхак',v_cheat_other:'Другой чит',v_clean:'Ничего странного',v_unsure:'Не уверен',
  vg_thanks:'Спасибо, мнение сохранено.',vg_final:'Вердикт сообщества: {x} ({n} мнений)',vg_guilty:'Виновен',vg_cleanv:'Невиновен',vg_insuf:'Недостаточно доказательств',
  vg_agree:'Ты согласен с вердиктом: точность {a} → {b}',vg_disagree:'Ты не согласен с вердиктом: точность {a} → {b}',vg_unsure_t:'«Не уверен» не меняет точность.',
  vg_next:'Следующее дело',vg_hist:'Мои последние проверки',vg_none:'Проверок пока нет.',
  vg_what:'Чего Дозор не делает',vg_w1:'На твой ПК ничего не ставится: всё измеряет игровой сервер.',vg_w2:'Никаких автобанов: забанить может только вердикт проверки (30 дней, затем навсегда).',vg_w3:'Одного яркого матча мало: оценка строится по нескольким матчам с учётом уровня.',vg_w4:'Твой балл подозрения никогда не показывается, чтобы читеры не держались чуть ниже порога.',
  vg_rep_weight:'Вес твоей жалобы: ×{w}',vg_resolved:'Твоя жалоба на {n}: {x}',vg_conf_s:'подтверждена',vg_rej_s:'отклонена',anticheat:'Дозор активен'});
// on ne parle plus d'« anti-cheat » : rien n'est installé chez le joueur
I18N.fr.au_sub='Serveurs 128 tick, ELO basé sur tes performances, trust factor et Vigie (fair-play sans logiciel à installer). Crée ton compte, lie Steam et lance ta première partie.';I18N.fr.au_b3='reports pondérés et analyse des matchs';
I18N.en.au_sub='128-tick servers, ELO based on your performance, trust factor and Watch (fair play, nothing to install). Create your account, link Steam and play your first match.';I18N.en.au_b3='weighted reports and match analysis';
I18N.ru.au_sub='Серверы 128 тик, ELO по твоей игре, траст и Дозор (фейр-плей без установки). Создай аккаунт, привяжи Steam и сыграй первый матч.';I18N.ru.au_b3='взвешенные жалобы и анализ матчей';

const VG_FEAT={hidden:{fmt:v=>Math.round(v*100)+' %',dir:1},react:{fmt:v=>Math.round(v)+' ms',dir:-1},flick:{fmt:v=>Math.round(v*100)+' %',dir:1},preaim:{fmt:v=>Math.round(v*100)+' %',dir:1},through:{fmt:v=>Math.round(v*100)+' %',dir:1},hs:{fmt:v=>Math.round(v*100)+' %',dir:1},acc:{fmt:v=>Math.round(v*100)+' %',dir:1}};
const VG_BASE={hidden:[.05,.025],react:[330,70],flick:[.06,.05],preaim:[.18,.08],through:[.05,.05],hs:[.42,.10],acc:[.20,.05]};
const VG_REWARD=10,VG_WATCH=10;   // démo : 10 s avant de voter (60 s en ligne)
let VG={repAcc:.6,revAcc:.6,reviews:[],sent:[],cur:null,nextId:1040+Math.floor(Math.random()*400),paid:[]};
try{const v=JSON.parse(localStorage.getItem('tr_vigie')||'null');if(v&&typeof v.repAcc==='number')VG=Object.assign(VG,v)}catch(e){}
const vgSave=()=>{try{localStorage.setItem('tr_vigie',JSON.stringify(VG))}catch(e){}};
const vgClamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const vgWeight=()=>+(vgClamp(VG.repAcc/.6,.2,1.6)*(.3+.7*trust(ME)/10)).toFixed(2);
const vgPool=()=>trust(ME)<4?'low':'normal';
const vgElig=()=>lvl(ME.elo)>=6&&ME.matches>=50&&trust(ME)>=7&&!(typeof banned==='function'&&banned());

// --- dossier simulé (en ligne : GET /api/vigie/review) ---
function vgMakeCase(){
  const truth=Math.random()<.35?'aim':Math.random()<.55?'wall':'clean';
  const elo=rnd(1250,2300),k=(elo-1500)/1000,R=rnd(20,30),kills=rnd(15,32),stats={};
  const gen={hidden:truth==='wall'?[.13,.22]:[.03,.08],react:truth==='aim'?[115,175]:[240,360],flick:truth==='aim'?[.22,.4]:[.02,.12],
    preaim:truth==='wall'?[.42,.6]:[.12,.3],through:truth==='wall'?[.15,.3]:[0,.1],hs:truth==='aim'?[.66,.85]:[.36,.62],acc:truth==='aim'?[.3,.4]:[.17,.27]};
  for(const f in gen){const [a,b]=gen[f],v=a+Math.random()*(b-a),[mu0,sd]=VG_BASE[f],mu=mu0+({hidden:.01,react:-45,flick:.03,preaim:.06,through:.01,hs:.06,acc:.03}[f])*k;
    stats[f]={v:+v.toFixed(3),avg:+mu.toFixed(3),z:+(VG_FEAT[f].dir*(v-mu)/sd).toFixed(2)}}
  const types=truth==='aim'?['flick','react','flick','hs','react']:truth==='wall'?['track','wallbang','track','smoke','track']:['flick','track','wallbang','react'];
  const mm=[],n=rnd(4,7),tr=Math.round(R*128*105);
  for(let i=0;i<n;i++){const r=rnd(1,R),ty=pick(types);
    mm.push({r,tick:Math.round((r-1)*128*105+rnd(1500,12000)),type:ty,d:ty==='flick'?rnd(28,74)+'° / 4 ticks → HS':ty==='react'?rnd(truth==='aim'?70:150,truth==='aim'?110:240)+' ms':ty==='track'?(rnd(8,30)/10).toFixed(1).replace('.',',')+' s':''})}
  mm.sort((a,b)=>a.tick-b.tick);
  const map=pick(MAPS.filter(m=>m.g==='active')),win=Math.random()<.5;
  return {id:VG.nextId++,map:map.n,slug:map.slug,score:win?[16,rnd(4,14)]:[rnd(4,14),16],rounds:R,kills,stats,moments:mm,at:Date.now(),truth,demo:'tickrate_m_'+Math.random().toString(16).slice(2,10),totalTicks:tr};
}
// verdict simulé des autres examinateurs (ils ont raison ~80 % du temps)
function vgDecide(c){
  const n=rnd(6,10);let g=0;
  for(let i=0;i<n;i++){const right=Math.random()<.8;g+=(c.truth!=='clean')===right?1:0}
  const share=g/n;return {final:share>=.8?'guilty':share<=.35?'clean':'insufficient',n,share};
}
function vgVote(v){
  const c=VG.cur;if(!c||c.voted)return;
  if((Date.now()-c.openedAt)/1000<VG_WATCH)return;
  c.voted=v;const d=vgDecide(c);c.final=d.final;c.nv=d.n;
  const a=VG.revAcc;let b=a;
  if(v!=='unsure'&&d.final!=='insufficient'){const ok=(d.final==='guilty')===v.startsWith('cheat');b=+vgClamp(a+(ok?.04:-.08),.1,1).toFixed(2);c.ok=ok;
    if(ok&&!(typeof srvOn==='function'&&srvOn())){const today=new Date().toDateString();VG.paid=(VG.paid||[]).filter(x=>x===today);if(VG.paid.length<5){VG.paid.push(today);SHOP.coins+=VG_REWARD;saveShop();renderWallet();c.paid=true}}}
  VG.revAcc=b;c.accA=a;c.accB=b;
  VG.reviews.unshift({id:c.id,map:c.map,at:Date.now(),my:v,final:d.final,ok:c.ok});VG.reviews=VG.reviews.slice(0,30);
  vgSave();renderVigie();
}
// les reports « triche » en attente se résolvent (en ligne : quand la revue rend son verdict)
function vgResolve(){
  let ch=false;const now=Date.now();
  VG.sent.forEach(s=>{
    if(s.outcome||s.reason!=='cheat'||now-s.at<45e3)return;
    const p=REG.get(s.name),bad=p&&trust(p)<4;
    s.outcome=Math.random()<(bad?.75:.3)?'confirmed':'rejected';
    VG.repAcc=+vgClamp(VG.repAcc+(s.outcome==='confirmed'?.08:-.06),.1,1).toFixed(2);ch=true;
    notify('report','vg_resolved',{n:s.name,x:t(s.outcome==='confirmed'?'vg_conf_s':'vg_rej_s')},'vigie');
  });
  if(ch){vgSave();if(!$('#vigie').hidden)renderVigie()}
}
setInterval(vgResolve,15e3);

// branche le formulaire de report existant : on note le report + son poids
(()=>{const btn=$('#repSend'),orig=btn.onclick;btn.onclick=function(e){
  const p=repTarget,r=repReason,before=p&&REPLOG.by[p.name];
  const res=orig.call(this,e);
  if(p&&r&&REPLOG.by[p.name]&&REPLOG.by[p.name]!==before){
    const w=vgWeight();VG.sent.unshift({name:p.name,reason:r,at:Date.now(),w,outcome:r==='cheat'?null:'na'});VG.sent=VG.sent.slice(0,50);vgSave();
    setTimeout(()=>toast(t('vg_rep_weight',{w:w.toFixed(2)})),1600);
    if(AUTH.mode==='server'&&p.steam64)api('/api/reports',{target:p.steam64,reason:r,note:$('#repNote').value||''});
  }
  return res}})();

let vgTick=null;
function vgFeatRow(f,s){
  const z=s.z,pct=vgClamp(z/5,0,1)*100,cls=z>=3?'hi':z>=1.5?'mid':'ok';
  return `<div class="vg-f"><span class="vg-fl">${t('f_'+f)}</span><b>${VG_FEAT[f].fmt(s.v)}</b><small>${t('vg_avg')} ${VG_FEAT[f].fmt(s.avg)}</small><span class="vg-bar ${cls}"><i style="width:${Math.max(3,pct)}%"></i></span><em class="${cls}">${z>0?'+':''}${z.toFixed(1)}σ</em></div>`;
}
function vgCaseHTML(c){
  const left=Math.max(0,Math.ceil(VG_WATCH-(Date.now()-c.openedAt)/1000));
  const cmd=`playdemo ${c.demo}`;
  const mom=c.moments.map((m,i)=>`<div class="vg-mo"><span class="vg-mt t-${m.type}">${t('m_'+m.type)}</span><span>${t('vg_round',{n:m.r})}${m.d?' · '+escA(m.d):''}</span><button class="btn sm ghost" data-vgcopy="demo_gototick ${m.tick}">${t('vg_go')}</button></div>`).join('');
  const marks=c.moments.map(m=>`<i class="t-${m.type}" style="left:${(m.tick/c.totalTicks*100).toFixed(2)}%" title="${t('vg_round',{n:m.r})} · ${t('m_'+m.type)}"></i>`).join('');
  const rounds=Array.from({length:c.rounds},(_,i)=>`<span style="left:${(i/c.rounds*100).toFixed(2)}%">${(i+1)%5===0?i+1:''}</span>`).join('');
  const verdicts=['cheat_aim','cheat_wall','cheat_other','clean','unsure'];
  let foot;
  if(c.voted){
    const fx=c.final==='guilty'?t('vg_guilty'):c.final==='clean'?t('vg_cleanv'):t('vg_insuf');
    foot=`<div class="vg-done"><b>${t('vg_thanks')}</b><div>${t('vg_final',{x:`<span class="vg-v v-${c.final}">${fx}</span>`,n:c.nv})}</div>
      <div class="m-hint">${c.voted==='unsure'||c.final==='insufficient'?t('vg_unsure_t'):t(c.ok?'vg_agree':'vg_disagree',{a:Math.round(c.accA*100)+' %',b:Math.round(c.accB*100)+' %'})}${c.paid?` · +${VG_REWARD} ${ICON.coin||''}`:''}</div>
      <button class="btn primary" data-vgnext>${t('vg_next')}</button></div>`;
  }else foot=`<div class="vg-q"><b>${t('vg_q')}</b>${left?`<span class="vg-wait" id="vgWait">${t('vg_wait',{n:left})}</span>`:''}</div>
    <div class="vg-vote">${verdicts.map(v=>`<button class="btn ${v.startsWith('cheat')?'vg-bad':v==='clean'?'vg-good':'ghost'}" data-vgvote="${v}" ${left?'disabled':''}>${t('v_'+v)}</button>`).join('')}</div>`;
  return `<div class="st-card vg-case">
    <div class="vg-ch"><div class="vg-map" style="background-image:url(maps/${c.slug}.jpg?v=2.50)"></div><div><h3>${t('vg_case',{n:c.id})}</h3><small>${escA(c.map)} · ${c.score[0]}–${c.score[1]} · ${c.kills} kills / ${c.rounds} rounds</small></div></div>
    <p class="m-hint" style="margin:10px 0 14px">${t('vg_anon')}</p>
    <div class="vg-tl"><div class="vg-tlr">${rounds}</div><div class="vg-tlm">${marks}</div></div>
    <div class="vg-cols">
      <div><h4>${t('vg_demo')}</h4>
        <div class="vg-cmd"><code>${cmd}</code><button class="btn sm" data-vgcopy="${cmd}">${t('vg_copy')}</button></div>
        <div class="m-hint">${t('vg_demo_how')}</div>
        <button class="btn sm" disabled style="margin-top:8px">${t('vg_demo_dl')}</button><div class="m-hint">${t('vg_demo_off')}</div>
        <h4 style="margin-top:16px">${t('vg_moments')}</h4><div class="vg-mos">${mom}</div></div>
      <div><h4>${t('vg_stats')}</h4><div class="vg-fs">${Object.keys(VG_FEAT).filter(f=>c.stats[f]).map(f=>vgFeatRow(f,c.stats[f])).join('')}</div></div>
    </div>
    ${foot}
  </div>`;
}
function renderVigie(){
  const el=$('#vigie');if(!el)return;
  vgResolve();
  const tr=tierOf(ME),pool=vgPool(),sent=VG.sent,cnt=k=>sent.filter(s=>s.outcome===k).length,pend=sent.filter(s=>s.reason==='cheat'&&!s.outcome).length;
  const agreed=VG.reviews.filter(r=>r.ok).length,el2=vgElig();
  const icon=(p)=>`<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512">${p}</svg>`;
  const steps=[['vg_s1','vg_s1t','<path d="M80 480a16 16 0 01-16-16V68.13a24 24 0 0111.9-20.72C88 40.38 112.38 32 160 32c37.21 0 78.83 14.71 115.55 27.68C305.12 70.13 333.05 80 352 80a183.84 183.84 0 0071-14.5 18 18 0 0125 16.58v219.36a20 20 0 01-12 18.31c-8.71 3.81-40.51 16.25-84 16.25-24.14 0-54.38-7.14-86.39-14.71C229.63 312.79 192.43 304 160 304c-36.87 0-55.74 5.58-64 9.11V464a16 16 0 01-16 16z"/>'],['vg_s2','vg_s2t','<path d="M456 128a40 40 0 00-37.23 54.6l-84.17 84.17a39.86 39.86 0 00-29.2 0l-60.17-60.17a40 40 0 10-74.46 0L70.6 306.77a40 40 0 1022.63 22.63L193.4 229.23a39.86 39.86 0 0029.2 0l60.17 60.17a40 40 0 1074.46 0l84.17-84.17A40 40 0 10456 128z"/>'],['vg_s3','vg_s3t','<path d="M336 256c-20.56 0-40.44-9.18-56-25.84-15.13-16.25-24.37-37.92-26-61-1.74-24.62 5.77-47.26 21.14-63.76S312 80 336 80c23.83 0 45.38 9.06 60.7 25.52 15.47 16.62 23 39.22 21.26 63.63-1.67 23.11-10.9 44.77-26 61C376.44 246.82 356.57 256 336 256zm66-88zM467.83 432H204.18a27.71 27.71 0 01-22-10.67 30.22 30.22 0 01-5.26-25.79c8.42-33.81 29.28-61.85 60.32-81.08C264.79 297.4 299.86 288 336 288c36.85 0 71 9 98.71 26.05 31.11 19.13 52 47.33 60.38 81.55a30.27 30.27 0 01-5.32 25.78A27.68 27.68 0 01467.83 432zM147 260c-35.19 0-66.13-32.72-69-72.93-1.42-20.6 5-39.65 18-53.62 12.86-13.83 31-21.45 51-21.45s38 7.66 50.93 21.57c13.1 14.08 19.5 33.09 18 53.52-2.87 40.2-33.8 72.91-68.93 72.91zM212.66 291.45c-17.59-8.6-40.42-12.9-65.65-12.9-29.46 0-58.07 7.68-80.57 21.62-25.51 15.83-42.67 38.88-49.6 66.71a27.39 27.39 0 004.79 23.36A25.32 25.32 0 0041.72 400h111a8 8 0 007.87-6.57c.11-.63.25-1.26.41-1.88 8.48-34.06 28.35-62.84 57.71-83.82a8 8 0 00-.63-13.39c-1.57-.92-3.37-1.89-5.42-2.89z"/>']];
  const hist=VG.reviews.slice(0,6).map(r=>`<div class="vg-h"><span>#${r.id} · ${escA(r.map)}</span><span>${t('v_'+r.my)}</span><span class="vg-v v-${r.final}">${r.final==='guilty'?t('vg_guilty'):r.final==='clean'?t('vg_cleanv'):t('vg_insuf')}</span><b class="${r.ok===true?'ok':r.ok===false?'ko':''}">${r.ok===true?'✓':r.ok===false?'✗':'–'}</b></div>`).join('');
  el.innerHTML=`<div class="cp-head"><h1 class="h1">${t('vg_title')}</h1><p class="vg-tag">${t('vg_tag')}</p></div>
  <div class="vg-steps">${steps.map(([h,p,i],n)=>`<div class="vg-step"><span class="vg-si">${icon(i)}</span><div><b>${n+1}. ${t(h)}</b><p>${t(p)}</p></div></div>`).join('')}</div>
  <div class="vg-grid">
    <div class="vg-main">
      ${VG.cur?vgCaseHTML(VG.cur):`<div class="st-card vg-take"><h3>${t('vg_take')}</h3>${el2?`<p class="m-hint">${t('vg_rev_reward',{n:VG_REWARD})}</p><button class="btn primary" data-vgtake>${t('vg_take')}</button>`:`<p class="m-hint">${t('vg_elig_no')}</p>`}</div>`}
      <div class="st-card"><h3>${t('vg_hist')}</h3>${hist||`<p class="m-hint">${t('vg_none')}</p>`}</div>
    </div>
    <aside class="vg-side">
      <div class="st-card"><h3>${t('vg_status')}</h3>
        <div class="st-row"><span><b>${t('trust')}</b></span><span class="tf" style="--c:${tr.c}">${ICON.shield}${trust(ME).toFixed(1)}/10 · ${tierName(tr)}</span></div>
        <div class="st-row"><span><b>${t('vg_pool')}</b><small>${t('vg_pool_t')}</small></span><span class="vg-pool p-${pool}">${t('vg_pool_'+pool)}</span></div></div>
      <div class="st-card"><h3>${t('vg_rep')}</h3>
        <div class="vg-kpi"><div><b>${Math.round(VG.repAcc*100)} %</b><small>${t('vg_rep_acc')}</small></div><div><b>×${vgWeight().toFixed(2)}</b><small>${t('vg_rep_w')}</small></div></div>
        <div class="vg-cnt"><span><b>${cnt('confirmed')}</b>${t('vg_rep_conf')}</span><span><b>${cnt('rejected')}</b>${t('vg_rep_rej')}</span><span><b>${pend}</b>${t('vg_rep_pend')}</span><span><b>${cnt('na')}</b>${t('vg_rep_other')}</span></div>
        <p class="m-hint">${t('vg_rep_t')}</p></div>
      <div class="st-card"><h3>${t('vg_rev')}</h3>
        <div class="vg-kpi"><div><b>${Math.round(VG.revAcc*100)} %</b><small>${t('vg_rev_acc')}</small></div><div><b>${VG.reviews.length}</b><small>${t('vg_rev_n')}</small></div><div><b>${agreed}</b><small>${t('vg_rev_ok')}</small></div></div></div>
      <div class="st-card"><h3>${t('vg_what')}</h3><ul class="vg-ul"><li>${t('vg_w1')}</li><li>${t('vg_w2')}</li><li>${t('vg_w3')}</li><li>${t('vg_w4')}</li></ul></div>
    </aside>
  </div>`;
  clearInterval(vgTick);
  if(VG.cur&&!VG.cur.voted&&(Date.now()-VG.cur.openedAt)/1000<VG_WATCH)vgTick=setInterval(()=>{
    const left=Math.max(0,Math.ceil(VG_WATCH-(Date.now()-VG.cur.openedAt)/1000)),w=$('#vgWait');
    if(!left||!w){clearInterval(vgTick);return renderVigie()}
    w.textContent=t('vg_wait',{n:left})},1000);
}
$('#vigie').addEventListener('click',async e=>{
  if(e.target.closest('[data-vgtake]')||e.target.closest('[data-vgnext]')){VG.cur=Object.assign(vgMakeCase(),{openedAt:Date.now()});vgSave();renderVigie();$('#vigie').scrollIntoView({block:'start'});return}
  const v=e.target.closest('[data-vgvote]');if(v&&!v.disabled)return vgVote(v.dataset.vgvote);
  const cp=e.target.closest('[data-vgcopy]');if(cp){try{await navigator.clipboard.writeText(cp.dataset.vgcopy)}catch(_){}toast(t('vg_copied')+' : '+cp.dataset.vgcopy)}
});
(()=>{const sv=setView;setView=function(v,k){const r=sv.call(this,v,k);if(v==='vigie')renderVigie();else clearInterval(vgTick);return r}})();
applyStatic();

/* =====================================================
   v5 : curseurs stylés, textes page Jouer/profil, présentation Vigie
   ===================================================== */
// curseurs : remplissage jusqu'au pouce (--p), mis à jour à chaque rendu
function paintRange(r){const mn=+r.min||0,mx=+r.max||100,v=+r.value;r.style.setProperty('--p',((v-mn)/((mx-mn)||1)*100)+'%')}
document.addEventListener('input',e=>{if(e.target.matches&&e.target.matches('input[type=range]'))paintRange(e.target)},true);
new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes){if(n.nodeType!==1)continue;if(n.matches('input[type=range]'))paintRange(n);n.querySelectorAll&&n.querySelectorAll('input[type=range]').forEach(paintRange)}}).observe(document.body,{childList:true,subtree:true});
document.querySelectorAll('input[type=range]').forEach(paintRange);

Object.assign(I18N.fr,{rot_now:'Rotation compétitive en cours',rot_casual:'Non classé',rot_casual_t:'Toutes les maps sont jouables : Active Duty, Réserve et Fun.',rot_comp_t:'{n} maps jouables en classé. Les autres maps restent disponibles en Non classé.',rot_next:'Prochaine rotation',rot_sim:'Simuler {x}',rot_switched:'Rotation : {x}',map_active_g:'Active Duty · rotation en cours',maps_more:'Voir les autres maps ({n}, hors rotation)',maps_less:'Masquer les autres maps',
  pf_form:'Forme',pf_last10:'10 derniers',pf_wl:'victoires – défaites',pf_delta:'ELO gagné',pf_best:'Meilleur match',pf_strong:'Map forte',
  vg_t_about:'Présentation',vg_t_space:'Mon espace',
  vp_h:'Le fair-play, sans rien installer sur ton PC',vp_p:'Vigie surveille le jeu, pas ton ordinateur. Le serveur de match mesure comment chacun joue, compare au reste des joueurs du même niveau, croise avec les reports, et les cas douteux sont jugés par des joueurs de confiance qui regardent la demo.',
  vp_go_review:'Examiner un dossier',vp_go_status:'Voir mon statut',
  vp_n1:'logiciel installé chez toi',vp_n2:'matchs pris en compte avant de juger quelqu\'un',vp_n3:'avis humains minimum avant un ban',
  vp_flow_t:'Comment ça marche',
  vp_f1:'Tu joues ton match',vp_f1t:'Sur nos serveurs CS:GO 128 tick, comme d\'habitude. Le serveur enregistre la demo.',
  vp_f2:'Le serveur mesure',vp_f2t:'Réaction, flicks, viseur sur des ennemis cachés, kills à travers les murs… pour chaque joueur, à chaque round.',
  vp_f3:'On compare à ton niveau',vp_f3t:'Un level 10 n\'est pas jugé comme un level 3. Seuls les écarts nets et répétés sur plusieurs matchs comptent.',
  vp_f4:'Les reports s\'ajoutent',vp_f4t:'Pondérés par la fiabilité de chaque joueur. Seuls, ils ne bannissent jamais : ils font remonter un dossier plus vite.',
  vp_f5:'La communauté tranche',vp_f5t:'Des joueurs fiables regardent la demo anonymisée et votent. 80 % d\'avis « triche » pondérés = coupable.',
  vp_sig_t:'Ce que la Vigie regarde',
  vp_s1:'Viseur sur un ennemi caché',vp_s1t:'Le viseur reste collé à un adversaire qu\'on ne peut pas voir, derrière un mur.',vp_s1c:'Wallhack',
  vp_s2:'Temps de réaction',vp_s2t:'Délai entre l\'apparition d\'un ennemi et le premier dégât. Trop court, trop souvent : suspect.',vp_s2c:'Aimbot / trigger',
  vp_s3:'Flicks',vp_s3t:'Gros mouvement de viseur en quelques millisecondes suivi d\'un headshot, encore et encore.',vp_s3c:'Aimbot',
  vp_s4:'Pré-visée',vp_s4t:'Le viseur est déjà sur la tête au moment exact où l\'ennemi apparaît, même hors des angles classiques.',vp_s4c:'Wallhack',
  vp_s5:'À travers fumée et murs',vp_s5t:'Part des kills faits à travers une fumée ou un mur, comparée à ton niveau.',vp_s5c:'Wallhack',
  vp_s6:'HS et précision',vp_s6t:'Utiles seulement en complément : un très bon joueur a aussi un gros HS %.',vp_s6c:'Contexte',
  vp_rep_t:'Le poids des reports',vp_rep_p:'Chaque report a un poids entre ×0,2 et ×1,6. Il monte quand tes reports sont confirmés par la revue et baisse quand ils sont rejetés.',
  vp_ex1:'Joueur dont les reports sont souvent confirmés',vp_ex2:'Nouveau joueur',vp_ex3:'Joueur qui reporte après chaque défaite',
  vp_san_t:'Ce qui peut arriver',
  vp_l1:'Auto',vp_l1t:'File « faible confiance » : un joueur très suspect joue avec les autres suspects. Réversible, ce n\'est pas un ban.',
  vp_l2:'Revue',vp_l2t:'Dossier anonymisé envoyé à 6 examinateurs minimum.',vp_l3:'1re fois',vp_l3t:'Ban de 30 jours si le verdict est « coupable ».',vp_l4:'Récidive',vp_l4t:'Ban définitif.',
  vp_faq_t:'Questions fréquentes',
  vp_q1:'Est-ce que je dois installer quelque chose ?',vp_a1:'Non. Rien ne tourne sur ton PC. Tout est mesuré par le serveur de jeu à partir de ce qui se passe dans la partie.',
  vp_q2:'Je suis juste très bon, je risque un ban ?',vp_a2:'Non. On te compare aux joueurs de ton niveau, sur plusieurs matchs, et un ban demande toujours un verdict humain. Un bon joueur a de bonnes stats partout ; un tricheur a des signaux précis qui ne collent pas (viseur sur des ennemis cachés, réactions impossibles).',
  vp_q3:'Quelles données sont utilisées ?',vp_a3:'Uniquement ce qui se passe en jeu sur nos serveurs : positions, angles de visée, tirs, dégâts, et la demo du match. Aucun accès à tes fichiers ni à ton PC.',
  vp_q4:'Comment devenir examinateur ?',vp_a4:'Niveau 6 minimum, 50 matchs, trust 7/10 et aucune sanction en cours. Ta précision monte quand tu es d\'accord avec le verdict final, et tu gagnes des pièces.',
  vp_q5:'Pourquoi je ne vois pas mon score de suspicion ?',vp_a5:'Pour ne pas aider les tricheurs à rester juste sous le seuil. Tu vois ton trust factor et ta file.',
  vp_q6:'Et si je suis banni à tort ?',vp_a6:'Tu peux faire appel : le dossier repart en revue chez d\'autres examinateurs, qui n\'ont pas vu le premier verdict.'});
Object.assign(I18N.en,{rot_now:'Current competitive rotation',rot_casual:'Unranked',rot_casual_t:'Every map is playable: Active Duty, Reserve and Fun.',rot_comp_t:'{n} maps playable in ranked. Other maps stay available in Unranked.',rot_next:'Next rotation',rot_sim:'Simulate {x}',rot_switched:'Rotation: {x}',map_active_g:'Active Duty · current rotation',maps_more:'Show other maps ({n}, out of rotation)',maps_less:'Hide other maps',
  pf_form:'Form',pf_last10:'Last 10',pf_wl:'wins – losses',pf_delta:'ELO gained',pf_best:'Best match',pf_strong:'Strongest map',
  vg_t_about:'Overview',vg_t_space:'My space',
  vp_h:'Fair play, with nothing installed on your PC',vp_p:'Watch looks at the game, not your computer. The match server measures how everyone plays, compares with players of the same level, adds reports, and doubtful cases are judged by trusted players who watch the demo.',
  vp_go_review:'Review a case',vp_go_status:'See my status',
  vp_n1:'software installed on your PC',vp_n2:'matches considered before judging anyone',vp_n3:'human opinions minimum before a ban',
  vp_flow_t:'How it works',
  vp_f1:'You play your match',vp_f1t:'On our 128-tick CS:GO servers, as usual. The server records the demo.',
  vp_f2:'The server measures',vp_f2t:'Reaction, flicks, crosshair on hidden enemies, kills through walls… for every player, every round.',
  vp_f3:'Compared to your level',vp_f3t:'A level 10 is not judged like a level 3. Only clear gaps repeated over several matches count.',
  vp_f4:'Reports add up',vp_f4t:'Weighted by each player\'s reliability. Alone they never ban: they bring a case up faster.',
  vp_f5:'The community decides',vp_f5t:'Trusted players watch the anonymized demo and vote. 80% weighted “cheat” opinions = guilty.',
  vp_sig_t:'What Watch looks at',
  vp_s1:'Crosshair on a hidden enemy',vp_s1t:'The crosshair sticks to an opponent nobody can see, behind a wall.',vp_s1c:'Wallhack',
  vp_s2:'Reaction time',vp_s2t:'Delay between an enemy appearing and the first damage. Too short, too often: suspicious.',vp_s2c:'Aimbot / trigger',
  vp_s3:'Flicks',vp_s3t:'A huge crosshair move in a few milliseconds followed by a headshot, again and again.',vp_s3c:'Aimbot',
  vp_s4:'Pre-aim',vp_s4t:'The crosshair is already on the head the exact moment the enemy appears, even off common angles.',vp_s4c:'Wallhack',
  vp_s5:'Through smoke and walls',vp_s5t:'Share of kills through smoke or walls, compared to your level.',vp_s5c:'Wallhack',
  vp_s6:'HS and accuracy',vp_s6t:'Only useful as context: a very good player also has a high HS%.',vp_s6c:'Context',
  vp_rep_t:'Report weight',vp_rep_p:'Each report weighs between ×0.2 and ×1.6. It rises when your reports are confirmed by review and drops when they are rejected.',
  vp_ex1:'Player whose reports are often confirmed',vp_ex2:'New player',vp_ex3:'Player who reports after every loss',
  vp_san_t:'What can happen',
  vp_l1:'Auto',vp_l1t:'“Low trust” queue: a very suspicious player plays with other suspects. Reversible, not a ban.',
  vp_l2:'Review',vp_l2t:'Anonymized case sent to at least 6 reviewers.',vp_l3:'1st time',vp_l3t:'30-day ban if the verdict is “guilty”.',vp_l4:'Repeat',vp_l4t:'Permanent ban.',
  vp_faq_t:'FAQ',
  vp_q1:'Do I need to install anything?',vp_a1:'No. Nothing runs on your PC. Everything is measured by the game server from what happens in the match.',
  vp_q2:'I\'m just very good, could I get banned?',vp_a2:'No. You are compared to players of your level, over several matches, and a ban always needs a human verdict. A good player has good stats everywhere; a cheater has specific signals that don\'t fit (crosshair on hidden enemies, impossible reactions).',
  vp_q3:'What data is used?',vp_a3:'Only what happens in game on our servers: positions, aim angles, shots, damage and the match demo. No access to your files or PC.',
  vp_q4:'How do I become a reviewer?',vp_a4:'Level 6+, 50 matches, trust 7/10 and no active penalty. Your accuracy rises when you agree with the final verdict, and you earn coins.',
  vp_q5:'Why can\'t I see my suspicion score?',vp_a5:'So cheaters can\'t stay just below the threshold. You see your trust factor and your queue.',
  vp_q6:'What if I\'m banned by mistake?',vp_a6:'You can appeal: the case goes back to review with other reviewers who haven\'t seen the first verdict.'});
Object.assign(I18N.ru,{rot_now:'Текущий соревновательный пул',rot_casual:'Без рейтинга',rot_casual_t:'Доступны все карты: Active Duty, резерв и фан.',rot_comp_t:'{n} карт в рейтинге. Остальные доступны без рейтинга.',rot_next:'Следующая ротация',rot_sim:'Симуляция {x}',rot_switched:'Ротация: {x}',map_active_g:'Active Duty · текущая ротация',maps_more:'Другие карты ({n}, вне ротации)',maps_less:'Скрыть другие карты',
  pf_form:'Форма',pf_last10:'Последние 10',pf_wl:'победы – поражения',pf_delta:'ELO за период',pf_best:'Лучший матч',pf_strong:'Сильная карта',
  vg_t_about:'Как это работает',vg_t_space:'Мой раздел',
  vp_h:'Фейр-плей без установки чего-либо на ПК',vp_p:'Дозор следит за игрой, а не за твоим компьютером. Сервер матча измеряет игру каждого, сравнивает с игроками того же уровня, учитывает жалобы, а спорные случаи решают надёжные игроки по демке.',
  vp_go_review:'Проверить дело',vp_go_status:'Мой статус',
  vp_n1:'программ на твоём ПК',vp_n2:'матчей учитывается до решения',vp_n3:'человеческих мнений минимум до бана',
  vp_flow_t:'Как это работает',
  vp_f1:'Ты играешь матч',vp_f1t:'На наших серверах CS:GO 128 тик, как обычно. Сервер пишет демку.',
  vp_f2:'Сервер измеряет',vp_f2t:'Реакцию, флики, прицел на скрытых врагах, убийства сквозь стены - у каждого игрока, каждый раунд.',
  vp_f3:'Сравнение с уровнем',vp_f3t:'Level 10 не судят как level 3. Считаются только явные и повторяющиеся отклонения.',
  vp_f4:'Жалобы добавляются',vp_f4t:'С весом по надёжности игрока. Сами по себе не банят, а ускоряют проверку.',
  vp_f5:'Решает сообщество',vp_f5t:'Надёжные игроки смотрят анонимную демку и голосуют. 80 % взвешенных «чит» = виновен.',
  vp_sig_t:'Что смотрит Дозор',
  vp_s1:'Прицел на скрытом враге',vp_s1t:'Прицел держится на противнике, которого не видно за стеной.',vp_s1c:'Волхак',
  vp_s2:'Время реакции',vp_s2t:'Время от появления врага до первого урона. Слишком быстро и слишком часто - подозрительно.',vp_s2c:'Аимбот / триггер',
  vp_s3:'Флики',vp_s3t:'Резкий поворот прицела за миллисекунды и хедшот, снова и снова.',vp_s3c:'Аимбот',
  vp_s4:'Преэйм',vp_s4t:'Прицел уже на голове в момент появления врага, даже вне стандартных углов.',vp_s4c:'Волхак',
  vp_s5:'Сквозь дым и стены',vp_s5t:'Доля убийств сквозь дым или стену в сравнении с уровнем.',vp_s5c:'Волхак',
  vp_s6:'HS и точность',vp_s6t:'Только как контекст: у сильного игрока тоже высокий HS %.',vp_s6c:'Контекст',
  vp_rep_t:'Вес жалоб',vp_rep_p:'Вес жалобы от ×0,2 до ×1,6. Растёт, когда жалобы подтверждаются, и падает, когда отклоняются.',
  vp_ex1:'Игрок, чьи жалобы часто подтверждаются',vp_ex2:'Новый игрок',vp_ex3:'Игрок, жалующийся после каждого поражения',
  vp_san_t:'Что может произойти',
  vp_l1:'Авто',vp_l1t:'Очередь «низкое доверие»: очень подозрительный игрок играет с другими подозреваемыми. Обратимо, это не бан.',
  vp_l2:'Проверка',vp_l2t:'Анонимное дело уходит минимум 6 проверяющим.',vp_l3:'1-й раз',vp_l3t:'Бан на 30 дней при вердикте «виновен».',vp_l4:'Повтор',vp_l4t:'Перманентный бан.',
  vp_faq_t:'Частые вопросы',
  vp_q1:'Нужно что-то устанавливать?',vp_a1:'Нет. На твоём ПК ничего не запускается. Всё измеряет игровой сервер.',
  vp_q2:'Я просто сильный, меня забанят?',vp_a2:'Нет. Сравнение идёт с игроками твоего уровня по нескольким матчам, а для бана всегда нужен вердикт людей.',
  vp_q3:'Какие данные используются?',vp_a3:'Только происходящее в игре на наших серверах: позиции, углы, выстрелы, урон и демка. Без доступа к файлам и ПК.',
  vp_q4:'Как стать проверяющим?',vp_a4:'Уровень 6+, 50 матчей, траст 7/10 и нет активных наказаний. Точность растёт, когда ты согласен с итоговым вердиктом.',
  vp_q5:'Почему я не вижу свой балл подозрения?',vp_a5:'Чтобы читеры не держались чуть ниже порога. Ты видишь траст и свою очередь.',
  vp_q6:'А если меня забанили ошибочно?',vp_a6:'Можно подать апелляцию: дело уйдёт на новую проверку к другим людям.'});

let vgTab='about';try{if(localStorage.getItem('tr_vgtab')==='space')vgTab='space'}catch(e){}
function vigieAboutHTML(){
  const sig=[['s1','#b57cff'],['s2','#ff9b1f'],['s3','#ff5d5d'],['s4','#b57cff'],['s5','#4fa3ff'],['s6','#8fa0b3']];
  const w=a=>(vgClamp(a/.6,.2,1.6)*(.3+.7*.95)).toFixed(2);
  return `<section class="vp-hero"><div><h2>${t('vp_h')}</h2><p>${t('vp_p')}</p>
      <div class="vp-cta"><button class="btn primary" data-vgtab="space" data-vgthen="take">${t('vp_go_review')}</button><button class="btn ghost" data-vgtab="space">${t('vp_go_status')}</button></div></div>
    <div class="vp-nums"><div><b>0</b><span>${t('vp_n1')}</span></div><div><b>10</b><span>${t('vp_n2')}</span></div><div><b>6</b><span>${t('vp_n3')}</span></div></div></section>
  <h3 class="vp-sec">${t('vp_flow_t')}</h3>
  <div class="vp-flow">${[1,2,3,4,5].map(i=>`<div><b>${t('vp_f'+i)}</b><p>${t('vp_f'+i+'t')}</p></div>`).join('')}</div>
  <h3 class="vp-sec">${t('vp_sig_t')}</h3>
  <div class="vp-sig">${sig.map(([k,c])=>`<div style="--k:${c}"><b><i></i>${t('vp_'+k)}</b><p>${t('vp_'+k+'t')}</p><small>${t('vp_'+k+'c')}</small></div>`).join('')}</div>
  <div class="vp-two" style="margin-top:22px">
    <div class="st-card"><h3>${t('vp_rep_t')}</h3><p class="m-hint" style="margin:0 0 12px">${t('vp_rep_p')}</p>
      <div class="vp-ex"><div><span>${t('vp_ex1')}</span><b>×${w(.9)}</b></div><div><span>${t('vp_ex2')}</span><b>×${w(.6)}</b></div><div><span>${t('vp_ex3')}</span><b>×${w(.2)}</b></div></div></div>
    <div class="st-card"><h3>${t('vp_san_t')}</h3><div class="vp-ladder">${[1,2,3,4].map(i=>`<div><em>${t('vp_l'+i)}</em><span>${t('vp_l'+i+'t')}</span></div>`).join('')}</div></div>
  </div>
  <h3 class="vp-sec">${t('vp_faq_t')}</h3>
  <div class="vp-faq">${[1,2,3,4,5,6].map(i=>`<details><summary>${t('vp_q'+i)}</summary><p>${t('vp_a'+i)}</p></details>`).join('')}</div>`;
}
(()=>{const orig=renderVigie;
  renderVigie=function(){
    const el=$('#vigie');if(!el)return;
    const tabs=`<nav class="vg-tabs">${[['about','vg_t_about'],['space','vg_t_space']].map(([k,l])=>`<button class="${vgTab===k?'on':''}" data-vgtab="${k}">${t(l)}</button>`).join('')}</nav>`;
    if(vgTab==='about'){clearInterval(vgTick);el.innerHTML=`<div class="cp-head"><h1 class="h1">${t('vg_title')}</h1><p class="vg-tag">${t('vg_tag')}</p></div>${tabs}${vigieAboutHTML()}`;return}
    orig();
    const head=el.querySelector('.cp-head');if(head)head.insertAdjacentHTML('afterend',tabs);
    const st=el.querySelector('.vg-steps');if(st)st.remove();   // déjà expliqué dans « Présentation »
  };
  $('#vigie').addEventListener('click',e=>{
    const b=e.target.closest('[data-vgtab]');if(!b)return;
    e.stopImmediatePropagation();vgTab=b.dataset.vgtab;try{localStorage.setItem('tr_vgtab',vgTab)}catch(_){}
    if(b.dataset.vgthen==='take'&&!VG.cur&&vgElig()){VG.cur=Object.assign(vgMakeCase(),{openedAt:Date.now()});vgSave()}
    renderVigie();window.scrollTo({top:0});
  },true);
})();

try{renderMaps()}catch(e){}

