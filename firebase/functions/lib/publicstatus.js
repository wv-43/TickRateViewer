const val = async ref => (await ref.get()).val();
const MODES = ['ranked', 'wingman', 'duel'];
const canon = v => v === null || typeof v !== 'object' ? JSON.stringify(v)
  : '{' + Object.keys(v).filter(k => v[k] !== null && v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';

function build(servers, live) {
  const out = {};
  let busy = 0, liveN = 0;
  for (const [sid, s] of Object.entries(servers || {})) {
    if (!s || !/^[A-Za-z0-9_-]{1,20}$/.test(sid)) continue;
    const mid = s.status === 'busy' ? s.match : null, L = mid && live ? live[mid] : null;
    const row = { mode: MODES.includes(s.mode) ? s.mode : null, state: L ? 'live' : (s.status === 'busy' ? 'busy' : 'free') };
    if (row.state !== 'free') busy++;
    if (L) {
      liveN++;
      row.map = String(L.map || '').slice(0, 40) || null;
      row.sA = Number(L.sA) || 0; row.sB = Number(L.sB) || 0;
      row.players = Object.keys(L.players || {}).length;
    }
    out[sid] = row;
  }
  return { servers: out, live: liveN, busy, total: Object.keys(out).length };
}

async function publish(db, now = Date.now(), stats = {}) {
  const [servers, live, cur] = await Promise.all([val(db.ref('servers')), val(db.ref('liveMatches')), val(db.ref('publicStatus'))]);
  const next = { ...build(servers, live), ...stats };
  const same = cur && canon({ ...cur, at: 0 }) === canon({ ...next, at: 0 });
  if (same && now - (cur.at || 0) < 10 * 60000) return false;
  await db.ref('publicStatus').set({ ...next, at: now });
  return true;
}

module.exports = { build, publish };
