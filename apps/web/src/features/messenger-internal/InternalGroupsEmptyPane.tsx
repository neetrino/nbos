'use client';

import { InternalCreateMenu } from './InternalCreateMenu';

export function InternalGroupsEmptyPane({
  onCreateGroup,
}: {
  onCreateGroup: (title: string) => Promise<void>;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 bg-[#eef2ff] px-6 text-center">
      <p className="text-sm text-[#64748b]">Select an Internal conversation</p>
      <InternalCreateMenu variant="button" onCreateGroup={onCreateGroup} />
    </div>
  );
}
