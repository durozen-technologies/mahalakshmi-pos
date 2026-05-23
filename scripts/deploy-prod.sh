#!/usr/bin/env bash
# Production deploy: pull app images, rolling update backend/caddy, rollback on failure.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-${DEPLOY_ROOT}/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-${DEPLOY_ROOT}/.env}"
STATE_DIR="${DEPLOY_ROOT}/.deploy"
STATE_FILE="${STATE_DIR}/state"
LOG_DIR="${DEPLOY_ROOT}/logs"
DEPLOY_LOG="${LOG_DIR}/deploy.log"
HEALTH_RETRIES="${HEALTH_RETRIES:-30}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-5}"

mkdir -p "${STATE_DIR}" "${LOG_DIR}"
touch "${DEPLOY_LOG}"

exec > >(tee -a "${DEPLOY_LOG}") 2>&1

log() {
  printf '[%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"
}

compose() {
  docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" "$@"
}

read_state() {
  BACKEND_TAG_PREVIOUS=""
  CADDY_TAG_PREVIOUS=""
  if [[ -f "${STATE_FILE}" ]]; then
    # shellcheck disable=SC1090
    source "${STATE_FILE}"
    BACKEND_TAG_PREVIOUS="${BACKEND_TAG:-}"
    CADDY_TAG_PREVIOUS="${CADDY_TAG:-}"
  fi
}

write_state() {
  local backend_tag="$1"
  local caddy_tag="$2"
  cat >"${STATE_FILE}" <<EOF
BACKEND_TAG=${backend_tag}
CADDY_TAG=${caddy_tag}
DEPLOYED_AT=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
EOF
}

setup_home_symlinks() {
  local home_dir
  home_dir="$(getent passwd "$(whoami)" | cut -d: -f6)"
  ln -sfn "${SCRIPT_DIR}/pos-logs.sh" "${home_dir}/pos-logs"
  ln -sfn "${LOG_DIR}" "${home_dir}/pos-logs-dir"
  chmod +x "${SCRIPT_DIR}/pos-logs.sh" "${SCRIPT_DIR}/deploy-prod.sh" 2>/dev/null || true
}

docker_login() {
  if [[ -n "${DOCKERHUB_TOKEN:-}" ]]; then
    log "Logging in to Docker Hub"
    echo "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin
  fi
}

infra_running() {
  compose ps --status running --services 2>/dev/null | grep -qx postgres \
    && compose ps --status running --services 2>/dev/null | grep -qx rustfs
}

bootstrap_infra() {
  if infra_running; then
    log "Postgres and RustFS already running — skipping infra bootstrap"
    return 0
  fi
  log "Bootstrapping postgres and rustfs"
  compose pull postgres rustfs
  compose up -d postgres rustfs
  compose up -d --wait postgres rustfs
}

wait_backend_health() {
  local i
  log "Waiting for backend health"
  for ((i = 1; i <= HEALTH_RETRIES; i++)); do
    if compose exec -T backend python -c \
      "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health', timeout=5).getcode()==200 else 1)" \
      2>/dev/null; then
      log "Backend healthy"
      return 0
    fi
    sleep "${HEALTH_INTERVAL}"
  done
  return 1
}

wait_caddy_health() {
  local i
  log "Waiting for caddy health"
  for ((i = 1; i <= HEALTH_RETRIES; i++)); do
    if compose exec -T caddy sh -c \
      'caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile && pidof caddy >/dev/null' \
      2>/dev/null; then
      log "Caddy healthy"
      return 0
    fi
    sleep "${HEALTH_INTERVAL}"
  done
  return 1
}

rollback() {
  local backend_tag="${1:-}"
  local caddy_tag="${2:-}"
  if [[ -z "${backend_tag}" || -z "${caddy_tag}" ]]; then
    log "No previous tags to roll back to"
    return 1
  fi
  log "Rolling back to BACKEND_TAG=${backend_tag} CADDY_TAG=${caddy_tag}"
  export IMAGE_TAG="${backend_tag}"
  compose pull backend || true
  compose up -d --no-deps backend
  wait_backend_health || true
  export IMAGE_TAG="${caddy_tag}"
  compose pull caddy || true
  compose up -d --no-deps caddy
  wait_caddy_health || true
  write_state "${backend_tag}" "${caddy_tag}"
}

deploy_app() {
  local new_tag="${IMAGE_TAG:-latest}"
  local rollback_backend="${BACKEND_TAG_PREVIOUS:-}"
  local rollback_caddy="${CADDY_TAG_PREVIOUS:-}"

  bootstrap_infra

  log "Pulling backend and caddy images (tag=${new_tag})"
  compose pull backend caddy

  log "Deploying backend"
  compose up -d --no-deps backend
  if ! wait_backend_health; then
    log "Backend health check failed"
    rollback "${rollback_backend}" "${rollback_caddy}"
    exit 1
  fi

  log "Deploying caddy"
  compose up -d --no-deps caddy
  if ! wait_caddy_health; then
    log "Caddy health check failed"
    rollback "${rollback_backend}" "${rollback_caddy}"
    exit 1
  fi

  write_state "${new_tag}" "${new_tag}"
  log "Deploy succeeded (IMAGE_TAG=${new_tag})"
}

main() {
  if [[ ! -f "${ENV_FILE}" ]]; then
    log "Missing ${ENV_FILE}"
    exit 1
  fi
  if [[ ! -f "${COMPOSE_FILE}" ]]; then
    log "Missing ${COMPOSE_FILE}"
    exit 1
  fi

  # shellcheck disable=SC1090
  set -a
  source "${ENV_FILE}"
  set +a

  setup_home_symlinks
  read_state
  docker_login
  deploy_app
}

main "$@"
