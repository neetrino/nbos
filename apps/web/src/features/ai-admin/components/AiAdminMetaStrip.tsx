import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_ADMIN_ICON_ACCENT_CLASS } from '../ai-admin-ui.constants';

export function AiAdminMetaStrip(props: {
  items: Array<{ icon: LucideIcon; label: string; value: string }>;
}) {
  return (
    <dl className="border-border/60 divide-border/60 divide-y rounded-lg border">
      {props.items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="flex min-w-0 items-center justify-between gap-3 px-3 py-2"
          >
            <dt className="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
              <Icon className={cn('size-3.5 shrink-0', AI_ADMIN_ICON_ACCENT_CLASS)} aria-hidden />
              {item.label}
            </dt>
            <dd className="text-foreground shrink-0 text-xs font-medium">{item.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}
