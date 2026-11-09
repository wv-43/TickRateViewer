const { setGlobalOptions } = require('firebase-functions/v2');
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret, defineString } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { getAuth } = require('firebase-admin/auth');
const mm = require('./lib/mm');
const vigie = require('./lib/vigie');
const steam = require('./lib/steam');
const eco = require('./lib/eco');
const influencer = require('./lib/influencer');
const live = require('./lib/live');
const pay = require('./lib/pay');
const steamInv = require('./lib/steaminv');
const adminActions = require('./lib/admin');
const skins = require('./lib/skins');
const inv = require('./lib/inv');
const containers = require('./lib/containers');
const rewards = require('./lib/rewards');
const tickets = require('./lib/tickets');
const trades = require('./lib/trades');
const comp = require('./lib/comp');
const ladder = require('./lib/ladder');
const social = require('./lib/social');
const rooms = require('./lib/rooms');
const authName = require('./lib/authname');
const mapVote = require('./lib/mapvote');
const Stripe = require('stripe');
const { safeKey, lvl } = require('./lib/core');
const idOf = x => safeKey(String(x || '')).slice(0, 64);

initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });
const db = () => getDatabase();
const SERVER_KEY = defineSecret('SERVER_KEY');
const STEAM_API_KEY = defineSecret('STEAM_API_KEY');
const steamKey = () => { const v = (STEAM_API_KEY.value() || '').trim(); return v && v !== 'none' ? v : ''; };
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const WEB_API_KEY = defineString('WEB_API_KEY', { default: '' });
const SC_CLIENT_ID = defineSecret('SOUNDCLOUD_CLIENT_ID');
const SC_CLIENT_SECRET = defineSecret('SOUNDCLOUD_CLIENT_SECRET');
const SITE_URLS = defineString('SITE_URLS', { default: 'http://localhost:5500,https://tickrate.web.app' });
const STEAM_FN_URL = defineString('STEAM_FN_URL', { default: '' });

const REGIONS = ['EU', 'NA', 'AS'], MODES = ['ranked', 'wingman', 'duel'];
const OPEN_REGIONS = ['EU'];
const need = req => { if (!req.auth) throw new HttpsError('unauthenticated', 'connexion requise'); return req.auth.uid; };
const fail = r => { if (r && r.error) throw new HttpsError('failed-precondition', r.error); return r; };
const val = async p => (await db().ref(p).get()).val();

exports.profileInit = onCall(async req => {
  const uid = need(req), cur = await val(`profiles/${uid}`);
  if (cur) return { ok: true, profile: cur };
  const name = await steam.claimName(db(), uid, req.data?.name || req.auth?.token?.name);
  const p = { name, elo: 1000, level: lvl(1000), matches: 0, wins: 0, trust: 10, pool: 'normal', steamLinked: false, country: String(req.data?.country || '').slice(0, 2) || null, createdAt: Date.now() };
  await db().ref(`profiles/${uid}`).set(p);
  return { ok: true, profile: p };
});
exports.rename = onCall(async req => {
  const uid = need(req), name = String(req.data?.name || '');
  if (!/^[A-Za-z0-9_.-]{3,16}$/.test(name)) throw new HttpsError('invalid-argument', 'bad_username');
  const p = (await val(`profiles/${uid}`)) || {};
  if (p.renamedAt && Date.now() - p.renamedAt < 30 * 864e5) throw new HttpsError('failed-precondition', 'rename_cooldown');
  const r = await db().ref(`usernames/${safeKey(name.toLowerCase())}`).transaction(x => (x && x !== uid ? undefined : uid));
  if (!r.committed) throw new HttpsError('already-exists', 'username_taken');
  const upd = { [`profiles/${uid}/name`]: name, [`profiles/${uid}/renamedAt`]: Date.now() };
  if (p.name && p.name.toLowerCase() !== name.toLowerCase()) upd[`usernames/${safeKey(p.name.toLowerCase())}`] = null;
  await db().ref().update(upd);
  return { ok: true };
});

exports.friendsGet = onCall(async req => {
  const uid = need(req);
  const friendsMap = (await val(`friends/${uid}`)) || {};
  const result = [];
  for (const [fUid, fData] of Object.entries(friendsMap)) {
    if (!fData || !fData.name) continue;
    const prof = (await val(`profiles/${fUid}`)) || {};
    const pres = (await val(`presence/${fUid}`)) || {};
    const isOnline = pres.online === true && (Date.now() - (pres.at || 0) < 60000);
    const inMatch = !!(await val(`userMatch/${fUid}`));
    result.push({
      uid: fUid,
      name: prof.name || fData.name,
      elo: typeof prof.elo === 'number' ? prof.elo : (fData.elo || 1000),
      avatar: prof.avatar || fData.avatar || null,
      country: prof.country || fData.country || 'FR',
      status: inMatch ? 'ingame' : isOnline ? 'online' : 'offline',
      addedAt: fData.addedAt || Date.now()
    });
  }
  return { ok: true, friends: result };
});

exports.friendRequestSend = onCall(async req => {
  const uid = need(req);
  const target = String(req.data?.target || '').trim();
  if (!target) throw new HttpsError('invalid-argument', 'target_required');

  let targetUid = null;
  const directUid = await val(`usernames/${safeKey(target.toLowerCase())}`);
  if (directUid) {
    targetUid = directUid;
  } else if (/^[A-Za-z0-9_-]{20,40}$/.test(target)) {
    targetUid = target;
  } else {
    const profiles = (await val('profiles')) || {};
    for (const [k, p] of Object.entries(profiles)) {
      if (p && p.name && p.name.toLowerCase() === target.toLowerCase()) {
        targetUid = k;
        break;
      }
    }
  }

  if (!targetUid) throw new HttpsError('not-found', 'player_not_found');
  if (targetUid === uid) throw new HttpsError('invalid-argument', 'cannot_add_self');

  const isAlready = await val(`friends/${uid}/${targetUid}`);
  if (isAlready) throw new HttpsError('already-exists', 'already_friends');

  const myProf = (await val(`profiles/${uid}`)) || {};
  const targetProf = (await val(`profiles/${targetUid}`)) || {};

  const reqPayload = {
    fromUid: uid,
    fromName: myProf.name || 'Joueur',
    elo: myProf.elo || 1000,
    avatar: myProf.avatar || null,
    country: myProf.country || 'FR',
    at: Date.now()
  };

  await db().ref(`friendRequests/${targetUid}/${uid}`).set(reqPayload);
  return { ok: true, targetName: targetProf.name || target };
});

exports.friendRequestAccept = onCall(async req => {
  const uid = need(req);
  const senderUid = idOf(req.data?.senderUid).trim();
  if (!senderUid) throw new HttpsError('invalid-argument', 'sender_required');

  const reqData = await val(`friendRequests/${uid}/${senderUid}`);
  if (!reqData) throw new HttpsError('not-found', 'request_not_found');

  const myProf = (await val(`profiles/${uid}`)) || {};
  const senderProf = (await val(`profiles/${senderUid}`)) || {};

  const now = Date.now();
  const updates = {
    [`friends/${uid}/${senderUid}`]: {
      name: senderProf.name || reqData.fromName || 'Joueur',
      elo: senderProf.elo || reqData.elo || 1000,
      avatar: senderProf.avatar || reqData.avatar || null,
      country: senderProf.country || reqData.country || 'FR',
      addedAt: now
    },
    [`friends/${senderUid}/${uid}`]: {
      name: myProf.name || 'Joueur',
      elo: myProf.elo || 1000,
      avatar: myProf.avatar || null,
      country: myProf.country || 'FR',
      addedAt: now
    },
    [`friendRequests/${uid}/${senderUid}`]: null
  };

  await db().ref().update(updates);
  return { ok: true };
});

exports.friendRequestDecline = onCall(async req => {
  const uid = need(req);
  const senderUid = idOf(req.data?.senderUid).trim();
  if (!senderUid) throw new HttpsError('invalid-argument', 'sender_required');
  await db().ref(`friendRequests/${uid}/${senderUid}`).remove();
  return { ok: true };
});

exports.friendRemove = onCall(async req => {
  const uid = need(req);
  const friendUid = idOf(req.data?.friendUid).trim();
  if (!friendUid) throw new HttpsError('invalid-argument', 'friend_required');
  const updates = {
    [`friends/${uid}/${friendUid}`]: null,
    [`friends/${friendUid}/${uid}`]: null
  };
  await db().ref().update(updates);
  return { ok: true };
});

const langOf = l => (['fr', 'en', 'ru'].includes(l) ? l : null);
exports.queueJoin = onCall(async req => {
  const uid = need(req), region = REGIONS.includes(req.data?.region) ? req.data.region : 'EU', mode = MODES.includes(req.data?.mode) ? req.data.mode : 'ranked';
  if (!OPEN_REGIONS.includes(region)) throw new HttpsError('failed-precondition', 'region_closed');
  const p = await val(`profiles/${uid}`);
  if (!p) throw new HttpsError('failed-precondition', 'no_profile');
  if (!p.steamLinked) throw new HttpsError('failed-precondition', 'steam_required');
  const ban = await val(`bans/${uid}`);
  if (ban && ban.until > Date.now()) throw new HttpsError('permission-denied', 'banned', ban);
  if (await val(`userMatch/${uid}`)) throw new HttpsError('failed-precondition', 'in_match');
  for (const r of REGIONS) await db().ref(`queue/${r}/${uid}`).remove();
  await db().ref(`queue/${region}/${uid}`).set({ mode, party: req.data?.party ? String(req.data.party).slice(0, 12) : null, lang: langOf(req.data?.lang), at: Date.now() });
  const mid = await mm.tryMatch(db(), region);
  if (!mid) await mm.publishQueue(db(), region);
  return { ok: true, matchId: mid };
});
exports.devTestMatch = onCall(async req => {
  const uid = need(req);
  if (!(await influencer.isDev(db(), uid))) throw new HttpsError('permission-denied', 'forbidden');
  return fail(await mm.testMatch(db(), uid, String(req.data?.mode || 'ranked'), { rounds: req.data?.rounds, real: !!req.data?.real, lang: langOf(req.data?.lang) }));
});
exports.matchLeave = onCall(async req => fail(await mm.leave(db(), need(req), idOf(req.data?.matchId))));
exports.devTestCancel = onCall(async req => {
  const uid = need(req);
  if (!(await influencer.isDev(db(), uid))) throw new HttpsError('permission-denied', 'forbidden');
  return fail(await mm.cancelTest(db(), uid, idOf(req.data?.matchId)));
});
exports.queueLeave = onCall(async req => { const uid = need(req); await Promise.all(REGIONS.map(r => db().ref(`queue/${r}/${uid}`).remove())); await Promise.all(OPEN_REGIONS.map(r => mm.publishQueue(db(), r))); return { ok: true }; });

async function mine(uid, mid) { const p = await val(`matches/${mid}/players/${uid}`); if (!p) throw new HttpsError('permission-denied', 'not_in_match'); return p; }
exports.accept = onCall(async req => {
  const uid = need(req), mid = idOf(req.data?.matchId); await mine(uid, mid);
  await db().ref(`matches/${mid}/players/${uid}/accepted`).set(true);
  return { ok: true, veto: await mm.onAccept(db(), mid) };
});
exports.decline = onCall(async req => {
  const uid = need(req), mid = idOf(req.data?.matchId); await mine(uid, mid);
  await db().ref(`matches/${mid}/deadline`).set(0);
  return { ok: true, status: await mm.tick(db(), mid) };
});
exports.vetoBan = onCall(async req => { const uid = need(req); return fail(await mm.veto(db(), idOf(req.data?.matchId), uid, String(req.data?.map || ''))); });
exports.matchTick = onCall(async req => { const uid = need(req), mid = idOf(req.data?.matchId); await mine(uid, mid); return { status: await mm.tick(db(), mid) }; });

exports.social = onCall(async req => {
  const uid = need(req), d = req.data || {}, fn = { send: social.send, accept: social.accept, decline: social.decline, cancel: social.cancel, remove: social.remove }[String(d.action || '')];
  if (!fn) throw new HttpsError('invalid-argument', 'bad_action');
  return fn(db(), uid, d);
});
exports.ladderBoard = onCall(async req => ladder.board(db(), need(req), req.data || {}));
exports.mapVote = onCall(async req => fail(await mapVote.vote(db(), need(req), req.data || {})));
exports.mapRotate = onSchedule({ schedule: '5 0 1 * *', timeZone: 'UTC' }, async () => {
  const r = await mapVote.rotate(db());
  console.log('rotation des maps', r);
});
exports.ladderPayout = onSchedule({ schedule: '10 0 * * 1', timeZone: 'UTC' }, async () => {
  const r = await ladder.payWeek(db(), ladder.weekId() - 1);
  console.log('ladder payé', r);
});
exports.sweeper = onSchedule({ schedule: 'every 1 minutes', timeZone: 'Europe/Paris' }, async () => {
  const act = (await val('activeMatches')) || {};
  for (const mid of Object.keys(act)) { try { await mm.tick(db(), mid); } catch (e) { console.error('tick', mid, e); } }
  for (const r of REGIONS) await mm.tryMatch(db(), r);
  for (const r of OPEN_REGIONS) await mm.publishQueue(db(), r);
  let stats = {};
  try { stats = await require('./lib/presence').summarize(db()); } catch (e) { console.error('presence', e); }
  try { await require('./lib/publicstatus').publish(db(), Date.now(), stats); } catch (e) { console.error('publicStatus', e); }
  const states = (await val('authStates')) || {};
  for (const [k, s] of Object.entries(states)) if (s.exp < Date.now()) await db().ref(`authStates/${k}`).remove();
});

exports.scAuth = onCall({ secrets: [SC_CLIENT_ID, SC_CLIENT_SECRET] }, async req => fail(await require('./lib/scauth').handle(db(), need(req), req.data || {}, { id: SC_CLIENT_ID.value().trim(), secret: SC_CLIENT_SECRET.value().trim() })));

exports.purgeOld = onSchedule({ schedule: '30 3 * * *', timeZone: 'Europe/Paris', timeoutSeconds: 540, memory: '512MiB' }, async () => {
  console.log('purge', await require('./lib/purge').run(db()));
});

exports.report = onCall(async req => fail(await vigie.report(db(), need(req), req.data || {})));
exports.vigieMe = onCall(async req => vigie.me(db(), need(req)));
exports.vigieNext = onCall(async req => fail(await vigie.next(db(), need(req))));
exports.vigieVote = onCall(async req => fail(await vigie.vote(db(), need(req), idOf(req.data?.caseId), String(req.data?.verdict || ''))));

exports.openCase = onCall(async req => fail(await eco.openCase(db(), need(req), idOf(req.data?.caseId))));
exports.claimPending = onCall(async req => fail(await eco.claimPending(db(), need(req), idOf(req.data?.id), req.data?.wear ? String(req.data.wear) : null)));
exports.quickSell = onCall(async req => fail(await eco.quickSell(db(), need(req), idOf(req.data?.itemId))));
exports.marketList = onCall(async req => fail(await eco.list(db(), need(req), idOf(req.data?.itemId), req.data?.price)));
exports.marketCancel = onCall(async req => fail(await eco.cancel(db(), need(req), idOf(req.data?.listingId))));
exports.marketBuy = onCall(async req => fail(await eco.buy(db(), need(req), idOf(req.data?.listingId))));

exports.ecoState = onCall(async req => inv.state(db(), need(req)));
exports.ecoImport = onCall(async req => fail(await inv.importLocal(db(), need(req), req.data || {})));
exports.buyCase = onCall(async req => fail(await inv.buyCase(db(), need(req), idOf(req.data?.caseId))));
exports.devItemEdit = onCall(async req => {
  const r = await inv.devEdit(db(), need(req), req.data || {});
  if (r.error === 'forbidden') throw new HttpsError('permission-denied', 'forbidden');
  return fail(r);
});
exports.tradeUp = onCall(async req => fail(await inv.tradeUp(db(), need(req), req.data?.ids)));
exports.buyShop = onCall(async req => fail(await inv.buyShop(db(), need(req), String(req.data?.kind || ''), req.data?.ref)));
exports.devGrantCases = onCall(async req => {
  const r = await inv.grantDevCases(db(), need(req), req.data?.count || 50);
  if (r.error === 'forbidden') throw new HttpsError('permission-denied', 'forbidden');
  return fail(r);
});

exports.containerList = onCall(async req => fail(await containers.list(db(), need(req))));
exports.containerCreate = onCall(async req => fail(await containers.create(db(), need(req), req.data?.name)));
exports.containerRename = onCall(async req => fail(await containers.rename(db(), need(req), idOf(req.data?.containerId), req.data?.name)));
exports.containerDeposit = onCall(async req => fail(await containers.deposit(db(), need(req), idOf(req.data?.containerId), req.data?.itemIds)));
exports.containerRetrieve = onCall(async req => fail(await containers.retrieve(db(), need(req), idOf(req.data?.containerId), req.data?.itemIds)));
exports.containerDelete = onCall(async req => fail(await containers.remove(db(), need(req), idOf(req.data?.containerId))));
const compErr = r => { if (r && r.error === 'forbidden') throw new HttpsError('permission-denied', 'forbidden'); return r; };
exports.team = onCall(async req => {
  const uid = need(req), d = req.data || {}, fn = comp.team[String(d.action || 'get')];
  if (!fn) throw new HttpsError('invalid-argument', 'bad_action');
  return compErr(await fn(db(), uid, d));
});
exports.clan = onCall(async req => {
  const uid = need(req), d = req.data || {}, fn = require('./lib/clans').actions[String(d.action || 'get')];
  if (!fn) throw new HttpsError('invalid-argument', 'bad_action');
  return fail(await fn(db(), uid, d));
});
exports.tourney = onCall(async req => {
  const uid = need(req), d = req.data || {}, fn = comp.tourney[String(d.action || 'list')];
  if (!fn) throw new HttpsError('invalid-argument', 'bad_action');
  return compErr(await fn(db(), uid, d));
});
exports.room = onCall(async req => {
  const uid = need(req), d = req.data || {}, act = String(d.action || 'get');
  const fn = { get: rooms.get, create: rooms.create, settings: rooms.settings, invite: rooms.invite, join: rooms.join, decline: rooms.decline, leave: rooms.leave, kick: rooms.kick, team: rooms.team, start: rooms.start }[act];
  if (!fn) throw new HttpsError('invalid-argument', 'bad_action');
  const r = await fn(db(), uid, d);
  if (r.error === 'forbidden') throw new HttpsError('permission-denied', 'forbidden');
  return r;
});
exports.invPublic = onCall(async req => fail(await trades.publicInv(db(), need(req), req.data?.uid)));
exports.tradeOffer = onCall(async req => fail(await trades.offer(db(), need(req), req.data || {})));
exports.tradeRespond = onCall(async req => fail(await trades.respond(db(), need(req), req.data || {})));
exports.tradeList = onCall(async req => trades.list(db(), need(req)));
exports.playerLookup = onCall(async req => {
  const uid = need(req), rl = await require('./lib/rate').limit(db(), uid, 'lookup'); if (rl) return rl;
  return fail(await trades.lookup(db(), req.data?.name));
});
const ipOf = req => (req.rawRequest && (req.rawRequest.get('x-forwarded-for') || req.rawRequest.ip)) || '';
exports.loginName = onCall(async req => fail(await authName.login(db(), getAuth(), req.data || {}, ipOf(req), WEB_API_KEY.value())));
exports.resetName = onCall(async req => fail(await authName.reset(db(), getAuth(), req.data || {}, ipOf(req), WEB_API_KEY.value())));
exports.claimOwnName = onCall({ secrets: [STEAM_API_KEY] }, async req => {
  const uid = need(req), r = await trades.claimOwnName(db(), uid);
  await steam.refreshAvatar(db(), uid, { steamKey: steamKey() }).catch(e => console.error('avatar', uid, e));
  return r;
});
exports.ticketSend = onCall(async req => fail(await tickets.send(db(), need(req), req.data || {})));
exports.ticketMine = onCall(async req => tickets.mine(db(), need(req)));
exports.ticketReply = onCall(async req => {
  const r = await tickets.reply(db(), need(req), req.data || {});
  if (r.error === 'forbidden') throw new HttpsError('permission-denied', 'forbidden');
  return fail(r);
});
exports.claimMission = onCall(async req => fail(await rewards.claimMission(db(), need(req), idOf(req.data?.id))));
exports.claimPass = onCall(async req => fail(await rewards.claimPass(db(), need(req), String(req.data?.track || ''), req.data?.tier)));
exports.buyNpc = onCall(async req => fail(await inv.buyNpc(db(), need(req), idOf(req.data?.offerId))));

exports.influencerApply = onCall(async req => fail(await influencer.apply(db(), need(req), req.data || {})));
exports.devAction = onCall(async req => {
  const r = await adminActions.devAction(db(), need(req), req.data || {});
  if (r.error === 'forbidden') throw new HttpsError('permission-denied', 'forbidden');
  return fail(r);
});
exports.deleteAccount = onCall(async req => fail(await adminActions.deleteAccount(db(), need(req), getAuth())));
exports.influencerGrant = onCall(async req => {
  const r = await influencer.grant(db(), need(req), req.data || {});
  if (r.error === 'forbidden') throw new HttpsError('permission-denied', 'forbidden');
  return fail(r);
});
exports.influencerReview = onCall(async req => {
  const r = await influencer.review(db(), need(req), req.data || {});
  if (r.error === 'forbidden') throw new HttpsError('permission-denied', 'forbidden');
  return fail(r);
});

const stripe = () => new (Stripe.default || Stripe)(STRIPE_SECRET_KEY.value());
const sites = () => SITE_URLS.value().split(',').map(x => x.trim()).filter(Boolean);
exports.payCheckout = onCall({ secrets: [STRIPE_SECRET_KEY] }, async req => fail(await pay.checkout(db(), stripe(), need(req), req.data || {}, req.data?.origin, sites())));
exports.payPortal = onCall({ secrets: [STRIPE_SECRET_KEY] }, async req => fail(await pay.portal(db(), stripe(), need(req), req.data?.origin, sites())));
exports.stripeWebhook = onRequest({ secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] }, async (req, res) => {
  let ev;
  try { ev = stripe().webhooks.constructEvent(req.rawBody, req.get('stripe-signature'), STRIPE_WEBHOOK_SECRET.value()); }
  catch (e) { console.warn('stripe: signature refusée', e.message); return res.status(400).send('bad signature'); }
  try { res.json(await pay.handleEvent(db(), ev, eco.addCoins)); }
  catch (e) { console.error('stripe', ev.type, e); res.status(500).send('error'); }
});

exports.steamGames = onCall({ secrets: [STEAM_API_KEY] }, async req => {
  const uid = need(req), sid = await val(`profiles/${uid}/steamId`);
  if (!sid) throw new HttpsError('failed-precondition', 'steam_required');
  if (!steamKey()) return { owns: null };
  const r = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${steamKey()}&steamid=${sid}&include_played_free_games=1&appids_filter[0]=730&appids_filter[1]=4465480`);
  const j = await r.json().catch(() => ({}));
  if (!j.response || j.response.game_count === undefined) return { private: true };
  const games = j.response.games || [];
  return { owns: games.length > 0, playtime: games.reduce((s, g) => s + (g.playtime_forever || 0), 0) };
});

exports.steamInventory = onCall(async req => fail(await steamInv.load(db(), need(req))));

exports.steamAuth = onRequest({ secrets: [STEAM_API_KEY] }, async (req, res) => {
  const host = req.get('host') || '';
  const base = (STEAM_FN_URL.value() || `https://${host}${host.includes('cloudfunctions.net') ? '/steamAuth' : ''}`).replace(/\/$/, '');
  const allowed = SITE_URLS.value().split(',').map(s => s.trim()).filter(Boolean);
  let r;
  try {
    r = req.path.endsWith('/return')
      ? await steam.back(db(), getAuth(), req.query, { selfUrl: base, steamKey: steamKey() })
      : await steam.start(db(), getAuth(), req.query, base, allowed);
  } catch (e) {
    console.error('steamAuth', e);
    r = { redirect: `${allowed[0].replace(/\/$/, '')}/#steam=error` };
  }
  if (r.redirect) return res.redirect(302, r.redirect);
  res.status(r.status || 400).send(r.body || 'erreur');
});

function sameKey(got, want) {
  if (!want || typeof got !== 'string') return false;
  const a = require('crypto').createHash('sha256').update(got).digest(), b = require('crypto').createHash('sha256').update(want).digest();
  return require('crypto').timingSafeEqual(a, b);
}
exports.gameApi = onRequest({ secrets: [SERVER_KEY] }, async (req, res) => {
  if (!sameKey(req.get('X-Server-Key'), SERVER_KEY.value())) return res.status(403).json({ error: 'forbidden' });
  const b = req.body || {}, path = req.path.replace(/\/$/, '');
  try {
    if (req.method === 'GET' && path.endsWith('/assignment')) {
      const a = await val(`servers/${safeKey(req.query.server || '')}/assignment`);
      return a ? res.json(a) : res.status(204).end();
    }
    if (req.method === 'GET' && path.endsWith('/loadout')) {
      const uid = await val(`steamIndex/${safeKey(req.query.steamId || '')}`);
      const pref = (uid && await val(`loadouts/${uid}/loadout/pref`)) || {};
      return res.json({ ok: !!uid, m4: pref.m4 === 'm4a1-s' ? 'weapon_m4a1_silencer' : 'weapon_m4a1', ctPistol: pref.ctp === 'p2000' ? 'weapon_hkp2000' : 'weapon_usp_silencer',
        deagle: pref.dg === 'r8-revolver' ? 'weapon_revolver' : 'weapon_deagle', cz: pref.cz === 'cz75-auto', mp5: pref.mp === 'mp5-sd' });
    }
    if (req.method === 'GET' && path.endsWith('/skins')) {
      const uid = await val(`steamIndex/${safeKey(req.query.steamId || '')}`);
      if (!uid) return res.json({ ok: false });
      const [lo, cnt, own] = await Promise.all([val(`loadouts/${uid}`), val(`stattrak/${uid}`), skins.owned(db(), uid)]);
      return res.json({ ok: true, ...skins.build(lo, cnt || {}, own) });
    }
    if (req.method === 'POST' && path.endsWith('/stattrak')) {
      const uid = await val(`steamIndex/${safeKey(b.steamId || '')}`);
      return res.json(uid ? await skins.addStatTrak(db(), uid, b.kills) : { ok: false });
    }
    if (req.method === 'POST' && path.endsWith('/joined')) return res.json(await mm.joined(db(), String(b.matchId), String(b.steamId)));
    if (req.method === 'POST' && path.endsWith('/left')) return res.json(await mm.left(db(), String(b.matchId), String(b.steamId)));
    if (req.method === 'POST' && path.endsWith('/round')) {
      const r = await live.round(db(), String(b.matchId), b);
      return r.error ? res.status(409).json(r) : res.json(r);
    }
    if (req.method === 'POST' && path.endsWith('/end')) {
      const r = await mm.finish(db(), String(b.matchId), b);
      if (r.error) return res.status(409).json(r);
      r.drops = {};
      if (!r.test || r.testReal) await Promise.all(Object.keys(r.results).map(async uid => { r.drops[uid] = await eco.dropsAfterMatch(db(), uid); }));
      if (Object.keys(r.drops).length) await db().ref(`matches/${b.matchId}/drops`).set(r.drops);
      r.screen = await eco.endScreen(db(), String(b.matchId), r);
      return res.json(r);
    }
    if (req.method === 'POST' && path.endsWith('/telemetry')) return res.json(await vigie.ingest(db(), b));
    if (req.method === 'POST' && path.endsWith('/feedback')) {
      const sid = String(b.steamId || ''), text = String(b.text || '').trim().slice(0, 300), now = Date.now();
      if (!/^\d{17}$/.test(sid) || text.length < 3) return res.status(400).json({ error: 'bad_feedback' });
      let ok = false;
      await db().ref(`feedbackAt/${sid}`).transaction(at => { ok = !at || now - at > 30000; return ok ? now : undefined; });
      if (!ok) return res.status(429).json({ error: 'too_fast' });
      const uid = await val(`steamIndex/${sid}`), name = uid ? await val(`profiles/${uid}/name`) : null;
      const cut = (x, n) => String(x || '').slice(0, n) || null;
      const fid = db().ref('feedback').push().key;
      await db().ref().update({
        [`feedback/${fid}`]: { steamId: sid, uid: uid || null, name: name || null, cat: 'other', text, source: 'game', status: 'open', matchId: cut(b.matchId, 40), server: cut(b.server, 16), lang: cut(b.lang, 4), at: now },
        ...(uid ? { [`ticketsBy/${uid}/${fid}`]: true } : {})
      });
      return res.json({ ok: true });
    }
    if (req.method === 'POST' && path.endsWith('/check')) {
      const uid = await val(`steamIndex/${safeKey(b.steamId || '')}`);
      if (!uid) return res.json({ ok: false, error: 'unknown_steam' });
      await db().ref(`csgoCheck/${uid}`).set({ ok: true, at: Date.now(), client: String(b.client || '').slice(0, 40) || null });
      return res.json({ ok: true, name: (await val(`profiles/${uid}/name`)) || null });
    }
    res.status(404).json({ error: 'not_found' });
  } catch (e) { console.error(e); res.status(500).json({ error: 'server_error' }); }
});
