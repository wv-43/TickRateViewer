const EC = require('./eco-core');
const DB = require('../data/cases.json');
const val = async ref => (await ref.get()).val();

const MAX_CONTAINERS = 25;
const MAX_ITEMS_PER_CONTAINER = 1000;
const MAX_NAME_LEN = 32;

function cleanName(n) {
  const s = String(n || '').trim().replace(/[\r\n\t]/g, ' ').slice(0, MAX_NAME_LEN);
  return s || 'Unité de stockage';
}

function safeId(id) {
  return String(id || '').replace(/[.#$/[\]]/g, '_').slice(0, 64);
}

async function list(db, uid) {
  if (!uid) return { error: 'unauthenticated' };
  const raw = (await val(db.ref(`containers/${uid}`))) || {};
  const out = [];

  for (const [id, c] of Object.entries(raw)) {
    if (!c) continue;
    const itemsMap = c.items || {};
    const itemsList = [];
    let totalVal = 0;

    for (const [itemId, it] of Object.entries(itemsMap)) {
      if (!it || !DB.items[it.k]) continue;
      const v = EC.price(DB, it).v || 0;
      totalVal += v;
      itemsList.push({ id: itemId, ...it, val: v });
    }

    out.push({
      id,
      name: cleanName(c.name),
      at: c.at || Date.now(),
      count: itemsList.length,
      max: MAX_ITEMS_PER_CONTAINER,
      value: totalVal,
      items: itemsList.sort((a, b) => (b.at || 0) - (a.at || 0))
    });
  }

  return out.sort((a, b) => (b.at || 0) - (a.at || 0));
}

async function create(db, uid, name, now = Date.now()) {
  if (!uid) return { error: 'unauthenticated' };
  const cur = (await val(db.ref(`containers/${uid}`))) || {};
  if (Object.keys(cur).length >= MAX_CONTAINERS) return { error: 'max_containers' };

  const id = db.ref().push().key;
  const cName = cleanName(name);
  const container = {
    id,
    name: cName,
    at: now,
    items: {}
  };

  await db.ref(`containers/${uid}/${id}`).set({
    name: cName,
    at: now
  });

  return {
    ok: true,
    container: {
      id,
      name: cName,
      at: now,
      count: 0,
      max: MAX_ITEMS_PER_CONTAINER,
      value: 0,
      items: []
    }
  };
}

async function rename(db, uid, containerId, name) {
  if (!uid) return { error: 'unauthenticated' };
  const cid = safeId(containerId);
  if (!cid) return { error: 'bad_id' };
  const cur = await val(db.ref(`containers/${uid}/${cid}`));
  if (!cur) return { error: 'no_container' };

  const cName = cleanName(name);
  await db.ref(`containers/${uid}/${cid}/name`).set(cName);
  return { ok: true, id: cid, name: cName };
}

async function take(ref, ok) {
  let got = null;
  await ref.transaction(x => { got = null; if (x === null) return null; if (!ok(x)) return undefined; got = x; return null; });
  return got;
}

async function deposit(db, uid, containerId, itemIds, now = Date.now()) {
  if (!uid) return { error: 'unauthenticated' };
  const cid = safeId(containerId);
  if (!cid) return { error: 'bad_id' };

  const c = await val(db.ref(`containers/${uid}/${cid}`));
  if (!c) return { error: 'no_container' };

  const rawIds = Array.isArray(itemIds) ? itemIds : [itemIds];
  const ids = [...new Set(rawIds.map(safeId).filter(Boolean))].slice(0, 200);
  if (!ids.length) return { error: 'no_items' };

  const curCount = Object.keys(c.items || {}).length;
  if (curCount + ids.length > MAX_ITEMS_PER_CONTAINER) return { error: 'container_full' };

  const valid = [];
  for (const id of ids) {
    const it = await take(db.ref(`inventory/${uid}/items/${id}`), x => !x.listed && DB.items[x.k]);
    if (it) valid.push({ id, it });
  }

  if (!valid.length) return { error: 'no_valid_items' };

  const upd = {};
  for (const { id, it } of valid) upd[`containers/${uid}/${cid}/items/${id}`] = { ...it, at: it.at || now, depositedAt: now };

  const loadout = await val(db.ref(`loadouts/${uid}/w`));
  if (loadout && typeof loadout === 'object') {
    for (const [slotKey, slotVal] of Object.entries(loadout)) {
      if (slotVal && valid.some(v => v.id === slotVal.iid)) {
        upd[`loadouts/${uid}/w/${slotKey}`] = null;
      }
    }
  }

  await db.ref().update(upd);
  return { ok: true, containerId: cid, count: valid.length };
}

async function retrieve(db, uid, containerId, itemIds, now = Date.now()) {
  if (!uid) return { error: 'unauthenticated' };
  const cid = safeId(containerId);
  if (!cid) return { error: 'bad_id' };

  const c = await val(db.ref(`containers/${uid}/${cid}`));
  if (!c) return { error: 'no_container' };

  const rawIds = Array.isArray(itemIds) ? itemIds : [itemIds];
  const ids = [...new Set(rawIds.map(safeId).filter(Boolean))].slice(0, 200);
  if (!ids.length) return { error: 'no_items' };

  const valid = [];
  for (const id of ids) {
    const it = await take(db.ref(`containers/${uid}/${cid}/items/${id}`), x => DB.items[x.k]);
    if (it) valid.push({ id, it });
  }

  if (!valid.length) return { error: 'no_valid_items' };

  const upd = {};
  for (const { id, it } of valid) { const { depositedAt, ...item } = it; upd[`inventory/${uid}/items/${id}`] = { ...item, at: item.at || now }; }

  await db.ref().update(upd);
  return { ok: true, containerId: cid, count: valid.length };
}

async function remove(db, uid, containerId) {
  if (!uid) return { error: 'unauthenticated' };
  const cid = safeId(containerId);
  if (!cid) return { error: 'bad_id' };

  const c = await val(db.ref(`containers/${uid}/${cid}`));
  if (!c) return { error: 'no_container' };
  if (c.items && Object.keys(c.items).length > 0) return { error: 'not_empty' };

  await db.ref(`containers/${uid}/${cid}`).remove();
  return { ok: true, id: cid };
}

module.exports = {
  MAX_CONTAINERS,
  MAX_ITEMS_PER_CONTAINER,
  MAX_NAME_LEN,
  cleanName,
  list,
  create,
  rename,
  deposit,
  retrieve,
  remove
};
