'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { partitionPinnedActionsByKind } from '../dashboard-pinned-action-kind';
import { DASHBOARD_PINNED_GRID_CLASS } from '../dashboard-pinned-actions.constants';
import type { DashboardPersonalLink, PinnedAction } from '../dashboard-control-registry';
import { PersonalLinkCard, PinnedActionCard } from './DashboardActionCards';

interface DashboardPinnedActionsViewProps {
  actions: PinnedAction[];
  personalLinks: DashboardPersonalLink[];
}

export function DashboardPinnedActionsView({
  actions,
  personalLinks,
}: DashboardPinnedActionsViewProps) {
  const t = useTranslations('dashboard');
  const { create, open } = partitionPinnedActionsByKind(actions);
  const hasOpen = open.length > 0 || personalLinks.length > 0;

  return (
    <div className="flex flex-col gap-5">
      {create.length > 0 ? (
        <PinnedActionGroup title={t('pinned.createGroupTitle')}>
          {create.map((action) => (
            <PinnedActionCard key={action.key} action={action} editMode={false} />
          ))}
        </PinnedActionGroup>
      ) : null}
      {hasOpen ? (
        <PinnedActionGroup title={t('pinned.openGroupTitle')}>
          {open.map((action) => (
            <PinnedActionCard key={action.key} action={action} editMode={false} />
          ))}
          {personalLinks.map((link) => (
            <PersonalLinkCard key={link.id} editMode={false} link={link} />
          ))}
        </PinnedActionGroup>
      ) : null}
    </div>
  );
}

function PinnedActionGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2.5 text-sm font-semibold">{title}</h3>
      <div className={DASHBOARD_PINNED_GRID_CLASS}>{children}</div>
    </div>
  );
}
