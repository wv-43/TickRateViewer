const { MAP_POOL, COMP_CANDIDATES } = require('./core');
const val = async ref => (await ref.get()).val();
const POOL_SIZE = 7, MIN_VOTERS = 3;

const period = (now = Date.now()) => new Date(now).toISOString().slice(0, 7);
const prevPeriod = (now = Date.now()) => { const d = new Date(now); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1); return period(d.getTime()); };
const cleanPool = maps => {
  const arr = Array.isArray(maps) ? maps : maps && typeof maps === 'object' ? Object.values(maps) : [];
  const ok = [...new Set(arr)].filter(m => COMP_CANDIDATES.includes(m));
  return ok.length === POOL_SIZE ? ok : null;
};
async function curPool(db) {
  return cleanPool(await val(db.ref('config/mapPool/maps'))) || MAP_POOL.slice();
}

async function vote(db, uid, data, now = Date.now()) {
  const raw = Array.isArray(data?.maps) ? data.maps : [];
  const maps = [...new Set(raw.map(String))];
  if (!maps.length || maps.length > POOL_SIZE || maps.length !== raw.length || !maps.every(m => COMP_CANDIDATES.includes(m))) return { error: 'bad_maps' };
  const p = await val(db.ref(`profiles/${uid}`));
  if (!p) return { error: 'no_profile' };
  if (!p.steamLinked) return { error: 'steam_required' };
  const per = period(now), ref = db.ref(`mapVotes/${per}/${uid}`);
  const old = ((await val(ref)) || {}).maps || [];
  await ref.set({ maps, at: now });
  await db.ref(`mapVoteCounts/${per}`).transaction(c => {
    c = c || { voters: 0, maps: {} }; c.maps = c.maps || {};
    if (!old.length) c.voters = (c.voters || 0) + 1;
    for (const m of old) c.maps[m] = Math.max(0, (c.maps[m] || 0) - 1);
    for (const m of maps) c.maps[m] = (c.maps[m] || 0) + 1;
    return c;
  });
  return { ok: true, period: per, maps };
}

function tally(votes, current = []) {
  const counts = Object.fromEntries(COMP_CANDIDATES.map(m => [m, 0]));
  let voters = 0;
  for (const v of Object.values(votes || {})) {
    const maps = [...new Set(Array.isArray(v?.maps) ? v.maps : [])].filter(m => COMP_CANDIDATES.includes(m)).slice(0, POOL_SIZE);
    if (!maps.length) continue;
    voters++;
    for (const m of maps) counts[m]++;
  }
  const rank = [...COMP_CANDIDATES].sort((a, b) => counts[b] - counts[a] || (current.includes(b) - current.includes(a)) || COMP_CANDIDATES.indexOf(a) - COMP_CANDIDATES.indexOf(b));
  return { counts, voters, top: rank.slice(0, POOL_SIZE) };
}

async function rotate(db, now = Date.now()) {
  const per = prevPeriod(now), current = await curPool(db);
  const done = await val(db.ref('config/mapPool/period'));
  if (done === per) return { ok: true, skipped: 'already_done' };
  const r = tally(await val(db.ref(`mapVotes/${per}`)), current);
  const changed = r.voters >= MIN_VOTERS;
  const maps = changed ? r.top : current;
  const added = maps.filter(m => !current.includes(m)), removed = current.filter(m => !maps.includes(m));
  await db.ref().update({
    'config/mapPool': { maps, period: per, voters: r.voters, counts: r.counts, applied: changed, at: now, added, removed },
    [`publicNews/maps/${per}`]: { maps, voters: r.voters, counts: r.counts, applied: changed, at: now, added, removed }
  });
  return { ok: true, period: per, maps, voters: r.voters, applied: changed };
}

module.exports = { vote, tally, rotate, curPool, period, prevPeriod, POOL_SIZE, MIN_VOTERS };
