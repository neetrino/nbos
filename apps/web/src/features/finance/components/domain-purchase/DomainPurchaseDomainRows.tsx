'use client';

import { Trash2 } from 'lucide-react';
import { AmdCurrencyIcon, FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { Button } from '@/components/ui/button';
import { ClientServiceProviderField } from '@/features/finance/components/client-services/ClientServiceProviderField';
import { useClientServicesT } from '@/features/finance/components/client-services/client-service-message-keys';
import {
  createDomainDraftRow,
  removeDomainDraftRow,
  type DomainDraftRow,
  type DomainPurchaseDraft,
} from './domain-purchase-form';

const DOMAIN_ROW_STACK_CLASS = 'flex flex-col gap-3';
const DOMAIN_ROW_DIVIDER_CLASS = `${DOMAIN_ROW_STACK_CLASS} border-border border-t pt-3`;

interface DomainPurchaseDomainRowsProps {
  draft: DomainPurchaseDraft;
  allowAdd?: boolean;
  onChange: (draft: DomainPurchaseDraft) => void;
}

export function DomainPurchaseDomainRows({
  draft,
  allowAdd = true,
  onChange,
}: DomainPurchaseDomainRowsProps) {
  return (
    <div className="flex flex-col gap-3">
      {draft.domains.map((row, index) => (
        <DomainPurchaseDomainRow
          key={row.key}
          row={row}
          index={index}
          showIndex={draft.domains.length > 1}
          mode={draft.connectionMode}
          canRemove={draft.domains.length > 1}
          canAdd={allowAdd && index === draft.domains.length - 1}
          onAdd={() => onChange({ ...draft, domains: [...draft.domains, createDomainDraftRow()] })}
          onRemove={() => onChange(removeDomainDraftRow(draft, row.key))}
          onPatch={(partial) => onChange(patchDomain(draft, row.key, partial))}
        />
      ))}
    </div>
  );
}

function DomainPurchaseDomainRow({
  row,
  index,
  showIndex,
  mode,
  canRemove,
  canAdd,
  onAdd,
  onRemove,
  onPatch,
}: {
  row: DomainDraftRow;
  index: number;
  showIndex: boolean;
  mode: DomainPurchaseDraft['connectionMode'];
  canRemove: boolean;
  canAdd: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onPatch: (partial: Partial<DomainDraftRow>) => void;
}) {
  const t = useClientServicesT();
  const nameLabel = showIndex
    ? t('domainPurchase.domainIndexed', { n: index + 1 })
    : t('domainPurchase.domainName');
  return (
    <div className={index > 0 ? DOMAIN_ROW_DIVIDER_CLASS : DOMAIN_ROW_STACK_CLASS}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <DomainPurchaseNameAmountFields
            row={row}
            mode={mode}
            nameLabel={nameLabel}
            canAdd={canAdd}
            onAdd={onAdd}
            onPatch={onPatch}
          />
        </div>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="mt-1 shrink-0"
            aria-label={t('domainPurchase.removeDomain')}
            onClick={onRemove}
          >
            <Trash2 size={14} />
          </Button>
        ) : null}
      </div>
      {mode === 'PURCHASE' ? (
        <ClientServiceProviderField
          providerName={row.provider}
          onProviderChange={(provider) => onPatch({ provider })}
        />
      ) : null}
    </div>
  );
}

function DomainPurchaseNameAmountFields({
  row,
  mode,
  nameLabel,
  canAdd,
  onAdd,
  onPatch,
}: {
  row: DomainDraftRow;
  mode: DomainPurchaseDraft['connectionMode'];
  nameLabel: string;
  canAdd: boolean;
  onAdd: () => void;
  onPatch: (partial: Partial<DomainDraftRow>) => void;
}) {
  const t = useClientServicesT();
  const addProps = canAdd ? { onAdd, addAriaLabel: t('domainPurchase.addDomain') } : {};
  if (mode !== 'PURCHASE') {
    return (
      <InlineField
        variant="controlled"
        label={nameLabel}
        value={row.domainName}
        onValueChange={(domainName) => onPatch({ domainName })}
        {...addProps}
      />
    );
  }
  return (
    <FormFieldRow layout="wideStart">
      <InlineField
        variant="controlled"
        label={nameLabel}
        className={FORM_FIELD_CELL_CLASS}
        value={row.domainName}
        onValueChange={(domainName) => onPatch({ domainName })}
        {...addProps}
      />
      <InlineField
        variant="controlled"
        label={t('domainPurchase.costAmd')}
        type="money"
        className={FORM_FIELD_CELL_CLASS}
        value={row.costAmd}
        icon={<AmdCurrencyIcon className="text-muted-foreground/70" />}
        onValueChange={(costAmd) => onPatch({ costAmd })}
      />
    </FormFieldRow>
  );
}

function patchDomain(
  draft: DomainPurchaseDraft,
  key: string,
  partial: Partial<DomainDraftRow>,
): DomainPurchaseDraft {
  return {
    ...draft,
    domains: draft.domains.map((item) => (item.key === key ? { ...item, ...partial } : item)),
  };
}
