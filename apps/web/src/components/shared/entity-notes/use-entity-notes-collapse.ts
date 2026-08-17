'use client';

import { useCallback, useLayoutEffect, useState, type RefObject } from 'react';
import {
  ENTITY_NOTES_COLLAPSED_PREVIEW_HEIGHT_PX,
  notesContentCanCollapse,
} from './entity-notes-collapse';

interface UseEntityNotesCollapseParams {
  enabled: boolean;
  contentRef: RefObject<HTMLElement | null>;
  value: string | null;
  isEditing: boolean;
}

export function useEntityNotesCollapse({
  enabled,
  contentRef,
  value,
  isEditing,
}: UseEntityNotesCollapseParams): {
  expanded: boolean;
  canCollapse: boolean;
  collapsedMaxHeightPx: number;
  toggleExpanded: () => void;
  resetExpanded: () => void;
} {
  const [expanded, setExpanded] = useState(false);
  const [fullHeightPx, setFullHeightPx] = useState(0);

  const measure = useCallback(() => {
    const root = contentRef.current;
    if (!root) return;
    const prose = root.querySelector('.ProseMirror');
    const nextHeight = prose instanceof HTMLElement ? prose.scrollHeight : root.scrollHeight;
    setFullHeightPx(nextHeight);
  }, [contentRef]);

  useLayoutEffect(() => {
    if (!enabled || isEditing) return;
    measure();
    const root = contentRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(root);
    const prose = root.querySelector('.ProseMirror');
    if (prose) observer.observe(prose);
    return () => observer.disconnect();
  }, [contentRef, enabled, isEditing, measure, value]);

  const canCollapse = enabled && notesContentCanCollapse(fullHeightPx);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const resetExpanded = useCallback(() => {
    setExpanded(false);
  }, []);

  return {
    expanded: canCollapse ? expanded : true,
    canCollapse,
    collapsedMaxHeightPx: ENTITY_NOTES_COLLAPSED_PREVIEW_HEIGHT_PX,
    toggleExpanded,
    resetExpanded,
  };
}
