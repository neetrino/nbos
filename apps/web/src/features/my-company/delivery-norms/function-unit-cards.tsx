'use client';

import { useTranslations } from 'next-intl';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { NORMS_CARD_GRID_CLASS } from './delivery-norms.constants';
import { liveNormDisplayStatus } from './live-norm-pair';
import type { LiveFunctionPrice } from './live-function-prices';
import { normativeStatusLabelKey } from './normative-status-badge';
import { PublishDraftButton } from './publish-draft-button';
import { UnitNormCard } from './unit-norm-card';

export function FunctionUnitCards({
  pairs,
  titles,
  canAdd,
  canPublish,
  onEdit,
  onChanged,
  onError,
}: {
  pairs: LiveFunctionPrice[];
  titles: Map<string, string>;
  canAdd: boolean;
  canPublish: boolean;
  onEdit: (pair: LiveFunctionPrice) => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (pairs.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('prices.empty')}</p>;
  }
  return (
    <ul className={NORMS_CARD_GRID_CLASS}>
      {pairs.map((pair) => (
        <FunctionUnitCard
          key={pair.key}
          pair={pair}
          title={titles.get(pair.key) ?? t('prices.unknownFunction')}
          kindLabel={t('workspace.unitTabs.function')}
          canAdd={canAdd}
          canPublish={canPublish}
          onEdit={() => onEdit(pair)}
          onChanged={onChanged}
          onError={onError}
        />
      ))}
    </ul>
  );
}

function FunctionUnitCard({
  pair,
  title,
  kindLabel,
  canAdd,
  canPublish,
  onEdit,
  onChanged,
  onError,
}: {
  pair: LiveFunctionPrice;
  title: string;
  kindLabel: string;
  canAdd: boolean;
  canPublish: boolean;
  onEdit: () => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const current = pair.draft ?? pair.published;
  const status = current ? liveNormDisplayStatus(pair) : null;
  return (
    <UnitNormCard
      title={title}
      kindLabel={kindLabel}
      roleUnits={current?.roleUnits ?? null}
      status={status}
      statusLabel={status ? t(normativeStatusLabelKey(status)) : null}
      canOpen={pair.draft ? canPublish : canAdd}
      onOpen={onEdit}
      publish={
        pair.draft && canPublish ? (
          <PublishDraftButton
            roleUnits={pair.draft.roleUnits}
            onPublish={async (confirmZeroUnits) => {
              await deliveryNormsApi.publishFunctionPrice(pair.draft?.id ?? '', {
                confirmZeroUnits,
              });
            }}
            onError={onError}
            onPublished={onChanged}
          />
        ) : null
      }
    />
  );
}
