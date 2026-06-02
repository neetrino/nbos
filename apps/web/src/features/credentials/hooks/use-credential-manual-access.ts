'use client';

import { useCallback, useEffect, useState } from 'react';
import { credentialsApi, type CredentialManualGrant } from '@/lib/api/credentials';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { toast } from 'sonner';

export function useCredentialManualAccess(credentialId: string | null, sheetOpen: boolean) {
  const [grants, setGrants] = useState<CredentialManualGrant[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!credentialId) return;
    setLoading(true);
    try {
      const data = await credentialsApi.getManualAccess(credentialId);
      setGrants(data.grants);
    } catch {
      setGrants([]);
      toast.error('Could not load manual access');
    } finally {
      setLoading(false);
    }
  }, [credentialId]);

  useEffect(() => {
    if (sheetOpen && credentialId) void load();
  }, [sheetOpen, credentialId, load]);

  useEffect(() => {
    if (sheetOpen) {
      void employeesApi.getAll({ pageSize: 200 }).then((r) => setEmployees(r.items));
    }
  }, [sheetOpen]);

  const save = useCallback(async () => {
    if (!credentialId) return false;
    setSaving(true);
    try {
      const data = await credentialsApi.replaceManualAccess(credentialId, grants);
      setGrants(data.grants);
      toast.success('Manual access saved');
      return true;
    } catch {
      toast.error('Could not save manual access');
      return false;
    } finally {
      setSaving(false);
    }
  }, [credentialId, grants]);

  return {
    grants,
    setGrants,
    employees,
    loading,
    saving,
    save,
    reload: load,
  };
}
