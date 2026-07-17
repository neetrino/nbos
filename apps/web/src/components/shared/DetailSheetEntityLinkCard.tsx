import Link from 'next/link';
import { ChevronRight, ExternalLink, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ENTITY_LINK_CARD_CLASS =
  'border-border bg-muted/20 hover:bg-muted/40 group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors';

interface DetailSheetEntityLinkCardBase {
  label: string;
  title: string;
  icon: LucideIcon;
  /** Optional secondary line under the title (counts, meta). */
  description?: string;
  className?: string;
}

type DetailSheetEntityLinkCardProps =
  | (DetailSheetEntityLinkCardBase & { href: string; onOpen?: never })
  | (DetailSheetEntityLinkCardBase & { onOpen: () => void; href?: never });

/** Linked-entity row: sheet open (chevron) or page navigation (external icon). */
export function DetailSheetEntityLinkCard({
  label,
  title,
  description,
  icon: Icon,
  className,
  ...action
}: DetailSheetEntityLinkCardProps) {
  const isPageNav = 'href' in action && Boolean(action.href);
  const TrailingIcon = isPageNav ? ExternalLink : ChevronRight;

  const body = (
    <>
      <div className="bg-muted text-muted-foreground group-hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
        <Icon size={14} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
          {label}
        </p>
        <p className="text-foreground truncate text-sm font-medium">{title}</p>
        {description ? (
          <p className="text-muted-foreground mt-0.5 truncate text-xs">{description}</p>
        ) : null}
      </div>
      <TrailingIcon
        size={14}
        className="text-muted-foreground shrink-0 opacity-60 group-hover:opacity-100"
        aria-hidden
      />
    </>
  );

  if (isPageNav && action.href) {
    return (
      <Link href={action.href} className={cn(ENTITY_LINK_CARD_CLASS, className)}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onOpen} className={cn(ENTITY_LINK_CARD_CLASS, className)}>
      {body}
    </button>
  );
}
