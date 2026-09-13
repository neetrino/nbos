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
