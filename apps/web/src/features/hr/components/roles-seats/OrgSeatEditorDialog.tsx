'use client';

import { useEffect, useState, type FormEvent } from 'react';
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
import type { DepartmentItem, RoleItem } from '@/lib/api/employees';
import type {
  CreateOrgSeatPayload,
  OrgSeat,
  OrgSeatKind,
  UpdateOrgSeatPayload,
} from '@/lib/api/org-seats';
import { NO_PERMISSION_ROLE, OrgSeatEditorFields, type OrgSeatForm } from './OrgSeatEditorFields';

export function OrgSeatEditorDialog({
  open,
  seat,
  seats,
  defaultDepartmentId,
  departments,
  roles,
  canMapRole,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  seat: OrgSeat | null;
  seats: OrgSeat[];
  defaultDepartmentId: string;
  departments: DepartmentItem[];
  roles: RoleItem[];
  canMapRole: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: CreateOrgSeatPayload | UpdateOrgSeatPayload) => Promise<void>;
}) {
  const t = useTranslations('hr.rolesSeats');
  const [form, setForm] = useState(() => initialForm(seat, defaultDepartmentId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initialForm(seat, defaultDepartmentId));
  }, [defaultDepartmentId, open, seat]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!form.title.trim() || !form.kind) return;
    setSaving(true);
    try {
      await onSave(toPayload({ ...form, kind: form.kind }, Boolean(seat), canMapRole));
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{seat ? t('editor.editTitle') : t('editor.createTitle')}</DialogTitle>
          <DialogDescription>{t('editor.description')}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <OrgSeatEditorFields
            form={form}
            setForm={setForm}
            seat={seat}
            seats={seats}
            departments={departments}
            roles={roles}
            canMapRole={canMapRole}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={saving || !form.title.trim() || !form.kind}>
              {saving ? t('actions.saving') : t('actions.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function initialForm(seat: OrgSeat | null, departmentId: string): OrgSeatForm {
  return {
    departmentId: seat?.departmentId ?? departmentId,
    title: seat?.title ?? '',
    description: seat?.description ?? '',
    kind: seat?.kind ?? '',
    roleId: seat?.defaultPermissionRoleId ?? NO_PERMISSION_ROLE,
  };
}

function toPayload(
  form: Omit<OrgSeatForm, 'kind'> & { kind: OrgSeatKind },
  editing: boolean,
  canMapRole: boolean,
): CreateOrgSeatPayload | UpdateOrgSeatPayload {
  const common = {
    title: form.title.trim(),
    description: form.description.trim() || null,
    kind: form.kind,
    ...(canMapRole
      ? {
          defaultPermissionRoleId: form.roleId === NO_PERMISSION_ROLE ? null : form.roleId,
        }
      : {}),
  };
  return editing ? common : { ...common, departmentId: form.departmentId };
}
