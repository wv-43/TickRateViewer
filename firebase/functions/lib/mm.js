const rewards = require('./rewards');
const { MAP_POOL, WINGMAN_POOL, DUEL_POOL, expected, eloChange, perfRating, lvl, BAN_STEPS, rid } = require('./core');

const CFG = {
  size: { ranked: Number(process.env.MATCH_SIZE) || 10, casual: Number(process.env.MATCH_SIZE) || 10, wingman: 4, duel: 2 },
  acceptMs: 20_000, vetoMs: 15_000, joinMs: 240_000, serverWaitMs: 5 * 60_000, abandonMs: 5 * 60_000, abandonEndMs: 60_000, noShowMin: 5,
  baseGap: 400, gapPerMin: 100, maxGap: 1000
};
const val = async ref => (await ref.get()).val();

async function addBan(db, uid, reason, fixedMin = null, now = Date.now()) {
  const cur = (await val(db.ref(`bans/${uid}`))) || {};
  const recent = Object.values(cur.log || {}).filter(b => b.at > now - 7 * 864e5).length;
  const minutes = fixedMin || BAN_STEPS[Math.min(recent, BAN_STEPS.length - 1)];
  const until = now + minutes * 60e3, key = db.ref(`bans/${uid}/log`).push().key;
  await db.ref(`bans/${uid}`).update({ until, reason, minutes, [`log/${key}`]: { at: now, reason, minutes } });
  return { reason, minutes, until };
}
const isBanned = async (db, uid, now = Date.now()) => ((await val(db.ref(`bans/${uid}/until`))) || 0) > now;

function unitsOf(entries) {
  const m = new Map();
  for (const e of entries) {
    const id = e.party ? 'p:' + e.party : 'u:' + e.uid;
    const u = m.get(id) || { id, uids: [], elos: [], at: Infinity, prio: 0 };
    u.uids.push(e.uid); u.elos.push(e.elo); u.at = Math.min(u.at, e.at || 0); u.prio = Math.max(u.prio, e.prio ? 1 : 0);
    m.set(id, u);
  }
  return [...m.values()].map(u => ({ ...u, elo: u.elos.reduce((a, b) => a + b, 0) / u.elos.length })).filter(u => u.uids.length <= 5);
}
function splitTeams(units, half) {
  const A = { u: [], n: 0, s: 0 }, B = { u: [], n: 0, s: 0 };
  for (const u of [...units].sort((x, y) => y.uids.length - x.uids.length || y.elo - x.elo)) {
    const sz = u.uids.length, opts = [A, B].filter(t => t.n + sz <= half).sort((x, y) => (x.s / Math.max(1, x.n)) - (y.s / Math.max(1, y.n)) || x.n - y.n);
    if (!opts.length) return null;
    const t = opts[0]; t.u.push(u); t.n += sz; t.s += u.elo * sz;
  }
  return A.n === half && B.n === half ? { A: A.u.flatMap(u => u.uids), B: B.u.flatMap(u => u.uids) } : null;
}
function pick(queue, info, now = Date.now(), cfg = CFG) {
  const entries = Object.entries(queue || {}).map(([uid, e]) => ({ uid, ...e, elo: eloOf(info[uid], e.mode), pool: info[uid]?.pool || 'normal' }));
  const groups = new Map();
  for (const e of entries) { const k = `${e.mode || 'ranked'}|${e.pool}`; (groups.get(k) || groups.set(k, []).get(k)).push(e); }
  for (const [k, list] of groups) {
    const mode = k.split('|')[0], size = cfg.size[mode] || 10, half = size / 2;
    const units = unitsOf(list).sort((a, b) => b.prio - a.prio || a.at - b.at);
    for (const anchor of units) {
      if (mode === 'duel' && anchor.uids.length === 2) {
        return { mode, pool: k.split('|')[1], uids: anchor.uids, teams: { A: [anchor.uids[0]], B: [anchor.uids[1]] }, gap: Math.abs(anchor.elos[0] - anchor.elos[1]) };
      }
      const waitMin = Math.max(0, (now - anchor.at) / 60e3);
      const gap = Math.min(cfg.maxGap, cfg.baseGap + cfg.gapPerMin * Math.floor(waitMin));
      const sel = [anchor]; let n = anchor.uids.length;
      const cand = units.filter(u => u !== anchor && Math.abs(u.elo - anchor.elo) <= gap).sort((a, b) => b.prio - a.prio || Math.abs(a.elo - anchor.elo) - Math.abs(b.elo - anchor.elo));
      for (const u of cand) { if (n + u.uids.length > size) continue; sel.push(u); n += u.uids.length; if (n === size) break; }
      if (n !== size) continue;
      const teams = splitTeams(sel, half);
      if (teams) return { mode, pool: k.split('|')[1], uids: sel.flatMap(u => u.uids), teams, gap };
    }
  }
  return null;
}

const isWm = mode => mode === 'wingman';
const isDuel = mode => mode === 'duel';
const fld = (mode, f) => (isDuel(mode) ? f + 'Duel' : isWm(mode) ? f + 'Wm' : f);
const eloOf = (prof, mode) => (isDuel(mode) ? prof && prof.eloDuel : isWm(mode) ? prof && prof.eloWm : prof && prof.elo) ?? 1000;

async function tryMatch(db, region, now = Date.now(), cfg = CFG) {
  const q0 = await val(db.ref(`queue/${region}`));
  if (!q0) return null;
  const info = {};
  await Promise.all(Object.keys(q0).map(async uid => { info[uid] = (await val(db.ref(`profiles/${uid}`))) || {}; }));
  let picked = null, snapQ = null;
  await db.ref(`queue/${region}`).transaction(q => {
    picked = null; if (!q) return q;
    const r = pick(q, info, now, cfg); if (!r) return q;
    picked = r; snapQ = {}; r.uids.forEach(u => { snapQ[u] = q[u]; delete q[u]; });
    return q;
  });
  if (!picked) return null;
  const mid = 'm_' + rid(8), players = {};
  for (const uid of picked.uids) {
    const p = info[uid] || {};
    players[uid] = { name: p.name || 'Joueur', elo: eloOf(p, picked.mode), steamId: p.steamId || null, team: picked.teams.A.includes(uid) ? 'A' : 'B', accepted: false, q: { ...snapQ[uid], region } };
  }
  const upd = { [`matches/${mid}`]: { status: 'accept', mode: picked.mode, region, createdAt: now, deadline: now + cfg.acceptMs, players, A: picked.teams.A, B: picked.teams.B } };
  picked.uids.forEach(u => { upd[`userMatch/${u}`] = mid; });
  upd[`activeMatches/${mid}`] = now;
  await db.ref().update(upd);
  const waits = picked.uids.map(u => Math.max(0, now - (snapQ[u].at || now)));
  const w = waits.reduce((a, b) => a + b, 0) / waits.length;
  await db.ref(`mmStats/${region}/${picked.mode}/wait`).transaction(x => ({ avg: x && x.avg ? Math.round(x.avg * 0.7 + w * 0.3) : Math.round(w), n: ((x && x.n) || 0) + 1, last: now }));
  await publishQueue(db, region);
  return mid;
}

async function publishQueue(db, region) {
  const q = (await val(db.ref(`queue/${region}`))) || {};
  const count = { ranked: 0, casual: 0, wingman: 0, duel: 0 };
  for (const e of Object.values(q)) if (count[e.mode || 'ranked'] !== undefined) count[e.mode || 'ranked']++;
  const upd = {};
  for (const [mode, n] of Object.entries(count)) upd[`mmStats/${region}/${mode}/inQueue`] = n;
  await db.ref().update(upd);
}

async function testMatch(db, uid, mode, opts = {}, now = Date.now(), cfg = CFG) {
  const p = (await val(db.ref(`profiles/${uid}`))) || {};
  if (!p.steamLinked || !p.steamId) return { error: 'steam_required' };
  if (await val(db.ref(`userMatch/${uid}`))) return { error: 'in_match' };
  mode = mode === 'duel' ? 'duel' : (mode === 'wingman' ? 'wingman' : 'ranked');
  const pool = mode === 'duel' ? DUEL_POOL : (mode === 'wingman' ? WINGMAN_POOL : await require('./mapvote').curPool(db));
  const mid = 'm_' + rid(8);
  const rounds = Math.min(30, Math.max(2, (Number(opts.rounds) || 2) & ~1));
  const m = {
    status: 'waiting_server', test: true, testReal: !!opts.real, rounds, mode, region: 'EU', createdAt: now, waitingSince: now,
    map: pool[Math.floor(Math.random() * pool.length)],
    players: { [uid]: { name: p.name || 'Dev', elo: eloOf(p, mode), steamId: p.steamId, team: 'A', accepted: true, q: { region: 'EU', mode, lang: opts.lang || null } } },
    A: [uid], B: []
  };
  await db.ref().update({ [`matches/${mid}`]: m, [`userMatch/${uid}`]: mid, [`activeMatches/${mid}`]: now });
  await assignServer(db, mid, now, cfg);
  return { ok: true, matchId: mid };
}

async function cancelTest(db, uid, mid, now = Date.now()) {
  const m = await val(db.ref(`matches/${mid}`));
  if (!m || !m.test || !m.players || !m.players[uid]) return { error: 'not_test' };
  if (['cancelled', 'finished'].includes(m.status)) return { ok: true };
  await cancel(db, mid, m, 'test_abandoned', [], now);
  return { ok: true };
}

async function leave(db, uid, mid, now = Date.now()) {
  const m = await val(db.ref(`matches/${mid}`));
  if (!m || !m.players || !m.players[uid]) return { error: 'not_in_match' };
  if (m.test) return cancelTest(db, uid, mid, now);
  if (['cancelled', 'finished'].includes(m.status)) return { ok: true };
  if (m.status === 'live') return { error: 'match_live' };
  const ban = m.mode === 'casual' ? null : await addBan(db, uid, 'left', null, now);
  await cancel(db, mid, m, 'player_left', Object.keys(m.players).filter(u => u !== uid), now);
  return { ok: true, ban };
}

async function onAccept(db, mid, now = Date.now(), cfg = CFG) {
  let moved = false;
  const compPool = await require('./mapvote').curPool(db);
  await db.ref(`matches/${mid}`).transaction(m => {
    moved = false;
    if (!m || m.status !== 'accept') return m;
    if (!Object.values(m.players || {}).every(p => p.accepted)) return m;
    const cap = t => m[t].reduce((best, u) => (m.players[u].elo > m.players[best].elo ? u : best), m[t][0]);
    m.status = 'veto'; m.deadline = now + cfg.vetoMs;
    m.veto = { pool: m.mode === 'duel' ? DUEL_POOL : (m.mode === 'wingman' ? WINGMAN_POOL : compPool), banned: { _: 0 }, turn: 'A', captains: { A: cap('A'), B: cap('B') } };
    moved = true; return m;
  });
  return moved;
}

async function veto(db, mid, uid, map, now = Date.now(), cfg = CFG) {
  let done = false, err = null;
  await db.ref(`matches/${mid}`).transaction(m => {
    done = false; err = null;
    if (!m || m.status !== 'veto') { err = 'not_veto'; return m; }
    const v = m.veto;
    if (v.captains[v.turn] !== uid && uid !== '__auto') { err = 'not_your_turn'; return m; }
    const left = v.pool.filter(x => !(v.banned || {})[x]);
    if (!left.includes(map)) { err = 'bad_map'; return m; }
    v.banned = { ...(v.banned || {}), [map]: v.turn };
    const rest = left.filter(x => x !== map);
    if (rest.length === 1) { m.map = rest[0]; m.status = 'waiting_server'; m.waitingSince = now; delete m.deadline; done = true; }
    else { v.turn = v.turn === 'A' ? 'B' : 'A'; m.deadline = now + cfg.vetoMs; }
    return m;
  });
  if (err) return { error: err };
  if (done) await assignServer(db, mid, now, cfg);
  return { ok: true };
}

async function assignServer(db, mid, now = Date.now(), cfg = CFG) {
  const m = await val(db.ref(`matches/${mid}`));
  if (!m || m.status !== 'waiting_server') return null;
  const servers = (await val(db.ref('servers'))) || {}, want = m.mode === 'duel' ? 'duel' : (m.mode === 'wingman' ? 'wingman' : 'ranked');
  const order = Object.entries(servers).filter(([, s]) => s && (!s.mode || s.mode === want)).sort((a, b) => (b[1].mode === want) - (a[1].mode === want));
  for (const [sid, s] of order) {
    if (s.region && s.region !== m.region) continue;
    let got = false;
    await db.ref(`servers/${sid}`).transaction(x => { got = false; if (!x || x.status !== 'free') return x; x.status = 'busy'; x.match = mid; got = true; return x; });
    if (!got) continue;
    const password = 'tr' + rid(8).replace(/[0-9]/g, c => 'bcdfghjkmn'[c]), connect = `${s.ip}:${s.port || 27015}`;
    const clanTags = await require('./clans').tagsFor(db, Object.keys(m.players)).catch(() => ({}));
    const roster = Object.entries(m.players).map(([uid, p]) => ({ uid, steamId: p.steamId, name: p.name, team: p.team, elo: p.elo, lang: (p.q && p.q.lang) || null, clan: clanTags[uid] || null }));
    await db.ref().update({
      [`matches/${mid}/status`]: 'ready', [`matches/${mid}/server`]: { id: sid, connect, gotv: s.gotvPort ? `${s.ip}:${s.gotvPort}` : null },
      [`matches/${mid}/joinDeadline`]: now + cfg.joinMs, [`matchSecrets/${mid}`]: { password },
      [`servers/${sid}/assignment`]: { matchId: mid, map: m.map, password, mode: m.mode, roster, test: !!m.test, rounds: m.rounds || null, ...(m.private ? { fill: !!m.fill, slots: m.mode === 'duel' ? 2 : (m.mode === 'wingman' ? 4 : 10) } : {}), at: now }
    });
    return sid;
  }
  return null;
}

async function cancel(db, mid, m, reason, requeue, now) {
  const upd = { [`matches/${mid}/status`]: 'cancelled', [`matches/${mid}/reason`]: reason, [`matches/${mid}/deadline`]: null, [`activeMatches/${mid}`]: null, [`liveMatches/${mid}`]: null };
  for (const uid of Object.keys(m.players)) upd[`userMatch/${uid}`] = null;
  for (const uid of requeue) { const q = m.players[uid].q || {}; upd[`queue/${q.region || m.region}/${uid}`] = { mode: q.mode || m.mode, party: q.party || null, at: q.at || now, prio: true }; }
  if (m.server && m.server.id) { upd[`servers/${m.server.id}/status`] = 'free'; upd[`servers/${m.server.id}/match`] = null; upd[`servers/${m.server.id}/assignment`] = null; }
  await db.ref().update(upd);
  if (m.comp) await require('./comp').onCancel(db, mid, m).catch(e => console.error('comp', mid, e));
}

async function tick(db, mid, now = Date.now(), cfg = CFG) {
  const m = await val(db.ref(`matches/${mid}`));
  if (!m) return null;
  if (m.status === 'accept' && now > m.deadline) {
    const ok = Object.keys(m.players).filter(u => m.players[u].accepted);
    await cancel(db, mid, m, 'not_all_accepted', ok, now);
    return 'cancelled';
  }
  if (m.status === 'veto' && now > m.deadline) {
    const left = m.veto.pool.filter(x => !(m.veto.banned || {})[x]);
    await veto(db, mid, '__auto', left[Math.floor(Math.random() * left.length)], now, cfg);
    return 'veto';
  }
  if (m.status === 'waiting_server') {
    if (await assignServer(db, mid, now, cfg)) return 'ready';
    if (now - (m.waitingSince || now) > cfg.serverWaitMs) { await cancel(db, mid, m, 'no_server', [], now); return 'cancelled'; }
    return 'waiting_server';
  }
  if (m.test && m.status === 'live' && now - (m.startedAt || m.createdAt || now) > (m.comp ? 150 : 20) * 60e3) {
    await cancel(db, mid, m, 'test_timeout', [], now);
    return 'cancelled';
  }
  if (m.status === 'live' && !m.test) {
    for (const [uid, p] of Object.entries(m.players)) {
      if (p.leftAt && !p.joined && !p.abandoned && now - p.leftAt > cfg.abandonMs) {
        await addBan(db, uid, 'abandon', null, now);
        await db.ref(`matches/${mid}/players/${uid}/abandoned`).set(true);
      }
    }
    if (Object.values(m.players).every(p => p.leftAt && !p.joined && now - p.leftAt > cfg.abandonMs)) {
      await cancel(db, mid, m, 'all_left', [], now);
      return 'cancelled';
    }
  }
  if (m.status === 'ready' && now > m.joinDeadline) {
    const missing = Object.keys(m.players).filter(u => !m.players[u].joined);
    if (missing.length && m.test) { await cancel(db, mid, m, 'no_show', [], now); return 'cancelled'; }
    if (missing.length) {
      for (const u of missing) await addBan(db, u, 'no_show', cfg.noShowMin, now);
      await cancel(db, mid, m, 'no_show', Object.keys(m.players).filter(u => !missing.includes(u)), now);
      return 'cancelled';
    }
  }
  return m.status;
}

async function uidOfSteam(db, steamId) { return val(db.ref(`steamIndex/${steamId}`)); }
async function joined(db, mid, steamId, now = Date.now()) {
  const uid = await uidOfSteam(db, steamId); if (!uid) return false;
  let live = false;
  await db.ref(`matches/${mid}`).transaction(m => {
    live = false; if (!m || !['ready', 'live'].includes(m.status) || !m.players[uid]) return m;
    m.players[uid].joined = true; delete m.players[uid].leftAt;
    if (m.status === 'ready' && Object.values(m.players).every(p => p.joined)) { m.status = 'live'; m.startedAt = now; live = true; }
    return m;
  });
  if (live) await require('./live').start(db, mid, now);
  return { ok: true, live };
}
async function left(db, mid, steamId, now = Date.now()) {
  const uid = await uidOfSteam(db, steamId); if (!uid) return { ok: false };
  let ok = false;
  await db.ref(`matches/${mid}`).transaction(m => {
    ok = false; if (!m || !['ready', 'live'].includes(m.status) || !m.players[uid]) return m;
    m.players[uid].joined = false; m.players[uid].leftAt = now; ok = true;
    return m;
  });
  return { ok };
}
async function finish(db, mid, body, now = Date.now()) {
  const m = await val(db.ref(`matches/${mid}`));
  if (!m || !['live', 'ready'].includes(m.status)) return { error: 'bad_status' };
  const sA = +body.scoreA || 0, sB = +body.scoreB || 0, R = sA + sB, winner = sA === sB ? null : sA > sB ? 'A' : 'B';
  const bySteam = new Map((body.players || []).map(p => [String(p.steamId), p]));
  if (m.test) {
    const r = await finishTest(db, mid, m, sA, sB, winner, bySteam, R, now);
    if (m.comp) await require('./comp').onEnd(db, mid, m, winner, [sA, sB]).catch(e => console.error('comp', mid, e));
    return r;
  }
  const avg = t => m[t].reduce((s, u) => s + m.players[u].elo, 0) / m[t].length;
  const pA = expected(avg('A'), avg('B'));
  const upd = {}, results = {};
  for (const [uid, p] of Object.entries(m.players)) {
    const st = bySteam.get(String(p.steamId)) || { k: 0, a: 0, d: 0, adr: 0, hs: 0, kast: 0 };
    const won = p.team === winner, rating = +perfRating(st, R).toFixed(2);
    const prof = (await val(db.ref(`profiles/${uid}`))) || {}, f = x => fld(m.mode, x);
    const elo0 = prof[f('elo')] ?? p.elo;
    const ch = m.mode === 'casual' || !winner ? { d: 0 } : eloChange(p.team === 'A' ? pA : 1 - pA, won, rating, elo0);
    const elo = Math.max(100, elo0 + ch.d);
    results[uid] = { k: +st.k || 0, a: +st.a || 0, d: +st.d || 0, adr: +st.adr || 0, hs: +st.hs || 0, kast: +st.kast || 0, rating, delta: ch.d, elo, team: p.team };
    upd[`profiles/${uid}/${f('elo')}`] = elo; upd[`profiles/${uid}/${f('level')}`] = lvl(elo);
    upd[`profiles/${uid}/${f('peakElo')}`] = Math.max(prof[f('peakElo')] || 0, elo);
    upd[`profiles/${uid}/${f('matches')}`] = (prof[f('matches')] || 0) + 1; upd[`profiles/${uid}/${f('wins')}`] = (prof[f('wins')] || 0) + (won ? 1 : 0);
    upd[`profiles/${uid}/lastMatchAt`] = now;
    upd[`userMatch/${uid}`] = null;
  }
  const ids = Object.keys(results);
  const mvp = ids.reduce((b, u) => (results[u].rating > (results[b] || {}).rating ? u : b), ids[0]);
  const rowOf = (u, meUid) => {
    const r = results[u], pl = m.players[u] || {};
    return { n: pl.name || 'Joueur', k: r.k, a: r.a, d: r.d, adr: r.adr, hs: r.hs, r: r.rating, e: r.delta, me: u === meUid, mvp: u === mvp };
  };
  for (const [uid, p] of Object.entries(m.players)) {
    const myT = p.team, oT = myT === 'A' ? 'B' : 'A';
    const sb = {
      A: (m[myT] || []).filter(u => results[u]).map(u => rowOf(u, uid)).sort((a, b) => b.r - a.r),
      B: (m[oT] || []).filter(u => results[u]).map(u => rowOf(u, uid)).sort((a, b) => b.r - a.r)
    };
    upd[`history/${uid}/${mid}`] = { at: now, map: m.map, mode: m.mode, won: p.team === winner, score: p.team === 'A' ? `${sA}-${sB}` : `${sB}-${sA}`, ...results[uid], sb };
  }
  Object.assign(upd, { [`matches/${mid}/status`]: 'finished', [`matches/${mid}/score`]: [sA, sB], [`matches/${mid}/winner`]: winner, [`matches/${mid}/results`]: results, [`matches/${mid}/finishedAt`]: now, [`activeMatches/${mid}`]: null, [`liveMatches/${mid}`]: null });
  if (m.server?.id) Object.assign(upd, { [`servers/${m.server.id}/status`]: 'free', [`servers/${m.server.id}/match`]: null, [`servers/${m.server.id}/assignment`]: null });
  await db.ref().update(upd);
  for (const [uid, p] of Object.entries(m.players)) {
    if (p.leftAt && !p.joined && !p.abandoned && now - p.leftAt > CFG.abandonEndMs) {
      await addBan(db, uid, 'abandon', null, now);
      await db.ref(`matches/${mid}/players/${uid}/abandoned`).set(true);
    }
  }
  await giveRewards(db, m, results, winner, now);
  if (winner) await require('./clans').award(db, Object.entries(m.players).map(([uid, p]) => ({ uid, won: p.team === winner }))).catch(e => console.error('clans', mid, e));
  return { ok: true, winner, results, mode: m.mode };
}

async function giveRewards(db, m, results, winner, now) {
  const ids = Object.keys(results);
  const mvp = ids.reduce((b, u) => (results[u].rating > (results[b] || {}).rating ? u : b), ids[0]);
  await Promise.all(ids.map(uid => rewards.onMatch(db, uid, results[uid], !!winner && results[uid].team === winner, uid === mvp, now).catch(e => console.error('rewards', uid, e))));
}

async function finishTest(db, mid, m, sA, sB, winner, bySteam, R, now) {
  const results = {}, upd = {};
  for (const [uid, p] of Object.entries(m.players)) {
    const st = bySteam.get(String(p.steamId)) || { k: 0, a: 0, d: 0, adr: 0, hs: 0, kast: 0 };
    const rating = +perfRating(st, R).toFixed(2), won = p.team === winner;
    const prof = m.testReal ? (await val(db.ref(`profiles/${uid}`))) || {} : {}, f = x => fld(m.mode, x);
    const elo0 = prof[f('elo')] ?? p.elo;
    const delta = m.testReal && winner ? eloChange(0.5, won, rating, elo0).d : 0, elo = Math.max(100, elo0 + delta);
    results[uid] = { k: +st.k || 0, a: +st.a || 0, d: +st.d || 0, adr: +st.adr || 0, hs: +st.hs || 0, kast: +st.kast || 0, rating, delta, elo, team: p.team };
    upd[`userMatch/${uid}`] = null;
    if (m.testReal) Object.assign(upd, {
      [`profiles/${uid}/${f('elo')}`]: elo, [`profiles/${uid}/${f('level')}`]: lvl(elo), [`profiles/${uid}/${f('peakElo')}`]: Math.max(prof[f('peakElo')] || 0, elo),
      [`profiles/${uid}/${f('matches')}`]: (prof[f('matches')] || 0) + 1, [`profiles/${uid}/${f('wins')}`]: (prof[f('wins')] || 0) + (won ? 1 : 0), [`profiles/${uid}/lastMatchAt`]: now,
      [`history/${uid}/${mid}`]: { at: now, map: m.map, mode: m.mode, won, test: true, score: p.team === 'A' ? `${sA}-${sB}` : `${sB}-${sA}`, ...results[uid] }
    });
  }
  Object.assign(upd, { [`matches/${mid}/status`]: 'finished', [`matches/${mid}/score`]: [sA, sB], [`matches/${mid}/winner`]: winner, [`matches/${mid}/results`]: results, [`matches/${mid}/finishedAt`]: now, [`activeMatches/${mid}`]: null, [`liveMatches/${mid}`]: null });
  if (m.server?.id) Object.assign(upd, { [`servers/${m.server.id}/status`]: 'free', [`servers/${m.server.id}/match`]: null, [`servers/${m.server.id}/assignment`]: null });
  await db.ref().update(upd);
  if (m.testReal) await giveRewards(db, m, results, winner, now);
  return { ok: true, winner, results, mode: m.mode, test: true, testReal: !!m.testReal };
}

module.exports = { eloOf, CFG, testMatch, cancelTest, leave, left, publishQueue, pick, splitTeams, unitsOf, tryMatch, onAccept, veto, assignServer, tick, joined, finish, addBan, isBanned };
