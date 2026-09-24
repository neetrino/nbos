'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RelationPickerField } from '@/components/shared/relation-picker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { searchSeatAssignees } from '@/features/hr/components/roles-seats/seat-assignee-search';

type Selection = { id: string; label: string; avatar?: string };

export function DepartmentEmployeePickDialog({
  open,
  mode,
  departmentName,
  saving,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  mode: 'add' | 'transferIn';
  departmentName: string;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (employeeId: string) => void;
}) {
  if (!open) return null;
  return (
    <DepartmentEmployeePickDialogForm
      key={mode}
      mode={mode}
      departmentName={departmentName}
      saving={saving}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
    />
  );
}

function DepartmentEmployeePickDialogForm({
  mode,
  departmentName,
  saving,
  onOpenChange,
  onConfirm,
}: {
  mode: 'add' | 'transferIn';
  departmentName: string;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (employeeId: string) => void;
}) {
  const t = useTranslations('hr');
  const [selection, setSelection] = useState<Selection | null>(null);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {t(
              mode === 'add'
                ? 'orgChart.deptSettings.addMemberTitle'
                : 'orgChart.deptSettings.transferInTitle',
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              mode === 'add'
                ? 'orgChart.deptSettings.addMemberBody'
                : 'orgChart.deptSettings.transferInBody',
              { department: departmentName },
            )}
          </DialogDescription>
        </DialogHeader>
        <RelationPickerField
          label={t('orgChart.deptSettings.employeeLabel')}
          placeholder={t('orgChart.deptSettings.employeeSearch')}
          entityKind="employee"
          disabled={saving}
          value={selection?.id ?? null}
          selectionLabel={selection?.label}
          selectionAvatar={selection?.avatar}
          onSearch={searchSeatAssignees}
          onSelect={(id, label, avatar) => setSelection({ id, label, avatar })}
          onClear={() => setSelection(null)}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            {t('orgChart.deptSettings.cancel')}
          </Button>
          <Button
            type="button"
            className="rounded-full"
            disabled={saving || !selection}
            onClick={() => {
              if (selection) onConfirm(selection.id);
            }}
          >
            {t(
              mode === 'add'
                ? 'orgChart.deptSettings.addMemberConfirm'
                : 'orgChart.deptSettings.transferInConfirm',
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
