import { type Ref } from 'react';
import {
  MOBILE_APP_MENU_HANDLE_CLASS,
  MOBILE_APP_MENU_HANDLE_HIT_CLASS,
} from './mobile-app-menu-constants';

interface BottomSheetSwipeHandleProps {
  handleRef: Ref<HTMLDivElement>;
}

export function BottomSheetSwipeHandle({ handleRef }: BottomSheetSwipeHandleProps) {
  return (
    <div
      ref={handleRef}
      data-nbos-sheet-swipe-handle=""
      className={MOBILE_APP_MENU_HANDLE_HIT_CLASS}
    >
      <span className={MOBILE_APP_MENU_HANDLE_CLASS} aria-hidden />
    </div>
  );
}
