import { calculateConnectionBudget } from '../../packages/database/src/connection-budget';

const breakdown = calculateConnectionBudget(process.env);
for (const line of breakdown.lines) {
  // eslint-disable-next-line no-console -- CLI output
  console.log(line);
}
process.exitCode = breakdown.status === 'OVER_BUDGET' ? 1 : 0;
