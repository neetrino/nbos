import { describe, expect, it } from 'vitest';
import {
  AtsRecordingPermanentError,
  AtsRecordingTransientError,
} from './ats-call-recording.errors';
import { createRecordingPolicy } from './ats-recording-ssrf.test-support';
import { ATS_RECORDING_PUBLIC_IPV4 } from './ats-recording-ssrf.test-support';

describe('AtsRecordingUrlPolicy', () => {
  it('pins public addresses for an allowlisted HTTPS URL', async () => {
    const policy = createRecordingPolicy();
    const target = await policy.validate('https://account.ats.am/r.wav?token=secret');
    expect(target.hostname).toBe('account.ats.am');
    expect(target.pinnedAddresses).toEqual([ATS_RECORDING_PUBLIC_IPV4]);
    expect(target.url.searchParams.get('token')).toBe('secret');
  });

  it('denies a private resolved IP before any HTTP hop', async () => {
    const policy = createRecordingPolicy({
      resolve: async () => ['127.0.0.1'],
    });
    await expect(policy.validate('https://account.ats.am/r.wav')).rejects.toBeInstanceOf(
      AtsRecordingPermanentError,
    );
    await expect(policy.validate('https://account.ats.am/r.wav')).rejects.toThrow(/private_ip/);
  });

  it('denies mixed public and private answers', async () => {
    const policy = createRecordingPolicy({
      resolve: async () => ['8.8.8.8', '10.0.0.1'],
    });
    await expect(policy.validate('https://account.ats.am/r.wav')).rejects.toThrow(/private_ip/);
  });

  it('fails closed on DNS failure', async () => {
    const policy = createRecordingPolicy({
      resolve: async () => {
        throw new AtsRecordingTransientError('recording url rejected (dns_failed)');
      },
    });
    await expect(policy.validate('https://account.ats.am/r.wav')).rejects.toBeInstanceOf(
      AtsRecordingTransientError,
    );
  });

  it('fails closed on empty DNS results', async () => {
    const policy = createRecordingPolicy({
      resolve: async () => {
        throw new AtsRecordingTransientError('recording url rejected (dns_empty)');
      },
    });
    await expect(policy.validate('https://account.ats.am/r.wav')).rejects.toThrow(/dns_empty/);
  });

  it('validates relative redirects against the current allowlisted URL', async () => {
    const policy = createRecordingPolicy();
    const current = new URL('https://account.ats.am/old/path.wav');
    const target = await policy.validate('/new/path.wav', current);
    expect(target.url.href).toBe('https://account.ats.am/new/path.wav');
    expect(target.hostname).toBe('account.ats.am');
  });
});
