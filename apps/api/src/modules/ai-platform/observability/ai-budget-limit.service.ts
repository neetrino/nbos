import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import {
  evaluateAiBudget,
  isAiBudgetBehavior,
  isAiBudgetScopeType,
  PLATFORM_ORGANIZATION_SCOPE_ID,
  type AiBudgetBehavior,
  type AiBudgetEvaluation,
  type AiBudgetLimitRecord,
  type AiBudgetMetric,
  type AiBudgetPeriod,
  type AiBudgetScopeType,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { AGENT_NAME_MAX_LENGTH } from '../ai-platform.constants';

export interface CreateAiBudgetLimitInput {
  name: string;
  scopeType: AiBudgetScopeType;
  scopeId: string;
  metric: AiBudgetMetric;
  period: AiBudgetPeriod;
  ceiling: string;
  currency?: string | null;
  behavior: AiBudgetBehavior;
}

@Injectable()
export class AiBudgetLimitService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async create(input: CreateAiBudgetLimitInput, createdById: string): Promise<AiBudgetLimitRecord> {
    const record = normalizeBudgetInput(input);
    const created = await this.prisma.aiBudgetLimit.create({
      data: {
        ...record,
        ceiling: new Decimal(record.ceiling),
        createdById,
      },
    });
    return toBudgetView(created);
  }

  async listEnabled(): Promise<AiBudgetLimitRecord[]> {
    const rows = await this.prisma.aiBudgetLimit.findMany({
      where: { enabled: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toBudgetView);
  }

  async evaluate(limit: AiBudgetLimitRecord, usedAmount: string): Promise<AiBudgetEvaluation> {
    return evaluateAiBudget(limit, usedAmount);
  }
}

function normalizeBudgetInput(input: CreateAiBudgetLimitInput): CreateAiBudgetLimitInput {
  const name = input.name.trim();
  if (!name || name.length > AGENT_NAME_MAX_LENGTH) {
    throw new BadRequestException('Budget name is invalid');
  }
  if (!isAiBudgetScopeType(input.scopeType) || !isAiBudgetBehavior(input.behavior)) {
    throw new BadRequestException('Budget scope or behavior is invalid');
  }
  const scopeId =
    input.scopeType === 'ORGANIZATION' ? PLATFORM_ORGANIZATION_SCOPE_ID : input.scopeId.trim();
  if (!scopeId) {
    throw new BadRequestException('Budget scope id is required');
  }
  const ceiling = Number(input.ceiling);
  if (!Number.isFinite(ceiling) || ceiling < 0) {
    throw new BadRequestException('Budget ceiling is invalid');
  }
  return { ...input, name, scopeId, ceiling: input.ceiling };
}

function toBudgetView(row: {
  id: string;
  name: string;
  scopeType: AiBudgetScopeType;
  scopeId: string;
  metric: AiBudgetMetric;
  period: AiBudgetPeriod;
  ceiling: { toString(): string };
  currency: string | null;
  behavior: AiBudgetBehavior;
  enabled: boolean;
}): AiBudgetLimitRecord {
  return {
    id: row.id,
    name: row.name,
    scopeType: row.scopeType,
    scopeId: row.scopeId,
    metric: row.metric,
    period: row.period,
    ceiling: row.ceiling.toString(),
    currency: row.currency,
    behavior: row.behavior,
    enabled: row.enabled,
  };
}
