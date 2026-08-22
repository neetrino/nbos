import type {
  ActorType,
  AiApprovalRequestRecord,
  AiApprovalStatus,
  AiRiskClass,
} from '@nbos/shared';

export interface AiApprovalRequestRow {
  id: string;
  requesterActorType: string;
  requesterActorId: string;
  onBehalfOfActorType: string | null;
  onBehalfOfActorId: string | null;
  capabilityKey: string;
  resourceType: string;
  resourceId: string;
  scopeType: string | null;
  scopeId: string | null;
  payloadDigest: string;
  safePayloadSummary: string;
  riskClass: string;
  status: AiApprovalStatus;
  requestedAt: Date;
  expiresAt: Date;
  decidedByEmployeeId: string | null;
  decidedAt: Date | null;
  decisionReason: string | null;
  consumedAt: Date | null;
  correlationId: string | null;
}

export function toApprovalRequestView(row: AiApprovalRequestRow): AiApprovalRequestRecord {
  return {
    id: row.id,
    requester: {
      actorType: row.requesterActorType as ActorType,
      actorId: row.requesterActorId,
    },
    onBehalfOf:
      row.onBehalfOfActorType && row.onBehalfOfActorId
        ? {
            actorType: row.onBehalfOfActorType as ActorType,
            actorId: row.onBehalfOfActorId,
          }
        : null,
    capabilityKey: row.capabilityKey,
    resource: {
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      scopeType: row.scopeType,
      scopeId: row.scopeId,
    },
    payloadDigest: row.payloadDigest,
    safePayloadSummary: row.safePayloadSummary,
    riskClass: row.riskClass as AiRiskClass,
    status: row.status,
    requestedAt: row.requestedAt,
    expiresAt: row.expiresAt,
    decidedByEmployeeId: row.decidedByEmployeeId,
    decidedAt: row.decidedAt,
    decisionReason: row.decisionReason,
    consumedAt: row.consumedAt,
    correlationId: row.correlationId,
  };
}
