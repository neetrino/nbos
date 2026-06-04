import type { Prisma, PrismaClient } from '@nbos/database';
import { resolveExpenseParticipationWhere } from '../finance/finance-module-participation.where';
import type { FinanceScopedAccessContext } from '../finance/finance-scoped-access';
import {
  isPayrollExpenseListScope,
  type ExpensePayrollListScopeParams,
} from './expense-payroll-list-scope';

/** List/stats participation; payroll Pay Now paths skip project graph filters. */
export async function resolveExpenseListParticipationWhere(
  prisma: InstanceType<typeof PrismaClient>,
  access: FinanceScopedAccessContext | undefined,
  payrollScope: ExpensePayrollListScopeParams,
): Promise<Prisma.ExpenseWhereInput | undefined> {
  if (isPayrollExpenseListScope(payrollScope)) {
    return undefined;
  }
  return resolveExpenseParticipationWhere(prisma, access);
}
