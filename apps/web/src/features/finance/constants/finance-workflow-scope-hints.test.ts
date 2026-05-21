import { describe, expect, it } from 'vitest';
import { resolveExpenseWorkflowScopeVariant } from './finance-workflow-scope-hints';

describe('resolveExpenseWorkflowScopeVariant', () => {
  it('maps route variants to hero scope hints', () => {
    expect(resolveExpenseWorkflowScopeVariant('default')).toBe('expense-active');
    expect(resolveExpenseWorkflowScopeVariant('backlog')).toBe('expense-backlog');
    expect(resolveExpenseWorkflowScopeVariant('closed')).toBe('expense-closed');
  });
});
