import React from 'react';

export const OpenWithDialog = ({ files, apps, onSelect, onClose }: any) => {
    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-2xl w-80 p-4 flex flex-col">
                 <h3 className="font-bold text-lg mb-2">Open with...</h3>
                 <div className="flex-1 overflow-y-auto max-h-60 mb-4 space-y-2">
                     {apps.map((app: any) => (
                         <button 
                            key={app.id} 
                            onClick={() => onSelect(app.id)}
                            className="w-full flex items-center gap-3 p-2 hover:bg-slate-100 rounded-lg transition"
                         >
                             <div className={`p-2 rounded-lg ${app.color} text-white`}>
                                 <app.icon size={20} />
                             </div>
                             <span className="font-medium text-slate-800">{app.name}</span>
                         </button>
                     ))}
                 </div>
                 <button onClick={onClose} className="w-full py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-medium">Cancel</button>
             </div>
        </div>
    );
};