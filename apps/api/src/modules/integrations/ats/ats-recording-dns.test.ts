import { beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as dns } from 'node:dns';
import { NodeAtsRecordingDnsResolver } from './ats-recording-dns';
import { AtsRecordingTransientError } from './ats-call-recording.errors';

vi.mock('node:dns', async () => {
  const actual = await vi.importActual<typeof import('node:dns')>('node:dns');
  return {
    ...actual,
    promises: {
      ...actual.promises,
      resolve4: vi.fn(),
      resolve6: vi.fn(),
    },
  };
});

describe('NodeAtsRecordingDnsResolver', () => {
  const resolver = new NodeAtsRecordingDnsResolver();

  beforeEach(() => {
    vi.mocked(dns.resolve4).mockReset();
    vi.mocked(dns.resolve6).mockReset();
  });

  it('returns all A and AAAA addresses', async () => {
    vi.mocked(dns.resolve4).mockResolvedValue(['8.8.8.8']);
    vi.mocked(dns.resolve6).mockResolvedValue(['2001:4860:4860::8888']);
    await expect(resolver.resolveAll('account.ats.am')).resolves.toEqual([
      '8.8.8.8',
      '2001:4860:4860::8888',
    ]);
  });

  it('treats ENODATA on one family as empty for that family', async () => {
    vi.mocked(dns.resolve4).mockResolvedValue(['8.8.8.8']);
    vi.mocked(dns.resolve6).mockRejectedValue(
      Object.assign(new Error('nodata'), { code: 'ENODATA' }),
    );
    await expect(resolver.resolveAll('account.ats.am')).resolves.toEqual(['8.8.8.8']);
  });

  it('fails closed on empty DNS results', async () => {
    vi.mocked(dns.resolve4).mockRejectedValue(
      Object.assign(new Error('nx'), { code: 'ENOTFOUND' }),
    );
    vi.mocked(dns.resolve6).mockRejectedValue(Object.assign(new Error('nx'), { code: 'ENODATA' }));
    await expect(resolver.resolveAll('account.ats.am')).rejects.toBeInstanceOf(
      AtsRecordingTransientError,
    );
    await expect(resolver.resolveAll('account.ats.am')).rejects.toThrow(/dns_empty/);
  });

  it('fails closed on a DNS server error even if the other family succeeded', async () => {
    vi.mocked(dns.resolve4).mockRejectedValue(
      Object.assign(new Error('servfail'), { code: 'ESERVFAIL' }),
    );
    vi.mocked(dns.resolve6).mockResolvedValue(['2001:4860:4860::8888']);
    await expect(resolver.resolveAll('account.ats.am')).rejects.toThrow(/dns_failed/);
  });
});
