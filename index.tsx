import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import * as LucideIcons from 'lucide-react';
import { 
    Terminal as TerminalIcon, 
    Code, 
    Gamepad2, 
    Calculator, 
    CloudSun, 
    User, 
    Download, 
    HelpCircle, 
    Image as ImageIcon, 
    Music, 
    Folder, 
    Upload, 
    Package, 
    Globe, 
    Ghost, 
    Monitor, 
    LayoutGrid, 
    LogOut, 
    ArrowLeft as ArrowBack, 
    UserPlus, 
    Search, 
    Wifi, 
    Battery, 
    VolumeX, 
    Volume1, 
    Volume2,
    Film
} from 'lucide-react';

import { UserProfile, WindowState, FileSystemNode } from './types';
import { DEFAULT_FS, WALLPAPERS, DEFAULT_APPS, REPO_PACKAGES, FILE_ASSOCIATIONS } from './utils/constants';
import { WindowFrame } from './components/WindowFrame';
import { VolumePopup } from './components/VolumePopup';
import { OpenWithDialog } from './components/OpenWithDialog';

import { TerminalApp } from './apps/TerminalApp';
import { ExplorerApp } from './apps/ExplorerApp';
import { CoderApp } from './apps/CoderApp';
import { SettingsApp } from './apps/SettingsApp';
import { MarketApp } from './apps/MarketApp';
import { HelperApp } from './apps/HelperApp';
import { WePicApp } from './apps/WePicApp';
import { WePlayerApp } from './apps/WePlayerApp';
import { SnakeApp, CalcoApp, WeatherApp, DynamicAppRuntime } from './apps/MiscApps';

// Registry
const SYSTEM_REGISTRY: Record<string, { name: string, icon: any, color: string }> = {
  'explorer': { name: 'Files', icon: Folder, color: 'bg-yellow-500' },
  'terminal': { name: 'Terminal', icon: TerminalIcon, color: 'bg-gray-900' },
  'coder': { name: 'Coder', icon: Code, color: 'bg-blue-600' },
  'snake': { name: 'Snake', icon: Gamepad2, color: 'bg-green-600' },
  'calco': { name: 'Calco', icon: Calculator, color: 'bg-orange-500' },
  'weather': { name: 'Weather', icon: CloudSun, color: 'bg-sky-500' },
  'settings': { name: 'Settings', icon: User, color: 'bg-slate-600' },
  'market': { name: 'Market', icon: Download, color: 'bg-blue-600' },
  'helper': { name: 'Helper', icon: HelpCircle, color: 'bg-purple-500' },
  'wepic': { name: 'WePic', icon: ImageIcon, color: 'bg-pink-500' },
  'weplayer': { name: 'WePlayer', icon: Film, color: 'bg-rose-600' },
};

const WeberOS = () => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [createMode, setCreateMode] = useState(false);
  
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWinId, setActiveWinId] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  // Volume Controller
  const [volume, setVolume] = useState(70);
  const [showVolumePopup, setShowVolumePopup] = useState(false);

  // File Picking State
  const [openWithRequest, setOpenWithRequest] = useState<{file: string, apps: any[]} | null>(null);

  // Desktop Drag State
  const [draggingIcon, setDraggingIcon] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Load Users
  useEffect(() => {
      const db = JSON.parse(localStorage.getItem('weberos_users') || '{}');
      setUsersList(Object.values(db));
  }, [user]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const setUser = (newUser: UserProfile | null) => {
      setUserState(newUser);
      if (newUser) {
          const db = JSON.parse(localStorage.getItem('weberos_users') || '{}');
          db[newUser.username] = { ...db[newUser.username], ...newUser };
          localStorage.setItem('weberos_users', JSON.stringify(db));
      }
  };

  const deleteUser = (usernameToDelete: string) => {
      const db = JSON.parse(localStorage.getItem('weberos_users') || '{}');
      delete db[usernameToDelete];
      localStorage.setItem('weberos_users', JSON.stringify(db));
      setUsersList(Object.values(db));
      
      if (user && user.username === usernameToDelete) {
          handleLogout();
      }
  };

  const fs = user?.fs || DEFAULT_FS;
  const setFs = (newFs: FileSystemNode) => {
      if (user) setUser({ ...user, fs: newFs });
  }

  const handleLogin = () => {
    if (!selectedProfile) return;
    const db = JSON.parse(localStorage.getItem('weberos_users') || '{}');
    const storedUser = db[selectedProfile.username];

    if (storedUser && (storedUser.password === passwordInput || !storedUser.password)) {
        const safeUser: UserProfile = {
            username: storedUser.username,
            installedPackages: storedUser.installedPackages || [],
            customApps: storedUser.customApps || {},
            fs: storedUser.fs || DEFAULT_FS,
            settings: { 
                wallpaper: storedUser.settings?.wallpaper || WALLPAPERS[0], 
                darkMode: true,
                desktopIcons: storedUser.settings?.desktopIcons || {},
                weather: storedUser.settings?.weather || { mode: 'auto' }
            }
        };
        setUser(safeUser);
        setSelectedProfile(null);
        setPasswordInput('');
    } else {
        alert('Invalid password');
    }
  };

  const handleCreateProfile = () => {
      if (!usernameInput) return;
      const db = JSON.parse(localStorage.getItem('weberos_users') || '{}');
      if (db[usernameInput]) {
          alert('User already exists');
          return;
      }
      
      const newUser: UserProfile & {password: string} = { 
          username: usernameInput, 
          password: passwordInput, 
          installedPackages: [], 
          customApps: {}, 
          fs: DEFAULT_FS,
          settings: { 
              wallpaper: WALLPAPERS[0], 
              darkMode: true,
              desktopIcons: {},
              weather: { mode: 'auto' }
          }
      };
      
      db[usernameInput] = newUser;
      localStorage.setItem('weberos_users', JSON.stringify(db));
      
      setUsersList(Object.values(db));
      setCreateMode(false);
      setUsernameInput('');
      setPasswordInput('');
  };

  const handleLogout = () => {
      setUserState(null);
      setWindows([]);
      setStartOpen(false);
      setSelectedProfile(null);
      setPasswordInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      const isImage = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');
      const isVideo = file.type.startsWith('video/');
      
      reader.onload = (ev) => {
          const content = ev.target?.result as string;
          let uploadDir = fs;
          for(const p of ['home', 'user']) {
              if (uploadDir.children) uploadDir = uploadDir.children[p];
          }
          
          if (!uploadDir.children['uploads']) {
              uploadDir.children['uploads'] = { type: 'dir', children: {} };
          }
          
          const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          // @ts-ignore
          uploadDir.children['uploads'].children[safeName] = {
              type: 'file',
              content: content
          };
          setFs({ ...fs });
          alert(`File uploaded to ~/uploads/${safeName}`);
      };

      if (isImage || isAudio || isVideo) {
          reader.readAsDataURL(file);
      } else {
          reader.readAsText(file);
      }
  };

  const availableApps = [
      ...DEFAULT_APPS.map(id => ({ id, ...SYSTEM_REGISTRY[id] })),
      { id: 'upload_files', name: 'Add files', icon: Upload, color: 'bg-emerald-600' },
      ...(user ? user.installedPackages
         .filter(id => !SYSTEM_REGISTRY[id])
         .map(id => {
             if (user.customApps[id]) {
                 return { 
                     id, 
                     name: user.customApps[id].name, 
                     // @ts-ignore
                     icon: LucideIcons[user.customApps[id].iconName] || Package,
                     color: 'bg-indigo-600'
                 };
             }
             const repoPkg = REPO_PACKAGES.find(p => p.name === id);
             if (repoPkg) {
                 let icon = Package;
                 let color = 'bg-gray-500';
                 if (id === 'browser') { icon = Globe; color = 'bg-indigo-500'; }
                 if (id === 'music') { icon = Music; color = 'bg-pink-500'; }
                 if (id === 'doom') { icon = Ghost; color = 'bg-red-800'; }
                 if (id === 'matrix') { icon = Monitor; color = 'bg-green-900'; }
                 return { id, name: repoPkg.name, icon, color };
             }
             return { id, name: id, icon: Package, color: 'bg-slate-500' };
         }) : [])
  ];

  // SORT ALPHABETICALLY for Start Menu
  const sortedApps = [...availableApps].sort((a, b) => a.name.localeCompare(b.name));

  const openApp = (appId: string, data?: any) => {
    if (appId === 'upload_files') {
        document.getElementById('hidden-file-input')?.click();
        return;
    }

    const systemApp = SYSTEM_REGISTRY[appId];
    const customApp = user?.customApps[appId];
    const repoApp = REPO_PACKAGES.find(p => p.name === appId); 
    
    let title = appId;
    if (systemApp) title = systemApp.name;
    else if (customApp) title = customApp.name;
    else if (repoApp) title = repoApp.name;

    setStartOpen(false);

    const isMobile = window.innerWidth < 640;
    const defaultWidth = isMobile ? window.innerWidth - 32 : 800;
    const defaultHeight = isMobile ? 400 : 500;
    const defaultX = isMobile ? 16 : 80 + (windows.length * 30);
    const defaultY = isMobile ? 80 + (windows.length * 30) : 50 + (windows.length * 30);

    const id = Date.now().toString();
    const newWindow: WindowState = {
        id,
        appId,
        title: title,
        isMinimized: false,
        isMaximized: false,
        zIndex: windows.length + 1,
        position: { x: defaultX, y: defaultY },
        size: { w: defaultWidth, h: defaultHeight },
        data: data
    };
    setWindows([...windows, newWindow]);
    setActiveWinId(id);
  };

  const closeWindow = (id: string) => setWindows(windows.filter(w => w.id !== id));

  const focusWindow = (id: string) => {
      setActiveWinId(id);
      setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: 100 } : { ...w, zIndex: w.zIndex < 100 ? w.zIndex : w.zIndex - 1 }).sort((a,b) => a.zIndex - b.zIndex).map((w, i) => ({...w, zIndex: i + 1})));
  };

  const toggleMaximize = (id: string) => setWindows(windows.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  const toggleMinimize = (id: string) => setWindows(windows.map(w => w.id === id ? { ...w, isMinimized: !w.isMinimized } : w));
  const moveWindow = (id: string, x: number, y: number) => {
      const safeX = Math.max(-50, Math.min(window.innerWidth - 50, x));
      const safeY = Math.max(0, Math.min(window.innerHeight - 50, y));
      setWindows(prev => prev.map(w => w.id === id ? { ...w, position: { x: safeX, y: safeY } } : w));
  };
  const resizeWindow = (id: string, w: number, h: number) => setWindows(prev => prev.map(win => win.id === id ? { ...win, size: { w, h } } : win));

  const launchFile = (fullPath: string) => {
      const ext = fullPath.split('.').pop()?.toLowerCase();
      if(!ext) {
          openApp('coder', { file: fullPath });
          return;
      }
      
      const appIds = FILE_ASSOCIATIONS[ext];
      if(!appIds || appIds.length === 0) {
          openApp('coder', { file: fullPath });
      } else if (appIds.length === 1) {
          openApp(appIds[0], { file: fullPath });
      } else {
          const validApps = appIds.map(id => availableApps.find(a => a.id === id)).filter(Boolean);
          setOpenWithRequest({ file: fullPath, apps: validApps });
      }
  };

  const openFilePicker = (onPick: (path: string) => void) => {
      openApp('explorer', { mode: 'picker', onPickCallback: onPick });
  };

  const handleIconDragStart = (e: React.MouseEvent | React.TouchEvent, appId: string, currentX: number, currentY: number) => {
      e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      setDraggingIcon(appId);
      setDragOffset({ x: clientX - currentX, y: clientY - currentY });
  };

  useEffect(() => {
      if (draggingIcon && user) {
          const handleMove = (e: MouseEvent | TouchEvent) => {
              const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
              const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
              const newX = clientX - dragOffset.x;
              const newY = clientY - dragOffset.y;
              
              setUser({
                  ...user,
                  settings: {
                      ...user.settings,
                      desktopIcons: {
                          ...user.settings.desktopIcons,
                          [draggingIcon]: { x: newX, y: newY }
                      }
                  }
              });
          };
          const handleUp = () => setDraggingIcon(null);

          window.addEventListener('mousemove', handleMove);
          window.addEventListener('mouseup', handleUp);
          window.addEventListener('touchmove', handleMove, { passive: false });
          window.addEventListener('touchend', handleUp);

          return () => {
              window.removeEventListener('mousemove', handleMove);
              window.removeEventListener('mouseup', handleUp);
              window.removeEventListener('touchmove', handleMove);
              window.removeEventListener('touchend', handleUp);
          };
      }
  }, [draggingIcon, dragOffset, user]);


  if (!user) {
      return (
          <div className="h-screen w-screen bg-slate-900 flex items-center justify-center font-sans text-white">
              <div className="bg-slate-800/50 p-8 rounded-2xl shadow-2xl backdrop-blur-xl border border-slate-700 w-full max-w-md mx-4 animate-in fade-in zoom-in duration-300">
                      <div className="flex flex-col items-center mb-8">
                          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg mb-4 overflow-hidden">
                              <img src="/logo.png" alt="WeberOS Logo" className="w-full h-full object-contain p-2" />
                          </div>
                          <h1 className="text-2xl font-bold text-center">WeberOS v1.3</h1>
                      </div>

                  {!createMode && !selectedProfile && (
                      <div className="grid grid-cols-2 gap-4 mb-6 max-h-60 overflow-y-auto p-1">
                           {usersList.map(u => (
                               <button 
                                   key={u.username}
                                   onClick={() => setSelectedProfile(u)}
                                   className="flex flex-col items-center p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition group border border-slate-700 hover:border-blue-500"
                               >
                                   <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center text-lg font-bold mb-2 group-hover:scale-110 transition">
                                       {u.username.substring(0,2).toUpperCase()}
                                   </div>
                                   <span className="text-sm font-medium truncate w-full text-center">{u.username}</span>
                               </button>
                           ))}
                           <button 
                               onClick={() => setCreateMode(true)}
                               className="flex flex-col items-center p-4 bg-slate-800/50 hover:bg-slate-700 rounded-xl transition border border-dashed border-slate-600 hover:border-slate-400 group"
                           >
                               <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2 text-slate-400 group-hover:text-white">
                                   <UserPlus size={24} />
                               </div>
                               <span className="text-sm text-slate-400 group-hover:text-white">Add Profile</span>
                           </button>
                      </div>
                  )}

                  {selectedProfile && (
                      <div className="animate-in slide-in-from-right-4 duration-200">
                          <div className="flex items-center gap-4 mb-6">
                              <button onClick={() => { setSelectedProfile(null); setPasswordInput(''); }} className="p-2 hover:bg-white/10 rounded-full transition"><ArrowBack size={20}/></button>
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                                      {selectedProfile.username.substring(0,2).toUpperCase()}
                                  </div>
                                  <span className="text-xl font-bold">{selectedProfile.username}</span>
                              </div>
                          </div>
                          <div className="space-y-4">
                              <input 
                                  type="password"
                                  placeholder="Password (if set)"
                                  value={passwordInput}
                                  onChange={e => setPasswordInput(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                  className="w-full bg-slate-900 border border-slate-600 rounded p-3 focus:border-blue-500 outline-none transition"
                                  autoFocus
                              />
                              <button 
                                  onClick={handleLogin}
                                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-blue-900/20"
                              >
                                  Login
                              </button>
                          </div>
                      </div>
                  )}

                  {createMode && (
                      <div className="animate-in slide-in-from-right-4 duration-200">
                          <div className="flex items-center gap-2 mb-6">
                              <button onClick={() => { setCreateMode(false); setUsernameInput(''); setPasswordInput(''); }} className="p-2 hover:bg-white/10 rounded-full transition"><ArrowBack size={20}/></button>
                              <h2 className="text-xl font-bold">Create Profile</h2>
                          </div>
                          <div className="space-y-4">
                              <input 
                                  placeholder="Username"
                                  value={usernameInput}
                                  onChange={e => setUsernameInput(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-600 rounded p-3 focus:border-blue-500 outline-none transition"
                              />
                              <input 
                                  type="password"
                                  placeholder="Password (optional)"
                                  value={passwordInput}
                                  onChange={e => setPasswordInput(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-600 rounded p-3 focus:border-blue-500 outline-none transition"
                              />
                              <button 
                                  onClick={handleCreateProfile}
                                  disabled={!usernameInput}
                                  className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition shadow-lg shadow-green-900/20"
                              >
                                  Create User
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative font-sans select-none"
        style={{
            backgroundImage: `url("${user.settings.wallpaper}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'background-image 0.5s ease-in-out'
        }}
        onClick={() => { setShowVolumePopup(false); }}
    >
        {/* Hidden File Input for Uploads */}
        <input type="file" id="hidden-file-input" onChange={handleFileUpload} className="hidden" />

        {/* Open With Modal */}
        {openWithRequest && (
            <OpenWithDialog 
                apps={openWithRequest.apps} 
                onSelect={(appId: string) => {
                    openApp(appId, { file: openWithRequest.file });
                    setOpenWithRequest(null);
                }}
                onClose={() => setOpenWithRequest(null)}
            />
        )}

        {/* Desktop Icons */}
        {availableApps.filter(app => app.id !== 'settings' && app.id !== 'helper' && app.id !== 'wepic' && app.id !== 'weplayer').map((app, index) => {
            const pos = user.settings.desktopIcons[app.id] || { x: 16, y: 16 + (index * 96) };
            
            return (
                <div 
                    key={app.id} 
                    style={{ position: 'absolute', left: pos.x, top: pos.y, cursor: 'grab' }}
                    onMouseDown={(e) => handleIconDragStart(e, app.id, pos.x, pos.y)}
                    onTouchStart={(e) => handleIconDragStart(e, app.id, pos.x, pos.y)}
                    onDoubleClick={() => openApp(app.id)}
                    className="group flex flex-col items-center gap-1 w-20 text-white p-2 rounded transition hover:bg-white/10 active:cursor-grabbing"
                >
                    <div className={`w-12 h-12 ${app.color} rounded-xl shadow-lg flex items-center justify-center group-hover:scale-105 transition pointer-events-none`}>
                        <app.icon size={24} />
                    </div>
                    <span className="text-xs font-medium drop-shadow-md bg-black/20 px-2 rounded-full truncate w-full text-center pointer-events-none">{app.name}</span>
                </div>
            );
        })}

        {/* Windows */}
        {windows.map(win => {
            let AppContent;
            if (win.appId === 'terminal') AppContent = <TerminalApp fs={fs} setFs={setFs} user={user} setUser={setUser} />;
            else if (win.appId === 'coder') AppContent = <CoderApp fs={fs} setFs={setFs} launchData={win.data} />;
            else if (win.appId === 'explorer') AppContent = <ExplorerApp 
                fs={fs} 
                setFs={setFs} 
                user={user} 
                mode={win.data?.mode} 
                onPick={(path: string) => { 
                    if(win.data?.onPickCallback) win.data.onPickCallback(path); 
                    closeWindow(win.id);
                }} 
                onOpen={launchFile}
            />;
            else if (win.appId === 'snake') AppContent = <SnakeApp />;
            else if (win.appId === 'calco') AppContent = <CalcoApp />;
            else if (win.appId === 'weather') AppContent = <WeatherApp user={user} setUser={setUser} />;
            else if (win.appId === 'settings') AppContent = <SettingsApp user={user} setUser={setUser} onDeleteUser={deleteUser} />;
            else if (win.appId === 'market') AppContent = <MarketApp user={user} setUser={setUser} />;
            else if (win.appId === 'helper') AppContent = <HelperApp />;
            else if (win.appId === 'wepic') AppContent = <WePicApp fs={fs} launchData={win.data} openFilePicker={openFilePicker} />;
            else if (win.appId === 'weplayer') AppContent = <WePlayerApp fs={fs} launchData={win.data} openFilePicker={openFilePicker} volume={volume} />;
            
            else if (user.customApps[win.appId]) {
                AppContent = <DynamicAppRuntime code={user.customApps[win.appId].code} />;
            }
            
            else if (win.appId === 'browser') AppContent = <div className="h-full bg-white flex items-center justify-center text-slate-500">Browser Placeholder</div>;
            else if (win.appId === 'music') AppContent = <div className="h-full bg-gray-900 flex items-center justify-center text-pink-500">Music Player Placeholder</div>;
            else if (win.appId === 'doom') AppContent = <div className="h-full bg-black flex items-center justify-center text-red-600 font-bold font-mono text-2xl">DOOM IS RUNNING...</div>;
            else if (win.appId === 'matrix') AppContent = <div className="h-full bg-black flex items-center justify-center text-green-500 font-mono">Wake up, Neo...</div>;
            else AppContent = <div className="h-full flex items-center justify-center">Unknown App</div>;

            const icon = availableApps.find(a => a.id === win.appId)?.icon || Package;

            return (
                <WindowFrame 
                    key={win.id} 
                    win={win} 
                    isActive={activeWinId === win.id}
                    onClose={() => closeWindow(win.id)}
                    onMinimize={() => toggleMinimize(win.id)}
                    onMaximize={() => toggleMaximize(win.id)}
                    onFocus={() => focusWindow(win.id)}
                    onMove={(x: number, y: number) => moveWindow(win.id, x, y)}
                    onResize={(w: number, h: number) => resizeWindow(win.id, w, h)}
                    icon={icon} // Pass icon to WindowFrame for title bar
                >
                    {React.cloneElement(AppContent, { icon })}
                </WindowFrame>
            );
        })}

        {/* Start Menu */}
        {startOpen && (
            <div className="fixed bottom-[84px] left-4 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-[100] animate-in slide-in-from-bottom-5 fade-in duration-200">
                <div className="p-4 bg-slate-800/50 border-b border-slate-700 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.username.substring(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-white text-sm">{user.username}</div>
                    </div>
                    <button onClick={handleLogout} className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition"><LogOut size={16}/></button>
                </div>
                <div className="p-2 grid grid-cols-1 gap-1 max-h-80 overflow-y-auto">
                    {sortedApps.map(app => (
                        <button key={app.id} onClick={() => openApp(app.id)} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded text-left text-slate-200 transition">
                            <div className={`p-1.5 rounded ${app.color}`}>
                                <app.icon size={16} className="text-white"/>
                            </div>
                            <span className="text-sm">{app.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Volume Popup */}
        {showVolumePopup && (
            <VolumePopup volume={volume} setVolume={setVolume} />
        )}

        {/* Taskbar */}
        <div className="fixed bottom-2 left-2 right-2 h-16 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center px-4 md:px-6 justify-between z-[100] shadow-2xl">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setStartOpen(!startOpen)}
                    className={`p-2 rounded transition ${startOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
                >
                    <LayoutGrid size={20} className="text-white" />
                </button>
                
                <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1.5 gap-2 w-48 hover:bg-white/10 transition cursor-text">
                    <Search size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-400">Type here to search</span>
                </div>

                <div className="h-6 w-px bg-white/10 mx-2"></div>

                <div className="flex items-center gap-1 overflow-x-auto max-w-[30vw] md:max-w-[50vw]">
                    {windows.map(win => {
                        const app = availableApps.find(a => a.id === win.appId);
                        const AppIcon = app ? app.icon : Package;
                        
                        return (
                            <button 
                                key={win.id}
                                onClick={() => win.isMinimized ? toggleMinimize(win.id) : focusWindow(win.id)}
                                className={`p-2 rounded transition relative group shrink-0 ${activeWinId === win.id && !win.isMinimized ? 'bg-white/10' : 'hover:bg-white/5'}`}
                            >
                                <AppIcon size={20} className={activeWinId === win.id ? 'text-blue-400' : 'text-slate-400'} />
                                {activeWinId === win.id && !win.isMinimized && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full"></div>}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 text-white text-xs">
                <div className="flex items-center gap-2 md:gap-4">
                    <Wifi size={16} className="hidden sm:block" />
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowVolumePopup(!showVolumePopup); }}
                        className="p-1 hover:bg-white/10 rounded transition"
                    >
                         {volume === 0 ? <VolumeX size={16} /> : volume < 50 ? <Volume1 size={16} /> : <Volume2 size={16} />}
                    </button>
                    <Battery size={16} className="hidden sm:block" />
                </div>
                <div className="flex flex-col items-end min-w-fit">
                    <span className="font-medium">{time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className="text-slate-400 text-[10px] hidden xs:block">{time.toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<WeberOS />);