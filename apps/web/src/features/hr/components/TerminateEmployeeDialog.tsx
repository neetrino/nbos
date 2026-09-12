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
  const t = useTranslations('hr');
  const tCommon = useTranslations('common');
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
        toast.error(err instanceof Error ? err.message : t('offboardDialog.loadFailed'));
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [open, employeeId, onOpenChange, t]);

  async function handleConfirm() {
    if (!employeeId || preview?.alreadyTerminated) return;
    setSubmitting(true);
    try {
      await employeesApi.offboard(employeeId);
      toast.success(t('offboardDialog.success'));
      onOpenChange(false);
      await onTerminated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('offboardDialog.failed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" forceNestedBackdrop>
        <DialogHeader>
          <DialogTitle>{t('offboardDialog.title')}</DialogTitle>
        </DialogHeader>
        <OffboardDialogBody
          loading={loading}
          preview={preview}
          employeeName={employeeName}
        />
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
            variant="destructive"
            disabled={loading || submitting || preview?.alreadyTerminated}
            onClick={() => void handleConfirm()}
          >
            {submitting ? t('offboardDialog.submitting') : t('offboardDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OffboardDialogBody({
  loading,
  preview,
  employeeName,
}: {
  loading: boolean;
  preview: EmployeeOffboardingPreview | null;
  employeeName: string;
}) {
  const t = useTranslations('hr');
  const inventory = preview?.inventory;

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {t('offboardDialog.loading')}
      </div>
    );
  }

  if (preview?.alreadyTerminated) {
    return <p className="text-muted-foreground text-sm">{t('offboardDialog.alreadyTerminated')}</p>;
  }

  return (
    <div className="space-y-4 text-sm">
      <p>{t('offboardDialog.confirmLead', { name: employeeName })}</p>
      <ul className="text-muted-foreground list-disc space-y-1 pl-5">
        <li>{t('offboardDialog.bulletStatus')}</li>
        <li>{t('offboardDialog.bulletLogin')}</li>
        <li>{t('offboardDialog.bulletRevoke')}</li>
        <li>{t('offboardDialog.bulletChecklist')}</li>
        <li>{t('offboardDialog.bulletFinance')}</li>
      </ul>
      {inventory ? (
        <div className="border-border bg-muted/30 rounded-lg border px-4 py-3 text-xs">
          <p className="text-foreground mb-2 font-medium">{t('offboardDialog.footprint')}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 tabular-nums">
            <span>{t('offboardDialog.openTasks')}</span>
            <span>{inventory.activeTaskCount}</span>
            <span>{t('offboardDialog.projectTeams')}</span>
            <span>{inventory.projectTeamCount}</span>
            <span>{t('offboardDialog.productTeams')}</span>
            <span>{inventory.productTeamCount}</span>
            <span>{t('offboardDialog.credentialAccess')}</span>
            <span>{inventory.credentialIds.length}</span>
            <span>{t('offboardDialog.driveGrants')}</span>
            <span>{inventory.fileGrantCount}</span>
          </div>
        </div>
      ) : null}
      <p className="text-muted-foreground text-xs">{t('offboardDialog.manualHandoff')}</p>
    </div>
  );
}
