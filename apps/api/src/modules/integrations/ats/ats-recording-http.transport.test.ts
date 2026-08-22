import { describe, expect, it } from 'vitest';
import { buildAtsRecordingHttpsOptions, createPinnedLookup } from './ats-recording-http.transport';
import {
  ATS_RECORDING_PUBLIC_IPV4,
  ATS_RECORDING_PUBLIC_IPV6,
} from './ats-recording-ssrf.test-support';
import { ATS_RECORDING_HTTPS_PORT } from './ats-recording-url.constants';

describe('ats-recording-http.transport', () => {
  it('pins lookup to validated addresses and keeps SNI on the allowlisted hostname', () => {
    const url = new URL('https://account.ats.am/r.wav?token=secret');
    const options = buildAtsRecordingHttpsOptions({
      url,
      hostname: 'account.ats.am',
      pinnedAddresses: [ATS_RECORDING_PUBLIC_IPV4, ATS_RECORDING_PUBLIC_IPV6],
      timeoutMs: 1_000,
    });

    expect(options.hostname).toBe('account.ats.am');
    expect(options.servername).toBe('account.ats.am');
    expect(options.port).toBe(ATS_RECORDING_HTTPS_PORT);
    expect(options.protocol).toBe('https:');
    expect(options.rejectUnauthorized).toBe(true);
    expect(options.headers).toBeUndefined();

    const lookup = createPinnedLookup([ATS_RECORDING_PUBLIC_IPV4]);
    lookup('169.254.169.254', { all: true }, (err, addresses) => {
      expect(err).toBeNull();
      expect(addresses).toEqual([{ address: ATS_RECORDING_PUBLIC_IPV4, family: 4 }]);
    });
    lookup('evil.example.invalid', {}, (err, address, family) => {
      expect(err).toBeNull();
      expect(address).toBe(ATS_RECORDING_PUBLIC_IPV4);
      expect(family).toBe(4);
    });
  });
});
