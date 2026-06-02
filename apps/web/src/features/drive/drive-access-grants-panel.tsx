'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { employeesApi } from '@/lib/api/employees';
import type { DriveGrantRow } from '@/lib/api/drive';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDriveLabel } from './drive-format';
import { FILE_GRANT_PERMISSIONS } from './drive-grant-permissions';

type EmployeeOption = { id: string; label: string; subtitle?: string };

export type DriveAccessGrantsApi = {
  listGrants: () => Promise<DriveGrantRow[]>;
  createGrant: (body: { granteeEmployeeId: string; permission?: string }) => Promise<unknown>;
  revokeGrant: (grantId: string) => Promise<unknown>;
};

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
  const [search, setSearch] = useState('');
  const [hits, setHits] = useState<EmployeeOption[]>([]);
  const [granteeId, setGranteeId] = useState('');
  const [granteeLabel, setGranteeLabel] = useState('');
  const [permission, setPermission] = useState<string>('VIEW');

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

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const t = window.setTimeout(() => {
      void employeesApi.getAll({ pageSize: 15, search: q }).then((data) => {
        setHits(
          data.items.map((e) => ({
            id: e.id,
            label: `${e.firstName} ${e.lastName}`.trim(),
            subtitle: e.position ?? e.email,
          })),
        );
      });
    }, 350);
    return () => window.clearTimeout(t);
  }, [search]);

  async function submitGrant() {
    if (!granteeId) {
      toast.error('Pick an employee to grant access.');
      return;
    }
    setBusy(true);
    try {
      await api.createGrant({ granteeEmployeeId: granteeId, permission });
      toast.success('Access granted', {
        description: `${granteeLabel || 'Employee'} · ${formatDriveLabel(permission)}`,
      });
      setGranteeId('');
      setGranteeLabel('');
      setSearch('');
      setHits([]);
      await refresh();
      onChanged?.();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Grant failed.');
    } finally {
      setBusy(false);
    }
  }

  async function revoke(grant: DriveGrantRow) {
    setBusy(true);
    try {
      await api.revokeGrant(grant.id);
      toast.success('Access revoked', {
        description: grant.granteeLabel ?? grant.granteeEmployeeId,
      });
      await refresh();
      onChanged?.();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Revoke failed.');
    } finally {
      setBusy(false);
    }
  }

  const subjectNoun = subjectKind === 'folder' ? 'folder' : 'file';

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">
        Add people who can open this {subjectNoun}. Folder access is the usual way to share Drive
        content in NBOS.
      </p>

      <div className="border-border/80 bg-muted/30 space-y-2 rounded-2xl border p-3">
        <Input
          placeholder="Add people by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={busy}
          aria-label="Search employees for grant"
        />
        {hits.length > 0 ? (
          <ul className="border-border/60 bg-background max-h-36 space-y-1 overflow-y-auto rounded-lg border p-1">
            {hits.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  className="hover:bg-muted flex w-full rounded-md px-2 py-1.5 text-left text-xs"
                  onClick={() => {
                    setGranteeId(h.id);
                    setGranteeLabel(h.label);
                    setHits([]);
                    setSearch(h.label);
                  }}
                >
                  <span className="font-medium">{h.label}</span>
                  {h.subtitle ? (
                    <span className="text-muted-foreground ml-2 truncate">{h.subtitle}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[10rem] flex-1">
            <span className="text-muted-foreground mb-1 block text-[10px] font-medium tracking-wide uppercase">
              Permission
            </span>
            <Select
              value={permission}
              onValueChange={(v) => setPermission(v ?? 'VIEW')}
              disabled={busy}
            >
              <SelectTrigger aria-label="Grant permission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILE_GRANT_PERMISSIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {formatDriveLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={busy || !granteeId}
            onClick={() => void submitGrant()}
          >
            Grant
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-foreground text-xs font-medium">People with access</p>
        {loading ? (
          <p className="text-muted-foreground text-xs">Loading…</p>
        ) : grants.length === 0 ? (
          <p className="text-muted-foreground text-xs">Only you have access so far.</p>
        ) : (
          grants.map((g) => (
            <div
              key={g.id}
              className="bg-muted/60 flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs"
            >
              <div className="min-w-0">
                <div className="text-foreground font-medium">
                  {g.granteeLabel ?? g.granteeEmployeeId}
                </div>
                <div className="text-muted-foreground">{formatDriveLabel(g.permission)}</div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void revoke(g)}
              >
                Revoke
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
