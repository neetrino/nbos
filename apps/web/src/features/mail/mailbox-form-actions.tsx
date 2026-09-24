import { Button } from '@/components/ui/button';
import { DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE } from '@/components/shared/detail-sheet-classes';

interface MailboxFormActionsProps {
  primaryLabel: string;
  cancelLabel: string;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}

export function MailboxFormActions({
  primaryLabel,
  cancelLabel,
  submitting,
  onCancel,
  onSubmit,
  onDelete,
}: MailboxFormActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {onDelete ? (
        <Button
          type="button"
          variant="destructive"
          size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
          onClick={onDelete}
          disabled={submitting}
        >
          Delete
        </Button>
      ) : null}
      <div className="ml-auto flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
          onClick={onCancel}
          disabled={submitting}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
          onClick={onSubmit}
          disabled={submitting}
        >
          {primaryLabel}
        </Button>
      </div>
    </div>
  );
}
