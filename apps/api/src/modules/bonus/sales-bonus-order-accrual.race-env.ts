import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEV_HOST_PREFIX = 'ep-nameless-term';
const PROD_HOST_TOKEN = 'sweet-dew';
const DATABASE_URL_KEY = 'DATABASE_URL=';
const EXPORT_PREFIX = 'export ';
const ENV_FILE_NAME = '.env.local';

/** DATABASE_URL from repo `.env.local` only when the host is the guarded dev branch. */
export function guardedNamelessTermDatabaseUrl(): string | null {
  const envPath = resolveEnvLocalPath();
  if (!envPath) {
    return null;
  }
  const url = parseDatabaseUrlLine(readFileSync(envPath, 'utf8'));
  if (!url) {
    return null;
  }
  return isGuardedDevHost(url) ? url : null;
}

function resolveEnvLocalPath(): string | null {
  const candidates = [
    resolve(process.cwd(), ENV_FILE_NAME),
    resolve(process.cwd(), '..', ENV_FILE_NAME),
    resolve(process.cwd(), '../..', ENV_FILE_NAME),
  ];
  return candidates.find((path) => existsSync(path)) ?? null;
}

function parseDatabaseUrlLine(fileText: string): string | null {
  for (const raw of fileText.split(/\r?\n/)) {
    const line = unwrapExport(raw.trim());
    if (!line.startsWith(DATABASE_URL_KEY)) {
      continue;
    }
    const value = unwrapQuotes(line.slice(DATABASE_URL_KEY.length).trim());
    return value.length > 0 ? value : null;
  }
  return null;
}

function unwrapExport(line: string): string {
  if (line.startsWith('#') || line.length === 0) {
    return '';
  }
  return line.startsWith(EXPORT_PREFIX) ? line.slice(EXPORT_PREFIX.length).trim() : line;
}

function unwrapQuotes(value: string): string {
  const quote = value.at(0);
  if ((quote === '"' || quote === "'") && value.at(-1) === quote) {
    return value.slice(1, -1);
  }
  return value;
}

function isGuardedDevHost(url: string): boolean {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return false;
  }
  if (host.includes(PROD_HOST_TOKEN)) {
    return false;
  }
  return host.startsWith(DEV_HOST_PREFIX);
}
