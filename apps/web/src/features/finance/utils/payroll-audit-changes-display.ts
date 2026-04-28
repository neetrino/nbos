/** Pulls NBOS payroll `STATUS_CHANGED` payload `materializedExpenseIds` when present. */
export function extractMaterializedExpenseIds(changes: unknown): readonly string[] {
  if (changes == null || typeof changes !== 'object' || Array.isArray(changes)) {
    return [];
  }
  const raw = (changes as Record<string, unknown>).materializedExpenseIds;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
}

/** JSON body for audit `changes` without the id list (links are shown separately). */
export function formatPayrollAuditChangesBody(changes: unknown): string {
  if (changes == null) return '—';
  try {
    if (typeof changes === 'object' && !Array.isArray(changes)) {
      const o = { ...(changes as Record<string, unknown>) };
      delete o.materializedExpenseIds;
      return JSON.stringify(o, null, 2);
    }
    return JSON.stringify(changes, null, 2);
  } catch {
    return String(changes);
  }
}
