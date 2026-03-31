import { describe, it, expect } from 'vitest';
import {
  LEAD_STATUSES,
  DEAL_STATUSES,
  PRODUCT_STATUSES,
  INVOICE_STATUSES,
  ORDER_STATUSES,
  EMPLOYEE_ROLES,
  EMPLOYEE_LEVELS,
  SLA_DEADLINES,
  BONUS_PERCENTAGES,
  TASK_STATUSES,
  TICKET_PRIORITIES,
  LEAD_SOURCES,
  DEAL_TYPES,
  PROJECT_TYPES,
  PRODUCT_TYPES,
  PAYMENT_TYPES,
} from './index';

describe('Constants', () => {
  it('LEAD_STATUSES has 6 statuses', () => {
    expect(LEAD_STATUSES).toHaveLength(6);
    expect(LEAD_STATUSES[0]).toBe('NEW');
    expect(LEAD_STATUSES[5]).toBe('SQL');
  });

  it('DEAL_STATUSES has 9 statuses', () => {
    expect(DEAL_STATUSES).toHaveLength(9);
    expect(DEAL_STATUSES[0]).toBe('START_CONVERSATION');
    expect(DEAL_STATUSES[8]).toBe('WON');
  });

  it('PRODUCT_STATUSES has 8 statuses', () => {
    expect(PRODUCT_STATUSES).toHaveLength(8);
  });

  it('INVOICE_STATUSES has 7 statuses', () => {
    expect(INVOICE_STATUSES).toHaveLength(7);
  });

  it('ORDER_STATUSES has 4 statuses', () => {
    expect(ORDER_STATUSES).toHaveLength(4);
  });

  it('EMPLOYEE_ROLES has 12 roles', () => {
    expect(EMPLOYEE_ROLES).toHaveLength(12);
    expect(EMPLOYEE_ROLES).toContain('CEO');
    expect(EMPLOYEE_ROLES).toContain('DEVELOPER');
  });

  it('EMPLOYEE_LEVELS has 5 levels', () => {
    expect(EMPLOYEE_LEVELS).toHaveLength(5);
  });

  it('SLA_DEADLINES has correct P1/P2/P3 values', () => {
    expect(SLA_DEADLINES.P1.response).toBe(4);
    expect(SLA_DEADLINES.P1.resolve).toBe(24);
    expect(SLA_DEADLINES.P2.response).toBe(8);
    expect(SLA_DEADLINES.P3.resolve).toBe(72);
  });

  it('BONUS_PERCENTAGES has correct values', () => {
    expect(BONUS_PERCENTAGES.SALES.COLD_CALL).toBe(10);
    expect(BONUS_PERCENTAGES.DELIVERY.CUSTOM_CODE).toBe(15);
    expect(BONUS_PERCENTAGES.PARTNER_DEFAULT).toBe(30);
    expect(BONUS_PERCENTAGES.HOLDBACK).toBe(20);
  });

  it('TASK_STATUSES includes NEW and DONE', () => {
    expect(TASK_STATUSES).toContain('NEW');
    expect(TASK_STATUSES).toContain('DONE');
    expect(TASK_STATUSES).toHaveLength(5);
  });

  it('TICKET_PRIORITIES has P1 P2 P3', () => {
    expect(TICKET_PRIORITIES).toEqual(['P1', 'P2', 'P3']);
  });

  it('LEAD_SOURCES are valid', () => {
    expect(LEAD_SOURCES).toContain('MARKETING');
    expect(LEAD_SOURCES).toContain('SALES');
    expect(LEAD_SOURCES).toHaveLength(4);
  });

  it('DEAL_TYPES has 4 canonical types', () => {
    expect(DEAL_TYPES).toEqual(['PRODUCT', 'EXTENSION', 'MAINTENANCE', 'OUTSOURCE']);
  });

  it('PROJECT_TYPES are valid', () => {
    expect(PROJECT_TYPES).toEqual(['WHITE_LABEL', 'MIX', 'CUSTOM_CODE']);
  });

  it('PRODUCT_TYPES has 16 types', () => {
    expect(PRODUCT_TYPES).toHaveLength(16);
    expect(PRODUCT_TYPES).toContain('BUSINESS_CARD_WEBSITE');
    expect(PRODUCT_TYPES).toContain('COMPANY_WEBSITE');
    expect(PRODUCT_TYPES).toContain('MOBILE_APP');
    expect(PRODUCT_TYPES).toContain('WEB_APP');
    expect(PRODUCT_TYPES).toContain('CRM');
    expect(PRODUCT_TYPES).toContain('ECOMMERCE');
    expect(PRODUCT_TYPES).toContain('BRANDING');
    expect(PRODUCT_TYPES).toContain('DESIGN');
    expect(PRODUCT_TYPES).toContain('PPC');
    expect(PRODUCT_TYPES).toContain('OTHER');
  });

  it('PAYMENT_TYPES are valid', () => {
    expect(PAYMENT_TYPES).toEqual(['CLASSIC', 'SUBSCRIPTION']);
  });

  it('all constants are arrays', () => {
    expect(Array.isArray(LEAD_STATUSES)).toBe(true);
    expect(Array.isArray(DEAL_STATUSES)).toBe(true);
    expect(Array.isArray(EMPLOYEE_ROLES)).toBe(true);
  });
});
