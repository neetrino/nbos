'use client';

import type { LucideIcon } from 'lucide-react';

interface DetailSheetPlaceholderTabProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function DetailSheetPlaceholderTab({
  title,
  description,
  icon: Icon,
}: DetailSheetPlaceholderTabProps) {
  return (
    <div className="border-border bg-muted/20 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-16 text-center">
      <Icon className="text-muted-foreground size-10" aria-hidden />
      <div className="max-w-sm space-y-1">
        <p className="text-foreground text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}
