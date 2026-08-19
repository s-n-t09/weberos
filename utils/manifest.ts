import { CustomApp, SystemPermission } from '../types';

export const SYSTEM_PERMISSIONS: SystemPermission[] = [
  'notifications',
  'camera',
  'microphone',
  'geolocation',
  'filesystem'
];

const LEGACY_PERMISSION_MAP: Record<string, SystemPermission> = {
  fs: 'filesystem'
};

export type WbrManifest = {
  id: string;
  name: string;
  icon?: string;
  version?: string;
  permissions: SystemPermission[];
  code: string | string[];
};

export const normalizePermission = (permission: unknown): SystemPermission | null => {
  if (typeof permission !== 'string') return null;
  const normalized = LEGACY_PERMISSION_MAP[permission] || permission;
  return SYSTEM_PERMISSIONS.includes(normalized as SystemPermission)
    ? normalized as SystemPermission
    : null;
};

export const normalizeManifest = (value: unknown): WbrManifest => {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid Weber Runtime manifest.');
  }

  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const code = raw.code;

  if (!/^[a-z0-9][a-z0-9-_]{1,63}$/i.test(id)) {
    throw new Error('Invalid app id. Use 2-64 letters, numbers, hyphens, or underscores.');
  }
  if (!name || name.length > 80) {
    throw new Error('Invalid app name.');
  }
  if (typeof code !== 'string' && !Array.isArray(code)) {
    throw new Error('Invalid app code.');
  }
  if (Array.isArray(code) && code.some(line => typeof line !== 'string')) {
    throw new Error('Invalid app code lines.');
  }

  const rawPermissions = Array.isArray(raw.permissions) ? raw.permissions : [];
  const permissions = rawPermissions.map(normalizePermission);
  if (permissions.some(permission => permission === null)) {
    throw new Error('Manifest contains an unknown permission.');
  }

  return {
    id,
    name,
    icon: typeof raw.icon === 'string' ? raw.icon : typeof raw.iconName === 'string' ? raw.iconName : 'Box',
    version: typeof raw.version === 'string' ? raw.version : '1.0.0',
    permissions: permissions as SystemPermission[],
    code: code as string | string[]
  };
};

export const manifestToCustomApp = (manifest: WbrManifest): CustomApp => ({
  id: manifest.id,
  name: manifest.name,
  iconName: manifest.icon || 'Box',
  version: manifest.version,
  code: Array.isArray(manifest.code) ? manifest.code.join('\n') : manifest.code,
  permissions: manifest.permissions
});
