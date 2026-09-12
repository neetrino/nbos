'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CredentialStepUpDialog } from '@/features/credentials/components/credential-step-up-dialog';
import { credentialsApi } from '@/lib/api/credentials';
import { toast } from 'sonner';

const REASON_MIN_LENGTH = 10;

export interface CredentialEmergencyAccessPanelProps {
  credentialId: string;
  onRequested: () => void;
}

export function CredentialEmergencyAccessPanel({
  credentialId,
  onRequested,
}: CredentialEmergencyAccessPanelProps) {
  const t = useTranslations('credentials');
  const tCommon = useTranslations('common');
  const [reason, setReason] = useState('');
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reasonValid = reason.trim().length >= REASON_MIN_LENGTH;

  const submit = async (stepUpPassword: string) => {
    setSubmitting(true);
    try {
      await credentialsApi.requestEmergencyAccess(credentialId, {
        reason: reason.trim(),
        stepUpPassword,
      });
      toast.success(t('emergency.success'));
      setStepUpOpen(false);
      onRequested();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tCommon('genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 px-6 py-8">
      <div>
        <h3 className="text-sm font-medium">{t('emergency.title')}</h3>
        <p className="text-muted-foreground mt-1 text-xs">{t('emergency.description')}</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="emergency-reason">{t('emergency.reason')}</Label>
        <Textarea
          id="emergency-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[88px] text-sm"
          placeholder={t('emergency.reasonPlaceholder')}
        />
      </div>
      <Button
        type="button"
        disabled={!reasonValid || submitting}
        onClick={() => setStepUpOpen(true)}
      >
        {t('emergency.request')}
      </Button>
      <CredentialStepUpDialog
        open={stepUpOpen}
        onOpenChange={setStepUpOpen}
        title={t('emergency.confirm')}
        onConfirm={submit}
      />
    </div>
  );
}
