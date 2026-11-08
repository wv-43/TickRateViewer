// =====================================================
// TICKRATE - pied de page commun à tout le site
// Un seul modèle, utilisé par :
//   - les pages guides (tools/build-seo.js l'appelle pour chaque page, en FR ou en EN) ;
//   - l'accueil / le site (index.html et tickrate.html), les pages légales et la 404 : build-seo.js le recopie
//     entre les marqueurs <!--FOOTER--> et <!--/FOOTER--> de ces fichiers.
// Textes traduits : attributs data-i18n (site : js/seo-hub.js ; pages légales : js/legal.js).
// Styles : public/footer.css
// =====================================================
const SOCIAL = { instagram: 'https://www.instagram.com/tickrate.eu/', tiktok: 'https://www.tiktok.com/@tickrate.eu', discord: 'https://discord.gg/KNXbGrTDj' };

const TXT = {
  fr: {
    tag: 'Matchmaking CS:GO legacy gratuit sur serveurs 128 tick, à Francfort.',
    play: 'Jouer', guides: 'Guides', comm: 'Communauté',
    l_play: 'Lancer un match', l_duel: 'Arène 1v1', l_vote: 'Vote des maps', l_clans: 'Clans', l_rank: 'Classement', l_list: 'Liste des serveurs',
    g_srv: 'Serveur CS GO 128 tick', g_tick: 'Tickrate : 64 ou 128 tick', g_legacy: 'CS:GO legacy en 2026', g_cmd: 'Commandes CS GO', g_news: 'Actualités', g_all: 'Tous les guides',
    c_support: 'Support', legal: 'Mentions légales', privacy: 'Confidentialité', other: 'English',
    valve: 'TICKRATE n\'est pas affilié à Valve Corporation. Counter-Strike et CS:GO sont des marques de Valve Corporation.'
  },
  en: {
    tag: 'Free CS:GO legacy matchmaking on 128 tick servers in Frankfurt.',
    play: 'Play', guides: 'Guides', comm: 'Community',
    l_play: 'Find a match', l_duel: '1v1 Arena', l_vote: 'Map vote', l_clans: 'Clans', l_rank: 'Ladder', l_list: 'Server list',
    g_srv: '128 tick CS GO server', g_tick: 'Tickrate: 64 vs 128 tick', g_legacy: 'CS:GO legacy in 2026', g_cmd: 'CS GO matchmaking', g_news: 'News', g_all: 'All guides',
    c_support: 'Support', legal: 'Legal notice', privacy: 'Privacy', other: 'Français',
    valve: 'TICKRATE is not affiliated with Valve Corporation. Counter-Strike and CS:GO are trademarks of Valve Corporation.'
  }
};
// liens : FR -> pages françaises ; EN -> pages anglaises quand elles existent
const HREF = {
  fr: { list: '/serveurs-csgo', srv: '/serveur-csgo', tick: '/tickrate-csgo', legacy: '/csgo-legacy', cmd: '/commandes-csgo', news: '/actualites', all: '/guides', other: '/en/guides' },
  en: { list: '/en/csgo-server-list', srv: '/en/csgo-server', tick: '/en/tickrate', legacy: '/en/csgo-legacy', cmd: '/en/csgo-matchmaking', news: '/en/news', all: '/en/guides', other: '/guides' }
};
const MARK = '<svg class="tr-mark" viewBox="9 9 46 46" aria-hidden="true"><path d="M50.61 37.34A19.36 19.36 0 0 1 37.34 50.61M26.66 50.61A19.36 19.36 0 0 1 13.39 37.34M13.39 26.66A19.36 19.36 0 0 1 26.66 13.39M37.34 13.39A19.36 19.36 0 0 1 50.61 26.66" fill="none" stroke="currentColor" stroke-width="3.52"/><rect x="21.12" y="22.4" width="21.76" height="4.48" rx="1.12" fill="currentColor"/><rect x="29.28" y="22.4" width="5.44" height="21.76" rx="1.36" fill="currentColor"/></svg>';

// i18n = true : ajoute les attributs data-i18n (site et pages légales, traduits par JavaScript) ; false : pages guides, déjà dans leur langue
// pages = [[adresse, nom], …] : rangée de toutes les pages guides (pages guides seulement, pour que chaque page mène à toutes les autres)
function footer(lang = 'fr', { i18n = false, pages = null, other = null, year = new Date().getFullYear() } = {}) {
  const T = TXT[lang], H = HREF[lang];
  const k = key => i18n ? ` data-i18n="ft_${key}"` : '';
  const a = (href, key, ext) => `<a href="${href}"${ext ? ' target="_blank" rel="me noopener"' : ''}${k(key)}>${T[key]}</a>`;
  const ext = (href, name) => `<a href="${href}" target="_blank" rel="${name === 'Discord' ? '' : 'me '}noopener">${name}</a>`;
  return `<footer class="site-foot">
  <div class="sf-in">
    <div class="sf-brand">
      <a class="sf-logo" href="/">${MARK}<span>TICK<b>RATE</b></span></a>
      <p${k('tag')}>${T.tag}</p>
    </div>
    <nav class="sf-col" aria-label="${T.play}"><h4${k('play')}>${T.play}</h4>${a('/', 'l_play')}${a('/#/duel', 'l_duel')}${a('/#/mapvote', 'l_vote')}${a('/#/clans', 'l_clans')}${a('/#/ranking', 'l_rank')}${a(H.list, 'l_list')}</nav>
    <nav class="sf-col" aria-label="${T.guides}"><h4${k('guides')}>${T.guides}</h4>${a(H.srv, 'g_srv')}${a(H.tick, 'g_tick')}${a(H.legacy, 'g_legacy')}${a(H.cmd, 'g_cmd')}${a(H.news, 'g_news')}${a(H.all, 'g_all')}</nav>
    <nav class="sf-col" aria-label="${T.comm}"><h4${k('comm')}>${T.comm}</h4>${ext(SOCIAL.discord, 'Discord')}${ext(SOCIAL.instagram, 'Instagram')}${ext(SOCIAL.tiktok, 'TikTok')}${a('/#/support', 'c_support')}</nav>
  </div>
${pages ? `  <nav class="sf-pages" aria-label="${T.guides}">${pages.map(([h, n]) => `<a href="${h}">${n}</a>`).join('')}</nav>
` : ''}  <div class="sf-bottom">
    <span>© ${year} TICKRATE · tickrate.eu</span>
    ${a('/mentions-legales', 'legal')}${a('/confidentialite', 'privacy')}<a href="${other || H.other}" hreflang="${lang === 'fr' ? 'en' : 'fr'}" lang="${lang === 'fr' ? 'en' : 'fr'}">${T.other}</a>
  </div>
  <p class="sf-valve"${k('valve')}>${T.valve}</p>
</footer>`;
}

module.exports = { footer, TXT, SOCIAL };
