import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';
import {
  FINANCE_BONUSES_MODULE,
  assertCompanyWideFinanceAccess,
  assertEmployeeAccessible,
  assertFinancePayScope,
  employeeIdWhere,
  resolveAccessibleEmployeeIds,
  type AccessibleEmployeeIds,
  type FinancePayActor,
} from '../compensation-profiles/finance-pay-access';

export function toBonusActor(user: CurrentUserPayload): FinancePayActor {
  return user;
}

export function requirePoolKeyQuery(poolKey: string | undefined): string {
  const key = poolKey?.trim();
  if (!key) {
    throw new BadRequestException('poolKey query parameter is required');
  }
  return key;
}

export async function resolveBonusReadAccess(
  prisma: InstanceType<typeof PrismaClient>,
  actor: FinancePayActor,
): Promise<AccessibleEmployeeIds> {
  const scope = assertFinancePayScope(actor, FINANCE_BONUSES_MODULE, 'VIEW', [
    'ALL',
    'DEPARTMENT',
    'OWN',
  ]);
  return resolveAccessibleEmployeeIds(prisma, actor, scope);
}

export async function resolveBonusWriteAccess(
  prisma: InstanceType<typeof PrismaClient>,
  actor: FinancePayActor,
  action: 'ADD' | 'EDIT',
): Promise<AccessibleEmployeeIds> {
  const scope = assertFinancePayScope(actor, FINANCE_BONUSES_MODULE, action, [
    'ALL',
    'DEPARTMENT',
    'OWN',
  ]);
  return resolveAccessibleEmployeeIds(prisma, actor, scope);
}

export function assertBonusEmployeeAccess(
  employeeId: string,
  accessible: AccessibleEmployeeIds,
): void {
  assertEmployeeAccessible(employeeId, accessible);
}

export function assertCompanyBonusAccess(
  actor: FinancePayActor,
  action: 'VIEW' | 'EDIT' | 'ADD',
): void {
  assertCompanyWideFinanceAccess(actor, FINANCE_BONUSES_MODULE, action);
}

export function mergeBonusEmployeeFilter(
  requestedEmployeeId: string | undefined,
  accessible: AccessibleEmployeeIds,
): { employeeId?: string | { in: string[] } } {
  if (requestedEmployeeId) {
    if (accessible !== 'ALL' && !accessible.includes(requestedEmployeeId)) {
      throw new ForbiddenException('Not allowed to access this employee compensation');
    }
    return { employeeId: requestedEmployeeId };
  }
  return employeeIdWhere(accessible);
}
