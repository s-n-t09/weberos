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
    LayoutGrid, 
    LogOut, 
    Search, 
    Volume2,
    Film,
    Bell,
    ChevronRight,
    ArrowLeft,
    Plus,
    Lock,
    Key,
    Shield
} from 'lucide-react';

import { UserProfile, WindowState, FileSystemNode, SystemNotification } from './types';
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
import { WireBoxApp } from './apps/WireBoxApp';
import { SnakeApp, CalcoApp, WeatherApp, DynamicAppRuntime } from './apps/MiscApps';

// Registry
const SYSTEM_REGISTRY: Record<string, { name: string, icon: any, color: string }> = {
  'explorer': { name: 'Files', icon: Folder, color: 'bg-yellow-500' },
  'terminal': { name: 'Terminal', icon: TerminalIcon, color: 'bg-gray-900' },
  'wirebox': { name: 'WireBox', icon: Globe, color: 'bg-blue-400' },
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
  const [booting, setBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootStatus, setBootStatus] = useState('Initializing WeberOS 1.5...');

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

  const [volume, setVolume] = useState(70);
  const [showVolumePopup, setShowVolumePopup] = useState(false);

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const [openWithRequest, setOpenWithRequest] = useState<{file: string, apps: any[]} | null>(null);

  // Boot Animation Logic
  useEffect(() => {
    const steps = [
        { p: 10, s: 'Loading Kernel...' },
        { p: 30, s: 'Mounting Virtual Filesystem...' },
        { p: 50, s: 'Loading System Registries...' },
        { p: 70, s: 'Starting Window Manager...' },
        { p: 90, s: 'Preparing User Interface...' },
        { p: 100, s: 'Ready.' }
    ];
    
    let currentStep = 0;
    const interval = setInterval(() => {
        if (currentStep < steps.length) {
            setBootProgress(steps[currentStep].p);
            setBootStatus(steps[currentStep].s);
            currentStep++;
        } else {
            clearInterval(interval);
            setTimeout(() => setBooting(false), 800);
        }
    }, 600);
    
    return () => clearInterval(interval);
  }, []);

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
                weather: storedUser.settings?.weather || { mode: 'auto' },
                notifications: storedUser.settings?.notifications || { enabled: true, sound: true, external: true },
                defaultApps: storedUser.settings?.defaultApps || {}
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
              weather: { mode: 'auto' },
              notifications: { enabled: true, sound: true, external: true },
              defaultApps: {}
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
      setNotifications([]);
  };

  const sendNotification = (appId: string, title: string, message: string) => {
      if (!user?.settings.notifications.enabled) return;

      const newNotif: SystemNotification = {
          id: Date.now().toString(),
          app: appId,
          title,
          message,
          timestamp: Date.now(),
          read: false
      };
      setNotifications(prev => [newNotif, ...prev]);

      if (user.settings.notifications.external && 'Notification' in window) {
          if (Notification.permission === 'granted') {
              new Notification(title, { body: message });
          } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                  if (permission === 'granted') {
                      new Notification(title, { body: message });
                  }
              });
          }
      }
  };

  const openApp = (appId: string, data?: any) => {
    setStartOpen(false);
    const existing = windows.find(w => w.appId === appId && !data);
    if (existing) {
        focusWindow(existing.id);
        if (existing.isMinimized) toggleMinimize(existing.id);
        return;
    }

    const app = SYSTEM_REGISTRY[appId] || (user?.customApps[appId] ? { name: user.customApps[appId].name } : null);
    if (!app && appId !== 'upload_files') return;

    if (appId === 'upload_files') {
        document.getElementById('hidden-file-input')?.click();
        return;
    }

    const newWin: WindowState = {
      id: Math.random().toString(36).substring(7),
      appId,
      title: app?.name || 'App',
      isMinimized: false,
      isMaximized: false,
      zIndex: Math.max(0, ...windows.map(w => w.zIndex)) + 1,
      position: { x: 50 + (windows.length * 30), y: 50 + (windows.length * 30) },
      size: { w: 800, h: 550 },
      data
    };
    setWindows([...windows, newWin]);
    setActiveWinId(newWin.id);
  };

  const closeWindow = (id: string) => {
    setWindows(windows.filter(w => w.id !== id));
    if (activeWinId === id) setActiveWinId(null);
  };

  const focusWindow = (id: string) => {
    setActiveWinId(id);
    setWindows(windows.map(w => w.id === id ? { ...w, zIndex: Math.max(0, ...windows.map(win => win.zIndex)) + 1 } : w));
  };

  const toggleMinimize = (id: string) => {
    setWindows(windows.map(w => w.id === id ? { ...w, isMinimized: !w.isMinimized } : w));
    if (activeWinId === id) setActiveWinId(null);
    else setActiveWinId(id);
  };

  const toggleMaximize = (id: string) => {
    setWindows(windows.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  };

  const moveWindow = (id: string, x: number, y: number) => {
    setWindows(windows.map(w => w.id === id ? { ...w, position: { x, y } } : w));
  };

  const resizeWindow = (id: string, w: number, h: number) => {
    setWindows(windows.map(win => win.id === id ? { ...win, size: { w, h } } : win));
  };

  const launchFile = (path: string) => {
      const ext = path.split('.').pop()?.toLowerCase() || '';
      const defaultApp = user?.settings.defaultApps[ext] || FILE_ASSOCIATIONS[ext]?.[0];
      
      if (defaultApp) {
          openApp(defaultApp, { file: path });
      } else {
          setOpenWithRequest({ file: path, apps: (FILE_ASSOCIATIONS[ext] || DEFAULT_APPS).map(id => ({ id, ...SYSTEM_REGISTRY[id] })) });
      }
  };

  const openFilePicker = (callback: (path: string) => void) => {
      const id = Math.random().toString(36).substring(7);
      const pickerWin: WindowState = {
          id,
          appId: 'explorer',
          title: 'Select File',
          isMinimized: false,
          isMaximized: false,
          zIndex: Math.max(0, ...windows.map(w => w.zIndex)) + 1,
          position: { x: 100, y: 100 },
          size: { w: 600, h: 400 },
          data: { mode: 'picker', onPickCallback: callback }
      };
      setWindows([...windows, pickerWin]);
      setActiveWinId(id);
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
          sendNotification('explorer', 'File Uploaded', `Uploaded ${safeName} successfully.`);
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
             return { id, name: id, icon: Package, color: 'bg-gray-500' };
         }) : [])
  ];

  const sortedApps = availableApps.sort((a, b) => a.name.localeCompare(b.name));

  // Boot Screen
  if (booting) {
      return (
          <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white font-sans">
              <div className="relative mb-8">
                  <img src="/logo.png" alt="WeberOS" className="w-24 h-24 animate-pulse" />
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
              </div>
              <h1 className="text-2xl font-bold tracking-widest mb-2">WeberOS</h1>
              <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${bootProgress}%` }}></div>
              </div>
              <p className="text-xs text-slate-500 font-mono uppercase tracking-tighter">{bootStatus}</p>
          </div>
      );
  }

  // New Login Screen
  if (!user) {
      return (
          <div className="h-screen w-screen bg-slate-950 flex items-center justify-center font-sans overflow-hidden relative">
              {/* Animated Background Blobs */}
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

              <div className="z-10 w-full max-w-md p-8">
                  {!selectedProfile && !createMode ? (
                      <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                          <div className="text-center space-y-2">
                              <h1 className="text-4xl font-black text-white tracking-tight">Welcome</h1>
                              <p className="text-slate-400">Select a profile to continue to WeberOS</p>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                              {usersList.map(u => (
                                  <button 
                                      key={u.username}
                                      onClick={() => setSelectedProfile(u)}
                                      className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition group"
                                  >
                                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition">
                                          {u.username.substring(0,2).toUpperCase()}
                                      </div>
                                      <div className="flex-1 text-left">
                                          <div className="text-white font-bold">{u.username}</div>
                                          <div className="text-xs text-slate-500">Click to sign in</div>
                                      </div>
                                      <ChevronRight className="text-slate-600 group-hover:text-white transition" size={20} />
                                  </button>
                              ))}
                          </div>

                          <button 
                              onClick={() => setCreateMode(true)}
                              className="w-full flex items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition shadow-xl shadow-blue-900/20"
                          >
                              <Plus size={20} /> Create New Profile
                          </button>
                      </div>
                  ) : selectedProfile ? (
                      <div className="space-y-6 animate-in slide-in-from-right duration-300">
                          <button onClick={() => setSelectedProfile(null)} className="text-slate-400 hover:text-white flex items-center gap-2 transition">
                              <ArrowLeft size={18} /> Back
                          </button>
                          <div className="text-center">
                              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-2xl mx-auto mb-4 rotate-3">
                                  {selectedProfile.username.substring(0,2).toUpperCase()}
                              </div>
                              <h2 className="text-2xl font-bold text-white">{selectedProfile.username}</h2>
                          </div>
                          <div className="space-y-4">
                              <div className="relative">
                                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                  <input 
                                      type="password" 
                                      placeholder="Enter Password"
                                      autoFocus
                                      value={passwordInput}
                                      onChange={e => setPasswordInput(e.target.value)}
                                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white focus:border-blue-500 outline-none transition"
                                  />
                              </div>
                              <button 
                                  onClick={handleLogin}
                                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition shadow-xl shadow-blue-900/20"
                              >
                                  Sign In
                              </button>
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-6 animate-in slide-in-from-right duration-300">
                          <button onClick={() => setCreateMode(false)} className="text-slate-400 hover:text-white flex items-center gap-2 transition">
                              <ArrowLeft size={18} /> Back
                          </button>
                          <div className="text-center">
                              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-4">
                                  <User size={32} />
                              </div>
                              <h2 className="text-2xl font-bold text-white">New Profile</h2>
                          </div>
                          <div className="space-y-4">
                              <div className="relative">
                                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                  <input 
                                      placeholder="Username"
                                      value={usernameInput}
                                      onChange={e => setUsernameInput(e.target.value)}
                                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white focus:border-blue-500 outline-none transition"
                                  />
                              </div>
                              <div className="relative">
                                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                  <input 
                                      type="password"
                                      placeholder="Password (optional)"
                                      value={passwordInput}
                                      onChange={e => setPasswordInput(e.target.value)}
                                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white focus:border-blue-500 outline-none transition"
                                  />
                              </div>
                              <button 
                                  onClick={handleCreateProfile}
                                  disabled={!usernameInput}
                                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition shadow-xl shadow-blue-900/20"
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
        onClick={() => { setShowVolumePopup(false); setShowNotifPanel(false); setStartOpen(false); }}
    >
        <input type="file" id="hidden-file-input" onChange={handleFileUpload} className="hidden" />

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
        <div className="p-4 grid grid-flow-col grid-rows-[repeat(auto-fill,96px)] gap-4 h-[calc(100%-80px)] w-fit">
            {availableApps.filter(app => !['settings', 'helper', 'wepic', 'weplayer'].includes(app.id)).map((app) => (
                <div 
                    key={app.id} 
                    onDoubleClick={() => openApp(app.id)}
                    className="group flex flex-col items-center gap-1 w-20 text-white p-2 rounded transition hover:bg-white/10 active:scale-95 cursor-pointer"
                >
                    <div className={`w-12 h-12 ${app.color} rounded-2xl shadow-lg flex items-center justify-center group-hover:scale-105 transition`}>
                        <app.icon size={24} />
                    </div>
                    <span className="text-[10px] font-medium drop-shadow-md bg-black/40 px-2 py-0.5 rounded-full truncate w-full text-center">{app.name}</span>
                </div>
            ))}
        </div>

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
            else if (win.appId === 'wirebox') AppContent = <WireBoxApp user={user} setUser={setUser} openApp={openApp} />;
            
            else if (user.customApps[win.appId]) {
                AppContent = <DynamicAppRuntime app={user.customApps[win.appId]} onNotify={sendNotification} />;
            }
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
                    icon={icon}
                >
                    {AppContent}
                </WindowFrame>
            );
        })}

        {/* Start Menu */}
        {startOpen && (
            <div 
                className="fixed bottom-20 left-4 w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[200] animate-in slide-in-from-bottom-4 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 bg-white/5 border-b border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                        {user.username.substring(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-white text-sm">{user.username}</div>
                        <div className="text-[10px] text-blue-400 flex items-center gap-1"><Shield size={10}/> Standard User</div>
                    </div>
                    <button onClick={handleLogout} className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition"><LogOut size={16}/></button>
                </div>
                <div className="p-3 grid grid-cols-1 gap-1 max-h-80 overflow-y-auto custom-scrollbar">
                    {sortedApps.map(app => (
                        <button key={app.id} onClick={() => openApp(app.id)} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-xl text-left text-slate-200 transition group">
                            <div className={`p-2 rounded-xl ${app.color} shadow-lg group-hover:scale-110 transition`}>
                                <app.icon size={16} className="text-white"/>
                            </div>
                            <span className="text-sm font-medium">{app.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {showVolumePopup && <VolumePopup volume={volume} setVolume={setVolume} />}

        {showNotifPanel && (
            <div 
                className="fixed bottom-20 right-4 w-80 max-h-96 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col z-[210] shadow-2xl animate-in slide-in-from-right-4 duration-200" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-white/10 flex justify-between items-center text-white">
                    <span className="font-bold">Notifications</span>
                    {notifications.length > 0 && <button onClick={() => setNotifications([])} className="text-xs text-blue-400 hover:text-blue-300">Clear All</button>}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="text-center text-slate-500 py-12 text-sm">No new notifications</div>
                    ) : (
                        notifications.map(notif => (
                            <div key={notif.id} className="bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{notif.app}</span>
                                    <span className="text-[10px] text-slate-500">{new Date(notif.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="font-bold text-sm text-slate-200">{notif.title}</div>
                                <div className="text-xs text-slate-400">{notif.message}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* Taskbar */}
        <div className="fixed bottom-4 left-4 right-4 h-14 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center px-4 justify-between z-[150] shadow-2xl">
            <div className="flex items-center gap-2">
                <button 
                    onClick={(e) => { e.stopPropagation(); setStartOpen(!startOpen); setShowVolumePopup(false); setShowNotifPanel(false); }}
                    className={`p-2 rounded-xl transition ${startOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                >
                    <LayoutGrid size={20} />
                </button>
                
                <div className="h-6 w-px bg-white/10 mx-1"></div>

                <div className="flex items-center gap-1 overflow-x-auto max-w-[50vw] custom-scrollbar no-scrollbar">
                    {windows.map(win => {
                        const app = availableApps.find(a => a.id === win.appId);
                        const AppIcon = app ? app.icon : Package;
                        return (
                            <button 
                                key={win.id}
                                onClick={() => toggleMinimize(win.id)}
                                className={`h-10 px-3 rounded-xl flex items-center gap-2 transition group min-w-[40px] ${activeWinId === win.id ? 'bg-white/15 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                            >
                                <div className={`p-1.5 rounded-lg ${app?.color || 'bg-slate-700'} shadow-sm group-hover:scale-110 transition`}>
                                    <AppIcon size={14} className="text-white" />
                                </div>
                                <span className="text-xs font-medium hidden md:block max-w-[100px] truncate">{win.title}</span>
                                {activeWinId === win.id && <div className="w-1 h-1 bg-blue-500 rounded-full absolute bottom-1 left-1/2 -translate-x-1/2"></div>}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowNotifPanel(!showNotifPanel); setStartOpen(false); setShowVolumePopup(false); }}
                    className={`p-2 rounded-xl transition relative ${showNotifPanel ? 'text-blue-400 bg-white/10' : 'text-slate-400 hover:bg-white/10'}`}
                >
                    <Bell size={18} />
                    {notifications.length > 0 && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></div>}
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowVolumePopup(!showVolumePopup); setStartOpen(false); setShowNotifPanel(false); }}
                    className={`p-2 rounded-xl transition ${showVolumePopup ? 'text-blue-400 bg-white/10' : 'text-slate-400 hover:bg-white/10'}`}
                >
                    <Volume2 size={18} />
                </button>
                <div className="flex flex-col items-end px-2 border-l border-white/10">
                    <span className="text-xs font-bold text-white leading-none">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{time.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
            </div>
        </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<WeberOS />);
