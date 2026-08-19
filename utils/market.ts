import { normalizeManifest, WbrManifest } from './manifest';

export type MarketApp = {
  id: string;
  name: string;
  description?: string;
  author?: string;
  version?: string;
  icon?: string;
  permissions?: string[];
  location?: string;
  category: string;
  color: string;
  code?: string | string[];
};

const CATEGORY_COLORS: Record<string, string> = {
  Programming: 'bg-indigo-500',
  Media: 'bg-pink-500',
  Games: 'bg-orange-500',
  Tools: 'bg-emerald-500',
  Other: 'bg-yellow-500'
};

const getWbrModules = () => import.meta.glob('/market/apps/*.wbr', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;

export const loadWbrManifest = async (location: string): Promise<WbrManifest> => {
  const path = location.startsWith('/') ? location : `/${location}`;
  const modules = getWbrModules();
  let raw: string;

  if (modules[path]) {
    raw = await modules[path]();
  } else {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load package: ${response.status}`);
    raw = await response.text();
  }

  return normalizeManifest(JSON.parse(raw));
};

export const loadMarketApps = async (): Promise<MarketApp[]> => {
  const categoryModules = import.meta.glob('/market/*.json', { eager: true, query: '?json', import: 'default' }) as Record<string, unknown>;
  const apps: MarketApp[] = [];

  for (const [path, module] of Object.entries(categoryModules)) {
    const fileName = path.split('/').pop()?.replace('.json', '') || 'other';
    const category = fileName.charAt(0).toUpperCase() + fileName.slice(1);
    const entries = Array.isArray(module) ? module : [];

    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue;
      const app = entry as Record<string, unknown>;
      const result: MarketApp = {
        id: typeof app.id === 'string' ? app.id : '',
        name: typeof app.name === 'string' ? app.name : 'Unnamed App',
        description: typeof app.description === 'string' ? app.description : '',
        author: typeof app.author === 'string' ? app.author : '',
        version: typeof app.version === 'string' ? app.version : undefined,
        icon: typeof app.icon === 'string' ? app.icon : 'Package',
        permissions: Array.isArray(app.permissions) ? app.permissions.filter((value): value is string => typeof value === 'string') : [],
        location: typeof app.location === 'string' ? app.location : undefined,
        category,
        color: CATEGORY_COLORS[category] || 'bg-slate-500'
      };

      if (result.location && !result.version) {
        try {
          result.version = (await loadWbrManifest(result.location)).version;
        } catch (error) {
          console.warn(`Failed to read version for ${result.id}`, error);
        }
      }
      if (result.id) apps.push(result);
    }
  }

  return apps;
};
