import { BadRequestException } from '@nestjs/common';
import type { AiProviderType } from '@nbos/shared';
import {
  ANTHROPIC_ALLOWED_HOSTS,
  OPENAI_ALLOWED_HOSTS,
  PROVIDER_BASE_URL_MAX_LENGTH,
  PROVIDER_HTTPS_PORT,
} from './ai-provider.constants';

const IPV4_OCTET_COUNT = 4;
const IPV4_OCTET_MAX = 255;
const IPV4_UNSPECIFIED = 0;
const IPV4_LOOPBACK = 127;
const IPV4_RFC1918_10 = 10;
const IPV4_LINK_LOCAL_A = 169;
const IPV4_LINK_LOCAL_B = 254;
const IPV4_CGNAT_A = 100;
const IPV4_CGNAT_B_MIN = 64;
const IPV4_CGNAT_B_MAX = 127;
const IPV4_RFC1918_172 = 172;
const IPV4_RFC1918_172_MIN = 16;
const IPV4_RFC1918_172_MAX = 31;
const IPV4_RFC1918_192 = 192;
const IPV4_RFC1918_192_B = 168;
const IPV6_LINK_LOCAL_MIN = 0xfe80;
const IPV6_LINK_LOCAL_MAX = 0xfebf;
const IPV6_UNIQUE_LOCAL_MASK = 0xfe00;
const IPV6_UNIQUE_LOCAL_PREFIX = 0xfc00;

export function allowedHostsForProvider(provider: AiProviderType): readonly string[] {
  return provider === 'OPENAI' ? OPENAI_ALLOWED_HOSTS : ANTHROPIC_ALLOWED_HOSTS;
}

export function normalizeOptionalBaseUrl(
  value: string | null | undefined,
  provider: AiProviderType,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > PROVIDER_BASE_URL_MAX_LENGTH) {
    throw new BadRequestException(`baseUrl exceeds ${PROVIDER_BASE_URL_MAX_LENGTH} characters`);
  }
  const parsed = parseHttpsProviderUrl(trimmed);
  assertSafeProviderDestination(parsed, provider);
  return trimmed.replace(/\/+$/, '');
}

export function assertSafeProviderRequestUrl(url: string, provider: AiProviderType): URL {
  const parsed = parseHttpsProviderUrl(url);
  assertSafeProviderDestination(parsed, provider);
  return parsed;
}

function parseHttpsProviderUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    throw new BadRequestException('Provider URL is not a valid URL');
  }
}

function assertSafeProviderDestination(parsed: URL, provider: AiProviderType): void {
  if (parsed.protocol !== 'https:') {
    throw new BadRequestException('Provider URL must use HTTPS');
  }
  if (parsed.username || parsed.password) {
    throw new BadRequestException('Provider URL must not include userinfo');
  }
  if (parsed.port && parsed.port !== String(PROVIDER_HTTPS_PORT)) {
    throw new BadRequestException('Provider URL must use the default HTTPS port');
  }
  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (isBlockedHostname(hostname)) {
    throw new BadRequestException('Provider URL host is not allowed');
  }
  if (!allowedHostsForProvider(provider).includes(hostname)) {
    throw new BadRequestException('Provider URL host is not on the provider allowlist');
  }
}

function isBlockedHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return true;
  }
  const ipv6 = unwrapIpv6(hostname);
  if (ipv6) {
    return isBlockedIpv6(ipv6);
  }
  const ipv4 = parseIpv4(hostname);
  return ipv4 !== null && isBlockedIpv4(ipv4);
}

function unwrapIpv6(hostname: string): string | null {
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    return hostname.slice(1, -1).toLowerCase();
  }
  return hostname.includes(':') ? hostname.toLowerCase() : null;
}

function parseIpv4(hostname: string): number[] | null {
  const parts = hostname.split('.');
  if (parts.length !== IPV4_OCTET_COUNT) {
    return null;
  }
  const octets: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return null;
    }
    const value = Number(part);
    if (value > IPV4_OCTET_MAX) {
      return null;
    }
    octets.push(value);
  }
  return octets;
}

function isBlockedIpv4(octets: number[]): boolean {
  const first = octets[0] ?? 0;
  const second = octets[1] ?? 0;
  if (first === IPV4_UNSPECIFIED || first === IPV4_LOOPBACK || first === IPV4_RFC1918_10) {
    return true;
  }
  if (first === IPV4_LINK_LOCAL_A && second === IPV4_LINK_LOCAL_B) {
    return true;
  }
  if (first === IPV4_CGNAT_A && second >= IPV4_CGNAT_B_MIN && second <= IPV4_CGNAT_B_MAX) {
    return true;
  }
  if (
    first === IPV4_RFC1918_172 &&
    second >= IPV4_RFC1918_172_MIN &&
    second <= IPV4_RFC1918_172_MAX
  ) {
    return true;
  }
  return first === IPV4_RFC1918_192 && second === IPV4_RFC1918_192_B;
}

function isBlockedIpv6(address: string): boolean {
  if (address === '::1' || address === '0:0:0:0:0:0:0:1') {
    return true;
  }
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped?.[1]) {
    const ipv4 = parseIpv4(mapped[1]);
    return ipv4 !== null && isBlockedIpv4(ipv4);
  }
  const first = Number.parseInt(address.split(':')[0] ?? '', 16);
  if (Number.isNaN(first)) {
    return true;
  }
  if (first >= IPV6_LINK_LOCAL_MIN && first <= IPV6_LINK_LOCAL_MAX) {
    return true;
  }
  return (first & IPV6_UNIQUE_LOCAL_MASK) === IPV6_UNIQUE_LOCAL_PREFIX;
}
