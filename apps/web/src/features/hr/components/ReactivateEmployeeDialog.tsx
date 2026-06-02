'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  employeesApi,
  type EmployeeReactivationResult,
  type EmployeeReactivationTargetStatus,
} from '@/lib/api/employees';
import { toast } from 'sonner';

interface ReactivateEmployeeDialogProps {
  employeeId: string | null;
  employeeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReactivated: (result: EmployeeReactivationResult) => void | Promise<void>;
}

export function ReactivateEmployeeDialog({
  employeeId,
  employeeName,
  open,
  onOpenChange,
  onReactivated,
}: ReactivateEmployeeDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<EmployeeReactivationTargetStatus>('PROBATION');

  useEffect(() => {
    if (open) setStatus('PROBATION');
  }, [open]);

  async function handleConfirm() {
    if (!employeeId) return;
    setSubmitting(true);
    try {
      const result = await employeesApi.reactivate(employeeId, { status });
      toast.success('Employee reactivated');
      onOpenChange(false);
      await onReactivated(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reactivation failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Reactivate employee</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p>
            Rehire <span className="font-medium">{employeeName}</span> and restore NBOS login?
          </p>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5">
            <li>Clear termination date and set employment status</li>
            <li>Restore platform login (role permissions apply again)</li>
            <li>Create a fresh onboarding checklist for HR / Operations</li>
            <li>Project, credential, and drive access stay revoked until re-granted</li>
          </ul>
          <div className="space-y-2">
            <Label htmlFor="reactivate-status">Employment status</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                if (value === 'ACTIVE' || value === 'PROBATION') setStatus(value);
              }}
            >
              <SelectTrigger id="reactivate-status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROBATION">Probation (rehire)</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-muted-foreground text-xs">
            Only Owner, CEO, or HR department members can reactivate terminated profiles.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting || !employeeId}
            onClick={() => void handleConfirm()}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Reactivating…
              </>
            ) : (
              'Confirm reactivation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
