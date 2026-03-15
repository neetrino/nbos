'use client';

import { useState, useEffect } from 'react';
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
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface RoleItem {
  id: string;
  name: string;
  slug: string;
  level: number;
  isSystem?: boolean;
}

interface DepartmentItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  sortOrder?: number;
}

interface InviteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InviteEmployeeDialog({ open, onOpenChange, onSuccess }: InviteEmployeeDialogProps) {
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
        const data = await api.get<RoleItem[]>('/api/roles').then((r) => r.data);
        setRoles(Array.isArray(data) ? data : []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load roles';
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
        const data = await api.get<DepartmentItem[]>('/api/departments').then((r) => r.data);
        setDepartments(Array.isArray(data) ? data : []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load departments';
        setDepartmentsError(msg);
        toast.error(msg);
      } finally {
        setDepartmentsLoading(false);
      }
    };

    loadRoles();
    loadDepartments();
  }, [open]);

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
      await api.post('/api/invitations', {
        email: form.email.trim(),
        roleId: form.roleId,
        departmentId: form.departmentId || undefined,
      });
      toast.success('Invitation sent successfully');
      onSuccess();
      onOpenChange(false);
      reset();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send invitation';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Invite Employee</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="invite-email">Email *</Label>
            <Input
              id="invite-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="employee@company.com"
              autoFocus
              disabled={loading}
            />
          </div>

          <div>
            <Label>Role *</Label>
            <Select
              value={form.roleId}
              onValueChange={(v) => setForm({ ...form, roleId: v })}
              disabled={rolesLoading || loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={rolesLoading ? 'Loading roles...' : 'Select role'} />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {rolesError && <p className="text-destructive mt-1 text-xs">{rolesError}</p>}
          </div>

          <div>
            <Label>Department (optional)</Label>
            <Select
              value={form.departmentId || 'none'}
              onValueChange={(v) => setForm({ ...form, departmentId: v === 'none' ? '' : v })}
              disabled={departmentsLoading || loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={departmentsLoading ? 'Loading departments...' : 'Select department'}
                />
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
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
