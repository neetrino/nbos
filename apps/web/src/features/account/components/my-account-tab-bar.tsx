'use client';

import { User, Wallet } from 'lucide-react';
import {
  PAGE_TAB_BAR_WRAPPER_CLASS,
  detailSheetTabButtonClass,
} from '@/components/shared/detail-sheet-classes';
import { useMyAccountSheet } from '@/features/account/components/my-account-sheet-provider';

/** Wallet page shortcuts — profile opens the global employee sheet. */
export function MyAccountTabBar() {
  const { openMyAccountSheet } = useMyAccountSheet();

  return (
    <div className={PAGE_TAB_BAR_WRAPPER_CLASS}>
      <button
        type="button"
        className={detailSheetTabButtonClass(false)}
        onClick={() => void openMyAccountSheet()}
      >
        <User size={16} aria-hidden />
        Profile
      </button>
      <span className={detailSheetTabButtonClass(true)}>
        <Wallet size={16} aria-hidden />
        Wallet
      </span>
    </div>
  );
}
