import * as LucideIcons from 'lucide-react';

export type FileSystemNode = {
  type: 'file' | 'dir';
  content?: string;
  children?: { [key: string]: FileSystemNode };
};

export type WindowState = {
  id: string;
  appId: string;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { w: number; h: number };
  data?: any;
};

export type CustomApp = {
    id: string;
    name: string;
    iconName: string;
    permissions?: string[];
    code: string; 
};

export type WeatherConfig = {
    mode: 'auto' | 'manual';
    city?: string;
    lat?: number;
    lon?: number;
};

export type SystemNotification = {
    id: string;
    app: string;
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
};

export type UserProfile = {
  username: string;
  password?: string;
  installedPackages: string[];
  customApps: Record<string, CustomApp>;
  fs: FileSystemNode;
  settings: {
      wallpaper: string;
      darkMode: boolean;
      desktopIcons: Record<string, {x: number, y: number}>;
      weather: WeatherConfig;
      notifications: {
          enabled: boolean;
          sound: boolean;
          external: boolean; // Browser notifications
      };
      defaultApps: Record<string, string>; // ext -> appId
  }
};