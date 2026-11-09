if (typeof FB_ERR === 'object') ['clan_already', 'clan_bad_name', 'clan_bad_tag', 'clan_tag_taken', 'clan_full', 'clan_unknown', 'clan_reqs_full', 'clan_other', 'forbidden', 'no_profile'].forEach(k => { if (!FB_ERR[k]) FB_ERR[k] = k; });

const CL = { me: null, list: null, q: '', open: false, sort: 'points', busy: false, creating: false, editing: false, loading: false };
const CL_COLORS = ['#f5f5f5', '#c4562a', '#3b6fd6', '#2e9d6c', '#7a5cc4', '#c9424d', '#c08a1e', '#2b8f80', '#b0447a'];
const clLive = () => typeof fbLive === 'function' && fbLive() && typeof FBA === 'object' && FBA.uid;
const clErr = e => { const k = 'cl_err_' + e; const m = t(k); return m === k ? t('cl_err') : m; };

async function clCall(action, data = {}) {
  if (CL.busy) return null;
  CL.busy = true;
  try {
    const r = await fbCall('clan', { action, ...data });
    if (r && r.error) { toast(clErr(r.error)); return null; }
    return r;
  } finally { CL.busy = false; }
}
async function clLoad() {
  if (!clLive() || CL.loading) return;
  CL.loading = true;
  try {
    const [me, list] = await Promise.all([fbCall('clan', { action: 'get' }), fbCall('clan', { action: 'list', q: CL.q, open: CL.open, sort: CL.sort })]);
    if (me && !me.error) CL.me = me;
    if (list && !list.error) CL.list = list;
  } finally { CL.loading = false; }
  renderClans();
}
async function clRefreshList() {
  const list = await fbCall('clan', { action: 'list', q: CL.q, open: CL.open, sort: CL.sort });
  if (list && !list.error) { CL.list = list; renderClansList(); }
}

const clBadge = (tag, color) => `<span class="cl-tag" style="--cc:${escA(color || '#f5f5f5')}">${escA(tag)}</span>`;
const clRole = r => `<span class="cl-role cl-role-${r}">${t('cl_role_' + r)}</span>`;

function clMyPanel() {
  const me = CL.me;
  if (!clLive()) return `<section class="cl-card cl-empty-me"><h2>${t('cl_title')}</h2><p>${t('cl_login')}</p></section>`;
  if (!me) return `<section class="cl-card"><p class="cl-muted">…</p></section>`;
  if (!me.clan) {
    if (CL.creating) return `<section class="cl-card cl-create">
      <h2>${t('cl_create')}</h2>
      <form id="clCreate" class="cl-form" autocomplete="off">
        <label>${t('cl_name')}<input name="name" maxlength="24" required></label>
        <label>${t('cl_tag')}<input name="tag" maxlength="5" required class="cl-tag-in"></label>
        <label class="cl-wide">${t('cl_desc')}<input name="desc" maxlength="140"></label>
        <div class="cl-colors cl-wide">${CL_COLORS.map((c, i) => `<label class="cl-color"><input type="radio" name="color" value="${c}"${i ? '' : ' checked'}><i style="background:${c}"></i></label>`).join('')}</div>
        <label class="cl-check cl-wide"><input type="checkbox" name="open" checked> ${t('cl_open')}</label>
        <div class="cl-actions cl-wide"><button class="btn primary" type="submit">${t('cl_create_go')}</button><button class="btn ghost" type="button" data-cl="cancelCreate">${t('cl_cancel')}</button></div>
      </form></section>`;
    return `<section class="cl-card cl-none"><div><h2>${t('cl_none_t')}</h2><p>${t('cl_none_s')}</p></div>
      <button class="btn primary" type="button" data-cl="startCreate">${t('cl_create')}</button></section>`;
  }
  const c = me.clan, role = me.role, staff = role === 'owner' || role === 'officer';
  const order = { owner: 0, officer: 1, member: 2 };
  const members = [...c.members].sort((a, b) => order[a.role] - order[b.role] || (a.at || 0) - (b.at || 0));
  const canKick = m => m.uid !== FBA.uid && m.role !== 'owner' && (role === 'owner' || (role === 'officer' && m.role === 'member'));
  const reqs = me.requests || [];
  return `<section class="cl-card cl-mine" style="--cc:${escA(c.color)}">
    <div class="cl-head">
      <div class="cl-emblem">${escA(c.tag)}</div>
      <div class="cl-id"><span class="cl-kicker">${t('cl_mine')} · ${t(c.open ? 'cl_open_t' : 'cl_closed_t')}</span>
        <h2>${escA(c.name)} ${clBadge(c.tag, c.color)}</h2>
        ${CL.editing ? '' : `<p class="cl-desc">${escA(c.desc || '')}</p>`}</div>
      <div class="cl-stats">
        <div><b>${(c.points || 0).toLocaleString()}</b><span>${t('cl_points')}</span></div>
        <div><b>${t('cl_lvl', { n: c.level })}</b><span>${t('cl_wl', { w: c.w, l: c.l })}</span></div>
        <div><b>${t('cl_members', { n: c.n, m: c.max })}</b><span>${t('cl_sort_members')}</span></div>
      </div>
    </div>
    ${CL.editing ? `<form id="clEdit" class="cl-form" autocomplete="off">
        <label class="cl-wide">${t('cl_desc')}<input name="desc" maxlength="140" value="${escA(c.desc || '')}"></label>
        <div class="cl-colors cl-wide">${CL_COLORS.map(col => `<label class="cl-color"><input type="radio" name="color" value="${col}"${col === c.color ? ' checked' : ''}><i style="background:${col}"></i></label>`).join('')}</div>
        <label class="cl-check cl-wide"><input type="checkbox" name="open"${c.open ? ' checked' : ''}> ${t('cl_open')}</label>
        <div class="cl-actions cl-wide"><button class="btn primary" type="submit">${t('cl_save')}</button><button class="btn ghost" type="button" data-cl="cancelEdit">${t('cl_cancel')}</button></div>
      </form>` : ''}
    <label class="cl-equip"><input type="checkbox" id="clEquip"${me.tagOn ? ' checked' : ''}><span class="cl-sw"></span>
      <span><b>${t('cl_tag_on', { t: escA(c.tag) })}</b><small>${t('cl_tag_hint')}</small></span></label>
    ${staff && reqs.length ? `<div class="cl-reqs"><h3>${t('cl_requests', { n: reqs.length })}</h3>
      ${reqs.map(r => `<div class="cl-row"><span class="cl-mname">${escA(r.name)}</span>
        <button class="btn sm primary" data-cl="accept" data-uid="${escA(r.uid)}">${t('cl_accept')}</button>
        <button class="btn sm ghost" data-cl="refuse" data-uid="${escA(r.uid)}">${t('cl_refuse')}</button></div>`).join('')}</div>` : ''}
    <div class="cl-members">
      ${members.map(m => `<div class="cl-row"><span class="cl-mname">${escA(m.name)}</span>${clRole(m.role)}
        <span class="cl-ops">
          ${role === 'owner' && m.role === 'member' ? `<button class="btn sm ghost" data-cl="promote" data-uid="${escA(m.uid)}">${t('cl_promote')}</button>` : ''}
          ${role === 'owner' && m.role === 'officer' ? `<button class="btn sm ghost" data-cl="demote" data-uid="${escA(m.uid)}">${t('cl_demote')}</button>` : ''}
          ${role === 'owner' && m.uid !== FBA.uid ? `<button class="btn sm ghost" data-cl="owner" data-uid="${escA(m.uid)}" data-name="${escA(m.name)}">${t('cl_make_owner')}</button>` : ''}
          ${canKick(m) ? `<button class="btn sm ghost cl-danger" data-cl="kick" data-uid="${escA(m.uid)}" data-name="${escA(m.name)}">${t('cl_kick')}</button>` : ''}
        </span></div>`).join('')}
    </div>
    <div class="cl-actions">
      ${staff && !CL.editing ? `<button class="btn ghost" data-cl="startEdit">${t('cl_edit')}</button>` : ''}
      <button class="btn ghost" data-cl="leave">${t('cl_leave')}</button>
      ${role === 'owner' ? `<button class="btn ghost cl-danger" data-cl="disband">${t('cl_disband')}</button>` : ''}
    </div>
    <p class="cl-muted">${t('cl_how')}</p>
  </section>`;
}

function clCard(c, big) {
  const me = CL.me, inClan = me && me.clan, mine = inClan && me.clan.id === c.id, asked = me && (me.myReqs || []).includes(c.id);
  const full = c.n >= c.max;
  const btn = !clLive() || mine ? '' : inClan ? '' : asked ? `<button class="btn sm ghost" data-cl="cancelReq" data-cid="${escA(c.id)}">${t('cl_asked')}</button>`
    : full ? `<span class="cl-muted">${t('cl_full')}</span>` : `<button class="btn sm primary" data-cl="join" data-cid="${escA(c.id)}">${t(c.open ? 'cl_join' : 'cl_ask')}</button>`;
  return `<article class="cl-item${big ? ' cl-podium' : ''}${mine ? ' cl-is-mine' : ''}" style="--cc:${escA(c.color)}">
    <span class="cl-rank">#${c.rank}</span>
    <div class="cl-emblem">${escA(c.tag)}</div>
    <h3>${escA(c.name)}</h3>
    <div class="cl-meta">${clBadge(c.tag, c.color)}<span>${t('cl_lvl', { n: c.level })}</span><span>${t(c.open ? 'cl_open_t' : 'cl_closed_t')}</span></div>
    ${big ? '' : `<p class="cl-desc">${escA(c.desc || '')}</p>`}
    <div class="cl-pts"><b>${(c.points || 0).toLocaleString()}</b> ${t('cl_points')}</div>
    <div class="cl-foot"><span>${t('cl_members', { n: c.n, m: c.max })}</span><span>${t('cl_wl', { w: c.w, l: c.l })}</span>${btn}</div>
  </article>`;
}
function renderClansList() {
  const box = $('#clList'); if (!box) return;
  const rows = (CL.list && CL.list.clans) || [];
  box.innerHTML = rows.length ? rows.map(c => clCard(c)).join('') : `<p class="cl-muted cl-center">${CL.q || CL.open ? t('cl_noresult') : t('cl_empty')}</p>`;
}
function renderClans() {
  const box = $('#clans'); if (!box) return;
  const all = (CL.list && CL.list.clans) || [];
  const top = [...all].sort((a, b) => a.rank - b.rank).slice(0, 3);
  const podium = top.length === 3 ? [top[1], top[0], top[2]] : top;
  box.innerHTML = `<div class="cl-wrap">
    <header class="cl-top"><h1 class="h1">${t('cl_title')}</h1><p class="cl-muted">${t('cl_lead')}</p></header>
    ${clMyPanel()}
    ${top.length && !CL.q && !CL.open && CL.sort === 'points' ? `<h2 class="cl-h2">${t('cl_top')}</h2><div class="cl-podiums">${podium.map(c => clCard(c, true)).join('')}</div>` : ''}
    <div class="cl-findbar"><h2 class="cl-h2">${t('cl_find')}</h2><span class="cl-muted">${CL.list ? CL.list.total : ''}</span></div>
    <div class="cl-filters">
      <input id="clQ" type="search" placeholder="${t('cl_search')}" value="${escA(CL.q)}" maxlength="30">
      <button type="button" class="btn sm ${CL.open ? 'primary' : 'ghost'}" data-cl="toggleOpen">${t('cl_recruit')}</button>
      <label class="cl-sort">${t('cl_sort')} <select id="clSort">
        ${['points', 'members', 'new'].map(s => `<option value="${s}"${CL.sort === s ? ' selected' : ''}>${t('cl_sort_' + s)}</option>`).join('')}</select></label>
    </div>
    <div class="cl-grid" id="clList"></div>
  </div>`;
  renderClansList();
}

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-cl]'); if (!b || !$('#clans') || !b.closest('#clans')) return;
  const a = b.dataset.cl, uid = b.dataset.uid, name = b.dataset.name;
  const run = async (action, data) => { const r = await clCall(action, data); if (r) { CL.me = r; await clRefreshList(); renderClans(); } };
  if (a === 'startCreate') { CL.creating = true; renderClans(); $('#clCreate input[name=name]')?.focus(); }
  else if (a === 'cancelCreate') { CL.creating = false; renderClans(); }
  else if (a === 'startEdit') { CL.editing = true; renderClans(); }
  else if (a === 'cancelEdit') { CL.editing = false; renderClans(); }
  else if (a === 'toggleOpen') { CL.open = !CL.open; await clRefreshList(); renderClans(); }
  else if (a === 'join') await run('join', { cid: b.dataset.cid });
  else if (a === 'cancelReq') await run('cancelReq', { cid: b.dataset.cid });
  else if (a === 'accept' || a === 'refuse') await run('answer', { uid, accept: a === 'accept' });
  else if (a === 'promote' || a === 'demote') await run('setRole', { uid, role: a === 'promote' ? 'officer' : 'member' });
  else if (a === 'kick') confirmBox(t('cl_kick'), escA(t('cl_q_kick', { n: name })), t('cl_kick'), t('cl_cancel'), () => run('kick', { uid }));
  else if (a === 'owner') confirmBox(t('cl_make_owner'), escA(t('cl_q_owner', { n: name })), t('cl_make_owner'), t('cl_cancel'), () => run('transfer', { uid }));
  else if (a === 'leave') confirmBox(t('cl_leave'), t('cl_q_leave'), t('cl_leave'), t('cl_cancel'), () => run('leave'));
  else if (a === 'disband') confirmBox(t('cl_disband'), t('cl_q_disband'), t('cl_disband'), t('cl_cancel'), () => run('disband'));
});
document.addEventListener('submit', async e => {
  if (e.target.id !== 'clCreate' && e.target.id !== 'clEdit') return;
  e.preventDefault();
  const f = new FormData(e.target), data = { desc: f.get('desc') || '', color: f.get('color'), open: !!f.get('open') };
  const r = e.target.id === 'clCreate' ? await clCall('create', { ...data, name: f.get('name'), tag: String(f.get('tag') || '').toUpperCase() }) : await clCall('edit', data);
  if (!r) return;
  CL.me = r; CL.creating = false; CL.editing = false;
  await clRefreshList(); renderClans();
});
document.addEventListener('change', async e => {
  if (e.target.id === 'clEquip') {
    const r = await clCall('equip', { on: e.target.checked });
    if (r) { CL.me = r; renderClans(); } else e.target.checked = !e.target.checked;
  } else if (e.target.id === 'clSort') { CL.sort = e.target.value; await clRefreshList(); renderClans(); }
});
let clQT = null;
document.addEventListener('input', e => {
  if (e.target.id === 'clCreate' || e.target.classList.contains('cl-tag-in')) e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (e.target.id !== 'clQ') return;
  CL.q = e.target.value; clearTimeout(clQT); clQT = setTimeout(clRefreshList, 300);
});
