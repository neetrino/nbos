'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE } from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';

export interface DetailSheetFormFooterProps {
  /**
   * Context gate (correct tab, form loaded, permissions).
   * Footer is also hidden when there is nothing to save (`!dirty && !saving`).
   */
  visible: boolean;
  /** Unsaved changes — footer appears only when true (or while `saving`). */
  dirty: boolean;
  saving: boolean;
  errorMessage?: string | null;
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  className?: string;
}

export function DetailSheetFormFooter({
  visible,
  dirty,
  saving,
  errorMessage,
  onSave,
  onCancel,
  saveLabel,
  cancelLabel,
  className,
}: DetailSheetFormFooterProps) {
  const t = useTranslations('common');
  if (!visible || (!dirty && !saving)) {
    return null;
  }

  return (
    <div
      className={cn(
        'border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 shrink-0 border-t px-6 py-4 backdrop-blur-sm',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3">
        {errorMessage ? (
          <p className="text-destructive max-w-lg text-center text-sm" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            type="button"
            size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
            disabled={saving}
            onClick={onSave}
          >
            {saving ? t('saving') : (saveLabel ?? t('save'))}
          </Button>
          <Button
            type="button"
            variant="outline"
            size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
            disabled={saving}
            onClick={onCancel}
          >
            {cancelLabel ?? t('cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}
