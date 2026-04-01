import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Save, FileCode, ChevronDown, ChevronRight, FilePlus, Bot, Send, Settings, X, FileText, Code } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { resolvePath } from '../utils/fs';
import { USER_HOME_PATH } from '../utils/constants';
import { osAlert, osPrompt } from '../components/DialogHost';

class ErrorBoundary extends React.Component<{children: React.ReactNode, key?: any}, {hasError: boolean, error: any}> {
    state = { hasError: false, error: null };
    constructor(props: {children: React.ReactNode, key?: any}) {
        super(props);
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }
    componentDidCatch(error: any, errorInfo: any) {
        console.error("Preview Error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="text-red-500 p-4 font-mono break-words">
                    {this.state.error?.toString()}
                </div>
            );
        }
        return (this as any).props.children;
    }
}

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
    const [appTab, setAppTab] = useState<'editor' | 'weber'>('editor');
    const [weberCode, setWeberCode] = useState("return () => React.createElement('div', {className: 'h-full flex items-center justify-center bg-purple-600 text-white text-2xl font-bold'}, 'Hello World!')");
    const [showWeberModal, setShowWeberModal] = useState(false);
    const [showPreview, setShowPreview] = useState(true);
    const [weberAppInfo, setWeberAppInfo] = useState({ name: 'My App', id: 'my-app', version: '1.0.0', icon: 'Box', permissions: '' });
    
    // WeGroq State
    const [isGroqOpen, setIsGroqOpen] = useState(false);
    const [groqKey, setGroqKey] = useState(() => localStorage.getItem('wegroq_key') || '');
    const [groqModel, setGroqModel] = useState(() => localStorage.getItem('wegroq_model') || 'openai/gpt-oss-120b');
    const [groqMessages, setGroqMessages] = useState<{role: string, content: string}[]>([]);
    const [groqInput, setGroqInput] = useState('');
    const [isGroqLoading, setIsGroqLoading] = useState(false);
    const [showGroqSettings, setShowGroqSettings] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const GROQ_MODELS = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "openai/gpt-oss-safeguard-20b",
        "whisper-large-v3-turbo",
        "qwen/qwen3-32b",
        "canopylabs/orpheus-arabic-saudi",
        "canopylabs/orpheus-v1-english",
        "groq/compound",
        "Ilama-3.1-8b-instant",
        "Ilama-3.3-70b-versatile",
        "meta-llama/llama-prompt-guard-2-86m"
    ];

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [groqMessages]);

    const saveGroqSettings = () => {
        localStorage.setItem('wegroq_key', groqKey);
        localStorage.setItem('wegroq_model', groqModel);
        setShowGroqSettings(false);
    };

    // Only show user directory in sidebar
    let userDir = fs;
    for(const p of USER_HOME_PATH) {
        if(userDir.children) userDir = userDir.children[p];
    }

    useEffect(() => {
        if (currentFile && currentFile.endsWith('.wbr')) {
            try {
                const parsed = JSON.parse(content);
                if (parsed.code) {
                    setWeberCode(Array.isArray(parsed.code) ? parsed.code.join('\n') : parsed.code);
                }
                setWeberAppInfo({
                    name: parsed.name || 'My App',
                    id: parsed.id || 'my-app',
                    version: parsed.version || '1.0.0',
                    icon: parsed.icon || 'Box',
                    permissions: (parsed.permissions || []).join(', ')
                });
            } catch (e) {
                // Not valid JSON yet, ignore
            }
        }
    }, [content, currentFile]);

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

    const handleNew = async () => {
        const name = await osPrompt("Enter new filename (e.g. myapp.wbr):");
        if (!name) return;
        
        let parent = fs;
        for(const p of USER_HOME_PATH) {
            if(parent.children) parent = parent.children[p];
        }
        
        if (parent.children) {
            if (parent.children[name]) {
                await osAlert("File already exists!");
            } else {
                parent.children[name] = { type: 'file', content: '' };
                setFs({ ...fs });
                setCurrentFile(name);
                setContent('');
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

    const handleWeberSave = async () => {
        setShowWeberModal(false);
        try {
            const wbrContent = JSON.stringify({
                id: weberAppInfo.id,
                name: weberAppInfo.name,
                version: weberAppInfo.version,
                icon: weberAppInfo.icon,
                permissions: weberAppInfo.permissions.split(',').map(p => p.trim()).filter(p => p),
                code: weberCode.split('\n')
            }, null, 2);
            
            // If we have a current file, save there, else create new
            if (currentFile) {
                let fullPathStr = currentFile;
                if (!currentFile.startsWith('home/')) {
                    fullPathStr = [...USER_HOME_PATH, ...currentFile.split('/')].join('/');
                }
                const { node } = resolvePath(fs, [], fullPathStr);
                if (node && node.type === 'file') {
                    node.content = wbrContent;
                    setFs({ ...fs });
                    setContent(wbrContent);
                    setStatus(`Saved: ${currentFile}`);
                }
            } else {
                let parent = fs;
                for(const p of USER_HOME_PATH) {
                    if(parent.children) parent = parent.children[p];
                }
                if (parent.children) {
                    const filename = weberAppInfo.id + '.wbr';
                    parent.children[filename] = { type: 'file', content: wbrContent };
                    setFs({ ...fs });
                    setCurrentFile(filename);
                    setContent(wbrContent);
                    setStatus(`Created: ${filename}`);
                }
            }
        } catch (e: any) {
            osAlert(e.toString());
        }
    };

    const Preview = useMemo(() => {
        try {
            // Provide a mock Sys for the preview to prevent crashing if it tries to use it
            const mockSys = {
                notify: (t: string, m: string) => console.log('Preview Notify:', t, m),
                fs: {
                    readFile: () => 'mock data',
                    writeFile: () => {},
                    openFilePicker: async () => null,
                    openFileSaver: async () => null
                },
                requestCamera: async () => { throw new Error('Camera not available in preview'); },
                requestMic: async () => { throw new Error('Mic not available in preview'); },
                getLocation: async () => { throw new Error('Geolocation not available in preview'); }
            };
            const fn = new Function('React', 'LucideIcons', 'Sys', weberCode);
            const res = fn(React, LucideIcons, mockSys);
            if (typeof res === 'function') return res;
            return () => res;
        } catch (e: any) {
            return () => <div className="text-red-500 p-4 font-mono">{e.toString()}</div>;
        }
    }, [weberCode]);

    const handleGroqSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groqInput.trim() || !groqKey) {
            if (!groqKey) setShowGroqSettings(true);
            return;
        }

        const userMsg = groqInput;
        setGroqInput('');
        setGroqMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsGroqLoading(true);

        try {
            const systemPrompt = `You are WeGroq, an AI coding assistant integrated directly into the 'Coder' app of WeberOS.
WeberOS is a web-based operating system simulator running in the browser.
The user is currently in the ${appTab === 'weber' ? '"Weber Coder" tab, editing only the JavaScript code of the app.' : '"Code Editor" tab, editing the raw file content.'}

${appTab === 'weber' ? `You are helping the user write the React component for their app.
The code must be a valid JavaScript function returning a React component.
Example:
return function MyApp({ onNotify, fs }) {
  return React.createElement('div', { className: 'p-4 text-white' }, 'Hello World');
}

To update the user's code in the editor, output exactly this format anywhere in your response:
\`\`\`weber-code
your react code here
\`\`\`
The current JavaScript code is:
${weberCode}` : `The Coder app allows users to write code, specifically Weber Runtime (.wbr) apps.
A .wbr app is a JSON file containing metadata and a React component.
The "code" field can be a single string or an array of strings (which is preferred for multi-line code).
Example .wbr structure:
{
  "id": "my-app",
  "name": "My App",
  "icon": "Box",
  "permissions": ["notifications", "fs", "camera", "microphone", "geolocation"],
  "code": [
    "return function MyApp({ onNotify, fs }) {",
    "  return React.createElement('div', null, 'Hello World');",
    "}"
  ]
}

You have the ability to create or modify files in the user's filesystem by outputting a special JSON block.
To write a file, output exactly this format anywhere in your response:
\`\`\`file-write
{
  "filename": "example.wbr",
  "content": "your content here"
}
\`\`\`
The user's current file is: ${currentFile || 'None'}
The current file content is:
${content}`}

Available permissions and APIs (passed as props or via Sys object):
- "notifications": Allows sending OS notifications via \`onNotify(appId, title, message)\` or \`Sys.notify(title, message)\`.
- "fs": Allows reading/writing files via \`Sys.fs.readFile(path)\`, \`Sys.fs.writeFile(path, content)\`, \`Sys.fs.openFilePicker()\`, \`Sys.fs.openFileSaver()\`.
- "camera": Allows requesting camera via \`Sys.requestCamera()\`.
- "microphone": Allows requesting microphone via \`Sys.requestMic()\`.
- "geolocation": Allows getting location via \`Sys.getLocation()\`.

You can help the user write code, debug, or explain concepts.
`;

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: groqModel,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...groqMessages.map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content: userMsg }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`Groq API Error: ${response.statusText}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            
            setGroqMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

            // Parse for weber-code
            const weberCodeRegex = /\`\`\`weber-code\n([\s\S]*?)\n\`\`\`/g;
            let weberMatch;
            while ((weberMatch = weberCodeRegex.exec(aiResponse)) !== null) {
                setWeberCode(weberMatch[1]);
                setStatus(`WeGroq updated the code.`);
            }

            // Parse for file writes
            const fileWriteRegex = /\`\`\`file-write\n([\s\S]*?)\n\`\`\`/g;
            let match;
            while ((match = fileWriteRegex.exec(aiResponse)) !== null) {
                try {
                    const fileData = JSON.parse(match[1]);
                    if (fileData.filename && fileData.content !== undefined) {
                        let parent = fs;
                        for(const p of USER_HOME_PATH) {
                            if(parent.children) parent = parent.children[p];
                        }
                        if (parent.children) {
                            parent.children[fileData.filename] = { type: 'file', content: fileData.content };
                            setFs({ ...fs });
                            setCurrentFile(fileData.filename);
                            setContent(fileData.content);
                            setStatus(`WeGroq created/updated: ${fileData.filename}`);
                        }
                    }
                } catch (err) {
                    console.error("Failed to parse file-write block", err);
                }
            }

        } catch (error: any) {
            setGroqMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
        } finally {
            setIsGroqLoading(false);
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
                <div className="flex bg-[#252526] border-b border-[#3e3e42] text-xs">
                    <button className={`px-4 py-2 ${appTab === 'editor' ? 'bg-[#1e1e1e] border-t-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`} onClick={() => setAppTab('editor')}>Code Editor</button>
                    <button className={`px-4 py-2 ${appTab === 'weber' ? 'bg-[#1e1e1e] border-t-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`} onClick={() => setAppTab('weber')}>Weber Coder</button>
                </div>
                
                {appTab === 'editor' ? (
                    <>
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
                    </>
                ) : (
                    <>
                        <div className="flex bg-[#2d2d2d] p-2 gap-2 text-xs border-b border-[#3e3e42] items-center">
                            <span className="font-bold text-blue-400">{currentFile ? currentFile.split('/').pop() : 'New App'}</span>
                            <div className="flex-1"></div>
                            <span className="text-gray-500 mr-2">{status}</span>
                            <button onClick={() => setShowPreview(!showPreview)} className={`hover:bg-[#3e3e42] ${showPreview ? 'bg-[#0e639c]' : 'bg-[#2d2d2d] border border-[#3e3e42]'} text-white px-3 py-1 rounded flex items-center gap-1 transition`}>
                                <FileText size={12} /> Preview
                            </button>
                            <button onClick={() => setIsGroqOpen(!isGroqOpen)} className={`hover:bg-[#3e3e42] ${isGroqOpen ? 'bg-[#0e639c]' : 'bg-[#2d2d2d] border border-[#3e3e42]'} text-white px-3 py-1 rounded flex items-center gap-1 transition`}>
                                <Bot size={12} /> WeGroq
                            </button>
                            <button onClick={() => setShowWeberModal(true)} className="hover:bg-[#3e3e42] bg-[#0e639c] text-white px-3 py-1 rounded flex items-center gap-1 transition">
                                <Save size={12} /> Save App
                            </button>
                        </div>
                        <div className="flex-1 flex overflow-hidden">
                            <div className={`${showPreview ? 'w-1/2 border-r' : 'w-full'} h-full border-[#3e3e42]`}>
                                <textarea 
                                    className="w-full h-full bg-[#1e1e1e] text-[#4ade80] p-4 outline-none resize-none leading-6 whitespace-pre tab-4"
                                    value={weberCode}
                                    onChange={e => setWeberCode(e.target.value)}
                                    spellCheck={false}
                                    wrap="off"
                                />
                            </div>
                            {showPreview && (
                                <div className="w-1/2 h-full bg-white text-black relative overflow-auto">
                                    <ErrorBoundary key={weberCode}>
                                        <Preview />
                                    </ErrorBoundary>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* WeGroq Sidebar */}
            {isGroqOpen && appTab === 'weber' && (
                <div className="w-80 bg-[#252526] border-l border-[#3e3e42] flex flex-col">
                    <div className="p-3 border-b border-[#3e3e42] flex justify-between items-center bg-[#2d2d2d]">
                        <div className="flex items-center gap-2 font-bold text-blue-400">
                            <Bot size={16} />
                            WeGroq
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowGroqSettings(!showGroqSettings)} className="text-gray-400 hover:text-white transition">
                                <Settings size={14} />
                            </button>
                            <button onClick={() => setIsGroqOpen(false)} className="text-gray-400 hover:text-white transition">
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {showGroqSettings ? (
                        <div className="p-4 flex-1 overflow-y-auto">
                            <h3 className="font-bold mb-4 text-white">WeGroq Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Groq API Key</label>
                                    <input 
                                        type="password" 
                                        value={groqKey}
                                        onChange={e => setGroqKey(e.target.value)}
                                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded p-2 text-sm text-white outline-none focus:border-blue-500"
                                        placeholder="gsk_..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Model</label>
                                    <select 
                                        value={groqModel}
                                        onChange={e => setGroqModel(e.target.value)}
                                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded p-2 text-sm text-white outline-none focus:border-blue-500"
                                    >
                                        {GROQ_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <button onClick={saveGroqSettings} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold transition">
                                    Save Settings
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                                {groqMessages.length === 0 ? (
                                    <div className="text-center text-gray-500 mt-10 text-xs">
                                        <Bot size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>I am WeGroq.</p>
                                        <p>I can help you write WeberOS apps.</p>
                                        {!groqKey && <p className="text-yellow-500 mt-2">Please set your API key in settings.</p>}
                                    </div>
                                ) : (
                                    groqMessages.map((msg, i) => (
                                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[90%] p-2 rounded text-xs ${msg.role === 'user' ? 'bg-[#0e639c] text-white' : 'bg-[#3e3e42] text-gray-200'}`}>
                                                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {isGroqLoading && (
                                    <div className="flex items-start">
                                        <div className="bg-[#3e3e42] text-gray-200 p-2 rounded text-xs animate-pulse">
                                            Thinking...
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>
                            <div className="p-3 border-t border-[#3e3e42] bg-[#2d2d2d]">
                                <form onSubmit={handleGroqSubmit} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={groqInput}
                                        onChange={e => setGroqInput(e.target.value)}
                                        placeholder="Ask WeGroq..."
                                        className="flex-1 bg-[#1e1e1e] border border-[#3e3e42] rounded px-2 py-1.5 text-sm text-white outline-none focus:border-blue-500"
                                        disabled={isGroqLoading}
                                    />
                                    <button type="submit" disabled={isGroqLoading || !groqInput.trim()} className="bg-[#0e639c] hover:bg-blue-500 disabled:opacity-50 text-white p-1.5 rounded transition">
                                        <Send size={16} />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            )}

            {showWeberModal && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#252526] p-6 rounded-xl w-96 text-white flex flex-col gap-4 shadow-2xl border border-[#3e3e42]">
                        <h2 className="text-xl font-bold text-blue-400">Save App Configuration</h2>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400">App Name</label>
                            <input className="bg-[#1e1e1e] border border-[#3e3e42] p-2 rounded outline-none focus:border-blue-500" value={weberAppInfo.name} onChange={e => setWeberAppInfo({...weberAppInfo, name: e.target.value})} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400">App ID</label>
                            <input className="bg-[#1e1e1e] border border-[#3e3e42] p-2 rounded outline-none focus:border-blue-500" value={weberAppInfo.id} onChange={e => setWeberAppInfo({...weberAppInfo, id: e.target.value})} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400">Version</label>
                            <input className="bg-[#1e1e1e] border border-[#3e3e42] p-2 rounded outline-none focus:border-blue-500" value={weberAppInfo.version} onChange={e => setWeberAppInfo({...weberAppInfo, version: e.target.value})} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400">Icon (Lucide Icon Name)</label>
                            <input className="bg-[#1e1e1e] border border-[#3e3e42] p-2 rounded outline-none focus:border-blue-500" value={weberAppInfo.icon} onChange={e => setWeberAppInfo({...weberAppInfo, icon: e.target.value})} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400">Permissions (comma separated)</label>
                            <input className="bg-[#1e1e1e] border border-[#3e3e42] p-2 rounded outline-none focus:border-blue-500" placeholder="fs, notifications" value={weberAppInfo.permissions} onChange={e => setWeberAppInfo({...weberAppInfo, permissions: e.target.value})} />
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                            <button className="px-4 py-2 bg-[#3e3e42] hover:bg-[#2d2d2d] rounded" onClick={() => setShowWeberModal(false)}>Cancel</button>
                            <button className="px-4 py-2 bg-[#0e639c] hover:bg-blue-500 rounded font-bold" onClick={handleWeberSave}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};