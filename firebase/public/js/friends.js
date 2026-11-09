window.FB_API_KEY = window.FB_API_KEY || 'AIzaSyB8tB0xv9Xry6mo69XzPJ611S4dpT6YI_Y';
window.FB_URL = window.FB_URL || 'https://tickratecsgo-default-rtdb.europe-west1.firebasedatabase.app';
var FB_API_KEY = window.FB_API_KEY;
var FB_URL = window.FB_URL;
if (typeof window.fbLive !== 'function') window.fbLive = () => true;

function fbMailbox(name) {
  const n = String(name || (typeof ME !== 'undefined' && ME && ME.name) || 'player').trim();
  return n.toLowerCase().replace(/[.#$/[\]:\s]/g, '_');
}
window.fbMailbox = fbMailbox;

let frTab = 'all';
let frFilter = '';
let frStatusFilter = 'all';
let frSearchQuery = '';
let frSearchResult = null;
let FR_INVITES_CACHE = new Set();

let FR_PENDING_IN = [];
let FR_PENDING_OUT = [];
try { FR_PENDING_IN = JSON.parse(localStorage.getItem('tr_fr_in') || '[]'); } catch(e) { FR_PENDING_IN = []; }
try { FR_PENDING_OUT = JSON.parse(localStorage.getItem('tr_fr_out') || '[]'); } catch(e) { FR_PENDING_OUT = []; }

let fbFriendsLoaded = false;
const LOOKC = new Map();
function realLook(name, needBanner = false) {
  const k = fbMailbox(name), c = LOOKC.get(k);
  if (c && Date.now() - c.at < 6e5 && (!needBanner || c.full)) return c.p;
  const p = (async () => {
    if (!needBanner) {
      const dir = await fbReq(`playerDirectory/${k}`);
      if (dir && typeof dir === 'object' && (dir.avatar || dir.steamAvatar || dir.color || dir.cardStyle || dir.bgStyle)) {
        const rawAv = dir.avatar || null;
        const custom = typeof rawAv === 'string' && /^data:image\//.test(rawAv) && safeImg(rawAv) ? rawAv : null;
        const stAv = safeImg(dir.steamAvatar) || (!custom && safeImg(rawAv) ? rawAv : null);
        return { uid: dir.uid || null, avatar: custom, steamAvatar: stAv, banner: null, color: typeof dir.color === 'string' ? dir.color : null, cardStyle: typeof dir.cardStyle === 'string' ? dir.cardStyle : null, bgStyle: typeof dir.bgStyle === 'string' ? dir.bgStyle : null };
      }
    }
    const uid = await fbReq(`usernames/${k}`); if (typeof uid !== 'string') return {};
    const [ua, ub, uc, ucs, ubg, pa] = await Promise.all([
      fbReq(`users/${uid}/avatar`),
      needBanner ? fbReq(`users/${uid}/banner`) : Promise.resolve(null),
      fbReq(`users/${uid}/color`),
      fbReq(`users/${uid}/cardStyle`),
      fbReq(`users/${uid}/bgStyle`),
      fbReq(`profiles/${uid}/avatar`)
    ]);
    const custom = typeof ua === 'string' && /^data:image\//.test(ua) && safeImg(ua) ? ua : null;
    return { uid, avatar: custom, steamAvatar: safeImg(pa) || (custom ? null : safeImg(ua)) || null, banner: ub && typeof ub === 'object' ? ub : null, color: typeof uc === 'string' ? uc : null, cardStyle: typeof ucs === 'string' ? ucs : null, bgStyle: typeof ubg === 'string' ? ubg : null };
  })();
  LOOKC.set(k, { at: Date.now(), full: !!needBanner, p });
  return p;
}
const realAvatar = async name => { const L = await realLook(name, false); return L.avatar || L.steamAvatar || null; };
async function applyLook(p, needBanner = true) {
  if (!p || !p.name) return false;
  const L = await realLook(p.name, needBanner); let ch = false;
  if (L.avatar && L.avatar !== p.avatar) { p.avatar = L.avatar; ch = true; }
  if (L.steamAvatar && L.steamAvatar !== p.steamAvatar) { p.steamAvatar = L.steamAvatar; ch = true; }
  if (L.banner && JSON.stringify(L.banner) !== JSON.stringify(p.banner || null)) { p.banner = L.banner; ch = true; }
  if (L.color && /^#[0-9a-fA-F]{3,8}$/.test(L.color) && L.color !== p.color) { p.color = L.color; ch = true; }
  if (L.cardStyle && typeof validCardId === 'function') {
    const vc = validCardId(L.cardStyle);
    if (vc !== (p.cardStyle || 'default')) { p.cardStyle = vc; ch = true; }
  }
  if (L.bgStyle && typeof validBgId === 'function') {
    const vb = validBgId(L.bgStyle);
    if (vb !== (p.bgStyle || 'default')) { p.bgStyle = vb; ch = true; }
  }
  return ch;
}
async function loadFriendsFromFirebase(force = false) {
  const hasToken = (typeof FBA !== 'undefined' && FBA && FBA.idToken);
  if (typeof fbReq !== 'function' || !hasToken || typeof AUTH === 'undefined' || !AUTH.session) return;
  if (fbFriendsLoaded && !force) return;
  try {
    const myBox = fbMailbox(ME.name);
    const remoteFriends = await fbReq(`friends/${myBox}`);
    if (remoteFriends && typeof remoteFriends === 'object') {
      let changed = false;
      const keep = FRIENDS.filter(f => remoteFriends[fbMailbox(f.name)]);
      if (keep.length !== FRIENDS.length) { FRIENDS.forEach(f => { if (!remoteFriends[fbMailbox(f.name)]) f.friend = false; }); FRIENDS.length = 0; FRIENDS.push(...keep); changed = true; }
      for (const [k, f] of Object.entries(remoteFriends)) {
        if (!f || !f.name) continue;
        let existing = FRIENDS.find(x => fbMailbox(x.name) === k);
        if (!existing) {
          let p = REG.get(f.name);
          if (!p) {
            p = makePlayer(f.name, +f.elo || 1500, 'high', 0);
            p.color = f.color || COLORS[0];
            putAv(p, f.avatar);
            p.country = f.country || 'FR';
            REG.set(p.name, p);
          }
          p.friend = true;
          p.status = f.status || 'offline';
          p.addedAt = f.addedAt || Date.now();
          FRIENDS.push(p);
          changed = true;
        } else {
          if (f.elo) existing.elo = +f.elo;
          putAv(existing, f.avatar);
          if (f.country) existing.country = f.country;
        }
      }
      fbFriendsLoaded = true;
      await Promise.all(FRIENDS.map(async f => { if (await applyLook(f)) changed = true; }));
      if (typeof admHydrateBadges === 'function') {
        admHydrateBadges(FRIENDS, () => {
          saveFriendsList();
          if ($('#friends') && !$('#friends').hidden) renderFriends();
        });
      }
      if (changed) {
        saveFriendsList();
        if ($('#friends') && !$('#friends').hidden) renderFriends();
      }
    }
  } catch(e) {}
}

function saveFriendsList() {
  try {
    localStorage.setItem('tr_friends', JSON.stringify(FRIENDS.map(f => ({
      name: f.name, elo: f.elo, color: f.color, avatar: f.avatar || null,
      banner: f.banner || null, status: f.status || 'offline', statusMap: f.statusMap || null,
      country: f.country || 'FR', addedAt: f.addedAt || Date.now()
    }))));
  } catch(e) {}
}

function saveFriendReqs() {
  try { localStorage.setItem('tr_fr_in', JSON.stringify(FR_PENDING_IN)); } catch(e) {}
  try { localStorage.setItem('tr_fr_out', JSON.stringify(FR_PENDING_OUT)); } catch(e) {}
}

function friendCodeOf(p) {
  if (!p) return 'TR-000000';
  const str = String(p.id || p.name || 'player');
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return 'TR-' + String(Math.abs(h) % 900000 + 100000);
}

function friendLinkOf(p) {
  const code = friendCodeOf(p);
  const base = location.href.split(/[?#]/)[0];
  return `${base}?addfriend=${code}&n=${encodeURIComponent(p.name)}`;
}

function friendCard(p) {
  const inP = state.party.includes(p), full = state.party.length >= maxParty();
  const isOnline = p.status === 'online' || p.status === 'ingame';
  const inv = p.friend
    ? `<button class="btn primary" data-invite="${escA(p.name)}" ${isOnline && !inP && !full ? '' : 'disabled'}>${inP ? t('in_party') : !isOnline ? t('not_available') : full ? t('party_full') : t('invite_party')}</button>`
    : `<button class="btn primary" data-addfriend="${escA(p.name)}" ${p.friendPending ? 'disabled' : ''}>${p.friendPending ? t('friend_sent') : '+ ' + t('add_friend')}</button>`;

  const statusHtml = p.status === 'ingame'
    ? `<div class="fr-st s-ingame"><i></i>${t('fr_status_ingame_map', { m: escA(p.statusMap || 'Mirage') })}</div>`
    : p.status === 'online'
      ? `<div class="fr-st s-online"><i></i>${t('st_online')}</div>`
      : `<div class="fr-st"><i></i>${t('st_offline')}</div>`;

  const csId = typeof cardStyleOf === 'function' ? cardStyleOf(p) : 'default';
  return `<div class="fr-card pcard-cs-${csId}" data-fname="${escA(p.name)}">
    <div class="bn" style="background:${bannerCSS(p.banner)}"></div>
    <div class="fr-body">
      <div class="fr-top">
        <span data-profile="${escA(p.name)}">${avHTML(p)}</span>
        <div style="min-width:0">
          <div class="fr-n" data-profile="${escA(p.name)}">${escA(p.name)} ${planBadge(p)}</div>
          ${statusHtml}
        </div>
      </div>
      <div class="fr-meta">
        ${lvlHTML(p.elo)}<span>ELO <b>${p.elo}</b></span>
        <span style="margin-left:auto">${p.country ? `<span class="flag">${escA(p.country)}</span>` : tfHTML(p)}</span>
      </div>
      <div class="fr-btns">
        <button class="btn ghost" data-open="${escA(p.name)}">${t('view_profile')}</button>
        ${p.friend ? `<button class="btn ghost" data-msg="${escA(p.name)}">${t('dm_btn')}</button>` : ''}
        ${inv}
        ${p.friend ? `<button class="btn ghost fr-del-btn" data-remove="${escA(p.name)}" title="${t('fr_remove')}"><svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" width="13" height="13"><path d="M288 256c52.79 0 99.43-49.71 104-110.82 2.27-30.7-7.36-59.33-27.12-80.6C345.33 43.57 318 32 288 32c-30.24 0-57.59 11.5-77 32.38-19.63 21.11-29.2 49.8-27 80.78C188.49 206.28 235.12 256 288 256zM495.38 439.76c-8.44-46.82-34.79-86.15-76.19-113.75C382.42 301.5 335.83 288 288 288s-94.42 13.5-131.19 38c-41.4 27.6-67.75 66.93-76.19 113.75-1.93 10.73.69 21.34 7.19 29.11A30.94 30.94 0 00112 480h352a30.94 30.94 0 0024.21-11.13c6.48-7.77 9.1-18.38 7.17-29.11zM144 216H32a16 16 0 000 32h112a16 16 0 000-32z"/></svg> ${t('fr_remove')}</button>` : ''}
      </div>
    </div>
  </div>`;
}

function renderFriends() {
  if (typeof triggerFastInvitePoll === 'function') triggerFastInvitePoll(15000);
  if (typeof loadFriendsFromFirebase === 'function' && !fbFriendsLoaded) {
    loadFriendsFromFirebase();
  }
  const container = $('#friends');
  if (!container) return;

  const onlineCount = FRIENDS.filter(f => f.status === 'online' || f.status === 'ingame').length;
  const totalCount = FRIENDS.length;
  const myCode = friendCodeOf(ME);

  const hero = `<div class="fr-hero">
    <div class="fr-hero-left">
      <h1>${t('friends_title')} <span class="pill">${t('friends_online', { n: onlineCount, t: totalCount })}</span></h1>
      <p>${t('fr_hero_d')}</p>
    </div>
    <div class="fr-hero-right">
      <div class="fr-code-box">
        <span class="fr-code-label">${t('fr_my_code')}</span>
        <span class="fr-code-val">${myCode}</span>
        <button class="btn ghost sm" data-copycode="${myCode}" title="${t('fr_copy_code')}"><svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" width="14" height="14"><path d="M408 480H184a72 72 0 01-72-72V184a72 72 0 0172-72h224a72 72 0 0172 72v224a72 72 0 01-72 72z"/><path d="M160 80h235.88A72.12 72.12 0 00328 32H104a72 72 0 00-72 72v224a72.12 72.12 0 0048 67.88V160a80 80 0 0180-80z"/></svg></button>
      </div>
      <button class="btn ghost sm" data-copylink="${escA(friendLinkOf(ME))}"><svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" width="14" height="14"><path d="M200.66 352H144a96 96 0 010-192h55.41M312.59 160H368a96 96 0 010 192h-56.66M169.07 256h175.86" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48"/></svg> ${t('fr_copy_link')}</button>
      <button class="btn primary sm" data-goadd><svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" width="14" height="14"><path d="M288 256c52.79 0 99.43-49.71 104-110.82 2.27-30.7-7.36-59.33-27.12-80.6C345.33 43.57 318 32 288 32c-30.24 0-57.59 11.5-77 32.38-19.63 21.11-29.2 49.8-27 80.78C188.49 206.28 235.12 256 288 256zM495.38 439.76c-8.44-46.82-34.79-86.15-76.19-113.75C382.42 301.5 335.83 288 288 288s-94.42 13.5-131.19 38c-41.4 27.6-67.75 66.93-76.19 113.75-1.93 10.73.69 21.34 7.19 29.11A30.94 30.94 0 00112 480h352a30.94 30.94 0 0024.21-11.13c6.48-7.77 9.1-18.38 7.17-29.11zM104 288v-40h40a16 16 0 000-32h-40v-40a16 16 0 00-32 0v40H32a16 16 0 000 32h40v40a16 16 0 0032 0z"/></svg> ${t('fr_tab_add')}</button>
    </div>
  </div>`;

  const reqBadge = FR_PENDING_IN.length ? `<span class="fr-tab-cnt alert">${FR_PENDING_IN.length}</span>` : '';
  const subtabs = `<div class="fr-subtabs">
    <button class="fr-subtab ${frTab === 'all' ? 'on' : ''}" data-frtab="all">${t('fr_tab_friends')} <span class="fr-tab-cnt">${totalCount}</span></button>
    <button class="fr-subtab ${frTab === 'requests' ? 'on' : ''}" data-frtab="requests">${t('fr_tab_requests')} ${reqBadge}</button>
    <button class="fr-subtab ${frTab === 'sent' ? 'on' : ''}" data-frtab="sent">${t('fr_tab_sent')} <span class="fr-tab-cnt">${FR_PENDING_OUT.length}</span></button>
    <button class="fr-subtab ${frTab === 'add' ? 'on' : ''}" data-frtab="add">+ ${t('fr_tab_add')}</button>
    <button class="fr-subtab ${frTab === 'recent' ? 'on' : ''}" data-frtab="recent">${t('fr_tab_recent')}</button>
  </div>`;

  let body = '';

  if (frTab === 'all') {
    let list = [...FRIENDS];
    if (frFilter) {
      const q = frFilter.toLowerCase();
      list = list.filter(f => f.name.toLowerCase().includes(q));
    }
    if (frStatusFilter === 'online') list = list.filter(f => f.status === 'online');
    else if (frStatusFilter === 'ingame') list = list.filter(f => f.status === 'ingame');
    else if (frStatusFilter === 'offline') list = list.filter(f => f.status === 'offline');

    const order = { online: 0, ingame: 1, offline: 2 };
    list.sort((a, b) => (order[a.status] || 0) - (order[b.status] || 0));

    const toolbar = `<div class="fr-toolbar">
      <div class="fr-search">
        <svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M456.69 421.39L362.6 327.3a173.81 173.81 0 0034.84-104.58C397.44 126.38 319.06 48 222.72 48S48 126.38 48 222.72s78.38 174.72 174.72 174.72A173.81 173.81 0 00327.3 362.6l94.09 94.09a25 25 0 0035.3-35.3zM97.92 222.72a124.8 124.8 0 11124.8 124.8 124.95 124.95 0 01-124.8-124.8z"/></svg>
        <input id="frFilterIn" placeholder="${t('fr_filter_ph')}" value="${escA(frFilter)}">
      </div>
      <div class="fr-filter-chips">
        <button class="fr-chip ${frStatusFilter === 'all' ? 'on' : ''}" data-frstatus="all">Tous (${totalCount})</button>
        <button class="fr-chip ${frStatusFilter === 'online' ? 'on' : ''}" data-frstatus="online">En ligne (${FRIENDS.filter(f=>f.status==='online').length})</button>
        <button class="fr-chip ${frStatusFilter === 'ingame' ? 'on' : ''}" data-frstatus="ingame">En match (${FRIENDS.filter(f=>f.status==='ingame').length})</button>
        <button class="fr-chip ${frStatusFilter === 'offline' ? 'on' : ''}" data-frstatus="offline">Hors ligne (${FRIENDS.filter(f=>f.status==='offline').length})</button>
      </div>
    </div>`;

    if (!FRIENDS.length) {
      body = toolbar + `<div class="fr-empty">
        <div class="fr-empty-icon"><svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M336 256c-20.56 0-40.44-9.18-56-25.84-15.13-16.25-24.37-37.92-26-61-1.74-24.62 5.77-47.26 21.14-63.76S312 80 336 80c23.83 0 45.38 9.06 60.7 25.52 15.47 16.62 23 39.22 21.26 63.63-1.67 23.11-10.9 44.77-26 61C376.44 246.82 356.57 256 336 256zm66-88zM467.83 432H204.18a27.71 27.71 0 01-22-10.67 30.22 30.22 0 01-5.26-25.79c8.42-33.81 29.28-61.85 60.32-81.08C264.79 297.4 299.86 288 336 288c36.85 0 71 9 98.71 26.05 31.11 19.13 52 47.33 60.38 81.55a30.27 30.27 0 01-5.32 25.78A27.68 27.68 0 01467.83 432zM147 260c-35.19 0-66.13-32.72-69-72.93-1.42-20.6 5-39.65 18-53.62 12.86-13.83 31-21.45 51-21.45s38 7.66 50.93 21.57c13.1 14.08 19.5 33.09 18 53.52-2.87 40.2-33.8 72.91-68.93 72.91zM212.66 291.45c-17.59-8.6-40.42-12.9-65.65-12.9-29.46 0-58.07 7.68-80.57 21.62-25.51 15.83-42.67 38.88-49.6 66.71a27.39 27.39 0 004.79 23.36A25.32 25.32 0 0041.72 400h111a8 8 0 007.87-6.57c.11-.63.25-1.26.41-1.88 8.48-34.06 28.35-62.84 57.71-83.82a8 8 0 00-.63-13.39c-1.57-.92-3.37-1.89-5.42-2.89z"/></svg></div>
        <h3>${t('fr_empty_title')}</h3>
        <p>${t('fr_empty_sub')}</p>
        <div class="fr-empty-actions">
          <button class="btn primary" data-copycode="${myCode}"><svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" width="14" height="14"><path d="M408 480H184a72 72 0 01-72-72V184a72 72 0 0172-72h224a72 72 0 0172 72v224a72 72 0 01-72 72z"/><path d="M160 80h235.88A72.12 72.12 0 00328 32H104a72 72 0 00-72 72v224a72.12 72.12 0 0048 67.88V160a80 80 0 0180-80z"/></svg> ${t('fr_copy_code')}</button>
          <button class="btn ghost" data-goadd>+ ${t('fr_tab_add')}</button>
        </div>
      </div>`;
    } else if (!list.length) {
      body = toolbar + `<div class="card m-hint" style="text-align:center;padding:32px">${t('fr_not_found')}</div>`;
    } else {
      body = toolbar + `<div class="fr-grid">${list.map(friendCard).join('')}</div>`;
    }
  } else if (frTab === 'requests') {
    if (!FR_PENDING_IN.length) {
      body = `<div class="card m-hint" style="text-align:center;padding:40px">${t('fr_no_req')}</div>`;
    } else {
      body = `<div class="fr-req-list">${FR_PENDING_IN.map(r => `
        <div class="fr-req-item">
          <div class="fr-req-left">
            ${avHTML(r, 42)}
            <div class="fr-req-info">
              <b>${escA(r.name)}</b>
              <span>${lvlHTML(r.elo)} ELO ${r.elo} · ${fmtDate(new Date(r.at))}</span>
            </div>
          </div>
          <div class="fr-req-btns">
            <button class="btn primary sm" data-accept="${escA(r.name)}">${t('fr_accept')}</button>
            <button class="btn ghost sm" data-decline="${escA(r.name)}">${t('fr_decline')}</button>
          </div>
        </div>`).join('')}</div>`;
    }
  } else if (frTab === 'sent') {
    if (!FR_PENDING_OUT.length) {
      body = `<div class="card m-hint" style="text-align:center;padding:40px">${t('fr_no_sent')}</div>`;
    } else {
      body = `<div class="fr-req-list">${FR_PENDING_OUT.map(r => `
        <div class="fr-req-item">
          <div class="fr-req-left">
            ${avHTML({ name: r.name || '?', avatar: r.avatar, color: r.color || '#444' }, 42)}
            <div class="fr-req-info">
              <b>${escA(r.name)}</b>
              <span>${t('fr_req_sent',{d:fmtDate(new Date(r.at))})}</span>
            </div>
          </div>
          <button class="btn ghost sm" data-cancelreq="${escA(r.name)}">Annuler</button>
        </div>`).join('')}</div>`;
    }
  } else if (frTab === 'add') {
    let resultPreview = '';
    if (frSearchResult) {
      const p = frSearchResult;
      const isAlready = FRIENDS.some(f => f.name.toLowerCase() === p.name.toLowerCase());
      const isSent = FR_PENDING_OUT.some(r => r.name.toLowerCase() === p.name.toLowerCase());
      const isMe = p.name.toLowerCase() === ME.name.toLowerCase();

      resultPreview = `<div class="fr-add-result">
        <div class="fr-req-item">
          <div class="fr-req-left">
            ${avHTML(p, 42)}
            <div class="fr-req-info">
              <b>${escA(p.name)}</b>
              <span>${lvlHTML(p.elo)} ELO ${p.elo} · Code: ${friendCodeOf(p)}</span>
            </div>
          </div>
          <div>
            ${isMe
              ? `<span class="pill">${t('fr_self')}</span>`
              : isAlready
                ? `<span class="pill">${t('fr_already')}</span>`
                : isSent
                  ? `<span class="pill">${t('friend_sent')}</span>`
                  : `<button class="btn primary" data-sendreq="${escA(p.name)}">${t('fr_send_req')}</button>`}
          </div>
        </div>
      </div>`;
    } else if (frSearchQuery && !frSearchResult) {
      resultPreview = `<div class="fr-add-result"><div class="card m-hint" style="margin:0">${t('fr_not_found')}</div></div>`;
    }

    body = `<div class="fr-add-card">
      <h3 style="margin:0 0 6px">${t('fr_add_title')}</h3>
      <p style="font-size:13px;color:var(--muted);margin:0 0 14px">${t('fr_add_sub')}</p>
      <form class="fr-add-form" id="frAddForm">
        <input class="fr-add-input" id="frAddIn" placeholder="${t('fr_add_ph')}" value="${escA(frSearchQuery)}" autofocus>
        <button class="btn primary" type="submit">${t('fr_search_btn')}</button>
      </form>
      ${resultPreview}
    </div>`;
  } else if (frTab === 'recent') {
    const recent = [...REG.values()].filter(p => !p.me && !p.friend && p.lastPlayed && Date.now() - p.lastPlayed < SHARED_WINDOW).sort((a, b) => b.lastPlayed - a.lastPlayed).slice(0, 16);
    body = `<div class="sec-t" style="margin-top:0">${t('recent_players')}</div>
      <div class="sec-s">${t('recent_hint')}</div>
      ${recent.length ? `<div class="fr-grid">${recent.map(friendCard).join('')}</div>` : `<div class="card m-hint" style="margin:0">${t('no_recent')}</div>`}`;
  }

  container.innerHTML = hero + subtabs + body;
}

async function findUserAnywhere(query) {
  if (!query) return null;
  const q = String(query).trim().toLowerCase();
  const qMail = fbMailbox(q);

  const live = typeof fbLive === 'function' && fbLive();
  if (!live) for (const p of REG.values()) {
    if (p.name.toLowerCase() === q || friendCodeOf(p).toLowerCase() === q) return p;
  }
  if (!live) for (const p of (window.LB || [])) {
    if (p.name.toLowerCase() === q || friendCodeOf(p).toLowerCase() === q) return p;
  }

  if (typeof fbReq === 'function') {
    try {
      const direct = await fbReq(`playerDirectory/${qMail}`);
      const fromDirectory = u => {
        let p = REG.get(u.name);
        if (!p) p = makePlayer(u.name, +u.elo || 1000, 'high', 0);
        p.elo = +u.elo || p.elo;
        putAv(p, u.avatar);
        p.color = u.color || null;
        p.country = u.country || 'FR';
        p.status = (Date.now() - (u.lastSeen || 0) < 60000) ? (u.status || 'online') : 'offline';
        p.statusMap = u.statusMap || null;
        REG.set(p.name, p);
        return p;
      };
      if (direct && direct.name) return fromDirectory(direct);

      const code = q.match(/^(?:tr-)?(\d{6})$/);
      if (code) {
        const found = await fbReq(`playerDirectory?orderBy=%22code%22&equalTo=%22TR-${code[1]}%22`);
        const u = found && typeof found === 'object' ? Object.values(found).find(x => x && x.name) : null;
        if (u) return fromDirectory(u);
      }
    } catch(e) {}
  }

  if (typeof dAcc === 'function') {
    const a = dAcc().find(x => x.username.toLowerCase() === q || friendCodeOf({ name: x.username, id: x.id }).toLowerCase() === q);
    if (a) return makePlayer(a.username, a.elo || 1000, 'high', 0);
  }

  return null;
}

const frLive = () => typeof fbLive === 'function' && fbLive() && typeof FBA !== 'undefined' && !!FBA.uid && typeof fbCall === 'function';
async function frCall(action, name) {
  const myAv = (typeof avSrc === 'function' ? avSrc(ME) : ME.avatar) || null;
  const r = await fbCall('social', { action, name, color: ME.color || null, avatar: myAv });
  if (r && r.error) { const k = 'e_' + r.error; toast(I18N[lang]?.[k] || I18N.fr[k] ? t(k) : t('e_server_error')); return null; }
  return r;
}
async function sendFriendRequest(targetName) {
  if (!targetName) return;
  const tBox = fbMailbox(targetName);
  const myBox = fbMailbox(ME.name);

  if (tBox === myBox) return toast(t('fr_self'));
  if (FRIENDS.some(f => fbMailbox(f.name) === tBox)) return toast(t('fr_already'));
  if (FR_PENDING_OUT.some(r => fbMailbox(r.name) === tBox)) return toast(t('fr_already_req', { n: targetName }));

  if (frLive()) {
    const r = await frCall('send', targetName);
    if (!r) return;
    if (r.friend) { await loadFriendsFromFirebase(true); toast(t('fr_accepted_toast', { n: targetName })); return renderFriends(); }
  }
  FR_PENDING_OUT.push({ name: targetName, mailbox: tBox, at: Date.now() });
  saveFriendReqs();

  if (!frLive() && typeof fbReq === 'function') {
    fbReq(`friendRequests/${tBox}/${myBox}`, 'PUT', {
      from: ME.name,
      fromMailbox: myBox,
      fromCode: friendCodeOf(ME),
      elo: ME.elo || 1500,
      color: ME.color || COLORS[0],
      avatar: (typeof avSrc === 'function' ? avSrc(ME) : ME.avatar) || null,
      country: ME.country || 'FR',
      at: Date.now()
    });
  }

  beep(740, .08);
  toast(t('fr_req_sent_to', { n: targetName }));
  if (typeof triggerFastInvitePoll === 'function') triggerFastInvitePoll(15000);
  renderFriends();
}

async function acceptFriendRequest(targetName) {
  const tBox = fbMailbox(targetName);
  const myBox = fbMailbox(ME.name);
  const req = FR_PENDING_IN.find(r => fbMailbox(r.name) === tBox);

  if (frLive() && !(await frCall('accept', targetName))) return;
  FR_PENDING_IN = FR_PENDING_IN.filter(r => fbMailbox(r.name) !== tBox);
  saveFriendReqs();

  let p = REG.get(targetName);
  if (!p) {
    p = makePlayer(targetName, (req && req.elo) || 1500, 'high', 0);
    p.color = (req && req.color) || COLORS[0];
    p.avatar = (req && req.avatar) || null;
    p.country = (req && req.country) || 'FR';
    REG.set(p.name, p);
  }
  p.friend = true;
  p.status = 'online';
  p.addedAt = Date.now();

  if (!FRIENDS.some(f => fbMailbox(f.name) === tBox)) {
    FRIENDS.push(p);
  }
  saveFriendsList();

  if (!frLive() && typeof fbReq === 'function') {
    fbReq(`friendRequests/${myBox}/${tBox}`, 'DELETE');
    fbReq(`friends/${myBox}/${tBox}`, 'PUT', {
      name: p.name,
      elo: p.elo,
      color: p.color,
      avatar: p.avatar,
      country: p.country,
      addedAt: Date.now()
    });
    fbReq(`friends/${tBox}/${myBox}`, 'PUT', {
      name: ME.name,
      elo: ME.elo,
      color: ME.color,
      avatar: ME.avatar,
      country: ME.country,
      addedAt: Date.now()
    });
    fbReq(`friendAccepts/${tBox}/${myBox}`, 'PUT', {
      from: ME.name,
      fromMailbox: myBox,
      elo: ME.elo,
      color: ME.color,
      avatar: ME.avatar,
      country: ME.country,
      at: Date.now()
    });
  }

  beep(880, .1); beep(1175, .15, .1);
  toast(t('fr_accepted_toast', { n: p.name }));
  if (typeof triggerFastInvitePoll === 'function') triggerFastInvitePoll(15000);
  renderFriends();
}

function declineFriendRequest(targetName) {
  const tBox = fbMailbox(targetName);
  const myBox = fbMailbox(ME.name);
  FR_PENDING_IN = FR_PENDING_IN.filter(r => fbMailbox(r.name) !== tBox);
  saveFriendReqs();
  if (frLive()) frCall('decline', targetName);
  else if (typeof fbReq === 'function') {
    fbReq(`friendRequests/${myBox}/${tBox}`, 'DELETE');
  }
  toast(t('fr_declined_toast', { n: targetName }));
  renderFriends();
}

function cancelOutgoingRequest(targetName) {
  const tBox = fbMailbox(targetName);
  const myBox = fbMailbox(ME.name);
  FR_PENDING_OUT = FR_PENDING_OUT.filter(r => fbMailbox(r.name) !== tBox);
  saveFriendReqs();
  if (frLive()) frCall('cancel', targetName);
  else if (typeof fbReq === 'function') {
    fbReq(`friendRequests/${tBox}/${myBox}`, 'DELETE');
  }
  toast(t('fr_req_cancel'));
  renderFriends();
}

function removeFriendAction(targetName) {
  if (!confirm(t('fr_remove_confirm', { n: targetName }))) return;
  const tBox = fbMailbox(targetName);
  const myBox = fbMailbox(ME.name);
  const idx = FRIENDS.findIndex(f => fbMailbox(f.name) === tBox);
  if (idx !== -1) {
    const f = FRIENDS[idx];
    f.friend = false;
    FRIENDS.splice(idx, 1);
    saveFriendsList();
    if (frLive()) frCall('remove', targetName);
    else if (typeof fbReq === 'function') {
      fbReq(`friends/${myBox}/${tBox}`, 'DELETE');
      fbReq(`friends/${tBox}/${myBox}`, 'DELETE');
    }
    toast(t('fr_removed_toast', { n: targetName }));
    renderFriends();
  }
}

async function sendPartyInvite(targetName) {
  if (locked()) return;
  if (!targetName) return;
  const tBox = fbMailbox(targetName);
  if (state.party.some(p => fbMailbox(p.name) === tBox)) return toast(t('in_party'));
  if (state.party.length >= maxParty()) return toast(t('party_full'));

  if (typeof plCreate === 'function' && (!PL.code || Date.now() > PL.exp)) {
    await plCreate();
  }

  if (typeof PL !== 'undefined' && PL.kicked) {
    PL.kicked.delete(tBox);
    PL.kicked.delete(targetName.toLowerCase());
  }
  if (typeof fbReq === 'function' && PL.code) {
    fbReq(`parties/${PL.code}/kicked/${tBox}`, 'DELETE');
  }

  const payload = {
    from: ME.name, elo: ME.elo, color: ME.color, avatar: (typeof avSrc === 'function' ? avSrc(ME) : ME.avatar) || null,
    code: PL.code, mode: state.mode, modeName: modeObj().n, at: Date.now()
  };

  if (typeof fbReq === 'function') {
    fbReq(`invites/${tBox}/${PL.code}`, 'PUT', payload);
  }

  FR_INVITES_CACHE.add(targetName);
  if (typeof triggerFastInvitePoll === 'function') triggerFastInvitePoll(20000);
  beep(700, .08);
  toast(t('invited', { n: targetName }));
  if ($('#plModal') && $('#plModal').classList.contains('on')) {
    if (typeof renderPL === 'function') renderPL();
  } else {
    renderFriends();
  }
}

if (typeof I18N !== 'undefined') {
  if (I18N.fr) Object.assign(I18N.fr, {
    fr_req_notif: "Demande d'ami de {n}",
    fr_acc_notif: "{n} a accepté votre demande d'ami !"
  });
  if (I18N.en) Object.assign(I18N.en, {
    fr_req_notif: "Friend request from {n}",
    fr_acc_notif: "{n} accepted your friend request!"
  });
  if (I18N.ru) Object.assign(I18N.ru, {
    fr_req_notif: "Запрос в друзья от {n}",
    fr_acc_notif: "{n} принял(а) ваш запрос в друзья!"
  });
}

const HANDLED_INVITES = new Set();

function updateFriendsBadge() {
  const cnt = (typeof FR_PENDING_IN !== 'undefined' && Array.isArray(FR_PENDING_IN)) ? FR_PENDING_IN.length : 0;
  document.querySelectorAll('[data-view="friends"]').forEach(el => {
    let b = el.querySelector('.fr-nav-badge');
    if (cnt > 0) {
      if (!b) {
        b = document.createElement('span');
        b.className = 'fr-nav-badge badge';
        b.style.cssText = 'background:var(--red,#e03e3e);color:#fff;border-radius:10px;font-size:11px;font-weight:700;padding:1px 6px;margin-left:6px;';
        el.appendChild(b);
      }
      b.textContent = cnt;
    } else if (b) {
      b.remove();
    }
  });
}

let isPollingInvites = false;
async function pollIncomingInvites() {
  if (isPollingInvites) return;
  const hasToken = (typeof FBA !== 'undefined' && FBA && FBA.idToken);
  if (typeof fbReq !== 'function' || !hasToken || typeof AUTH === 'undefined' || !AUTH.session) return;
  const myBox = fbMailbox(ME.name);
  isPollingInvites = true;

  try {
    const [invites, reqs, accepts] = await Promise.all([
      fbReq(`invites/${myBox}`).catch(() => null),
      fbReq(`friendRequests/${myBox}`).catch(() => null),
      fbReq(`friendAccepts/${myBox}`).catch(() => null)
    ]);

    if (invites && typeof invites === 'object') {
      const now = Date.now();
      for (const [key, inv] of Object.entries(invites)) {
        if (!inv || !inv.code) continue;
        const invId = inv.code || key;
        if (now - (inv.at || 0) > 60000 || HANDLED_INVITES.has(invId)) {
          fbReq(`invites/${myBox}/${key}`, 'DELETE');
          continue;
        }
        if (!HANDLED_INVITES.has(invId)) {
          showPartyInviteBanner({ key, ...inv });
        }
      }
    }

    if (reqs && typeof reqs === 'object') {
      let changed = false;
      for (const [senderBox, r] of Object.entries(reqs)) {
        if (!r || !r.from) continue;
        if (FRIENDS.some(f => fbMailbox(f.name) === senderBox)) {
          fbReq(`friendRequests/${myBox}/${senderBox}`, 'DELETE');
          continue;
        }
        const already = FR_PENDING_IN.some(x => fbMailbox(x.name) === senderBox || (x.mailbox && fbMailbox(x.mailbox) === senderBox));
        if (!already) {
          FR_PENDING_IN.push({
            name: r.from,
            mailbox: senderBox,
            elo: r.elo || 1500,
            color: r.color || COLORS[0],
            avatar: r.avatar || null,
            country: r.country || 'FR',
            at: r.at || Date.now()
          });
          changed = true;
          toast(t('fr_req_in', { n: r.from }));
          beep(880, .1);
          if (typeof notify === 'function') {
            notify('friend', 'fr_req_notif', { n: r.from }, 'friends:requests');
          }
        }
      }
      if (changed) {
        saveFriendReqs();
        updateFriendsBadge();
        if ($('#friends') && !$('#friends').hidden) renderFriends();
      }
    }

    if (accepts && typeof accepts === 'object') {
      let changed = false;
      for (const [senderBox, acc] of Object.entries(accepts)) {
        if (!acc || !acc.from) continue;
        FR_PENDING_OUT = FR_PENDING_OUT.filter(r => fbMailbox(r.name) !== senderBox && fbMailbox(r.mailbox) !== senderBox);
        saveFriendReqs();

        if (!FRIENDS.some(f => fbMailbox(f.name) === senderBox)) {
          let p = REG.get(acc.from);
          if (!p) {
            p = makePlayer(acc.from, +acc.elo || 1500, 'high', 0);
            p.color = acc.color || COLORS[0];
            putAv(p, acc.avatar);
            p.country = acc.country || 'FR';
            REG.set(p.name, p);
          }
          p.friend = true;
          p.status = 'online';
          p.addedAt = Date.now();
          FRIENDS.push(p);
          changed = true;
          toast(`${acc.from} a accepté votre demande d'ami !`);
          beep(880, .1); beep(1175, .15, .1);
          if (typeof notify === 'function') {
            notify('friend_ok', 'fr_acc_notif', { n: acc.from }, 'friends');
          }
        }
        fbReq(`friendAccepts/${myBox}/${senderBox}`, 'DELETE');
      }
      if (changed) {
        saveFriendsList();
        updateFriendsBadge();
        if ($('#friends') && !$('#friends').hidden) renderFriends();
      }
    }
  } catch(e) {}
  finally {
    isPollingInvites = false;
  }
}

let pollInvitesTimer = null;
let fastPollUntil = 0;

function scheduleNextInvitePoll() {
  clearTimeout(pollInvitesTimer);
  if (typeof document !== 'undefined' && document.hidden) return;
  const delay = Date.now() < fastPollUntil ? 2000 : 12000;
  pollInvitesTimer = setTimeout(async () => {
    await pollIncomingInvites();
    scheduleNextInvitePoll();
  }, delay);
}

function triggerFastInvitePoll(durationMs = 15000) {
  fastPollUntil = Math.max(fastPollUntil, Date.now() + durationMs);
  pollIncomingInvites();
  scheduleNextInvitePoll();
}
window.triggerFastInvitePoll = triggerFastInvitePoll;
window.pollIncomingInvites = pollIncomingInvites;

scheduleNextInvitePoll();

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) triggerFastInvitePoll(8000);
});
window.addEventListener('focus', () => {
  triggerFastInvitePoll(8000);
});

let pibTimer = null;
function showPartyInviteBanner(inv) {
  const banner = $('#partyInviteBanner');
  if (!banner) return;
  const invId = inv.code || inv.key;
  if (HANDLED_INVITES.has(invId)) return;
  if (banner.dataset.lastCode === invId && !banner.hidden) return;
  banner.dataset.lastCode = invId;

  banner.innerHTML = `
    <div class="pib-who">
      ${avHTML({ name: inv.from || '?', avatar: inv.avatar, color: inv.color }, 38)}
      <div class="pib-txt">
        <b>${escA(inv.from)}</b>
        <span>${t('pib_invites',{m:escA(inv.modeName || '5v5')})}</span>
      </div>
    </div>
    <div class="pib-actions">
      <button class="btn primary sm" data-pib-join="${escA(inv.code)}" data-pib-key="${escA(inv.key||inv.code)}" data-pib-from="${escA(inv.from)}" data-pib-elo="${(+inv.elo|0) || 1500}">${t('pib_join')}</button>
      <button class="btn ghost sm" data-pib-decline="${escA(inv.key || inv.code)}" title="Refuser"><svg class="ic ico" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" width="14" height="14"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"/></svg></button>
    </div>
  `;
  banner.hidden = false;
  beep(660, .09); beep(880, .14, .08);

  clearTimeout(pibTimer);
  pibTimer = setTimeout(() => {
    banner.hidden = true;
    HANDLED_INVITES.add(invId);
    const myBox = typeof fbMailbox === 'function' ? fbMailbox(ME.name) : 'player';
    fbReq(`invites/${myBox}/${inv.key || inv.code}`, 'DELETE');
  }, 15000);
}

document.addEventListener('click', async e => {
  const jBtn = e.target.closest('[data-pib-join]');
  if (jBtn) {
    const code = jBtn.dataset.pibJoin, from = jBtn.dataset.pibFrom, elo = +jBtn.dataset.pibElo || 1500;
    const key = jBtn.dataset.pibKey || code;
    $('#partyInviteBanner').hidden = true;
    HANDLED_INVITES.add(code);
    HANDLED_INVITES.add(key);
    const myBox = typeof fbMailbox === 'function' ? fbMailbox(ME.name) : 'player';
    fbReq(`invites/${myBox}/${key}`, 'DELETE');
    if (typeof triggerFastInvitePoll === 'function') triggerFastInvitePoll(15000);
    if (typeof plJoin === 'function') {
      await plJoin({ code, n: from, e: elo });
      if (typeof partySyncPoll === 'function') partySyncPoll();
    }
    return;
  }
  const dBtn = e.target.closest('[data-pib-decline]');
  if (dBtn) {
    const key = dBtn.dataset.pibDecline;
    $('#partyInviteBanner').hidden = true;
    HANDLED_INVITES.add(key);
    const myBox = typeof fbMailbox === 'function' ? fbMailbox(ME.name) : 'player';
    fbReq(`invites/${myBox}/${key}`, 'DELETE');
    return;
  }
});

$('#friends').addEventListener('click', async e => {
  const tabBtn = e.target.closest('[data-frtab]');
  if (tabBtn) {
    frTab = tabBtn.dataset.frtab;
    return renderFriends();
  }
  const stBtn = e.target.closest('[data-frstatus]');
  if (stBtn) {
    frStatusFilter = stBtn.dataset.frstatus;
    return renderFriends();
  }
  if (e.target.closest('[data-goadd]')) {
    frTab = 'add';
    return renderFriends();
  }
  const cpCode = e.target.closest('[data-copycode]');
  if (cpCode) {
    try { await navigator.clipboard.writeText(cpCode.dataset.copycode); } catch(_) {}
    return toast(t('fr_code_copied'));
  }
  const cpLink = e.target.closest('[data-copylink]');
  if (cpLink) {
    try { await navigator.clipboard.writeText(cpLink.dataset.copylink); } catch(_) {}
    return toast(t('fr_link_copied'));
  }
  const o = e.target.closest('[data-open]');
  if (o) return openProfile(o.dataset.open);
  const ms = e.target.closest('[data-msg]');
  if (ms) return openDM(ms.dataset.msg);
  const inv = e.target.closest('[data-invite]');
  if (inv) return sendPartyInvite(inv.dataset.invite);
  const acc = e.target.closest('[data-accept]');
  if (acc) return acceptFriendRequest(acc.dataset.accept);
  const dec = e.target.closest('[data-decline]');
  if (dec) return declineFriendRequest(dec.dataset.decline);
  const can = e.target.closest('[data-cancelreq]');
  if (can) return cancelOutgoingRequest(can.dataset.cancelreq);
  const rm = e.target.closest('[data-remove]');
  if (rm) return removeFriendAction(rm.dataset.remove);
  const snd = e.target.closest('[data-sendreq]');
  if (snd) return sendFriendRequest(snd.dataset.sendreq);
});

$('#friends').addEventListener('input', e => {
  if (e.target.id === 'frFilterIn') {
    frFilter = e.target.value.trim();
    const container = $('#friends');
    if (container && frTab === 'all') renderFriends();
  }
});

$('#friends').addEventListener('submit', async e => {
  if (e.target.id === 'frAddForm') {
    e.preventDefault();
    const inp = $('#frAddIn');
    if (!inp) return;
    const val = inp.value.trim();
    if (!val) return;
    frSearchQuery = val;
    frSearchResult = await findUserAnywhere(val);
    renderFriends();
  }
});

(async () => {
  const q = new URLSearchParams(location.search);
  if (q.has('addfriend')) {
    const code = q.get('addfriend'), n = q.get('n') || '';
    try {
      const u = new URL(location.href);
      u.searchParams.delete('addfriend'); u.searchParams.delete('n');
      history.replaceState(null, '', u.pathname + u.search);
    } catch(e) {}
    if (n && n !== ME.name) {
      setTimeout(() => {
        frTab = 'add'; frSearchQuery = n;
        findUserAnywhere(n).then(res => {
          frSearchResult = res;
          setView('friends');
          toast(t('fr_add_ask',{n,c:code}));
        });
      }, 1000);
    }
  }
})();

const NAME_CD=7*864e5;
async function fbReq(path,method='GET',data,keepalive=false){
  try{
    if(typeof fbAuthEnsure==='function')await fbAuthEnsure();
    const hasToken=(typeof FBA!=='undefined'&&FBA&&FBA.idToken);
    if(!hasToken&&!(method==='GET'&&String(path).startsWith('Online'))){
      return null;
    }
    const r=await fetch(typeof fbUrl==='function'?fbUrl(path):`${FB_URL}/${path}.json`,{
      method,
      headers:data!==undefined?{'Content-Type':'application/json'}:{},
      body:data!==undefined?JSON.stringify(data):undefined,
      keepalive
    });
    if(!r.ok)return null;
    return await r.json();
  }catch(e){return null}
}
function fbUserKey(){
  const a=AUTH.session&&AUTH.session.account;
  return String((a&&a.id)||ME.steam?.id||'local_me').replace(/[.#$/[\]:]/g,'_');
}

const PRESENCE_ID=(()=>{
  try{
    let id=sessionStorage.getItem('tr_presence_id');
    if(!id){id='s_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);sessionStorage.setItem('tr_presence_id',id)}
    return id;
  }catch(e){return 's_'+Date.now()}
})();
const PRESENCE_TTL=35000;
let PRESENCE_SENT='',PRESENCE_READ=0,PRESENCE_CURSOR=0,PRESENCE_ROUND=0;
const PRESENCE_BATCH=12;
async function fbSyncOnline(leaving=false){
  try{
    if (typeof fbReq !== 'function') return;
    const hasToken = (typeof FBA !== 'undefined' && FBA && FBA.idToken);
    if (!hasToken || typeof AUTH === 'undefined' || !AUTH.session) return;
    const myBox = typeof fbMailbox==='function'?fbMailbox(ME.name):'player';
    if(leaving){
      await fbReq(`presence/${PRESENCE_ID}?print=silent`,'DELETE',undefined,true);
      await fbReq(`playerDirectory/${myBox}/status?print=silent`,'PUT','offline',true);
      PRESENCE_SENT='';
      return;
    }
    const now=Date.now();
    const myCard=typeof validCardId==='function'?validCardId(ME.cardStyle):'default';
    await fbReq(`presence/${PRESENCE_ID}?print=silent`,'PUT',{
      userKey:fbUserKey(),
      uid:(typeof FBA!=='undefined'&&FBA.uid)||null,
      name:ME.name,
      elo:ME.elo,
      cardStyle:myCard,
      logged:!!AUTH.session,
      searching:!!state.searching,
      inMatch:!!cur,
      lastSeen:now
    });
    const card={
      name:ME.name,
      code:friendCodeOf(ME),
      elo:ME.elo,
      eloWm:ME.eloWm||1000,
      eloDuel:ME.eloDuel||1000,
      avatar:(typeof avSrc==='function'?avSrc(ME):ME.avatar)||null,
      color:ME.color||null,
      cardStyle:myCard,
      country:ME.country||'FR',
      status:(typeof cur!=='undefined'&&cur)?'ingame':'online',
      statusMap:(typeof cur!=='undefined'&&cur&&cur.map)||null
    };
    const sign=JSON.stringify(card);
    if(sign!==PRESENCE_SENT){
      await fbReq(`playerDirectory/${myBox}?print=silent`,'PUT',{...card,lastSeen:now});
      PRESENCE_SENT=sign;
    }else{
      await fbReq(`playerDirectory/${myBox}/lastSeen?print=silent`,'PUT',now);
    }
    if(document.hidden||now-PRESENCE_READ<28000)return;
    PRESENCE_READ=now;

    const [count,queue]=await Promise.all([fbReq('publicStatus/online'),fbReq('publicStatus/queue')]);
    if(typeof count==='number')online=Math.max(1,count);
    if(typeof queue==='number')qCount=queue;
    const onEl=$('#online'),qEl=$('#sQueue');
    if(onEl)onEl.textContent=online.toLocaleString(LOC[lang]);
    if(qEl)qEl.textContent=qCount.toLocaleString(LOC[lang]);

    const seen=new Set(),people=[];
    for(const p of [...FRIENDS,...(Array.isArray(state.party)?state.party:[])]){
      if(!p||p.me||!p.name)continue;
      const nl=p.name.toLowerCase();
      if(!seen.has(nl)&&nl!==String(ME.name).toLowerCase()){seen.add(nl);people.push(p.name)}
    }
    const batch=people.length<=PRESENCE_BATCH?people:Array.from({length:PRESENCE_BATCH},(_,i)=>people[(PRESENCE_CURSOR+i)%people.length]);
    PRESENCE_CURSOR=people.length?(PRESENCE_CURSOR+PRESENCE_BATCH)%people.length:0;
    PRESENCE_ROUND++;
    const withCards=PRESENCE_ROUND%4===1;
    const looked=await Promise.all(batch.map(async name=>{
      const box=fbMailbox(name);
      const [last,cs]=await Promise.all([fbReq(`playerDirectory/${box}/lastSeen`),withCards?fbReq(`playerDirectory/${box}/cardStyle`):null]);
      return {nl:name.toLowerCase(),active:typeof last==='number'&&Date.now()-last<PRESENCE_TTL,card:cs&&typeof validCardId==='function'?validCardId(cs):null};
    }));
    const found=new Map(looked.map(x=>[x.nl,x]));
    let friendsStatusChanged=false,partyCardChanged=false;
    FRIENDS.forEach(f=>{
      const x=found.get(f.name.toLowerCase());
      if(!x)return;
      const newSt=x.active?'online':'offline';
      if(f.status!==newSt&&f.status!=='ingame'){
        f.status=newSt;friendsStatusChanged=true;
      }
      if(x.card&&(f.cardStyle||'default')!==x.card){f.cardStyle=x.card;friendsStatusChanged=true;LOOKC.delete(fbMailbox(f.name))}
    });
    if(Array.isArray(state.party)){
      state.party.forEach(p=>{
        if(!p||p.me||!p.name)return;
        const x=found.get(p.name.toLowerCase());
        if(x&&x.card&&(p.cardStyle||'default')!==x.card){p.cardStyle=x.card;partyCardChanged=true;LOOKC.delete(fbMailbox(p.name))}
      });
    }
    if(partyCardChanged&&typeof renderParty==='function')renderParty();
    if(friendsStatusChanged&&$('#friends')&&!$('#friends').hidden){
      renderFriends();
    }
  }catch(e){}
}
setInterval(()=>fbSyncOnline(false),10000);
window.addEventListener('pagehide',()=>fbSyncOnline(true));
window.addEventListener('beforeunload',()=>fbSyncOnline(true));

const DEFAULT_CSGO_CFG={
  viewmodel_fov:'68',
  viewmodel_offset_x:'2.5',
  viewmodel_offset_y:'0',
  viewmodel_offset_z:'-1.5',
  viewmodel_presetpos:'0',
  cl_righthand:'1',
  cl_bob_lower_amt:'5',
  sensitivity:'1.80',
  zoom_sensitivity_ratio_mouse:'1.00',
  m_rawinput:'1',
  fps_max:'400',
  rate:'786432',
  cl_cmdrate:'128',
  cl_updaterate:'128',
  cl_interp_ratio:'1',
  bind_jump_mwheel:'mwheeldown',
  bind_jumpthrow:'v',
  bind_cleardecals:'shift',
  bind_dropc4:'n',
  bind_switchhand:'h',
  bind_voicerecord:'c',
  customCmds:'cl_crosshairsize "2.5"; cl_crosshairgap "-2"; cl_crosshairthickness "1"; cl_crosshair_drawoutline "0"; cl_autowepswitch "0"'
};
const CSGO_STOCK_RESET={
  viewmodel_fov:'60',
  viewmodel_offset_x:'1',
  viewmodel_offset_y:'1',
  viewmodel_offset_z:'-1',
  viewmodel_presetpos:'1',
  cl_righthand:'1',
  cl_bob_lower_amt:'21',
  sensitivity:'2.50',
  zoom_sensitivity_ratio_mouse:'1.00',
  m_rawinput:'1',
  fps_max:'300',
  rate:'196608',
  cl_cmdrate:'64',
  cl_updaterate:'64',
  cl_interp_ratio:'2',
  bind_jump_mwheel:'',
  bind_jumpthrow:'',
  bind_cleardecals:'',
  bind_dropc4:'',
  bind_switchhand:'',
  bind_voicerecord:'k',
  customCmds:''
};
const CFG_KEYS=Object.keys(DEFAULT_CSGO_CFG);
const CSGO_BLOCKED_CMD=/^\s*(rcon\b|connect\b|retry\b|disconnect\b|quit\b|exit\b|exec\b|plugin_|sv_|mp_|bot_|tv_|host_writeconfig\b|logaddress_|con_logfile\b|echoln\b)/i;
function cleanCvarVal(v,def=''){
  const s=String(v??def).replace(/["';\r\n\\<>`$]/g,'').trim().slice(0,24);
  return /^[-0-9.+A-Za-z_]+$/.test(s)?s:String(def);
}
function cleanBindKey(v){
  const s=String(v??'').replace(/["';\r\n\\<>`$\s]/g,'').trim().slice(0,20);
  return /^[A-Za-z0-9_]+$/.test(s)?s:'';
}
function cleanCustomCmds(raw){
  if(typeof raw!=='string')return '';
  return raw.slice(0,1000).split(/[;\r\n]+/).map(x=>x.replace(/[\r\n\\<>`$]/g,'').trim())
    .filter(x=>x&&x.length<=140&&!CSGO_BLOCKED_CMD.test(x)&&!/https?:\/\//i.test(x))
    .slice(0,25).join('; ');
}
function sanitizeCsgoCfgObject(src){
  const raw={...DEFAULT_CSGO_CFG,...(src||{})};
  const out={};
  for(const k of CFG_KEYS){
    if(k==='customCmds')out[k]=cleanCustomCmds(raw[k]);
    else if(k.startsWith('bind_'))out[k]=cleanBindKey(raw[k]);
    else out[k]=cleanCvarVal(raw[k],DEFAULT_CSGO_CFG[k]);
  }
  return out;
}
ME.csgoCfg={...DEFAULT_CSGO_CFG};
let cfgCheckState={verifiedAt:Date.now(),restoredCount:0,restoredKeys:[],trigger:'init'};

function loadLocalCsgoCfg(){
  try{
    const s=JSON.parse(localStorage.getItem('cs_csgocfg')||'null');
    if(s&&typeof s==='object'){
      ME.csgoCfg=sanitizeCsgoCfgObject(s);
    }
  }catch(e){}
}
function saveLocalCsgoCfg(){
  try{
    ME.csgoCfg=sanitizeCsgoCfgObject(ME.csgoCfg);
    localStorage.setItem('cs_csgocfg',JSON.stringify(ME.csgoCfg));
    localStorage.setItem('tr_csgo_runtime_cvars',JSON.stringify(ME.csgoCfg));
  }catch(e){}
}
function buildCsgoExecList(cfg=ME.csgoCfg){
  const c=sanitizeCsgoCfgObject(cfg);
  const cmds=[
    `viewmodel_presetpos "${c.viewmodel_presetpos}"`,
    `viewmodel_fov "${c.viewmodel_fov}"`,
    `viewmodel_offset_x "${c.viewmodel_offset_x}"`,
    `viewmodel_offset_y "${c.viewmodel_offset_y}"`,
    `viewmodel_offset_z "${c.viewmodel_offset_z}"`,
    `cl_righthand "${c.cl_righthand}"`,
    `cl_bob_lower_amt "${c.cl_bob_lower_amt}"`,
    `sensitivity "${c.sensitivity}"`,
    `zoom_sensitivity_ratio_mouse "${c.zoom_sensitivity_ratio_mouse}"`,
    `m_rawinput "${c.m_rawinput}"`,
    `fps_max "${c.fps_max}"`,
    `rate "${c.rate}"`,
    `cl_cmdrate "${c.cl_cmdrate}"`,
    `cl_updaterate "${c.cl_updaterate}"`,
    `cl_interp_ratio "${c.cl_interp_ratio}"`
  ];
  if(c.bind_jump_mwheel)cmds.push(`bind "${c.bind_jump_mwheel}" "+jump"`);
  if(c.bind_jumpthrow)cmds.push(`alias "+jt" "+jump;-attack;-attack2"`, `alias "-jt" "-jump"`, `bind "${c.bind_jumpthrow}" "+jt"`);
  if(c.bind_cleardecals)cmds.push(`bind "${c.bind_cleardecals}" "+speed; r_cleardecals"`);
  if(c.bind_dropc4)cmds.push(`bind "${c.bind_dropc4}" "use weapon_knife; use weapon_c4; drop; slot1"`);
  if(c.bind_switchhand)cmds.push(`bindToggle "${c.bind_switchhand}" "cl_righthand"`);
  if(c.bind_voicerecord)cmds.push(`bind "${c.bind_voicerecord}" "+voicerecord"`);
  if(c.customCmds&&c.customCmds.trim()){
    c.customCmds.split(/[;\n]+/).map(x=>x.trim()).filter(Boolean).forEach(x=>cmds.push(x));
  }
  cmds.push('host_writeconfig');
  return cmds;
}
function buildCsgoExecLine(cfg=ME.csgoCfg){
  return buildCsgoExecList(cfg).join('; ');
}
function verifyAndRestoreCsgoCfg(trigger='login',notifyUser=false){
  const saved={...DEFAULT_CSGO_CFG,...(ME.csgoCfg||{})};
  let runtime=null;
  try{runtime=JSON.parse(localStorage.getItem('tr_csgo_runtime_cvars')||'null')}catch(e){}
  const restoredKeys=[];
  if(!runtime||typeof runtime!=='object'){
    runtime={...saved};
  }else{
    for(const k of CFG_KEYS){
      if(String(runtime[k]??'')!==String(saved[k]??'')){
        restoredKeys.push(k);
        runtime[k]=saved[k];
      }
    }
  }
  $$('[data-cfg-key]').forEach(inp=>{
    const k=inp.dataset.cfgKey;
    if(k&&saved[k]!==undefined&&inp.value!==String(saved[k])){
      if(!restoredKeys.includes(k))restoredKeys.push(k);
      inp.value=String(saved[k]);
      inp.classList.add('fixed');
    }
  });
  ME.csgoCfg={...saved};
  saveLocalCsgoCfg();
  cfgCheckState={
    verifiedAt:Date.now(),
    restoredCount:restoredKeys.length,
    restoredKeys,
    trigger
  };
  const outEl=$('#cfgOutBox');
  if(outEl)outEl.value=buildCsgoExecLine(ME.csgoCfg);
  if(notifyUser||restoredKeys.length>0){
    toast(restoredKeys.length>0
      ?`Config CS:GO vérifiée : ${restoredKeys.length} valeur(s) réinitialisée(s) restaurée(s) depuis ton profil`
      :'Config CS:GO vérifiée : tous tes binds et viewmodel sont intacts');
  }
  return restoredKeys.length;
}
function csgoCfgCard(){
  const c=ME.csgoCfg||DEFAULT_CSGO_CFG,st=cfgCheckState,fixed=new Set(st.restoredKeys||[]);
  const row=(k,lbl,ph='')=>`<div class="cfg-row"><label title="${k}">${lbl}</label><input data-cfg-key="${k}" class="${fixed.has(k)?'fixed':''}" value="${escA(c[k]??'')}" placeholder="${escA(ph)}"></div>`;
  const stTxt=st.restoredCount>0
    ?t('cfg_restored',{n:st.restoredCount,k:st.restoredKeys.slice(0,4).join(', ')+(st.restoredKeys.length>4?'…':'')})
    :t('cfg_ok');
  return `<section class="card cfg-card" id="csgoCfgSec">
    <div class="h3">${t('cfg_title')} <span>${t('cfg_sub')}</span></div>
    <div class="cfg-status ok">
      <div class="st-left"><span>${t('cfg_ok')}</span></div>
    </div>
    <ol class="cfg-how"><li>${t('cfg_how1')}</li><li>${t('cfg_how2')}</li><li>${t('cfg_how3')}</li></ol>
    <div class="cfg-cols">
      <div class="cfg-box">
        <div class="cfg-box-t"><span>Viewmodel</span><span class="pill">${t('cfg_weapon')}</span></div>
        ${row('viewmodel_fov','viewmodel_fov','68')}
        ${row('viewmodel_offset_x','viewmodel_offset_x','2.5')}
        ${row('viewmodel_offset_y','viewmodel_offset_y','0')}
        ${row('viewmodel_offset_z','viewmodel_offset_z','-1.5')}
        ${row('viewmodel_presetpos','viewmodel_presetpos','0')}
        ${row('cl_righthand','cl_righthand','1')}
        ${row('cl_bob_lower_amt','cl_bob_lower_amt','5')}
      </div>
      <div class="cfg-box">
        <div class="cfg-box-t"><span>Binds</span><span class="pill">${t('cfg_keys')}</span></div>
        ${row('bind_jump_mwheel',t('cfg_jump'),'mwheeldown')}
        ${row('bind_jumpthrow','Jumpthrow','v')}
        ${row('bind_cleardecals','Clear decals','shift')}
        ${row('bind_dropc4',t('cfg_c4'),'n')}
        ${row('bind_switchhand',t('cfg_hand'),'h')}
        ${row('bind_voicerecord',t('cfg_mic'),'c')}
      </div>
      <div class="cfg-box">
        <div class="cfg-box-t"><span>${t('cfg_net')}</span><span class="pill">128 tick</span></div>
        ${row('sensitivity','sensitivity','1.80')}
        ${row('zoom_sensitivity_ratio_mouse','zoom_sensitivity','1.00')}
        ${row('m_rawinput','m_rawinput','1')}
        ${row('fps_max','fps_max','400')}
        ${row('rate','rate','786432')}
        ${row('cl_cmdrate','cl_cmdrate','128')}
        ${row('cl_updaterate','cl_updaterate','128')}
      </div>
    </div>
    <div class="cfg-raw-wrap">
      <div>
        <div class="label" style="margin-bottom:6px"><span>${t('cfg_custom')}</span></div>
        <textarea class="cfg-raw" data-cfg-key="customCmds" placeholder="Ex: bind &quot;f&quot; &quot;+lookatweapon&quot;; cl_crosshairsize &quot;2&quot;">${escA(c.customCmds||'')}</textarea>
      </div>
      <div>
        <div class="label" style="margin-bottom:6px"><span>${t('cfg_line')}</span><button class="link" id="cfgCopyBtn" type="button">${t('copy_cmd')}</button></div>
        <textarea class="cfg-raw cfg-out" id="cfgOutBox" readonly>${escA(buildCsgoExecLine(c))}</textarea>
      </div>
    </div>
    <div class="cfg-actions">
      <div class="left">
        <button class="btn sm" id="cfgDlBtn" type="button">${t('cfg_dl')}</button>
      </div>
      <div class="right">
        <button class="btn primary sm" id="cfgSaveBtn" type="button">${t('save')}</button>
      </div>
    </div>
  </section>`;
}
function bindCsgoCfgEvents(){
  const sec=$('#csgoCfgSec');if(!sec)return;
  sec.querySelectorAll('[data-cfg-key]').forEach(inp=>{
    inp.oninput=()=>{
      inp.classList.remove('fixed');
      const preview={...ME.csgoCfg};
      sec.querySelectorAll('[data-cfg-key]').forEach(el=>{preview[el.dataset.cfgKey]=el.value.trim()});
      const outEl=$('#cfgOutBox');
      if(outEl)outEl.value=buildCsgoExecLine(preview);
    };
  });
  const saveB=$('#cfgSaveBtn');
  if(saveB)saveB.onclick=async()=>{
    sec.querySelectorAll('[data-cfg-key]').forEach(el=>{ME.csgoCfg[el.dataset.cfgKey]=el.value.trim()});
    cfgCheckState={verifiedAt:Date.now(),restoredCount:0,restoredKeys:[],trigger:'manual_save'};
    saveLocalCsgoCfg();
    await fbSyncMe({csgoCfg:ME.csgoCfg});
    renderProfile();
    toast(t('cfg_saved'));
  };
  const verB=$('#cfgVerifyBtn');
  if(verB)verB.onclick=()=>{
    verifyAndRestoreCsgoCfg('manual_check',true);
    renderProfile();
  };
  const simB=$('#cfgSimResetBtn');
  if(simB)simB.onclick=()=>{
    localStorage.setItem('tr_csgo_runtime_cvars',JSON.stringify(CSGO_STOCK_RESET));
    sec.querySelectorAll('[data-cfg-key]').forEach(el=>{
      const k=el.dataset.cfgKey;
      if(CSGO_STOCK_RESET[k]!==undefined)el.value=CSGO_STOCK_RESET[k];
    });
    toast(t('cfg_sim'));
    setTimeout(()=>{
      verifyAndRestoreCsgoCfg('csgo_restart_check',true);
      renderProfile();
    },650);
  };
  const cpB=$('#cfgCopyBtn');
  if(cpB)cpB.onclick=async()=>{
    try{await navigator.clipboard.writeText(buildCsgoExecLine(ME.csgoCfg));toast(t('copied',{x:t('cfg_cmds')}))}catch(e){}
  };
  const dlB=$('#cfgDlBtn');
  if(dlB)dlB.onclick=()=>{
    const lines=[
      '// ===========================================================',
      `// TICKRATE CS:GO CLOUD CONFIG, Profil : ${ME.name}`,
      '// À mettre dans csgo/cfg, puis option de lancement Steam : +exec autoexec',
      '// ===========================================================',
      ...buildCsgoExecList(ME.csgoCfg),
      'host_writeconfig',
      'echo "TICKRATE : config chargee"'
    ].join('\r\n');
    const blob=new Blob([lines],{type:'text/plain;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='autoexec.cfg';
    a.click();
    URL.revokeObjectURL(a.href);
    toast(t('cfg_dl_ok'));
  };
}

function fbProfileSnapshot(){
  const H=(ME.history||[]),h=H.slice(0,20),n=h.length||1,sum=f=>h.reduce((s,x)=>s+(+f(x)||0),0);
  const wins=sum(x=>x.won?1:0),K=sum(x=>x.k),D=sum(x=>x.d);
  let best=0,c=0;[...h].reverse().forEach(x=>{c=x.won?c+1:0;best=Math.max(best,c)});
  const l=lvl(ME.elo),nx=LV[l]!=null?LV[l]:null,lo=LV[l-1]||0;
  const maps={};h.forEach(x=>{const m=maps[x.map]||(maps[x.map]={map:x.map,played:0,wins:0});m.played++;m.wins+=x.won?1:0});
  const di=typeof divInfo==='function'?divInfo(ME.elo):null;
  return {
    id:fbUserKey(),uid:(typeof FBA!=='undefined'&&FBA&&FBA.uid)||null,name:ME.name,steamId:ME.steam&&ME.steam.id||null,steamLinked:!!(ME.steam&&ME.steam.linked),
    country:ME.country||'FR',memberSince:ME.since?new Date(ME.since).toISOString().slice(0,7):null,
    elo:ME.elo,peakElo:Math.max(ME.elo,...H.map(x=>+x.elo||0)),level:l,
    levelProgress:{level:l,nextLevel:nx!=null?l+1:null,eloToNext:nx!=null?Math.max(0,nx-ME.elo):0,progressPct:nx!=null?Math.round((ME.elo-lo)/(nx-lo)*100):100,color:lvlColor(l)},
    league:di?{id:di.L.id,division:di.d||null}:null,
    totalMatches:ME.matches||H.length,winrate:Math.round(wins/n*100),recentWL:`${wins}V / ${h.length-wins}D`,
    kd:+(D?K/D:K).toFixed(2),adr:Math.round(sum(x=>x.adr)/n),hs:Math.round(sum(x=>x.hs)/n),rating:+(sum(x=>x.rating)/n).toFixed(2),
    streak:best,totalKills:K,trust:Number(trust(ME).toFixed(2)),reports:ME.reports||0,
    eloHistory:h.map(x=>+x.elo||0).reverse(),
    recentResults:h.slice(0,10).map(x=>x.won?'W':'L'),
    matchesHistory:h.slice(0,10).map(x=>({at:+new Date(x.date)||0,map:x.map,won:!!x.won,score:x.score,k:x.k,d:x.d,a:x.a,adr:x.adr,hs:x.hs,rating:x.rating,delta:x.delta,elo:x.elo})),
    mapStats:Object.values(maps).map(m=>({...m,winrate:Math.round(m.wins/m.played*100)})),
    plan:ME.plan||'free',premium:ME.plan==='premium',
    coins:typeof SHOP!=='undefined'?SHOP.coins:null,passLevel:typeof passLevel==='function'?passLevel():null,ladderPoints:typeof SHOP!=='undefined'?SHOP.ladder:null,
    team:typeof MY_TEAM!=='undefined'&&MY_TEAM?{tag:MY_TEAM.tag,name:MY_TEAM.name}:null
  };
}
const FBS={t:null,last:0,err:null,lastHash:''};
function fbSyncSoon(){clearTimeout(FBS.t);FBS.t=setTimeout(()=>fbSyncMe(),1500)}
async function fbSyncMe(extra={}){
  if(!AUTH||!AUTH.session)return;
  if(!FBS.loaded){FBS.err='not_loaded';return}
  const key=fbUserKey();
  const payload={...fbProfileSnapshot(),
    name:ME.name,
    elo:ME.elo,
    level:isCalib(ME)?0:lvl(ME.elo),
    calib:ME.calib||null,
    plan:ME.plan||'free',
    influencer:ME.influencer?{platform:ME.influencer.platform,handle:ME.influencer.handle,url:ME.influencer.url}:null,
    color:ME.color,
    cardStyle:typeof validCardId==='function'?validCardId(ME.cardStyle):'default',
    bgStyle:typeof validBgId==='function'?validBgId(ME.bgStyle):'default',
    avatar:typeof ME.avatar==='string'&&ME.avatar.startsWith('data:image/')?ME.avatar:null,
    banner:ME.banner,
    steam:ME.steam,
    nameChangedAt:ME.nameChangedAt||0,
    csgoCfg:ME.csgoCfg||DEFAULT_CSGO_CFG,
    matches:ME.matches,
    reports:ME.reports,
    trust:Number(trust(ME).toFixed(2)),
    updatedAt:Date.now(),
    ...extra
  };
  const hash=JSON.stringify({...payload,updatedAt:0});
  if(hash===FBS.lastHash&&!Object.keys(extra).length&&Date.now()-FBS.last<5*6e4)return;
  const imgs=JSON.stringify([payload.avatar??null,payload.banner??null]),body={...payload};
  if(imgs===FBS.imgs){delete body.avatar;delete body.banner}
  try{
    if(typeof fbAuthEnsure==='function')await fbAuthEnsure();
    const r=await fetch(typeof fbUrl==='function'?fbUrl(`users/${key}?print=silent`):`${FB_URL}/users/${key}.json?print=silent`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(r.ok){FBS.last=Date.now();FBS.err=null;FBS.lastHash=hash;FBS.imgs=imgs}else FBS.err='HTTP '+r.status+(r.status===401||r.status===403?' (règles Firebase)':'');
  }catch(e){FBS.err=t('e_network')}
  if(FBS.err)console.warn('[TICKRATE] Synchro Firebase users/'+key+' :',FBS.err);
}
setInterval(()=>{if(AUTH&&AUTH.session&&!FBS.loaded&&typeof fbLoadMe==='function')fbLoadMe();else fbSyncMe()},60000);
addEventListener('pagehide',()=>{if(AUTH&&AUTH.session&&FBS.loaded)try{fetch(typeof fbUrl==='function'?fbUrl(`users/${fbUserKey()}?print=silent`):`${FB_URL}/users/${fbUserKey()}.json?print=silent`,{method:'PATCH',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({...fbProfileSnapshot(),updatedAt:Date.now()})})}catch(e){}});
async function fbLoadMe(){
  const key=fbUserKey();
  let d=null;
  try{if(typeof fbAuthEnsure==='function')await fbAuthEnsure();
    const r=await fetch(typeof fbUrl==='function'?fbUrl(`users/${key}`):`${FB_URL}/users/${key}.json`,{cache:'no-store'});
    if(!r.ok)return;
    d=await r.json();FBS.loaded=true;
  }catch(e){return}
  if(!d){
    return;
  }
  if(d.nameChangedAt&&(!ME.nameChangedAt||d.nameChangedAt>ME.nameChangedAt))ME.nameChangedAt=d.nameChangedAt;
  if(d.cardStyle)ME.cardStyle=d.cardStyle;
  if(d.bgStyle)ME.bgStyle=d.bgStyle;
  if(d.name&&RE_USER.test(d.name)&&d.nameChangedAt&&d.name!==ME.name){
    const old=ME.name;REG.delete(old);used.delete(old);
    ME.name=d.name;REG.set(ME.name,ME);used.add(ME.name);
    if(AUTH.session&&AUTH.session.account){
      AUTH.session.account.username=d.name;
      AUTH.session.account.nameChangedAt=ME.nameChangedAt;
      dUpdate(AUTH.session.account.id,x=>{x.username=d.name;x.nameChangedAt=ME.nameChangedAt});
    }
    $('#topName').textContent=ME.name;$('#umName').textContent=ME.name;
  }
  if(d.calib&&typeof d.calib==='object')ME.calib=d.calib;
  if(typeof d.elo==='number'&&d.elo>=100)ME.elo=d.elo;
  ME.color=(typeof d.color==='string'&&/^#[0-9a-fA-F]{3,8}$/.test(d.color))?d.color:'#c4562a';
  ME.cardStyle=(d.cardStyle&&typeof validCardId==='function')?validCardId(d.cardStyle):'default';
  ME.bgStyle=(d.bgStyle&&typeof validBgId==='function')?validBgId(d.bgStyle):'default';
  ME.banner=(d.banner!==undefined&&d.banner!==null)?d.banner:{type:'map',slug:'mirage'};
  ME.avatar=(typeof d.avatar==='string'&&/^data:image\//.test(d.avatar))?d.avatar:null;
  FBS.imgs=JSON.stringify([d.avatar??null,d.banner??null]);
  if(d.csgoCfg&&typeof d.csgoCfg==='object'){
    ME.csgoCfg={...DEFAULT_CSGO_CFG,...d.csgoCfg};
  }
  saveLocalProfile();
  refreshMe();renderParty();if(!$('#profile').hidden)renderProfile();
}
function fmtCdRemaining(ms){
  const d=Math.floor(ms/864e5),h=Math.floor((ms%864e5)/36e5),m=Math.max(1,Math.ceil((ms%36e5)/6e4));
  if(d>0)return t('days_s',{d,h});
  if(h>0)return t('dur_h',{n:h});
  return t('dur_min',{n:m});
}
function nameCdStatus(){
  const last=ME.nameChangedAt||0,rem=Math.max(0,(last+NAME_CD)-Date.now());
  return {locked:last>0&&rem>0,rem,txt:rem>0?fmtCdRemaining(rem):''};
}
function checkNewUsername(raw){
  const v=(raw||'').trim();
  if(v===ME.name)return {same:true,ok:true,val:v};
  const cd=nameCdStatus();
  if(cd.locked)return {ok:false,err:t('name_cd_wait',{x:cd.txt})};
  if(!RE_USER.test(v))return {ok:false,err:t('e_bad_username')};
  const myId=AUTH.session&&AUTH.session.account&&AUTH.session.account.id;
  const takenAcc=dAcc().some(a=>a.id!==myId&&a.username&&a.username.toLowerCase()===v.toLowerCase());
  const takenReg=[...REG.values()].some(p=>!p.me&&p.name.toLowerCase()===v.toLowerCase());
  if(takenAcc||takenReg)return {ok:false,err:t('e_username_taken')};
  return {ok:true,val:v};
}
function applyUsernameChange(newName){
  const old=ME.name,now=Date.now();
  REG.delete(old);used.delete(old);
  ME.name=newName;ME.nameChangedAt=now;
  REG.set(ME.name,ME);used.add(ME.name);
  if(AUTH.session&&AUTH.session.account){
    AUTH.session.account.username=newName;
    AUTH.session.account.nameChangedAt=now;
    dUpdate(AUTH.session.account.id,a=>{a.username=newName;a.nameChangedAt=now});
  }
  $('#topName').textContent=ME.name;
  $('#umName').textContent=ME.name;
  saveLocalProfile();
  fbSyncMe({previousName:old});
  fbReq('username_logs','POST',{userKey:fbUserKey(),oldName:old,newName,changedAt:now,nextAllowedAt:now+NAME_CD});
}
function saveLocalProfile(){
  const uKey=(typeof fbUserKey==='function'&&fbUserKey())||(typeof AUTH!=='undefined'&&AUTH.session&&AUTH.session.account&&AUTH.session.account.id)||null;
  if(!uKey)return;
  try{
    localStorage.setItem('cs_profile_'+uKey,JSON.stringify({name:ME.name,nameChangedAt:ME.nameChangedAt||0,avatar:ME.avatar,color:ME.color,banner:ME.banner,cardStyle:ME.cardStyle||'default',bgStyle:ME.bgStyle||'default'}));
    try{localStorage.removeItem('cs_profile')}catch(_){}
  }catch(e){toast(t('store_error'))}
}

let draft=null;
const AV_COLORS=['#c4562a','#3b6fd6','#2e9d6c','#7a5cc4','#c9424d','#c08a1e','#2b8f80','#5d6775'];
function openEditor(){draft={name:ME.name,avatar:ME.avatar,color:ME.color,banner:ME.banner,cardStyle:ME.cardStyle||'default',bgStyle:ME.bgStyle||'default'};renderEditor();openModal('editModal')}
function renderEditor(){
  const p={name:draft.name||ME.name,avatar:draft.avatar,color:draft.color};
  $('#edBanner').style.background=bannerCSS(draft.banner);
  const curCs=draft.cardStyle||ME.cardStyle||'default';
  const frame=typeof getAvatarFrame==='function'?getAvatarFrame({cardStyle:curCs}):(curCs!=='default'?' av-frame av-frame-'+curCs:'');
  $('#edAv').className='avatar big'+frame;
  $('#edAv').setAttribute('style',avStyle(p));$('#edAv').textContent=avInner(p);
  const cd=nameCdStatus(),inEl=$('#edNameIn'),bdEl=$('#edNameBadge'),msgEl=$('#edNameMsg');
  if(inEl){
    inEl.value=draft.name||ME.name;
    inEl.disabled=cd.locked;
    bdEl.className='ed-cd-pill '+(cd.locked?'lock':'ok');
    bdEl.textContent=cd.locked?t('name_cd_lock',{x:cd.txt}):t('name_cd_ok');
    msgEl.className='ed-name-msg';
    msgEl.textContent=cd.locked?t('name_cd_wait',{x:cd.txt}):t('name_cd_hint');
    inEl.oninput=()=>{
      draft.name=inEl.value;
      $('#edAv').textContent=avInner({name:draft.name||ME.name,avatar:draft.avatar});
      const ck=checkNewUsername(draft.name);
      if(!ck.ok){msgEl.className='ed-name-msg err';msgEl.textContent=ck.err}
      else{msgEl.className='ed-name-msg'+(ck.same?'':' ok');msgEl.textContent=t('name_cd_hint')}
    };
  }
  $('#edAvOpts').innerHTML=`<label class="btn sm upl">${ICON.up} ${t('upload')}<input type="file" accept="image/*" id="avFile"></label>`+
    AV_COLORS.map(c=>`<button class="sw ${!draft.avatar&&draft.color===c?'on':''}" data-color="${c}" style="background:${c}"></button>`).join('');
  const bsel=draft.banner||{};
  $('#edBnOpts').innerHTML=`<label class="btn sm upl">${ICON.up} ${t('upload')}<input type="file" accept="image/*" id="bnFile"></label>`+
    `<button class="bp ${!bsel.type?'on':''}" data-bn="" style="background:${bannerCSS(null)}"><span>${t('banner_default')}</span></button>`+
    MAPS.map(m=>`<button class="bp ${bsel.type==='map'&&bsel.slug===m.slug?'on':''}" data-bn="${m.slug}" style="background:${mapBg(m)}"><span>${m.n}</span></button>`).join('')+
    (bsel.type==='img'?`<button class="bp on" style="background:${bannerCSS(bsel)}"></button>`:'');
  if(typeof CARD_STYLES!=='undefined'){
    let csSec=$('#edCardSec');
    if(!csSec){
      const bnSec=$('#edBnOpts')&&$('#edBnOpts').closest('.ed-sec');
      if(bnSec){
        bnSec.insertAdjacentHTML('afterend',`<div class="ed-sec" id="edCardSec"><div class="label"><span>Carte de profil (Accueil & Groupe)</span><button type="button" class="link" id="edGoCardShop" class="btn sm ghost" style="margin-left:auto">Boutique des cartes</button></div><div class="ed-opts" id="edCardOpts"></div></div>`);
        csSec=$('#edCardSec');
        csSec.addEventListener('click',e=>{
          if(e.target.closest('#edGoCardShop')){closeModal('editModal');shopTab='cards';setView('shop:cards');return}
          const b=e.target.closest('[data-edcard]');
          if(!b)return;
          const cid=b.dataset.edcard;
          const isDev=typeof isDevUser==='function'&&isDevUser();
          if(!isDev&&typeof boughtCard==='function'&&!boughtCard(cid)){closeModal('editModal');cardPreviewId=cid;shopTab='cards';setView('shop:cards');return}
          draft.cardStyle=cid;
          renderEditor();
        });
      }
    }
    const cOpts=$('#edCardOpts');
    if(cOpts){
      const curCs=draft.cardStyle||ME.cardStyle||'default';
      cOpts.innerHTML=CARD_STYLES.map(c=>{
        const own=typeof boughtCard==='function'?boughtCard(c.id):c.id==='default';
        return `<button type="button" class="ed-card-pill ${curCs===c.id?'on':''} ${own?'':'locked'}" data-edcard="${c.id}" style="--tc:${c.tierCol}">
          <span class="ed-cp-dot"></span>
          <span>${escA(c.name)}</span>
          ${own?'':`<small>${c.price} TC</small>`}
        </button>`;
      }).join('');
    }
  }
  if(typeof PROFILE_BGS!=='undefined'){
    let bgSec=$('#edBgSec');
    if(!bgSec){
      const cSec=$('#edCardSec')||($('#edBnOpts')&&$('#edBnOpts').closest('.ed-sec'));
      if(cSec){
        cSec.insertAdjacentHTML('afterend',`<div class="ed-sec" id="edBgSec"><div class="label"><span>${t('bg_title')}</span><button type="button" class="link" id="edGoBgShop" class="btn sm ghost" style="margin-left:auto">Boutique des fonds</button></div><div class="ed-opts" id="edBgOpts"></div></div>`);
        bgSec=$('#edBgSec');
        bgSec.addEventListener('click',e=>{
          if(e.target.closest('#edGoBgShop')){closeModal('editModal');shopTab='bgs';setView('shop:bgs');return}
          const b=e.target.closest('[data-edbg]');
          if(!b)return;
          const bid=b.dataset.edbg;
          const isDev=typeof isDevUser==='function'&&isDevUser();
          if(!isDev&&typeof boughtBg==='function'&&!boughtBg(bid)){closeModal('editModal');bgPreviewId=bid;shopTab='bgs';setView('shop:bgs');return}
          draft.bgStyle=bid;
          renderEditor();
        });
      }
    }
    const bOpts=$('#edBgOpts');
    if(bOpts){
      const curBg=draft.bgStyle||ME.bgStyle||'default';
      bOpts.innerHTML=PROFILE_BGS.map(b=>{
        const own=typeof boughtBg==='function'?boughtBg(b.id):b.id==='default';
        return `<button type="button" class="ed-card-pill ${curBg===b.id?'on':''} ${own?'':'locked'}" data-edbg="${b.id}" style="--tc:${b.tierCol}">
          <span class="ed-cp-dot"></span>
          <span>${escA(b.name)}</span>
          ${own?'':`<small>${b.price} TC</small>`}
        </button>`;
      }).join('');
    }
  }
  $('#avFile').onchange=e=>loadImg(e.target.files[0],256,256,d=>{draft.avatar=d;renderEditor()});
  $('#bnFile').onchange=e=>loadImg(e.target.files[0],1500,400,d=>{draft.banner={type:'img',data:d};renderEditor()});
}
$('#edAvOpts').addEventListener('click',e=>{const b=e.target.closest('[data-color]');if(!b)return;draft.avatar=null;draft.color=b.dataset.color;renderEditor()});
$('#edBnOpts').addEventListener('click',e=>{const b=e.target.closest('[data-bn]');if(!b)return;draft.banner=b.dataset.bn?{type:'map',slug:b.dataset.bn}:null;renderEditor()});
function canvasOk(){try{const c=document.createElement('canvas');c.width=c.height=2;const x=c.getContext('2d');x.fillStyle='#ff0000';x.fillRect(0,0,2,2);
  const d=x.getImageData(0,0,2,2).data;return d[0]===255&&d[1]===0&&d[2]===0&&d[4]===255}catch(e){return false}}
function loadImg(file,W,H,cb){
  if(!file)return;
  const fr=new FileReader();
  fr.onload=()=>{
    if(!canvasOk()){
      const max=W>500?420e3:220e3;
      if(!/^data:image\/(png|jpeg|webp|gif);base64,/.test(fr.result))return toast(t('img_error'));
      if(fr.result.length>max)return toast(t('img_too_big',{n:Math.round(max*.75/1024)}));
      return cb(fr.result);
    }
    const img=new Image();img.onload=()=>{
      const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
      const s=Math.max(W/img.width,H/img.height),w=img.width*s,h=img.height*s;
      x.drawImage(img,(W-w)/2,(H-h)/2,w,h);cb(c.toDataURL('image/jpeg',.8));
    };img.onerror=()=>toast(t('img_error'));img.src=fr.result};
  fr.onerror=()=>toast(t('img_error'));fr.readAsDataURL(file);
}
$('#edSave').onclick=()=>{
  const ck=checkNewUsername(draft.name);
  if(!ck.ok){
    const msgEl=$('#edNameMsg');
    if(msgEl){msgEl.className='ed-name-msg err';msgEl.textContent=ck.err}
    return toast(ck.err);
  }
  const renamed=!ck.same;
  ME.avatar=draft.avatar;ME.color=draft.color;ME.banner=draft.banner;
  if(draft.cardStyle&&typeof validCardId==='function'){
    ME.cardStyle=validCardId(draft.cardStyle);
    if(typeof syncPartyCardStyle==='function')syncPartyCardStyle(ME.cardStyle);
  }
  if(draft.bgStyle&&typeof validBgId==='function'){
    ME.bgStyle=validBgId(draft.bgStyle);
  }
  if(renamed)applyUsernameChange(ck.val);
  else{saveLocalProfile();FBS.lastHash='';fbSyncMe({bgStyle:ME.bgStyle||'default'}).then(()=>{if(FBS.err)toast(t('e_profile_sync'))});if(typeof fbSyncOnline==='function')fbSyncOnline(false)}
  closeModal('editModal');refreshMe();renderParty();renderProfile();if(!$('#ranking').hidden)renderRanking();
  toast(renamed?t('name_changed',{n:ME.name}):t('saved'));
};
$('#edReset').onclick=()=>{draft={name:ME.name,avatar:null,color:AV_COLORS[0],banner:{type:'map',slug:'mirage'},cardStyle:'default',bgStyle:'default'};renderEditor()};
function loadSavedProfile(){
  loadLocalCsgoCfg();
  try{localStorage.removeItem('cs_profile')}catch(e){}
  const uKey=(typeof fbUserKey==='function'&&fbUserKey())||(typeof AUTH!=='undefined'&&AUTH.session&&AUTH.session.account&&AUTH.session.account.id)||null;
  if(!uKey)return;
  try{
    const s=JSON.parse(localStorage.getItem('cs_profile_'+uKey)||'null');
    if(s){
      ME.avatar=typeof s.avatar==='string'&&/^data:image\//.test(s.avatar)?s.avatar:null;
      ME.color=s.color||ME.color;ME.banner=s.banner===undefined?ME.banner:s.banner;
      if(s.cardStyle)ME.cardStyle=s.cardStyle;
      if(s.bgStyle)ME.bgStyle=s.bgStyle;
      if(s.nameChangedAt)ME.nameChangedAt=s.nameChangedAt;
      if(s.name&&RE_USER.test(s.name)){ME.name=s.name;$('#topName').textContent=ME.name}
    }
  }catch(e){}
}

setTimeout(() => {
  if (typeof loadFriendsFromFirebase === 'function') loadFriendsFromFirebase();
  if (typeof pollIncomingInvites === 'function') pollIncomingInvites();
  if (typeof fbSyncOnline === 'function') fbSyncOnline();
}, 500);

