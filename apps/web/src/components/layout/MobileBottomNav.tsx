'use client';

import { MobileWorkspaceDock } from './MobileWorkspaceDock';

interface MobileBottomNavProps {
  menuOpen?: boolean;
  onMoreClick: () => void;
}

/** Mobile workspace dock — Menu, Search, New, place switcher, Settings. */
export function MobileBottomNav({ menuOpen = false, onMoreClick }: MobileBottomNavProps) {
  return <MobileWorkspaceDock menuOpen={menuOpen} onMoreClick={onMoreClick} />;
}
