import { createHash, randomBytes } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable, Transform, type TransformCallback } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Injectable, Logger } from '@nestjs/common';
import {
  ATS_CALL_RECORDING_DEFAULT_MIME,
  ATS_CALL_RECORDING_MAX_BYTES,
  ATS_CALL_RECORD_ENDPOINT,
  ATS_CALL_RECORD_TIMEOUT_MS,
} from './ats-call-recording.constants';
import {
  AtsRecordingPermanentError,
  AtsRecordingTransientError,
} from './ats-call-recording.errors';
import {
  isLikelyAudioContentType,
  throwForAtsRecordingHttpStatus,
} from './ats-call-recording-http';
import { AtsProviderConfig } from './ats-provider.config';

export interface AtsRecordingDownloadResult {
  tmpPath: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
}

@Injectable()
export class AtsCallRecordClient {
  private readonly logger = new Logger(AtsCallRecordClient.name);

  constructor(private readonly config: AtsProviderConfig) {}

  async downloadRecording(
    uid: string,
    fallbackUrl: string | null,
  ): Promise<AtsRecordingDownloadResult> {
    try {
      return await this.downloadFromUrl(this.callRecordUrl(uid), 'ats-call-record');
    } catch (error) {
      if (error instanceof AtsRecordingPermanentError || !fallbackUrl?.trim()) {
        throw error;
      }
      this.logger.warn({
        event: 'ats_call_record_fallback_record_link',
        uid,
        error: String(error),
      });
      return this.downloadFromUrl(fallbackUrl.trim(), 'ats-record-link');
    }
  }

  private callRecordUrl(uid: string): string {
    const url = new URL(ATS_CALL_RECORD_ENDPOINT);
    url.searchParams.set('key', this.config.apiKey);
    url.searchParams.set('uid', uid);
    return url.toString();
  }

  private async downloadFromUrl(url: string, source: string): Promise<AtsRecordingDownloadResult> {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(ATS_CALL_RECORD_TIMEOUT_MS),
      });
    } catch (error) {
      throw new AtsRecordingTransientError(`${source} network: ${String(error)}`);
    }

    if (!response.ok) {
      throwForAtsRecordingHttpStatus(response.status, source);
    }

    const contentType = response.headers.get('content-type');
    if (!isLikelyAudioContentType(contentType)) {
      throw new AtsRecordingTransientError(`${source} unexpected content-type`);
    }
    if (!response.body) {
      throw new AtsRecordingTransientError(`${source} empty body`);
    }

    const tmpPath = join(tmpdir(), `nbos-ats-rec-${randomBytes(8).toString('hex')}`);
    try {
      const tap = new RecordingHashTap();
      await pipeline(
        Readable.fromWeb(response.body as import('node:stream/web').ReadableStream),
        tap,
        createWriteStream(tmpPath),
      );
      if (tap.sizeBytes <= 0) {
        throw new AtsRecordingTransientError(`${source} zero-byte body`);
      }
      return {
        tmpPath,
        mimeType: contentType?.split(';')[0]?.trim() || ATS_CALL_RECORDING_DEFAULT_MIME,
        sizeBytes: tap.sizeBytes,
        checksum: tap.checksum,
      };
    } catch (error) {
      await unlink(tmpPath).catch(() => undefined);
      throw error;
    }
  }
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
