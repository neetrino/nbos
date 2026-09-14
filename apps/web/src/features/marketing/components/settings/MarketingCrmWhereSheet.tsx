'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { DetailSheetFormFooter, EntityDetailSheetContent, InlineField } from '@/components/shared';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';
import { toastApiError } from '@/lib/permissions';
import { marketingApi, type MarketingCrmWhereOption } from '@/lib/api/marketing';
import { getMarketingLabel } from '@/features/marketing/constants';

interface CrmWhereDraft {
  label: string;
  sortOrder: string;
  isActive: boolean;
}

interface MarketingCrmWhereSheetProps {
  row: MarketingCrmWhereOption | null;
  open: boolean;
  canEdit: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
}

function createDraft(row: MarketingCrmWhereOption): CrmWhereDraft {
  return {
    label: row.label,
    sortOrder: String(row.sortOrder),
    isActive: row.isActive,
  };
}

function isDraftDirty(draft: CrmWhereDraft, row: MarketingCrmWhereOption): boolean {
  const sortOrder = Number.parseInt(draft.sortOrder, 10) || 0;
  return (
    draft.label.trim() !== row.label ||
    sortOrder !== row.sortOrder ||
    draft.isActive !== row.isActive
  );
}

export function MarketingCrmWhereSheet({
  row,
  open,
  canEdit,
  onOpenChange,
  onSaved,
}: MarketingCrmWhereSheetProps) {
  const { persistedValue, onOpenChangeComplete } = useSheetPersistedValue(row);
  const hostMounted = useSheetHostMounted(open, persistedValue);

  if (!hostMounted || !persistedValue) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <EntityDetailSheetContent open={open} layout="auxiliary" forceNestedBackdrop>
        <MarketingCrmWhereSheetForm
          key={persistedValue.channel}
          row={persistedValue}
          canEdit={canEdit}
          onSaved={onSaved}
        />
      </EntityDetailSheetContent>
    </Sheet>
  );
}

function MarketingCrmWhereSheetForm({
  row,
  canEdit,
  onSaved,
}: {
  row: MarketingCrmWhereOption;
  canEdit: boolean;
  onSaved: () => Promise<void>;
}) {
  const t = useTranslations('marketing');
  const [draft, setDraft] = useState(() => createDraft(row));
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const channelLabel = getMarketingLabel('channels', row.channel, t);
  const disabled = !canEdit || saving;

  return (
    <>
      <div className="bg-background shrink-0 px-7 pt-5 pb-3 max-md:px-4">
        <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
          {draft.label || channelLabel}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">{t('settings.crmWhere.sheetHint')}</p>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <MarketingCrmWhereFields draft={draft} disabled={disabled} onDraftChange={setDraft} />
      </ScrollArea>
      <DetailSheetFormFooter
        visible={canEdit}
        dirty={isDraftDirty(draft, row)}
        saving={saving}
        errorMessage={errorMessage}
        onCancel={() => setDraft(createDraft(row))}
        onSave={() => {
          void saveCrmWhereRow({
            channel: row.channel,
            draft,
            setSaving,
            setErrorMessage,
            onSaved,
            successMessage: t('settings.sheet.updated'),
            fallbackError: t('settings.loadError'),
          });
        }}
      />
    </>
  );
}

function MarketingCrmWhereFields({
  draft,
  disabled,
  onDraftChange,
}: {
  draft: CrmWhereDraft;
  disabled: boolean;
  onDraftChange: (draft: CrmWhereDraft) => void;
}) {
  const t = useTranslations('marketing');
  return (
    <div className="space-y-4 px-7 py-5 max-md:px-4">
      <InlineField
        variant="controlled"
        label={t('settings.crmWhere.label')}
        value={draft.label}
        onValueChange={(label) => onDraftChange({ ...draft, label })}
        disabled={disabled}
      />
      <InlineField
        variant="controlled"
        type="number"
        label={t('settings.crmWhere.sortOrder')}
        value={draft.sortOrder}
        onValueChange={(sortOrder) => onDraftChange({ ...draft, sortOrder })}
        disabled={disabled}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs font-medium">
          {t('settings.crmWhere.activeInCrm')}
        </p>
        <Switch
          checked={draft.isActive}
          disabled={disabled}
          onCheckedChange={(checked) => onDraftChange({ ...draft, isActive: Boolean(checked) })}
        />
      </div>
    </div>
  );
}

async function saveCrmWhereRow(params: {
  channel: string;
  draft: CrmWhereDraft;
  setSaving: (value: boolean) => void;
  setErrorMessage: (value: string | null) => void;
  onSaved: () => Promise<void>;
  successMessage: string;
  fallbackError: string;
}): Promise<void> {
  if (!params.draft.label.trim()) return;
  params.setSaving(true);
  params.setErrorMessage(null);
  try {
    await marketingApi.updateCrmWhereOption(params.channel, {
      label: params.draft.label.trim(),
      sortOrder: Number.parseInt(params.draft.sortOrder, 10) || 0,
      isActive: params.draft.isActive,
    });
    await params.onSaved();
    toast.success(params.successMessage);
  } catch (caught) {
    toastApiError(caught, params.fallbackError);
    params.setErrorMessage(params.fallbackError);
  } finally {
    params.setSaving(false);
  }
}
