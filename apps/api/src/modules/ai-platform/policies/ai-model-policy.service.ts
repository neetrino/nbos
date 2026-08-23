import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import type { PrismaTransaction } from '../agents/agent-row-lock';
import { assertModelAssignableForProduction } from '../models/ai-model-catalog.service';
import { toModelPolicyView, type AiModelPolicyView } from './ai-model-policy.mapper';
import {
  normalizePolicyPurpose,
  requirePolicyMode,
  requirePolicyName,
  validateCandidateShape,
  type PolicyCandidateInput,
} from './ai-model-policy.rules';
import type { PolicyRouteSnapshot } from './ai-model-policy.snapshot';

export interface CreateModelPolicyInput {
  name: string;
  purpose?: string | null;
  mode: string;
  candidates: PolicyCandidateInput[];
}

@Injectable()
export class AiModelPolicyService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AiPlatformAuditService,
  ) {}

  async create(
    input: CreateModelPolicyInput,
    actingEmployeeId: string,
  ): Promise<AiModelPolicyView> {
    const name = requirePolicyName(input.name);
    const mode = requirePolicyMode(input.mode);
    const purpose = normalizePolicyPurpose(input.purpose) ?? null;
    validateCandidateShape(mode, input.candidates);
    const created = await this.prisma.$transaction(async (tx) => {
      await this.assertProductionCandidates(tx, input.candidates);
      const policy = await tx.aiModelPolicy.create({
        data: { name, purpose, mode, createdById: actingEmployeeId },
      });
      await this.writeCandidates(tx, policy.id, input.candidates);
      await this.log(tx, policy.id, AI_AUDIT_ACTION.modelPolicyCreated, actingEmployeeId, {
        name,
        mode,
        candidateCount: input.candidates.length,
      });
      return this.load(tx, policy.id);
    });
    return created;
  }

  async replaceCandidates(
    policyId: string,
    candidates: PolicyCandidateInput[],
    actingEmployeeId: string,
  ): Promise<AiModelPolicyView> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const policy = await this.requirePolicy(tx, policyId);
      if (policy.status === 'ARCHIVED') {
        throw new BadRequestException('An archived policy cannot change candidates');
      }
      validateCandidateShape(policy.mode, candidates);
      await this.assertProductionCandidates(tx, candidates);
      await tx.aiModelPolicyCandidate.deleteMany({ where: { policyId } });
      await this.writeCandidates(tx, policyId, candidates);
      await tx.aiModelPolicy.update({
        where: { id: policyId },
        data: { version: { increment: 1 } },
      });
      await this.log(tx, policyId, AI_AUDIT_ACTION.modelPolicyUpdated, actingEmployeeId, {
        candidateCount: candidates.length,
      });
      return this.load(tx, policyId);
    });
    return updated;
  }

  async activate(policyId: string, actingEmployeeId: string): Promise<AiModelPolicyView> {
    return this.setStatus(
      policyId,
      'ACTIVE',
      actingEmployeeId,
      AI_AUDIT_ACTION.modelPolicyActivated,
    );
  }

  async disable(policyId: string, actingEmployeeId: string): Promise<AiModelPolicyView> {
    return this.setStatus(
      policyId,
      'DISABLED',
      actingEmployeeId,
      AI_AUDIT_ACTION.modelPolicyDisabled,
    );
  }

  async findById(policyId: string): Promise<AiModelPolicyView | null> {
    const policy = await this.prisma.aiModelPolicy.findUnique({
      where: { id: policyId },
      include: { candidates: true },
    });
    return policy ? toModelPolicyView(policy, policy.candidates) : null;
  }

  async listAll(): Promise<AiModelPolicyView[]> {
    const policies = await this.prisma.aiModelPolicy.findMany({
      include: { candidates: true },
      orderBy: { createdAt: 'desc' },
    });
    return policies.map((policy) => toModelPolicyView(policy, policy.candidates));
  }

  async requireActive(policyId: string): Promise<AiModelPolicyView> {
    const policy = await this.findById(policyId);
    if (!policy) {
      throw new NotFoundException('Model policy not found');
    }
    if (policy.status !== 'ACTIVE') {
      throw new BadRequestException('Model policy is not active');
    }
    return policy;
  }

  /**
   * Assignment-time check: policy is ACTIVE and its enabled PRIMARY is
   * production-eligible. Temporarily unavailable fallbacks do not block.
   */
  async requireAssignableForProduction(
    policyId: string,
    tx: PrismaTransaction = this.prisma,
  ): Promise<AiModelPolicyView> {
    const policy = await tx.aiModelPolicy.findUnique({
      where: { id: policyId },
      include: { candidates: true },
    });
    if (!policy) {
      throw new NotFoundException('Model policy not found');
    }
    if (policy.status !== 'ACTIVE') {
      throw new BadRequestException('Model policy is not active');
    }
    const primary = policy.candidates.find((item) => item.enabled && item.role === 'PRIMARY');
    if (!primary) {
      throw new BadRequestException('Model policy has no enabled PRIMARY');
    }
    await this.assertProductionCandidates(tx, [primary]);
    return toModelPolicyView(policy, policy.candidates);
  }

  async loadActiveRouteSnapshot(
    policyId: string,
    tx: PrismaTransaction = this.prisma,
  ): Promise<PolicyRouteSnapshot> {
    const policy = await tx.aiModelPolicy.findUnique({
      where: { id: policyId },
      include: {
        candidates: {
          include: {
            model: { include: { connection: { select: { id: true, status: true } } } },
          },
          orderBy: { priority: 'asc' },
        },
      },
    });
    if (!policy) {
      throw new NotFoundException('Model policy not found');
    }
    if (policy.status !== 'ACTIVE') {
      throw new BadRequestException('Model policy is not active');
    }
    return policy;
  }

  private async setStatus(
    policyId: string,
    status: 'ACTIVE' | 'DISABLED',
    actingEmployeeId: string,
    action: string,
  ): Promise<AiModelPolicyView> {
    return this.prisma.$transaction(async (tx) => {
      const policy = await this.requirePolicy(tx, policyId);
      if (policy.status === 'ARCHIVED') {
        throw new BadRequestException('An archived policy cannot change status');
      }
      if (status === 'ACTIVE') {
        const current = await this.load(tx, policyId);
        validateCandidateShape(current.mode, current.candidates);
        await this.assertProductionCandidates(tx, current.candidates);
      }
      await tx.aiModelPolicy.update({ where: { id: policyId }, data: { status } });
      await this.log(tx, policyId, action, actingEmployeeId, { status });
      return this.load(tx, policyId);
    });
  }

  private async assertProductionCandidates(
    tx: PrismaTransaction,
    candidates: PolicyCandidateInput[],
  ): Promise<void> {
    const enabled = candidates.filter((item) => item.enabled !== false);
    if (enabled.length === 0) {
      throw new BadRequestException('A policy needs at least one enabled candidate');
    }
    for (const candidate of enabled) {
      const model = await tx.aiModel.findUnique({
        where: { id: candidate.modelId },
        include: { connection: { select: { status: true } } },
      });
      if (!model) {
        throw new BadRequestException('Model candidate not found');
      }
      assertModelAssignableForProduction(model.status);
      if (model.connection.status !== 'ACTIVE') {
        throw new BadRequestException('Candidate connection is not enabled');
      }
    }
  }

  private async writeCandidates(
    tx: PrismaTransaction,
    policyId: string,
    candidates: PolicyCandidateInput[],
  ): Promise<void> {
    for (const candidate of candidates) {
      await tx.aiModelPolicyCandidate.create({
        data: {
          policyId,
          modelId: candidate.modelId,
          role: candidate.role,
          priority: candidate.priority,
          enabled: candidate.enabled !== false,
        },
      });
    }
  }

  private async requirePolicy(tx: PrismaTransaction, policyId: string) {
    const policy = await tx.aiModelPolicy.findUnique({ where: { id: policyId } });
    if (!policy) {
      throw new NotFoundException('Model policy not found');
    }
    return policy;
  }

  private async load(tx: PrismaTransaction, policyId: string): Promise<AiModelPolicyView> {
    const policy = await tx.aiModelPolicy.findUniqueOrThrow({
      where: { id: policyId },
      include: { candidates: true },
    });
    return toModelPolicyView(policy, policy.candidates);
  }

  private async log(
    tx: PrismaTransaction,
    entityId: string,
    action: string,
    actingEmployeeId: string,
    changes: InputJsonValue,
  ): Promise<void> {
    await this.audit.logAdminAction(
      {
        entityType: AI_AUDIT_ENTITY.modelPolicy,
        entityId,
        action,
        actingEmployeeId,
        changes,
      },
      tx,
    );
  }
}
