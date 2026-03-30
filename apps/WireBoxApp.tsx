import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Search, Plus, X, Globe, Settings, Download, Shield, ExternalLink, Home, Menu, Terminal, Video, FileText, Palette } from 'lucide-react';
import { UserProfile, FileSystemNode } from '../types';
import { osConfirm } from '../components/DialogHost';

interface Tab {
    id: string;
    title: string;
    url: string;
    loading: boolean;
    history: string[];
    historyIndex: number;
    proxyMode: boolean;
    srcDoc?: string;
    media?: { type: string, src: string }[];
}

interface DownloadItem {
    id: string;
    fileName: string;
    url: string;
    progress: number;
    status: 'downloading' | 'completed' | 'error';
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
    const [downloads, setDownloads] = useState<DownloadItem[]>([]);
    
    const [menuView, setMenuView] = useState<'main' | 'downloads' | 'extensions' | 'media_grabber' | 'settings' | null>(null);

    const [browserSettings, setBrowserSettings] = useState(() => {
        const saved = localStorage.getItem('wirebox_settings');
        if (saved) return JSON.parse(saved);
        return {
            engine: 'DuckDuckGo',
            extensions: {
                adblocker: false,
                consoler: false,
                customizer: false
            },
            customizerConfig: {
                barColor: '#ffffff',
                homeBgColor: '#f8fafc'
            }
        };
    });

    useEffect(() => {
        localStorage.setItem('wirebox_settings', JSON.stringify(browserSettings));
    }, [browserSettings]);

    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

    useEffect(() => {
        setUrlInput(activeTab.url === 'weberos://home' ? '' : activeTab.url);
    }, [activeTabId, activeTab.url]);

    const updateTab = (id: string, updates: Partial<Tab>) => {
        setTabs(prevTabs => prevTabs.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const updateTabRef = useRef(updateTab);
    useEffect(() => {
        updateTabRef.current = updateTab;
    }, [updateTab]);

    const handleNavigate = async (inputUrl: string, targetTabId: string = activeTabId) => {
        const tab = tabs.find(t => t.id === targetTabId);
        if (!tab || !inputUrl) return;
        
        let finalUrl = inputUrl;
        let displayTitle = inputUrl;

        if (inputUrl === 'weberos://home') {
            updateTab(targetTabId, { url: inputUrl, title: 'Home', loading: false, srcDoc: undefined });
            return;
        }

        if (!inputUrl.startsWith('http') && !inputUrl.startsWith('weberos://') && !inputUrl.includes('.')) {
            finalUrl = SEARCH_ENGINES[browserSettings.engine as keyof typeof SEARCH_ENGINES] + encodeURIComponent(inputUrl);
            displayTitle = `${browserSettings.engine}: ${inputUrl}`;
        } else if (!inputUrl.startsWith('http') && !inputUrl.startsWith('weberos://')) {
            finalUrl = 'https://' + inputUrl;
        }

        const newHistory = [...tab.history.slice(0, tab.historyIndex + 1), finalUrl];
        updateTab(targetTabId, { 
            url: finalUrl,
            loading: true,
            title: displayTitle,
            history: newHistory,
            historyIndex: newHistory.length - 1
        });

        // Simulation of link redirection and file download check
        if (finalUrl.match(/\.(zip|pdf|exe|png|jpg|jpeg|gif|mp4|mp3|wav|ogg|webm|mkv|mov|wbr)$/i)) {
            const confirmDownload = await osConfirm(`This link looks like a file: ${finalUrl.split('/').pop()}\nDo you want to download it to WeberOS?`);
            if (confirmDownload) {
                handleDownload(finalUrl);
                updateTab(targetTabId, { loading: false });
                return;
            }
        }

        if (tab.proxyMode && finalUrl.startsWith('http')) {
             try {
                let content = '';
                try {
                    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(finalUrl)}`);
                    const data = await res.json();
                    if (data.contents) content = data.contents;
                    else throw new Error('No contents');
                } catch (e) {
                    const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(finalUrl)}`);
                    content = await res.text();
                }
                
                if (content) {
                     const baseTag = `<base href="${finalUrl}" target="_self" />`;
                     
                     if (content.match(/<head>/i)) {
                         content = content.replace(/<head>/i, `<head>${baseTag}`);
                     } else {
                         content = `<head>${baseTag}</head>` + content;
                     }
                     
                     // Intercept links for redirection handling
                     const script = `
                        <script>
                            document.addEventListener('click', e => {
                                const a = e.target.closest('a');
                                if(a && a.href) {
                                    e.preventDefault();
                                    window.parent.postMessage({ type: 'WIREBOX_NAV', url: a.href, tabId: '${targetTabId}' }, '*');
                                }
                            });

                            ${browserSettings.extensions.adblocker ? `
                            // Simple Adblocker
                            const blockAds = () => {
                                const adSelectors = ['.ad', '.ads', '.advert', '.advertisement', 'ins.adsbygoogle', '[id^="ad-"]', '[class*="ad-"]', 'iframe[src*="ads"]'];
                                document.querySelectorAll(adSelectors.join(',')).forEach(el => {
                                    if(el) el.remove();
                                });
                            };
                            setInterval(blockAds, 1000);
                            blockAds();
                            ` : ''}

                            ${browserSettings.extensions.consoler ? `
                            // Consoler
                            const consoleDiv = document.createElement('div');
                            consoleDiv.style.cssText = 'position:fixed;bottom:0;left:0;right:0;height:150px;background:#1e1e1e;color:#fff;overflow-y:auto;font-family:monospace;z-index:999999;padding:10px;font-size:12px;opacity:0.9;border-top:2px solid #333;';
                            document.body.appendChild(consoleDiv);
                            const oldLog = console.log;
                            console.log = function(...args) {
                                const msg = document.createElement('div');
                                msg.textContent = '> ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
                                msg.style.borderBottom = '1px solid #333';
                                msg.style.padding = '4px 0';
                                consoleDiv.appendChild(msg);
                                consoleDiv.scrollTop = consoleDiv.scrollHeight;
                                oldLog.apply(console, args);
                            };
                            const oldError = console.error;
                            console.error = function(...args) {
                                const msg = document.createElement('div');
                                msg.textContent = '[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
                                msg.style.borderBottom = '1px solid #333';
                                msg.style.padding = '4px 0';
                                msg.style.color = '#ff5555';
                                consoleDiv.appendChild(msg);
                                consoleDiv.scrollTop = consoleDiv.scrollHeight;
                                oldError.apply(console, args);
                            };
                            window.addEventListener('error', e => console.error(e.message));
                            ` : ''}

                            // Media Grabber
                            const grabMedia = () => {
                                const media = [];
                                document.querySelectorAll('video source, video, audio source, audio, img').forEach(el => {
                                    const src = el.src || el.currentSrc;
                                    if (src && !src.startsWith('data:')) {
                                        const type = el.tagName.toLowerCase() === 'source' ? el.parentElement.tagName.toLowerCase() : el.tagName.toLowerCase();
                                        media.push({ type, src });
                                    }
                                });
                                // Deduplicate
                                const uniqueMedia = [...new Map(media.map(item => [item.src, item])).values()];
                                window.parent.postMessage({ type: 'WIREBOX_MEDIA', media: uniqueMedia, tabId: '${targetTabId}' }, '*');
                            };
                            setTimeout(grabMedia, 1000);
                            setInterval(grabMedia, 5000);
                        </script>
                     `;
                     content += script;
                     updateTab(targetTabId, { loading: false, srcDoc: content });
                }
             } catch (e) {
                 updateTab(targetTabId, { loading: false, srcDoc: `<div style="padding:2rem;text-align:center;font-family:sans-serif;"><h2>Proxy Error</h2><p>Failed to load ${finalUrl}</p><p style="color:red;font-size:12px;">${e}</p></div>` });
             }
        } else {
             setTimeout(() => updateTab(targetTabId, { loading: false, srcDoc: undefined }), 1000);
        }
    };

    const handleNavigateRef = useRef(handleNavigate);
    useEffect(() => {
        handleNavigateRef.current = handleNavigate;
    }, [handleNavigate]);

    // Listen for messages from iframe (redirection handling)
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data.type === 'WIREBOX_NAV') {
                handleNavigateRef.current(e.data.url, e.data.tabId);
            } else if (e.data.type === 'WIREBOX_MEDIA') {
                updateTabRef.current(e.data.tabId, { media: e.data.media });
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleDownload = async (url: string) => {
        let fileName = url.split('/').pop() || 'downloaded_file';
        if (fileName.includes('?')) fileName = fileName.split('?')[0];
        if (url.startsWith('data:')) {
            const mime = url.split(';')[0].split(':')[1];
            const ext = mime ? mime.split('/')[1] : 'bin';
            fileName = `download_${Date.now()}.${ext}`;
        }

        const downloadId = Date.now().toString();
        
        setDownloads(prev => [...prev, { id: downloadId, fileName, url, progress: 0, status: 'downloading' }]);
        setMenuView('downloads');

        try {
            let res: Response;
            try {
                res = await fetch(url);
                if (!res.ok) throw new Error('Direct fetch failed');
            } catch (e) {
                res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
                if (!res.ok) throw new Error('Proxy fetch failed');
            }
            
            const blob = await res.blob();
            const reader = new FileReader();
            
            reader.onloadend = () => {
                const base64data = reader.result as string;
                
                let downloadsDir = user.fs;
                for(const p of ['home', 'user', 'downloads']) {
                    if (!downloadsDir.children) downloadsDir.children = {};
                    if (!downloadsDir.children[p]) {
                        downloadsDir.children[p] = { type: 'dir', children: {} };
                    }
                    downloadsDir = downloadsDir.children[p];
                }
                
                if (downloadsDir.children) {
                    // Ensure unique filename
                    let finalName = fileName;
                    let counter = 1;
                    while (downloadsDir.children[finalName]) {
                        const parts = fileName.split('.');
                        if (parts.length > 1) {
                            const ext = parts.pop();
                            finalName = `${parts.join('.')} (${counter}).${ext}`;
                        } else {
                            finalName = `${fileName} (${counter})`;
                        }
                        counter++;
                    }

                    downloadsDir.children[finalName] = { type: 'file', content: base64data };
                    setUser({ ...user });
                    
                    setDownloads(prev => prev.map(d => d.id === downloadId ? { ...d, progress: 100, status: 'completed', fileName: finalName } : d));
                }
            };
            
            reader.readAsDataURL(blob);
        } catch (error) {
            setDownloads(prev => prev.map(d => d.id === downloadId ? { ...d, status: 'error' } : d));
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

    const barStyle = browserSettings.extensions.customizer ? { backgroundColor: browserSettings.customizerConfig.barColor } : {};
    const homeStyle = browserSettings.extensions.customizer ? { backgroundColor: browserSettings.customizerConfig.homeBgColor } : {};

    return (
        <div className="h-full flex flex-col bg-slate-100 font-sans">
            {/* Tab Bar */}
            <div className="flex items-center p-1 gap-1 overflow-x-auto no-scrollbar border-b border-slate-300" style={barStyle || { backgroundColor: '#e2e8f0' }}>
                {tabs.map(tab => (
                    <div 
                        key={tab.id}
                        onClick={() => setActiveTabId(tab.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs min-w-[120px] max-w-[180px] cursor-pointer transition-all ${activeTabId === tab.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:bg-slate-300/50'}`}
                    >
                        <Globe size={12} className={tab.loading ? 'animate-spin' : ''} />
                        <span className="truncate flex-1">{tab.title}</span>
                        <X size={12} className="hover:bg-slate-200 rounded-full p-0.5" onClick={(e) => closeTab(tab.id, e)} />
                    </div>
                ))}
                <button onClick={addTab} className="p-1.5 hover:bg-slate-300/50 rounded-lg text-slate-600 transition"><Plus size={14} /></button>
            </div>

            {/* Address Bar */}
            <div className="p-2 flex items-center gap-2 border-b border-slate-200 shadow-sm" style={barStyle || { backgroundColor: '#ffffff' }}>
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
                        className="w-full bg-slate-100/80 border-none rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleNavigate(urlInput)}
                        placeholder="Search or enter address"
                    />
                </div>

                <div className="flex items-center gap-1 relative">
                    <button onClick={() => updateTab(activeTabId, { proxyMode: !activeTab.proxyMode })} className={`p-2 rounded-xl transition ${activeTab.proxyMode ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`} title="Enhanced Mode (Proxy)">
                        <Shield size={18} />
                    </button>
                    <button onClick={() => setMenuView(menuView ? null : 'main')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition relative">
                        <Menu size={18}/>
                        {downloads.filter(d => d.status === 'downloading').length > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                    </button>
                    
                    {/* Menu Dropdown */}
                    {menuView && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[32rem]">
                            {menuView === 'main' && (
                                <div className="p-2 flex flex-col gap-1">
                                    <button onClick={() => setMenuView('downloads')} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg text-left text-sm font-medium text-slate-700">
                                        <Download size={18} className="text-slate-400" />
                                        <span className="flex-1">Downloads</span>
                                        {downloads.filter(d => d.status === 'downloading').length > 0 && (
                                            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">{downloads.filter(d => d.status === 'downloading').length}</span>
                                        )}
                                    </button>
                                    <button onClick={() => setMenuView('extensions')} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg text-left text-sm font-medium text-slate-700">
                                        <Terminal size={18} className="text-slate-400" />
                                        Extensions
                                    </button>
                                    <button onClick={() => setMenuView('media_grabber')} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg text-left text-sm font-medium text-slate-700">
                                        <Video size={18} className="text-slate-400" />
                                        <span className="flex-1">Media Grabber</span>
                                        {activeTab.media && activeTab.media.length > 0 && (
                                            <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">{activeTab.media.length}</span>
                                        )}
                                    </button>
                                    <div className="h-px bg-slate-100 my-1"></div>
                                    <button onClick={() => setMenuView('settings')} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg text-left text-sm font-medium text-slate-700">
                                        <Settings size={18} className="text-slate-400" />
                                        Settings
                                    </button>
                                </div>
                            )}

                            {menuView === 'downloads' && (
                                <div className="flex flex-col max-h-[32rem]">
                                    <div className="p-3 border-b border-slate-100 font-bold text-slate-800 flex items-center gap-2 shrink-0">
                                        <button onClick={() => setMenuView('main')} className="p-1 hover:bg-slate-100 rounded-lg"><ArrowLeft size={16}/></button>
                                        <span className="flex-1">Downloads</span>
                                        {downloads.length > 0 && <button onClick={() => setDownloads([])} className="text-xs text-blue-600 hover:underline">Clear</button>}
                                    </div>
                                    <div className="overflow-y-auto p-2 flex-1 min-h-0">
                                        {downloads.length === 0 ? (
                                            <div className="text-center text-slate-500 py-8 text-sm">No downloads yet</div>
                                        ) : (
                                            downloads.map(d => (
                                                <div key={d.id} className="p-2 hover:bg-slate-50 rounded-lg mb-1 flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${d.status === 'completed' ? 'bg-green-100 text-green-600' : d.status === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        <Download size={16} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-slate-800 truncate">{d.fileName}</div>
                                                        <div className="text-xs text-slate-500">
                                                            {d.status === 'downloading' ? 'Downloading...' : d.status === 'completed' ? 'Completed' : 'Failed'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {menuView === 'extensions' && (
                                <div className="flex flex-col max-h-[32rem]">
                                    <div className="p-3 border-b border-slate-100 font-bold text-slate-800 flex items-center gap-2 shrink-0">
                                        <button onClick={() => setMenuView('main')} className="p-1 hover:bg-slate-100 rounded-lg"><ArrowLeft size={16}/></button>
                                        <span className="flex-1">Extensions</span>
                                    </div>
                                    <div className="overflow-y-auto p-4 flex-1 flex flex-col gap-4 min-h-0">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-slate-800">Simple Adblocker</div>
                                                <div className="text-xs text-slate-500">Block ads from any site</div>
                                            </div>
                                            <button 
                                                onClick={() => setBrowserSettings(s => ({ ...s, extensions: { ...s.extensions, adblocker: !s.extensions.adblocker } }))}
                                                className={`w-10 h-6 rounded-full transition-colors relative ${browserSettings.extensions.adblocker ? 'bg-blue-500' : 'bg-slate-300'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${browserSettings.extensions.adblocker ? 'left-5' : 'left-1'}`}></div>
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-slate-800">Consoler</div>
                                                <div className="text-xs text-slate-500">Mini console for any site</div>
                                            </div>
                                            <button 
                                                onClick={() => setBrowserSettings(s => ({ ...s, extensions: { ...s.extensions, consoler: !s.extensions.consoler } }))}
                                                className={`w-10 h-6 rounded-full transition-colors relative ${browserSettings.extensions.consoler ? 'bg-blue-500' : 'bg-slate-300'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${browserSettings.extensions.consoler ? 'left-5' : 'left-1'}`}></div>
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-slate-800">The Customizer</div>
                                                <div className="text-xs text-slate-500">Customize browser colors</div>
                                            </div>
                                            <button 
                                                onClick={() => setBrowserSettings(s => ({ ...s, extensions: { ...s.extensions, customizer: !s.extensions.customizer } }))}
                                                className={`w-10 h-6 rounded-full transition-colors relative ${browserSettings.extensions.customizer ? 'bg-blue-500' : 'bg-slate-300'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${browserSettings.extensions.customizer ? 'left-5' : 'left-1'}`}></div>
                                            </button>
                                        </div>
                                        
                                        {browserSettings.extensions.customizer && (
                                            <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-3">
                                                <div>
                                                    <label className="text-xs font-medium text-slate-700 block mb-1">Browser Bar Color</label>
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="color" 
                                                            value={browserSettings.customizerConfig.barColor}
                                                            onChange={e => setBrowserSettings(s => ({ ...s, customizerConfig: { ...s.customizerConfig, barColor: e.target.value } }))}
                                                            className="w-8 h-8 rounded cursor-pointer"
                                                        />
                                                        <span className="text-xs text-slate-500">{browserSettings.customizerConfig.barColor}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-slate-700 block mb-1">Home Background Color</label>
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="color" 
                                                            value={browserSettings.customizerConfig.homeBgColor}
                                                            onChange={e => setBrowserSettings(s => ({ ...s, customizerConfig: { ...s.customizerConfig, homeBgColor: e.target.value } }))}
                                                            className="w-8 h-8 rounded cursor-pointer"
                                                        />
                                                        <span className="text-xs text-slate-500">{browserSettings.customizerConfig.homeBgColor}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {menuView === 'media_grabber' && (
                                <div className="flex flex-col max-h-[32rem]">
                                    <div className="p-3 border-b border-slate-100 font-bold text-slate-800 flex items-center gap-2 shrink-0">
                                        <button onClick={() => setMenuView('main')} className="p-1 hover:bg-slate-100 rounded-lg"><ArrowLeft size={16}/></button>
                                        <span className="flex-1">Media Grabber</span>
                                    </div>
                                    <div className="overflow-y-auto p-2 flex-1 min-h-0">
                                        {!activeTab.media || activeTab.media.length === 0 ? (
                                            <div className="text-center text-slate-500 py-8 text-sm">No media found on this page</div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                {activeTab.media.map((m, i) => (
                                                    <div key={i} className="border border-slate-200 rounded-lg overflow-hidden group relative bg-slate-50">
                                                        {m.type === 'img' ? (
                                                            <img src={m.src} className="w-full h-24 object-cover" />
                                                        ) : m.type === 'video' ? (
                                                            <div className="w-full h-24 bg-slate-800 flex items-center justify-center text-white">
                                                                <Video size={24} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-24 bg-slate-200 flex items-center justify-center text-slate-500">
                                                                <FileText size={24} />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                                            <button onClick={() => handleDownload(m.src)} className="p-2 bg-white text-blue-600 rounded-full hover:scale-110 transition" title="Download">
                                                                <Download size={16} />
                                                            </button>
                                                            <button onClick={() => window.open(m.src, '_blank')} className="p-2 bg-white text-slate-600 rounded-full hover:scale-110 transition" title="Open in new tab">
                                                                <ExternalLink size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-white text-[10px] truncate">
                                                            {m.type.toUpperCase()}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {menuView === 'settings' && (
                                <div className="flex flex-col max-h-[32rem]">
                                    <div className="p-3 border-b border-slate-100 font-bold text-slate-800 flex items-center gap-2 shrink-0">
                                        <button onClick={() => setMenuView('main')} className="p-1 hover:bg-slate-100 rounded-lg"><ArrowLeft size={16}/></button>
                                        <span className="flex-1">Settings</span>
                                    </div>
                                    <div className="overflow-y-auto p-4 flex-1 min-h-0">
                                        <div className="mb-4">
                                            <label className="text-sm font-medium text-slate-700 block mb-2">Default Search Engine</label>
                                            <select 
                                                value={browserSettings.engine}
                                                onChange={e => setBrowserSettings(s => ({ ...s, engine: e.target.value as any }))}
                                                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-sm outline-none focus:border-blue-500"
                                            >
                                                <option value="DuckDuckGo">DuckDuckGo</option>
                                                <option value="Google">Google</option>
                                                <option value="Bing">Bing</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Browser Area */}
            <div className="flex-1 bg-white overflow-hidden relative">
                {activeTab.url === 'weberos://home' ? (
                    <div className="h-full flex flex-col items-center justify-center p-8" style={homeStyle || { background: 'linear-gradient(to bottom, #f8fafc, #ffffff)' }}>
                        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl mb-8 rotate-3">
                            <Globe size={48} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mb-8">WireBox</h1>
                        <div className="w-full max-w-xl relative mb-12">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-lg shadow-xl shadow-slate-200/50 outline-none focus:border-blue-500 transition"
                                placeholder={`Search with ${browserSettings.engine}...`}
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
