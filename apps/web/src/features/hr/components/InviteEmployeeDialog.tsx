'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { CreateFormDialog } from '@/components/shared';
import {
  departmentsApi,
  invitationsApi,
  rolesApi,
  type DepartmentItem,
  type RoleItem,
} from '@/lib/api/employees';
import { toast } from 'sonner';
import { usePermission } from '@/lib/permissions';
import {
  assignmentPickerActor,
  filterRolesForAssignmentPicker,
} from '@/features/hr/utils/role-assignment-picker';
import { InviteEmployeeDialogFields } from './InviteEmployeeDialogFields';

interface InviteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InviteEmployeeDialog({ open, onOpenChange, onSuccess }: InviteEmployeeDialogProps) {
  const t = useTranslations('hr');
  const tCommon = useTranslations('common');
  const { me } = usePermission();
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [form, setForm] = useState({ email: '', roleId: '', departmentId: '' });
  const assignableRoles = filterRolesForAssignmentPicker(roles, assignmentPickerActor(me));
  const canSubmit = Boolean(
    form.email.trim() && form.roleId && !rolesLoading && !departmentsLoading && !rolesError,
  );

  useEffect(() => {
    if (!open) return;
    void loadInviteOptions({
      setRoles,
      setDepartments,
      setRolesLoading,
      setDepartmentsLoading,
      setRolesError,
      setDepartmentsError,
      rolesFailed: t('invite.rolesFailed'),
      departmentsFailed: t('invite.departmentsFailed'),
    });
  }, [open, t]);

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('invite.title')}
      submitting={loading}
      canSubmit={canSubmit}
      submitLabel={t('invite.send')}
      submittingLabel={t('invite.sending')}
      cancelLabel={tCommon('cancel')}
      onSubmit={(event) =>
        void submitInvite({
          event,
          canSubmit,
          form,
          setLoading,
          onSuccess,
          onOpenChange,
          sent: t('invite.sent'),
          failed: t('invite.failed'),
        })
      }
    >
      <InviteEmployeeDialogFields
        email={form.email}
        roleId={form.roleId}
        departmentId={form.departmentId}
        roles={assignableRoles}
        departments={departments}
        rolesLoading={rolesLoading}
        departmentsLoading={departmentsLoading}
        rolesError={rolesError}
        departmentsError={departmentsError}
        loading={loading}
        onEmailChange={(email) => setForm((prev) => ({ ...prev, email }))}
        onRoleChange={(roleId) => setForm((prev) => ({ ...prev, roleId }))}
        onDepartmentChange={(departmentId) => setForm((prev) => ({ ...prev, departmentId }))}
      />
    </CreateFormDialog>
  );
}

async function loadInviteOptions(options: {
  setRoles: (roles: RoleItem[]) => void;
  setDepartments: (departments: DepartmentItem[]) => void;
  setRolesLoading: (loading: boolean) => void;
  setDepartmentsLoading: (loading: boolean) => void;
  setRolesError: (error: string | null) => void;
  setDepartmentsError: (error: string | null) => void;
  rolesFailed: string;
  departmentsFailed: string;
}): Promise<void> {
  options.setRolesLoading(true);
  options.setDepartmentsLoading(true);
  options.setRolesError(null);
  options.setDepartmentsError(null);
  try {
    const data = await rolesApi.getAll();
    options.setRoles(Array.isArray(data) ? data : []);
  } catch (err) {
    const msg = err instanceof Error ? err.message : options.rolesFailed;
    options.setRolesError(msg);
    toast.error(msg);
  } finally {
    options.setRolesLoading(false);
  }
  try {
    const data = await departmentsApi.getAll();
    options.setDepartments(Array.isArray(data) ? data : []);
  } catch (err) {
    const msg = err instanceof Error ? err.message : options.departmentsFailed;
    options.setDepartmentsError(msg);
    toast.error(msg);
  } finally {
    options.setDepartmentsLoading(false);
  }
}

async function submitInvite(options: {
  event: FormEvent;
  canSubmit: boolean;
  form: { email: string; roleId: string; departmentId: string };
  setLoading: (loading: boolean) => void;
  onSuccess: () => void;
  onOpenChange: (open: boolean) => void;
  sent: string;
  failed: string;
}): Promise<void> {
  options.event.preventDefault();
  if (!options.canSubmit) return;
  options.setLoading(true);
  try {
    await invitationsApi.create({
      email: options.form.email.trim(),
      roleId: options.form.roleId,
      departmentId: options.form.departmentId || undefined,
    });
    toast.success(options.sent);
    options.onSuccess();
    options.onOpenChange(false);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : options.failed);
  } finally {
    options.setLoading(false);
  }
}
