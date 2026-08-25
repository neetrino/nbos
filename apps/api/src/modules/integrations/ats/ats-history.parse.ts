import { ATS_HISTORY_LOCAL_OFFSET } from './ats.constants';

const HISTORY_LIST_KEYS = ['docs', 'data', 'result', 'rows', 'history', 'calls'] as const;
const UID_KEYS = ['uniqueid', 'uniqueId', 'uid', 'linkedid'] as const;
const BILLSEC_KEYS = ['duration', 'billsec', 'billSec'] as const;
const END_KEYS = ['endz', 'end', 'ended'] as const;
const START_KEYS = ['start', 'startz', 'started'] as const;
const OP_KEYS = ['extension', 'op', 'dst'] as const;
const PHONE_KEYS = [
  'destination',
  'extension',
  'in_num',
  'ext_num',
  'clid',
  'src',
  'caller',
  'callee',
] as const;
const DIRECTION_LABELS = new Set(['out call', 'incoming call', 'local call', 'in call']);
const TERMINAL_DISPOSITIONS = new Set([
  'ANSWERED',
  'ANSWER LATER',
  'NO ANSWER',
  'NOANSWER',
  'BUSY',
  'FAILED',
]);

export type AtsHistoryCallRow = {
  uid: string;
  disposition: string | null;
  direction: string | null;
  billsec: string | null;
  op: string | null;
  phones: string[];
  ended: boolean;
  startedAt: Date | null;
};

export type AtsHistoryParseResult = {
  numFound: number;
  rows: AtsHistoryCallRow[];
};

export function parseAtsHistoryBody(body: unknown): AtsHistoryCallRow[] {
  return parseAtsHistoryResponse(body).rows;
}

export function parseAtsHistoryResponse(body: unknown): AtsHistoryParseResult {
  const rows = extractHistoryRecords(body)
    .map(parseHistoryRecord)
    .filter((row): row is AtsHistoryCallRow => row != null);
  return { numFound: Math.max(readNumFound(body), rows.length), rows };
}

function extractHistoryRecords(body: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(body)) return body.filter(isRecord);
  if (!isRecord(body)) return [];
  for (const key of HISTORY_LIST_KEYS) {
    const nested = body[key];
    if (Array.isArray(nested)) return nested.filter(isRecord);
    if (isRecord(nested)) {
      const inner = extractHistoryRecords(nested);
      if (inner.length > 0) return inner;
    }
  }
  return [];
}

function parseHistoryRecord(row: Record<string, unknown>): AtsHistoryCallRow | null {
  const uid = readFirstString(row, UID_KEYS);
  if (!uid) return null;
  const { disposition, direction } = readDispositionAndDirection(row);
  const endValue = readFirstString(row, END_KEYS);
  const op = sanitizeAtsHistoryToken(readFirstString(row, OP_KEYS));
  return {
    uid,
    disposition,
    direction,
    billsec: readFirstString(row, BILLSEC_KEYS),
    op,
    phones: readHistoryPhones(row),
    ended: isEndedHistoryRow(disposition, endValue),
    startedAt: parseHistoryDate(readFirstString(row, START_KEYS)),
  };
}

function readDispositionAndDirection(row: Record<string, unknown>): {
  disposition: string | null;
  direction: string | null;
} {
  const disposition = readFormString(row.disposition);
  const status = readFormString(row.status);
  if (status && DIRECTION_LABELS.has(status.toLowerCase())) {
    return { disposition, direction: status };
  }
  return { disposition: disposition ?? status, direction: null };
}

function isEndedHistoryRow(disposition: string | null, endValue: string | null): boolean {
  if (endValue) return true;
  if (!disposition) return false;
  const normalized = disposition.trim().toUpperCase().replace(/_/g, ' ');
  if (TERMINAL_DISPOSITIONS.has(normalized)) return true;
  return normalized === 'END' || normalized === 'ENDED' || normalized === 'HANGUP';
}

function parseHistoryDate(value: string | null): Date | null {
  if (!value) return null;
  const naive = value.trim().replace(/Z$/i, '').replace(' ', 'T');
  const stamped = /[+-]\d{2}:?\d{2}$/.test(naive) ? naive : `${naive}${ATS_HISTORY_LOCAL_OFFSET}`;
  const parsed = Date.parse(stamped);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

function readHistoryPhones(row: Record<string, unknown>): string[] {
  const values: string[] = [];
  for (const key of PHONE_KEYS) {
    const value = sanitizeAtsHistoryToken(readFormString(row[key]));
    if (value) values.push(value);
  }
  return values;
}

function readFirstString(row: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = readFormString(row[key]);
    if (value) return value;
  }
  return null;
}

function readFormString(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeAtsHistoryToken(value: string | null): string | null {
  if (!value) return null;
  const stripped = value.replace(/^-+/, '').trim();
  return stripped.length > 0 ? stripped : null;
}

function readNumFound(body: unknown): number {
  if (!isRecord(body)) return 0;
  const value = body.numFound;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}
