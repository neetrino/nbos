'use client';

import { MessageSquare } from 'lucide-react';
import { InlineField } from '@/components/shared';
import type { Deal } from '@/lib/api/deals';
import type { SaveField } from './deal-general-tab.types';

interface DealNotesSectionProps {
  deal: Deal;
  saveField: SaveField;
}

export function DealNotesSection({ deal, saveField }: DealNotesSectionProps) {
  return (
    <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent">
      <InlineField
        label="Notes"
        value={deal.notes}
        type="textarea"
        placeholder="Add notes about this deal..."
        icon={<MessageSquare size={12} />}
        onSave={(value) => saveField('notes', value)}
      />
    </section>
  );
}
