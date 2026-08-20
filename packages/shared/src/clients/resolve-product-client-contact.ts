/**
 * Resolves the client Contact for Product-scoped delivery comms (WhatsApp invite).
 * Canon: Clients `07-Contact-and-Product.md` — Product → Project → Deal.
 */
export function resolveProductClientContactId(input: {
  productContactId?: string | null;
  projectContactId?: string | null;
  dealContactId?: string | null;
}): string | null {
  return input.productContactId ?? input.projectContactId ?? input.dealContactId ?? null;
}
