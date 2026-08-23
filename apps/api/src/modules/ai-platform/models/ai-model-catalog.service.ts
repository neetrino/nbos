import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  isAiModelEvaluationStatus,
  isProductionAssignableModelStatus,
  type AiModelEvaluationStatus,
  type AiModelStatus,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import type { PrismaTransaction } from '../agents/agent-row-lock';
import { AGENT_DESCRIPTION_MAX_LENGTH } from '../ai-platform.constants';
import { toAiModelView, type AiModelView } from './ai-model.mapper';

const SUITABILITY_TAG_MAX_LENGTH = 40;
const SUITABILITY_TAG_MAX_COUNT = 20;

export interface UpdateModelSuitabilityInput {
  suitabilityTags?: string[];
  evaluationStatus?: string;
  notes?: string | null;
}

@Injectable()
export class AiModelCatalogService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AiPlatformAuditService,
  ) {}

  async findById(modelId: string): Promise<AiModelView | null> {
    const row = await this.prisma.aiModel.findUnique({ where: { id: modelId } });
    return row ? toAiModelView(row) : null;
  }

  async listByConnection(connectionId: string): Promise<AiModelView[]> {
    const rows = await this.prisma.aiModel.findMany({
      where: { connectionId },
      orderBy: [{ status: 'asc' }, { providerModelId: 'asc' }],
    });
    return rows.map((row) => toAiModelView(row));
  }

  async listAll(filter?: {
    connectionId?: string;
    status?: AiModelStatus;
  }): Promise<AiModelView[]> {
    const rows = await this.prisma.aiModel.findMany({
      where: {
        ...(filter?.connectionId ? { connectionId: filter.connectionId } : {}),
        ...(filter?.status ? { status: filter.status } : {}),
      },
      orderBy: [{ status: 'asc' }, { providerModelId: 'asc' }],
    });
    return rows.map((row) => toAiModelView(row));
  }

  async activate(modelId: string, actingEmployeeId: string): Promise<AiModelView> {
    return this.setStatus(modelId, 'ACTIVE', actingEmployeeId, AI_AUDIT_ACTION.modelActivated);
  }

  async disable(modelId: string, actingEmployeeId: string): Promise<AiModelView> {
    return this.setStatus(modelId, 'DISABLED', actingEmployeeId, AI_AUDIT_ACTION.modelDisabled);
  }

  async updateSuitability(
    modelId: string,
    input: UpdateModelSuitabilityInput,
    actingEmployeeId: string,
  ): Promise<AiModelView> {
    const suitabilityTags =
      input.suitabilityTags === undefined ? undefined : normalizeTags(input.suitabilityTags);
    const evaluationStatus = normalizeEvaluationStatus(input.evaluationStatus);
    const notes = input.notes === undefined ? undefined : normalizeNotes(input.notes);
    const updated = await this.prisma.$transaction(async (tx) => {
      await this.requireModel(tx, modelId);
      const row = await tx.aiModel.update({
        where: { id: modelId },
        data: {
          ...(suitabilityTags === undefined ? {} : { suitabilityTags }),
          ...(evaluationStatus === undefined ? {} : { evaluationStatus }),
          ...(notes === undefined ? {} : { notes }),
        },
      });
      await this.audit.logAdminAction(
        {
          entityType: AI_AUDIT_ENTITY.model,
          entityId: modelId,
          action: AI_AUDIT_ACTION.modelUpdated,
          actingEmployeeId,
          changes: {
            suitabilityChanged: suitabilityTags !== undefined,
            evaluationStatusChanged: evaluationStatus !== undefined,
            notesChanged: notes !== undefined,
          },
        },
        tx,
      );
      return row;
    });
    return toAiModelView(updated);
  }

  private async setStatus(
    modelId: string,
    status: Extract<AiModelStatus, 'ACTIVE' | 'DISABLED'>,
    actingEmployeeId: string,
    action: string,
  ): Promise<AiModelView> {
    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await this.requireModel(tx, modelId);
      if (status === 'ACTIVE' && current.status === 'UNAVAILABLE') {
        throw new BadRequestException('An unavailable model cannot be activated');
      }
      const row = await tx.aiModel.update({
        where: { id: modelId },
        data: {
          status,
          activatedAt: status === 'ACTIVE' ? now : current.activatedAt,
          activatedById: status === 'ACTIVE' ? actingEmployeeId : current.activatedById,
          disabledAt: status === 'DISABLED' ? now : null,
        },
      });
      await this.audit.logAdminAction(
        {
          entityType: AI_AUDIT_ENTITY.model,
          entityId: modelId,
          action,
          actingEmployeeId,
          changes: { status, previousStatus: current.status },
        },
        tx,
      );
      return row;
    });
    return toAiModelView(updated);
  }

  private async requireModel(tx: PrismaTransaction, modelId: string) {
    const row = await tx.aiModel.findUnique({ where: { id: modelId } });
    if (!row) {
      throw new NotFoundException('Model not found');
    }
    return row;
  }
}

export function assertModelAssignableForProduction(status: AiModelStatus): void {
  if (!isProductionAssignableModelStatus(status)) {
    throw new BadRequestException(
      'DISCOVERED or unavailable models cannot be production candidates',
    );
  }
}

function normalizeTags(tags: string[]): string[] {
  const normalized = [...new Set(tags.map((tag) => tag.trim().toUpperCase()).filter(Boolean))];
  if (normalized.length > SUITABILITY_TAG_MAX_COUNT) {
    throw new BadRequestException(`suitabilityTags exceeds ${SUITABILITY_TAG_MAX_COUNT}`);
  }
  if (normalized.some((tag) => tag.length > SUITABILITY_TAG_MAX_LENGTH)) {
    throw new BadRequestException(
      `suitability tag exceeds ${SUITABILITY_TAG_MAX_LENGTH} characters`,
    );
  }
  return normalized;
}

function normalizeNotes(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length > AGENT_DESCRIPTION_MAX_LENGTH) {
    throw new BadRequestException(`notes exceed ${AGENT_DESCRIPTION_MAX_LENGTH} characters`);
  }
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeEvaluationStatus(value: string | undefined): AiModelEvaluationStatus | undefined {
  if (value === undefined) return undefined;
  if (!isAiModelEvaluationStatus(value)) {
    throw new BadRequestException('evaluationStatus is invalid');
  }
  return value;
}
