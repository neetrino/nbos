'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState, RelationPickerField } from '@/components/shared';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { useEmployeeRelationSearch } from '@/components/shared/relation-picker/relation-search-loaders';
import { mailApi, type MailAccountAccessListDto, type MailAccountAccessRole } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { MailSheetPanelHeader } from './MailSheetPanelHeader';

export interface ShareMailboxSheetProps {
  enabled: boolean;
  accountId: string;
  accountEmail: string;
}

const ROLES: MailAccountAccessRole[] = ['ADMIN', 'SENDER', 'READER'];
const MAIL_SHARE_DEFAULT_ROLE: MailAccountAccessRole = 'SENDER';

export function ShareMailboxSheet({ enabled, accountId, accountEmail }: ShareMailboxSheetProps) {
  const [access, setAccess] = useState<MailAccountAccessListDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [grantEmployeeIds, setGrantEmployeeIds] = useState<string[]>([]);
  const [grantEmployeeLabels, setGrantEmployeeLabels] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const excludeEmployeeIds = useMemo(() => {
    const ids = new Set<string>();
    if (access?.owner?.employeeId) {
      ids.add(access.owner.employeeId);
    }
    access?.entries.forEach((entry) => ids.add(entry.employeeId));
    return ids;
  }, [access]);

  const searchEmployees = useEmployeeRelationSearch(excludeEmployeeIds);
  const employeePicker = useRelationPickerActions('employee', 'mail-share-mailbox');

  const clearGrantSelection = () => {
    setGrantEmployeeIds([]);
    setGrantEmployeeLabels({});
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAccess(await mailApi.listAccess(accountId));
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not load mailbox access.'));
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    setGrantEmployeeIds([]);
    setGrantEmployeeLabels({});
    void load();
  }, [enabled, load]);

  const canManage = access?.viewerRole === 'OWNER' || access?.viewerRole === 'ADMIN';

  const grant = async () => {
    if (grantEmployeeIds.length === 0) {
      toast.error('Select people to share with.');
      return;
    }
    setBusy(true);
    let lastAccess: MailAccountAccessListDto | null = null;
    let grantedCount = 0;
    let lastError: unknown;
    try {
      for (const employeeId of grantEmployeeIds) {
        try {
          lastAccess = await mailApi.grantAccess(accountId, employeeId, MAIL_SHARE_DEFAULT_ROLE);
          grantedCount += 1;
        } catch (error) {
          lastError = error;
        }
      }
      if (lastAccess) {
        setAccess(lastAccess);
      }
      if (grantedCount > 0) {
        clearGrantSelection();
        toast.success(
          grantedCount === 1
            ? 'Access granted as Sender.'
            : `Shared with ${grantedCount} people as Sender.`,
        );
      }
      if (lastError) {
        toast.error(getApiErrorMessage(lastError, 'Could not grant access to everyone.'));
      }
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (employeeId: string, role: MailAccountAccessRole) => {
    setBusy(true);
    try {
      setAccess(await mailApi.updateAccessRole(accountId, employeeId, role));
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not change role.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (employeeId: string) => {
    setBusy(true);
    try {
      setAccess(await mailApi.removeAccess(accountId, employeeId));
      toast.success('Access removed.');
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not remove access.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MailSheetPanelHeader title="Share mailbox" description={accountEmail} />

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {loading || !access ? (
          <LoadingState />
        ) : (
          <div className="flex flex-col gap-4">
            {access.owner ? (
              <div className="border-border flex items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <EmployeePersonAvatar label={access.owner.employeeName} />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{access.owner.employeeName}</div>
                    <div className="text-muted-foreground truncate text-xs">
                      {access.owner.employeeEmail}
                    </div>
                  </div>
                </div>
                <span className="text-muted-foreground text-xs">Owner</span>
              </div>
            ) : null}

            {access.entries.map((entry) => (
              <div
                key={entry.id}
                className="border-border flex items-center justify-between gap-2 rounded-2xl border px-3 py-3 text-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <EmployeePersonAvatar label={entry.employeeName} />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{entry.employeeName}</div>
                    <div className="text-muted-foreground truncate text-xs">
                      {entry.employeeEmail}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={entry.role}
                    onValueChange={(value) =>
                      void changeRole(entry.employeeId, value as MailAccountAccessRole)
                    }
                  >
                    <SelectTrigger size="sm" className="w-28" disabled={!canManage || busy}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {canManage ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground size-8"
                      disabled={busy}
                      onClick={() => void remove(entry.employeeId)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
            {access.entries.length === 0 ? (
              <p className="text-muted-foreground text-sm">Not shared with anyone yet.</p>
            ) : null}

            {canManage ? (
              <div className="border-border flex flex-col gap-3 border-t pt-4">
                <RelationPickerField
                  multiple
                  label="Share with people"
                  placeholder="Search employees…"
                  entityKind="employee"
                  value={grantEmployeeIds}
                  selectionLabels={grantEmployeeLabels}
                  icon={<User size={12} />}
                  disabled={busy}
                  onSearch={searchEmployees}
                  onChange={(ids, labels) => {
                    setGrantEmployeeIds(ids);
                    setGrantEmployeeLabels(labels);
                  }}
                  maxResults={12}
                  {...employeePicker}
                />
                <Button
                  type="button"
                  onClick={() => void grant()}
                  disabled={busy || grantEmployeeIds.length === 0}
                >
                  Add as Sender
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
