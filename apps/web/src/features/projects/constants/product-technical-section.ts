import type { LucideIcon } from 'lucide-react';
import { Activity, Boxes, Globe2, Settings2 } from 'lucide-react';
import type { PageHeroTabOption } from '@/components/shared';

export const PRODUCT_TECHNICAL_SECTION_VALUES = [
  'profile',
  'assets',
  'environments',
  'ops',
] as const;

export type ProductTechnicalSection = (typeof PRODUCT_TECHNICAL_SECTION_VALUES)[number];

export const PRODUCT_TECHNICAL_SECTION_DEFAULT: ProductTechnicalSection = 'profile';

const SECTION_ICON: Record<ProductTechnicalSection, LucideIcon> = {
  profile: Globe2,
  assets: Boxes,
  environments: Activity,
  ops: Settings2,
};

const SECTION_LABEL: Record<ProductTechnicalSection, string> = {
  profile: 'Profile',
  assets: 'Assets',
  environments: 'Environments',
  ops: 'Ops',
};

export const PRODUCT_TECHNICAL_SECTION_OPTIONS: PageHeroTabOption<ProductTechnicalSection>[] =
  PRODUCT_TECHNICAL_SECTION_VALUES.map((value) => ({
    value,
    label: SECTION_LABEL[value],
    icon: SECTION_ICON[value],
  }));
