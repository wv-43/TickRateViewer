// =====================================================
// TICKRATE - pages pour les moteurs de recherche (FR + EN)
// Contenu : tools/seo/fr.js et tools/seo/en.js. Ce script :
//   1. génère chaque page (servie sans .html grâce à cleanUrls), plus une page « Guides » par langue ;
//   2. relie les pages entre elles : « À lire aussi » choisi par thèmes communs, liens FR <-> EN (hreflang) ;
//   3. contrôle les mots-clés : la recherche principale (kw[0]) doit être dans le titre, le h1, la description
//      et le début de la page ; chaque variante au moins une fois ; longueurs du titre et de la description ;
//      deux pages qui visent la même recherche (elles se feraient concurrence) ; pages trop courtes ;
//   4. réécrit public/sitemap.xml (accueil, pages, mentions légales) avec les liens de langue.
// Relancer après modification :  node tools/build-seo.js      (sort en erreur si un contrôle échoue)
// =====================================================
const fs = require('fs'), path = require('path');
const { footer } = require('./footer');
const OUT = path.join(__dirname, '..', 'public');
const SITE = 'https://tickrate.eu';
const V = '3.6.0';
const TODAY = new Date().toISOString().slice(0, 10);
// réseaux de TICKRATE : pied de page de chaque page et sameAs (Google relie ces profils au site)
const SOCIAL = [['Instagram', 'https://www.instagram.com/tickrate.eu/'], ['TikTok', 'https://www.tiktok.com/@tickrate.eu'], ['Discord', 'https://discord.gg/KNXbGrTDj']];

const UI = {
  fr: { locale: 'fr_FR', ld: 'fr-FR', faq: 'Questions fréquentes', more: 'À lire aussi', band: 'Prêt à jouer en 128 tick ?', join: 'Rejoindre TICKRATE',
        cta: 'Créer mon compte gratuit', cta2: 'Voir les modes de jeu', play: 'Jouer', home: 'Accueil', nav: 'Présentation',
        legal: '<a href="/mentions-legales">Mentions légales</a><a href="/confidentialite">Confidentialité</a>', other: 'English', hub: 'guides',
        hubNav: 'Guides', hubTitle: 'Guides CS GO : serveurs, tickrate, commandes · TICKRATE',
        hubDesc: 'Tous les guides CS GO de TICKRATE : serveurs 128 tick, tickrate, CS:GO legacy, commandes, maps, matchmaking, Wingman et 1v1.',
        hubH1: 'Guides CS GO', hubLead: 'Tout ce qu\'il faut savoir pour jouer à CS:GO en 2026 : serveurs, réglages, modes de jeu et classement.' },
  en: { locale: 'en_US', ld: 'en', faq: 'FAQ', more: 'Read next', band: 'Ready to play at 128 tick?', join: 'Join TICKRATE',
        cta: 'Create my free account', cta2: 'See game modes', play: 'Play', home: 'Home', nav: 'About',
        legal: '', other: 'Français', hub: 'en/guides',
        hubNav: 'Guides', hubTitle: 'CS GO guides: servers, tickrate, legacy · TICKRATE',
        hubDesc: 'All TICKRATE CS GO guides: 128 tick servers, tickrate explained, CS:GO legacy in 2026 and ranked matchmaking in 5v5, Wingman and 1v1.',
        hubH1: 'CS GO guides', hubLead: 'Everything you need to play CS:GO in 2026: servers, settings, game modes and ranking.' }
};

const PAGES = [...require('./seo/fr').map(p => ({ ...p, lang: 'fr' })), ...require('./seo/en').map(p => ({ ...p, lang: 'en' }))];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = s => String(s).replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');
// forme comparable : minuscules, sans accents, « cs:go » / « csgo » / « cs-go » = « cs go », sans pluriel en -s
const norm = s => ' ' + strip(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\bcs[\s:-]?go\b/g, 'cs go').replace(/[^a-z0-9_.]+/g, ' ')
  .split(' ').filter(Boolean).map(w => w.length > 3 ? w.replace(/s$/, '') : w).join(' ') + ' ';
const has = (text, kw) => norm(text).includes(norm(kw));

// --- « À lire aussi » : pages de la même langue qui partagent le plus de thèmes, puis les pages principales
function related(p) {
  return PAGES.filter(q => q.lang === p.lang && q.slug !== p.slug)
    .map(q => ({ q, s: q.tags.filter(t => p.tags.includes(t)).length * 2 + (q.main ? 1 : 0) }))
    .sort((a, b) => b.s - a.s).slice(0, 4).map(x => x.q);
}

function shell(p, { body, ld, related: rel, cur }) {
  const u = UI[p.lang], url = `${SITE}/${p.slug}`;
  const main = PAGES.filter(q => q.lang === p.lang && q.main);
  const alts = Object.entries(p.alt || {}).map(([l, s]) => [l, s]);
  const hreflang = alts.length ? [`<link rel="alternate" hreflang="${p.lang}" href="${url}">`,
    ...alts.map(([l, s]) => `<link rel="alternate" hreflang="${l}" href="${SITE}/${s}">`)].join('\n') + '\n' : '';
  const langLink = alts.length ? `<a href="/${alts[0][1]}" hreflang="${alts[0][0]}" lang="${alts[0][0]}">${u.other}</a>` : '';
  const all = PAGES.filter(q => q.lang === p.lang);
  return `<!DOCTYPE html>
<html lang="${p.lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="/js/canon.js?v=${V}"></script>
<script src="/js/user-bg.js?v=1"></script>
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}">
<link rel="canonical" href="${url}">
${hreflang}<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">
<meta name="theme-color" content="#0a0a0a">
<meta property="og:type" content="article">
<meta property="og:site_name" content="TICKRATE">
<meta property="og:locale" content="${u.locale}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og.jpg?v=2">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=3">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=3">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3">
<link rel="stylesheet" href="/seo.css?v=${V}">
<link rel="stylesheet" href="/footer.css?v=${V}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${p.script ? `<script src="/js/${p.script}?v=${V}" defer></script>
` : ''}</head>
<body>
<header class="sx-top"><div class="sx-top-in">
  <a class="sx-brand" href="/"><img src="/logo.png?v=3" alt="" width="30" height="30"><span>TICK<b>RATE</b></span></a>
  <nav class="sx-nav" aria-label="${u.nav}">${main.map(q => `<a href="/${q.slug}"${q.slug === p.slug ? ' aria-current="page"' : ''}>${q.nav}</a>`).join('')}<a href="/${u.hub}"${p.slug === u.hub ? ' aria-current="page"' : ''}>${u.hubNav}</a></nav>
  <a class="sx-cta" href="/">${u.play}</a>
</div></header>
<main class="sx">
  <p class="sx-crumb"><a href="/">TICKRATE</a> › ${p.slug === u.hub ? esc(u.hubNav) : `<a href="/${u.hub}">${u.hubNav}</a> › ${esc(cur)}`}</p>
  <h1>${p.h1}</h1>
  <p class="sx-lead">${p.lead}</p>
  <div class="sx-actions"><a class="sx-cta" href="/">${u.cta}</a><a class="sx-cta ghost" href="/#/play">${u.cta2}</a></div>
${body}
  <div class="sx-band"><p>${u.band}</p><a class="sx-cta" href="/">${u.join}</a></div>
${rel && rel.length ? `  <h2>${u.more}</h2>\n  <div class="sx-more">${rel.map(q => `<a href="/${q.slug}"><b>${q.nav}</b><span>${q.short}</span></a>`).join('')}</div>\n` : ''}</main>
${footer(p.lang, { pages: all.map(q => ['/' + q.slug, q.nav]), other: alts.length ? '/' + alts[0][1] : null })}
</body>
</html>
`;
}

function contentPage(p) {
  const u = UI[p.lang], url = `${SITE}/${p.slug}`;
  const faq = p.faq || [];
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebPage', name: p.title, description: p.desc, url, inLanguage: u.ld, dateModified: TODAY,
      about: p.kw.slice(0, 3).map(k => ({ '@type': 'Thing', name: k })),
      isPartOf: { '@type': 'WebSite', name: 'TICKRATE', url: SITE + '/' }, publisher: { '@type': 'Organization', name: 'TICKRATE', url: SITE + '/', logo: SITE + '/logo.png', sameAs: SOCIAL.map(x => x[1]) } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'TICKRATE', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: u.hubNav, item: `${SITE}/${u.hub}` },
      { '@type': 'ListItem', position: 3, name: p.nav, item: url }] }
  ];
  if (faq.length) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: strip(a).replace(/\s+/g, ' ').trim() } })) });
  const faqHtml = faq.length ? `\n  <h2>${u.faq}</h2>\n${faq.map(([q, a]) => `  <details><summary>${esc(q)}</summary><p>${a}</p></details>`).join('\n')}` : '';
  return shell(p, { body: p.body + faqHtml, ld, related: related(p), cur: p.nav });
}

function hubPage(lang) {
  const u = UI[lang], other = lang === 'fr' ? 'en' : 'fr';
  const p = { lang, slug: u.hub, title: u.hubTitle, desc: u.hubDesc, h1: u.hubH1, lead: u.hubLead, alt: { [other]: UI[other].hub } };
  const list = PAGES.filter(q => q.lang === lang);
  const ld = [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: p.title, description: p.desc, url: `${SITE}/${p.slug}`, inLanguage: u.ld,
    mainEntity: { '@type': 'ItemList', itemListElement: list.map((q, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/${q.slug}`, name: q.nav })) } }];
  const body = `  <div class="sx-more">${list.map(q => `<a href="/${q.slug}"><b>${q.h1.replace(/<[^>]+>/g, '')}</b><span>${q.short}</span></a>`).join('')}</div>`;
  return { p, html: shell(p, { body, ld, related: [], cur: u.hubNav }) };
}

// --- contrôles
const errors = [], warns = [];
const seen = {};
for (const p of PAGES) {
  const id = p.slug, text = p.title + ' ' + p.h1 + ' ' + p.lead + ' ' + p.body + ' ' + (p.faq || []).flat().join(' ');
  const k0 = p.kw[0];
  if (!has(p.title, k0)) errors.push(`${id} : « ${k0} » absent du titre`);
  if (!has(p.h1, k0)) errors.push(`${id} : « ${k0} » absent du h1`);
  if (!has(p.desc, k0)) errors.push(`${id} : « ${k0} » absent de la description`);
  if (!has(p.h1 + ' ' + p.lead, k0) && !has(p.body.slice(0, 600), k0)) warns.push(`${id} : « ${k0} » pas au début de la page`);
  for (const k of p.kw.slice(1)) if (!has(text, k)) errors.push(`${id} : variante « ${k} » absente de la page`);
  if (p.title.length > 65) warns.push(`${id} : titre long (${p.title.length} car., coupé au-delà d'environ 60)`);
  if (p.desc.length < 110 || p.desc.length > 165) warns.push(`${id} : description de ${p.desc.length} car. (viser 120 à 160)`);
  const words = strip(text).split(/\s+/).filter(Boolean).length;
  if (words < 350) warns.push(`${id} : ${words} mots seulement`);
  // pages du site qu'il ne faut pas écraser (tickrate.html = copie de l'accueil, servie sur /tickrate)
  if (['index', 'tickrate', 'mentions-legales', 'confidentialite', '404'].includes(p.slug)) errors.push(`${id} : adresse réservée, elle écraserait une page du site`);
  const key = p.lang + ':' + norm(k0);
  if (seen[key]) errors.push(`${id} et ${seen[key]} visent la même recherche « ${k0} »`); else seen[key] = id;
  for (const [l, s] of Object.entries(p.alt || {})) {
    const q = PAGES.find(x => x.slug === s);
    if (!q) errors.push(`${id} : page traduite ${s} introuvable`);
    else if ((q.alt || {})[p.lang] !== p.slug) errors.push(`${id} <-> ${s} : liens de langue pas réciproques`);
  }
  for (const m of p.body.matchAll(/href="\/([^"#]*)"/g)) {
    const t = m[1];
    if (t && !PAGES.some(x => x.slug === t) && !Object.values(UI).some(u => u.hub === t) && !fs.existsSync(path.join(OUT, t + '.html')))
      errors.push(`${id} : lien interne cassé /${t}`);
  }
  p.words = words;
}

// --- écriture
const written = [];
for (const p of PAGES) {
  const f = path.join(OUT, p.slug + '.html');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, contentPage(p));
  written.push(p);
}
const hubs = Object.keys(UI).map(hubPage);
for (const { p, html } of hubs) { fs.writeFileSync(path.join(OUT, p.slug + '.html'), html); written.push(p); }

// --- pied de page commun recopié dans les pages du site (entre <!--FOOTER--> et <!--/FOOTER-->)
for (const [file, lang, i18n] of [['index.html', 'fr', true], ['mentions-legales.html', 'fr', true], ['confidentialite.html', 'fr', true], ['404.html', 'fr', false]]) {
  const f = path.join(OUT, file), src = fs.readFileSync(f, 'utf8');
  const a = src.indexOf('<!--FOOTER-->'), b = src.indexOf('<!--/FOOTER-->');
  if (a < 0 || b < a) { errors.push(`${file} : marqueurs <!--FOOTER--> absents`); continue; }
  const out = src.slice(0, a + 13) + '\n' + footer(lang, { i18n }) + '\n' + src.slice(b);
  if (out !== src) fs.writeFileSync(f, out);
  if (file === 'index.html') fs.writeFileSync(path.join(OUT, 'tickrate.html'), out);   // tickrate.html = copie de l'accueil
}

// --- sitemap
const alt = p => Object.entries(p.alt || {}).length
  ? [`    <xhtml:link rel="alternate" hreflang="${p.lang}" href="${SITE}/${p.slug}"/>`,
     ...Object.entries(p.alt).map(([l, s]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE}/${s}"/>`)].join('\n') + '\n' : '';
const entry = (loc, prio, freq, extra = '') => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n${extra}  </url>`;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entry(SITE + '/', '1.0', 'daily', `    <image:image>
      <image:loc>${SITE}/og.jpg</image:loc>
      <image:title>TICKRATE · Matchmaking CS:GO 128 tick</image:title>
      <image:caption>Serveurs CS GO compétitifs 128 tick en 5v5, Wingman et 1v1 Aim Arena</image:caption>
    </image:image>
    <image:image>
      <image:loc>${SITE}/logo.png</image:loc>
      <image:title>Logo TICKRATE CS:GO</image:title>
    </image:image>
`)}
${written.map(p => entry(`${SITE}/${p.slug}`, p.main ? '0.9' : (p.slug.endsWith('guides') ? '0.7' : '0.8'), 'monthly', alt(p))).join('\n')}
${['mentions-legales', 'confidentialite'].map(s => entry(`${SITE}/${s}`, '0.3', 'yearly')).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap);

// --- rapport
console.log('\nPage                      mots  recherche principale');
for (const p of PAGES) console.log(`${p.slug.padEnd(25)} ${String(p.words).padStart(4)}  ${p.kw[0]}`);
console.log(`\n${written.length} pages écrites, sitemap : ${written.length + 3} adresses`);
for (const w of warns) console.log('  attention : ' + w);
if (errors.length) { for (const e of errors) console.log('  ERREUR : ' + e); process.exit(1); }
console.log('  contrôles des mots-clés : OK');
