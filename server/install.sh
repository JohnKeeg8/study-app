#!/usr/bin/env bash
# Sets up server-side progress sync. Run as root from the app folder:
#   bash /var/www/study-app/server/install.sh
# Safe to run again (e.g. after a git pull); it only adds what's missing.
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CADDYFILE=/etc/caddy/Caddyfile

if [ "$(id -u)" -ne 0 ]; then echo "Please run as root (or with sudo)."; exit 1; fi

echo "== 1/3 Python"
if ! command -v python3 >/dev/null 2>&1; then
  apt-get update && apt-get install -y python3
fi
python3 --version

echo "== 2/3 Sync service"
sed "s#/var/www/study-app#${APP_DIR}#g" "${APP_DIR}/server/study-app-sync.service" > /etc/systemd/system/study-app-sync.service
systemctl daemon-reload
systemctl enable study-app-sync >/dev/null 2>&1
systemctl restart study-app-sync
sleep 1
if curl -fsS http://127.0.0.1:8787/api/health >/dev/null 2>&1 || python3 - <<'PY'
import urllib.request, sys
try:
    urllib.request.urlopen("http://127.0.0.1:8787/api/health", timeout=3); sys.exit(0)
except Exception:
    sys.exit(1)
PY
then echo "Sync service is running."
else echo "The sync service didn't start. Details:"; systemctl status study-app-sync --no-pager | tail -20; exit 1
fi

echo "== 3/3 Caddy"
if [ ! -f "$CADDYFILE" ]; then echo "No $CADDYFILE found; add 'reverse_proxy /api/* 127.0.0.1:8787' to your web server yourself."; exit 1; fi
cp "$CADDYFILE" "$CADDYFILE.bak-$(date +%Y%m%d-%H%M%S)"
# Send /api/* to the sync service (inserted next to file_server in each site block).
grep -q 'reverse_proxy /api/\* 127.0.0.1:8787' "$CADDYFILE" || \
  sed -i 's|^\([[:space:]]*\)file_server$|\1reverse_proxy /api/* 127.0.0.1:8787\n&|' "$CADDYFILE"
# Make browsers check for app updates every time (see README).
sed -i 's|header /sw.js Cache-Control "no-cache"|header Cache-Control "no-cache"|' "$CADDYFILE"
grep -q 'header Cache-Control "no-cache"' "$CADDYFILE" || \
  sed -i 's|^\([[:space:]]*\)file_server$|&\n\1header Cache-Control "no-cache"|' "$CADDYFILE"
# Keep the server folder private like questions/ and tools/.
sed -i 's|@private path /questions/\* /tools/\* /.git/\*$|@private path /questions/* /tools/* /server/* /.git/*|' "$CADDYFILE"
if ! grep -q 'reverse_proxy /api/\* 127.0.0.1:8787' "$CADDYFILE"; then
  echo "Couldn't find a 'file_server' line to add the sync route next to. Add this line to your site block:"
  echo "    reverse_proxy /api/* 127.0.0.1:8787"
  exit 1
fi
caddy validate --config "$CADDYFILE" --adapter caddyfile >/dev/null
systemctl reload caddy
echo "Caddy updated (backup of the old config saved next to it)."
echo
echo "Done. Open the app on the device you've been using; it uploads its progress to the server on first launch."
echo "Your data on the server: /var/lib/study-app/state.json (hourly backups in /var/lib/study-app/backups/)."
