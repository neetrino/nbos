'use client';

import { useTranslations } from 'next-intl';
import {
  DELIVERY_CONFIG_SIZES,
  DELIVERY_DESIGN_MODES,
  DELIVERY_IMPLEMENTATION_BASES,
} from '@nbos/shared';
import { CreateFormSwitchField, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { SHEET_STACK_CLASS } from './delivery-norms.constants';
import type { ProfileDraft } from './base-profile-draft';
import {
  configSizeLabels,
  designModeLabels,
  implementationBaseLabels,
} from './profile-enum-labels';
import { selectOptionsFromRecord, applySelectValue } from './select-options-from-record';
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
    <div className={SHEET_STACK_CLASS}>
      <InlineField
        variant="controlled"
        type="select"
        className={FORM_FIELD_CELL_CLASS}
        label={t('fields.configSize')}
        value={draft.configSize}
        disabled={disabled}
        options={selectOptionsFromRecord(DELIVERY_CONFIG_SIZES, configSizeLabels(t))}
        onValueChange={(value) =>
          applySelectValue(DELIVERY_CONFIG_SIZES, value, (configSize) =>
            onChange({ ...draft, configSize }),
          )
        }
      />
      <InlineField
        variant="controlled"
        type="select"
        className={FORM_FIELD_CELL_CLASS}
        label={t('fields.implementationBase')}
        value={draft.implementationBase}
        disabled={disabled}
        options={selectOptionsFromRecord(
          DELIVERY_IMPLEMENTATION_BASES,
          implementationBaseLabels(t),
        )}
        onValueChange={(value) =>
          applySelectValue(DELIVERY_IMPLEMENTATION_BASES, value, (implementationBase) =>
            onChange({ ...draft, implementationBase }),
          )
        }
      />
      <InlineField
        variant="controlled"
        type="select"
        className={FORM_FIELD_CELL_CLASS}
        label={t('fields.designMode')}
        value={draft.designMode}
        disabled={disabled}
        options={selectOptionsFromRecord(DELIVERY_DESIGN_MODES, designModeLabels(t))}
        onValueChange={(value) =>
          applySelectValue(DELIVERY_DESIGN_MODES, value, (designMode) =>
            onChange({ ...draft, designMode }),
          )
        }
      />
      <InlineField
        variant="controlled"
        type="date"
        className={FORM_FIELD_CELL_CLASS}
        label={t('fields.effectiveFrom')}
        value={draft.effectiveFrom}
        disabled={disabled}
        onValueChange={(effectiveFrom) => onChange({ ...draft, effectiveFrom })}
      />
      <CreateFormSwitchField
        label={t('fields.aiDesignerReview')}
        checked={draft.aiDesignerReview}
        disabled={disabled}
        onCheckedChange={(aiDesignerReview) => onChange({ ...draft, aiDesignerReview })}
      />
      <InlineField
        variant="controlled"
        type="textarea"
        label={t('fields.description')}
        value={draft.description}
        disabled={disabled}
        onValueChange={(description) => onChange({ ...draft, description })}
      />
    </div>
  );
}
