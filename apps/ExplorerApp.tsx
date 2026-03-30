import React, { useState } from 'react';
import { ArrowUp, FilePlus, Plus, Copy, Scissors, Clipboard, Trash2, Folder, FileText } from 'lucide-react';
import { FileSystemNode, UserProfile } from '../types';
import { getDirContents, deepClone } from '../utils/fs';
import { USER_HOME_PATH } from '../utils/constants';
import { osAlert, osConfirm, osPrompt } from '../components/DialogHost';
import { playTrash } from '../utils/sounds';

interface ExplorerAppProps {
    fs: FileSystemNode;
    setFs: (fs: FileSystemNode) => void;
    user: UserProfile;
    mode?: 'normal' | 'picker' | 'saver';
    onPick?: (path: string) => void;
    onOpen?: (path: string) => void;
    onOpenWith?: (path: string) => void;
}

export const ExplorerApp = ({ fs, setFs, user, mode = 'normal', onPick, onOpen, onOpenWith }: ExplorerAppProps) => {
    const [path, setPath] = useState(USER_HOME_PATH);
    const [selected, setSelected] = useState<string | null>(null);
    const [clipboard, setClipboard] = useState<{ type: 'copy' | 'cut', path: string[], node: FileSystemNode } | null>(null);
    const [contextMenu, setContextMenu] = useState<{x: number, y: number, file: string} | null>(null);
    const [saveFileName, setSaveFileName] = useState<string>('');

    const dirContents = getDirContents(fs, path) || {};

    React.useEffect(() => {
        const contents = getDirContents(fs, path) || {};
        if (selected && contents[selected]?.type === 'file') {
            setSaveFileName(selected);
        }
    }, [selected, fs, path]);

    const sortedItems = Object.entries(dirContents).sort((a, b) => {
        if (a[1].type === b[1].type) return a[0].localeCompare(b[0]);
        return a[1].type === 'dir' ? -1 : 1;
    });

    const getRelativePathDisplay = () => {
        // Show / for home/user, and /foo for home/user/foo
        if (path.length <= USER_HOME_PATH.length) return '/';
        return '/' + path.slice(USER_HOME_PATH.length).join('/');
    };

    const handleNavigate = (name: string, type: 'dir' | 'file') => {
        if (type === 'dir') {
            setPath([...path, name]);
            setSelected(null);
        } else {
            // File Handling
            const fullPath = [...path, name].join('/');
            if (mode === 'picker' && onPick) {
                onPick(fullPath);
            } else if (mode === 'normal' && onOpen) {
                onOpen(fullPath);
            }
        }
    };

    const handleUp = () => {
        if (path.length > USER_HOME_PATH.length) {
            setPath(path.slice(0, -1));
            setSelected(null);
        }
    };

    const handleCopy = () => {
        if (!selected) return;
        const node = dirContents[selected];
        // Deep clone for copy to avoid reference issues
        setClipboard({ type: 'copy', path: [...path, selected], node: deepClone(node) });
    };

    const handleCut = () => {
        if (!selected) return;
        const node = dirContents[selected];
        setClipboard({ type: 'cut', path: [...path, selected], node: node });
    };

    const handlePaste = () => {
        if (!clipboard) return;
        
        let targetParent = fs;
        for (const p of path) {
            if (targetParent.children) targetParent = targetParent.children[p];
        }

        if (targetParent.type !== 'dir' || !targetParent.children) return;

        const originalName = clipboard.path[clipboard.path.length - 1];
        let newName = originalName;
        let counter = 1;

        while (targetParent.children[newName]) {
            const parts = originalName.split('.');
            if (parts.length > 1) {
                const ext = parts.pop();
                newName = `${parts.join('.')} (${counter}).${ext}`;
            } else {
                newName = `${originalName} (${counter})`;
            }
            counter++;
        }

        // Add to new location
        targetParent.children[newName] = deepClone(clipboard.node);

        // Handle Cut: Remove from original location
        if (clipboard.type === 'cut') {
            const parentPath = clipboard.path.slice(0, -1);
            const fileName = clipboard.path[clipboard.path.length - 1];
            let oldParent = fs;
            for (const p of parentPath) {
                if (oldParent.children) oldParent = oldParent.children[p];
            }
            if (oldParent.children) {
                delete oldParent.children[fileName];
            }
            setClipboard(null); // Clear clipboard after cut-paste
        }

        setFs({ ...fs });
    };

    const handleDelete = async () => {
        if (!selected) return;
        const confirm = await osConfirm(`Are you sure you want to delete ${selected}?`);
        if (confirm) {
            let parent = fs;
            for (const p of path) {
                if (parent.children) parent = parent.children[p];
            }
            if (parent.children) {
                delete parent.children[selected];
                playTrash();
                setFs({ ...fs });
                setSelected(null);
            }
        }
    };

    const handleNewFolder = async () => {
        const name = await osPrompt("Enter folder name:");
        if (!name) return;
        let parent = fs;
        for (const p of path) {
            if (parent.children) parent = parent.children[p];
        }
        if (parent.children) {
            if (parent.children[name]) {
                await osAlert("Item already exists!");
            } else {
                parent.children[name] = { type: 'dir', children: {} };
                setFs({ ...fs });
            }
        }
    };

    const handleNewFile = async () => {
        const name = await osPrompt("Enter file name (e.g. note.txt):");
        if (!name) return;
        let parent = fs;
        for (const p of path) {
            if (parent.children) parent = parent.children[p];
        }
        if (parent.children) {
            if (parent.children[name]) {
                await osAlert("Item already exists!");
            } else {
                parent.children[name] = { type: 'file', content: '' };
                setFs({ ...fs });
            }
        }
    };

    const handlePickBtn = () => {
        if (selected && dirContents[selected].type === 'file' && onPick) {
            onPick([...path, selected].join('/'));
        }
    };

    const handleContextMenu = (e: React.MouseEvent, name: string, type: 'dir' | 'file') => {
        e.preventDefault();
        e.stopPropagation();
        setSelected(name);
        if (type === 'file' && mode === 'normal') {
            setContextMenu({ x: e.clientX, y: e.clientY, file: name });
        }
    };

    const closeContextMenu = () => setContextMenu(null);

    return (
        <div className="flex flex-col h-full bg-slate-100 text-slate-800" onClick={closeContextMenu} onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }}>
            {/* Toolbar */}
            <div className="bg-slate-200 border-b border-slate-300 p-2 flex items-center gap-1 text-sm flex-wrap">
                <button onClick={handleUp} disabled={path.length <= USER_HOME_PATH.length} className="p-1.5 rounded hover:bg-slate-300 disabled:opacity-30 transition"><ArrowUp size={16}/></button>
                <div className="bg-white border border-slate-300 px-2 py-1 rounded flex-1 text-xs font-mono truncate min-w-[100px]">
                   {getRelativePathDisplay()}
                </div>
                <div className="h-4 w-px bg-slate-400 mx-1"></div>
                
                <button onClick={handleNewFile} className="p-1.5 rounded hover:bg-slate-300 text-slate-700" title="New File"><FilePlus size={16}/></button>
                <button onClick={handleNewFolder} className="p-1.5 rounded hover:bg-slate-300 text-slate-700" title="New Folder"><Plus size={16}/></button>
                
                <div className="h-4 w-px bg-slate-400 mx-1"></div>
                
                <button onClick={handleCopy} disabled={!selected} className="p-1.5 rounded hover:bg-slate-300 text-slate-700 disabled:opacity-30" title="Copy"><Copy size={16}/></button>
                <button onClick={handleCut} disabled={!selected} className="p-1.5 rounded hover:bg-slate-300 text-slate-700 disabled:opacity-30" title="Cut"><Scissors size={16}/></button>
                <button onClick={handlePaste} disabled={!clipboard} className="p-1.5 rounded hover:bg-slate-300 text-slate-700 disabled:opacity-30" title="Paste"><Clipboard size={16}/></button>
                
                <div className="h-4 w-px bg-slate-400 mx-1"></div>
                
                <button onClick={handleDelete} disabled={!selected} className="p-1.5 rounded hover:bg-red-200 text-red-600 disabled:opacity-30" title="Delete"><Trash2 size={16}/></button>

                {mode === 'picker' && (
                    <>
                        <div className="h-4 w-px bg-slate-400 mx-1"></div>
                        <button 
                            onClick={handlePickBtn} 
                            disabled={!selected || dirContents[selected]?.type === 'dir'}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-bold disabled:opacity-50 disabled:bg-slate-400"
                        >
                            Select
                        </button>
                    </>
                )}
            </div>
            
            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 md:grid-cols-6 gap-4 content-start" onClick={() => setSelected(null)}>
                {path.length > USER_HOME_PATH.length && (
                    <div 
                        onDoubleClick={handleUp}
                        className="flex flex-col items-center gap-1 group cursor-pointer p-2 rounded hover:bg-blue-100/50"
                    >
                        <div className="w-12 h-12 flex items-center justify-center text-yellow-500 opacity-50">
                            <ArrowUp size={32} />
                        </div>
                        <span className="text-xs text-center truncate w-full select-none text-slate-500">..</span>
                    </div>
                )}
                
                {sortedItems.map(([name, node]) => (
                    <div 
                        key={name}
                        onClick={(e) => { e.stopPropagation(); closeContextMenu(); setSelected(name); }}
                        onDoubleClick={() => handleNavigate(name, node.type)}
                        onContextMenu={(e) => handleContextMenu(e, name, node.type)}
                        className={`flex flex-col items-center gap-1 group cursor-pointer p-2 rounded transition border ${selected === name ? 'bg-blue-200 border-blue-300' : 'hover:bg-slate-200 border-transparent'} ${clipboard?.path.includes(name) && clipboard.path.join('/') === [...path, name].join('/') && clipboard.type === 'cut' ? 'opacity-50' : ''}`}
                    >
                        <div className={`w-12 h-12 flex items-center justify-center ${node.type === 'dir' ? 'text-yellow-500' : 'text-slate-500'}`}>
                            {node.type === 'dir' ? <Folder size={40} fill="currentColor" className="text-yellow-400" /> : <FileText size={36} />}
                        </div>
                        <span className={`text-xs text-center truncate w-full select-none ${selected === name ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>
                            {name}
                        </span>
                    </div>
                ))}
            </div>
            <div className="bg-slate-200 p-1 px-3 text-xs text-slate-500 border-t border-slate-300 flex justify-between items-center">
                <span>{sortedItems.length} items</span>
                {mode === 'saver' ? (
                    <div className="flex items-center gap-2">
                        <input 
                            type="text" 
                            value={saveFileName} 
                            onChange={e => setSaveFileName(e.target.value)} 
                            placeholder="Filename..." 
                            className="px-2 py-1 border border-slate-300 rounded outline-none focus:border-blue-500"
                        />
                        <button 
                            onClick={() => {
                                if (saveFileName && onPick) {
                                    onPick([...path, saveFileName].join('/'));
                                }
                            }}
                            disabled={!saveFileName}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 font-bold disabled:opacity-50"
                        >
                            Save
                        </button>
                    </div>
                ) : (
                    <span>{selected ? selected : 'No selection'}</span>
                )}
            </div>

            {contextMenu && (
                <div 
                    className="fixed z-50 bg-white border border-slate-300 shadow-lg rounded py-1 min-w-[150px]"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-slate-700"
                        onClick={() => {
                            if (onOpen) onOpen([...path, contextMenu.file].join('/'));
                            closeContextMenu();
                        }}
                    >
                        Open
                    </button>
                    {onOpenWith && (
                        <button 
                            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-slate-700"
                            onClick={() => {
                                onOpenWith([...path, contextMenu.file].join('/'));
                                closeContextMenu();
                            }}
                        >
                            Open With...
                        </button>
                    )}
                    <div className="h-px bg-slate-200 my-1"></div>
                    <button 
                        className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-slate-700"
                        onClick={() => {
                            handleCopy();
                            closeContextMenu();
                        }}
                    >
                        Copy
                    </button>
                    <button 
                        className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-slate-700"
                        onClick={() => {
                            handleCut();
                            closeContextMenu();
                        }}
                    >
                        Cut
                    </button>
                    <button 
                        className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600"
                        onClick={() => {
                            handleDelete();
                            closeContextMenu();
                        }}
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};
