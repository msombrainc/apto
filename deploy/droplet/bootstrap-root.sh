#!/usr/bin/env bash
# Run once as root on 64.225.115.88 (DO console or root SSH).
set -euo pipefail

APP_USER=deploy
APP_DIR=/opt/apto
ENV_FILE=/etc/apto.env
PORT=3012
HOSTNAME=apto.64.225.115.88.nip.io

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root." >&2
  exit 1
fi

if ! command -v dotnet >/dev/null 2>&1; then
  echo "Installing ASP.NET Core 8 runtime…"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y wget apt-transport-https
  wget -q https://packages.microsoft.com/config/ubuntu/$(. /etc/os-release && echo "$VERSION_ID")/packages-microsoft-prod.deb -O /tmp/packages-microsoft-prod.deb
  dpkg -i /tmp/packages-microsoft-prod.deb
  apt-get update -qq
  apt-get install -y aspnetcore-runtime-8.0
fi

mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  cat > "$ENV_FILE" <<EOF
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://127.0.0.1:$PORT
EOF
  chmod 644 "$ENV_FILE"
  echo "Wrote $ENV_FILE"
else
  echo "Keeping existing $ENV_FILE"
fi

cat > /etc/systemd/system/apto.service <<EOF
[Unit]
Description=Apto API (ASP.NET Core)
After=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/dotnet $APP_DIR/Apto.Api.dll
Restart=on-failure
RestartSec=3
MemoryHigh=256M

[Install]
WantedBy=multi-user.target
EOF

cat > /usr/local/bin/apto-restart <<'EOF'
#!/bin/bash
set -euo pipefail
/usr/bin/systemctl daemon-reload
/usr/bin/systemctl enable apto
/usr/bin/systemctl restart apto
/usr/bin/systemctl is-active apto
EOF
chmod 755 /usr/local/bin/apto-restart

cat > /etc/nginx/sites-available/apto <<EOF
server {
    listen 80;
    server_name $HOSTNAME;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/apto /etc/nginx/sites-enabled/apto
nginx -t
systemctl reload nginx

SUDOERS=/etc/sudoers.d/apto-deploy
if ! grep -q apto-restart "$SUDOERS" 2>/dev/null; then
  cat > "$SUDOERS" <<EOF
$APP_USER ALL=(root) NOPASSWD: /usr/local/bin/apto-restart
$APP_USER ALL=(root) NOPASSWD: /usr/bin/systemctl restart apto, /usr/bin/systemctl status apto, /usr/bin/systemctl is-active apto
EOF
  chmod 440 "$SUDOERS"
fi

echo "Bootstrap done. Deploy user can: sudo /usr/local/bin/apto-restart"
