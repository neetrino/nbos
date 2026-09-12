import type { NavigationMessageKey, NavigationTranslator } from '@/lib/navigation/nav-message-keys';
import type { MobileDockSwitcherGroup } from './mobile-module-dock-types';
import {
  MOBILE_DOCK_SWITCHER_GROUP_TITLE_KEYS,
  type MobileDockSwitcherGroupId,
} from './mobile-workspace-dock-constants';

function isSwitcherGroupId(id: string): id is MobileDockSwitcherGroupId {
  return id in MOBILE_DOCK_SWITCHER_GROUP_TITLE_KEYS;
}

export function resolveMobileDockGroupTitle(
  group: MobileDockSwitcherGroup,
  translate: NavigationTranslator,
): string {
  if (!isSwitcherGroupId(group.id)) {
    return group.title;
  }

  return translate(MOBILE_DOCK_SWITCHER_GROUP_TITLE_KEYS[group.id]);
}

export function resolveMobileDockSwitcherTitle(
  groups: MobileDockSwitcherGroup[],
  translate: NavigationTranslator,
): string {
  const goToKey = 'mobileDock.goTo' satisfies NavigationMessageKey;
  if (groups.length !== 1) {
    return translate(goToKey);
  }

  const first = groups[0];
  return first ? resolveMobileDockGroupTitle(first, translate) : translate(goToKey);
}
