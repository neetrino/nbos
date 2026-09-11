import { Socket } from 'node:net';
import { REGISTRY_LOOKUP_TIMEOUT_MS, WHOIS_PORT } from './domain-registry.constants';
import { isWhoisNotFound, parseWhoisExpiryDate } from './expiry-parse';
import type { RegistryLookupRaw } from './domain-registry.types';

export async function queryWhois(
  domain: string,
  host: string,
  timeoutMs: number = REGISTRY_LOOKUP_TIMEOUT_MS,
): Promise<RegistryLookupRaw> {
  const text = await readWhoisSocket(host, `${domain}\r\n`, timeoutMs);
  if (isWhoisNotFound(text) && !parseWhoisExpiryDate(text)) {
    return { status: 'NOT_FOUND', expiryDate: null, source: 'WHOIS' };
  }
  const expiryDate = parseWhoisExpiryDate(text);
  if (expiryDate) return { status: 'OBSERVED', expiryDate, source: 'WHOIS' };
  if (looksRegistered(text)) return { status: 'NO_EXPIRY', expiryDate: null, source: 'WHOIS' };
  return { status: 'FAILED', expiryDate: null, source: 'WHOIS' };
}

function looksRegistered(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('domain name:') ||
    lower.includes('domain:') ||
    lower.includes('status: active') ||
    lower.includes('status: ok')
  );
}

function readWhoisSocket(host: string, query: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`WHOIS timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    socket.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    socket.on('data', (chunk) => chunks.push(chunk));
    socket.once('end', () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    socket.connect(WHOIS_PORT, host, () => socket.end(query));
  });
}
