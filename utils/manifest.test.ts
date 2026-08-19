import { describe, expect, it } from 'vitest';
import { normalizeManifest } from './manifest';

describe('Weber Runtime manifests', () => {
  it('normalizes the legacy fs permission to filesystem', () => {
    const manifest = normalizeManifest({
      id: 'demo-app',
      name: 'Demo App',
      permissions: ['fs', 'notifications'],
      code: "return () => null"
    });
    expect(manifest.permissions).toEqual(['filesystem', 'notifications']);
  });

  it('rejects unknown permissions and invalid ids', () => {
    expect(() => normalizeManifest({
      id: 'demo-app',
      name: 'Demo App',
      permissions: ['network'],
      code: "return () => null"
    })).toThrow('unknown permission');

    expect(() => normalizeManifest({
      id: 'bad id',
      name: 'Demo App',
      code: "return () => null"
    })).toThrow('Invalid app id');
  });
});
