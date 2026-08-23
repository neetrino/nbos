import ipaddr from 'ipaddr.js';
import { AtsRecordingPermanentError } from './ats-call-recording.errors';

/**
 * Allow only public global-unicast addresses. IPv4-mapped IPv6 and every
 * special range classified by ipaddr.js are denied (fail-closed).
 */
export function isAtsRecordingPublicIp(address: string): boolean {
  let parsed: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    parsed = ipaddr.parse(address);
  } catch {
    return false;
  }
  if (parsed.kind() === 'ipv6') {
    const ipv6 = parsed as ipaddr.IPv6;
    if (ipv6.isIPv4MappedAddress()) {
      return false;
    }
  }
  return parsed.range() === 'unicast';
}

export function assertAtsRecordingResolvedIps(addresses: readonly string[]): void {
  if (addresses.some((address) => !isAtsRecordingPublicIp(address))) {
    throw new AtsRecordingPermanentError('recording url rejected (private_ip)');
  }
}
