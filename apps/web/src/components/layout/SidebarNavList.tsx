'use client';

import { useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ExternalLink, Link2 } from 'lucide-react';
import { PersonalLinkMark } from '@/components/shared/it-brand-mark/PersonalLinkMark';
import { cn } from '@/lib/utils';
import {
  isNavChildLink,
  type NavModuleDefinition,
  type NavQuickAction,
} from '@/lib/navigation/nav-config';
import type { DashboardPersonalLink } from '@/lib/api/dashboard';
import { writeModuleLastVisitFromPathname } from '@/lib/navigation/module-last-visit';
import { isNavChildLinkActive } from '@/lib/navigation/nav-route-utils';
import { useUnsortedTaskCreate } from '@/features/tasks/components/UnsortedTaskCreateProvider';
import { SidebarModuleNavRow } from './SidebarModuleNavRow';

interface SidebarNavListProps {
  collapsed: boolean;
  primaryItems: NavModuleDefinition[];
  hiddenItems: NavModuleDefinition[];
  personalLinks: DashboardPersonalLink[];
  moreExpanded: boolean;
  onToggleMore: () => void;
}

export function SidebarNavList({
  collapsed,
  primaryItems,
  hiddenItems,
  personalLinks,
  moreExpanded,
  onToggleMore,
}: SidebarNavListProps) {
  const pathname = usePathname();
  const { openUnsortedTaskCreate } = useUnsortedTaskCreate();

  useLayoutEffect(() => {
    writeModuleLastVisitFromPathname(pathname);
  }, [pathname]);

  const [manualExpanded, setManualExpanded] = useState<{ key: string; pathname: string } | null>(
    null,
  );

  const activeSectionKey =
    primaryItems
      .concat(hiddenItems)
      .find(
        (item) =>
          item.children?.some(
            (child) => isNavChildLink(child) && isNavChildLinkActive(pathname, child, item.key),
          ) ?? false,
      )?.key ?? null;

  const expandedKey = manualExpanded?.pathname === pathname ? manualExpanded.key : activeSectionKey;

  const toggleExpanded = (key: string) => {
    setManualExpanded((current) =>
      current?.key === key && current.pathname === pathname ? null : { key, pathname },
    );
  };

  const expandOnly = (key: string) => {
    setManualExpanded({ key, pathname });
  };

  const [linksExpanded, setLinksExpanded] = useState(false);

  const handleQuickAction = (action: NavQuickAction) => {
    if (action === 'create-unsorted-task') {
      openUnsortedTaskCreate();
    }
  };

  return (
    <ul className="space-y-0">
      {primaryItems.map((item) => (
        <SidebarModuleNavRow
          key={item.key}
          item={item}
          collapsed={collapsed}
          pathname={pathname}
          expanded={expandedKey === item.key}
          onToggleExpanded={() => toggleExpanded(item.key)}
          onExpandOnly={() => expandOnly(item.key)}
          onQuickAction={handleQuickAction}
        />
      ))}

      {personalLinks.length > 0 && !collapsed && (
        <li className="pt-1">
          <button
            type="button"
            onClick={() => setLinksExpanded((value) => !value)}
            className="text-sidebar-muted hover:text-sidebar-foreground flex w-full items-center justify-between rounded-md px-2 py-1 text-[13px] font-medium"
          >
            <span className="flex items-center gap-2">
              <Link2 size={16} className="shrink-0 opacity-80" />
              My Links
            </span>
            <ChevronLeft
              size={14}
              className={cn('transition-transform', linksExpanded && '-rotate-90')}
            />
          </button>
          {linksExpanded && (
            <ul className="mt-0.5 space-y-0.5">
              {personalLinks.map((link) => (
                <PersonalLinkRow key={link.id} link={link} />
              ))}
            </ul>
          )}
        </li>
      )}

      {hiddenItems.length > 0 && (
        <li className="pt-2">
          {collapsed ? (
            <button
              type="button"
              title="More / Hidden"
              onClick={onToggleMore}
              className="text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground flex w-full justify-center rounded-md px-2 py-1 text-sm"
            >
              ···
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onToggleMore}
                className="text-sidebar-muted hover:text-sidebar-foreground flex w-full items-center justify-between rounded-md px-2 py-1 text-[11px] font-semibold tracking-wide uppercase"
              >
                <span>More / Hidden</span>
                <ChevronLeft
                  size={14}
                  className={cn('transition-transform', moreExpanded && '-rotate-90')}
                />
              </button>
              {moreExpanded && (
                <ul className="mt-1 space-y-0.5">
                  {hiddenItems.map((item) => (
                    <SidebarModuleNavRow
                      key={item.key}
                      item={item}
                      collapsed={collapsed}
                      pathname={pathname}
                      expanded={expandedKey === item.key}
                      onToggleExpanded={() => toggleExpanded(item.key)}
                      onExpandOnly={() => expandOnly(item.key)}
                      onQuickAction={handleQuickAction}
                      muted
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </li>
      )}
    </ul>
  );
}

function PersonalLinkRow({ link }: { link: DashboardPersonalLink }) {
  const className =
    'text-sidebar-muted hover:text-sidebar-foreground flex items-center gap-2 rounded-md px-3 py-1 text-[13px] transition-colors';

  if (link.isExternal) {
    return (
      <li>
        <a
          href={link.url}
          target={link.openInNewTab ? '_blank' : undefined}
          rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
          className={className}
        >
          <PersonalLinkMark url={link.url} label={link.label} className="size-3.5 shrink-0" />
          <span className="truncate">{link.label}</span>
          <ExternalLink size={14} className="shrink-0 opacity-70" />
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link href={link.url} className={className}>
        <PersonalLinkMark url={link.url} label={link.label} className="size-3.5 shrink-0" />
        <span className="truncate">{link.label}</span>
      </Link>
    </li>
  );
}
