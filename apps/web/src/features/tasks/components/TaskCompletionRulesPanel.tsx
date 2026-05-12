import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type { Task } from '@/lib/api/tasks';
import {
  buildTaskCompletionBlockers,
  getCompletionRuleLabel,
  getEnabledCompletionRules,
  type TaskCompletionBlocker,
} from '@/features/tasks/utils/task-completion-readiness';

interface TaskCompletionRulesPanelProps {
  task: Task;
  serverBlockers?: TaskCompletionBlocker[];
}

export function TaskCompletionRulesPanel({
  task,
  serverBlockers = [],
}: TaskCompletionRulesPanelProps) {
  const rules = getEnabledCompletionRules(task);
  const localBlockers = buildTaskCompletionBlockers(task);
  const blockers = serverBlockers.length > 0 ? serverBlockers : localBlockers;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-muted-foreground text-xs font-medium tracking-wide">
          Completion Rules
        </h4>
        {rules.length > 0 && blockers.length === 0 && <StatusBadge label="Ready" variant="green" />}
        {blockers.length > 0 && <StatusBadge label="Blocked" variant="red" />}
      </div>

      {rules.length === 0 ? (
        <p className="text-muted-foreground text-sm">No completion rules configured.</p>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => {
            const ruleBlockers = blockers.filter((blocker) => blocker.ruleType === rule.type);
            return (
              <div
                key={rule.type}
                className="bg-muted/20 ring-foreground/[0.06] rounded-xl p-3 ring-1 dark:ring-white/[0.06]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{getCompletionRuleLabel(rule)}</p>
                  {ruleBlockers.length === 0 ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <AlertTriangle size={14} className="text-red-500" />
                  )}
                </div>
                {ruleBlockers.map((blocker) => (
                  <p key={blocker.code} className="text-muted-foreground mt-1 text-xs">
                    {blocker.message}
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
