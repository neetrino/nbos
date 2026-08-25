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

const BYTES_UNIT = 'bytes';

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
  const parts = readSingleByteRangeParts(header);
  if (!parts) return { kind: 'none' };
  if (totalSize <= 0) return { kind: 'unsatisfiable' };
  return parseMatchedByteRange(parts.startRaw, parts.endRaw, totalSize);
}

function readSingleByteRangeParts(
  header: string | undefined,
): { startRaw: string; endRaw: string } | null {
  if (header == null) return null;
  const value = header.trim();
  if (!value.toLowerCase().startsWith(BYTES_UNIT)) return null;
  let index = skipWhitespace(value, BYTES_UNIT.length);
  if (value[index] !== '=') return null;
  index = skipWhitespace(value, index + 1);
  const startPart = readDigits(value, index);
  index = skipWhitespace(value, startPart.next);
  if (value[index] !== '-') return null;
  index = skipWhitespace(value, index + 1);
  const endPart = readDigits(value, index);
  index = skipWhitespace(value, endPart.next);
  if (index !== value.length) return null;
  return { startRaw: startPart.digits, endRaw: endPart.digits };
}

function skipWhitespace(value: string, start: number): number {
  let index = start;
  while (index < value.length && (value[index] ?? '').trim() === '') {
    index += 1;
  }
  return index;
}

function readDigits(value: string, start: number): { digits: string; next: number } {
  let next = start;
  while (next < value.length) {
    const char = value[next] ?? '';
    if (char < '0' || char > '9') break;
    next += 1;
  }
  return { digits: value.slice(start, next), next };
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
