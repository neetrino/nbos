'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  LayoutDashboard,
  Users,
  Users2,
  FolderKanban,
  CheckSquare,
  DollarSign,
  Headphones,
  Building2,
  Handshake,
  MessageCircle,
  Calendar,
  HardDrive,
  KeyRound,
  Settings,
  ChevronLeft,
  Search,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermission } from '@/lib/permissions';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission?: PermissionRequirement;
  children?: NavChildItem[];
}

interface NavChildItem {
  label: string;
  href: string;
  permission?: PermissionRequirement;
}

interface VisibleNavItem extends NavItem {
  children?: NavChildItem[];
}

interface PermissionRequirement {
  module: string;
  action: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  {
    label: 'Reports / Analytics',
    href: '/reports',
    icon: <BarChart3 size={20} />,
    permission: { module: 'DASHBOARDS', action: 'VIEW' },
  },
  {
    label: 'CRM',
    href: '/crm',
    icon: <Users size={20} />,
    permission: { module: 'CRM_LEADS', action: 'VIEW' },
    children: [
      {
        label: 'Dashboard',
        href: '/crm/dashboard',
        permission: { module: 'CRM_LEADS', action: 'VIEW' },
      },
      { label: 'Leads', href: '/crm/leads', permission: { module: 'CRM_LEADS', action: 'VIEW' } },
      { label: 'Deals', href: '/crm/deals', permission: { module: 'CRM_DEALS', action: 'VIEW' } },
      {
        label: 'CRM Client Chats',
        href: '/messenger?scope=crm',
        permission: { module: 'MESSENGER', action: 'VIEW' },
      },
      {
        label: 'Sales Reports / Analytics',
        href: '/reports?module=crm',
        permission: { module: 'CRM_DEALS', action: 'VIEW' },
      },
    ],
  },
  {
    label: 'Marketing',
    href: '/marketing',
    icon: <Megaphone size={20} />,
    permission: { module: 'CRM_LEADS', action: 'VIEW' },
    children: [
      { label: 'Marketing Board', href: '/marketing' },
      { label: 'Attribution Review', href: '/marketing/attribution' },
      { label: 'Marketing Dashboard', href: '/marketing/dashboard' },
      { label: 'Marketing Settings', href: '/marketing/settings' },
    ],
  },
  {
    label: 'Project Hub',
    href: '/projects',
    icon: <FolderKanban size={20} />,
    permission: { module: 'PROJECTS', action: 'VIEW' },
  },
  {
    label: 'Tasks',
    href: '/tasks',
    icon: <CheckSquare size={20} />,
    permission: { module: 'TASKS', action: 'VIEW' },
  },
  {
    label: 'Finance',
    href: '/finance',
    icon: <DollarSign size={20} />,
    permission: { module: 'FINANCE_INVOICES', action: 'VIEW' },
    children: [
      {
        label: 'Dashboard',
        href: '/finance/dashboard',
        permission: { module: 'FINANCE_INVOICES', action: 'VIEW' },
      },
      {
        label: 'Invoices',
        href: '/finance/invoices',
        permission: { module: 'FINANCE_INVOICES', action: 'VIEW' },
      },
      {
        label: 'Payments',
        href: '/finance/payments',
        permission: { module: 'FINANCE_PAYMENTS', action: 'VIEW' },
      },
      {
        label: 'Subscriptions',
        href: '/finance/subscriptions',
        permission: { module: 'FINANCE_SUBSCRIPTIONS', action: 'VIEW' },
      },
      {
        label: 'Expenses',
        href: '/finance/expenses',
        permission: { module: 'FINANCE_EXPENSES', action: 'VIEW' },
      },
      {
        label: 'Orders',
        href: '/finance/orders',
        permission: { module: 'ORDERS', action: 'VIEW' },
      },
    ],
  },
  {
    label: 'Support',
    href: '/support',
    icon: <Headphones size={20} />,
    permission: { module: 'SUPPORT_TICKETS', action: 'VIEW' },
  },
  {
    label: 'Clients',
    href: '/clients',
    icon: <Building2 size={20} />,
    children: [
      { label: 'Companies', href: '/clients/companies' },
      { label: 'Contacts', href: '/clients/contacts' },
    ],
  },
  {
    label: 'Partners',
    href: '/partners',
    icon: <Handshake size={20} />,
    permission: { module: 'PARTNERS', action: 'VIEW' },
  },
  {
    label: 'My Company',
    href: '/my-company',
    icon: <Users2 size={20} />,
    permission: { module: 'COMPANY', action: 'VIEW' },
    children: [
      {
        label: 'Org Structure',
        href: '/my-company',
        permission: { module: 'COMPANY', action: 'VIEW' },
      },
      {
        label: 'Team',
        href: '/my-company/team',
        permission: { module: 'COMPANY', action: 'VIEW' },
      },
      {
        label: 'Departments',
        href: '/my-company/departments',
        permission: { module: 'COMPANY', action: 'VIEW' },
      },
      {
        label: 'Roles & Seats',
        href: '/my-company/roles-seats',
        permission: { module: 'COMPANY', action: 'VIEW' },
      },
      {
        label: 'Compensation',
        href: '/my-company/compensation',
        permission: { module: 'FINANCE_SALARY', action: 'VIEW' },
      },
      {
        label: 'KPI / Scorecard',
        href: '/my-company/kpi',
        permission: { module: 'DASHBOARDS', action: 'VIEW' },
      },
      {
        label: 'SOP & Templates',
        href: '/my-company/sop',
        permission: { module: 'COMPANY', action: 'VIEW' },
      },
    ],
  },
  {
    label: 'Messenger',
    href: '/messenger',
    icon: <MessageCircle size={20} />,
    permission: { module: 'MESSENGER', action: 'VIEW' },
  },
  {
    label: 'Calendar',
    href: '/calendar',
    icon: <Calendar size={20} />,
    permission: { module: 'CALENDAR', action: 'VIEW' },
  },
  {
    label: 'Drive',
    href: '/drive',
    icon: <HardDrive size={20} />,
    permission: { module: 'DRIVE', action: 'VIEW' },
  },
  {
    label: 'Credentials',
    href: '/credentials',
    icon: <KeyRound size={20} />,
    permission: { module: 'CREDENTIALS', action: 'VIEW' },
  },
  {
    label: 'Settings / Admin',
    href: '/settings',
    icon: <Settings size={20} />,
    children: [
      { label: 'General', href: '/settings', permission: { module: 'COMPANY', action: 'EDIT' } },
      {
        label: 'System Lists',
        href: '/settings/lists',
        permission: { module: 'COMPANY', action: 'EDIT' },
      },
      {
        label: 'Permissions / RBAC',
        href: '/settings/roles',
        permission: { module: 'COMPANY', action: 'ADD' },
      },
      {
        label: 'Module Settings',
        href: '/settings/module-settings',
        permission: { module: 'COMPANY', action: 'EDIT' },
      },
      {
        label: 'Integrations',
        href: '/settings/integrations',
        permission: { module: 'COMPANY', action: 'EDIT' },
      },
      {
        label: 'Security',
        href: '/settings/security',
        permission: { module: 'COMPANY', action: 'EDIT' },
      },
      {
        label: 'Feature Flags',
        href: '/settings/feature-flags',
        permission: { module: 'COMPANY', action: 'EDIT' },
      },
      {
        label: 'Audit Log',
        href: '/settings/audit-log',
        permission: { module: 'AUDIT_LOGS', action: 'VIEW' },
      },
    ],
  },
];

function getPathFromHref(href: string): string {
  return href.split('?')[0] ?? href;
}

function isChildRouteActive(pathname: string, childHref: string): boolean {
  const path = getPathFromHref(childHref);
  return pathname === path || pathname.startsWith(`${path}/`);
}

function getFirstChildHref(item: VisibleNavItem): string {
  return item.children?.[0]?.href ?? item.href;
}

function hasPermission(
  permission: PermissionRequirement | undefined,
  can: (action: string, module: string) => boolean,
): boolean {
  if (!permission) return true;
  return can(permission.action, permission.module);
}

function getVisibleNavItems(
  can: (action: string, module: string) => boolean,
  isLoading: boolean,
): VisibleNavItem[] {
  if (isLoading) return NAV_ITEMS;

  return NAV_ITEMS.reduce<VisibleNavItem[]>((items, item) => {
    const visibleChildren = item.children?.filter((child) => hasPermission(child.permission, can));
    const itemAllowed = hasPermission(item.permission, can);
    const hasVisibleChildren = visibleChildren !== undefined && visibleChildren.length > 0;
    const hasChildrenWithoutOwnPermission =
      item.children !== undefined && item.permission === undefined;

    if (!itemAllowed && !hasVisibleChildren) {
      return items;
    }

    if (hasChildrenWithoutOwnPermission && !hasVisibleChildren) {
      return items;
    }

    items.push({ ...item, children: hasVisibleChildren ? visibleChildren : undefined });
    return items;
  }, []);
}

export function Sidebar() {
  const pathname = usePathname();
  const { can, isLoading: permsLoading } = usePermission();
  const [collapsed, setCollapsed] = useState(false);
  /** At most one section with children is expanded (accordion). */
  const [manualExpandedSection, setManualExpandedSection] = useState<string | null>(null);

  const visibleItems = getVisibleNavItems(can, permsLoading);

  const activeSection =
    visibleItems.find(
      (item) =>
        item.children && item.children.some((child) => isChildRouteActive(pathname, child.href)),
    )?.label ?? null;

  const expandedSection = manualExpandedSection ?? activeSection;

  const toggleExpanded = (label: string) => {
    setManualExpandedSection((current) => (current === label ? null : label));
  };

  const expandOnly = (label: string) => {
    setManualExpandedSection(label);
  };

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside
      className={cn(
        'border-sidebar-border bg-sidebar fixed top-0 left-0 z-40 flex h-screen flex-col border-r transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[260px]',
      )}
    >
      {/* Logo */}
      <div className="border-sidebar-border flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center">
            <Image src="/logo/logo.svg" alt="NBOS" width={140} height={24} className="h-6 w-auto" />
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center">
            <Image src="/logo/icon.png" alt="NBOS" width={32} height={32} className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="border-sidebar-border border-b px-3 py-3">
          <button className="bg-secondary text-muted-foreground hover:bg-secondary/80 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors">
            <Search size={16} />
            <span>Search...</span>
            <kbd className="border-border bg-background ml-auto rounded border px-1.5 py-0.5 text-[10px] font-medium">
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const active = isActive(item.href);
            const expanded = expandedSection === item.label;
            const firstChildHref = getFirstChildHref(item);

            return (
              <li key={item.label}>
                {item.children ? (
                  <>
                    {collapsed ? (
                      <Link
                        href={firstChildHref}
                        onClick={() => expandOnly(item.label)}
                        title={item.label}
                        className={cn(
                          'flex w-full items-center justify-center rounded-lg px-2 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-sidebar-accent text-sidebar-foreground'
                            : 'text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground',
                        )}
                      >
                        {item.icon}
                      </Link>
                    ) : (
                      <div
                        className={cn(
                          'flex w-full items-stretch gap-0 overflow-hidden rounded-lg',
                          active && 'bg-sidebar-accent text-sidebar-foreground',
                        )}
                      >
                        <Link
                          href={firstChildHref}
                          onClick={() => expandOnly(item.label)}
                          className={cn(
                            'flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-sm font-medium transition-colors',
                            active
                              ? 'text-sidebar-foreground'
                              : 'text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground',
                          )}
                        >
                          {item.icon}
                          <span className="truncate">{item.label}</span>
                        </Link>
                        <button
                          type="button"
                          aria-expanded={expanded}
                          aria-label={expanded ? 'Collapse submenu' : 'Expand submenu'}
                          onClick={(e) => {
                            e.preventDefault();
                            toggleExpanded(item.label);
                          }}
                          className={cn(
                            'text-sidebar-muted hover:text-sidebar-foreground flex shrink-0 items-center px-2 transition-colors',
                            active && 'text-sidebar-foreground',
                          )}
                        >
                          <ChevronLeft
                            size={14}
                            className={cn('transition-transform', expanded && '-rotate-90')}
                          />
                        </button>
                      </div>
                    )}
                    {!collapsed && expanded && (
                      <ul className="mt-1 ml-8 space-y-0.5">
                        {item.children.map((child) => {
                          const childPath = getPathFromHref(child.href);
                          const childActive =
                            pathname === childPath || pathname.startsWith(`${childPath}/`);
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={cn(
                                  'block rounded-md px-3 py-1.5 text-sm transition-colors',
                                  childActive
                                    ? 'text-sidebar-foreground font-medium'
                                    : 'text-sidebar-muted hover:text-sidebar-foreground',
                                )}
                              >
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-sidebar-accent text-sidebar-foreground'
                        : 'text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground',
                      collapsed && 'justify-center px-2',
                    )}
                  >
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-sidebar-border border-t p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm transition-colors"
        >
          <ChevronLeft
            size={18}
            className={cn('transition-transform', collapsed && 'rotate-180')}
          />
          {!collapsed && <span className="ml-2">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
