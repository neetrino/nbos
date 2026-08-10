export type MessengerActiveView = {
  type: 'conversation';
  id: string;
  /** Present for DIRECT chats — used for typing emit dual-compat. */
  peerEmployeeId?: string | null;
};
