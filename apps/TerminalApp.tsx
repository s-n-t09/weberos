import React, { useState, useRef, useEffect } from 'react';
import { resolvePath } from '../utils/fs';
import { USER_HOME_PATH, REPO_PACKAGES } from '../utils/constants';
import { FileSystemNode, UserProfile } from '../types';

interface TerminalAppProps {
    fs: FileSystemNode;
    setFs: (fs: FileSystemNode) => void;
    user: UserProfile;
    setUser: (u: UserProfile) => void;
}

export const TerminalApp = ({ fs, setFs, user, setUser }: TerminalAppProps) => {
  const [path, setPath] = useState(USER_HOME_PATH);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>(['Welcome to WeberOS Terminal v2.0', 'Type "help" for a list of commands.']);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const cmd = input.trim();
      // Only show relative path in prompt
      const displayPath = path.length <= USER_HOME_PATH.length ? '~' : '~/' + path.slice(USER_HOME_PATH.length).join('/');
      setHistory(prev => [...prev, `${user.username}@weberos:${displayPath}$ ${input}`]);
      if (cmd) processCommand(cmd);
      setInput('');
    }
  };

  const processCommand = (cmdStr: string) => {
    const [cmd, ...args] = cmdStr.split(' ');
    let output: string | null = null;

    switch (cmd) {
      case 'help':
        output = `Available commands:
  help                Show this help message
  clear               Clear terminal
  ls [path]           List directory contents
  cd [path]           Change directory
  pwd                 Print working directory
  cat [file]          Read file
  mkdir [name]        Create directory
  touch [name]        Create empty file
  rm [name]           Remove file or directory
  wpm                 Weber Package Manager`;
        break;
      case 'clear': setHistory([]); return;
      case 'ls': {
        const target = args[0] || '.';
        const { node } = resolvePath(fs, path, target);
        if (node && node.type === 'dir') output = Object.keys(node.children || {}).join('  ');
        else output = `ls: cannot access '${target}': No such file or directory`;
        break;
      }
      case 'cd': {
        const target = args[0] || '';
        if (!target) {
            setPath(USER_HOME_PATH);
            break;
        }
        const { node, absPath } = resolvePath(fs, path, target);
        if (node && node.type === 'dir') {
             // Security check: ensure absPath starts with USER_HOME_PATH
             if (absPath.length < USER_HOME_PATH.length) {
                 output = `cd: Access denied. Restricted to user home.`;
             } else {
                 setPath(absPath);
             }
        }
        else output = `cd: ${target}: No such directory`;
        break;
      }
      case 'pwd': {
          output = '/' + path.join('/');
          break;
      }
      case 'mkdir': {
        if (!args[0]) { output = 'mkdir: missing operand'; break; }
        const { node, parent, name } = resolvePath(fs, path, args[0]);
        if (node) { output = `mkdir: cannot create directory '${args[0]}': File exists`; break; }
        
        if (parent && parent.type === 'dir') {
          parent.children = { ...parent.children, [name]: { type: 'dir', children: {} } };
          setFs({ ...fs }); 
        } else {
            output = `mkdir: cannot create directory '${args[0]}': No such file or directory`;
        }
        break;
      }
      case 'touch': {
        if (!args[0]) { output = 'touch: missing operand'; break; }
        const { node, parent, name } = resolvePath(fs, path, args[0]);
        if (node) break; 
        if (parent && parent.type === 'dir') {
          parent.children = { ...parent.children, [name]: { type: 'file', content: '' } };
          setFs({ ...fs });
        } else {
            output = `touch: cannot create file '${args[0]}': No such file or directory`;
        }
        break;
      }
      case 'rm': {
        if (!args[0]) { output = 'rm: missing operand'; break; }
        const { node, parent, name } = resolvePath(fs, path, args[0]);
        if (node && parent && parent.children) {
          delete parent.children[name];
          setFs({ ...fs });
        } else output = `rm: cannot remove '${args[0]}': No such file or directory`;
        break;
      }
      case 'cat': {
        if (!args[0]) { output = 'cat: missing operand'; break; }
        const { node } = resolvePath(fs, path, args[0]);
        if (node && node.type === 'file') output = node.content || '';
        else output = `cat: ${args[0]}: No such file`;
        break;
      }
      case 'wpm': {
        const subCmd = args[0];
        if (subCmd === 'install') {
            const pkgName = args[1];
            if (!pkgName) { output = 'Usage: wpm install <package|file.wbr>'; break; }
            if (pkgName.endsWith('.wbr')) {
                const { node } = resolvePath(fs, path, pkgName);
                if (node && node.type === 'file') {
                    try {
                        const pkgData = JSON.parse(node.content || '{}');
                        if (pkgData.id && pkgData.name && pkgData.code) {
                            output = `Installing local package ${pkgData.name}... Success!`;
                            const newCustomApps = { ...user.customApps, [pkgData.id]: { id: pkgData.id, name: pkgData.name, iconName: pkgData.icon || 'Box', code: pkgData.code }};
                            const newPkgs = user.installedPackages.includes(pkgData.id) ? user.installedPackages : [...user.installedPackages, pkgData.id];
                            setUser({...user, installedPackages: newPkgs, customApps: newCustomApps});
                        } else output = 'Error: Invalid .wbr package.';
                    } catch (e) { output = 'Error: Failed to parse package.'; }
                } else output = `File not found: ${pkgName}`;
            } else {
                const pkg = REPO_PACKAGES.find(p => p.name === pkgName);
                if (pkg) {
                    if (user.installedPackages.includes(pkgName)) {
                        output = `Package ${pkgName} is already installed.`;
                    } else {
                        output = `Installed ${pkgName}.`;
                        const newPkgs = [...user.installedPackages, pkgName];
                        setUser({...user, installedPackages: newPkgs});
                    }
                } else output = `Package not found in repo.`;
            }
        } else if (subCmd === 'remove') {
            const pkgName = args[1];
            if (!pkgName) { output = 'Usage: wpm remove <package_id>'; break; }
            if (!user.installedPackages.includes(pkgName)) {
                output = `Package ${pkgName} is not installed.`;
            } else {
                const newPkgs = user.installedPackages.filter((p: string) => p !== pkgName);
                const newCustomApps = { ...user.customApps };
                delete newCustomApps[pkgName];
                setUser({...user, installedPackages: newPkgs, customApps: newCustomApps});
                output = `Removed ${pkgName}.`;
            }
        } else if (subCmd === 'list') {
            output = 'Installed Packages:\n' + (user.installedPackages.length ? user.installedPackages.join('\n') : '(none)');
        } else {
            output = 'Usage: wpm <install|remove|list>';
        }
        break;
      }
      default: output = `${cmd}: command not found`;
    }
    if (output) setHistory(prev => [...prev, output as string]);
  };

  const displayPath = path.length <= USER_HOME_PATH.length ? '~' : '~/' + path.slice(USER_HOME_PATH.length).join('/');

  return (
    <div className="bg-black text-green-400 p-2 font-mono h-full text-sm overflow-hidden flex flex-col" onClick={() => document.getElementById('term-input')?.focus()}>
      <div className="flex-1 overflow-y-auto">
        {history.map((line, i) => <div key={i} className="whitespace-pre-wrap mb-1">{line}</div>)}
        <div ref={endRef} />
      </div>
      <div className="flex mt-2">
        <span className="mr-2 text-blue-400">{user.username}@weberos:{displayPath}$</span>
        <input 
          id="term-input" type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none flex-1 text-green-400" autoFocus autoComplete="off"
        />
      </div>
    </div>
  );
};
