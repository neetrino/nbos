import { Readable } from 'node:stream';
import { Logger } from '@nestjs/common';
import { vi } from 'vitest';
import type { AtsRecordingTransportRequest } from './ats-recording-http.transport';
import { AtsRecordingUrlPolicy } from './ats-recording-url-policy.service';
import { parseAtsRecordingAllowedHosts } from './ats-recording-url';
import { ATS_RECORDING_DEFAULT_ALLOWED_HOST } from './ats-recording-url.constants';

export const ATS_RECORDING_PUBLIC_IPV4 = '8.8.8.8';
export const ATS_RECORDING_PUBLIC_IPV6 = '2001:4860:4860::8888';
export const ATS_RECORDING_EXTRA_HOST = 'recordings.test.invalid';
export const ATS_RECORDING_SECRET_TOKEN = 'super-secret-recording-token';

export function createRecordingPolicy(options?: {
  extraHosts?: string;
  resolve?: (hostname: string) => Promise<string[]>;
}): AtsRecordingUrlPolicy {
  const hosts = parseAtsRecordingAllowedHosts(options?.extraHosts);
  const resolve =
    options?.resolve ??
    (async (hostname: string) => {
      if (hostname === ATS_RECORDING_DEFAULT_ALLOWED_HOST) {
        return [ATS_RECORDING_PUBLIC_IPV4];
      }
      if (hostname === ATS_RECORDING_EXTRA_HOST) {
        return [ATS_RECORDING_PUBLIC_IPV6];
      }
      return [ATS_RECORDING_PUBLIC_IPV4];
    });
  return new AtsRecordingUrlPolicy(
    { recordingAllowedHosts: hosts } as never,
    { resolveAll: resolve } as never,
  );
}

export function createScriptedTransport(script: readonly FakeRecordingHop[]) {
  const calls: AtsRecordingTransportRequest[] = [];
  return {
    calls,
    request: async (input: AtsRecordingTransportRequest) => {
      calls.push(input);
      const hop = script[calls.length - 1];
      if (!hop) {
        throw new Error('unexpected recording transport hop');
      }
      const headers = hop.headers ?? {};
      return {
        status: hop.status,
        header: (name: string) => headers[name.toLowerCase()] ?? null,
        body: hop.body === undefined ? Readable.from([Buffer.from('RIFF')]) : hop.body,
      };
    },
  };
}

export interface FakeRecordingHop {
  status: number;
  headers?: Record<string, string>;
  body?: Readable | null;
}

export function tokenizedAtsRecordingUrl(hostname = ATS_RECORDING_DEFAULT_ALLOWED_HOST): string {
  return `https://${hostname}/record.wav?token=${ATS_RECORDING_SECRET_TOKEN}`;
}

export function collectLoggerOutput(method: 'warn' | 'error' = 'warn'): {
  texts: string[];
  restore: () => void;
} {
  const texts: string[] = [];
  const spy = vi.spyOn(Logger.prototype, method).mockImplementation((...args: unknown[]) => {
    texts.push(JSON.stringify(args));
  });
  return {
    texts,
    restore: () => spy.mockRestore(),
  };
}

export function expectNoRecordingSecret(texts: readonly string[]): void {
  for (const text of texts) {
    if (text.includes(ATS_RECORDING_SECRET_TOKEN)) {
      throw new Error('recording token leaked into logs');
    }
  }
}
