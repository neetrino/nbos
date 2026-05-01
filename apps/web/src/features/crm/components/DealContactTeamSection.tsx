'use client';

import { Building2, Calendar, Clock, User } from 'lucide-react';
import { InlineField, SearchField } from '@/components/shared';
import type { Deal } from '@/lib/api/deals';
import type { SaveField, SearchLoader } from './deal-general-tab.types';

interface DealContactTeamSectionProps {
  deal: Deal;
  searchContacts: SearchLoader;
  saveField: SaveField;
}

export function DealContactTeamSection({
  deal,
  searchContacts,
  saveField,
}: DealContactTeamSectionProps) {
  return (
    <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent">
      <h4 className="text-muted-foreground mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
        <User size={12} />
        Contact & Team
      </h4>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <SearchField
          label="Contact"
          value={deal.contact?.id ?? null}
          displayValue={deal.contact ? <ContactDisplay deal={deal} /> : undefined}
          placeholder="Search contacts..."
          icon={<User size={12} />}
          onSearch={searchContacts}
          onSave={(value) => saveField('contactId', value)}
        />

        <InlineField
          label="Seller"
          value={deal.seller ? `${deal.seller.firstName} ${deal.seller.lastName}` : ''}
          displayValue={deal.seller ? <SellerDisplay deal={deal} /> : undefined}
          editable={false}
          icon={<Building2 size={12} />}
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

function ContactDisplay({ deal }: { deal: Deal }) {
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

function SellerDisplay({ deal }: { deal: Deal }) {
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

function formatStaticDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
