export type MailComposePanelMode = 'new' | 'forward';

export type MailOverlayPanel = {
  type: 'forward-compose';
  defaultAccountId?: string | null;
  defaultSubject?: string;
  threadId: string;
} | null;

export type ActiveMailPanel =
  | { type: 'thread'; threadId: string }
  | {
      type: 'compose';
      defaultAccountId?: string | null;
      mode?: MailComposePanelMode;
      defaultSubject?: string;
    }
  | { type: 'connect' }
  | { type: 'share'; accountId: string; accountEmail: string }
  | null;

export function isMailPanelOpen(panel: ActiveMailPanel): panel is NonNullable<ActiveMailPanel> {
  return panel !== null;
}

export function activeMailThreadId(panel: ActiveMailPanel): string | null {
  return panel?.type === 'thread' ? panel.threadId : null;
}

export function mailPanelUsesFullLayout(panel: ActiveMailPanel): boolean {
  return panel?.type === 'thread';
}
