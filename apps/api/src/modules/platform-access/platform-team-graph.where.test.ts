import { describe, expect, it } from 'vitest';
import {
  buildProductParticipationWhere,
  buildProjectParticipationWhere,
} from './platform-team-graph.where';

describe('platform-team-graph.where', () => {
  it('includes teamMembers on project and product participation', () => {
    const ids = ['emp-1'];
    const project = buildProjectParticipationWhere(ids);
    const product = buildProductParticipationWhere(ids);

    expect(project.OR?.[0]).toEqual({
      teamMembers: { some: { employeeId: { in: ids } } },
    });
    expect(product.OR?.[0]).toEqual({
      teamMembers: { some: { employeeId: { in: ids } } },
    });
  });
});
