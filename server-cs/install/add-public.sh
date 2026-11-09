#!/bin/bash
set -euo pipefail
HOME_DIR=/home/csgo
GAME=$HOME_DIR/csgo-ds
PUB=$HOME_DIR/csgo-public
ENVF=$HOME_DIR/instances/public.env
UNIT=/etc/systemd/system/csgo-public.service
PORT=27030; CLIENTPORT=27031; SLOTS=16
say()  { printf '\n\033[1;33m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mERREUR : %s\033[0m\n' "$*"; exit 1; }
[ "$(id -u)" = 0 ] || fail "lance ce script en root"
[ -x "$GAME/srcds_run" ] || fail "serveur introuvable : lance d'abord install.sh"

FREE=$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo)
if [ "$FREE" -lt 1200 ] && ! systemctl is-active --quiet csgo-public; then
  echo "Attention : seulement ${FREE} Mo de mémoire libre. Le serveur public risque de faire ramer les serveurs de match."
  read -rp "Continuer quand même ? (o/N) " OK; [ "$OK" = o ] || [ "$OK" = O ] || exit 1
fi

G=""
[ -f "$ENVF" ] && G=$(grep '^GSLT=' "$ENVF" | cut -d= -f2-)
if [ -z "$G" ]; then
  read -rp "Jeton Steam (GSLT, App ID 4465480) pour le serveur public : " G
  [ -n "$G" ] || fail "il faut un jeton Steam (un par serveur)"
fi

say "Copie du serveur (liens durs, presque pas de place disque)"
systemctl stop csgo-public 2>/dev/null || true
rm -rf "$PUB"
cp -al "$GAME" "$PUB"
rm -rf "$PUB/csgo/addons" "$PUB/csgo/cfg"
cp -a "$GAME/csgo/addons" "$PUB/csgo/addons"
cp -a "$GAME/csgo/cfg" "$PUB/csgo/cfg"
rm -f "$PUB"/csgo/addons/sourcemod/plugins/tickrate_*.smx "$PUB"/csgo/addons/sourcemod/plugins/nolobbyreservation.smx
rm -f "$PUB"/csgo/cfg/sourcemod/tickrate_*.cfg
rm -rf "$PUB/csgo/cfg/tickrate"

say "Configuration deathmatch 128 tick"
cat > "$PUB/csgo/cfg/server.cfg" <<'EOF'
// TICKRATE - serveur public deathmatch (créé par add-public.sh)
hostname "TICKRATE.EU | DM 128 tick | tickrate.eu"
sv_tags "128tick,deathmatch,dm,tickrate,fr,eu,legacy"
sv_region 3
sv_lan 0
sv_password ""
sv_cheats 0
sv_pure 1
sv_minrate 196608
sv_maxrate 786432
sv_mincmdrate 128
sv_minupdaterate 128
sv_maxcmdrate 128
sv_maxupdaterate 128
tv_enable 0
bot_quota 0
mp_autokick 0
mp_teamname_1 "tickrate.eu"
mp_teamname_2 "128 tick"
// deathmatch
mp_timelimit 10
mp_maxrounds 0
mp_randomspawn 1
mp_respawn_immunitytime 1
mp_dm_bonus_length_max 0
mp_dm_bonus_length_min 0
mp_match_end_restart 0
sv_allow_votes 0
sv_alltalk 1
sv_deadtalk 1
EOF
cat > "$PUB/csgo/mapcycle_tickrate_dm.txt" <<'EOF'
de_dust2
de_mirage
de_inferno
de_nuke
de_overpass
de_ancient
de_vertigo
de_train
EOF
chown -R csgo:csgo "$PUB"

say "Service csgo-public (port $PORT, $SLOTS places)"
mkdir -p "$HOME_DIR/instances"
cat > "$ENVF" <<EOF
GSLT=$G
EOF
chmod 600 "$ENVF"; chown csgo:csgo "$ENVF"
cat > "$UNIT" <<EOF
[Unit]
Description=TICKRATE CS:GO serveur public deathmatch (128 tick)
After=network-online.target
Wants=network-online.target

[Service]
User=csgo
WorkingDirectory=$PUB
EnvironmentFile=$ENVF
Environment="MALLOC_ARENA_MAX=2"
MemoryHigh=1400M
Nice=5
ExecStartPre=/bin/bash $HOME_DIR/appid-fix.sh $PUB
ExecStart=/bin/bash $PUB/srcds_run -game csgo -console -norestart -nominidumps -nobreakpad -port $PORT +clientport $CLIENTPORT -tickrate 128 -maxplayers_override $SLOTS +game_type 1 +game_mode 2 +mapgroup mg_active +mapcyclefile mapcycle_tickrate_dm.txt +map de_dust2 +sv_setsteamaccount \${GSLT}
StandardInput=null
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
ufw allow "$PORT/udp" >/dev/null; ufw allow "$PORT/tcp" >/dev/null
systemctl daemon-reload
systemctl enable --now csgo-public >/dev/null 2>&1

IP=$(curl -fs https://api.ipify.org || hostname -I | awk '{print $1}')
say "Serveur public démarré"
echo "  Adresse :  $IP:$PORT"
echo "  Vérifier :  systemctl status csgo-public    (journal : journalctl -u csgo-public -f)"
echo "  Dans CS:GO :  console -> connect $IP:$PORT"
echo
echo "Ensuite, ajoute-le aux listes publiques (une fois) :"
echo "  - https://www.gametracker.com  (Add a server, jeu « Counter-Strike: Global Offensive »)"
echo "  - https://www.gs4u.net  (Add server)"
echo "Ces pages affichent le nom du serveur, donc « tickrate.eu »."
echo
echo "Pour l'arrêter :  systemctl disable --now csgo-public"
