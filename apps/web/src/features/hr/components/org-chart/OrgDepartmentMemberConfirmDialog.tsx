'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DepartmentItem } from '@/lib/api/employees';
import type { OrgDrawerMemberRole } from './org-department-member-actions';

export type OrgMemberPendingAction =
  | { kind: 'role'; role: OrgDrawerMemberRole }
  | { kind: 'remove' }
  | { kind: 'transfer' };

export function OrgDepartmentMemberConfirmDialog({
  pending,
  title,
  description,
  cancelLabel,
  confirmLabel,
  transferPlaceholder,
  transferTargetId,
  transferOptions,
  saving,
  onTransferTargetChange,
  onCancel,
  onConfirm,
}: {
  pending: OrgMemberPendingAction | null;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  transferPlaceholder: string;
  transferTargetId: string;
  transferOptions: readonly DepartmentItem[];
  saving: boolean;
  onTransferTargetChange: (id: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open && !saving) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {pending?.kind === 'transfer' ? (
          <Select
            value={transferTargetId}
            onValueChange={(value) => onTransferTargetChange(value ?? '')}
          >
            <SelectTrigger>
              <SelectValue placeholder={transferPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {transferOptions.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={saving || (pending?.kind === 'transfer' && !transferTargetId)}
            variant={pending?.kind === 'remove' ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
