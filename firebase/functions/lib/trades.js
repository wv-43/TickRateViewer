// =====================================================================
//  Inventaire visible sur les profils + échanges entre joueurs (tout se passe sur le serveur).
//  trades/<id>        { from, to, fromName, toName, give:[objet], want:[objet], status, at, doneAt? }
//                     status : pending | done | declined | cancelled | failed
//  tradesBy/<uid>/<id> = true   (les deux joueurs)
//  Échange accepté : chaque objet est retiré de l'inventaire de son propriétaire par une transaction
//  (il doit encore exister, ne pas être en vente et être le même skin) ; si un seul manque, tout est remis
//  en place et l'échange échoue. Aucun objet ne peut donc être dupliqué ni perdu.
// =====================================================================
const val = async ref => (await ref.get()).val();
const DB = require('../data/cases.json');
const MAX_SIDE = 10, MAX_OPEN = 5;
const key = x => String(x || '').replace(/[.#$/[\]]/g, '_').slice(0, 64);
const pub = (id, x) => ({ id, k: x.k, f: x.f, s: x.s, st: !!x.st, c: x.c || null });

// objets d'un joueur visibles par les autres (pas ceux en vente)
async function publicInv(db, viewer, uid) {
  uid = key(uid);
  const [items, name] = await Promise.all([val(db.ref(`inventory/${uid}/items`)), val(db.ref(`profiles/${uid}/name`))]);
  if (!name) return { error: 'player_not_found' };
  const list = Object.entries(items || {}).filter(([, x]) => x && !x.listed && DB.items[x.k]).map(([id, x]) => pub(id, x));
  return { ok: true, uid, name, items: list.sort((a, b) => DB.items[b.k].t - DB.items[a.k].t) };
}

async function pick(db, uid, ids) {
  ids = [...new Set((Array.isArray(ids) ? ids : []).slice(0, MAX_SIDE).map(key))];
  const got = await Promise.all(ids.map(async id => ({ id, x: await val(db.ref(`inventory/${uid}/items/${id}`)) })));
  if (got.some(g => !g.x || g.x.listed || !DB.items[g.x.k])) return null;
  return got.map(g => pub(g.id, g.x));
}

async function offer(db, from, d = {}, now = Date.now()) {
  const to = key(d.to);
  if (!to || to === from) return { error: 'tr_bad_target' };
  const [fromName, toName] = await Promise.all([val(db.ref(`profiles/${from}/name`)), val(db.ref(`profiles/${to}/name`))]);
  if (!fromName || !toName) return { error: 'player_not_found' };
  const give = await pick(db, from, d.give), want = await pick(db, to, d.want);
  if (!give || !want) return { error: 'tr_item' };
  if (!give.length && !want.length) return { error: 'tr_empty' };
  const mine = Object.keys((await val(db.ref(`tradesBy/${from}`))) || {}).slice(-40);
  const open = (await Promise.all(mine.map(id => val(db.ref(`trades/${id}`))))).filter(x => x && x.from === from && x.status === 'pending').length;
  if (open >= MAX_OPEN) return { error: 'tr_many' };
  const id = db.ref('trades').push().key;
  await db.ref().update({
    [`trades/${id}`]: { from, to, fromName, toName, give, want, status: 'pending', at: now },
    [`tradesBy/${from}/${id}`]: true, [`tradesBy/${to}/${id}`]: true
  });
  return { ok: true, id };
}

// retire un objet (transaction) : il doit toujours être là, pas en vente, même skin
async function take(db, uid, it) {
  let got = null;
  const tx = await db.ref(`inventory/${uid}/items/${it.id}`).transaction(x => {
    got = null;
    if (x === null) return null;                         // 1er passage sans cache : Firebase relance avec la vraie valeur
    if (x.listed || x.k !== it.k) return undefined;      // abandon
    got = x; return null;
  });
  return tx.committed && got ? got : null;
}

async function respond(db, uid, d = {}, now = Date.now()) {
  const id = key(d.id), act = d.action;
  const t = id && (await val(db.ref(`trades/${id}`)));
  if (!t) return { error: 'tr_unknown' };
  if (act === 'cancel' && t.from !== uid) return { error: 'forbidden' };
  if ((act === 'accept' || act === 'decline') && t.to !== uid) return { error: 'forbidden' };
  if (!['accept', 'decline', 'cancel'].includes(act)) return { error: 'tr_bad_action' };
  // un seul traitement : pending -> processing (ou refus / annulation)
  let ok = false;
  await db.ref(`trades/${id}/status`).transaction(s => { ok = s === 'pending'; if (s === null) return null; return ok ? (act === 'accept' ? 'processing' : act === 'decline' ? 'declined' : 'cancelled') : undefined; });   // null : 1er passage sans cache
  if (!ok) return { error: 'tr_closed' };
  if (act !== 'accept') { await db.ref(`trades/${id}/doneAt`).set(now); return { ok: true, status: act === 'decline' ? 'declined' : 'cancelled' }; }

  const taken = [];                                      // [owner, objet retiré] pour tout remettre en cas d'échec
  const all = [...(t.give || []).map(it => [t.from, it]), ...(t.want || []).map(it => [t.to, it])];
  for (const [owner, it] of all) {
    const x = await take(db, owner, it);
    if (!x) {
      await Promise.all(taken.map(([o, i, v]) => db.ref(`inventory/${o}/items/${i.id}`).set(v)));
      await db.ref(`trades/${id}`).update({ status: 'failed', doneAt: now });
      return { error: 'tr_item' };
    }
    taken.push([owner, it, x]);
  }
  // chaque objet change de propriétaire avec un nouvel identifiant ; son compteur StatTrak le suit
  const upd = { [`trades/${id}/status`]: 'done', [`trades/${id}/doneAt`]: now };
  for (const [owner, it, x] of taken) {
    const dest = owner === t.from ? t.to : t.from, nid = db.ref().push().key;
    upd[`inventory/${dest}/items/${nid}`] = { k: x.k, f: x.f, s: x.s, st: !!x.st, ...(x.c ? { c: x.c } : {}), src: 'trade', at: now };
    if (x.st) {
      const sk = key(it.id).slice(0, 40), n = await val(db.ref(`stattrak/${owner}/${sk}`));
      if (n) { upd[`stattrak/${dest}/${key(nid).slice(0, 40)}`] = n; upd[`stattrak/${owner}/${sk}`] = null; }
    }
  }
  await db.ref().update(upd);
  return { ok: true, status: 'done' };
}

async function list(db, uid) {
  const ids = Object.keys((await val(db.ref(`tradesBy/${uid}`))) || {}).slice(-30);
  const all = (await Promise.all(ids.map(async id => ({ id, ...((await val(db.ref(`trades/${id}`))) || {}) })))).filter(x => x.from);
  return { ok: true, trades: all.map(x => ({ ...x, mine: x.from === uid })).sort((a, b) => b.at - a.at) };
}

// identifiant d'un joueur d'après son pseudo ; les anciens comptes sans entrée usernames/ sont retrouvés et complétés
async function lookup(db, name) {
  name = String(name || '').trim().slice(0, 25);
  if (!name) return { error: 'player_not_found' };
  const k = name.toLowerCase().replace(/[.#$/[\]]/g, '_');
  let uid = await val(db.ref(`usernames/${k}`));
  if (!uid) {
    const all = (await val(db.ref('profiles'))) || {};
    uid = Object.keys(all).find(u => String(all[u]?.name || '').toLowerCase() === name.toLowerCase()) || null;
    if (uid) await db.ref(`usernames/${k}`).transaction(x => x || uid);
  }
  return uid ? { ok: true, uid } : { error: 'player_not_found' };
}
// à la connexion : le pseudo du joueur est réservé à son compte s'il ne l'était pas encore (anciens comptes)
async function claimOwnName(db, uid) {
  const name = await val(db.ref(`profiles/${uid}/name`));
  if (!name) return { error: 'no_profile' };
  let mine = false;
  await db.ref(`usernames/${name.toLowerCase().replace(/[.#$/[\]]/g, '_')}`).transaction(x => { mine = !x || x === uid; return mine ? uid : undefined; });
  return { ok: true, claimed: mine };
}

module.exports = { publicInv, offer, respond, list, lookup, claimOwnName, MAX_SIDE };
