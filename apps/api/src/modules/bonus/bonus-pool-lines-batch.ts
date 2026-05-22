import { BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  queryBonusPoolEmployeeLines,
  type BonusPoolEmployeeLineDto,
} from './bonus-pool-employee-lines';

export const BONUS_POOL_LINES_BATCH_MAX = 30;

export type BonusPoolEmployeeLinesBatchDto = {
  poolKey: string;
  lines: BonusPoolEmployeeLineDto[];
};

export function parsePoolKeysQuery(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    throw new BadRequestException('poolKeys query parameter is required');
  }
  const keys = [
    ...new Set(
      raw
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
    ),
  ];
  if (keys.length === 0) {
    throw new BadRequestException('poolKeys must contain at least one pool key');
  }
  if (keys.length > BONUS_POOL_LINES_BATCH_MAX) {
    throw new BadRequestException(
      `poolKeys supports at most ${BONUS_POOL_LINES_BATCH_MAX} keys per request`,
    );
  }
  return keys;
}

export async function queryBonusPoolEmployeeLinesBatch(
  prisma: InstanceType<typeof PrismaClient>,
  poolKeys: readonly string[],
): Promise<BonusPoolEmployeeLinesBatchDto[]> {
  const keys = [...new Set(poolKeys)].slice(0, BONUS_POOL_LINES_BATCH_MAX);
  const results = await Promise.all(
    keys.map((poolKey) => queryBonusPoolEmployeeLines(prisma, poolKey)),
  );
  return results.map((r) => ({ poolKey: r.poolKey, lines: r.lines }));
}
