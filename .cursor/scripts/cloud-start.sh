#!/usr/bin/env bash
#
# NBOS Cloud Agent start (per-boot service reconciliation).
#
# Brings up the local infrastructure the API/worker/web depend on:
#   - PostgreSQL cluster,
#   - Redis server.
#
# Idempotent: tolerates already-running services and returns once both are
# accepting connections. Application dev servers run separately (terminals).
set -euo pipefail

log() { printf '\n\033[1;32m[start]\033[0m %s\n' "$1"; }

# ── PostgreSQL ───────────────────────────────────────────────────────
PG_VERSION="$(ls /etc/postgresql 2>/dev/null | sort -V | tail -n1 || true)"
if [ -n "$PG_VERSION" ]; then
  log "Starting PostgreSQL ${PG_VERSION}"
  sudo pg_ctlcluster "$PG_VERSION" main start 2>/dev/null || true
fi

for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready -q; then break; fi
  sleep 1
done
sudo -u postgres pg_isready || { echo "PostgreSQL did not become ready" >&2; exit 1; }
log "PostgreSQL ready"

# ── Redis ────────────────────────────────────────────────────────────
if ! redis-cli ping >/dev/null 2>&1; then
  log "Starting Redis"
  sudo redis-server /etc/redis/redis.conf --daemonize yes 2>/dev/null \
    || redis-server --daemonize yes
fi

for _ in $(seq 1 30); do
  if redis-cli ping >/dev/null 2>&1; then break; fi
  sleep 1
done
redis-cli ping >/dev/null 2>&1 || { echo "Redis did not become ready" >&2; exit 1; }
log "Redis ready"

log "Infrastructure ready"
