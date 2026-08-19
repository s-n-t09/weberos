import { FileSystemNode } from '../types';
import { USER_HOME_PATH } from './constants';

export const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const cloneFileSystem = (fs: FileSystemNode): FileSystemNode => deepClone(fs);

export const resolvePath = (fs: FileSystemNode, currentPath: string[], targetPath: string): { node: FileSystemNode | null, parent: FileSystemNode | null, name: string, absPath: string[] } => {
  const parts = targetPath.split('/').filter(Boolean);
  let pathStack = targetPath.startsWith('/') ? [...USER_HOME_PATH] : [...currentPath];

  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      if (pathStack.length > USER_HOME_PATH.length) pathStack.pop();
    } else {
      pathStack.push(part);
    }
  }

  let current = fs;
  let parent: FileSystemNode | null = null;
  let lastPart = '';

  for (const part of pathStack) {
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
  for (const part of path) {
    if (current.type === 'dir' && current.children?.[part]) current = current.children[part];
    else return null;
  }
  return current.type === 'dir' ? current.children || {} : null;
};

export const readFileAtPath = (fs: FileSystemNode, path: string): string => {
  const { node } = resolvePath(fs, [], path);
  if (!node || node.type !== 'file') throw new Error(`File not found: ${path}`);
  return node.content || '';
};

export const writeFileAtPath = (fs: FileSystemNode, path: string, content: string): FileSystemNode => {
  const next = cloneFileSystem(fs);
  const parts = path.split('/').filter(Boolean);
  const fileName = parts.pop();
  if (!fileName) throw new Error('Invalid file path.');

  let current = next;
  for (const part of parts) {
    if (current.type !== 'dir' || !current.children?.[part]) {
      throw new Error(`Directory not found: ${parts.join('/')}`);
    }
    current = current.children[part];
  }

  if (current.type !== 'dir') throw new Error('Parent path is not a directory.');
  current.children = current.children || {};
  current.children[fileName] = { type: 'file', content };
  return next;
};

export const removePath = (fs: FileSystemNode, path: string): FileSystemNode => {
  const next = cloneFileSystem(fs);
  const { parent, name } = resolvePath(next, [], path);
  if (!parent || parent.type !== 'dir' || !parent.children?.[name]) {
    throw new Error(`Path not found: ${path}`);
  }
  delete parent.children[name];
  return next;
};
