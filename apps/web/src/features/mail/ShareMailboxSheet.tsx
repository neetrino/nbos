'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Trash2, User, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DETAIL_SHEET_SECTION_SURFACE_CLASS,
  DETAIL_SHEET_SECTION_TITLE_CLASS,
  LoadingState,
  RelationPickerField,
} from '@/components/shared';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { useEmployeeRelationSearch } from '@/components/shared/relation-picker/relation-search-loaders';
import { mailApi, type MailAccountAccessListDto, type MailAccountAccessRole } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { MAIL_SHEET_BODY_CLASS } from './mail-ui-classes';
import { MailSheetPanelHeader } from './MailSheetPanelHeader';

export interface ShareMailboxSheetProps {
  enabled: boolean;
  accountId: string;
  accountEmail: string;
  /** Skip sheet chrome when this panel is a Settings tab. */
  embedded?: boolean;
}

const ROLES: MailAccountAccessRole[] = ['ADMIN', 'SENDER', 'READER'];
const MAIL_SHARE_DEFAULT_ROLE: MailAccountAccessRole = 'SENDER';

function AccessPersonRow({
  name,
  email,
  trailing,
}: {
  name: string;
  email: string;
  trailing: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2.5 text-sm">
      <div className="flex min-w-0 items-center gap-3">
        <EmployeePersonAvatar label={name} />
        <div className="min-w-0">
          <div className="truncate font-medium">{name}</div>
          <div className="text-muted-foreground truncate text-xs">{email}</div>
        </div>
      </div>
      {trailing}
    </div>
  );
}

export function ShareMailboxSheet({
  enabled,
  accountId,
  accountEmail,
  embedded = false,
}: ShareMailboxSheetProps) {
  const [access, setAccess] = useState<MailAccountAccessListDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [grantEmployeeIds, setGrantEmployeeIds] = useState<string[]>([]);
  const [grantEmployeeLabels, setGrantEmployeeLabels] = useState<Record<string, string>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
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
    setPickerOpen(false);
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
        setPickerOpen(false);
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
    <div className={embedded ? undefined : 'flex h-full min-h-0 flex-col'}>
      {embedded ? null : <MailSheetPanelHeader title="Share mailbox" description={accountEmail} />}
      <div className={embedded ? undefined : MAIL_SHEET_BODY_CLASS}>
        {loading || !access ? (
          <LoadingState />
        ) : (
          <div className="flex flex-col gap-4">
            <section className={DETAIL_SHEET_SECTION_SURFACE_CLASS}>
              <h3 className={DETAIL_SHEET_SECTION_TITLE_CLASS}>
                <Users className="size-3.5" aria-hidden />
                Access
              </h3>
              {access.owner ? (
                <AccessPersonRow
                  name={access.owner.employeeName}
                  email={access.owner.employeeEmail}
                  trailing={<span className="text-muted-foreground shrink-0 text-xs">Owner</span>}
                />
              ) : null}
              {access.entries.map((entry) => (
                <AccessPersonRow
                  key={entry.id}
                  name={entry.employeeName}
                  email={entry.employeeEmail}
                  trailing={
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
                  }
                />
              ))}
              {access.entries.length === 0 ? (
                <p className="text-muted-foreground pt-1 text-sm">Not shared with anyone yet.</p>
              ) : null}
            </section>

            {canManage ? (
              <section className={DETAIL_SHEET_SECTION_SURFACE_CLASS}>
                <h3 className={DETAIL_SHEET_SECTION_TITLE_CLASS}>
                  <UserPlus className="size-3.5" aria-hidden />
                  Add people
                </h3>
                <RelationPickerField
                  multiple
                  label=""
                  placeholder="Search employees…"
                  entityKind="employee"
                  value={grantEmployeeIds}
                  selectionLabels={grantEmployeeLabels}
                  icon={<User size={12} />}
                  disabled={busy}
                  open={pickerOpen}
                  onOpenChange={setPickerOpen}
                  onSearch={searchEmployees}
                  onChange={(ids, labels) => {
                    setGrantEmployeeIds(ids);
                    setGrantEmployeeLabels(labels);
                  }}
                  dropdownFooter={
                    <Button
                      type="button"
                      className="w-full"
                      disabled={busy || grantEmployeeIds.length === 0}
                      onClick={() => void grant()}
                    >
                      Add as Sender
                    </Button>
                  }
                  maxResults={12}
                  {...employeePicker}
                />
                {!pickerOpen && grantEmployeeIds.length > 0 ? (
                  <Button
                    type="button"
                    className="mt-3 w-full"
                    disabled={busy}
                    onClick={() => void grant()}
                  >
                    Add as Sender
                  </Button>
                ) : null}
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
