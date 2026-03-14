import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

export type DialogOptions = {
  title?: string;
  message: string;
  type: 'alert' | 'confirm' | 'prompt';
  defaultValue?: string;
};

export type DialogRequest = DialogOptions & {
  id: string;
  resolve: (value: any) => void;
};

let dialogListeners: ((req: DialogRequest) => void)[] = [];

export const showDialog = (options: DialogOptions): Promise<any> => {
  return new Promise((resolve) => {
    const req: DialogRequest = {
      ...options,
      id: Math.random().toString(36).substring(7),
      resolve
    };
    dialogListeners.forEach(l => l(req));
  });
};

export const osAlert = (message: string, title?: string) => showDialog({ message, title, type: 'alert' }) as Promise<boolean>;
export const osConfirm = (message: string, title?: string) => showDialog({ message, title, type: 'confirm' }) as Promise<boolean>;
export const osPrompt = (message: string, defaultValue?: string, title?: string) => showDialog({ message, title, type: 'prompt', defaultValue }) as Promise<string | null>;

export const DialogHost = () => {
  const [dialogs, setDialogs] = useState<DialogRequest[]>([]);
  const [promptValue, setPromptValue] = useState('');

  useEffect(() => {
    const listener = (req: DialogRequest) => {
      setDialogs(prev => [...prev, req]);
      if (req.type === 'prompt') {
          setPromptValue(req.defaultValue || '');
      }
    };
    dialogListeners.push(listener);
    return () => {
      dialogListeners = dialogListeners.filter(l => l !== listener);
    };
  }, []);

  const handleClose = (id: string, result: boolean | string | null) => {
    setDialogs(prev => {
      const dialog = prev.find(d => d.id === id);
      if (dialog) {
        dialog.resolve(result);
      }
      return prev.filter(d => d.id !== id);
    });
  };

  if (dialogs.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {dialogs.map((dialog, index) => (
        <div 
          key={dialog.id} 
          className="bg-slate-900 border border-white/10 shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
          style={{ display: index === dialogs.length - 1 ? 'block' : 'none' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2 text-white font-medium">
              {dialog.type === 'confirm' ? <AlertTriangle size={18} className="text-yellow-500" /> : <Info size={18} className="text-blue-500" />}
              {dialog.title || (dialog.type === 'confirm' ? 'Confirm' : dialog.type === 'prompt' ? 'Prompt' : 'Alert')}
            </div>
            <button onClick={() => handleClose(dialog.id, dialog.type === 'prompt' ? null : false)} className="text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="p-6 text-slate-300 text-sm whitespace-pre-wrap">
            {dialog.message}
            {dialog.type === 'prompt' && (
                <input
                    type="text"
                    value={promptValue}
                    onChange={(e) => setPromptValue(e.target.value)}
                    className="w-full mt-4 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleClose(dialog.id, promptValue);
                        }
                    }}
                />
            )}
          </div>
          <div className="px-4 py-3 border-t border-white/10 bg-black/20 flex justify-end gap-3">
            {(dialog.type === 'confirm' || dialog.type === 'prompt') && (
              <button 
                onClick={() => handleClose(dialog.id, dialog.type === 'prompt' ? null : false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            )}
            <button 
              onClick={() => handleClose(dialog.id, dialog.type === 'prompt' ? promptValue : true)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
            >
              OK
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
