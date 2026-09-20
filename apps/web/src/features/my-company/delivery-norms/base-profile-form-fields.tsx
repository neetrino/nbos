'use client';

import { useTranslations } from 'next-intl';
import {
  DELIVERY_CONFIG_SIZES,
  DELIVERY_DESIGN_MODES,
  DELIVERY_IMPLEMENTATION_BASES,
} from '@nbos/shared';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PROFILE_FORM_GRID_CLASS } from './delivery-norms.constants';
import { NormEnumSelect } from './norm-enum-select';
import { NormField } from './norm-field';
import type { ProfileDraft } from './base-profile-draft';
import {
  configSizeLabels,
  designModeLabels,
  implementationBaseLabels,
} from './profile-enum-labels';
import { BaseProfileIdentityFields } from './base-profile-identity-fields';

export { BaseProfileIdentityFields };

export function BaseProfileConfigFields({
  draft,
  disabled,
  onChange,
}: {
  draft: ProfileDraft;
  disabled: boolean;
  onChange: (next: ProfileDraft) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <div className="space-y-3">
      <div className={PROFILE_FORM_GRID_CLASS}>
        <NormField label={t('fields.configSize')}>
          <NormEnumSelect
            id="profile-config-size"
            value={draft.configSize}
            options={DELIVERY_CONFIG_SIZES}
            labels={configSizeLabels(t)}
            disabled={disabled}
            onChange={(configSize) => onChange({ ...draft, configSize })}
          />
        </NormField>
        <NormField label={t('fields.implementationBase')}>
          <NormEnumSelect
            id="profile-implementation-base"
            value={draft.implementationBase}
            options={DELIVERY_IMPLEMENTATION_BASES}
            labels={implementationBaseLabels(t)}
            disabled={disabled}
            onChange={(implementationBase) => onChange({ ...draft, implementationBase })}
          />
        </NormField>
        <NormField label={t('fields.designMode')}>
          <NormEnumSelect
            id="profile-design-mode"
            value={draft.designMode}
            options={DELIVERY_DESIGN_MODES}
            labels={designModeLabels(t)}
            disabled={disabled}
            onChange={(designMode) => onChange({ ...draft, designMode })}
          />
        </NormField>
        <NormField label={t('fields.effectiveFrom')}>
          <Input
            type="date"
            value={draft.effectiveFrom}
            disabled={disabled}
            onChange={(event) => onChange({ ...draft, effectiveFrom: event.target.value })}
          />
        </NormField>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <Switch
          checked={draft.aiDesignerReview}
          disabled={disabled}
          onCheckedChange={(checked) => onChange({ ...draft, aiDesignerReview: Boolean(checked) })}
        />
        <span className="text-foreground">{t('fields.aiDesignerReview')}</span>
      </label>
      <NormField label={t('fields.description')}>
        <Textarea
          value={draft.description}
          disabled={disabled}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
        />
      </NormField>
    </div>
  );
}
