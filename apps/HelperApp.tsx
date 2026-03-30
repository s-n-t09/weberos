import React, { useState } from 'react';
import { HelpCircle, Search, BookOpen, HardDrive, Package, Code, Lightbulb, Bot } from 'lucide-react';

const PRO_TIPS = [
    "Use the Coder app to create your own .wbr applications.",
    "WeGroq in the Coder app can help you write code using AI.",
    "You can drag and drop files into the Explorer to upload them.",
    "Use Settings to change your wallpaper and customize your experience.",
    "The Market app has new games and tools to download.",
    "You can arrange desktop icons by dragging them around.",
    "Use the Terminal to navigate the file system using commands.",
    "WeberOS supports multi-line code in .wbr files.",
    "Check the Helper app if you get stuck or need guidance.",
    "You can create multiple user profiles for different workspaces.",
    "Apps can request permissions like camera, microphone, and geolocation.",
    "Use WePic to view and manage your images.",
    "WePlayer supports playing audio and video files.",
    "WireBox is your gateway to the web inside WeberOS.",
    "You can uninstall apps from the Settings menu.",
    "Notifications keep you updated on system events.",
    "The FileSystem API allows apps to read and write files.",
    "You can set default apps for specific file extensions in Settings.",
    "Use the 'Use .wbr Template' button in Coder to start quickly.",
    "WeberOS 2 brings a fresh new UI and improved performance."
];

export const HelperApp = () => {
    const [section, setSection] = useState('intro');
    const [searchQuery, setSearchQuery] = useState('');

    const sections = [
        { id: 'intro', title: 'Welcome', icon: BookOpen },
        { id: 'fs', title: 'Filesystem', icon: HardDrive },
        { id: 'pkgs', title: 'Packages', icon: Package },
        { id: 'dev', title: 'Developer', icon: Code },
        { id: 'wegroq', title: 'WeGroq AI', icon: Bot },
        { id: 'tips', title: 'Tips & Tricks', icon: Lightbulb },
    ];

    const filteredSections = sections.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex h-full bg-slate-50 text-slate-800 font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col gap-4">
                <div className="flex items-center gap-3 px-2 mb-2">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md">
                        <HelpCircle size={24} />
                    </div>
                    <h2 className="font-bold text-xl tracking-tight">Help Center</h2>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search topics..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                </div>

                <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-2">
                    {filteredSections.map(s => {
                        const Icon = s.icon;
                        const isActive = section === s.id;
                        return (
                            <button 
                                key={s.id}
                                onClick={() => setSection(s.id)} 
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                            >
                                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                {s.title}
                            </button>
                        );
                    })}
                    {filteredSections.length === 0 && (
                        <div className="text-center text-slate-400 text-sm py-4">No topics found.</div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-slate-50">
                <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    {section === 'intro' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                <BookOpen size={32} />
                            </div>
                            <h1 className="text-4xl font-black mb-4 text-slate-900 tracking-tight">Welcome to WeberOS 2!</h1>
                            <p className="text-lg text-slate-600 mb-6 leading-relaxed">Hello friend! WeberOS is a web-based operating system simulator designed to feel just like a real desktop environment. It's built with React and TypeScript.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <h3 className="font-bold text-slate-800 mb-2">Multitasking</h3>
                                    <p className="text-sm text-slate-600">You can drag windows, resize them, and run multiple apps simultaneously.</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <h3 className="font-bold text-slate-800 mb-2">Customization</h3>
                                    <p className="text-sm text-slate-600">Use Settings to change your wallpaper, manage profiles, and set default apps.</p>
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold mt-8 mb-4 text-slate-800">Getting Started</h3>
                            <ul className="space-y-3 text-slate-600">
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-sm font-bold">1</div>
                                    <span>Click the <strong>Start Button</strong> (bottom left) to see all installed apps.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-sm font-bold">2</div>
                                    <span>Open the <strong>Market</strong> to find and install new games, tools, and media apps.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-sm font-bold">3</div>
                                    <span>Explore the <strong>Files</strong> app to manage your virtual filesystem.</span>
                                </li>
                            </ul>
                        </div>
                    )}

                    {section === 'fs' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                                <HardDrive size={32} />
                            </div>
                            <h1 className="text-4xl font-black mb-4 text-slate-900 tracking-tight">The Filesystem</h1>
                            <p className="text-lg text-slate-600 mb-6 leading-relaxed">WeberOS features a virtual in-memory filesystem. Your files are stored safely in your browser's LocalStorage, so they persist even if you refresh the page.</p>
                            
                            <h3 className="text-2xl font-bold mt-8 mb-4 text-slate-800">File Explorer</h3>
                            <p className="text-slate-600 mb-4">Use the <strong>Files</strong> app to browse folders. You can create files, folders, and copy/paste items just like on a real PC.</p>
                            
                            <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl mt-6 flex gap-4 items-start">
                                <Lightbulb className="text-amber-500 flex-shrink-0 mt-1" size={24} />
                                <div>
                                    <h4 className="font-bold text-amber-800 mb-1">Pro Tip: Drag & Drop</h4>
                                    <p className="text-sm text-amber-700">You can upload real files from your computer by dropping them directly onto the desktop or into the Files app window!</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {section === 'pkgs' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                                <Package size={32} />
                            </div>
                            <h1 className="text-4xl font-black mb-4 text-slate-900 tracking-tight">Package Management</h1>
                            <p className="text-lg text-slate-600 mb-6 leading-relaxed">Apps in WeberOS are called "Packages". You can install, update, and remove them easily.</p>
                            
                            <h3 className="text-2xl font-bold mt-8 mb-4 text-slate-800">Installation Methods</h3>
                            <div className="space-y-4">
                                <div className="p-5 border border-slate-200 rounded-xl hover:border-blue-300 transition">
                                    <h4 className="font-bold text-lg text-slate-800 mb-2">1. Market App (Recommended)</h4>
                                    <p className="text-slate-600 text-sm">A friendly app store interface. Browse categories, search for apps, and install them with a single click. The Market also notifies you of available updates.</p>
                                </div>
                                <div className="p-5 border border-slate-200 rounded-xl hover:border-blue-300 transition">
                                    <h4 className="font-bold text-lg text-slate-800 mb-2">2. Terminal (wpm)</h4>
                                    <p className="text-slate-600 text-sm mb-3">For power users. Use the Weber Package Manager (wpm) command-line tool.</p>
                                    <code className="block bg-slate-900 text-green-400 p-3 rounded-lg text-sm font-mono">
                                        wpm list<br/>
                                        wpm install &lt;package-id&gt;
                                    </code>
                                </div>
                            </div>
                        </div>
                    )}

                    {section === 'dev' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                                <Code size={32} />
                            </div>
                            <h1 className="text-4xl font-black mb-4 text-slate-900 tracking-tight">Developer Guide</h1>
                            <p className="text-lg text-slate-600 mb-6 leading-relaxed">Create your own apps for WeberOS using <strong>.wbr</strong> files! These are JSON files that contain React code and metadata.</p>
                            
                            <h3 className="text-2xl font-bold mt-8 mb-4 text-slate-800">.wbr File Structure</h3>
                            <p className="text-slate-600 mb-4 text-sm">WeberOS supports multi-line code by defining the <code>code</code> property as an array of strings. This makes your code much easier to read and edit.</p>
                            
                            <pre className="bg-slate-900 text-slate-300 p-5 rounded-xl overflow-x-auto text-sm font-mono shadow-inner border border-slate-800">
{`{
  "id": "my-cool-app",
  "name": "My Cool App",
  "icon": "Star",
  "version": "1.0.0",
  "permissions": ["notifications", "fs"],
  "code": [
    "return function MyApp() {",
    "  const [count, setCount] = React.useState(0);",
    "  return (",
    "    <div className='p-4'>",
    "      <h1>Hello World</h1>",
    "      <button onClick={() => setCount(c => c + 1)}>Clicks: {count}</button>",
    "    </div>",
    "  );",
    "}"
  ]
}`}
                            </pre>
                            
                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mt-4 text-sm text-blue-800">
                                <strong>Note:</strong> The <code>code</code> array is joined with newlines at runtime. It must return a React Component function. You have access to <code>React</code>, <code>LucideIcons</code>, and <code>Sys</code> globals.
                            </div>

                            <h3 className="text-2xl font-bold mt-10 mb-4 text-slate-800">The Sys API</h3>
                            <p className="text-slate-600 mb-4">The <code>Sys</code> object provides access to OS features. You must declare the required permissions in your app's <code>permissions</code> array.</p>
                            
                            <div className="space-y-3">
                                {[
                                    { perm: 'notifications', code: 'Sys.notify(title, msg)', desc: 'Shows a system notification.' },
                                    { perm: 'camera', code: 'Sys.requestCamera()', desc: 'Returns a Promise resolving to a MediaStream.' },
                                    { perm: 'microphone', code: 'Sys.requestMic()', desc: 'Returns a Promise resolving to a MediaStream.' },
                                    { perm: 'geolocation', code: 'Sys.getLocation()', desc: 'Returns a Promise resolving to GeolocationPosition.' },
                                    { perm: 'fs', code: 'Sys.fs.readFile(path)', desc: 'Reads a file from the OS filesystem.' },
                                    { perm: 'fs', code: 'Sys.fs.writeFile(path, content)', desc: 'Writes a file to the OS filesystem.' },
                                    { perm: 'fs', code: 'Sys.fs.openFilePicker()', desc: 'Opens file explorer to pick a file. Returns Promise<path>.' },
                                    { perm: 'fs', code: 'Sys.fs.openFileSaver()', desc: 'Opens file explorer to save a file. Returns Promise<path>.' },
                                ].map((api, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <code className="text-xs font-mono bg-slate-200 text-slate-800 px-2 py-1 rounded whitespace-nowrap">{api.code}</code>
                                        <span className="text-sm text-slate-600 flex-1">{api.desc}</span>
                                        <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-200 text-slate-500 px-2 py-1 rounded-full">Requires: {api.perm}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {section === 'wegroq' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                                <Bot size={32} />
                            </div>
                            <h1 className="text-4xl font-black mb-4 text-slate-900 tracking-tight">WeGroq AI Assistant</h1>
                            <p className="text-lg text-slate-600 mb-6 leading-relaxed">WeGroq is your personal AI coding assistant built directly into the Coder app. It understands the WeberOS environment and can help you build apps faster.</p>
                            
                            <h3 className="text-2xl font-bold mt-8 mb-4 text-slate-800">How to use WeGroq</h3>
                            <ol className="list-decimal pl-5 space-y-4 text-slate-600">
                                <li className="pl-2">
                                    <strong>Get an API Key:</strong> You need a free API key from <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Groq</a>.
                                </li>
                                <li className="pl-2">
                                    <strong>Configure Coder:</strong> Open the Coder app, click the Settings (gear) icon, and enter your Groq API key. You can also select which AI model you want to use.
                                </li>
                                <li className="pl-2">
                                    <strong>Chat & Create:</strong> Open the WeGroq panel in Coder. You can ask it to explain code, fix bugs, or even generate entire <code>.wbr</code> applications from scratch!
                                </li>
                                <li className="pl-2">
                                    <strong>File Manipulation:</strong> WeGroq has the ability to create and modify files directly in your workspace if you ask it to.
                                </li>
                            </ol>
                            
                            <div className="bg-slate-900 text-white p-6 rounded-xl mt-8 shadow-lg">
                                <h4 className="font-bold text-lg mb-2 flex items-center gap-2"><Lightbulb className="text-yellow-400" size={20}/> Example Prompts</h4>
                                <ul className="space-y-2 text-sm text-slate-300">
                                    <li>"Create a simple calculator app and save it as calculator.wbr"</li>
                                    <li>"Write a .wbr app that uses the camera permission to take a photo."</li>
                                    <li>"Explain how the Sys.fs API works."</li>
                                    <li>"Fix the syntax error in my current file."</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {section === 'tips' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mb-6">
                                <Lightbulb size={32} />
                            </div>
                            <h1 className="text-4xl font-black mb-4 text-slate-900 tracking-tight">Tips & Tricks</h1>
                            <p className="text-lg text-slate-600 mb-8 leading-relaxed">Master WeberOS with these handy pro tips.</p>
                            
                            <div className="grid grid-cols-1 gap-3">
                                {PRO_TIPS.map((tip, i) => (
                                    <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-yellow-300 hover:bg-yellow-50 transition-colors group">
                                        <div className="w-6 h-6 rounded-full bg-yellow-200 text-yellow-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold group-hover:bg-yellow-400 group-hover:text-yellow-900 transition-colors">{i + 1}</div>
                                        <p className="text-slate-700 text-sm">{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
