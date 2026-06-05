'use client';

import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ClientsDirectoryTab = 'contacts' | 'companies';

const CLIENTS_DIRECTORY_TABS: ReadonlyArray<{ value: ClientsDirectoryTab; label: string }> = [
  { value: 'contacts', label: 'Contacts' },
  { value: 'companies', label: 'Companies' },
];

const CLIENTS_DIRECTORY_HREFS: Record<ClientsDirectoryTab, string> = {
  contacts: '/clients/contacts',
  companies: '/clients/companies',
};

interface ClientsDirectoryTabsProps {
  activeTab: ClientsDirectoryTab;
}

export function ClientsDirectoryTabs({ activeTab }: ClientsDirectoryTabsProps) {
  const router = useRouter();

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => router.push(CLIENTS_DIRECTORY_HREFS[value as ClientsDirectoryTab])}
      className="min-w-0 flex-1 sm:w-auto sm:flex-initial"
    >
      <TabsList className="w-full min-w-0 sm:w-auto">
        {CLIENTS_DIRECTORY_TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="px-3 py-2.5 text-sm font-medium"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
