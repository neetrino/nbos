'use client';

import { useState } from 'react';
import { Bell, Shield, User } from 'lucide-react';
import { NotificationsTab, ProfileTab, SecurityTab } from '@/components/account/MyAccountTabs';

type TabId = 'profile' | 'notifications' | 'security';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

const TABS: Tab[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

export function MyAccountContent() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">My Account</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your personal profile, security, and notification preferences.
        </p>
      </div>

      <div className="border-border flex items-center gap-1 border-b pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="border-border bg-card rounded-2xl border p-6">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </div>
  );
}
