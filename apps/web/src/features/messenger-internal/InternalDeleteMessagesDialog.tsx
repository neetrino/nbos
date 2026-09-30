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
        className={`w-full max-w-[20rem] overflow-hidden rounded-2xl bg-white shadow-[0_16px_48px_rgba(15,23,42,0.22)] ${FADE} ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-[#0f172a]">
            {single ? 'Delete message?' : `Delete ${count} messages?`}
          </h3>
          <p className="mt-2 text-sm leading-5 text-[#64748b]">
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
        <div className="flex border-t border-[#e2e8f0]">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            className="flex-1 px-4 py-3 text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void onConfirm()}
            className="flex-1 border-l border-[#e2e8f0] px-4 py-3 text-sm font-semibold text-[#dc2626] hover:bg-[#fef2f2] disabled:opacity-40"
          >
            {isSubmitting ? 'Deleting…' : single ? 'Delete' : `Delete ${count}`}
          </button>
        </div>
      </div>
    </div>
  );
}
