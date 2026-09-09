import { useCallback, useRef, useSyncExternalStore, type RefObject } from 'react';
import type { MobileDockCreateAction } from './mobile-module-dock-types';
import { resolvePageHeroCreateButton } from './resolve-page-hero-create-button';

type HeroCreateSnapshot = {
  present: boolean;
  disabled: boolean;
};

const EMPTY_CREATE_SNAPSHOT: HeroCreateSnapshot = {
  present: false,
  disabled: false,
};

const PAGE_HERO_CREATE_OBSERVER_OPTIONS: MutationObserverInit = {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: ['aria-label', 'data-mobile-dock-create', 'disabled'],
};

function subscribeToPageHeroCreate(onStoreChange: () => void): () => void {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, PAGE_HERO_CREATE_OBSERVER_OPTIONS);
  return () => observer.disconnect();
}

function readHeroCreateSnapshot(host: HTMLElement | null): HeroCreateSnapshot {
  const button = host ? resolvePageHeroCreateButton(host) : null;
  if (!button) return EMPTY_CREATE_SNAPSHOT;
  return { present: true, disabled: button.disabled };
}

function sameHeroCreateSnapshot(left: HeroCreateSnapshot, right: HeroCreateSnapshot): boolean {
  return left.present === right.present && left.disabled === right.disabled;
}

function getHeroCreateServerSnapshot(): HeroCreateSnapshot {
  return EMPTY_CREATE_SNAPSHOT;
}

function useInferredPageHeroCreate(
  hostRef: RefObject<HTMLElement | null>,
): MobileDockCreateAction | undefined {
  const cachedRef = useRef<HeroCreateSnapshot>(EMPTY_CREATE_SNAPSHOT);
  const getSnapshot = useCallback(() => {
    const next = readHeroCreateSnapshot(hostRef.current);
    if (sameHeroCreateSnapshot(cachedRef.current, next)) return cachedRef.current;
    cachedRef.current = next;
    return next;
  }, [hostRef]);
  const snapshot = useSyncExternalStore(
    subscribeToPageHeroCreate,
    getSnapshot,
    getHeroCreateServerSnapshot,
  );
  if (!snapshot.present) return undefined;
  return {
    disabled: snapshot.disabled,
    onSelect: () => {
      const button = hostRef.current ? resolvePageHeroCreateButton(hostRef.current) : null;
      button?.click();
    },
  };
}

export function usePageHeroDockCreate(
  hostRef: RefObject<HTMLElement | null>,
  explicitCreate?: MobileDockCreateAction,
): MobileDockCreateAction | undefined {
  const inferred = useInferredPageHeroCreate(hostRef);
  return explicitCreate ?? inferred;
}
