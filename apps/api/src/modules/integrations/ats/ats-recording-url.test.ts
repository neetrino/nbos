import { describe, expect, it } from 'vitest';
import { AtsRecordingPermanentError } from './ats-call-recording.errors';
import {
  assertAtsRecordingHostnameAllowed,
  parseAtsRecordingAllowedHosts,
  parseAtsRecordingUrl,
} from './ats-recording-url';
import {
  ATS_RECORDING_DEFAULT_ALLOWED_HOST,
  ATS_RECORDING_MAX_URL_LENGTH,
} from './ats-recording-url.constants';

const ALLOWED = [ATS_RECORDING_DEFAULT_ALLOWED_HOST];

describe('ats-recording-url', () => {
  it('accepts a valid HTTPS allowlisted URL', () => {
    const url = parseAtsRecordingUrl('https://account.ats.am/docs/api/v1/call-record?uid=1');
    assertAtsRecordingHostnameAllowed(url.hostname, ALLOWED);
    expect(url.hostname).toBe('account.ats.am');
    expect(url.protocol).toBe('https:');
  });

  it.each(['http://account.ats.am/r.wav', 'file:///etc/passwd', 'ftp://account.ats.am/r.wav'])(
    'rejects non-https scheme %s',
    (raw) => {
      expect(() => parseAtsRecordingUrl(raw)).toThrow(AtsRecordingPermanentError);
      expect(() => parseAtsRecordingUrl(raw)).toThrow(/scheme/);
    },
  );

  it('rejects credentials in the userinfo', () => {
    expect(() => parseAtsRecordingUrl('https://user:pass@account.ats.am/r.wav')).toThrow(
      /credentials/,
    );
  });

  it('rejects a non-443 port', () => {
    expect(() => parseAtsRecordingUrl('https://account.ats.am:444/r.wav')).toThrow(/port/);
  });

  it('allows an explicit 443 port', () => {
    const url = parseAtsRecordingUrl('https://account.ats.am:443/r.wav');
    expect(url.hostname).toBe('account.ats.am');
  });

  it('rejects an unknown hostname', () => {
    const url = parseAtsRecordingUrl('https://evil.example.invalid/r.wav');
    expect(() => assertAtsRecordingHostnameAllowed(url.hostname, ALLOWED)).toThrow(/hostname/);
  });

  it('does not allow an allowlist suffix bypass', () => {
    const url = parseAtsRecordingUrl('https://evilats.am/r.wav');
    expect(() => assertAtsRecordingHostnameAllowed(url.hostname, ALLOWED)).toThrow(/hostname/);
    const nested = parseAtsRecordingUrl('https://account.ats.am.evil.example.invalid/r.wav');
    expect(() => assertAtsRecordingHostnameAllowed(nested.hostname, ALLOWED)).toThrow(/hostname/);
  });

  it('rejects a malformed URL', () => {
    expect(() => parseAtsRecordingUrl('not a url')).toThrow(/malformed/);
    expect(() => parseAtsRecordingUrl('')).toThrow(/malformed/);
    expect(() => parseAtsRecordingUrl('https://')).toThrow(/malformed/);
  });

  it('normalizes trailing dots and hostname case', () => {
    const url = parseAtsRecordingUrl('https://Account.ATS.AM./record.wav');
    expect(url.hostname).toBe('account.ats.am');
    assertAtsRecordingHostnameAllowed(url.hostname, ALLOWED);
  });

  it.each([
    'https://127.0.0.1/r.wav',
    'https://8.8.8.8/r.wav',
    'https://[::1]/r.wav',
    'https://[::ffff:8.8.8.8]/r.wav',
    'https://169.254.169.254/r.wav',
  ])('rejects IP literal %s', (raw) => {
    expect(() => parseAtsRecordingUrl(raw)).toThrow(/ip_literal/);
  });

  it('rejects an overlong URL', () => {
    const raw = `https://account.ats.am/${'a'.repeat(ATS_RECORDING_MAX_URL_LENGTH)}`;
    expect(() => parseAtsRecordingUrl(raw)).toThrow(/malformed/);
  });

  it('parses extra allowlist hosts as exact names only', () => {
    const hosts = parseAtsRecordingAllowedHosts(
      'Recordings.TEST.invalid., *.ats.am, http://evil.example, 8.8.8.8, account.ats.am',
    );
    expect(hosts).toEqual(['account.ats.am', 'recordings.test.invalid']);
  });
});
