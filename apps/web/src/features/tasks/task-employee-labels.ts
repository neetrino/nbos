import { employeesApi } from '@/lib/api/employees';

/** Resolves display names for employee ids (sheet participants). */
export async function resolveEmployeeLabelMap(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return {};

  const entries = await Promise.all(
    unique.map(async (id) => {
      try {
        const employee = await employeesApi.getById(id);
        return [id, `${employee.firstName} ${employee.lastName}`.trim()] as const;
      } catch {
        return [id, id] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
}

export function pickEmployeeLabels(
  ids: string[],
  labelMap: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(ids.map((id) => [id, labelMap[id] ?? id]));
}
