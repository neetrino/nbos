'use client';

import { useState } from 'react';
import { Building2, Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InsightSheetSection } from '@/components/shared';
import { TEAM_DEPT_ROLE_OPTIONS, isDeptRoleValue } from '@/features/hr/constants/team-directory';
import { TEAM_SHEET_BODY_CLASS } from '@/features/hr/constants/team-sheet-layout';
import { employeesApi, type DepartmentItem, type Employee } from '@/lib/api/employees';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export interface EmployeeDepartmentsPanelProps {
  employee: Employee;
  departments: DepartmentItem[];
  canEdit: boolean;
  onUpdated: (employee: Employee) => void;
}

export function EmployeeDepartmentsPanel({
  employee,
  departments,
  canEdit,
  onUpdated,
}: EmployeeDepartmentsPanelProps) {
  const t = useTranslations('hr');
  const tCommon = useTranslations('common');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newDeptId, setNewDeptId] = useState('');
  const [newDeptRole, setNewDeptRole] = useState('MEMBER');
  const [newPrimary, setNewPrimary] = useState(false);

  const assignedIds = new Set(employee.departments.map((d) => d.departmentId));
  const availableDepartments = departments.filter((d) => !assignedIds.has(d.id));

  async function refreshEmployee() {
    const fresh = await employeesApi.getById(employee.id);
    onUpdated(fresh);
  }

  async function handleAdd() {
    if (!newDeptId) return;
    setSaving(true);
    try {
      await employeesApi.addDepartment(employee.id, {
        departmentId: newDeptId,
        deptRole: newDeptRole,
        isPrimary: newPrimary,
      });
      await refreshEmployee();
      setAdding(false);
      setNewDeptId('');
      setNewDeptRole('MEMBER');
      setNewPrimary(false);
      toast.success(t('departments.added'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('departments.addFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(departmentId: string) {
    setSaving(true);
    try {
      await employeesApi.removeDepartment(employee.id, departmentId);
      await refreshEmployee();
      toast.success(t('departments.removed'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('departments.removeFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSetPrimary(departmentId: string) {
    setSaving(true);
    try {
      await employeesApi.updateDepartment(employee.id, departmentId, { isPrimary: true });
      await refreshEmployee();
      toast.success(t('departments.primaryUpdated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('departments.updateFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={TEAM_SHEET_BODY_CLASS}>
      <InsightSheetSection
        icon={<Building2 size={15} />}
        title={t('departments.title')}
        hint={t('departments.hint')}
      >
        {employee.departments.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">{t('departments.empty')}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {employee.departments.map((ed) => (
              <li key={ed.id} className="flex items-center gap-2.5 rounded-xl px-1.5 py-1.5">
                <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
                  <Building2 size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">
                    {ed.department.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {isDeptRoleValue(ed.deptRole) ? t(`deptRole.${ed.deptRole}`) : ed.deptRole}
                    {ed.isPrimary ? ` · ${t('departments.primary')}` : ''}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex shrink-0 items-center gap-1">
                    {!ed.isPrimary && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        disabled={saving}
                        aria-label={t('departments.setPrimaryAria')}
                        onClick={() => void handleSetPrimary(ed.departmentId)}
                      >
                        <Star className="size-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive size-8"
                      disabled={saving}
                      aria-label={t('departments.removeAria')}
                      onClick={() => void handleRemove(ed.departmentId)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </InsightSheetSection>

      {canEdit && (
        <InsightSheetSection
          icon={<Plus size={15} />}
          title={t('departments.add')}
          hint={t('departments.addHint')}
        >
          {!adding ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={availableDepartments.length === 0 || saving}
              onClick={() => setAdding(true)}
            >
              <Plus className="mr-2 size-4" />
              {t('departments.add')}
            </Button>
          ) : (
            <div className="space-y-3">
              <Select value={newDeptId} onValueChange={(v) => setNewDeptId(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('departments.selectDepartment')} />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newDeptRole} onValueChange={(v) => setNewDeptRole(v ?? 'MEMBER')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('departments.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_DEPT_ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(`deptRole.${opt.value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newPrimary}
                  onChange={(e) => setNewPrimary(e.target.checked)}
                  disabled={saving}
                />
                {t('departments.primaryCheckbox')}
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={!newDeptId || saving}
                  onClick={() => void handleAdd()}
                >
                  {saving ? t('departments.adding') : t('departments.addConfirm')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={saving}
                  onClick={() => setAdding(false)}
                >
                  {tCommon('cancel')}
                </Button>
              </div>
            </div>
          )}
        </InsightSheetSection>
      )}
    </div>
  );
}
