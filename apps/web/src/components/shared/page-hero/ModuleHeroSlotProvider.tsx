'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { PageHero } from './PageHero';

export type ModuleHeroSlots = {
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
  className?: string;
}

/** Module layout shell: one PageHero (title + route tabs) + per-page slots from children. */
export function ModuleHeroSlotProvider({
  title,
  tabs,
  children,
  className,
}: ModuleHeroSlotProviderProps) {
  const [slots, setSlotsState] = useState<ModuleHeroSlots>(EMPTY_SLOTS);

  const setSlots = useCallback((next: ModuleHeroSlots) => {
    setSlotsState((prev) => {
      if (
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

  return (
    <ModuleHeroSlotContext.Provider value={{ setSlots }}>
      <div className={className ?? 'flex h-full min-h-0 flex-col gap-5'}>
        <PageHero
          title={title}
          tabs={tabs}
          search={slots.search}
          viewMode={slots.viewMode}
          trailing={slots.trailing}
          secondaryTabs={slots.secondaryTabs}
        />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </ModuleHeroSlotContext.Provider>
  );
}

/**
 * Register list-page tools into the parent module PageHero (search, view, actions).
 * Memoize the `slots` object in the caller to avoid redundant updates.
 */
export function useModuleHeroSlots(slots: ModuleHeroSlots): void {
  const ctx = useContext(ModuleHeroSlotContext);
  if (!ctx) {
    throw new Error('useModuleHeroSlots must be used within ModuleHeroSlotProvider');
  }

  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  useLayoutEffect(() => {
    ctx.setSlots(slotsRef.current);
  });

  useLayoutEffect(() => {
    return () => ctx.setSlots(EMPTY_SLOTS);
  }, [ctx]);
}
