'use client';

import { useRef, type ComponentProps, type Ref, type RefObject } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { useTranslations } from 'next-intl';
import { BottomSheetSwipeHandle } from '@/components/layout/BottomSheetSwipeHandle';
import { useBottomSheetSwipeToClose } from '@/components/layout/use-bottom-sheet-swipe-to-close';

/** Swipe handle for mobile dialogs — dismisses via a hidden Dialog close control. */
export function DialogMobileSwipeChrome() {
  const closeRef = useRef<HTMLButtonElement>(null);
  const handleRef = useBottomSheetSwipeToClose(true, () => {
    closeRef.current?.click();
  });

  return (
    <>
      <BottomSheetSwipeHandle handleRef={handleRef} />
      <DialogPrimitive.Close
        render={(props) => <HiddenDialogSwipeClose closeRef={closeRef} {...props} />}
      />
    </>
  );
}

function HiddenDialogSwipeClose({
  closeRef,
  ref,
  ...props
}: ComponentProps<'button'> & { closeRef: RefObject<HTMLButtonElement | null> }) {
  const t = useTranslations('common');
  return (
    <button
      {...props}
      type="button"
      className="sr-only"
      ref={(node) => assignButtonRefs(node, closeRef, ref)}
    >
      {t('close')}
    </button>
  );
}

function assignButtonRefs(
  node: HTMLButtonElement | null,
  closeRef: RefObject<HTMLButtonElement | null>,
  ref: Ref<HTMLButtonElement> | undefined,
): void {
  closeRef.current = node;
  if (typeof ref === 'function') {
    ref(node);
    return;
  }
  if (ref) ref.current = node;
}
