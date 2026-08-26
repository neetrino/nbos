import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_ADMIN_ICON_ACCENT_CLASS } from '../ai-admin-ui.constants';

export function AiAdminMetaStrip(props: {
  items: Array<{ icon: LucideIcon; label: string; value: string }>;
}) {
  return (
    <dl className="grid grid-cols-2 gap-2">
      {props.items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="border-border/60 bg-muted/20 min-w-0 rounded-lg border px-3 py-2.5"
          >
            <dt className="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
              <Icon className={cn('size-4 shrink-0', AI_ADMIN_ICON_ACCENT_CLASS)} aria-hidden />
              <span className="truncate">{item.label}</span>
            </dt>
            <dd
              className="text-foreground mt-1.5 truncate text-sm font-medium"
              title={item.value}
            >
              {item.value}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
