import Link from 'next/link';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { resolveBlockerDirectActions } from '@/features/shared/blocker-actions';
import { resolveExtensionStageGateActionHref } from '@/features/projects/utils/projects-hub-stage-gate-blocker-hrefs';
import type { Extension, ExtensionReadinessIssue } from '@/lib/api/extensions';
import type { ExtensionBlocker } from './useExtensionsTabState';

interface ExtensionReadinessProps {
  extension: Extension;
}

export function ExtensionReadiness({ extension }: ExtensionReadinessProps) {
  if (!isStartingExtension(extension)) return null;

  const missing = extension.readiness?.missing ?? [];
  if (missing.length === 0) {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
        <CheckCircle2 size={12} />
        Ready for Development
      </p>
    );
  }

  return (
    <div className="mt-1 flex items-start gap-1 text-xs text-amber-600">
      <AlertTriangle size={12} className="mt-0.5 shrink-0" />
      <span>
        Gate to Development: {missing.map((item) => formatIssueField(item.field)).join(', ')}
      </span>
    </div>
  );
}

function isStartingExtension(extension: Extension) {
  const lifecycle = extension.deliveryLifecycle;
  if (!lifecycle) return extension.status === 'NEW';
  return lifecycle.stage === 'STARTING' && lifecycle.isActive;
}

export function ExtensionBlockerPanel({
  blocker,
  onDismiss,
}: {
  blocker: ExtensionBlocker;
  onDismiss: () => void;
}) {
  const actions = resolveBlockerDirectActions({ context: 'extension', errors: blocker.errors });

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Cannot move {blocker.extensionName}</p>
          <p className="text-muted-foreground mt-1 text-xs">{blocker.message}</p>
        </div>
        <button className="text-muted-foreground text-xs hover:underline" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
      {blocker.errors.length > 0 && <ExtensionReadinessIssues issues={blocker.errors} />}
      <div className="mt-3 flex flex-wrap gap-2">
        {(actions.length > 0
          ? actions
          : [{ key: 'extension-intake', label: 'Open extension on product' }]
        ).map((action) => (
          <Link
            key={action.key}
            href={resolveExtensionStageGateActionHref({
              projectId: blocker.projectId,
              productId: blocker.productId,
              action,
            })}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function ExtensionReadinessIssues({ issues }: { issues: ExtensionReadinessIssue[] }) {
  return (
    <ul className="mt-3 space-y-1">
      {issues.map((issue) => (
        <li key={issue.field} className="text-xs text-amber-700 dark:text-amber-300">
          <span className="font-medium">{formatIssueField(issue.field)}:</span> {issue.message}
        </li>
      ))}
    </ul>
  );
}

function formatIssueField(field: string) {
  const labels: Record<string, string> = {
    description: 'description',
    assignedTo: 'assignee',
    order: 'linked order',
    tasks: 'open tasks',
  };
  return labels[field] ?? field;
}
