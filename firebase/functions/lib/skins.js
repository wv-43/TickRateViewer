// Équipement d'un joueur pour le plugin tickrate_skins (gameApi GET /skins?steamId=…)
// Lu dans loadouts/<uid> (écrit par l'inventaire du site) et traduit en numéros du jeu :
//   w : armes { d: defindex, p: paint, f: usure en millionièmes (entier : le plugin lit mal les réels), s: pattern, st: StatTrak, tag: name tag, t: 0 = T et CT, 2 = T, 3 = CT }
//      stk : autocollants [[id, usure µ], …] par emplacement (posés si l'extension PTaH est installée)
//   k / g : couteau / gants par camp { T: {…}, CT: {…} }
//   a : modèle d'agent par camp { T: 'models/player/…mdl', CT: … }
const WEAPONS = require('./weapon-index.json');   // id du site (« ak-47 ») -> [defindex, 'gun' | 'knife' | 'gloves']
const AGENTS = require('./agent-models.json');    // defindex d'agent -> modèle CS:GO
const num = (v, d) => (Number.isFinite(+v) ? +v : d);
const val = async ref => (await ref.get()).val();
const EC_CORE = require('./eco-core');

// ce que le joueur possède vraiment (le site écrit loadouts/<uid> lui-même : on ne lui fait pas confiance) :
// objets de l'inventaire TICKRATE, skins de la boutique, inventaire Steam (cache), agents achetés ou PREMIUM ; dev = tout
async function owned(db, uid) {
  const DB = require('../data/cases.json');
  const [inv, shop, steam, prof, role] = await Promise.all([
    val(db.ref(`inventory/${uid}/items`)), val(db.ref(`shopOwned/${uid}`)), val(db.ref(`steamInv/${uid}/items`)), val(db.ref(`profiles/${uid}`)), val(db.ref(`roles/${uid}`))
  ]);
  if (role === 'dev') return null;                       // null = pas de filtre
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
  if (prof && prof.beta) for (const k of EC_CORE.betaSet(DB)) { const I = DB.items[k]; dp.add(`${I.d}:${I.p}`); }   // rôle Bêta testeur
  for (const k of Object.keys((shop && shop.skins) || {})) {
    const [wid, p] = k.split(':'), W = WEAPONS[wid];
    if (W) dp.add(`${W[0]}:${p}`);
  }
  const plan = require('./eco').planOf(prof || {});
  // StatTrak : sur tout skin possédé pour PLUS et PREMIUM (avantage du plan), sinon seulement les exemplaires StatTrak
  return { dp, st: plan === 'free' ? st : null, agents: plan === 'premium' ? null : new Set(Object.keys((shop && shop.agents) || {})) };
}

// clé du compteur StatTrak : l'exemplaire (iid) s'il existe, sinon l'arme (« d7 » = AK-47)
const stKey = (c, def) => String(c.iid || 'd' + def).replace(/[.#$/[\]]/g, '_').slice(0, 40);

function build(saved, counts = {}, own = null) {
  const L = (saved && saved.loadout) || {}, out = { w: [], k: {}, g: {}, a: {} };
  for (let [id, c] of Object.entries(L.w || {})) {
    const W = WEAPONS[id];
    if (!W || !c || c.p == null) continue;
    const key = `${W[0]}:${num(c.p, 0) | 0}`;
    if (own && (num(c.p, 0) | 0) !== 0 && !own.dp.has(key)) continue;   // skin pas possédé : arme d'origine
    if (own && c.st && own.st && !own.st.has(key)) c = { ...c, st: false };
    const team = c.team === 'T' || c.team === 'CT' ? c.team : 'both';
    const sk = stKey(c, W[0]);
    const e = { d: W[0], sk, stc: c.st ? Math.max(0, num(counts[sk], 0) | 0) : 0, p: num(c.p, 0) | 0, f: Math.round(Math.min(1, Math.max(0, num(c.f, 0.1))) * 1e6), s: num(c.seed, 0) | 0, st: !!c.st, tag: String(c.tag || '').replace(/[\x22\x5c]/g, '').slice(0, 20) };
    // autocollants : [id, usure en millionièmes] par emplacement (0 = vide), 4 emplacements
    const stk = Array.isArray(c.stk) ? c.stk.slice(0, 4).map(x => (x && +x.id > 0 ? [x.id | 0, Math.round(Math.min(1, Math.max(0, num(x.wr, 0))) * 1e6)] : [0, 0])) : [];
    if (W[1] === 'gun') out.w.push({ ...e, t: team === 'T' ? 2 : team === 'CT' ? 3 : 0, ...(stk.some(x => x[0]) ? { stk } : {}) });
    else for (const tm of team === 'both' ? ['T', 'CT'] : [team]) (W[1] === 'knife' ? out.k : out.g)[tm] = e;
  }
  for (const tm of ['T', 'CT']) { const def = L.ag && L.ag[tm]; if (def && AGENTS[String(def)] && !(own && own.agents && !own.agents.has(String(def)))) out.a[tm] = AGENTS[String(def)]; }
  return out;
}

// kills StatTrak envoyés par le plugin (fin de round) : { clé: n }, ajoutés aux compteurs du joueur
async function addStatTrak(db, uid, kills) {
  const entries = Object.entries(kills || {}).slice(0, 20);
  await Promise.all(entries.map(([k, n]) => {
    const key = String(k).replace(/[.#$/[\]]/g, '_').slice(0, 40), add = Math.min(30, Math.max(0, Number(n) | 0));
    return add ? db.ref(`stattrak/${uid}/${key}`).transaction(x => (x || 0) + add) : null;
  }));
  return { ok: true };
}

module.exports = { build, owned, addStatTrak, stKey };
