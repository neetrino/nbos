import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Building2,
  CalendarDays,
  Cloud,
  FileText,
  FolderKanban,
  Handshake,
  KanbanSquare,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  ListTodo,
  Mail,
  Megaphone,
  MessageSquare,
  Network,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import type { SidebarModuleKey } from '@nbos/shared/constants';

export interface SidebarModuleVisual {
  Icon: LucideIcon;
  iconClass: string;
  tileClass: string;
  tileActiveClass: string;
  markerClass: string;
}

/**
 * Module palette — each key has a unique hue.
 * Icons stay colored in idle state (soft tile + tinted glyph).
 */
export const SIDEBAR_MODULE_VISUALS: Record<SidebarModuleKey, SidebarModuleVisual> = {
  dashboard: {
    Icon: LayoutDashboard,
    iconClass: 'text-primary',
    tileClass: 'bg-primary/10',
    tileActiveClass: 'bg-primary/16 ring-primary/25 ring-1',
    markerClass: 'bg-primary',
  },
  crm: {
    Icon: Users,
    iconClass: 'text-blue-600 dark:text-blue-400',
    tileClass: 'bg-blue-500/10',
    tileActiveClass: 'bg-blue-500/16 ring-blue-500/25 ring-1',
    markerClass: 'bg-blue-600 dark:bg-blue-400',
  },
  marketing: {
    Icon: Megaphone,
    iconClass: 'text-rose-600 dark:text-rose-400',
    tileClass: 'bg-rose-500/10',
    tileActiveClass: 'bg-rose-500/16 ring-rose-500/25 ring-1',
    markerClass: 'bg-rose-600 dark:bg-rose-400',
  },
  'project-hub': {
    Icon: FolderKanban,
    iconClass: 'text-violet-600 dark:text-violet-400',
    tileClass: 'bg-violet-500/10',
    tileActiveClass: 'bg-violet-500/16 ring-violet-500/25 ring-1',
    markerClass: 'bg-violet-600 dark:bg-violet-400',
  },
  'delivery-board': {
    Icon: KanbanSquare,
    iconClass: 'text-cyan-600 dark:text-cyan-400',
    tileClass: 'bg-cyan-500/10',
    tileActiveClass: 'bg-cyan-500/16 ring-cyan-500/25 ring-1',
    markerClass: 'bg-cyan-600 dark:bg-cyan-400',
  },
  tasks: {
    Icon: ListTodo,
    iconClass: 'text-blue-700 dark:text-blue-300',
    tileClass: 'bg-blue-700/10',
    tileActiveClass: 'bg-blue-700/16 ring-blue-700/25 ring-1',
    markerClass: 'bg-blue-700 dark:bg-blue-300',
  },
  'work-spaces': {
    Icon: Layers,
    iconClass: 'text-indigo-500 dark:text-indigo-300',
    tileClass: 'bg-indigo-400/10',
    tileActiveClass: 'bg-indigo-400/16 ring-indigo-400/25 ring-1',
    markerClass: 'bg-indigo-500 dark:bg-indigo-300',
  },
  finance: {
    Icon: Wallet,
    iconClass: 'text-green-600 dark:text-green-400',
    tileClass: 'bg-green-500/10',
    tileActiveClass: 'bg-green-500/16 ring-green-500/25 ring-1',
    markerClass: 'bg-green-600 dark:bg-green-400',
  },
  support: {
    Icon: LifeBuoy,
    iconClass: 'text-orange-600 dark:text-orange-400',
    tileClass: 'bg-orange-500/10',
    tileActiveClass: 'bg-orange-500/16 ring-orange-500/25 ring-1',
    markerClass: 'bg-orange-600 dark:bg-orange-400',
  },
  clients: {
    Icon: Building2,
    iconClass: 'text-slate-600 dark:text-slate-300',
    tileClass: 'bg-slate-500/10',
    tileActiveClass: 'bg-slate-500/16 ring-slate-500/25 ring-1',
    markerClass: 'bg-slate-600 dark:bg-slate-400',
  },
  partners: {
    Icon: Handshake,
    iconClass: 'text-fuchsia-600 dark:text-fuchsia-400',
    tileClass: 'bg-fuchsia-500/10',
    tileActiveClass: 'bg-fuchsia-500/16 ring-fuchsia-500/25 ring-1',
    markerClass: 'bg-fuchsia-600 dark:bg-fuchsia-400',
  },
  'my-company': {
    Icon: Network,
    iconClass: 'text-indigo-600 dark:text-indigo-400',
    tileClass: 'bg-indigo-500/10',
    tileActiveClass: 'bg-indigo-500/16 ring-indigo-500/25 ring-1',
    markerClass: 'bg-indigo-600 dark:bg-indigo-400',
  },
  messenger: {
    Icon: MessageSquare,
    iconClass: 'text-purple-600 dark:text-purple-400',
    tileClass: 'bg-purple-500/10',
    tileActiveClass: 'bg-purple-500/16 ring-purple-500/25 ring-1',
    markerClass: 'bg-purple-600 dark:bg-purple-400',
  },
  calendar: {
    Icon: CalendarDays,
    iconClass: 'text-sky-400 dark:text-sky-300',
    tileClass: 'bg-sky-400/10',
    tileActiveClass: 'bg-sky-400/16 ring-sky-400/20 ring-1',
    markerClass: 'bg-sky-400 dark:bg-sky-300',
  },
  drive: {
    Icon: Cloud,
    iconClass: 'text-sky-600 dark:text-sky-400',
    tileClass: 'bg-sky-500/10',
    tileActiveClass: 'bg-sky-500/16 ring-sky-500/25 ring-1',
    markerClass: 'bg-sky-600 dark:bg-sky-400',
  },
  documents: {
    Icon: FileText,
    iconClass: 'text-stone-600 dark:text-stone-400',
    tileClass: 'bg-stone-500/10',
    tileActiveClass: 'bg-stone-500/16 ring-stone-500/25 ring-1',
    markerClass: 'bg-stone-600 dark:bg-stone-400',
  },
  mail: {
    Icon: Mail,
    iconClass: 'text-blue-500 dark:text-blue-300',
    tileClass: 'bg-blue-400/12',
    tileActiveClass: 'bg-blue-400/18 ring-blue-400/30 ring-1',
    markerClass: 'bg-blue-500 dark:bg-blue-300',
  },
  credentials: {
    Icon: ShieldCheck,
    iconClass: 'text-rose-700 dark:text-rose-300',
    tileClass: 'bg-rose-700/10',
    tileActiveClass: 'bg-rose-700/16 ring-rose-700/25 ring-1',
    markerClass: 'bg-rose-700 dark:bg-rose-300',
  },
  reports: {
    Icon: BarChart3,
    iconClass: 'text-violet-700 dark:text-violet-300',
    tileClass: 'bg-violet-500/10',
    tileActiveClass: 'bg-violet-500/16 ring-violet-500/25 ring-1',
    markerClass: 'bg-violet-700 dark:bg-violet-300',
  },
  settings: {
    Icon: Settings,
    iconClass: 'text-zinc-600 dark:text-zinc-400',
    tileClass: 'bg-zinc-500/10',
    tileActiveClass: 'bg-zinc-500/16 ring-zinc-500/25 ring-1',
    markerClass: 'bg-zinc-600 dark:bg-zinc-400',
  },
};
