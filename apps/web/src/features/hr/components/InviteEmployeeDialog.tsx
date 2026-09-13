'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TEAM_SHEET_FIELD_CLASS } from '@/features/hr/constants/team-sheet-layout';
import {
  departmentsApi,
  invitationsApi,
  rolesApi,
  type DepartmentItem,
  type RoleItem,
} from '@/lib/api/employees';
import { toast } from 'sonner';
import { usePermission } from '@/lib/permissions';
import {
  assignmentPickerActor,
  filterRolesForAssignmentPicker,
} from '@/features/hr/utils/role-assignment-picker';

interface InviteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InviteEmployeeDialog({ open, onOpenChange, onSuccess }: InviteEmployeeDialogProps) {
  const t = useTranslations('hr');
  const tCommon = useTranslations('common');
  const { me } = usePermission();
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [form, setForm] = useState({
    email: '',
    roleId: '',
    departmentId: '',
  });

  useEffect(() => {
    if (!open) return;

    const loadRoles = async () => {
      setRolesLoading(true);
      setRolesError(null);
      try {
        const data = await rolesApi.getAll();
        setRoles(Array.isArray(data) ? data : []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : t('invite.rolesFailed');
        setRolesError(msg);
        toast.error(msg);
      } finally {
        setRolesLoading(false);
      }
    };

    const loadDepartments = async () => {
      setDepartmentsLoading(true);
      setDepartmentsError(null);
      try {
        const data = await departmentsApi.getAll();
        setDepartments(Array.isArray(data) ? data : []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : t('invite.departmentsFailed');
        setDepartmentsError(msg);
        toast.error(msg);
      } finally {
        setDepartmentsLoading(false);
      }
    };

    void loadRoles();
    void loadDepartments();
  }, [open, t]);

  const reset = () => {
    setForm({ email: '', roleId: '', departmentId: '' });
  };

  const canSubmit =
    form.email.trim() && form.roleId && !rolesLoading && !departmentsLoading && !rolesError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await invitationsApi.create({
        email: form.email.trim(),
        roleId: form.roleId,
        departmentId: form.departmentId || undefined,
      });
      toast.success(t('invite.sent'));
      onSuccess();
      onOpenChange(false);
      reset();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('invite.failed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t('invite.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={TEAM_SHEET_FIELD_CLASS}>
            <Label htmlFor="invite-email">{t('form.email')} *</Label>
            <Input
              id="invite-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t('invite.emailPlaceholder')}
              autoFocus
              disabled={loading}
            />
          </div>

          <div className={TEAM_SHEET_FIELD_CLASS}>
            <Label>{t('invite.role')} *</Label>
            <Select
              value={form.roleId}
              onValueChange={(v) => setForm({ ...form, roleId: v ?? '' })}
              disabled={rolesLoading || loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={rolesLoading ? t('invite.loadingRoles') : t('invite.selectRole')}
                />
              </SelectTrigger>
              <SelectContent>
                {filterRolesForAssignmentPicker(roles, assignmentPickerActor(me)).map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {rolesError && <p className="text-destructive mt-1 text-xs">{rolesError}</p>}
          </div>

          <div className={TEAM_SHEET_FIELD_CLASS}>
            <Label>{t('invite.departmentOptional')}</Label>
            <Select
              value={form.departmentId || 'none'}
              onValueChange={(v) => setForm({ ...form, departmentId: v === 'none' || !v ? '' : v })}
              disabled={departmentsLoading || loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    departmentsLoading
                      ? t('invite.loadingDepartments')
                      : t('invite.selectDepartment')
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('invite.none')}</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {departmentsError && (
              <p className="text-destructive mt-1 text-xs">{departmentsError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? t('invite.sending') : t('invite.send')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
