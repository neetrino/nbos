'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  {
    label: 'CRM',
    href: '/crm',
    icon: <Users size={20} />,
    children: [
      { label: 'Leads', href: '/crm/leads' },
      { label: 'Deals', href: '/crm/deals' },
    ],
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: <FolderKanban size={20} />,
    children: [
      { label: 'All Projects', href: '/projects' },
      { label: 'Development', href: '/projects?filter=development' },
      { label: 'Maintenance', href: '/projects?filter=maintenance' },
    ],
  },
  { label: 'Tasks', href: '/tasks', icon: <CheckSquare size={20} /> },
  {
    label: 'Finance',
    href: '/finance',
    icon: <DollarSign size={20} />,
    children: [
      { label: 'Invoices', href: '/finance/invoices' },
      { label: 'Payments', href: '/finance/payments' },
      { label: 'Subscriptions', href: '/finance/subscriptions' },
      { label: 'Expenses', href: '/finance/expenses' },
      { label: 'Bonus Board', href: '/finance/bonus' },
    ],
  },
  { label: 'Support', href: '/support', icon: <Headphones size={20} /> },
  {
    label: 'Clients',
    href: '/clients',
    icon: <Building2 size={20} />,
    children: [
      { label: 'Companies', href: '/clients/companies' },
      { label: 'Contacts', href: '/clients/contacts' },
    ],
  },
  { label: 'Partners', href: '/partners', icon: <Handshake size={20} /> },
  { label: 'Messenger', href: '/messenger', icon: <MessageCircle size={20} /> },
  { label: 'Calendar', href: '/calendar', icon: <Calendar size={20} /> },
  { label: 'Drive', href: '/drive', icon: <HardDrive size={20} /> },
  { label: 'Credentials', href: '/credentials', icon: <KeyRound size={20} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={20} /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[260px]',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <span className="text-sm font-bold text-accent-foreground">N</span>
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">NBOS</span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <span className="text-sm font-bold text-accent-foreground">N</span>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="border-b border-sidebar-border px-3 py-3">
          <button className="flex w-full items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/80">
            <Search size={16} />
            <span>Search...</span>
            <kbd className="ml-auto rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium">
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const expanded = expandedItems.has(item.label);

            return (
              <li key={item.label}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => toggleExpanded(item.label)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-sidebar-accent text-sidebar-foreground'
                          : 'text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground',
                        collapsed && 'justify-center px-2',
                      )}
                    >
                      {item.icon}
                      {!collapsed && (
                        <>
                          <span>{item.label}</span>
                          <ChevronLeft
                            size={14}
                            className={cn(
                              'ml-auto transition-transform',
                              expanded && '-rotate-90',
                            )}
                          />
                        </>
                      )}
                    </button>
                    {!collapsed && expanded && (
                      <ul className="ml-8 mt-1 space-y-0.5">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                'block rounded-md px-3 py-1.5 text-sm transition-colors',
                                pathname === child.href
                                  ? 'font-medium text-sidebar-foreground'
                                  : 'text-sidebar-muted hover:text-sidebar-foreground',
                              )}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
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
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm text-sidebar-muted transition-colors hover:bg-secondary hover:text-sidebar-foreground"
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
