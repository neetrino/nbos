'use client';

import { useTranslations } from 'next-intl';
import { AppWindow } from 'lucide-react';
import { allowedProductPlatforms, productPlatformApplies } from '@nbos/shared';
import { InlineField } from '@/components/shared';
import { dealStageGateFieldClass } from '@/features/crm/deal-stage-gate-highlight';
import { translateProductPlatformLabel } from '../i18n/crm-copy';
import { buildDealPlatformPatch, type DealGeneralDraft } from './deal-general-form-state';

export function DealInfoProductPlatformField({
  draft,
  patchDraft,
  disabled = false,
  gateRequiredFields = new Set(),
}: {
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  disabled?: boolean;
  gateRequiredFields?: ReadonlySet<string>;
}) {
  const t = useTranslations('crm');
  if (!productPlatformApplies(draft.productCategory)) return null;
  return (
    <InlineField
      variant="controlled"
      label={t('dealSheet.productPlatform')}
      type="select"
      value={draft.productPlatform ?? ''}
      options={allowedProductPlatforms(draft.productCategory).map((value) => ({
        value,
        label: translateProductPlatformLabel(t, value),
      }))}
      placeholder={t('dealSheet.selectPlatform')}
      icon={<AppWindow size={12} />}
      disabled={disabled}
      className={dealStageGateFieldClass(gateRequiredFields, 'productPlatform')}
      onValueChange={(v) => {
        if (!v) return;
        patchDraft(buildDealPlatformPatch(draft, v));
      }}
    />
  );
}
