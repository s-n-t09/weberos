import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Search, Plus, X, Globe, Settings, Download, AlertTriangle, Shield, ShieldAlert } from 'lucide-react';
import { UserProfile } from '../types';

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
    'Bing': 'https://www.bing.com/search?q='
};

export const WireBoxApp = ({ user, setUser }: { user: UserProfile, setUser: (u: UserProfile) => void }) => {
    // ProxyMode is now TRUE by default
    const [tabs, setTabs] = useState<Tab[]>([
        { id: '1', title: 'New Tab', url: '', loading: false, history: [''], historyIndex: 0, proxyMode: true }
    ]);
    const [activeTabId, setActiveTabId] = useState('1');
    const [urlInput, setUrlInput] = useState('');
    // Default engine changed to DuckDuckGo since Google is removed
    const [engine, setEngine] = useState<'DuckDuckGo' | 'Bing'>('DuckDuckGo');
    const [showSettings, setShowSettings] = useState(false);
    const [activeSection, setActiveSection] = useState<'browser' | 'downloads'>('browser');

    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

    useEffect(() => {
        setUrlInput(activeTab.url);
    }, [activeTabId, activeTab.url]);

    const updateTab = (id: string, updates: Partial<Tab>) => {
        setTabs(prevTabs => prevTabs.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const handleNavigate = async (inputUrl: string) => {
        let finalUrl = inputUrl;
        let displayTitle = inputUrl;
        let originalUrl = inputUrl; 

        if (!inputUrl.startsWith('http') && !inputUrl.startsWith('data:') && !inputUrl.includes('.')) {
            // Search logic
            // @ts-ignore
            originalUrl = SEARCH_ENGINES[engine] + encodeURIComponent(inputUrl);
            displayTitle = `${engine}: ${inputUrl}`;
        } else if (!inputUrl.startsWith('http') && !inputUrl.startsWith('data:')) {
            originalUrl = 'https://' + inputUrl;
        }
        
        // Always set title to something friendly if possible
        if(originalUrl.startsWith('https://')) displayTitle = originalUrl.replace('https://', '');

        // For proxy logic, we generally want the final destination URL if it's a search
        finalUrl = originalUrl;

        const newHistory = [...activeTab.history.slice(0, activeTab.historyIndex + 1), finalUrl];
        
        // Optimistic update
        updateTab(activeTabId, { 
            url: finalUrl,
            loading: true,
            title: displayTitle,
            history: newHistory,
            historyIndex: newHistory.length - 1
        });

        if (activeTab.proxyMode && finalUrl.startsWith('http')) {
             try {
                // Use AllOrigins as a JSONP/CORS proxy to fetch raw HTML
                const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(finalUrl)}`);
                const data = await res.json();
                
                if (data.contents) {
                     let content = data.contents;
                     // Inject Base Tag so relative links/images work
                     const baseTag = `<base href="${finalUrl}" target="_self" />`;
                     if (content.toLowerCase().includes('<head>')) {
                         content = content.replace(/<head>/i, `<head>${baseTag}`);
                     } else {
                         content = `${baseTag}${content}`;
                     }
                     
                     // Helper script to intercept links and prevent top-frame navigation
                     const helperScript = `
                        <script>
                            document.addEventListener('click', function(e) {
                                const anchor = e.target.closest('a');
                                if(anchor && anchor.href) {
                                    e.preventDefault();
                                    // Send message to parent
                                    // This is a simplified demo; robust implementation requires postMessage
                                    window.top.postMessage({ type: 'WIREBOX_NAV', url: anchor.href }, '*');
                                }
                            });
                        </script>
                     `;
                     // We aren't fully handling the postMessage in this simplified version, 
                     // but the base tag handles assets. 
                     
                     updateTab(activeTabId, { loading: false, srcDoc: content });
                } else {
                    throw new Error("No content returned from proxy");
                }
             } catch (e) {
                 console.error("Proxy Error", e);
                 updateTab(activeTabId, { 
                     loading: false, 
                     srcDoc: `
                        <html>
                        <body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align:center; padding:3rem; color:#333; background:#f8f9fa;">
                            <div style="max-width:500px; margin:0 auto; background:white; padding:2rem; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                                <h1 style="color:#e11d48; margin-bottom:1rem;">Proxy Error</h1>
                                <p style="line-height:1.6; color:#4b5563;">Could not load content via Enhanced Mode.</p>
                                <p style="background:#f1f5f9; padding:0.75rem; border-radius:6px; font-family:monospace; font-size:0.9em;">${(e as Error).message}</p>
                                <p style="margin-top:1.5rem; font-size:0.9em; color:#64748b;">Try disabling Enhanced Mode (Shield icon) or checking your internet connection.</p>
                            </div>
                        </body>
                        </html>
                     ` 
                 });
             }
        } else {
             // Standard Iframe Mode
             // Just wait a sec to simulate load, then clear srcDoc so iframe uses 'src'
             setTimeout(() => {
                updateTab(activeTabId, { loading: false, srcDoc: undefined });
            }, 1000);
        }
    };

    const toggleProxy = () => {
        const newVal = !activeTab.proxyMode;
        // Update state and immediately reload page with new setting
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, proxyMode: newVal } : t));
        
        // Hacky way to trigger reload with new mode since setTabs is async
        setTimeout(() => {
           const btn = document.getElementById('wb-reload-btn');
           if(btn) btn.click();
        }, 50);
    };

    const handleReload = () => {
        handleNavigate(activeTab.url);
    };

    const handleBack = () => {
        if (activeTab.historyIndex > 0) {
            const newIndex = activeTab.historyIndex - 1;
            const newUrl = activeTab.history[newIndex];
            updateTab(activeTabId, { historyIndex: newIndex, url: newUrl });
        }
    };

    const handleForward = () => {
        if (activeTab.historyIndex < activeTab.history.length - 1) {
            const newIndex = activeTab.historyIndex + 1;
            const newUrl = activeTab.history[newIndex];
            updateTab(activeTabId, { historyIndex: newIndex, url: newUrl });
        }
    };

    const addTab = () => {
        const id = Date.now().toString();
        // New tabs have proxy enabled by default
        setTabs([...tabs, { id, title: 'New Tab', url: '', loading: false, history: [''], historyIndex: 0, proxyMode: true }]);
        setActiveTabId(id);
    };

    const closeTab = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (tabs.length === 1) return; // Don't close last tab
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id);
    };

    if (showSettings) {
        return (
            <div className="h-full bg-slate-50 flex flex-col">
                <div className="bg-slate-200 p-2 border-b border-slate-300 flex items-center">
                    <button onClick={() => setShowSettings(false)} className="flex items-center gap-1 text-slate-600 hover:text-slate-900">
                        <ArrowLeft size={16} /> Back to Browser
                    </button>
                    <span className="mx-auto font-bold text-slate-700">WireBox Settings</span>
                </div>
                <div className="p-8 max-w-2xl mx-auto w-full">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-800"><Search size={18}/> Search Engine</h3>
                        <div className="space-y-2 text-slate-700">
                            {Object.keys(SEARCH_ENGINES).map(e => (
                                <label key={e} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="engine" 
                                        checked={engine === e} 
                                        onChange={() => setEngine(e as any)}
                                        className="text-blue-600"
                                    />
                                    <span>{e}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (activeSection === 'downloads') {
        return (
            <div className="h-full bg-slate-50 flex flex-col">
                <div className="bg-slate-200 p-2 border-b border-slate-300 flex items-center justify-between">
                     <button onClick={() => setActiveSection('browser')} className="flex items-center gap-1 text-slate-600 hover:text-slate-900">
                        <ArrowLeft size={16} /> Back to Browser
                    </button>
                    <span className="font-bold text-slate-700">Downloads</span>
                    <div className="w-16"></div>
                </div>
                <div className="p-8 flex items-center justify-center text-slate-400 flex-col gap-4 h-full">
                    <Download size={48} />
                    <span>No recent downloads</span>
                    <span className="text-xs">Files downloaded in WireBox appear in ~/home/user/downloads</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-100">
            {/* Tab Bar */}
            <div className="flex items-center bg-slate-200 p-1 gap-1 overflow-x-auto">
                {tabs.map(tab => (
                    <div 
                        key={tab.id}
                        onClick={() => setActiveTabId(tab.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs max-w-[160px] cursor-default transition group ${activeTabId === tab.id ? 'bg-white shadow-sm text-slate-800' : 'bg-transparent text-slate-600 hover:bg-slate-300'}`}
                    >
                        <Globe size={12} className={tab.loading ? 'animate-spin text-blue-500' : 'text-slate-400'} />
                        <span className="truncate flex-1">{tab.title || 'New Tab'}</span>
                        <button onClick={(e) => closeTab(tab.id, e)} className="opacity-0 group-hover:opacity-100 hover:bg-slate-200 rounded p-0.5"><X size={12}/></button>
                    </div>
                ))}
                <button onClick={addTab} className="p-1 hover:bg-slate-300 rounded"><Plus size={14}/></button>
            </div>

            {/* Address Bar */}
            <div className="bg-white p-2 border-b border-slate-200 flex items-center gap-2 shadow-sm z-10">
                <div className="flex items-center gap-1">
                    <button onClick={handleBack} disabled={activeTab.historyIndex <= 0} className="p-1.5 hover:bg-slate-100 rounded disabled:opacity-30 text-black"><ArrowLeft size={16}/></button>
                    <button onClick={handleForward} disabled={activeTab.historyIndex >= activeTab.history.length - 1} className="p-1.5 hover:bg-slate-100 rounded disabled:opacity-30 text-black"><ArrowRight size={16}/></button>
                    <button id="wb-reload-btn" onClick={handleReload} className="p-1.5 hover:bg-slate-100 rounded text-black"><RotateCcw size={16}/></button>
                </div>
                <div className="flex-1 relative group">
                    <input 
                        className={`w-full border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-full px-4 py-1.5 text-sm outline-none transition text-slate-900 ${activeTab.proxyMode ? 'bg-green-50 text-green-800' : 'bg-slate-100'}`}
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleNavigate(urlInput)}
                        placeholder={`Search ${engine} or type a URL`}
                    />
                    {activeTab.proxyMode && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-green-600 pointer-events-none opacity-50 hidden sm:block">
                            ENHANCED
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={toggleProxy} 
                        className={`p-1.5 rounded transition ${activeTab.proxyMode ? 'bg-green-100 text-green-600 hover:bg-green-200 ring-2 ring-green-500/20' : 'hover:bg-slate-100 text-slate-400'}`} 
                        title={activeTab.proxyMode ? "Enhanced Mode Enabled (Proxying)" : "Enable Enhanced Mode (Fixes blocked sites)"}
                    >
                        {activeTab.proxyMode ? <Shield size={18} fill="currentColor" /> : <Shield size={18} />}
                    </button>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <button onClick={() => setActiveSection('downloads')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Downloads"><Download size={18}/></button>
                    <button onClick={() => setShowSettings(true)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Settings"><Settings size={18}/></button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white relative">
                {activeTab.loading && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-100 z-20">
                        <div className="h-full bg-blue-600 animate-progress"></div>
                    </div>
                )}
                
                {activeTab.url ? (
                     <div className="w-full h-full flex flex-col bg-white relative">
                        {activeTab.proxyMode && activeTab.srcDoc ? (
                            <iframe 
                                srcDoc={activeTab.srcDoc}
                                className="w-full h-full border-none"
                                title="Proxy Browser Content"
                                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                            />
                        ) : (
                            <iframe 
                                src={activeTab.url} 
                                className="w-full h-full border-none"
                                title="Browser Content"
                                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                            />
                        )}
                        
                        {/* Overlay for sites that refuse to connect (Only shown in Direct Mode) */}
                        {!activeTab.proxyMode && (
                            <div className="absolute top-0 left-0 w-full h-10 bg-yellow-50 border-b border-yellow-200 flex items-center justify-between px-4 text-xs text-yellow-800 pointer-events-none opacity-0 hover:opacity-100 transition-opacity delay-1000 duration-500 group-hover:opacity-100 z-10">
                                 <div className="flex items-center gap-2">
                                    <AlertTriangle size={14} />
                                    <span>Site not loading? Try enabling Enhanced Mode (Shield Icon).</span>
                                 </div>
                                 <a 
                                    href={activeTab.url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="pointer-events-auto bg-yellow-200 hover:bg-yellow-300 px-2 py-1 rounded font-bold"
                                 >
                                     Open Externally
                                 </a>
                            </div>
                        )}
                     </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white text-slate-900">
                        <div className="mb-8 font-bold text-4xl text-slate-800 tracking-tight flex flex-col items-center">
                            <Globe size={48} className="text-blue-500 mb-4" />
                            WireBox
                        </div>
                        <div className="w-full max-w-md relative">
                             <input 
                                className="w-full bg-slate-50 border border-slate-200 hover:shadow-md focus:shadow-lg rounded-full px-6 py-3 outline-none transition text-slate-900 placeholder:text-slate-400"
                                placeholder={`Search ${engine} or type a URL`}
                                onChange={(e) => setUrlInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') handleNavigate((e.target as HTMLInputElement).value)
                                }}
                            />
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        </div>
                        <div className="mt-8 text-slate-400 text-xs flex items-center gap-2">
                            <Shield size={12} />
                            <span>Enhanced Mode enabled by default</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};