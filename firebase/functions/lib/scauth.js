const rate = require('./rate');
const TOKEN_URL = 'https://secure.soundcloud.com/oauth/token';
const REDIRECT = 'https://tickrate.eu/sc-callback';
const HOUR = 3600e3;
const short = (x, n) => typeof x === 'string' && x.length > 0 && x.length <= n;

async function handle(db, uid, data, cred, fetchImpl = fetch, now = Date.now()) {
  if (!uid) return { error: 'unauthenticated' };
  if (!cred || !cred.id || !cred.secret) return { error: 'sc_unavailable' };
  if (data.op === 'config') return { clientId: cred.id, redirect: REDIRECT };
  if (!['code', 'refresh', 'like'].includes(data.op)) return { error: 'bad_request' };
  if (!(await rate.hit(db, uid, 'scToken', 60, HOUR, now))) return { error: 'rate_limited' };

  if (data.op === 'like') {
    if (!short(data.access, 4096) || !/^\d{1,20}$/.test(String(data.id || ''))) return { error: 'bad_request' };
    try {
      const r = await fetchImpl('https://api.soundcloud.com/likes/tracks/soundcloud:tracks:' + data.id, { method: data.on ? 'POST' : 'DELETE', headers: { accept: 'application/json; charset=utf-8', authorization: 'OAuth ' + data.access } });
      return r.ok ? { ok: true } : { error: 'sc_denied' };
    } catch (e) { return { error: 'sc_network' }; }
  }

  const form = new URLSearchParams({ client_id: cred.id, client_secret: cred.secret });
  if (data.op === 'code') {
    if (!short(data.code, 4096) || !/^[A-Za-z0-9._~-]{43,128}$/.test(String(data.verifier || ''))) return { error: 'bad_request' };
    form.set('grant_type', 'authorization_code');
    form.set('redirect_uri', REDIRECT);
    form.set('code_verifier', data.verifier);
    form.set('code', data.code);
  } else {
    if (!short(data.refresh, 4096)) return { error: 'bad_request' };
    form.set('grant_type', 'refresh_token');
    form.set('refresh_token', data.refresh);
  }

  let res, json;
  try {
    res = await fetchImpl(TOKEN_URL, { method: 'POST', headers: { accept: 'application/json; charset=utf-8', 'content-type': 'application/x-www-form-urlencoded' }, body: form.toString() });
    json = await res.json();
  } catch (e) { return { error: 'sc_network' }; }
  if (!res.ok || !json || !json.access_token) return { error: 'sc_denied' };
  return { access: json.access_token, refresh: json.refresh_token || null, expiresIn: Number(json.expires_in) || 3600 };
}

module.exports = { handle, REDIRECT };
