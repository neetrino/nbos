'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('hr');
  const tCommon = useTranslations('common');
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
      toast.success(t('reactivateDialog.success'));
      onOpenChange(false);
      await onReactivated(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('reactivateDialog.failed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" forceNestedBackdrop>
        <DialogHeader>
          <DialogTitle>{t('reactivateDialog.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p>{t('reactivateDialog.confirmLead', { name: employeeName })}</p>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5">
            <li>{t('reactivateDialog.bulletStatus')}</li>
            <li>{t('reactivateDialog.bulletLogin')}</li>
            <li>{t('reactivateDialog.bulletChecklist')}</li>
            <li>{t('reactivateDialog.bulletAccess')}</li>
          </ul>
          <div className="space-y-2">
            <Label htmlFor="reactivate-status">{t('reactivateDialog.statusLabel')}</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                if (value === 'ACTIVE' || value === 'PROBATION') setStatus(value);
              }}
            >
              <SelectTrigger id="reactivate-status" className="w-full">
                <SelectValue placeholder={t('reactivateDialog.selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROBATION">{t('reactivateDialog.probationRehire')}</SelectItem>
                <SelectItem value="ACTIVE">{t('status.ACTIVE')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-muted-foreground text-xs">{t('reactivateDialog.hint')}</p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            disabled={submitting || !employeeId}
            onClick={() => void handleConfirm()}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t('reactivateDialog.submitting')}
              </>
            ) : (
              t('reactivateDialog.confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
