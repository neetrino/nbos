import { StreamableFile } from '@nestjs/common';
import { PassThrough, Readable } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';
import {
  fullRecordingHeaders,
  partialRecordingHeaders,
  sendRecordingPlayback,
} from './calls-recording-playback';

describe('recording playback headers', () => {
  it('builds a full 200 contract', () => {
    expect(fullRecordingHeaders('audio/mpeg', 34776)).toEqual({
      'Content-Type': 'audio/mpeg',
      'Content-Length': '34776',
      'Accept-Ranges': 'bytes',
      'Content-Disposition': 'inline',
    });
  });

  it('builds a partial 206 contract', () => {
    expect(partialRecordingHeaders('audio/mpeg', 100, 199, 34776)).toEqual({
      'Content-Type': 'audio/mpeg',
      'Content-Length': '100',
      'Accept-Ranges': 'bytes',
      'Content-Range': 'bytes 100-199/34776',
      'Content-Disposition': 'inline',
    });
  });

  it('sends 416 with bytes */total and no body stream', () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      end: vi.fn(),
    };
    sendRecordingPlayback(res as never, { kind: 'unsatisfiable', totalSize: 34776 });
    expect(res.status).toHaveBeenCalledWith(416);
    expect(res.setHeader).toHaveBeenCalledWith('Accept-Ranges', 'bytes');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Range', 'bytes */34776');
    expect(res.end).toHaveBeenCalled();
  });

  it('pipes a stream after setting 206 headers', async () => {
    const dest = new PassThrough();
    const chunks: Buffer[] = [];
    dest.on('data', (chunk: Buffer) => chunks.push(chunk));
    const finished = new Promise<void>((resolve) => dest.on('finish', () => resolve()));
    const res = Object.assign(dest, {
      status: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      headersSent: false,
    });
    sendRecordingPlayback(res as never, {
      kind: 'stream',
      status: 206,
      headers: partialRecordingHeaders('audio/mpeg', 0, 1, 5),
      file: new StreamableFile(Readable.from(['ab']), { type: 'audio/mpeg', length: 2 }),
    });
    await finished;
    expect(res.status).toHaveBeenCalledWith(206);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Range', 'bytes 0-1/5');
    expect(Buffer.concat(chunks).toString()).toBe('ab');
  });
});
