async function hit(db, uid, type, max, win, now = Date.now()) {
  let ok = false;
  await db.ref(`rate/${type}/${uid}`).transaction(x => {
    if (!x || now - (x.t || 0) > win) { ok = true; return { n: 1, t: now }; }
    if (x.n >= max) { ok = false; return x; }
    ok = true; return { n: x.n + 1, t: x.t };
  });
  return ok;
}
const H = 3600e3;
const LIMITS = { friend: [30, H], teamInvite: [30, H], challenge: [20, H], lookup: [60, H], ticketReply: [60, H] };
async function limit(db, uid, type, now = Date.now()) {
  const [max, win] = LIMITS[type] || [60, H];
  return (await hit(db, uid, type, max, win, now)) ? null : { error: 'rate_limited' };
}
module.exports = { hit, limit, LIMITS };
