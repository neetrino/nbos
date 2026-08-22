import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import {
  canTransitionEvaluationRun,
  isAiEvaluationGradingKind,
  type AiEvaluationDatasetRef,
  type AiEvaluationGradingKind,
  type AiEvaluationRunRecord,
  type AiEvaluationRunStatus,
  type AiEvaluationSuiteRecord,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { AGENT_NAME_MAX_LENGTH } from '../ai-platform.constants';
import {
  toEvaluationDatasetView,
  toEvaluationRunView,
  toEvaluationSuiteView,
} from './ai-evaluation.mapper';

export interface CreateEvaluationSuiteInput {
  name: string;
  purpose?: string | null;
  domainModule?: string | null;
  gradingKinds: AiEvaluationGradingKind[];
}

export interface CreateEvaluationDatasetInput {
  name: string;
  identityKey: string;
  version: number;
}

export interface CreateEvaluationRunInput {
  datasetId: string;
  gradingKind: AiEvaluationGradingKind;
  modelId?: string | null;
  modelPolicyId?: string | null;
  promptVersionId?: string | null;
}

export interface CompleteEvaluationRunInput {
  qualityScore?: string | null;
  latencyMsAvg?: number | null;
  estimatedCost?: string | null;
  currency?: string | null;
  sampleCount?: number | null;
  notes?: string | null;
  reviewerEmployeeId?: string | null;
}

@Injectable()
export class AiEvaluationService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async createSuite(
    input: CreateEvaluationSuiteInput,
    createdById: string,
  ): Promise<AiEvaluationSuiteRecord> {
    const name = requireName(input.name);
    const gradingKinds = uniqueGradingKinds(input.gradingKinds);
    const created = await this.prisma.aiEvaluationSuite.create({
      data: {
        name,
        purpose: input.purpose?.trim() || null,
        domainModule: input.domainModule?.trim() || null,
        gradingKinds,
        createdById,
      },
    });
    return toEvaluationSuiteView(created);
  }

  async addDataset(
    suiteId: string,
    input: CreateEvaluationDatasetInput,
    createdById: string,
  ): Promise<AiEvaluationDatasetRef> {
    await this.requireSuite(suiteId);
    const created = await this.prisma.aiEvaluationDataset.create({
      data: {
        suiteId,
        name: requireName(input.name),
        identityKey: requireName(input.identityKey),
        version: requireVersion(input.version),
        createdById,
      },
    });
    return toEvaluationDatasetView(created);
  }

  async createRun(
    suiteId: string,
    input: CreateEvaluationRunInput,
    createdById: string,
  ): Promise<AiEvaluationRunRecord> {
    const suite = await this.requireSuite(suiteId);
    if (!isAiEvaluationGradingKind(input.gradingKind)) {
      throw new BadRequestException('Unknown grading kind');
    }
    if (!suite.gradingKinds.includes(input.gradingKind)) {
      throw new BadRequestException('Suite does not include this grading kind');
    }
    const dataset = await this.prisma.aiEvaluationDataset.findFirst({
      where: { id: input.datasetId, suiteId },
    });
    if (!dataset) {
      throw new BadRequestException('Dataset does not belong to this suite');
    }
    if (!input.modelId && !input.modelPolicyId) {
      throw new BadRequestException('Run requires a model or Model Policy target');
    }
    const created = await this.prisma.aiEvaluationRun.create({
      data: {
        suiteId,
        datasetId: dataset.id,
        gradingKind: input.gradingKind,
        modelId: input.modelId ?? null,
        modelPolicyId: input.modelPolicyId ?? null,
        promptVersionId: input.promptVersionId ?? null,
        createdById,
      },
    });
    return toEvaluationRunView(created);
  }

  async startRun(runId: string): Promise<AiEvaluationRunRecord> {
    return this.transition(runId, 'RUNNING', { startedAt: new Date() });
  }

  async completeRun(
    runId: string,
    input: CompleteEvaluationRunInput,
  ): Promise<AiEvaluationRunRecord> {
    return this.transition(runId, 'COMPLETED', {
      completedAt: new Date(),
      qualityScore: input.qualityScore ? new Decimal(input.qualityScore) : null,
      latencyMsAvg: input.latencyMsAvg ?? null,
      estimatedCost: input.estimatedCost ? new Decimal(input.estimatedCost) : null,
      currency: input.currency ?? null,
      sampleCount: input.sampleCount ?? null,
      notes: input.notes?.trim() || null,
      reviewerEmployeeId: input.reviewerEmployeeId ?? null,
    });
  }

  async listSuites(): Promise<AiEvaluationSuiteRecord[]> {
    const rows = await this.prisma.aiEvaluationSuite.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(toEvaluationSuiteView);
  }

  async listRuns(suiteId: string): Promise<AiEvaluationRunRecord[]> {
    const rows = await this.prisma.aiEvaluationRun.findMany({
      where: { suiteId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toEvaluationRunView);
  }

  private async requireSuite(id: string): Promise<AiEvaluationSuiteRecord> {
    const row = await this.prisma.aiEvaluationSuite.findUnique({ where: { id } });
    if (!row) throw new BadRequestException('Evaluation suite not found');
    return toEvaluationSuiteView(row);
  }

  private async transition(
    runId: string,
    to: AiEvaluationRunStatus,
    data: {
      status?: AiEvaluationRunStatus;
      startedAt?: Date;
      completedAt?: Date | null;
      qualityScore?: Decimal | null;
      latencyMsAvg?: number | null;
      estimatedCost?: Decimal | null;
      currency?: string | null;
      sampleCount?: number | null;
      notes?: string | null;
      reviewerEmployeeId?: string | null;
    },
  ): Promise<AiEvaluationRunRecord> {
    const row = await this.prisma.aiEvaluationRun.findUnique({ where: { id: runId } });
    if (!row) throw new BadRequestException('Evaluation run not found');
    if (!canTransitionEvaluationRun(row.status, to)) {
      throw new BadRequestException(`Cannot move evaluation run from ${row.status} to ${to}`);
    }
    const updated = await this.prisma.aiEvaluationRun.update({
      where: { id: runId },
      data: { status: to, ...data },
    });
    return toEvaluationRunView(updated);
  }
}

function requireName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > AGENT_NAME_MAX_LENGTH) {
    throw new BadRequestException('Name is invalid');
  }
  return trimmed;
}

function requireVersion(version: number): number {
  if (!Number.isInteger(version) || version < 1) {
    throw new BadRequestException('Dataset version must be a positive integer');
  }
  return version;
}

function uniqueGradingKinds(kinds: AiEvaluationGradingKind[]): AiEvaluationGradingKind[] {
  if (kinds.length === 0) {
    throw new BadRequestException('At least one grading kind is required');
  }
  const unique = [...new Set(kinds)];
  if (unique.some((kind) => !isAiEvaluationGradingKind(kind))) {
    throw new BadRequestException('Unknown grading kind');
  }
  return unique;
}
