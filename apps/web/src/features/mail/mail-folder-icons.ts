import {
  FilePenLine,
  Inbox,
  Link2,
  Mail,
  Send,
  ShieldAlert,
  Trash2,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { MailFolderKey } from './mail-folder-config';

export const MAIL_FOLDER_ICONS: Record<MailFolderKey, LucideIcon> = {
  all: Inbox,
  unread: Mail,
  mine: User,
  sent: Send,
  drafts: FilePenLine,
  needsLink: Link2,
  spam: ShieldAlert,
  trash: Trash2,
};
