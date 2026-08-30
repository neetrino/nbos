import { InternalMessengerApp } from '@/features/messenger-internal/InternalMessengerApp';

export default function MessengerSectionPage() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <InternalMessengerApp />
    </div>
  );
}
