import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AI_ADMIN_ICON_ACCENT_CLASS } from '../ai-admin-ui.constants';

export function AiAdminPageToolbar(props: {
  icon: LucideIcon;
  description: ReactNode;
  actions?: ReactNode;
}) {
  const Icon = props.icon;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <p className="text-muted-foreground flex min-w-0 items-start gap-2.5 text-sm leading-relaxed">
        <Icon className={cn('mt-0.5 size-4 shrink-0', AI_ADMIN_ICON_ACCENT_CLASS)} aria-hidden />
        <span>{props.description}</span>
      </p>
      {props.actions ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {props.actions}
        </div>
      ) : null}
    </div>
  );
}
