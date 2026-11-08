// =====================================================================
//  Demandes d'ami et liste d'amis, écrites par le serveur (avant : directement par le site, ce qui
//  dépendait des règles de la base et pouvait échouer en silence). Même format que le site :
//  boîtes = pseudo en minuscules (fbMailbox) ; friendRequests/<cible>/<moi>, friends/<moi>/<ami>,
//  friendAccepts/<cible>/<moi> (notification d'acceptation).
// =====================================================================
const val = async ref => (await ref.get()).val();
const box = n => String(n || '').trim().toLowerCase().replace(/[.#$/[\]:\s]/g, '_');
const okCol = c => (typeof c === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : null);
const okImg = u => (typeof u === 'string' && u.length <= 300000 && /^(data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+|https:\/\/[^'"()<>\s\\]+)$/.test(u) ? u : null);

// mon profil (pseudo, ELO, avatar) + couleur choisie sur le site
async function me(db, uid, d) {
  const p = (await val(db.ref(`profiles/${uid}`))) || {};
  if (!p.name) return null;
  return { name: p.name, box: box(p.name), elo: typeof p.elo === 'number' ? p.elo : 1000, avatar: okImg(p.avatar) || okImg(d.avatar), color: okCol(d.color), country: String(p.country || 'FR').slice(0, 2) };
}
async function target(db, name) {
  const b = box(name); if (!b) return null;
  const uid = await val(db.ref(`usernames/${b}`)); if (!uid) return null;
  const p = (await val(db.ref(`profiles/${uid}`))) || {};
  return p.name ? { uid, name: p.name, box: box(p.name), elo: typeof p.elo === 'number' ? p.elo : 1000, avatar: okImg(p.avatar), country: String(p.country || 'FR').slice(0, 2) } : null;
}
const card = x => ({ name: x.name, elo: x.elo, color: x.color || null, avatar: x.avatar || null, country: x.country, addedAt: Date.now() });

async function send(db, uid, d = {}, now = Date.now()) {
  const rl = await require('./rate').limit(db, uid, 'friend', now); if (rl) return rl;
  const m = await me(db, uid, d), t = await target(db, d.name);
  if (!m) return { error: 'profile_missing' };
  if (!t) return { error: 'player_not_found' };
  if (t.uid === uid) return { error: 'cannot_add_self' };
  if (await val(db.ref(`friends/${m.box}/${t.box}`))) return { error: 'already_friends' };
  // la cible m'avait déjà demandé : on devient amis directement
  if (await val(db.ref(`friendRequests/${m.box}/${t.box}`))) return accept(db, uid, { ...d, name: t.name }, now);
  await db.ref(`friendRequests/${t.box}/${m.box}`).set({ from: m.name, fromMailbox: m.box, elo: m.elo, color: m.color, avatar: m.avatar, country: m.country, at: now });
  return { ok: true, sent: t.name };
}
async function accept(db, uid, d = {}, now = Date.now()) {
  const m = await me(db, uid, d), t = await target(db, d.name);
  if (!m || !t) return { error: 'player_not_found' };
  const req = await val(db.ref(`friendRequests/${m.box}/${t.box}`));
  if (!req) return { error: 'request_not_found' };
  await db.ref().update({
    [`friendRequests/${m.box}/${t.box}`]: null, [`friendRequests/${t.box}/${m.box}`]: null,
    [`friends/${m.box}/${t.box}`]: card({ ...t, color: okCol(req.color) }),
    [`friends/${t.box}/${m.box}`]: card(m),
    [`friendAccepts/${t.box}/${m.box}`]: { from: m.name, fromMailbox: m.box, elo: m.elo, color: m.color, avatar: m.avatar, country: m.country, at: now }
  });
  return { ok: true, friend: { name: t.name, elo: t.elo, avatar: t.avatar, country: t.country } };
}
async function decline(db, uid, d = {}) {
  const m = await me(db, uid, d); if (!m) return { error: 'profile_missing' };
  await db.ref(`friendRequests/${m.box}/${box(d.name)}`).remove();
  return { ok: true };
}
async function cancel(db, uid, d = {}) {
  const m = await me(db, uid, d); if (!m) return { error: 'profile_missing' };
  await db.ref(`friendRequests/${box(d.name)}/${m.box}`).remove();
  return { ok: true };
}
async function remove(db, uid, d = {}) {
  const m = await me(db, uid, d); if (!m) return { error: 'profile_missing' };
  const b = box(d.name);
  await db.ref().update({ [`friends/${m.box}/${b}`]: null, [`friends/${b}/${m.box}`]: null });
  return { ok: true };
}

module.exports = { send, accept, decline, cancel, remove, box };
