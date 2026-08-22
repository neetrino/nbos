import { beforeEach, describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { evaluationScoreMayAutoActivateModel } from '@nbos/shared';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiEvaluationService } from './ai-evaluation.service';

function suiteRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'suite-1',
    name: 'Task quality',
    purpose: null,
    status: 'DRAFT',
    domainModule: 'Tasks',
    gradingKinds: ['DETERMINISTIC', 'HUMAN'],
    ...overrides,
  };
}

function datasetRow() {
  return {
    id: 'dataset-1',
    suiteId: 'suite-1',
    name: 'gold-v1',
    identityKey: 'gold',
    version: 1,
  };
}

function runRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'run-1',
    suiteId: 'suite-1',
    datasetId: 'dataset-1',
    modelId: 'model-1',
    modelPolicyId: null,
    promptVersionId: 'prompt-v1',
    status: 'PENDING',
    gradingKind: 'DETERMINISTIC',
    qualityScore: null,
    latencyMsAvg: null,
    estimatedCost: null,
    currency: null,
    sampleCount: null,
    reviewerEmployeeId: null,
    notes: null,
    startedAt: null,
    completedAt: null,
    ...overrides,
  };
}

describe('AiEvaluationService', () => {
  let prisma: MockPrisma;
  let service: AiEvaluationService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new AiEvaluationService(prisma as never);
  });

  it('refuses a grading kind the suite does not include', async () => {
    prisma.aiEvaluationSuite.findUnique.mockResolvedValue(suiteRow());
    await expect(
      service.createRun(
        'suite-1',
        { datasetId: 'dataset-1', gradingKind: 'MODEL_BASED', modelId: 'model-1' },
        'emp-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.aiEvaluationRun.create).not.toHaveBeenCalled();
  });

  it('creates a run with exactly one grading kind and target attribution', async () => {
    prisma.aiEvaluationSuite.findUnique.mockResolvedValue(suiteRow());
    prisma.aiEvaluationDataset.findFirst.mockResolvedValue(datasetRow());
    prisma.aiEvaluationRun.create.mockResolvedValue(runRow());

    const created = await service.createRun(
      'suite-1',
      {
        datasetId: 'dataset-1',
        gradingKind: 'DETERMINISTIC',
        modelId: 'model-1',
        promptVersionId: 'prompt-v1',
      },
      'emp-1',
    );

    expect(created.gradingKind).toBe('DETERMINISTIC');
    expect(created.modelId).toBe('model-1');
    expect(created.promptVersionId).toBe('prompt-v1');
    expect(prisma.aiEvaluationRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ gradingKind: 'DETERMINISTIC', modelId: 'model-1' }),
      }),
    );
  });

  it('stores aggregate results without activating a model', async () => {
    prisma.aiEvaluationRun.findUnique.mockResolvedValue(runRow({ status: 'RUNNING' }));
    prisma.aiEvaluationRun.update.mockResolvedValue(
      runRow({
        status: 'COMPLETED',
        qualityScore: { toString: () => '0.91' },
        latencyMsAvg: 120,
        estimatedCost: { toString: () => '0.40' },
        currency: 'USD',
        sampleCount: 10,
        completedAt: new Date(),
      }),
    );

    const completed = await service.completeRun('run-1', {
      qualityScore: '0.91',
      latencyMsAvg: 120,
      estimatedCost: '0.40',
      currency: 'USD',
      sampleCount: 10,
    });

    expect(completed.status).toBe('COMPLETED');
    expect(completed.qualityScore).toBe('0.91');
    expect(evaluationScoreMayAutoActivateModel()).toBe(false);
    expect(prisma.aiModel.update).not.toHaveBeenCalled();
  });
});
