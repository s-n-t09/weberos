import React, { useState, useEffect, useRef } from 'react';
import { Plus, Save, FileCode, ChevronDown, ChevronRight, FilePlus } from 'lucide-react';
import { resolvePath } from '../utils/fs';
import { USER_HOME_PATH } from '../utils/constants';

const FileTreeNode = ({ name, node, path, onSelect, currentFile }: any) => {
    const [expanded, setExpanded] = useState(false);
    const indent = path.length * 12;
    const fullPathStr = [...path, name].join('/');
    
    if (node.type === 'file') {
        return (
            <div 
                onClick={() => onSelect(fullPathStr)}
                className={`flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-[#2a2d2e] ${currentFile === fullPathStr ? 'bg-[#37373d] text-white' : 'text-slate-400'}`}
                style={{ paddingLeft: `${indent + 8}px` }}
            >
                <FileCode size={14} className="text-blue-400 shrink-0" />
                <span className="truncate">{name}</span>
            </div>
        );
    }
    
    return (
        <div>
            <div 
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-[#2a2d2e] text-slate-300 select-none"
                style={{ paddingLeft: `${indent}px` }}
            >
                {expanded ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                <span className="truncate font-medium">{name}</span>
            </div>
            {expanded && node.children && (
                <div>
                    {Object.entries(node.children).map(([childName, childNode]) => (
                        <FileTreeNode 
                            key={childName} 
                            name={childName} 
                            node={childNode} 
                            path={[...path, name]} 
                            onSelect={onSelect}
                            currentFile={currentFile}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const CoderApp = ({ fs, setFs, launchData }: any) => {
    const [currentFile, setCurrentFile] = useState<string | null>(null);
    const [content, setContent] = useState('');
    const [status, setStatus] = useState('Welcome to Coder');
    const [suggestion, setSuggestion] = useState<string | null>(null);

    // Only show user directory in sidebar
    let userDir = fs;
    for(const p of USER_HOME_PATH) {
        if(userDir.children) userDir = userDir.children[p];
    }

    const handleFileSelect = (pathStr: string) => {
        const fullPath = [...USER_HOME_PATH, ...pathStr.split('/')].join('/');
        const { node } = resolvePath(fs, [], fullPath);
        if (node && node.type === 'file') {
            setCurrentFile(pathStr);
            setContent(node.content || '');
            setStatus(`Editing: ${pathStr}`);
        }
    };
    
    useEffect(() => {
        if(launchData?.file) {
            const { node } = resolvePath(fs, [], launchData.file);
            if (node && node.type === 'file') {
                 const prefix = USER_HOME_PATH.join('/');
                 if(launchData.file.startsWith(prefix)) {
                     const rel = launchData.file.substring(prefix.length + 1);
                     setCurrentFile(rel);
                     setContent(node.content || '');
                     setStatus(`Editing: ${rel}`);
                 } else {
                     setCurrentFile(launchData.file);
                     setContent(node.content || '');
                     setStatus(`Editing: ${launchData.file}`);
                 }
            }
        }
    }, [launchData]);

    const handleNew = () => {
        const name = prompt("Enter new filename (e.g. myapp.wbr):");
        if (!name) return;
        
        let parent = fs;
        for(const p of USER_HOME_PATH) {
            if(parent.children) parent = parent.children[p];
        }
        
        if (parent.children) {
            if (parent.children[name]) {
                alert("File already exists!");
            } else {
                // Default content based on extension
                let initialContent = '';
                if (name.endsWith('.wbr')) {
                    initialContent = JSON.stringify({
                        id: name.replace('.wbr', ''),
                        name: name.replace('.wbr', ''),
                        icon: "Box",
                        permissions: [],
                        code: "return () => React.createElement('div', null, 'Hello')"
                    }, null, 2);
                }

                parent.children[name] = { type: 'file', content: initialContent };
                setFs({ ...fs });
                setCurrentFile(name);
                setContent(initialContent);
                setStatus(`Created: ${name}`);
            }
        }
    };

    const handleSave = () => {
        if (!currentFile) {
            handleNew(); // Fallback to create logic
            return;
        }

        let fullPathStr = currentFile;
        if (!currentFile.startsWith('home/')) {
            fullPathStr = [...USER_HOME_PATH, ...currentFile.split('/')].join('/');
        }
        
        const { node } = resolvePath(fs, [], fullPathStr);
        if (node && node.type === 'file') {
            node.content = content;
            setFs({ ...fs });
            setStatus(`Saved: ${currentFile} at ${new Date().toLocaleTimeString()}`);
        }
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setContent(val);
        
        // Basic "Guessing" / Autocomplete logic
        const lastWord = val.split(/\s+/).pop();
        if (lastWord === 'w') setSuggestion('wbr');
        else if (lastWord === 'Re') setSuggestion('React.createElement');
        else if (lastWord === 're') setSuggestion('return');
        else if (lastWord === 'pe') setSuggestion('permissions');
        else setSuggestion(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab' && suggestion) {
            e.preventDefault();
            const words = content.split(/\s+/);
            words.pop(); // remove incomplete word
            const newContent = content.substring(0, content.lastIndexOf(' ') + 1) + suggestion;
            setContent(newContent);
            setSuggestion(null);
        }
    };

    const lines = content.split('\n');

    return (
        <div className="flex h-full bg-[#1e1e1e] text-gray-300 font-mono text-sm">
            {/* Sidebar */}
            <div className="w-48 bg-[#252526] border-r border-[#3e3e42] flex flex-col">
                <div className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                    <span>Explorer</span>
                    <button onClick={handleNew} className="hover:text-white" title="New File"><FilePlus size={14}/></button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {Object.entries(userDir.children || {}).map(([name, node]) => (
                        <FileTreeNode 
                            key={name} 
                            name={name} 
                            node={node} 
                            path={[]} 
                            onSelect={handleFileSelect} 
                            currentFile={currentFile}
                        />
                    ))}
                </div>
            </div>
            
            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">
                 <div className="flex bg-[#2d2d2d] p-2 gap-2 text-xs border-b border-[#3e3e42] items-center">
                    <span className="font-bold text-blue-400">{currentFile ? currentFile.split('/').pop() : 'Untitled'}</span>
                    <div className="flex-1"></div>
                    <span className="text-gray-500 mr-2">{status}</span>
                    <button onClick={handleSave} className="hover:bg-[#3e3e42] bg-[#0e639c] text-white px-3 py-1 rounded flex items-center gap-1 transition">
                        <Save size={12} /> Save
                    </button>
                </div>
                
                <div className="flex-1 flex overflow-hidden relative">
                    {/* Line Numbers */}
                    <div className="bg-[#1e1e1e] text-[#858585] p-4 text-right select-none border-r border-[#3e3e42] min-w-[3rem]">
                        {lines.map((_, i) => (
                            <div key={i} className="leading-6 h-6">{i + 1}</div>
                        ))}
                    </div>
                    {/* Editor */}
                    <div className="flex-1 relative">
                        <textarea 
                            className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] p-4 outline-none resize-none leading-6 whitespace-pre tab-4"
                            value={content}
                            onChange={handleContentChange}
                            onKeyDown={handleKeyDown}
                            spellCheck={false}
                            wrap="off"
                        />
                        {suggestion && (
                             <div className="absolute bottom-4 right-4 bg-blue-900/80 text-white px-2 py-1 rounded text-xs animate-pulse">
                                 Press TAB to insert: <strong>{suggestion}</strong>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};