import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    Shield,
    FileText,
    RefreshCw,
    Settings,
    Maximize,
    Link as LinkIcon,
    Activity
} from 'lucide-react';

import { UserProfile, WindowState, FileSystemNode, SystemNotification } from './types';
import { DEFAULT_FS, WALLPAPERS, DEFAULT_APPS, REPO_PACKAGES, FILE_ASSOCIATIONS } from './utils/constants';
import { WindowFrame } from './components/WindowFrame';
import { VolumePopup } from './components/VolumePopup';
import { OpenWithDialog } from './components/OpenWithDialog';
import { DialogHost, osAlert } from './components/DialogHost';
import { DesktopIcon } from './components/DesktopIcon';
import { playClick, playLogin, playLogout, playNotification } from './utils/sounds';

import { TerminalApp } from './apps/TerminalApp';
import { ExplorerApp } from './apps/ExplorerApp';
import { CoderApp } from './apps/CoderApp';
import { SettingsApp } from './apps/SettingsApp';
import { MarketApp } from './apps/MarketApp';
import { HelperApp } from './apps/HelperApp';
import { WePicApp } from './apps/WePicApp';
import { WePlayerApp } from './apps/WePlayerApp';
import { WireBoxApp } from './apps/WireBoxApp';
import { CalcoApp, WeatherApp, DynamicAppRuntime } from './apps/MiscApps';
import { GamesApp } from './apps/GamesApp';
import { InstallerApp } from './apps/InstallerApp';
import { NotifTesterApp } from './apps/NotifTesterApp';
import { TaskManagerApp } from './apps/TaskManagerApp';

// Registry
const SYSTEM_REGISTRY: Record<string, { name: string, icon: any, color: string }> = {
  'explorer': { name: 'Files', icon: Folder, color: 'bg-yellow-500' },
  'terminal': { name: 'Terminal', icon: TerminalIcon, color: 'bg-gray-900' },
  'wirebox': { name: 'WireBox', icon: Globe, color: 'bg-blue-400' },
  'coder': { name: 'Coder', icon: Code, color: 'bg-blue-600' },
  'games': { name: 'Games', icon: Gamepad2, color: 'bg-green-600' },
  'calco': { name: 'Calco', icon: Calculator, color: 'bg-orange-500' },
  'weather': { name: 'Weather', icon: CloudSun, color: 'bg-sky-500' },
  'settings': { name: 'Settings', icon: User, color: 'bg-slate-600' },
  'market': { name: 'Market', icon: Download, color: 'bg-blue-600' },
  'helper': { name: 'Helper', icon: HelpCircle, color: 'bg-purple-500' },
  'wepic': { name: 'WePic', icon: ImageIcon, color: 'bg-pink-500' },
  'weplayer': { name: 'WePlayer', icon: Film, color: 'bg-rose-600' },
  'installer': { name: 'Program Installer', icon: Package, color: 'bg-indigo-500' },
  'notiftester': { name: 'Notif Tester', icon: Bell, color: 'bg-amber-500' },
  'taskmanager': { name: 'Task Manager', icon: Activity, color: 'bg-emerald-500' },
};

const PRO_TIPS = [
    "Use the Coder app to create your own .wbr applications.",
    "WeGroq in the Coder app can help you write code using AI.",
    "You can drag and drop files into the Explorer to upload them.",
    "Use Settings to change your wallpaper and customize your experience.",
    "The Market app has new games and tools to download.",
    "You can arrange desktop icons by dragging them around.",
    "Use the Terminal to navigate the file system using commands.",
    "WeberOS supports multi-line code in .wbr files.",
    "Check the Helper app if you get stuck or need guidance.",
    "You can create multiple user profiles for different workspaces.",
    "Apps can request permissions like camera, microphone, and geolocation.",
    "Use WePic to view and manage your images.",
    "WePlayer supports playing audio and video files.",
    "WireBox is your gateway to the web inside WeberOS.",
    "You can uninstall apps from the Settings menu.",
    "Notifications keep you updated on system events.",
    "The FileSystem API allows apps to read and write files.",
    "You can set default apps for specific file extensions in Settings.",
    "Use the 'Weber Coder' tab in Coder to start building apps quickly.",
    "WeberOS 2 brings a fresh new UI and improved performance."
];

const WeberOS = () => {
  const [booting, setBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootStatus, setBootStatus] = useState('Initializing WeberOS 2...');

  const [proTip] = useState(() => PRO_TIPS[Math.floor(Math.random() * PRO_TIPS.length)]);

  const [user, setUserState] = useState<UserProfile | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [createMode, setCreateMode] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [setupWallpaper, setSetupWallpaper] = useState(WALLPAPERS[0]);
  
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWinId, setActiveWinId] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [startSearchQuery, setStartSearchQuery] = useState('');
  const [time, setTime] = useState(new Date());

  const [volume, setVolume] = useState(70);
  const [showVolumePopup, setShowVolumePopup] = useState(false);

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [activePopups, setActivePopups] = useState<SystemNotification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const [openWithRequest, setOpenWithRequest] = useState<{file: string, apps: any[]} | null>(null);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);
  const [showShortcutPrompt, setShowShortcutPrompt] = useState(false);
  const [shortcutPath, setShortcutPath] = useState('');
  const [shortcutName, setShortcutName] = useState('');
  const [shortcutType, setShortcutType] = useState<'file'|'dir'>('file');

  const touchTimer = useRef<any>(null);

  // Boot Animation Logic
  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);

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
    
    return () => {
        clearInterval(interval);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
      const handleGlobalClick = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
              playClick();
          }
      };
      document.addEventListener('click', handleGlobalClick);
      return () => document.removeEventListener('click', handleGlobalClick);
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

  const handleDesktopIconMove = (id: string, x: number, y: number) => {
      if (user) {
          const rowHeight = 112;
          const colWidth = 96;
          const snappedX = Math.max(16, Math.round((x - 16) / colWidth) * colWidth + 16);
          const snappedY = Math.max(16, Math.round((y - 16) / rowHeight) * rowHeight + 16);

          setUser({
              ...user,
              settings: {
                  ...user.settings,
                  desktopIcons: {
                      ...user.settings.desktopIcons,
                      [id]: { x: snappedX, y: snappedY }
                  }
              }
          });
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
        playLogin();
        const safeUser: UserProfile = {
            username: storedUser.username,
            installedPackages: storedUser.installedPackages || [],
            customApps: storedUser.customApps || {},
            fs: storedUser.fs || DEFAULT_FS,
            settings: { 
                wallpaper: storedUser.settings?.wallpaper || WALLPAPERS[0], 
                desktopIcons: storedUser.settings?.desktopIcons || {},
                weather: storedUser.settings?.weather || { mode: 'auto' },
                notifications: storedUser.settings?.notifications || { enabled: true, sound: true },
                defaultApps: storedUser.settings?.defaultApps || {}
            }
        };
        setUser(safeUser);
        setSelectedProfile(null);
        setPasswordInput('');
    } else {
        osAlert('Invalid password');
    }
  };

  const handleCreateProfile = () => {
      const db = JSON.parse(localStorage.getItem('weberos_users') || '{}');
      
      const newUser: UserProfile & {password: string} = { 
          username: usernameInput, 
          password: passwordInput, 
          installedPackages: [], 
          customApps: {}, 
          fs: DEFAULT_FS,
          settings: { 
              wallpaper: setupWallpaper, 
              desktopIcons: {},
              weather: { mode: 'auto' },
              notifications: { enabled: true, sound: true },
              defaultApps: {}
          }
      };
      
      db[usernameInput] = newUser;
      localStorage.setItem('weberos_users', JSON.stringify(db));
      
      setUsersList(Object.values(db));
      setCreateMode(false);
      setCreateStep(1);
      setUsernameInput('');
      setPasswordInput('');
  };

  const handleNextStep = () => {
      if (createStep === 1) {
          if (!usernameInput) return;
          const db = JSON.parse(localStorage.getItem('weberos_users') || '{}');
          if (db[usernameInput]) {
              osAlert('User already exists');
              return;
          }
          setCreateStep(2);
      } else if (createStep === 2) {
          setCreateStep(3);
      } else if (createStep === 3) {
          handleCreateProfile();
      }
  };

  const requestPermissions = async () => {
      try {
          await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(s => s.getTracks().forEach(t => t.stop())).catch(() => {});
          if ('geolocation' in navigator) navigator.geolocation.getCurrentPosition(() => {}, () => {});
      } catch (e) {
          console.error("Permission request error", e);
      }
      handleNextStep();
  };

  const [hasWelcomed, setHasWelcomed] = useState(false);
  const [hasCheckedUpgrades, setHasCheckedUpgrades] = useState(false);

  useEffect(() => {
    if (user && !hasWelcomed) {
        setHasWelcomed(true);
        setTimeout(() => {
            sendNotification('system', 'Welcome', `Welcome back, ${user.username}!`);
        }, 1000);
    } else if (!user) {
        setHasWelcomed(false);
    }
  }, [user, hasWelcomed]);

  useEffect(() => {
    if (user && !hasCheckedUpgrades) {
        setHasCheckedUpgrades(true);
        const checkUpgrades = async () => {
            try {
                const categoryModules = import.meta.glob('/market/*.json', { eager: true });
                let allMarketApps: any[] = [];
                for (const [path, module] of Object.entries(categoryModules)) {
                    const apps = (module as any).default || module;
                    if (Array.isArray(apps)) {
                        allMarketApps = [...allMarketApps, ...apps];
                    }
                }
                
                let upgradesFound = 0;
                const wbrModules = import.meta.glob('/market/apps/*.wbr', { query: '?raw', import: 'default' });
                
                for (const installedId of user.installedPackages) {
                    const customApp = user.customApps[installedId];
                    if (!customApp) continue;

                    let latestVersion = null;
                    const marketApp = allMarketApps.find(a => a.id === installedId);
                    if (marketApp && marketApp.version) {
                        latestVersion = marketApp.version;
                    }

                    const locationToCheck = customApp.location || (marketApp && marketApp.location);

                    if (locationToCheck) {
                        try {
                            const wbrPath = locationToCheck.startsWith('/') ? locationToCheck : `/${locationToCheck}`;
                            
                            if (wbrModules[wbrPath]) {
                                const rawData = await wbrModules[wbrPath]();
                                const wbrData = JSON.parse(rawData as string);
                                if (wbrData.version) latestVersion = wbrData.version;
                            } else {
                                const res = await fetch(wbrPath);
                                if (res.ok) {
                                    const wbrData = await res.json();
                                    if (wbrData.version) latestVersion = wbrData.version;
                                }
                            }
                        } catch (e) {
                            console.error(`Failed to check upgrade for ${installedId}`, e);
                        }
                    }

                    if (latestVersion && customApp.version && latestVersion !== customApp.version) {
                        upgradesFound++;
                    }
                }
                
                if (upgradesFound > 0) {
                    setTimeout(() => {
                        sendNotification('market', 'App Updates Available', `You have ${upgradesFound} app update(s) available in the Market.`);
                    }, 3000);
                }
            } catch (e) {
                console.error('Failed to check for upgrades', e);
            }
        };
        checkUpgrades();
    } else if (!user) {
        setHasCheckedUpgrades(false);
    }
  }, [user, hasCheckedUpgrades]);

  const handleLogout = () => {
      playLogout();
      setUserState(null);
      setWindows([]);
      setStartOpen(false);
      setSelectedProfile(null);
      setPasswordInput('');
      setNotifications([]);
  };

  const sendNotification = (appId: string, title: string, message: string) => {
      if (!user?.settings.notifications.enabled) return;
      if (user?.settings.notifications.sound !== false) playNotification();

      const newNotif: SystemNotification = {
          id: Date.now().toString() + Math.random().toString(36).substring(7),
          app: appId,
          title,
          message,
          timestamp: Date.now(),
          read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
      setActivePopups(prev => [...prev, newNotif]);
      setTimeout(() => {
          setActivePopups(prev => prev.filter(n => n.id !== newNotif.id));
      }, 3000);
  };

  const openApp = (appId: string, data?: any) => {
    setStartOpen(false);
    setStartSearchQuery('');
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

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, position: { x, y } } : w));
  }, []);

  const resizeWindow = useCallback((id: string, w: number, h: number) => {
    setWindows(prev => prev.map(win => win.id === id ? { ...win, size: { w, h } } : win));
  }, []);

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

  const getAllAppsForOpenWith = () => {
      const apps = [...availableApps];
      if (!apps.find(a => a.id === 'installer')) {
          apps.push({ id: 'installer', ...SYSTEM_REGISTRY['installer'] });
      }
      return apps.sort((a, b) => a.name.localeCompare(b.name));
  };

  const launchFile = (path: string) => {
      const ext = path.split('.').pop()?.toLowerCase() || '';
      const defaultApp = user?.settings.defaultApps[ext] || FILE_ASSOCIATIONS[ext]?.[0];
      
      if (defaultApp) {
          openApp(defaultApp, { file: path });
      } else {
          setOpenWithRequest({ file: path, apps: getAllAppsForOpenWith() });
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

  const openFileSaver = (callback: (path: string) => void) => {
      const id = Math.random().toString(36).substring(7);
      const saverWin: WindowState = {
          id,
          appId: 'explorer',
          title: 'Save File',
          isMinimized: false,
          isMaximized: false,
          zIndex: Math.max(0, ...windows.map(w => w.zIndex)) + 1,
          position: { x: 100, y: 100 },
          size: { w: 600, h: 400 },
          data: { mode: 'saver', onPickCallback: callback }
      };
      setWindows([...windows, saverWin]);
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

  // Boot Screen
  if (booting) {
      return (
          <div className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center text-white font-sans overflow-hidden relative">
              {/* Background ambient glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
              
              <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-1000">
                  <div className="relative mb-8 group">
                      <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full opacity-20 blur-xl transition-opacity duration-1000 animate-pulse"></div>
                      <img src="https://files.catbox.moe/la7h20.png" alt="WeberOS 2" className="w-32 h-32 relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                  </div>
                  
                  <h1 className="text-4xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-400 drop-shadow-sm">
                      WeberOS 2
                  </h1>
                  
                  <div className="w-80 h-[2px] bg-white/5 rounded-full overflow-hidden mb-6 relative">
                      <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(34,211,238,0.8)]" style={{ width: `${bootProgress}%` }}></div>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] animate-pulse">
                      {bootStatus}
                  </p>
              </div>
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
                              onClick={() => { setCreateMode(true); setCreateStep(1); }}
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
                          <button onClick={() => {
                              if (createStep > 1) setCreateStep(createStep - 1);
                              else setCreateMode(false);
                          }} className="text-slate-400 hover:text-white flex items-center gap-2 transition">
                              <ArrowLeft size={18} /> Back
                          </button>
                          
                          {createStep === 1 && (
                              <>
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
                                          onClick={handleNextStep}
                                          disabled={!usernameInput}
                                          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition shadow-xl shadow-blue-900/20"
                                      >
                                          Next
                                      </button>
                                  </div>
                              </>
                          )}

                          {createStep === 2 && (
                              <>
                                  <div className="text-center">
                                      <h2 className="text-2xl font-bold text-white mb-2">Choose Wallpaper</h2>
                                      <p className="text-slate-400">Select your starting background</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 custom-scrollbar">
                                      {WALLPAPERS.map((wp, i) => (
                                          <button 
                                              key={i}
                                              onClick={() => setSetupWallpaper(wp)}
                                              className={`relative aspect-video rounded-xl overflow-hidden border-2 transition ${setupWallpaper === wp ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-white/10 hover:border-white/30'}`}
                                          >
                                              <img src={wp} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                              {setupWallpaper === wp && (
                                                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                                      <Plus className="text-white" size={24} />
                                                  </div>
                                              )}
                                          </button>
                                      ))}
                                  </div>
                                  <button 
                                      onClick={handleNextStep}
                                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition shadow-xl shadow-blue-900/20 mt-6"
                                  >
                                      Next
                                  </button>
                              </>
                          )}

                          {createStep === 3 && (
                              <>
                                  <div className="text-center">
                                      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-4">
                                          <Shield size={32} />
                                      </div>
                                      <h2 className="text-2xl font-bold text-white mb-2">Permissions</h2>
                                      <p className="text-slate-400 text-sm">WeberOS works best with access to your camera, microphone, location, and notifications. You can grant these now or later.</p>
                                  </div>
                                  <div className="space-y-3">
                                      <button 
                                          onClick={requestPermissions}
                                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition shadow-xl shadow-emerald-900/20"
                                      >
                                          Grant Permissions
                                      </button>
                                      <button 
                                          onClick={handleNextStep}
                                          className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition"
                                      >
                                          Skip for now
                                      </button>
                                  </div>
                              </>
                          )}
                      </div>
                  )}
              </div>
              <div className="absolute bottom-20 md:bottom-12 left-0 right-0 text-center text-slate-500 text-sm animate-in fade-in duration-1000 delay-500 px-4">
                  <span className="font-bold text-slate-400">Pro Tip:</span> {proTip}
              </div>
          </div>
      );
  }

  const taskbarStyle = user?.settings?.taskbarStyle || 'default';
  const taskbarClasses = {
      default: 'bg-slate-900/80 border-white/10',
      dark: 'bg-black/95 border-white/5',
      glass: 'bg-white/10 border-white/20',
      transparent: 'bg-transparent border-transparent'
  }[taskbarStyle as 'default' | 'dark' | 'glass' | 'transparent'] || 'bg-slate-900/80 border-white/10';

  const handleDesktopContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
  };
  const handleDesktopTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
          touchTimer.current = setTimeout(() => {
              setContextMenu({ x: e.touches[0].clientX, y: e.touches[0].clientY });
          }, 500);
      }
  };
  const handleDesktopTouchEnd = () => {
      if (touchTimer.current) clearTimeout(touchTimer.current);
  };

  const addShortcut = () => {
      if (!shortcutName || !shortcutPath) return;
      const newShortcut = {
          id: 'shortcut_' + Date.now(),
          name: shortcutName,
          path: shortcutPath,
          type: shortcutType
      };
      setUser({
          ...user!,
          settings: {
              ...user!.settings,
              shortcuts: [...(user!.settings.shortcuts || []), newShortcut]
          }
      });
      setShowShortcutPrompt(false);
      setShortcutName('');
      setShortcutPath('');
  };

    return (
    <div className={`h-screen w-screen overflow-hidden relative font-sans select-none`}
        style={{
            backgroundImage: `url("${user.settings.wallpaper}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'background-image 0.5s ease-in-out'
        }}
        onClick={() => { setShowVolumePopup(false); setShowNotifPanel(false); setStartOpen(false); setStartSearchQuery(''); setContextMenu(null); }}
    >
        <input type="file" id="hidden-file-input" onChange={handleFileUpload} className="hidden" />

        {contextMenu && (
            <div 
                className="fixed bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 z-[300] min-w-[160px]"
                style={{ left: contextMenu.x, top: contextMenu.y }}
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/10 transition flex items-center gap-2"
                    onClick={() => {
                        // Refresh desktop display (just re-render by updating state slightly or doing nothing since React handles it)
                        setContextMenu(null);
                        setWindowSize({ w: window.innerWidth, h: window.innerHeight });
                    }}
                >
                    <RefreshCw size={14} /> Refresh
                </button>
                <button 
                    className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/10 transition flex items-center gap-2"
                    onClick={() => {
                        setContextMenu(null);
                        openApp('settings');
                    }}
                >
                    <Settings size={14} /> Settings
                </button>
                <button 
                    className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/10 transition flex items-center gap-2"
                    onClick={() => {
                        setContextMenu(null);
                        openApp('taskmanager');
                    }}
                >
                    <Activity size={14} /> Task Manager
                </button>
                <button 
                    className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/10 transition flex items-center gap-2"
                    onClick={() => {
                        setContextMenu(null);
                        if (!document.fullscreenElement) {
                            document.documentElement.requestFullscreen().catch(() => {});
                        } else {
                            document.exitFullscreen().catch(() => {});
                        }
                    }}
                >
                    <Maximize size={14} /> Fullscreen
                </button>
                <div className="h-px bg-white/10 my-1"></div>
                <button 
                    className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/10 transition flex items-center gap-2"
                    onClick={() => {
                        setContextMenu(null);
                        setShowShortcutPrompt(true);
                    }}
                >
                    <LinkIcon size={14} /> Add Shortcut
                </button>
            </div>
        )}

        {showShortcutPrompt && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[400] flex items-center justify-center" onClick={() => setShowShortcutPrompt(false)}>
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold text-white mb-4">Add Shortcut</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Name</label>
                            <input 
                                type="text" 
                                value={shortcutName} 
                                onChange={e => setShortcutName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white outline-none focus:border-blue-500"
                                placeholder="e.g. My Document"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Path</label>
                            <input 
                                type="text" 
                                value={shortcutPath} 
                                onChange={e => setShortcutPath(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white outline-none focus:border-blue-500"
                                placeholder="e.g. /home/user/doc.txt"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Type</label>
                            <select 
                                value={shortcutType} 
                                onChange={e => setShortcutType(e.target.value as 'file'|'dir')}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white outline-none focus:border-blue-500"
                            >
                                <option value="file">File</option>
                                <option value="dir">Folder</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowShortcutPrompt(false)} className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/5 transition">Cancel</button>
                            <button onClick={addShortcut} disabled={!shortcutName || !shortcutPath} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50">Add</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

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
        <div className="absolute inset-0 pointer-events-none overflow-hidden h-[calc(100%-80px)]">
            <div 
                className="relative w-full h-full pointer-events-auto"
                onContextMenu={handleDesktopContextMenu}
                onTouchStart={handleDesktopTouchStart}
                onTouchEnd={handleDesktopTouchEnd}
                onTouchMove={handleDesktopTouchEnd}
            >
                {(() => {
                    const rowHeight = 112; // 96 + 16
                    const colWidth = 96; // 80 + 16
                    const maxRows = Math.max(1, Math.floor((windowSize.h - 80 - 32) / rowHeight));
                    
                    const appsToRender = availableApps.filter(app => !['settings', 'helper', 'wepic', 'weplayer', 'installer'].includes(app.id));
                    
                    const shortcutsToRender = user?.settings.shortcuts || [];

                    const occupied = new Set<string>();
                    
                    // First pass: mark occupied slots from saved positions
                    // We also need to handle collisions if multiple apps have the same saved position
                    const savedPositions = new Map<string, {x: number, y: number}>();
                    
                    appsToRender.forEach(app => {
                        const saved = user?.settings.desktopIcons?.[app.id];
                        if (saved) {
                            const col = Math.round((saved.x - 16) / colWidth);
                            const row = Math.round((saved.y - 16) / rowHeight);
                            const key = `${col},${row}`;
                            if (!occupied.has(key)) {
                                occupied.add(key);
                                savedPositions.set(app.id, {
                                    x: 16 + col * colWidth,
                                    y: 16 + row * rowHeight
                                });
                            }
                        }
                    });

                    shortcutsToRender.forEach(sc => {
                        const saved = user?.settings.desktopIcons?.[sc.id];
                        if (saved) {
                            const col = Math.round((saved.x - 16) / colWidth);
                            const row = Math.round((saved.y - 16) / rowHeight);
                            const key = `${col},${row}`;
                            if (!occupied.has(key)) {
                                occupied.add(key);
                                savedPositions.set(sc.id, {
                                    x: 16 + col * colWidth,
                                    y: 16 + row * rowHeight
                                });
                            }
                        }
                    });

                    let nextCol = 0;
                    let nextRow = 0;

                    const getNextSlot = () => {
                        while (occupied.has(`${nextCol},${nextRow}`)) {
                            nextRow++;
                            if (nextRow >= maxRows) {
                                nextRow = 0;
                                nextCol++;
                            }
                        }
                        const x = 16 + nextCol * colWidth;
                        const y = 16 + nextRow * rowHeight;
                        occupied.add(`${nextCol},${nextRow}`);
                        return { x, y };
                    };

                    const renderedApps = appsToRender.map((app) => {
                        let x, y;
                        const saved = savedPositions.get(app.id);
                        if (saved) {
                            x = saved.x;
                            y = saved.y;
                        } else {
                            const slot = getNextSlot();
                            x = slot.x;
                            y = slot.y;
                        }

                        return (
                            <DesktopIcon
                                key={app.id}
                                id={app.id}
                                name={app.name}
                                icon={app.icon}
                                color={app.color}
                                initialX={x}
                                initialY={y}
                                savedPosition={saved ? { x, y } : undefined}
                                onDoubleClick={() => openApp(app.id)}
                                onMove={handleDesktopIconMove}
                            />
                        );
                    });

                    const renderedShortcuts = shortcutsToRender.map((sc) => {
                        let x, y;
                        const saved = savedPositions.get(sc.id);
                        if (saved) {
                            x = saved.x;
                            y = saved.y;
                        } else {
                            const slot = getNextSlot();
                            x = slot.x;
                            y = slot.y;
                        }

                        return (
                            <DesktopIcon
                                key={sc.id}
                                id={sc.id}
                                name={sc.name}
                                icon={sc.type === 'dir' ? Folder : FileText}
                                color={sc.type === 'dir' ? 'bg-yellow-500' : 'bg-slate-500'}
                                initialX={x}
                                initialY={y}
                                savedPosition={saved ? { x, y } : undefined}
                                onDoubleClick={() => {
                                    if (sc.type === 'dir') {
                                        openApp('explorer', { path: sc.path });
                                    } else {
                                        launchFile(sc.path);
                                    }
                                }}
                                onMove={handleDesktopIconMove}
                                onDelete={() => {
                                    if (user) {
                                        setUser({
                                            ...user,
                                            settings: {
                                                ...user.settings,
                                                shortcuts: user.settings.shortcuts?.filter(s => s.id !== sc.id)
                                            }
                                        });
                                    }
                                }}
                            />
                        );
                    });

                    return [...renderedApps, ...renderedShortcuts];
                })()}
            </div>
        </div>

        {/* Windows */}
        {windows.map(win => {
            let AppContent;
            if (win.appId === 'terminal') AppContent = <TerminalApp fs={fs} setFs={setFs} user={user} setUser={setUser} onNotify={sendNotification} closeWindow={() => closeWindow(win.id)} openApp={openApp} appIds={availableApps.map(a => a.id)} />;
            else if (win.appId === 'coder') AppContent = <CoderApp fs={fs} setFs={setFs} launchData={win.data} />;
            else if (win.appId === 'explorer') AppContent = <ExplorerApp 
                fs={fs} 
                setFs={setFs} 
                user={user} 
                setUser={setUser}
                mode={win.data?.mode} 
                onPick={(path: string) => { 
                    if(win.data?.onPickCallback) win.data.onPickCallback(path); 
                    closeWindow(win.id);
                }} 
                onOpen={launchFile}
                onOpenWith={(path: string) => {
                    setOpenWithRequest({ file: path, apps: getAllAppsForOpenWith() });
                }}
            />;
            else if (win.appId === 'games') AppContent = <GamesApp />;
            else if (win.appId === 'calco') AppContent = <CalcoApp user={user} />;
            else if (win.appId === 'weather') AppContent = <WeatherApp user={user} setUser={setUser} />;
            else if (win.appId === 'settings') AppContent = <SettingsApp user={user} setUser={setUser} onDeleteUser={deleteUser} />;
            else if (win.appId === 'market') AppContent = <MarketApp user={user} setUser={setUser} onNotify={sendNotification} />;
            else if (win.appId === 'taskmanager') AppContent = <TaskManagerApp windows={windows} closeWindow={closeWindow} />;
            else if (win.appId === 'helper') AppContent = <HelperApp />;
            else if (win.appId === 'wepic') AppContent = <WePicApp fs={fs} launchData={win.data} openFilePicker={openFilePicker} />;
            else if (win.appId === 'weplayer') AppContent = <WePlayerApp fs={fs} launchData={win.data} openFilePicker={openFilePicker} volume={volume} />;
            else if (win.appId === 'wirebox') AppContent = <WireBoxApp user={user} setUser={setUser} openApp={openApp} />;
            else if (win.appId === 'installer') AppContent = <InstallerApp fs={fs} launchData={win.data} user={user} setUser={setUser} onNotify={sendNotification} closeWindow={() => closeWindow(win.id)} />;
            else if (win.appId === 'notiftester') AppContent = <NotifTesterApp onNotify={sendNotification} />;
            
            else if (user.customApps[win.appId]) {
                AppContent = <DynamicAppRuntime 
                    app={user.customApps[win.appId]} 
                    user={user} 
                    onNotify={sendNotification} 
                    fs={fs}
                    setFs={setFs}
                    openFilePicker={openFilePicker}
                    openFileSaver={openFileSaver}
                />;
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
                className={`fixed bottom-20 left-4 w-80 backdrop-blur-2xl border rounded-2xl shadow-2xl overflow-hidden z-[200] animate-in slide-in-from-bottom-4 duration-200 transition-colors bg-slate-900/95 border-white/10`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`p-4 border-b flex items-center gap-3 transition-colors bg-white/5 border-white/10`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-colors bg-blue-600`}>
                        {user.username.substring(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <div className={`font-bold text-sm transition-colors text-white`}>{user.username}</div>
                        <div className={`text-[10px] flex items-center gap-1 transition-colors text-blue-400`}><Shield size={10}/> Standard User</div>
                    </div>
                    <button onClick={handleLogout} className={`p-2 rounded-xl transition hover:bg-red-500/20 text-slate-400 hover:text-red-400`}><LogOut size={16}/></button>
                </div>
                
                <div className="p-3">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors bg-white/5 border-white/10 text-slate-400 focus-within:border-blue-500/50`}>
                        <Search size={14} />
                        <input 
                            type="text" 
                            placeholder="Search apps, files..." 
                            value={startSearchQuery}
                            onChange={(e) => setStartSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs w-full placeholder:text-slate-500"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="p-3 pt-0 grid grid-cols-1 gap-1 max-h-80 overflow-y-auto custom-scrollbar">
                    {sortedApps.filter(app => app.name.toLowerCase().includes(startSearchQuery.toLowerCase())).map(app => (
                        <button key={app.id} onClick={() => openApp(app.id)} className={`flex items-center gap-3 p-2 rounded-xl text-left transition group hover:bg-white/10 text-slate-200`}>
                            <div className={`p-2 rounded-xl shadow-lg group-hover:scale-110 transition ${app.color}`}>
                                <app.icon size={16} className="text-white"/>
                            </div>
                            <span className="text-sm font-medium">{app.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {showVolumePopup && <VolumePopup volume={volume} setVolume={setVolume} />}
        <DialogHost />

        {showNotifPanel && (
            <div 
                className={`fixed bottom-20 right-4 w-80 max-h-96 backdrop-blur-2xl border rounded-2xl flex flex-col z-[210] shadow-2xl animate-in slide-in-from-right-4 duration-200 transition-colors bg-slate-900/95 border-white/10`} 
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`p-4 border-b flex justify-between items-center transition-colors border-white/10 text-white`}>
                    <span className="font-bold">Notifications</span>
                    {notifications.length > 0 && <button onClick={() => setNotifications([])} className="text-xs text-blue-400 hover:text-blue-300">Clear All</button>}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="text-center text-slate-500 py-12 text-sm">No new notifications</div>
                    ) : (
                        notifications.map(notif => (
                            <div key={notif.id} className={`p-3 rounded-xl border transition bg-white/5 border-white/5 hover:bg-white/10`}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider text-blue-400`}>{notif.app}</span>
                                    <span className="text-[10px] text-slate-500">{new Date(notif.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className={`font-bold text-sm transition-colors text-slate-200`}>{notif.title}</div>
                                <div className={`text-xs transition-colors text-slate-400`}>{notif.message}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* Notification Popups */}
        <div className="fixed bottom-20 right-4 z-[200] flex flex-col gap-2 items-end pointer-events-none">
            {activePopups.map(popup => {
                const app = availableApps.find(a => a.id === popup.app);
                const AppIcon = app ? app.icon : Package;
                return (
                    <div key={popup.id} className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl w-80 pointer-events-auto animate-in slide-in-from-right-8 fade-in duration-300">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1.5 rounded-lg shadow-sm ${app?.color || 'bg-slate-700'}`}>
                                <AppIcon size={14} className="text-white" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{app?.name || popup.app}</span>
                        </div>
                        <div className="font-bold text-sm text-white mb-1">{popup.title}</div>
                        <div className="text-xs text-slate-400">{popup.message}</div>
                    </div>
                );
            })}
        </div>

        {/* Taskbar */}
        <div className={`fixed bottom-4 left-4 right-4 h-14 backdrop-blur-2xl border rounded-2xl flex items-center px-4 justify-between z-[150] shadow-2xl transition-colors ${taskbarClasses}`}>
            <div className="flex items-center gap-2">
                <button 
                    onClick={(e) => { e.stopPropagation(); setStartOpen(!startOpen); setShowVolumePopup(false); setShowNotifPanel(false); }}
                    className={`p-2 rounded-xl transition ${startOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                >
                    <LayoutGrid size={20} />
                </button>
                
                <div className={`h-6 w-px mx-1 bg-white/10`}></div>

                <div className="flex items-center gap-1 overflow-x-auto max-w-[50vw] custom-scrollbar no-scrollbar">
                    {windows.map(win => {
                        const app = availableApps.find(a => a.id === win.appId);
                        const AppIcon = app ? app.icon : Package;
                        return (
                            <button 
                                key={win.id}
                                onClick={() => toggleMinimize(win.id)}
                                className={`h-10 px-3 rounded-xl flex items-center gap-2 transition group min-w-[40px] relative ${activeWinId === win.id ? 'bg-white/15 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                            >
                                <div className={`p-1.5 rounded-lg shadow-sm group-hover:scale-110 transition ${app?.color || 'bg-slate-700'}`}>
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
                    {notifications.length > 0 && <div className={`absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900`}></div>}
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowVolumePopup(!showVolumePopup); setStartOpen(false); setShowNotifPanel(false); }}
                    className={`p-2 rounded-xl transition ${showVolumePopup ? 'text-blue-400 bg-white/10' : 'text-slate-400 hover:bg-white/10'}`}
                >
                    <Volume2 size={18} />
                </button>
                <div className={`flex flex-col items-end px-2 border-l border-white/10`}>
                    <span className={`text-xs font-bold leading-none text-white`}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className={`text-[10px] font-medium text-slate-500`}>{time.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
            </div>
        </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<WeberOS />);
