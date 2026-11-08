/* =====================================================
 * TICKRATE - textes du vote des maps et de l'arène 1v1 (FR / EN / RU)
 * Chargé juste après core.js : la page Jouer s'affiche avant que mapvote.js et duel.js soient lus,
 * leurs textes doivent donc exister plus tôt (sinon les clés brutes « mv_rot_now »… apparaissent).
 * ===================================================== */
Object.assign(I18N.fr,{nav_mapvote:'Vote des maps',mv_title:'Vote de la rotation',mv_lead:'Choisis jusqu\'à 7 maps. Le 1er de chaque mois, les 7 maps les plus votées deviennent le pool du 5v5 compétitif.',
  mv_ends:'Fin du vote du mois de {m} dans {d}',mv_cur:'Rotation en cours',mv_last:'Dernier vote ({m}) : {v} votants',mv_last_keep:'Dernier vote ({m}) : {v} votants, pas assez pour changer le pool (3 minimum)',
  mv_pick:'{n} / 7 maps choisies',mv_save:'Enregistrer mon vote',mv_saved:'Vote enregistré, tu peux le changer jusqu\'à la fin du mois',mv_mine:'Ton vote est enregistré',
  mv_votes:'{n} votes',mv_voters:'{n} votants ce mois-ci',mv_max:'7 maps maximum',mv_steam:'Lie ton compte Steam pour voter',mv_offline:'Le vote demande un compte connecté au serveur.',
  mv_err:'Vote non enregistré, réessaie',mv_in:'dans le pool',mv_tie:'En cas d\'égalité, la map déjà dans le pool reste. Avec moins de 3 votants, le pool ne change pas.',
  mv_rot_now:'Rotation compétitive',mv_rot_t:'{n} maps choisies par le vote des joueurs, renouvelées le 1er du mois',mv_go:'Voter pour la prochaine',
  mv_off:'Hors rotation (vote pour elles)',mv_off_tag:'Hors rotation',mv_off_toast:'{n} n\'est pas dans la rotation de ce mois : vote pour elle dans « Vote des maps »',
  mv_added:'entrée',mv_removed:'sortie',mv_days:'{n} j',mv_hours:'{n} h'});
Object.assign(I18N.en,{nav_mapvote:'Map vote',mv_title:'Rotation vote',mv_lead:'Pick up to 7 maps. On the 1st of each month, the 7 most voted maps become the competitive 5v5 pool.',
  mv_ends:'{m} vote ends in {d}',mv_cur:'Current rotation',mv_last:'Last vote ({m}): {v} voters',mv_last_keep:'Last vote ({m}): {v} voters, not enough to change the pool (3 minimum)',
  mv_pick:'{n} / 7 maps picked',mv_save:'Save my vote',mv_saved:'Vote saved, you can change it until the end of the month',mv_mine:'Your vote is saved',
  mv_votes:'{n} votes',mv_voters:'{n} voters this month',mv_max:'7 maps maximum',mv_steam:'Link your Steam account to vote',mv_offline:'Voting needs an account connected to the server.',
  mv_err:'Vote not saved, try again',mv_in:'in the pool',mv_tie:'On a tie, the map already in the pool stays. With fewer than 3 voters, the pool does not change.',
  mv_rot_now:'Competitive rotation',mv_rot_t:'{n} maps chosen by the players\' vote, renewed on the 1st of each month',mv_go:'Vote for the next one',
  mv_off:'Out of rotation (vote for them)',mv_off_tag:'Out of rotation',mv_off_toast:'{n} is not in this month\'s rotation: vote for it in “Map vote”',
  mv_added:'in',mv_removed:'out',mv_days:'{n} d',mv_hours:'{n} h'});
Object.assign(I18N.ru,{nav_mapvote:'Голосование за карты',mv_title:'Голосование за ротацию',mv_lead:'Выбери до 7 карт. 1-го числа каждого месяца 7 карт с наибольшим числом голосов становятся пулом соревновательного 5v5.',
  mv_ends:'Голосование ({m}) закончится через {d}',mv_cur:'Текущая ротация',mv_last:'Прошлое голосование ({m}): {v} голосов',mv_last_keep:'Прошлое голосование ({m}): {v} голосов, мало для смены пула (минимум 3)',
  mv_pick:'Выбрано {n} / 7',mv_save:'Сохранить голос',mv_saved:'Голос сохранён, его можно изменить до конца месяца',mv_mine:'Твой голос сохранён',
  mv_votes:'{n} голосов',mv_voters:'{n} проголосовало в этом месяце',mv_max:'Максимум 7 карт',mv_steam:'Привяжи Steam, чтобы голосовать',mv_offline:'Для голосования нужен аккаунт, подключённый к серверу.',
  mv_err:'Голос не сохранён, попробуй ещё раз',mv_in:'в пуле',mv_tie:'При равенстве остаётся карта, уже бывшая в пуле. Если проголосовало меньше 3 игроков, пул не меняется.',
  mv_rot_now:'Соревновательная ротация',mv_rot_t:'{n} карт выбрано голосованием игроков, обновление 1-го числа',mv_go:'Голосовать за следующую',
  mv_off:'Вне ротации (голосуй за них)',mv_off_tag:'Вне ротации',mv_off_toast:'{n} нет в ротации этого месяца: проголосуй за неё в «Голосование за карты»',
  mv_added:'вход',mv_removed:'выход',mv_days:'{n} д',mv_hours:'{n} ч'});
Object.assign(I18N.fr,{nav_duel:'Arène 1v1',du_open:'Ouvrir le salon 1v1',du_kicker:'Arène 1v1 · Aim · 128 tick · MR9',du_elo:'ELO 1v1',
  du_next:'Encore {n} ELO pour {r}',du_max:'Rang maximum atteint',du_m:'Matchs',du_w:'Victoires',du_wr:'Victoires %',du_peak:'Record',
  du_find:'Trouver un 1v1',du_find_s:'Aim Arena · {r}',du_pc:'Le 1v1 se lance depuis un PC (Steam et CS:GO requis).',
  du_ladder:'Rangs de l\'arène',du_ladder_d:'Rangs de l\'arène, séparés du 5v5. Tu commences à 1000 ELO (Bronze II).',du_top:'Top 1v1',
  du_you:'toi',du_empty:'Pas encore de joueur classé en 1v1.',du_err:'Classement indisponible pour le moment.',du_load:'Chargement…',
  du_rules:'Règles',du_r1:'Premier à 5 rounds (MR9), pas de round au couteau',du_r2:'Freezetime 2 s, bombe à 10 s',du_r3:'Serveurs dédiés 128 tick à Francfort',
  du_maps:'Maps'});
Object.assign(I18N.en,{nav_duel:'1v1 Arena',du_open:'Open the 1v1 lounge',du_kicker:'1v1 Arena · Aim · 128 tick · MR9',du_elo:'1v1 ELO',
  du_next:'{n} ELO to {r}',du_max:'Highest rank reached',du_m:'Matches',du_w:'Wins',du_wr:'Win %',du_peak:'Peak',
  du_find:'Find a 1v1',du_find_s:'Aim Arena · {r}',du_pc:'1v1 starts from a PC (Steam and CS:GO required).',
  du_ladder:'Arena ranks',du_ladder_d:'Arena ranks, separate from 5v5. You start at 1000 ELO (Bronze II).',du_top:'Top 1v1',
  du_you:'you',du_empty:'No ranked 1v1 player yet.',du_err:'Leaderboard unavailable right now.',du_load:'Loading…',
  du_rules:'Rules',du_r1:'First to 5 rounds (MR9), no knife round',du_r2:'2 s freezetime, 10 s bomb',du_r3:'Dedicated 128 tick servers in Frankfurt',
  du_maps:'Maps'});
Object.assign(I18N.ru,{nav_duel:'Арена 1v1',du_open:'Открыть зал 1v1',du_kicker:'Арена 1v1 · Aim · 128 tick · MR9',du_elo:'ELO 1v1',
  du_next:'Ещё {n} ELO до «{r}»',du_max:'Высший ранг',du_m:'Матчи',du_w:'Победы',du_wr:'Победы %',du_peak:'Рекорд',
  du_find:'Найти 1v1',du_find_s:'Aim Arena · {r}',du_pc:'1v1 запускается с ПК (нужны Steam и CS:GO).',
  du_ladder:'Ранги арены',du_ladder_d:'Ранги арены, отдельно от 5v5. Старт — 1000 ELO (Бронза II).',du_top:'Топ 1v1',
  du_you:'ты',du_empty:'Пока нет игроков с рейтингом 1v1.',du_err:'Рейтинг сейчас недоступен.',du_load:'Загрузка…',
  du_rules:'Правила',du_r1:'До 5 побед в раундах (MR9), без ножевого раунда',du_r2:'Freezetime 2 с, бомба 10 с',du_r3:'Выделенные серверы 128 tick во Франкфурте',
  du_maps:'Карты'});
// rotation : compte à rebours, autres maps, carte Wingman
Object.assign(I18N.fr,{mv_rot_t:'{n} maps choisies par le vote des joueurs',mv_next:'Prochaine rotation dans {d}',mv_dh:'{d} j {h} h',mv_h:'{h} h {m} min',
  maps_more:'Voir les autres maps ({n}, hors rotation)',wm_pool:'Pool Wingman 2v2 · CS:GO legacy',wm_pool_t:'{n} maps 2v2 ({l}) · MR8 (9 rounds gagnants)',wm_build:'Version CS:GO'});
Object.assign(I18N.en,{mv_rot_t:'{n} maps chosen by the players’ vote',mv_next:'Next rotation in {d}',mv_dh:'{d} d {h} h',mv_h:'{h} h {m} min',
  maps_more:'Show other maps ({n}, out of rotation)',wm_pool:'Wingman 2v2 pool · CS:GO legacy',wm_pool_t:'{n} 2v2 maps ({l}) · MR8 (9 rounds to win)',wm_build:'CS:GO build'});
Object.assign(I18N.ru,{mv_rot_t:'{n} карт выбрано голосованием игроков',mv_next:'Следующая ротация через {d}',mv_dh:'{d} д {h} ч',mv_h:'{h} ч {m} мин',
  maps_more:'Другие карты ({n}, вне ротации)',wm_pool:'Пул Wingman 2v2 · CS:GO legacy',wm_pool_t:'{n} карт 2v2 ({l}) · MR8 (до 9 побед)',wm_build:'Версия CS:GO'});

// temps avant la prochaine rotation : le 1er du mois suivant à 00:05 UTC (fonction mapRotate)
function mvNextAt(now=new Date()){return Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,1,0,5)}
function mvNextIn(now=new Date()){
  const ms=Math.max(0,mvNextAt(now)-now.getTime()),d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5),m=Math.floor(ms%36e5/6e4);
  return d>=1?t('mv_dh',{d,h}):t('mv_h',{h,m});
}
// compte à rebours affiché sur la page Jouer (.rot-next) : mis à jour chaque minute
setInterval(()=>{document.querySelectorAll('.rot-next').forEach(e=>e.textContent=t('mv_next',{d:mvNextIn()}))},60000);
