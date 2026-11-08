// =====================================================================
//  Connexion et « mot de passe oublié » avec le pseudo
//  Firebase Auth ne connaît que l'e-mail : le serveur retrouve l'e-mail du compte (usernames/<pseudo> -> uid -> Auth)
//  et ne le renvoie jamais au navigateur.
//   login : vérifie le mot de passe auprès de Firebase Auth et renvoie les jetons de session (comme une connexion par e-mail)
//   reset : envoie le mail de réinitialisation (modèle Firebase, langue du site) ; même réponse que le pseudo existe ou non
//  Limites : par adresse IP et par pseudo (les essais de mots de passe en rafale sont bloqués).
// =====================================================================
const { safeKey } = require('./core');
const rate = require('./rate');
const IDT = 'https://identitytoolkit.googleapis.com/v1/accounts:';
const SITE = 'https://tickrate.eu/';      // la clé web peut être limitée aux adresses du site (console Google Cloud)
const RE_NAME = /^[A-Za-z0-9_.-]{1,25}$/;
const MIN = 60e3;
const val = async ref => (await ref.get()).val();
const ipKey = ip => safeKey(String(ip || 'unknown').split(',')[0].trim()).replace(/:/g, '_').slice(0, 64);

async function emailOf(db, auth, name) {
  if (!RE_NAME.test(name)) return null;
  const uid = await val(db.ref(`usernames/${safeKey(name.toLowerCase())}`));
  if (!uid || typeof uid !== 'string') return null;
  try { return (await auth.getUser(uid)).email || null; } catch { return null; }
}

async function login(db, auth, data, ip, apiKey, fetchImpl = fetch, now = Date.now()) {
  const name = String(data.name || '').trim(), password = String(data.password || '');
  if (!name || !password || password.length > 128 || !apiKey) return { error: 'bad_credentials' };
  if (!(await rate.hit(db, ipKey(ip), 'loginIp', 20, 15 * MIN, now))
    || !(await rate.hit(db, safeKey(name.toLowerCase()).slice(0, 40), 'loginName', 10, 15 * MIN, now))) return { error: 'rate_limited' };
  const email = await emailOf(db, auth, name);
  if (!email) return { error: 'bad_credentials' };             // pseudo inconnu ou compte sans e-mail (Steam) : même réponse
  const r = await fetchImpl(`${IDT}signInWithPassword?key=${apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Referer: SITE }, body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const m = String((j.error && j.error.message) || '');
    return { error: /TOO_MANY/.test(m) ? 'rate_limited' : 'bad_credentials' };
  }
  return { ok: true, idToken: j.idToken, refreshToken: j.refreshToken, localId: j.localId, expiresIn: j.expiresIn };
}

async function reset(db, auth, data, ip, apiKey, fetchImpl = fetch, now = Date.now()) {
  const name = String(data.name || '').trim(), lang = ['fr', 'en', 'ru'].includes(data.lang) ? data.lang : 'fr';
  if (!name || !apiKey) return { ok: true };
  if (!(await rate.hit(db, ipKey(ip), 'resetIp', 10, 60 * MIN, now))
    || !(await rate.hit(db, safeKey(name.toLowerCase()).slice(0, 40), 'resetName', 3, 60 * MIN, now))) return { error: 'rate_limited' };
  const email = await emailOf(db, auth, name);
  if (email) {
    await fetchImpl(`${IDT}sendOobCode?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Referer: SITE, 'X-Firebase-Locale': lang }, body: JSON.stringify({ requestType: 'PASSWORD_RESET', email })
    }).catch(() => null);
  }
  return { ok: true };
}

module.exports = { login, reset, emailOf, ipKey };
