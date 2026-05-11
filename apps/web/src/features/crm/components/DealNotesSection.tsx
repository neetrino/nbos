'use client';

import { MessageSquare } from 'lucide-react';
import { InlineField } from '@/components/shared';
import type { DealGeneralDraft } from './deal-general-form-state';

interface DealNotesSectionProps {
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  disabled?: boolean;
}

export function DealNotesSection({ draft, patchDraft, disabled = false }: DealNotesSectionProps) {
  return (
    <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent">
      <InlineField
        variant="controlled"
        label="Notes"
        value={draft.notes ?? ''}
        type="textarea"
        placeholder="Add notes about this deal..."
        icon={<MessageSquare size={12} />}
        disabled={disabled}
        onValueChange={(v) => patchDraft({ notes: v || null })}
      />
    </section>
  );
}
