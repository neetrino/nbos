export function toDeliveryBoardActionError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
