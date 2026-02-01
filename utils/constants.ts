import { FileSystemNode } from '../types';
import React from 'react';

export const USER_HOME_PATH = ['home', 'user'];

export const DEFAULT_FS: FileSystemNode = {
  type: 'dir',
  children: {
    home: {
      type: 'dir',
      children: {
        user: {
          type: 'dir',
          children: {
            'readme.txt': { type: 'file', content: 'Welcome to WeberOS 1.4!\n\nThis is a fully functional web-based OS.\nTry the new WireBox Browser!' },
            'todo.txt': { type: 'file', content: '- Try WireBox\n- Check Notifications\n- Write a .wbr app with permissions' },
            'hello.wbr': { 
                type: 'file', 
                content: JSON.stringify({
                    id: "hello-world",
                    name: "Hello World",
                    icon: "Smile",
                    permissions: ["notifications"],
                    code: "return () => React.createElement('div', {className: 'h-full flex items-center justify-center bg-purple-600 text-white text-2xl font-bold'}, 'Hello World!')"
                }, null, 2)
            },
            projects: { 
                type: 'dir', 
                children: {
                    'script.js': { type: 'file', content: 'console.log("Hello Coder!");' }
                } 
            },
            uploads: {
                type: 'dir',
                children: {}
            },
            downloads: {
                type: 'dir',
                children: {}
            }
          }
        }
      }
    },
    bin: { type: 'dir', children: {} },
    etc: { type: 'dir', children: {} }
  }
};

export const DEFAULT_APPS = ['explorer', 'terminal', 'wirebox', 'coder', 'snake', 'calco', 'weather', 'settings', 'market', 'helper', 'wepic', 'weplayer'];

export const WALLPAPERS = [
  "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&q=80&w=2070",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2072",
  "https://images.unsplash.com/photo-1506318137071-a8bcbf67cc77?auto=format&fit=crop&q=80&w=2070",
  "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?auto=format&fit=crop&q=80&w=2070",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2070",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2064",
  "https://images.unsplash.com/photo-1497294815431-9365093b7331?auto=format&fit=crop&q=80&w=2070"
];

export const REPO_PACKAGES = [
  { name: 'doom', description: 'DOOM (Shareware)', size: '15MB' },
  { name: 'matrix', description: 'Matrix Screensaver', size: '1MB' },
  ...Array.from({ length: 5 }, (_, i) => ({ name: `tool-${i}`, description: `Utility Tool ${i}`, size: '150KB' }))
];

export const FILE_ASSOCIATIONS: Record<string, string[]> = {
    'txt': ['coder'],
    'md': ['coder'],
    'js': ['coder'],
    'json': ['coder'],
    'wbr': ['coder'],
    'html': ['wirebox', 'coder'],
    'png': ['wepic'],
    'jpg': ['wepic'],
    'jpeg': ['wepic'],
    'gif': ['wepic'],
    'mp3': ['weplayer'],
    'wav': ['weplayer'],
    'ogg': ['weplayer'],
    'mp4': ['weplayer'],
    'webm': ['weplayer'],
    'mkv': ['weplayer'],
    'mov': ['weplayer']
};