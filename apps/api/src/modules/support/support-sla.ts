export type SupportSlaState =
  | 'ON_TRACK'
  | 'AT_RISK'
  | 'HIGH_RISK'
  | 'BREACHED'
  | 'PAUSED'
  | 'CLOSED';

export interface SupportSlaProjection {
  state: SupportSlaState;
  responseDeadline: string | null;
  resolveDeadline: string | null;
  effectiveResponseDeadline: string | null;
  effectiveResolveDeadline: string | null;
  pauseActive: boolean;
  waitingState: string;
}

interface TicketForSla {
  status: string;
  createdAt: Date | string;
  waitingState?: string;
  slaResponseDeadline: Date | string | null;
  slaResolveDeadline: Date | string | null;
  slaPausedTotalSeconds?: number;
  slaPauseStartedAt?: Date | string | null;
}

const TERMINAL_SLA_STATUSES = new Set(['RESOLVED', 'CLOSED']);

export const SUPPORT_SLA_RESOLVE_WARNING_RATIO = 0.5;
const RESOLVE_HIGH_RISK_RATIO = 0.2;

function normalizeTicket(ticket: TicketForSla): Required<TicketForSla> {
  return {
    status: ticket.status,
    createdAt: ticket.createdAt ?? new Date(0),
    waitingState: ticket.waitingState ?? 'NONE',
    slaResponseDeadline: ticket.slaResponseDeadline,
    slaResolveDeadline: ticket.slaResolveDeadline,
    slaPausedTotalSeconds: ticket.slaPausedTotalSeconds ?? 0,
    slaPauseStartedAt: ticket.slaPauseStartedAt ?? null,
  };
}

export function buildSupportSlaProjection(ticket: TicketForSla): SupportSlaProjection {
  const t = normalizeTicket(ticket);
  const waitingState = t.waitingState;

  if (TERMINAL_SLA_STATUSES.has(t.status)) {
    return buildProjection(t, 'CLOSED', 0);
  }

  if (waitingState !== 'NONE') {
    const shiftMs = computePauseShiftMs(t, Date.now());
    return buildProjection(t, 'PAUSED', shiftMs);
  }

  const shiftMs = computePauseShiftMs(t, Date.now());
  const now = Date.now();
  const effResponse = shiftDeadline(t.slaResponseDeadline, shiftMs);
  const effResolve = shiftDeadline(t.slaResolveDeadline, shiftMs);
  const created = toTimestamp(t.createdAt) ?? now;

  if (effResponse !== null && now > effResponse) {
    return buildProjection(t, 'BREACHED', shiftMs);
  }

  if (effResolve !== null && now > effResolve) {
    return buildProjection(t, 'BREACHED', shiftMs);
  }

  if (effResolve === null) {
    return buildProjection(t, 'ON_TRACK', shiftMs);
  }

  const totalWindow = effResolve - created;
  const remaining = effResolve - now;
  if (totalWindow <= 0) {
    return buildProjection(t, 'BREACHED', shiftMs);
  }

  const ratio = remaining / totalWindow;
  if (ratio <= RESOLVE_HIGH_RISK_RATIO) {
    return buildProjection(t, 'HIGH_RISK', shiftMs);
  }
  if (ratio <= SUPPORT_SLA_RESOLVE_WARNING_RATIO) {
    return buildProjection(t, 'AT_RISK', shiftMs);
  }

  return buildProjection(t, 'ON_TRACK', shiftMs);
}

/** Exposed for orchestration (warnings / breaches) using the same clock rules as UI. */
export function buildSupportSlaProjectionAt(
  ticket: TicketForSla,
  asOf: Date,
): SupportSlaProjection {
  const t = normalizeTicket(ticket);
  const now = asOf.getTime();

  if (TERMINAL_SLA_STATUSES.has(t.status)) {
    return buildProjection(t, 'CLOSED', 0, asOf);
  }

  if (t.waitingState !== 'NONE') {
    const shiftMs = computePauseShiftMs(t, now);
    return buildProjection(t, 'PAUSED', shiftMs, asOf);
  }

  const shiftMs = computePauseShiftMs(t, now);
  const effResponse = shiftDeadline(t.slaResponseDeadline, shiftMs);
  const effResolve = shiftDeadline(t.slaResolveDeadline, shiftMs);
  const created = toTimestamp(t.createdAt) ?? now;

  if (effResponse !== null && now > effResponse) {
    return buildProjection(t, 'BREACHED', shiftMs, asOf);
  }

  if (effResolve !== null && now > effResolve) {
    return buildProjection(t, 'BREACHED', shiftMs, asOf);
  }

  if (effResolve === null) {
    return buildProjection(t, 'ON_TRACK', shiftMs, asOf);
  }

  const totalWindow = effResolve - created;
  const remaining = effResolve - now;
  if (totalWindow <= 0) {
    return buildProjection(t, 'BREACHED', shiftMs, asOf);
  }

  const ratio = remaining / totalWindow;
  if (ratio <= RESOLVE_HIGH_RISK_RATIO) {
    return buildProjection(t, 'HIGH_RISK', shiftMs, asOf);
  }
  if (ratio <= SUPPORT_SLA_RESOLVE_WARNING_RATIO) {
    return buildProjection(t, 'AT_RISK', shiftMs, asOf);
  }

  return buildProjection(t, 'ON_TRACK', shiftMs, asOf);
}

export function computePauseShiftMs(ticket: Required<TicketForSla>, nowMs: number): number {
  const base = ticket.slaPausedTotalSeconds * 1000;
  if (ticket.waitingState === 'NONE') {
    return base;
  }
  const start = toTimestamp(ticket.slaPauseStartedAt);
  if (start === null) {
    return base;
  }
  return base + Math.max(0, nowMs - start);
}

export function effectiveDeadlineTimestamps(
  ticket: Required<TicketForSla>,
  nowMs: number,
): { effResponse: number | null; effResolve: number | null; shiftMs: number } {
  const shiftMs = computePauseShiftMs(ticket, nowMs);
  return {
    shiftMs,
    effResponse: shiftDeadlineTs(ticket.slaResponseDeadline, shiftMs),
    effResolve: shiftDeadlineTs(ticket.slaResolveDeadline, shiftMs),
  };
}

function buildProjection(
  ticket: Required<TicketForSla>,
  state: SupportSlaState,
  shiftMs: number,
  asOf?: Date,
): SupportSlaProjection {
  const nowMs = asOf ? asOf.getTime() : Date.now();
  const shiftForDisplay =
    ticket.waitingState !== 'NONE' ? computePauseShiftMs(ticket, nowMs) : shiftMs;

  return {
    state,
    responseDeadline: toIso(ticket.slaResponseDeadline),
    resolveDeadline: toIso(ticket.slaResolveDeadline),
    effectiveResponseDeadline: toIso(shiftDateValue(ticket.slaResponseDeadline, shiftForDisplay)),
    effectiveResolveDeadline: toIso(shiftDateValue(ticket.slaResolveDeadline, shiftForDisplay)),
    pauseActive: ticket.waitingState !== 'NONE',
    waitingState: ticket.waitingState,
  };
}

function shiftDateValue(value: Date | string | null, shiftMs: number): Date | null {
  const ts = shiftDeadlineTs(value, shiftMs);
  return ts === null ? null : new Date(ts);
}

function shiftDeadline(value: Date | string | null, shiftMs: number): number | null {
  return shiftDeadlineTs(value, shiftMs);
}

function shiftDeadlineTs(value: Date | string | null, shiftMs: number): number | null {
  const base = toTimestamp(value);
  if (base === null) return null;
  return base + shiftMs;
}

function toTimestamp(value: Date | string | null) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function toIso(value: Date | string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
