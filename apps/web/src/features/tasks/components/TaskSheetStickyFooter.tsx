'use client';

import { Button } from '@/components/ui/button';

interface TaskSheetStickyFooterProps {
  visible: boolean;
  dirty: boolean;
  saving: boolean;
  errorMessage?: string | null;
  onSave: () => void;
  onSaveAndClose: () => void;
  onCancel: () => void;
}

export function TaskSheetStickyFooter({
  visible,
  dirty,
  saving,
  errorMessage,
  onSave,
  onSaveAndClose,
  onCancel,
}: TaskSheetStickyFooterProps) {
  if (!visible || (!dirty && !saving)) {
    return null;
  }

  return (
    <div className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/85 sticky bottom-0 z-20 shrink-0 border-t px-6 py-3 backdrop-blur-sm">
      <div className="flex flex-col gap-3">
        {errorMessage ? (
          <p className="text-destructive text-sm" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" disabled={!dirty || saving} onClick={onSave}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="secondary" disabled={saving} onClick={onSaveAndClose}>
            {saving ? 'Saving…' : 'Save & Close'}
          </Button>
          <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
