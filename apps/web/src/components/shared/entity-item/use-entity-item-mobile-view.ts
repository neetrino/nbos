import { useMobilePreferredView } from '@/hooks/use-mobile-preferred-view';
import type { EntityItemVariant } from './entity-item.types';

/** Desktop keeps the saved entity-item view; mobile always uses card (board) layout. */
export function useEntityItemMobileView(desktopView: EntityItemVariant): EntityItemVariant {
  return useMobilePreferredView(desktopView, 'compact-card');
}
