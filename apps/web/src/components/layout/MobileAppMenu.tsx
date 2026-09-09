'use client';

import { useRouter } from 'next/navigation';
import { Settings, UserCircle2, X } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useMyAccountSheet } from '@/features/account/components/my-account-sheet-provider';
import { cn } from '@/lib/utils';
import type { NavModuleDefinition } from '@/lib/navigation/nav-config';
import { MobileAppMenuTile } from './MobileAppMenuTile';
import {
  MOBILE_APP_MENU_GRID_CLASS,
  MOBILE_APP_MENU_HANDLE_CLASS,
  MOBILE_APP_MENU_SHEET_CLASS,
  MOBILE_APP_MENU_TILE_CLASS,
} from './mobile-app-menu-constants';

const MOBILE_APP_MENU_FOOTER_ICON_SIZE_PX = 20;

interface MobileAppMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: NavModuleDefinition[];
}

export function MobileAppMenu({ open, onOpenChange, items }: MobileAppMenuProps) {
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className={MOBILE_APP_MENU_SHEET_CLASS}>
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Open a module. Items are arranged as large buttons.
        </SheetDescription>
        <div className="flex min-h-0 flex-1 flex-col">
          <span className={MOBILE_APP_MENU_HANDLE_CLASS} aria-hidden />
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <p className="text-foreground text-lg font-semibold tracking-tight">Menu</p>
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-9 items-center justify-center rounded-full"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">
            <div className={MOBILE_APP_MENU_GRID_CLASS}>
              {items.map((item) => (
                <MobileAppMenuTile key={item.key} item={item} onNavigate={close} />
              ))}
            </div>
            <MobileAppMenuAccountRow onClose={close} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileAppMenuAccountRow({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { openMyAccountSheet } = useMyAccountSheet();

  return (
    <div className={cn(MOBILE_APP_MENU_GRID_CLASS, 'mt-3')}>
      <button
        type="button"
        onClick={() => {
          onClose();
          router.push('/settings');
        }}
        className={MOBILE_APP_MENU_TILE_CLASS}
      >
        <Settings
          size={MOBILE_APP_MENU_FOOTER_ICON_SIZE_PX}
          className="text-zinc-600"
          aria-hidden
        />
        <span className="text-sm font-semibold tracking-tight">Settings</span>
      </button>
      <button
        type="button"
        onClick={() => {
          onClose();
          void openMyAccountSheet();
        }}
        className={MOBILE_APP_MENU_TILE_CLASS}
      >
        <UserCircle2
          size={MOBILE_APP_MENU_FOOTER_ICON_SIZE_PX}
          className="text-indigo-600"
          aria-hidden
        />
        <span className="text-sm font-semibold tracking-tight">My account</span>
      </button>
    </div>
  );
}
