import { describe, expect, it } from 'vitest';
import { buildDriveMultiLinkConfidentialityOr } from './drive-multi-link-confidentiality.where';

const grantAccess = {
  assetGrants: { some: { granteeEmployeeId: 'emp-1' } },
};

describe('buildDriveMultiLinkConfidentialityOr', () => {
  it('requires finance link for FINANCE_SENSITIVE (deal link alone is insufficient)', () => {
    const paths = buildDriveMultiLinkConfidentialityOr({
      generalTargets: [{ entityType: 'DEAL', entityId: 'deal-1' }],
      financeTargets: [],
      legalTargets: [],
      employeeId: 'emp-1',
      grantAccess,
    });

    expect(paths).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({ confidentiality: 'FINANCE_SENSITIVE' }),
          ]),
        }),
      ]),
    );
    expect(paths).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              confidentiality: { in: ['PUBLIC_INTERNAL', 'CONFIDENTIAL'] },
            }),
            expect.objectContaining({
              links: expect.objectContaining({
                some: expect.objectContaining({
                  OR: [{ entityType: 'DEAL', entityId: 'deal-1' }],
                }),
              }),
            }),
          ]),
        }),
      ]),
    );
  });

  it('allows FINANCE_SENSITIVE only via finance entity link', () => {
    const paths = buildDriveMultiLinkConfidentialityOr({
      generalTargets: [{ entityType: 'DEAL', entityId: 'deal-1' }],
      financeTargets: [{ entityType: 'INVOICE', entityId: 'inv-1' }],
      legalTargets: [],
      employeeId: 'emp-1',
      grantAccess,
    });

    expect(paths).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          AND: [
            {
              links: {
                some: { unlinkedAt: null, OR: [{ entityType: 'INVOICE', entityId: 'inv-1' }] },
              },
            },
            { confidentiality: 'FINANCE_SENSITIVE' },
          ],
        }),
      ]),
    );
  });

  it('does not add inherited path for SECRET_ADJACENT', () => {
    const paths = buildDriveMultiLinkConfidentialityOr({
      generalTargets: [{ entityType: 'PROJECT', entityId: 'proj-1' }],
      financeTargets: [],
      legalTargets: [],
      employeeId: 'emp-1',
      grantAccess,
    });

    const inheritedPaths = paths.filter(
      (path) => 'AND' in path && path.AND !== undefined && !('ownerId' in path),
    );
    expect(inheritedPaths.every((path) => !JSON.stringify(path).includes('SECRET_ADJACENT'))).toBe(
      true,
    );
  });
});
