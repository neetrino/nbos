'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { employeesApi } from '@/lib/api/employees';
import { platformAccessApi } from '@/lib/api/platform-access';
import { toast } from 'sonner';

interface AddProjectTeamMemberDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
  existingEmployeeIds: string[];
}

export function AddProjectTeamMemberDialog({
  projectId,
  open,
  onOpenChange,
  onAdded,
  existingEmployeeIds,
}: AddProjectTeamMemberDialogProps) {
  const [employees, setEmployees] = useState<
    Array<{ id: string; firstName: string; lastName: string; email: string }>
  >([]);
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [saving, setSaving] = useState(false);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await employeesApi.getAll({ pageSize: 200, status: 'ACTIVE' });
      setEmployees(res.items);
    } catch {
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setEmployeeId('');
    setRole('MEMBER');
    void loadEmployees();
  }, [open, loadEmployees]);

  const candidates = employees.filter((e) => !existingEmployeeIds.includes(e.id));

  const handleSubmit = async () => {
    if (!employeeId) {
      toast.error('Select an employee');
      return;
    }
    setSaving(true);
    try {
      await platformAccessApi.addProjectTeamMember(projectId, { employeeId, role });
      toast.success('Participant added');
      onOpenChange(false);
      onAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add participant');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add project participant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Employee</Label>
            <Select value={employeeId} onValueChange={(v) => setEmployeeId(v ?? '')}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Project role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole((v as 'ADMIN' | 'MEMBER') ?? 'MEMBER')}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={() => void handleSubmit()}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
