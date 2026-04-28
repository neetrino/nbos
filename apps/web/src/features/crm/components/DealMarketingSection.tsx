'use client';

import { Building2, ExternalLink, Megaphone, User } from 'lucide-react';
import { InlineField, SearchField } from '@/components/shared';
import type { Deal } from '@/lib/api/deals';
import { LEAD_SOURCES, MARKETING_CHANNELS, SALES_CHANNELS } from '../constants/leadPipeline';
import type { SaveField, SaveMultipleFields, SearchLoader } from './deal-general-tab.types';

interface DealMarketingSectionProps {
  deal: Deal;
  searchAttributionOptions: SearchLoader;
  searchPartners: SearchLoader;
  searchContacts: SearchLoader;
  saveField: SaveField;
  saveMultipleFields: SaveMultipleFields;
}

export function DealMarketingSection({
  deal,
  searchAttributionOptions,
  searchPartners,
  searchContacts,
  saveField,
  saveMultipleFields,
}: DealMarketingSectionProps) {
  const sourceLabel =
    LEAD_SOURCES.find((source) => source.value === deal.source)?.label ?? deal.source;
  const whereOptions = getWhereOptions(deal.source);

  return (
    <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-violet-50/40 to-white p-5 dark:border-stone-800 dark:from-violet-950/10 dark:to-transparent">
      <h4 className="text-muted-foreground mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
        <Megaphone size={12} />
        Marketing
      </h4>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <InlineField
          label="From"
          value={deal.source}
          displayValue={
            deal.source ? (
              <span className="text-foreground text-sm font-medium">{sourceLabel}</span>
            ) : undefined
          }
          type="select"
          options={LEAD_SOURCES.map((source) => ({ value: source.value, label: source.label }))}
          placeholder="Select source..."
          icon={<Megaphone size={12} />}
          onSave={(value) =>
            saveMultipleFields({
              source: value as string,
              sourceDetail: null,
              sourcePartnerId: null,
              sourceContactId: null,
              marketingAccountId: null,
              marketingActivityId: null,
            })
          }
        />

        {(deal.source === 'SALES' || deal.source === 'MARKETING') && (
          <InlineField
            label="Where?"
            value={deal.sourceDetail}
            displayValue={
              deal.sourceDetail ? (
                <span className="text-foreground text-sm font-medium">
                  {whereOptions.find((option) => option.value === deal.sourceDetail)?.label ??
                    deal.sourceDetail}
                </span>
              ) : undefined
            }
            type="select"
            options={whereOptions}
            placeholder="Select channel..."
            icon={<ExternalLink size={12} />}
            onSave={(value) =>
              saveMultipleFields({
                sourceDetail: value,
                marketingAccountId: null,
                marketingActivityId: null,
              })
            }
          />
        )}

        {deal.source === 'MARKETING' && deal.sourceDetail && (
          <SearchField
            label="Which one"
            value={
              deal.marketingAccount
                ? deal.marketingAccount.name
                : (deal.marketingActivity?.title ?? null)
            }
            displayValue={
              deal.marketingAccount || deal.marketingActivity ? (
                <span className="text-foreground text-sm font-medium">
                  {deal.marketingAccount?.name ?? deal.marketingActivity?.title}
                </span>
              ) : undefined
            }
            placeholder="Search accounts or activities..."
            icon={<ExternalLink size={12} />}
            onSearch={searchAttributionOptions}
            onSave={(value) => saveMarketingAttribution(value, saveMultipleFields)}
          />
        )}

        {deal.source === 'PARTNER' && (
          <SearchField
            label="Which Partner?"
            value={deal.sourcePartner?.name ?? null}
            displayValue={
              deal.sourcePartner ? (
                <span className="text-foreground text-sm font-medium">
                  {deal.sourcePartner.name}
                </span>
              ) : undefined
            }
            placeholder="Search partners..."
            icon={<Building2 size={12} />}
            onSearch={searchPartners}
            onSave={(value) => saveField('sourcePartnerId', value)}
          />
        )}

        {deal.source === 'CLIENT' && (
          <SearchField
            label="Which Client?"
            value={
              deal.sourceContact
                ? `${deal.sourceContact.firstName} ${deal.sourceContact.lastName}`
                : null
            }
            displayValue={
              deal.sourceContact ? (
                <span className="text-foreground text-sm font-medium">
                  {deal.sourceContact.firstName} {deal.sourceContact.lastName}
                </span>
              ) : undefined
            }
            placeholder="Search contacts..."
            icon={<User size={12} />}
            onSearch={searchContacts}
            onSave={(value) => saveField('sourceContactId', value)}
          />
        )}
      </div>
    </section>
  );
}

function getWhereOptions(source: string | null) {
  if (source === 'SALES') {
    return SALES_CHANNELS.map((channel) => ({ value: channel.value, label: channel.label }));
  }
  if (source === 'MARKETING') {
    return MARKETING_CHANNELS.map((channel) => ({ value: channel.value, label: channel.label }));
  }
  return [];
}

function saveMarketingAttribution(value: string, saveMultipleFields: SaveMultipleFields) {
  const [type, id] = value.split(':');
  return saveMultipleFields({
    marketingAccountId: type === 'ACCOUNT' ? (id ?? null) : null,
    marketingActivityId: type === 'ACTIVITY' ? (id ?? null) : null,
  });
}
