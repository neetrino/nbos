'use client';

import { useEffect, useState } from 'react';
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

export function CreateDealDialog({
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

  useEffect(() => {
    if (!open) return;
    setName('');
  }, [open, prefill?.contactId, prefill?.leadId]);

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
      setName('');
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" forceNestedBackdrop={forceNestedBackdrop}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {prefill?.contactName ? (
          <p className="text-muted-foreground text-sm">
            {t('createDeal.leadPrefix')}{' '}
            <span className="text-foreground font-medium">{prefill.contactName}</span>
          </p>
        ) : null}
        <DealCreateForm
          name={name}
          loading={loading}
          canSubmit={canSubmit}
          onNameChange={setName}
          onCancel={() => onOpenChange(false)}
          onCreate={createDeal}
        />
      </DialogContent>
    </Dialog>
  );
}

function DealCreateForm({
  name,
  loading,
  canSubmit,
  onNameChange,
  onCancel,
  onCreate,
}: {
  name: string;
  loading: boolean;
  canSubmit: boolean;
  onNameChange: (name: string) => void;
  onCancel: () => void;
  onCreate: (openFull: boolean) => Promise<void>;
}) {
  const t = useTranslations('crm');
  const tCommon = useTranslations('common');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onCreate(false);
      }}
      className="space-y-4"
    >
      <div className="space-y-2.5">
        <Label htmlFor="create-deal-title">{t('createDeal.titleLabel')}</Label>
        <Input
          id="create-deal-title"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          autoFocus
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {tCommon('cancel')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loading || !canSubmit}
          onClick={() => void onCreate(true)}
        >
          {t('createDeal.full')}
        </Button>
        <Button type="submit" disabled={loading || !canSubmit}>
          {loading ? tCommon('creating') : t('createDeal.createDeal')}
        </Button>
      </DialogFooter>
    </form>
  );
}
