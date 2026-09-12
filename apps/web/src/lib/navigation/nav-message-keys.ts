import enNavigation from '@/messages/en/navigation.json';
import type { MessageLeafKeys } from '@/i18n/message-leaf-keys';
import type { SidebarModuleKey } from '@nbos/shared/constants';
import { NAV_MODULE_DEFINITIONS } from './nav-config';
import { resolveSidebarModuleKeyFromPathname } from './nav-route-utils';

/** Dotted keys of `messages/{locale}/navigation.json`. */
export type NavigationMessageKey = MessageLeafKeys<typeof enNavigation>;

export type NavigationTranslator = (key: NavigationMessageKey) => string;

/** Stable next-intl key for the sidebar Tasks quick-create affordance. */
export const NAV_QUICK_ACTION_CREATE_TASK_LABEL_KEY =
  'quickAction.createTask' satisfies NavigationMessageKey;

function getMessageByDotPath(messages: Record<string, unknown>, path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages);

  return typeof value === 'string' ? value : undefined;
}

/** English catalog lookup for matching page-provided default module titles. */
export function getEnglishNavLabel(labelKey: NavigationMessageKey): string | undefined {
  return getMessageByDotPath(enNavigation as Record<string, unknown>, labelKey);
}

export function getNavModuleDefinition(moduleKey: SidebarModuleKey) {
  return NAV_MODULE_DEFINITIONS.find((item) => item.key === moduleKey);
}

/**
 * Translates default module titles registered by pages; leaves custom entity titles unchanged.
 */
export function resolveLocalizedModuleTitle(
  moduleTitle: string | null,
  pathname: string,
  translate: NavigationTranslator,
): string | null {
  if (!moduleTitle) {
    return null;
  }

  const moduleKey = resolveSidebarModuleKeyFromPathname(pathname);
  if (!moduleKey) {
    return moduleTitle;
  }

  const definition = getNavModuleDefinition(moduleKey);
  if (!definition) {
    return moduleTitle;
  }

  const englishDefault = getEnglishNavLabel(definition.label);
  if (englishDefault && moduleTitle === englishDefault) {
    return translate(definition.label);
  }

  return moduleTitle;
}
