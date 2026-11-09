const LV = [0, 801, 951, 1101, 1251, 1401, 1551, 1701, 1851, 2001];
const lvl = e => LV.filter(x => e >= x).length;
const K_FACTOR = 50;
const MAP_POOL = ['de_mirage', 'de_inferno', 'de_dust2', 'de_nuke', 'de_overpass', 'de_ancient', 'de_anubis'];
const COMP_CANDIDATES = ['de_mirage', 'de_inferno', 'de_dust2', 'de_nuke', 'de_overpass', 'de_ancient', 'de_anubis', 'de_vertigo', 'de_train', 'de_cache', 'de_cbble', 'de_tuscan'];
const WINGMAN_POOL = ['de_shortdust', 'de_lake', 'de_inferno', 'de_nuke', 'de_overpass', 'de_vertigo', 'de_train', 'de_cache', 'de_cbble', 'de_tuscan'];
const DUEL_POOL = ['aim_redline', 'aim_map', 'awp_lego_2', 'de_shortdust', 'de_lake'];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function perfRating({ k = 0, d = 0, a = 0, adr = 0, kast = 70 }, R) {
  R = Math.max(1, R);
  const kpr = k / R, dpr = d / R, apr = a / R, impact = 2.13 * kpr + 0.42 * apr - 0.41;
  return Math.max(0.2, 0.0073 * kast + 0.3591 * kpr - 0.5329 * dpr + 0.2372 * impact + 0.0032 * adr + 0.1587);
}
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
const BAN_STEPS = [5, 30, 120, 1440];
const rid = (n = 8) => Array.from({ length: n }, () => 'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 32)]).join('');
const safeKey = s => String(s).replace(/[.#$/[\]]/g, '_');
module.exports = { LV, lvl, K_FACTOR, MAP_POOL, COMP_CANDIDATES, WINGMAN_POOL, DUEL_POOL, clamp, perfRating, lvl10Scale, expected, eloChange, BAN_STEPS, rid, safeKey };
