import type { useTranslations } from 'next-intl';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
  type ProductCategoryKey,
  type ProductTypeKey,
} from '@nbos/shared';
import { PROFILE_LABEL_SEPARATOR, PROFILE_VERSION_PREFIX } from './delivery-norms.constants';
import { productTypeLabels } from './profile-enum-labels';

const PRODUCT_TYPE_ALIASES: ReadonlyArray<readonly [string, ProductTypeKey]> = [
  ['company-site', 'COMPANY_WEBSITE'],
  ['shop', 'ECOMMERCE'],
];

const CATEGORY_SLUGS = slugEntries(PRODUCT_CATEGORIES);
const PRODUCT_TYPE_SLUGS: Array<[string, ProductTypeKey]> = [
  ...slugEntries(PRODUCT_TYPES),
  ...PRODUCT_TYPE_ALIASES.map(([slug, productType]) => typedPair(slug, productType)),
].sort(byLongerSlug);

export type ParsedProfileKey = {
  productType: ProductTypeKey | null;
  productCategory: ProductCategoryKey | null;
};

export type BaseProfileLabelDictionaries = {
  productTypes: Record<ProductTypeKey, string>;
};

export function dictionariesForProfileLabel(
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): BaseProfileLabelDictionaries {
  return { productTypes: productTypeLabels(t) };
}

export function parseProfileKey(profileKey: string): ParsedProfileKey {
  let rest = normalizeProfileKey(profileKey);
  const category = takeTrailingSlug(rest, CATEGORY_SLUGS);
  rest = category.rest;
  return {
    productType: PRODUCT_TYPE_SLUGS.find(([slug]) => slug === rest)?.[1] ?? null,
    productCategory: category.value,
  };
}

export function formatBaseProfileLabel(
  profileKey: string,
  version: number | null,
  labels: BaseProfileLabelDictionaries,
): string {
  const parsed = parseProfileKey(profileKey);
  const title = parsed.productType ? labels.productTypes[parsed.productType] : profileKey;
  if (version === null) {
    return title;
  }
  return `${title}${PROFILE_LABEL_SEPARATOR}${PROFILE_VERSION_PREFIX}${version}`;
}

function normalizeProfileKey(profileKey: string): string {
  return profileKey.trim().toLowerCase().replaceAll('_', '-');
}

function typedPair<T extends string>(slug: string, value: T): [string, T] {
  return [slug, value];
}

function enumToKebab(value: string): string {
  return value.toLowerCase().replaceAll('_', '-');
}

function slugEntries<T extends string>(values: readonly T[]): Array<[string, T]> {
  return values.map((value) => typedPair(enumToKebab(value), value)).sort(byLongerSlug);
}

function takeTrailingSlug<T extends string>(
  value: string,
  slugs: ReadonlyArray<readonly [string, T]>,
): { rest: string; value: T | null } {
  for (const [slug, mapped] of slugs) {
    if (value === slug) {
      return { rest: '', value: mapped };
    }
    const suffix = `-${slug}`;
    if (value.endsWith(suffix)) {
      return { rest: value.slice(0, -suffix.length), value: mapped };
    }
  }
  return { rest: value, value: null };
}

function byLongerSlug(left: readonly [string, string], right: readonly [string, string]): number {
  return right[0].length - left[0].length;
}
