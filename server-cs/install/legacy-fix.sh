
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"
GAME=/home/csgo/csgo-ds; CS=$GAME/csgo; INST=/home/csgo/instances; U=/etc/systemd/system/csgo@.service
[ "$(id -u)" = 0 ] || { echo "lance ce script en root"; exit 1; }
[ -f $CS/steam.inf ] || { echo "serveur introuvable : lance d'abord install.sh"; exit 1; }

echo "Jetons Steam : https://steamcommunity.com/dev/managegameservers (App ID 4465480)."
for f in $INST/s*.env; do
  s=$(basename "$f" .env)
  read -rp "Jeton (App ID 4465480) pour $s, Entrée = garder l'actuel : " TOK
  [ -n "$TOK" ] && sed -i "s/^GSLT=.*/GSLT=$TOK/" "$f"
done
chmod 600 $INST/*.env

[ -f $CS/steam.inf.730.bak ] || cp $CS/steam.inf $CS/steam.inf.730.bak
install -m 755 "$SRC/install/appid-fix.sh" /home/csgo/appid-fix.sh
bash /home/csgo/appid-fix.sh $GAME
if ! grep -q appid-fix $U; then
  sed -i 's|^EnvironmentFile=.*|&\nExecStartPre=/bin/bash /home/csgo/appid-fix.sh /home/csgo/csgo-ds|' $U
  systemctl daemon-reload
fi
echo "steam_appid.txt : $(cat $GAME/steam_appid.txt) · steam.inf : $(grep '^appID=' $CS/steam.inf | tr -d '\r')"

cp "$SRC/addons/sourcemod/plugins/nolobbyreservation.smx" $CS/addons/sourcemod/plugins/
mkdir -p $CS/addons/sourcemod/gamedata
cp "$SRC/addons/sourcemod/gamedata/nolobbyreservation.games.txt" $CS/addons/sourcemod/gamedata/
chown -R csgo:csgo $INST $GAME/steam_appid.txt $CS/steam.inf $CS/addons/sourcemod/plugins $CS/addons/sourcemod/gamedata

for f in $INST/s*.env; do systemctl restart "csgo@$(basename "$f" .env)"; done
sleep 20
echo
if grep -q "nolobbyreservation" $CS/addons/sourcemod/logs/errors_$(date +%Y%m%d).log 2>/dev/null && [ "$(grep -c nolobbyreservation $CS/addons/sourcemod/logs/errors_$(date +%Y%m%d).log)" -gt 0 ]; then
  echo "Erreurs NoLobbyReservation du jour (les plus récentes en bas) :"
  grep -i nolobby $CS/addons/sourcemod/logs/errors_$(date +%Y%m%d).log | tail -4
fi
echo "Serveurs redémarrés. Essaie dans CS:GO : connect $(curl -fs https://api.ipify.org):27015"
