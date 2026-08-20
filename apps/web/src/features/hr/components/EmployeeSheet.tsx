'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Trash2, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import {
  DetailSheetFormFooter,
  DetailSheetSettingsMenu,
  DetailSheetTabBar,
  DetailSheetTabPanel,
  type DetailSheetTabItem,
  DeleteConfirmDialog,
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
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { employeeFullName, employeePrimaryDepartment } from '@/features/hr/utils/employee-display';
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
import { filterRolesForAssignmentPicker } from '@/features/hr/utils/role-assignment-picker';
import { usePermission } from '@/lib/permissions';
import { ChangePasswordPanel } from '@/features/account/components/change-password-panel';
import { EMPLOYEE_ONBOARDING_OWNER_TYPE } from '@nbos/shared';
import { checklistTemplatesApi } from '@/lib/api/checklist-templates';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';

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
  /** Stack above an already-open entity sheet (dims parent floating rail). */
  forceNestedBackdrop?: boolean;
  /** Project team: Remove participant control opposite the name. */
  onRemoveParticipant?: () => void | Promise<void>;
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
  forceNestedBackdrop = false,
  onRemoveParticipant,
}: EmployeeSheetProps) {
  const { persistedValue: renderEmployee, onOpenChangeComplete } = useSheetPersistedValue(employee);
  const hostMounted = useSheetHostMounted(open, renderEmployee);

  const [draft, setDraft] = useState<EmployeeGeneralDraft | null>(null);
  const [snap, setSnap] = useState<EmployeeGeneralDraft | null>(null);
  const [current, setCurrent] = useState<Employee | null>(null);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [removingParticipant, setRemovingParticipant] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [removeParticipantOpen, setRemoveParticipantOpen] = useState(false);
  const [hasOnboardingChecklist, setHasOnboardingChecklist] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const canReactivate = useCanReactivateEmployee();
  const { me } = usePermission();

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
    if (!open) {
      setGeneralError(null);
      setRemovingParticipant(false);
      setRemoveParticipantOpen(false);
    }
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

  const handleRemoveParticipant = useCallback(async () => {
    if (!onRemoveParticipant) return;
    setRemovingParticipant(true);
    try {
      await onRemoveParticipant();
      setRemoveParticipantOpen(false);
      onOpenChange(false);
    } catch {
      // Caller surfaces toast; keep sheet open for retry.
    } finally {
      setRemovingParticipant(false);
    }
  }, [onOpenChange, onRemoveParticipant]);

  if (!hostMounted) return null;

  const displayEmployee = current ?? renderEmployee;

  if (!displayEmployee || !draft || !snap) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
        <EntityDetailSheetContent
          open={open}
          layout="full"
          width={TEAM_SHEET_WIDTH}
          forceNestedBackdrop={forceNestedBackdrop}
        >
          <p className="text-muted-foreground p-5 text-sm">Loading profile…</p>
        </EntityDetailSheetContent>
      </Sheet>
    );
  }

  const fullName = employeeFullName(displayEmployee);
  const levelInfo = getEmployeeLevel(displayEmployee.level ?? '');
  const statusInfo = getEmployeeStatus(displayEmployee.status);
  const dept = employeePrimaryDepartment(displayEmployee);

  const employeeTabs: DetailSheetTabItem[] = [
    { value: 'general', label: 'General' },
    { value: 'departments', label: 'Departments' },
  ];
  if (selfProfile) {
    employeeTabs.push({ value: 'security', label: 'Security' });
  }
  if (displayEmployee.status === 'TERMINATED') {
    employeeTabs.push({ value: 'offboarding', label: 'Offboarding' });
  } else if (hasOnboardingChecklist) {
    employeeTabs.push({ value: 'onboarding', label: 'Onboarding' });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <EntityDetailSheetContent
        open={open}
        layout="full"
        width={TEAM_SHEET_WIDTH}
        forceNestedBackdrop={forceNestedBackdrop}
        sourcePageHref={
          selfProfile
            ? (selfProfileDeepLinkHref ?? '/dashboard')
            : `${TEAM_PAGE_HREF}?${TEAM_OPEN_EMPLOYEE_QUERY}=${encodeURIComponent(displayEmployee.id)}`
        }
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className={TEAM_SHEET_HEADER_CLASS}>
            <div className="flex items-start gap-3">
              <EmployeePersonAvatar
                label={fullName}
                imageUrl={displayEmployee.avatar}
                className="size-11 text-base"
              />
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold">{fullName}</h2>
                  <p className="text-muted-foreground text-xs">
                    {displayEmployee.position || displayEmployee.role.name}
                    {dept ? ` · ${dept}` : ''}
                  </p>
                </div>
                {(statusInfo || levelInfo) && (
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    {statusInfo && (
                      <StatusBadge label={statusInfo.label} variant={statusInfo.variant} />
                    )}
                    {levelInfo && (
                      <StatusBadge label={levelInfo.label} variant={levelInfo.variant} />
                    )}
                  </div>
                )}
                {onRemoveParticipant ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive ml-auto shrink-0"
                    disabled={removingParticipant || saving}
                    onClick={() => setRemoveParticipantOpen(true)}
                    aria-label="Remove participant"
                  >
                    <Trash2 className="size-4" />
                    Remove
                  </Button>
                ) : null}
              </div>
              {!selfProfile && canEdit && displayEmployee.status !== 'TERMINATED' && (
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
              {!selfProfile && canReactivate && displayEmployee.status === 'TERMINATED' && (
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
            <DetailSheetTabPanel tabKey={activeTab}>
              {activeTab === 'general' ? (
                <EmployeeSheetScrollBody
                  employeeId={displayEmployee.id}
                  draft={draft}
                  patchDraft={patchDraft}
                  roles={filterRolesForAssignmentPicker(
                    roles,
                    me?.isPlatformOwner === true,
                    displayEmployee.role.id,
                  )}
                  saving={saving}
                  canEdit={canEdit && displayEmployee.status !== 'TERMINATED'}
                  generalError={generalError}
                />
              ) : null}
              {activeTab === 'departments' ? (
                <EmployeeDepartmentsPanel
                  employee={displayEmployee}
                  departments={departments}
                  canEdit={canEdit && displayEmployee.status !== 'TERMINATED'}
                  onUpdated={(emp) => {
                    setCurrent(emp);
                    const next = createEmployeeGeneralDraft(emp);
                    setDraft(next);
                    setSnap(next);
                    void onSaved?.();
                  }}
                />
              ) : null}
              {activeTab === 'security' && selfProfile ? (
                <ChangePasswordPanel accountEmail={displayEmployee.email} />
              ) : null}
              {activeTab === 'offboarding' && displayEmployee.status === 'TERMINATED' ? (
                <EmployeeOffboardingPanel employeeId={displayEmployee.id} canEdit={canEdit} />
              ) : null}
              {activeTab === 'onboarding' &&
              displayEmployee.status !== 'TERMINATED' &&
              hasOnboardingChecklist ? (
                <EmployeeOnboardingPanel employeeId={displayEmployee.id} canEdit={canEdit} />
              ) : null}
            </DetailSheetTabPanel>
          </ScrollArea>

          <DetailSheetFormFooter
            visible={canEdit && displayEmployee.status !== 'TERMINATED' && activeTab !== 'security'}
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
        employeeId={displayEmployee.id}
        employeeName={fullName}
        open={terminateOpen}
        onOpenChange={setTerminateOpen}
        onTerminated={handleOffboardComplete}
      />

      <ReactivateEmployeeDialog
        employeeId={displayEmployee.id}
        employeeName={fullName}
        open={reactivateOpen}
        onOpenChange={setReactivateOpen}
        onReactivated={handleReactivateComplete}
      />

      {onRemoveParticipant ? (
        <DeleteConfirmDialog
          open={removeParticipantOpen}
          onOpenChange={setRemoveParticipantOpen}
          level="simple"
          itemName={fullName}
          title="Remove participant?"
          description="They will lose project team access. You can add them again later."
          confirmLabel="Remove"
          isSubmitting={removingParticipant}
          forceNestedBackdrop
          onConfirm={() => void handleRemoveParticipant()}
        />
      ) : null}
    </Sheet>
  );
}
