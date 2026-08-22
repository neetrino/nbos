import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import {
  assertApprovalDecision,
  assertApprovedCommit,
  assertEmployeeApprover,
  effectiveApprovalStatus,
  nextStatusForDecision,
  type ActorContext,
  type AiApprovalDecisionAction,
  type AiApprovalRequestRecord,
  type AiApprovalStatus,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import type { PrismaTransaction } from '../agents/agent-row-lock';
import { requesterAuditActor } from './ai-approval-request.audit-actor';
import { throwApprovalCommit, throwApprovalLifecycle } from './ai-approval-request.errors';
import { lockApprovalRequestRow } from './ai-approval-request.lock';
import { toApprovalRequestView, type AiApprovalRequestRow } from './ai-approval-request.mapper';
import {
  digestApprovalPayload,
  normalizeDecisionReason,
  requireApprovalPayload,
  toPendingWrite,
} from './ai-approval-request.rules';
import type { ApprovalCommitInput, CreateApprovalRequestInput } from './ai-approval-request.types';

const PENDING_LIST_LIMIT = 50;

@Injectable()
export class AiApprovalRequestService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AiPlatformAuditService,
  ) {}

  async createPending(input: CreateApprovalRequestInput): Promise<AiApprovalRequestRecord> {
    const write = toPendingWrite(input, new Date());
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.aiApprovalRequest.create({ data: write });
      await this.logMachine(tx, created, AI_AUDIT_ACTION.approvalRequested, {
        capabilityKey: created.capabilityKey,
        payloadDigest: created.payloadDigest,
        requesterActorType: created.requesterActorType,
        requesterActorId: created.requesterActorId,
        resourceType: created.resourceType,
        resourceId: created.resourceId,
        expiresAt: created.expiresAt.toISOString(),
      });
      return toApprovalRequestView(created);
    });
  }

  async listPending(): Promise<AiApprovalRequestRecord[]> {
    const rows = await this.prisma.aiApprovalRequest.findMany({
      where: { status: 'PENDING', expiresAt: { gt: new Date() } },
      orderBy: { requestedAt: 'asc' },
      take: PENDING_LIST_LIMIT,
    });
    return rows.map(toApprovalRequestView);
  }

  async findById(id: string): Promise<AiApprovalRequestRecord | null> {
    const row = await this.prisma.aiApprovalRequest.findUnique({ where: { id } });
    return row ? toApprovalRequestView(row) : null;
  }

  async approve(id: string, employeeId: string, reason?: string | null) {
    return this.decide(id, 'APPROVE', employeeId, reason);
  }

  async reject(id: string, employeeId: string, reason?: string | null) {
    return this.decide(id, 'REJECT', employeeId, reason);
  }

  async cancel(id: string, employeeId: string, reason?: string | null) {
    return this.decide(id, 'CANCEL', employeeId, reason);
  }

  async consumeForCommit(input: ApprovalCommitInput): Promise<AiApprovalRequestRecord> {
    const payload = requireApprovalPayload(input.proposedPayload);
    return this.prisma.$transaction(async (tx) => {
      const locked = await this.loadFresh(tx, input.approvalId);
      const denial = assertApprovedCommit({
        status: locked.status as AiApprovalStatus,
        expiresAt: locked.expiresAt,
        now: new Date(),
        storedPayloadDigest: locked.payloadDigest,
        proposedPayloadDigest: digestApprovalPayload(payload),
        requesterActorType: locked.requesterActorType as ApprovalCommitInput['currentActorType'],
        requesterActorId: locked.requesterActorId,
        capabilityKey: locked.capabilityKey,
        currentActorType: input.currentActorType,
        currentActorId: input.currentActorId,
        currentCapabilityKey: input.currentCapabilityKey,
        policyDecision: input.policyDecision,
        domainStateValid: input.domainStateValid,
      });
      if (denial) {
        throwApprovalCommit(denial);
      }
      const updated = await tx.aiApprovalRequest.update({
        where: { id: locked.id },
        data: { status: 'CONSUMED', consumedAt: new Date() },
      });
      await this.logMachine(tx, updated, AI_AUDIT_ACTION.approvalConsumed, {
        payloadDigest: updated.payloadDigest,
        capabilityKey: updated.capabilityKey,
      });
      return toApprovalRequestView(updated);
    });
  }

  private async decide(
    id: string,
    action: AiApprovalDecisionAction,
    actingEmployeeId: string,
    reason?: string | null,
  ): Promise<AiApprovalRequestRecord> {
    const decisionReason = normalizeDecisionReason(reason);
    return this.prisma.$transaction(async (tx) => {
      await this.assertEmployeeExists(tx, actingEmployeeId);
      const locked = await this.loadFresh(tx, id);
      this.assertCanDecide(locked, action, actingEmployeeId);
      const status = nextStatusForDecision(action);
      const updated = await tx.aiApprovalRequest.update({
        where: { id: locked.id },
        data: {
          status,
          decidedByEmployeeId: actingEmployeeId,
          decidedAt: new Date(),
          decisionReason,
        },
      });
      await this.logAdmin(tx, updated.id, auditActionForDecision(action), actingEmployeeId, {
        status,
        payloadDigest: updated.payloadDigest,
        capabilityKey: updated.capabilityKey,
      });
      return toApprovalRequestView(updated);
    });
  }

  private assertCanDecide(
    locked: AiApprovalRequestRow,
    action: AiApprovalDecisionAction,
    actingEmployeeId: string,
  ): void {
    const selfApproval = assertEmployeeApprover({
      requesterActorType: locked.requesterActorType as ApprovalCommitInput['currentActorType'],
      requesterActorId: locked.requesterActorId,
      approverActorType: 'USER',
      approverActorId: actingEmployeeId,
    });
    if (selfApproval) {
      throwApprovalLifecycle(selfApproval);
    }
    const denial = assertApprovalDecision(
      locked.status as AiApprovalStatus,
      action,
      locked.expiresAt,
      new Date(),
    );
    if (denial) {
      throwApprovalLifecycle(denial);
    }
  }

  private async loadFresh(tx: PrismaTransaction, id: string): Promise<AiApprovalRequestRow> {
    const locked = await lockApprovalRequestRow(tx, id);
    const now = new Date();
    const effective = effectiveApprovalStatus(
      locked.status as AiApprovalStatus,
      locked.expiresAt,
      now,
    );
    if (effective !== 'EXPIRED' || (locked.status !== 'PENDING' && locked.status !== 'APPROVED')) {
      return locked;
    }
    const expired = await tx.aiApprovalRequest.update({
      where: { id: locked.id },
      data: { status: 'EXPIRED' },
    });
    await this.logMachine(tx, expired, AI_AUDIT_ACTION.approvalExpired, {
      payloadDigest: expired.payloadDigest,
    });
    throwApprovalLifecycle('EXPIRED');
  }

  private async assertEmployeeExists(tx: PrismaTransaction, employeeId: string): Promise<void> {
    const employee = await tx.employee.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });
    if (!employee) {
      throw new NotFoundException('Approver employee not found');
    }
  }

  private logAdmin(
    tx: PrismaTransaction,
    entityId: string,
    action: string,
    actingEmployeeId: string,
    changes: InputJsonValue,
  ) {
    return this.audit.logAdminAction(
      {
        entityType: AI_AUDIT_ENTITY.approvalRequest,
        entityId,
        action,
        actingEmployeeId,
        changes,
      },
      tx,
    );
  }

  private logMachine(
    tx: PrismaTransaction,
    row: Pick<AiApprovalRequestRow, 'id' | 'requesterActorType' | 'requesterActorId'>,
    action: string,
    changes: InputJsonValue,
    actor?: ActorContext,
  ) {
    return this.audit.logMachineAction(
      {
        entityType: AI_AUDIT_ENTITY.approvalRequest,
        entityId: row.id,
        action,
        actor: actor ?? requesterAuditActor(row),
        changes,
      },
      tx,
    );
  }
}

function auditActionForDecision(action: AiApprovalDecisionAction): string {
  if (action === 'CANCEL') {
    return AI_AUDIT_ACTION.approvalCancelled;
  }
  return AI_AUDIT_ACTION.approvalDecided;
}
