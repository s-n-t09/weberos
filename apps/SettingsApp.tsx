import React, { useState } from 'react';
import { User, Palette, HardDrive, Download, Upload, Cpu, AlertCircle, Trash2, CheckCircle2, Bell, AppWindow, Github, Package } from 'lucide-react';
import { WALLPAPERS, FILE_ASSOCIATIONS, DEFAULT_APPS } from '../utils/constants';
import { osAlert, osConfirm } from '../components/DialogHost';

export const SettingsApp = ({ user, setUser, onDeleteUser }: any) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'defaults' | 'apps'>('profile');
    const [customWallpaper, setCustomWallpaper] = useState('');

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

    const handleUninstallApp = async (appId: string) => {
        if (await osConfirm(`Are you sure you want to uninstall ${appId}?`)) {
            const newInstalled = user.installedPackages.filter((id: string) => id !== appId);
            const newCustomApps = { ...user.customApps };
            delete newCustomApps[appId];
            setUser({
                ...user,
                installedPackages: newInstalled,
                customApps: newCustomApps
            });
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
                 <button onClick={() => setActiveTab('apps')} className={`text-left px-4 py-2 rounded-lg transition flex items-center gap-2 ${activeTab === 'apps' ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}>
                    <Package size={18} /> Installed Apps
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
                                    <span className="text-slate-500">OS Version</span><span className="text-slate-900">WeberOS 2.3.0</span>
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

                 {activeTab === 'apps' && (
                     <div className="max-w-xl">
                         <h3 className={`text-2xl font-bold mb-6 transition-colors text-slate-900`}>Installed Apps</h3>
                         {user.installedPackages.length === 0 ? (
                             <div className="text-slate-500 text-center py-8">No custom apps installed.</div>
                         ) : (
                             <div className={`rounded-xl border divide-y transition-colors bg-white border-slate-200 divide-slate-100`}>
                                 {user.installedPackages.map((appId: string) => {
                                     const app = user.customApps[appId];
                                     return (
                                         <div key={appId} className="p-4 flex items-center justify-between">
                                             <div className="flex items-center gap-3">
                                                 <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                                                     <Package size={20} />
                                                 </div>
                                                 <div>
                                                     <div className="font-bold text-slate-900">{app?.name || appId}</div>
                                                     <div className="text-xs text-slate-500">v{app?.version || '1.0.0'} • {appId}</div>
                                                 </div>
                                             </div>
                                             <button 
                                                 onClick={() => handleUninstallApp(appId)}
                                                 className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                                             >
                                                 <Trash2 size={14} /> Uninstall
                                             </button>
                                         </div>
                                     );
                                 })}
                             </div>
                         )}
                     </div>
                 )}

                 {activeTab === 'appearance' && (
                     <div className="max-w-xl">
                         <h3 className={`text-2xl font-bold mb-6 transition-colors text-slate-900`}>Appearance</h3>
                         
                         <div className={`p-6 rounded-xl border transition-colors bg-white border-slate-200 mb-6`}>
                             <h4 className={`font-bold mb-4 flex items-center gap-2 transition-colors text-slate-900`}>Custom Wallpaper</h4>
                             <div className="flex gap-2">
                                 <input 
                                     type="text" 
                                     placeholder="Enter image URL..." 
                                     value={customWallpaper}
                                     onChange={(e) => setCustomWallpaper(e.target.value)}
                                     className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-slate-50 border-slate-300"
                                 />
                                 <button 
                                     onClick={() => {
                                         if (customWallpaper) {
                                             handleWallpaperChange(customWallpaper);
                                             setCustomWallpaper('');
                                         }
                                     }}
                                     className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                                 >
                                     Apply
                                 </button>
                             </div>
                         </div>

                         <div className={`p-6 rounded-xl border transition-colors bg-white border-slate-200 mb-6`}>
                             <h4 className={`font-bold mb-4 flex items-center gap-2 transition-colors text-slate-900`}>Taskbar Style</h4>
                             <div className="flex gap-4">
                                 {['default', 'dark', 'glass', 'transparent'].map(style => (
                                     <button
                                         key={style}
                                         onClick={() => setUser({ ...user, settings: { ...user.settings, taskbarStyle: style } })}
                                         className={`px-4 py-2 rounded-lg capitalize text-sm font-medium border transition ${user.settings.taskbarStyle === style || (!user.settings.taskbarStyle && style === 'default') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                                     >
                                         {style}
                                     </button>
                                 ))}
                             </div>
                         </div>

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