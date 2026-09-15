'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CreateFormDialog, InlineField } from '@/components/shared';
import { dealsApi, type Deal } from '@/lib/api/deals';
import { toast } from 'sonner';
import { firstReleaseFormErrorCopy, localizeCaughtApiError } from '@/i18n/localize-api-error';

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (deal: Deal, options?: { openFull?: boolean }) => Promise<void> | void;
  prefill?: {
    leadId?: string;
    contactId?: string;
    contactName?: string;
  };
  forceNestedBackdrop?: boolean;
}

export function CreateDealDialog(props: CreateDealDialogProps) {
  const sessionKey = props.open
    ? `${props.prefill?.leadId ?? ''}:${props.prefill?.contactId ?? ''}`
    : 'closed';
  return <CreateDealDialogSession key={sessionKey} {...props} />;
}

function CreateDealDialogSession({
  open,
  onOpenChange,
  onCreated,
  prefill,
  forceNestedBackdrop = false,
}: CreateDealDialogProps) {
  const t = useTranslations('crm');
  const tCommon = useTranslations('common');
  const tForms = useTranslations('forms');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const canSubmit = name.trim().length > 0;
  const title = prefill?.leadId ? t('createDeal.convertTitle') : t('createDeal.title');

  const createDeal = async (openFull: boolean) => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const deal = await dealsApi.create({
        name: name.trim(),
        ...(prefill?.leadId ? { leadId: prefill.leadId } : {}),
        ...(prefill?.contactId ? { contactId: prefill.contactId } : {}),
      });
      await onCreated(deal, { openFull });
      onOpenChange(false);
    } catch (err) {
      toast.error(
        localizeCaughtApiError(
          err,
          firstReleaseFormErrorCopy(
            tCommon('permissionDenied'),
            t('createDeal.createError'),
            tForms('errors.validation'),
            t('createDeal.createError'),
            tForms('errors.network'),
          ),
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={
        prefill?.contactName ? (
          <>
            {t('createDeal.leadPrefix')} {prefill.contactName}
          </>
        ) : undefined
      }
      submitting={loading}
      canSubmit={canSubmit}
      submitLabel={t('createDeal.createDeal')}
      submittingLabel={tCommon('creating')}
      cancelLabel={tCommon('cancel')}
      forceNestedBackdrop={forceNestedBackdrop}
      secondaryAction={{
        label: t('createDeal.full'),
        onClick: () => void createDeal(true),
        disabled: !canSubmit,
      }}
      onSubmit={(event) => {
        event.preventDefault();
        void createDeal(false);
      }}
    >
      <InlineField
        variant="controlled"
        label={t('createDeal.titleLabel')}
        type="text"
        value={name}
        onValueChange={setName}
      />
    </CreateFormDialog>
  );
}
