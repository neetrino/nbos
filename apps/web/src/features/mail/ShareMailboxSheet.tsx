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
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LoadingState, RelationPickerField } from '@/components/shared';
import { RELATION_PICKER_DROPDOWN_LIST_SIX_ROWS_CLASS } from '@/components/shared/detail-sheet-classes';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { useEmployeeRelationSearch } from '@/components/shared/relation-picker/relation-search-loaders';
import { mailApi, type MailAccountAccessListDto, type MailAccountAccessRole } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';

export interface ShareMailboxSheetProps {
  enabled: boolean;
  accountId: string;
  accountEmail: string;
}

const ROLES: MailAccountAccessRole[] = ['ADMIN', 'SENDER', 'READER'];

export function ShareMailboxSheet({ enabled, accountId, accountEmail }: ShareMailboxSheetProps) {
  const [access, setAccess] = useState<MailAccountAccessListDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [grantEmployeeId, setGrantEmployeeId] = useState('');
  const [grantEmployeeLabel, setGrantEmployeeLabel] = useState<string | null>(null);
  const [grantRole, setGrantRole] = useState<MailAccountAccessRole>('READER');
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
    setGrantEmployeeId('');
    setGrantEmployeeLabel(null);
    void load();
  }, [enabled, load]);

  const canManage = access?.viewerRole === 'OWNER' || access?.viewerRole === 'ADMIN';

  const grant = async () => {
    if (!grantEmployeeId) {
      toast.error('Select a user to share with.');
      return;
    }
    setBusy(true);
    try {
      setAccess(await mailApi.grantAccess(accountId, grantEmployeeId, grantRole));
      setGrantEmployeeId('');
      setGrantEmployeeLabel(null);
      toast.success('Access granted.');
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not grant access.'));
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
      <SheetHeader className="border-border shrink-0 border-b px-5 py-4">
        <SheetTitle>Share mailbox</SheetTitle>
        <SheetDescription>{accountEmail}</SheetDescription>
      </SheetHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {loading || !access ? (
          <LoadingState />
        ) : (
          <div className="flex flex-col gap-4">
            {access.owner ? (
              <div className="border-border flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{access.owner.employeeName}</div>
                  <div className="text-muted-foreground text-xs">{access.owner.employeeEmail}</div>
                </div>
                <span className="text-muted-foreground text-xs">Owner</span>
              </div>
            ) : null}

            {access.entries.map((entry) => (
              <div
                key={entry.id}
                className="border-border flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{entry.employeeName}</div>
                  <div className="text-muted-foreground truncate text-xs">
                    {entry.employeeEmail}
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
                  label="Share with a user"
                  entityKind="employee"
                  value={grantEmployeeId || null}
                  selectionLabel={grantEmployeeLabel}
                  placeholder="Search employee…"
                  icon={<User size={12} />}
                  disabled={busy}
                  onSearch={searchEmployees}
                  onSelect={(id, label) => {
                    setGrantEmployeeId(id);
                    setGrantEmployeeLabel(label);
                  }}
                  onClear={() => {
                    setGrantEmployeeId('');
                    setGrantEmployeeLabel(null);
                  }}
                  listMaxHeightClass={RELATION_PICKER_DROPDOWN_LIST_SIX_ROWS_CLASS}
                  maxResults={12}
                  {...employeePicker}
                />
                <div className="flex items-center gap-2">
                  <Select
                    value={grantRole}
                    onValueChange={(value) => setGrantRole(value as MailAccountAccessRole)}
                  >
                    <SelectTrigger size="sm" className="w-28">
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
                  <Button type="button" onClick={() => void grant()} disabled={busy}>
                    Add
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
