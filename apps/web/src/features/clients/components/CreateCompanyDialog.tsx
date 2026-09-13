'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DetailSheetFieldSegmented, InlineField } from '@/components/shared';
import { COMPANY_TYPES, TAX_STATUSES } from '../constants/clients';
import { companiesApi, type Company } from '@/lib/api/clients';
import { toastApiError } from '@/lib/permissions';

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (company?: Company) => void;
  defaultName?: string;
  /** When opened above an entity sheet floating rail. */
  forceNestedBackdrop?: boolean;
}

const EMPTY_FORM = {
  name: '',
  type: 'LEGAL',
  taxStatus: 'TAX',
};

export function CreateCompanyDialog({
  open,
  onOpenChange,
  onCreated,
  defaultName = '',
  forceNestedBackdrop = false,
}: CreateCompanyDialogProps) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const companyTypeOptions = useMemo(
    () =>
      COMPANY_TYPES.map((companyType) => ({
        value: companyType.value,
        label: t(`company.types.${companyType.value}` as never),
      })),
    [t],
  );

  const taxStatusOptions = useMemo(
    () =>
      TAX_STATUSES.map((taxStatus) => ({
        value: taxStatus.value,
        label: t(`company.taxStatuses.${taxStatus.value}` as never),
      })),
    [t],
  );

  useEffect(() => {
    if (!open || !defaultName.trim()) return;
    setForm((prev) => ({ ...prev, name: defaultName.trim() }));
  }, [open, defaultName]);

  const canSubmit = Boolean(form.name) && Boolean(form.type) && Boolean(form.taxStatus);

  const reset = () => {
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const created = await companiesApi.create({
        name: form.name,
        type: form.type,
        taxStatus: form.taxStatus,
      });
      onCreated?.(created);
      onOpenChange(false);
      reset();
    } catch (caught: unknown) {
      toastApiError(caught, t('company.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-[540px]" forceNestedBackdrop={forceNestedBackdrop}>
        <DialogHeader>
          <DialogTitle>{t('company.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InlineField
            variant="controlled"
            label={t('company.fields.name')}
            type="text"
            value={form.name}
            placeholder={t('company.placeholders.name')}
            disabled={loading}
            onValueChange={(name) => setForm((prev) => ({ ...prev, name }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <InlineField
              variant="controlled"
              label={t('company.fields.type')}
              type="select"
              value={form.type}
              options={companyTypeOptions}
              disabled={loading}
              onValueChange={(type) => {
                if (type) setForm((prev) => ({ ...prev, type }));
              }}
            />
            <DetailSheetFieldSegmented
              label={t('company.fields.taxStatus')}
              value={form.taxStatus}
              options={taxStatusOptions}
              onValueChange={(taxStatus) => setForm((prev) => ({ ...prev, taxStatus }))}
              disabled={loading}
              ariaLabel={t('company.fields.taxStatusAria')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? tCommon('creating') : tCommon('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
