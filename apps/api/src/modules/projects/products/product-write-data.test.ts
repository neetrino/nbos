import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { buildProductCreateTaxonomy, buildProductTaxonomyPatch } from './product-write-data';
import { PRODUCT_TYPE_PLATFORM_MISMATCH } from '@nbos/shared';

describe('buildProductTaxonomyPatch', () => {
  it('coerces APP to WEB when the category becomes WordPress', () => {
    expect(
      buildProductTaxonomyPatch(
        { productCategory: 'WORDPRESS' },
        { productCategory: 'CODE', productType: 'ECOMMERCE', productPlatform: 'APP' },
      ),
    ).toEqual({
      productCategory: 'WORDPRESS',
      productType: 'ECOMMERCE',
      productPlatform: 'WEB',
    });
  });

  it('clears platform when the category becomes marketing', () => {
    expect(
      buildProductTaxonomyPatch(
        { productCategory: 'MARKETING', productType: 'SEO' },
        { productCategory: 'CODE', productType: 'ECOMMERCE', productPlatform: 'APP' },
      ),
    ).toEqual({
      productCategory: 'MARKETING',
      productType: 'SEO',
      productPlatform: null,
    });
  });

  it('rejects a site type on APP', () => {
    expect(() =>
      buildProductTaxonomyPatch(
        { productPlatform: 'APP' },
        { productCategory: 'CODE', productType: 'LANDING', productPlatform: 'WEB' },
      ),
    ).toThrow(BadRequestException);
  });

  it('keeps a leftover MOBILE_APP on APP', () => {
    expect(
      buildProductTaxonomyPatch(
        { productPlatform: 'APP' },
        { productCategory: 'CODE', productType: 'MOBILE_APP', productPlatform: 'APP' },
      ),
    ).toEqual({
      productCategory: 'CODE',
      productType: 'MOBILE_APP',
      productPlatform: 'APP',
    });
  });
});

describe('buildProductCreateTaxonomy', () => {
  it('requires an explicit Code platform and rejects sites on APP', () => {
    expect(() =>
      buildProductCreateTaxonomy({
        projectId: 'proj-1',
        name: 'Site',
        productCategory: 'CODE',
        productType: 'COMPANY_WEBSITE',
      }),
    ).toThrow(/Product platform is required/);
    expect(() =>
      buildProductCreateTaxonomy({
        projectId: 'proj-1',
        name: 'Site',
        productCategory: 'CODE',
        productType: 'LANDING',
        productPlatform: 'APP',
      }),
    ).toThrow(PRODUCT_TYPE_PLATFORM_MISMATCH);
    expect(() =>
      buildProductCreateTaxonomy({
        projectId: 'proj-1',
        name: 'App',
        productCategory: 'CODE',
        productType: 'MOBILE_APP',
        productPlatform: 'APP',
      }),
    ).toThrow(PRODUCT_TYPE_PLATFORM_MISMATCH);
  });

  it('creates a Code shop on APP', () => {
    expect(
      buildProductCreateTaxonomy({
        projectId: 'proj-1',
        name: 'Shop',
        productCategory: 'CODE',
        productType: 'ECOMMERCE',
        productPlatform: 'APP',
      }),
    ).toEqual({
      productCategory: 'CODE',
      productType: 'ECOMMERCE',
      productPlatform: 'APP',
    });
  });
});
