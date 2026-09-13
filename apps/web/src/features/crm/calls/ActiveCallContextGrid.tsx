'use client';

import { LayoutGrid, Phone, Banknote } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ActiveCallScreenSnapshot } from '@/lib/api/calls';
import { getDealStage } from '@/features/crm/constants/dealPipeline';
import {
  ACTIVE_CALL_CONTACT_ACCENT_CLASS,
  ACTIVE_CALL_CONTACT_META_ICON_CLASS,
  ACTIVE_CALL_DEAL_ACCENT_CLASS,
  ACTIVE_CALL_DEAL_META_ICON_CLASS,
  ACTIVE_CALL_EMPTY_ACCENT_CLASS,
  ACTIVE_CALL_EMPTY_META_ICON_CLASS,
} from './active-call.constants';
import { ActiveCallEntityMiniCard, type ActiveCallMiniCardLine } from './ActiveCallEntityMiniCard';
import { ActiveCallRecentCalls } from './ActiveCallRecentCalls';

export function ActiveCallContextGrid({ snapshot }: { snapshot: ActiveCallScreenSnapshot | null }) {
  const t = useTranslations('crm');
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <ActiveCallEntityMiniCard {...contactMiniCard(t, snapshot)} />
        <ActiveCallEntityMiniCard {...dealMiniCard(t, snapshot)} />
      </div>
      <ProjectProductLine snapshot={snapshot} />
      <ActiveCallRecentCalls snapshot={snapshot} />
    </div>
  );
}

function contactMiniCard(
  t: ReturnType<typeof useTranslations<'crm'>>,
  snapshot: ActiveCallScreenSnapshot | null,
) {
  const company = snapshot?.contact.companyName ?? null;
  const leadName = snapshot?.leadName ?? null;
  const phones = snapshot?.contact.phones ?? [];
  const lines: ActiveCallMiniCardLine[] = [];
  if (phones.length > 0) lines.push({ icon: Phone, label: phones.join(', ') });
  if (company && leadName) lines.push({ icon: LayoutGrid, label: leadName });

  return {
    title: snapshot?.contact.name ?? t('calls.newCaller'),
    subtitle: company ?? leadName,
    accentClassName: ACTIVE_CALL_CONTACT_ACCENT_CLASS,
    metaIconClassName: ACTIVE_CALL_CONTACT_META_ICON_CLASS,
    lines,
  };
}

function dealMiniCard(
  t: ReturnType<typeof useTranslations<'crm'>>,
  snapshot: ActiveCallScreenSnapshot | null,
) {
  const dealName = snapshot?.deal.name ?? null;
  const stage = snapshot?.deal.stage
    ? (getDealStage(snapshot.deal.stage)?.label ?? snapshot.deal.stage)
    : null;
  const amount = snapshot?.deal.amount ?? null;
  const hasDeal = Boolean(dealName);
  const lines: ActiveCallMiniCardLine[] = [];
  if (amount) lines.push({ icon: Banknote, label: amount });

  return {
    title: dealName ?? t('calls.noOpenDeal'),
    subtitle: stage,
    accentClassName: hasDeal ? ACTIVE_CALL_DEAL_ACCENT_CLASS : ACTIVE_CALL_EMPTY_ACCENT_CLASS,
    metaIconClassName: hasDeal
      ? ACTIVE_CALL_DEAL_META_ICON_CLASS
      : ACTIVE_CALL_EMPTY_META_ICON_CLASS,
    lines,
  };
}

function ProjectProductLine({ snapshot }: { snapshot: ActiveCallScreenSnapshot | null }) {
  const t = useTranslations('crm');
  return (
    <p className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs">
      <span>
        {t('common.entityProject')}{' '}
        <span className="text-foreground font-medium">
          {snapshot?.projectName ?? t('calls.notLinked')}
        </span>
      </span>
      <span className="bg-border hidden h-3 w-px sm:inline-block" aria-hidden />
      <span>
        {t('common.entityProduct')}{' '}
        <span className="text-foreground font-medium">
          {snapshot?.productName ?? t('calls.notLinked')}
        </span>
      </span>
    </p>
  );
}
