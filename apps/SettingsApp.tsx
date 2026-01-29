import React, { useState } from 'react';
import { User, Palette, HardDrive, Download, Upload, Cpu, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { WALLPAPERS } from '../utils/constants';

export const SettingsApp = ({ user, setUser, onDeleteUser }: any) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'wallpaper'>('profile');

    const handleWallpaperChange = (url: string) => {
        setUser({ ...user, settings: { ...user.settings, wallpaper: url } });
    };

    const handleExport = () => {
        const blob = new Blob([JSON.stringify(user)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${user.username}_weberos_session.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                if (data.username && data.fs) {
                    // Update user and force reload
                    setUser(data);
                    alert("Session imported successfully!");
                } else {
                    alert("Invalid session file.");
                }
            } catch (e) {
                alert("Failed to parse file.");
            }
        };
        reader.readAsText(file);
    };

    const handleDelete = () => {
        if(window.confirm("Are you sure you want to delete this user profile? This action cannot be undone.")) {
            onDeleteUser(user.username);
        }
    };

    return (
        <div className="h-full bg-slate-100 text-slate-800 flex overflow-hidden">
             {/* Sidebar */}
             <div className="w-48 bg-white border-r border-slate-200 p-4 flex flex-col gap-2">
                 <h2 className="font-bold text-lg mb-4 flex items-center gap-2 px-2"><User /> Settings</h2>
                 <button onClick={() => setActiveTab('profile')} className={`text-left px-4 py-2 rounded-lg transition flex items-center gap-2 ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-slate-50'}`}>
                    <User size={18} /> Profile
                 </button>
                 <button onClick={() => setActiveTab('wallpaper')} className={`text-left px-4 py-2 rounded-lg transition flex items-center gap-2 ${activeTab === 'wallpaper' ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-slate-50'}`}>
                    <Palette size={18} /> Wallpaper
                 </button>
             </div>

             {/* Content */}
             <div className="flex-1 p-8 overflow-y-auto">
                 {activeTab === 'profile' && (
                     <div className="max-w-xl">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 bg-slate-300 rounded-full flex items-center justify-center text-2xl font-bold text-slate-600">
                                    {user.username.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-xl font-bold">{user.username}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2"><HardDrive size={18}/> Backup & Restore</h3>
                            <div className="flex gap-4">
                                <button onClick={handleExport} className="flex-1 bg-blue-600 text-white p-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700 transition">
                                    <Download size={16} /> Export Session
                                </button>
                                <label className="flex-1 bg-green-600 text-white p-2 rounded flex items-center justify-center gap-2 hover:bg-green-700 transition cursor-pointer">
                                    <Upload size={16} /> Import Session
                                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                                </label>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2"><Cpu size={18}/> System Info</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between border-b pb-1">
                                    <span className="text-slate-500">OS Version</span><span>WeberOS 1.1.0</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                    <span className="text-slate-500">Storage Used</span><span>{JSON.stringify(user.fs).length} bytes</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                             <h3 className="font-bold mb-4 flex items-center gap-2 text-red-700"><AlertCircle size={18}/> Danger Zone</h3>
                             <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-red-700 transition">
                                <Trash2 size={16} /> Delete User Profile
                             </button>
                        </div>
                     </div>
                 )}

                 {activeTab === 'wallpaper' && (
                     <div>
                         <h3 className="text-2xl font-bold mb-6">Choose Wallpaper</h3>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                             {WALLPAPERS.map((wp, i) => (
                                 <button 
                                    key={i} 
                                    onClick={() => handleWallpaperChange(wp)}
                                    className={`relative aspect-video rounded-lg overflow-hidden border-4 transition ${user.settings.wallpaper === wp ? 'border-blue-500 shadow-xl' : 'border-transparent hover:scale-105'}`}
                                 >
                                     <img src={wp} className="w-full h-full object-cover" />
                                     {user.settings.wallpaper === wp && (
                                         <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                             <div className="bg-white rounded-full p-1"><CheckCircle2 className="text-blue-500" /></div>
                                         </div>
                                     )}
                                 </button>
                             ))}
                         </div>
                     </div>
                 )}
             </div>
        </div>
    );
};
