import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { UpdateInternalAgentDto } from './update-internal-agent.dto';

describe('UpdateInternalAgentDto', () => {
  it('rejects empty policy ids at the DTO boundary', async () => {
    const dto = plainToInstance(UpdateInternalAgentDto, {
      modelPolicyId: '',
      promptPolicyId: '',
      approvalPolicyId: '',
    });
    const errors = await validate(dto);
    expect(errors.map((item) => item.property).sort()).toEqual([
      'approvalPolicyId',
      'modelPolicyId',
      'promptPolicyId',
    ]);
  });

  it('rejects whitespace-only policy ids', async () => {
    const dto = plainToInstance(UpdateInternalAgentDto, { modelPolicyId: '   ' });
    const errors = await validate(dto);
    expect(errors.map((item) => item.property)).toContain('modelPolicyId');
  });
});
