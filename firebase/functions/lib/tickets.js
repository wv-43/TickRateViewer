const { isDev } = require('./influencer');
const val = async ref => (await ref.get()).val();
const CATS = ['bug', 'idea', 'payment', 'report', 'account', 'other'];
const MAX_OPEN = 5;
const cut = (x, n) => String(x || '').trim().slice(0, n);

async function send(db, uid, data = {}, now = Date.now()) {
  const cat = CATS.includes(data.cat) ? data.cat : 'other', text = cut(data.text, 1500);
  if (text.length < 10) return { error: 'tk_short' };
  const mine = Object.keys((await val(db.ref(`ticketsBy/${uid}`))) || {});
  const open = (await Promise.all(mine.slice(-30).map(id => val(db.ref(`feedback/${id}/status`))))).filter(s => s === 'open').length;
  if (open >= MAX_OPEN) return { error: 'tk_many' };
  let ok = false;
  await db.ref(`ticketAt/${uid}`).transaction(at => { ok = !at || now - at > 60e3; return ok ? now : undefined; });
  if (!ok) return { error: 'tk_wait' };
  const p = (await val(db.ref(`profiles/${uid}`))) || {};
  const id = db.ref('feedback').push().key;
  await db.ref().update({
    [`feedback/${id}`]: { uid, steamId: p.steamId || null, name: p.name || null, cat, text, source: 'site', status: 'open', lang: cut(data.lang, 4) || null, at: now },
    [`ticketsBy/${uid}/${id}`]: true
  });
  return { ok: true, id };
}

async function mine(db, uid) {
  const ids = Object.keys((await val(db.ref(`ticketsBy/${uid}`))) || {}).slice(-20);
  const list = (await Promise.all(ids.map(async id => ({ id, ...((await val(db.ref(`feedback/${id}`))) || {}) }))))
    .filter(x => x.text).map(({ id, cat, text, source, status, reply, repliedAt, at }) => ({ id, cat: cat || 'other', text, source: source || 'game', status: status || 'open', reply: reply || null, repliedAt: repliedAt || null, at }));
  return { ok: true, tickets: list.sort((a, b) => b.at - a.at) };
}

async function reply(db, devUid, data = {}, now = Date.now()) {
  if (!(await isDev(db, devUid))) return { error: 'forbidden' };
  const id = String(data.id || '').replace(/[.#$/[\]]/g, '_').slice(0, 64), text = cut(data.reply, 1500);
  const t = id && (await val(db.ref(`feedback/${id}`)));
  if (!t) return { error: 'tk_unknown' };
  const upd = { status: data.close ? 'closed' : text ? 'answered' : t.status || 'open' };
  if (data.close) upd.closedAt = now;
  if (text) Object.assign(upd, { reply: text, repliedAt: now, repliedBy: (await val(db.ref(`profiles/${devUid}/name`))) || 'TICKRATE' });
  await db.ref(`feedback/${id}`).update(upd);
  return { ok: true, status: upd.status };
}

module.exports = { send, mine, reply, CATS };
