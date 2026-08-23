import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  actorContextFromMachine,
  canonicalizeApprovalPayload,
  getAiCapability,
} from '@nbos/shared';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import { digestApprovalPayload } from './ai-approval-request.rules';
import { AiApprovalRequestService } from './ai-approval-request.service';

const AGENT = actorContextFromMachine({
  id: 'ia-1',
  type: 'INTERNAL_AI',
  displayName: 'Messenger Agent',
});
const EMPLOYEE_ID = 'emp-approver';
const PAYLOAD = { conversationId: 'conv-1', customerId: 'cust-1', body: 'Thanks' };
const DIGEST = digestApprovalPayload(PAYLOAD);

function row(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-08-22T12:00:00.000Z');
  return {
    id: 'apr-1',
    requesterActorType: 'INTERNAL_AI',
    requesterActorId: AGENT.actor.id,
    onBehalfOfActorType: null,
    onBehalfOfActorId: null,
    capabilityKey: 'messenger.reply_send',
    resourceType: 'CONVERSATION',
    resourceId: 'conv-1',
    scopeType: 'RESOURCE',
    scopeId: 'conv-1',
    payloadDigest: DIGEST,
    safePayloadSummary: canonicalizeApprovalPayload(PAYLOAD),
    riskClass: 'HIGH',
    status: 'PENDING',
    requestedAt: now,
    expiresAt: new Date('2026-08-23T12:00:00.000Z'),
    decidedByEmployeeId: null,
    decidedAt: null,
    decisionReason: null,
    consumedAt: null,
    correlationId: 'corr-1',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function allowDecision() {
  return {
    outcome: 'ALLOW' as const,
    actorId: AGENT.actor.id,
    actorType: AGENT.actor.type,
    capability: getAiCapability('messenger.reply_send')!,
    matchedScope: {
      scopeType: 'RESOURCE' as const,
      scopeId: 'conv-1',
      resourceType: 'CONVERSATION',
    },
  };
}

describe('AiApprovalRequestService', () => {
  let prisma: MockPrisma;
  let audit: AiPlatformAuditService;
  let service: AiApprovalRequestService;

  beforeEach(() => {
    prisma = createMockPrisma();
    audit = {
      logAdminAction: vi.fn(),
      logMachineAction: vi.fn(),
    } as unknown as AiPlatformAuditService;
    service = new AiApprovalRequestService(prisma as never, audit);
    prisma.employee.findUnique.mockResolvedValue({ id: EMPLOYEE_ID });
    prisma.$queryRaw.mockResolvedValue([{ id: 'apr-1' }]);
  });

  it('creates a pending request with digest and summary, never storing secrets', async () => {
    prisma.aiApprovalRequest.create.mockResolvedValue(row());
    const created = await service.createPending({
      requesterActorType: 'INTERNAL_AI',
      requesterActorId: AGENT.actor.id,
      capabilityKey: 'messenger.reply_send',
      resourceType: 'CONVERSATION',
      resourceId: 'conv-1',
      scopeType: 'RESOURCE',
      scopeId: 'conv-1',
      payload: PAYLOAD,
      correlationId: 'corr-1',
    });
    expect(created.status).toBe('PENDING');
    expect(created.payloadDigest).toBe(DIGEST);
    expect(created.requester.actorId).toBe(AGENT.actor.id);
    expect(prisma.aiApprovalRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ payloadDigest: DIGEST, status: 'PENDING' }),
    });
    expect(audit.logMachineAction).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: AI_AUDIT_ENTITY.approvalRequest,
        action: AI_AUDIT_ACTION.approvalRequested,
        changes: expect.objectContaining({ payloadDigest: DIGEST }),
      }),
      prisma,
    );
  });

  it('refuses to persist a secret-shaped payload', async () => {
    await expect(
      service.createPending({
        requesterActorType: 'INTERNAL_AI',
        requesterActorId: AGENT.actor.id,
        capabilityKey: 'messenger.reply_send',
        resourceType: 'CONVERSATION',
        resourceId: 'conv-1',
        payload: { body: 'hi', apiKey: 'secret' },
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.aiApprovalRequest.create).not.toHaveBeenCalled();
  });

  it('lets an employee approve and forbids AI self-approval', async () => {
    prisma.aiApprovalRequest.findUniqueOrThrow.mockResolvedValue(row());
    prisma.aiApprovalRequest.update.mockResolvedValue(row({ status: 'APPROVED' }));
    const approved = await service.approve('apr-1', EMPLOYEE_ID, 'ok to send');
    expect(approved.status).toBe('APPROVED');
    expect(audit.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: AI_AUDIT_ACTION.approvalDecided }),
      prisma,
    );

    prisma.aiApprovalRequest.findUniqueOrThrow.mockResolvedValue(row());
    await expect(service.approve('apr-1', AGENT.actor.id)).rejects.toThrow(/cannot approve/);
  });

  it('expires a stale pending row on decide and refuses consume', async () => {
    prisma.aiApprovalRequest.findUniqueOrThrow.mockResolvedValue(
      row({ expiresAt: new Date('2026-08-01T00:00:00.000Z') }),
    );
    prisma.aiApprovalRequest.update.mockResolvedValue(row({ status: 'EXPIRED' }));
    await expect(service.approve('apr-1', EMPLOYEE_ID)).rejects.toThrow(/expired/);
    expect(audit.logMachineAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: AI_AUDIT_ACTION.approvalExpired }),
      prisma,
    );
  });

  it('consumes a one-time approval only when digest, actor and grant still hold', async () => {
    prisma.aiApprovalRequest.findUniqueOrThrow.mockResolvedValue(row({ status: 'APPROVED' }));
    prisma.aiApprovalRequest.update.mockResolvedValue(row({ status: 'CONSUMED' }));
    const consumed = await service.consumeForCommit({
      approvalId: 'apr-1',
      proposedPayload: PAYLOAD,
      currentActorType: 'INTERNAL_AI',
      currentActorId: AGENT.actor.id,
      currentCapabilityKey: 'messenger.reply_send',
      policyDecision: allowDecision(),
      domainStateValid: true,
    });
    expect(consumed.status).toBe('CONSUMED');
    expect(audit.logMachineAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: AI_AUDIT_ACTION.approvalConsumed }),
      prisma,
    );
  });

  it('invalidates consume when the payload or grant changed', async () => {
    prisma.aiApprovalRequest.findUniqueOrThrow.mockResolvedValue(row({ status: 'APPROVED' }));
    await expect(
      service.consumeForCommit({
        approvalId: 'apr-1',
        proposedPayload: { ...PAYLOAD, body: 'changed' },
        currentActorType: 'INTERNAL_AI',
        currentActorId: AGENT.actor.id,
        currentCapabilityKey: 'messenger.reply_send',
        policyDecision: allowDecision(),
        domainStateValid: true,
      }),
    ).rejects.toThrow(/digest/);

    await expect(
      service.consumeForCommit({
        approvalId: 'apr-1',
        proposedPayload: PAYLOAD,
        currentActorType: 'INTERNAL_AI',
        currentActorId: AGENT.actor.id,
        currentCapabilityKey: 'messenger.reply_send',
        policyDecision: { outcome: 'DENY', reason: 'CAPABILITY_GRANT_REVOKED' },
        domainStateValid: true,
      }),
    ).rejects.toThrow(/no longer valid/);
  });

  it('does not write Tasks, Drive or grant tables', async () => {
    prisma.aiApprovalRequest.create.mockResolvedValue(row());
    await service.createPending({
      requesterActorType: 'INTERNAL_AI',
      requesterActorId: AGENT.actor.id,
      capabilityKey: 'messenger.reply_send',
      resourceType: 'CONVERSATION',
      resourceId: 'conv-1',
      payload: PAYLOAD,
    });
    expect(prisma.externalAgentCapabilityGrant.create).not.toHaveBeenCalled();
    expect(prisma.internalAiAgentCapabilityGrant.create).not.toHaveBeenCalled();
  });
});
