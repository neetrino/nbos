'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CreateFormDialog, InlineField } from '@/components/shared';
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

export function CreateMarketingAccountDialog(props: CreateMarketingAccountDialogProps) {
  const sessionKey = props.open ? `open:${props.initialChannel ?? ''}` : 'closed';
  return <CreateMarketingAccountDialogSession key={sessionKey} {...props} />;
}

function CreateMarketingAccountDialogSession({
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
  const channelOptions = MARKETING_CHANNELS.map((channel) => ({
    value: channel.value,
    label: getMarketingLabel('channels', channel.value, t),
  }));

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('settings.create.title')}
      description={t('settings.create.description')}
      submitting={saving}
      canSubmit={Boolean(form.name.trim()) && !saving}
      submitLabel={t('settings.add')}
      submittingLabel={t('settings.adding')}
      cancelLabel={tCommon('cancel')}
      onSubmit={(event) =>
        void submitCreateAccount({
          event,
          form,
          usesPhone,
          setSaving,
          onCreated,
          onOpenChange,
          successMessage: t('settings.create.created'),
          fallbackError: t('settings.loadError'),
        })
      }
    >
      <InlineField
        variant="controlled"
        label={t('settings.channel')}
        type="select"
        value={form.channel}
        options={channelOptions}
        onValueChange={(channel) =>
          channel && setForm((prev) => ({ ...prev, channel, identifier: '', phone: '' }))
        }
      />
      <InlineField
        variant="controlled"
        label={t('settings.name')}
        type="text"
        value={form.name}
        placeholder={t('settings.namePlaceholder')}
        onValueChange={(name) => setForm((prev) => ({ ...prev, name }))}
      />
      <InlineField
        variant="controlled"
        label={usesPhone ? t('settings.phone') : t('settings.identifier')}
        type={usesPhone ? 'phone' : 'text'}
        value={usesPhone ? form.phone : form.identifier}
        placeholder={
          usesPhone ? t('settings.phonePlaceholder') : t('settings.identifierPlaceholder')
        }
        onValueChange={(value) =>
          setForm((prev) =>
            usesPhone ? { ...prev, phone: value } : { ...prev, identifier: value },
          )
        }
      />
    </CreateFormDialog>
  );
}

async function submitCreateAccount(params: {
  event: FormEvent;
  form: CreateAccountForm;
  usesPhone: boolean;
  setSaving: (value: boolean) => void;
  onCreated: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  successMessage: string;
  fallbackError: string;
}): Promise<void> {
  params.event.preventDefault();
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
