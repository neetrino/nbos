import { MessengerClient } from '@/features/messenger/MessengerClient';

/** Rollback Channel/DM surface. Not the Internal product entry. */
export default function MessengerLegacyPage() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <MessengerClient />
    </div>
  );
}
