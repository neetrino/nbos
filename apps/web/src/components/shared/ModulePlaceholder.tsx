'use client';

import type { LucideIcon } from 'lucide-react';
import { EmptyState, PageHeader } from '@/components/shared';

interface ModulePlaceholderProps {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  icon: LucideIcon;
}

export function ModulePlaceholder({
  title,
  description,
  emptyTitle,
  emptyDescription,
  icon,
}: ModulePlaceholderProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={description} />
      <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />
    </div>
  );
}
