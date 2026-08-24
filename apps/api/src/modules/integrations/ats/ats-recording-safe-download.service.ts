import { createHash, randomBytes } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { open, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Transform, type TransformCallback, type Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Injectable } from '@nestjs/common';
import type { AtsRecordingDownloadResult } from './ats-call-record.types';
import {
  ATS_CALL_RECORDING_MAX_BYTES,
  ATS_CALL_RECORD_TIMEOUT_MS,
} from './ats-call-recording.constants';
import { ATS_RECORDING_MIME_SNIFF_BYTES, resolveAtsRecordingMime } from './ats-recording-mime';
import {
  AtsRecordingPermanentError,
  AtsRecordingTransientError,
} from './ats-call-recording.errors';
import {
  isLikelyAudioContentType,
  isAtsRecordingRedirectStatus,
  parseAtsRecordingContentLength,
  throwForAtsRecordingHttpStatus,
} from './ats-call-recording-http';
import {
  AtsRecordingHttpTransport,
  type AtsRecordingTransportResponse,
} from './ats-recording-http.transport';
import { ATS_CALL_RECORDING_MAX_REDIRECTS } from './ats-recording-url.constants';
import { AtsRecordingUrlPolicy } from './ats-recording-url-policy.service';

@Injectable()
export class AtsRecordingSafeDownloadService {
  constructor(
    private readonly policy: AtsRecordingUrlPolicy,
    private readonly transport: AtsRecordingHttpTransport,
  ) {}

  async download(rawUrl: string, source: string): Promise<AtsRecordingDownloadResult> {
    return this.downloadHop(rawUrl, undefined, source, ATS_CALL_RECORDING_MAX_REDIRECTS, new Set());
  }

  private async downloadHop(
    rawUrl: string,
    baseUrl: URL | undefined,
    source: string,
    remaining: number,
    seen: Set<string>,
  ): Promise<AtsRecordingDownloadResult> {
    const target = await this.policy.validate(rawUrl, baseUrl);
    if (seen.has(target.url.href)) {
      throw new AtsRecordingPermanentError('recording url rejected (redirect_loop)');
    }
    seen.add(target.url.href);
    const response = await this.transport.request({
      ...target,
      timeoutMs: ATS_CALL_RECORD_TIMEOUT_MS,
    });
    if (isAtsRecordingRedirectStatus(response.status)) {
      return this.followRedirect(response, target.url, source, remaining, seen);
    }
    return readRecordingSuccessBody(response, source);
  }

  private async followRedirect(
    response: AtsRecordingTransportResponse,
    currentUrl: URL,
    source: string,
    remaining: number,
    seen: Set<string>,
  ): Promise<AtsRecordingDownloadResult> {
    discardRecordingBody(response.body);
    if (remaining <= 0) {
      throw new AtsRecordingPermanentError('recording url rejected (redirect_limit)');
    }
    const location = response.header('location');
    if (!location) {
      throw new AtsRecordingPermanentError('recording url rejected (redirect_missing_location)');
    }
    return this.downloadHop(location, currentUrl, source, remaining - 1, seen);
  }
}

async function readRecordingSuccessBody(
  response: AtsRecordingTransportResponse,
  source: string,
): Promise<AtsRecordingDownloadResult> {
  if (response.status < 200 || response.status >= 300) {
    discardRecordingBody(response.body);
    throwForAtsRecordingHttpStatus(response.status, source);
  }
  const contentType = response.header('content-type');
  if (!isLikelyAudioContentType(contentType)) {
    discardRecordingBody(response.body);
    throw new AtsRecordingTransientError(`${source} unexpected content-type`);
  }
  assertRecordingContentLength(response);
  if (!response.body) {
    throw new AtsRecordingTransientError(`${source} empty body`);
  }
  return writeRecordingTempFile(
    response.body,
    contentType,
    response.header('content-disposition'),
    source,
  );
}

function assertRecordingContentLength(response: AtsRecordingTransportResponse): void {
  const size = parseAtsRecordingContentLength(response.header('content-length'));
  if (size === null) return;
  if (size <= 0) {
    discardRecordingBody(response.body);
    throw new AtsRecordingTransientError('recording empty body');
  }
  if (size > ATS_CALL_RECORDING_MAX_BYTES) {
    discardRecordingBody(response.body);
    throw new AtsRecordingPermanentError('recording exceeds size limit');
  }
}

async function writeRecordingTempFile(
  body: Readable,
  contentType: string | null,
  contentDisposition: string | null,
  source: string,
): Promise<AtsRecordingDownloadResult> {
  const tmpPath = join(tmpdir(), `nbos-ats-rec-${randomBytes(8).toString('hex')}`);
  try {
    const tap = new RecordingHashTap();
    await pipeline(body, tap, createWriteStream(tmpPath));
    if (tap.sizeBytes <= 0) {
      throw new AtsRecordingTransientError(`${source} zero-byte body`);
    }
    const prefix = await readRecordingMimePrefix(tmpPath);
    return {
      tmpPath,
      mimeType: resolveAtsRecordingMime({ contentType, contentDisposition, prefix }),
      sizeBytes: tap.sizeBytes,
      checksum: tap.checksum,
    };
  } catch (error) {
    await unlink(tmpPath).catch(() => undefined);
    throw error;
  }
}

async function readRecordingMimePrefix(tmpPath: string): Promise<Uint8Array> {
  const handle = await open(tmpPath, 'r');
  try {
    const prefix = Buffer.alloc(ATS_RECORDING_MIME_SNIFF_BYTES);
    const { bytesRead } = await handle.read(prefix, 0, ATS_RECORDING_MIME_SNIFF_BYTES, 0);
    return prefix.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

function discardRecordingBody(body: Readable | null): void {
  if (!body) return;
  body.destroy();
}

class RecordingHashTap extends Transform {
  private readonly hash = createHash('sha256');
  sizeBytes = 0;

  get checksum(): string {
    return this.hash.digest('hex');
  }

  override _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
    this.sizeBytes += chunk.length;
    if (this.sizeBytes > ATS_CALL_RECORDING_MAX_BYTES) {
      callback(new AtsRecordingPermanentError('recording exceeds size limit'));
      return;
    }
    this.hash.update(chunk);
    callback(null, chunk);
  }
}
