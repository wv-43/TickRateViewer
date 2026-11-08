// Pages Actualités (/actualites, /en/news) : résultat mensuel du vote des maps, lu dans publicNews/maps
// (écrit par la fonction mapRotate le 1er de chaque mois, lisible sans compte). Sans résultat : le texte du HTML reste affiché.
(function () {
  const box = document.getElementById('newsMaps');
  if (!box) return;
  const EN = box.dataset.lang === 'en';
  const MONTHS = EN ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                    : ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const name = m => { const n = String(m).replace(/^de_/, ''); return n === 'dust2' ? 'Dust II' : n === 'cbble' ? 'Cobblestone' : n.charAt(0).toUpperCase() + n.slice(1); };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // période votée « 2026-11 » -> rotation appliquée le mois suivant
  const label = per => { const [y, m] = per.split('-').map(Number), n = m === 12 ? [y + 1, 0] : [y, m]; return `${MONTHS[n[1]]} ${n[0]}`; };
  const T = EN
    ? { title: p => `Rotation for ${label(p)}`, voters: n => `${n} voter${n > 1 ? 's' : ''}`, kept: 'Not enough voters: the pool stays the same.', pool: 'Map pool', in: 'In', out: 'Out', prev: 'Previous months' }
    : { title: p => `Rotation de ${label(p)}`, voters: n => `${n} votant${n > 1 ? 's' : ''}`, kept: 'Pas assez de votants : le pool ne change pas.', pool: 'Pool de maps', in: 'Entrent', out: 'Sortent', prev: 'Mois précédents' };
  const chips = (list, cls) => `<div class="sx-chips">${list.map(m => `<span class="sx-chip ${cls || ''}">${esc(name(m))}</span>`).join('')}</div>`;

  fetch('https://tickratecsgo-default-rtdb.europe-west1.firebasedatabase.app/publicNews/maps.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : null)
    .then(all => {
      const pers = Object.keys(all || {}).filter(p => /^\d{4}-\d{2}$/.test(p)).sort().reverse();
      if (!pers.length) return;
      const one = (p, big) => {
        const x = all[p] || {};
        return `<${big ? 'h3' : 'h4'}>${T.title(p)} · ${T.voters(+x.voters || 0)}</${big ? 'h3' : 'h4'}>
          ${x.applied ? '' : `<p>${T.kept}</p>`}
          ${(x.added || []).length ? `<p>${T.in}</p>${chips(x.added, 'in')}` : ''}
          ${(x.removed || []).length ? `<p>${T.out}</p>${chips(x.removed, 'out')}` : ''}
          <p>${T.pool}</p>${chips(x.maps || [])}`;
      };
      box.innerHTML = one(pers[0], true) + (pers.length > 1 ? `<details><summary>${T.prev}</summary>${pers.slice(1, 12).map(p => one(p)).join('')}</details>` : '');
    })
    .catch(() => {});
})();
