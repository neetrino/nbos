'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
  LogOut,
} from 'lucide-react';
import { useClerk, useUser } from '@clerk/nextjs';
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
      { label: 'Dashboard', href: '/crm/dashboard' },
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
      { label: 'Dashboard', href: '/finance/dashboard' },
      { label: 'Invoices', href: '/finance/invoices' },
      { label: 'Payments', href: '/finance/payments' },
      { label: 'Subscriptions', href: '/finance/subscriptions' },
      { label: 'Expenses', href: '/finance/expenses' },
      { label: 'Orders', href: '/finance/orders' },
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
  { label: 'Team', href: '/team', icon: <Users2 size={20} /> },
  { label: 'Messenger', href: '/messenger', icon: <MessageCircle size={20} /> },
  { label: 'Calendar', href: '/calendar', icon: <Calendar size={20} /> },
  { label: 'Drive', href: '/drive', icon: <HardDrive size={20} /> },
  { label: 'Credentials', href: '/credentials', icon: <KeyRound size={20} /> },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings size={20} />,
    children: [
      { label: 'General', href: '/settings' },
      { label: 'Lists', href: '/settings/lists' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (pathname.startsWith('/settings')) {
      setExpandedItems((prev) => new Set(prev).add('Settings'));
    }
  }, [pathname]);

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
        'border-sidebar-border bg-sidebar fixed top-0 left-0 z-40 flex h-screen flex-col border-r transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[260px]',
      )}
    >
      {/* Logo */}
      <div className="border-sidebar-border flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-accent flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="text-accent-foreground text-sm font-bold">N</span>
            </div>
            <span className="text-sidebar-foreground text-lg font-semibold">NBOS</span>
          </Link>
        )}
        {collapsed && (
          <div className="bg-accent mx-auto flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-accent-foreground text-sm font-bold">N</span>
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
                            className={cn('ml-auto transition-transform', expanded && '-rotate-90')}
                          />
                        </>
                      )}
                    </button>
                    {!collapsed && expanded && (
                      <ul className="mt-1 ml-8 space-y-0.5">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                'block rounded-md px-3 py-1.5 text-sm transition-colors',
                                pathname === child.href
                                  ? 'text-sidebar-foreground font-medium'
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

      {/* User + Sign Out */}
      <div className="border-sidebar-border border-t px-3 py-3">
        {!collapsed && user && (
          <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="bg-accent text-accent-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              {user.firstName?.[0] ??
                user.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() ??
                'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sidebar-foreground truncate text-sm font-medium">
                {user.fullName ?? user.emailAddresses[0]?.emailAddress ?? 'User'}
              </p>
              <p className="text-sidebar-muted truncate text-[10px]">
                {user.emailAddresses[0]?.emailAddress ?? ''}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ redirectUrl: '/sign-in' })}
          className="text-sidebar-muted flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-red-500/10 hover:text-red-500"
        >
          <LogOut size={18} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

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
