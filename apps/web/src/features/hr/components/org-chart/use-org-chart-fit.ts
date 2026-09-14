'use client';

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type RefObject,
  type SetStateAction,
} from 'react';
import type { OrgChartLayout } from './org-chart-layout';
import { orgChartCanvasSize } from './OrgChartCanvas';
import {
  fitOrgChartInViewport,
  hasOrgChartViewportSize,
  type OrgChartViewport,
} from './org-chart-viewport';

export function useOrgChartCanvasBox(canvasRef: RefObject<HTMLDivElement | null>): {
  width: number;
  height: number;
} {
  const [box, setBox] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const sync = (): void => setBox(orgChartCanvasSize(canvas));
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef]);
  return box;
}

export function useOrgChartFit(
  layout: OrgChartLayout,
  box: { width: number; height: number },
  didFitRef: MutableRefObject<boolean>,
  setViewport: (next: OrgChartViewport) => void,
): void {
  useEffect(() => {
    if (didFitRef.current || layout.nodes.length === 0) return;
    if (!hasOrgChartViewportSize(box)) return;
    didFitRef.current = true;
    setViewport(
      fitOrgChartInViewport({
        contentWidth: layout.width,
        contentHeight: layout.height,
        viewportWidth: box.width,
        viewportHeight: box.height,
      }),
    );
  }, [box, didFitRef, layout, setViewport]);
}

export function useOrgChartOriginPan(
  originX: number,
  didFitRef: MutableRefObject<boolean>,
  setViewport: Dispatch<SetStateAction<OrgChartViewport>>,
): void {
  const originXRef = useRef<number | null>(null);
  useEffect(() => {
    if (!didFitRef.current) {
      originXRef.current = originX;
      return;
    }
    const previous = originXRef.current;
    originXRef.current = originX;
    if (previous === null || previous === originX) return;
    const delta = originX - previous;
    setViewport((viewport) => ({ ...viewport, tx: viewport.tx + delta * viewport.scale }));
  }, [didFitRef, originX, setViewport]);
}
