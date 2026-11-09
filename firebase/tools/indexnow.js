const fs = require('fs'), path = require('path'), crypto = require('crypto');
const PUB = path.join(__dirname, '..', 'public');
const STATE = path.join(__dirname, 'seo', 'indexnow-state.json');
const HOST = 'tickrate.eu', SITE = 'https://' + HOST;
const KEY = 'ab1ee612d50e1081da80727da1d267ce';
const ALL = process.argv.includes('--all'), DRY = process.argv.includes('--dry');

function fileFor(url) {
  const p = url.replace(SITE, '').replace(/^\//, '');
  return path.join(PUB, p === '' ? 'index.html' : p + '.html');
}

(async () => {
  if (!fs.existsSync(path.join(PUB, KEY + '.txt'))) { console.log('IndexNow : fichier clé absent, rien envoyé'); return; }
  const urls = [...fs.readFileSync(path.join(PUB, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  let state = {};
  try { state = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch (e) {}
  const hashes = {}, changed = [];
  for (const u of urls) {
    const f = fileFor(u);
    if (!fs.existsSync(f)) continue;
    hashes[u] = crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex');
    if (ALL || state[u] !== hashes[u]) changed.push(u);
  }
  if (!changed.length) { console.log('IndexNow : aucune page modifiée'); return; }
  console.log(`IndexNow : ${changed.length} page(s) à signaler\n  ` + changed.join('\n  '));
  if (DRY) return;
  try {
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: changed })
    });
    console.log(`IndexNow : réponse ${r.status}`);
    if (r.status === 200 || r.status === 202) {
      fs.writeFileSync(STATE, JSON.stringify({ ...state, ...Object.fromEntries(changed.map(u => [u, hashes[u]])) }, null, 1));
    } else console.log('IndexNow : envoi non accepté, il sera retenté au prochain déploiement');
  } catch (e) { console.log('IndexNow : envoi impossible (' + e.message + '), il sera retenté au prochain déploiement'); }
})();
