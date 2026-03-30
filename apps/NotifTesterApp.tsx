import React, { useState } from 'react';
import { Bell, Copy, Check } from 'lucide-react';

export const NotifTesterApp = ({ onNotify }: { onNotify?: (appId: string, title: string, message: string) => void }) => {
  const [title, setTitle] = useState('Hello from NotifTester');
  const [message, setMessage] = useState('This is a custom notification message!');
  const [copied, setCopied] = useState(false);

  const handleNotify = () => {
    if (onNotify) {
      onNotify('notiftester', title, message);
    }
  };

  const codeSnippet = `{
  "id": "my-notif-app",
  "name": "My Notif App",
  "icon": "Bell",
  "permissions": ["notifications"],
  "code": [
    "return function MyNotifApp() {",
    "  return React.createElement('div', { className: 'p-4 h-full bg-slate-50 flex items-center justify-center' },",
    "    React.createElement('button', {",
    "      className: 'px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg',",
    "      onClick: () => Sys.notify('${title.replace(/'/g, "\\'")}', '${message.replace(/'/g, "\\'")}')",
    "    }, 'Send Notification')",
    "  );",
    "}"
  ]
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 text-slate-900 p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notification Tester</h1>
            <p className="text-slate-500">Test in-OS notifications and generate .wbr code</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold border-b border-slate-100 pb-2">Test Notification</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <button 
              onClick={handleNotify}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Bell size={18} />
              Send Notification
            </button>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
            <span className="text-sm font-medium text-slate-300">.wbr App Code Snippet</span>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors bg-slate-700 hover:bg-slate-600 px-2.5 py-1.5 rounded-md"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <div className="p-4 overflow-x-auto">
            <pre className="text-sm text-blue-300 font-mono whitespace-pre-wrap">
              {codeSnippet}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
