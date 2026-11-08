// =====================================================================
//  Connexion Steam (OpenID 2.0) -> compte Firebase
//  /start?mode=login|link&ret=<url du site>[&idToken=<jeton si on lie un compte existant>]
//  /return  (Steam renvoie ici) -> vérification auprès de Steam -> retour sur le site :
//     login : <ret>#ft=<custom token>   (le site l'échange contre une session Firebase)
//     link  : <ret>#steam=linked|taken|error
// =====================================================================
const { rid, safeKey } = require('./core');
const STEAM = 'https://steamcommunity.com/openid/login';
const val = async ref => (await ref.get()).val();

function allowedReturn(ret, allowed) {
  try {
    let raw = String(ret || '').trim();
    if (!/^https?:\/\/localhost(?::\d+)?(\/.*)?$/i.test(raw)) {
      raw = raw.replace(/^http:\/\//i, 'https://');
    }
    const u = new URL(raw);
    return allowed.some(a => {
      if (a === '*') return true;
      let safeA = a;
      if (!/^https?:\/\/localhost(?::\d+)?(\/.*)?$/i.test(safeA)) {
        safeA = safeA.replace(/^http:\/\//i, 'https://');
      }
      const x = new URL(safeA);
      return x.origin === u.origin;
    }) ? u.origin + u.pathname : null;
  } catch { return null; }
}
async function start(db, auth, q, selfUrl, allowed, now = Date.now()) {
  const ret = allowedReturn(q.ret, allowed);
  if (!ret) return { status: 400, body: 'ret non autorisé' };
  let uid = null;
  if (q.mode === 'link') {
    try { uid = (await auth.verifyIdToken(String(q.idToken || ''))).uid; } catch { return { redirect: ret + '#steam=error' }; }
  }
  const state = rid(16);
  await db.ref(`authStates/${state}`).set({ uid, mode: q.mode === 'link' ? 'link' : 'login', ret, exp: now + 10 * 60e3 });
  const p = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0', 'openid.mode': 'checkid_setup',
    'openid.return_to': `${selfUrl}/return?state=${state}`, 'openid.realm': new URL(selfUrl).origin,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select', 'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
  });
  return { redirect: `${STEAM}?${p}` };
}
async function verifyWithSteam(q, fetchImpl = fetch) {
  if (q['openid.mode'] !== 'id_res' || q['openid.op_endpoint'] !== STEAM) return null;
  const body = new URLSearchParams(q); body.set('openid.mode', 'check_authentication');
  const r = await fetchImpl(STEAM, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  if (!/is_valid\s*:\s*true/.test(await r.text())) return null;
  const m = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/.exec(q['openid.claimed_id'] || '');
  return m ? m[1] : null;
}
// avatar Steam : seule une image https des serveurs de Steam est gardée
const okAvatar = u => (typeof u === 'string' && /^https:\/\/([a-z0-9-]+\.)*(steamstatic\.com|akamaihd\.net)\/[^'"()<>\s\\]+$/.test(u) ? u : null);
async function persona(steamId, key, fetchImpl = fetch) {
  if (!key) {   // sans clé d'API : profil public Steam (XML), pseudo + avatar
    try {
      const r = await fetchImpl(`https://steamcommunity.com/profiles/${steamId}?xml=1`);
      const x = await r.text(), pick = tag => { const m = new RegExp(`<${tag}><!\\[CDATA\\[([^\\]]*)\\]\\]></${tag}>`).exec(x); return m ? m[1].trim() : null; };
      const avatar = okAvatar(pick('avatarFull'));
      return avatar || pick('steamID') ? { name: pick('steamID'), avatar, country: null } : null;
    } catch { return null; }
  }
  try {
    const r = await fetchImpl(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamId}`);
    const p = (await r.json())?.response?.players?.[0];
    return p ? { name: p.personaname, avatar: okAvatar(p.avatarfull), country: p.loccountrycode || null } : null;
  } catch { return null; }
}
async function claimName(db, uid, wanted) {
  const base = String(wanted || 'Joueur').replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 14) || 'Joueur';
  for (let i = 0; i < 20; i++) {
    const n = i ? base.slice(0, 12) + Math.floor(Math.random() * 900 + 100) : base, key = safeKey(n.toLowerCase());
    const r = await db.ref(`usernames/${key}`).transaction(x => (x ? undefined : uid));
    if (r.committed) return n;
  }
  return 'Joueur' + rid(4);
}
async function back(db, auth, q, opts, now = Date.now()) {
  const sk = safeKey(String(q.state || '')).slice(0, 40);   // jamais de « / » dans le chemin
  if (!sk) return { status: 400, body: 'session expirée, recommence' };
  const st = await val(db.ref(`authStates/${sk}`));
  await db.ref(`authStates/${sk}`).remove();
  if (!st || st.exp < now) return { status: 400, body: 'session expirée, recommence' };
  if (q['openid.mode'] !== 'id_res') return { redirect: st.ret + '#steam=cancel' };
  if (!String(q['openid.return_to'] || '').startsWith(`${opts.selfUrl}/return`)) return { redirect: st.ret + '#steam=error' };
  const steamId = await verifyWithSteam(q, opts.fetch);
  if (!steamId) return { redirect: st.ret + '#steam=error' };
  const owner = await val(db.ref(`steamIndex/${steamId}`));
  if (st.mode === 'link') {
    if (owner && owner !== st.uid) return { redirect: st.ret + '#steam=taken' };
    const per = await persona(steamId, opts.steamKey, opts.fetch);
    await db.ref().update({ [`steamIndex/${steamId}`]: st.uid, [`profiles/${st.uid}/steamId`]: steamId, [`profiles/${st.uid}/steamLinked`]: true,
      ...(per?.avatar ? { [`profiles/${st.uid}/avatar`]: per.avatar, [`profiles/${st.uid}/avatarAt`]: now } : {}) });
    return { redirect: st.ret + '#steam=linked' };
  }
  let uid = owner;
  if (!uid) {   // nouveau joueur via Steam
    uid = 'steam_' + steamId;
    const per = await persona(steamId, opts.steamKey, opts.fetch);
    const name = await claimName(db, uid, per?.name || 'Steam' + steamId.slice(-4));
    await db.ref().update({
      [`steamIndex/${steamId}`]: uid,
      [`profiles/${uid}`]: { name, elo: 1000, level: 2, matches: 0, wins: 0, trust: 10, pool: 'normal', steamId, steamLinked: true, country: per?.country || null, avatar: per?.avatar || null, createdAt: now }
    });
  }
  else await refreshAvatar(db, uid, opts, now);
  const token = await auth.createCustomToken(uid);
  return { redirect: `${st.ret}#ft=${encodeURIComponent(token)}` };
}
// avatar du profil depuis Steam (au plus une fois par jour)
async function refreshAvatar(db, uid, opts = {}, now = Date.now()) {
  const p = (await val(db.ref(`profiles/${uid}`))) || {};
  if (!p.steamId || (p.avatar && now - (p.avatarAt || 0) < 864e5)) return p.avatar || null;
  const per = await persona(p.steamId, opts.steamKey, opts.fetch);
  await db.ref(`profiles/${uid}`).update({ avatarAt: now, ...(per?.avatar ? { avatar: per.avatar } : {}) });
  return per?.avatar || p.avatar || null;
}
module.exports = { start, back, verifyWithSteam, claimName, allowedReturn, persona, refreshAvatar, okAvatar };
