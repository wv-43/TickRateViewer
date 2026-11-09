const influencer = require('./influencer');
const comp = require('./comp');
const rooms = require('./rooms');
const { safeKey } = require('./core');
const BAN_PERMANENT = 100 * 365 * 864e5;
const val = async ref => (await ref.get()).val();
const str = (v, n) => String(v ?? '').trim().slice(0, n);

async function deleteAccount(db, uid, authClient = null) {
  if (!uid) return { error: 'unauthenticated' };
  if (await val(db.ref(`userMatch/${uid}`))) return { error: 'in_match' };
  const bill = (await val(db.ref(`billing/${uid}`))) || {};
  if (bill.subId && ['active', 'trialing', 'past_due'].includes(bill.subStatus)) return { error: 'pay_has_sub' };
  const prof = (await val(db.ref(`profiles/${uid}`))) || {};
  const box = prof.name ? require('./social').box(prof.name) : null;
  const friends = box ? (await val(db.ref(`friends/${box}`))) || {} : {};
  try { if (await val(db.ref(`teamOf/${uid}`))) await comp.team.leave(db, uid); } catch (e) {}
  try { if (await val(db.ref(`roomOf/${uid}`))) await rooms.leave(db, uid); } catch (e) {}
  const upd = {
    [`profiles/${uid}`]: null,
    [`users/${uid}`]: null,
    [`private/${uid}`]: null,
    [`loadouts/${uid}`]: null,
    [`wallet/${uid}`]: null,
    [`inventory/${uid}`]: null,
    [`containers/${uid}`]: null,
    [`eco/${uid}`]: null,
    [`stattrak/${uid}`]: null,
    [`passXp/${uid}`]: null,
    [`passClaimed/${uid}`]: null,
    [`missionClaims/${uid}`]: null,
    [`ladderWon/${uid}`]: null,
    [`teamChal/${uid}`]: null,
    [`rate/friend/${uid}`]: null, [`rate/teamInvite/${uid}`]: null, [`rate/challenge/${uid}`]: null, [`rate/lookup/${uid}`]: null,
    [`missions/${uid}`]: null,
    [`history/${uid}`]: null,
    [`presence/${uid}`]: null,
    [`csgoCheck/${uid}`]: null,
    [`dangerzone_waitlist/${uid}`]: null,
    [`influencerRequests/${uid}`]: null,
    [`teamInv/${uid}`]: null,
    [`roomInv/${uid}`]: null,
    [`ticketsBy/${uid}`]: null,
    [`friends/${uid}`]: null,
    [`friendRequests/${uid}`]: null,
    [`queue/EU/${uid}`]: null,
    [`queue/NA/${uid}`]: null,
    [`queue/AS/${uid}`]: null
  };
  if (prof.name) {
    const k = safeKey(String(prof.name).toLowerCase());
    upd[`usernames/${k}`] = null;
    upd[`playerDirectory/${box}`] = null;
    upd[`invites/${box}`] = null;
    upd[`friends/${box}`] = null;
    upd[`friendRequests/${box}`] = null;
    upd[`friendAccepts/${box}`] = null;
    for (const fBox of Object.keys(friends)) { upd[`friends/${fBox}/${box}`] = null; upd[`friendAccepts/${fBox}/${box}`] = null; }
    const reqs = (await val(db.ref('friendRequests'))) || {};
    for (const [tBox, from] of Object.entries(reqs)) if (from && from[box]) upd[`friendRequests/${tBox}/${box}`] = null;
  }
  const legacy = (await val(db.ref(`friends/${uid}`))) || {};
  upd[`friends/${uid}`] = null;
  for (const fUid of Object.keys(legacy)) upd[`friends/${fUid}/${uid}`] = null;
  const lw = (await val(db.ref('ladderWeek'))) || {};
  for (const wk of Object.keys(lw)) if (lw[wk] && lw[wk][uid] != null) upd[`ladderWeek/${wk}/${uid}`] = null;
  if (prof.steamId) upd[`steamIndex/${safeKey(prof.steamId)}`] = null;
  await db.ref().update(upd);
  if (authClient && typeof authClient.deleteUser === 'function') {
    try { await authClient.deleteUser(uid); } catch (e) {}
  }
  return { ok: true };
}

async function devAction(db, devUid, d, now = Date.now()) {
  if (!(await influencer.isDev(db, devUid))) return { error: 'forbidden' };
  const uid = str(d.uid, 128), action = str(d.action, 20);
  const prof = uid && await val(db.ref(`profiles/${uid}`));
  if (!prof) return { error: 'player_not_found' };
  const dev = (await val(db.ref(`profiles/${devUid}/name`))) || devUid;
  const targetIsDev = await influencer.isDev(db, uid);
  switch (action) {
    case 'influencer_on': return influencer.grant(db, devUid, { name: prof.name, uid, note: str(d.note, 300) });
    case 'influencer_off': return influencer.review(db, devUid, { uid, decision: 'revoke', note: str(d.note, 300) });
    case 'beta_on':
      await db.ref(`profiles/${uid}/beta`).set({ at: now, by: dev });
      return { ok: true };
    case 'beta_off':
      await db.ref(`profiles/${uid}/beta`).remove();
      return { ok: true };
    case 'ban': {
      if (uid === devUid) return { error: 'adm_self' };
      if (targetIsDev) return { error: 'adm_target_dev' };
      const minutes = Math.max(0, Math.min(525600, Math.floor(+d.minutes || 0)));
      const reason = str(d.reason, 200) || 'staff', until = minutes ? now + minutes * 60e3 : now + BAN_PERMANENT;
      const key = db.ref(`bans/${uid}/log`).push().key;
      await db.ref().update({
        [`bans/${uid}/until`]: until, [`bans/${uid}/reason`]: reason, [`bans/${uid}/minutes`]: minutes || null,
        [`bans/${uid}/by`]: dev, [`bans/${uid}/log/${key}`]: { at: now, reason, minutes: minutes || null, by: dev },
        [`queue/EU/${uid}`]: null, [`queue/NA/${uid}`]: null, [`queue/AS/${uid}`]: null
      });
      return { ok: true, until };
    }
    case 'unban': {
      const key = db.ref(`bans/${uid}/log`).push().key;
      await db.ref().update({ [`bans/${uid}/until`]: 0, [`bans/${uid}/log/${key}`]: { at: now, reason: 'unban', by: dev } });
      return { ok: true };
    }
    default: return { error: 'invalid-argument' };
  }
}

module.exports = { devAction, deleteAccount, BAN_PERMANENT };
