import { FileSystemNode } from '../types';
import { USER_HOME_PATH } from './constants';

export const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

export const resolvePath = (fs: FileSystemNode, currentPath: string[], targetPath: string): { node: FileSystemNode | null, parent: FileSystemNode | null, name: string, absPath: string[] } => {
  const parts = targetPath.split('/').filter(p => p !== '');
  
  // Enforce jail: if path starts with /, map it to user home relative.
  let pathStack = targetPath.startsWith('/') 
    ? [...USER_HOME_PATH] // Root is user home
    : [...currentPath];
  
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      // Prevent going above user home
      if (pathStack.length > USER_HOME_PATH.length) {
          pathStack.pop();
      }
    } else {
      pathStack.push(part);
    }
  }

  let current = fs;
  let parent = null;
  let lastPart = '';

  for (let i = 0; i < pathStack.length; i++) {
    const part = pathStack[i];
    if (current.type !== 'dir' || !current.children || !current.children[part]) {
      return { node: null, parent: current, name: part, absPath: pathStack };
    }
    parent = current;
    current = current.children[part];
    lastPart = part;
  }

  return { node: current, parent, name: lastPart, absPath: pathStack };
};

export const getDirContents = (fs: FileSystemNode, path: string[]) => {
    let current = fs;
    for (const p of path) {
        if (current.children && current.children[p]) {
            current = current.children[p];
        } else {
            return null;
        }
    }
    return current.children || {};
}
