import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** Optional zone accent for module header tabs (active = rich, inactive = subtle indicator). */
export type HeaderNavAccent = {
  activeBar: string;
  activeShell: string;
  /** Short bottom rule under the tab row only (not full header width). */
  activeRowBorder: string;
  inactiveBar: string;
  inactiveHover: string;
};

export type HeaderNavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  /** When set, active if pathname starts with this prefix (default: href). */
  matchPrefix?: string;
  excludeMatchPrefix?: string;
  exactMatch?: boolean;
  /** Overrides prefix matching when provided (e.g. finance zone by path rules). */
  isActive?: (pathname: string) => boolean;
  /** Zone color cue — active tab gets stronger fill/bar; inactive gets a muted indicator. */
  accent?: HeaderNavAccent;
};

export type HeaderContextNavContent = {
  kind: 'nav';
  ariaLabel: string;
  items: HeaderNavItem[];
};

export type HeaderContextActionsContent = {
  kind: 'actions';
  ariaLabel?: string;
  children: ReactNode;
};

export type HeaderContextCustomContent = {
  kind: 'custom';
  node: ReactNode;
};

/** Per-route module context in the top bar (left); independent of sidebar. */
export type HeaderContextContent =
  | HeaderContextNavContent
  | HeaderContextActionsContent
  | HeaderContextCustomContent;
