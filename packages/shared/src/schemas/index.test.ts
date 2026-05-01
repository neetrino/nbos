import { describe, it, expect } from 'vitest';
import {
  paginationSchema,
  searchSchema,
  createLeadSchema,
  updateLeadSchema,
  createDealSchema,
  updateDealSchema,
} from './index';

describe('Schemas', () => {
  describe('paginationSchema', () => {
    it('applies defaults', () => {
      const result = paginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.sortOrder).toBe('desc');
    });

    it('coerces string numbers', () => {
      const result = paginationSchema.parse({ page: '3', pageSize: '50' });
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(50);
    });

    it('rejects page < 1', () => {
      expect(() => paginationSchema.parse({ page: 0 })).toThrow();
    });

    it('rejects pageSize > 100', () => {
      expect(() => paginationSchema.parse({ pageSize: 101 })).toThrow();
    });

    it('accepts valid sortOrder', () => {
      expect(paginationSchema.parse({ sortOrder: 'asc' }).sortOrder).toBe('asc');
    });
  });

  describe('searchSchema', () => {
    it('validates min length', () => {
      expect(() => searchSchema.parse({ query: '' })).toThrow();
    });

    it('validates max length', () => {
      expect(() => searchSchema.parse({ query: 'a'.repeat(201) })).toThrow();
    });

    it('accepts valid query', () => {
      expect(searchSchema.parse({ query: 'test' }).query).toBe('test');
    });
  });

  describe('createLeadSchema', () => {
    it('validates valid lead', () => {
      const result = createLeadSchema.parse({
        contactName: 'John Doe',
        source: 'MARKETING',
      });
      expect(result.contactName).toBe('John Doe');
      expect(result.source).toBe('MARKETING');
    });

    it('requires contactName', () => {
      expect(() => createLeadSchema.parse({ source: 'MARKETING' })).toThrow();
    });

    it('requires source', () => {
      expect(() => createLeadSchema.parse({ contactName: 'John' })).toThrow();
    });

    it('validates email format', () => {
      expect(() =>
        createLeadSchema.parse({
          contactName: 'John',
          source: 'MARKETING',
          email: 'not-an-email',
        }),
      ).toThrow();
    });

    it('accepts optional fields', () => {
      const result = createLeadSchema.parse({
        contactName: 'John Doe',
        source: 'MARKETING',
        phone: '+37499123456',
        email: 'john@example.com',
        notes: 'Test notes',
      });
      expect(result.phone).toBe('+37499123456');
      expect(result.email).toBe('john@example.com');
    });

    it('rejects invalid source', () => {
      expect(() =>
        createLeadSchema.parse({
          contactName: 'John',
          source: 'INVALID_SOURCE',
        }),
      ).toThrow();
    });
  });

  describe('updateLeadSchema', () => {
    it('accepts empty update', () => {
      const result = updateLeadSchema.parse({});
      expect(result).toEqual({});
    });

    it('validates status enum', () => {
      const result = updateLeadSchema.parse({ status: 'MQL' });
      expect(result.status).toBe('MQL');
    });

    it('rejects invalid status', () => {
      expect(() => updateLeadSchema.parse({ status: 'INVALID' })).toThrow();
    });

    it('validates assignedTo uuid', () => {
      expect(() => updateLeadSchema.parse({ assignedTo: 'not-a-uuid' })).toThrow();
    });
  });

  describe('createDealSchema', () => {
    it('validates valid deal', () => {
      const result = createDealSchema.parse({
        contactId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'PRODUCT',
        sellerId: '550e8400-e29b-41d4-a716-446655440001',
      });
      expect(result.type).toBe('PRODUCT');
    });

    it('requires contactId and sellerId', () => {
      expect(() => createDealSchema.parse({ type: 'PRODUCT' })).toThrow();
    });

    it('validates positive amount', () => {
      expect(() =>
        createDealSchema.parse({
          contactId: '550e8400-e29b-41d4-a716-446655440000',
          type: 'PRODUCT',
          sellerId: '550e8400-e29b-41d4-a716-446655440001',
          amount: -100,
        }),
      ).toThrow();
    });
  });

  describe('updateDealSchema', () => {
    it('accepts empty update', () => {
      expect(updateDealSchema.parse({})).toEqual({});
    });

    it('validates deal status', () => {
      const result = updateDealSchema.parse({ status: 'MEETING' });
      expect(result.status).toBe('MEETING');
    });

    it('validates payment type', () => {
      const result = updateDealSchema.parse({ paymentType: 'SUBSCRIPTION' });
      expect(result.paymentType).toBe('SUBSCRIPTION');
    });

    it('accepts maintenance planned start date', () => {
      const result = updateDealSchema.parse({
        maintenanceStartAt: '2026-05-15T00:00:00.000Z',
      });
      expect(result.maintenanceStartAt).toBe('2026-05-15T00:00:00.000Z');
    });
  });
});
