'use client';

import { useEffect, useRef, type PointerEvent, type ReactNode, type RefObject } from 'react';
import { ORG_CANVAS_CLASS, ORG_PAN_DRAG_THRESHOLD_PX } from './org-chart-constants';
import type { OrgChartLayout } from './org-chart-layout';
import { applyPointerPan, createOrgChartDragState, wheelZoomViewport } from './org-chart-pan-zoom';
import type { OrgChartViewport } from './org-chart-viewport';

export function OrgChartCanvas({
  canvasRef,
  layout,
  viewport,
  onViewportChange,
  children,
}: {
  canvasRef: RefObject<HTMLDivElement | null>;
  layout: OrgChartLayout;
  viewport: OrgChartViewport;
  onViewportChange: (next: OrgChartViewport) => void;
  children: ReactNode;
}) {
  const dragRef = useRef(createOrgChartDragState());
  const viewportRef = useRef(viewport);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      onViewportChange(wheelZoomViewport(viewportRef.current, canvas, event));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [canvasRef, onViewportChange]);

  return (
    <div
      ref={canvasRef}
      className={ORG_CANVAS_CLASS}
      onPointerDown={(event) => beginPan(event, dragRef.current)}
      onPointerMove={(event) =>
        movePan(event, canvasRef.current, dragRef, viewportRef, onViewportChange)
      }
      onPointerUp={(event) => endPan(event, dragRef.current)}
      onPointerCancel={(event) => endPan(event, dragRef.current)}
    >
      <OrgChartWorld layout={layout} viewport={viewport}>
        {children}
      </OrgChartWorld>
    </div>
  );
}

/** Pan with translate; zoom with CSS `zoom` so text stays sharp (scale() rasterizes). */
function OrgChartWorld({
  layout,
  viewport,
  children,
}: {
  layout: OrgChartLayout;
  viewport: OrgChartViewport;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute top-0 left-0"
      style={{
        transform: `translate(${viewport.tx}px, ${viewport.ty}px)`,
        transformOrigin: '0 0',
      }}
    >
      <div
        style={{
          width: layout.width,
          height: layout.height,
          zoom: viewport.scale,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function movePan(
  event: PointerEvent<HTMLDivElement>,
  canvas: HTMLDivElement | null,
  dragRef: { current: ReturnType<typeof createOrgChartDragState> },
  viewportRef: { current: OrgChartViewport },
  onViewportChange: (next: OrgChartViewport) => void,
): void {
  if (!canvas || dragRef.current.pointerId !== event.pointerId) return;
  const next = applyPointerPan(
    viewportRef.current,
    dragRef.current,
    event.clientX,
    event.clientY,
    ORG_PAN_DRAG_THRESHOLD_PX,
  );
  dragRef.current = next.drag;
  onViewportChange(next.viewport);
}

function beginPan(
  event: PointerEvent<HTMLDivElement>,
  drag: ReturnType<typeof createOrgChartDragState>,
): void {
  if (event.button !== 0) return;
  event.currentTarget.setPointerCapture(event.pointerId);
  drag.pointerId = event.pointerId;
  drag.lastX = event.clientX;
  drag.lastY = event.clientY;
  drag.moved = false;
}

function endPan(
  event: PointerEvent<HTMLDivElement>,
  drag: ReturnType<typeof createOrgChartDragState>,
): void {
  if (drag.pointerId !== event.pointerId) return;
  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
  drag.pointerId = null;
}

export function orgChartCanvasSize(canvas: HTMLDivElement | null): {
  width: number;
  height: number;
} {
  if (!canvas) return { width: 0, height: 0 };
  const rect = canvas.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}
