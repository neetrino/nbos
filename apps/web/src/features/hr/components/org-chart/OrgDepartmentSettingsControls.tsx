'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InviteEmployeeDialog } from '@/features/hr/components/InviteEmployeeDialog';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  departmentsApi,
  type DepartmentItem,
  type DepartmentWithMembers,
} from '@/lib/api/employees';
import { DepartmentEditDialog } from './DepartmentEditDialog';
import { DepartmentEmployeePickDialog } from './DepartmentEmployeePickDialog';
import {
  OrgDepartmentSettingsMenu,
  type OrgDepartmentSettingsAction,
} from './OrgDepartmentSettingsMenu';
import {
  addEmployeeAsDepartmentMember,
  transferEmployeeIntoDepartment,
} from './org-department-settings-actions';

export function OrgDepartmentSettingsControls({
  department,
  departments,
  canEdit,
  canAdd,
  canDelete,
  onAddChild,
  onChanged,
  onDeleted,
}: {
  department: DepartmentWithMembers | null;
  departments: readonly DepartmentItem[];
  canEdit: boolean;
  canAdd: boolean;
  canDelete: boolean;
  onAddChild: (parentId: string) => void;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const t = useTranslations('hr');
  const [editOpen, setEditOpen] = useState(false);
  const [pickMode, setPickMode] = useState<'add' | 'transferIn' | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const departmentId = department?.id ?? '';
  const departmentName = department?.name ?? '';

  function handleAction(action: OrgDepartmentSettingsAction): void {
    if (!department) return;
    if (action === 'edit') setEditOpen(true);
    else if (action === 'addChild') onAddChild(department.id);
    else if (action === 'addMember') setPickMode('add');
    else if (action === 'transferIn') setPickMode('transferIn');
    else if (action === 'invite') setInviteOpen(true);
    else setDeleteOpen(true);
  }

  async function saveEdit(data: {
    name: string;
    description: string;
    parentId: string;
  }): Promise<void> {
    if (!department) return;
    setSaving(true);
    try {
      await departmentsApi.update(department.id, {
        name: data.name,
        description: data.description || null,
        parentId: data.parentId || null,
      });
      toast.success(t('orgChart.deptSettings.editSuccess'));
      setEditOpen(false);
      onChanged();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('orgChart.deptSettings.failed')));
    } finally {
      setSaving(false);
    }
  }

  async function confirmPick(employeeId: string): Promise<void> {
    if (!pickMode || !departmentId) return;
    setSaving(true);
    try {
      if (pickMode === 'add') {
        await addEmployeeAsDepartmentMember({ employeeId, departmentId });
        toast.success(t('orgChart.deptSettings.addMemberSuccess'));
      } else {
        await transferEmployeeIntoDepartment({ employeeId, departmentId });
        toast.success(t('orgChart.deptSettings.transferInSuccess'));
      }
      setPickMode(null);
      onChanged();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('orgChart.deptSettings.failed')));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(): Promise<void> {
    if (!departmentId) return;
    setSaving(true);
    try {
      await departmentsApi.remove(departmentId);
      toast.success(t('orgChart.deptSettings.deleteSuccess'));
      setDeleteOpen(false);
      onDeleted();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('orgChart.deptSettings.failed')));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <OrgDepartmentSettingsMenu
        canEdit={canEdit}
        canAdd={canAdd}
        canDelete={canDelete}
        onAction={handleAction}
      />
      <DepartmentEditDialog
        open={editOpen}
        department={department}
        departments={departments}
        saving={saving}
        onOpenChange={setEditOpen}
        onSave={(data) => void saveEdit(data)}
      />
      <DepartmentEmployeePickDialog
        open={pickMode !== null}
        mode={pickMode ?? 'add'}
        departmentName={departmentName}
        saving={saving}
        onOpenChange={(open) => {
          if (!open) setPickMode(null);
        }}
        onConfirm={(employeeId) => void confirmPick(employeeId)}
      />
      <InviteEmployeeDialog
        open={inviteOpen}
        defaultDepartmentId={departmentId || undefined}
        onOpenChange={setInviteOpen}
        onSuccess={onChanged}
        onIssued={() => undefined}
      />
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('orgChart.deptSettings.deleteConfirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('orgChart.deptSettings.deleteConfirmBody', { department: departmentName })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={saving}
              onClick={() => setDeleteOpen(false)}
            >
              {t('orgChart.deptSettings.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              disabled={saving}
              onClick={() => void confirmDelete()}
            >
              {t('orgChart.deptSettings.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
