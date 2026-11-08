// Bloc « présentation + liens + FAQ » de l'accueil (section .seo-hub) : traductions EN et RU.
// Le HTML reste en français (c'est lui que Google lit) ; applyStatic() remplace les textes data-i18n selon la langue choisie.
(function () {
  const FR = {
    sh_badge: 'SERVEURS 128 TICK · CS:GO LEGACY',
    sh_h2: 'Matchmaking CS:GO en 128 tick, en Europe',
    sh_p: 'TICKRATE organise des parties de <strong>Counter-Strike: Global Offensive</strong> (version legacy) sur nos propres serveurs en 128 tick, hébergés en Allemagne. Tu lances la recherche depuis le site, seul ou avec ton groupe, et CS:GO te connecte au serveur quand le match est prêt.',
    sh_f1t: '128 tick sur chaque serveur', sh_f1p: 'Le serveur met la partie à jour 128 fois par seconde, deux fois plus qu\'en 64 tick : les tirs et les grenades suivent mieux ce que tu vois.',
    sh_f2t: 'ELO selon ton match', sh_f2p: 'La victoire compte, mais ton ADR, tes kills et ton impact font varier les points gagnés ou perdus.',
    sh_f3t: 'Vigie et facteur de confiance', sh_f3p: 'Les joueurs signalent, d\'autres joueurs revoient la demo et votent. Ton facteur de confiance règle avec qui tu joues.',
    sh_f4t: '5v5, Wingman et 1v1', sh_f4p: 'Veto de maps avant chaque match, équipes, ligue et tournois organisés par les joueurs.',
    sl_srv: 'Serveur CS GO 128 tick', sl_list: 'Liste des serveurs en direct', sl_tick: 'Tickrate : 64 ou 128 tick', sl_legacy: 'Jouer à CS GO legacy en 2026',
    sl_mm: 'Matchmaking CS GO', sl_rank: 'Classement et rangs', sl_maps: 'Maps et vote du pool', sl_wm: 'Wingman 2v2', sl_duel: '1v1 Aim',
    sl_cmd: 'Commandes CS GO', sl_host: 'Créer un serveur CS GO', sl_guides: 'Tous les guides',
    sh_faq: 'Questions fréquentes',
    sh_q1: 'Comment jouer à CS:GO sur TICKRATE ?', sh_a1: 'Installe CS:GO (version legacy) depuis ta bibliothèque Steam, crée ton compte sur tickrate.eu et lie ton compte Steam. Ensuite : « Trouver un match », accepte, fais le veto et clique sur Connecter. La page « Comment jouer » détaille chaque étape.',
    sh_q2: 'Est-ce gratuit ?', sh_a2: 'Oui. Tous les modes, le classement, les serveurs et la ligue sont gratuits. Les formules Plus et Premium ajoutent de la personnalisation et des outils d\'analyse, sans avantage en jeu.',
    sh_q3: 'Qu\'est-ce que le 128 tick change ?', sh_a3: 'Le serveur calcule la partie plus souvent : les tirs sont enregistrés plus près du moment où tu cliques et les trajectoires de grenades sont plus régulières. Ta connexion reste importante : un bon ping compte autant.',
    sh_q4: 'Comment fonctionne l\'anti-triche ?', sh_a4: 'Le plugin du serveur relève des statistiques de tir pendant le match. Les signalements sont revus par des joueurs fiables dans Vigie, à partir de la demo. Un tricheur confirmé est banni et perd du facteur de confiance.'
  };
  const EN = {
    sh_badge: '128 TICK SERVERS · CS:GO LEGACY',
    sh_h2: 'CS:GO matchmaking at 128 tick, in Europe',
    sh_p: 'TICKRATE runs <strong>Counter-Strike: Global Offensive</strong> (legacy version) matches on our own 128 tick servers, hosted in Germany. You queue from the site, solo or with your party, and CS:GO connects you to the server when the match is ready.',
    sh_f1t: '128 tick on every server', sh_f1p: 'The server updates the game 128 times per second, twice as often as 64 tick: shots and grenades follow what you see more closely.',
    sh_f2t: 'ELO based on your match', sh_f2p: 'Winning matters, but your ADR, kills and impact change how many points you gain or lose.',
    sh_f3t: 'Watch and trust factor', sh_f3p: 'Players report, other players review the demo and vote. Your trust factor decides who you play with.',
    sh_f4t: '5v5, Wingman and 1v1', sh_f4p: 'Map veto before every match, teams, league and player-run tournaments.',
    sl_srv: '128 tick CS GO server', sl_list: 'Live server list', sl_tick: 'Tickrate: 64 vs 128 tick', sl_legacy: 'Play CS GO legacy in 2026',
    sl_mm: 'CS GO matchmaking', sl_rank: 'Ranking and ranks', sl_maps: 'Maps and pool vote', sl_wm: 'Wingman 2v2', sl_duel: '1v1 Aim',
    sl_cmd: 'CS GO commands', sl_host: 'Host a CS GO server', sl_guides: 'All guides',
    sh_faq: 'FAQ',
    sh_q1: 'How do I play CS:GO on TICKRATE?', sh_a1: 'Install CS:GO (legacy version) from your Steam library, create your account on tickrate.eu and link Steam. Then: "Find a match", accept, do the veto and click Connect. The "How to play" page covers every step.',
    sh_q2: 'Is it free?', sh_a2: 'Yes. Every mode, the ladder, the servers and the league are free. Plus and Premium plans add cosmetics and analysis tools, with no in-game advantage.',
    sh_q3: 'What does 128 tick change?', sh_a3: 'The server simulates the game more often: shots register closer to the moment you click and grenade trajectories are more consistent. Your connection still matters: a good ping counts just as much.',
    sh_q4: 'How does the anti-cheat work?', sh_a4: 'The server plugin records aim statistics during the match. Reports are reviewed from the demo by trusted players in Watch. A confirmed cheater is banned and loses trust factor.'
  };
  const RU = {
    sh_badge: 'СЕРВЕРЫ 128 TICK · CS:GO LEGACY',
    sh_h2: 'Матчмейкинг CS:GO на 128 tick в Европе',
    sh_p: 'TICKRATE проводит матчи <strong>Counter-Strike: Global Offensive</strong> (legacy-версия) на собственных серверах 128 tick в Германии. Ты запускаешь поиск на сайте, один или с группой, и CS:GO подключает тебя к серверу, когда матч готов.',
    sh_f1t: '128 tick на каждом сервере', sh_f1p: 'Сервер обновляет игру 128 раз в секунду, вдвое чаще, чем на 64 tick: выстрелы и гранаты точнее совпадают с тем, что ты видишь.',
    sh_f2t: 'ELO по твоей игре', sh_f2p: 'Победа важнее всего, но ADR, убийства и влияние на раунды меняют количество получаемых или теряемых очков.',
    sh_f3t: 'Дозор и фактор доверия', sh_f3p: 'Игроки отправляют жалобы, другие игроки смотрят демо и голосуют. Фактор доверия определяет, с кем ты играешь.',
    sh_f4t: '5v5, Wingman и 1v1', sh_f4p: 'Вето карт перед каждым матчем, команды, лига и турниры от игроков.',
    sl_srv: 'Сервер CS GO 128 tick', sl_list: 'Серверы в реальном времени', sl_tick: 'Тикрейт: 64 или 128 tick', sl_legacy: 'CS GO legacy в 2026 году',
    sl_mm: 'Матчмейкинг CS GO', sl_rank: 'Рейтинг и звания', sl_maps: 'Карты и голосование', sl_wm: 'Wingman 2v2', sl_duel: '1v1 Aim',
    sl_cmd: 'Команды CS GO', sl_host: 'Создать сервер CS GO', sl_guides: 'Все гайды',
    sh_faq: 'Частые вопросы',
    sh_q1: 'Как играть в CS:GO на TICKRATE?', sh_a1: 'Установи CS:GO (legacy-версию) из библиотеки Steam, создай аккаунт на tickrate.eu и привяжи Steam. Затем: «Найти матч», прими его, проведи вето и нажми «Подключиться». На странице «Как играть» описан каждый шаг.',
    sh_q2: 'Это бесплатно?', sh_a2: 'Да. Все режимы, рейтинг, серверы и лига бесплатны. Подписки Plus и Premium добавляют оформление и инструменты анализа, без преимущества в игре.',
    sh_q3: 'Что даёт 128 tick?', sh_a3: 'Сервер рассчитывает игру чаще: выстрелы засчитываются ближе к моменту клика, а траектории гранат стабильнее. Соединение всё равно важно: хороший пинг значит не меньше.',
    sh_q4: 'Как работает античит?', sh_a4: 'Плагин сервера собирает статистику стрельбы во время матча. Жалобы проверяют надёжные игроки в Дозоре по демо. Подтверждённый читер получает бан и теряет фактор доверия.'
  };
  // pied de page commun (tools/footer.js)
  const FT = {"fr": {"ft_tag": "Matchmaking CS:GO legacy gratuit sur serveurs 128 tick, à Francfort.", "ft_play": "Jouer", "ft_guides": "Guides", "ft_comm": "Communauté", "ft_l_play": "Lancer un match", "ft_l_duel": "Arène 1v1", "ft_l_vote": "Vote des maps", "ft_l_rank": "Classement", "ft_l_list": "Liste des serveurs", "ft_g_srv": "Serveur CS GO 128 tick", "ft_g_tick": "Tickrate : 64 ou 128 tick", "ft_g_legacy": "CS:GO legacy en 2026", "ft_g_cmd": "Commandes CS GO", "ft_g_all": "Tous les guides", "ft_c_support": "Support", "ft_legal": "Mentions légales", "ft_privacy": "Confidentialité", "ft_valve": "TICKRATE n'est pas affilié à Valve Corporation. Counter-Strike et CS:GO sont des marques de Valve Corporation.", "ft_g_news": "Actualités", "ft_l_clans": "Clans"}, "en": {"ft_tag": "Free CS:GO legacy matchmaking on 128 tick servers in Frankfurt.", "ft_play": "Play", "ft_guides": "Guides", "ft_comm": "Community", "ft_l_play": "Find a match", "ft_l_duel": "1v1 Arena", "ft_l_vote": "Map vote", "ft_l_rank": "Ladder", "ft_l_list": "Server list", "ft_g_srv": "128 tick CS GO server", "ft_g_tick": "Tickrate: 64 vs 128 tick", "ft_g_legacy": "CS:GO legacy in 2026", "ft_g_cmd": "CS GO commands", "ft_g_all": "All guides", "ft_c_support": "Support", "ft_legal": "Legal notice", "ft_privacy": "Privacy", "ft_valve": "TICKRATE is not affiliated with Valve Corporation. Counter-Strike and CS:GO are trademarks of Valve Corporation.", "ft_g_news": "News", "ft_l_clans": "Clans"}, "ru": {"ft_tag": "Бесплатный матчмейкинг CS:GO legacy на серверах 128 tick во Франкфурте.", "ft_play": "Играть", "ft_guides": "Гайды", "ft_comm": "Сообщество", "ft_l_play": "Найти матч", "ft_l_duel": "Арена 1v1", "ft_l_vote": "Голосование за карты", "ft_l_rank": "Рейтинг", "ft_l_list": "Список серверов", "ft_g_srv": "Сервер CS GO 128 tick", "ft_g_tick": "Тикрейт: 64 или 128 tick", "ft_g_legacy": "CS:GO legacy в 2026 году", "ft_g_cmd": "Команды CS GO", "ft_g_all": "Все гайды", "ft_c_support": "Поддержка", "ft_legal": "Правовая информация", "ft_privacy": "Конфиденциальность", "ft_valve": "TICKRATE не связан с Valve Corporation. Counter-Strike и CS:GO являются товарными знаками Valve Corporation.", "ft_g_news": "Новости", "ft_l_clans": "Кланы"}};
  Object.assign(FR, FT.fr); Object.assign(EN, FT.en); Object.assign(RU, FT.ru);
  if (typeof I18N === 'undefined') return;
  Object.assign(I18N.fr, FR); Object.assign(I18N.en, EN); Object.assign(I18N.ru, RU);
})();
