const DEV_HOST_TOKEN = 'nameless-term';
const PROD_HOST_TOKEN = 'sweet-dew';

/**
 * Delivery seed/publish and the kinds migration may only touch the agreed Neon
 * development branch. Production (`sweet-dew`) is refused.
 */
export function assertDevDatabaseUrl(url: string | undefined, label: string): string {
  if (!url) {
    throw new Error(`${label} is missing. Refusing to run against an unknown database.`);
  }
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error(`${label} is not a valid URL.`);
  }
  if (host.includes(PROD_HOST_TOKEN)) {
    throw new Error(`${label} points at production (${PROD_HOST_TOKEN}). Refusing.`);
  }
  if (!host.includes(DEV_HOST_TOKEN)) {
    throw new Error(`${label} host is ${host}, expected the ${DEV_HOST_TOKEN} development branch.`);
  }
  return host;
}
