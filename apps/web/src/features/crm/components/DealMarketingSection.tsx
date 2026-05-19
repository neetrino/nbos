'use client';

import { Building2, ExternalLink, Megaphone, User } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetSection,
  InlineField,
  SearchField,
} from '@/components/shared';
import type { Deal } from '@/lib/api/deals';
import { LEAD_SOURCES, SALES_CHANNELS } from '../constants/leadPipeline';
import {
  isDealAttributionLocked,
  requiresMarketingWhichOneSelection,
} from '@nbos/shared/constants';
import { useCrmMarketingWhereOptions } from '../hooks/useCrmMarketingWhereOptions';
import type { DealGeneralDraft } from './deal-general-form-state';
import type { SearchLoader } from './deal-general-tab.types';
import { DEAL_SHEET_SECTION } from '@/features/shared/crm-sheet-section-ids';
import { DealPartnerReferralTermsSection } from './DealPartnerReferralTermsSection';

interface DealMarketingSectionProps {
  deal: Deal;
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  searchAttributionOptions: SearchLoader;
  searchPartners: SearchLoader;
  searchContacts: SearchLoader;
  onRefresh?: () => void;
  disabled?: boolean;
  sectionClassName?: string;
}

export function DealMarketingSection({
  deal,
  draft,
  patchDraft,
  searchAttributionOptions,
  searchPartners,
  searchContacts,
  onRefresh,
  disabled = false,
  sectionClassName,
}: DealMarketingSectionProps) {
  const { options: marketingWhereOptions } = useCrmMarketingWhereOptions(
    draft.source === 'MARKETING',
  );
  const whereOptions = getWhereOptions(draft.source, marketingWhereOptions);
  const attributionLocked = isDealAttributionLocked(deal.status);
  const showMarketingWhichOne =
    draft.source === 'MARKETING' &&
    Boolean(draft.sourceDetail) &&
    requiresMarketingWhichOneSelection(draft.source, draft.sourceDetail);

  return (
    <DetailSheetSection
      id={DEAL_SHEET_SECTION.MARKETING}
      title="Marketing"
      icon={<Megaphone size={12} />}
      className={sectionClassName}
    >
      <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
        <InlineField
          variant="controlled"
          label="From"
          value={draft.source ?? ''}
          type="select"
          options={LEAD_SOURCES.map((source) => ({ value: source.value, label: source.label }))}
          placeholder="Select source..."
          icon={<Megaphone size={12} />}
          disabled={disabled || attributionLocked}
          clearable={!attributionLocked}
          onValueChange={(value) =>
            patchDraft({
              source: value || null,
              sourceDetail: null,
              sourcePartnerId: null,
              sourceContactId: null,
              marketingAccountId: null,
              marketingActivityId: null,
              marketingPickLabel: null,
              partnerPickLabel: null,
              clientPickLabel: null,
            })
          }
        />

        {(draft.source === 'SALES' || draft.source === 'MARKETING') && (
          <InlineField
            variant="controlled"
            label="Where?"
            value={draft.sourceDetail ?? ''}
            type="select"
            options={whereOptions}
            placeholder="Select channel..."
            icon={<ExternalLink size={12} />}
            disabled={disabled || attributionLocked}
            clearable={!attributionLocked}
            onValueChange={(value) =>
              patchDraft({
                sourceDetail: value || null,
                marketingAccountId: null,
                marketingActivityId: null,
                marketingPickLabel: null,
              })
            }
          />
        )}

        {showMarketingWhichOne ? (
          <SearchField
            selectionMode="stage"
            label="Which one?"
            value={draft.marketingAccountId ?? draft.marketingActivityId ?? null}
            displayValue={
              draft.marketingPickLabel ? (
                <span className="text-foreground text-sm font-medium">
                  {draft.marketingPickLabel}
                </span>
              ) : undefined
            }
            placeholder="Search accounts or activities..."
            icon={<ExternalLink size={12} />}
            disabled={disabled || attributionLocked}
            onSearch={searchAttributionOptions}
            onStageSelect={(value, label) => {
              const [type, id] = value.split(':');
              patchDraft({
                marketingAccountId: type === 'ACCOUNT' ? (id ?? null) : null,
                marketingActivityId: type === 'ACTIVITY' ? (id ?? null) : null,
                marketingPickLabel: label,
              });
            }}
            onClear={
              attributionLocked || disabled
                ? undefined
                : () =>
                    patchDraft({
                      marketingAccountId: null,
                      marketingActivityId: null,
                      marketingPickLabel: null,
                    })
            }
          />
        ) : null}

        {draft.source === 'PARTNER' && (
          <SearchField
            selectionMode="stage"
            label="Which Partner?"
            value={draft.sourcePartnerId}
            displayValue={
              draft.partnerPickLabel ? (
                <span className="text-foreground text-sm font-medium">
                  {draft.partnerPickLabel}
                </span>
              ) : undefined
            }
            placeholder="Search partners..."
            icon={<Building2 size={12} />}
            disabled={disabled || attributionLocked}
            onSearch={searchPartners}
            onStageSelect={(value, label) =>
              patchDraft({ sourcePartnerId: value, partnerPickLabel: label })
            }
            onClear={
              attributionLocked || disabled
                ? undefined
                : () => patchDraft({ sourcePartnerId: null, partnerPickLabel: null })
            }
          />
        )}

        {draft.source === 'PARTNER' && draft.sourcePartnerId ? (
          <DealPartnerReferralTermsSection
            deal={deal}
            attributionLocked={attributionLocked}
            onTermsUpdated={onRefresh}
          />
        ) : null}

        {draft.source === 'CLIENT' && (
          <SearchField
            selectionMode="stage"
            label="Which Client?"
            value={draft.sourceContactId}
            displayValue={
              draft.clientPickLabel ? (
                <span className="text-foreground text-sm font-medium">{draft.clientPickLabel}</span>
              ) : undefined
            }
            placeholder="Search contacts..."
            icon={<User size={12} />}
            disabled={disabled || attributionLocked}
            onSearch={searchContacts}
            onStageSelect={(value, label) =>
              patchDraft({ sourceContactId: value, clientPickLabel: label })
            }
            onClear={
              attributionLocked || disabled
                ? undefined
                : () => patchDraft({ sourceContactId: null, clientPickLabel: null })
            }
          />
        )}
      </div>
    </DetailSheetSection>
  );
}

function getWhereOptions(
  source: string | null,
  marketingOptions: Array<{ value: string; label: string }>,
) {
  if (source === 'SALES') {
    return SALES_CHANNELS.map((channel) => ({ value: channel.value, label: channel.label }));
  }
  if (source === 'MARKETING') {
    return marketingOptions;
  }
  return [];
}
