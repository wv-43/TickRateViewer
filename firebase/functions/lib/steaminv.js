const TTL = 10 * 60e3;
const val = async ref => (await ref.get()).val();
const WEAR = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred'];
const SKINS = require('./skin-index.json');

function parse(j) {
  const desc = new Map((j.descriptions || []).map(d => [`${d.classid}_${d.instanceid}`, d]));
  const out = [];
  for (const a of j.assets || []) {
    const d = desc.get(`${a.classid}_${a.instanceid}`);
    if (!d || !d.market_hash_name) continue;
    const type = (d.tags || []).find(x => x.category === 'Type');
    if (!type || !/^(CSGO_Type_(Pistol|SMG|Rifle|SniperRifle|Shotgun|Machinegun|Knife)|Type_Hands)$/.test(type.internal_name || '')) continue;
    const wearTag = (d.tags || []).find(x => x.category === 'Exterior');
    const wear = wearTag ? WEAR.indexOf(wearTag.localized_tag_name) : -1;
    const name = d.market_hash_name.replace(/^★\s*/, '').replace(/^StatTrak™\s*/, '').replace(/^(Souvenir|Genuine)\s*/, '').replace(/\s*\([^)]*\)\s*$/, '');
    const it = { id: String(a.assetid), name, wear, st: /StatTrak™/.test(d.market_hash_name), icon: d.icon_url || null };
    const k = SKINS[name];
    if (k) Object.assign(it, { def: k[0], p: k[1], t: k[2], mn: k[3], mx: k[4] });
    out.push(it);
  }
  return out.slice(0, 1000);
}

async function load(db, uid, fetchImpl = fetch, now = Date.now()) {
  const sid = await val(db.ref(`profiles/${uid}/steamId`));
  if (!sid) return { error: 'steam_required' };
  const cache = await val(db.ref(`steamInv/${uid}`));
  if (cache && cache.sid === sid && now - cache.at < TTL) return { ok: true, items: cache.items || [], private: !!cache.private, cached: true };
  let r;
  try { r = await fetchImpl(`https://steamcommunity.com/inventory/${sid}/730/2?l=english&count=2000`, { headers: { 'Accept': 'application/json' } }); }
  catch { return cache ? { ok: true, items: cache.items || [], private: !!cache.private, cached: true } : { error: 'steam_busy' }; }
  if (r.status === 403 || r.status === 401) {
    await db.ref(`steamInv/${uid}`).set({ sid, at: now, items: null, private: true });
    return { ok: true, items: [], private: true };
  }
  if (!r.ok) return cache ? { ok: true, items: cache.items || [], private: !!cache.private, cached: true } : { error: 'steam_busy' };
  const j = await r.json().catch(() => null);
  const items = j && j.success !== false ? parse(j) : [];
  await db.ref(`steamInv/${uid}`).set({ sid, at: now, items, private: false });
  return { ok: true, items, private: false };
}

module.exports = { load, parse, TTL };
