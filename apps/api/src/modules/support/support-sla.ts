export type SupportSlaState = 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | 'CLOSED';

export interface SupportSlaProjection {
  state: SupportSlaState;
  responseDeadline: string | null;
  resolveDeadline: string | null;
}

interface TicketForSla {
  status: string;
  slaResponseDeadline: Date | string | null;
  slaResolveDeadline: Date | string | null;
}

const CLOSED_TICKET_STATUSES = new Set(['RESOLVED', 'CLOSED']);

export function buildSupportSlaProjection(ticket: TicketForSla): SupportSlaProjection {
  if (CLOSED_TICKET_STATUSES.has(ticket.status)) {
    return buildProjection(ticket, 'CLOSED');
  }

  const now = Date.now();
  const resolveDeadline = toTimestamp(ticket.slaResolveDeadline);
  if (resolveDeadline !== null && now > resolveDeadline) {
    return buildProjection(ticket, 'BREACHED');
  }

  const responseDeadline = toTimestamp(ticket.slaResponseDeadline);
  if (responseDeadline !== null && now > responseDeadline) {
    return buildProjection(ticket, 'AT_RISK');
  }

  return buildProjection(ticket, 'ON_TRACK');
}

function buildProjection(ticket: TicketForSla, state: SupportSlaState): SupportSlaProjection {
  return {
    state,
    responseDeadline: toIso(ticket.slaResponseDeadline),
    resolveDeadline: toIso(ticket.slaResolveDeadline),
  };
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
