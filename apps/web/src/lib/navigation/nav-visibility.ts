import {
  isNavChildGroup,
  isNavChildLink,
  type NavChildDefinition,
  type NavModuleDefinition,
  type PermissionRequirement,
} from './nav-config';
import { pruneNavChildGroups } from './prune-nav-child-groups';

export function hasNavPermission(
  permission: PermissionRequirement | undefined,
  can: (action: string, module: string) => boolean,
): boolean {
  if (!permission) return true;
  return can(permission.action, permission.module);
}

function resolveChildPermission(
  child: NavChildDefinition,
  parentPermission: PermissionRequirement | undefined,
): PermissionRequirement | undefined {
  if (isNavChildGroup(child)) return undefined;
  return child.permission ?? parentPermission;
}

function isChildVisible(
  child: NavChildDefinition,
  parentPermission: PermissionRequirement | undefined,
  can: (action: string, module: string) => boolean,
): boolean {
  if (isNavChildGroup(child)) return true;
  return hasNavPermission(resolveChildPermission(child, parentPermission), can);
}

export function getVisibleNavModules(
  can: (action: string, module: string) => boolean,
  isLoading: boolean,
  definitions: NavModuleDefinition[],
): NavModuleDefinition[] {
  if (isLoading) {
    return definitions.filter((item) => item.permission === undefined);
  }

  return definitions.reduce<NavModuleDefinition[]>((items, item) => {
    const visibleChildren = item.children?.filter((child) =>
      isChildVisible(child, item.permission, can),
    );
    const prunedChildren =
      visibleChildren && visibleChildren.length > 0
        ? pruneNavChildGroups(visibleChildren)
        : undefined;
    const itemAllowed = hasNavPermission(item.permission, can);
    const visibleLinks = prunedChildren?.filter(isNavChildLink) ?? [];
    const hasVisibleChildren = visibleLinks.length > 0;
    const hasChildrenWithoutOwnPermission =
      item.children !== undefined && item.permission === undefined;

    if (!itemAllowed && !hasVisibleChildren) {
      return items;
    }

    if (hasChildrenWithoutOwnPermission && !hasVisibleChildren) {
      return items;
    }

    items.push({ ...item, children: hasVisibleChildren ? prunedChildren : undefined });
    return items;
  }, []);
}
