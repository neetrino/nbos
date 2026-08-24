import { readFile, unlink } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ATS_CALL_RECORDING_MAX_BYTES } from './ats-call-recording.constants';
import { AtsRecordingPermanentError } from './ats-call-recording.errors';
import { AtsRecordingSafeDownloadService } from './ats-recording-safe-download.service';
import {
  ATS_RECORDING_EXTRA_HOST,
  ATS_RECORDING_PUBLIC_IPV4,
  ATS_RECORDING_PUBLIC_IPV6,
  ATS_RECORDING_SECRET_TOKEN,
  collectLoggerOutput,
  createRecordingPolicy,
  createScriptedTransport,
  expectNoRecordingSecret,
  tokenizedAtsRecordingUrl,
} from './ats-recording-ssrf.test-support';

describe('AtsRecordingSafeDownloadService', () => {
  const tmpPaths: string[] = [];

  afterEach(async () => {
    await Promise.all(tmpPaths.splice(0).map((path) => unlink(path).catch(() => undefined)));
    vi.restoreAllMocks();
  });

  it('downloads a valid allowlisted recording without logging the tokenized URL', async () => {
    const logs = collectLoggerOutput('warn');
    const transport = createScriptedTransport([
      { status: 200, headers: { 'content-type': 'audio/wav' } },
    ]);
    const service = new AtsRecordingSafeDownloadService(
      createRecordingPolicy(),
      transport as never,
    );

    const result = await service.download(tokenizedAtsRecordingUrl(), 'ats-record-link');
    tmpPaths.push(result.tmpPath);

    expect(transport.calls[0]?.pinnedAddresses).toEqual([ATS_RECORDING_PUBLIC_IPV4]);
    expect(transport.calls[0]?.hostname).toBe('account.ats.am');
    expect(await readFile(result.tmpPath)).toEqual(Buffer.from('RIFF'));
    expectNoRecordingSecret(logs.texts);
    logs.restore();
  });

  it('denies a disallowed URL before transport, body, or temp file access', async () => {
    const unread = unreadGuard();
    const transport = createScriptedTransport([
      { status: 200, body: unread.body, headers: { 'content-type': 'audio/wav' } },
    ]);
    const service = new AtsRecordingSafeDownloadService(
      createRecordingPolicy(),
      transport as never,
    );

    await expect(
      service.download('http://account.ats.am/r.wav?token=super-secret-recording-token', 'src'),
    ).rejects.toBeInstanceOf(AtsRecordingPermanentError);
    expect(transport.calls).toHaveLength(0);
    expect(unread.wasRead()).toBe(false);
  });

  it('re-validates a relative redirect and then stores the body', async () => {
    const resolve = vi.fn(async () => [ATS_RECORDING_PUBLIC_IPV4]);
    const transport = createScriptedTransport([
      { status: 302, headers: { location: '/files/call.wav' }, body: unreadGuard().body },
      { status: 200, headers: { 'content-type': 'audio/wav' } },
    ]);
    const service = new AtsRecordingSafeDownloadService(
      createRecordingPolicy({ resolve }),
      transport as never,
    );

    const result = await service.download('https://account.ats.am/old.wav', 'src');
    tmpPaths.push(result.tmpPath);

    expect(resolve).toHaveBeenCalledTimes(2);
    expect(transport.calls[1]?.url.pathname).toBe('/files/call.wav');
    expect(transport.calls[1]?.hostname).toBe('account.ats.am');
  });

  it('allows a redirect to another exact allowlisted hostname', async () => {
    const transport = createScriptedTransport([
      {
        status: 302,
        headers: { location: `https://${ATS_RECORDING_EXTRA_HOST}/r.wav` },
      },
      { status: 200, headers: { 'content-type': 'audio/wav' } },
    ]);
    const service = new AtsRecordingSafeDownloadService(
      createRecordingPolicy({ extraHosts: ATS_RECORDING_EXTRA_HOST }),
      transport as never,
    );

    const result = await service.download('https://account.ats.am/start.wav', 'src');
    tmpPaths.push(result.tmpPath);
    expect(transport.calls[1]?.hostname).toBe(ATS_RECORDING_EXTRA_HOST);
    expect(transport.calls[1]?.pinnedAddresses).toEqual([ATS_RECORDING_PUBLIC_IPV6]);
  });

  it('denies a redirect to a private IP without reading the body', async () => {
    const unread = unreadGuard();
    const transport = createScriptedTransport([
      {
        status: 302,
        headers: { location: 'https://127.0.0.1/r.wav' },
        body: unread.body,
      },
    ]);
    const service = new AtsRecordingSafeDownloadService(
      createRecordingPolicy(),
      transport as never,
    );

    await expect(service.download('https://account.ats.am/start.wav', 'src')).rejects.toThrow(
      /ip_literal/,
    );
    expect(transport.calls).toHaveLength(1);
    expect(unread.wasRead()).toBe(false);
  });

  it('denies a redirect whose hostname resolves to a private address', async () => {
    const transport = createScriptedTransport([
      {
        status: 302,
        headers: { location: `https://${ATS_RECORDING_EXTRA_HOST}/r.wav` },
      },
    ]);
    const service = new AtsRecordingSafeDownloadService(
      createRecordingPolicy({
        extraHosts: ATS_RECORDING_EXTRA_HOST,
        resolve: async (hostname) =>
          hostname === ATS_RECORDING_EXTRA_HOST ? ['127.0.0.1'] : [ATS_RECORDING_PUBLIC_IPV4],
      }),
      transport as never,
    );

    await expect(service.download('https://account.ats.am/start.wav', 'src')).rejects.toThrow(
      /private_ip/,
    );
    expect(transport.calls).toHaveLength(1);
  });

  it('denies an HTTP redirect', async () => {
    const transport = createScriptedTransport([
      { status: 302, headers: { location: 'http://account.ats.am/r.wav' } },
    ]);
    const service = new AtsRecordingSafeDownloadService(
      createRecordingPolicy(),
      transport as never,
    );
    await expect(service.download('https://account.ats.am/start.wav', 'src')).rejects.toThrow(
      /scheme/,
    );
  });

  it('denies a redirect loop', async () => {
    const transport = createScriptedTransport([
      { status: 302, headers: { location: 'https://account.ats.am/loop.wav' } },
      { status: 302, headers: { location: 'https://account.ats.am/loop.wav' } },
    ]);
    const service = new AtsRecordingSafeDownloadService(
      createRecordingPolicy(),
      transport as never,
    );
    await expect(service.download('https://account.ats.am/loop.wav', 'src')).rejects.toThrow(
      /redirect_loop/,
    );
  });

  it('denies when the redirect limit is exceeded', async () => {
    const transport = createScriptedTransport([
      { status: 302, headers: { location: 'https://account.ats.am/a.wav' } },
      { status: 302, headers: { location: 'https://account.ats.am/b.wav' } },
      { status: 302, headers: { location: 'https://account.ats.am/c.wav' } },
      { status: 302, headers: { location: 'https://account.ats.am/d.wav' } },
    ]);
    const service = new AtsRecordingSafeDownloadService(
      createRecordingPolicy(),
      transport as never,
    );
    await expect(service.download('https://account.ats.am/start.wav', 'src')).rejects.toThrow(
      /redirect_limit/,
    );
    expect(transport.calls).toHaveLength(4);
  });

  it('denies a redirect without Location', async () => {
    const transport = createScriptedTransport([{ status: 302 }]);
    const service = new AtsRecordingSafeDownloadService(
      createRecordingPolicy(),
      transport as never,
    );
    await expect(service.download('https://account.ats.am/start.wav', 'src')).rejects.toThrow(
      /redirect_missing_location/,
    );
  });

  it('rejects an oversized Content-Length before reading the body', async () => {
    const unread = unreadGuard();
    const transport = createScriptedTransport([
      {
        status: 200,
        headers: {
          'content-type': 'audio/wav',
          'content-length': String(ATS_CALL_RECORDING_MAX_BYTES + 1),
        },
        body: unread.body,
      },
    ]);
    const service = new AtsRecordingSafeDownloadService(
      createRecordingPolicy(),
      transport as never,
    );
    await expect(service.download('https://account.ats.am/r.wav', 'src')).rejects.toThrow(
      /size limit/,
    );
    expect(unread.wasRead()).toBe(false);
  });

  it('stores ATS octet-stream recordings as audio/mpeg from Content-Disposition', async () => {
    const transport = createScriptedTransport([
      {
        status: 200,
        headers: {
          'content-type': 'application/octet-stream',
          'content-disposition': 'attachment; filename=1787580255.177871.mp3',
        },
        body: Readable.from([Buffer.from('not-a-sniffable-prefix')]),
      },
    ]);
    const service = new AtsRecordingSafeDownloadService(
      createRecordingPolicy(),
      transport as never,
    );

    const result = await service.download('https://account.ats.am/call-record', 'ats-call-record');
    tmpPaths.push(result.tmpPath);
    expect(result.mimeType).toBe('audio/mpeg');
  });
});

function unreadGuard(): { body: Readable; wasRead: () => boolean } {
  let wasRead = false;
  const body = new Readable({
    read() {
      wasRead = true;
      this.push(Buffer.from(ATS_RECORDING_SECRET_TOKEN));
      this.push(null);
    },
  });
  return { body, wasRead: () => wasRead };
}
