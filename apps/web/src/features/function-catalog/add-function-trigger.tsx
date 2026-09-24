'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { addFeatureErrorCode, addSelectedCatalogFunctions } from './function-catalog-add';
import { FunctionCatalogSheet } from './function-catalog-sheet';
import { REASON_FIELD_ID } from './function-catalog.constants';
import { addFeatureMessageKey, canConfirmSelection } from './function-catalog-select';
import { useFunctionCatalogPicker } from './use-function-catalog-picker';

export function AddFunctionTrigger({
  open,
  onOpenChange,
  configurationId,
  alreadyAddedIds,
  onAdded,
  expectedRevision,
  requireReason,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configurationId: string;
  alreadyAddedIds: ReadonlySet<string>;
  onAdded: () => void;
  expectedRevision: number;
  requireReason: boolean;
}) {
  return open ? (
    <PickerSession
      configurationId={configurationId}
      alreadyAddedIds={alreadyAddedIds}
      onAdded={onAdded}
      onClose={() => onOpenChange(false)}
      expectedRevision={expectedRevision}
      requireReason={requireReason}
    />
  ) : null;
}

function PickerSession({
  configurationId,
  alreadyAddedIds,
  onAdded,
  onClose,
  expectedRevision,
  requireReason,
}: {
  configurationId: string;
  alreadyAddedIds: ReadonlySet<string>;
  onAdded: () => void;
  onClose: () => void;
  expectedRevision: number;
  requireReason: boolean;
}) {
  const t = useTranslations('hr.functionCatalog');
  const tCommon = useTranslations('common');
  const picker = useFunctionCatalogPicker();
  const [open, setOpen] = useState(true);
  return (
    <FunctionCatalogSheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onClose();
      }}
      items={picker.catalog.items}
      loading={picker.catalog.loading}
      error={picker.catalog.error}
      onRetry={() => void picker.catalog.reload()}
      unitsByFunctionId={picker.catalog.unitsByFunctionId}
      salePriceByFunctionId={new Map()}
      mode={{
        kind: 'pick',
        selectedIds: picker.selectedSet,
        alreadyAddedIds,
        onToggle: picker.toggle,
        gradationByFunctionId: picker.gradationByFunctionId,
        onSelectGradation: picker.selectGradation,
      }}
      footer={
        <PickerFooter
          requireReason={requireReason}
          reason={picker.reason}
          onReasonChange={picker.setReason}
          canConfirm={canConfirmSelection({
            selectedCount: picker.selectedIds.length,
            requireReason,
            reason: picker.reason,
            saving: picker.saving,
          })}
          saving={picker.saving}
          cancelLabel={tCommon('cancel')}
          confirmLabel={t('addFunctionConfirm')}
          confirmingLabel={t('addFunctionConfirming')}
          selectedCountLabel={t('selectedCount', { count: picker.selectedIds.length })}
          reasonLabel={t('addFunctionReasonLabel')}
          reasonPlaceholder={t('addFunctionReasonPlaceholder')}
          reasonHint={t('addFunctionReasonHint')}
          onCancel={onClose}
          onConfirm={() =>
            void confirmSelection({
              configurationId,
              selectedIds: picker.selectedIds,
              gradationByFunctionId: picker.gradationByFunctionId,
              expectedRevision,
              reason: picker.reason.trim() || undefined,
              fallback: t('addFailed'),
              success: t('addedFunctions', { count: picker.selectedIds.length }),
              translate: (key) => t(key),
              setSaving: picker.setSaving,
              onAdded,
              onClose,
            })
          }
        />
      }
    />
  );
}

function PickerFooter({
  requireReason,
  reason,
  onReasonChange,
  canConfirm,
  saving,
  cancelLabel,
  confirmLabel,
  confirmingLabel,
  selectedCountLabel,
  reasonLabel,
  reasonPlaceholder,
  reasonHint,
  onCancel,
  onConfirm,
}: {
  requireReason: boolean;
  reason: string;
  onReasonChange: (value: string) => void;
  canConfirm: boolean;
  saving: boolean;
  cancelLabel: string;
  confirmLabel: string;
  confirmingLabel: string;
  selectedCountLabel: string;
  reasonLabel: string;
  reasonPlaceholder: string;
  reasonHint: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-3">
      {requireReason ? (
        <div className="space-y-1.5">
          <Label htmlFor={REASON_FIELD_ID}>{reasonLabel}</Label>
          <Input
            id={REASON_FIELD_ID}
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder={reasonPlaceholder}
          />
          <p className="text-muted-foreground text-xs">{reasonHint}</p>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">{selectedCountLabel}</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            {cancelLabel}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={!canConfirm}>
            {saving ? confirmingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

async function confirmSelection(input: {
  configurationId: string;
  selectedIds: readonly string[];
  gradationByFunctionId: Parameters<typeof addSelectedCatalogFunctions>[0]['gradationByFunctionId'];
  expectedRevision: number;
  reason?: string;
  fallback: string;
  success: string;
  translate: (key: NonNullable<ReturnType<typeof addFeatureMessageKey>>) => string;
  setSaving: (value: boolean) => void;
  onAdded: () => void;
  onClose: () => void;
}): Promise<void> {
  input.setSaving(true);
  try {
    const result = await addSelectedCatalogFunctions({
      configurationId: input.configurationId,
      functionIds: input.selectedIds,
      expectedRevision: input.expectedRevision,
      reason: input.reason,
      gradationByFunctionId: input.gradationByFunctionId,
    });
    if (result.addedIds.length > 0) input.onAdded();
    if (!result.error) {
      toast.success(input.success);
      input.onClose();
      return;
    }
    const key = addFeatureMessageKey(addFeatureErrorCode(result.error));
    toast.error(key ? input.translate(key) : getApiErrorMessage(result.error, input.fallback));
  } finally {
    input.setSaving(false);
  }
}
