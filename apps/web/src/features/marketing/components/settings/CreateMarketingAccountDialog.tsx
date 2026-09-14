'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toastApiError } from '@/lib/permissions';
import { marketingApi } from '@/lib/api/marketing';
import { MARKETING_CHANNELS, getMarketingLabel } from '@/features/marketing/constants';
import {
  MARKETING_ACCOUNT_PHONE_CHANNEL,
  marketingAccountUsesPhone,
} from '@/features/marketing/constants/marketing-settings-surface';

interface CreateAccountForm {
  channel: string;
  name: string;
  identifier: string;
  phone: string;
}

interface CreateMarketingAccountDialogProps {
  open: boolean;
  initialChannel?: string;
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<void>;
}

function createEmptyForm(channel?: string): CreateAccountForm {
  return {
    channel: channel ?? MARKETING_ACCOUNT_PHONE_CHANNEL,
    name: '',
    identifier: '',
    phone: '',
  };
}

export function CreateMarketingAccountDialog({
  open,
  initialChannel,
  onOpenChange,
  onCreated,
}: CreateMarketingAccountDialogProps) {
  const t = useTranslations('marketing');
  const tCommon = useTranslations('common');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => createEmptyForm(initialChannel));
  const usesPhone = marketingAccountUsesPhone(form.channel);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submitCreateAccount({
              form,
              usesPhone,
              setSaving,
              onCreated,
              onOpenChange,
              successMessage: t('settings.create.created'),
              fallbackError: t('settings.loadError'),
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('settings.create.title')}</DialogTitle>
            <DialogDescription>{t('settings.create.description')}</DialogDescription>
          </DialogHeader>
          <CreateMarketingAccountFields form={form} usesPhone={usesPhone} onChange={setForm} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={saving || !form.name.trim()}>
              {saving ? t('settings.adding') : t('settings.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateMarketingAccountFields({
  form,
  usesPhone,
  onChange,
}: {
  form: CreateAccountForm;
  usesPhone: boolean;
  onChange: (form: CreateAccountForm) => void;
}) {
  const t = useTranslations('marketing');
  return (
    <>
      <div className="space-y-1.5">
        <Label>{t('settings.channel')}</Label>
        <Select
          value={form.channel}
          onValueChange={(channel) =>
            onChange({ ...form, channel: channel ?? form.channel, identifier: '', phone: '' })
          }
        >
          <SelectTrigger>
            <SelectValue>{getMarketingLabel('channels', form.channel, t)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {MARKETING_CHANNELS.map((channel) => (
              <SelectItem key={channel.value} value={channel.value}>
                {getMarketingLabel('channels', channel.value, t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>{t('settings.name')}</Label>
        <Input
          value={form.name}
          onChange={(event) => onChange({ ...form, name: event.target.value })}
          placeholder={t('settings.namePlaceholder')}
        />
      </div>
      <div className="space-y-1.5">
        <Label>{usesPhone ? t('settings.phone') : t('settings.identifier')}</Label>
        <Input
          value={usesPhone ? form.phone : form.identifier}
          onChange={(event) =>
            onChange(
              usesPhone
                ? { ...form, phone: event.target.value }
                : { ...form, identifier: event.target.value },
            )
          }
          placeholder={
            usesPhone ? t('settings.phonePlaceholder') : t('settings.identifierPlaceholder')
          }
        />
      </div>
    </>
  );
}

async function submitCreateAccount(params: {
  form: CreateAccountForm;
  usesPhone: boolean;
  setSaving: (value: boolean) => void;
  onCreated: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  successMessage: string;
  fallbackError: string;
}): Promise<void> {
  if (!params.form.name.trim()) return;
  params.setSaving(true);
  try {
    await marketingApi.createAccount({
      channel: params.form.channel,
      name: params.form.name.trim(),
      identifier: params.usesPhone ? undefined : params.form.identifier || undefined,
      phone: params.usesPhone ? params.form.phone || undefined : undefined,
    });
    params.onOpenChange(false);
    await params.onCreated();
    toast.success(params.successMessage);
  } catch (caught) {
    toastApiError(caught, params.fallbackError);
  } finally {
    params.setSaving(false);
  }
}
