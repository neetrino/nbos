'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { RelationCreatePrefill } from '@/components/shared/relation-picker';
import { DetailSheetFieldSegmented, InlineField } from '@/components/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CONTACT_ROLES } from '../constants/clients';
import { contactsApi, type Contact } from '@/lib/api/clients';
import { toastApiError } from '@/lib/permissions';

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (contact?: Contact) => void;
  prefill?: RelationCreatePrefill | null;
  /** When opened above an entity sheet floating rail. */
  forceNestedBackdrop?: boolean;
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  phone: '',
  role: 'CLIENT',
};

export function CreateContactDialog({
  open,
  onOpenChange,
  onCreated,
  forceNestedBackdrop = false,
  prefill = null,
}: CreateContactDialogProps) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const contactRoleOptions = useMemo(
    () =>
      CONTACT_ROLES.map((role) => ({
        value: role.value,
        label: t(`contact.roles.${role.value}` as never),
      })),
    [t],
  );

  useEffect(() => {
    if (!open) return;
    if (!prefill) {
      setForm(EMPTY_FORM);
      return;
    }
    setForm({
      ...EMPTY_FORM,
      firstName: prefill.firstName ?? '',
      lastName: prefill.lastName ?? '',
    });
  }, [open, prefill]);

  const canSubmit = form.firstName && form.lastName && form.phone && form.role;

  const reset = () => {
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const created = await contactsApi.create({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        role: form.role,
      });
      onCreated?.(created);
      onOpenChange(false);
      reset();
    } catch (caught: unknown) {
      toastApiError(caught, t('contact.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-[540px]" forceNestedBackdrop={forceNestedBackdrop}>
        <DialogHeader>
          <DialogTitle>{t('contact.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InlineField
              variant="controlled"
              label={t('contact.fields.firstName')}
              type="text"
              value={form.firstName}
              placeholder={t('contact.placeholders.firstName')}
              disabled={loading}
              onValueChange={(firstName) => setForm((prev) => ({ ...prev, firstName }))}
            />
            <InlineField
              variant="controlled"
              label={t('contact.fields.lastName')}
              type="text"
              value={form.lastName}
              placeholder={t('contact.placeholders.lastName')}
              disabled={loading}
              onValueChange={(lastName) => setForm((prev) => ({ ...prev, lastName }))}
            />
          </div>

          <InlineField
            variant="controlled"
            label={t('contact.fields.phone')}
            type="phone"
            value={form.phone}
            placeholder={t('contact.placeholders.phone')}
            disabled={loading}
            onValueChange={(phone) => setForm((prev) => ({ ...prev, phone }))}
          />

          <DetailSheetFieldSegmented
            label={t('contact.fields.contactType')}
            value={form.role}
            options={contactRoleOptions}
            onValueChange={(role) => setForm((prev) => ({ ...prev, role }))}
            disabled={loading}
            ariaLabel={t('contact.fields.contactTypeAria')}
          />

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
