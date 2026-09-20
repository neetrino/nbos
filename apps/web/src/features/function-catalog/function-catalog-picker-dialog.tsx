'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getApiErrorMessage } from '@/lib/api-errors';
import { addFeatureErrorCode, addSelectedCatalogFunctions } from './function-catalog-add';
import { FunctionCatalogBrowser } from './function-catalog-browser';
import {
  FUNCTION_CATALOG_PICKER_BODY_CLASS,
  FUNCTION_CATALOG_PICKER_DIALOG_CLASS,
  REASON_FIELD_ID,
} from './function-catalog.constants';
import { addFeatureMessageKey, canConfirmSelection } from './function-catalog-select';
import { useFunctionCatalogPicker } from './use-function-catalog-picker';

export function FunctionCatalogPickerDialog({
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={FUNCTION_CATALOG_PICKER_DIALOG_CLASS}
        forceNestedBackdrop
        mobileBodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        {open ? (
          <PickerSession
            configurationId={configurationId}
            alreadyAddedIds={alreadyAddedIds}
            onAdded={onAdded}
            onClose={() => onOpenChange(false)}
            expectedRevision={expectedRevision}
            requireReason={requireReason}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
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
  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('addFunctionTitle')}</DialogTitle>
        <DialogDescription>{t('addFunctionDescription')}</DialogDescription>
      </DialogHeader>
      <div className={FUNCTION_CATALOG_PICKER_BODY_CLASS}>
        <FunctionCatalogBrowser
          items={picker.catalog.items}
          loading={picker.catalog.loading}
          error={picker.catalog.error}
          onRetry={() => void picker.catalog.reload()}
          search={picker.search}
          onSearchChange={picker.setSearch}
          selectedCategory={picker.selectedCategory}
          onSelectCategory={picker.selectCategory}
          unitsByFunctionId={picker.catalog.unitsByFunctionId}
          salePriceByFunctionId={picker.catalog.salePriceByFunctionId}
          mode={{
            kind: 'pick',
            selectedIds: picker.selectedSet,
            alreadyAddedIds,
            onToggle: picker.toggle,
            gradationByFunctionId: picker.gradationByFunctionId,
            onSelectGradation: picker.selectGradation,
          }}
        />
      </div>
      {requireReason ? (
        <div className="space-y-1.5 px-1">
          <Label htmlFor={REASON_FIELD_ID}>{t('addFunctionReasonLabel')}</Label>
          <Input
            id={REASON_FIELD_ID}
            value={picker.reason}
            onChange={(event) => picker.setReason(event.target.value)}
            placeholder={t('addFunctionReasonPlaceholder')}
          />
          <p className="text-muted-foreground text-xs">{t('addFunctionReasonHint')}</p>
        </div>
      ) : null}
      <PickerFooter
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
    </>
  );
}

function PickerFooter({
  canConfirm,
  saving,
  cancelLabel,
  confirmLabel,
  confirmingLabel,
  selectedCountLabel,
  onCancel,
  onConfirm,
}: {
  canConfirm: boolean;
  saving: boolean;
  cancelLabel: string;
  confirmLabel: string;
  confirmingLabel: string;
  selectedCountLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <DialogFooter className="gap-2 sm:justify-between">
      <p className="text-muted-foreground text-sm">{selectedCountLabel}</p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          {cancelLabel}
        </Button>
        <Button type="button" onClick={onConfirm} disabled={!canConfirm}>
          {saving ? confirmingLabel : confirmLabel}
        </Button>
      </div>
    </DialogFooter>
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
