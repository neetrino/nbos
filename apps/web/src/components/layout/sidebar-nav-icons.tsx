import type { ReactNode } from 'react';
import type { SidebarModuleKey } from '@nbos/shared/constants';
import {
  BarChart3,
  LayoutDashboard,
  Users,
  Users2,
  FolderKanban,
  Kanban,
  CheckSquare,
  DollarSign,
  Headphones,
  Building2,
  Handshake,
  MessageCircle,
  Calendar,
  HardDrive,
  FileText,
  Mail,
  KeyRound,
  Settings,
  Megaphone,
} from 'lucide-react';

const SIDEBAR_NAV_ICONS: Record<SidebarModuleKey, ReactNode> = {
  dashboard: <LayoutDashboard size={20} />,
  crm: <Users size={20} />,
  marketing: <Megaphone size={20} />,
  'project-hub': <FolderKanban size={20} />,
  'delivery-board': <Kanban size={20} />,
  tasks: <CheckSquare size={20} />,
  'work-spaces': <FolderKanban size={20} />,
  finance: <DollarSign size={20} />,
  support: <Headphones size={20} />,
  clients: <Building2 size={20} />,
  partners: <Handshake size={20} />,
  'my-company': <Users2 size={20} />,
  messenger: <MessageCircle size={20} />,
  calendar: <Calendar size={20} />,
  drive: <HardDrive size={20} />,
  documents: <FileText size={20} />,
  mail: <Mail size={20} />,
  credentials: <KeyRound size={20} />,
  reports: <BarChart3 size={20} />,
  settings: <Settings size={20} />,
};

export function getSidebarNavIcon(key: SidebarModuleKey): ReactNode {
  return SIDEBAR_NAV_ICONS[key];
}
