'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Shield, User, Wallet } from 'lucide-react';
import { NotificationsTab, ProfileTab, SecurityTab } from '@/components/account/MyAccountTabs';
import {
  PAGE_TAB_BAR_WRAPPER_CLASS,
  detailSheetTabButtonClass,
} from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';

type TabId = 'profile' | 'notifications' | 'security';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

const PROFILE_TABS: Tab[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

export function MyAccountContent() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const walletActive = pathname.startsWith('/my-account/wallet');

  return (
    <>
      <div className={PAGE_TAB_BAR_WRAPPER_CLASS}>
        {PROFILE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={detailSheetTabButtonClass(activeTab === tab.id)}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
        <Link href="/my-account/wallet" className={cn(detailSheetTabButtonClass(walletActive))}>
          <Wallet size={16} />
          Wallet
        </Link>
      </div>

      <div className="border-border bg-card rounded-2xl border p-6">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </>
  );
}
