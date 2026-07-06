import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  Link2,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  financeReportStatusClass,
  financeReportStatusLabel,
} from '@/features/finance/constants/finance-report-status';
import type { FinanceReportDefinition } from '@/lib/api/finance-reports';

const DEFINITION_PANEL_SHELL =
  'border-border/70 flex h-full flex-col rounded-xl border bg-white p-4 dark:bg-white';

const DEFINITION_ICON_SHELL =
  'flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300';

export function FinanceReportDefinitionCard({
  definition,
}: {
  definition: FinanceReportDefinition;
}) {
  return (
    <article className="border-border bg-card flex h-full flex-col rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-foreground text-lg font-semibold">{definition.title}</p>
          <p className="text-muted-foreground mt-1 text-sm">{definition.description}</p>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            financeReportStatusClass(definition.v1Status),
          )}
        >
          {renderReportStatusIcon(definition.v1Status)}
          {financeReportStatusLabel(definition.v1Status)}
        </span>
      </div>

      <div className="mt-5 grid flex-1 grid-cols-2 items-stretch gap-3">
        <DefinitionPanelTile icon={Target} title="Phase 3 scope">
          <p className="text-foreground text-sm leading-snug">{definition.phase3Scope}</p>
        </DefinitionPanelTile>
        <DefinitionPanelTile icon={Clock3} title="Phase 6 deferred">
          <p className="text-foreground text-sm leading-snug">{definition.phase6Deferred}</p>
        </DefinitionPanelTile>

        <DefinitionPanelTile icon={Users} title="Audience">
          <ul className="space-y-1">
            {definition.audience.map((line) => (
              <li key={line} className="text-foreground text-sm">
                {line}
              </li>
            ))}
          </ul>
        </DefinitionPanelTile>
        {definition.aggregateEndpoint ? (
          <DefinitionPanelTile icon={Link2} title="Aggregate endpoint">
            <EndpointPill path={definition.aggregateEndpoint} />
          </DefinitionPanelTile>
        ) : null}

        <DefinitionPanelTile icon={Database} title="Source endpoints" className="col-span-2">
          <div className="grid grid-cols-2 gap-2">
            {definition.sourceEndpoints.map((path) => (
              <EndpointPill key={path} path={path} />
            ))}
          </div>
        </DefinitionPanelTile>
      </div>

      {definition.drillDownHrefs.length > 0 ? (
        <div className="mt-4">
          <p className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wide uppercase">
            Quick links
          </p>
          <div className="flex flex-wrap gap-2">
            {definition.drillDownHrefs.map((href) => (
              <Link
                key={href}
                href={href}
                className="border-border/70 text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-medium transition-colors dark:bg-white"
              >
                {href}
                <ArrowUpRight size={12} aria-hidden />
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function DefinitionPanelTile({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(DEFINITION_PANEL_SHELL, className)}>
      <div className="flex items-center gap-2">
        <div className={DEFINITION_ICON_SHELL}>
          <Icon size={14} aria-hidden />
        </div>
        <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
          {title}
        </p>
      </div>
      <div className="mt-3 min-w-0 flex-1">{children}</div>
    </div>
  );
}

function EndpointPill({ path }: { path: string }) {
  return (
    <div className="bg-muted/45 text-foreground rounded-lg px-3 py-2 font-mono text-xs leading-snug break-all">
      {path}
    </div>
  );
}

function renderReportStatusIcon(status: FinanceReportDefinition['v1Status']): ReactNode {
  if (status === 'definition_ready') {
    return <CheckCircle2 size={12} aria-hidden />;
  }
  return <CircleAlert size={12} aria-hidden />;
}
