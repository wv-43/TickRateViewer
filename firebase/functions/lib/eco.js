// =====================================================================
//  Économie des skins côté serveur : le hasard et les pièces ne sont JAMAIS gérés par le navigateur.
//  inventory/<uid>/items/<id>  { k, f, s, st, src, at, c, listed? }
//  inventory/<uid>/cases/<id>  { c, src, at }
//  pending/<uid>/<id>          { k, src, at }      (skin gagné par un PREMIUM : usure à choisir)
//  wallet/<uid>                { coins }
//  dropWeek/<uid>              { w, cases, items }
//  market/<listingId>          { seller, itemId, item, price, at }
// =====================================================================
const EC = require('./eco-core');
const DB_CASES = require('../data/cases.json');
const crypto = require('crypto');
const val = async ref => (await ref.get()).val();
const CFG = { fee: 0.10, quick: 0.40, minList: 5, maxList: 10_000_000 };
const rnd = () => crypto.randomInt(0, 2 ** 32) / 2 ** 32;           // hasard cryptographique côté serveur
const isoWeek = (now = Date.now()) => { const d = new Date(now); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + 3 - (d.getUTCDay() + 6) % 7); const w1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4)); return d.getUTCFullYear() + '-' + (1 + Math.round(((d - w1) / 864e5 - 3 + (w1.getUTCDay() + 6) % 7) / 7)); };
const planOf = p => (['plus', 'premium'].includes(p?.plan) && (!p.planUntil || p.planUntil > Date.now()) ? p.plan : 'free');

// ---------- drops de fin de match (appelé par mm.finish) ----------
async function dropsAfterMatch(db, uid, now = Date.now(), r = rnd) {
  const prof = (await val(db.ref(`profiles/${uid}`))) || {}, plan = planOf(prof);
  let wk = (await val(db.ref(`dropWeek/${uid}`))) || {};
  if (wk.w !== isoWeek(now)) wk = { w: isoWeek(now), cases: 0, items: 0 };
  const d = EC.matchDrops(DB_CASES, plan, wk, r), upd = {}, out = { cases: [], items: [], pending: [] };
  for (const c of d.cases) { const id = db.ref().push().key; upd[`inventory/${uid}/cases/${id}`] = { c, src: 'drop', at: now }; out.cases.push({ id, c }); wk.cases++; }
  for (const it of d.items) {
    const id = db.ref().push().key; wk.items++;
    if (plan === 'premium') { upd[`pending/${uid}/${id}`] = { k: it.k, st: !!it.st, src: 'drop', at: now }; out.pending.push({ id, k: it.k, st: !!it.st }); }   // StatTrak tiré au drop, usure choisie ensuite
    else { upd[`inventory/${uid}/items/${id}`] = { ...it, src: 'drop', at: now }; out.items.push({ id, ...it }); }
  }
  upd[`dropWeek/${uid}`] = wk;
  await db.ref().update(upd);
  return out;
}

// ---------- caisses ----------
async function openCase(db, uid, caseInvId, now = Date.now(), r = rnd) {
  let cs = null;
  const tx = await db.ref(`inventory/${uid}/cases/${caseInvId}`).transaction(x => { cs = x; return null; });
  if (!tx.committed || !cs) return { error: 'no_case' };
  const it = EC.openCase(DB_CASES, cs.c, r), id = db.ref().push().key;
  await db.ref(`inventory/${uid}/items/${id}`).set({ ...it, src: 'case', at: now });
  return { ok: true, item: { id, ...it }, reel: EC.reel(DB_CASES, cs.c, it, r), value: EC.price(DB_CASES, it).v };
}
// usure au choix : uniquement PREMIUM, uniquement pour les skins gagnés (pass / drops), jamais les caisses
async function claimPending(db, uid, pid, wear, now = Date.now(), r = rnd) {
  const prof = (await val(db.ref(`profiles/${uid}`))) || {};
  if (planOf(prof) !== 'premium') wear = null;
  let p = null;
  const tx = await db.ref(`pending/${uid}/${pid}`).transaction(x => { p = x; return null; });
  if (!tx.committed || !p) return { error: 'no_pending' };
  const it = DB_CASES.items[p.k];
  if (wear && !EC.wearsFor(it).some(w => w.k === wear)) wear = null;
  const item = EC.makeItem(DB_CASES, p.k, r, { st: !!p.st && !!it.st, wear }), id = db.ref().push().key;
  await db.ref(`inventory/${uid}/items/${id}`).set({ ...item, src: p.src, at: now });
  return { ok: true, item: { id, ...item } };
}

// ---------- pièces ----------
async function addCoins(db, uid, n) {
  let ok = false;
  await db.ref(`wallet/${uid}/coins`).transaction(c => { if (c === null) { ok = n >= 0; return n >= 0 ? n : null; } if (c + n < 0) { ok = false; return undefined; } ok = true; return c + n; });
  return ok;
}
async function quickSell(db, uid, itemId) {
  let item = null;
  const tx = await db.ref(`inventory/${uid}/items/${itemId}`).transaction(x => { item = x; if (x === null) return null; return x.listed ? undefined : null; });
  if (!tx.committed || !item || item.listed) return { error: 'no_item' };
  const n = Math.floor(EC.price(DB_CASES, item).v * CFG.quick);
  await addCoins(db, uid, n);
  return { ok: true, coins: n };
}

// ---------- marché ----------
async function list(db, uid, itemId, price, now = Date.now()) {
  price = Math.round(+price);
  if (!(price >= CFG.minList && price <= CFG.maxList)) return { error: 'bad_price' };
  let item = null;
  const tx = await db.ref(`inventory/${uid}/items/${itemId}`).transaction(x => { item = x; if (x === null) return null; if (x.listed) return undefined; x.listed = { price, at: now }; return x; });
  if (!tx.committed || !item || !item.listed) return { error: 'no_item' };
  const lid = db.ref('market').push().key, sellerName = (await val(db.ref(`profiles/${uid}/name`))) || 'Joueur';
  await db.ref().update({ [`market/${lid}`]: { seller: uid, sellerName, itemId, item: { k: item.k, f: item.f, s: item.s, st: !!item.st }, price, at: now }, [`inventory/${uid}/items/${itemId}/listed/lid`]: lid });
  return { ok: true, listingId: lid };
}
async function cancel(db, uid, lid) {
  const L = await val(db.ref(`market/${lid}`));
  if (!L || L.seller !== uid) return { error: 'not_yours' };
  let gone = false;
  await db.ref(`market/${lid}`).transaction(x => { gone = !!x; return null; });
  if (!gone) return { error: 'sold' };
  await db.ref(`inventory/${uid}/items/${L.itemId}/listed`).remove();
  return { ok: true };
}
async function buy(db, uid, lid, now = Date.now()) {
  let L = null;
  const tx = await db.ref(`market/${lid}`).transaction(x => { L = x; if (x === null) return null; if (x.seller === uid) return undefined; return null; });   // on « réserve » l'offre
  if (!tx.committed || !L || L.seller === uid) return { error: 'gone' };
  if (!(await addCoins(db, uid, -L.price))) { await db.ref(`market/${lid}`).set(L); return { error: 'not_enough' }; }
  const net = Math.floor(L.price * (1 - CFG.fee)), id = db.ref().push().key;
  await db.ref().update({
    [`inventory/${L.seller}/items/${L.itemId}`]: null,
    [`inventory/${uid}/items/${id}`]: { ...L.item, src: 'market', at: now },
    [`marketSales/${lid}`]: { seller: L.seller, buyer: uid, k: L.item.k, price: L.price, net, at: now }
  });
  await addCoins(db, L.seller, net);
  return { ok: true, itemId: id, price: L.price };
}
// écran de fin de match pour le plugin : { steamId: { won, delta, elo, level, drops: ['Caisse …', 'AK-47 | …'] } }
async function endScreen(db, mid, r) {
  if (r.test && !r.testReal) return {};                // match de test simple : ni ELO ni drops
  const m = (await val(db.ref(`matches/${mid}`))) || {}, out = {};
  const { lvl } = require('./core');
  await Promise.all(Object.entries(r.results || {}).map(async ([uid, x]) => {   // en parallèle : l'écran de fin s'affiche plus vite
    const p = (m.players || {})[uid]; if (!p || !p.steamId) return;
    const d = (r.drops || {})[uid] || { cases: [], items: [], pending: [] };
    const drops = [
      ...d.cases.map(c => (DB_CASES.cases.find(k => k.id === c.c) || { n: 'Caisse' }).n),
      ...d.items.map(it => EC.name(DB_CASES, it)),
      ...d.pending.map(it => EC.name(DB_CASES, { k: it.k, st: !!it.st }))
    ];
    // objets pour le tableau de fin du jeu (message « objet trouvé » de l'ancien CS:GO) :
    // d = defindex (une caisse : son id, ex. 4001), p = paint, r = rareté du jeu (3 Mil-Spec … 6 Covert), q = qualité, f = usure µ, s = pattern
    const RAR = [3, 4, 5, 6, 6];
    const view = (k, f, s, st) => { const it = DB_CASES.items[k] || {}; return { d: it.d || 0, p: it.p || 0, r: RAR[it.t] || 3, q: it.t === 4 ? 3 : st ? 9 : 4, f: Math.round((f || 0) * 1e6), s: s || 0 }; };
    const found = [
      ...d.cases.map(c => ({ d: +c.c || 0, p: 0, r: 1, q: 4, f: 0, s: 0 })),
      ...d.items.map(it => view(it.k, it.f, it.s, it.st)),
      ...d.pending.map(it => view(it.k, 0, 0, it.st))
    ].filter(x => x.d > 0);
    const wins = r.test && !r.testReal ? 0 : (await val(db.ref(`profiles/${uid}/${r.mode === 'duel' ? 'winsDuel' : (r.mode === 'wingman' ? 'winsWm' : 'wins')}`))) || 0;
    out[p.steamId] = { won: x.team === r.winner, delta: x.delta || 0, elo: x.elo, level: lvl(x.elo || 0), wins, drops, found };
  }));
  return out;
}

module.exports = { CFG, DB_CASES, dropsAfterMatch, endScreen, openCase, claimPending, quickSell, list, cancel, buy, addCoins, planOf, isoWeek };
