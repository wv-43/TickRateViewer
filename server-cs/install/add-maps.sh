#!/bin/bash
# =====================================================
# TICKRATE - installe les maps 5v5 hors CS:GO de base (Cache, Cobblestone, Tuscan)
# Usage (root, sur le VPS) :  bash /root/server-cs/install/add-maps.sh
#
# 1) Pour chaque map : déjà dans le jeu ? sinon copie du .bsp posé dans server-cs/maps/ (et du .nav s'il existe).
# 2) Téléchargement rapide pour les joueurs (FastDL) : Caddy s'il tourne, sinon nginx, sert les maps compressées (.bsp.bz2) sur le port 80,
#    et sv_downloadurl l'indique au jeu. Sans ça, un joueur sans la map la télécharge depuis le serveur de jeu,
#    très lentement, et peut dépasser le délai d'absence du match.
# Les serveurs ne sont pas redémarrés ici : la commande à lancer pour chacun est affichée (pas pendant un match).
# =====================================================
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"
CS=/home/csgo/csgo-ds/csgo
WEB=/var/www/fastdl
MAPS="de_cache de_cbble de_tuscan"
say()  { printf '\n\033[1;33m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mERREUR : %s\033[0m\n' "$*"; exit 1; }
[ "$(id -u)" = 0 ] || fail "lance ce script en root"
[ -d "$CS/maps" ] || fail "serveur introuvable : lance d'abord install.sh"

say "Maps"
MISSING=""
for m in $MAPS; do
  if [ -f "$SRC/maps/$m.bsp" ]; then
    cp "$SRC/maps/$m.bsp" "$CS/maps/"
    [ -f "$SRC/maps/$m.nav" ] && cp "$SRC/maps/$m.nav" "$CS/maps/"
    echo "  $m : copiée depuis server-cs/maps"
  elif [ -f "$CS/maps/$m.bsp" ]; then
    echo "  $m : déjà présente dans le jeu"
  else
    echo "  $m : ABSENTE (mets $m.bsp dans server-cs/maps puis relance ce script)"
    MISSING="$MISSING $m"
  fi
done
chown csgo:csgo "$CS"/maps/*.bsp "$CS"/maps/*.nav 2>/dev/null || true

say "Téléchargement rapide (FastDL)"
command -v bzip2 >/dev/null || DEBIAN_FRONTEND=noninteractive apt-get install -y bzip2 >/dev/null
mkdir -p "$WEB/maps"
# toutes les maps qui ne viennent pas du jeu de base : celles de server-cs/maps (1v1 compris) et les 3 ci-dessus
for f in "$SRC"/maps/*.bsp; do
  [ -f "$f" ] || continue
  b=$(basename "$f")
  if [ ! -f "$WEB/maps/$b.bz2" ] || [ "$f" -nt "$WEB/maps/$b.bz2" ]; then
    bzip2 -kc "$f" > "$WEB/maps/$b.bz2" && echo "  $b.bz2 prêt"
  fi
done
chmod -R a+rX "$WEB"
if systemctl is-active --quiet caddy; then
  # Caddy (install/ping.sh) tient déjà le port 80 : nginx ne pourrait pas démarrer, c'est donc Caddy qui sert les maps.
  # Le jeu ne suit pas la redirection HTTPS de Caddy : il faut un vrai service en HTTP simple sur le port 80.
  systemctl disable --now nginx >/dev/null 2>&1 || true
  F=/etc/caddy/Caddyfile
  if ! grep -qF "$WEB" "$F"; then
    cp "$F" "$F.avant-fastdl"
    printf '\n:80 {\n\troot * %s\n\tfile_server\n}\n' "$WEB" >> "$F"
    caddy validate --config "$F" --adapter caddyfile >/dev/null 2>&1 || { cp "$F.avant-fastdl" "$F"; fail "configuration Caddy invalide : fichier d'origine remis en place"; }
  fi
  systemctl reload caddy
  echo "  maps servies par Caddy (port 80)"
else
  command -v nginx >/dev/null || DEBIAN_FRONTEND=noninteractive apt-get install -y nginx >/dev/null
  cat > /etc/nginx/sites-available/fastdl <<EOF
server {
  listen 80 default_server;
  root $WEB;
  autoindex off;
  location / { try_files \$uri =404; }
}
EOF
  ln -sf /etc/nginx/sites-available/fastdl /etc/nginx/sites-enabled/fastdl
  rm -f /etc/nginx/sites-enabled/default
  nginx -t >/dev/null 2>&1 || fail "configuration nginx invalide (nginx -t)"
  systemctl enable --now nginx >/dev/null 2>&1; systemctl reload nginx
  echo "  maps servies par nginx (port 80)"
fi
ufw allow 80/tcp >/dev/null
sleep 1
for f in "$WEB"/maps/*.bz2; do
  [ -f "$f" ] || continue
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1/maps/$(basename "$f")" || true)
  [ "$CODE" = 200 ] || fail "$(basename "$f") non servie en HTTP (code $CODE) : le téléchargement des joueurs resterait bloqué"
done
echo "  vérifié : les maps sont bien servies en HTTP"

IP=$(curl -fs https://api.ipify.org || hostname -I | awk '{print $1}')
for L in "sv_downloadurl \"http://$IP\"" "sv_allowdownload 1" "net_maxfilesize 200"; do
  K="${L%% *}"
  if grep -q "^${K} " "$CS/cfg/server.cfg" 2>/dev/null; then sed -i "s|^${K} .*|${L}|" "$CS/cfg/server.cfg"; else echo "$L" >> "$CS/cfg/server.cfg"; fi
done
chown csgo:csgo "$CS/cfg/server.cfg"
echo "  sv_downloadurl = http://$IP"

say "À faire : redémarrer les serveurs (sv_downloadurl est lu au démarrage)"
for u in $(systemctl list-units --type=service --state=running --no-legend 'csgo@*' | awk '{print $1}'); do
  echo "  $u : redémarre-le quand il n'a pas de match en cours :  systemctl restart $u"
done

if [ -n "$MISSING" ]; then
  printf '\n\033[1;31mMaps manquantes :%s\033[0m\n' "$MISSING"
  echo "Tant qu'elles manquent, un match prévu dessus se joue sur Mirage, Inferno ou Dust II (le plugin remplace la map)."
else
  printf '\n\033[1;32mLes 3 maps sont installées.\033[0m\n'
fi
