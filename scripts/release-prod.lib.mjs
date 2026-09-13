import { ANSI, paint } from './cli-style.mjs';

/**
 * @param {string[]} argv
 * @returns {{ statusOnly: boolean, help: boolean, deployArgs: string[] }}
 */
export function parseReleaseProdArgs(argv) {
  const statusOnly = argv.includes('--status') || argv.includes('--dry-run');
  const help = argv.includes('--help') || argv.includes('-h');
  const deployArgs = argv.filter(
    (arg) => arg !== '--status' && arg !== '--dry-run' && arg !== '--help' && arg !== '-h',
  );
  return { statusOnly, help, deployArgs };
}

/**
 * @param {number} migrateExitCode
 * @returns {boolean}
 */
export function shouldStartDeploy(migrateExitCode) {
  return migrateExitCode === 0;
}

/**
 * @param {boolean} statusOnly
 * @param {boolean} [color]
 * @returns {string}
 */
export function formatReleaseBanner(statusOnly, color = true) {
  if (statusOnly) {
    return `${paint(color, ANSI.cyan, 'Release status')} — migrate check, then deploy check\n`;
  }
  return `${paint(color, ANSI.cyan, 'Release')} — migrate first, deploy only if migrate succeeds\n`;
}

/**
 * @param {'migrate' | 'deploy'} step
 * @param {boolean} [color]
 * @returns {string}
 */
export function formatReleaseStopped(step, color = true) {
  const reason =
    step === 'migrate'
      ? 'production migrate did not succeed. Coolify was not touched.'
      : 'Coolify deploy did not succeed.';
  return `${paint(color, ANSI.red, `✕ Release stopped: ${reason}`)}\n`;
}

/**
 * @param {boolean} [color]
 * @returns {string}
 */
export function formatReleaseFinished(color = true) {
  return `${paint(color, ANSI.green, '✓ Release finished.')}\n`;
}
