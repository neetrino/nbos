'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { dashboardApi } from '@/lib/api/dashboard';
import { getApiErrorMessage } from '@/lib/api-errors';
import { cn } from '@/lib/utils';
import { prependDashboardControlCacheNote } from '@/features/dashboard/dashboard-control-cache';
import { dispatchDashboardNoteCreated } from '@/features/dashboard/dashboard-note-sync';
import {
  HEADER_QUICK_NOTE_EXPANDED_MIN_HEIGHT_PX,
  HEADER_QUICK_NOTE_WIDTH_COLLAPSED_REM,
  HEADER_QUICK_NOTE_WIDTH_EXPANDED_REM,
} from '@/components/layout/header-quick-note-constants';
import {
  DASHBOARD_NOTE_COMPOSER_HEADER_CLASS,
  DASHBOARD_NOTE_CORNER_SAVE_PRIMARY_CLASS,
  DASHBOARD_NOTE_EXPANDED_RING_CLASS,
  DASHBOARD_NOTE_HINT_CLASS,
  DASHBOARD_NOTE_MUTED_INK_CLASS,
  DASHBOARD_NOTE_PLACEHOLDER_CLASS,
} from '@/features/dashboard/constants/dashboard-note-surface';

const QUICK_NOTE_PLACEHOLDER = 'Write a note and press Enter...';
const QUICK_NOTE_SAVE_HINT = '↵ Enter or';

const QUICK_NOTE_MAX_WIDTH = 'min(22rem, calc(100vw - 10rem))';

export function HeaderQuickNote() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSave = draft.trim().length > 0 && !saving;
  const showSave = expanded && draft.length > 0;

  const openComposer = useCallback(() => {
    setExpanded(true);
  }, []);

  const collapseComposer = useCallback(() => {
    setExpanded(false);
    textareaRef.current?.blur();
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      collapseComposer();
    };
    const onWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') collapseComposer();
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onWindowKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onWindowKeyDown);
    };
  }, [collapseComposer, expanded]);

  useEffect(() => {
    if (!expanded) return;
    const element = textareaRef.current;
    if (!element) return;
    element.focus();
    const length = element.value.length;
    element.setSelectionRange(length, length);
  }, [expanded]);

  async function saveDraft() {
    if (!canSave) return;
    const content = draft.trim();
    setSaving(true);
    try {
      const saved = await dashboardApi.createNote({ content });
      setDraft('');
      collapseComposer();
      if (userId) prependDashboardControlCacheNote(userId, saved);
      dispatchDashboardNoteCreated(saved);
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Note could not be saved.'));
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      collapseComposer();
      return;
    }
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    void saveDraft();
  }

  const widthRem = expanded
    ? HEADER_QUICK_NOTE_WIDTH_EXPANDED_REM
    : HEADER_QUICK_NOTE_WIDTH_COLLAPSED_REM;

  return (
    <div
      ref={rootRef}
      className={cn('relative hidden h-9 shrink-0 sm:block', expanded && 'z-50')}
      style={{ width: `${widthRem}rem`, maxWidth: QUICK_NOTE_MAX_WIDTH }}
    >
      <QuickNoteComposer
        canSave={canSave}
        draft={draft}
        expanded={expanded}
        onDraftChange={setDraft}
        onExpand={openComposer}
        onKeyDown={handleKeyDown}
        onSave={() => void saveDraft()}
        saving={saving}
        showSave={showSave}
        textareaRef={textareaRef}
      />
    </div>
  );
}

function QuickNoteComposer({
  canSave,
  draft,
  expanded,
  onDraftChange,
  onExpand,
  onKeyDown,
  onSave,
  saving,
  showSave,
  textareaRef,
}: {
  canSave: boolean;
  draft: string;
  expanded: boolean;
  onDraftChange: (value: string) => void;
  onExpand: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSave: () => void;
  saving: boolean;
  showSave: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <div
      className={cn(
        DASHBOARD_NOTE_COMPOSER_HEADER_CLASS,
        expanded && DASHBOARD_NOTE_EXPANDED_RING_CLASS,
      )}
      style={{
        width: '100%',
        maxWidth: QUICK_NOTE_MAX_WIDTH,
      }}
    >
      {saving ? (
        <Loader2
          className={cn(
            'absolute top-2.5 right-2.5 z-10 h-4 w-4 animate-spin',
            DASHBOARD_NOTE_MUTED_INK_CLASS,
          )}
          aria-hidden
        />
      ) : null}
      <Textarea
        ref={textareaRef}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onFocus={onExpand}
        onClick={onExpand}
        onKeyDown={onKeyDown}
        placeholder={QUICK_NOTE_PLACEHOLDER}
        rows={expanded ? 5 : 1}
        style={expanded ? { minHeight: HEADER_QUICK_NOTE_EXPANDED_MIN_HEIGHT_PX } : undefined}
        className={cn(
          'resize-none border-0 bg-transparent px-3.5 py-2 text-sm leading-6 shadow-none',
          DASHBOARD_NOTE_PLACEHOLDER_CLASS,
          'focus-visible:ring-0',
          expanded ? 'min-h-[140px] pb-12' : 'max-h-9 min-h-9 overflow-hidden',
        )}
      />
      {showSave ? (
        <div className="absolute right-2 bottom-2 z-10 flex max-w-[calc(100%-1rem)] items-center justify-end gap-2">
          <p
            className={cn(
              'min-w-0 text-right text-[10px] leading-snug font-medium select-none',
              DASHBOARD_NOTE_HINT_CLASS,
            )}
          >
            {QUICK_NOTE_SAVE_HINT}
          </p>
          <Button
            type="button"
            size="xs"
            className={cn(DASHBOARD_NOTE_CORNER_SAVE_PRIMARY_CLASS, 'shrink-0')}
            disabled={!canSave}
            onClick={onSave}
          >
            Save
          </Button>
        </div>
      ) : null}
    </div>
  );
}
