import { MessageSquare } from 'lucide-react';

export function TaskChatPlaceholder() {
  return (
    <div className="border-border bg-muted/30 flex w-80 flex-col border-l">
      <div className="border-border flex items-center gap-2 border-b px-4 py-3">
        <MessageSquare size={16} />
        <span className="text-sm font-medium">Task Chat</span>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-center text-sm">
          Chat will be integrated with the messenger system
        </p>
      </div>
    </div>
  );
}
