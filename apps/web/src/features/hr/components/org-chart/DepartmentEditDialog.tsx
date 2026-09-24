'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CreateFormDialog, InlineField } from '@/components/shared';
import type { DepartmentItem, DepartmentWithMembers } from '@/lib/api/employees';

export function DepartmentEditDialog({
  open,
  department,
  departments,
  saving,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  department: DepartmentWithMembers | null;
  departments: readonly DepartmentItem[];
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; description: string; parentId: string }) => void;
}) {
  if (!open || !department) return null;
  return (
    <DepartmentEditDialogForm
      key={department.id}
      department={department}
      departments={departments}
      saving={saving}
      onOpenChange={onOpenChange}
      onSave={onSave}
    />
  );
}

function DepartmentEditDialogForm({
  department,
  departments,
  saving,
  onOpenChange,
  onSave,
}: {
  department: DepartmentWithMembers;
  departments: readonly DepartmentItem[];
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; description: string; parentId: string }) => void;
}) {
  const t = useTranslations('hr');
  const tCommon = useTranslations('common');
  const [name, setName] = useState(department.name);
  const [description, setDescription] = useState(department.description ?? '');
  const [parentId, setParentId] = useState(department.parentId ?? '');
  const parentOptions = [
    { value: 'none', label: t('deptAdmin.none') },
    ...departments
      .filter((item) => item.id !== department.id)
      .map((item) => ({ value: item.id, label: item.name })),
  ];

  return (
    <CreateFormDialog
      open
      onOpenChange={onOpenChange}
      title={t('orgChart.deptSettings.editTitle')}
      submitting={saving}
      canSubmit={Boolean(name.trim()) && !saving}
      submitLabel={tCommon('save')}
      submittingLabel={tCommon('saving')}
      cancelLabel={tCommon('cancel')}
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ name: name.trim(), description: description.trim(), parentId });
      }}
    >
      <InlineField
        variant="controlled"
        label={t('deptAdmin.name')}
        type="text"
        value={name}
        placeholder={t('deptAdmin.namePlaceholder')}
        onValueChange={setName}
      />
      <InlineField
        variant="controlled"
        label={t('deptAdmin.description')}
        type="text"
        value={description}
        placeholder={t('deptAdmin.descriptionPlaceholder')}
        onValueChange={setDescription}
      />
      <InlineField
        variant="controlled"
        label={t('deptAdmin.parent')}
        type="select"
        value={parentId || 'none'}
        options={parentOptions}
        onValueChange={(value) => setParentId(value === 'none' || !value ? '' : value)}
      />
    </CreateFormDialog>
  );
}
