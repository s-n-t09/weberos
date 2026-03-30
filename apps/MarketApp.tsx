import React, { useState, useEffect } from 'react';
import { Download, LayoutGrid, Code, Image as ImageIcon, Gamepad2, Cpu, Package, Search } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { UserProfile } from '../types';
import { osAlert } from '../components/DialogHost';

export const MarketApp = ({ user, setUser, onNotify }: { user: UserProfile, setUser: (u: UserProfile) => void, onNotify?: (appId: string, title: string, message: string) => void }) => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [marketApps, setMarketApps] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const categories = ['All', 'Programming', 'Media', 'Games', 'Tools', 'Other'];

    useEffect(() => {
        const loadMarketData = async () => {
            const colors: Record<string, string> = {
                'Programming': 'bg-indigo-500',
                'Media': 'bg-pink-500',
                'Games': 'bg-orange-500',
                'Tools': 'bg-emerald-500',
                'Other': 'bg-yellow-500'
            };

            let allApps: any[] = [];
            
            try {
                const categoryModules = import.meta.glob('/market/*.json', { eager: true });
                const wbrModules = import.meta.glob('/market/apps/*.wbr', { query: '?raw', import: 'default' });
                
                for (const [path, module] of Object.entries(categoryModules)) {
                    const catName = path.split('/').pop()?.replace('.json', '');
                    const cat = catName ? catName.charAt(0).toUpperCase() + catName.slice(1) : 'Other';
                    
                    const apps = (module as any).default || module;
                    if (Array.isArray(apps)) {
                        const appsWithMeta = await Promise.all(apps.map(async app => {
                            let version = app.version;
                            if (!version && app.location) {
                                try {
                                    const wbrPath = app.location.startsWith('/') ? app.location : `/${app.location}`;
                                    if (wbrModules[wbrPath]) {
                                        const rawData = await wbrModules[wbrPath]();
                                        const wbrData = JSON.parse(rawData as string);
                                        if (wbrData.version) version = wbrData.version;
                                    } else {
                                        const res = await fetch(wbrPath);
                                        if (res.ok) {
                                            const wbrData = await res.json();
                                            if (wbrData.version) version = wbrData.version;
                                        }
                                    }
                                } catch (e) {
                                    console.error(`Failed to fetch version for ${app.id}`, e);
                                }
                            }
                            return {
                                ...app,
                                version,
                                category: cat,
                                color: colors[cat] || 'bg-slate-500'
                            };
                        }));
                        allApps = [...allApps, ...appsWithMeta];
                    }
                }
            } catch (e) {
                console.error('Failed to load market data', e);
            }
            
            setMarketApps(allApps);
        };

        loadMarketData();
    }, []);

    const filteredApps = marketApps.filter(app => {
        const matchesCategory = activeCategory === 'All' || app.category === activeCategory;
        const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (app.description && app.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    const handleInstall = async (app: any) => {
        const isInstalled = user.installedPackages.includes(app.id);
        const existingApp = user.customApps[app.id];
        const isUpgrade = isInstalled && existingApp?.version && app.version && existingApp.version !== app.version;

        if (isInstalled && !isUpgrade) {
            await osAlert('App is already installed!');
            return;
        }

        let code = app.code;
        let permissions = app.permissions || [];
        let version = app.version;

        if (!code && app.location) {
            try {
                const wbrModules = import.meta.glob('/market/apps/*.wbr', { query: '?raw', import: 'default' });
                const wbrPath = app.location.startsWith('/') ? app.location : `/${app.location}`;
                
                if (wbrModules[wbrPath]) {
                    const rawData = await wbrModules[wbrPath]();
                    const wbrData = JSON.parse(rawData as string);
                    code = wbrData.code;
                    if (wbrData.permissions) permissions = wbrData.permissions;
                    if (wbrData.version) version = wbrData.version;
                } else {
                    const fetchUrl = wbrPath;
                    const res = await fetch(fetchUrl);
                    if (!res.ok) throw new Error('Failed to download app code');
                    const wbrData = await res.json();
                    code = wbrData.code;
                    if (wbrData.permissions) {
                        permissions = wbrData.permissions;
                    }
                    if (wbrData.version) {
                        version = wbrData.version;
                    }
                }
            } catch (e) {
                console.error(e);
                await osAlert(`Failed to download ${app.name}`);
                return;
            }
        }

        const newCustomApps = { ...user.customApps, [app.id]: { id: app.id, name: app.name, iconName: app.icon, version: version, code: code, permissions: permissions, location: app.location }};
        const newPkgs = isInstalled ? user.installedPackages : [...user.installedPackages, app.id];
        setUser({...user, installedPackages: newPkgs, customApps: newCustomApps});
        if (onNotify) onNotify('market', isUpgrade ? 'App Upgraded' : 'App Installed', `${app.name} ${isUpgrade ? 'upgraded' : 'installed'} successfully!`);
        await osAlert(`${app.name} ${isUpgrade ? 'upgraded' : 'installed'} successfully!`);
    };

    const handleUninstall = async (app: any) => {
        const newCustomApps = { ...user.customApps };
        delete newCustomApps[app.id];
        const newPkgs = user.installedPackages.filter(id => id !== app.id);
        setUser({...user, installedPackages: newPkgs, customApps: newCustomApps});
        if (onNotify) onNotify('market', 'App Uninstalled', `${app.name} uninstalled successfully!`);
        await osAlert(`${app.name} uninstalled successfully!`);
    };

    return (
        <div className="flex h-full bg-slate-50 text-slate-800">
            {/* Sidebar */}
            <div className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-6 px-2">
                    <div className="p-2 bg-blue-600 rounded-lg text-white">
                        <Download size={20} />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Market</span>
                </div>
                {categories.map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => setActiveCategory(cat)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl text-sm font-medium transition-all ${activeCategory === cat ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        {cat === 'All' && <LayoutGrid size={18} />}
                        {cat === 'Programming' && <Code size={18} />}
                        {cat === 'Media' && <ImageIcon size={18} />}
                        {cat === 'Games' && <Gamepad2 size={18} />}
                        {cat === 'Tools' && <Cpu size={18} />}
                        {cat === 'Other' && <Package size={18} />}
                        {cat}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-8 pb-0">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">{activeCategory} Apps</h1>
                            <p className="text-slate-500">Discover and install new features for your WeberOS.</p>
                        </div>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search apps..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-0 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredApps.map(app => {
                            const Icon = (LucideIcons as any)[app.icon] || Package;
                            const isInstalled = user.installedPackages.includes(app.id);
                            const existingApp = user.customApps[app.id];
                            const isUpgrade = isInstalled && existingApp?.version && app.version && existingApp.version !== app.version;

                            return (
                                <div key={app.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-2xl ${app.color} text-white shadow-lg`}>
                                            <Icon size={24} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-slate-100 text-slate-500 rounded-full">
                                            {app.category}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-900 mb-0.5">{app.name} {app.version ? <span className="text-xs text-slate-400 font-normal ml-1">v{app.version}</span> : null}</h3>
                                    <div className="text-[10px] text-blue-600 font-medium mb-2">by {app.author || 'Unknown'}</div>
                                    <p className="text-sm text-slate-500 mb-6 flex-1 line-clamp-3">{app.description}</p>
                                    <div className="flex gap-2 w-full">
                                        {isInstalled ? (
                                            <>
                                                {isUpgrade ? (
                                                    <button 
                                                        onClick={() => handleInstall(app)}
                                                        className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
                                                    >
                                                        Upgrade
                                                    </button>
                                                ) : (
                                                    <button 
                                                        disabled
                                                        className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all bg-slate-100 text-slate-400 cursor-default"
                                                    >
                                                        Installed
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleUninstall(app)}
                                                    className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all bg-red-100 text-red-600 hover:bg-red-200"
                                                >
                                                    Uninstall
                                                </button>
                                            </>
                                        ) : (
                                            <button 
                                                onClick={() => handleInstall(app)}
                                                className="w-full py-2.5 rounded-xl font-bold text-sm transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
                                            >
                                                Install
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {filteredApps.length === 0 && (
                            <div className="col-span-full text-center py-10 text-slate-400">
                                No apps found matching your criteria.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
