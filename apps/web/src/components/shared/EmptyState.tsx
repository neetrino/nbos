'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="border-border rounded-2xl border border-dashed py-20 text-center">
      <Icon size={48} className="text-muted-foreground/30 mx-auto" />
      <h3 className="text-foreground mt-4 text-lg font-semibold">{title}</h3>
      {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
