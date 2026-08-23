#!/bin/sh
# Coolify nbos-migrate entrypoint. Dockerfile CMD is not reliably overridden.
set -eu

mode="${PRISMA_MIGRATE_MODE:-deploy}"

run_status() {
  exec pnpm --filter @nbos/database exec prisma migrate status
}

run_deploy() {
  exec pnpm --filter @nbos/database migrate:deploy
}

run_reconcile() {
  if [ -z "${PRISMA_RECONCILE_B64:-}" ]; then
    echo "PRISMA_RECONCILE_B64 is required for reconcile" >&2
    exit 1
  fi
  echo "$PRISMA_RECONCILE_B64" | base64 -d \
    | pnpm --filter @nbos/database exec prisma db execute --stdin
  echo RECONCILE_ORPHANS_DELETED
  run_status
}

case "$mode" in
  status) run_status ;;
  reconcile) run_reconcile ;;
  deploy) run_deploy ;;
  *)
    echo "Invalid PRISMA_MIGRATE_MODE=$mode (expected status|reconcile|deploy)" >&2
    exit 1
    ;;
esac
