import { formatTimestamp } from '../format';
import { asActivityItems } from '../activity';

export function AiAdminActivityList(props: { items: unknown }) {
  const rows = asActivityItems(props.items);
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">No activity yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {rows.map((item) => (
        <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="font-mono text-xs">{item.action}</p>
            <p className="text-muted-foreground text-xs">
              {item.entityType} · {item.entityId.slice(0, 8)}
              {item.actor?.displayName ? ` · ${item.actor.displayName}` : ''}
            </p>
          </div>
          <span className="text-muted-foreground text-xs">{formatTimestamp(item.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}
