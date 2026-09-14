'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { KeyRound, MonitorSmartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { employeesApi } from '@/lib/api/employees';
import { getApiErrorMessage } from '@/lib/api-errors';

type SecurityAction = 'resetLink' | 'revokeSessions';

interface EmployeeSecurityAdminPanelProps {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
}

/**
 * Platform-owner recovery actions for another employee. The owner can only trigger the employee's
 * own email reset flow or end their sessions — no screen here shows or sets a password.
 */
export function EmployeeSecurityAdminPanel({
  employeeId,
  employeeName,
  employeeEmail,
}: EmployeeSecurityAdminPanelProps) {
  const t = useTranslations('hr.securityAdmin');
  const tCommon = useTranslations('common');
  const [confirming, setConfirming] = useState<SecurityAction | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: SecurityAction) {
    setBusy(true);
    try {
      if (action === 'resetLink') {
        const result = await employeesApi.sendPasswordResetLink(employeeId);
        toast.success(t('resetLinkSent', { email: result.sentToEmail }));
      } else {
        const result = await employeesApi.revokeSessions(employeeId);
        toast.success(t('sessionsRevoked', { count: result.sessionsRevoked }));
      }
      setConfirming(null);
    } catch (caught) {
      const fallback = action === 'resetLink' ? t('resetLinkFailed') : t('revokeSessionsFailed');
      toast.error(getApiErrorMessage(caught, fallback));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 p-5">
      <SecurityActionRow
        icon={<KeyRound className="size-4" aria-hidden />}
        title={t('resetLinkTitle')}
        description={t('resetLinkDescription', { email: employeeEmail })}
        actionLabel={t('resetLinkAction')}
        disabled={busy}
        onAction={() => setConfirming('resetLink')}
      />
      <SecurityActionRow
        icon={<MonitorSmartphone className="size-4" aria-hidden />}
        title={t('revokeSessionsTitle')}
        description={t('revokeSessionsDescription')}
        actionLabel={t('revokeSessionsAction')}
        disabled={busy}
        onAction={() => setConfirming('revokeSessions')}
      />

      <p className="text-muted-foreground border-t pt-4 text-xs leading-relaxed">
        {t('policyNote')}
      </p>

      <Dialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent forceNestedBackdrop className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirming === 'revokeSessions'
                ? t('confirmRevokeTitle')
                : t('confirmResetLinkTitle')}
            </DialogTitle>
            <DialogDescription>
              {confirming === 'revokeSessions'
                ? t('confirmRevokeDescription', { name: employeeName })
                : t('confirmResetLinkDescription', { name: employeeName, email: employeeEmail })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setConfirming(null)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              variant={confirming === 'revokeSessions' ? 'destructive' : 'default'}
              disabled={busy || confirming === null}
              onClick={() => confirming && void run(confirming)}
            >
              {busy ? t('working') : t('confirmAction')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SecurityActionRow({
  icon,
  title,
  description,
  actionLabel,
  disabled,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  disabled: boolean;
  onAction: () => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{description}</p>
      </div>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}
