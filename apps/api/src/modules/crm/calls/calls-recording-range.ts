import type { StreamableFile } from '@nestjs/common';

export const RECORDING_ACCEPT_RANGES = 'bytes';
export const RECORDING_INLINE_DISPOSITION = 'inline';

export type RecordingByteRange = {
  start: number;
  end: number;
};

export type ParsedRecordingRange =
  | { kind: 'none' }
  | { kind: 'unsatisfiable' }
  | { kind: 'range'; start: number; end: number };

export type RecordingPlaybackResult =
  | {
      kind: 'stream';
      status: 200 | 206;
      headers: Record<string, string>;
      file: StreamableFile;
    }
  | { kind: 'unsatisfiable'; totalSize: number };

const SINGLE_BYTE_RANGE = /^bytes\s*=\s*(\d*)\s*-\s*(\d*)$/iu;

export function toSafeByteLength(value: bigint | number | null | undefined): number | null {
  if (value == null) return null;
  const parsed = typeof value === 'bigint' ? Number(value) : value;
  if (!Number.isSafeInteger(parsed) || parsed < 0) return null;
  return parsed;
}

export function parseSingleByteRange(
  header: string | undefined,
  totalSize: number,
): ParsedRecordingRange {
  if (header == null || header.trim() === '') return { kind: 'none' };
  const match = SINGLE_BYTE_RANGE.exec(header.trim());
  if (!match) return { kind: 'none' };
  if (totalSize <= 0) return { kind: 'unsatisfiable' };
  return parseMatchedByteRange(match[1] ?? '', match[2] ?? '', totalSize);
}

function parseMatchedByteRange(
  startRaw: string,
  endRaw: string,
  totalSize: number,
): ParsedRecordingRange {
  if (startRaw === '' && endRaw === '') return { kind: 'none' };
  if (startRaw === '') return parseSuffixByteRange(endRaw, totalSize);
  const start = Number(startRaw);
  if (!Number.isSafeInteger(start) || start >= totalSize) return { kind: 'unsatisfiable' };
  if (endRaw === '') return { kind: 'range', start, end: totalSize - 1 };
  const end = Number(endRaw);
  if (!Number.isSafeInteger(end) || end < start) return { kind: 'unsatisfiable' };
  return { kind: 'range', start, end: Math.min(end, totalSize - 1) };
}

function parseSuffixByteRange(endRaw: string, totalSize: number): ParsedRecordingRange {
  const suffix = Number(endRaw);
  if (!Number.isSafeInteger(suffix) || suffix <= 0) return { kind: 'unsatisfiable' };
  if (suffix >= totalSize) return { kind: 'range', start: 0, end: totalSize - 1 };
  return { kind: 'range', start: totalSize - suffix, end: totalSize - 1 };
}

export function recordingContentRange(start: number, end: number, totalSize: number): string {
  return `bytes ${start}-${end}/${totalSize}`;
}

export function unsatisfiableContentRange(totalSize: number): string {
  return `bytes */${totalSize}`;
}

export function r2ByteRangeHeader(range: RecordingByteRange): string {
  return `bytes=${range.start}-${range.end}`;
}
