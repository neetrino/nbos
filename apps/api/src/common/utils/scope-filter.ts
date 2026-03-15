/**
 * Применяет фильтр по scope к Prisma `where` условию.
 *
 * - ALL -> без фильтра
 * - DEPARTMENT -> departmentId IN departmentIds (все отделы сотрудника)
 * - OWN -> фильтр по полю владельца (employeeId, creatorId, и т.д.)
 */
export function applyScopeFilter(
  where: Record<string, unknown>,
  scope: string,
  employeeId: string,
  departmentIds: string[],
  ownerField = 'employeeId',
): Record<string, unknown> {
  switch (scope) {
    case 'ALL':
      return where;

    case 'DEPARTMENT':
      return {
        ...where,
        OR: [{ [ownerField]: employeeId }, { departmentId: { in: departmentIds } }],
      };

    case 'OWN':
      return { ...where, [ownerField]: employeeId };

    default:
      return { ...where, [ownerField]: employeeId };
  }
}
