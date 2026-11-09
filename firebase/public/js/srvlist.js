(function () {
  const box = document.getElementById('srvLive');
  if (!box) return;
  const EN = document.documentElement.lang === 'en';
  const T = EN
    ? { srv: 'Server', mode: 'Mode', state: 'Status', map: 'Map', score: 'Score', free: 'Available', busy: 'Starting a match', live: 'Match in progress',
        any: 'All modes', ranked: '5v5 Competitive', wingman: 'Wingman 2v2', duel: '1v1 Aim', loc: 'Frankfurt · 128 tick',
        sum: (l, b, t) => `${t} servers · ${b} in use · ${l} live match${l > 1 ? 'es' : ''}`, upd: 'Updated', err: 'Live status unavailable right now.', none: 'No server online right now.' }
    : { srv: 'Serveur', mode: 'Mode', state: 'État', map: 'Map', score: 'Score', free: 'Libre', busy: 'Match en préparation', live: 'Match en cours',
        any: 'Tous modes', ranked: '5v5 Compétitif', wingman: 'Wingman 2v2', duel: '1v1 Aim', loc: 'Francfort · 128 tick',
        sum: (l, b, t) => `${t} serveurs · ${b} occupé${b > 1 ? 's' : ''} · ${l} match${l > 1 ? 's' : ''} en direct`, upd: 'Mis à jour', err: 'État en direct indisponible pour le moment.', none: 'Aucun serveur en ligne pour le moment.' };
  const URL = 'https://tickratecsgo-default-rtdb.europe-west1.firebasedatabase.app/publicStatus.json';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mapName = m => { const n = String(m || '').replace(/^(de|aim|awp|cs)_/, ''); return n === 'dust2' ? 'Dust II' : n === 'cbble' ? 'Cobblestone' : n.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); };
  const ago = t => { const s = Math.max(0, Math.round((Date.now() - t) / 1000)); return s < 90 ? (EN ? `${s} s ago` : `il y a ${s} s`) : (EN ? `${Math.round(s / 60)} min ago` : `il y a ${Math.round(s / 60)} min`); };

  function render(p) {
    const rows = Object.entries((p && p.servers) || {}).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
    if (!rows.length) { box.innerHTML = `<p>${T.none}</p>`; return; }
    box.innerHTML = `<p class="sx-live-sum"><span class="sx-dot"></span>${esc(T.sum(p.live || 0, p.busy || 0, p.total || rows.length))} · ${T.upd} ${ago(p.at || Date.now())}</p>
  <div class="sx-tbl"><table>
    <thead><tr><th>${T.srv}</th><th>${T.mode}</th><th>${T.state}</th><th>${T.map}</th><th>${T.score}</th></tr></thead>
    <tbody>${rows.map(([id, s]) => `<tr>
      <td><b>TICKRATE ${esc(id.toUpperCase())}</b><br><span class="sx-sub">${T.loc}</span></td>
      <td>${T[s.mode] || T.any}</td>
      <td><span class="sx-st sx-st-${esc(s.state)}">${T[s.state] || esc(s.state)}</span></td>
      <td>${s.map ? esc(mapName(s.map)) : '—'}</td>
      <td>${s.state === 'live' ? `${+s.sA || 0} : ${+s.sB || 0}` : '—'}</td></tr>`).join('')}</tbody>
  </table></div>`;
  }
  async function load() {
    try { const r = await fetch(URL, { cache: 'no-store' }); if (!r.ok) throw 0; render(await r.json()); }
    catch (e) { if (!box.querySelector('table')) box.innerHTML = `<p>${T.err}</p>`; }
  }
  load();
  setInterval(() => { if (!document.hidden) load(); }, 30000);
})();
