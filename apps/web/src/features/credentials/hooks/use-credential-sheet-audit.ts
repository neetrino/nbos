'use client';

import { useCallback, useEffect, useState } from 'react';
import { credentialsApi } from '@/lib/api/credentials';
import type { AuditLogEntry } from '@/lib/api/audit';

export function useCredentialSheetAudit(credentialId: string | null, sheetOpen: boolean) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!credentialId) return;
    setLoading(true);
    try {
      const data = await credentialsApi.getAuditLog(credentialId, { page: 1, pageSize: 20 });
      setEntries(data.items);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [credentialId]);

  useEffect(() => {
    if (sheetOpen && credentialId) void load();
  }, [sheetOpen, credentialId, load]);

  return { entries, loading, reload: load };
}
