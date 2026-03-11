'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  ListChecks,
  ChevronDown,
  X,
  User,
  FolderKanban,
  AlertTriangle,
  ArrowUp,
  Minus,
  ArrowDown,
} from 'lucide-react';

type Priority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';

interface Task {
  id: string;
  code: string;
  title: string;
  priority: Priority;
  status: TaskStatus;
  assignee: string | null;
  project: string | null;
}

const STATUSES: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'BACKLOG', label: 'Backlog', color: 'bg-gray-400' },
  { key: 'TODO', label: 'To Do', color: 'bg-blue-400' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-amber-500' },
  { key: 'REVIEW', label: 'Review', color: 'bg-purple-500' },
  { key: 'DONE', label: 'Done', color: 'bg-emerald-500' },
  { key: 'CANCELLED', label: 'Cancelled', color: 'bg-red-400' },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; icon: typeof ArrowUp }> = {
  CRITICAL: { label: 'Critical', color: 'bg-red-500/10 text-red-600', icon: AlertTriangle },
  HIGH: { label: 'High', color: 'bg-orange-500/10 text-orange-600', icon: ArrowUp },
  NORMAL: { label: 'Normal', color: 'bg-blue-500/10 text-blue-600', icon: Minus },
  LOW: { label: 'Low', color: 'bg-gray-500/10 text-gray-500', icon: ArrowDown },
};

const MOCK_TASKS: Task[] = [
  {
    id: '1',
    code: 'TSK-001',
    title: 'Set up CI/CD pipeline',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignee: 'Arman K.',
    project: 'NBOS Platform',
  },
  {
    id: '2',
    code: 'TSK-002',
    title: 'Design system documentation',
    priority: 'NORMAL',
    status: 'TODO',
    assignee: 'Lilit M.',
    project: 'NBOS Platform',
  },
  {
    id: '3',
    code: 'TSK-003',
    title: 'Fix auth token refresh',
    priority: 'CRITICAL',
    status: 'REVIEW',
    assignee: 'Davit S.',
    project: 'Client Portal',
  },
  {
    id: '4',
    code: 'TSK-004',
    title: 'Add pagination to orders list',
    priority: 'NORMAL',
    status: 'BACKLOG',
    assignee: null,
    project: 'NBOS Platform',
  },
  {
    id: '5',
    code: 'TSK-005',
    title: 'Optimize image uploads',
    priority: 'LOW',
    status: 'BACKLOG',
    assignee: 'Arman K.',
    project: 'Client Portal',
  },
  {
    id: '6',
    code: 'TSK-006',
    title: 'Deploy staging environment',
    priority: 'HIGH',
    status: 'DONE',
    assignee: 'Davit S.',
    project: 'NBOS Platform',
  },
  {
    id: '7',
    code: 'TSK-007',
    title: 'Write API integration tests',
    priority: 'NORMAL',
    status: 'TODO',
    assignee: 'Lilit M.',
    project: 'Client Portal',
  },
  {
    id: '8',
    code: 'TSK-008',
    title: 'Database migration for v2',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignee: 'Arman K.',
    project: 'NBOS Platform',
  },
  {
    id: '9',
    code: 'TSK-009',
    title: 'Refactor notification service',
    priority: 'LOW',
    status: 'CANCELLED',
    assignee: null,
    project: 'NBOS Platform',
  },
  {
    id: '10',
    code: 'TSK-010',
    title: 'Implement role-based access',
    priority: 'CRITICAL',
    status: 'TODO',
    assignee: 'Davit S.',
    project: 'Client Portal',
  },
];

function TaskCard({ task }: { task: Task }) {
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const PriorityIcon = priorityCfg.icon;

  return (
    <div className="group border-border bg-card rounded-xl border p-3.5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-muted-foreground text-[10px] font-medium">{task.code}</p>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${priorityCfg.color}`}
        >
          <PriorityIcon size={10} />
          {priorityCfg.label}
        </span>
      </div>
      <h4 className="text-foreground mt-1.5 text-sm leading-snug font-medium">{task.title}</h4>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assignee && (
            <div className="text-muted-foreground flex items-center gap-1 text-[10px]">
              <User size={10} />
              <span>{task.assignee}</span>
            </div>
          )}
        </div>
        {task.project && (
          <div className="text-muted-foreground flex items-center gap-1 text-[10px]">
            <FolderKanban size={10} />
            <span>{task.project}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateTaskModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border-border w-full max-w-lg rounded-2xl border p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-lg font-semibold">Create Task</h2>
          <button
            onClick={onClose}
            className="hover:bg-secondary rounded-lg p-1.5 transition-colors"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-foreground mb-1.5 block text-xs font-medium">Title</label>
            <input
              type="text"
              placeholder="Task title"
              className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-foreground mb-1.5 block text-xs font-medium">Priority</label>
              <select className="border-input bg-card text-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none">
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-foreground mb-1.5 block text-xs font-medium">Status</label>
              <select className="border-input bg-card text-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none">
                {STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-foreground mb-1.5 block text-xs font-medium">Assignee</label>
            <input
              type="text"
              placeholder="Assignee name"
              className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-foreground mb-1.5 block text-xs font-medium">Project</label>
            <input
              type="text"
              placeholder="Project name"
              className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="border-border text-muted-foreground hover:bg-secondary rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = MOCK_TASKS.filter((task) => {
    const matchesSearch =
      !search ||
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.code.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const columns = STATUSES.map((status) => ({
    ...status,
    tasks: filtered.filter((t) => t.status === status.key),
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Tasks</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {filtered.length} tasks across {columns.filter((c) => c.tasks.length > 0).length}{' '}
            columns
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Create Task
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title or code..."
            className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
        <div className="relative">
          <ChevronDown
            size={14}
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
          />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Priority | 'ALL')}
            className="border-input bg-card text-foreground focus:ring-ring appearance-none rounded-xl border py-2.5 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex-1 overflow-x-auto">
        <div className="flex gap-4 pb-4" style={{ minWidth: `${STATUSES.length * 280}px` }}>
          {columns.map((column) => (
            <div key={column.key} className="w-[260px] flex-shrink-0">
              <div className="mb-3 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${column.color}`} />
                <h3 className="text-foreground text-xs font-semibold">{column.label}</h3>
                <span className="bg-secondary text-muted-foreground ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                  {column.tasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {column.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {column.tasks.length === 0 && (
                  <div className="border-border rounded-xl border border-dashed p-8 text-center">
                    <ListChecks size={20} className="text-muted-foreground/30 mx-auto" />
                    <p className="text-muted-foreground mt-2 text-[10px]">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
