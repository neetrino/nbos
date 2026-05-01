'use client';

import { Calendar, Check, CheckSquare, Clock, ExternalLink, FileText } from 'lucide-react';
import { InlineField } from '@/components/shared';
import type { Deal } from '@/lib/api/deals';
import type { SaveField } from './deal-general-tab.types';
import { formatDate, toDateInputValue } from './deal-general-tab.helpers';

interface DealOfferContractSectionProps {
  deal: Deal;
  saveField: SaveField;
}

export function DealOfferContractSection({ deal, saveField }: DealOfferContractSectionProps) {
  return (
    <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-blue-50/40 to-white p-5 dark:border-stone-800 dark:from-blue-950/10 dark:to-transparent">
      <h4 className="text-muted-foreground mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
        <FileText size={12} />
        Offer & Contract
      </h4>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <InlineField
          label="Offer Sent Date"
          value={toDateInputValue(deal.offerSentAt)}
          displayValue={
            deal.offerSentAt ? (
              <span className="text-foreground text-sm font-medium">
                {formatDate(deal.offerSentAt)}
              </span>
            ) : undefined
          }
          type="date"
          placeholder="Select offer date..."
          icon={<Calendar size={12} />}
          onSave={(value) => saveField('offerSentAt', value)}
        />

        <InlineField
          label="Response Due Date"
          value={toDateInputValue(deal.responseDueAt)}
          displayValue={
            deal.responseDueAt ? (
              <span className="text-foreground text-sm font-medium">
                {formatDate(deal.responseDueAt)}
              </span>
            ) : undefined
          }
          type="date"
          placeholder="Select response date..."
          icon={<Clock size={12} />}
          onSave={(value) => saveField('responseDueAt', value)}
        />

        <InlineField
          label="Offer Link"
          value={deal.offerLink}
          type="link"
          placeholder="https://..."
          icon={<ExternalLink size={12} />}
          onSave={(value) => saveField('offerLink', value)}
        />

        <InlineField
          label="Offer File URL"
          value={deal.offerFileUrl}
          type="link"
          placeholder="https://..."
          icon={<FileText size={12} />}
          onSave={(value) => saveField('offerFileUrl', value)}
        />

        <InlineField
          label="Offer Screenshot URL"
          value={deal.offerScreenshotUrl}
          type="link"
          placeholder="https://..."
          icon={<ExternalLink size={12} />}
          onSave={(value) => saveField('offerScreenshotUrl', value)}
        />

        <InlineField
          label="Contract Signed Date"
          value={toDateInputValue(deal.contractSignedAt)}
          displayValue={
            deal.contractSignedAt ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <Check size={13} />
                {formatDate(deal.contractSignedAt)}
              </span>
            ) : undefined
          }
          type="date"
          placeholder="Select contract date..."
          icon={<CheckSquare size={12} />}
          onSave={(value) => saveField('contractSignedAt', value)}
        />

        <InlineField
          label="Contract File URL"
          value={deal.contractFileUrl}
          type="link"
          placeholder="https://..."
          icon={<FileText size={12} />}
          onSave={(value) => saveField('contractFileUrl', value)}
        />
      </div>
    </section>
  );
}
