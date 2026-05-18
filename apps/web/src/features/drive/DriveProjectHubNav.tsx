'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  DriveProjectHubSection,
  DriveProjectHubView,
  ProjectDriveHubSummary,
} from './drive-project-hub-view';
import { projectHubSectionNeedsFocus } from './drive-project-hub-view';

type DriveProjectHubNavProps = {
  summary: ProjectDriveHubSummary | null;
  view: DriveProjectHubView;
  onViewChange: (view: DriveProjectHubView) => void;
};

type HubTab = {
  section: DriveProjectHubSection;
  label: string;
};

function buildTabs(): HubTab[] {
  return [
    { section: 'deals', label: 'Deals' },
    { section: 'products', label: 'Products' },
    { section: 'tasks', label: 'Tasks' },
    { section: 'finance', label: 'Finance' },
  ];
}

function focusRows(section: DriveProjectHubSection, summary: ProjectDriveHubSummary | null) {
  if (!summary) return [];
  if (section === 'deals') return summary.deals;
  if (section === 'products') return summary.products;
  if (section === 'tasks') return summary.tasks;
  if (section === 'finance') return summary.invoices;
  return [];
}

export function DriveProjectHubNav({ summary, view, onViewChange }: DriveProjectHubNavProps) {
  const tabs = buildTabs();
  const rows = focusRows(view.section, summary);
  const showFocus = projectHubSectionNeedsFocus(view.section);
  const foldersActive = view.section === 'folders';

  return (
    <div className="space-y-2" role="navigation" aria-label="Project library sections">
      <div className="flex flex-wrap gap-1.5">
        <HubTabButton
          active={foldersActive}
          label="Folders"
          onClick={() => onViewChange({ section: 'folders' })}
        />
        {tabs.map((tab) => (
          <HubTabButton
            key={tab.section}
            active={view.section === tab.section}
            label={tab.label}
            onClick={() =>
              onViewChange({
                section: tab.section,
                focusEntityId:
                  view.section === tab.section && projectHubSectionNeedsFocus(tab.section)
                    ? view.focusEntityId
                    : undefined,
              })
            }
          />
        ))}
      </div>
      {showFocus ? (
        <div className="flex flex-wrap gap-1.5">
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-xs">No linked records in this section yet.</p>
          ) : (
            rows.map((row) => (
              <HubTabButton
                key={row.id}
                active={view.focusEntityId === row.id}
                label={row.label}
                count={row.fileCount}
                compact
                onClick={() => onViewChange({ section: view.section, focusEntityId: row.id })}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function HubTabButton({
  active,
  label,
  count,
  compact,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  compact?: boolean;
  onClick: () => void;
}) {
  const suffix = count !== undefined ? ` (${count})` : '';
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'outline'}
      size={compact ? 'sm' : 'default'}
      className={cn('h-8 rounded-full', compact && 'text-xs')}
      onClick={onClick}
    >
      {label}
      {suffix}
    </Button>
  );
}
