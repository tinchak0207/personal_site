#!/bin/sh
set -eu

parse_redis_url() {
  url="$1"
  rest="${url#*://}"
  auth_and_host="${rest%%/*}"
  db_part="${rest#*/}"

  auth=""
  host_port="$auth_and_host"
  if [ "${auth_and_host#*@}" != "$auth_and_host" ]; then
    auth="${auth_and_host%@*}"
    host_port="${auth_and_host#*@}"
  fi

  host="${host_port%%:*}"
  port="${host_port##*:}"
  if [ "$host" = "$port" ]; then
    port="6379"
  fi

  password=""
  if [ -n "$auth" ]; then
    case "$auth" in
      *:*)
        password="${auth#*:}"
        ;;
      *)
        password="$auth"
        ;;
    esac
  fi

  db="0"
  if [ "$db_part" != "$rest" ] && [ -n "$db_part" ]; then
    db="${db_part%%\?*}"
  fi

  REDIS_HOST_PARSED="$host"
  REDIS_PORT_PARSED="$port"
  REDIS_PASSWORD_PARSED="$password"
  REDIS_DB_PARSED="$db"
}

export SERVER_HOST="${SERVER_HOST:-0.0.0.0}"
export SERVER_PORT="${SERVER_PORT:-${PORT:-10000}}"
export SERVER_MODE="${SERVER_MODE:-release}"
export DATABASE_DRIVER="${DATABASE_DRIVER:-postgres}"
export EMAIL_ENABLED="${EMAIL_ENABLED:-false}"
export CAPTCHA_PROVIDER="${CAPTCHA_PROVIDER:-none}"
export APP_MODE="${APP_MODE:-api}"

if [ -n "${REDIS_URL:-}" ]; then
  parse_redis_url "$REDIS_URL"
  export REDIS_ENABLED="${REDIS_ENABLED:-true}"
  export REDIS_HOST="${REDIS_HOST:-$REDIS_HOST_PARSED}"
  export REDIS_PORT="${REDIS_PORT:-$REDIS_PORT_PARSED}"
  export REDIS_PASSWORD="${REDIS_PASSWORD:-$REDIS_PASSWORD_PARSED}"
  export REDIS_DB="${REDIS_DB:-0}"
  export QUEUE_ENABLED="${QUEUE_ENABLED:-true}"
  export QUEUE_HOST="${QUEUE_HOST:-$REDIS_HOST_PARSED}"
  export QUEUE_PORT="${QUEUE_PORT:-$REDIS_PORT_PARSED}"
  export QUEUE_PASSWORD="${QUEUE_PASSWORD:-$REDIS_PASSWORD_PARSED}"
  export QUEUE_DB="${QUEUE_DB:-0}"
else
  export REDIS_ENABLED="${REDIS_ENABLED:-false}"
  export QUEUE_ENABLED="${QUEUE_ENABLED:-false}"
fi

exec /app/dujiao-server --mode "${APP_MODE}"
