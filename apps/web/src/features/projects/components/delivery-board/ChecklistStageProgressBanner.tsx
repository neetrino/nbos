import type { ChecklistStageProgress } from '@/lib/api/projects';

export function ChecklistStageProgressBanner({
  progress,
}: {
  progress: ChecklistStageProgress | null | undefined;
}) {
  if (!progress || progress.total <= 0) {
    return null;
  }
  return (
    <div className="border-border bg-muted/20 shrink-0 border-b px-5 py-2.5 sm:px-7">
      <p className="text-muted-foreground text-xs leading-relaxed">
        <span className="text-foreground font-medium">Stage checklists</span> — {progress.completed}
        /{progress.total} items marked (Done / Not done)
      </p>
    </div>
  );
}
