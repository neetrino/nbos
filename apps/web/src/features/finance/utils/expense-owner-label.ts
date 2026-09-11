export function expenseOwnerLabel(row: {
  productId?: string | null;
  product?: { name: string } | null;
  project?: { name: string } | null;
}): string | null {
  const productName = row.product?.name.trim();
  if (productName) return productName;
  const projectName = row.project?.name.trim();
  if (!row.productId && projectName) return `Project · ${projectName}`;
  return null;
}
