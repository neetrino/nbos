import { Checkbox } from '@/components/ui/checkbox';
import type { AiCapabilityCatalogItem } from '@/lib/api/ai-admin';
import { cn } from '@/lib/utils';
import { iconForCapabilityKey } from '../ai-admin-icons';
import {
  AI_ADMIN_CAPABILITY_LIST_CLASS,
  AI_ADMIN_DENSE_ROW_CLASS,
  AI_ADMIN_ICON_ACCENT_CLASS,
} from '../ai-admin-ui.constants';

export function AiAdminCapabilityGrantList(props: {
  catalog: AiCapabilityCatalogItem[];
  activeKeys: Set<string>;
  disabled: boolean;
  showDescription?: boolean;
  columns?: 1 | 2;
  onToggle: (key: string, enabled: boolean) => void;
}) {
  return (
    <ul className={cn(AI_ADMIN_CAPABILITY_LIST_CLASS, props.columns === 1 && 'sm:grid-cols-1')}>
      {props.catalog.map((item) => {
        const Icon = iconForCapabilityKey(item.key);
        const active = props.activeKeys.has(item.key);
        return (
          <li
            key={item.key}
            className={cn(
              AI_ADMIN_DENSE_ROW_CLASS,
              'items-start py-2.5',
              active && 'border border-teal-500/20 bg-teal-500/5',
            )}
          >
            <Checkbox
              checked={active}
              disabled={props.disabled}
              className="mt-0.5"
              onCheckedChange={(value) => props.onToggle(item.key, value === true)}
            />
            <Icon
              className={cn('mt-0.5 size-4 shrink-0', AI_ADMIN_ICON_ACCENT_CLASS)}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs font-medium">{item.key}</p>
              {props.showDescription ? (
                <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                  {item.description}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
