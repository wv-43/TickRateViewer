const crypto = require('crypto');
const EC = require('./eco-core');
const DB = require('../data/cases.json');
const PRICES = require('./shop-prices.json');
const { addCoins } = require('./eco');
const rewards = require('./rewards');
const containers = require('./containers');
const val = async ref => (await ref.get()).val();
const rnd = () => crypto.randomInt(0, 2 ** 32) / 2 ** 32;
const int = (v, a, b) => Math.min(b, Math.max(a, Math.round(Number(v) || 0)));
const slug = n => String(n).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const CAP = { items: 300, cases: 100, pending: 50, coins: 50000, skins: 200, agents: 63, cards: 50, bgs: 30 };
const PASS_PRICE = 950;
const CARD_PRICES = {
  carbon: 600,
  radar: 800,
  damascus: 950,
  tiger: 1200,
  asiimov: 1500,
  printstream: 1800,
  gungnir: 2000,
  sakura: 2100,
  aurora: 2200,
  legion: 2400,
  cyberpunk: 2500,
  emerald: 2600,
  retrowave: 2700,
  ruby: 2800,
  toxic: 2900,
  storm: 3000,
  frost: 3100,
  magma: 3200,
  fire_serpent: 3300,
  oni: 3400,
  howl: 3600,
  hyperdrive: 3800,
  dragon: 4000,
  dark_matter: 4200,
  singularity: 4500,
  gold_ingot: 4800,
  sovereign: 5000,
  blood_moon: 2800,
  mecha_industry: 3000,
  void_walker: 3400,
  solar_flare: 3600,
  neon_tokyo: 4000,
  case_hardened: 4500
};
const BG_PRICES = {
  cyber_city: 1500,
  deep_cosmos: 1800,
  matrix_code: 2000,
  frost_glacier: 2100,
  hyper_grid: 2400,
  magma_forge: 2400,
  aurora_sky: 2500,
  quantum_field: 2700,
  bubble_ambient: 2800,
  dragons_lair: 3200,
  golden_dynasty: 3800,
  blood_eclipse: 2200,
  cyber_arcade: 2500,
  aurora_borealis_hd: 2600,
  sakura_dream: 2900,
  black_hole_event: 3500,
  glitch_dimension: 3900
};
const IMPORT_BEFORE = Date.parse('2026-11-01T00:00:00Z');
const TU_MAX = 10;

async function fixBadImport(db, uid) {
  const [inv, pend, created] = await Promise.all([val(db.ref(`inventory/${uid}`)), val(db.ref(`pending/${uid}`)), val(db.ref(`profiles/${uid}/createdAt`))]);
  if (!inv || !inv._imported || inv._importFixed || !created || created < IMPORT_BEFORE) return;
  const upd = { [`inventory/${uid}/_importFixed`]: Date.now() };
  for (const [id, x] of Object.entries(inv.items || {})) if (x && x.src === 'import') upd[`inventory/${uid}/items/${id}`] = null;
  for (const [id, x] of Object.entries(inv.cases || {})) if (x && x.src === 'import') upd[`inventory/${uid}/cases/${id}`] = null;
  for (const [id, x] of Object.entries(pend || {})) if (x && x.src === 'import') upd[`pending/${uid}/${id}`] = null;
  await db.ref().update(upd);
}
async function grantDevCases(db, uid, count = 50, now = Date.now()) {
  const role = await val(db.ref(`roles/${uid}`));
  if (role !== 'dev') return { error: 'forbidden' };
  const casesPool = DB.cases || [];
  if (!casesPool.length) return { error: 'no_cases' };
  const upd = {};
  const added = [];
  const n = Math.max(1, Math.min(200, Math.floor(Number(count) || 50)));
  for (let i = 0; i < n; i++) {
    const C = casesPool[i % casesPool.length];
    const id = db.ref().push().key;
    upd[`inventory/${uid}/cases/${id}`] = { c: String(C.id), src: 'dev', at: now };
    added.push({ id, c: String(C.id) });
  }
  const prevGranted = (await val(db.ref(`inventory/${uid}/_devCasesGranted`))) || 0;
  upd[`inventory/${uid}/_devCasesGranted`] = prevGranted + n;
  await db.ref().update(upd);
  return { ok: true, count: n, added };
}

async function state(db, uid) {
  await fixBadImport(db, uid);
  const [inv, pend, coins, own, rw, stc, role, prof] = await Promise.all([
    val(db.ref(`inventory/${uid}`)), val(db.ref(`pending/${uid}`)), val(db.ref(`wallet/${uid}/coins`)), val(db.ref(`shopOwned/${uid}`)), rewards.rewardsState(db, uid), val(db.ref(`stattrak/${uid}`)), val(db.ref(`roles/${uid}`)), val(db.ref(`profiles/${uid}`))
  ]);
  const isDev = role === 'dev';
  if (prof && !!prof.dev !== isDev) {
    try { await db.ref(`profiles/${uid}/dev`).set(isDev ? true : null); } catch (e) {}
  }
  if (isDev) {
    const devGranted = await val(db.ref(`inventory/${uid}/_devCasesGranted`));
    if (!devGranted) {
      await grantDevCases(db, uid, 50);
      if (inv) inv.cases = await val(db.ref(`inventory/${uid}/cases`));
    }
  }
  const contList = await containers.list(db, uid);
  const list = o => Object.entries(o || {}).map(([id, x]) => ({ id, ...x }));
  return {
    ok: true, coins: coins || 0,
    items: list(inv && inv.items), cases: list(inv && inv.cases), pending: list(pend),
    containers: contList,
    skins: Object.keys((own && own.skins) || {}), agents: Object.keys((own && own.agents) || {}).map(Number),
    cards: Object.keys((own && own.cards) || {}),
    bgs: Object.keys((own && own.bgs) || {}),
    dev: isDev, beta: !!(prof && prof.beta), plan: (prof && prof.plan) || 'free', influencer: (prof && prof.influencer) || null,
    passPrem: !!(own && own.passPrem), imported: !!(inv && inv._imported), stattrak: stc || {}, ...rw
  };
}

async function importLocal(db, uid, data = {}, now = Date.now()) {
  if (await val(db.ref(`inventory/${uid}/_imported`))) return { ...(await state(db, uid)), map: {} };
  const created = await val(db.ref(`profiles/${uid}/createdAt`));
  if (!created || created >= IMPORT_BEFORE) {
    await db.ref(`inventory/${uid}/_imported`).set(now);
    return { ...(await state(db, uid)), map: {} };
  }
  const upd = { [`inventory/${uid}/_imported`]: now }, map = {};
  const arr = (a, n) => (Array.isArray(a) ? a.slice(0, n) : []);
  for (const x of arr(data.items, CAP.items)) {
    const it = x && DB.items[x.k];
    if (!it) continue;
    const id = db.ref().push().key;
    const f = Number.isFinite(+x.f) ? Math.min(it.mx, Math.max(it.mn, +x.f)) : (it.mn + it.mx) / 2;
    upd[`inventory/${uid}/items/${id}`] = { k: x.k, f: +f.toFixed(6), s: int(x.s, 0, 999), st: !!x.st && !!it.st, src: 'import', at: int(x.at, 0, now) || now, c: DB.cases.some(c => c.id === x.c) ? x.c : null };
    if (x.id) map[String(x.id).slice(0, 40)] = id;
  }
  for (const x of arr(data.cases, CAP.cases)) {
    if (!x || !DB.cases.some(c => c.id === String(x.c))) continue;
    upd[`inventory/${uid}/cases/${db.ref().push().key}`] = { c: String(x.c), src: 'import', at: now };
  }
  for (const x of arr(data.pending, CAP.pending)) {
    if (!x || !DB.items[x.k]) continue;
    upd[`pending/${uid}/${db.ref().push().key}`] = { k: x.k, src: 'import', at: now };
  }
  for (const k of arr(data.skins, CAP.skins)) if (typeof k === 'string' && /^[a-z0-9-]{1,40}:\d{1,6}$/.test(k)) upd[`shopOwned/${uid}/skins/${k}`] = true;
  for (const d of arr(data.agents, CAP.agents)) if (PRICES.agents[d]) upd[`shopOwned/${uid}/agents/${+d}`] = true;
  for (const cid of arr(data.cards, CAP.cards)) if (typeof cid === 'string' && CARD_PRICES[cid]) upd[`shopOwned/${uid}/cards/${cid}`] = true;
  for (const bid of arr(data.bgs, CAP.bgs)) if (typeof bid === 'string' && BG_PRICES[bid]) upd[`shopOwned/${uid}/bgs/${bid}`] = true;
  if (data.passPrem) upd[`shopOwned/${uid}/passPrem`] = true;
  await db.ref().update(upd);
  const local = int(data.coins, 0, CAP.coins);
  await db.ref(`wallet/${uid}/coins`).transaction(c => Math.max(c || 0, local));
  return { ...(await state(db, uid)), map };
}

const CASE_PRICE = {};
function casePrice(cid) {
  if (CASE_PRICE[cid]) return CASE_PRICE[cid];
  const r = EC.mulberry(EC.hash('case' + cid));
  let sum = 0;
  for (let k = 0; k < 2000; k++) sum += EC.price(DB, EC.openCase(DB, cid, r)).v;
  return (CASE_PRICE[cid] = Math.max(50, Math.round(sum / 2000 * 1.15 / 10) * 10));
}
async function buyCase(db, uid, cid, now = Date.now()) {
  const C = DB.cases.find(c => c.id === String(cid));
  if (!C) return { error: 'no_case' };
  const price = casePrice(C.id);
  if (!(await addCoins(db, uid, -price))) return { error: 'not_enough' };
  const id = db.ref().push().key;
  await db.ref(`inventory/${uid}/cases/${id}`).set({ c: C.id, src: 'shop', at: now });
  return { ok: true, caseId: id, price };
}

const caseOf = x => (x.c && DB.cases.some(c => c.id === x.c) ? x.c : (DB.cases.find(c => (c.c || []).includes(x.k)) || {}).id || null);
function tradeUpOdds(items) {
  const out = {}, t0 = DB.items[items[0].k].t;
  let n = 0;
  for (const x of items) {
    const C = DB.cases.find(c => c.id === caseOf(x)), pool = C ? (C.c || []).filter(k => DB.items[k] && DB.items[k].t === t0 + 1) : [];
    if (!pool.length) continue;
    n++;
    for (const k of pool) out[k] = (out[k] || 0) + 1 / pool.length;
  }
  for (const k in out) out[k] /= n;
  return out;
}
async function tradeUp(db, uid, ids, now = Date.now(), r = rnd) {
  ids = [...new Set((Array.isArray(ids) ? ids : []).slice(0, 20).map(x => String(x).replace(/[.#$/[\]]/g, '_').slice(0, 64)))];
  if (ids.length !== TU_MAX) return { error: 'tu_count' };
  const items = (await Promise.all(ids.map(id => val(db.ref(`inventory/${uid}/items/${id}`))))).map((x, i) => x && { id: ids[i], ...x });
  if (items.some(x => !x || x.listed || !DB.items[x.k] || !caseOf(x))) return { error: 'tu_item' };
  const t0 = DB.items[items[0].k].t, st0 = !!items[0].st;
  if (t0 > 2 || items.some(x => DB.items[x.k].t !== t0 || !!x.st !== st0)) return { error: 'tu_mix' };
  const odds = tradeUpOdds(items), ks = Object.keys(odds);
  if (!ks.length) return { error: 'tu_item' };
  let roll = r(), k = ks[ks.length - 1];
  for (const x of ks) { roll -= odds[x]; if (roll <= 0) { k = x; break; } }
  const wear = items.reduce((s, x) => { const it = DB.items[x.k], d = (it.mx - it.mn) || 1; return s + Math.min(1, Math.max(0, (x.f - it.mn) / d)); }, 0) / items.length;
  const out = DB.items[k], id = db.ref().push().key;
  const item = { k, f: +(out.mn + wear * (out.mx - out.mn)).toFixed(6), s: Math.floor(r() * 1000), st: st0, src: 'tradeup', at: now, c: (DB.cases.find(c => (c.c || []).includes(k)) || {}).id || null };
  const taken = [];
  for (const x of items) {
    let got = null;
    await db.ref(`inventory/${uid}/items/${x.id}`).transaction(v => { got = null; if (v === null) return null; if (v.listed || v.k !== x.k) return undefined; got = v; return null; });
    if (!got) { const back = {}; for (const t of taken) back[`inventory/${uid}/items/${t.id}`] = t.v; if (taken.length) await db.ref().update(back); return { error: 'tu_item' }; }
    taken.push({ id: x.id, v: got });
  }
  await db.ref(`inventory/${uid}/items/${id}`).set(item);
  const upd = {};
  for (const x of items) upd[`stattrak/${uid}/${x.id}`] = null;
  await db.ref().update(upd);
  return { ok: true, item: { id, ...item } };
}

function skinPrice(key) {
  if (PRICES.skins[key]) return PRICES.skins[key];
  const [w, p] = key.split(':');
  const it = Object.values(DB.items).find(x => slug(x.w) === w && x.p === +p);
  if (!it) return 0;
  return it.t === 4 ? (it.g ? 3500 : 4000) : [150, 300, 600, 1200][it.t] || 300;
}
async function buyShop(db, uid, kind, ref) {
  let price, path;
  if (kind === 'skin') { ref = String(ref || ''); if (!/^[a-z0-9-]{1,40}:\d{1,6}$/.test(ref)) return { error: 'bad_item' }; price = skinPrice(ref); path = `shopOwned/${uid}/skins/${ref}`; }
  else if (kind === 'agent') { price = PRICES.agents[+ref]; path = `shopOwned/${uid}/agents/${+ref}`; }
  else if (kind === 'card') { ref = String(ref || ''); price = CARD_PRICES[ref]; path = price ? `shopOwned/${uid}/cards/${ref}` : null; }
  else if (kind === 'bg') { ref = String(ref || ''); price = BG_PRICES[ref]; path = price ? `shopOwned/${uid}/bgs/${ref}` : null; }
  else if (kind === 'pass') { price = PASS_PRICE; path = `shopOwned/${uid}/passPrem`; }
  if (!price || !path) return { error: 'bad_item' };
  let mine = false;
  await db.ref(path).transaction(x => { mine = !x; return x ? undefined : true; });
  if (!mine) return { error: 'owned' };
  const isDev = await require('./influencer').isDev(db, uid);
  if (!isDev && !(await addCoins(db, uid, -price))) { await db.ref(path).remove(); return { error: 'not_enough' }; }
  return { ok: true, price: isDev ? 0 : price, isDev };
}

function npcList(day) {
  const r = EC.mulberry(day * 131 + 7), out = [];
  for (let n = 0; n < 54; n++) {
    const C = DB.cases[Math.floor(r() * DB.cases.length)], roll = r(), tt = roll < 0.48 ? 0 : roll < 0.76 ? 1 : roll < 0.91 ? 2 : roll < 0.98 ? 3 : 4;
    const pool = tt === 4 ? ((DB.rare || {})[C.r] || C.c) : C.c.filter(k => DB.items[k].t === tt);
    if (!pool.length) continue;
    const it = EC.makeItem(DB, pool[Math.floor(r() * pool.length)], r), v = EC.price(DB, it).v;
    const price = Math.max(5, Math.round(v * (0.92 + r() * 0.3)));
    r(); r();
    out.push({ id: 'm' + day + '_' + n, ...it, price });
  }
  return out;
}
async function buyNpc(db, uid, offerId, now = Date.now()) {
  const day = Math.floor(now / 864e5), m = /^m(\d+)_(\d+)$/.exec(String(offerId || ''));
  if (!m || +m[1] !== day) return { error: 'gone' };
  const x = npcList(day).find(o => o.id === offerId);
  if (!x) return { error: 'gone' };
  const mark = db.ref(`npcBought/${uid}/${day}/${offerId}`);
  let mine = false;
  await mark.transaction(v => { mine = !v; return v ? undefined : true; });
  if (!mine) return { error: 'gone' };
  if (!(await addCoins(db, uid, -x.price))) { await mark.remove(); return { error: 'not_enough' }; }
  const id = db.ref().push().key;
  await db.ref(`inventory/${uid}/items/${id}`).set({ k: x.k, f: x.f, s: x.s, st: !!x.st, src: 'market', at: now });
  return { ok: true, itemId: id, price: x.price };
}

async function devEdit(db, uid, data = {}) {
  if (!(await require('./influencer').isDev(db, uid))) return { error: 'forbidden' };
  const id = String(data.id || '').replace(/[.#$/[\]]/g, '_').slice(0, 64), ref = db.ref(`inventory/${uid}/items/${id}`);
  const it = id && (await val(ref)), I = it && DB.items[it.k];
  if (!I) return { error: 'no_item' };
  const upd = {};
  if (data.f != null) {
    const f = Number(data.f);
    if (!Number.isFinite(f)) return { error: 'bad_wear' };
    upd.f = Math.round(Math.min(I.mx ?? 1, Math.max(I.mn ?? 0, f)) * 1e6) / 1e6;
  }
  if (data.s != null) upd.s = Math.max(0, Math.min(1000, Math.round(Number(data.s)) || 0));
  if (data.st != null) upd.st = !!data.st && !!I.st;
  if (!Object.keys(upd).length) return { error: 'nothing' };
  await ref.update(upd);
  return { ok: true, item: { id, ...it, ...upd } };
}

module.exports = { IMPORT_BEFORE, CARD_PRICES, devEdit, state, importLocal, casePrice, buyCase, tradeUp, tradeUpOdds, buyShop, skinPrice, npcList, buyNpc, grantDevCases, CAP };
