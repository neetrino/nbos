'use client';

import { useTranslations } from 'next-intl';
import type { ReplacementPlanComponentDto } from '@/lib/api/delivery-configurations';
import { ReplaceAssigneeComponentRow } from './replace-assignee-component-row';
import { type ShareDraft, updateSharePercent } from './replace-assignee-form';

export function ReplaceAssigneeComponentList({
  components,
  shares,
  outgoingName,
  incomingName,
  fromEmployeeId,
  disabled,
  onSharesChange,
}: {
  components: readonly ReplacementPlanComponentDto[];
  shares: readonly ShareDraft[];
  outgoingName: string;
  incomingName: string;
  fromEmployeeId: string;
  disabled: boolean;
  onSharesChange: (shares: ShareDraft[]) => void;
}) {
  const t = useTranslations('hr.functionCatalog');
  if (components.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('replaceAssignee.planEmpty')}</p>;
  }
  return (
    <div className="space-y-3">
      {components.map((component) => {
        const share = shares.find((row) => row.componentId === component.componentId);
        if (!share) {
          return null;
        }
        return (
          <ReplaceAssigneeComponentRow
            key={component.componentId}
            component={component}
            share={share}
            outgoingName={outgoingName}
            incomingName={incomingName}
            fromEmployeeId={fromEmployeeId}
            disabled={disabled}
            onOutgoingPercentChange={(value) =>
              onSharesChange(
                updateSharePercent(shares, component.componentId, 'outgoingPercent', value),
              )
            }
            onIncomingPercentChange={(value) =>
              onSharesChange(
                updateSharePercent(shares, component.componentId, 'incomingPercent', value),
              )
            }
          />
        );
      })}
    </div>
  );
}
