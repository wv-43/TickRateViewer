(function(){
  const FT_TXT = {"fr": {"ft_tag": "Matchmaking CS:GO legacy gratuit sur serveurs 128 tick, à Francfort.", "ft_play": "Jouer", "ft_guides": "Guides", "ft_comm": "Communauté", "ft_l_play": "Lancer un match", "ft_l_duel": "Arène 1v1", "ft_l_vote": "Vote des maps", "ft_l_rank": "Classement", "ft_l_list": "Liste des serveurs", "ft_g_srv": "Serveur CS GO 128 tick", "ft_g_tick": "Tickrate : 64 ou 128 tick", "ft_g_legacy": "CS:GO legacy en 2026", "ft_g_cmd": "Commandes CS GO", "ft_g_all": "Tous les guides", "ft_c_support": "Support", "ft_legal": "Mentions légales", "ft_privacy": "Confidentialité", "ft_valve": "TICKRATE n'est pas affilié à Valve Corporation. Counter-Strike et CS:GO sont des marques de Valve Corporation.", "ft_g_news": "Actualités", "ft_l_clans": "Clans"}, "en": {"ft_tag": "Free CS:GO legacy matchmaking on 128 tick servers in Frankfurt.", "ft_play": "Play", "ft_guides": "Guides", "ft_comm": "Community", "ft_l_play": "Find a match", "ft_l_duel": "1v1 Arena", "ft_l_vote": "Map vote", "ft_l_rank": "Ladder", "ft_l_list": "Server list", "ft_g_srv": "128 tick CS GO server", "ft_g_tick": "Tickrate: 64 vs 128 tick", "ft_g_legacy": "CS:GO legacy in 2026", "ft_g_cmd": "CS GO commands", "ft_g_all": "All guides", "ft_c_support": "Support", "ft_legal": "Legal notice", "ft_privacy": "Privacy", "ft_valve": "TICKRATE is not affiliated with Valve Corporation. Counter-Strike and CS:GO are trademarks of Valve Corporation.", "ft_g_news": "News", "ft_l_clans": "Clans"}, "ru": {"ft_tag": "Бесплатный матчмейкинг CS:GO legacy на серверах 128 tick во Франкфурте.", "ft_play": "Играть", "ft_guides": "Гайды", "ft_comm": "Сообщество", "ft_l_play": "Найти матч", "ft_l_duel": "Арена 1v1", "ft_l_vote": "Голосование за карты", "ft_l_rank": "Рейтинг", "ft_l_list": "Список серверов", "ft_g_srv": "Сервер CS GO 128 tick", "ft_g_tick": "Тикрейт: 64 или 128 tick", "ft_g_legacy": "CS:GO legacy в 2026 году", "ft_g_cmd": "Команды CS GO", "ft_g_all": "Все гайды", "ft_c_support": "Поддержка", "ft_legal": "Правовая информация", "ft_privacy": "Конфиденциальность", "ft_valve": "TICKRATE не связан с Valve Corporation. Counter-Strike и CS:GO являются товарными знаками Valve Corporation.", "ft_g_news": "Новости", "ft_l_clans": "Кланы"}};
  const backLabels = { fr: '← Retour à TICKRATE', en: '← Back to TICKRATE', ru: '← Назад в TICKRATE' };
  let curLang = 'fr';
  try {
    const saved = localStorage.getItem('cs_lang');
    if (saved && ['fr', 'en', 'ru'].includes(saved)) curLang = saved;
    else {
      const nav = (navigator.language || 'fr').slice(0, 2);
      if (['fr', 'en', 'ru'].includes(nav)) curLang = nav;
    }
  } catch(_) {}

  function setLang(l) {
    if (!['fr', 'en', 'ru'].includes(l)) l = 'fr';
    curLang = l;
    document.documentElement.lang = l;
    document.querySelectorAll('.lg-lang-btn').forEach(b => b.classList.toggle('active', b.dataset.langSet === l));
    document.querySelectorAll('[data-lang-block]').forEach(b => b.classList.toggle('active', b.dataset.langBlock === l));
    const bk = document.getElementById('backLink');
    if (bk && backLabels[l]) bk.textContent = backLabels[l];
    document.querySelectorAll('.site-foot [data-i18n]').forEach(e => { const v = FT_TXT[l][e.dataset.i18n]; if (v) e.textContent = v; });
    try { localStorage.setItem('cs_lang', l); } catch(_) {}
  }

  document.querySelectorAll('[data-lang-set]').forEach(b => {
    b.addEventListener('click', () => setLang(b.dataset.langSet));
  });
  setLang(curLang);
})();
