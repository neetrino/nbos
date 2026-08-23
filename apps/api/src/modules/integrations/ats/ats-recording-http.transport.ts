import { request as httpsRequest, type RequestOptions } from 'node:https';
import { isIP, type LookupFunction } from 'node:net';
import type { IncomingMessage } from 'node:http';
import type { LookupAddress } from 'node:dns';
import type { Readable } from 'node:stream';
import { Injectable } from '@nestjs/common';
import { AtsRecordingTransientError } from './ats-call-recording.errors';
import { ATS_RECORDING_HTTPS_PORT } from './ats-recording-url.constants';
import type { AtsRecordingValidatedTarget } from './ats-recording-url-policy.service';

export interface AtsRecordingTransportRequest extends AtsRecordingValidatedTarget {
  timeoutMs: number;
}

export interface AtsRecordingTransportResponse {
  status: number;
  header(name: string): string | null;
  body: Readable | null;
}

@Injectable()
export class AtsRecordingHttpTransport {
  request(input: AtsRecordingTransportRequest): Promise<AtsRecordingTransportResponse> {
    return new Promise((resolve, reject) => {
      const req = httpsRequest(buildAtsRecordingHttpsOptions(input), (res) => {
        resolve(wrapHttpsResponse(res));
      });
      req.setTimeout(input.timeoutMs, () => {
        req.destroy();
        reject(new AtsRecordingTransientError('recording http timeout'));
      });
      req.on('error', () => {
        reject(new AtsRecordingTransientError('recording http network'));
      });
      req.end();
    });
  }
}

export function buildAtsRecordingHttpsOptions(input: AtsRecordingTransportRequest): RequestOptions {
  return {
    protocol: 'https:',
    method: 'GET',
    hostname: input.hostname,
    port: ATS_RECORDING_HTTPS_PORT,
    path: `${input.url.pathname}${input.url.search}`,
    servername: input.hostname,
    lookup: createPinnedLookup(input.pinnedAddresses),
    timeout: input.timeoutMs,
    rejectUnauthorized: true,
  };
}

export function createPinnedLookup(addresses: readonly string[]): LookupFunction {
  const records = toLookupRecords(addresses);
  const lookup = ((
    hostname: string,
    options: { all?: boolean } | undefined,
    callback: (err: Error | null, address?: string | LookupAddress[], family?: number) => void,
  ) => {
    void hostname;
    if (records.length === 0) {
      callback(new Error('recording dns empty'));
      return;
    }
    if (options?.all) {
      callback(null, records);
      return;
    }
    callback(null, records[0].address, records[0].family);
  }) as LookupFunction;
  return lookup;
}

function toLookupRecords(addresses: readonly string[]): LookupAddress[] {
  return addresses.flatMap((address) => {
    const family = isIP(address);
    if (family !== 4 && family !== 6) return [];
    return [{ address, family }];
  });
}

function wrapHttpsResponse(res: IncomingMessage): AtsRecordingTransportResponse {
  return {
    status: res.statusCode ?? 0,
    header(name: string): string | null {
      const value = res.headers[name.toLowerCase()];
      if (Array.isArray(value)) return value[0] ?? null;
      return value ?? null;
    },
    body: res,
  };
}
