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
  DeleteConfirmDialog,
  DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS,
  EntityDetailSheetContent,
  StatusBadge,
} from '@/components/shared';
import { TEAM_OPEN_EMPLOYEE_QUERY, TEAM_PAGE_HREF } from '@/features/hr/constants/team-open-query';
import {
  TEAM_SHEET_FOOTER_CLASS,
  TEAM_SHEET_HEADER_CLASS,
  TEAM_SHEET_WIDTH,
} from '@/features/hr/constants/team-sheet-layout';
import {
  getEmployeeLevel,
  getEmployeeStatus,
  isEmployeeLevelValue,
  isEmployeeStatusValue,
} from '@/features/hr/constants/hr';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { employeeFullName, employeePrimaryDepartment } from '@/features/hr/utils/employee-display';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { cn } from '@/lib/utils';
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
  createEmployeeGeneralDraft,
  isEmployeeGeneralDirty,
  type EmployeeGeneralDraft,
} from './employee-general-form-state';
import { buildEmployeeSheetTabValues } from './build-employee-sheet-tabs';
import {
  canEditHrEmployeeFields,
  canEditOwnAccountFields,
  isEmployeeOwnProfileDirty,
} from './employee-own-profile-fields';
import { persistEmployeeGeneral } from './persist-employee-general';
import { EmployeeDepartmentsPanel } from './EmployeeDepartmentsPanel';
import { EmployeeOffboardingPanel } from './EmployeeOffboardingPanel';
import { EmployeeOnboardingPanel } from './EmployeeOnboardingPanel';
import { EmployeeSheetScrollBody } from './EmployeeSheetScrollBody';
import { ReactivateEmployeeDialog } from './ReactivateEmployeeDialog';
import { TerminateEmployeeDialog } from './TerminateEmployeeDialog';
import { useCanReactivateEmployee } from '@/features/hr/hooks/use-can-reactivate-employee';
import {
  assignmentPickerActor,
  filterRolesForAssignmentPicker,
} from '@/features/hr/utils/role-assignment-picker';
import { usePermission } from '@/lib/permissions';
import { useTranslations } from 'next-intl';
import { ChangePasswordPanel } from '@/features/account/components/change-password-panel';
import { ActiveSessionsPanel } from '@/features/account/components/active-sessions-panel';
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

function saveErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
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
  const t = useTranslations('hr');
  const tCommon = useTranslations('common');
  const isMobileViewport = useIsMobileViewport();
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
    if (!open || !canEdit) return;
    void rolesApi
      .getAll()
      .then((r) => setRoles(r ?? []))
      .catch(() => {});
    void departmentsApi
      .getAll()
      .then((d) => setDepartments(d ?? []))
      .catch(() => {});
  }, [canEdit, open]);

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
    if (!current || !draft || !snap) return;
    const ownOk = canEditOwnAccountFields(selfProfile, current.status);
    const hrOk = canEditHrEmployeeFields(canEdit, current.status);
    if (!ownOk && !hrOk) return;
    setGeneralError(null);
    if (!draft.firstName.trim() || !draft.lastName.trim()) {
      setGeneralError(t('sheet.namesRequired'));
      return;
    }
    if (hrOk && !draft.email.trim()) {
      setGeneralError(t('sheet.namesEmailRequired'));
      return;
    }
    setSaving(true);
    try {
      const fresh = await persistEmployeeGeneral({
        employeeId: current.id,
        selfProfile,
        canEditCompany: canEdit,
        snap,
        draft,
      });
      setCurrent(fresh);
      const next = createEmployeeGeneralDraft(fresh);
      setDraft(next);
      setSnap(next);
      toast.success(selfProfile ? t('sheet.accountUpdated') : t('sheet.employeeUpdated'));
      await onSaved?.();
    } catch (err) {
      setGeneralError(saveErrorMessage(err, t('sheet.saveFailed')));
    } finally {
      setSaving(false);
    }
  }, [canEdit, current, draft, onSaved, selfProfile, snap, t]);

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
          <p className="text-muted-foreground p-5 text-sm">{t('sheet.loading')}</p>
        </EntityDetailSheetContent>
      </Sheet>
    );
  }

  const fullName = employeeFullName(displayEmployee);
  const levelInfo = getEmployeeLevel(displayEmployee.level ?? '');
  const statusInfo = getEmployeeStatus(displayEmployee.status);
  const dept = employeePrimaryDepartment(displayEmployee);

  const canEditOwn = canEditOwnAccountFields(selfProfile, displayEmployee.status);
  const canEditHr = canEditHrEmployeeFields(canEdit, displayEmployee.status);
  const formDirty = canEditHr ? generalDirty : isEmployeeOwnProfileDirty(draft, snap);
  const employeeTabs = buildEmployeeSheetTabValues({
    selfProfile,
    status: displayEmployee.status,
    hasOnboardingChecklist,
  }).map((value) => ({ value, label: t(`tabs.${value}`) }));
  const rolePickerRoles =
    roles.length > 0
      ? roles
      : [
          {
            id: displayEmployee.role.id,
            name: displayEmployee.role.name,
            slug: displayEmployee.role.slug,
            level: displayEmployee.role.level,
            isSystem: false,
          },
        ];

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
          <div
            className={cn(
              isMobileViewport ? DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS : TEAM_SHEET_HEADER_CLASS,
              isMobileViewport && 'border-border border-b',
            )}
          >
            {isMobileViewport ? (
              <div className={DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS}>
                {!selfProfile && canEdit && displayEmployee.status !== 'TERMINATED' ? (
                  <DetailSheetSettingsMenu>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setTerminateOpen(true)}
                    >
                      <UserX className="mr-2 size-4" />
                      {t('sheet.offboard')}
                    </DropdownMenuItem>
                  </DetailSheetSettingsMenu>
                ) : null}
                {!selfProfile && canReactivate && displayEmployee.status === 'TERMINATED' ? (
                  <DetailSheetSettingsMenu>
                    <DropdownMenuItem onClick={() => setReactivateOpen(true)}>
                      <UserCheck className="mr-2 size-4" />
                      {t('sheet.reactivate')}
                    </DropdownMenuItem>
                  </DetailSheetSettingsMenu>
                ) : null}
              </div>
            ) : null}
            <div
              className={cn(
                'flex items-start gap-3',
                isMobileViewport && DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS,
              )}
            >
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
                      <StatusBadge
                        label={
                          isEmployeeStatusValue(displayEmployee.status)
                            ? t(`status.${displayEmployee.status}`)
                            : statusInfo.label
                        }
                        variant={statusInfo.variant}
                      />
                    )}
                    {levelInfo && displayEmployee.level ? (
                      <StatusBadge
                        label={
                          isEmployeeLevelValue(displayEmployee.level)
                            ? t(`level.${displayEmployee.level}`)
                            : levelInfo.label
                        }
                        variant={levelInfo.variant}
                      />
                    ) : null}
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
                    aria-label={t('sheet.removeAria')}
                  >
                    <Trash2 className="size-4" />
                    {t('sheet.remove')}
                  </Button>
                ) : null}
              </div>
              {!isMobileViewport &&
              !selfProfile &&
              canEdit &&
              displayEmployee.status !== 'TERMINATED' ? (
                <DetailSheetSettingsMenu>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setTerminateOpen(true)}
                  >
                    <UserX className="mr-2 size-4" />
                    {t('sheet.offboard')}
                  </DropdownMenuItem>
                </DetailSheetSettingsMenu>
              ) : null}
              {!isMobileViewport &&
              !selfProfile &&
              canReactivate &&
              displayEmployee.status === 'TERMINATED' ? (
                <DetailSheetSettingsMenu>
                  <DropdownMenuItem onClick={() => setReactivateOpen(true)}>
                    <UserCheck className="mr-2 size-4" />
                    {t('sheet.reactivate')}
                  </DropdownMenuItem>
                </DetailSheetSettingsMenu>
              ) : null}
            </div>
          </div>

          <DetailSheetTabBar
            tabs={employeeTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className="max-md:mt-3 max-md:px-5"
          />

          <ScrollArea className="min-h-0 flex-1">
            <DetailSheetTabPanel tabKey={activeTab}>
              {activeTab === 'general' ? (
                <EmployeeSheetScrollBody
                  employeeId={displayEmployee.id}
                  draft={draft}
                  patchDraft={patchDraft}
                  roles={filterRolesForAssignmentPicker(
                    rolePickerRoles,
                    assignmentPickerActor(me),
                    displayEmployee.role.id,
                  )}
                  saving={saving}
                  canEditPersonal={canEditOwn || canEditHr}
                  canEditHr={canEditHr}
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
                <>
                  <ChangePasswordPanel accountEmail={displayEmployee.email} />
                  <ActiveSessionsPanel />
                </>
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
            visible={(canEditOwn || canEditHr) && activeTab !== 'security'}
            dirty={formDirty}
            saving={saving}
            errorMessage={generalError}
            onSave={() => void handleSave()}
            onCancel={handleCancel}
            saveLabel={tCommon('save')}
            cancelLabel={tCommon('cancel')}
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
          title={t('sheet.removeTitle')}
          description={t('sheet.removeDescription')}
          confirmLabel={t('sheet.remove')}
          isSubmitting={removingParticipant}
          forceNestedBackdrop
          onConfirm={() => void handleRemoveParticipant()}
        />
      ) : null}
    </Sheet>
  );
}
