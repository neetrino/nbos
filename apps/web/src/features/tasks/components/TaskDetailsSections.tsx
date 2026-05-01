import type { ReactNode } from 'react';
import { Calendar, Eye, Link as LinkIcon, User, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

export function TaskLinksSection({ task }: TaskDetailsSectionsProps) {
  return (
    <div>
      <h4 className="text-muted-foreground mb-2 flex items-center gap-1 text-xs font-medium uppercase">
        <LinkIcon size={12} /> Linked Entities
      </h4>
      {task.links.length === 0 ? (
        <p className="text-muted-foreground text-sm">No linked entities</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {task.links.map((link) => (
            <Badge key={link.id} variant="secondary">
              {link.entityType}: {link.entityId.slice(0, 8)}...
            </Badge>
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
      <h4 className="text-muted-foreground mb-1 flex items-center gap-1 text-xs font-medium uppercase">
        {icon} {label}
      </h4>
      <p className={muted ? 'text-muted-foreground text-sm' : 'text-sm'}>{children}</p>
    </div>
  );
}
