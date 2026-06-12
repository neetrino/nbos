'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { priorityClass, type PriorityCard } from '../dashboard-control-registry';

export { MiniAnalytics } from './MiniAnalyticsPanel';

interface PriorityFeedProps {
  priorities: PriorityCard[];
}

export function PriorityFeed({ priorities }: PriorityFeedProps) {
  return (
    <div className="border-border bg-card rounded-2xl border p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h2 className="text-sm font-semibold">Priority feed</h2>
      </div>
      {priorities.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">
          Nothing critical is waiting in the current lightweight feed.
        </p>
      ) : (
        <div className="mt-3 max-h-36 space-y-2 overflow-y-auto pr-1">
          {priorities.map((priority) => (
            <Link
              key={`${priority.source}:${priority.title}`}
              href={priority.href}
              className={`block rounded-xl border px-3 py-2 transition-colors hover:brightness-95 ${priorityClass(
                priority.severity,
              )}`}
            >
              <p className="text-sm font-medium">{priority.title}</p>
              <p className="mt-0.5 text-xs leading-5 opacity-80">{priority.context}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
