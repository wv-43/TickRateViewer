
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"
CS=/home/csgo/csgo-ds/csgo
[ "$(id -u)" = 0 ] || { echo "lance ce script en root"; exit 1; }
[ -d $CS/addons/sourcemod/plugins ] || { echo "serveur introuvable : lance d'abord install.sh"; exit 1; }

for f in tickrate_match tickrate_rules tickrate_skins tickrate_loadout tickrate_vigie tickrate_voice nolobbyreservation; do
  cp "$SRC/addons/sourcemod/plugins/$f.smx" $CS/addons/sourcemod/plugins/
done
# plugin de match recompilé ici depuis sa source (le .smx du dossier peut être plus ancien que le .sp) avec le compilateur
# fourni par SourceMod sur le serveur ; en cas d'échec, le .smx copié ci-dessus reste en place
SPC=$CS/addons/sourcemod/scripting/spcomp
if [ -x "$SPC" ]; then
  B=$(mktemp -d)
  if "$SPC" "$SRC/addons/sourcemod/scripting/tickrate_match.sp" -i"$SRC/addons/sourcemod/scripting/include" -i"$CS/addons/sourcemod/scripting/include" -o"$B/tickrate_match.smx" > "$B/log" 2>&1 && [ -s "$B/tickrate_match.smx" ]; then
    cp "$B/tickrate_match.smx" $CS/addons/sourcemod/plugins/tickrate_match.smx
    echo "tickrate_match recompilé depuis la source (tags de clan en jeu)"
  else
    echo "ATTENTION : compilation de tickrate_match impossible, l'ancienne version reste (pas de tag de clan en jeu) :"; tail -n 15 "$B/log"
  fi
  rm -rf "$B"
else
  echo "Compilateur SourceMod introuvable ($SPC) : tickrate_match.smx du dossier utilisé tel quel"
fi
rm -f $CS/addons/sourcemod/plugins/tickrate_check.smx
mkdir -p $CS/addons/sourcemod/translations && cp "$SRC/addons/sourcemod/translations/tickrate.phrases.txt" $CS/addons/sourcemod/translations/
mkdir -p $CS/addons/sourcemod/plugins/disabled
[ -f $CS/addons/sourcemod/plugins/adminhelp.smx ] && mv -f $CS/addons/sourcemod/plugins/adminhelp.smx $CS/addons/sourcemod/plugins/disabled/
mkdir -p $CS/addons/sourcemod/gamedata && cp "$SRC/addons/sourcemod/gamedata/nolobbyreservation.games.txt" $CS/addons/sourcemod/gamedata/

install -m 755 "$SRC/install/appid-fix.sh" /home/csgo/appid-fix.sh
bash /home/csgo/appid-fix.sh /home/csgo/csgo-ds
U=/etc/systemd/system/csgo@.service
if [ -f $U ] && ! grep -q appid-fix $U; then
  sed -i 's|^EnvironmentFile=.*|&
ExecStartPre=/bin/bash /home/csgo/appid-fix.sh /home/csgo/csgo-ds|' $U
  systemctl daemon-reload
fi
cp "$SRC"/cfg/tickrate/*.cfg $CS/cfg/tickrate/
C=$CS/cfg/sourcemod
if [ ! -f $C/tickrate_skins.cfg ] && [ -f $C/tickrate_match.cfg ]; then
  grep -E '^tr_match_(url|key) ' $C/tickrate_match.cfg | sed 's/^tr_match_/tr_skins_/' > $C/tickrate_skins.cfg
  chmod 600 $C/tickrate_skins.cfg; chown csgo:csgo $C/tickrate_skins.cfg
fi
sed -i -E 's/^([[:space:]]*"FollowCSGOServerGuidelines"[[:space:]]+)"[^"]*"/\1"no"/I' $CS/addons/sourcemod/configs/core.cfg

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
chown -R csgo:csgo $CS/addons/sourcemod/extensions
chown -R csgo:csgo $CS/addons/sourcemod/plugins $CS/addons/sourcemod/translations $CS/addons/sourcemod/gamedata $CS/cfg/tickrate $CS/steam.inf

for L in \
  "sv_maxcmdrate 128" \
  "sv_maxupdaterate 128" \
  "sv_logflush 0" \
  "sv_forcepreload 0" \
  "bot_chatter off" \
  "tv_autorecord 0" \
  "tv_snapshotrate 16" \
  "tv_deltacache 2" \
  "tv_maxrate 20000" \
  "tv_maxclients 4"; do
  K="${L%% *}"
  if grep -q "^${K} " $CS/cfg/server.cfg 2>/dev/null; then
    sed -i "s|^${K} .*|${L}|" $CS/cfg/server.cfg
  else
    echo "$L" >> $CS/cfg/server.cfg
  fi
done

if grep -q "^tv_delay " $CS/cfg/server.cfg 2>/dev/null; then
  sed -i "s|^tv_delay .*|tv_delay 0|" $CS/cfg/server.cfg
fi

if [ -f $U ]; then
  grep -q 'MALLOC_ARENA_MAX' $U || sed -i '/^EnvironmentFile=/a Environment="MALLOC_ARENA_MAX=2"\nMemoryHigh=1650M' $U
  grep -q '\-nominidumps' $U || sed -i 's|-norestart |-norestart -nominidumps -nobreakpad |' $U
  sed -i 's|^RestartSec=10|RestartSec=5|' $U
  systemctl daemon-reload
fi


if DEBIAN_FRONTEND=noninteractive apt-get install -y zram-tools >/dev/null 2>&1; then
  printf 'ALGO=lz4\nPERCENT=50\nPRIORITY=100\n' > /etc/default/zramswap
  systemctl enable --now zramswap >/dev/null 2>&1 && systemctl restart zramswap >/dev/null 2>&1 && echo "zram (lz4, 50% RAM) activé." || true
fi
if ! swapon --show | grep -q '/swapfile'; then
  if fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile; then
    grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw,pri=10 0 0' >> /etc/fstab
    echo "Swap de 2 Go activé."
  else rm -f /swapfile; echo "Swap disque impossible sur ce VPS (pas grave, on continue)."; fi
fi
{ printf 'vm.swappiness=10\nvm.vfs_cache_pressure=50\n' > /etc/sysctl.d/99-tickrate.conf && sysctl --system >/dev/null 2>&1; } || true

if ! command -v fail2ban-server >/dev/null; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y fail2ban >/dev/null && echo "fail2ban installé (protection SSH)." || echo "fail2ban non installé."
fi
if command -v fail2ban-server >/dev/null; then
  printf '[sshd]\nenabled = true\nmaxretry = 5\nfindtime = 10m\nbantime = 1h\n' > /etc/fail2ban/jail.d/tickrate.conf
  systemctl enable --now fail2ban >/dev/null 2>&1 && systemctl restart fail2ban
fi
mkdir -p /etc/systemd/journald.conf.d
printf '[Journal]\nSystemMaxUse=300M\n' > /etc/systemd/journald.conf.d/tickrate.conf
systemctl restart systemd-journald
chmod 600 $C/tickrate_*.cfg 2>/dev/null || true
echo "Plugins et configs copiés."

SERVICES=$(systemctl list-units --type=service --all --no-legend 'csgo@*' | awk '{print $1}' | sed 's/^●//')
echo "Serveurs : $SERVICES"
read -rp "Redémarrer les serveurs maintenant ? Un match en cours serait coupé [o/N] : " OK
if [[ "$OK" =~ ^[oOyY]$ ]]; then
  for s in $SERVICES; do systemctl restart "$s"; done
  echo "Redémarrés. Les nouveaux plugins sont actifs dans 30 s environ."
else
  echo "Pas de redémarrage : les nouveaux plugins seront chargés au prochain redémarrage (systemctl restart csgo@s1)."
fi
