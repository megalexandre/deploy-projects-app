#!/bin/sh
set -eu

ENV_JS_PATH="/usr/share/nginx/html/env.js"

escape_js() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e ':a;N;$!ba;s/\n/\\n/g' -e 's/\r/\\r/g'
}

API_PROXY_TARGET_VALUE="${VITE_API_PROXY_TARGET:-https://project-deploy.shop}"
API_BASE_URL_VALUE="${VITE_API_BASE_URL:-}"

API_BASE_URL_ESCAPED=$(escape_js "$API_BASE_URL_VALUE")
AUTH_TOKEN_KEY_ESCAPED=$(escape_js "${VITE_AUTH_TOKEN_STORAGE_KEY:-auth_token}")
VIACEP_BASE_URL_ESCAPED=$(escape_js "${VITE_VIACEP_BASE_URL:-https://viacep.com.br/ws}")
API_PROXY_TARGET_ESCAPED=$(escape_js "$API_PROXY_TARGET_VALUE")


cat > "$ENV_JS_PATH" <<EOF
window.__APP_ENV__ = {
  VITE_API_BASE_URL: "$API_BASE_URL_ESCAPED",
  VITE_AUTH_TOKEN_STORAGE_KEY: "$AUTH_TOKEN_KEY_ESCAPED",
  VITE_VIACEP_BASE_URL: "$VIACEP_BASE_URL_ESCAPED",
  VITE_API_PROXY_TARGET: "$API_PROXY_TARGET_ESCAPED"
};
EOF
