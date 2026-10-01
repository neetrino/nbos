/** @vitest-environment jsdom */
import { act, createElement, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProductRegistration } from './use-product-registration';

const getById = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api/projects', () => ({ projectsApi: { getById } }));
let root: Root;
let state: ReturnType<typeof useProductRegistration>;
function Probe() {
  const current = useProductRegistration();
  useEffect(() => {
    state = current;
  });
  return null;
}
function record(id: string) {
  return {
    name: id,
    contact: { id: `${id}-contact`, firstName: id, lastName: 'Client' },
    company: { id: `${id}-company`, name: id },
  };
}
describe('product registration project context', () => {
  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    getById.mockReset();
    root = createRoot(document.createElement('div'));
    act(() => root.render(createElement(Probe)));
  });
  afterEach(() => {
    act(() => root.unmount());
    vi.unstubAllGlobals();
  });
  it('inherits links from the selected existing project', async () => {
    getById.mockResolvedValue(record('existing'));
    await act(async () => state.setProject({ mode: 'existing', id: 'existing', label: '' }));
    expect(state.contact.id).toBe('existing-contact');
    expect(state.company.id).toBe('existing-company');
    expect(state.resolving).toBe(false);
  });
  it('preserves explicit choices and ignores a stale response after switching to creation', async () => {
    let resolve!: (value: ReturnType<typeof record>) => void;
    getById.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    act(() => state.setProject({ mode: 'existing', id: 'old', label: '' }));
    expect(state.resolving).toBe(true);
    act(() => {
      state.selectContact('chosen-contact', 'Chosen');
      state.selectCompany({ mode: 'create', id: '', label: '' });
      state.setProject({ mode: 'create', id: '', label: '' });
    });
    await act(async () => resolve(record('old')));
    expect(state.project.mode).toBe('create');
    expect(state.contact.id).toBe('chosen-contact');
    expect(state.company.mode).toBe('create');
    expect(state.resolving).toBe(false);
  });
  it('does not overwrite explicit company/contact while a current request resolves', async () => {
    let resolve!: (value: ReturnType<typeof record>) => void;
    getById.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    act(() => state.setProject({ mode: 'existing', id: 'current', label: '' }));
    act(() => {
      state.selectContact('explicit', 'Explicit');
      state.selectCompany({ mode: 'none', id: '', label: '' });
    });
    await act(async () => resolve(record('current')));
    expect(state.contact.id).toBe('explicit');
    expect(state.company.mode).toBe('none');
    expect(state.project.label).toBe('current');
  });
  it('starts a fresh loading state when reselecting a previously resolved project', async () => {
    getById.mockResolvedValueOnce(record('same'));
    await act(async () => state.setProject({ mode: 'existing', id: 'same', label: '' }));
    act(() => state.setProject({ mode: 'create', id: '', label: '' }));
    let resolve!: (value: ReturnType<typeof record>) => void;
    getById.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    act(() => state.setProject({ mode: 'existing', id: 'same', label: '' }));
    expect(state.resolving).toBe(true);
    await act(async () => resolve(record('same')));
    expect(state.resolving).toBe(false);
  });
});
