'use client';

import { useTranslations } from 'next-intl';
import { DELIVERY_SHARE_PERCENT_TOTAL } from '@nbos/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ReplacementPlanComponentDto } from '@/lib/api/delivery-configurations';
import {
  COMPONENT_CARD_CLASS,
  HOLDER_PERCENT_ROW_CLASS,
  SHARE_VALIDATION_MESSAGE_KEYS,
} from './replace-assignee.constants';
import { findOutgoingHolder, shareValidationError, type ShareDraft } from './replace-assignee-form';

type ComponentRowProps = {
  component: ReplacementPlanComponentDto;
  share: ShareDraft;
  outgoingName: string;
  incomingName: string;
  fromEmployeeId: string;
  disabled: boolean;
  onOutgoingPercentChange: (value: string) => void;
  onIncomingPercentChange: (value: string) => void;
};

export function ReplaceAssigneeComponentRow({
  component,
  share,
  outgoingName,
  incomingName,
  fromEmployeeId,
  disabled,
  onOutgoingPercentChange,
  onIncomingPercentChange,
}: ComponentRowProps) {
  const t = useTranslations('hr.functionCatalog');
  const outgoingHolder = findOutgoingHolder(component, fromEmployeeId);
  const validation = shareValidationError(share);
  const outgoingInputId = `replace-outgoing-${component.componentId}`;
  const incomingInputId = `replace-incoming-${component.componentId}`;
  return (
    <div className={COMPONENT_CARD_CLASS}>
      <p className="text-foreground text-sm font-medium">{component.componentKey}</p>
      {outgoingHolder?.hasReleases ? (
        <p className="text-xs text-amber-700">{t('replaceAssignee.releasesHint')}</p>
      ) : null}
      <HolderPercentRow
        inputId={outgoingInputId}
        name={outgoingName}
        nameLabel={t('replaceAssignee.outgoing')}
        percentLabel={t('replaceAssignee.percentOutgoing')}
        value={share.outgoingPercent}
        disabled={disabled}
        onValueChange={onOutgoingPercentChange}
      />
      <HolderPercentRow
        inputId={incomingInputId}
        name={incomingName}
        nameLabel={t('replaceAssignee.incoming')}
        percentLabel={t('replaceAssignee.percentIncoming')}
        value={share.incomingPercent}
        disabled={disabled}
        onValueChange={onIncomingPercentChange}
      />
      {validation ? (
        <p className="text-destructive text-xs" role="status">
          {t(SHARE_VALIDATION_MESSAGE_KEYS[validation], { total: DELIVERY_SHARE_PERCENT_TOTAL })}
        </p>
      ) : null}
    </div>
  );
}

function HolderPercentRow({
  inputId,
  name,
  nameLabel,
  percentLabel,
  value,
  disabled,
  onValueChange,
}: {
  inputId: string;
  name: string;
  nameLabel: string;
  percentLabel: string;
  value: string;
  disabled: boolean;
  onValueChange: (value: string) => void;
}) {
  return (
    <div className={HOLDER_PERCENT_ROW_CLASS}>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{nameLabel}</p>
        <p className="text-foreground truncate text-sm">{name}</p>
      </div>
      <div className="space-y-1">
        <Label htmlFor={inputId} className="text-muted-foreground text-xs">
          {percentLabel}
        </Label>
        <Input
          id={inputId}
          value={value}
          disabled={disabled}
          inputMode="decimal"
          autoComplete="off"
          onChange={(event) => onValueChange(event.target.value)}
        />
      </div>
    </div>
  );
}
