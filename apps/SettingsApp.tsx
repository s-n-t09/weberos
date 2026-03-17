import React, { useState } from 'react';
import { User, Palette, HardDrive, Download, Upload, Cpu, AlertCircle, Trash2, CheckCircle2, Bell, AppWindow, Github } from 'lucide-react';
import { WALLPAPERS, FILE_ASSOCIATIONS, DEFAULT_APPS } from '../utils/constants';
import { osAlert, osConfirm } from '../components/DialogHost';

export const SettingsApp = ({ user, setUser, onDeleteUser }: any) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'defaults'>('profile');

    const handleWallpaperChange = (url: string) => {
        setUser({ ...user, settings: { ...user.settings, wallpaper: url } });
    };

    const toggleNotificationSetting = (key: string) => {
        const current = user.settings.notifications || { enabled: true, sound: true, external: false };
        setUser({
            ...user,
            settings: {
                ...user.settings,
                notifications: {
                    ...current,
                    // @ts-ignore
                    [key]: !current[key]
                }
            }
        });
    };

    const handleDefaultAppChange = (ext: string, appId: string) => {
        setUser({
            ...user,
            settings: {
                ...user.settings,
                defaultApps: {
                    ...(user.settings.defaultApps || {}),
                    [ext]: appId
                }
            }
        });
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
        reader.onload = async (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                if (data.username && data.fs) {
                    setUser(data);
                    await osAlert("Session imported successfully!");
                } else {
                    await osAlert("Invalid session file.");
                }
            } catch (e) {
                await osAlert("Failed to parse file.");
            }
        };
        reader.readAsText(file);
    };

    const handleDelete = async () => {
        if(await osConfirm("Are you sure you want to delete this user profile? This action cannot be undone.")) {
            onDeleteUser(user.username);
        }
    };

    const notifSettings = user.settings.notifications || { enabled: true, sound: true, external: false };

    return (
        <div className={`h-full flex overflow-hidden transition-colors bg-slate-100 text-slate-800`}>
             {/* Sidebar */}
             <div className={`w-48 p-4 flex flex-col gap-2 transition-colors bg-white border-r border-slate-200`}>
                 <h2 className={`font-bold text-lg mb-4 flex items-center gap-2 px-2 transition-colors text-slate-900`}><User /> Settings</h2>
                 <button onClick={() => setActiveTab('profile')} className={`text-left px-4 py-2 rounded-lg transition flex items-center gap-2 ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}>
                    <User size={18} /> Profile
                 </button>
                 <button onClick={() => setActiveTab('appearance')} className={`text-left px-4 py-2 rounded-lg transition flex items-center gap-2 ${activeTab === 'appearance' ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}>
                    <Palette size={18} /> Appearance
                 </button>
                 <button onClick={() => setActiveTab('notifications')} className={`text-left px-4 py-2 rounded-lg transition flex items-center gap-2 ${activeTab === 'notifications' ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}>
                    <Bell size={18} /> Notifications
                 </button>
                 <button onClick={() => setActiveTab('defaults')} className={`text-left px-4 py-2 rounded-lg transition flex items-center gap-2 ${activeTab === 'defaults' ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}>
                    <AppWindow size={18} /> Default Apps
                 </button>
             </div>

             {/* Content */}
             <div className="flex-1 p-8 overflow-y-auto">
                 {activeTab === 'profile' && (
                     <div className="max-w-xl">
                        <div className={`p-6 rounded-xl shadow-sm mb-6 transition-colors bg-white border border-slate-200`}>
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold transition-colors bg-slate-300 text-slate-600`}>
                                    {user.username.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <div className={`text-xl font-bold transition-colors text-slate-900`}>{user.username}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className={`p-6 rounded-xl shadow-sm mb-6 transition-colors bg-white border border-slate-200`}>
                            <h3 className={`font-bold mb-4 flex items-center gap-2 transition-colors text-slate-900`}><HardDrive size={18}/> Backup & Restore</h3>
                            <div className="flex gap-4">
                                <button onClick={handleExport} className="flex-1 bg-blue-600 text-white p-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-sm">
                                    <Download size={16} /> Export Session
                                </button>
                                <label className="flex-1 bg-green-600 text-white p-2 rounded flex items-center justify-center gap-2 hover:bg-green-700 transition cursor-pointer shadow-sm">
                                    <Upload size={16} /> Import Session
                                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                                </label>
                            </div>
                        </div>

                        <div className={`p-6 rounded-xl shadow-sm mb-6 transition-colors bg-white border border-slate-200`}>
                            <h3 className={`font-bold mb-4 flex items-center gap-2 transition-colors text-slate-900`}><Cpu size={18}/> System Info</h3>
                            <div className="space-y-2 text-sm">
                                <div className={`flex justify-between border-b pb-1 transition-colors border-slate-100`}>
                                    <span className="text-slate-500">OS Version</span><span className="text-slate-900">WeberOS 1.8.0</span>
                                </div>
                                <div className={`flex justify-between border-b pb-1 transition-colors border-slate-100`}>
                                    <span className="text-slate-500">Storage Used</span><span className="text-slate-900">{JSON.stringify(user.fs).length} bytes</span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <button onClick={() => window.open('https://github.com/s-n-t09/weberos', '_blank')} className="w-full bg-slate-900 text-white p-2 rounded flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-sm">
                                    <Github size={16} /> Show source in GitHub
                                </button>
                            </div>
                        </div>

                        <div className={`p-6 rounded-xl border transition-colors bg-red-50 border-red-200`}>
                             <h3 className={`font-bold mb-4 flex items-center gap-2 transition-colors text-red-700`}><AlertCircle size={18}/> Danger Zone</h3>
                             <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-red-700 transition shadow-sm">
                                <Trash2 size={16} /> Delete User Profile
                             </button>
                        </div>
                     </div>
                 )}

                 {activeTab === 'notifications' && (
                     <div className="max-w-xl">
                          <h3 className={`text-2xl font-bold mb-6 transition-colors text-slate-900`}>Notification Settings</h3>
                          <div className={`rounded-xl border divide-y transition-colors bg-white border-slate-200 divide-slate-100`}>
                             <div className="p-4 flex items-center justify-between">
                                 <div>
                                     <div className={`font-bold transition-colors text-slate-900`}>System Notifications</div>
                                     <div className={`text-sm transition-colors text-slate-500`}>Enable in-OS notifications tray</div>
                                 </div>
                                 <input 
                                     type="checkbox" 
                                     checked={notifSettings.enabled}
                                     onChange={() => toggleNotificationSetting('enabled')}
                                     className="w-5 h-5 accent-blue-600"
                                 />
                             </div>
                             <div className="p-4 flex items-center justify-between">
                                 <div>
                                     <div className={`font-bold transition-colors text-slate-900`}>Browser Notifications</div>
                                     <div className={`text-sm transition-colors text-slate-500`}>Allow WeberOS to send real browser notifications</div>
                                 </div>
                                 <input 
                                     type="checkbox" 
                                     checked={notifSettings.external}
                                     onChange={() => toggleNotificationSetting('external')}
                                     className="w-5 h-5 accent-blue-600"
                                 />
                             </div>
                          </div>
                     </div>
                 )}

                 {activeTab === 'defaults' && (
                     <div className="max-w-xl">
                        <h3 className={`text-2xl font-bold mb-6 transition-colors text-slate-900`}>Default Apps</h3>
                        <div className={`rounded-xl border divide-y transition-colors bg-white border-slate-200 divide-slate-100`}>
                            {Object.entries(FILE_ASSOCIATIONS).map(([ext, apps]) => {
                                const currentDefault = user.settings.defaultApps?.[ext] || apps[0];
                                return (
                                    <div key={ext} className="p-4 flex items-center justify-between">
                                        <div className={`font-mono px-2 py-1 rounded text-sm transition-colors bg-slate-100 text-slate-700`}>.{ext}</div>
                                        <select 
                                            value={currentDefault} 
                                            onChange={(e) => handleDefaultAppChange(ext, e.target.value)}
                                            className={`border rounded px-2 py-1 text-sm outline-none focus:border-blue-500 transition-colors bg-slate-50 border-slate-300 text-slate-900`}
                                        >
                                            {DEFAULT_APPS.map(app => (
                                                <option key={app} value={app}>{app}</option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            })}
                        </div>
                     </div>
                 )}

                 {activeTab === 'appearance' && (
                     <div className="max-w-xl">
                         <h3 className={`text-2xl font-bold mb-6 transition-colors text-slate-900`}>Appearance</h3>
                         
                         <h4 className={`font-bold mb-4 flex items-center gap-2 transition-colors text-slate-900`}>Choose Wallpaper</h4>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                             {WALLPAPERS.map((wp, i) => (
                                 <button 
                                    key={i} 
                                    onClick={() => handleWallpaperChange(wp)}
                                    className={`relative aspect-video rounded-lg overflow-hidden border-4 transition ${user.settings.wallpaper === wp ? 'border-blue-500 shadow-xl' : 'border-transparent hover:scale-105'}`}
                                 >
                                     <img src={wp} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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