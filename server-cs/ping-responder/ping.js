const fs = require('fs');
const http = require('http');
const https = require('https');

const PORT = +process.env.PORT || 27080;
const CERT = process.env.TLS_CERT, KEY = process.env.TLS_KEY;

function handle(req, res) {
  const path = req.url.split('?')[0];
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
server.keepAliveTimeout = 65e3;
server.listen(PORT, () => console.log(`[tickrate-ping] ${CERT && KEY ? 'https' : 'http'} sur le port ${PORT} -> GET /ping`));
