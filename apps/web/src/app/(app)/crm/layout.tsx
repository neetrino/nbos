'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Megaphone, Handshake } from 'lucide-react';
import type { ReactNode } from 'react';

const CRM_TABS = [
  { href: '/crm/leads', label: 'Lead Pipeline', icon: Megaphone },
  { href: '/crm/deals', label: 'Deal Pipeline', icon: Handshake },
] as const;

export default function CrmLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-center gap-1 border-b pb-4">
        {CRM_TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </Link>
          );
        })}
      </div>
      <div className="flex-1 pt-6">{children}</div>
    </div>
  );
}
