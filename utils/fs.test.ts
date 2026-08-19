import { describe, expect, it } from 'vitest';
import { DEFAULT_FS } from './constants';
import { cloneFileSystem, readFileAtPath, resolvePath, writeFileAtPath } from './fs';

describe('virtual filesystem', () => {
  it('keeps absolute paths inside the user home jail', () => {
    const result = resolvePath(DEFAULT_FS, [], '/../../readme.txt');
    expect(result.absPath).toEqual(['home', 'user', 'readme.txt']);
    expect(result.node?.type).toBe('file');
  });

  it('reads user files and returns a new tree on writes', () => {
    const original = cloneFileSystem(DEFAULT_FS);
    const updated = writeFileAtPath(original, 'home/user/readme.txt', 'Updated');
    expect(readFileAtPath(updated, 'home/user/readme.txt')).toBe('Updated');
    expect(readFileAtPath(original, 'home/user/readme.txt')).not.toBe('Updated');
  });
});
