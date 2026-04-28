import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Extension, ExtensionReadinessIssue } from '@/lib/api/extensions';
import type { ExtensionBlocker } from './useExtensionsTabState';

interface ExtensionReadinessProps {
  extension: Extension;
}

export function ExtensionReadiness({ extension }: ExtensionReadinessProps) {
  if (extension.status !== 'NEW') return null;

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
    <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
      <AlertTriangle size={12} />
      Missing: {missing.map((item) => item.field).join(', ')}
    </p>
  );
}

export function ExtensionBlockerPanel({
  blocker,
  onDismiss,
}: {
  blocker: ExtensionBlocker;
  onDismiss: () => void;
}) {
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
    </div>
  );
}

function ExtensionReadinessIssues({ issues }: { issues: ExtensionReadinessIssue[] }) {
  return (
    <ul className="mt-3 space-y-1">
      {issues.map((issue) => (
        <li key={issue.field} className="text-xs text-amber-700 dark:text-amber-300">
          <span className="font-medium">{issue.field}:</span> {issue.message}
        </li>
      ))}
    </ul>
  );
}
