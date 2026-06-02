interface RecentAuditRow {
  entityId: string;
  createdAt: Date;
}

/** Keeps the latest audit timestamp per credential id, returns ids newest-first. */
export function dedupeRecentCredentialIds(rows: RecentAuditRow[], limit: number): string[] {
  const latestById = new Map<string, Date>();
  for (const row of rows) {
    const prev = latestById.get(row.entityId);
    if (!prev || row.createdAt > prev) {
      latestById.set(row.entityId, row.createdAt);
    }
  }
  return [...latestById.entries()]
    .sort((a, b) => b[1].getTime() - a[1].getTime())
    .slice(0, limit)
    .map(([id]) => id);
}
