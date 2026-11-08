// =====================================================================
//  Récompenses calculées par le serveur à partir des vrais matchs : missions du jour, pass de combat, ligue.
//  missions/<uid>   { day, prog: { id: n }, got: { id: true } }   (jour de Paris, comme le site)
//  passXp/<uid>     XP du pass (30 paliers de 1000 XP) ; passClaimed/<uid>/<f|p>/<palier> : déjà réclamé
//  ladder/<uid>     points de ligue
//  Les paliers du pass et les missions viennent du site (pass.json, extrait du site : mêmes récompenses).
// =====================================================================
const crypto = require('crypto');
const EC = require('./eco-core');
const DB = require('../data/cases.json');
const P = require('./pass.json');
const { addCoins, planOf } = require('./eco');
const val = async ref => (await ref.get()).val();
const rnd = () => crypto.randomInt(0, 2 ** 32) / 2 ** 32;
const XP_MAX = P.tiers * P.xpTier;
// même générateur que le site (shop.js : seeded) pour tirer les missions du jour
const seeded = seed => { let x = seed % 2147483647; if (x <= 0) x += 2147483646; return () => (x = x * 16807 % 2147483647) / 2147483647; };

// jour de Paris (le site compte en heure locale : les joueurs sont en France)
function parisDay(now = Date.now()) {
  const d = new Date(now), at = tz => Date.parse(d.toLocaleString('en-US', { timeZone: tz }));
  return Math.floor((now + (at('Europe/Paris') - at('UTC'))) / 864e5);
}
function todayMissions(day) {
  const r = seeded(day * 31 + 5), ids = Object.keys(P.missions);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  return ids.slice(0, 4);                                // la 4e : PLUS / PREMIUM
}
async function missionsOf(db, uid, now) {
  const day = parisDay(now), m = (await val(db.ref(`missions/${uid}`))) || {};
  return m.day === day ? { day, prog: m.prog || {}, got: m.got || {} } : { day, prog: {}, got: {} };
}

// ---------- fin d'un vrai match : missions, XP du pass, points de ligue ----------
// me : { k, rating, adr }, won, mvp (meilleur rating du match)
async function onMatch(db, uid, me, won, mvp, now = Date.now()) {
  const m = await missionsOf(db, uid, now), add = (id, v) => { m.prog[id] = (m.prog[id] || 0) + v; };
  for (const id of todayMissions(m.day)) {
    const M = P.missions[id];
    if (id === 'play') add(id, 1);
    if (id === 'win' && won) add(id, 1);
    if (id === 'kills') add(id, me.k || 0);
    if (id === 'mvp' && mvp) add(id, 1);
    if (id === 'rating' && (me.rating || 0) >= M.n) m.prog[id] = 1;
    if (id === 'adr' && (me.adr || 0) >= M.n) m.prog[id] = 1;
  }
  const xp = (won ? 120 : 60) + (mvp ? 40 : 0);
  const lp = (won ? 30 : 10) + Math.min(15, Math.max(0, Math.round(((me.rating || 1) - 1) * 30)));
  await Promise.all([
    db.ref(`missions/${uid}`).set(m),
    db.ref(`passXp/${uid}`).transaction(x => Math.min(XP_MAX, (x || 0) + xp)),
    db.ref(`ladder/${uid}`).transaction(x => (x || 0) + lp),
    require('./ladder').addPoints(db, uid, lp, now)            // ladder de la semaine (récompenses du lundi)
  ]);
  return { xp, lp };
}

// ---------- réclamer une mission terminée ----------
async function claimMission(db, uid, id, now = Date.now()) {
  const M = P.missions[id];
  if (!M) return { error: 'bad_mission' };
  const m = await missionsOf(db, uid, now), ids = todayMissions(m.day), idx = ids.indexOf(id);
  if (idx < 0) return { error: 'bad_mission' };
  if (idx === 3 && planOf((await val(db.ref(`profiles/${uid}`))) || {}) === 'free') return { error: 'need_plus' };
  if (m.got[id]) return { error: 'claimed' };
  if ((m.prog[id] || 0) < (M.once ? 1 : M.n)) return { error: 'not_done' };
  // verrou atomique : deux appels simultanés ne touchent pas deux fois la récompense
  let first = false;
  await db.ref(`missionClaims/${uid}/${m.day}/${id}`).transaction(x => { first = !x; return true; });
  if (!first) return { error: 'claimed' };
  m.got[id] = true;
  await Promise.all([db.ref(`missions/${uid}`).set(m), db.ref(`passXp/${uid}`).transaction(x => Math.min(XP_MAX, (x || 0) + M.xp))]);
  if (M.tc) await addCoins(db, uid, M.tc);
  return { ok: true, xp: M.xp, coins: M.tc || 0 };
}

// ---------- réclamer un palier du pass ----------
async function grant(db, uid, rw, now) {
  if (rw.type === 'coins') { await addCoins(db, uid, rw.n); return { coins: rw.n }; }
  if (rw.type === 'case') { const id = db.ref().push().key; await db.ref(`inventory/${uid}/cases/${id}`).set({ c: rw.c, src: 'pass', at: now }); return { caseId: id }; }
  if (rw.type === 'agent') { await db.ref(`shopOwned/${uid}/agents/${rw.def}`).set(true); return { agent: rw.def }; }
  if (rw.type === 'skin') {
    const id = db.ref().push().key;
    if (planOf((await val(db.ref(`profiles/${uid}`))) || {}) === 'premium') { await db.ref(`pending/${uid}/${id}`).set({ k: rw.k, src: 'pass', at: now }); return { pending: id }; }
    const it = EC.makeItem(DB, rw.k, rnd, { st: false });
    await db.ref(`inventory/${uid}/items/${id}`).set({ ...it, src: 'pass', at: now });
    return { itemId: id };
  }
  return {};
}
async function claimPass(db, uid, track, tier, now = Date.now()) {
  tier = Math.round(Number(tier));
  const T = P.pass[tier - 1], rw = T && (track === 'f' ? T.f : track === 'p' ? T.p : null);
  if (!rw) return { error: 'bad_tier' };
  const xp = (await val(db.ref(`passXp/${uid}`))) || 0;
  if (Math.min(P.tiers, Math.floor(xp / P.xpTier)) < tier) return { error: 'locked' };
  if (track === 'p' && !(await val(db.ref(`shopOwned/${uid}/passPrem`)))) return { error: 'need_pass' };
  let first = false;
  await db.ref(`passClaimed/${uid}/${track}/${tier}`).transaction(x => { first = !x; return true; });
  if (!first) return { error: 'claimed' };
  return { ok: true, reward: rw, ...(await grant(db, uid, rw, now)) };
}

// ---------- état pour le site ----------
async function rewardsState(db, uid, now = Date.now()) {
  const [m, xp, cl, lp] = await Promise.all([missionsOf(db, uid, now), val(db.ref(`passXp/${uid}`)), val(db.ref(`passClaimed/${uid}`)), val(db.ref(`ladder/${uid}`))]);
  const list = o => Object.keys(o || {}).map(Number);
  return { missions: { day: m.day, ids: todayMissions(m.day), prog: m.prog, got: Object.keys(m.got) }, pass: { xp: xp || 0, claimed: { f: list(cl && cl.f), p: list(cl && cl.p) } }, ladder: lp || 0 };
}

module.exports = { parisDay, todayMissions, onMatch, claimMission, claimPass, rewardsState, XP_MAX };
