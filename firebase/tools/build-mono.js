// =====================================================================
//  Génère public/theme-mono.css : l'interface en noir et blanc (essai « sobre »)
//      node tools/build-mono.js        (à relancer après une modification de styles.css ou mobile.css)
//  Chaque règle qui utilise une couleur est recopiée avec cette couleur passée en gris de même luminosité.
//  Restent en couleur : le vert et le rouge (victoire / défaite, erreurs), les skins et leurs raretés,
//  les rangs et niveaux, les cartes de profil et les fonds animés (sélecteurs de EXCLU).
//  Pour revenir aux couleurs : retirer la ligne theme-mono.css de index.html (et tickrate.html).
// =====================================================================
const fs = require('fs'), path = require('path');
const PUB = path.join(__dirname, '..', 'public');
const EXCLU = /rar|rarity|tier|covert|classif|restrict|milspec|consumer|industrial|contraband|knife|glove|skin|wear|float|stattrak|rank|rk-img|lvl|level|skill|elo-|faceit|pbg|pcard-|card-|av-frame|cs-reel|cs-rt|case|drop|sticker|agent|heat|radar|lvup|rankup|pos\b|neg\b|win|loss|lose|green|red|danger|err|ok\b|success|live|online|dot\b|ping|discord|google|steam|twitch|youtube|kick/i;

// ---------- couleurs ----------
function hexToRgb(h) {
  h = h.slice(1);
  if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16), a = h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}
function hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}
// garde le vert et le rouge francs (sens : gagné / perdu / erreur), le reste devient gris
function mono(r, g, b, a) {
  const [h, s] = hsl(r, g, b);
  if (s > 0.35 && (h < 12 || h > 340 || (h > 95 && h < 165))) return null;
  // luminance perçue, un peu remontée pour les teintes vives (l'accent orange devient presque blanc)
  let y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (s > 0.5 && y > 110) y = Math.min(245, y * 1.18);
  y = Math.round(y);
  return a < 1 ? `rgba(${y},${y},${y},${+a.toFixed(3)})` : `#${y.toString(16).padStart(2, '0').repeat(3)}`;
}
// propriétés qui portent une couleur (recopiées pour garder l'ordre de la cascade)
const COLOR_PROP = /^(color|background|background-color|background-image|border|border-(top|right|bottom|left)|border(-(top|right|bottom|left))?-color|outline|outline-color|box-shadow|text-shadow|fill|stroke|caret-color|accent-color|text-decoration-color|scrollbar-color)$/;
const COLOR = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/g;
function convert(value) {
  let changed = false;
  const out = value.replace(COLOR, c => {
    let r, g, b, a;
    if (c[0] === '#') [r, g, b, a] = hexToRgb(c);
    else { const p = c.match(/[\d.]+/g).map(Number); [r, g, b] = p; a = p[3] ?? 1; }
    const m = mono(r, g, b, a);
    if (m === null) return c;
    const [, s] = hsl(r, g, b);
    if (s < 0.06) return c;                 // déjà gris
    changed = true; return m;
  });
  return changed ? out : null;
}
// triplets « 255,171,26 » des variables --*-rgb
const convertTriplet = v => { const p = v.split(',').map(x => +x.trim()); if (p.length !== 3 || p.some(isNaN)) return null; const m = mono(...p, 1); if (!m) return null; const y = parseInt(m.slice(1, 3), 16); return `${y},${y},${y}`; };

// ---------- lecture simple du CSS (règles, @media imbriqués) ----------
function walk(css, emit, wrap = []) {
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open < 0) break;
    const head = css.slice(i, open).replace(/\/\*[\s\S]*?\*\//g, '').trim();
    let depth = 1, j = open + 1;
    while (j < css.length && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
    const body = css.slice(open + 1, j - 1);
    if (/^@(media|supports)/.test(head)) walk(body, emit, [...wrap, head]);
    else if (!/^@(keyframes|-webkit-keyframes|font-face|import|charset)/.test(head)) emit(head, body, wrap);
    i = j;
  }
}

const rules = [];
for (const file of ['styles.css', 'mobile.css']) {
  const css = fs.readFileSync(path.join(PUB, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  walk(css, (sel, body, wrap) => {
    // toutes les déclarations de couleur sont recopiées dans l'ordre d'origine (converties ou non) :
    // une règle recopiée ne passe ainsi jamais devant une règle plus récente qui ne contient pas de couleur en dur
    const parts = sel.split(',').map(s => s.trim()).filter(Boolean);
    const groups = [[parts.filter(s => !EXCLU.test(s)), true], [parts.filter(s => EXCLU.test(s)), false]];
    for (const [list, conv] of groups) {
      if (!list.length) continue;
      const decls = [];
      for (const d of body.split(';')) {
        const k = d.indexOf(':'); if (k < 0) continue;
        const prop = d.slice(0, k).trim(), val = d.slice(k + 1).trim();
        if (!prop || !val) continue;
        if (/^--[\w-]*rgb$/.test(prop)) { const t = conv && convertTriplet(val); if (t) decls.push(`${prop}:${t}`); continue; }
        if (!COLOR_PROP.test(prop) && !prop.startsWith('--')) continue;
        const v = conv ? convert(val) : null;
        if (v || !prop.startsWith('--')) decls.push(`${prop}:${v || val}`);
      }
      if (decls.length) rules.push({ wrap, text: `${list.join(',')}{${decls.join(';')}}` });
    }
  });
}

let out = `/* GÉNÉRÉ par tools/build-mono.js : ne pas modifier à la main.\n   Interface en noir et blanc (essai). Pour revenir aux couleurs : retirer la ligne theme-mono.css de index.html. */\n`;
for (const r of rules) out += r.wrap.length ? r.wrap.map(w => w + '{').join('') + r.text + '}'.repeat(r.wrap.length) + '\n' : r.text + '\n';
// fond de page : sans les halos orange et bleu
out += `html,body{background-image:linear-gradient(180deg,#0c0c0c 0%,#070707 100%)}\n`;
// éléments dont la couleur est écrite dans le JavaScript (attribut style)
// bannière sans image (dégradé de la couleur de la map) et avatars à initiale : couleur choisie passée en gris
out += `.bn[style^="background:linear-gradient"],.p-banner[style^="background:linear-gradient"],#edBanner[style^="background: linear-gradient"],#edBanner[style^="background:linear-gradient"],.avatar[style^="background:"],.p-av[style^="background:"]{filter:grayscale(1)}
`;
out += `.pay-cs-banner{border-color:var(--line2)!important;background:var(--panel)!important}\n`;
// accent : blanc franc (boutons principaux, onglet actif), texte noir dessus
out += `:root{--acc:#f5f5f5;--acc-h:#ffffff;--acc-d:#bdbdbd;--acc-rgb:245,245,245;--on-acc:#0a0a0a}\n`;
fs.writeFileSync(path.join(PUB, 'theme-mono.css'), out);
console.log(`theme-mono.css : ${rules.length} règles, ${(out.length / 1024).toFixed(1)} Ko`);
