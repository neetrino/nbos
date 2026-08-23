import { Injectable } from '@nestjs/common';
import { promises as dns } from 'node:dns';
import { AtsRecordingTransientError } from './ats-call-recording.errors';

export interface AtsRecordingDnsResolver {
  resolveAll(hostname: string): Promise<string[]>;
}

const NO_DATA_CODES = new Set(['ENODATA', 'ENOTFOUND', 'ENOTIMP']);

@Injectable()
export class NodeAtsRecordingDnsResolver implements AtsRecordingDnsResolver {
  async resolveAll(hostname: string): Promise<string[]> {
    const [v4, v6] = await Promise.all([
      resolveFamily(() => dns.resolve4(hostname)),
      resolveFamily(() => dns.resolve6(hostname)),
    ]);
    const addresses = [...new Set([...v4, ...v6])];
    if (addresses.length === 0) {
      throw new AtsRecordingTransientError('recording url rejected (dns_empty)');
    }
    return addresses;
  }
}

async function resolveFamily(resolve: () => Promise<string[]>): Promise<string[]> {
  try {
    return await resolve();
  } catch (error) {
    if (isNoDataError(error)) return [];
    throw new AtsRecordingTransientError('recording url rejected (dns_failed)');
  }
}

function isNoDataError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = 'code' in error ? String(error.code) : '';
  return NO_DATA_CODES.has(code);
}
