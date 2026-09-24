'use client';

import { useTranslations } from 'next-intl';
import { CreateFormDialog, InlineField } from '@/components/shared';
import type { DepartmentItem } from '@/lib/api/employees';

export function DepartmentCreateDialog({
  open,
  departments,
  formName,
  formDescription,
  formParentId,
  saving,
  onOpenChange,
  onNameChange,
  onDescriptionChange,
  onParentIdChange,
  onCreate,
}: {
  open: boolean;
  departments: DepartmentItem[];
  formName: string;
  formDescription: string;
  formParentId: string;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onNameChange: (name: string) => void;
  onDescriptionChange: (value: string) => void;
  onParentIdChange: (parentId: string) => void;
  onCreate: () => void;
}) {
  const t = useTranslations('hr');
  const tCommon = useTranslations('common');
  const parentOptions = [
    { value: 'none', label: t('deptAdmin.none') },
    ...departments.map((department) => ({ value: department.id, label: department.name })),
  ];

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('deptAdmin.dialogTitle')}
      submitting={saving}
      canSubmit={Boolean(formName.trim()) && !saving}
      submitLabel={tCommon('create')}
      submittingLabel={tCommon('creating')}
      cancelLabel={tCommon('cancel')}
      onSubmit={(event) => {
        event.preventDefault();
        onCreate();
      }}
    >
      <InlineField
        variant="controlled"
        label={t('deptAdmin.name')}
        type="text"
        value={formName}
        placeholder={t('deptAdmin.namePlaceholder')}
        onValueChange={onNameChange}
      />
      <InlineField
        variant="controlled"
        label={t('deptAdmin.description')}
        type="text"
        value={formDescription}
        placeholder={t('deptAdmin.descriptionPlaceholder')}
        onValueChange={onDescriptionChange}
      />
      <InlineField
        variant="controlled"
        label={t('deptAdmin.parent')}
        type="select"
        value={formParentId || 'none'}
        options={parentOptions}
        onValueChange={(value) => onParentIdChange(value === 'none' || !value ? '' : value)}
      />
    </CreateFormDialog>
  );
}
