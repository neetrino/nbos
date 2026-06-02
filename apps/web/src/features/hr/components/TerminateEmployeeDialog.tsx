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
import { employeesApi, type EmployeeOffboardingPreview } from '@/lib/api/employees';
import { toast } from 'sonner';

interface TerminateEmployeeDialogProps {
  employeeId: string | null;
  employeeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTerminated: () => void | Promise<void>;
}

export function TerminateEmployeeDialog({
  employeeId,
  employeeName,
  open,
  onOpenChange,
  onTerminated,
}: TerminateEmployeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<EmployeeOffboardingPreview | null>(null);

  useEffect(() => {
    if (!open || !employeeId) {
      setPreview(null);
      return;
    }
    setLoading(true);
    void employeesApi
      .offboardPreview(employeeId)
      .then(setPreview)
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Could not load offboarding preview');
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [open, employeeId, onOpenChange]);

  async function handleConfirm() {
    if (!employeeId || preview?.alreadyTerminated) return;
    setSubmitting(true);
    try {
      await employeesApi.offboard(employeeId);
      toast.success('Employee offboarded');
      onOpenChange(false);
      await onTerminated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Offboarding failed');
    } finally {
      setSubmitting(false);
    }
  }

  const inventory = preview?.inventory;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Offboard employee</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Loading impact preview…
          </div>
        ) : preview?.alreadyTerminated ? (
          <p className="text-muted-foreground text-sm">This employee is already terminated.</p>
        ) : (
          <div className="space-y-4 text-sm">
            <p>
              Offboard <span className="font-medium">{employeeName}</span>? This will:
            </p>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5">
              <li>Set status to Terminated and record termination date</li>
              <li>Block NBOS login immediately</li>
              <li>Revoke project/product team membership and manual access grants</li>
              <li>Create the offboarding checklist for HR / Operations / Finance</li>
              <li>Notify Finance team about final payroll</li>
            </ul>
            {inventory ? (
              <div className="border-border bg-muted/30 rounded-lg border px-4 py-3 text-xs">
                <p className="text-foreground mb-2 font-medium">Current footprint</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 tabular-nums">
                  <span>Open tasks</span>
                  <span>{inventory.activeTaskCount}</span>
                  <span>Project teams</span>
                  <span>{inventory.projectTeamCount}</span>
                  <span>Product teams</span>
                  <span>{inventory.productTeamCount}</span>
                  <span>Credential grants</span>
                  <span>{inventory.credentialGrantCount}</span>
                  <span>Drive grants</span>
                  <span>{inventory.fileGrantCount}</span>
                </div>
              </div>
            ) : null}
            <p className="text-muted-foreground text-xs">
              Tasks and external tooling (Git, email, Telegram) remain on the checklist for manual
              handoff.
            </p>
          </div>
        )}

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
            variant="destructive"
            disabled={loading || submitting || preview?.alreadyTerminated}
            onClick={() => void handleConfirm()}
          >
            {submitting ? 'Offboarding…' : 'Confirm offboard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
