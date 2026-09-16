'use client';

import { Plus } from 'lucide-react';
import { FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { Button } from '@/components/ui/button';
import { useClientServicesT } from '@/features/finance/components/client-services/client-service-message-keys';
import {
  createDomainDraftRow,
  type DomainDraftRow,
  type DomainPurchaseDraft,
} from './domain-purchase-form';

interface DomainPurchaseDomainRowsProps {
  draft: DomainPurchaseDraft;
  requireClientAmount?: boolean;
  onChange: (draft: DomainPurchaseDraft) => void;
}

export function DomainPurchaseDomainRows({
  draft,
  requireClientAmount = false,
  onChange,
}: DomainPurchaseDomainRowsProps) {
  const t = useClientServicesT();
  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-xs font-medium">{t('domainPurchase.domains')}</p>
      {draft.domains.map((row) => (
        <DomainPurchaseDomainRow
          key={row.key}
          row={row}
          mode={draft.connectionMode}
          requireClientAmount={requireClientAmount}
          onPatch={(partial) => onChange(patchDomain(draft, row.key, partial))}
        />
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => onChange({ ...draft, domains: [...draft.domains, createDomainDraftRow()] })}
      >
        <Plus size={14} />
        {t('domainPurchase.addDomain')}
      </Button>
    </div>
  );
}

function DomainPurchaseDomainRow({
  row,
  mode,
  requireClientAmount,
  onPatch,
}: {
  row: DomainDraftRow;
  mode: DomainPurchaseDraft['connectionMode'];
  requireClientAmount: boolean;
  onPatch: (partial: Partial<DomainDraftRow>) => void;
}) {
  const t = useClientServicesT();
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-2.5">
      <InlineField
        variant="controlled"
        label={t('domainPurchase.domainName')}
        value={row.domainName}
        onValueChange={(domainName) => onPatch({ domainName })}
      />
      {mode === 'PURCHASE' ? (
        <PurchaseCostFields row={row} requireClientAmount={requireClientAmount} onPatch={onPatch} />
      ) : null}
    </div>
  );
}

function PurchaseCostFields({
  row,
  requireClientAmount,
  onPatch,
}: {
  row: DomainDraftRow;
  requireClientAmount: boolean;
  onPatch: (partial: Partial<DomainDraftRow>) => void;
}) {
  const t = useClientServicesT();
  return (
    <>
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('domainPurchase.provider')}
          value={row.provider}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(provider) => onPatch({ provider })}
        />
        <InlineField
          variant="controlled"
          label={
            requireClientAmount ? t('domainPurchase.clientCharge') : t('domainPurchase.ourCost')
          }
          type="money"
          value={requireClientAmount ? row.clientCharge : row.ourCost}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(value) =>
            onPatch(requireClientAmount ? { clientCharge: value } : { ourCost: value })
          }
        />
      </FormFieldRow>
      {requireClientAmount ? null : (
        <InlineField
          variant="controlled"
          label={t('domainPurchase.clientCharge')}
          type="money"
          value={row.clientCharge}
          onValueChange={(clientCharge) => onPatch({ clientCharge })}
        />
      )}
    </>
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
