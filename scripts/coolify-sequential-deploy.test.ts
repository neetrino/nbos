import { describe, expect, it } from 'vitest';
import {
  classifyDeploymentStatus,
  extractDeploymentRecords,
  formatDeployAppLine,
  formatDeployReadyReport,
  normalizeCoolifyUrl,
  parseCliArgs,
  parseDotEnv,
  parseQueuedDeploymentUuid,
  pickDeployment,
  resolveApps,
  resolveCoolifyConfig,
} from './coolify-sequential-deploy.lib.mjs';

describe('coolify sequential deploy helpers', () => {
  it('parses quoted env values and ignores comments', () => {
    const env = parseDotEnv(`
# comment
COOLIFY_API_URL="https://coolify.example.com/"
COOLIFY_TOKEN='token-value'
EMPTY=
`);
    expect(env.COOLIFY_API_URL).toBe('https://coolify.example.com/');
    expect(env.COOLIFY_TOKEN).toBe('token-value');
    expect(env.EMPTY).toBe('');
  });

  it('keeps runbook order and expands groups', () => {
    expect(resolveApps(['web', 'backend'])).toEqual(['api', 'worker', 'scheduler', 'web']);
    expect(resolveApps([])).toEqual(['api', 'worker', 'scheduler', 'web']);
    expect(parseCliArgs(['--force', 'web']).apps).toEqual(['web']);
    expect(parseCliArgs(['--force', 'web']).force).toBe(true);
    expect(parseCliArgs(['--status']).dryRun).toBe(true);
    expect(parseCliArgs(['--dry-run']).dryRun).toBe(true);
  });

  it('reads either Coolify token name and requires app UUIDs', () => {
    const config = resolveCoolifyConfig(
      {
        COOLIFY_API_URL: 'https://coolify.neetrino.com/',
        COOLIFY_TOKEN: 'token',
        COOLIFY_APP_WEB_UUID: 'web-uuid',
      },
      ['web'],
    );
    expect(config.baseUrl).toBe('https://coolify.neetrino.com');
    expect(config.token).toBe('token');
    expect(config.uuids.web).toBe('web-uuid');
    expect(() => resolveCoolifyConfig({ COOLIFY_API_URL: 'https://x' }, ['web'])).toThrow(
      /COOLIFY_API_TOKEN|COOLIFY_TOKEN/,
    );
  });

  it('classifies Coolify deployment statuses', () => {
    expect(classifyDeploymentStatus('finished')).toBe('success');
    expect(classifyDeploymentStatus('failed')).toBe('failed');
    expect(classifyDeploymentStatus('cancelled-by-user')).toBe('failed');
    expect(classifyDeploymentStatus('queued')).toBe('running');
    expect(classifyDeploymentStatus('in_progress')).toBe('running');
    expect(classifyDeploymentStatus('mystery')).toBe('unknown');
  });

  it('reads a queued deployment UUID from Coolify payloads', () => {
    const uuid = parseQueuedDeploymentUuid(
      {
        deployments: [{ resource_uuid: 'app-1', deployment_uuid: 'dep-1' }],
      },
      'app-1',
    );
    expect(uuid).toBe('dep-1');
    expect(
      pickDeployment(extractDeploymentRecords([{ uuid: 'dep-1', status: 'finished' }]), 'dep-1')
        ?.status,
    ).toBe('finished');
  });

  it('prints a colored deploy check without starting Coolify', () => {
    const report = formatDeployReadyReport({
      apps: ['api', 'web'],
      force: false,
      checkOnly: true,
      color: false,
    });
    expect(report).toContain('api → web');
    expect(report).toContain('Check only');
    expect(formatDeployAppLine('api', 'success', undefined, false)).toBe('✓ api finished');
  });

  it('normalizes the Coolify base URL', () => {
    expect(normalizeCoolifyUrl('https://coolify.neetrino.com/')).toBe(
      'https://coolify.neetrino.com',
    );
  });
});
