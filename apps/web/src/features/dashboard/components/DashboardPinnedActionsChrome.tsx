'use client';

import { type FormEvent, useState, type ReactNode } from 'react';
import { Check, Save, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ActionTileButton } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DASHBOARD_TWO_COLUMN_DROP_MIN_HEIGHT_CLASS } from '../dashboard-dnd.constants';
import { DASHBOARD_PINNED_TILE_MIN_HEIGHT_CLASS } from '../dashboard-pinned-action-tones';
import { DASHBOARD_PINNED_GRID_CLASS } from '../dashboard-pinned-actions.constants';

export function PinnedTileGrid({ children }: { children: ReactNode }) {
  return (
    <div className={`${DASHBOARD_PINNED_GRID_CLASS} ${DASHBOARD_TWO_COLUMN_DROP_MIN_HEIGHT_CLASS}`}>
      {children}
    </div>
  );
}

export function SortablePinnedTile({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
      }}
      className={cn(
        'focus-visible:ring-ring touch-none rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'cursor-grab active:cursor-grabbing',
        DASHBOARD_PINNED_TILE_MIN_HEIGHT_CLASS,
        'w-full',
        isDragging && 'opacity-55',
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export function PinnedDropColumn({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border-border/80 bg-muted/10 rounded-lg border border-dashed p-3',
        isOver && 'border-primary/50 bg-muted/25',
      )}
    >
      <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function CreateLinkInline({
  editing,
  onCancelEdit,
  onSubmit,
  saving,
}: {
  editing?: { label: string; url: string } | null;
  onCancelEdit?: () => void;
  onSubmit: (label: string, url: string) => Promise<void>;
  saving: boolean;
}) {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const [label, setLabel] = useState(editing?.label ?? '');
  const [url, setUrl] = useState(editing?.url ?? '');
  const canSubmit = Boolean(label.trim() && url.trim());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    await onSubmit(label.trim(), url.trim());
    if (!editing) {
      setLabel('');
      setUrl('');
    }
  }

  return (
    <div className="border-border/80 bg-muted/20 mt-5 rounded-xl border border-dashed p-4">
      <h3 className="text-sm font-semibold">
        {editing ? t('personalLink.formTitleEdit') : t('personalLink.formTitle')}
      </h3>
      <p className="text-muted-foreground mt-1 text-xs">{t('personalLink.formDescription')}</p>
      <form
        className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => void submit(e)}
      >
        <div className="grid flex-1 gap-2 sm:grid-cols-2">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('personalLink.labelPlaceholder')}
          />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('personalLink.urlPlaceholder')}
          />
        </div>
        {editing ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancelEdit}>
            {tCommon('cancel')}
          </Button>
        ) : null}
        <ActionTileButton
          label={saving ? tCommon('saving') : t('notes.save')}
          icon={<Save aria-hidden />}
          tone="emerald"
          size="sm"
          buttonType="submit"
          disabled={!canSubmit || saving}
          className="shrink-0"
        />
      </form>
    </div>
  );
}

export function PinnedActionsTitle({
  editMode,
  onToggleEdit,
}: {
  editMode: boolean;
  onToggleEdit: () => void;
}) {
  const t = useTranslations('dashboard');
  return (
    <div className="mt-3 flex items-center justify-end gap-2">
      {editMode ? <Badge variant="outline">{t('pinned.editing')}</Badge> : null}
      <Button
        type="button"
        variant={editMode ? 'default' : 'secondary'}
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onToggleEdit}
        aria-label={editMode ? t('pinned.doneEditingLayoutAria') : t('pinned.editLayoutAria')}
      >
        {editMode ? (
          <Check className="h-4 w-4" aria-hidden />
        ) : (
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
        )}
      </Button>
    </div>
  );
}

export function EmptyPinnedActions() {
  const t = useTranslations('dashboard');
  return (
    <p className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
      {t('pinned.empty')}
    </p>
  );
}
