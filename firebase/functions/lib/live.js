// Matchs en direct : fiche publique liveMatches/<matchId>, lue par le site (section « Matchs en direct »)
// - créée quand tous les joueurs sont connectés (mm.joined -> status 'live')
// - mise à jour à chaque fin de round par le serveur de jeu (gameApi POST /round)
// - supprimée à la fin du match ou à son annulation (mm.finish / mm.cancel)
// Rien de privé dedans : pas de mot de passe, pas d'IP de connexion, seulement l'adresse GOTV.
const FEED_MAX = 10;
const val = async ref => (await ref.get()).val();
const num = v => Math.max(0, Math.round(Number(v) || 0));

function teamName(m, team) {
  const ids = m[team] || [];                       // équipe vide (match de test contre des bots) : absente de la base
  if (!ids.length) return m.test ? 'Team_BOTS' : 'Team_' + team;
  const cap = ids.reduce((best, u) => (m.players[u].elo > m.players[best].elo ? u : best), ids[0]);
  return 'Team_' + (m.players[cap]?.name || team);
}

// fiche de départ, construite à partir de matches/<mid>
function card(m, now) {
  const players = {};
  for (const [uid, p] of Object.entries(m.players || {})) players[uid] = { name: p.name, elo: p.elo, team: p.team, k: 0, a: 0, d: 0, dmg: 0, hs: 0 };
  return {
    map: m.map, mode: m.mode, region: m.region, startedAt: m.startedAt || now, updatedAt: now,
    gotv: m.server?.gotv || null, tA: teamName(m, 'A'), tB: teamName(m, 'B'),
    sA: 0, sB: 0, rounds: '', viewers: 0, players, feed: null
  };
}
async function start(db, mid, now = Date.now()) {
  const m = await val(db.ref(`matches/${mid}`));
  if (!m || m.status !== 'live') return null;
  const c = card(m, now);
  await db.ref(`liveMatches/${mid}`).set(c);
  return c;
}

// body : { scoreA, scoreB, viewers?, players:[{ steamId, k, a, d, dmg, hs }], kills:[{ killer, victim, weapon, hs }] }
// killer / victim = SteamID64 ; les stats joueurs sont des totaux depuis le début du match
async function round(db, mid, body = {}, now = Date.now()) {
  const m = await val(db.ref(`matches/${mid}`));
  if (!m || m.status !== 'live') return { error: 'not_live' };
  const cur = (await val(db.ref(`liveMatches/${mid}`))) || card(m, now);
  const uidOf = new Map(Object.entries(m.players).map(([uid, p]) => [String(p.steamId), uid]));
  const sA = num(body.scoreA), sB = num(body.scoreB);
  if (sA < cur.sA || sB < cur.sB) return { error: 'score_backwards' };
  // un round manqué est rattrapé : on ajoute les rounds gagnés depuis la dernière mise à jour
  const rounds = (cur.rounds || '') + 'A'.repeat(sA - cur.sA) + 'B'.repeat(sB - cur.sB);

  const players = { ...cur.players };
  for (const s of Array.isArray(body.players) ? body.players : []) {
    const uid = uidOf.get(String(s.steamId)); if (!uid || !players[uid]) continue;
    players[uid] = { ...players[uid], k: num(s.k), a: num(s.a), d: num(s.d), dmg: num(s.dmg), hs: num(s.hs) };
  }
  const name = sid => { const u = uidOf.get(String(sid)); return u ? players[u].name : null; };
  const kills = (Array.isArray(body.kills) ? body.kills : []).map(k => {
    const ku = uidOf.get(String(k.killer)), kn = name(k.killer), vn = name(k.victim);
    return kn && vn ? { k: kn, v: vn, w: String(k.weapon || '').slice(0, 24), hs: !!k.hs, ka: players[ku].team === 'A' } : null;
  }).filter(Boolean).reverse();
  const feed = [...kills, ...(cur.feed || [])].slice(0, FEED_MAX);

  const next = { ...cur, sA, sB, rounds, players, feed: feed.length ? feed : null, updatedAt: now };
  if (body.viewers !== undefined) next.viewers = num(body.viewers);
  await db.ref(`liveMatches/${mid}`).set(next);
  return { ok: true };
}

module.exports = { card, start, round, teamName };
