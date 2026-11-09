const TTL = 35000;
const val = async ref => (await ref.get()).val();

async function summarize(db, now = Date.now()) {
  const all = (await val(db.ref('presence'))) || {};
  const players = new Set(), searching = new Set(), stale = {};
  for (const [sid, p] of Object.entries(all)) {
    if (!p || typeof p.lastSeen !== 'number' || now - p.lastSeen >= TTL) { stale[`presence/${sid}`] = null; continue; }
    const who = p.uid || sid;
    players.add(who);
    if (p.searching) searching.add(who);
  }
  const online = players.size, queue = searching.size;
  await db.ref().update({ ...stale, Online: online });
  return { online, queue };
}

module.exports = { summarize, TTL };
