import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export const HelperApp = () => {
    const [section, setSection] = useState('intro');

    return (
        <div className="flex h-full bg-slate-50 text-slate-800">
            <div className="w-48 bg-white border-r border-slate-200 p-4 flex flex-col gap-2">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2 px-2"><HelpCircle /> Guide</h2>
                <button onClick={() => setSection('intro')} className={`text-left px-4 py-2 rounded-lg transition ${section === 'intro' ? 'bg-purple-100 text-purple-700 font-medium' : 'hover:bg-slate-50'}`}>Welcome</button>
                <button onClick={() => setSection('fs')} className={`text-left px-4 py-2 rounded-lg transition ${section === 'fs' ? 'bg-purple-100 text-purple-700 font-medium' : 'hover:bg-slate-50'}`}>Filesystem</button>
                <button onClick={() => setSection('pkgs')} className={`text-left px-4 py-2 rounded-lg transition ${section === 'pkgs' ? 'bg-purple-100 text-purple-700 font-medium' : 'hover:bg-slate-50'}`}>Packages</button>
                <button onClick={() => setSection('dev')} className={`text-left px-4 py-2 rounded-lg transition ${section === 'dev' ? 'bg-purple-100 text-purple-700 font-medium' : 'hover:bg-slate-50'}`}>Developer</button>
            </div>
            <div className="flex-1 p-8 overflow-y-auto prose prose-slate max-w-none">
                {section === 'intro' && (
                    <div>
                        <h1 className="text-3xl font-bold mb-4">Welcome to WeberOS!</h1>
                        <p className="mb-4">Hello friend! WeberOS is a web-based operating system simulator designed to feel just like a real desktop environment. It's built with React and TypeScript.</p>
                        <p>You can drag windows, resize them, install apps, and even write your own programs!</p>
                        <h3 className="text-xl font-bold mt-6 mb-2">Getting Started</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Click the <strong>Start Button</strong> (bottom left) to see all apps.</li>
                            <li>Use <strong>Market</strong> to find and install new apps.</li>
                            <li>Use <strong>Settings</strong> to change your wallpaper or manage your profile.</li>
                        </ul>
                    </div>
                )}
                {section === 'fs' && (
                    <div>
                        <h1 className="text-3xl font-bold mb-4">The Filesystem</h1>
                        <p className="mb-4">WeberOS features a virtual in-memory filesystem. Your files are stored safely in your browser's LocalStorage, so they persist even if you refresh the page.</p>
                        <h3 className="text-xl font-bold mt-6 mb-2">Navigator</h3>
                        <p>Use the <strong>Files</strong> app to browse folders. You can create files, folders, and copy/paste items just like on a real PC.</p>
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-4">
                            <strong>Tip:</strong> You can upload real files from your computer by dropping them onto the desktop or using the "Add files" shortcut!
                        </div>
                    </div>
                )}
                {section === 'pkgs' && (
                    <div>
                        <h1 className="text-3xl font-bold mb-4">Package Management</h1>
                        <p className="mb-4">Apps in WeberOS are called "Packages". You can install them in two ways:</p>
                        <ol className="list-decimal pl-6 space-y-2">
                            <li><strong>Market App:</strong> A friendly app store interface.</li>
                            <li><strong>Terminal (wpm):</strong> For power users. Type <code>wpm list</code> to see what's installed.</li>
                        </ol>
                    </div>
                )}
                {section === 'dev' && (
                    <div>
                        <h1 className="text-3xl font-bold mb-4">Developer Guide (.wbr)</h1>
                        <p className="mb-4">You can create your own apps for WeberOS using <strong>.wbr</strong> files! These are simple JSON files that contain React code.</p>
                        <h3 className="text-xl font-bold mt-6 mb-2">Structure</h3>
                        <pre className="bg-slate-800 text-slate-200 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "id": "my-app",
  "name": "My Cool App",
  "icon": "Star",
  "code": "return () => React.createElement('h1', null, 'Hello World')"
}`}
                        </pre>
                        <p className="mt-4">The <code>code</code> field must be a function body that returns a React Component. You have access to <code>React</code> and <code>LucideIcons</code> globals.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
