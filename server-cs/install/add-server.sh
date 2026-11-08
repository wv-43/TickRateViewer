
set -euo pipefail
MODE="${1:-}"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
HOME_DIR=/home/csgo
CS=$HOME_DIR/csgo-ds/csgo
C=$CS/cfg/sourcemod
U=/etc/systemd/system/csgo@.service
say()  { printf '\n\033[1;33m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mERREUR : %s\033[0m\n' "$*"; exit 1; }

case "$MODE" in
  duel)    SLOTS=4; NAME="1v1 Aim Arena" ;;   
  wingman) SLOTS=6; NAME="Wingman 2v2" ;;      
  *) fail "précise le mode : add-server.sh duel   ou   add-server.sh wingman" ;;
esac
[ "$(id -u)" = 0 ] || fail "lance ce script en root"
[ -f "$U" ] && [ -d "$HOME_DIR/instances" ] || fail "serveurs introuvables : lance d'abord install.sh"
[ "$MODE" != duel ] || [ -f "$CS/cfg/tickrate/duel.cfg" ] || fail "règles du 1v1 absentes : lance d'abord update.sh"

i=1; while [ -f "$HOME_DIR/instances/s$i.env" ]; do i=$((i + 1)); done
[ "$i" -le 5 ] || fail "5 serveurs maximum sur cette machine (les ports se chevaucheraient)"
PORT=$((27014 + i)); TV=$((27019 + i)); CL=$((27004 + i))

FREE=$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo)
if [ "$FREE" -lt 700 ]; then
  echo "Attention : seulement ${FREE} Mo de mémoire libre. Un serveur de plus risque de faire ramer les autres."
  read -rp "Continuer quand même ? (o/N) " OK; [ "$OK" = o ] || [ "$OK" = O ] || exit 1
fi

say "Serveur $NAME s$i (port $PORT, GOTV $TV, $SLOTS places)"
read -rp "Jeton Steam (GSLT, App ID 4465480) du serveur s$i : " G
[ -n "$G" ] || fail "il faut un jeton par serveur"

for f in "$HOME_DIR"/instances/s*.env; do grep -q '^MAXPLAYERS=' "$f" || echo 'MAXPLAYERS=12' >> "$f"; done
if grep -q -- '-maxplayers_override 12' "$U"; then
  sed -i 's/-maxplayers_override 12/-maxplayers_override ${MAXPLAYERS}/' "$U"
fi

cat > "$HOME_DIR/instances/s$i.env" <<EOF
PORT=$PORT
TVPORT=$TV
CLIENTPORT=$CL
GSLT=$G
MAXPLAYERS=$SLOTS
EOF
echo "tr_server_id \"s$i\"" > "$C/tickrate_match_$PORT.cfg"
chmod 600 "$HOME_DIR/instances/s$i.env" "$C/tickrate_match_$PORT.cfg"
chown csgo:csgo "$HOME_DIR/instances/s$i.env" "$C/tickrate_match_$PORT.cfg"

if compgen -G "$SRC/maps/*.bsp" >/dev/null; then
  cp "$SRC"/maps/*.bsp "$CS/maps/" && chown csgo:csgo "$CS"/maps/*.bsp
  echo "Maps copiées : $(cd "$SRC/maps" && ls *.bsp | tr '\n' ' ')"
elif [ "$MODE" = duel ]; then
  echo "Aucune map aim dans server-cs/maps : les 1v1 prévus sur une map absente se joueront sur de_shortdust ou de_lake."
fi

ufw allow "$PORT/udp" >/dev/null; ufw allow "$PORT/tcp" >/dev/null; ufw allow "$TV/udp" >/dev/null

systemctl daemon-reload
systemctl enable --now "csgo@s$i" >/dev/null 2>&1
echo "Serveur s$i démarré. Vérifie :  systemctl status csgo@s$i"

IP=$(curl -fs https://api.ipify.org || hostname -I | awk '{print $1}')
say "Dernière étape, dans Firebase (Realtime Database > servers)"
echo "1) ajoute le nouveau serveur :"
echo "   s$i : { \"ip\": \"$IP\", \"port\": $PORT, \"gotvPort\": $TV, \"region\": \"EU\", \"mode\": \"$MODE\", \"status\": \"free\" }"
echo "2) sur chaque serveur 5v5 (s1, s2…), vérifie le champ :  \"mode\": \"ranked\""
echo
echo "Attends d'avoir vu « [TICKRATE] » sans erreur dans le journal avant de le faire :  journalctl -u csgo@s$i -f"
