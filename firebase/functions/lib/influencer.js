// Programme Influenceur : demande du joueur -> validation manuelle par un dev (roles/<uid> = "dev")
// Une demande acceptée donne le plan PREMIUM gratuit (planSource = "influencer") + le badge INFLUENCEUR.
const RULES = {
  minFollowers: 1000,      // abonnés sur la plateforme principale
  minAvgViews: 200,        // vues moyennes par vidéo / spectateurs cumulés par live
  minAccountDays: 7,       // ancienneté du compte TICKRATE
  rejectCooldownDays: 14   // délai avant de refaire une demande refusée
};
const PLATFORMS = {
  twitch: /^https:\/\/(www\.)?twitch\.tv\/[A-Za-z0-9_]{3,25}\/?$/,
  youtube: /^https:\/\/(www\.)?youtube\.com\/(@[\w.-]{3,30}|channel\/[\w-]{10,40}|c\/[\w.-]{2,40})\/?$/,
  tiktok: /^https:\/\/(www\.)?tiktok\.com\/@[\w.]{2,24}\/?$/,
  kick: /^https:\/\/(www\.)?kick\.com\/[\w-]{3,25}\/?$/,
  x: /^https:\/\/(www\.)?(x|twitter)\.com\/[A-Za-z0-9_]{1,15}\/?$/,
  instagram: /^https:\/\/(www\.)?instagram\.com\/[\w.]{1,30}\/?$/
};
const code = uid => 'TICKRATE-' + String(uid).slice(0, 6).toUpperCase();
const val = async ref => (await ref.get()).val();
const isDev = async (db, uid) => (await val(db.ref(`roles/${uid}`))) === 'dev';
const str = (v, n) => String(v ?? '').trim().slice(0, n);
const int = v => Math.max(0, Math.floor(Number(v) || 0));

async function apply(db, uid, d) {
  const prof = (await val(db.ref(`profiles/${uid}`))) || {};
  if (prof.influencer) return { error: 'inf_already' };
  if (!prof.steamLinked) return { error: 'steam_required' };
  if (prof.createdAt && Date.now() - prof.createdAt < RULES.minAccountDays * 864e5) return { error: 'inf_account_young' };
  const cur = await val(db.ref(`influencerRequests/${uid}`));
  if (cur && cur.status === 'pending') return { error: 'inf_pending' };
  if (cur && (cur.status === 'rejected' || cur.status === 'revoked') && Date.now() - (cur.reviewedAt || 0) < RULES.rejectCooldownDays * 864e5) return { error: 'inf_cooldown' };

  const platform = str(d.platform, 12), url = str(d.url, 200), followers = int(d.followers), avgViews = int(d.avgViews);
  if (!PLATFORMS[platform]) return { error: 'inf_bad_platform' };
  if (!PLATFORMS[platform].test(url)) return { error: 'inf_bad_url' };
  if (followers < RULES.minFollowers) return { error: 'inf_low_followers' };
  if (avgViews < RULES.minAvgViews) return { error: 'inf_low_views' };
  if (d.csContent !== true || d.codeAdded !== true) return { error: 'inf_missing_checks' };

  const req = {
    uid, name: prof.name || 'Joueur', elo: prof.elo || 1000, platform, url,
    handle: str(d.handle, 40) || url.split('/').filter(Boolean).pop(),
    followers, avgViews, lang: str(d.lang, 5) || 'fr', message: str(d.message, 500),
    code: code(uid), status: 'pending', at: Date.now()
  };
  await db.ref(`influencerRequests/${uid}`).set(req);
  return { ok: true, request: req };
}

// decision : approve | reject | revoke
async function review(db, devUid, d) {
  if (!(await isDev(db, devUid))) return { error: 'forbidden' };
  const uid = str(d.uid, 128), decision = str(d.decision, 10), note = str(d.note, 300);
  const req = uid && await val(db.ref(`influencerRequests/${uid}`));
  if (!req) return { error: 'inf_not_found' };
  const dev = (await val(db.ref(`profiles/${devUid}/name`))) || devUid;
  const now = Date.now(), upd = {};
  const stamp = status => Object.assign(upd, {
    [`influencerRequests/${uid}/status`]: status, [`influencerRequests/${uid}/note`]: note || null,
    [`influencerRequests/${uid}/reviewedBy`]: dev, [`influencerRequests/${uid}/reviewedAt`]: now
  });
  const prof = (await val(db.ref(`profiles/${uid}`))) || {};
  if (decision === 'approve') {
    if (req.status !== 'pending') return { error: 'inf_not_pending' };
    stamp('approved');
    upd[`profiles/${uid}/influencer`] = { platform: req.platform, handle: req.handle, url: req.url, since: now };
    // un abonnement payant déjà actif reste prioritaire sur le plan offert
    if (prof.plan !== 'premium' || prof.planSource === 'influencer') {
      upd[`profiles/${uid}/plan`] = 'premium';
      upd[`profiles/${uid}/planSource`] = 'influencer';
      upd[`profiles/${uid}/planUntil`] = null;
    }
  } else if (decision === 'reject') {
    if (req.status !== 'pending') return { error: 'inf_not_pending' };
    stamp('rejected');
  } else if (decision === 'revoke') {
    if (req.status !== 'approved') return { error: 'inf_not_approved' };
    stamp('revoked');
    upd[`profiles/${uid}/influencer`] = null;
    if (prof.planSource === 'influencer') {
      upd[`profiles/${uid}/plan`] = 'free';
      upd[`profiles/${uid}/planSource`] = null;
    }
  } else return { error: 'invalid-argument' };
  await db.ref().update(upd);
  return { ok: true };
}

// un dev donne directement le statut (sans demande ni conditions) : d = { name, platform?, url?, note? }
// le joueur est retrouvé par son pseudo ; on écrit une fiche « approved » pour pouvoir retirer le statut ensuite
async function grant(db, devUid, d) {
  if (!(await isDev(db, devUid))) return { error: 'forbidden' };
  const name = str(d.name, 25);
  if (!name && !d.uid) return { error: 'player_not_found' };
  let uid = d.uid ? str(d.uid, 128) : await val(db.ref(`usernames/${name.toLowerCase().replace(/[.#$/[\]]/g, '_')}`));
  if (!uid) {   // anciens comptes sans entrée usernames/
    const all = (await val(db.ref('profiles'))) || {};
    uid = Object.keys(all).find(k => String(all[k]?.name || '').toLowerCase() === name.toLowerCase()) || null;
  }
  const prof = uid && await val(db.ref(`profiles/${uid}`));
  if (!prof) return { error: 'player_not_found' };
  if (prof.influencer) return { error: 'inf_already' };
  const platform = PLATFORMS[d.platform] ? d.platform : null, url = str(d.url, 200);
  if (url && (!platform || !PLATFORMS[platform].test(url))) return { error: 'inf_bad_url' };
  const dev = (await val(db.ref(`profiles/${devUid}/name`))) || devUid, now = Date.now();
  const handle = url ? url.split('/').filter(Boolean).pop() : null;
  const upd = {
    [`influencerRequests/${uid}`]: { uid, name: prof.name, elo: prof.elo || 1000, platform, url: url || null, handle, followers: 0, avgViews: 0,
      code: code(uid), status: 'approved', granted: true, at: now, reviewedAt: now, reviewedBy: dev, note: str(d.note, 300) || null },
    [`profiles/${uid}/influencer`]: { platform, handle, url: url || null, since: now }
  };
  if (prof.plan !== 'premium' || prof.planSource === 'influencer') {
    Object.assign(upd, { [`profiles/${uid}/plan`]: 'premium', [`profiles/${uid}/planSource`]: 'influencer', [`profiles/${uid}/planUntil`]: null });
  }
  await db.ref().update(upd);
  return { ok: true, uid, name: prof.name };
}

module.exports = { RULES, PLATFORMS, code, isDev, apply, review, grant };
