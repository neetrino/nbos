import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { AiPlatformCoreModule } from './ai-platform-core.module';
import { AiPlatformModule } from './ai-platform.module';

/**
 * Nest resolves controller and provider constructors at boot, so a missing
 * module import only surfaces when a process starts. The AI Platform is split
 * across two processes (API mounts `AiPlatformModule`, the scheduler mounts
 * `AiPlatformCoreModule` alone), which doubles the chance of an unnoticed gap.
 * These assertions replay Nest's own resolution rules against module metadata.
 */

type Ctor = new (...args: never[]) => unknown;
type ModuleRef = Ctor | { module: Ctor; providers?: unknown[]; exports?: unknown[] };

/** Provided by the Nest runtime or a global module every process bootstraps. */
const AMBIENT_PROVIDERS: readonly Ctor[] = [Reflector, ConfigService];

const IMPORTS_METADATA = 'imports';
const PROVIDERS_METADATA = 'providers';
const EXPORTS_METADATA = 'exports';
const CONTROLLERS_METADATA = 'controllers';
const PARAMTYPES_METADATA = 'design:paramtypes';
const SELF_PARAMTYPES_METADATA = 'self:paramtypes';

function isCtor(value: unknown): value is Ctor {
  return typeof value === 'function';
}

function unwrapModule(value: unknown): Ctor | null {
  if (isCtor(value)) return value;
  if (value !== null && typeof value === 'object' && 'module' in value) {
    const inner = (value as { module: unknown }).module;
    return isCtor(inner) ? inner : null;
  }
  if (value !== null && typeof value === 'object' && 'forwardRef' in value) {
    const resolved = (value as { forwardRef: () => unknown }).forwardRef();
    return unwrapModule(resolved);
  }
  return null;
}

function readMetadata(target: Ctor, key: string): unknown[] {
  const raw = Reflect.getMetadata(key, target) as unknown;
  return Array.isArray(raw) ? raw : [];
}

function providerToken(provider: unknown): unknown {
  if (isCtor(provider)) return provider;
  if (provider !== null && typeof provider === 'object' && 'provide' in provider) {
    return (provider as { provide: unknown }).provide;
  }
  return provider;
}

function isModuleClass(value: Ctor): boolean {
  return (
    Reflect.getMetadata(PROVIDERS_METADATA, value) !== undefined ||
    Reflect.getMetadata(CONTROLLERS_METADATA, value) !== undefined ||
    Reflect.getMetadata(IMPORTS_METADATA, value) !== undefined
  );
}

/** Tokens a consumer of `module` can inject, following re-exported modules. */
function collectExportedTokens(module: ModuleRef, seen = new Set<Ctor>()): Set<unknown> {
  const tokens = new Set<unknown>();
  const target = unwrapModule(module);
  if (target === null || seen.has(target)) return tokens;
  seen.add(target);

  for (const exported of readMetadata(target, EXPORTS_METADATA)) {
    const asModule = unwrapModule(exported);
    if (asModule !== null && isModuleClass(asModule)) {
      for (const inherited of collectExportedTokens(asModule, seen)) tokens.add(inherited);
      continue;
    }
    tokens.add(providerToken(exported));
  }
  return tokens;
}

/** Class dependencies Nest must resolve for `target`, ignoring `@Inject()` tokens. */
function classDependencies(target: Ctor): Ctor[] {
  const paramtypes = readMetadata(target, PARAMTYPES_METADATA);
  const custom = Reflect.getMetadata(SELF_PARAMTYPES_METADATA, target) as
    | { index: number }[]
    | undefined;
  const customIndexes = new Set((custom ?? []).map((entry) => entry.index));
  return paramtypes.filter(
    (paramtype, index): paramtype is Ctor => isCtor(paramtype) && !customIndexes.has(index),
  );
}

function resolvableTokens(module: Ctor): Set<unknown> {
  const tokens = new Set<unknown>([
    ...AMBIENT_PROVIDERS,
    ...readMetadata(module, PROVIDERS_METADATA).map((provider) => providerToken(provider)),
  ]);
  for (const imported of readMetadata(module, IMPORTS_METADATA)) {
    for (const token of collectExportedTokens(imported as ModuleRef)) tokens.add(token);
  }
  return tokens;
}

function unresolvedDependencies(module: Ctor, consumers: unknown[]): string[] {
  const available = resolvableTokens(module);
  const missing: string[] = [];
  for (const consumer of consumers) {
    const target = providerToken(consumer);
    if (!isCtor(target)) continue;
    for (const dependency of classDependencies(target)) {
      if (isModuleClass(dependency) || available.has(dependency)) continue;
      missing.push(`${target.name} -> ${dependency.name}`);
    }
  }
  return missing;
}

describe('AI Platform module wiring (AM 635-637)', () => {
  it('resolves every controller dependency of the HTTP module', () => {
    const controllers = readMetadata(AiPlatformModule, CONTROLLERS_METADATA);
    expect(controllers.length).toBeGreaterThan(0);
    expect(unresolvedDependencies(AiPlatformModule, controllers)).toEqual([]);
  });

  it('resolves every provider dependency of the core module', () => {
    const providers = readMetadata(AiPlatformCoreModule, PROVIDERS_METADATA);
    expect(providers.length).toBeGreaterThan(0);
    expect(unresolvedDependencies(AiPlatformCoreModule, providers)).toEqual([]);
  });

  it('keeps the External Agent and admin HTTP surface off the core module', () => {
    expect(readMetadata(AiPlatformCoreModule, CONTROLLERS_METADATA)).toEqual([]);
  });
});
