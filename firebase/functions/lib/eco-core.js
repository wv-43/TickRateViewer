(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; else root.ECO_CORE = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const ODDS = [0.7992, 0.1598, 0.0320, 0.0064, 0.0026];
  const RARITY = [
    { n: 'Mil-Spec', c: '#4b69ff' }, { n: 'Restricted', c: '#8847ff' }, { n: 'Classified', c: '#d32ce6' },
    { n: 'Covert', c: '#eb4b4b' }, { n: '★ Rare', c: '#e4ae39' }
  ];
  const ST_CHANCE = 0.10;
  const WEAR = [
    { k: 'fn', n: 'Factory New', a: 0, b: 0.07, w: 0.03 }, { k: 'mw', n: 'Minimal Wear', a: 0.07, b: 0.15, w: 0.24 },
    { k: 'ft', n: 'Field-Tested', a: 0.15, b: 0.38, w: 0.33 }, { k: 'ww', n: 'Well-Worn', a: 0.38, b: 0.45, w: 0.24 },
    { k: 'bs', n: 'Battle-Scarred', a: 0.45, b: 1, w: 0.16 }
  ];
  const wearOf = f => WEAR.find(x => f < x.b) || WEAR[4];
  const PHASE_W = { 'Phase 1': 22, 'Phase 2': 22, 'Phase 3': 22, 'Phase 4': 22, Ruby: 4, Sapphire: 4, 'Black Pearl': 2, Emerald: 4 };

  function mulberry(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const weighted = (list, wOf, rnd) => { const tot = list.reduce((s, x) => s + wOf(x), 0); let r = rnd() * tot; for (const x of list) { r -= wOf(x); if (r <= 0) return x; } return list[list.length - 1]; };

  function rollFloat(it, rnd, wearKey) {
    const cat = wearKey ? WEAR.find(w => w.k === wearKey) : weighted(WEAR, w => w.w, rnd);
    let f;
    if (wearKey) {
      const a = Math.max(cat.a, it.mn), b = Math.min(cat.b, it.mx);
      f = a < b ? a + rnd() * (b - a) : Math.min(Math.max(it.mn, cat.a), it.mx);
    } else {
      const x = cat.a + rnd() * (cat.b - cat.a);
      f = it.mn + x * (it.mx - it.mn);
    }
    return +Math.min(it.mx, Math.max(it.mn, f)).toFixed(12);
  }
  const wearsFor = it => WEAR.filter(w => w.b > it.mn && w.a < it.mx);

  function makeItem(DB, key, rnd, opts = {}) {
    const it = DB.items[key];
    return { k: key, f: rollFloat(it, rnd, opts.wear), s: Math.floor(rnd() * 1001), st: !!(opts.st ?? (it.st && rnd() < ST_CHANCE)) };
  }
  function openCase(DB, caseId, rnd = Math.random) {
    const C = DB.cases.find(c => c.id === String(caseId)); if (!C) throw new Error('caisse inconnue');
    const tier = weighted([0, 1, 2, 3, 4], t => ODDS[t], rnd);
    let key;
    if (tier === 4) {
      const pool = DB.rare[C.r] || [];
      const fin = new Map(); pool.forEach(k => { const i = DB.items[k], id = i.w + '|' + i.n; (fin.get(id) || fin.set(id, []).get(id)).push(k); });
      const group = [...fin.values()][Math.floor(rnd() * fin.size)];
      key = group.length > 1 ? weighted(group, k => PHASE_W[DB.items[k].ph] || 10, rnd) : group[0];
    } else {
      let list = C.c.filter(k => DB.items[k].t === tier);
      if (!list.length) list = C.c;
      key = list[Math.floor(rnd() * list.length)];
    }
    return { ...makeItem(DB, key, rnd), c: C.id };
  }
  function reel(DB, caseId, winner, rnd = Math.random, len = 56, win = 48) {
    const C = DB.cases.find(c => c.id === String(caseId)), out = [];
    for (let i = 0; i < len; i++) {
      if (i === win) { out.push(winner.k); continue; }
      const tier = weighted([0, 1, 2, 3, 4], t => (t === 4 ? 0.006 : ODDS[t]), rnd);
      if (tier === 4) out.push('__rare'); else { const l = C.c.filter(k => DB.items[k].t === tier); out.push((l.length ? l : C.c)[Math.floor(rnd() * (l.length || C.c.length))]); }
    }
    return out;
  }

  const DROP = {
    caseChance: { free: 0.25, plus: 0.45, premium: 0.45 }, caseWeek: { free: 3, plus: 6, premium: 6 },
    itemChance: { free: 0.12, plus: 0.20, premium: 0.20 }, itemWeek: { free: 3, plus: 5, premium: 5 },
    itemOdds: [0.80, 0.16, 0.04]
  };
  function dropCase(DB, rnd) { const list = [...DB.cases].sort((a, b) => b.y - a.y || +b.id - +a.id); return weighted(list, c => (list.indexOf(c) < 10 ? 3 : 0.3), rnd).id; }
  function dropItem(DB, rnd, opts = {}) {
    const tier = weighted([0, 1, 2], t => DROP.itemOdds[t], rnd);
    const all = [...new Set(DB.cases.flatMap(c => c.c))].filter(k => DB.items[k].t === tier);
    return makeItem(DB, all[Math.floor(rnd() * all.length)], rnd, { st: false, wear: opts.wear });
  }
  function matchDrops(DB, plan, week, rnd = Math.random) {
    const out = { cases: [], items: [] }, p = DROP.caseChance[plan] != null ? plan : 'free';
    if ((week.cases || 0) < DROP.caseWeek[p] && rnd() < DROP.caseChance[p]) out.cases.push(dropCase(DB, rnd));
    if ((week.items || 0) < DROP.itemWeek[p] && rnd() < DROP.itemChance[p]) out.items.push(dropItem(DB, rnd));
    return out;
  }

  const CH_T1 = [661, 670, 321, 151, 555, 179, 387, 868, 592, 955, 828, 617, 760, 442, 809];
  const CH_T2 = [4, 13, 32, 92, 103, 112, 147, 168, 182, 189, 209, 230, 278, 363, 463, 468, 494, 509, 541, 601, 689, 690, 695, 703, 750, 770, 811, 853, 905, 922];
  const FI = [412, 16, 146, 241, 359, 393, 541, 602, 649, 688, 701];
  const SL_H = [92, 187, 404, 597, 659, 813];
  const PH_M = { 'Phase 1': 1, 'Phase 2': 1.25, 'Phase 3': 0.95, 'Phase 4': 1.15, Ruby: 4.5, Sapphire: 5, 'Black Pearl': 3.5, Emerald: 5 };
  function pattern(DB, item) {
    const it = DB.items[item.k], s = item.s;
    if (it.ph) return { label: it.ph, m: PH_M[it.ph] || 1, tier: PH_M[it.ph] >= 3 ? 'gem' : 'ok' };
    switch (it.pt) {
      case 'ch': return CH_T1.includes(s) ? { label: 'Blue Gem', m: it.t === 4 ? 12 : 25, tier: 'gem' } : CH_T2.includes(s) ? { label: 'Blue Top', m: 2.5, tier: 'good' } : { label: null, m: 1 };
      case 'fade': { const pc = Math.round(80 + 20 * ((hash('fade' + s) % 1000) / 1000)); return { label: `Fade ${pc} %`, m: pc >= 97 ? 1.3 : pc >= 94 ? 1.12 : 1, tier: pc >= 97 ? 'good' : 'ok' }; }
      case 'mf': return FI.includes(s) ? { label: 'Fire & Ice', m: 2.5, tier: 'gem' } : { label: null, m: 1 };
      case 'web': { const w = s % 7 === 0 ? 3 : s % 3 === 0 ? 2 : 1; return { label: `${w} toile${w > 1 ? 's' : ''}`, m: w === 3 ? 2 : w === 2 ? 1.3 : 1, tier: w === 3 ? 'good' : 'ok' }; }
      case 'sl': return SL_H.includes(s) ? { label: 'Cœur', m: 1.6, tier: 'good' } : { label: null, m: 1 };
      default: return { label: null, m: 1 };
    }
  }

  function caseOfKey(DB, k) {
    if (!DB._co) { const m = {}; DB.cases.forEach(c => { c.c.forEach(x => { m[x] = m[x] || c; }); (DB.rare[c.r] || []).forEach(x => { m[x] = m[x] || c; }); }); Object.defineProperty(DB, '_co', { value: m, enumerable: false }); }
    return DB._co[k];
  }
  const BASE = [[20, 60], [90, 320], [450, 1600], [1800, 8000], [16000, 120000]];
  const POPULAR = { 'AK-47': 2.6, AWP: 2.8, 'M4A4': 2.1, 'M4A1-S': 2.2, 'Desert Eagle': 1.6, 'USP-S': 1.6, 'Glock-18': 1.4, 'Karambit': 1.5, 'Butterfly Knife': 1.6, 'M9 Bayonet': 1.35, 'Sport Gloves': 1.4, 'Specialist Gloves': 1.2 };
  const WEAR_M = { fn: 1.3, mw: 1, ft: 0.75, ww: 0.62, bs: 0.52 };
  function price(DB, item) {
    const it = DB.items[item.k], C = caseOfKey(DB, item.k);
    const [lo, hi] = BASE[it.t], h = (hash(item.k) % 1000) / 1000;
    const base = lo + (hi - lo) * h * h;
    const weapon = POPULAR[it.w] || (it.g ? 1 : ['SG 553', 'Negev', 'MAG-7', 'Sawed-Off', 'PP-Bizon', 'R8 Revolver', 'Nova'].includes(it.w) ? 0.6 : 1);
    const age = C ? 1 + Math.max(0, 2023 - +C.y) * 0.08 : 1;
    const w = wearOf(item.f), onlyOne = it.mx - it.mn < 0.08;
    let wear = onlyOne ? 1 : WEAR_M[w.k];
    if (!onlyOne && item.f < 0.01) wear *= item.f < 0.001 ? 3 : 1.5;
    const st = item.st ? (it.t === 4 ? 1.3 : 1.8) : 1;
    const pat = pattern(DB, item);
    const v = Math.max(5, Math.round(base * weapon * age * wear * st * pat.m));
    return { v, parts: { base: Math.round(base), weapon, age: +age.toFixed(2), wear: +wear.toFixed(2), st, pattern: pat.m }, pattern: pat, wear: w };
  }
  const name = (DB, item) => { const it = DB.items[item.k]; return `${it.t === 4 ? '★ ' : ''}${item.st ? 'StatTrak™ ' : ''}${it.w}${it.n !== 'Vanilla' ? ' | ' + it.n : ''}${it.ph ? ' (' + it.ph + ')' : ''}`; };
  const img = (DB, k) => { const i = DB.items[k] ? DB.items[k].i : k; return i && i[0] === '~' ? DB.pre + i.slice(1) : i; };

  let BETA = null;
  function betaSet(DB) {
    if (BETA) return BETA;
    const by = (keys, group, n) => {
      const g = new Map();
      for (const k of keys.sort((a, b) => hash('beta:' + a) - hash('beta:' + b))) { const w = DB.items[k][group]; if (!g.has(w)) g.set(w, k); }
      return [...g.values()].slice(0, n);
    };
    const ks = Object.keys(DB.items).filter(k => !/^(sk|stm)_/.test(k));
    const guns = by(ks.filter(k => DB.items[k].t === 2 || DB.items[k].t === 3), 'w', 999);
    const knives = by(ks.filter(k => DB.items[k].t === 4 && !DB.items[k].g), 'w', 4);
    const gloves = by(ks.filter(k => DB.items[k].t === 4 && DB.items[k].g), 'w', 3);
    return (BETA = [...guns, ...knives, ...gloves]);
  }

  return { betaSet, caseOfKey, ODDS, RARITY, WEAR, wearOf, wearsFor, ST_CHANCE, DROP, mulberry, hash, rollFloat, makeItem, openCase, reel, matchDrops, dropCase, dropItem, pattern, price, name, img };
});
