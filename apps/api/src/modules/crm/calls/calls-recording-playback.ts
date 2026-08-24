import { HttpStatus, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import type { Readable } from 'node:stream';
import {
  RECORDING_ACCEPT_RANGES,
  RECORDING_INLINE_DISPOSITION,
  recordingContentRange,
  unsatisfiableContentRange,
  type RecordingPlaybackResult,
} from './calls-recording-range';

export function recordingStreamFile(body: Readable, mime: string, length: number): StreamableFile {
  return new StreamableFile(body, {
    type: mime,
    disposition: RECORDING_INLINE_DISPOSITION,
    length,
  });
}

export function fullRecordingHeaders(mime: string, totalSize: number): Record<string, string> {
  return {
    'Content-Type': mime,
    'Content-Length': String(totalSize),
    'Accept-Ranges': RECORDING_ACCEPT_RANGES,
    'Content-Disposition': RECORDING_INLINE_DISPOSITION,
  };
}

export function partialRecordingHeaders(
  mime: string,
  start: number,
  end: number,
  totalSize: number,
): Record<string, string> {
  return {
    'Content-Type': mime,
    'Content-Length': String(end - start + 1),
    'Accept-Ranges': RECORDING_ACCEPT_RANGES,
    'Content-Range': recordingContentRange(start, end, totalSize),
    'Content-Disposition': RECORDING_INLINE_DISPOSITION,
  };
}

export function sendRecordingPlayback(res: Response, result: RecordingPlaybackResult): void {
  if (result.kind === 'unsatisfiable') {
    sendUnsatisfiableRange(res, result.totalSize);
    return;
  }
  res.status(result.status);
  for (const [key, value] of Object.entries(result.headers)) {
    res.setHeader(key, value);
  }
  pipeRecordingStream(res, result.file.getStream());
}

function sendUnsatisfiableRange(res: Response, totalSize: number): void {
  res.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE);
  res.setHeader('Accept-Ranges', RECORDING_ACCEPT_RANGES);
  res.setHeader('Content-Range', unsatisfiableContentRange(totalSize));
  res.end();
}

function pipeRecordingStream(res: Response, stream: Readable): void {
  stream.on('error', () => {
    if (!res.headersSent) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    }
    res.end();
  });
  stream.pipe(res);
}
