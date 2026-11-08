// =====================================================================
//  Ladder hebdomadaire : chaque match rapporte des points (rewards.onMatch), comptés par semaine
//  (lundi 00:00 UTC -> dimanche 23:59 UTC). Classement par palier de niveau ; le lundi suivant,
//  les meilleurs de chaque palier reçoivent des Tick Coins (une seule fois par semaine : verrou ladderPaid).
//  ladderWeek/<wk>/<uid>   points de la semaine      ladderPaid/<wk>   versement fait
//  ladderWon/<uid>/<wk>    { rank, coins, bracket }  (affiché au joueur)
// =====================================================================
const val = async ref => (await ref.get()).val();
const { lvl } = require('./core');
const { addCoins } = require('./eco');

const WEEK = 7 * 864e5;
const weekId = (now = Date.now()) => Math.floor((now / 864e5 + 3) / 7);    // l'epoch tombe un jeudi : +3 jours = semaines du lundi
const weekEnd = wk => (wk + 1) * WEEK - 3 * 864e5;
const BRACKETS = [
  { id: 'b9_10', minL: 9, maxL: 10, mult: 1.0 }, { id: 'b6_8', minL: 6, maxL: 8, mult: 0.75 },
  { id: 'b4_5', minL: 4, maxL: 5, mult: 0.55 }, { id: 'b1_3', minL: 1, maxL: 3, mult: 0.40 }
];
const REWARDS = [[1, 1, 5000], [2, 2, 3000], [3, 3, 2000], [4, 10, 800], [11, 50, 300], [51, 100, 100]];
const MIN_PTS = 50;                                                          // il faut avoir joué un peu dans la semaine
const rewardFor = (r, mult) => { const x = REWARDS.find(([a, b]) => r >= a && r <= b); return x ? Math.round(x[2] * mult / 10) * 10 : 0; };
const bracketOf = elo => { const l = lvl(elo || 1000); return BRACKETS.find(b => l >= b.minL && l <= b.maxL) || BRACKETS[3]; };

async function addPoints(db, uid, lp, now = Date.now()) {
  await db.ref(`ladderWeek/${weekId(now)}/${uid}`).transaction(x => (x || 0) + lp);
}

// joueurs de la semaine avec leur palier (ELO actuel)
async function weekRows(db, wk) {
  const pts = (await val(db.ref(`ladderWeek/${wk}`))) || {};
  const rows = await Promise.all(Object.entries(pts).map(async ([uid, p]) => {
    const pr = (await val(db.ref(`profiles/${uid}`))) || {};
    return { uid, pts: +p || 0, name: pr.name || '?', elo: pr.elo || 1000, plan: pr.plan || 'free', country: pr.country || null, avatar: pr.avatar || null };
  }));
  return rows.map(r => ({ ...r, br: bracketOf(r.elo).id })).sort((a, b) => b.pts - a.pts || b.elo - a.elo);
}

const CACHE = { wk: null, at: 0, rows: null, db: null };
async function board(db, uid, d = {}, now = Date.now()) {
  const wk = weekId(now);
  if (CACHE.db !== db || CACHE.wk !== wk || now - CACHE.at > 60e3 || now < CACHE.at) Object.assign(CACHE, { db, wk, at: now, rows: await weekRows(db, wk) });
  const rows = CACHE.rows;
  const myElo = (await val(db.ref(`profiles/${uid}/elo`))) || 1000, myBr = bracketOf(myElo).id;
  const br = BRACKETS.some(b => b.id === d.bracket) ? d.bracket : myBr;
  const list = rows.filter(r => r.br === br);
  const mi = list.findIndex(r => r.uid === uid);
  const strip = r => ({ name: r.name, elo: r.elo, plan: r.plan, country: r.country, avatar: r.avatar, pts: r.pts, me: r.uid === uid });
  return { ok: true, week: wk, ends: weekEnd(wk), bracket: br, myBracket: myBr, minPts: MIN_PTS,
    rows: list.slice(0, 100).map(strip), me: { rank: mi + 1, pts: (rows.find(r => r.uid === uid) || {}).pts || 0 },
    last: await val(db.ref(`ladderWon/${uid}/${wk - 1}`)) };
}

// versement de la semaine wk (appelé le lundi pour la semaine écoulée)
async function payWeek(db, wk) {
  let first = false;
  await db.ref(`ladderPaid/${wk}`).transaction(x => { first = !x; return x || Date.now(); });
  if (!first) return { paid: 0 };
  const rows = (await weekRows(db, wk)).filter(r => r.pts >= MIN_PTS);
  let paid = 0;
  for (const b of BRACKETS) {
    const list = rows.filter(r => r.br === b.id);
    for (let i = 0; i < list.length; i++) {
      const coins = rewardFor(i + 1, b.mult); if (!coins) break;
      await addCoins(db, list[i].uid, coins);
      await db.ref(`ladderWon/${list[i].uid}/${wk}`).set({ rank: i + 1, coins, bracket: b.id });
      paid++;
    }
  }
  return { paid };
}

module.exports = { weekId, weekEnd, addPoints, board, payWeek, rewardFor, BRACKETS, MIN_PTS };
