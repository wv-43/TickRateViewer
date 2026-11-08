// =====================================================================
//  Rooms privées (comptes dev) : le dev invite qui il veut, choisit le mode (5v5 / Wingman), la map, le nombre
//  de rounds, les équipes, et lance avec le nombre de joueurs qu'il veut (places vides : bots, au choix).
//  Le match lancé est un match « de test » (pas d'ELO, sauf « fin réelle »), donc sans ban ni file d'attente.
//  rooms/<rid>        { owner, ownerName, mode, map, rounds, real, bots, status:'open'|'started', matchId?,
//                       members: { uid: { name, team:'A'|'B', lang, at } }, invited: { uid: name }, at }
//  roomOf/<uid>       rid de la room du joueur (lisible par lui)
//  roomInv/<uid>/<rid> { from, at }   invitations reçues (lisibles par lui)
// =====================================================================
const val = async ref => (await ref.get()).val();
const { COMP_CANDIDATES, WINGMAN_POOL, DUEL_POOL, rid } = require('./core');
const { isDev } = require('./influencer');
const trades = require('./trades');
const key = x => String(x || '').replace(/[.#$/[\]]/g, '_').slice(0, 64);
const SIZE = { ranked: 5, wingman: 2, duel: 1 };
const pool = mode => (mode === 'duel' ? DUEL_POOL : mode === 'wingman' ? WINGMAN_POOL : COMP_CANDIDATES);   // salons de test : toutes les maps 5v5 du jeu
const langOf = l => (['fr', 'en', 'ru'].includes(l) ? l : null);

async function load(db, id) { const r = id && (await val(db.ref(`rooms/${key(id)}`))); return r ? { id: key(id), ...r } : null; }
const ownerOnly = (r, uid) => (!r ? { error: 'room_unknown' } : r.owner !== uid ? { error: 'forbidden' } : null);

async function create(db, uid, d = {}, now = Date.now()) {
  if (!(await isDev(db, uid))) return { error: 'forbidden' };
  const cur = await val(db.ref(`roomOf/${uid}`));
  if (cur && (await load(db, cur))) return get(db, uid);
  const p = (await val(db.ref(`profiles/${uid}`))) || {};
  const mode = d.mode === 'duel' ? 'duel' : (d.mode === 'wingman' ? 'wingman' : 'ranked'), id = 'r_' + rid(8);
  const room = { owner: uid, ownerName: p.name || 'Dev', mode, map: pool(mode)[0], rounds: 16, real: false, bots: true, status: 'open', at: now,
    members: { [uid]: { name: p.name || 'Dev', team: 'A', lang: langOf(d.lang), at: now } } };
  await db.ref().update({ [`rooms/${id}`]: room, [`roomOf/${uid}`]: id });
  return get(db, uid);
}

// réglages (propriétaire, room pas encore lancée)
async function settings(db, uid, d = {}) {
  const r = await load(db, d.rid), e = ownerOnly(r, uid); if (e) return e;
  if (r.status !== 'open') return { error: 'room_started' };
  const upd = {};
  if (d.mode != null) { upd.mode = d.mode === 'duel' ? 'duel' : (d.mode === 'wingman' ? 'wingman' : 'ranked'); if (!pool(upd.mode).includes(r.map)) upd.map = pool(upd.mode)[0]; }
  if (d.map != null) { const m = String(d.map); if (!pool(upd.mode || r.mode).includes(m)) return { error: 'bad_map' }; upd.map = m; }
  if (d.rounds != null) upd.rounds = Math.min(30, Math.max(2, (Number(d.rounds) || 16) & ~1));
  if (d.real != null) upd.real = !!d.real;
  if (d.bots != null) upd.bots = !!d.bots;
  await db.ref(`rooms/${r.id}`).update(upd);
  return get(db, uid);
}

async function invite(db, uid, d = {}, now = Date.now()) {
  const r = await load(db, d.rid), e = ownerOnly(r, uid); if (e) return e;
  const lk = await trades.lookup(db, d.name);
  if (lk.error) return lk;
  if (lk.uid === uid || (r.members || {})[lk.uid]) return { error: 'room_already' };
  if (Object.keys(r.members || {}).length + Object.keys(r.invited || {}).length >= 10) return { error: 'room_full' };
  const name = (await val(db.ref(`profiles/${lk.uid}/name`))) || String(d.name);
  await db.ref().update({ [`rooms/${r.id}/invited/${lk.uid}`]: name, [`roomInv/${lk.uid}/${r.id}`]: { from: r.ownerName, at: now } });
  return get(db, uid);
}

async function join(db, uid, d = {}, now = Date.now()) {
  const r = await load(db, d.rid);
  if (!r) { await db.ref(`roomInv/${uid}/${key(d.rid)}`).remove(); return { error: 'room_unknown' }; }
  if (!(r.invited || {})[uid]) return { error: 'room_not_invited' };
  const cur = await val(db.ref(`roomOf/${uid}`));
  if (cur && cur !== r.id && (await load(db, cur))) return { error: 'room_other' };
  if (await val(db.ref(`userMatch/${uid}`))) return { error: 'in_match' };
  const p = (await val(db.ref(`profiles/${uid}`))) || {}, ms = Object.values(r.members || {});
  const team = ms.filter(m => m.team === 'A').length <= ms.filter(m => m.team === 'B').length ? 'A' : 'B';
  await db.ref().update({
    [`rooms/${r.id}/members/${uid}`]: { name: p.name || r.invited[uid], team, lang: langOf(d.lang), at: now },
    [`rooms/${r.id}/invited/${uid}`]: null, [`roomInv/${uid}/${r.id}`]: null, [`roomOf/${uid}`]: r.id
  });
  return get(db, uid);
}

async function decline(db, uid, d = {}) {
  const id = key(d.rid);
  await db.ref().update({ [`roomInv/${uid}/${id}`]: null, ...((await load(db, id)) ? { [`rooms/${id}/invited/${uid}`]: null } : {}) });
  return { ok: true };
}

// quitter : le propriétaire ferme la room pour tout le monde
async function leave(db, uid, d = {}) {
  const r = await load(db, d.rid || (await val(db.ref(`roomOf/${uid}`))));
  if (!r) { await db.ref(`roomOf/${uid}`).remove(); return { ok: true }; }
  if (r.owner === uid) {
    const upd = { [`rooms/${r.id}`]: null };
    for (const u of Object.keys(r.members || {})) upd[`roomOf/${u}`] = null;
    for (const u of Object.keys(r.invited || {})) upd[`roomInv/${u}/${r.id}`] = null;
    await db.ref().update(upd);
  } else await db.ref().update({ [`rooms/${r.id}/members/${uid}`]: null, [`roomOf/${uid}`]: null });
  return { ok: true };
}

async function kick(db, uid, d = {}) {
  const r = await load(db, d.rid), e = ownerOnly(r, uid); if (e) return e;
  const t = key(d.uid); if (t === uid) return { error: 'forbidden' };
  await db.ref().update({ [`rooms/${r.id}/members/${t}`]: null, [`roomOf/${t}`]: null, [`rooms/${r.id}/invited/${t}`]: null, [`roomInv/${t}/${r.id}`]: null });
  return get(db, uid);
}

async function team(db, uid, d = {}) {
  const r = await load(db, d.rid), e = ownerOnly(r, uid); if (e) return e;
  const t = key(d.uid); if (!(r.members || {})[t]) return { error: 'room_unknown' };
  await db.ref(`rooms/${r.id}/members/${t}/team`).set(d.team === 'B' ? 'B' : 'A');
  return get(db, uid);
}

// lancer : un match « de test » avec les membres de la room, leurs équipes, la map et les rounds choisis
async function start(db, uid, d = {}, now = Date.now()) {
  const mm = require('./mm');
  const r = await load(db, d.rid), e = ownerOnly(r, uid); if (e) return e;
  if (r.status === 'started') return { error: 'room_started' };
  const ids = Object.keys(r.members || {}), size = SIZE[r.mode];
  const A = ids.filter(u => r.members[u].team === 'A'), B = ids.filter(u => r.members[u].team === 'B');
  if (A.length > size || B.length > size) return { error: 'room_team_size' };
  if (!A.length) return { error: 'room_team_empty' };
  const players = {};
  for (const u of ids) {
    const p = (await val(db.ref(`profiles/${u}`))) || {};
    if (!p.steamLinked || !p.steamId) return { error: 'room_steam', name: r.members[u].name };
    if (await val(db.ref(`userMatch/${u}`))) return { error: 'room_in_match', name: r.members[u].name };
    players[u] = { name: p.name || r.members[u].name, elo: mm.eloOf(p, r.mode), steamId: p.steamId, team: r.members[u].team, accepted: true, q: { region: 'EU', mode: r.mode, lang: r.members[u].lang || null } };
  }
  const mid = 'm_' + rid(8);
  const m = { status: 'waiting_server', test: true, private: true, room: r.id, testReal: !!r.real, fill: !!r.bots, rounds: r.rounds, mode: r.mode, region: 'EU', createdAt: now, waitingSince: now, map: r.map, players, A, B };
  const upd = { [`matches/${mid}`]: m, [`activeMatches/${mid}`]: now, [`rooms/${r.id}/status`]: 'started', [`rooms/${r.id}/matchId`]: mid };
  for (const u of ids) upd[`userMatch/${u}`] = mid;
  await db.ref().update(upd);
  await mm.assignServer(db, mid, now);
  return { ok: true, matchId: mid };
}

// état pour le site : ma room (si j'en ai une) et mes invitations ; une room dont le match est fini se rouvre
async function get(db, uid) {
  const [cur, inv] = await Promise.all([val(db.ref(`roomOf/${uid}`)), val(db.ref(`roomInv/${uid}`))]);
  let r = await load(db, cur);
  if (cur && !r) await db.ref(`roomOf/${uid}`).remove();
  if (r && r.status === 'started') {
    const st = await val(db.ref(`matches/${r.matchId}/status`));
    if (!st || st === 'finished' || st === 'cancelled') { await db.ref(`rooms/${r.id}`).update({ status: 'open', matchId: null }); r = { ...r, status: 'open', matchId: null }; }
  }
  const invites = Object.entries(inv || {}).map(([id, x]) => ({ rid: id, from: x.from, at: x.at }));
  return { ok: true, room: r ? { ...r, me: uid, pools: { ranked: COMP_CANDIDATES, wingman: WINGMAN_POOL, duel: DUEL_POOL }, size: SIZE[r.mode] } : null, invites };
}

module.exports = { create, settings, invite, join, decline, leave, kick, team, start, get, SIZE };
