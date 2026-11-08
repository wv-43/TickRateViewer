// TICKRATE — répondeur de ping (à lancer sur chaque machine qui héberge un serveur CS:GO)
// Le site mesure l'aller-retour HTTP vers GET /ping : il faut que ce programme tourne
// sur la MÊME machine (ou le même datacenter) que le serveur de jeu.
//
//   node ping.js                          -> http://0.0.0.0:27080/ping
//   PORT=443 TLS_CERT=cert.pem TLS_KEY=key.pem node ping.js   -> https (obligatoire en production :
//   le site est en https, un navigateur bloque les requêtes http depuis une page https)
//
// Puis dans Firebase : pingTargets/<EU|NA|AS>/<id du serveur> = { url: "https://eu1.mondomaine.fr/ping", city: "Frankfurt" }
// Aucune dépendance : Node 18+ suffit.
const fs = require('fs');
const http = require('http');
const https = require('https');

const PORT = +process.env.PORT || 27080;
const CERT = process.env.TLS_CERT, KEY = process.env.TLS_KEY;

function handle(req, res) {
  const path = req.url.split('?')[0];
  // réponse vide et non mise en cache : seul le temps d'aller-retour compte
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Timing-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Methods': 'GET' }); return res.end(); }
  if (req.method === 'GET' && path === '/ping') { res.writeHead(204); return res.end(); }
  res.writeHead(404); res.end();
}

const server = CERT && KEY
  ? https.createServer({ cert: fs.readFileSync(CERT), key: fs.readFileSync(KEY) }, handle)
  : http.createServer(handle);
server.keepAliveTimeout = 65e3;   // garde la connexion ouverte entre deux mesures (sinon on mesure aussi la connexion)
server.listen(PORT, () => console.log(`[tickrate-ping] ${CERT && KEY ? 'https' : 'http'} sur le port ${PORT} -> GET /ping`));
