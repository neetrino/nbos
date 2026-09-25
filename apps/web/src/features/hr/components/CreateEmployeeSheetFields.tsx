'use client';

import { Building2, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { InlineField, InsightSheetSection } from '@/components/shared';
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
    <div className="space-y-4">
      <InsightSheetSection
        icon={<User size={15} />}
        title={t('form.profile')}
        hint={t('create.personHint')}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <InlineField
            variant="controlled"
            label={t('form.firstName')}
            type="text"
            value={form.firstName}
            disabled={saving}
            onValueChange={(firstName) => onChange({ firstName })}
          />
          <InlineField
            variant="controlled"
            label={t('form.lastName')}
            type="text"
            value={form.lastName}
            disabled={saving}
            onValueChange={(lastName) => onChange({ lastName })}
          />
          <InlineField
            variant="controlled"
            label={t('create.workEmail')}
            type="email"
            value={form.email}
            disabled={saving}
            onValueChange={(email) => onChange({ email })}
          />
          <InlineField
            variant="controlled"
            label={t('form.phone')}
            type="phone"
            value={form.phone}
            disabled={saving}
            onValueChange={(phone) => onChange({ phone })}
          />
        </div>
      </InsightSheetSection>
      <InsightSheetSection
        icon={<Building2 size={15} />}
        title={t('form.employment')}
        hint={t('create.placeHint')}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <InlineField
            variant="controlled"
            label={t('employment.platformRole')}
            type="select"
            value={form.roleId}
            options={roleOptions}
            placeholder={t('create.selectRole')}
            disabled={saving}
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
            onValueChange={(value) => onChange({ level: value === 'none' || !value ? '' : value })}
          />
          <InlineField
            variant="controlled"
            label={t('departments.primaryCheckbox')}
            type="select"
            value={form.departmentId || 'none'}
            options={departmentOptions}
            placeholder={t('create.optional')}
            disabled={saving}
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
            onValueChange={(position) => onChange({ position })}
          />
        </div>
      </InsightSheetSection>
    </div>
  );
}
