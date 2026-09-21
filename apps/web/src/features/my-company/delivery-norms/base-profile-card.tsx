'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryBaseProfileFinancialDto } from '@nbos/shared';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import {
  formatBaseProfileLabel,
  parseProfileKey,
  type BaseProfileLabelDictionaries,
} from './base-profile-label';
import {
  NORMS_PROFILE_CARD_ACTIONS_CLASS,
  NORMS_PROFILE_CARD_CLASS,
  PROFILE_LABEL_SEPARATOR,
  PROFILE_VERSION_PREFIX,
} from './delivery-norms.constants';
import { NormativeStatusBadge, normativeStatusLabelKey } from './normative-status-badge';
import { PublishDraftButton } from './publish-draft-button';
import { RoleUnitsBreakdown } from './role-units-breakdown';

export function BaseProfileCard({
  row,
  dictionaries,
  canPublish,
  onPublished,
  onError,
}: {
  row: DeliveryBaseProfileFinancialDto;
  dictionaries: BaseProfileLabelDictionaries;
  canPublish: boolean;
  onPublished: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const copy = profileCardCopy(row, dictionaries);
  const showPublish = row.status === 'DRAFT' && canPublish;
  return (
    <li className={NORMS_PROFILE_CARD_CLASS}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="text-foreground text-sm leading-snug font-semibold">{copy.title}</h3>
          <p className="text-muted-foreground text-xs">{copy.subtitle}</p>
          <p className="text-muted-foreground text-xs">
            {t('profiles.includedCount', { count: row.includedFunctionIds.length })}
          </p>
        </div>
        <NormativeStatusBadge status={row.status} label={t(normativeStatusLabelKey(row.status))} />
      </div>
      <RoleUnitsBreakdown rows={row.roleUnits} />
      {showPublish ? (
        <div className={NORMS_PROFILE_CARD_ACTIONS_CLASS}>
          <PublishDraftButton
            roleUnits={row.roleUnits}
            onPublish={async (confirmZeroUnits) => {
              await deliveryNormsApi.publishBaseProfile(row.id, { confirmZeroUnits });
            }}
            onError={onError}
            onPublished={onPublished}
          />
        </div>
      ) : null}
    </li>
  );
}

function profileCardCopy(
  row: DeliveryBaseProfileFinancialDto,
  dictionaries: BaseProfileLabelDictionaries,
): { title: string; subtitle: string } {
  const parsed = parseProfileKey(row.profileKey);
  const title = parsed.productType
    ? dictionaries.productTypes[parsed.productType]
    : formatBaseProfileLabel(row.profileKey, null, dictionaries);
  const versionLabel = `${PROFILE_VERSION_PREFIX}${row.version}`;
  const sizeLabel = parsed.configSize ? dictionaries.sizes[parsed.configSize] : null;
  return {
    title,
    subtitle: sizeLabel ? `${sizeLabel}${PROFILE_LABEL_SEPARATOR}${versionLabel}` : versionLabel,
  };
}
