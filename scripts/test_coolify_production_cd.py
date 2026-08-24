from __future__ import annotations

import importlib.util
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "coolify-production-cd.py"
SPEC = importlib.util.spec_from_file_location("coolify_production_cd", SCRIPT)
assert SPEC and SPEC.loader
cd = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = cd
SPEC.loader.exec_module(cd)


class CoolifyProductionCdTest(unittest.TestCase):
    def test_exit_255_without_app_error_is_the_only_retryable_failure(self) -> None:
        logs = (
            '[{"output":"#21 Creating an optimized production build ..."},'
            '{"output":"Deployment failed: Command execution failed (exit code 255)"}]'
        )
        failure = cd.classify_deployment_failure(logs)
        self.assertEqual(failure.kind, "remote-command-transport")
        self.assertTrue(failure.retryable)

    def test_real_build_and_healthcheck_failures_are_not_retryable(self) -> None:
        build = cd.classify_deployment_failure("Failed to compile: Type error")
        health = cd.classify_deployment_failure("Healthcheck timed out; container is unhealthy")
        self.assertEqual(build.kind, "application-build")
        self.assertFalse(build.retryable)
        self.assertEqual(health.kind, "healthcheck")
        self.assertFalse(health.retryable)

    def test_status_suffix_is_normalized(self) -> None:
        self.assertEqual(cd.deployment_status({"status": "finished:healthy"}), "finished")
        self.assertEqual(cd.deployment_status({"status": "failed:unhealthy"}), "failed")

    def test_runtime_retries_verified_transport_failure_once(self) -> None:
        client = cd.Coolify("https://coolify.invalid/api/v1", "token")
        failed = {"status": "failed", "commit": "abc123456789"}
        finished = {"status": "finished", "commit": "abc123456789"}
        with (
            patch.object(cd, "try_pin_sha", return_value=True),
            patch.object(cd, "start_force", side_effect=["dep-1", "dep-2"]) as start,
            patch.object(cd, "wait_deployment", side_effect=[failed, finished]),
            patch.object(
                cd,
                "log_failed_deployment_state",
                return_value=cd.DeploymentFailure("remote-command-transport", True, "exit=255"),
            ),
            patch.object(cd, "log"),
        ):
            cd.deploy_runtime_application(client, "app", "web", "abc123456789")
        self.assertEqual(start.call_count, 2)

    def test_runtime_never_retries_a_real_failure(self) -> None:
        client = cd.Coolify("https://coolify.invalid/api/v1", "token")
        failed = {"status": "failed", "commit": "abc123456789"}
        with (
            patch.object(cd, "try_pin_sha", return_value=True),
            patch.object(cd, "start_force", return_value="dep-1") as start,
            patch.object(cd, "wait_deployment", return_value=failed),
            patch.object(
                cd,
                "log_failed_deployment_state",
                return_value=cd.DeploymentFailure("application-build", False, "compile failed"),
            ),
            patch.object(cd, "log"),
        ):
            with self.assertRaises(SystemExit):
                cd.deploy_runtime_application(client, "app", "web", "abc123456789")
        self.assertEqual(start.call_count, 1)

    def test_migrator_defaults_to_deploy_without_a_database(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            temp_path = Path(temp)
            bin_path = temp_path / "bin"
            bin_path.mkdir()
            capture_path = temp_path / "pnpm-args"
            fake_pnpm = bin_path / "pnpm"
            fake_pnpm.write_text(
                f"#!/bin/sh\nprintf '%s\\n' \"$*\" > '{capture_path}'\nexit 0\n",
                encoding="utf-8",
            )
            fake_pnpm.chmod(0o755)
            env = {
                **os.environ,
                "PATH": f"{bin_path}:{os.environ.get('PATH', '')}",
                "NBOS_MIGRATE_HOLD": "0",
            }
            env.pop("PRISMA_MIGRATE_MODE", None)
            completed = subprocess.run(
                ["sh", str(ROOT / "packages" / "database" / "scripts" / "coolify-migrate.sh")],
                cwd=ROOT,
                env=env,
                text=True,
                capture_output=True,
                check=False,
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)
            self.assertIn("NBOS_MIGRATE_START mode=deploy", completed.stdout)
            self.assertIn("NBOS_MIGRATE_DONE exit=0", completed.stdout)
            self.assertEqual(capture_path.read_text(encoding="utf-8").strip(), "--filter @nbos/database migrate:deploy")


if __name__ == "__main__":
    unittest.main()
