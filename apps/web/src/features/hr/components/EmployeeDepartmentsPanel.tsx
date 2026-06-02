'use client';

import { useState } from 'react';
import { Building2, Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DetailSheetSection } from '@/components/shared';
import { TEAM_DEPT_ROLE_OPTIONS, getDeptRoleLabel } from '@/features/hr/constants/team-directory';
import { employeesApi, type DepartmentItem, type Employee } from '@/lib/api/employees';
import { toast } from 'sonner';

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
      toast.success('Department assignment added');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add department');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(departmentId: string) {
    setSaving(true);
    try {
      await employeesApi.removeDepartment(employee.id, departmentId);
      await refreshEmployee();
      toast.success('Department assignment removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove department');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetPrimary(departmentId: string) {
    setSaving(true);
    try {
      await employeesApi.updateDepartment(employee.id, departmentId, { isPrimary: true });
      await refreshEmployee();
      toast.success('Primary department updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update department');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 px-7 py-5">
      <DetailSheetSection title="Department assignments" icon={<Building2 size={12} />}>
        {employee.departments.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No departments assigned yet
          </p>
        ) : (
          <ul className="space-y-3">
            {employee.departments.map((ed) => (
              <li
                key={ed.id}
                className="border-border bg-muted/30 flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Building2 className="text-muted-foreground size-4 shrink-0" />
                  <div>
                    <p className="font-medium">{ed.department.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getDeptRoleLabel(ed.deptRole)}
                      </Badge>
                      {ed.isPrimary && (
                        <Badge variant="secondary" className="text-xs">
                          Primary
                        </Badge>
                      )}
                    </div>
                  </div>
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
                        aria-label="Set as primary"
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
                      aria-label="Remove assignment"
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
      </DetailSheetSection>

      {canEdit && (
        <div className="border-border rounded-lg border border-dashed p-4">
          {!adding ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={availableDepartments.length === 0 || saving}
              onClick={() => setAdding(true)}
            >
              <Plus className="mr-2 size-4" />
              Add to department
            </Button>
          ) : (
            <div className="space-y-3">
              <Select value={newDeptId} onValueChange={(v) => setNewDeptId(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
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
                  <SelectValue placeholder="Department role" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_DEPT_ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
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
                Primary department
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={!newDeptId || saving}
                  onClick={() => void handleAdd()}
                >
                  {saving ? 'Adding…' : 'Add'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={saving}
                  onClick={() => setAdding(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
