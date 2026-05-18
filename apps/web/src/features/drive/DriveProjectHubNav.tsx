'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  DriveProjectHubSection,
  DriveProjectHubView,
  ProjectDriveHubSummary,
  ProjectHubClientRow,
  ProjectHubEntityRow,
} from './drive-project-hub-view';
import { productHubExtensions, projectHubSectionNeedsFocus } from './drive-project-hub-view';

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
    { section: 'client', label: 'Client' },
    { section: 'tasks', label: 'Tasks' },
    { section: 'finance', label: 'Finance' },
  ];
}

function focusRows(
  section: DriveProjectHubSection,
  summary: ProjectDriveHubSummary | null,
): ProjectHubEntityRow[] {
  if (!summary) return [];
  if (section === 'deals') return summary.deals;
  if (section === 'products') return summary.products;
  if (section === 'client') return summary.client;
  if (section === 'tasks') return summary.tasks;
  if (section === 'finance') return summary.invoices;
  return [];
}

export function DriveProjectHubNav({ summary, view, onViewChange }: DriveProjectHubNavProps) {
  const tabs = buildTabs();
  const rows = focusRows(view.section, summary);
  const showFocus = projectHubSectionNeedsFocus(view.section);
  const foldersActive = view.section === 'folders';
  const extensionRows =
    view.section === 'products' && summary ? productHubExtensions(summary, view.focusEntityId) : [];

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
                focusExtensionId: undefined,
              })
            }
          />
        ))}
      </div>
      {showFocus ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {rows.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                No linked records in this section yet.
              </p>
            ) : (
              rows.map((row) => (
                <HubTabButton
                  key={row.id}
                  active={view.focusEntityId === row.id && !view.focusExtensionId}
                  label={clientChipLabel(view.section, row)}
                  count={row.fileCount}
                  compact
                  onClick={() =>
                    onViewChange({
                      section: view.section,
                      focusEntityId: row.id,
                      focusExtensionId: undefined,
                    })
                  }
                />
              ))
            )}
          </div>
          {extensionRows.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground text-xs font-medium">Extensions</span>
              {extensionRows.map((row) => (
                <HubTabButton
                  key={row.id}
                  active={view.focusExtensionId === row.id}
                  label={row.label}
                  count={row.fileCount}
                  compact
                  onClick={() =>
                    onViewChange({
                      section: 'products',
                      focusEntityId: view.focusEntityId,
                      focusExtensionId: row.id,
                    })
                  }
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function clientChipLabel(section: DriveProjectHubSection, row: ProjectHubEntityRow): string {
  if (section !== 'client') return row.label;
  const clientRow = row as ProjectHubClientRow;
  const prefix = clientRow.entityType === 'COMPANY' ? 'Company' : 'Contact';
  return `${prefix}: ${row.label}`;
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
