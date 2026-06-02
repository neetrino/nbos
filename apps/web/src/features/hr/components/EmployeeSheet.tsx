'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { UserX } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DetailSheetFormFooter,
  DetailSheetSettingsMenu,
  EntityDetailSheetContent,
  StatusBadge,
} from '@/components/shared';
import { TEAM_OPEN_EMPLOYEE_QUERY } from '@/features/hr/constants/team-open-query';
import { getEmployeeLevel, getEmployeeStatus } from '@/features/hr/constants/hr';
import {
  employeeAvatarColor,
  employeeFullName,
  employeeInitials,
  employeePrimaryDepartment,
} from '@/features/hr/utils/employee-display';
import {
  departmentsApi,
  employeesApi,
  rolesApi,
  type DepartmentItem,
  type Employee,
  type RoleItem,
} from '@/lib/api/employees';
import { toast } from 'sonner';
import {
  buildEmployeeGeneralPatch,
  createEmployeeGeneralDraft,
  employeeRoleChanged,
  employeeStatusChanged,
  isEmployeeGeneralDirty,
  type EmployeeGeneralDraft,
} from './employee-general-form-state';
import { EmployeeDepartmentsPanel } from './EmployeeDepartmentsPanel';
import { EmployeeSheetScrollBody } from './EmployeeSheetScrollBody';

interface EmployeeSheetProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void | Promise<void>;
  canEdit?: boolean;
}

function saveErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Could not save changes.';
}

export function EmployeeSheet({
  employee,
  open,
  onOpenChange,
  onSaved,
  canEdit = false,
}: EmployeeSheetProps) {
  const [draft, setDraft] = useState<EmployeeGeneralDraft | null>(null);
  const [snap, setSnap] = useState<EmployeeGeneralDraft | null>(null);
  const [current, setCurrent] = useState<Employee | null>(null);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (!employee) {
      setDraft(null);
      setSnap(null);
      setCurrent(null);
      return;
    }
    setCurrent(employee);
    const next = createEmployeeGeneralDraft(employee);
    setDraft(next);
    setSnap(next);
  }, [employee]);

  useEffect(() => {
    if (!open) setGeneralError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    void rolesApi
      .getAll()
      .then((r) => setRoles(r ?? []))
      .catch(() => {});
    void departmentsApi
      .getAll()
      .then((d) => setDepartments(d ?? []))
      .catch(() => {});
  }, [open]);

  const patchDraft = useCallback((partial: Partial<EmployeeGeneralDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const generalDirty = draft != null && snap != null && isEmployeeGeneralDirty(draft, snap);

  const handleSave = useCallback(async () => {
    if (!current || !draft || !snap || !canEdit) return;
    setGeneralError(null);
    if (!draft.firstName.trim() || !draft.lastName.trim() || !draft.email.trim()) {
      setGeneralError('First name, last name, and email are required.');
      return;
    }
    setSaving(true);
    try {
      let updated = current;
      const patch = buildEmployeeGeneralPatch(snap, draft);
      if (Object.keys(patch).length > 0) {
        updated = await employeesApi.update(current.id, patch);
      }
      if (employeeRoleChanged(snap, draft)) {
        updated = await employeesApi.changeRole(current.id, draft.roleId);
      }
      if (employeeStatusChanged(snap, draft)) {
        updated = await employeesApi.changeStatus(current.id, draft.status);
      }
      const fresh = await employeesApi.getById(updated.id);
      setCurrent(fresh);
      const next = createEmployeeGeneralDraft(fresh);
      setDraft(next);
      setSnap(next);
      toast.success('Employee updated');
      await onSaved?.();
    } catch (err) {
      setGeneralError(saveErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [canEdit, current, draft, onSaved, snap]);

  const handleCancel = useCallback(() => {
    setGeneralError(null);
    if (snap) setDraft({ ...snap });
  }, [snap]);

  const handleTerminate = useCallback(async () => {
    if (!current || !canEdit) return;
    setSaving(true);
    try {
      await employeesApi.changeStatus(current.id, 'TERMINATED');
      const fresh = await employeesApi.getById(current.id);
      setCurrent(fresh);
      const next = createEmployeeGeneralDraft(fresh);
      setDraft(next);
      setSnap(next);
      toast.success('Employee marked as terminated');
      await onSaved?.();
    } catch (err) {
      toast.error(saveErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [canEdit, current, onSaved]);

  if (!current || !draft || !snap) return null;

  const fullName = employeeFullName(current);
  const levelInfo = getEmployeeLevel(current.level ?? '');
  const statusInfo = getEmployeeStatus(current.status);
  const dept = employeePrimaryDepartment(current);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="full"
        sourcePageHref={`/team?${TEAM_OPEN_EMPLOYEE_QUERY}=${encodeURIComponent(current.id)}`}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-border shrink-0 border-b px-6 py-5">
            <div className="flex items-start gap-4">
              <div
                className={`flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white ${employeeAvatarColor(fullName)}`}
              >
                {employeeInitials(current)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold">{fullName}</h2>
                <p className="text-muted-foreground text-sm">
                  {current.position || current.role.name}
                  {dept ? ` · ${dept}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {statusInfo && (
                    <StatusBadge label={statusInfo.label} variant={statusInfo.variant} />
                  )}
                  {levelInfo && <StatusBadge label={levelInfo.label} variant={levelInfo.variant} />}
                </div>
              </div>
              {canEdit && current.status !== 'TERMINATED' && (
                <DetailSheetSettingsMenu>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => void handleTerminate()}
                  >
                    <UserX className="mr-2 size-4" />
                    Mark terminated
                  </DropdownMenuItem>
                </DetailSheetSettingsMenu>
              )}
            </div>
          </div>

          <Tabs defaultValue="general" className="flex min-h-0 flex-1 flex-col">
            <div className="border-border shrink-0 border-b px-6">
              <TabsList variant="default" className="h-9 w-full justify-start">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="departments">Departments</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <TabsContent value="general" className="mt-0">
                <EmployeeSheetScrollBody
                  employeeId={current.id}
                  draft={draft}
                  patchDraft={patchDraft}
                  roles={roles}
                  saving={saving}
                  canEdit={canEdit}
                  generalError={generalError}
                />
              </TabsContent>
              <TabsContent value="departments" className="mt-0">
                <EmployeeDepartmentsPanel
                  employee={current}
                  departments={departments}
                  canEdit={canEdit}
                  onUpdated={(emp) => {
                    setCurrent(emp);
                    const next = createEmployeeGeneralDraft(emp);
                    setDraft(next);
                    setSnap(next);
                    void onSaved?.();
                  }}
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DetailSheetFormFooter
            visible={canEdit}
            dirty={generalDirty}
            saving={saving}
            errorMessage={generalError}
            onSave={() => void handleSave()}
            onCancel={handleCancel}
          />
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
