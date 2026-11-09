const val = async ref => (await ref.get()).val();
const { rid } = require('./core');
const trades = require('./trades');
const key = x => String(x || '').replace(/[.#$/[\]]/g, '_').slice(0, 64);

const MAX_MEMBERS = 7, LINEUP = 5;
const COLORS = ['#c4562a', '#3b6fd6', '#2e9d6c', '#7a5cc4', '#c9424d', '#c08a1e', '#2b8f80', '#b0447a', '#5d6775'];
const DIVS = [
  { id: 'open', winsToUp: 5 }, { id: 'inter', winsToUp: 6 }, { id: 'main', winsToUp: 7 }, { id: 'adv', winsToUp: 8 }, { id: 'pro', winsToUp: null }
];
const divIdx = d => Math.max(0, DIVS.findIndex(x => x.id === d));

async function teamOf(db, uid) { const tid = await val(db.ref(`teamOf/${uid}`)); const t = tid && (await val(db.ref(`teams/${tid}`))); return t ? { id: tid, ...t } : null; }
async function loadTeam(db, tid) { const t = tid && (await val(db.ref(`teams/${key(tid)}`))); return t ? { id: key(tid), ...t } : null; }
const isCap = (t, uid) => t && t.captain === uid;
const lineupOf = t => {
  const ids = Object.keys(t.members || {});
  const lu = (t.lineup || []).filter(u => ids.includes(u));
  for (const u of ids) if (lu.length < LINEUP && !lu.includes(u)) lu.push(u);
  return lu.slice(0, LINEUP);
};
async function busy(db, tid) {
  const all = (await val(db.ref('tourneys'))) || {};
  return Object.values(all).some(x => x && (x.status === 'open' || x.status === 'live') && (x.teams || {})[tid]);
}

async function create(db, uid, d = {}, now = Date.now()) {
  if (await val(db.ref(`teamOf/${uid}`))) return { error: 'team_already' };
  const name = String(d.name || '').trim(), tag = String(d.tag || '').trim().toUpperCase();
  if (!/^[A-Za-z0-9 _.-]{3,24}$/.test(name)) return { error: 'team_bad_name' };
  if (!/^[A-Z0-9]{2,5}$/.test(tag)) return { error: 'team_bad_tag' };
  const color = COLORS.includes(d.color) ? d.color : COLORS[0];
  const p = (await val(db.ref(`profiles/${uid}`))) || {}, tid = 't_' + rid(8);
  let got = false;
  await db.ref(`teamTags/${tag}`).transaction(x => { got = !x; return x || tid; });
  if (!got) return { error: 'team_tag_taken' };
  await db.ref().update({
    [`teams/${tid}`]: { name, tag, color, captain: uid, members: { [uid]: { name: p.name || 'Joueur', at: now } }, div: 'open', season: { w: 0, l: 0, rd: 0 }, total: { w: 0, l: 0 }, at: now },
    [`teamOf/${uid}`]: tid
  });
  return get(db, uid);
}

async function invite(db, uid, d = {}, now = Date.now()) {
  const t = await teamOf(db, uid); if (!isCap(t, uid)) return { error: 'forbidden' };
  const rl = await require('./rate').limit(db, uid, 'teamInvite', now); if (rl) return rl;
  const lk = await trades.lookup(db, d.name); if (lk.error) return lk;
  if ((t.members || {})[lk.uid]) return { error: 'team_member_already' };
  if (await val(db.ref(`teamOf/${lk.uid}`))) return { error: 'team_other' };
  if (Object.keys(t.members || {}).length + Object.keys(t.invited || {}).length >= MAX_MEMBERS) return { error: 'team_full' };
  const name = (await val(db.ref(`profiles/${lk.uid}/name`))) || String(d.name);
  await db.ref().update({ [`teams/${t.id}/invited/${lk.uid}`]: name, [`teamInv/${lk.uid}/${t.id}`]: { name: t.name, tag: t.tag, at: now } });
  return get(db, uid);
}

async function join(db, uid, d = {}, now = Date.now()) {
  const t = await loadTeam(db, d.tid);
  if (!t) { await db.ref(`teamInv/${uid}/${key(d.tid)}`).remove(); return { error: 'team_unknown' }; }
  if (!(t.invited || {})[uid]) return { error: 'team_not_invited' };
  if (await val(db.ref(`teamOf/${uid}`))) return { error: 'team_already' };
  if (Object.keys(t.members || {}).length >= MAX_MEMBERS) return { error: 'team_full' };
  const p = (await val(db.ref(`profiles/${uid}`))) || {};
  await db.ref().update({
    [`teams/${t.id}/members/${uid}`]: { name: p.name || t.invited[uid], at: now }, [`teams/${t.id}/invited/${uid}`]: null,
    [`teamInv/${uid}`]: null, [`teamOf/${uid}`]: t.id
  });
  return get(db, uid);
}

async function decline(db, uid, d = {}) {
  const id = key(d.tid);
  await db.ref().update({ [`teamInv/${uid}/${id}`]: null, ...((await loadTeam(db, id)) ? { [`teams/${id}/invited/${uid}`]: null } : {}) });
  return get(db, uid);
}

async function removeMember(db, t, u) {
  await db.ref().update({ [`teams/${t.id}/members/${u}`]: null, [`teamOf/${u}`]: null, [`teams/${t.id}/lineup`]: (t.lineup || []).filter(x => x !== u) });
}
async function disbandTeam(db, t) {
  const upd = { [`teams/${t.id}`]: null, [`teamTags/${t.tag}`]: null, [`teamChal/${t.id}`]: null };
  for (const u of Object.keys(t.members || {})) upd[`teamOf/${u}`] = null;
  for (const u of Object.keys(t.invited || {})) upd[`teamInv/${u}/${t.id}`] = null;
  await db.ref().update(upd);
}

async function leave(db, uid) {
  const t = await teamOf(db, uid); if (!t) return get(db, uid);
  if (await busy(db, t.id)) return { error: 'team_busy' };
  const others = Object.entries(t.members || {}).filter(([u]) => u !== uid).sort((a, b) => (a[1].at || 0) - (b[1].at || 0));
  if (!others.length) await disbandTeam(db, t);
  else {
    await removeMember(db, t, uid);
    if (t.captain === uid) await db.ref(`teams/${t.id}/captain`).set(others[0][0]);
  }
  return get(db, uid);
}

async function kick(db, uid, d = {}) {
  const t = await teamOf(db, uid); if (!isCap(t, uid)) return { error: 'forbidden' };
  const u = key(d.uid);
  if (u === uid) return { error: 'forbidden' };
  if ((t.invited || {})[u]) { await db.ref().update({ [`teams/${t.id}/invited/${u}`]: null, [`teamInv/${u}/${t.id}`]: null }); return get(db, uid); }
  if (!(t.members || {})[u]) return { error: 'team_unknown' };
  if (await busy(db, t.id)) return { error: 'team_busy' };
  await removeMember(db, t, u);
  return get(db, uid);
}

async function disband(db, uid) {
  const t = await teamOf(db, uid); if (!isCap(t, uid)) return { error: 'forbidden' };
  if (await busy(db, t.id)) return { error: 'team_busy' };
  await disbandTeam(db, t);
  return get(db, uid);
}

async function captain(db, uid, d = {}) {
  const t = await teamOf(db, uid); if (!isCap(t, uid)) return { error: 'forbidden' };
  const u = key(d.uid); if (!(t.members || {})[u]) return { error: 'team_unknown' };
  await db.ref(`teams/${t.id}/captain`).set(u);
  return get(db, uid);
}

async function lineup(db, uid, d = {}) {
  const t = await teamOf(db, uid); if (!isCap(t, uid)) return { error: 'forbidden' };
  const ids = [...new Set((Array.isArray(d.lineup) ? d.lineup : []).map(key))].filter(u => (t.members || {})[u]).slice(0, LINEUP);
  await db.ref(`teams/${t.id}/lineup`).set(ids);
  return get(db, uid);
}

async function startMatch(db, tA, tB, comp, map, rounds, now = Date.now()) {
  const mm = require('./mm');
  const players = {}, A = [], B = [];
  for (const [t, side, arr] of [[tA, 'A', A], [tB, 'B', B]]) {
    const lu = lineupOf(t);
    if (lu.length < LINEUP) return { error: 'team_short', name: t.name };
    for (const u of lu) {
      const p = (await val(db.ref(`profiles/${u}`))) || {};
      const nm = p.name || (t.members[u] || {}).name || '?';
      if (!p.steamLinked || !p.steamId) return { error: 'room_steam', name: nm };
      if (await val(db.ref(`userMatch/${u}`))) return { error: 'room_in_match', name: nm };
      if (players[u]) return { error: 'team_overlap', name: nm };
      players[u] = { name: nm, elo: mm.eloOf(p, 'ranked'), steamId: p.steamId, team: side, accepted: true, q: { region: 'EU', mode: 'ranked', lang: null } };
      arr.push(u);
    }
  }
  const mid = 'm_' + rid(8), POOL = await require('./mapvote').curPool(db);
  const m = { status: 'waiting_server', test: true, private: true, fill: false, rounds: [16, 24, 30].includes(+rounds) ? +rounds : 24, mode: 'ranked', region: 'EU',
    createdAt: now, waitingSince: now, map: POOL.includes(map) ? map : POOL[Math.floor(Math.random() * POOL.length)],
    players, A, B, comp: { ...comp, teamA: tA.id, teamB: tB.id, nameA: tA.name, nameB: tB.name } };
  const upd = { [`matches/${mid}`]: m, [`activeMatches/${mid}`]: now };
  for (const u of [...A, ...B]) upd[`userMatch/${u}`] = mid;
  await db.ref().update(upd);
  await mm.assignServer(db, mid, now);
  return { ok: true, matchId: mid };
}

async function challenge(db, uid, d = {}, now = Date.now()) {
  const t = await teamOf(db, uid); if (!isCap(t, uid)) return { error: 'forbidden' };
  const rl = await require('./rate').limit(db, uid, 'challenge', now); if (rl) return rl;
  const o = await loadTeam(db, d.tid);
  if (!o || o.id === t.id) return { error: 'team_unknown' };
  if ((o.div || 'open') !== (t.div || 'open')) return { error: 'team_other_div' };
  if (lineupOf(t).length < LINEUP) return { error: 'team_short', name: t.name };
  await db.ref(`teamChal/${o.id}/${t.id}`).set({ name: t.name, tag: t.tag, at: now });
  return get(db, uid);
}
async function chalAnswer(db, uid, d = {}, now = Date.now()) {
  const t = await teamOf(db, uid); if (!isCap(t, uid)) return { error: 'forbidden' };
  const from = key(d.tid), c = await val(db.ref(`teamChal/${t.id}/${from}`));
  if (!c) return { error: 'team_unknown' };
  await db.ref(`teamChal/${t.id}/${from}`).remove();
  if (!d.accept) return get(db, uid);
  const o = await loadTeam(db, from); if (!o) return { error: 'team_unknown' };
  if ((o.div || 'open') !== (t.div || 'open')) return { error: 'team_other_div' };
  const r = await startMatch(db, o, t, { kind: 'league' }, d.map, 24, now);
  return r.error ? r : { ...(await get(db, uid)), matchId: r.matchId };
}
async function standings(db, div) {
  const all = (await val(db.ref('teams'))) || {};
  return Object.entries(all).filter(([, x]) => x && x.members && (x.div || 'open') === div)
    .map(([id, x]) => ({ id, name: x.name, tag: x.tag, color: x.color, n: Object.keys(x.members).length, w: x.season?.w || 0, l: x.season?.l || 0, rd: x.season?.rd || 0 }))
    .sort((a, b) => b.w * 3 - a.w * 3 || b.rd - a.rd || a.l - b.l).slice(0, 100);
}

async function tCreate(db, uid, d = {}, now = Date.now()) {
  const p = (await val(db.ref(`profiles/${uid}`))) || {};
  if (!p.steamLinked) return { error: 'tn_need_steam' };
  const all = (await val(db.ref('tourneys'))) || {};
  const mine = Object.values(all).filter(x => x && x.org === uid);
  if (mine.some(x => x.status === 'open' || x.status === 'live')) return { error: 'tn_one_active' };
  if (mine.some(x => now - (x.at || 0) < 3600e3)) return { error: 'tn_rate' };
  const name = String(d.name || '').trim();
  if (!/^[A-Za-z0-9À-ÿ '’#&!.:_-]{4,40}$/.test(name)) return { error: 'tn_bad_name' };
  const size = [4, 8, 16].includes(+d.size) ? +d.size : 8;
  const date = Number(d.date) || 0;
  const id = 'tn_' + rid(8);
  const tn = { name, org: uid, orgName: p.name || 'Joueur', size, rounds: [16, 24, 30].includes(+d.rounds) ? +d.rounds : 24,
    minElo: Math.max(0, Math.min(3000, Math.floor(+d.minElo || 0))), prize: String(d.prize || '').trim().slice(0, 60), desc: String(d.desc || '').trim().slice(0, 500),
    date: date > now && date < now + 60 * 864e5 ? date : null, status: 'open', at: now };
  await db.ref(`tourneys/${id}`).set(tn);
  return { ok: true, id, tourney: { id, ...tn } };
}
async function tLoad(db, id) { const x = id && (await val(db.ref(`tourneys/${key(id)}`))); return x ? { id: key(id), ...x } : null; }
async function teamElo(db, t) {
  const lu = lineupOf(t); let s = 0;
  for (const u of lu) s += (await val(db.ref(`profiles/${u}/elo`))) || 1000;
  return lu.length ? Math.round(s / lu.length) : 0;
}
async function tRegister(db, uid, d = {}, now = Date.now()) {
  const tn = await tLoad(db, d.id); if (!tn) return { error: 'tn_unknown' };
  const t = await teamOf(db, uid); if (!isCap(t, uid)) return { error: 'tn_need_captain' };
  if (tn.status !== 'open') return { error: 'tn_closed' };
  if ((tn.teams || {})[t.id]) return tGet(db, uid, d);
  if (Object.keys(tn.teams || {}).length >= tn.size) return { error: 'tn_full' };
  if (lineupOf(t).length < LINEUP) return { error: 'team_short', name: t.name };
  const elo = await teamElo(db, t);
  if (elo < (tn.minElo || 0)) return { error: 'tn_low_elo' };
  let ok = false;
  await db.ref(`tourneys/${tn.id}/teams`).transaction(x => { x = x || {}; ok = false; if (Object.keys(x).length >= tn.size || x[t.id]) return x; x[t.id] = { name: t.name, tag: t.tag, color: t.color, elo, at: now }; ok = true; return x; });
  if (!ok) return { error: 'tn_full' };
  return tGet(db, uid, d);
}
async function tUnregister(db, uid, d = {}) {
  const tn = await tLoad(db, d.id); if (!tn) return { error: 'tn_unknown' };
  const t = await teamOf(db, uid); if (!isCap(t, uid)) return { error: 'tn_need_captain' };
  if (tn.status !== 'open') return { error: 'tn_closed' };
  await db.ref(`tourneys/${tn.id}/teams/${t.id}`).remove();
  return tGet(db, uid, d);
}
function makeBracket(teams) {
  const ids = Object.entries(teams).sort((a, b) => (b[1].elo || 0) - (a[1].elo || 0)).map(([id]) => id);
  let n = 2; while (n < ids.length) n *= 2;
  const first = [];
  for (let i = 0; i < n / 2; i++) first.push({ a: ids[i] || null, b: ids[n - 1 - i] || null, w: null });
  const br = [first]; let m = n / 2;
  while (m > 1) { m /= 2; br.push(Array.from({ length: m }, () => ({ a: null, b: null, w: null }))); }
  return advanceByes(br);
}
function place(br, r, i, tid) { if (r + 1 >= br.length) return; const nx = br[r + 1][Math.floor(i / 2)]; if (i % 2 === 0) nx.a = tid; else nx.b = tid; }
function advanceByes(br) {
  br[0].forEach((m, i) => { if (m.a && !m.b) { m.w = 'a'; m.bye = true; place(br, 0, i, m.a); } else if (!m.a && m.b) { m.w = 'b'; m.bye = true; place(br, 0, i, m.b); } });
  return br;
}
async function tStart(db, uid, d = {}) {
  const tn = await tLoad(db, d.id); if (!tn) return { error: 'tn_unknown' };
  if (tn.org !== uid) return { error: 'forbidden' };
  if (tn.status !== 'open') return { error: 'tn_closed' };
  if (Object.keys(tn.teams || {}).length < 2) return { error: 'tn_need_teams' };
  await db.ref(`tourneys/${tn.id}`).update({ status: 'live', bracket: makeBracket(tn.teams), startedAt: Date.now() });
  return tGet(db, uid, d);
}
const slotOf = (tn, r, i) => (tn.bracket && tn.bracket[r] && tn.bracket[r][i]) || null;
async function tLaunch(db, uid, d = {}, now = Date.now()) {
  const tn = await tLoad(db, d.id); if (!tn) return { error: 'tn_unknown' };
  if (tn.org !== uid) return { error: 'forbidden' };
  if (tn.status !== 'live') return { error: 'tn_closed' };
  const r = Math.floor(+d.r), i = Math.floor(+d.i), m = slotOf(tn, r, i);
  if (!m || !m.a || !m.b || m.w) return { error: 'tn_bad_slot' };
  if (m.mid) { const st = await val(db.ref(`matches/${m.mid}/status`)); if (st && !['finished', 'cancelled'].includes(st)) return { error: 'tn_running' }; }
  const [tA, tB] = [await loadTeam(db, m.a), await loadTeam(db, m.b)];
  if (!tA || !tB) return { error: 'team_unknown' };
  const res = await startMatch(db, tA, tB, { kind: 'tourney', id: tn.id, r, i }, d.map, tn.rounds, now);
  if (res.error) return res;
  await db.ref(`tourneys/${tn.id}/bracket/${r}/${i}/mid`).set(res.matchId);
  return { ...(await tGet(db, uid, d)), matchId: res.matchId };
}
async function setResult(db, tnId, r, i, w, score) {
  let done = null;
  await db.ref(`tourneys/${tnId}`).transaction(tn => {
    if (!tn || tn.status !== 'live') return tn;
    const m = slotOf(tn, r, i); if (!m || m.w || !m.a || !m.b) return tn;
    m.w = w; if (score) m.s = score;
    const win = w === 'a' ? m.a : m.b;
    if (r === tn.bracket.length - 1) { tn.status = 'done'; tn.winner = win; tn.endedAt = Date.now(); done = win; }
    else place(tn.bracket, r, i, win);
    return tn;
  });
  return done;
}
async function tResult(db, uid, d = {}) {
  const tn = await tLoad(db, d.id); if (!tn) return { error: 'tn_unknown' };
  if (tn.org !== uid) return { error: 'forbidden' };
  const r = Math.floor(+d.r), i = Math.floor(+d.i), m = slotOf(tn, r, i);
  if (!m || !m.a || !m.b || m.w || !['a', 'b'].includes(d.w)) return { error: 'tn_bad_slot' };
  if (m.mid) { const st = await val(db.ref(`matches/${m.mid}/status`)); if (st && !['finished', 'cancelled'].includes(st)) return { error: 'tn_running' }; }
  await setResult(db, tn.id, r, i, d.w, null);
  return tGet(db, uid, d);
}
async function tCancel(db, uid, d = {}) {
  const tn = await tLoad(db, d.id); if (!tn) return { error: 'tn_unknown' };
  if (tn.org !== uid) return { error: 'forbidden' };
  if (tn.status === 'done' || tn.status === 'cancelled') return { error: 'tn_closed' };
  await db.ref(`tourneys/${tn.id}/status`).set('cancelled');
  return tGet(db, uid, d);
}
async function tList(db, uid, d = {}, now = Date.now()) {
  const all = (await val(db.ref('tourneys'))) || {};
  const list = Object.entries(all).filter(([, x]) => x && (x.status === 'open' || x.status === 'live' || now - (x.endedAt || x.at || 0) < 14 * 864e5))
    .map(([id, x]) => ({ id, name: x.name, orgName: x.orgName, size: x.size, n: Object.keys(x.teams || {}).length, status: x.status, date: x.date, prize: x.prize, minElo: x.minElo, mine: x.org === uid, at: x.at }))
    .sort((a, b) => ({ live: 0, open: 1, done: 2, cancelled: 3 }[a.status] - { live: 0, open: 1, done: 2, cancelled: 3 }[b.status]) || (b.at - a.at)).slice(0, 60);
  return { ok: true, list, team: await teamOf(db, uid) };
}
async function tGet(db, uid, d = {}) {
  const tn = await tLoad(db, d.id); if (!tn) return { error: 'tn_unknown' };
  return { ok: true, tourney: { ...tn, org: undefined, mine: tn.org === uid }, team: await teamOf(db, uid) };
}

async function onEnd(db, mid, m, winner, score) {
  const c = m.comp; if (!c || !winner) return;
  const wT = winner === 'A' ? c.teamA : c.teamB, lT = winner === 'A' ? c.teamB : c.teamA, diff = Math.abs((score[0] || 0) - (score[1] || 0));
  await db.ref(`teams/${lT}`).transaction(t => { if (!t) return t; t.total = t.total || { w: 0, l: 0 }; t.total.l++; if (c.kind === 'league') { t.season = t.season || { w: 0, l: 0, rd: 0 }; t.season.l++; t.season.rd -= diff; } return t; });
  await db.ref(`teams/${wT}`).transaction(t => {
    if (!t) return t; t.total = t.total || { w: 0, l: 0 }; t.total.w++;
    if (c.kind === 'league') {
      t.season = t.season || { w: 0, l: 0, rd: 0 }; t.season.w++; t.season.rd += diff;
      const di = divIdx(t.div || 'open'), dv = DIVS[di];
      if (dv.winsToUp && t.season.w >= dv.winsToUp) { t.div = DIVS[di + 1].id; t.season = { w: 0, l: 0, rd: 0 }; t.promotedAt = Date.now(); }
    }
    return t;
  });
  if (c.kind === 'tourney') await setResult(db, c.id, c.r, c.i, winner === 'A' ? 'a' : 'b', score);
}
async function onCancel(db, mid, m) {
  const c = m.comp; if (!c || c.kind !== 'tourney') return;
  await db.ref(`tourneys/${c.id}/bracket/${c.r}/${c.i}`).transaction(s => { if (s && s.mid === mid) delete s.mid; return s; });
}

async function get(db, uid, d = {}) {
  const [team, inv] = await Promise.all([teamOf(db, uid), val(db.ref(`teamInv/${uid}`))]);
  const div = DIVS.some(x => x.id === d?.div) ? d.div : (team?.div || 'open');
  const [st, chal, all, isBusy] = await Promise.all([
    standings(db, div),
    team ? val(db.ref(`teamChal/${team.id}`)) : null,
    team ? val(db.ref('teamChal')) : null,
    team ? busy(db, team.id) : false
  ]);
  const out = { ok: true, team: null, invites: Object.entries(inv || {}).map(([tid, x]) => ({ tid, ...x })), challenges: [], sent: [], div, standings: st };
  if (team) {
    out.team = { ...team, me: uid, lineupFull: lineupOf(team), busy: isBusy };
    out.challenges = Object.entries(chal || {}).map(([tid, x]) => ({ tid, ...x }));
    out.sent = Object.entries(all || {}).filter(([, v]) => v && v[team.id]).map(([tid]) => tid);
  }
  return out;
}
async function league(db, uid, d = {}) {
  const div = DIVS.some(x => x.id === d.div) ? d.div : ((await teamOf(db, uid))?.div || 'open');
  return { ok: true, div, standings: await standings(db, div) };
}

module.exports = {
  team: { get, create, invite, join, decline, leave, kick, disband, captain, lineup, challenge, chal: chalAnswer, league },
  tourney: { list: tList, get: tGet, create: tCreate, register: tRegister, unregister: tUnregister, start: tStart, launch: tLaunch, result: tResult, cancel: tCancel },
  onEnd, onCancel, makeBracket, DIVS, COLORS
};
