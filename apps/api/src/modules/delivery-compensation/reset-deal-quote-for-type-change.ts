type QuoteDb = {
  deliveryDealQuote: {
    findUnique: (args: {
      where: { dealId: string };
      select: { id: true };
    }) => Promise<{ id: string } | null>;
    update: (args: {
      where: { id: string };
      data: { appliedCollectionId: null };
    }) => Promise<unknown>;
  };
  deliveryDealQuoteItem: {
    deleteMany: (args: { where: { quoteId: string } }) => Promise<unknown>;
  };
};

/** Shop → CRM (or any type change) drops extras and the last-applied kit. The core rematches later. */
export async function resetDealQuoteForProductTypeChange(
  db: QuoteDb,
  dealId: string,
  previousType: string | null,
  nextType: string | null | undefined,
): Promise<void> {
  if (nextType === undefined || nextType === previousType) return;
  const quote = await db.deliveryDealQuote.findUnique({
    where: { dealId },
    select: { id: true },
  });
  if (!quote) return;
  await db.deliveryDealQuoteItem.deleteMany({ where: { quoteId: quote.id } });
  await db.deliveryDealQuote.update({
    where: { id: quote.id },
    data: { appliedCollectionId: null },
  });
}
