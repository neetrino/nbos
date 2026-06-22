'use client';

import { useRouter } from 'next/navigation';
import { SegmentedTabs } from '@/components/shared';

type ClientsDirectoryTab = 'contacts' | 'companies';

const CLIENTS_DIRECTORY_TABS = [
  { value: 'contacts' as const, label: 'Contacts' },
  { value: 'companies' as const, label: 'Companies' },
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
    <SegmentedTabs
      value={activeTab}
      onChange={(value) => router.push(CLIENTS_DIRECTORY_HREFS[value])}
      options={CLIENTS_DIRECTORY_TABS}
      ariaLabel="Clients directory"
      className="min-w-0 flex-1 sm:w-auto sm:flex-initial"
      listClassName="w-full sm:w-auto"
    />
  );
}
