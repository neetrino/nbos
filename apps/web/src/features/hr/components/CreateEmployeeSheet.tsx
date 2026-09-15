'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { DetailSheetFormFooter, EntityDetailSheetContent } from '@/components/shared';
import {
  TEAM_SHEET_FOOTER_CLASS,
  TEAM_SHEET_HEADER_CLASS,
  TEAM_SHEET_WIDTH,
} from '@/features/hr/constants/team-sheet-layout';
import { CreateEmployeeSheetFields } from './CreateEmployeeSheetFields';
import {
  departmentsApi,
  employeesApi,
  rolesApi,
  type DepartmentItem,
  type Employee,
  type RoleItem,
} from '@/lib/api/employees';
import { toast } from 'sonner';
import { usePermission } from '@/lib/permissions';
import {
  assignmentPickerActor,
  filterRolesForAssignmentPicker,
} from '@/features/hr/utils/role-assignment-picker';

export interface CreateEmployeeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (employee: Employee) => void;
}

export function CreateEmployeeSheet({ open, onOpenChange, onCreated }: CreateEmployeeSheetProps) {
  const t = useTranslations('hr');
  const { me } = usePermission();
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    roleId: '',
    departmentId: '',
    level: '',
    position: '',
    phone: '',
  });

  useEffect(() => {
    if (!open) return;
    setLoadingMeta(true);
    Promise.all([rolesApi.getAll(), departmentsApi.getAll()])
      .then(([r, d]) => {
        setRoles(r ?? []);
        setDepartments(d ?? []);
      })
      .catch(() => toast.error(t('create.metaFailed')))
      .finally(() => setLoadingMeta(false));
  }, [open, t]);

  useEffect(() => {
    if (!open) {
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        roleId: '',
        departmentId: '',
        level: '',
        position: '',
        phone: '',
      });
    }
  }, [open]);

  const canSubmit =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.roleId &&
    !saving &&
    !loadingMeta;

  async function handleSave() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const created = await employeesApi.create({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        roleId: form.roleId,
        phone: form.phone.trim() || undefined,
        position: form.position.trim() || undefined,
      });
      let result = created;
      if (form.level) {
        result = await employeesApi.update(created.id, { level: form.level });
      }
      if (form.departmentId) {
        await employeesApi.addDepartment(created.id, {
          departmentId: form.departmentId,
          isPrimary: true,
        });
        result = await employeesApi.getById(created.id);
      }
      toast.success(t('create.created'));
      onCreated(result);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('create.failed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent open={open} layout="full" width={TEAM_SHEET_WIDTH}>
        <div className="flex h-full min-h-0 flex-col">
          <div className={TEAM_SHEET_HEADER_CLASS}>
            <h2 className="text-base font-semibold">{t('create.title')}</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">{t('create.description')}</p>
          </div>

          {loadingMeta ? (
            <div className="text-muted-foreground flex flex-1 items-center justify-center gap-2 p-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              {t('sheet.loading')}
            </div>
          ) : (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <CreateEmployeeSheetFields
                form={form}
                roles={filterRolesForAssignmentPicker(roles, assignmentPickerActor(me))}
                departments={departments}
                saving={saving}
                onChange={(partial) => setForm((prev) => ({ ...prev, ...partial }))}
              />
            </div>
          )}

          <DetailSheetFormFooter
            visible
            dirty={Boolean(canSubmit)}
            saving={saving}
            onSave={() => void handleSave()}
            onCancel={() => onOpenChange(false)}
            saveLabel={t('create.submit')}
            className={TEAM_SHEET_FOOTER_CLASS}
          />
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
