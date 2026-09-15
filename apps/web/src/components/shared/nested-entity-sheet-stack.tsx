'use client';

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type NestedEntitySheetDispatch = {
  acquire: () => void;
  release: () => void;
};

const NestedEntitySheetCountContext = createContext(0);
const NestedEntitySheetDispatchContext = createContext<NestedEntitySheetDispatch | null>(null);
const RelationEntitySheetStackContext = createContext(false);

export function NestedEntitySheetPresenceProvider({ children }: { children: ReactNode }) {
  const [nestedOpenCount, setNestedOpenCount] = useState(0);
  const dispatch = useMemo<NestedEntitySheetDispatch>(
    () => ({
      acquire: () => setNestedOpenCount((count) => count + 1),
      release: () => setNestedOpenCount((count) => Math.max(0, count - 1)),
    }),
    [],
  );

  return (
    <NestedEntitySheetDispatchContext.Provider value={dispatch}>
      <NestedEntitySheetCountContext.Provider value={nestedOpenCount}>
        {children}
      </NestedEntitySheetCountContext.Provider>
    </NestedEntitySheetDispatchContext.Provider>
  );
}

export function useHasNestedEntitySheet(): boolean {
  return useContext(NestedEntitySheetCountContext) > 0;
}

export function useRegisterNestedEntitySheet(active: boolean): void {
  const dispatch = useContext(NestedEntitySheetDispatchContext);
  useLayoutEffect(() => {
    if (!dispatch || !active) return;
    dispatch.acquire();
    return () => {
      dispatch.release();
    };
  }, [dispatch, active]);
}

export function RelationEntitySheetStackProvider({
  stackAbove,
  children,
}: {
  stackAbove: boolean;
  children: ReactNode;
}) {
  return (
    <RelationEntitySheetStackContext.Provider value={stackAbove}>
      {children}
    </RelationEntitySheetStackContext.Provider>
  );
}

export function useRelationEntitySheetStackAbove(): boolean {
  return useContext(RelationEntitySheetStackContext);
}
