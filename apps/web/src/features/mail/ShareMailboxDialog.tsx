'use client';

import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState } from '@/components/shared';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { mailApi, type MailAccountAccessListDto, type MailAccountAccessRole } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';

interface ShareMailboxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  accountEmail: string;
}

const ROLES: MailAccountAccessRole[] = ['ADMIN', 'SENDER', 'READER'];

export function ShareMailboxDialog({
  open,
  onOpenChange,
  accountId,
  accountEmail,
}: ShareMailboxDialogProps) {
  const [access, setAccess] = useState<MailAccountAccessListDto | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [grantEmployeeId, setGrantEmployeeId] = useState('');
  const [grantRole, setGrantRole] = useState<MailAccountAccessRole>('READER');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accessDto, employeesData] = await Promise.all([
        mailApi.listAccess(accountId),
        employeesApi.getAll({ pageSize: 200 }),
      ]);
      setAccess(accessDto);
      setEmployees(employeesData.items.filter((e) => e.status !== 'TERMINATED'));
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not load mailbox access.'));
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (open) {
      void load();
    }
  }, [open, load]);

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

  const grantableEmployees = employees.filter(
    (e) =>
      e.id !== access?.owner?.employeeId &&
      !access?.entries.some((entry) => entry.employeeId === e.id),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share mailbox</DialogTitle>
          <DialogDescription>{accountEmail}</DialogDescription>
        </DialogHeader>

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
                    onValueChange={(v) =>
                      void changeRole(entry.employeeId, v as MailAccountAccessRole)
                    }
                  >
                    <SelectTrigger size="sm" className="w-28" disabled={!canManage || busy}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
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
              <div className="border-border flex flex-col gap-2 border-t pt-4">
                <Label>Share with a user</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={grantEmployeeId}
                    onValueChange={(v) => setGrantEmployeeId(v ?? '')}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {grantableEmployees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.firstName} {e.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={grantRole}
                    onValueChange={(v) => setGrantRole(v as MailAccountAccessRole)}
                  >
                    <SelectTrigger size="sm" className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
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
      </DialogContent>
    </Dialog>
  );
}
