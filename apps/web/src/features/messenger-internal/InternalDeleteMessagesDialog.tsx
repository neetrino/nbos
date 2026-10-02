'use client';

import { useSheetDialogFade } from './use-sheet-dialog-fade';

const FADE = 'transition-[opacity,transform] duration-[240ms] ease-out';

export function InternalDeleteMessagesDialog({
  open,
  count,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  count: number;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}) {
  const { mounted, visible } = useSheetDialogFade(open);
  if (!mounted) return null;
  const single = count === 1;
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 ${FADE} ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onMouseDown={() => onOpenChange(false)}
    >
      <div
        className={`bg-card text-card-foreground w-full max-w-[20rem] overflow-hidden rounded-2xl shadow-[var(--shadow-panel)] ${FADE} ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-foreground text-base font-semibold">
            {single ? 'Delete message?' : `Delete ${count} messages?`}
          </h3>
          <p className="text-muted-foreground mt-2 text-sm leading-5">
            {single
              ? 'This message will be removed from the chat.'
              : 'These messages will be removed from the chat.'}
          </p>
          {errorMessage ? (
            <p className="mt-2 text-sm text-[#dc2626]" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>
        <div className="border-border flex border-t">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:bg-muted flex-1 px-4 py-3 text-sm font-medium disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void onConfirm()}
            className="text-destructive hover:bg-destructive/10 border-border flex-1 border-l px-4 py-3 text-sm font-semibold disabled:opacity-40"
          >
            {isSubmitting ? 'Deleting…' : single ? 'Delete' : `Delete ${count}`}
          </button>
        </div>
      </div>
    </div>
  );
}
