import type { ReactNode } from 'react';
import { Calendar, Eye, Link as LinkIcon, Trash2, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Task } from '@/lib/api/tasks';

interface TaskDetailsSectionsProps {
  task: Task;
}

export function TaskPeopleSection({ task }: TaskDetailsSectionsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <PersonValue icon={<User size={12} />} label="Creator">
        {task.creator.firstName} {task.creator.lastName}
      </PersonValue>
      <PersonValue icon={<User size={12} />} label="Assignee">
        {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : '—'}
      </PersonValue>
      {task.coAssignees.length > 0 && (
        <PersonValue icon={<Users size={12} />} label="Co-Assignees" muted>
          {task.coAssignees.length} people
        </PersonValue>
      )}
      {task.observers.length > 0 && (
        <PersonValue icon={<Eye size={12} />} label="Observers" muted>
          {task.observers.length} people
        </PersonValue>
      )}
    </div>
  );
}

export function TaskDatesSection({ task }: TaskDetailsSectionsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <PersonValue icon={<Calendar size={12} />} label="Start Date">
        {task.startDate ? new Date(task.startDate).toLocaleDateString() : '—'}
      </PersonValue>
      <PersonValue icon={<Calendar size={12} />} label="Due Date">
        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
      </PersonValue>
    </div>
  );
}

export function TaskLinksSection({
  task,
  onRemoveLink,
}: TaskDetailsSectionsProps & { onRemoveLink?: (linkId: string) => void }) {
  return (
    <div>
      <h4 className="text-muted-foreground mb-2 flex items-center gap-1 text-xs font-medium tracking-wide">
        <LinkIcon size={12} /> Linked Entities
      </h4>
      {task.links.length === 0 ? (
        <p className="text-muted-foreground text-sm">No linked entities</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {task.links.map((link) => (
            <span
              key={link.id}
              className="bg-secondary text-secondary-foreground inline-flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-xs"
            >
              <span className="min-w-0 truncate">
                {link.entityLabel?.trim()
                  ? `${link.entityType}: ${link.entityLabel}`
                  : `${link.entityType}: ${link.entityId.slice(0, 8)}…`}
              </span>
              {onRemoveLink && (
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  className="-my-1 -mr-1"
                  title="Remove link"
                  onClick={() => onRemoveLink(link.id)}
                >
                  <Trash2 size={11} />
                </Button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface PersonValueProps {
  icon: ReactNode;
  label: string;
  muted?: boolean;
  children: ReactNode;
}

function PersonValue({ icon, label, muted = false, children }: PersonValueProps) {
  return (
    <div>
      <h4 className="text-muted-foreground mb-1 flex items-center gap-1 text-xs font-medium tracking-wide">
        {icon} {label}
      </h4>
      <p className={muted ? 'text-muted-foreground text-sm' : 'text-sm'}>{children}</p>
    </div>
  );
}
