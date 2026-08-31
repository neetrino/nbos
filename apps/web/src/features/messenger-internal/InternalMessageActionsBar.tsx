'use client';

export function InternalMessageActionsBar({
  selectedCount,
  canReply,
  canCreateTask,
  onReply,
  onForward,
  onCreateTask,
  onOpenOriginal,
  onCopySource,
  onClear,
}: {
  selectedCount: number;
  canReply: boolean;
  canCreateTask: boolean;
  onReply: () => void;
  onForward: () => void;
  onCreateTask: () => void;
  onOpenOriginal: () => void;
  onCopySource: () => void;
  onClear: () => void;
}) {
  if (selectedCount === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-black/[0.06] px-3 py-2">
      <span className="mr-1 text-[11px] text-black/45">{selectedCount} selected</span>
      {canReply ? <ActionButton label="Reply" onClick={onReply} /> : null}
      <ActionButton label="Forward" onClick={onForward} />
      {canCreateTask ? <ActionButton label="Create Task" onClick={onCreateTask} /> : null}
      <ActionButton label="Open original" onClick={onOpenOriginal} />
      <ActionButton label="Copy source" onClick={onCopySource} />
      <ActionButton label="Clear" onClick={onClear} />
    </div>
  );
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-2 py-1 text-[11px] font-medium text-black hover:bg-[#E5A84B]/15"
    >
      {label}
    </button>
  );
}
