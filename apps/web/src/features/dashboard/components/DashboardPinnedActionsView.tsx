import type { ReactNode } from 'react';
import { partitionPinnedActionsByKind } from '../dashboard-pinned-action-kind';
import { DASHBOARD_PINNED_GRID_CLASS } from '../dashboard-pinned-actions.constants';
import type { DashboardPersonalLink, PinnedAction } from '../dashboard-control-registry';
import { PersonalLinkCard, PinnedActionCard } from './DashboardActionCards';

interface DashboardPinnedActionsViewProps {
  actions: PinnedAction[];
  personalLinks: DashboardPersonalLink[];
  onDeletePersonalLink: (id: string) => Promise<void>;
}

export function DashboardPinnedActionsView({
  actions,
  personalLinks,
  onDeletePersonalLink,
}: DashboardPinnedActionsViewProps) {
  const { create, open } = partitionPinnedActionsByKind(actions);
  const hasOpen = open.length > 0 || personalLinks.length > 0;

  return (
    <div className="mt-4 flex flex-col gap-5">
      {create.length > 0 ? (
        <PinnedActionGroup title="Create" hint="Opens a form here. Nothing leaves the desk.">
          {create.map((action) => (
            <PinnedActionCard key={action.key} action={action} editMode={false} />
          ))}
        </PinnedActionGroup>
      ) : null}
      {hasOpen ? (
        <PinnedActionGroup title="Open" hint="Go to a page or a saved link.">
          {open.map((action) => (
            <PinnedActionCard key={action.key} action={action} editMode={false} />
          ))}
          {personalLinks.map((link) => (
            <PersonalLinkCard
              key={link.id}
              editMode={false}
              link={link}
              onDelete={() => onDeletePersonalLink(link.id)}
            />
          ))}
        </PinnedActionGroup>
      ) : null}
    </div>
  );
}

function PinnedActionGroup({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>
      </div>
      <div className={DASHBOARD_PINNED_GRID_CLASS}>{children}</div>
    </div>
  );
}
