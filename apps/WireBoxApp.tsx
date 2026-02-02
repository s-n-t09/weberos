import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Search, Plus, X, Globe, Settings, Download, Shield, ExternalLink, Home } from 'lucide-react';
import { UserProfile, FileSystemNode } from '../types';

interface Tab {
    id: string;
    title: string;
    url: string;
    loading: boolean;
    history: string[];
    historyIndex: number;
    proxyMode: boolean;
    srcDoc?: string;
}

const SEARCH_ENGINES = {
    'DuckDuckGo': 'https://duckduckgo.com/lite/?q=',
    'Google': 'https://www.google.com/search?q=',
    'Bing': 'https://www.bing.com/search?q='
};

export const WireBoxApp = ({ user, setUser, openApp }: { user: UserProfile, setUser: (u: UserProfile) => void, openApp: (id: string, data?: any) => void }) => {
    const [tabs, setTabs] = useState<Tab[]>([
        { id: '1', title: 'Home', url: 'weberos://home', loading: false, history: ['weberos://home'], historyIndex: 0, proxyMode: true }
    ]);
    const [activeTabId, setActiveTabId] = useState('1');
    const [urlInput, setUrlInput] = useState('');
    const [engine, setEngine] = useState<'DuckDuckGo' | 'Google' | 'Bing'>('DuckDuckGo');
    const [showSettings, setShowSettings] = useState(false);

    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

    useEffect(() => {
        setUrlInput(activeTab.url === 'weberos://home' ? '' : activeTab.url);
    }, [activeTabId, activeTab.url]);

    const updateTab = (id: string, updates: Partial<Tab>) => {
        setTabs(prevTabs => prevTabs.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const handleNavigate = async (inputUrl: string) => {
        if (!inputUrl) return;
        
        let finalUrl = inputUrl;
        let displayTitle = inputUrl;

        if (inputUrl === 'weberos://home') {
            updateTab(activeTabId, { url: inputUrl, title: 'Home', loading: false, srcDoc: undefined });
            return;
        }

        if (!inputUrl.startsWith('http') && !inputUrl.startsWith('weberos://') && !inputUrl.includes('.')) {
            finalUrl = SEARCH_ENGINES[engine] + encodeURIComponent(inputUrl);
            displayTitle = `${engine}: ${inputUrl}`;
        } else if (!inputUrl.startsWith('http') && !inputUrl.startsWith('weberos://')) {
            finalUrl = 'https://' + inputUrl;
        }

        const newHistory = [...activeTab.history.slice(0, activeTab.historyIndex + 1), finalUrl];
        updateTab(activeTabId, { 
            url: finalUrl,
            loading: true,
            title: displayTitle,
            history: newHistory,
            historyIndex: newHistory.length - 1
        });

        // Simulation of link redirection and file download check
        if (finalUrl.match(/\.(zip|pdf|exe|png|jpg|mp4|wbr)$/i)) {
            const confirmDownload = window.confirm(`This link looks like a file: ${finalUrl.split('/').pop()}\nDo you want to download it to WeberOS?`);
            if (confirmDownload) {
                handleDownload(finalUrl);
                updateTab(activeTabId, { loading: false });
                return;
            }
        }

        if (activeTab.proxyMode && finalUrl.startsWith('http')) {
             try {
                const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(finalUrl)}`);
                const data = await res.json();
                
                if (data.contents) {
                     let content = data.contents;
                     const baseTag = `<base href="${finalUrl}" target="_self" />`;
                     content = content.replace(/<head>/i, `<head>${baseTag}`);
                     
                     // Intercept links for redirection handling
                     const script = `
                        <script>
                            document.addEventListener('click', e => {
                                const a = e.target.closest('a');
                                if(a && a.href) {
                                    e.preventDefault();
                                    window.parent.postMessage({ type: 'WIREBOX_NAV', url: a.href }, '*');
                                }
                            });
                        </script>
                     `;
                     content += script;
                     updateTab(activeTabId, { loading: false, srcDoc: content });
                }
             } catch (e) {
                 updateTab(activeTabId, { loading: false, srcDoc: `<div style="padding:2rem;text-align:center;font-family:sans-serif;"><h2>Proxy Error</h2><p>Failed to load ${finalUrl}</p></div>` });
             }
        } else {
             setTimeout(() => updateTab(activeTabId, { loading: false, srcDoc: undefined }), 1000);
        }
    };

    // Listen for messages from iframe (redirection handling)
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data.type === 'WIREBOX_NAV') {
                handleNavigate(e.data.url);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [activeTabId, activeTab]);

    const handleDownload = (url: string) => {
        const fileName = url.split('/').pop() || 'downloaded_file';
        let downloadsDir = user.fs;
        for(const p of ['home', 'user', 'downloads']) {
            if (downloadsDir.children && downloadsDir.children[p]) downloadsDir = downloadsDir.children[p];
        }
        
        if (downloadsDir.children) {
            downloadsDir.children[fileName] = { type: 'file', content: `Downloaded from: ${url}` };
            setUser({ ...user });
            alert(`File ${fileName} saved to ~/home/user/downloads`);
        }
    };

    const addTab = () => {
        const id = Date.now().toString();
        setTabs([...tabs, { id, title: 'Home', url: 'weberos://home', loading: false, history: ['weberos://home'], historyIndex: 0, proxyMode: true }]);
        setActiveTabId(id);
    };

    const closeTab = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (tabs.length === 1) return;
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id);
    };

    return (
        <div className="h-full flex flex-col bg-slate-100 font-sans">
            {/* Tab Bar */}
            <div className="flex items-center bg-slate-200 p-1 gap-1 overflow-x-auto no-scrollbar border-b border-slate-300">
                {tabs.map(tab => (
                    <div 
                        key={tab.id}
                        onClick={() => setActiveTabId(tab.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs min-w-[120px] max-w-[180px] cursor-pointer transition-all ${activeTabId === tab.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:bg-slate-300'}`}
                    >
                        <Globe size={12} className={tab.loading ? 'animate-spin' : ''} />
                        <span className="truncate flex-1">{tab.title}</span>
                        <X size={12} className="hover:bg-slate-200 rounded-full p-0.5" onClick={(e) => closeTab(tab.id, e)} />
                    </div>
                ))}
                <button onClick={addTab} className="p-1.5 hover:bg-slate-300 rounded-lg text-slate-600 transition"><Plus size={14} /></button>
            </div>

            {/* Address Bar */}
            <div className="bg-white p-2 flex items-center gap-2 border-b border-slate-200 shadow-sm">
                <div className="flex items-center gap-1">
                    <button onClick={() => activeTab.historyIndex > 0 && updateTab(activeTabId, { historyIndex: activeTab.historyIndex - 1, url: activeTab.history[activeTab.historyIndex - 1] })} className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30"><ArrowLeft size={16}/></button>
                    <button onClick={() => activeTab.historyIndex < activeTab.history.length - 1 && updateTab(activeTabId, { historyIndex: activeTab.historyIndex + 1, url: activeTab.history[activeTab.historyIndex + 1] })} className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30"><ArrowRight size={16}/></button>
                    <button onClick={() => handleNavigate(activeTab.url)} className="p-1.5 hover:bg-slate-100 rounded-lg"><RotateCcw size={16}/></button>
                    <button onClick={() => handleNavigate('weberos://home')} className="p-1.5 hover:bg-slate-100 rounded-lg"><Home size={16}/></button>
                </div>
                
                <div className="flex-1 relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition">
                        {activeTab.proxyMode ? <Shield size={14} /> : <Globe size={14} />}
                    </div>
                    <input 
                        className="w-full bg-slate-100 border-none rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleNavigate(urlInput)}
                        placeholder="Search or enter address"
                    />
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={() => updateTab(activeTabId, { proxyMode: !activeTab.proxyMode })} className={`p-2 rounded-xl transition ${activeTab.proxyMode ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`} title="Enhanced Mode (Proxy)">
                        <Shield size={18} />
                    </button>
                    <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition"><Settings size={18}/></button>
                </div>
            </div>

            {/* Browser Area */}
            <div className="flex-1 bg-white overflow-hidden relative">
                {activeTab.url === 'weberos://home' ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-50 to-white">
                        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl mb-8 rotate-3">
                            <Globe size={48} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mb-8">WireBox</h1>
                        <div className="w-full max-w-xl relative mb-12">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-lg shadow-xl shadow-slate-200/50 outline-none focus:border-blue-500 transition"
                                placeholder={`Search with ${engine}...`}
                                onKeyDown={e => e.key === 'Enter' && handleNavigate((e.target as HTMLInputElement).value)}
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-6 w-full max-w-2xl">
                            {[
                                { name: 'GitHub', url: 'https://github.com', color: 'bg-slate-900' },
                                { name: 'Google', url: 'https://google.com', color: 'bg-red-500' },
                                { name: 'DuckDuckGo', url: 'https://duckduckgo.com', color: 'bg-orange-500' },
                                { name: 'React', url: 'https://react.dev', color: 'bg-blue-400' }
                            ].map(site => (
                                <button key={site.name} onClick={() => handleNavigate(site.url)} className="flex flex-col items-center gap-2 group">
                                    <div className={`w-14 h-14 ${site.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition`}>
                                        <span className="text-xl font-bold">{site.name[0]}</span>
                                    </div>
                                    <span className="text-xs font-medium text-slate-600">{site.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <iframe 
                        src={activeTab.srcDoc ? undefined : activeTab.url}
                        srcDoc={activeTab.srcDoc}
                        className="w-full h-full border-none"
                        title="WireBox View"
                    />
                )}
            </div>
        </div>
    );
};
