'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { User } from 'lucide-react';
import { toast } from 'sonner';
import { RelationPickerField } from '@/components/shared';
import { RELATION_PICKER_CHIP_STACK_CLASS } from '@/components/shared/detail-sheet-classes';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { useEmployeeRelationSearch } from '@/components/shared/relation-picker/relation-search-loaders';
import type { DriveGrantRow } from '@/lib/api/drive';
import { DriveManualAccessGrantRow } from './drive-manual-access-grant-row';

export type DriveAccessGrantsApi = {
  listGrants: () => Promise<DriveGrantRow[]>;
  createGrant: (body: { granteeEmployeeId: string; permission?: string }) => Promise<unknown>;
  revokeGrant: (grantId: string) => Promise<unknown>;
};

const DEFAULT_GRANT_PERMISSION = 'VIEW';

export function DriveAccessGrantsPanel({
  subjectKind,
  api,
  onChanged,
}: {
  subjectKind: 'file' | 'folder';
  api: DriveAccessGrantsApi;
  onChanged?: () => void;
}) {
  const [grants, setGrants] = useState<DriveGrantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const granteeIds = useMemo(() => new Set(grants.map((g) => g.granteeEmployeeId)), [grants]);
  const searchEmployees = useEmployeeRelationSearch(granteeIds);
  const employeePicker = useRelationPickerActions('employee', 'drive-manual-access');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await api.listGrants();
      setGrants(rows);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not load access grants.');
      setGrants([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addEmployee = useCallback(
    async (employeeId: string, label: string) => {
      setBusy(true);
      try {
        await api.createGrant({
          granteeEmployeeId: employeeId,
          permission: DEFAULT_GRANT_PERMISSION,
        });
        toast.success('Access granted', {
          description: `${label} · ${DEFAULT_GRANT_PERMISSION}`,
        });
        await refresh();
        onChanged?.();
      } catch (caught) {
        toast.error(caught instanceof Error ? caught.message : 'Grant failed.');
      } finally {
        setBusy(false);
      }
    },
    [api, onChanged, refresh],
  );

  const changePermission = useCallback(
    async (grant: DriveGrantRow, permission: string) => {
      if (grant.permission === permission) return;
      setBusy(true);
      try {
        await api.createGrant({
          granteeEmployeeId: grant.granteeEmployeeId,
          permission,
        });
        await refresh();
        onChanged?.();
      } catch (caught) {
        toast.error(caught instanceof Error ? caught.message : 'Could not update access.');
      } finally {
        setBusy(false);
      }
    },
    [api, onChanged, refresh],
  );

  const revoke = useCallback(
    async (grantId: string, label: string) => {
      setBusy(true);
      try {
        await api.revokeGrant(grantId);
        toast.success('Access revoked', { description: label });
        await refresh();
        onChanged?.();
      } catch (caught) {
        toast.error(caught instanceof Error ? caught.message : 'Revoke failed.');
      } finally {
        setBusy(false);
      }
    },
    [api, onChanged, refresh],
  );

  const subjectHint =
    subjectKind === 'folder'
      ? 'Folder access is the usual way to share Drive content. Inherited access from project links is not listed here.'
      : 'Explicit grants override default Drive visibility for this file.';

  return (
    <section className="grid gap-5" aria-label="Manual access">
      <p className="text-muted-foreground text-xs leading-relaxed">{subjectHint}</p>

      <RelationPickerField
        label="Add employee"
        entityKind="employee"
        value={null}
        selectionLabel={null}
        placeholder="Choose…"
        icon={<User size={12} />}
        disabled={busy}
        onSearch={searchEmployees}
        onSelect={(id, label) => void addEmployee(id, label)}
        {...employeePicker}
      />

      <div className={RELATION_PICKER_CHIP_STACK_CLASS}>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : grants.length === 0 ? (
          <p className="text-muted-foreground text-sm">No manual grants yet.</p>
        ) : (
          grants.map((grant) => (
            <DriveManualAccessGrantRow
              key={grant.id}
              grant={grant}
              disabled={busy}
              onPermissionChange={(_, permission) => void changePermission(grant, permission)}
              onRevoke={(grantId) =>
                void revoke(grantId, grant.granteeLabel ?? grant.granteeEmployeeId)
              }
            />
          ))
        )}
      </div>
    </section>
  );
}
