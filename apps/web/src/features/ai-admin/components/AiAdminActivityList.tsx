import { History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { asActivityItems } from '../activity';
import { AI_ADMIN_DENSE_ROW_CLASS, AI_ADMIN_ICON_ACCENT_CLASS } from '../ai-admin-ui.constants';
import { formatTimestamp, shortId } from '../format';

export function AiAdminActivityList(props: { items: unknown }) {
  const rows = asActivityItems(props.items);
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm leading-relaxed">No activity yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {rows.map((item) => (
        <li key={item.id} className={AI_ADMIN_DENSE_ROW_CLASS}>
          <History className={cn('size-4 shrink-0', AI_ADMIN_ICON_ACCENT_CLASS)} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{item.action}</p>
            <p className="text-muted-foreground text-xs">
              {item.entityType} · {shortId(item.entityId)}
              {item.actor?.displayName ? ` · ${item.actor.displayName}` : ''}
            </p>
          </div>
          <span className="text-muted-foreground shrink-0 text-xs">
            {formatTimestamp(item.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
