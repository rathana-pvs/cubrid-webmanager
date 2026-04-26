#!/usr/bin/env bash
# Generate self-signed PEM files for local ENVIRONMENT=production testing -> apps/api-server/ssl/
# Usage: ./scripts/generate-local-production-ssl.sh
# (Optional) Add extra IP/SAN: SAN_IP=192.168.1.1 ./scripts/generate-local-production-ssl.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SSL_DIR="${ROOT}/apps/api-server/ssl"
mkdir -p "$SSL_DIR"

CERT="${SSL_DIR}/cert.pem"
KEY="${SSL_DIR}/key.pem"

SAN_IP="${SAN_IP:-}"
ALT="DNS:localhost,DNS:127.0.0.1,IP:127.0.0.1"
if [[ -n "$SAN_IP" ]]; then
  ALT="${ALT},IP:${SAN_IP}"
fi

openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout "$KEY" \
  -out "$CERT" \
  -days 825 \
  -subj "/CN=localhost/O=CUBRID Web Manager (local prod test)" \
  -addext "subjectAltName=${ALT}"

chmod 640 "$KEY"
chmod 644 "$CERT"

echo "Generated:"
echo "  SSL_CERT_PATH=${CERT}"
echo "  SSL_KEY_PATH=${KEY}"
echo ""
echo ".env example from workspace root:"
echo "  SSL_CERT_PATH=apps/api-server/ssl/cert.pem"
echo "  SSL_KEY_PATH=apps/api-server/ssl/key.pem"
