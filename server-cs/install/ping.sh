
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "lance ce script en root"; exit 1; }
IP=$(curl -fs https://api.ipify.org)
HOST="${IP//./-}.sslip.io"

apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y caddy
cat > /etc/caddy/Caddyfile <<CFG
$HOST {
	header {
		Access-Control-Allow-Origin "*"
		Timing-Allow-Origin "*"
		Cache-Control "no-store"
	}
	respond /ping 204
	respond 404
}
CFG
ufw allow 80/tcp >/dev/null      # Let's Encrypt
ufw allow 443/tcp >/dev/null
systemctl enable caddy >/dev/null 2>&1
systemctl restart caddy
sleep 8
CODE=$(curl -s -o /dev/null -w '%{http_code}' "https://$HOST/ping" || true)
echo
if [ "$CODE" = 204 ]; then echo "Répondeur OK : https://$HOST/ping"; else echo "Pas encore de réponse (code $CODE). Le certificat peut prendre une minute : relance  curl -I https://$HOST/ping"; fi
echo
echo "Dans Firebase (Realtime Database), ajoute à la racine le nœud pingTargets :"
echo "  { \"EU\": { \"s1\": { \"url\": \"https://$HOST/ping\", \"city\": \"Frankfurt\" } } }"
