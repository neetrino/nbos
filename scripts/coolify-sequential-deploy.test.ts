import { describe, expect, it } from 'vitest';
import {
  classifyDeploymentStatus,
  extractDeploymentRecords,
  formatDeployAppLine,
  formatDeployReadyReport,
  formatNetworkError,
  isTransientNetworkError,
  normalizeCoolifyUrl,
  parseCliArgs,
  parseDotEnv,
  parseQueuedDeploymentUuid,
  pickDeployment,
  resolveApps,
  resolveCoolifyConfig,
} from './coolify-sequential-deploy.lib.mjs';
import { shouldRetryFailedDeploy } from './coolify-sequential-deploy.retry.mjs';
import {
  buildDockerCleanupRunRequest,
  classifyCleanupExecution,
  extractCleanupExecutions,
  formatCleanupHttpError,
  isSameCleanupExecution,
  shouldCleanupBeforeApp,
} from './coolify-sequential-deploy.cleanup.mjs';

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
    expect(parseCliArgs(['--', 'web']).apps).toEqual(['web']);
    expect(parseCliArgs(['--status']).dryRun).toBe(true);
    expect(parseCliArgs(['--dry-run']).dryRun).toBe(true);
  });

  it('reads either Coolify token name and requires app UUIDs', () => {
    const config = resolveCoolifyConfig(
      {
        COOLIFY_API_URL: 'https://coolify.neetrino.com/',
        COOLIFY_TOKEN: 'token',
        COOLIFY_APP_WEB_UUID: 'web-uuid',
        COOLIFY_SERVER_UUID: 'server-uuid',
      },
      ['web'],
    );
    expect(config.baseUrl).toBe('https://coolify.neetrino.com');
    expect(config.token).toBe('token');
    expect(config.serverUuid).toBe('server-uuid');
    expect(config.uuids.web).toBe('web-uuid');
    expect(() => resolveCoolifyConfig({ COOLIFY_API_URL: 'https://x' }, ['web'])).toThrow(
      /COOLIFY_API_TOKEN|COOLIFY_TOKEN/,
    );
    expect(() =>
      resolveCoolifyConfig(
        {
          COOLIFY_API_URL: 'https://x',
          COOLIFY_TOKEN: 'token',
          COOLIFY_APP_WEB_UUID: 'web-uuid',
        },
        ['web'],
      ),
    ).toThrow(/COOLIFY_SERVER_UUID/);
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

  it('treats poll fetch failures as transient network errors', () => {
    expect(isTransientNetworkError(new Error('fetch failed'))).toBe(true);
    expect(
      isTransientNetworkError(new Error('Coolify GET /deployments/x network error: fetch failed')),
    ).toBe(true);
    expect(isTransientNetworkError(Object.assign(new Error('nope'), { status: 500 }))).toBe(false);
    expect(formatNetworkError(new Error('fetch failed'))).toBe('fetch failed');
  });

  it('retries once on export or disk failure, including hidden logs', () => {
    expect(
      shouldRetryFailedDeploy({
        status: 'failed',
        logs: [{ output: '#25 exporting layers' }],
      }),
    ).toBe(true);
    expect(shouldRetryFailedDeploy({ status: 'failed' })).toBe(true);
    expect(formatDeployAppLine('web', 'retry', undefined, false)).toBe(
      '⚠ web failed, retrying once',
    );
  });

  it('runs docker cleanup without deleting volumes', () => {
    const request = buildDockerCleanupRunRequest('server-uuid');
    expect(request.method).toBe('POST');
    expect(request.path).toBe('/servers/server-uuid/docker-cleanup/run');
    expect(request.body).toEqual({
      delete_unused_volumes: false,
      delete_unused_networks: false,
    });
    expect(JSON.stringify(request.body)).not.toContain('true');
    expect(classifyCleanupExecution({ status: 'success' })).toBe('success');
    expect(isSameCleanupExecution('job-old', { uuid: 'job-old', status: 'success' })).toBe(true);
    expect(isSameCleanupExecution('job-old', { uuid: 'job-new', status: 'success' })).toBe(false);
    expect(extractCleanupExecutions([{ uuid: 'job-1', status: 'in_progress' }])[0]?.uuid).toBe(
      'job-1',
    );
    expect(formatCleanupHttpError(404)).toMatch(/404/);
    expect(formatDeployAppLine('web', 'cleanup', undefined, false)).toBe('▶ Docker cleanup');
    expect(shouldCleanupBeforeApp(['api', 'worker', 'scheduler', 'web'], 'api')).toBe(false);
    expect(shouldCleanupBeforeApp(['api', 'worker', 'scheduler', 'web'], 'web')).toBe(true);
    expect(shouldCleanupBeforeApp(['web'], 'web')).toBe(false);
  });

  it('does not retry cancel, healthcheck, or application errors', () => {
    expect(shouldRetryFailedDeploy({ status: 'cancelled-by-user' })).toBe(false);
    expect(shouldRetryFailedDeploy({ status: 'cancelled', logs: 'exporting layers' })).toBe(false);
    expect(
      shouldRetryFailedDeploy({
        status: 'failed',
        logs: 'Waiting for healthcheck to pass on the new container.',
      }),
    ).toBe(false);
    expect(
      shouldRetryFailedDeploy({
        status: 'failed',
        logs: JSON.stringify([{ output: "Nest can't resolve dependencies of AuthService" }]),
      }),
    ).toBe(false);
  });
});
