const KEEP_MS = 365 * 864e5;
const BATCH = 400;
const val = async ref => (await ref.get()).val();
const isOld = (at, limit) => Number.isFinite(at) && at > 0 && at < limit;

async function run(db, now = Date.now()) {
  const limit = now - KEEP_MS;
  const [bans, telemetry, reports, reportsOn, reportIdx, reportDay, chatReports, vigie, feedback] = await Promise.all(
    ['bans', 'telemetry', 'reports', 'reportsOn', 'reportIdx', 'reportDay', 'chatReports', 'vigie', 'feedback'].map(p => val(db.ref(p)))
  );
  const sanctioned = uid => !!(uid && bans && bans[uid] && Number(bans[uid].until) > now);
  const del = {};
  const counts = { telemetry: 0, reports: 0, cases: 0, chatReports: 0, tickets: 0 };

  for (const [uid, rows] of Object.entries(telemetry || {})) {
    if (sanctioned(uid)) continue;
    for (const [mid, row] of Object.entries(rows || {})) if (isOld(row && row.at, limit)) { del[`telemetry/${uid}/${mid}`] = null; counts.telemetry++; }
  }

  for (const [rid, r] of Object.entries(reports || {})) {
    if (r && isOld(r.at, limit) && !sanctioned(r.target)) { del[`reports/${rid}`] = null; counts.reports++; }
  }
  for (const [uid, rows] of Object.entries(reportsOn || {})) {
    if (sanctioned(uid)) continue;
    for (const [rid, r] of Object.entries(rows || {})) if (isOld(r && r.at, limit)) del[`reportsOn/${uid}/${rid}`] = null;
  }
  for (const [who, rows] of Object.entries(reportIdx || {})) for (const [k, at] of Object.entries(rows || {})) if (isOld(at, limit)) del[`reportIdx/${who}/${k}`] = null;
  for (const [who, rows] of Object.entries(reportDay || {})) for (const [k, at] of Object.entries(rows || {})) if (isOld(at, limit)) del[`reportDay/${who}/${k}`] = null;

  for (const [id, r] of Object.entries(chatReports || {})) if (isOld(r && r.createdAt, limit)) { del[`chatReports/${id}`] = null; counts.chatReports++; }

  for (const [cid, c] of Object.entries((vigie && vigie.cases) || {})) {
    if (!c || sanctioned(c.uid) || !isOld(c.closedAt || c.createdAt, limit)) continue;
    del[`vigie/cases/${cid}`] = null;
    del[`vigie/votes/${cid}`] = null;
    const of = vigie.caseOf && vigie.caseOf[c.uid];
    if (of && of.cid === cid) del[`vigie/caseOf/${c.uid}`] = null;
    counts.cases++;
  }

  for (const [id, t] of Object.entries(feedback || {})) {
    if (!t || t.status === 'open' || !isOld(t.closedAt || t.repliedAt || t.at, limit)) continue;
    del[`feedback/${id}`] = null;
    if (t.uid) del[`ticketsBy/${t.uid}/${id}`] = null;
    counts.tickets++;
  }

  const paths = Object.keys(del);
  for (let i = 0; i < paths.length; i += BATCH) {
    await db.ref().update(Object.fromEntries(paths.slice(i, i + BATCH).map(p => [p, null])));
  }
  return { ...counts, paths: paths.length };
}

module.exports = { run, KEEP_MS };
