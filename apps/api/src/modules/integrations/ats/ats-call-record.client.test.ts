import { Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AtsCallRecordClient } from './ats-call-record.client';
import {
  AtsRecordingPermanentError,
  AtsRecordingTransientError,
} from './ats-call-recording.errors';
import {
  ATS_RECORDING_SECRET_TOKEN,
  expectNoRecordingSecret,
} from './ats-recording-ssrf.test-support';

describe('AtsCallRecordClient', () => {
  it('uses the ATS call-record URL first and falls back without logging the token', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const downloader = {
      download: vi
        .fn()
        .mockRejectedValueOnce(new AtsRecordingTransientError('ats-call-record HTTP 404'))
        .mockResolvedValueOnce({
          tmpPath: '/tmp/rec',
          mimeType: 'audio/wav',
          sizeBytes: 4,
          checksum: 'abc',
        }),
    };
    const client = new AtsCallRecordClient({ apiKey: 'ats-key' } as never, downloader as never);

    const fallback = `https://account.ats.am/r.wav?token=${ATS_RECORDING_SECRET_TOKEN}`;
    await expect(client.downloadRecording('uid-1', fallback)).resolves.toMatchObject({
      tmpPath: '/tmp/rec',
    });
    expect(downloader.download).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('call-record'),
      'ats-call-record',
    );
    expect(downloader.download).toHaveBeenNthCalledWith(2, fallback, 'ats-record-link');
    expectNoRecordingSecret(warn.mock.calls.map((args) => JSON.stringify(args)));
    warn.mockRestore();
  });

  it('does not fall back after a permanent URL policy failure', async () => {
    const downloader = {
      download: vi
        .fn()
        .mockRejectedValue(new AtsRecordingPermanentError('recording url rejected (hostname)')),
    };
    const client = new AtsCallRecordClient({ apiKey: 'ats-key' } as never, downloader as never);

    await expect(
      client.downloadRecording('uid-1', 'https://evil.example.invalid/r.wav'),
    ).rejects.toBeInstanceOf(AtsRecordingPermanentError);
    expect(downloader.download).toHaveBeenCalledTimes(1);
  });
});
