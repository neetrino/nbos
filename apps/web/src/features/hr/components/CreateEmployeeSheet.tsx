'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DetailSheetFormFooter, EntityDetailSheetContent } from '@/components/shared';
import { EMPLOYEE_LEVELS } from '@/features/hr/constants/hr';
import {
  TEAM_SHEET_FIELD_GRID_CLASS,
  TEAM_SHEET_FOOTER_CLASS,
  TEAM_SHEET_HEADER_CLASS,
  TEAM_SHEET_WIDTH,
} from '@/features/hr/constants/team-sheet-layout';
import {
  departmentsApi,
  employeesApi,
  rolesApi,
  type DepartmentItem,
  type Employee,
  type RoleItem,
} from '@/lib/api/employees';
import { toast } from 'sonner';

export interface CreateEmployeeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (employee: Employee) => void;
}

export function CreateEmployeeSheet({ open, onOpenChange, onCreated }: CreateEmployeeSheetProps) {
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
      .catch(() => toast.error('Could not load roles or departments'))
      .finally(() => setLoadingMeta(false));
  }, [open]);

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
      toast.success('Employee created');
      onCreated(result);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create employee');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent open={open} layout="full" width={TEAM_SHEET_WIDTH}>
        <div className="flex h-full min-h-0 flex-col">
          <div className={TEAM_SHEET_HEADER_CLASS}>
            <h2 className="text-base font-semibold">Add employee</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Create a profile directly. Use Invite when the person should set their own password.
            </p>
          </div>

          {loadingMeta ? (
            <div className="text-muted-foreground flex flex-1 items-center justify-center gap-2 p-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <div className={TEAM_SHEET_FIELD_GRID_CLASS}>
                <div>
                  <Label htmlFor="emp-first">First name *</Label>
                  <Input
                    id="emp-first"
                    value={form.firstName}
                    onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="emp-last">Last name *</Label>
                  <Input
                    id="emp-last"
                    value={form.lastName}
                    onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                    disabled={saving}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="emp-email">Work email *</Label>
                <Input
                  id="emp-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  disabled={saving}
                />
              </div>
              <div className={TEAM_SHEET_FIELD_GRID_CLASS}>
                <div>
                  <Label>Platform role *</Label>
                  <Select
                    value={form.roleId}
                    onValueChange={(v) => setForm((p) => ({ ...p, roleId: v ?? '' }))}
                    disabled={saving}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Level</Label>
                  <Select
                    value={form.level || 'none'}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, level: v === 'none' || !v ? '' : v }))
                    }
                    disabled={saving}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      {EMPLOYEE_LEVELS.map((lvl) => (
                        <SelectItem key={lvl.value} value={lvl.value}>
                          {lvl.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className={TEAM_SHEET_FIELD_GRID_CLASS}>
                <div>
                  <Label>Primary department</Label>
                  <Select
                    value={form.departmentId || 'none'}
                    onValueChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        departmentId: v === 'none' || !v ? '' : v,
                      }))
                    }
                    disabled={saving}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="emp-position">Position / seat</Label>
                  <Input
                    id="emp-position"
                    value={form.position}
                    onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
                    disabled={saving}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="emp-phone">Phone</Label>
                <Input
                  id="emp-phone"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  disabled={saving}
                />
              </div>
            </div>
          )}

          <DetailSheetFormFooter
            visible
            dirty={Boolean(canSubmit)}
            saving={saving}
            onSave={() => void handleSave()}
            onCancel={() => onOpenChange(false)}
            saveLabel="Create employee"
            className={TEAM_SHEET_FOOTER_CLASS}
          />
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
