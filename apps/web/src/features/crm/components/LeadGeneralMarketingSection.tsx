'use client';

import { useCallback } from 'react';
import { User, Megaphone, ExternalLink, Building2 } from 'lucide-react';
import { DetailSheetSection, InlineField, SearchField } from '@/components/shared';
import { LEAD_SOURCES, SALES_CHANNELS } from '../constants/leadPipeline';
import {
  isLeadAttributionLocked,
  requiresMarketingWhichOneSelection,
} from '@nbos/shared/constants';
import type { Lead } from '@/lib/api/leads';
import { partnersApi } from '@/lib/api/partners';
import { contactsApi } from '@/lib/api/clients';
import { marketingApi } from '@/lib/api/marketing';
import { useCrmMarketingWhereOptions } from '../hooks/useCrmMarketingWhereOptions';
import type { LeadGeneralDraft } from './lead-general-form-state';
import type { LeadSheetSectionId } from '@/features/shared/crm-sheet-section-ids';

interface LeadGeneralMarketingSectionProps {
  lead: Lead;
  draft: LeadGeneralDraft;
  patchDraft: (partial: Partial<LeadGeneralDraft>) => void;
  formDisabled: boolean;
  sectionId: LeadSheetSectionId;
}

export function LeadGeneralMarketingSection({
  lead,
  draft,
  patchDraft,
  formDisabled,
  sectionId,
}: LeadGeneralMarketingSectionProps) {
  const { options: marketingWhereOptions } = useCrmMarketingWhereOptions(
    draft.source === 'MARKETING',
  );
  const attributionLocked = isLeadAttributionLocked(lead.status);
  const showMarketingWhichOne =
    draft.source === 'MARKETING' &&
    Boolean(draft.sourceDetail) &&
    requiresMarketingWhichOneSelection(draft.source, draft.sourceDetail);

  const searchPartners = useCallback(async (query: string) => {
    const data = await partnersApi.getAll({ pageSize: 5, search: query || undefined });
    return data.items.map((p) => ({ value: p.id, label: p.name }));
  }, []);

  const searchContacts = useCallback(async (query: string) => {
    const data = await contactsApi.getAll({ pageSize: 5, search: query || undefined });
    return data.items.map((c) => ({
      value: c.id,
      label: `${c.firstName} ${c.lastName}`,
      subtitle: c.email ?? undefined,
    }));
  }, []);

  const searchAttributionOptions = useCallback(
    async (query: string) => {
      if (!draft.sourceDetail) return [];
      const options = await marketingApi.getAttributionOptions(draft.sourceDetail);
      return options
        .filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
        .map((option) => ({
          value: `${option.type}:${option.id}`,
          label: option.label,
          subtitle: option.subtitle ?? option.type,
        }));
    },
    [draft.sourceDetail],
  );

  const whereOptions =
    draft.source === 'SALES'
      ? SALES_CHANNELS.map((c) => ({ value: c.value, label: c.label }))
      : draft.source === 'MARKETING'
        ? marketingWhereOptions
        : [];

  return (
    <DetailSheetSection id={sectionId} title="Marketing" icon={<Megaphone size={12} />}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InlineField
          variant="controlled"
          label="From"
          type="select"
          value={draft.source ?? ''}
          options={LEAD_SOURCES.map((s) => ({
            value: s.value,
            label: s.label,
            icon: <span>{s.icon}</span>,
          }))}
          placeholder="Select source…"
          icon={<Megaphone size={12} />}
          disabled={formDisabled || attributionLocked}
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
            type="select"
            value={draft.sourceDetail ?? ''}
            options={whereOptions}
            placeholder="Select channel…"
            icon={<ExternalLink size={12} />}
            disabled={formDisabled || attributionLocked}
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
            placeholder="Search accounts or activities…"
            icon={<ExternalLink size={12} />}
            disabled={formDisabled || attributionLocked}
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
              attributionLocked || formDisabled
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

        {draft.source === 'PARTNER' ? (
          <SearchField
            selectionMode="stage"
            label="Which partner?"
            value={draft.sourcePartnerId}
            displayValue={
              draft.partnerPickLabel ? (
                <span className="text-foreground text-sm font-medium">
                  {draft.partnerPickLabel}
                </span>
              ) : undefined
            }
            placeholder="Search partners…"
            icon={<Building2 size={12} />}
            disabled={formDisabled || attributionLocked}
            onSearch={searchPartners}
            onStageSelect={(value, label) =>
              patchDraft({ sourcePartnerId: value, partnerPickLabel: label })
            }
            onClear={
              attributionLocked || formDisabled
                ? undefined
                : () => patchDraft({ sourcePartnerId: null, partnerPickLabel: null })
            }
          />
        ) : null}

        {draft.source === 'CLIENT' ? (
          <SearchField
            selectionMode="stage"
            label="Which client?"
            value={draft.sourceContactId}
            displayValue={
              draft.clientPickLabel ? (
                <span className="text-foreground text-sm font-medium">{draft.clientPickLabel}</span>
              ) : undefined
            }
            placeholder="Search contacts…"
            icon={<User size={12} />}
            disabled={formDisabled || attributionLocked}
            onSearch={searchContacts}
            onStageSelect={(value, label) =>
              patchDraft({ sourceContactId: value, clientPickLabel: label })
            }
            onClear={
              attributionLocked || formDisabled
                ? undefined
                : () => patchDraft({ sourceContactId: null, clientPickLabel: null })
            }
          />
        ) : null}
      </div>
    </DetailSheetSection>
  );
}
