const LEAGUE_DIVS=[
  {id:'open',name:'OPEN DIVISION',winsToUp:5},{id:'inter',name:'INTERMEDIATE',winsToUp:6},{id:'main',name:'MAIN DIVISION',winsToUp:7},
  {id:'adv',name:'ADVANCED DIVISION',winsToUp:8},{id:'pro',name:'PRO LEAGUE',winsToUp:null}
];
const TQ_COLORS=['#c4562a','#3b6fd6','#2e9d6c','#7a5cc4','#c9424d','#c08a1e','#2b8f80','#b0447a','#5d6775'];
const TQ={me:null,league:null,allTeams:null,div:null,color:TQ_COLORS[0],busy:false,loaded:false,loading:false,at:0};
const tqOn=()=>typeof fbLive==='function'&&fbLive()&&AUTH.mode==='firebase'&&!!FBA.uid;
const tqErr=c=>{const k='e_'+c;return (I18N[lang]&&I18N[lang][k])||I18N.fr[k]?t(k):t('e_server_error')};
try{
  const c=JSON.parse(localStorage.getItem('tr_tq_cache')||'null');
  if(c&&typeof c==='object'&&(c.me||c.league)){
    TQ.me=c.me||null;TQ.league=c.league||[];TQ.allTeams=c.allTeams||null;TQ.div=c.div||'open';TQ.loaded=true;TQ.at=c.at||0;
  }
}catch(e){}
function tqSaveCache(){
  try{localStorage.setItem('tr_tq_cache',JSON.stringify({me:TQ.me,league:TQ.league,allTeams:TQ.allTeams,div:TQ.div,at:TQ.at}))}catch(e){}
}
function tqLineupOf(t){
  const ids=Object.keys(t.members||{});
  const lu=(t.lineup||[]).filter(u=>ids.includes(u));
  for(const u of ids)if(lu.length<5&&!lu.includes(u))lu.push(u);
  return lu.slice(0,5);
}
function tqComputeStandings(div,all=TQ.allTeams){
  const d=LEAGUE_DIVS.some(x=>x.id===div)?div:'open';
  return Object.entries(all||{}).filter(([,x])=>x&&x.members&&(x.div||'open')===d)
    .map(([id,x])=>({id,name:x.name,tag:x.tag,color:x.color,n:Object.keys(x.members).length,w:x.season?.w||0,l:x.season?.l||0,rd:x.season?.rd||0}))
    .sort((a,b)=>b.w*3-a.w*3||b.rd-a.rd||a.l-b.l).slice(0,100);
}
async function tqCall(fn,data){
  if(TQ.busy)return null;TQ.busy=true;
  const r=await fbCall(fn,{...data,lang});TQ.busy=false;
  if(r&&r.error){toast(r.name?`${tqErr(r.error)} (${r.name})`:tqErr(r.error));return null}
  return r;
}

Object.assign(I18N.fr,{
  tq_create:'Créer mon équipe',tq_intro:'Une équipe compte jusqu\'à 7 joueurs, dont 5 titulaires qui jouent les matchs de ligue et de tournoi.',
  tq_name:'Nom de l\'équipe',tq_tag:'Tag (2 à 5 lettres ou chiffres)',tq_color:'Couleur',tq_invites:'Invitations reçues',tq_join:'Rejoindre',tq_decline:'Refuser',
  tq_members:'Joueurs',tq_starter:'Titulaire',tq_sub:'Remplaçant',tq_cap:'Capitaine',tq_make_cap:'Nommer capitaine',tq_kick:'Exclure',tq_pending:'Invitation envoyée',
  tq_cancel_inv:'Annuler',tq_invite:'Inviter un joueur',tq_invite_ph:'Pseudo du joueur',tq_leave:'Quitter l\'équipe',tq_disband:'Dissoudre l\'équipe',
  tq_starters:'{n}/5 titulaires',tq_need5:'Il faut 5 titulaires avec Steam lié pour jouer.',tq_busy:'Inscrite à un tournoi : composition verrouillée.',
  tq_div:'Division',tq_season:'Saison',tq_points:'{n} pts',tq_promo:'{w} / {n} victoires pour monter en {d}',tq_top:'Sommet de la ligue',
  tq_chal_in:'Défis reçus',tq_accept:'Accepter et jouer',tq_challenge:'Défier',tq_chal_sent:'Défi envoyé',tq_none_div:'Aucune équipe dans cette division pour l\'instant.',
  tq_th_team:'Équipe',tq_th_pl:'Joueurs',tq_th_wl:'V - D',tq_th_rd:'Rounds',tq_th_pts:'Points',tq_mine:'TA TEAM',tq_lead:'Crée ton équipe, défie les équipes de ta division et gagne pour monter jusqu\'en Pro League.',
  tq_how:'Comment ça marche',tq_how1:'Le capitaine défie une équipe de la même division.',tq_how2:'Si elle accepte, le match part sur nos serveurs avec les 5 titulaires de chaque équipe.',tq_how3:'Victoire = 3 points. Assez de victoires dans la saison : montée de division.',
  tq_match_go:'Match lancé : rejoins le serveur depuis l\'accueil.',tq_created:'Équipe {n} créée',tq_login:'Connecte-toi pour créer ou rejoindre une équipe.',
  e_team_already:'Tu fais déjà partie d\'une équipe.',e_team_bad_name:'Nom invalide (3 à 24 caractères).',e_team_bad_tag:'Tag invalide (2 à 5 lettres ou chiffres).',e_team_tag_taken:'Ce tag est déjà pris.',
  e_team_member_already:'Ce joueur est déjà dans ton équipe.',e_team_other:'Ce joueur est déjà dans une autre équipe.',e_team_full:'L\'équipe est complète (7 joueurs).',
  e_team_unknown:'Équipe introuvable.',e_team_not_invited:'Invitation expirée.',e_team_busy:'Impossible pendant un tournoi.',e_team_short:'5 titulaires nécessaires',e_team_other_div:'Cette équipe n\'est pas dans ta division.',
  e_team_overlap:'Un joueur est dans les deux équipes',e_room_steam:'Steam non lié',e_room_in_match:'Déjà en match',
  tz_new:'Organiser un tournoi',tz_none:'Aucun tournoi pour l\'instant. Organise le premier !',tz_by:'par {n}',tz_teams:'{n}/{s} équipes',tz_open:'Inscriptions ouvertes',tz_live:'En cours',tz_done:'Terminé',tz_cancelled:'Annulé',
  tz_prize:'Récompense',tz_min:'ELO min. {n}',tz_back:'← Tous les tournois',tz_reg:'Inscrire mon équipe',tz_unreg:'Désinscrire mon équipe',tz_need_cap:'Seul le capitaine d\'une équipe peut l\'inscrire.',
  tz_registered:'Équipes inscrites',tz_start:'Démarrer le tournoi',tz_cancel:'Annuler le tournoi',tz_bracket:'Tableau',tz_launch:'Lancer le match',tz_running:'Match en cours',tz_win_a:'{n} gagne (forfait)',
  tz_winner:'Vainqueur : {n}',tz_bye:'Exempt',tz_tbd:'À venir',tz_org:'Tu organises ce tournoi.',tz_mine:'Organisateur',tz_f_name:'Nom du tournoi',tz_f_size:'Équipes',tz_f_rounds:'Format',tz_f_date:'Date (facultatif)',
  tz_f_min:'ELO minimum (facultatif)',tz_f_prize:'Récompense (facultatif, texte)',tz_f_desc:'Règles / description',tz_create:'Créer le tournoi',tz_mr:'MR{n} ({r} rounds)',tz_rand:'Map au hasard',
  tz_round:'Tour {n}',tz_final:'Finale',tz_semi:'Demi-finales',tz_quarter:'Quarts de finale',tz_note:'Les récompenses sont gérées par l\'organisateur. TICKRATE ne verse aucun prix.',
  e_tn_need_steam:'Lie ton compte Steam pour organiser un tournoi.',e_tn_one_active:'Tu organises déjà un tournoi en cours.',e_tn_rate:'Attends une heure avant d\'en créer un autre.',e_tn_bad_name:'Nom invalide (4 à 40 caractères).',
  e_tn_unknown:'Tournoi introuvable.',e_tn_need_captain:'Il faut être capitaine d\'une équipe.',e_tn_closed:'Les inscriptions sont fermées.',e_tn_full:'Le tournoi est complet.',e_tn_low_elo:'ELO moyen des titulaires trop bas.',
  e_tn_need_teams:'Il faut au moins 2 équipes.',e_tn_bad_slot:'Ce match ne peut pas être lancé.',e_tn_running:'Un match est déjà en cours.'
});
Object.assign(I18N.en,{
  tq_create:'Create my team',tq_intro:'A team has up to 7 players, 5 of them starters who play league and tournament matches.',
  tq_name:'Team name',tq_tag:'Tag (2 to 5 letters or digits)',tq_color:'Colour',tq_invites:'Invitations',tq_join:'Join',tq_decline:'Decline',
  tq_members:'Players',tq_starter:'Starter',tq_sub:'Substitute',tq_cap:'Captain',tq_make_cap:'Make captain',tq_kick:'Kick',tq_pending:'Invitation sent',
  tq_cancel_inv:'Cancel',tq_invite:'Invite a player',tq_invite_ph:'Player name',tq_leave:'Leave team',tq_disband:'Disband team',
  tq_starters:'{n}/5 starters',tq_need5:'You need 5 starters with Steam linked to play.',tq_busy:'Registered in a tournament: roster locked.',
  tq_div:'Division',tq_season:'Season',tq_points:'{n} pts',tq_promo:'{w} / {n} wins to move up to {d}',tq_top:'Top of the league',
  tq_chal_in:'Challenges received',tq_accept:'Accept and play',tq_challenge:'Challenge',tq_chal_sent:'Challenge sent',tq_none_div:'No team in this division yet.',
  tq_th_team:'Team',tq_th_pl:'Players',tq_th_wl:'W - L',tq_th_rd:'Rounds',tq_th_pts:'Points',tq_mine:'YOUR TEAM',tq_lead:'Create your team, challenge teams in your division and win to climb up to the Pro League.',
  tq_how:'How it works',tq_how1:'The captain challenges a team in the same division.',tq_how2:'If they accept, the match starts on our servers with each team\'s 5 starters.',tq_how3:'Win = 3 points. Enough wins in the season: promotion.',
  tq_match_go:'Match started: join the server from the home page.',tq_created:'Team {n} created',tq_login:'Log in to create or join a team.',
  e_team_already:'You are already in a team.',e_team_bad_name:'Invalid name (3 to 24 characters).',e_team_bad_tag:'Invalid tag (2 to 5 letters or digits).',e_team_tag_taken:'This tag is taken.',
  e_team_member_already:'This player is already in your team.',e_team_other:'This player is already in another team.',e_team_full:'The team is full (7 players).',
  e_team_unknown:'Team not found.',e_team_not_invited:'Invitation expired.',e_team_busy:'Not possible during a tournament.',e_team_short:'5 starters needed',e_team_other_div:'This team is not in your division.',
  e_team_overlap:'A player is in both teams',e_room_steam:'Steam not linked',e_room_in_match:'Already in a match',
  tz_new:'Host a tournament',tz_none:'No tournament yet. Host the first one!',tz_by:'by {n}',tz_teams:'{n}/{s} teams',tz_open:'Registration open',tz_live:'Live',tz_done:'Finished',tz_cancelled:'Cancelled',
  tz_prize:'Prize',tz_min:'Min. ELO {n}',tz_back:'← All tournaments',tz_reg:'Register my team',tz_unreg:'Unregister my team',tz_need_cap:'Only a team captain can register it.',
  tz_registered:'Registered teams',tz_start:'Start the tournament',tz_cancel:'Cancel the tournament',tz_bracket:'Bracket',tz_launch:'Start the match',tz_running:'Match in progress',tz_win_a:'{n} wins (forfeit)',
  tz_winner:'Winner: {n}',tz_bye:'Bye',tz_tbd:'TBD',tz_org:'You are hosting this tournament.',tz_mine:'Host',tz_f_name:'Tournament name',tz_f_size:'Teams',tz_f_rounds:'Format',tz_f_date:'Date (optional)',
  tz_f_min:'Minimum ELO (optional)',tz_f_prize:'Prize (optional, text)',tz_f_desc:'Rules / description',tz_create:'Create tournament',tz_mr:'MR{n} ({r} rounds)',tz_rand:'Random map',
  tz_round:'Round {n}',tz_final:'Final',tz_semi:'Semi-finals',tz_quarter:'Quarter-finals',tz_note:'Prizes are handled by the host. TICKRATE pays no prize.',
  e_tn_need_steam:'Link your Steam account to host a tournament.',e_tn_one_active:'You are already hosting an active tournament.',e_tn_rate:'Wait an hour before creating another one.',e_tn_bad_name:'Invalid name (4 to 40 characters).',
  e_tn_unknown:'Tournament not found.',e_tn_need_captain:'You must be a team captain.',e_tn_closed:'Registration is closed.',e_tn_full:'The tournament is full.',e_tn_low_elo:'Starters\' average ELO too low.',
  e_tn_need_teams:'At least 2 teams are needed.',e_tn_bad_slot:'This match cannot be started.',e_tn_running:'A match is already running.'
});
Object.assign(I18N.ru,{
  tq_create:'Создать команду',tq_intro:'В команде до 7 игроков, 5 из них - основной состав для лиги и турниров.',
  tq_name:'Название команды',tq_tag:'Тег (2–5 букв или цифр)',tq_color:'Цвет',tq_invites:'Приглашения',tq_join:'Вступить',tq_decline:'Отклонить',
  tq_members:'Игроки',tq_starter:'Основной',tq_sub:'Запасной',tq_cap:'Капитан',tq_make_cap:'Сделать капитаном',tq_kick:'Исключить',tq_pending:'Приглашение отправлено',
  tq_cancel_inv:'Отменить',tq_invite:'Пригласить игрока',tq_invite_ph:'Ник игрока',tq_leave:'Покинуть команду',tq_disband:'Распустить команду',
  tq_starters:'Основных: {n}/5',tq_need5:'Нужно 5 основных игроков с привязанным Steam.',tq_busy:'Команда в турнире: состав закреплён.',
  tq_div:'Дивизион',tq_season:'Сезон',tq_points:'{n} оч.',tq_promo:'{w} / {n} побед до повышения в {d}',tq_top:'Вершина лиги',
  tq_chal_in:'Полученные вызовы',tq_accept:'Принять и играть',tq_challenge:'Вызвать',tq_chal_sent:'Вызов отправлен',tq_none_div:'В этом дивизионе пока нет команд.',
  tq_th_team:'Команда',tq_th_pl:'Игроки',tq_th_wl:'П - П',tq_th_rd:'Раунды',tq_th_pts:'Очки',tq_mine:'ТВОЯ КОМАНДА',tq_lead:'Создай команду, вызывай команды своего дивизиона и побеждай, чтобы подняться до Pro League.',
  tq_how:'Как это работает',tq_how1:'Капитан вызывает команду из того же дивизиона.',tq_how2:'Если вызов принят, матч начинается на наших серверах с 5 основными игроками каждой команды.',tq_how3:'Победа = 3 очка. Достаточно побед за сезон - повышение.',
  tq_match_go:'Матч начат: зайди на сервер с главной страницы.',tq_created:'Команда {n} создана',tq_login:'Войди, чтобы создать команду или вступить в неё.',
  e_team_already:'Ты уже в команде.',e_team_bad_name:'Неверное название (3–24 символа).',e_team_bad_tag:'Неверный тег (2–5 букв или цифр).',e_team_tag_taken:'Этот тег занят.',
  e_team_member_already:'Этот игрок уже в твоей команде.',e_team_other:'Этот игрок уже в другой команде.',e_team_full:'Команда заполнена (7 игроков).',
  e_team_unknown:'Команда не найдена.',e_team_not_invited:'Приглашение истекло.',e_team_busy:'Нельзя во время турнира.',e_team_short:'Нужно 5 основных',e_team_other_div:'Эта команда не в твоём дивизионе.',
  e_team_overlap:'Игрок в обеих командах',e_room_steam:'Steam не привязан',e_room_in_match:'Уже в матче',
  tz_new:'Организовать турнир',tz_none:'Турниров пока нет. Организуй первый!',tz_by:'от {n}',tz_teams:'{n}/{s} команд',tz_open:'Регистрация открыта',tz_live:'Идёт',tz_done:'Завершён',tz_cancelled:'Отменён',
  tz_prize:'Награда',tz_min:'Мин. ELO {n}',tz_back:'← Все турниры',tz_reg:'Записать команду',tz_unreg:'Отменить запись',tz_need_cap:'Записать команду может только капитан.',
  tz_registered:'Записанные команды',tz_start:'Начать турнир',tz_cancel:'Отменить турнир',tz_bracket:'Сетка',tz_launch:'Начать матч',tz_running:'Матч идёт',tz_win_a:'{n} побеждает (неявка)',
  tz_winner:'Победитель: {n}',tz_bye:'Пропуск',tz_tbd:'Скоро',tz_org:'Ты организатор этого турнира.',tz_mine:'Организатор',tz_f_name:'Название турнира',tz_f_size:'Команды',tz_f_rounds:'Формат',tz_f_date:'Дата (необязательно)',
  tz_f_min:'Минимальный ELO (необязательно)',tz_f_prize:'Награда (необязательно, текст)',tz_f_desc:'Правила / описание',tz_create:'Создать турнир',tz_mr:'MR{n} ({r} раундов)',tz_rand:'Случайная карта',
  tz_round:'Раунд {n}',tz_final:'Финал',tz_semi:'Полуфиналы',tz_quarter:'Четвертьфиналы',tz_note:'Награды выдаёт организатор. TICKRATE призы не выплачивает.',
  e_tn_need_steam:'Привяжи Steam, чтобы организовать турнир.',e_tn_one_active:'Ты уже организуешь активный турнир.',e_tn_rate:'Подожди час перед созданием нового.',e_tn_bad_name:'Неверное название (4–40 символов).',
  e_tn_unknown:'Турнир не найден.',e_tn_need_captain:'Нужно быть капитаном команды.',e_tn_closed:'Регистрация закрыта.',e_tn_full:'Турнир заполнен.',e_tn_low_elo:'Средний ELO основных слишком низкий.',
  e_tn_need_teams:'Нужно минимум 2 команды.',e_tn_bad_slot:'Этот матч нельзя начать.',e_tn_running:'Матч уже идёт.'
});
const divName=id=>(LEAGUE_DIVS.find(d=>d.id===id)||LEAGUE_DIVS[0]).name;

async function tqLoad(force=false){
  if(!tqOn()){TQ.me=null;TQ.league=[];TQ.loaded=true;return}
  if(TQ.loading)return;
  if(!force&&TQ.loaded&&Date.now()-TQ.at<45e3)return;
  TQ.loading=true;
  try{
    if(typeof fbReq==='function'){
      const uid=FBA.uid;
      const [tid,inv,allTeams,allChal,allTourneys]=await Promise.all([
        fbReq(`teamOf/${uid}`),
        fbReq(`teamInv/${uid}`),
        fbReq('teams'),
        fbReq('teamChal'),
        fbReq('tourneys')
      ]);
      const rawTeam=tid&&allTeams&&allTeams[tid]?{id:tid,...allTeams[tid]}:null;
      const out={ok:true,team:null,invites:Object.entries(inv||{}).map(([k,x])=>({tid:k,...x})),challenges:[],sent:[]};
      if(rawTeam){
        const myChal=(allChal&&allChal[tid])||{};
        const isBusy=Object.values(allTourneys||{}).some(x=>x&&(x.status==='open'||x.status==='live')&&(x.teams||{})[tid]);
        out.team={...rawTeam,me:uid,lineupFull:tqLineupOf(rawTeam),busy:isBusy};
        out.challenges=Object.entries(myChal).map(([k,x])=>({tid:k,...x}));
        out.sent=Object.entries(allChal||{}).filter(([,v])=>v&&v[tid]).map(([k])=>k);
      }
      TQ.me=out;
      TQ.allTeams=allTeams||{};
      const div=TQ.div||(out.team?.div)||'open';
      TQ.div=LEAGUE_DIVS.some(x=>x.id===div)?div:'open';
      TQ.league=tqComputeStandings(TQ.div,TQ.allTeams);
      TQ.loaded=true;TQ.at=Date.now();
      tqSaveCache();
      if(allTourneys&&typeof tzHydrateFromRaw==='function')tzHydrateFromRaw(allTourneys,out.team);
    }else{
      const me=await fbCall('team',{action:'get',div:TQ.div});
      if(me&&!me.error){
        TQ.me=me;
        if(Array.isArray(me.standings)){TQ.league=me.standings;TQ.div=me.div||TQ.div||'open'}
      }
      TQ.loaded=true;TQ.at=Date.now();
      tqSaveCache();
    }
  }finally{
    TQ.loading=false;
  }
}
function tqTeamHTML(){
  if(!tqOn())return `<div class="card m-hint">${t('tq_login')}</div>`;
  const D=TQ.me||{},T=D.team;
  const invs=(D.invites||[]).length?`<div class="card"><div class="h3">${t('tq_invites')}</div>${D.invites.map(i=>`<div class="tq-row"><b>[${escA(i.tag)}] ${escA(i.name)}</b>
    <span class="tq-act"><button class="btn primary sm" data-tq="join" data-tid="${escA(i.tid)}">${t('tq_join')}</button><button class="btn ghost sm" data-tq="decline" data-tid="${escA(i.tid)}">${t('tq_decline')}</button></span></div>`).join('')}</div>`:'';
  if(!T)return invs+`<form class="card tq-new" id="tqForm" novalidate><div class="h3">${t('tq_create')}</div><p class="m-hint" style="margin:0 0 12px">${t('tq_intro')}</p>
    <div class="af"><label>${t('tq_name')}</label><input id="tqName" maxlength="24" autocomplete="off"></div>
    <div class="af"><label>${t('tq_tag')}</label><input id="tqTag" maxlength="5" autocomplete="off" style="text-transform:uppercase"></div>
    <div class="af"><label>${t('tq_color')}</label><div class="swatches">${TQ_COLORS.map(c=>`<button type="button" class="${TQ.color===c?'on':''}" data-tqcol="${c}" style="background:${c}"></button>`).join('')}</div></div>
    <button class="btn primary" type="submit">${t('tq_create')}</button></form>`;
  const cap=T.captain===T.me,ms=Object.entries(T.members||{}).sort((a,b)=>(a[1].at||0)-(b[1].at||0)),lu=T.lineupFull||[];
  const dv=LEAGUE_DIVS.find(d=>d.id===(T.div||'open'))||LEAGUE_DIVS[0],nx=LEAGUE_DIVS[LEAGUE_DIVS.indexOf(dv)+1],se=T.season||{w:0,l:0,rd:0};
  const prog=dv.winsToUp?Math.min(100,Math.round(se.w/dv.winsToUp*100)):100;
  const row=([u,m])=>{const st=lu.includes(u);
    return `<div class="tq-pl"><span class="tq-dot ${st?'on':''}"></span><b>${escA(m.name)}</b>${u===T.captain?`<span class="pill">${t('tq_cap')}</span>`:''}
      <small>${st?t('tq_starter'):t('tq_sub')}</small><span class="tq-act">${cap&&!T.busy?`<button class="btn ghost sm" data-tq="star" data-uid="${escA(u)}">${st?t('tq_sub'):t('tq_starter')}</button>`:''}
      ${cap&&u!==T.me?`<button class="btn ghost sm" data-tq="captain" data-uid="${escA(u)}">${t('tq_make_cap')}</button>${T.busy?'':`<button class="btn ghost sm" data-tq="kick" data-uid="${escA(u)}">${t('tq_kick')}</button>`}`:''}</span></div>`};
  const inv=Object.entries(T.invited||{}).map(([u,n])=>`<div class="tq-pl pend"><span class="tq-dot"></span><b>${escA(n)}</b><small>${t('tq_pending')}</small>${cap?`<span class="tq-act"><button class="btn ghost sm" data-tq="kick" data-uid="${escA(u)}">${t('tq_cancel_inv')}</button></span>`:''}</div>`).join('');
  const chal=(D.challenges||[]).length?`<div class="card"><div class="h3">${t('tq_chal_in')}</div>${D.challenges.map(c=>`<div class="tq-row"><b>[${escA(c.tag)}] ${escA(c.name)}</b>
    ${cap?`<span class="tq-act"><button class="btn primary sm" data-tq="chal-yes" data-tid="${escA(c.tid)}">${t('tq_accept')}</button><button class="btn ghost sm" data-tq="chal-no" data-tid="${escA(c.tid)}">${t('tq_decline')}</button></span>`:''}</div>`).join('')}</div>`:'';
  const existingNames=new Set([...ms.map(([,m])=>(m.name||'').toLowerCase()),...Object.values(T.invited||{}).map(n=>String(n||'').toLowerCase())]);
  const availFriends=(typeof FRIENDS!=='undefined'?FRIENDS:[]).filter(f=>f&&f.name&&!existingNames.has(f.name.toLowerCase())).slice(0,6);
  const quickInvHTML=cap&&ms.length+Object.keys(T.invited||{}).length<7&&availFriends.length
    ?`<div class="tq-quick-friends"><small>${lang==='en'?'Quick invite friends:':lang==='ru'?'Быстрое приглашение:':'Inviter un ami en 1 clic :'}</small><div class="tq-qf-list">${availFriends.map(f=>`<button type="button" class="btn ghost sm" data-tqquickinv="${escA(f.name)}">+ ${escA(f.name)}</button>`).join('')}</div></div>`:'';
  return invs+chal+`<div class="card tm-card"><div class="tm-banner" style="background:linear-gradient(135deg,${safeCol(T.color)},#14161a 78%)">
      <div class="tm-tag" style="border-color:${safeCol(T.color)}">${escA(T.tag)}</div>
      <div class="tm-meta"><b>[${escA(T.tag)}] ${escA(T.name)}</b><small>${t('tq_div')} : ${dv.name} · ${t('tq_season')} : ${se.w}${t('w')} - ${se.l}${t('l')} · ${t('tq_points',{n:se.w*3})}</small></div></div>
    <div class="tm-body">
      <div class="lvlbar" style="margin:0 0 6px"><div class="row"><span>${nx?t('tq_promo',{w:se.w,n:dv.winsToUp,d:nx.name}):t('tq_top')}</span><span>${t('tq_starters',{n:lu.length})}</span></div><div class="bar"><i style="width:${prog}%"></i></div></div>
      ${lu.length<5?`<div class="m-hint">${t('tq_need5')}</div>`:''}${T.busy?`<div class="m-hint">${t('tq_busy')}</div>`:''}
      <div class="label"><span>${t('tq_members')} (${ms.length}/7)</span></div>${ms.map(row).join('')}${inv}
      ${cap&&ms.length+Object.keys(T.invited||{}).length<7?`<form class="tq-inv" id="tqInv" novalidate><input id="tqInvName" maxlength="25" placeholder="${t('tq_invite_ph')}" autocomplete="off"><button class="btn sm" type="submit">${t('tq_invite')}</button></form>${quickInvHTML}`:''}
      <div style="margin-top:12px"><button class="btn ghost sm" data-tq="${cap&&ms.length===1?'disband':'leave'}">${cap&&ms.length===1?t('tq_disband'):t('tq_leave')}</button>${cap&&ms.length>1?` <button class="btn ghost sm" data-tq="disband">${t('tq_disband')}</button>`:''}</div>
    </div></div>`;
}
let tqFilter='';
function tqLeagueHTML(){
  const T=TQ.me?.team,cap=T&&T.captain===T.me,div=TQ.div||'open',sent=new Set(TQ.me?.sent||[]),rows=TQ.league||[];
  const searchPh=lang==='en'?'Filter teams...':lang==='ru'?'Поиск команды...':'Filtrer une équipe...';
  return `<div><div class="lg-divs">${LEAGUE_DIVS.map(d=>`<div class="lg-div ${d.id===div?'on':''}" data-tqdiv="${d.id}"><div class="ld-t">${T&&T.div===d.id?t('tq_mine')+' · ':''}${t('lgd_t_'+d.id)}</div><div class="ld-n">${d.name}</div></div>`).join('')}</div>
    <div class="card" style="padding:0"><div style="padding:14px 18px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><b style="font-family:var(--cond);font-size:18px;letter-spacing:.04em;text-transform:uppercase">${divName(div)}</b>
      <div style="font-size:12px;color:var(--muted)">${t('lgd_f_'+div)}</div></div>${rows.length?`<input id="tqFilterIn" class="cp-filter-in" type="search" value="${escA(tqFilter)}" placeholder="${searchPh}" autocomplete="off">`:''}</div>
      ${rows.length?`<div class="tbl-wrap"><table class="tbl rk-table" style="min-width:520px"><thead><tr><th class="rk">#</th><th style="text-align:left">${t('tq_th_team')}</th><th>${t('tq_th_pl')}</th><th>${t('tq_th_wl')}</th><th>${t('tq_th_rd')}</th><th>${t('tq_th_pts')}</th><th></th></tr></thead><tbody id="tqDivTbody">
        ${rows.map((x,i)=>{const me=T&&x.id===T.id,qf=tqFilter.trim().toLowerCase(),hide=qf&&!(`${x.tag} ${x.name}`.toLowerCase().includes(qf));return `<tr class="${me?'me':''}" data-tqsearch="${escA((x.tag+' '+x.name).toLowerCase())}" ${hide?'hidden':''}><td class="rk">${i+1}</td><td><div class="pl"><span class="avatar" style="background:${safeCol(x.color)};width:28px;height:28px;min-width:28px;font-size:11px;font-weight:800">${escA(x.tag)}</span><b>${escA(x.name)}</b>${me?`<span class="pb plus">${t('tq_mine')}</span>`:''}</div></td>
          <td>${x.n}</td><td class="rt"><span class="pos">${x.w}${t('w')}</span> - <span class="neg">${x.l}${t('l')}</span></td><td class="rt">${x.rd>0?'+':''}${x.rd}</td><td class="rt"><b>${x.w*3}</b></td>
          <td>${cap&&!me&&T.div===div?(sent.has(x.id)?`<span class="pill">${t('tq_chal_sent')}</span>`:`<button class="btn sm" data-tq="challenge" data-tid="${escA(x.id)}">${t('tq_challenge')}</button>`):''}</td></tr>`}).join('')}
      </tbody></table></div>`:`<div class="card m-hint" style="margin:14px">${t('tq_none_div')}</div>`}</div>
    <div class="card"><div class="h3">${t('tq_how')}</div><ol class="tq-how"><li>${t('tq_how1')}</li><li>${t('tq_how2')}</li><li>${t('tq_how3')}</li></ol></div></div>`;
}
function renderLeagues(){
  const el=$('#leagues');if(!el)return;
  if(!TQ.loaded&&!TQ.me){
    el.innerHTML='<div class="inf-load"><span class="spin inl"></span></div>';
    tqLoad(true).then(()=>{if(!el.hidden)renderLeagues()});
    return;
  }
  el.innerHTML=`<div class="rk-head"><div><h1 class="h1">${t('cp_teamlg')}</h1><div class="rk-sub">${t('tq_lead')}</div></div></div>
    <div class="lg-grid"><div>${tqTeamHTML()}</div>${tqLeagueHTML()}</div>`;
  if(!TQ.loaded||Date.now()-TQ.at>45e3){
    const prevSig=JSON.stringify({t:TQ.me?.team?.id,m:Object.keys(TQ.me?.team?.members||{}).length,i:Object.keys(TQ.me?.team?.invited||{}).length,l:(TQ.league||[]).length,d:TQ.div});
    tqLoad(!TQ.loaded).then(()=>{
      const nextSig=JSON.stringify({t:TQ.me?.team?.id,m:Object.keys(TQ.me?.team?.members||{}).length,i:Object.keys(TQ.me?.team?.invited||{}).length,l:(TQ.league||[]).length,d:TQ.div});
      if(prevSig!==nextSig&&!el.hidden&&!(document.activeElement&&el.contains(document.activeElement)&&document.activeElement.tagName==='INPUT'))renderLeagues();
    });
  }
}
const tqAfter=r=>{if(r&&r.matchId){toast(t('tq_match_go'));if(typeof rmSyncMe==='function')rmSyncMe()}
  if(r&&r.ok&&'team' in r&&'invites' in r){
    TQ.me=r;
    if(Array.isArray(r.standings)){TQ.league=r.standings;TQ.div=r.div||TQ.div||(r.team?.div)||'open'}
    TQ.loaded=true;TQ.at=Date.now();tqSaveCache();
  }
  renderLeagues();
  tqLoad(true).then(()=>{if(!$('#leagues').hidden)renderLeagues()});
};
$('#leagues').addEventListener('click',async e=>{
  const c=e.target.closest('[data-tqcol]');if(c){TQ.color=c.dataset.tqcol;$$('#leagues .swatches button').forEach(b=>b.classList.toggle('on',b===c));return}
  const qf=e.target.closest('[data-tqquickinv]');if(qf){const n=qf.dataset.tqquickinv;if(!n)return;return tqAfter(await tqCall('team',{action:'invite',name:n}))}
  const dv=e.target.closest('[data-tqdiv]');if(dv){
    TQ.div=dv.dataset.tqdiv;
    if(TQ.allTeams){TQ.league=tqComputeStandings(TQ.div,TQ.allTeams);tqSaveCache();return renderLeagues()}
    TQ.loaded=false;return renderLeagues();
  }
  const b=e.target.closest('[data-tq]');if(!b)return;
  const a=b.dataset.tq,tid=b.dataset.tid,uid=b.dataset.uid,T=TQ.me?.team;
  if(a==='join')return tqAfter(await tqCall('team',{action:'join',tid}));
  if(a==='decline')return tqAfter(await tqCall('team',{action:'decline',tid}));
  if(a==='kick')return tqAfter(await tqCall('team',{action:'kick',uid}));
  if(a==='captain')return confirmBox(t('tq_make_cap'),escA(T.members[uid]?.name||''),t('tq_make_cap'),t('cancel'),async()=>tqAfter(await tqCall('team',{action:'captain',uid})));
  if(a==='star'){const lu=[...(T.lineupFull||[])],i=lu.indexOf(uid);if(i>=0)lu.splice(i,1);else{if(lu.length>=5)lu.pop();lu.push(uid)}
    return tqAfter(await tqCall('team',{action:'lineup',lineup:lu}))}
  if(a==='leave')return confirmBox(t('tq_leave'),escA(T.name),t('tq_leave'),t('cancel'),async()=>tqAfter(await tqCall('team',{action:'leave'})));
  if(a==='disband')return confirmBox(t('tq_disband'),escA(T.name),t('tq_disband'),t('cancel'),async()=>tqAfter(await tqCall('team',{action:'disband'})));
  if(a==='challenge')return tqAfter(await tqCall('team',{action:'challenge',tid}));
  if(a==='chal-yes')return tqAfter(await tqCall('team',{action:'chal',tid,accept:true}));
  if(a==='chal-no')return tqAfter(await tqCall('team',{action:'chal',tid,accept:false}));
});
$('#leagues').addEventListener('input',e=>{
  if(e.target.id==='tqFilterIn'){
    tqFilter=e.target.value;
    const q=tqFilter.trim().toLowerCase();
    $$('#tqDivTbody tr').forEach(tr=>{
      const s=tr.getAttribute('data-tqsearch')||'';
      tr.hidden=!!q&&!s.includes(q);
    });
  }
});
$('#leagues').addEventListener('submit',async e=>{
  e.preventDefault();
  if(e.target.id==='tqForm'){const r=await tqCall('team',{action:'create',name:$('#tqName').value.trim(),tag:$('#tqTag').value.trim().toUpperCase(),color:TQ.color});
    if(r){toast(t('tq_created',{n:r.team?.name||''}));beep(784,.1);beep(1047,.12,.1)}return tqAfter(r)}
  if(e.target.id==='tqInv'){const n=$('#tqInvName').value.trim();if(!n)return;return tqAfter(await tqCall('team',{action:'invite',name:n}))}
});

const TZ={list:null,cur:null,id:null,raw:null,loading:false,at:0};
try{
  const c=JSON.parse(localStorage.getItem('tr_tz_cache')||'null');
  if(c&&Array.isArray(c.list)){TZ.list=c.list;TZ.raw=c.raw||null;TZ.at=c.at||0}
}catch(e){}
function tzSaveCache(){
  try{localStorage.setItem('tr_tz_cache',JSON.stringify({list:TZ.list,raw:TZ.raw,at:TZ.at}))}catch(e){}
}
function tzHydrateFromRaw(all,team=TQ.me?.team||null){
  const now=Date.now(),uid=(typeof FBA!=='undefined'&&FBA.uid)||null;
  TZ.raw=all||{};
  TZ.list=Object.entries(TZ.raw).filter(([,x])=>x&&(x.status==='open'||x.status==='live'||now-(x.endedAt||x.at||0)<14*864e5))
    .map(([id,x])=>({id,name:x.name,orgName:x.orgName,size:x.size,n:Object.keys(x.teams||{}).length,status:x.status,date:x.date,prize:x.prize,minElo:x.minElo,mine:!!uid&&x.org===uid,at:x.at}))
    .sort((a,b)=>({live:0,open:1,done:2,cancelled:3}[a.status]-{live:0,open:1,done:2,cancelled:3}[b.status])||(b.at-a.at)).slice(0,60);
  if(TZ.id){
    const tn=TZ.raw[TZ.id];
    TZ.cur=tn?{ok:true,tourney:{id:TZ.id,...tn,org:undefined,mine:!!uid&&tn.org===uid},team:team?{...team,me:uid}:null}:null;
    if(!TZ.cur)TZ.id=null;
  }
  TZ.at=now;
  tzSaveCache();
}
const tzStatus=s=>`<span class="tg2 ${s==='live'?'live':s==='open'?'off':'done'}">${t('tz_'+s)}</span>`;
const tzDate=x=>x?new Date(x).toLocaleString(LOC[lang],{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';
async function tzLoad(force=false){
  if(!tqOn()){TZ.list=[];return}
  if(!force&&TZ.list&&(!TZ.id||TZ.cur)&&Date.now()-TZ.at<15e3)return;
  if(typeof fbReq==='function'){
    const uid=FBA.uid;
    const [all,tid]=await Promise.all([fbReq('tourneys'),TQ.me?.team?Promise.resolve(TQ.me.team.id):fbReq(`teamOf/${uid}`)]);
    let team=TQ.me?.team||null;
    if(!team&&tid){
      const rawT=(TQ.allTeams&&TQ.allTeams[tid])||(await fbReq(`teams/${tid}`));
      if(rawT)team={id:tid,...rawT,me:uid,lineupFull:tqLineupOf(rawT)};
    }
    if(all!==null||TZ.raw){
      tzHydrateFromRaw(all||TZ.raw||{},team);
      return;
    }
  }
  if(TZ.id){const r=await fbCall('tourney',{action:'get',id:TZ.id});TZ.cur=r&&!r.error?r:null;if(!TZ.cur)TZ.id=null}
  if(!TZ.id){const r=await fbCall('tourney',{action:'list'});TZ.list=r&&!r.error?r.list:[]}
  TZ.at=Date.now();tzSaveCache();
}
function tzListHTML(){
  const L=TZ.list||[];
  return `<div class="tn-tools"><span class="m-hint" style="margin:0">${t('tz_note')}</span>${tqOn()?`<button class="btn primary sm" data-tz="new">+ ${t('tz_new')}</button>`:''}</div>
    ${L.length?`<div class="tz-list">${L.map(x=>`<div class="card tz-card" data-tzid="${escA(x.id)}"><div class="tz-top">${tzStatus(x.status)}${x.mine?`<span class="pill">${t('tz_mine')}</span>`:''}</div>
      <b>${escA(x.name)}</b><small>${t('tz_by',{n:escA(x.orgName)})}${x.date?' · '+tzDate(x.date):''}</small>
      <div class="tz-meta"><span>${t('tz_teams',{n:x.n,s:x.size})}</span>${x.minElo?`<span>${t('tz_min',{n:x.minElo})}</span>`:''}${x.prize?`<span>${t('tz_prize')} : ${escA(x.prize)}</span>`:''}</div></div>`).join('')}</div>`
      :`<div class="card m-hint">${t('tz_none')}</div>`}`;
}
const tzRoundName=(R,r)=>r===R-1?t('tz_final'):r===R-2?t('tz_semi'):r===R-3?t('tz_quarter'):t('tz_round',{n:r+1});
const TZ_MAPS=['de_mirage','de_inferno','de_dust2','de_nuke','de_overpass','de_ancient','de_anubis'];
function tzDetailHTML(){
  const D=TZ.cur,x=D.tourney,T=D.team,cap=T&&T.captain===T.me,teams=x.teams||{},mineIn=T&&teams[T.id];
  const nm=id=>id&&teams[id]?`[${escA(teams[id].tag)}] ${escA(teams[id].name)}`:'';
  const reg=x.status!=='open'?'':!T||!cap?`<div class="m-hint">${t('tz_need_cap')}</div>`:mineIn?`<button class="btn ghost" data-tz="unreg">${t('tz_unreg')}</button>`:`<button class="btn primary" data-tz="reg">${t('tz_reg')}</button>`;
  const org=x.mine?`<div class="card tz-org"><span>${t('tz_org')}</span>${x.status==='open'?`<button class="btn primary sm" data-tz="start">${t('tz_start')}</button>`:''}${x.status==='open'||x.status==='live'?`<button class="btn ghost sm" data-tz="cancel">${t('tz_cancel')}</button>`:''}</div>`:'';
  const mapName=b=>{const s=b.replace(/^de_/,''),m=(typeof MAPS!=='undefined'?MAPS:[]).find(y=>y.slug===s);return m?m.n:s};
  const slot=(m,r,i)=>{
    const sA=m.s?m.s[0]:'',sB=m.s?m.s[1]:'',can=x.mine&&x.status==='live'&&m.a&&m.b&&!m.w;
    return `<div class="tz-m ${m.w?'done':''}"><div class="tz-t ${m.w==='a'?'w':m.w==='b'?'l':''}"><span>${m.a?nm(m.a):m.bye&&r===0?t('tz_bye'):t('tz_tbd')}</span><b>${sA}</b></div>
      <div class="tz-t ${m.w==='b'?'w':m.w==='a'?'l':''}"><span>${m.b?nm(m.b):m.bye&&r===0?t('tz_bye'):t('tz_tbd')}</span><b>${sB}</b></div>
      ${m.mid&&!m.w?`<div class="tz-run">${t('tz_running')}</div>`:''}
      ${can&&!m.mid?`<div class="tz-ctl"><select data-tzmap="${r}-${i}"><option value="">${t('tz_rand')}</option>${TZ_MAPS.map(b=>`<option value="${b}">${escA(mapName(b))}</option>`).join('')}</select>
        <button class="btn primary sm" data-tz="launch" data-r="${r}" data-i="${i}">${t('tz_launch')}</button>
        <button class="btn ghost sm" data-tz="win" data-w="a" data-r="${r}" data-i="${i}">${t('tz_win_a',{n:escA(teams[m.a]?.tag||'A')})}</button>
        <button class="btn ghost sm" data-tz="win" data-w="b" data-r="${r}" data-i="${i}">${t('tz_win_a',{n:escA(teams[m.b]?.tag||'B')})}</button></div>`:''}</div>`};
  const br=x.bracket?`<div class="card"><div class="h3">${t('tz_bracket')}</div><div class="tz-br">${x.bracket.map((rd,r)=>`<div class="tz-col"><div class="tz-rn">${tzRoundName(x.bracket.length,r)}</div>${rd.map((m,i)=>slot(m||{},r,i)).join('')}</div>`).join('')}</div></div>`:'';
  return `<button class="btn ghost sm" data-tz="back">${t('tz_back')}</button>
    <div class="card tz-head"><div><div class="tz-top">${tzStatus(x.status)}</div><h2>${escA(x.name)}</h2><small>${t('tz_by',{n:escA(x.orgName)})}${x.date?' · '+tzDate(x.date):''} · ${t('tz_mr',{n:x.rounds/2,r:x.rounds})}</small>
      <div class="tz-meta"><span>${t('tz_teams',{n:Object.keys(teams).length,s:x.size})}</span>${x.minElo?`<span>${t('tz_min',{n:x.minElo})}</span>`:''}${x.prize?`<span>${t('tz_prize')} : ${escA(x.prize)}</span>`:''}</div>
      ${x.desc?`<p class="tz-desc">${escA(x.desc)}</p>`:''}${x.winner?`<div class="tz-win">${t('tz_winner',{n:nm(x.winner)})}</div>`:''}</div><div class="tz-actions">${reg}</div></div>${org}
    ${br}
    <div class="card"><div class="h3">${t('tz_registered')}</div>${Object.entries(teams).map(([id,tm])=>`<div class="tq-row"><span class="avatar" style="background:${safeCol(tm.color)};font-size:11px;font-weight:800">${escA(tm.tag)}</span><b>${escA(tm.name)}</b><small>${+tm.elo||0} ELO</small></div>`).join('')||`<div class="m-hint">—</div>`}</div>`;
}
function tzRender(){
  const el=$('#tzBox');if(!el)return;
  if(TZ.id&&!TZ.cur&&TZ.raw&&TZ.raw[TZ.id])tzHydrateFromRaw(TZ.raw,TQ.me?.team||null);
  if((TZ.id&&!TZ.cur)||(!TZ.id&&!TZ.list)){
    if(TZ.loading)return;
    TZ.loading=true;
    el.innerHTML='<div class="inf-load"><span class="spin inl"></span></div>';
    tzLoad(true).then(()=>{TZ.loading=false;tzRender()});
    return;
  }
  el.innerHTML=TZ.id&&TZ.cur?tzDetailHTML():tzListHTML();
  if(!TZ.loading&&Date.now()-TZ.at>15e3){
    TZ.loading=true;
    tzLoad(true).then(()=>{TZ.loading=false;if($('#tzBox'))$('#tzBox').innerHTML=TZ.id&&TZ.cur?tzDetailHTML():tzListHTML()});
  }
}
const tzRefresh=r=>{if(!r)return;if(r.tourney){TZ.cur=r;if(TZ.raw&&r.tourney.id)TZ.raw[r.tourney.id]={...TZ.raw[r.tourney.id],...r.tourney}}if(r.matchId){toast(t('tq_match_go'));if(typeof rmSyncMe==='function')rmSyncMe()}tzLoad(true).then(()=>tzRender());tzRender()};
function tzOpenCreate(){
  $('#tnForm').innerHTML=`<div class="af"><label>${t('tz_f_name')}</label><input id="tzName" maxlength="40" autocomplete="off"></div>
    <div class="two"><div class="af"><label>${t('tz_f_size')}</label><select id="tzSize"><option>4</option><option selected>8</option><option>16</option></select></div>
      <div class="af"><label>${t('tz_f_rounds')}</label><select id="tzRounds"><option value="16">${t('tz_mr',{n:8,r:16})}</option><option value="24" selected>${t('tz_mr',{n:12,r:24})}</option><option value="30">${t('tz_mr',{n:15,r:30})}</option></select></div></div>
    <div class="two"><div class="af"><label>${t('tz_f_date')}</label><input id="tzDate" type="datetime-local"></div>
      <div class="af"><label>${t('tz_f_min')}</label><input id="tzMin" type="number" min="0" max="3000" step="50" value="0"></div></div>
    <div class="af"><label>${t('tz_f_prize')}</label><input id="tzPrize" maxlength="60" autocomplete="off"></div>
    <div class="af"><label>${t('tz_f_desc')}</label><textarea id="tzDesc" maxlength="500"></textarea></div>
    <div class="m-hint">${t('tz_note')}</div>
    <div class="m-f"><button class="btn ghost" type="button" data-close>${t('cancel')}</button><button class="btn primary" type="submit">${t('tz_create')}</button></div>`;
  openModal('tnModal');setTimeout(()=>$('#tzName').focus(),50);
}
$('#tnForm').addEventListener('submit',async e=>{
  e.preventDefault();const dt=$('#tzDate').value?new Date($('#tzDate').value).getTime():0;
  const r=await tqCall('tourney',{action:'create',name:$('#tzName').value.trim(),size:+$('#tzSize').value,rounds:+$('#tzRounds').value,date:dt,minElo:+$('#tzMin').value||0,prize:$('#tzPrize').value.trim(),desc:$('#tzDesc').value.trim()});
  if(!r)return;closeModal('tnModal');TZ.id=r.id;TZ.cur=null;tzRender();
});
$('#compet').addEventListener('click',async e=>{
  const card=e.target.closest('[data-tzid]');if(card){TZ.id=card.dataset.tzid;TZ.cur=null;window.scrollTo(0,0);return tzRender()}
  const b=e.target.closest('[data-tz]');if(!b)return;const a=b.dataset.tz,id=TZ.id;
  if(a==='new')return tzOpenCreate();
  if(a==='back'){TZ.id=null;TZ.cur=null;TZ.list=null;return tzRender()}
  if(a==='reg')return tzRefresh(await tqCall('tourney',{action:'register',id}));
  if(a==='unreg')return tzRefresh(await tqCall('tourney',{action:'unregister',id}));
  if(a==='start')return tzRefresh(await tqCall('tourney',{action:'start',id}));
  if(a==='cancel')return confirmBox(t('tz_cancel'),escA(TZ.cur?.tourney?.name||''),t('tz_cancel'),t('cancel'),async()=>tzRefresh(await tqCall('tourney',{action:'cancel',id})));
  const r=+b.dataset.r,i=+b.dataset.i;
  if(a==='launch')return tzRefresh(await tqCall('tourney',{action:'launch',id,r,i,map:$(`[data-tzmap="${r}-${i}"]`)?.value||''}));
  if(a==='win')return tzRefresh(await tqCall('tourney',{action:'result',id,r,i,w:b.dataset.w}));
});
