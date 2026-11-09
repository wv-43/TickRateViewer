set -euo pipefail

SRC="$(cd "$(dirname "$0")/.." && pwd)"
APPID=740                              
HOME_DIR=/home/csgo
GAME_DIR=$HOME_DIR/csgo-ds
API_URL_DEFAULT="https://europe-west1-tickratecsgo.cloudfunctions.net/gameApi"
DEMO_DAYS=7

say()  { printf '\n\033[1;33m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mERREUR : %s\033[0m\n' "$*"; exit 1; }

[ "$(id -u)" = 0 ] || fail "lance ce script en root (sudo bash $0)"
[ -f "$SRC/addons/sourcemod/plugins/tickrate_match.smx" ] || fail "plugins introuvables : copie tout le dossier server-cs sur le VPS"

say "Réglages"
read -rp "Nombre de serveurs de match [2] : " NB; NB=${NB:-2}
[[ "$NB" =~ ^[1-9]$ ]] || fail "nombre de serveurs invalide"
read -rp "URL de gameApi [$API_URL_DEFAULT] : " API_URL; API_URL=${API_URL:-$API_URL_DEFAULT}
read -rsp "SERVER_KEY (la même que dans Firebase, rien ne s'affiche) : " SERVER_KEY; echo
[ -n "$SERVER_KEY" ] || fail "SERVER_KEY vide"
declare -a GSLT
for i in $(seq 1 "$NB"); do
  read -rp "Jeton Steam (GSLT, App ID 4465480) du serveur s$i : " GSLT[$i]
  [ -n "${GSLT[$i]}" ] || fail "il faut un jeton par serveur : https://steamcommunity.com/dev/managegameservers"
done
read -rp "Ton SteamID64 pour être admin SourceMod (vide = aucun) : " ADMIN64

say "Paquets système"
dpkg --add-architecture i386
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y lib32gcc-s1 lib32stdc++6 libc6-i386 lib32z1 curl unzip tar ca-certificates ufw cron fail2ban
id csgo >/dev/null 2>&1 || useradd -m -s /bin/bash csgo

say "SteamCMD"
sudo -u csgo bash -c "mkdir -p $HOME_DIR/steamcmd && cd $HOME_DIR/steamcmd && [ -f steamcmd.sh ] || curl -sqL https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -"

say "Serveur dédié CS:GO (≈ 32 Go, ça peut prendre 10 à 30 minutes)"
for try in 1 2 3; do   
  sudo -u csgo $HOME_DIR/steamcmd/steamcmd.sh +force_install_dir $GAME_DIR +login anonymous +app_update $APPID validate +quit && [ -x $GAME_DIR/srcds_run ] && break
  echo "nouvel essai ($try/3)…"; sleep 5
done
[ -x $GAME_DIR/srcds_run ] || fail "le serveur CS:GO ne s'est pas installé (appid $APPID). Vérifie que Valve le distribue encore, puis relance le script."

[ -f $GAME_DIR/bin/libgcc_s.so.1 ] && mv -f $GAME_DIR/bin/libgcc_s.so.1 $GAME_DIR/bin/libgcc_s.so.1.old
install -m 755 "$SRC/install/appid-fix.sh" $HOME_DIR/appid-fix.sh  
bash $HOME_DIR/appid-fix.sh $GAME_DIR
sudo -u csgo mkdir -p $HOME_DIR/.steam/sdk32
sudo -u csgo ln -sf $HOME_DIR/steamcmd/linux32/steamclient.so $HOME_DIR/.steam/sdk32/steamclient.so

say "Metamod:Source, SourceMod, REST in Pawn"
TMP=$(mktemp -d)
MM=$(curl -fs https://mms.alliedmods.net/mmsdrop/1.11/mmsource-latest-linux)
SM=$(curl -fs https://sm.alliedmods.net/smdrop/1.11/sourcemod-latest-linux)
curl -fsSL -o $TMP/mm.tar.gz "https://mms.alliedmods.net/mmsdrop/1.11/$MM"
curl -fsSL -o $TMP/sm.tar.gz "https://sm.alliedmods.net/smdrop/1.11/$SM"
curl -fsSL -o $TMP/rip.zip "https://github.com/ErikMinekus/sm-ripext/releases/download/1.3.2/sm-ripext-1.3.2-linux.zip"
CS=$GAME_DIR/csgo
if [ -d $CS/addons/sourcemod/configs ]; then
  tar xzf $TMP/sm.tar.gz -C $CS --exclude='addons/sourcemod/configs/*' --exclude='cfg/sourcemod/*'
else
  tar xzf $TMP/sm.tar.gz -C $CS
fi
tar xzf $TMP/mm.tar.gz -C $CS
unzip -qo $TMP/rip.zip -d $CS
rm -rf "$TMP"

say "Plugins TICKRATE"
P=$CS/addons/sourcemod/plugins
for f in tickrate_match tickrate_rules tickrate_skins tickrate_loadout tickrate_vigie tickrate_voice nolobbyreservation; do cp "$SRC/addons/sourcemod/plugins/$f.smx" $P/; done
mkdir -p $CS/addons/sourcemod/gamedata && cp "$SRC/addons/sourcemod/gamedata/nolobbyreservation.games.txt" $CS/addons/sourcemod/gamedata/
rm -f $P/tickrate_check.smx      
mkdir -p $CS/addons/sourcemod/translations && cp "$SRC/addons/sourcemod/translations/tickrate.phrases.txt" $CS/addons/sourcemod/translations/
mkdir -p $CS/addons/sourcemod/plugins/disabled
[ -f $CS/addons/sourcemod/plugins/adminhelp.smx ] && mv -f $CS/addons/sourcemod/plugins/adminhelp.smx $CS/addons/sourcemod/plugins/disabled/

EXT=$CS/addons/sourcemod/extensions
if [ ! -f $EXT/PTaH.ext.2.csgo.so ]; then
  PT=$(mktemp -d)
  if curl -fsSL -o $PT/ptah.zip https://github.com/komashchenko/PTaH/releases/download/v1.1.4/linux.zip && unzip -qo $PT/ptah.zip -d $PT; then
    cp $PT/addons/sourcemod/extensions/PTaH.ext.2.csgo.so $EXT/
    cp $PT/addons/sourcemod/gamedata/PTaH.games.txt $CS/addons/sourcemod/gamedata/
  else echo "PTaH non téléchargé : pas d'autocollants (le reste fonctionne)"; fi
  rm -rf $PT
fi
[ -f $EXT/PTaH.ext.2.csgo.so ] && touch $EXT/PTaH.autoload

mkdir -p $CS/cfg/tickrate $CS/cfg/sourcemod
cp "$SRC"/cfg/tickrate/*.cfg $CS/cfg/tickrate/

C=$CS/cfg/sourcemod
cat > $C/tickrate_match.cfg <<EOF
tr_match_url "$API_URL"
tr_match_key "$SERVER_KEY"
tr_match_voice "rounds"
tr_match_admins "1"
EOF
cat > $C/tickrate_loadout.cfg <<EOF
tr_loadout_url "$API_URL"
tr_loadout_key "$SERVER_KEY"
EOF
cat > $C/tickrate_skins.cfg <<EOF
tr_skins_url "$API_URL"
tr_skins_key "$SERVER_KEY"
EOF
sed -i -E 's/^([[:space:]]*"FollowCSGOServerGuidelines"[[:space:]]+)"[^"]*"/\1"no"/I' $CS/addons/sourcemod/configs/core.cfg
cat > $C/tickrate_vigie.cfg <<EOF
tr_vigie_url "$API_URL"
tr_vigie_key "$SERVER_KEY"
tr_vigie_demo "1"
EOF
cat > $C/tickrate_voice.cfg <<EOF
tr_voice_mode "rounds"
EOF

cat > $CS/cfg/server.cfg <<'EOF'
hostname "TICKRATE | Matchmaking"  
sv_lan 0
sv_cheats 0
sv_hibernate_when_empty 0     
sv_forcepreload 0           
bot_chatter off             
sv_allow_votes 0
sv_pure 1
sv_maxrate 0
sv_minrate 196608
sv_mincmdrate 128
sv_minupdaterate 128
sv_maxcmdrate 128
sv_maxupdaterate 128
sv_logflush 0               
tv_enable 1
tv_autorecord 0
tv_delay 0                    
tv_snapshotrate 16           
tv_deltacache 2
tv_maxrate 20000
tv_maxclients 4
tv_name "TICKRATE TV"
tv_title "TICKRATE"
tv_transmitall 1
log on
EOF

if [ -n "$ADMIN64" ]; then
  [[ "$ADMIN64" =~ ^7656119[0-9]{10}$ ]] || fail 
  A=$((ADMIN64 - 76561197960265728))
  STEAM2="STEAM_1:$((A % 2)):$((A / 2))"
  ADM=$CS/addons/sourcemod/configs/admins_simple.ini
  grep -q "$STEAM2" $ADM 2>/dev/null || echo "\"$STEAM2\" \"99:z\"   // admin TICKRATE" >> $ADM
fi

say "Services s1…s$NB"
mkdir -p $HOME_DIR/instances
for i in $(seq 1 "$NB"); do
  PORT=$((27014 + i)); TV=$((27019 + i)); CL=$((27004 + i))
  echo "tr_server_id \"s$i\"" > $C/tickrate_match_$PORT.cfg
  cat > $HOME_DIR/instances/s$i.env <<EOF
PORT=$PORT
TVPORT=$TV
CLIENTPORT=$CL
GSLT=${GSLT[$i]}
MAXPLAYERS=12
EOF
done
chmod 600 $HOME_DIR/instances/*.env $C/tickrate_*.cfg
chown -R csgo:csgo $HOME_DIR

cat > /etc/systemd/system/csgo@.service <<EOF
[Unit]
Description=TICKRATE CS:GO %i (128 tick)
After=network-online.target
Wants=network-online.target

[Service]
User=csgo
WorkingDirectory=$GAME_DIR
EnvironmentFile=$HOME_DIR/instances/%i.env
Environment="MALLOC_ARENA_MAX=2"
MemoryHigh=1650M
ExecStartPre=/bin/bash $HOME_DIR/appid-fix.sh $GAME_DIR
ExecStart=/bin/bash $GAME_DIR/srcds_run -game csgo -console -norestart -nominidumps -nobreakpad -port \${PORT} +tv_port \${TVPORT} +clientport \${CLIENTPORT} -tickrate 128 -maxplayers_override \${MAXPLAYERS} +game_type 0 +game_mode 1 +map de_mirage +sv_setsteamaccount \${GSLT}
StandardInput=null
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

say "Optimisation RAM (zram lz4 + swap 2 Go)"
if DEBIAN_FRONTEND=noninteractive apt-get install -y zram-tools >/dev/null 2>&1; then
  printf 'ALGO=lz4\nPERCENT=50\nPRIORITY=100\n' > /etc/default/zramswap
  systemctl enable --now zramswap >/dev/null 2>&1 && systemctl restart zramswap >/dev/null 2>&1 || true
fi
if ! swapon --show | grep -q '/swapfile'; then
  if fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile; then
    grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw,pri=10 0 0' >> /etc/fstab
  else rm -f /swapfile; fi
fi
printf 'vm.swappiness=10\nvm.vfs_cache_pressure=50\n' > /etc/sysctl.d/99-tickrate.conf
sysctl --system >/dev/null 2>&1 || true

say "Pare-feu"
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 22/tcp >/dev/null
LAST=$((27014 + NB)); LASTTV=$((27019 + NB))
ufw allow 27015:$LAST/udp >/dev/null
ufw allow 27015:$LAST/tcp >/dev/null
ufw allow 27020:$LASTTV/udp >/dev/null
ufw --force enable >/dev/null

cat > /etc/cron.daily/tickrate-clean <<EOF
#!/bin/sh
# demos GOTV de plus de $DEMO_DAYS jours, logs de plus de 14 jours
find $CS -maxdepth 1 -name 'tickrate_*.dem' -mtime +$DEMO_DAYS -delete
find $CS/logs $CS/addons/sourcemod/logs -name '*.log' -mtime +14 -delete 2>/dev/null
exit 0
EOF
chmod 755 /etc/cron.daily/tickrate-clean

systemctl daemon-reload
for i in $(seq 1 "$NB"); do systemctl enable csgo@s$i >/dev/null 2>&1; systemctl restart csgo@s$i; done

IP=$(curl -fs https://api.ipify.org || hostname -I | awk '{print $1}')
say "Terminé"
echo "Serveurs lancés. Vérifie qu'ils tournent :   systemctl status csgo@s1"
echo "Journal en direct :                          journalctl -u csgo@s1 -f"
echo
echo "Dernière étape, dans Firebase (Realtime Database > servers), ajoute :"
for i in $(seq 1 "$NB"); do
  echo "  s$i : { \"ip\": \"$IP\", \"port\": $((27014 + i)), \"gotvPort\": $((27019 + i)), \"region\": \"EU\", \"mode\": \"ranked\", \"status\": \"free\" }"
done
echo
echo "Attends d'avoir vu « [TICKRATE] » sans erreur dans le journal avant de le faire."
