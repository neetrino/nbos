'use client';

import { useCallback, useEffect, useState } from 'react';
import { User, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingState, RelationPickerField } from '@/components/shared';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { mailApi, type MailThreadDetailDto } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';

interface AssignableUser {
  employeeId: string;
  employeeName: string;
}

interface AssignThreadControlProps {
  threadId: string;
  mailAccountId: string;
  assignedToEmployeeId: string | null;
  assignedToName: string | null;
  onUpdated: (detail: MailThreadDetailDto) => void;
}

export function AssignThreadControl({
  threadId,
  mailAccountId,
  assignedToEmployeeId,
  assignedToName,
  onUpdated,
}: AssignThreadControlProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [selected, setSelected] = useState<string>(assignedToEmployeeId ?? '');
  const [selectionLabel, setSelectionLabel] = useState<string | null>(assignedToName);
  const assignPicker = useRelationPickerActions('employee', 'mail-assign-thread');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const access = await mailApi.listAccess(mailAccountId);
      const list: AssignableUser[] = [];
      if (access.owner) {
        list.push({ employeeId: access.owner.employeeId, employeeName: access.owner.employeeName });
      }
      access.entries.forEach((e) =>
        list.push({ employeeId: e.employeeId, employeeName: e.employeeName }),
      );
      setUsers(list);
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not load mailbox users.'));
    } finally {
      setLoading(false);
    }
  }, [mailAccountId]);

  const searchMailboxUsers = useCallback(
    async (query: string) => {
      const needle = query.trim().toLowerCase();
      return users
        .filter((u) => !needle || u.employeeName.toLowerCase().includes(needle))
        .map((u) => ({ value: u.employeeId, label: u.employeeName }));
    },
    [users],
  );

  useEffect(() => {
    if (open) {
      setSelected(assignedToEmployeeId ?? '');
      setSelectionLabel(assignedToName);
      void load();
    }
  }, [open, assignedToEmployeeId, assignedToName, load]);

  const assign = async () => {
    if (!selected) {
      toast.error('Select a user.');
      return;
    }
    setBusy(true);
    try {
      onUpdated(await mailApi.assignThread(threadId, selected));
      toast.success('Thread assigned.');
      setOpen(false);
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not assign thread.'));
    } finally {
      setBusy(false);
    }
  };

  const unassign = async () => {
    setBusy(true);
    try {
      onUpdated(await mailApi.unassignThread(threadId));
      toast.success('Assignment cleared.');
      setOpen(false);
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not clear assignment.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={() => setOpen(true)}
      >
        <UserCheck size={14} aria-hidden />
        {assignedToName ? `Assigned: ${assignedToName}` : 'Assign'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" forceNestedBackdrop>
          <DialogHeader>
            <DialogTitle>Assign thread</DialogTitle>
            <DialogDescription>
              Only users with access to this mailbox can be assigned.
            </DialogDescription>
          </DialogHeader>
          {loading ? (
            <LoadingState />
          ) : (
            <div className="flex flex-col gap-3">
              <RelationPickerField
                label="Assign to"
                entityKind="employee"
                value={selected || null}
                selectionLabel={selectionLabel}
                placeholder="Select user…"
                icon={<User size={12} />}
                disabled={busy}
                onSearch={searchMailboxUsers}
                onSelect={(id, label) => {
                  setSelected(id);
                  setSelectionLabel(label);
                }}
                onClear={() => {
                  setSelected('');
                  setSelectionLabel(null);
                }}
                {...assignPicker}
              />
              <div className="flex justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void unassign()}
                  disabled={busy || !assignedToEmployeeId}
                >
                  Unassign
                </Button>
                <Button type="button" onClick={() => void assign()} disabled={busy}>
                  {busy ? 'Saving…' : 'Assign'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
