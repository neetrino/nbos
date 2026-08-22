import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import {
  assertPromptVersionTransition,
  canEditPromptVersion,
  type AiPromptLayers,
  type AiPromptVersionAttribution,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import type { PrismaTransaction } from '../agents/agent-row-lock';
import { assertPromptPolicyMutable, lockPromptPolicyRow } from './ai-prompt-policy.lock';
import { toPromptPolicyView, type AiPromptPolicyView } from './ai-prompt-policy.mapper';
import {
  normalizePromptPurpose,
  requirePromptPolicyName,
  toPromptLayerWrite,
} from './ai-prompt-policy.rules';
import {
  nextPromptVersionNumber,
  promptPublishAuditChanges,
  publishPromptVersionRow,
  rollbackLayersFrom,
  toNewVersionData,
} from './ai-prompt-version.writes';

export interface CreatePromptPolicyInput {
  name: string;
  purpose?: string | null;
  ownerId: string;
  layers: AiPromptLayers;
}

@Injectable()
export class AiPromptPolicyService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AiPlatformAuditService,
  ) {}

  async create(
    input: CreatePromptPolicyInput,
    actingEmployeeId: string,
  ): Promise<AiPromptPolicyView> {
    const name = requirePromptPolicyName(input.name);
    const purpose = normalizePromptPurpose(input.purpose) ?? null;
    return this.prisma.$transaction(async (tx) => {
      await this.assertEmployeeExists(tx, input.ownerId);
      const policy = await tx.aiPromptPolicy.create({
        data: { name, purpose, ownerId: input.ownerId, createdById: actingEmployeeId },
      });
      await tx.aiPromptVersion.create({
        data: toNewVersionData(policy.id, 1, input.layers, actingEmployeeId),
      });
      await this.log(tx, policy.id, AI_AUDIT_ACTION.promptPolicyCreated, actingEmployeeId, {
        name,
        version: 1,
      });
      return this.load(tx, policy.id);
    });
  }

  async createVersion(
    policyId: string,
    layers: AiPromptLayers,
    actingEmployeeId: string,
  ): Promise<AiPromptPolicyView> {
    return this.prisma.$transaction(async (tx) => {
      const locked = await lockPromptPolicyRow(tx, policyId);
      assertPromptPolicyMutable(locked.status);
      const version = await nextPromptVersionNumber(tx, policyId);
      const created = await tx.aiPromptVersion.create({
        data: toNewVersionData(policyId, version, layers, actingEmployeeId),
      });
      await this.log(tx, policyId, AI_AUDIT_ACTION.promptVersionCreated, actingEmployeeId, {
        versionId: created.id,
        version,
        contentDigest: created.contentDigest,
      });
      return this.load(tx, policyId);
    });
  }

  async updateDraft(
    policyId: string,
    versionId: string,
    layers: AiPromptLayers,
    actingEmployeeId: string,
  ): Promise<AiPromptPolicyView> {
    return this.prisma.$transaction(async (tx) => {
      await lockPromptPolicyRow(tx, policyId);
      const version = await this.requireVersion(tx, policyId, versionId);
      if (!canEditPromptVersion(version.status)) {
        throw new BadRequestException('Only DRAFT prompt versions can be edited');
      }
      const write = toPromptLayerWrite(layers);
      await tx.aiPromptVersion.update({ where: { id: versionId }, data: write });
      await this.log(tx, policyId, AI_AUDIT_ACTION.promptPolicyUpdated, actingEmployeeId, {
        versionId,
        contentDigest: write.contentDigest,
      });
      return this.load(tx, policyId);
    });
  }

  async markTesting(
    policyId: string,
    versionId: string,
    actingEmployeeId: string,
  ): Promise<AiPromptPolicyView> {
    return this.prisma.$transaction(async (tx) => {
      await lockPromptPolicyRow(tx, policyId);
      const version = await this.requireVersion(tx, policyId, versionId);
      if (assertPromptVersionTransition(version.status, 'MARK_TESTING')) {
        throw new BadRequestException('Only DRAFT prompt versions can move to TESTING');
      }
      await tx.aiPromptVersion.update({ where: { id: versionId }, data: { status: 'TESTING' } });
      await this.log(tx, policyId, AI_AUDIT_ACTION.promptPolicyUpdated, actingEmployeeId, {
        versionId,
        status: 'TESTING',
      });
      return this.load(tx, policyId);
    });
  }

  async publish(
    policyId: string,
    versionId: string,
    actingEmployeeId: string,
  ): Promise<AiPromptPolicyView> {
    return this.prisma.$transaction(async (tx) => {
      const locked = await lockPromptPolicyRow(tx, policyId);
      assertPromptPolicyMutable(locked.status);
      await this.requireVersion(tx, policyId, versionId);
      const published = await publishPromptVersionRow(tx, versionId, actingEmployeeId, new Date());
      await this.log(tx, policyId, AI_AUDIT_ACTION.promptVersionPublished, actingEmployeeId, {
        ...promptPublishAuditChanges({
          versionId,
          version: published.version,
          contentDigest: published.contentDigest,
          retiredVersionIds: published.retiredIds,
        }),
      });
      return this.load(tx, policyId);
    });
  }

  async rollback(
    policyId: string,
    fromVersionId: string,
    actingEmployeeId: string,
  ): Promise<AiPromptPolicyView> {
    return this.prisma.$transaction(async (tx) => {
      const locked = await lockPromptPolicyRow(tx, policyId);
      assertPromptPolicyMutable(locked.status);
      const source = await this.requireVersion(tx, policyId, fromVersionId);
      if (assertPromptVersionTransition(source.status, 'ROLLBACK_CLONE')) {
        throw new BadRequestException('Rollback requires a previously published prompt version');
      }
      if (!source.publishedAt) {
        throw new BadRequestException('Rollback requires a previously published prompt version');
      }
      const version = await nextPromptVersionNumber(tx, policyId);
      const created = await tx.aiPromptVersion.create({
        data: toNewVersionData(
          policyId,
          version,
          rollbackLayersFrom(source),
          actingEmployeeId,
          source.id,
        ),
      });
      const published = await publishPromptVersionRow(tx, created.id, actingEmployeeId, new Date());
      await this.log(tx, policyId, AI_AUDIT_ACTION.promptVersionRolledBack, actingEmployeeId, {
        fromVersionId: source.id,
        fromVersion: source.version,
        versionId: created.id,
        version: published.version,
        contentDigest: published.contentDigest,
      });
      return this.load(tx, policyId);
    });
  }

  async findById(policyId: string): Promise<AiPromptPolicyView | null> {
    const policy = await this.prisma.aiPromptPolicy.findUnique({
      where: { id: policyId },
      include: { versions: true },
    });
    return policy ? toPromptPolicyView(policy, policy.versions) : null;
  }

  async listAll(): Promise<AiPromptPolicyView[]> {
    const policies = await this.prisma.aiPromptPolicy.findMany({
      include: { versions: true },
      orderBy: { createdAt: 'desc' },
    });
    return policies.map((policy) => toPromptPolicyView(policy, policy.versions));
  }

  async requireAssignablePublished(
    policyId: string,
    tx: PrismaTransaction = this.prisma,
  ): Promise<AiPromptVersionAttribution> {
    const policy = await tx.aiPromptPolicy.findUnique({
      where: { id: policyId },
      include: { versions: true },
    });
    if (!policy) {
      throw new NotFoundException('Prompt policy not found');
    }
    if (policy.status === 'DISABLED' || policy.status === 'ARCHIVED') {
      throw new BadRequestException('Prompt policy is not assignable');
    }
    const published = policy.versions.find((item) => item.status === 'PUBLISHED');
    if (!published) {
      throw new BadRequestException('Prompt policy has no PUBLISHED version');
    }
    return {
      promptPolicyId: policy.id,
      promptVersionId: published.id,
      version: published.version,
      contentDigest: published.contentDigest,
      status: 'PUBLISHED',
    };
  }

  async resolvePublishedAttribution(
    policyId: string | null | undefined,
  ): Promise<AiPromptVersionAttribution | null> {
    if (!policyId) {
      return null;
    }
    return this.requireAssignablePublished(policyId);
  }

  private async requireVersion(tx: PrismaTransaction, policyId: string, versionId: string) {
    const version = await tx.aiPromptVersion.findUnique({ where: { id: versionId } });
    if (!version || version.policyId !== policyId) {
      throw new NotFoundException('Prompt version not found');
    }
    return version;
  }

  private async load(tx: PrismaTransaction, policyId: string): Promise<AiPromptPolicyView> {
    const policy = await tx.aiPromptPolicy.findUniqueOrThrow({
      where: { id: policyId },
      include: { versions: true },
    });
    return toPromptPolicyView(policy, policy.versions);
  }

  private async assertEmployeeExists(tx: PrismaTransaction, employeeId: string): Promise<void> {
    const employee = await tx.employee.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });
    if (!employee) {
      throw new BadRequestException('Owner employee not found');
    }
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
        entityType: AI_AUDIT_ENTITY.promptPolicy,
        entityId,
        action,
        actingEmployeeId,
        changes,
      },
      tx,
    );
  }
}
