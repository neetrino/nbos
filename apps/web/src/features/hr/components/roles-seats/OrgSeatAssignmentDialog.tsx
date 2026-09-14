'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RelationPickerField } from '@/components/shared/relation-picker';
import type { OrgSeat } from '@/lib/api/org-seats';
import { Input } from '@/components/ui/input';
import { SeatAccessPreviewPanel } from './SeatAccessPreviewPanel';
import { searchSeatAssignees } from './seat-assignee-search';

type Selection = { id: string; label: string; avatar?: string };

export function OrgSeatAssignmentDialog({
  seat,
  ending,
  canViewAccess,
  onOpenChange,
  onAssign,
}: {
  seat: OrgSeat | null;
  ending: boolean;
  canViewAccess: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (employeeId: string) => Promise<void>;
}) {
  const t = useTranslations('hr.rolesSeats');
  const holder = seat?.assignments[0] ?? null;
  const [selection, setSelection] = useState<Selection | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [previewSettled, setPreviewSettled] = useState(false);
  const employeeId = ending ? (holder?.employeeId ?? '') : (selection?.id ?? '');

  useEffect(() => {
    setSelection(null);
    setConfirmation('');
    setPreviewSettled(false);
  }, [seat, ending]);

  async function assign(): Promise<void> {
    if (!employeeId) return;
    setSaving(true);
    try {
      await onAssign(employeeId);
      onOpenChange(false);
    } catch {
      // The workspace displays the server error; keep the dialog open for correction.
    } finally {
      setSaving(false);
    }
  }

  const blocked =
    !employeeId ||
    saving ||
    (canViewAccess && !previewSettled) ||
    Boolean(seat?.defaultPermissionRole && confirmation !== seat.title);

  return (
    <Dialog open={seat !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(ending ? 'actions.end' : 'assignment.title')}</DialogTitle>
          <DialogDescription>
            {t(assignmentDescriptionKey(ending, Boolean(seat?.defaultPermissionRole)), {
              seat: seat?.title ?? '',
            })}
          </DialogDescription>
        </DialogHeader>
        {ending ? (
          <p className="text-sm">
            {t('assignment.currentHolder', {
              name: holder ? `${holder.employee.firstName} ${holder.employee.lastName}` : '',
            })}
          </p>
        ) : (
          <RelationPickerField
            label={t('assignment.employeeLabel')}
            placeholder={t('assignment.employeePlaceholder')}
            entityKind="employee"
            disabled={saving}
            value={selection?.id ?? null}
            selectionLabel={selection?.label}
            selectionAvatar={selection?.avatar}
            onSearch={searchSeatAssignees}
            onSelect={(id, label, avatar) => {
              setSelection({ id, label, avatar });
              setPreviewSettled(false);
            }}
            onClear={() => {
              setSelection(null);
              setPreviewSettled(false);
            }}
          />
        )}
        {seat && employeeId && canViewAccess ? (
          <SeatAccessPreviewPanel
            seatId={seat.id}
            employeeId={employeeId}
            operation={ending ? 'END' : 'ASSIGN'}
            onSettled={setPreviewSettled}
          />
        ) : null}
        {seat?.defaultPermissionRole ? (
          <label className="space-y-2 text-sm">
            <span>
              {t('assignment.confirmRole', {
                role: seat.defaultPermissionRole.name,
                seat: seat.title,
              })}
            </span>
            <Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </label>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('actions.cancel')}
          </Button>
          <Button disabled={blocked} onClick={() => void assign()}>
            {saving ? t('actions.saving') : t(ending ? 'actions.end' : 'actions.assign')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function assignmentDescriptionKey(
  ending: boolean,
  mappedRole: boolean,
): 'assignment.endDescription' | 'assignment.description' | 'assignment.descriptionUnmapped' {
  if (ending) return 'assignment.endDescription';
  return mappedRole ? 'assignment.description' : 'assignment.descriptionUnmapped';
}
