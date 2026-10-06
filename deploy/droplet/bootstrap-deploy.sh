#!/usr/bin/env bash
# Run once as deploy@droplet (no root). Binds 0.0.0.0:3012 like kudos on 3005.
set -euo pipefail

APP_DIR="${APTO_APP_DIR:-$HOME/opt/apto}"
PORT="${APTO_PORT:-3012}"
DOTNET_ROOT="${DOTNET_ROOT:-$HOME/.dotnet}"

export DOTNET_ROOT
export PATH="$DOTNET_ROOT:$PATH"

if ! command -v dotnet >/dev/null 2>&1 || ! dotnet --list-runtimes 2>/dev/null | grep -q "Microsoft.AspNetCore.App 8"; then
  echo "Installing .NET 8 ASP.NET Core runtime to $DOTNET_ROOT …"
  curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
  bash /tmp/dotnet-install.sh --channel 8.0 --runtime aspnetcore --install-dir "$DOTNET_ROOT"
fi

mkdir -p "$APP_DIR"
mkdir -p "$HOME/.config/systemd/user"

UNIT="$HOME/.config/systemd/user/apto.service"
cat > "$UNIT" <<EOF
[Unit]
Description=Apto API (ASP.NET Core, user)
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
Environment=DOTNET_ROOT=$DOTNET_ROOT
Environment=PATH=$DOTNET_ROOT:/usr/local/bin:/usr/bin:/bin
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://0.0.0.0:$PORT
ExecStart=$DOTNET_ROOT/dotnet $APP_DIR/Apto.Api.dll
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable apto.service
echo "Bootstrap (deploy user) OK: $APP_DIR on port $PORT"
