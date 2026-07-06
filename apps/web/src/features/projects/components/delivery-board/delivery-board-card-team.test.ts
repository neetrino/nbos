import { describe, expect, it } from 'vitest';
import { getDeliveryBoardItemTeamMembers } from './delivery-board-card-team';
import type { DeliveryBoardItem } from './project-delivery-board-model';

const sharedPerson = { id: 'emp-1', firstName: 'Anna', lastName: 'Smith' };

describe('getDeliveryBoardItemTeamMembers', () => {
  it('collects Developer, PM, and Technical specialist without duplicates', () => {
    const item: DeliveryBoardItem = {
      kind: 'PRODUCT',
      product: {
        id: 'prod-1',
        name: 'Site',
        status: 'DEVELOPMENT',
        productCategory: 'WEB',
        productType: 'COMPANY_WEBSITE',
        deadline: null,
        pm: sharedPerson,
        developer: sharedPerson,
        designer: { id: 'emp-2', firstName: 'Bob', lastName: 'Lee' },
        technicalSpecialist: { id: 'emp-3', firstName: 'Cara', lastName: 'Ng' },
        qaLead: { id: 'emp-4', firstName: 'Dan', lastName: 'Wu' },
        _count: { extensions: 0, tasks: 0, tickets: 0 },
      },
    };

    const members = getDeliveryBoardItemTeamMembers(item);
    expect(members).toHaveLength(2);
    expect(members.map((m) => m.roleLabel)).toEqual(['Developer', 'Technical specialist']);
  });

  it('returns extension assignee as Developer', () => {
    const item: DeliveryBoardItem = {
      kind: 'EXTENSION',
      extension: {
        id: 'ext-1',
        name: 'Feature',
        status: 'DEVELOPMENT',
        size: 'SMALL',
        productId: 'prod-1',
        assignee: sharedPerson,
        product: { id: 'prod-1', name: 'Site', productType: 'OTHER', status: 'DEVELOPMENT' },
        _count: { tasks: 0 },
      },
    };

    const members = getDeliveryBoardItemTeamMembers(item);
    expect(members).toHaveLength(1);
    expect(members[0]?.roleLabel).toBe('Developer');
    expect(members[0]?.initials).toBe('AS');
  });
});
