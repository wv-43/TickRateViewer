// Actualités de TICKRATE (pages /actualites et /en/news). La plus récente en premier.
// Ajouter une entrée ici, puis : node tools/build-seo.js (et publier le site).
// Le résultat mensuel du vote des maps s'affiche tout seul en haut de la page (publicNews/maps, écrit par la fonction mapRotate).
module.exports = [
  {
    date: '2026-11-08',
    fr: { title: 'IndexNow, nouveau pied de page et pages traduites',
          body: 'Le site prévient désormais les moteurs de recherche dès qu\'une page change. Toutes les pages ont un pied de page commun, et le bloc de présentation de l\'accueil est traduit en anglais et en russe.' },
    en: { title: 'IndexNow, new footer and translated pages',
          body: 'The site now notifies search engines as soon as a page changes. Every page has a shared footer, and the home page introduction is translated into English and Russian.' }
  },
  {
    date: '2026-11-07',
    fr: { title: 'Liste des serveurs en direct',
          body: 'Une nouvelle page montre l\'état de chaque serveur en temps réel : libre, en préparation ou en match, avec la map et le score. <a href="/serveurs-csgo">Voir la liste des serveurs</a>.' },
    en: { title: 'Live server list',
          body: 'A new page shows every server\'s status in real time: available, starting or in a match, with the map and score. <a href="/en/csgo-server-list">See the server list</a>.' }
  },
  {
    date: '2026-11-07',
    fr: { title: 'Les joueurs votent pour les maps du 5v5',
          body: 'Le pool compétitif est désormais choisi par la communauté : chaque mois, tu votes pour 1 à 7 maps parmi 12, et les 7 plus votées forment la rotation du mois suivant. Première rotation le 1er décembre. Le mode non classé disparaît pour laisser les serveurs au classé. <a href="/maps-csgo">Comment marche le vote</a>.' },
    en: { title: 'Players now vote for the 5v5 maps',
          body: 'The competitive pool is now chosen by the community: every month you vote for 1 to 7 maps out of 12, and the 7 most voted make up next month\'s rotation. First rotation on December 1. Unranked mode is removed to keep servers for ranked play.' }
  },
  {
    date: '2026-11-07',
    fr: { title: 'Arène 1v1 : un salon et des rangs à part',
          body: 'Le 1v1 Aim a son propre salon, son classement et ses rangs, de Fer à Légende 128. Tu commences à 1000 ELO, en Bronze II. <a href="/1v1-csgo">Découvrir l\'arène</a>.' },
    en: { title: '1v1 Arena: its own lounge and ranks',
          body: '1v1 Aim now has its own lounge, ladder and ranks, from Iron to 128 Legend. You start at 1000 ELO, in Bronze II.' }
  }
];
