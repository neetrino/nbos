'use client';

import { useTranslations } from 'next-intl';
import { InlineField } from '@/components/shared';
import type { DepartmentItem, RoleItem } from '@/lib/api/employees';

export function InviteEmployeeDialogFields({
  email,
  roleId,
  departmentId,
  roles,
  departments,
  rolesLoading,
  departmentsLoading,
  rolesError,
  departmentsError,
  loading,
  onEmailChange,
  onRoleChange,
  onDepartmentChange,
}: {
  email: string;
  roleId: string;
  departmentId: string;
  roles: RoleItem[];
  departments: DepartmentItem[];
  rolesLoading: boolean;
  departmentsLoading: boolean;
  rolesError: string | null;
  departmentsError: string | null;
  loading: boolean;
  onEmailChange: (email: string) => void;
  onRoleChange: (roleId: string) => void;
  onDepartmentChange: (departmentId: string) => void;
}) {
  const t = useTranslations('hr');
  const roleOptions = roles.map((role) => ({ value: role.id, label: role.name }));
  const departmentOptions = [
    { value: 'none', label: t('invite.none') },
    ...departments.map((dept) => ({ value: dept.id, label: dept.name })),
  ];

  return (
    <>
      <InlineField
        variant="controlled"
        label={t('form.email')}
        type="text"
        value={email}
        placeholder={t('invite.emailPlaceholder')}
        disabled={loading}
        onValueChange={onEmailChange}
      />
      <InlineField
        variant="controlled"
        label={t('invite.role')}
        type="select"
        value={roleId}
        options={roleOptions}
        placeholder={rolesLoading ? t('invite.loadingRoles') : t('invite.selectRole')}
        disabled={rolesLoading || loading}
        onValueChange={(value) => value && onRoleChange(value)}
      />
      {rolesError ? <p className="text-destructive text-xs">{rolesError}</p> : null}
      <InlineField
        variant="controlled"
        label={t('invite.departmentOptional')}
        type="select"
        value={departmentId || 'none'}
        options={departmentOptions}
        placeholder={
          departmentsLoading ? t('invite.loadingDepartments') : t('invite.selectDepartment')
        }
        disabled={departmentsLoading || loading}
        onValueChange={(value) => onDepartmentChange(value === 'none' || !value ? '' : value)}
      />
      {departmentsError ? <p className="text-destructive text-xs">{departmentsError}</p> : null}
    </>
  );
}
