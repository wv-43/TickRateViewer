const CATALOG = {
  plans: {
    plus: { m: 299, y: 2499, name: 'TICKRATE Plus' },
    premium: { m: 547, y: 4599, name: 'TICKRATE Premium' }
  },
  packs: { 500: 499, 1100: 999, 2400: 1999, 6500: 4999 }
};
const GRACE_MS = 3 * 864e5;
const val = async ref => (await ref.get()).val();

const siteBase = (origin, allowed) => (allowed.includes(origin) ? origin : allowed[0]).replace(/\/$/, '');

async function customerOf(db, stripe, uid) {
  const b = (await val(db.ref(`billing/${uid}`))) || {};
  if (b.customerId) return b.customerId;
  const prof = (await val(db.ref(`profiles/${uid}`))) || {};
  const c = await stripe.customers.create({ metadata: { uid }, name: prof.name || undefined });
  await db.ref(`billing/${uid}/customerId`).set(c.id);
  return c.id;
}

async function checkout(db, stripe, uid, data, origin, allowed) {
  if (process.env.PAYMENTS_DISABLED === 'true') return { error: 'pay_coming_soon' };
  const base = siteBase(String(origin || ''), allowed);
  const prof = (await val(db.ref(`profiles/${uid}`))) || {};
  const customer = await customerOf(db, stripe, uid);
  const common = {
    customer, client_reference_id: uid, locale: 'auto',
    success_url: `${base}/?pay=ok&sid={CHECKOUT_SESSION_ID}#/premium`,
    cancel_url: `${base}/?pay=cancel#/premium`
  };
  if (data.kind === 'plan') {
    const P = CATALOG.plans[data.plan], period = data.period === 'y' ? 'y' : 'm';
    if (!P) return { error: 'pay_bad_item' };
    if (prof.planSource === 'influencer') return { error: 'pay_influencer' };
    const b = (await val(db.ref(`billing/${uid}`))) || {};
    if (b.subId && ['active', 'trialing', 'past_due'].includes(b.subStatus)) return { error: 'pay_has_sub' };
    const meta = { uid, kind: 'plan', plan: data.plan, period };
    const s = await stripe.checkout.sessions.create({
      ...common, mode: 'subscription', metadata: meta, subscription_data: { metadata: meta },
      line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: P[period], recurring: { interval: period === 'y' ? 'year' : 'month' }, product_data: { name: P.name } } }]
    });
    await db.ref(`purchases/${uid}/${s.id}`).set({ kind: 'plan', plan: data.plan, period, status: 'pending', at: Date.now() });
    return { ok: true, url: s.url };
  }
  if (data.kind === 'coins') {
    const coins = +data.pack, cents = CATALOG.packs[coins];
    if (!cents) return { error: 'pay_bad_item' };
    const meta = { uid, kind: 'coins', coins: String(coins) };
    const s = await stripe.checkout.sessions.create({
      ...common, mode: 'payment', metadata: meta, payment_intent_data: { metadata: meta },
      line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: cents, product_data: { name: `${coins} Tick Coins` } } }]
    });
    await db.ref(`purchases/${uid}/${s.id}`).set({ kind: 'coins', coins, status: 'pending', at: Date.now() });
    return { ok: true, url: s.url };
  }
  return { error: 'pay_bad_item' };
}

async function portal(db, stripe, uid, origin, allowed) {
  const b = (await val(db.ref(`billing/${uid}`))) || {};
  if (!b.customerId) return { error: 'pay_no_customer' };
  const s = await stripe.billingPortal.sessions.create({ customer: b.customerId, return_url: `${siteBase(String(origin || ''), allowed)}/#/premium` });
  return { ok: true, url: s.url };
}

const periodEnd = sub => (sub.current_period_end || sub.items?.data?.[0]?.current_period_end || 0) * 1000;
async function applySubscription(db, sub) {
  const uid = sub.metadata?.uid, plan = sub.metadata?.plan;
  if (!uid || !['plus', 'premium'].includes(plan)) return;
  const prof = (await val(db.ref(`profiles/${uid}`))) || {}, upd = {};
  upd[`billing/${uid}/subId`] = sub.id; upd[`billing/${uid}/subStatus`] = sub.status;
  const live = ['active', 'trialing', 'past_due'].includes(sub.status);
  if (live) {
    upd[`profiles/${uid}/plan`] = plan; upd[`profiles/${uid}/planSource`] = 'stripe';
    upd[`profiles/${uid}/planUntil`] = periodEnd(sub) ? periodEnd(sub) + GRACE_MS : null;
  } else if (prof.planSource === 'stripe') {
    upd[`profiles/${uid}/plan`] = 'free'; upd[`profiles/${uid}/planSource`] = null; upd[`profiles/${uid}/planUntil`] = null;
  }
  await db.ref().update(upd);
}
async function applySession(db, s, addCoins) {
  const uid = s.metadata?.uid || s.client_reference_id; if (!uid) return;
  const ref = db.ref(`purchases/${uid}/${s.id}`);
  if (s.metadata?.kind === 'coins') {
    if (s.payment_status !== 'paid') return ref.update({ status: s.payment_status || 'unpaid' });
    let first = false;
    await ref.transaction(p => { first = !p || p.status !== 'paid'; return { ...(p || {}), kind: 'coins', coins: +s.metadata.coins, status: 'paid', paidAt: Date.now() }; });
    if (first) await addCoins(db, uid, +s.metadata.coins);
    if (s.payment_intent) await db.ref(`stripePI/${s.payment_intent}`).set({ uid, sid: s.id });
  } else if (s.mode === 'subscription') {
    await ref.update({ status: 'paid', paidAt: Date.now(), subId: s.subscription || null });
  }
}
async function reverseCoins(db, pi, share, status) {
  const link = pi && (await val(db.ref(`stripePI/${pi}`)));
  if (!link) return;
  const ref = db.ref(`purchases/${link.uid}/${link.sid}`), p = (await val(ref)) || {};
  const owed = Math.round((+p.coins || 0) * Math.min(1, Math.max(0, share))) - (+p.reversed || 0);
  let taken = 0;
  if (owed > 0) await db.ref(`wallet/${link.uid}/coins`).transaction(c => { taken = Math.min(c || 0, owed); return (c || 0) - taken; });
  await ref.update({ status, reversed: (+p.reversed || 0) + Math.max(0, owed), reversedShort: owed > taken ? (+p.reversedShort || 0) + owed - taken : (p.reversedShort || null) });
}
async function handleEvent(db, ev, addCoins) {
  let first = false;
  await db.ref(`stripeEvents/${ev.id}`).transaction(x => { first = !x; return true; });
  if (!first) return { ok: true, duplicate: true };
  const o = ev.data.object;
  try {
    switch (ev.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': await applySession(db, o, addCoins); break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': await applySubscription(db, o); break;
      case 'charge.refunded': await reverseCoins(db, o.payment_intent, o.amount ? o.amount_refunded / o.amount : 1, o.refunded ? 'refunded' : 'partial_refund'); break;
      case 'charge.dispute.created': await reverseCoins(db, o.payment_intent, 1, 'disputed'); break;
      default: break;
    }
  } catch (e) {
    await db.ref(`stripeEvents/${ev.id}`).remove();
    throw e;
  }
  return { ok: true };
}

module.exports = { CATALOG, siteBase, checkout, portal, handleEvent, applySubscription };
