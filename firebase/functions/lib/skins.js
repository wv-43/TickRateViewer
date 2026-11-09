const WEAPONS = require('./weapon-index.json');
const AGENTS = require('./agent-models.json');
const num = (v, d) => (Number.isFinite(+v) ? +v : d);
const val = async ref => (await ref.get()).val();
const EC_CORE = require('./eco-core');

async function owned(db, uid) {
  const DB = require('../data/cases.json');
  const [inv, shop, steam, prof, role] = await Promise.all([
    val(db.ref(`inventory/${uid}/items`)), val(db.ref(`shopOwned/${uid}`)), val(db.ref(`steamInv/${uid}/items`)), val(db.ref(`profiles/${uid}`)), val(db.ref(`roles/${uid}`))
  ]);
  if (role === 'dev') return null;
  const dp = new Set(), st = new Set();
  for (const it of Object.values(inv || {})) {
    const I = it && !it.listed && DB.items[it.k];
    if (!I) continue;
    dp.add(`${I.d}:${I.p}`); if (it.st) st.add(`${I.d}:${I.p}`);
  }
  for (const it of Array.isArray(steam) ? steam : Object.values(steam || {})) {
    if (!it || it.def == null) continue;
    dp.add(`${it.def}:${it.p}`); if (it.st) st.add(`${it.def}:${it.p}`);
  }
  if (prof && prof.beta) for (const k of EC_CORE.betaSet(DB)) { const I = DB.items[k]; dp.add(`${I.d}:${I.p}`); }
  for (const k of Object.keys((shop && shop.skins) || {})) {
    const [wid, p] = k.split(':'), W = WEAPONS[wid];
    if (W) dp.add(`${W[0]}:${p}`);
  }
  const plan = require('./eco').planOf(prof || {});
  return { dp, st: plan === 'free' ? st : null, agents: plan === 'premium' ? null : new Set(Object.keys((shop && shop.agents) || {})) };
}

const stKey = (c, def) => String(c.iid || 'd' + def).replace(/[.#$/[\]]/g, '_').slice(0, 40);

function build(saved, counts = {}, own = null) {
  const L = (saved && saved.loadout) || {}, out = { w: [], k: {}, g: {}, a: {} };
  for (let [id, c] of Object.entries(L.w || {})) {
    const W = WEAPONS[id];
    if (!W || !c || c.p == null) continue;
    const key = `${W[0]}:${num(c.p, 0) | 0}`;
    if (own && (num(c.p, 0) | 0) !== 0 && !own.dp.has(key)) continue;
    if (own && c.st && own.st && !own.st.has(key)) c = { ...c, st: false };
    const team = c.team === 'T' || c.team === 'CT' ? c.team : 'both';
    const sk = stKey(c, W[0]);
    const e = { d: W[0], sk, stc: c.st ? Math.max(0, num(counts[sk], 0) | 0) : 0, p: num(c.p, 0) | 0, f: Math.round(Math.min(1, Math.max(0, num(c.f, 0.1))) * 1e6), s: num(c.seed, 0) | 0, st: !!c.st, tag: String(c.tag || '').replace(/[\x22\x5c]/g, '').slice(0, 20) };
    const stk = Array.isArray(c.stk) ? c.stk.slice(0, 4).map(x => (x && +x.id > 0 ? [x.id | 0, Math.round(Math.min(1, Math.max(0, num(x.wr, 0))) * 1e6)] : [0, 0])) : [];
    if (W[1] === 'gun') out.w.push({ ...e, t: team === 'T' ? 2 : team === 'CT' ? 3 : 0, ...(stk.some(x => x[0]) ? { stk } : {}) });
    else for (const tm of team === 'both' ? ['T', 'CT'] : [team]) (W[1] === 'knife' ? out.k : out.g)[tm] = e;
  }
  for (const tm of ['T', 'CT']) { const def = L.ag && L.ag[tm]; if (def && AGENTS[String(def)] && !(own && own.agents && !own.agents.has(String(def)))) out.a[tm] = AGENTS[String(def)]; }
  return out;
}

async function addStatTrak(db, uid, kills) {
  const entries = Object.entries(kills || {}).slice(0, 20);
  await Promise.all(entries.map(([k, n]) => {
    const key = String(k).replace(/[.#$/[\]]/g, '_').slice(0, 40), add = Math.min(30, Math.max(0, Number(n) | 0));
    return add ? db.ref(`stattrak/${uid}/${key}`).transaction(x => (x || 0) + add) : null;
  }));
  return { ok: true };
}

module.exports = { build, owned, addStatTrak, stKey };
