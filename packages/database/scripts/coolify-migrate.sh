#!/bin/sh
# Coolify nbos-migrate entrypoint. Dockerfile CMD is not reliably overridden.
# Coolify Dockerfile apps hardcode restart unless-stopped; --restart=no is ignored.
# After Prisma we hold the process so Coolify cannot re-run migrate. Poll logs for
# NBOS_MIGRATE_DONE — Coolify "finished" means container start, not Prisma exit.
set -eu

HOLD_ENABLED="${NBOS_MIGRATE_HOLD:-1}"
HOLD_POLL_SEC=5
mode="${PRISMA_MIGRATE_MODE:-deploy}"

run_status() {
  pnpm --filter @nbos/database exec prisma migrate status
}

run_deploy() {
  pnpm --filter @nbos/database migrate:deploy
}

run_reconcile() {
  if [ -z "${PRISMA_RECONCILE_B64:-}" ]; then
    echo "PRISMA_RECONCILE_B64 is required for reconcile" >&2
    return 1
  fi
  echo "$PRISMA_RECONCILE_B64" | base64 -d \
    | pnpm --filter @nbos/database exec prisma db execute --stdin
  echo RECONCILE_ORPHANS_DELETED
  run_status
}

echo "NBOS_MIGRATE_START mode=${mode}"

set +e
case "$mode" in
  status) run_status ;;
  reconcile) run_reconcile ;;
  deploy) run_deploy ;;
  *)
    echo "Invalid PRISMA_MIGRATE_MODE=$mode (expected status|reconcile|deploy)" >&2
    false
    ;;
esac
code=$?
set -e

echo "NBOS_MIGRATE_DONE exit=${code}"

if [ "$HOLD_ENABLED" = "0" ]; then
  exit "$code"
fi

trap 'exit '"$code"'' TERM INT
while true; do
  sleep "$HOLD_POLL_SEC" &
  wait $! || true
done
