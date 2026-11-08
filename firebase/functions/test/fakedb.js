// Mini Realtime Database en mémoire (pour les tests, sans émulateur)
const clone = v => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
function norm(v) {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) { const a = v.map(norm); return a.some(x => x !== null) ? a : null; }
  if (typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) { const n = norm(x); if (n !== null) o[k] = n; } return Object.keys(o).length ? o : null; }
  return v;
}
const parts = p => String(p || '').split('/').filter(Boolean);
class FakeDB {
  constructor(data = {}) { this.root = norm(data) || {}; this.n = 0; }
  _get(ps) { let c = this.root; for (const k of ps) { if (c == null || typeof c !== 'object') return null; c = c[k]; } return c === undefined ? null : c; }
  _set(ps, v) {
    v = norm(clone(v));
    if (!ps.length) { this.root = v || {}; return; }
    let c = this.root; for (const k of ps.slice(0, -1)) { if (c[k] == null || typeof c[k] !== 'object') c[k] = {}; c = c[k]; }
    if (v === null) delete c[ps.at(-1)]; else c[ps.at(-1)] = v;
    this.root = norm(this.root) || {};
  }
  ref(path = '') { return new Ref(this, parts(path)); }
}
const snap = v => ({ val: () => clone(v), exists: () => v !== null && v !== undefined });
class Query {
  constructor(ref, child) { this.ref = ref; this.child = child; this.f = []; }
  limitToLast(n) { this.f.push(a => a.slice(-n)); return this; }
  startAt(x) { this.f.push(a => a.filter(([, v]) => (v?.[this.child] ?? null) >= x)); return this; }
  equalTo(x) { this.f.push(a => a.filter(([, v]) => (v?.[this.child] ?? null) === x)); return this; }
  async get() {
    let a = Object.entries(this.ref.db._get(this.ref.ps) || {}).sort((x, y) => ((x[1]?.[this.child] ?? 0) > (y[1]?.[this.child] ?? 0) ? 1 : -1));
    for (const f of this.f) a = f(a);
    return snap(a.length ? Object.fromEntries(a) : null);
  }
}
class Ref {
  constructor(db, ps) { this.db = db; this.ps = ps; this.key = ps.at(-1) || null; }
  child(p) { return new Ref(this.db, [...this.ps, ...parts(p)]); }
  async get() { return snap(this.db._get(this.ps)); }
  async set(v) { this.db._set(this.ps, v); }
  async remove() { this.db._set(this.ps, null); }
  async update(o) { for (const [k, v] of Object.entries(o)) this.db._set([...this.ps, ...parts(k)], v); }
  push(v) { const r = this.child('-k' + String(++this.db.n).padStart(6, '0')); if (v !== undefined) r.set(v); return r; }
  async transaction(fn) { const r = fn(clone(this.db._get(this.ps))); if (r === undefined) return { committed: false, snapshot: snap(this.db._get(this.ps)) }; this.db._set(this.ps, r); return { committed: true, snapshot: snap(this.db._get(this.ps)) }; }
  orderByChild(c) { return new Query(this, c); }
}
module.exports = { FakeDB };
