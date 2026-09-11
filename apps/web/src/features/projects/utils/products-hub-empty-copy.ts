import type { ProductsHubTab } from '@/features/projects/constants/products-hub-page-preferences-storage';

export function productsHubEmptyCopy(tab: ProductsHubTab): {
  title: string;
  description: string;
} {
  if (tab === 'delivery') {
    return {
      title: 'No products in delivery',
      description: 'Open delivery work appears here.',
    };
  }
  if (tab === 'maintenance') {
    return {
      title: 'No products on maintenance',
      description: 'Live maintenance subscriptions appear here.',
    };
  }
  if (tab === 'closed') {
    return {
      title: 'No closed products',
      description: 'Finished delivery without live maintenance appears here.',
    };
  }
  return {
    title: 'No products found',
    description: 'Products from every project appear here.',
  };
}
