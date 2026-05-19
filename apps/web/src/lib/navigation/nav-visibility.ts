import type { NavModuleDefinition, PermissionRequirement } from './nav-config';

export function hasNavPermission(
  permission: PermissionRequirement | undefined,
  can: (action: string, module: string) => boolean,
): boolean {
  if (!permission) return true;
  return can(permission.action, permission.module);
}

export function getVisibleNavModules(
  can: (action: string, module: string) => boolean,
  isLoading: boolean,
  definitions: NavModuleDefinition[],
): NavModuleDefinition[] {
  if (isLoading) return definitions;

  return definitions.reduce<NavModuleDefinition[]>((items, item) => {
    const visibleChildren = item.children?.filter((child) =>
      hasNavPermission(child.permission, can),
    );
    const itemAllowed = hasNavPermission(item.permission, can);
    const hasVisibleChildren = visibleChildren !== undefined && visibleChildren.length > 0;
    const hasChildrenWithoutOwnPermission =
      item.children !== undefined && item.permission === undefined;

    if (!itemAllowed && !hasVisibleChildren) {
      return items;
    }

    if (hasChildrenWithoutOwnPermission && !hasVisibleChildren) {
      return items;
    }

    items.push({ ...item, children: hasVisibleChildren ? visibleChildren : undefined });
    return items;
  }, []);
}
