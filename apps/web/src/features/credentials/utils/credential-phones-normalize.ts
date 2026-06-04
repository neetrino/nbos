/** Trim and drop empty phone rows for API payloads. */
export function normalizeCredentialPhones(phones: string[]): string[] {
  return phones.map((p) => p.trim()).filter((p) => p.length > 0);
}

export function phonesFromCredentialDetail(d: {
  phones?: string[] | null;
  phone?: string | null;
}): string[] {
  const fromArray = (d.phones ?? []).map((p) => p.trim()).filter(Boolean);
  if (fromArray.length > 0) return fromArray;
  const legacy = d.phone?.trim();
  return legacy ? [legacy] : [''];
}
