'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  MODULE_SHELL_BRIDGE_HERO_GAP,
  MODULE_SHELL_BRIDGE_HERO_PULL,
} from '@/components/shared/module-shell/module-shell-surface';
import { cn } from '@/lib/utils';
import { PageHero } from './PageHero';

export type ModuleHeroSlots = {
  /** Replaces layout-level zone tabs (e.g. payroll run detail header). */
  tabs?: ReactNode;
  search?: ReactNode;
  viewMode?: ReactNode;
  trailing?: ReactNode;
  secondaryTabs?: ReactNode;
};

const EMPTY_SLOTS: ModuleHeroSlots = {};

type ModuleHeroSlotContextValue = {
  setSlots: (slots: ModuleHeroSlots) => void;
};

const ModuleHeroSlotContext = createContext<ModuleHeroSlotContextValue | null>(null);

export interface ModuleHeroSlotProviderProps {
  title: string;
  /** Section pills (CRM-style); omit on overview routes. */
  tabs?: ReactNode;
  children: ReactNode;
  /** Gap under header tab connector; PageHero stays a standard rounded card (Finance). */
  linkToHeaderTab?: boolean;
  className?: string;
}

/** Module layout shell: one PageHero (title + route tabs) + per-page slots from children. */
export function ModuleHeroSlotProvider({
  title,
  tabs,
  children,
  linkToHeaderTab = false,
  className,
}: ModuleHeroSlotProviderProps) {
  const [slots, setSlotsState] = useState<ModuleHeroSlots>(EMPTY_SLOTS);

  const setSlots = useCallback((next: ModuleHeroSlots) => {
    setSlotsState((prev) => {
      if (
        prev.tabs === next.tabs &&
        prev.search === next.search &&
        prev.viewMode === next.viewMode &&
        prev.trailing === next.trailing &&
        prev.secondaryTabs === next.secondaryTabs
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const contextValue = useMemo(() => ({ setSlots }), [setSlots]);

  return (
    <ModuleHeroSlotContext.Provider value={contextValue}>
      <div className={className ?? 'flex h-full min-h-0 flex-col gap-5'}>
        <div
          className={cn(
            'shrink-0',
            linkToHeaderTab && [MODULE_SHELL_BRIDGE_HERO_PULL, MODULE_SHELL_BRIDGE_HERO_GAP],
          )}
        >
          <PageHero
            title={title}
            tabs={slots.tabs ?? tabs}
            search={slots.search}
            viewMode={slots.viewMode}
            trailing={slots.trailing}
            secondaryTabs={slots.secondaryTabs}
            className={linkToHeaderTab ? '!mt-0' : undefined}
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </ModuleHeroSlotContext.Provider>
  );
}

/**
 * Register list-page tools into the parent module PageHero (search, view, trailing).
 * Memoize the `slots` object in the caller to avoid redundant updates.
 */
export function useModuleHeroSlots(slots: ModuleHeroSlots): void {
  const ctx = useContext(ModuleHeroSlotContext);
  if (!ctx) {
    throw new Error('useModuleHeroSlots must be used within ModuleHeroSlotProvider');
  }

  const { setSlots } = ctx;

  useLayoutEffect(() => {
    setSlots(slots);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller memoizes slots; track slot fields only
  }, [setSlots, slots.tabs, slots.search, slots.viewMode, slots.trailing, slots.secondaryTabs]);

  useLayoutEffect(() => {
    return () => setSlots(EMPTY_SLOTS);
  }, [setSlots]);
}
