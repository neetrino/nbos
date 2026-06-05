/** Builds compact page number sequence with ellipsis gaps. */
export function buildListPageSequence(
  page: number,
  totalPages: number,
): Array<number | 'ellipsis'> {
  if (totalPages <= 1) return totalPages === 1 ? [1] : [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const anchors = new Set([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...anchors].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const sequence: Array<number | 'ellipsis'> = [];
  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    const previous = sorted[index - 1];
    if (current === undefined) continue;
    if (previous !== undefined && current - previous > 1) {
      sequence.push('ellipsis');
    }
    sequence.push(current);
  }
  return sequence;
}
