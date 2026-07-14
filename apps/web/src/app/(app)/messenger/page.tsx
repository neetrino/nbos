import { MessengerClient } from '@/features/messenger/MessengerClient';

export default function MessengerPage() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <MessengerClient />
    </div>
  );
}
