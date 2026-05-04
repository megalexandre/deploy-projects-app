#!/bin/sh
set -eu

ENV_JS_PATH="/usr/share/nginx/html/env.js"

escape_js() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e ':a;N;$!ba;s/\n/\\n/g' -e 's/\r/\\r/g'
}

# Defaults para variaveis conhecidas (sobrescritos por vars de ambiente do container)
export VITE_API_PROXY_TARGET="${VITE_API_PROXY_TARGET:-https://project-deploy.shop}"
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-}"
export VITE_AUTH_TOKEN_STORAGE_KEY="${VITE_AUTH_TOKEN_STORAGE_KEY:-auth_token}"
export VITE_VIACEP_BASE_URL="${VITE_VIACEP_BASE_URL:-https://viacep.com.br/ws}"

{
  printf 'window.__APP_ENV__ = {\n'
  env | grep '^VITE_' | sort | while IFS= read -r line; do
    key="${line%%=*}"
    val="${line#*=}"
    escaped=$(escape_js "$val")
    printf '  %s: "%s",\n' "$key" "$escaped"
  done
  printf '};\n'
} > "$ENV_JS_PATH"
