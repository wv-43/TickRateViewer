
GAME=${1:-/home/csgo/csgo-ds}
APP=4465480
printf '%s' "$APP" > "$GAME/steam_appid.txt"
INF="$GAME/csgo/steam.inf"
if [ -f "$INF" ]; then
  if head -1 "$INF" | grep -q $'\r'; then
    sed -i -E "s/^appID=[^[:cntrl:]]*\r?$/appID=$APP\r/" "$INF"
  else
    sed -i "s/^appID=.*/appID=$APP/" "$INF"
  fi
fi
exit 0
