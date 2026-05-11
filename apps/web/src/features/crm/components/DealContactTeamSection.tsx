'use client';

import { Building2, Calendar, Clock, User } from 'lucide-react';
import { InlineField, SearchField } from '@/components/shared';
import type { Deal } from '@/lib/api/deals';
import type { DealGeneralDraft } from './deal-general-form-state';
import type { SearchLoader } from './deal-general-tab.types';
import { DEAL_SHEET_SECTION } from '@/features/shared/crm-sheet-section-ids';

interface DealContactTeamSectionProps {
  deal: Deal;
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  searchContacts: SearchLoader;
  searchEmployees: SearchLoader;
  disabled?: boolean;
}

export function DealContactTeamSection({
  deal,
  draft,
  patchDraft,
  searchContacts,
  searchEmployees,
  disabled = false,
}: DealContactTeamSectionProps) {
  return (
    <section
      id={DEAL_SHEET_SECTION.CONTACT_TEAM}
      className="rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent"
    >
      <h4 className="text-muted-foreground mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
        <User size={12} />
        Contact & Team
      </h4>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <SearchField
          selectionMode="stage"
          label="Contact"
          value={draft.contactId}
          displayValue={<ContactDisplay deal={deal} draft={draft} />}
          placeholder="Search contacts..."
          icon={<User size={12} />}
          disabled={disabled}
          onSearch={searchContacts}
          onStageSelect={(value, label) =>
            patchDraft({ contactId: value, contactDisplayLabel: label })
          }
        />

        <SearchField
          selectionMode="stage"
          label="Seller"
          value={draft.sellerId}
          displayValue={<SellerDisplay deal={deal} draft={draft} />}
          placeholder="Select seller…"
          icon={<Building2 size={12} />}
          disabled={disabled}
          onSearch={searchEmployees}
          onStageSelect={(value, label) =>
            patchDraft({ sellerId: value, sellerDisplayLabel: label })
          }
        />

        <SearchField
          selectionMode="stage"
          label="Sales assistant"
          value={draft.sellerAssistantId}
          displayValue={<AssistantDisplay deal={deal} draft={draft} />}
          placeholder="Optional — search employee…"
          icon={<Building2 size={12} />}
          disabled={disabled}
          onSearch={searchEmployees}
          onStageSelect={(value, label) =>
            patchDraft({ sellerAssistantId: value, sellerAssistantDisplayLabel: label })
          }
          onClear={() => patchDraft({ sellerAssistantId: null, sellerAssistantDisplayLabel: null })}
        />

        <InlineField
          label="Created"
          value={formatStaticDate(deal.createdAt)}
          icon={<Calendar size={12} />}
          editable={false}
        />

        <InlineField
          label="Last Updated"
          value={formatStaticDate(deal.updatedAt)}
          icon={<Clock size={12} />}
          editable={false}
        />
      </div>
    </section>
  );
}

function ContactDisplay({ deal, draft }: { deal: Deal; draft: DealGeneralDraft }) {
  if (draft.contactId && deal.contact?.id === draft.contactId) {
    return (
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          {deal.contact.firstName[0]}
          {deal.contact.lastName[0]}
        </div>
        <div>
          <p className="text-foreground text-sm leading-tight font-medium">
            {deal.contact.firstName} {deal.contact.lastName}
          </p>
          {deal.contact.email && (
            <p className="text-muted-foreground text-[11px]">{deal.contact.email}</p>
          )}
        </div>
      </div>
    );
  }
  if (draft.contactDisplayLabel) {
    return <LabelPersonDisplay label={draft.contactDisplayLabel} accent="blue" />;
  }
  return undefined;
}

function SellerDisplay({ deal, draft }: { deal: Deal; draft: DealGeneralDraft }) {
  if (draft.sellerId && deal.seller?.id === draft.sellerId) {
    return (
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-xs font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
          {deal.seller.firstName[0]}
          {deal.seller.lastName[0]}
        </div>
        <span className="text-foreground text-sm font-medium">
          {deal.seller.firstName} {deal.seller.lastName}
        </span>
      </div>
    );
  }
  if (draft.sellerDisplayLabel) {
    return <LabelPersonDisplay label={draft.sellerDisplayLabel} accent="amber" />;
  }
  return undefined;
}

function AssistantDisplay({ deal, draft }: { deal: Deal; draft: DealGeneralDraft }) {
  if (draft.sellerAssistantId && deal.sellerAssistant?.id === draft.sellerAssistantId) {
    const assistant = deal.sellerAssistant;
    return (
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-xs font-bold text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
          {assistant.firstName[0]}
          {assistant.lastName[0]}
        </div>
        <span className="text-foreground text-sm font-medium">
          {assistant.firstName} {assistant.lastName}
        </span>
      </div>
    );
  }
  if (draft.sellerAssistantDisplayLabel) {
    return <LabelPersonDisplay label={draft.sellerAssistantDisplayLabel} accent="violet" />;
  }
  return undefined;
}

const ACCENT_RING: Record<'blue' | 'amber' | 'violet', string> = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
};

function LabelPersonDisplay({
  label,
  accent,
}: {
  label: string;
  accent: keyof typeof ACCENT_RING;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold ${ACCENT_RING[accent]}`}
      >
        {initialsFromLabel(label)}
      </div>
      <span className="text-foreground text-sm font-medium">{label}</span>
    </div>
  );
}

function initialsFromLabel(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const a = parts[0]?.[0] ?? '';
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : (parts[0]?.[1] ?? '');
  return `${a}${b}`.toUpperCase() || '?';
}

function formatStaticDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
