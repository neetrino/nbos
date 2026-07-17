import type { LucideIcon } from 'lucide-react';
import {
  AppWindow,
  Code2,
  Database,
  Globe,
  HardDrive,
  KeyRound,
  Mail,
  Puzzle,
  Shield,
  Wrench,
} from 'lucide-react';

const ACCESS_SLOT_ICONS: Record<string, LucideIcon> = {
  DOMAIN: Globe,
  HOSTING: HardDrive,
  ADMIN: Shield,
  MAIL: Mail,
  SERVICE: Wrench,
  API_INTEGRATION: Code2,
  APP_STORE: AppWindow,
  DATABASE: Database,
  UNIVERSAL: Puzzle,
};

/** Lucide icon for an Access & infrastructure slot theme. */
export function getDeliveryAccessSlotIcon(slotKey: string): LucideIcon {
  return ACCESS_SLOT_ICONS[slotKey] ?? KeyRound;
}
