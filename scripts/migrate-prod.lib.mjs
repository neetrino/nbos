/** Production Prisma migrate helpers. Never log a connection string. */

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

/**
 * @param {string[]} argv
 * @returns {{ statusOnly: boolean, dryRun: boolean, help: boolean }}
 */
export function parseMigrateProdArgs(argv) {
  return {
    statusOnly: argv.includes('--status'),
    dryRun: argv.includes('--dry-run'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

/**
 * @param {string} text
 * @returns {string}
 */
export function redactSecrets(text) {
  return text.replace(/(postgres(?:ql)?:\/\/)\S+/gi, '$1***');
}

/**
 * @param {string} rawUrl
 * @returns {string}
 */
export function extractSafeHost(rawUrl) {
  const url = new URL(rawUrl);
  if (!url.hostname) throw new Error('DIRECT_URL_PROD has no host');
  return url.hostname;
}

/**
 * @param {string} rawUrl
 * @returns {string}
 */
export function assertProdDirectUrl(rawUrl) {
  const value = rawUrl.trim();
  if (!value) throw new Error('Set DIRECT_URL_PROD in .env.local');
  let host;
  try {
    host = extractSafeHost(value);
  } catch {
    throw new Error('DIRECT_URL_PROD must be a valid postgres URL');
  }
  if (!/^postgres(ql)?:$/i.test(new URL(value).protocol)) {
    throw new Error('DIRECT_URL_PROD must be a postgres URL');
  }
  if (LOCAL_HOSTS.has(host) || host.endsWith('.local')) {
    throw new Error('DIRECT_URL_PROD looks local. Refusing production migrate.');
  }
  return host;
}

/**
 * @param {Record<string, string | undefined>} env
 * @returns {{ url: string, host: string }}
 */
export function resolveProdDirectUrl(env) {
  const url = env.DIRECT_URL_PROD?.trim() ?? '';
  const host = assertProdDirectUrl(url);
  const localUrl = env.DIRECT_URL?.trim() ?? '';
  if (localUrl) {
    try {
      const localHost = extractSafeHost(localUrl);
      if (localHost === host) {
        throw new Error(
          'DIRECT_URL_PROD matches local DIRECT_URL host. Refusing so local DB is not migrated as prod.',
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('matches local')) throw error;
    }
  }
  return { url, host };
}

/**
 * @param {string} output
 * @returns {'up_to_date' | 'pending' | 'blocked' | 'unknown'}
 */
export function classifyMigrateStatusOutput(output) {
  const text = output.toLowerCase();
  if (text.includes('have not yet been applied')) return 'pending';
  if (text.includes('database schema is up to date')) return 'up_to_date';
  if (
    text.includes('drift') ||
    text.includes('failed migration') ||
    text.includes('migration failed')
  ) {
    return 'blocked';
  }
  return 'unknown';
}
