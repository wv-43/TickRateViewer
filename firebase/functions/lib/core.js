// Constantes et calculs partagés (identiques au site pour que l'affichage colle)
const LV = [0, 801, 951, 1101, 1251, 1401, 1551, 1701, 1851, 2001];
const lvl = e => LV.filter(x => e >= x).length;
const K_FACTOR = 50;
const MAP_POOL = ['de_mirage', 'de_inferno', 'de_dust2', 'de_nuke', 'de_overpass', 'de_ancient', 'de_anubis'];
// Wingman : maps qui ont une version 2v2 (de_nuke = de_shortnuke, converti par le plugin tickrate_match)
// Wingman : les maps 2v2 de CS:GO. Le plugin charge la version Wingman (de_nuke -> de_shortnuke) en mode de jeu 2,
// qui ferme une partie de Inferno, Overpass, Vertigo et Train comme dans le jeu
// maps 5v5 jouables sur nos serveurs : celles qu'on peut proposer au vote de la rotation (lib/mapvote.js)
const COMP_CANDIDATES = ['de_mirage', 'de_inferno', 'de_dust2', 'de_nuke', 'de_overpass', 'de_ancient', 'de_anubis', 'de_vertigo', 'de_train', 'de_cache', 'de_cbble', 'de_tuscan'];   // les 3 dernières : server-cs/install/add-maps.sh
const WINGMAN_POOL = ['de_shortdust', 'de_lake', 'de_inferno', 'de_nuke', 'de_overpass', 'de_vertigo', 'de_train', 'de_cache', 'de_cbble', 'de_tuscan'];   // les 3 dernières : server-cs/install/add-maps.sh
// Duel : cartes de duel 1v1 rapides (Aim Arena + cartes compactes)
const DUEL_POOL = ['aim_redline', 'aim_map', 'awp_lego_2', 'de_shortdust', 'de_lake'];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// Rating type HLTV 2.0 simplifié (même formule que le site)
function perfRating({ k = 0, d = 0, a = 0, adr = 0, kast = 70 }, R) {
  R = Math.max(1, R);
  const kpr = k / R, dpr = d / R, apr = a / R, impact = 2.13 * kpr + 0.42 * apr - 0.41;
  return Math.max(0.2, 0.0073 * kast + 0.3591 * kpr - 0.5329 * dpr + 0.2372 * impact + 0.0032 * adr + 0.1587);
}
// Au-dessus de 2000 ELO : on gagne moins et on perd plus (level 10 « Challenger »)
function lvl10Scale(elo, won) {
  if (!elo || elo <= 2000) return 1;
  const over = Math.min(1000, elo - 2000);
  return won ? Math.max(0.58, 1 - over / 1000 * 0.40) : Math.min(1.35, 1 + over / 1000 * 0.30);
}
const expected = (avgA, avgB) => 1 / (1 + Math.pow(10, (avgB - avgA) / 400));
function eloChange(exp, won, rating, playerElo) {
  const base = K_FACTOR * ((won ? 1 : 0) - exp);
  const perf = clamp(1 + (rating - 1) * 0.6, 0.6, 1.4);
  const mult = (won ? perf : 2 - perf) * lvl10Scale(playerElo, won);
  let d = Math.round(base * mult);
  d = won ? Math.max(4, d) : Math.min(-5, d);
  return { base: Math.round(base), mult: +mult.toFixed(3), d };
}
// Bans temporaires : paliers sur 7 jours glissants (comme le serveur Node)
const BAN_STEPS = [5, 30, 120, 1440];
const rid = (n = 8) => Array.from({ length: n }, () => 'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 32)]).join('');
const safeKey = s => String(s).replace(/[.#$/[\]]/g, '_');
module.exports = { LV, lvl, K_FACTOR, MAP_POOL, COMP_CANDIDATES, WINGMAN_POOL, DUEL_POOL, clamp, perfRating, lvl10Scale, expected, eloChange, BAN_STEPS, rid, safeKey };
