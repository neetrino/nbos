import { describe, expect, it } from 'vitest';
import { AtsRecordingPermanentError } from './ats-call-recording.errors';
import { assertAtsRecordingResolvedIps, isAtsRecordingPublicIp } from './ats-recording-ip';

describe('ats-recording-ip', () => {
  it('allows public IPv4 and IPv6', () => {
    expect(isAtsRecordingPublicIp('8.8.8.8')).toBe(true);
    expect(isAtsRecordingPublicIp('1.1.1.1')).toBe(true);
    expect(isAtsRecordingPublicIp('2001:4860:4860::8888')).toBe(true);
    assertAtsRecordingResolvedIps(['8.8.8.8', '2001:4860:4860::8888']);
  });

  it.each([
    ['127.0.0.1', 'loopback'],
    ['0.0.0.0', 'unspecified'],
    ['10.1.2.3', 'private'],
    ['172.16.0.1', 'private'],
    ['192.168.1.1', 'private'],
    ['169.254.1.1', 'link-local'],
    ['169.254.169.254', 'metadata'],
    ['100.64.0.1', 'cgnat'],
    ['224.0.0.1', 'multicast'],
    ['192.0.2.1', 'documentation'],
    ['198.18.0.1', 'benchmark'],
    ['240.0.0.1', 'reserved'],
    ['::1', 'ipv6-loopback'],
    ['::', 'ipv6-unspecified'],
    ['fe80::1', 'ipv6-link-local'],
    ['fc00::1', 'ipv6-unique-local'],
    ['fd00:ec2::254', 'ipv6-metadata'],
    ['ff02::1', 'ipv6-multicast'],
    ['2001:db8::1', 'ipv6-documentation'],
    ['::ffff:127.0.0.1', 'ipv4-mapped-loopback'],
    ['::ffff:8.8.8.8', 'ipv4-mapped-public'],
  ])('denies %s (%s)', (address) => {
    expect(isAtsRecordingPublicIp(address)).toBe(false);
  });

  it('denies mixed public and private DNS answers', () => {
    expect(() => assertAtsRecordingResolvedIps(['8.8.8.8', '10.0.0.1'])).toThrow(
      AtsRecordingPermanentError,
    );
    expect(() => assertAtsRecordingResolvedIps(['8.8.8.8', '::ffff:10.0.0.1'])).toThrow(
      AtsRecordingPermanentError,
    );
  });

  it('denies unparseable addresses', () => {
    expect(isAtsRecordingPublicIp('not-an-ip')).toBe(false);
    expect(isAtsRecordingPublicIp('')).toBe(false);
  });
});
