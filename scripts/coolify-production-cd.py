#!/usr/bin/env python3
"""Production CD: force-rebuild nbos-migrate, poll NBOS_MIGRATE_DONE, then 4 apps."""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Mapping

HTTP_TIMEOUT_SEC = 30
POLL_INTERVAL_SEC = 10
MIGRATE_BUILD_TIMEOUT_SEC = 20 * 60
MIGRATE_SENTINEL_TIMEOUT_SEC = 10 * 60
APP_DEPLOY_TIMEOUT_SEC = 20 * 60
STOP_TIMEOUT_SEC = 2 * 60
LOG_LINES = 200
SENTINEL_RE = re.compile(r"NBOS_MIGRATE_DONE exit=(\d+)")
SECRET_RE = re.compile(
    r"(postgres(?:ql)?(?:\+[a-z0-9_]+)?://\S+)|DIRECT_URL=\S+|DATABASE_URL=\S+"
    r"|Bearer\s+\S+",
    re.I,
)
REQUIRED_ENV = (
    "COOLIFY_API_URL",
    "COOLIFY_TOKEN",
    "COOLIFY_UUID_MIGRATE",
    "COOLIFY_UUID_API",
    "COOLIFY_UUID_WORKER",
    "COOLIFY_UUID_SCHEDULER",
    "COOLIFY_UUID_WEB",
    "RELEASE_SHA",
)
RUNTIME_ENV = (
    "COOLIFY_UUID_API",
    "COOLIFY_UUID_WORKER",
    "COOLIFY_UUID_SCHEDULER",
    "COOLIFY_UUID_WEB",
)
SUCCESS_STATUSES = frozenset({"finished"})
FAIL_STATUSES = frozenset({"failed", "error", "cancelled", "cancelled-by-user"})


@dataclass(frozen=True)
class Coolify:
    base_url: str
    token: str


def log(message: str) -> None:
    print(redact(message), flush=True)


def redact(text: str) -> str:
    return SECRET_RE.sub("[redacted]", text)


def fail(message: str, code: int = 1) -> None:
    log(message)
    raise SystemExit(code)


def require_env() -> dict[str, str]:
    missing = [name for name in REQUIRED_ENV if not os.environ.get(name, "").strip()]
    if missing:
        fail("Missing GitHub Secrets/env: " + ", ".join(missing))
    return {name: os.environ[name].strip() for name in REQUIRED_ENV}


def normalize_base(url: str) -> str:
    base = url.rstrip("/")
    if not base.endswith("/api/v1"):
        base = f"{base}/api/v1"
    return base


def request(
    client: Coolify,
    method: str,
    path: str,
    query: Mapping[str, str] | None = None,
    body: Mapping[str, object] | None = None,
    *,
    allow_error: bool = False,
) -> object:
    encoded = urllib.parse.urlencode(query or {})
    url = f"{client.base_url}{path}"
    if encoded:
        url = f"{url}?{encoded}"
    data = None if body is None else json.dumps(body).encode()
    headers = {
        "Authorization": f"Bearer {client.token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT_SEC) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        detail = redact(exc.read().decode(errors="replace")[:400])
        if allow_error:
            log(f"Coolify {method} {path} HTTP {exc.code}: {detail}")
            return {"error": exc.code}
        fail(f"Coolify {method} {path} HTTP {exc.code}: {detail}")
    except urllib.error.URLError as exc:
        detail = redact(str(getattr(exc, "reason", exc)))
        if allow_error:
            log(f"Coolify {method} {path} network error: {detail}")
            return {"error": "network"}
        fail(f"Coolify {method} {path} network error: {detail}")
    if not raw.strip():
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return raw


def commits_match(expected: str, actual: str) -> bool:
    exp = expected.strip().lower()
    act = actual.strip().lower()
    if not exp or not act or act in {"head", "null"}:
        return False
    prefix_len = min(12, len(exp), len(act))
    return exp[:prefix_len] == act[:prefix_len]


def deployment_status(payload: Mapping[str, object]) -> str:
    return str(payload.get("status") or "").strip().lower().split(":", 1)[0]


def wait_deployment(client: Coolify, deployment_uuid: str, timeout_sec: int) -> dict[str, object]:
    deadline = time.monotonic() + timeout_sec
    while time.monotonic() < deadline:
        payload = request(client, "GET", f"/deployments/{deployment_uuid}")
        if not isinstance(payload, dict):
            fail(f"Unexpected deployment payload for {deployment_uuid}")
        status = deployment_status(payload)
        log(f"deployment {deployment_uuid} status={status} commit={payload.get('commit')}")
        if status in SUCCESS_STATUSES:
            return payload
        if status in FAIL_STATUSES:
            fail(f"Coolify deployment {deployment_uuid} ended status={status}")
        time.sleep(POLL_INTERVAL_SEC)
    fail(f"Timeout waiting for Coolify deployment {deployment_uuid}")
    raise AssertionError("unreachable")


def start_force(client: Coolify, app_uuid: str) -> str:
    payload = request(client, "GET", f"/applications/{app_uuid}/start", {"force": "true"})
    if not isinstance(payload, dict):
        fail(f"Unexpected start payload for {app_uuid}")
    dep = str(payload.get("deployment_uuid") or "").strip()
    if not dep and isinstance(payload.get("deployments"), list) and payload["deployments"]:
        first = payload["deployments"][0]
        if isinstance(first, dict):
            dep = str(first.get("deployment_uuid") or "").strip()
    if not dep:
        fail(f"Coolify start returned no deployment_uuid for {app_uuid}")
    log(f"queued force rebuild uuid={app_uuid} deployment={dep}")
    return dep


def try_pin_sha(client: Coolify, app_uuid: str, sha: str) -> bool:
    patched = request(
        client,
        "PATCH",
        f"/applications/{app_uuid}",
        body={"git_commit_sha": sha},
        allow_error=True,
    )
    if isinstance(patched, dict) and patched.get("error"):
        log(f"git_commit_sha pin not accepted app={app_uuid}")
        return False
    app = request(client, "GET", f"/applications/{app_uuid}", allow_error=True)
    if not isinstance(app, dict) or app.get("error"):
        return False
    pinned = str(app.get("git_commit_sha") or "").strip()
    ok = commits_match(sha, pinned)
    log(f"git_commit_sha pin persisted={ok} app={app_uuid}")
    return ok


def application_logs(client: Coolify, app_uuid: str) -> str:
    payload = request(
        client,
        "GET",
        f"/applications/{app_uuid}/logs",
        {"lines": str(LOG_LINES)},
        allow_error=True,
    )
    if isinstance(payload, dict):
        if payload.get("error"):
            return ""
        return str(payload.get("logs") or "")
    return str(payload)


def wait_sentinel(client: Coolify, app_uuid: str) -> int:
    deadline = time.monotonic() + MIGRATE_SENTINEL_TIMEOUT_SEC
    while time.monotonic() < deadline:
        logs = application_logs(client, app_uuid)
        match = SENTINEL_RE.search(logs)
        if match:
            code = int(match.group(1))
            log(f"captured {match.group(0)}")
            return code
        log("waiting for NBOS_MIGRATE_DONE in runtime logs")
        time.sleep(POLL_INTERVAL_SEC)
    fail("Timeout waiting for NBOS_MIGRATE_DONE in migrator runtime logs")
    raise AssertionError("unreachable")


def stop_application(client: Coolify, app_uuid: str) -> None:
    request(client, "GET", f"/applications/{app_uuid}/stop", allow_error=True)
    deadline = time.monotonic() + STOP_TIMEOUT_SEC
    while time.monotonic() < deadline:
        app = request(client, "GET", f"/applications/{app_uuid}", allow_error=True)
        status = str(app.get("status") if isinstance(app, dict) else "")
        log(f"migrator stop status={status}")
        lowered = status.lower()
        if lowered.startswith("exited") or "stopped" in lowered:
            return
        time.sleep(POLL_INTERVAL_SEC)
    log("migrator stop timed out; continuing")


def require_commit(payload: Mapping[str, object], sha: str, label: str) -> None:
    actual = str(payload.get("commit") or "").strip()
    log(f"{label} deployment.commit={actual} expected={sha}")
    if not commits_match(sha, actual):
        fail(f"{label}: deployment.commit does not match RELEASE_SHA; refusing to continue")


def deploy_runtime(client: Coolify, env: Mapping[str, str], sha: str) -> None:
    # Sequential: Coolify force-rebuild of four apps at once has failed nbos-api.
    for name in RUNTIME_ENV:
        try_pin_sha(client, env[name], sha)
        dep = start_force(client, env[name])
        payload = wait_deployment(client, dep, APP_DEPLOY_TIMEOUT_SEC)
        require_commit(payload, sha, name)


def main() -> None:
    env = require_env()
    client = Coolify(normalize_base(env["COOLIFY_API_URL"]), env["COOLIFY_TOKEN"])
    sha = env["RELEASE_SHA"]
    migrate_uuid = env["COOLIFY_UUID_MIGRATE"]
    log(f"release sha={sha}")
    try_pin_sha(client, migrate_uuid, sha)
    dep = start_force(client, migrate_uuid)
    finished = wait_deployment(client, dep, MIGRATE_BUILD_TIMEOUT_SEC)
    require_commit(finished, sha, "nbos-migrate")
    log("Coolify finished means container start, not Prisma; polling sentinel")
    try:
        exit_code = wait_sentinel(client, migrate_uuid)
    finally:
        stop_application(client, migrate_uuid)
    if exit_code != 0:
        fail(f"nbos-migrate failed NBOS_MIGRATE_DONE exit={exit_code}; skipping 4 apps")
    log("migrate sentinel exit=0; deploying api, worker, scheduler, web")
    deploy_runtime(client, env, sha)
    log("production CD complete")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
