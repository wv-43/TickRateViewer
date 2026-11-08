// =====================================================================
//  Clans : communautés de joueurs (jusqu'à 50), séparées des équipes de ligue (comp.js, lineups de 5).
//  Un membre peut « équiper » le tag du clan : il s'affiche alors devant son nom dans le tableau des scores
//  en jeu (envoyé au serveur dans le roster du match, appliqué par le plugin tickrate_match).
//
//  clans/<cid>        { name, tag, desc, color, owner, open, points, w, l, at,
//                       members:{ uid:{ name, role:'owner'|'officer'|'member', at } } }
//  clanOf/<uid>       cid                     clanTags/<TAG>   cid
//  clanReq/<cid>/<uid>  { name, at }          demande d'entrée (clan sur demande)
//  clanReqOf/<uid>/<cid>  true                 ses demandes en cours (pour les annuler)
//  profiles/<uid>/clanTagOff  true            tag déséquipé (absent = équipé)
//
//  Points : +25 par match classé gagné, +5 par match joué et perdu (pas les matchs de test ni privés).
// =====================================================================
const val = async ref => (await ref.get()).val();
const { rid } = require('./core');
const key = x => String(x || '').replace(/[.#$/[\]]/g, '_').slice(0, 64);

const MAX_MEMBERS = 50, MAX_REQS = 30, PTS_WIN = 25, PTS_LOSS = 5;
const COLORS = ['#f5f5f5', '#c4562a', '#3b6fd6', '#2e9d6c', '#7a5cc4', '#c9424d', '#c08a1e', '#2b8f80', '#b0447a'];
const levelOf = pts => Math.min(50, 1 + Math.floor(Math.sqrt(Math.max(0, pts || 0) / 50)));
const rankOf = (c, uid) => ((c && c.members) || {})[uid]?.role || null;
const isStaff = (c, uid) => ['owner', 'officer'].includes(rankOf(c, uid));
const cleanDesc = s => String(s || '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);

async function loadClan(db, cid) { const c = cid && (await val(db.ref(`clans/${key(cid)}`))); return c ? { id: key(cid), ...c } : null; }
async function clanOf(db, uid) { return loadClan(db, await val(db.ref(`clanOf/${uid}`))); }
const summary = c => ({ id: c.id, name: c.name, tag: c.tag, desc: c.desc || '', color: c.color, open: !!c.open,
  points: c.points || 0, level: levelOf(c.points), w: c.w || 0, l: c.l || 0, n: Object.keys(c.members || {}).length, max: MAX_MEMBERS, at: c.at });

// ---------- lecture ----------
async function get(db, uid) {
  const c = await clanOf(db, uid), p = (await val(db.ref(`profiles/${uid}`))) || {};
  const myReqs = Object.keys((await val(db.ref(`clanReqOf/${uid}`))) || {});
  const out = { clan: null, role: null, tagOn: !p.clanTagOff, myReqs, max: MAX_MEMBERS };
  if (c) {
    out.clan = { ...summary(c), owner: c.owner, members: Object.entries(c.members || {}).map(([u, m]) => ({ uid: u, name: m.name, role: m.role, at: m.at })) };
    out.role = rankOf(c, uid);
    if (isStaff(c, uid)) out.requests = Object.entries((await val(db.ref(`clanReq/${c.id}`))) || {}).map(([u, r]) => ({ uid: u, name: r.name, at: r.at }));
  }
  return out;
}
async function list(db, uid, d = {}) {
  const all = (await val(db.ref('clans'))) || {};
  const q = String(d.q || '').trim().toLowerCase().slice(0, 30);
  let rows = Object.entries(all).filter(([, c]) => c && c.tag).map(([id, c]) => summary({ id, ...c }));
  if (q) rows = rows.filter(c => c.name.toLowerCase().includes(q) || c.tag.toLowerCase().includes(q));
  if (d.open) rows = rows.filter(c => c.open && c.n < c.max);
  const sort = { points: (a, b) => b.points - a.points, members: (a, b) => b.n - a.n, new: (a, b) => b.at - a.at }[d.sort] || ((a, b) => b.points - a.points);
  rows.sort(sort);
  // rang toujours calculé sur les points, quel que soit le tri affiché
  const byPts = [...rows].sort((a, b) => b.points - a.points || a.at - b.at);
  byPts.forEach((c, i) => { c.rank = i + 1; });
  return { clans: rows.slice(0, 100), total: rows.length };
}

// ---------- création, entrée, sortie ----------
async function create(db, uid, d = {}, now = Date.now()) {
  if (await val(db.ref(`clanOf/${uid}`))) return { error: 'clan_already' };
  const p = (await val(db.ref(`profiles/${uid}`))) || {};
  if (!p.name) return { error: 'no_profile' };
  const name = String(d.name || '').trim(), tag = String(d.tag || '').trim().toUpperCase();
  if (!/^[A-Za-z0-9 _.\-]{3,24}$/.test(name)) return { error: 'clan_bad_name' };
  if (!/^[A-Z0-9]{2,5}$/.test(tag)) return { error: 'clan_bad_tag' };
  const cid = 'c_' + rid(8);
  let got = false;
  await db.ref(`clanTags/${tag}`).transaction(x => { got = !x; return x || cid; });
  if (!got) return { error: 'clan_tag_taken' };
  await db.ref().update({
    [`clans/${cid}`]: { name, tag, desc: cleanDesc(d.desc), color: COLORS.includes(d.color) ? d.color : COLORS[0], owner: uid, open: d.open !== false,
      points: 0, w: 0, l: 0, at: now, members: { [uid]: { name: p.name, role: 'owner', at: now } } },
    [`clanOf/${uid}`]: cid, [`profiles/${uid}/clanTagOff`]: null
  });
  await dropReqs(db, uid);
  return get(db, uid);
}
async function dropReqs(db, uid) {
  const mine = Object.keys((await val(db.ref(`clanReqOf/${uid}`))) || {});
  if (!mine.length) return;
  const upd = { [`clanReqOf/${uid}`]: null };
  for (const c of mine) upd[`clanReq/${c}/${uid}`] = null;
  await db.ref().update(upd);
}
async function addMember(db, c, uid, name, now) {
  let ok = false;
  await db.ref(`clans/${c.id}/members`).transaction(m => {
    m = m || {}; ok = false;
    if (m[uid] || Object.keys(m).length >= MAX_MEMBERS) return m;
    m[uid] = { name, role: 'member', at: now }; ok = true; return m;
  });
  if (!ok) return false;
  await db.ref().update({ [`clanOf/${uid}`]: c.id, [`profiles/${uid}/clanTagOff`]: null });
  await dropReqs(db, uid);
  return true;
}
// clan ouvert : entrée directe ; sinon : demande, à accepter par le chef ou un officier
async function join(db, uid, d = {}, now = Date.now()) {
  if (await val(db.ref(`clanOf/${uid}`))) return { error: 'clan_already' };
  const c = await loadClan(db, d.cid); if (!c) return { error: 'clan_unknown' };
  const p = (await val(db.ref(`profiles/${uid}`))) || {};
  if (!p.name) return { error: 'no_profile' };
  if (Object.keys(c.members || {}).length >= MAX_MEMBERS) return { error: 'clan_full' };
  if (c.open) { if (!(await addMember(db, c, uid, p.name, now))) return { error: 'clan_full' }; return get(db, uid); }
  const reqs = (await val(db.ref(`clanReq/${c.id}`))) || {};
  if (!reqs[uid] && Object.keys(reqs).length >= MAX_REQS) return { error: 'clan_reqs_full' };
  await db.ref().update({ [`clanReq/${c.id}/${uid}`]: { name: p.name, at: now }, [`clanReqOf/${uid}/${c.id}`]: true });
  return { ...(await get(db, uid)), requested: c.id };
}
async function cancelReq(db, uid, d = {}) {
  const cid = key(d.cid);
  await db.ref().update({ [`clanReq/${cid}/${uid}`]: null, [`clanReqOf/${uid}/${cid}`]: null });
  return get(db, uid);
}
async function answer(db, uid, d = {}, now = Date.now()) {
  const c = await clanOf(db, uid); if (!isStaff(c, uid)) return { error: 'forbidden' };
  const u = key(d.uid), r = await val(db.ref(`clanReq/${c.id}/${u}`));
  if (!r) return { error: 'clan_unknown' };
  await db.ref().update({ [`clanReq/${c.id}/${u}`]: null, [`clanReqOf/${u}/${c.id}`]: null });
  if (d.accept) {
    if (await val(db.ref(`clanOf/${u}`))) return { error: 'clan_other' };
    if (!(await addMember(db, c, u, r.name, now))) return { error: 'clan_full' };
  }
  return get(db, uid);
}
async function disbandClan(db, c) {
  const upd = { [`clans/${c.id}`]: null, [`clanTags/${c.tag}`]: null, [`clanReq/${c.id}`]: null };
  for (const u of Object.keys(c.members || {})) upd[`clanOf/${u}`] = null;
  for (const u of Object.keys((await val(db.ref(`clanReq/${c.id}`))) || {})) upd[`clanReqOf/${u}/${c.id}`] = null;
  await db.ref().update(upd);
}
async function leave(db, uid) {
  const c = await clanOf(db, uid); if (!c) return get(db, uid);
  const others = Object.entries(c.members || {}).filter(([u]) => u !== uid);
  if (!others.length) { await disbandClan(db, c); return get(db, uid); }
  const upd = { [`clans/${c.id}/members/${uid}`]: null, [`clanOf/${uid}`]: null };
  if (c.owner === uid) {          // le chef part : un officier (le plus ancien), sinon le membre le plus ancien, prend la tête
    const next = others.sort((a, b) => (a[1].role === 'officer' ? 0 : 1) - (b[1].role === 'officer' ? 0 : 1) || (a[1].at || 0) - (b[1].at || 0))[0][0];
    upd[`clans/${c.id}/owner`] = next; upd[`clans/${c.id}/members/${next}/role`] = 'owner';
  }
  await db.ref().update(upd);
  return get(db, uid);
}
async function disband(db, uid) {
  const c = await clanOf(db, uid); if (rankOf(c, uid) !== 'owner') return { error: 'forbidden' };
  await disbandClan(db, c);
  return get(db, uid);
}

// ---------- gestion ----------
async function kick(db, uid, d = {}) {
  const c = await clanOf(db, uid), u = key(d.uid), me = rankOf(c, uid), them = rankOf(c, u);
  if (!isStaff(c, uid) || !them || u === uid) return { error: 'forbidden' };
  if (them === 'owner' || (them === 'officer' && me !== 'owner')) return { error: 'forbidden' };   // un officier n'exclut que des membres
  await db.ref().update({ [`clans/${c.id}/members/${u}`]: null, [`clanOf/${u}`]: null });
  return get(db, uid);
}
async function setRole(db, uid, d = {}) {
  const c = await clanOf(db, uid), u = key(d.uid), them = rankOf(c, u);
  if (rankOf(c, uid) !== 'owner' || !them || them === 'owner') return { error: 'forbidden' };
  if (!['officer', 'member'].includes(d.role)) return { error: 'bad_role' };
  await db.ref(`clans/${c.id}/members/${u}/role`).set(d.role);
  return get(db, uid);
}
async function transfer(db, uid, d = {}) {
  const c = await clanOf(db, uid), u = key(d.uid);
  if (rankOf(c, uid) !== 'owner' || !rankOf(c, u) || u === uid) return { error: 'forbidden' };
  await db.ref().update({ [`clans/${c.id}/owner`]: u, [`clans/${c.id}/members/${u}/role`]: 'owner', [`clans/${c.id}/members/${uid}/role`]: 'officer' });
  return get(db, uid);
}
async function edit(db, uid, d = {}) {
  const c = await clanOf(db, uid); if (!isStaff(c, uid)) return { error: 'forbidden' };
  const upd = {};
  if (d.desc !== undefined) upd[`clans/${c.id}/desc`] = cleanDesc(d.desc);
  if (d.open !== undefined) upd[`clans/${c.id}/open`] = !!d.open;
  if (d.color !== undefined && COLORS.includes(d.color)) upd[`clans/${c.id}/color`] = d.color;
  if (Object.keys(upd).length) await db.ref().update(upd);
  return get(db, uid);
}
// équiper / déséquiper le tag en jeu
async function equip(db, uid, d = {}) {
  await db.ref(`profiles/${uid}/clanTagOff`).set(d.on ? null : true);
  return get(db, uid);
}

// ---------- utilisé par le matchmaking ----------
// tag à afficher en jeu pour chaque joueur du match : { uid: 'TAG' } (seulement les tags équipés)
async function tagsFor(db, uids) {
  const out = {};
  await Promise.all(uids.map(async u => {
    const cid = await val(db.ref(`clanOf/${u}`)); if (!cid) return;
    const [tag, off] = await Promise.all([val(db.ref(`clans/${cid}/tag`)), val(db.ref(`profiles/${u}/clanTagOff`))]);
    if (tag && !off) out[u] = tag;
  }));
  return out;
}
// fin de match classé : points et bilan du clan de chaque joueur
async function award(db, results) {      // results = [{ uid, won }]
  const per = {};
  for (const { uid, won } of results) {
    const cid = await val(db.ref(`clanOf/${uid}`)); if (!cid) continue;
    const x = per[cid] || (per[cid] = { pts: 0, w: 0, l: 0 });
    x.pts += won ? PTS_WIN : PTS_LOSS; if (won) x.w++; else x.l++;
  }
  for (const [cid, x] of Object.entries(per)) {
    await db.ref(`clans/${cid}`).transaction(c => { if (!c) return c; c.points = (c.points || 0) + x.pts; c.w = (c.w || 0) + x.w; c.l = (c.l || 0) + x.l; return c; });
  }
  return per;
}

const actions = { get, list, create, join, cancelReq, answer, leave, disband, kick, setRole, transfer, edit, equip };
module.exports = { actions, tagsFor, award, levelOf, MAX_MEMBERS, PTS_WIN, PTS_LOSS };
