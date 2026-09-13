'use client';

import { useTranslations } from 'next-intl';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TechnicalProductProfileResponse } from '@/lib/api/technical';
import type { SupportTicket } from '@/lib/api/support';

export interface SupportTechnicalContextDialogProps {
  ticket: SupportTicket | null;
  profile: TechnicalProductProfileResponse | null;
  profileLoading: boolean;
  assetId: string;
  environmentId: string;
  onAssetIdChange: (value: string) => void;
  onEnvironmentIdChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}

export function SupportTechnicalContextDialog({
  ticket,
  profile,
  profileLoading,
  assetId,
  environmentId,
  onAssetIdChange,
  onEnvironmentIdChange,
  onClose,
  onSave,
  saving,
}: SupportTechnicalContextDialogProps) {
  const t = useTranslations('support');
  const tCommon = useTranslations('common');

  return (
    <Dialog
      open={Boolean(ticket)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md" forceNestedBackdrop>
        <DialogHeader>
          <DialogTitle>{t('technical.title')}</DialogTitle>
          <DialogDescription>{t('technical.description')}</DialogDescription>
        </DialogHeader>
        <SupportTechnicalContextFields
          ticket={ticket}
          profile={profile}
          profileLoading={profileLoading}
          assetId={assetId}
          environmentId={environmentId}
          onAssetIdChange={onAssetIdChange}
          onEnvironmentIdChange={onEnvironmentIdChange}
        />
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            disabled={!ticket?.productId || saving || profileLoading}
            onClick={() => void onSave()}
          >
            {tCommon('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SupportTechnicalContextFields({
  ticket,
  profile,
  profileLoading,
  assetId,
  environmentId,
  onAssetIdChange,
  onEnvironmentIdChange,
}: Pick<
  SupportTechnicalContextDialogProps,
  | 'ticket'
  | 'profile'
  | 'profileLoading'
  | 'assetId'
  | 'environmentId'
  | 'onAssetIdChange'
  | 'onEnvironmentIdChange'
>) {
  const t = useTranslations('support');
  if (!ticket?.productId) {
    return <p className="text-muted-foreground text-sm">{t('technical.noProduct')}</p>;
  }
  if (profileLoading) {
    return <p className="text-muted-foreground text-sm">{t('technical.loading')}</p>;
  }
  return (
    <div className="space-y-3">
      <SupportTechnicalNamedSelect
        id="support-tech-asset"
        label={t('technical.asset')}
        value={assetId}
        onChange={onAssetIdChange}
        options={(profile?.assets ?? []).map((asset) => ({
          id: asset.id,
          kind: asset.type,
          name: asset.name,
        }))}
      />
      <SupportTechnicalNamedSelect
        id="support-tech-env"
        label={t('technical.environment')}
        value={environmentId}
        onChange={onEnvironmentIdChange}
        options={(profile?.environments ?? []).map((env) => ({
          id: env.id,
          kind: env.kind,
          name: env.name,
        }))}
      />
    </div>
  );
}

function SupportTechnicalNamedSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ id: string; kind: string; name: string }>;
}) {
  const t = useTranslations('support');
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value || 'none'}
        onValueChange={(next) => {
          if (!next) return;
          onChange(next === 'none' ? '' : next);
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={t('technical.none')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t('technical.none')}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {t('technical.namedOption', { kind: option.kind, name: option.name })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
