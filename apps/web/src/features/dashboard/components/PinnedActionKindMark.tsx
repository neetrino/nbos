import { ArrowUpRight, Plus } from 'lucide-react';
import type { PinnedActionKind } from '../dashboard-control-registry';

const KIND_MARK_CLASS = 'text-muted-foreground size-3.5 shrink-0';
const KIND_MARK_STROKE = 2.25;

interface PinnedActionKindMarkProps {
  kind: PinnedActionKind;
}

/** Trailing glyph: plus for in-place create, arrow for navigation. */
export function PinnedActionKindMark({ kind }: PinnedActionKindMarkProps) {
  if (kind === 'create') {
    return <Plus className={KIND_MARK_CLASS} strokeWidth={KIND_MARK_STROKE} aria-hidden />;
  }
  return <ArrowUpRight className={KIND_MARK_CLASS} strokeWidth={KIND_MARK_STROKE} aria-hidden />;
}
