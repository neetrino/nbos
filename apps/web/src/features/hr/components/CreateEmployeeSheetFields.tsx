'use client';

import { useTranslations } from 'next-intl';
import { FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { EMPLOYEE_LEVELS } from '@/features/hr/constants/hr';
import type { DepartmentItem, RoleItem } from '@/lib/api/employees';

export type CreateEmployeeFormState = {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  departmentId: string;
  level: string;
  position: string;
  phone: string;
};

export function CreateEmployeeSheetFields({
  form,
  roles,
  departments,
  saving,
  onChange,
}: {
  form: CreateEmployeeFormState;
  roles: RoleItem[];
  departments: DepartmentItem[];
  saving: boolean;
  onChange: (partial: Partial<CreateEmployeeFormState>) => void;
}) {
  const t = useTranslations('hr');
  const roleOptions = roles.map((role) => ({ value: role.id, label: role.name }));
  const levelOptions = [
    { value: 'none', label: t('create.notSet') },
    ...EMPLOYEE_LEVELS.map((level) => ({
      value: level.value,
      label: t(`level.${level.value}`),
    })),
  ];
  const departmentOptions = [
    { value: 'none', label: t('create.none') },
    ...departments.map((dept) => ({ value: dept.id, label: dept.name })),
  ];

  return (
    <>
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('form.firstName')}
          type="text"
          value={form.firstName}
          disabled={saving}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(firstName) => onChange({ firstName })}
        />
        <InlineField
          variant="controlled"
          label={t('form.lastName')}
          type="text"
          value={form.lastName}
          disabled={saving}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(lastName) => onChange({ lastName })}
        />
      </FormFieldRow>
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('create.workEmail')}
          type="email"
          value={form.email}
          disabled={saving}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(email) => onChange({ email })}
        />
        <InlineField
          variant="controlled"
          label={t('form.phone')}
          type="phone"
          value={form.phone}
          disabled={saving}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(phone) => onChange({ phone })}
        />
      </FormFieldRow>
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('employment.platformRole')}
          type="select"
          value={form.roleId}
          options={roleOptions}
          placeholder={t('create.selectRole')}
          disabled={saving}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(roleId) => roleId && onChange({ roleId })}
        />
        <InlineField
          variant="controlled"
          label={t('form.level')}
          type="select"
          value={form.level || 'none'}
          options={levelOptions}
          placeholder={t('form.selectLevel')}
          disabled={saving}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(value) => onChange({ level: value === 'none' || !value ? '' : value })}
        />
      </FormFieldRow>
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('departments.primaryCheckbox')}
          type="select"
          value={form.departmentId || 'none'}
          options={departmentOptions}
          placeholder={t('create.optional')}
          disabled={saving}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(value) =>
            onChange({ departmentId: value === 'none' || !value ? '' : value })
          }
        />
        <InlineField
          variant="controlled"
          label={t('create.positionSeat')}
          type="text"
          value={form.position}
          disabled={saving}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(position) => onChange({ position })}
        />
      </FormFieldRow>
    </>
  );
}
