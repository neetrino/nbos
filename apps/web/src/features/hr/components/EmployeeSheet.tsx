'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { UserCheck, UserX } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import {
  DetailSheetFormFooter,
  DetailSheetSettingsMenu,
  DetailSheetTabBar,
  type DetailSheetTabItem,
  EntityDetailSheetContent,
  StatusBadge,
} from '@/components/shared';
import { TEAM_OPEN_EMPLOYEE_QUERY, TEAM_PAGE_HREF } from '@/features/hr/constants/team-open-query';
import {
  TEAM_SHEET_FOOTER_CLASS,
  TEAM_SHEET_HEADER_CLASS,
  TEAM_SHEET_WIDTH,
} from '@/features/hr/constants/team-sheet-layout';
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
  isEmployeeGeneralDirty,
  type EmployeeGeneralDraft,
} from './employee-general-form-state';
import { EmployeeDepartmentsPanel } from './EmployeeDepartmentsPanel';
import { EmployeeOffboardingPanel } from './EmployeeOffboardingPanel';
import { EmployeeOnboardingPanel } from './EmployeeOnboardingPanel';
import { EmployeeSheetScrollBody } from './EmployeeSheetScrollBody';
import { ReactivateEmployeeDialog } from './ReactivateEmployeeDialog';
import { TerminateEmployeeDialog } from './TerminateEmployeeDialog';
import { useCanReactivateEmployee } from '@/features/hr/hooks/use-can-reactivate-employee';
import { EMPLOYEE_ONBOARDING_OWNER_TYPE } from '@nbos/shared';
import { checklistTemplatesApi } from '@/lib/api/checklist-templates';

interface EmployeeSheetProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void | Promise<void>;
  canEdit?: boolean;
  /** My Account profile — same sheet UI without HR lifecycle actions. */
  selfProfile?: boolean;
  /** Deep link for global My Account sheet (current page + query). */
  selfProfileDeepLinkHref?: string;
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
  selfProfile = false,
  selfProfileDeepLinkHref,
}: EmployeeSheetProps) {
  const [draft, setDraft] = useState<EmployeeGeneralDraft | null>(null);
  const [snap, setSnap] = useState<EmployeeGeneralDraft | null>(null);
  const [current, setCurrent] = useState<Employee | null>(null);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [hasOnboardingChecklist, setHasOnboardingChecklist] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const canReactivate = useCanReactivateEmployee();

  useLayoutEffect(() => {
    if (!employee) {
      setDraft(null);
      setSnap(null);
      setCurrent(null);
      return;
    }
    setCurrent(employee);
    setActiveTab('general');
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

  useEffect(() => {
    if (!open || !current || current.status === 'TERMINATED') {
      setHasOnboardingChecklist(false);
      return;
    }
    let cancelled = false;
    void checklistTemplatesApi
      .listInstances(EMPLOYEE_ONBOARDING_OWNER_TYPE, current.id)
      .then((rows) => {
        if (!cancelled) setHasOnboardingChecklist(rows.length > 0);
      })
      .catch(() => {
        if (!cancelled) setHasOnboardingChecklist(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- checklist probe keyed on employee.id
  }, [open, current?.id, current?.status]);

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

  const handleOffboardComplete = useCallback(async () => {
    if (!current) return;
    const fresh = await employeesApi.getById(current.id);
    setCurrent(fresh);
    const next = createEmployeeGeneralDraft(fresh);
    setDraft(next);
    setSnap(next);
    setActiveTab('offboarding');
    await onSaved?.();
  }, [current, onSaved]);

  const handleReactivateComplete = useCallback(async () => {
    if (!current) return;
    const fresh = await employeesApi.getById(current.id);
    setCurrent(fresh);
    const next = createEmployeeGeneralDraft(fresh);
    setDraft(next);
    setSnap(next);
    setHasOnboardingChecklist(true);
    setActiveTab('onboarding');
    await onSaved?.();
  }, [current, onSaved]);

  if (!open) return null;

  if (!current || !draft || !snap) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <EntityDetailSheetContent open={open} layout="full" width={TEAM_SHEET_WIDTH}>
          <p className="text-muted-foreground p-5 text-sm">Loading profile…</p>
        </EntityDetailSheetContent>
      </Sheet>
    );
  }

  const fullName = employeeFullName(current);
  const levelInfo = getEmployeeLevel(current.level ?? '');
  const statusInfo = getEmployeeStatus(current.status);
  const dept = employeePrimaryDepartment(current);

  const employeeTabs: DetailSheetTabItem[] = [
    { value: 'general', label: 'General' },
    { value: 'departments', label: 'Departments' },
  ];
  if (current.status === 'TERMINATED') {
    employeeTabs.push({ value: 'offboarding', label: 'Offboarding' });
  } else if (hasOnboardingChecklist) {
    employeeTabs.push({ value: 'onboarding', label: 'Onboarding' });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="full"
        width={TEAM_SHEET_WIDTH}
        sourcePageHref={
          selfProfile
            ? (selfProfileDeepLinkHref ?? '/dashboard')
            : `${TEAM_PAGE_HREF}?${TEAM_OPEN_EMPLOYEE_QUERY}=${encodeURIComponent(current.id)}`
        }
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className={TEAM_SHEET_HEADER_CLASS}>
            <div className="flex items-start gap-3">
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white ${employeeAvatarColor(fullName)}`}
              >
                {employeeInitials(current)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold">{fullName}</h2>
                <p className="text-muted-foreground text-xs">
                  {current.position || current.role.name}
                  {dept ? ` · ${dept}` : ''}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {statusInfo && (
                    <StatusBadge label={statusInfo.label} variant={statusInfo.variant} />
                  )}
                  {levelInfo && <StatusBadge label={levelInfo.label} variant={levelInfo.variant} />}
                </div>
              </div>
              {!selfProfile && canEdit && current.status !== 'TERMINATED' && (
                <DetailSheetSettingsMenu>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setTerminateOpen(true)}
                  >
                    <UserX className="mr-2 size-4" />
                    Offboard employee
                  </DropdownMenuItem>
                </DetailSheetSettingsMenu>
              )}
              {!selfProfile && canReactivate && current.status === 'TERMINATED' && (
                <DetailSheetSettingsMenu>
                  <DropdownMenuItem onClick={() => setReactivateOpen(true)}>
                    <UserCheck className="mr-2 size-4" />
                    Reactivate employee
                  </DropdownMenuItem>
                </DetailSheetSettingsMenu>
              )}
            </div>
          </div>

          <DetailSheetTabBar tabs={employeeTabs} activeTab={activeTab} onTabChange={setActiveTab} />

          <ScrollArea className="min-h-0 flex-1">
            {activeTab === 'general' ? (
              <EmployeeSheetScrollBody
                employeeId={current.id}
                draft={draft}
                patchDraft={patchDraft}
                roles={roles}
                saving={saving}
                canEdit={canEdit && current.status !== 'TERMINATED'}
                generalError={generalError}
              />
            ) : null}
            {activeTab === 'departments' ? (
              <EmployeeDepartmentsPanel
                employee={current}
                departments={departments}
                canEdit={canEdit && current.status !== 'TERMINATED'}
                onUpdated={(emp) => {
                  setCurrent(emp);
                  const next = createEmployeeGeneralDraft(emp);
                  setDraft(next);
                  setSnap(next);
                  void onSaved?.();
                }}
              />
            ) : null}
            {activeTab === 'offboarding' && current.status === 'TERMINATED' ? (
              <EmployeeOffboardingPanel employeeId={current.id} canEdit={canEdit} />
            ) : null}
            {activeTab === 'onboarding' &&
            current.status !== 'TERMINATED' &&
            hasOnboardingChecklist ? (
              <EmployeeOnboardingPanel employeeId={current.id} canEdit={canEdit} />
            ) : null}
          </ScrollArea>

          <DetailSheetFormFooter
            visible={canEdit && current.status !== 'TERMINATED'}
            dirty={generalDirty}
            saving={saving}
            errorMessage={generalError}
            onSave={() => void handleSave()}
            onCancel={handleCancel}
            className={TEAM_SHEET_FOOTER_CLASS}
          />
        </div>
      </EntityDetailSheetContent>

      <TerminateEmployeeDialog
        employeeId={current.id}
        employeeName={fullName}
        open={terminateOpen}
        onOpenChange={setTerminateOpen}
        onTerminated={handleOffboardComplete}
      />

      <ReactivateEmployeeDialog
        employeeId={current.id}
        employeeName={fullName}
        open={reactivateOpen}
        onOpenChange={setReactivateOpen}
        onReactivated={handleReactivateComplete}
      />
    </Sheet>
  );
}
