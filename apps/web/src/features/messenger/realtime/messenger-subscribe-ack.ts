/** Server subscribe ACK is `{ ok: boolean }`. Anything else is not a join. */
export function isMessengerSubscribeAckOk(response: unknown): boolean {
  if (!response || typeof response !== 'object') return false;
  return (response as { ok?: unknown }).ok === true;
}
