import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Boxes,
  Building2,
  CalendarDays,
  Cloud,
  ContactRound,
  FileText,
  Filter,
  FolderKanban,
  Handshake,
  LayoutDashboard,
  LifeBuoy,
  ListTodo,
  Mail,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  Wallet,
  Workflow,
} from 'lucide-react';
import type { SidebarModuleKey } from '@nbos/shared/constants';

export interface SidebarModuleVisual {
  Icon: LucideIcon;
  iconClass: string;
}

/** Module palette — unique glyph color per key, no tile or leading rail. */
export const SIDEBAR_MODULE_VISUALS: Record<SidebarModuleKey, SidebarModuleVisual> = {
  dashboard: {
    Icon: LayoutDashboard,
    iconClass: 'text-primary',
  },
  crm: {
    Icon: Filter,
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
  marketing: {
    Icon: Megaphone,
    iconClass: 'text-rose-600 dark:text-rose-400',
  },
  'project-hub': {
    Icon: FolderKanban,
    iconClass: 'text-violet-600 dark:text-violet-400',
  },
  'delivery-board': {
    Icon: Workflow,
    iconClass: 'text-cyan-600 dark:text-cyan-400',
  },
  tasks: {
    Icon: ListTodo,
    iconClass: 'text-blue-700 dark:text-blue-300',
  },
  'work-spaces': {
    Icon: Boxes,
    iconClass: 'text-indigo-500 dark:text-indigo-300',
  },
  finance: {
    Icon: Wallet,
    iconClass: 'text-green-600 dark:text-green-400',
  },
  support: {
    Icon: LifeBuoy,
    iconClass: 'text-orange-600 dark:text-orange-400',
  },
  clients: {
    Icon: ContactRound,
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
  partners: {
    Icon: Handshake,
    iconClass: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
  'my-company': {
    Icon: Building2,
    iconClass: 'text-indigo-600 dark:text-indigo-400',
  },
  messenger: {
    Icon: MessagesSquare,
    iconClass: 'text-purple-600 dark:text-purple-400',
  },
  'client-messenger': {
    Icon: MessageCircle,
    iconClass: 'text-teal-800 dark:text-teal-300',
  },
  calendar: {
    Icon: CalendarDays,
    iconClass: 'text-sky-400 dark:text-sky-300',
  },
  drive: {
    Icon: Cloud,
    iconClass: 'text-sky-600 dark:text-sky-400',
  },
  documents: {
    Icon: FileText,
    iconClass: 'text-stone-600 dark:text-stone-400',
  },
  mail: {
    Icon: Mail,
    iconClass: 'text-blue-500 dark:text-blue-300',
  },
  credentials: {
    Icon: ShieldCheck,
    iconClass: 'text-rose-700 dark:text-rose-300',
  },
  reports: {
    Icon: BarChart3,
    iconClass: 'text-violet-700 dark:text-violet-300',
  },
  'ai-agents': {
    Icon: Sparkles,
    iconClass: 'text-teal-600 dark:text-teal-400',
  },
  settings: {
    Icon: Settings,
    iconClass: 'text-zinc-600 dark:text-zinc-400',
  },
};
